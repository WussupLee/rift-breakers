import * as Phaser from 'phaser';
import type {MultiplayerRoom} from './multiplayer';
import {applySnapshot,type NetSnapshot} from './network-protocol';
import {DODGE} from './dodge';
import {SpaceStation} from './environment';
import {FEEL,resolveFeel,scaledDelta,FIXED_STEP_MS} from './feel';
import {BoundaryOverlay} from './boundary-overlay';
import {frameFighters,easeCamera,anchorCamera,cameraHud,type CameraState} from './camera';
import {FIGHTERS,STAGE,fighter,asset,damageColor,ITEMS,type Settings,type MatchConfig,type Animation} from './data';
import {Simulation,type Actor,type CombatEvent} from './simulation';import {InputController} from './input';import {GameAudio} from './audio';
type Atlas={width:number;height:number;frames:number;bounds:{x:number;y:number;w:number;h:number}};
type Manifest=Record<string,Record<string,Atlas>>;
export interface GameBridge {network?:MultiplayerRoom;localIndex?:number;sim:Simulation|null;input:InputController|null;paused:boolean;debug:boolean;settings:Settings;onUpdate:(sim:Simulation)=>void;onReady:()=>void;onError:(message:string)=>void;onPause:()=>void;audio:GameAudio|null}
export function launchGame(parent:HTMLElement,config:MatchConfig,bridge:GameBridge){
 class ArenaScene extends Phaser.Scene {
  sim!:Simulation;acc=0;lastNetworkState:NetSnapshot|null=null;manifest!:Manifest;sprites:Phaser.GameObjects.Sprite[]=[];labels:Phaser.GameObjects.Text[]=[];gfx!:Phaser.GameObjects.Graphics;fx!:Phaser.GameObjects.Graphics;station!:SpaceStation;boundaries!:BoundaryOverlay;hudInset=142;debugText!:Phaser.GameObjects.Text;particles:{x:number;y:number;vx:number;vy:number;life:number;max:number;size:number;color:number}[]=[];rings:{x:number;y:number;life:number;max:number;color:number;size:number}[]=[];cameraState:CameraState={x:500,y:470,zoom:0};cameraWidth=0;cameraHeight=0;touchDevice=false;timeScale=1;frameAvg=16;lastEmit=-1;lastHeld:number|null=null;
  constructor(){super('Arena');}
  preload(){SpaceStation.preload(this);this.load.json('manifest',asset('manifest.json'));this.load.once('filecomplete-json-manifest',(_k:string,_t:string,data:Manifest)=>{this.manifest=data;for(const f of FIGHTERS)for(const [anim,meta] of Object.entries(data[f.id]))this.load.spritesheet(`${f.id}-${anim}`,asset(`fighters/${f.id}/${anim}.png`),{frameWidth:meta.width,frameHeight:meta.height});});this.load.on('loaderror',()=>bridge.onError('A game asset could not load. Check your connection and retry.'));}
  create(){this.touchDevice=window.matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;this.sim=new Simulation({...config,feel:bridge.network?config.feel:resolveFeel(bridge.settings.gameFeel,this.touchDevice)});bridge.sim=this.sim;bridge.input=new InputController(bridge.settings,()=>bridge.onPause(),()=>{bridge.debug=!bridge.debug;});bridge.audio??=new GameAudio(bridge.settings);bridge.audio.beginMatch();bridge.input.onGesture=()=>{void bridge.audio?.start();};this.station=new SpaceStation(this);this.boundaries=new BoundaryOverlay(this);this.gfx=this.add.graphics();this.fx=this.add.graphics().setDepth(20);this.debugText=this.add.text(10,10,'',{fontFamily:'monospace',fontSize:'13px',color:'#ffffff',backgroundColor:'#000c'}).setScrollFactor(0).setDepth(100);
   for(const a of this.sim.actors){const def=fighter(a.slot.fighter);this.sprites.push(this.add.sprite(a.x,a.y,`${def.id}-idle`).setDepth(5));this.labels.push(this.add.text(0,0,a.id===0?'▼ YOU':`CPU ${a.id}`,{fontFamily:'monospace',fontSize:'13px',fontStyle:'bold',color:def.color}).setOrigin(.5,1).setDepth(8));}
   bridge.onReady();bridge.onUpdate(this.sim);bridge.network?.ready();
   if(new URLSearchParams(location.search).has('debug')){(window as unknown as {rift:unknown}).rift={simulation:this.sim,bridge,scene:this};}
  }
  update(_time:number,delta:number){if(!this.sim)return;this.frameAvg=this.frameAvg*.95+delta*.05;if(bridge.input)bridge.input.settings=bridge.settings;if(bridge.audio)bridge.audio.settings=bridge.settings;
   const net=bridge.network,local=bridge.localIndex??0;
   const feel=net?(config.feel??'relaxed'):resolveFeel(bridge.settings.gameFeel,this.touchDevice);this.timeScale=FEEL[feel].speed;this.sim.config.feel=feel;this.tweens.timeScale=this.timeScale;
   if(net){
    net.state.config.slots.forEach((slot,i)=>{if(this.sim.actors[i])this.sim.actors[i].slot={...slot};});
    if(!net.isHost){
     net.sendInput(bridge.input?.sample()??{x:0,y:0,jump:false,light:false,heavy:false,dodge:false,item:false});
     bridge.audio?.setPaused(net.hostPaused||bridge.paused);const state=net.latest;if(state&&state!==this.lastNetworkState&&applySnapshot(this.sim,state)){this.lastNetworkState=state;for(const e of state.events)this.effect(e);bridge.onUpdate(this.sim);}
     bridge.audio?.update(this.sim,net.hostPaused||bridge.paused);this.renderWorld(Math.min(1,(performance.now()-net.receivedAt)/50),net.hostPaused?0:Math.min(delta/16.67,3)*this.timeScale);return;
    }
   }
   const frozen=bridge.paused||!!net&&net.state.phase==='loading';const events:CombatEvent[]=[];bridge.audio?.setPaused(frozen);
   if(!frozen&&!this.sim.ended){this.acc+=scaledDelta(delta,feel);let steps=0;while(this.acc>=FIXED_STEP_MS&&steps++<6){const input=bridge.input?.sample();this.sim.step(input,net?.inputs(input??{x:0,y:0,jump:false,light:false,heavy:false,dodge:false,item:false}));for(const e of this.sim.events){this.effect(e);events.push(e);}this.acc-=FIXED_STEP_MS;}if(this.sim.tick%6===0||events.some(e=>e.kind==='dodge'||e.kind==='evade')||this.sim.ended||this.lastHeld!==this.sim.actors[local].held){this.lastHeld=this.sim.actors[local].held;bridge.onUpdate(this.sim);}}else this.acc=0;
   bridge.audio?.update(this.sim,frozen);net?.publish(this.sim,events,frozen);
   this.renderWorld(Math.min(1,this.acc/FIXED_STEP_MS),frozen?0:Math.min(delta/16.67,3)*this.timeScale);
  }
  effect(e:CombatEvent){if(e.kind==='evade'){const def=fighter(this.sim.actors[e.actor].slot.fighter);const text=this.add.text(e.x,e.y-def.height-28,'EVADED',{fontFamily:'monospace',fontSize:'20px',fontStyle:'bold',color:'#ffffff',stroke:'#081320',strokeThickness:4}).setOrigin(.5,1).setDepth(25);this.tweens.add({targets:text,y:text.y-30,alpha:0,duration:650,onComplete:()=>text.destroy()});this.rings.push({x:e.x,y:e.y-def.height/2,life:18,max:18,color:0xffffff,size:80});return;}if(e.kind==='ko'){const view=this.cameras.main.worldView;e={...e,x:Phaser.Math.Clamp(e.x,view.left+60,view.right-60),y:Phaser.Math.Clamp(e.y,view.top+100,view.bottom-60)};const id=this.sim.actors[e.actor].slot.fighter;const ghost=this.add.sprite(e.x,e.y,`${id}-death`).setScale(1.3).setTintFill(0xffffff).setDepth(19);this.tweens.addCounter({from:0,to:this.manifest[id].death.frames-1,duration:400,onUpdate:t=>{ghost.setFrame(Math.floor(t.getValue()??0));ghost.setAlpha(1-t.progress);},onComplete:()=>ghost.destroy()});}const col=Phaser.Display.Color.HexStringToColor(e.kind==='hit'?damageColor(this.sim.actors[e.actor].damage):e.color).color;
   bridge.audio?.event(e,this.sim);
   const count=e.kind==='ko'?65:e.kind==='hit'?14:e.kind==='item'?22:7;const budget=this.frameAvg>23?80:220;
   for(let i=0;i<count&&this.particles.length<budget;i++){const angle=Math.random()*Math.PI*2,speed=(Math.random()+.2)*(e.kind==='ko'?13:e.kind==='hit'?5:2);this.particles.push({x:Phaser.Math.Clamp(e.x,-20,1020),y:Phaser.Math.Clamp(e.y,-50,850),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:30+Math.random()*20,max:50,size:e.kind==='ko'?6+Math.random()*12:2+Math.random()*5,color:i%3===0?0xffffff:col});}
   if(['ko','hit','dodge','jump','respawn','item'].includes(e.kind))this.rings.push({x:Phaser.Math.Clamp(e.x,-20,1020),y:Phaser.Math.Clamp(e.y,-50,850),life:20,max:20,color:col,size:e.kind==='ko'?190:e.kind==='respawn'?65:e.kind==='hit'?35:25});
   if(e.kind==='ko'){if(bridge.settings.shake)this.cameras.main.shake(220,.006);if(bridge.settings.flashes)this.cameras.main.flash(100,40,220,235,false);}
   else if(e.kind==='hit'&&e.power>13&&bridge.settings.shake)this.cameras.main.shake(85,.0025);
  }
  renderWorld(alpha:number,dt:number){const sim=this.sim,g=this.gfx,fx=this.fx;g.clear();fx.clear();
   const cam=this.cameras.main,width=this.scale.width,height=this.scale.height;
   const hudBounds=parent.parentElement?.querySelector('.match-hud')?.getBoundingClientRect();
   this.hudInset=hudBounds?Math.min(height*.58,Math.max(60,hudBounds.bottom-parent.getBoundingClientRect().top+12)):cameraHud(width,height);
   const target=frameFighters(sim.actors,width,height,this.hudInset);
   if(this.cameraWidth!==width||this.cameraHeight!==height){this.cameraState=target;this.cameraWidth=width;this.cameraHeight=height;}
   else if(!bridge.paused||bridge.network&&!bridge.network.hostPaused)this.cameraState=easeCamera(this.cameraState,target,dt*16.67);
   this.cameraState=anchorCamera(this.cameraState.zoom,width,height,this.hudInset);
   cam.setZoom(this.cameraState.zoom);cam.centerOn(this.cameraState.x,this.cameraState.y);
   this.station.draw(sim.tick+(bridge.paused?0:alpha),cam.zoom,this.scale.width,this.scale.height,this.cameraState.x,this.cameraState.y);
   for(const a of sim.actors){const sprite=this.sprites[a.id],label=this.labels[a.id],def=fighter(a.slot.fighter);if(a.out||a.respawn){sprite.setVisible(false);label.setVisible(false);continue;}sprite.setVisible(true);label.setVisible(true);const x=a.px+(a.x-a.px)*alpha,y=a.py+(a.y-a.py)*alpha;
    let anim:Animation=a.stun>0?'hurt':a.move?a.move.animation:!a.grounded?(a.vy<0?'jump':'fall'):Math.abs(a.vx)>.8?'run':'idle';if(a.dodgeTime>0)anim='jump';const meta=this.manifest[def.id][anim],idle=this.manifest[def.id].idle;const scale=def.id==='omen'?1.15:def.id==='kairo'?1.6:def.id==='regent'?1.4:1.55;
    const baseline=def.id==='kairo'?(anim==='jump'||anim==='fall'?95:81):def.id==='regent'?104:def.id==='vexa'?96:166;
    sprite.setTexture(`${def.id}-${anim}`);let frame=Math.floor(sim.tick/(anim==='run'?5:8))%meta.frames;if(a.move){const m=a.move;const t=a.moveTick<m.startup?(a.moveTick/m.startup)*.32:a.moveTick<m.startup+m.active?.32+(a.moveTick-m.startup)/m.active*.38:.7+(a.moveTick-m.startup-m.active)/m.recovery*.3;frame=Math.min(meta.frames-1,Math.floor(t*meta.frames));}else if(anim==='jump'||anim==='fall')frame=Math.min(meta.frames-1,Math.floor(Math.abs(a.vy)/7));
    sprite.setFrame(frame).setOrigin(.5,(baseline+1)/meta.height).setPosition(x,y).setFlipX(a.face<0).setScale(scale*(a.landing?1.08:1),scale*(a.landing?.88:1));sprite.setAngle(a.stun>0?Phaser.Math.Clamp(a.vx*1.8,-30,30):a.dodgeTime?Math.sin(a.dodgeAge*.5)*15:0);const protectedDodge=a.dodgeTime>0;const flicker=bridge.settings.flashes&&protectedDodge&&a.dodgeAge%8<4;
    sprite.setAlpha(a.invulnerable>0&&bridge.settings.flashes?(sim.tick%12<6?.5:1):protectedDodge?.60:1);sprite.clearTint();
    if(flicker||a.freeze>0&&bridge.settings.flashes)sprite.setTintFill(0xffffff);
    const color=Phaser.Display.Color.HexStringToColor(def.color).color;g.fillStyle(color,.12);g.fillEllipse(x,STAGE.platforms[a.platform]?.y??610,def.width*2.4,8);label.setPosition(x,y-def.height-18);label.setText(a.slot.name?`${a.id===(bridge.localIndex??0)?'▼ ':''}${a.slot.name}`:a.id===0?'▼ YOU':`CPU ${a.id}`);if(protectedDodge)label.setText('DODGE');label.setFontSize(protectedDodge?18:13);label.setColor(protectedDodge||bridge.settings.contrast?'#ffffff':this.sim.config.teams?(a.slot.team===0?'#27e8ed':'#ff58b1'):def.color);
    if(a.id===(bridge.localIndex??0)){g.lineStyle(2,color,.75);for(let n=0;n<a.airJumps;n++)g.strokeCircle(x-7+n*14,y+13,3);if(!a.recoveryUsed){g.fillStyle(color,.7);g.fillRect(x-3,y+20,6,2);}}
    if(a.stun>0&&Math.hypot(a.vx,a.vy)>7&&dt>0&&sim.tick!==this.lastEmit){this.particles.push({x:x-a.vx,y:y-def.height*.5,vx:0,vy:-.3,life:23,max:23,size:6+Math.min(a.damage/20,8),color:Phaser.Display.Color.HexStringToColor(damageColor(a.damage)).color});}
    if(protectedDodge){g.fillStyle(0xffffff,.20);g.fillEllipse(x,y-def.height/2,def.width+28,def.height+20);g.lineStyle(4,0xffffff,1);g.strokeEllipse(x,y-def.height/2,def.width+28,def.height+20);g.lineStyle(3,0x27e8ed,1);g.beginPath();g.arc(x,y-def.height/2,def.height*.65,-Math.PI/2,-Math.PI/2+Math.PI*2*a.dodgeTime/DODGE.invulnerableTicks);g.strokePath();}
    if(a.move){const m=a.move,b=m.hitbox;if(a.moveTick>=m.startup&&a.moveTick<m.startup+m.active&&!m.projectile){const centerX=x+b.x*a.face,centerY=y+b.y;g.lineStyle(5,color,.7);g.beginPath();const start=a.face>0?-1.4:1.7;g.arc(centerX,centerY,b.radius,start,start+2.6);g.strokePath();g.lineStyle(2,0xffffff,.9);g.beginPath();g.arc(centerX,centerY,b.radius*.8,start+.2,start+2.2);g.strokePath();}if(a.charge>0){g.lineStyle(2,0xffe45b,.8);g.strokeCircle(x,y-30,35+a.charge*.4);}}
    if(bridge.debug){g.lineStyle(1,0x00ff66,.8);g.strokeRoundedRect(x-def.width/2,y-def.height,def.width,def.height,def.width/2);g.lineStyle(1,0xff3333);if(a.move){const b=a.move.hitbox;g.strokeCircle(x+b.x*a.face,y+b.y,b.radius);g.lineBetween(x+b.x*a.face,y+b.y,x+(b.endX??b.x)*a.face,y+(b.endY??b.y));}g.lineStyle(2,0xffe45b);g.lineBetween(x,y,x+a.vx*5,y+a.vy*5);}
   }
   this.lastEmit=sim.tick;
   for(const p of sim.projectiles){const c=Phaser.Display.Color.HexStringToColor(fighter(sim.actors[p.owner].slot.fighter).color).color;g.fillStyle(c,p.arm>0?.15:.75);if(p.kind==='mine'||p.kind==='sigil'){g.fillEllipse(p.x,p.y,p.radius*2,p.arm>0?8:28);g.lineStyle(2,c,.8);g.strokeEllipse(p.x,p.y,p.radius*2+8,12);}else{g.fillCircle(p.x,p.y,p.radius);g.fillStyle(0xffffff,.8);g.fillCircle(p.x,p.y,p.radius*.4);g.lineStyle(p.radius,c,.2);g.lineBetween(p.x,p.y,p.x-p.vx*3,p.y-p.vy*3);}}
   for(const it of sim.items){const col=ITEMS[it.kind].color;g.fillStyle(col,.14);g.fillCircle(it.x,it.y,22);g.lineStyle(2,col,1);g.strokeCircle(it.x,it.y,12);g.fillStyle(col,1);if(it.kind==='repair'){g.fillRect(it.x-7,it.y-2,14,4);g.fillRect(it.x-2,it.y-7,4,14);}else if(it.kind==='spike'){g.fillTriangle(it.x,it.y-9,it.x-8,it.y+7,it.x+8,it.y+7);}else {g.fillCircle(it.x,it.y,7);g.lineStyle(2,0xffffff,it.fuse>0&&sim.tick%12<6?1:.3);g.lineBetween(it.x+4,it.y-6,it.x+10,it.y-13);}}
   for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;p.vy+=.035*dt;fx.fillStyle(p.color,Math.max(0,p.life/p.max)*.7);fx.fillRect(p.x,p.y,p.size,p.size*.55);}this.particles=this.particles.filter(p=>p.life>0).slice(-250);
   for(const r of this.rings){r.life-=dt;const t=1-r.life/r.max;fx.lineStyle(2,r.color,Math.max(0,1-t));fx.strokeCircle(r.x,r.y,r.size*t);if(r.size>100){for(let i=0;i<6;i++){fx.fillStyle([0x27e8ed,0xff58b1,0xffe45b][i%3],(1-t)*.65);fx.fillRect(r.x-r.size+t*200+i*9,r.y+(i-3)*25,r.size*2*(1-t),4+i);}}}this.rings=this.rings.filter(r=>r.life>0);
   this.boundaries.draw(sim.actors,bridge.localIndex??0,this.cameraState,width,height,this.hudInset);
   this.debugText.setVisible(bridge.debug);if(bridge.debug)this.debugText.setText([`60 Hz | tick ${sim.tick} | ${Math.round(1000/this.frameAvg)} FPS`,...sim.actors.map(a=>`${a.id} ${a.move?.id??(a.stun?'stun':'idle')} ${a.moveTick} J${a.airJumps} R${!a.recoveryUsed} D${a.dodgeCD} SAFE${a.dodgeTime} ${a.aiIntent}`)]);
  }
 }
 return new Phaser.Game({type:Phaser.AUTO,parent,backgroundColor:'#0b1021',pixelArt:true,roundPixels:false,antialias:false,scale:{mode:Phaser.Scale.RESIZE,width:Math.max(160,parent.clientWidth),height:Math.max(120,parent.clientHeight),min:{width:160,height:120}},scene:ArenaScene,audio:{noAudio:true},render:{powerPreference:'high-performance'},fps:{target:60,smoothStep:false},banner:false});
}
