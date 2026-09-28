import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../game/simulation';
import {FIGHTERS,defaultConfig,emptyInput,fighter,type FighterId} from '../game/data';
import {DODGE,dodgeReadout} from '../game/dodge';
import {captureSnapshot,applySnapshot,snapshotSchema,NETWORK_VERSION} from '../game/network-protocol';
const setup=(id:FighterId='kairo')=>{const s=new Simulation({...structuredClone(defaultConfig),items:'off'});s.countdown=0;s.actors[0].slot.fighter=id;return s;};
const step=(s:Simulation,input={})=>s.step(emptyInput(),[{...emptyInput(),...input},emptyInput()]);
const modes=[['spot',false,0,0],['ground left',false,-1,0],['ground right',false,1,0],['air spot',true,0,0],...[-1,0,1].flatMap(x=>[-1,0,1].filter(y=>x||y).map(y=>['air '+x+','+y,true,x,y]))] as const;
for(const def of FIGHTERS)for(const [mode,air,x,y] of modes)test(def.id+' '+mode+': first through last protected tick, then vulnerable',()=>{
 const s=setup(def.id),a=s.actors[0];a.x=500;a.y=air?320:610;a.grounded=!air;
 step(s,{dodge:true,x,y});assert.equal(a.dodgeTime,16);assert.equal(a.dodgeCD,air?DODGE.airCooldownTicks:DODGE.groundCooldownTicks);
 for(let n=16;n>0;n--){assert.equal(a.dodgeTime,n);assert.equal(s.canHit(1,a),false);assert.equal(s.canHit(1,a,true),false);assert.equal(dodgeReadout(a,'relaxed').state,'active');step(s);}
 assert.equal(a.dodgeTime,0);assert.equal(s.canHit(1,a),true);assert.equal(a.damage,0);assert(a.dodgeCD>0);
});
for(const target of FIGHTERS)test(target.id+': evade every authored attack, both facings; same attack hits once protection ends',()=>{
 for(const source of FIGHTERS)for(const move of Object.values(source.moves))for(const face of [-1,1]){
  const s=setup(target.id),b=s.actors[0],a=s.actors[1],label=source.id+'/'+move.id+'/'+face;
  a.slot.fighter=source.id;a.x=500;a.y=500;a.face=face;a.move=move;a.moveTick=move.startup;b.dodgeTime=1;b.dodgeEvaded=false;
  const contact=()=>{if(move.projectile)s.stepProjectiles();else s.resolveAttack(a);};
  if(move.projectile){s.spawnProjectile(a,move);const p=s.projectiles[0];p.arm=0;p.vx=0;p.vy=0;p.gravity=0;b.x=p.x;b.y=p.y+target.height/2;}
  else{b.x=a.x+move.hitbox.x*face;b.y=a.y+move.hitbox.y+target.height/2;}
  contact();assert.equal(b.damage,0,label);assert.equal(b.stun,0,label);assert.equal(b.freeze,0,label);
  assert.equal(s.events.filter(e=>e.kind==='evade').length,1,label+' feedback');contact();
  assert.equal(s.events.filter(e=>e.kind==='evade').length,1,label+' no feedback spam');
  b.dodgeTime=0;contact();assert(b.damage>0,label+' vulnerable afterward');
 }
});
for(const def of FIGHTERS)test(def.id+': dodges thrown spikes, bomb contact and bomb blasts (including own bomb)',()=>{
 for(const kind of ['spike','bomb'] as const){
  const s=setup(def.id),a=s.actors[0];a.dodgeTime=16;s.actors[1].x=900;
  s.spawnItem(kind,a.x);const item=s.items[0];item.y=a.y-def.height/2;item.owner=1;item.armed=true;item.fuse=kind==='bomb'?60:-1;
  s.stepItems();assert.equal(a.damage,0);assert.equal(s.events.filter(e=>e.kind==='evade').length,1);
  a.dodgeTime=0;s.stepItems();assert(a.damage>0);
 }
 for(const owner of [0,1]){const s=setup(def.id),a=s.actors[0];a.dodgeTime=1;s.spawnItem('bomb',a.x);const bomb=s.items[0];bomb.y=a.y-30;bomb.owner=owner;s.explode(bomb);assert.equal(a.damage,0);assert.equal(s.events.filter(e=>e.kind==='evade').length,1);}
});
test('misses, teammates and respawn immunity never claim a successful dodge',()=>{
 const s=setup(),a=s.actors[1],b=s.actors[0];b.dodgeTime=16;a.move=fighter(a.slot.fighter).moves.nl;a.moveTick=a.move.startup;a.x=900;s.resolveAttack(a);assert.equal(s.events.length,0);
 a.x=b.x-40;s.config.teams=true;a.slot.team=b.slot.team;s.resolveAttack(a);assert.equal(s.events.length,0);
 s.config.teams=false;b.invulnerable=60;s.resolveAttack(a);assert.equal(s.events.length,0);
});
test('ground dodge locks attacks; gravity cancel explicitly ends air protection',()=>{
 const s=setup(),a=s.actors[0];step(s,{x:1,dodge:true,light:true});assert.equal(a.move,null);assert.equal(a.dodgeTime,16);
 for(let i=0;i<15;i++)step(s,{light:true});assert.equal(a.move,null);assert.equal(a.dodgeTime,1);
 step(s);step(s,{light:true});assert(a.move);assert.equal(s.canHit(1,a),true);
 const t=setup(),b=t.actors[0];b.y=350;b.grounded=false;step(t,{dodge:true});step(t,{light:true});assert.equal(b.move?.id,'nl');assert.equal(b.dodgeTime,0);assert.equal(t.canHit(1,b),true);
});
test('no invulnerability from held dodge, cooldown re-press, attack recovery, or hitstun',()=>{
 const s=setup(),a=s.actors[0];step(s,{dodge:true});for(let i=0;i<70;i++)step(s,{dodge:true});assert.equal(a.dodgeTime,0);
 step(s);step(s,{dodge:true});assert.equal(a.dodgeTime,16);step(s);const cd=a.dodgeCD;step(s,{dodge:true});assert(a.dodgeCD<cd);assert(a.dodgeTime<16);
 for(const busy of ['stun','attack']){const t=setup(),b=t.actors[0];if(busy==='stun')b.stun=30;else {b.move=fighter(b.slot.fighter).moves.sh;b.moveTick=0;}step(t,{dodge:true});assert.equal(b.dodgeTime,0);}
});
test('late recovery dodge input buffers, protection begins only when action becomes legal',()=>{
 const s=setup(),a=s.actors[0];a.move=fighter(a.slot.fighter).moves.nl;a.moveTick=a.move.startup+a.move.active+a.move.recovery-3;
 step(s,{dodge:true});assert.equal(a.dodgeTime,0);step(s);step(s);assert.equal(a.dodgeTime,16);assert.equal(a.move,null);
});
test('network snapshot preserves the exact active window and confirmed evade event',()=>{
 const s=setup(),a=s.actors[0];step(s,{x:1,dodge:true});s.evade(a);
 const state=snapshotSchema.parse(captureSnapshot(s,s.events,false)),guest=setup();assert(applySnapshot(guest,state));assert.equal(guest.actors[0].dodgeTime,16);assert.equal(guest.canHit(1,guest.actors[0]),false);assert.equal(state.events.filter(e=>e.kind==='evade').length,1);assert.equal(NETWORK_VERSION,5);
});
test('cooldown readout uses real match pace, and READY never promises a dodge while busy',()=>{
 const s=setup(),a=s.actors[0];assert.equal(dodgeReadout(a,'classic').label,'READY');a.dodgeCD=51;assert.equal(dodgeReadout(a,'relaxed').label,'1.0s');a.dodgeCD=0;a.stun=5;assert.equal(dodgeReadout(a,'classic').label,'BUSY');
});
