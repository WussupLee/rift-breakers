import {FEEL} from './feel';
import {fighter,STAGE,ITEMS,emptyInput,type InputFrame,type MatchConfig,type MoveDefinition,type MoveId,type Slot,type ItemKind} from './data';
import {DODGE} from './dodge';
export interface CombatEvent {kind:'hit'|'ko'|'jump'|'dodge'|'land'|'attack'|'respawn'|'item'|'sudden'|'evade';x:number;y:number;color:string;power:number;actor:number;move?:MoveId;cue?:'dash'|'throw'|'pickup'|'repair'|'explosion'}
export interface Actor {id:number;slot:Slot;x:number;y:number;px:number;py:number;vx:number;vy:number;face:number;damage:number;stocks:number;score:number;kos:number;deaths:number;grounded:boolean;platform:number;airJumps:number;recoveryUsed:boolean;dodgeCD:number;dodgeTime:number;dodgeAge:number;dodgeEvaded:boolean;spot:boolean;stun:number;freeze:number;invulnerable:number;respawn:number;out:boolean;move:MoveDefinition|null;moveTick:number;hit:Set<number>;previous:InputFrame;buffers:Record<string,number>;coyote:number;drop:number;lastAttacker:number;lastHit:number;history:MoveId[];aiInput:InputFrame;aiNext:number;aiIntent:string;held:number|null;wall:number;wallUses:number;charge:number;diApplied:boolean;damageDone:number;landing:number}
export interface Projectile {id:number;owner:number;kind:string;x:number;y:number;px:number;py:number;vx:number;vy:number;radius:number;life:number;arm:number;damage:number;base:number;scaling:number;angle:number;hit:Set<number>;gravity:number}
export interface Item {id:number;kind:ItemKind;x:number;y:number;px:number;py:number;vx:number;vy:number;life:number;fuse:number;owner:number;heldBy:number;armed:boolean;grace:number}
export function knockback(damage:number,base:number,scaling:number,power:number,weight:number){return (base+Math.max(0,damage)*scaling)*power/weight;}
export function segmentDistance(px:number,py:number,ax:number,ay:number,bx:number,by:number){const dx=bx-ax,dy=by-ay;const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(px-ax-t*dx,py-ay-t*dy);}
function orient(ax:number,ay:number,bx:number,by:number,cx:number,cy:number){return (bx-ax)*(cy-ay)-(by-ay)*(cx-ax);}
export function segmentsDistance(ax:number,ay:number,bx:number,by:number,cx:number,cy:number,dx:number,dy:number){
 const o1=orient(ax,ay,bx,by,cx,cy),o2=orient(ax,ay,bx,by,dx,dy),o3=orient(cx,cy,dx,dy,ax,ay),o4=orient(cx,cy,dx,dy,bx,by);
 if(o1*o2<0&&o3*o4<0)return 0;
 return Math.min(segmentDistance(ax,ay,cx,cy,dx,dy),segmentDistance(bx,by,cx,cy,dx,dy),segmentDistance(cx,cy,ax,ay,bx,by),segmentDistance(dx,dy,ax,ay,bx,by));
}
export function chooseMove(input:InputFrame,grounded:boolean,heavy:boolean):MoveId {if(!grounded)return heavy?(input.y>0?'gp':'rec'):(input.y>0?'da':input.x?'sa':'na');return heavy?(input.y>0?'dh':input.x?'sh':'nh'):(input.y>0?'dl':input.x?'sl':'nl');}
export class Simulation {
 config:MatchConfig; actors:Actor[]; projectiles:Projectile[]=[];items:Item[]=[];events:CombatEvent[]=[];tick=0;countdown=150;time:number;ended=false;winners:number[]=[];sudden=false;seed:number;nextItem:number;serial=1;
 constructor(config:MatchConfig){this.config=structuredClone(config);this.seed=config.seed>>>0||1;this.time=config.seconds*60;this.nextItem=this.itemDelay();this.actors=config.slots.map((slot,id)=>({id,slot:structuredClone(slot),x:STAGE.spawns[id],y:610,px:STAGE.spawns[id],py:610,vx:0,vy:0,face:id%2?-1:1,damage:0,stocks:config.stocks,score:0,kos:0,deaths:0,grounded:true,platform:0,airJumps:2,recoveryUsed:false,dodgeCD:0,dodgeTime:0,dodgeAge:99,dodgeEvaded:false,spot:false,stun:0,freeze:0,invulnerable:0,respawn:0,out:false,move:null,moveTick:0,hit:new Set(),previous:emptyInput(),buffers:{},coyote:5,drop:0,lastAttacker:-1,lastHit:-999,history:[],aiInput:emptyInput(),aiNext:0,aiIntent:'Approach',held:null,wall:0,wallUses:0,charge:0,diApplied:false,damageDone:0,landing:0}));}
 random(){let t=this.seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
 itemDelay(){return Math.round((this.config.items==='low'?24+this.random()*8:14+this.random()*6)*60);}
 emit(kind:CombatEvent['kind'],a:Actor,power=1,x=a.x,y=a.y){this.events.push({kind,x,y,color:fighter(a.slot.fighter).color,power,actor:a.id,...(kind==='attack'&&a.move?{move:a.move.id}:{})});}
 enemies(a:Actor,b:Actor){return a.id!==b.id&&(!this.config.teams||a.slot.team!==b.slot.team);}
 canTarget(owner:number,b:Actor,self=false){const a=this.actors[owner];return !b.out&&!b.respawn&&b.invulnerable<=0&&(self||b.id!==owner)&&(!a||!this.config.teams||this.config.friendlyFire||a.slot.team!==b.slot.team||self&&b.id===owner);}
 canHit(owner:number,b:Actor,self=false){return this.canTarget(owner,b,self)&&b.dodgeTime<=0;}
 evade(a:Actor){if(a.dodgeTime<=0)return false;if(!a.dodgeEvaded){a.dodgeEvaded=true;this.emit('evade',a);}return true;}
 step(player:InputFrame=emptyInput(),overrides?:InputFrame[]){this.events=[];if(this.ended)return;this.tick++;if(this.countdown>0){this.countdown--;return;}
  const inputs=this.actors.map((a,i)=>overrides?.[i]??(i===0?player:this.ai(a)));
  for(const a of this.actors)this.stepActor(a,inputs[a.id]);
  for(const a of this.actors)if(!a.out&&!a.respawn&&a.move&&a.freeze<=0&&a.moveTick>=a.move.startup&&a.moveTick<a.move.startup+a.move.active)this.resolveAttack(a);
  this.stepProjectiles();this.stepItems();
  for(const a of this.actors)if(!a.out&&!a.respawn&&(a.x<STAGE.blast.left||a.x>STAGE.blast.right||a.y<STAGE.blast.top||a.y>STAGE.blast.bottom))this.ko(a);
  if(this.config.items!=='off'&&!this.sudden&&--this.nextItem<=0){this.spawnItem();this.nextItem=this.itemDelay();}
  if(this.config.mode==='timed'&&!this.sudden&&--this.time<=0)this.resolveTime();
  if(this.config.mode==='stock'||this.sudden)this.checkVictory();
 }
 stepActor(a:Actor,input:InputFrame){const feel=FEEL[this.config.feel??'classic'];a.px=a.x;a.py=a.y;if(a.out)return;if(a.respawn>0){if(--a.respawn===0){a.x=STAGE.spawns[a.id];a.y=230;a.px=a.x;a.py=a.y;a.vx=0;a.vy=0;a.invulnerable=120;a.airJumps=2;a.recoveryUsed=false;a.dodgeCD=0;a.grounded=false;a.wallUses=0;this.emit('respawn',a);}return;}
  for(const k of ['jump','light','heavy','dodge','item'] as const){if(input[k]&&!a.previous[k])a.buffers[k]=feel.buffer;else a.buffers[k]=Math.max(0,(a.buffers[k]||0)-1);}a.previous={...input};
  if(a.invulnerable>0)a.invulnerable--;if(a.dodgeCD>0)a.dodgeCD--;if(a.drop>0)a.drop--;if(a.landing>0)a.landing--;a.dodgeAge++;
  if(a.stun>0&&!a.diApplied&&(input.x||input.y)){const angle=Math.atan2(a.vy,a.vx),cross=Math.cos(angle)*input.y-Math.sin(angle)*input.x;const next=angle+Math.max(-1,Math.min(1,cross))*Math.PI/10;const speed=Math.hypot(a.vx,a.vy);a.vx=Math.cos(next)*speed;a.vy=Math.sin(next)*speed;a.diApplied=true;}
  if(a.freeze>0){a.freeze--;return;}
  if(a.stun>0){a.stun--;a.move=null;a.vx*=.985;}
  const def=fighter(a.slot.fighter);if(a.grounded)a.coyote=feel.coyote;else a.coyote=Math.max(0,a.coyote-1);
  if(a.dodgeTime>0){a.dodgeTime--;a.vx*=.91;a.vy*=.91;}
  if(a.move){if(a.move.charge&&a.moveTick===a.move.startup-1&&input.heavy&&a.charge<30)a.charge++;else a.moveTick++;
   if(a.moveTick===a.move.startup){this.emit('attack',a,a.move.damage);if(a.move.id==='rec'){a.vy=-15.8;if(a.slot.fighter==='omen'){a.x+=input.x*55;a.y-=48;this.emit('dodge',a,2);}a.vx+=input.x*4;}if(a.move.id==='gp'){a.vy=15;a.vx*=.5;}}
   if(a.moveTick>=a.move.startup+a.move.active+a.move.recovery){a.move=null;a.moveTick=0;}
  }
  const gravityCancel=a.dodgeAge<=DODGE.gravityCancelTicks&&a.spot&&!a.grounded;
  if(a.stun<=0&&(!a.move)&&(!a.dodgeTime||gravityCancel)){
   if(a.buffers.item>0){this.useItem(a,input);a.buffers.item=0;}
   if(a.buffers.dodge>0&&a.dodgeCD<=0){a.buffers.dodge=0;a.dodgeAge=0;a.spot=!input.x&&!input.y;const dash=a.grounded&&input.x!==0;a.dodgeTime=DODGE.invulnerableTicks;a.dodgeEvaded=false;a.dodgeCD=a.grounded?DODGE.groundCooldownTicks:DODGE.airCooldownTicks;a.vx=input.x*(dash?12:10);a.vy=a.grounded?0:input.y*10;this.emit('dodge',a);if(dash)this.events[this.events.length-1].cue='dash';}
   if(a.buffers.jump>0){if(input.y>0&&a.grounded&&a.platform===1){a.drop=18;a.grounded=false;a.y+=5;a.vy=2;a.buffers.jump=0;}else if(a.grounded||a.coyote>0||a.airJumps>0||a.wall){if(!a.grounded&&a.coyote<=0&&!a.wall)a.airJumps--;a.vy=-def.jump;if(a.wall)a.vx=-a.wall*9;a.grounded=false;a.coyote=0;a.wall=0;a.buffers.jump=0;this.emit('jump',a);}}
   if((a.buffers.light>0||a.buffers.heavy>0)&&(!a.dodgeTime||gravityCancel)){
    const isHeavy=a.buffers.heavy>0;const key=chooseMove(input,a.grounded||gravityCancel,isHeavy);
    if(key!=='rec'||!a.recoveryUsed){a.move=def.moves[key];a.moveTick=0;a.charge=0;a.hit.clear();a.buffers.light=0;a.buffers.heavy=0;a.dodgeTime=0;if(input.x)a.face=Math.sign(input.x);if(key==='rec')a.recoveryUsed=true;if(gravityCancel){a.vy=0;a.vx*=.3;}if(a.move.impulse)a.vx=a.face*a.move.impulse;if(a.invulnerable>0)a.invulnerable=0;}
   }
  }
  if(a.stun<=0&&!a.dodgeTime){if(!a.move){const target=input.x*def.speed;const accel=a.grounded?def.acceleration:def.acceleration*.55*feel.airControl;a.vx+=Math.max(-accel,Math.min(accel,target-a.vx));if(input.x)a.face=Math.sign(input.x);}else a.vx*=a.grounded?.84:.985;}
  if(!a.grounded&&!a.dodgeTime){const assisted=a.stun<=0&&a.move?.id!=='gp',fast=input.y>0&&a.vy>0&&a.stun<=0;a.vy+=def.gravity*(assisted&&!fast?feel.gravity:1)*(fast?1.9:1);a.vy=Math.min(a.vy,a.stun>0?30:input.y>0?18:assisted?feel.fallSpeed:13);}
  a.x+=a.vx;a.y+=a.vy;a.grounded=false;a.wall=0;
  for(let i=0;i<STAGE.platforms.length;i++){const p=STAGE.platforms[i],r=def.width/2;if(i===1&&a.drop>0)continue;
   if(a.x+r>p.x&&a.x-r<p.x+p.width&&a.vy>=0&&a.py<=p.y+2&&a.y>=p.y){const landingSpeed=a.vy;a.y=p.y;a.vy=0;a.grounded=true;a.platform=i;a.airJumps=2;a.recoveryUsed=false;a.wallUses=0;if(a.py<p.y-3){a.dodgeCD=Math.min(a.dodgeCD,DODGE.groundCooldownTicks);a.landing=6;this.emit('land',a,landingSpeed);}if(a.move?.id==='gp'){a.moveTick=Math.max(a.moveTick,a.move.startup);}}
   if(!p.oneWay&&a.y>p.y+8&&a.y-def.height<p.y+64){const left=a.px+r<=p.x&&a.x+r>p.x,right=a.px-r>=p.x+p.width&&a.x-r<p.x+p.width;if(left||right){a.wall=left?1:-1;a.x=left?p.x-r:p.x+p.width+r;a.vx=0;if(a.vy>3)a.vy=3;if(a.wallUses<3){a.airJumps=2;a.recoveryUsed=false;a.wallUses++;}}}
  }
 }
 resolveAttack(a:Actor){const m=a.move!;if(m.projectile){if(!a.hit.has(-1)){a.hit.add(-1);this.spawnProjectile(a,m);}return;}
  const b=m.hitbox;const progress=(a.moveTick-m.startup)/m.active;const sweep=m.id==='dh'||m.id==='na';
  const ax=a.x+(sweep?-b.x:b.x)*a.face,ay=a.y+b.y,bx=a.x+(b.endX??b.x)*a.face,by=a.y+(b.endY??b.y);const radius=b.radius*(.85+Math.sin(progress*Math.PI)*.15);
  for(const target of this.actors){if(a.hit.has(target.id)||!this.canTarget(a.id,target))continue;const d=fighter(target.slot.fighter);const collides=segmentsDistance(ax,ay,bx,by,target.x,target.y-d.height+d.width/2,target.x,target.y-d.width/2)<=radius+d.width/2||Math.hypot(a.x-a.px,a.y-a.py)>10&&segmentDistance(target.x,target.y-d.height/2,a.px+b.x*a.face,a.py+b.y,ax,ay)<=radius+d.width/2;
   if(collides){if(this.evade(target))continue;a.hit.add(target.id);this.hit(target,a.id,m.damage,m.base,m.scaling,m.angle,a.face,a.charge,m.id);}}
 }
 hit(b:Actor,owner:number,damage:number,base:number,scaling:number,angle:number,face:number,charge=0,move?:MoveId){const a=this.actors[owner],def=fighter(b.slot.fighter);const repeats=a&&move?a.history.filter(x=>x===move).length:0;const decay=Math.max(.78,1-repeats*.035);const dealt=damage*decay*(1+charge/100);b.damage+=dealt;if(a){a.damageDone+=dealt;if(move){a.history.push(move);if(a.history.length>8)a.history.shift();}}
  const force=knockback(b.damage,base,scaling,a?fighter(a.slot.fighter).power:1,def.weight)*decay*(1+charge/120);const rad=angle*Math.PI/180;
  const armored=b.move?.armor&&b.moveTick<b.move.startup&&force<13;
  if(!armored){b.vx=Math.cos(rad)*force*face;b.vy=Math.sin(rad)*force;b.stun=Math.min(48,Math.max(10,Math.floor(force*2.1)));b.move=null;b.grounded=false;b.diApplied=false;}
  b.freeze=Math.min(8,Math.max(3,Math.round(force/3)));if(a)a.freeze=Math.max(a.freeze,b.freeze);b.lastAttacker=owner;b.lastHit=this.tick;
  if(b.held!==null){const item=this.items.find(x=>x.id===b.held);if(item){item.heldBy=-1;item.vx=b.vx*.4;item.vy=-3;item.grace=30;}b.held=null;}
  this.emit('hit',b,force,b.x,b.y-def.height/2);
 }
 spawnProjectile(a:Actor,m:MoveDefinition){const kind=m.projectile!;const stationary=kind==='sigil'||kind==='mine';this.projectiles.push({id:this.serial++,owner:a.id,kind,x:a.x+(stationary?110:45)*a.face,y:stationary?a.y-10:a.y-36,px:a.x,py:a.y-36,vx:stationary?0:kind==='shard'?a.face*3:a.face*(kind==='beam'?17:10),vy:kind==='shard'?8:0,radius:kind==='beam'?18:stationary?34:12,life:stationary?180:85,arm:kind==='mine'?40:kind==='sigil'?10:0,damage:m.damage,base:m.base,scaling:m.scaling,angle:m.angle,hit:new Set(),gravity:kind==='shard'?.16:0});}
 stepProjectiles(){for(const p of this.projectiles){p.px=p.x;p.py=p.y;p.x+=p.vx;p.y+=p.vy;p.vy+=p.gravity;p.life--;if(p.arm>0){p.arm--;continue;}for(const b of this.actors){if(p.hit.has(b.id)||!this.canTarget(p.owner,b))continue;const d=fighter(b.slot.fighter);if(segmentsDistance(p.px,p.py,p.x,p.y,b.x,b.y-d.height+d.width/2,b.x,b.y-d.width/2)<=p.radius+d.width/2){if(this.evade(b))continue;p.hit.add(b.id);this.hit(b,p.owner,p.damage,p.base,p.scaling,p.angle,p.vx<0?-1:1);if(p.kind!=='beam')p.life=0;}}}this.projectiles=this.projectiles.filter(p=>p.life>0);}
 spawnItem(kind?:ItemKind,x?:number){this.items.push({id:this.serial++,kind:kind??(['bomb','spike','repair'] as ItemKind[])[Math.floor(this.random()*3)],x:x??270+this.random()*460,y:120,px:0,py:120,vx:0,vy:0,life:900,fuse:-1,owner:-1,heldBy:-1,armed:false,grace:0});}
 useItem(a:Actor,input:InputFrame){if(a.held!==null){const it=this.items.find(i=>i.id===a.held);if(!it){a.held=null;return;}a.held=null;it.heldBy=-1;it.owner=a.id;it.armed=true;it.grace=10;it.vx=input.x?input.x*13:a.face*12;it.vy=input.y>0?8:input.y<0?-13:-5;if(it.kind==='bomb')it.fuse=105;this.emit('item',a);this.events[this.events.length-1].cue='throw';}else {const it=this.items.find(i=>i.life>0&&i.heldBy<0&&Math.hypot(i.x-a.x,i.y-(a.y-28))<65);if(it){if(it.kind==='repair'){a.damage=Math.max(0,a.damage-25);it.life=0;this.emit('item',a,25);}else {it.heldBy=a.id;it.armed=false;it.fuse=-1;it.owner=a.id;a.held=it.id;this.emit('item',a);}}}}
 stepItems(){for(const it of this.items){if(--it.life<=0){if(it.heldBy>=0)this.actors[it.heldBy].held=null;continue;}if(it.heldBy>=0){const a=this.actors[it.heldBy];it.x=a.x+a.face*28;it.y=a.y-36;continue;}it.px=it.x;it.py=it.y;it.vy+=.35;it.x+=it.vx;it.y+=it.vy;if(it.grace>0)it.grace--;
   for(const p of STAGE.platforms)if(it.x>=p.x&&it.x<=p.x+p.width&&it.py<=p.y-9&&it.y>=p.y-9&&it.vy>0){it.y=p.y-9;it.vy=it.kind==='bomb'?-it.vy*.55:0;it.vx*=.7;if(it.kind==='spike')it.armed=false;}
   if(it.fuse>=0&&--it.fuse<=0){this.explode(it);continue;}
   if(it.armed&&it.grace<=0){for(const b of this.actors){if(!this.canTarget(it.owner,b,it.kind==='bomb'))continue;const d=fighter(b.slot.fighter);if(segmentsDistance(it.px,it.py,it.x,it.y,b.x,b.y-d.height+d.width/2,b.x,b.y-d.width/2)<d.width/2+10){if(this.evade(b))continue;if(it.kind==='bomb')this.explode(it);else {const spec=ITEMS.spike;this.hit(b,it.owner,spec.damage,spec.base+Math.abs(it.vx)*.25,spec.scaling,-30,it.vx<0?-1:1);it.armed=false;it.vx=0;it.vy=-4;}break;}}}
   // Only safe, grounded items are collected automatically; airborne/armed items
   // still require a deliberate catch. This rule is identical for humans and CPUs.
   if(it.life>0&&!it.armed&&it.fuse<0&&it.grace<=0&&Math.abs(it.vx)<1&&Math.abs(it.vy)<1){
    const resting=STAGE.platforms.some(p=>it.x>=p.x&&it.x<=p.x+p.width&&Math.abs(it.y-(p.y-9))<1);
    if(resting){const a=this.actors.find(a=>!a.out&&!a.respawn&&!a.stun&&!a.freeze&&!a.move&&!a.dodgeTime&&a.grounded&&a.held===null&&Math.abs(a.y-it.y-9)<2&&Math.abs(a.x-it.x)<fighter(a.slot.fighter).width/2+14);
     if(a){if(it.kind==='repair'){a.damage=Math.max(0,a.damage-25);it.life=0;this.emit('item',a,25);}else{it.heldBy=a.id;it.owner=a.id;a.held=it.id;this.emit('item',a);}}
    }
   }
   if(it.y>1050)it.life=0;
  }this.items=this.items.filter(i=>i.life>0);}
 explode(it:Item){it.life=0;for(const b of this.actors)if(this.canTarget(it.owner,b,true)&&Math.hypot(it.x-b.x,it.y-b.y+30)<105&&!this.evade(b)){const s=ITEMS.bomb;this.hit(b,it.owner,s.damage,s.base,s.scaling,-45,b.x<it.x?-1:1);}const a=this.actors[Math.max(0,it.owner)];this.emit('item',a,35,it.x,it.y);}
 ko(a:Actor){this.emit('ko',a,30);a.deaths++;a.score--;a.stocks--;if(a.lastAttacker>=0&&a.lastAttacker!==a.id&&this.tick-a.lastHit<600){const source=this.actors[a.lastAttacker];if(this.enemies(source,a)){source.kos++;source.score+=2;}}
  if(a.held!==null){const it=this.items.find(i=>i.id===a.held);if(it)it.life=0;a.held=null;}
  a.move=null;a.buffers={};a.previous=emptyInput();a.stun=0;a.freeze=0;a.dodgeTime=0;a.damage=this.sudden?180:0;a.lastAttacker=-1;a.lastHit=-999;
  if((this.config.mode==='stock'||this.sudden)&&a.stocks<=0)a.out=true;else a.respawn=100;
 }
 checkVictory(){const alive=this.actors.filter(a=>!a.out),groups=new Set(alive.map(a=>this.config.teams?a.slot.team:a.id));if(groups.size<=1){this.ended=true;this.winners=this.config.teams?this.actors.filter(a=>groups.has(a.slot.team)).map(a=>a.id):alive.map(a=>a.id);}}
 resolveTime(){const scores=new Map<number,number>();for(const a of this.actors){const group=this.config.teams?a.slot.team:a.id;scores.set(group,(scores.get(group)??0)+a.score);}const best=Math.max(...scores.values());const tied=[...scores].filter(([,s])=>s===best).map(([g])=>g);if(tied.length===1){this.ended=true;this.winners=this.actors.filter(a=>tied.includes(this.config.teams?a.slot.team:a.id)).map(a=>a.id);}else{this.sudden=true;this.countdown=120;this.items=[];this.projectiles=[];for(const a of this.actors){a.out=!tied.includes(this.config.teams?a.slot.team:a.id);a.held=null;a.stocks=1;a.damage=180;a.x=STAGE.spawns[a.id];a.y=610;a.px=a.x;a.py=a.y;a.vx=0;a.vy=0;a.respawn=0;a.stun=0;a.freeze=0;a.move=null;a.grounded=true;a.airJumps=2;a.recoveryUsed=false;a.dodgeTime=0;a.dodgeCD=0;a.invulnerable=60;}this.emit('sudden',this.actors[0]);}}
 ai(a:Actor):InputFrame {if(a.out||a.respawn)return emptyInput();const level=a.slot.difficulty;const delay=level==='easy'?13:level==='medium'?7:4;if(this.tick<a.aiNext)return {...a.aiInput,jump:false,light:false,heavy:false,dodge:false,item:false};a.aiNext=this.tick+delay;
  const input=emptyInput();const targets=this.actors.filter(b=>this.enemies(a,b)&&!b.out&&!b.respawn);const target=targets.sort((b,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(a.x-c.x,a.y-c.y))[0];
  const offstage=a.x<175||a.x>825||a.y>645;
  if(offstage){a.aiIntent='Recover';input.x=a.x<500?1:-1;if(a.y>450&&a.vy>-2){if(a.airJumps>0)input.jump=true;else if(!a.recoveryUsed)input.heavy=true;else if(a.dodgeCD<=0){input.dodge=true;input.y=-1;}}if(a.wall)input.jump=true;}
  else if(target){const dx=target.x+(level==='hard'?target.vx*7:0)-a.x,dy=target.y-a.y,dist=Math.abs(dx);const mage=a.slot.fighter==='omen';const desired=mage?180:55;a.aiIntent=dist>desired?'Approach':'Pressure';input.x=dist>desired?Math.sign(dx):dist<35&&mage?-Math.sign(dx):0;
   if(level==='easy'&&this.random()<.25){input.x=0;a.aiIntent='Observe';}
   if(dy<-75&&(a.grounded||a.vy>1)&&a.airJumps>0)input.jump=true;
   if(dy>90&&a.platform===1&&a.grounded){input.y=1;input.jump=true;}
   if(a.move===null&&dist<(mage?300:105)&&Math.abs(dy)<(mage?80:75)&&this.random()>(level==='easy'?.45:.12)){input.x=dist>55||a.face!==Math.sign(dx)?Math.sign(dx):0;input.y=dy>30?1:this.random()<.18?1:0;const punish=target.move&&target.moveTick>target.move.startup+target.move.active;input.heavy=!!punish||target.damage>95&&this.random()<.45||this.random()<.16;input.light=!input.heavy;if(!a.grounded&&input.heavy&&dy<0)input.heavy=false;}
   if(level!=='easy'&&target.move&&dist<140&&target.moveTick<target.move.startup&&a.dodgeCD<=0&&this.random()<(level==='hard'?.78:.36)){input.dodge=true;input.light=false;input.heavy=false;a.aiIntent='Dodge';input.x=level==='hard'&&this.random()<.5?0:-Math.sign(dx);if(!a.grounded)input.y=0;}
   if(level==='hard'&&a.spot&&a.dodgeAge<8&&dist<125){input.light=true;input.dodge=false;a.aiIntent='Gravity cancel';}
   if(level==='hard'&&target.x<160&&a.x<210||level==='hard'&&target.x>840&&a.x>790){a.aiIntent='Edge guard';if(a.airJumps>=1&&this.random()<.3){input.x=Math.sign(dx);input.jump=true;}}
   if(a.stun>0){input.x=a.x<500?1:-1;input.y=-1;a.aiIntent='Influence launch';}
   if(a.held!==null){input.item=true;input.x=Math.sign(dx);}else if(level!=='easy'&&this.items.some(i=>i.heldBy<0&&Math.hypot(i.x-a.x,i.y-a.y+28)<65))input.item=true;
  }
  if(a.x<190&&input.x<0&&!offstage&&!(level==='hard'&&a.aiIntent==='Edge guard'))input.x=0;if(a.x>810&&input.x>0&&!offstage&&!(level==='hard'&&a.aiIntent==='Edge guard'))input.x=0;
  a.aiInput=input;return input;
 }
}
