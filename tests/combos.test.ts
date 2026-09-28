import test from 'node:test';import assert from 'node:assert/strict';
import {Simulation} from '../game/simulation';
import {FIGHTERS,fighter,defaultConfig,emptyInput,type FighterId,type MoveId} from '../game/data';
import {captureSnapshot,applySnapshot,snapshotSchema,NETWORK_VERSION} from '../game/network-protocol';
import {comboReadout} from '../game/combo';
import {readFileSync} from 'node:fs';
const setup=(id:FighterId='kairo')=>{const s=new Simulation({...structuredClone(defaultConfig),items:'off'});s.countdown=0;const [a,b]=s.actors;a.slot.fighter=id;a.x=450;b.x=505;return s;};
const step=(s:Simulation,input={})=>s.step(emptyInput(),[{...emptyInput(),...input},emptyInput()]);
for(const f of FIGHTERS){
 test(f.id+': three deliberate light taps connect three different attacks at low damage',()=>{
  const s=setup(f.id),a=s.actors[0],b=s.actors[1],seen:MoveId[]=[];
  step(s,{light:true});
  for(let n=0;n<180;n++){
   step(s,{light:!!a.move?.chain&&a.moveTick>=a.move.startup&&!a.chainQueued&&!a.previous.light});
   for(const e of s.events)if(e.kind==='attack'&&e.actor===0)seen.push(e.move!);
  }
  assert.deepEqual(seen,['nl','l2','l3']);assert.equal(b.history.length,0);
  assert.deepEqual(a.history,['nl','l2','l3']);assert.equal(b.damage,f.moves.nl.damage+f.moves.l2.damage+f.moves.l3.damage);
  assert.equal(a.move,null);assert.equal(a.chainQueued,null);
 });
 test(f.id+': holding light never auto-combos or repeats',()=>{
  const s=setup(f.id);for(let n=0;n<160;n++)step(s,{light:true});
  assert.deepEqual(s.actors[0].history,['nl']);assert.equal(s.actors[0].move,null);
 });
 test(f.id+': whiffs pay full recovery; connected chains still pay every startup tick',()=>{
  for(const connected of [false,true]){
   const s=setup(f.id),a=s.actors[0],m=f.moves.nl;s.actors[1].x=800;
   step(s,{light:true});a.moveTick=m.startup;a.previous=emptyInput();if(connected)a.hit.add(1);
   step(s,{light:true});assert.equal(a.chainQueued,'l2');
   const end=connected?m.startup+m.active+m.chain!.cancelRecovery:m.startup+m.active+m.recovery;
   while(a.moveTick<end-1){step(s);assert.equal(a.move?.id,'nl');}
   step(s);assert.equal(a.move?.id,'l2');assert.equal(a.moveTick,0);assert.equal(a.chainQueued,null);
   for(let n=0;n<f.moves.l2.startup;n++){assert.equal(s.events.some(e=>e.kind==='attack'),false);step(s);}
   assert(s.events.some(e=>e.kind==='attack'&&e.move==='l2'));
  }
 });
 test(f.id+': second hit branches into directional heavy, not a skipped-startup hit',()=>{
  for(const [x,y,key] of [[0,0,'nh'],[1,0,'sh'],[0,1,'dh']] as const){
   const s=setup(f.id),a=s.actors[0],m=f.moves.l2;s.startMove(a,'l2',emptyInput());a.moveTick=m.startup;a.hit.add(1);s.actors[1].x=800;
   step(s,{x,y,heavy:true});assert.equal(a.chainQueued,key);
   for(let n=0;n<30&&a.move?.id==='l2';n++)step(s);
   assert.equal(a.move?.id,key);assert.equal(a.moveTick,0);assert.equal(a.hit.size,0);
   assert.equal(s.events.some(e=>e.kind==='attack'),false);
  }
 });
 test(f.id+': getting hit, leaving ground and KO clear queued followups',()=>{
  for(const interrupt of ['hit','air','ko']){
   const s=setup(f.id),a=s.actors[0];s.startMove(a,'nl',emptyInput());a.chainQueued='l2';
   if(interrupt==='hit')s.hit(a,1,5,3,.03,-30,1);
   else if(interrupt==='ko')s.ko(a);
   else{a.grounded=false;a.y=300;step(s);}
   assert.equal(a.chainQueued,null);
  }
 });
}
test('down-light and aerial light retain directional identity without auto-chaining',()=>{
 const s=setup(),a=s.actors[0];step(s,{y:1,light:true});assert.equal(a.move?.id,'dl');assert.equal(a.move.chain,undefined);
 a.move=null;a.grounded=false;a.y=300;step(s);step(s,{light:true});assert.equal(s.actors[0].move?.id,'na');assert.equal(s.actors[0].move?.chain,undefined);
});
for(const f of FIGHTERS.filter(f=>f.id!=='omen'))for(const face of [-1,1])
 test(f.id+' advancing side chain facing '+face+' keeps all three strikes',()=>{
  const s=setup(f.id),a=s.actors[0],b=s.actors[1];a.face=face;b.x=a.x+55*face;s.config.feel='relaxed';
  step(s,{x:face,light:true});for(let n=0;n<120;n++)step(s,{x:face,light:!!a.move?.chain&&a.moveTick>=a.move.startup&&!a.chainQueued&&!a.previous.light});
  assert.deepEqual(a.history,['sl','l2','l3']);
 });
test('heavy archetypes differ in startup, geometry, movement, armor and projectile behavior',()=>{
 const [k,r,v,o]=FIGHTERS.map(f=>f.moves);
 assert(v.sh.startup<k.sh.startup&&k.sh.startup<r.sh.startup);assert(r.sh.damage>k.sh.damage&&k.sh.damage>v.sh.damage);
 assert(r.sh.armor&&!k.sh.armor&&!v.sh.armor);assert(v.sh.lift!<0);assert.equal(o.nh.projectile,'crystal');assert.equal(o.dh.projectile,'mine');
 assert.equal(new Set(FIGHTERS.map(f=>JSON.stringify(f.moves.sh.hitbox))).size,4);
});
test('lunges and vaults start on the first active tick, never during startup',()=>{
 for(const f of FIGHTERS.filter(f=>f.id!=='omen')){
  const s=setup(f.id),a=s.actors[0],m=f.moves.sh;s.startMove(a,'sh',emptyInput());
  for(let n=0;n<m.startup-1;n++){step(s);assert.equal(a.x,450);assert.equal(a.y,610);}
  step(s);assert(a.x>450);if(m.lift)assert(a.y<610);
 }
});
test('charged beams and left-facing stationary traps retain charge and facing',()=>{
 const s=setup('omen'),a=s.actors[0],b=s.actors[1];a.face=-1;a.charge=30;
 s.spawnProjectile(a,fighter('omen').moves.sh);const beam=s.projectiles[0];assert.equal(beam.charge,30);assert.equal(beam.face,-1);
 b.x=beam.x+beam.vx;b.y=beam.y+30;s.stepProjectiles();assert(b.damage>fighter('omen').moves.sh.damage);assert(b.vx<0);
 s.projectiles=[];a.charge=0;s.spawnProjectile(a,fighter('omen').moves.dh);const mine=s.projectiles[0];mine.arm=0;b.x=mine.x;b.y=mine.y+30;b.dodgeTime=0;s.stepProjectiles();assert(b.vx<0);
});
test('network v3 preserves followup moves, queued branch and charged projectile metadata',()=>{
 const s=setup('omen'),a=s.actors[0];s.startMove(a,'l2',emptyInput());a.chainQueued='sh';a.charge=23;s.spawnProjectile(a,fighter('omen').moves.sh);
 const state=snapshotSchema.parse(captureSnapshot(s,[],false)),guest=setup('omen');assert.equal(NETWORK_VERSION,3);assert(applySnapshot(guest,state));
 assert.equal(guest.actors[0].move,fighter('omen').moves.l2);assert.equal(guest.actors[0].chainQueued,'sh');assert.equal(guest.projectiles[0].charge,23);
});
for(const feel of ['classic','relaxed'] as const)for(const source of FIGHTERS)for(const target of FIGHTERS)for(const face of [-1,1])
 test(source.id+' versus '+target.id+' '+feel+' facing '+face+': neutral chain connects at low damage',()=>{
  const s=setup(source.id),a=s.actors[0],b=s.actors[1];s.config.feel=feel;a.face=face;b.x=a.x+55*face;b.slot.fighter=target.id;
  step(s,{light:true});
  for(let n=0;n<180;n++)step(s,{light:!!a.move?.chain&&a.moveTick>=a.move.startup&&!a.chainQueued&&!a.previous.light});
  assert.deepEqual(a.history,['nl','l2','l3']);
 });
test('every move maps to a real animation and each light chain has exactly three stages',()=>{
 const manifest=JSON.parse(readFileSync('public/assets/manifest.json','utf8'));
 for(const f of FIGHTERS){
  for(const m of Object.values(f.moves)){assert(manifest[f.id][m.animation]?.frames>0);if(m.chain)assert(m.chain.cancelRecovery>0&&m.chain.cancelRecovery<m.recovery);}
  assert.equal(f.moves.nl.chain?.next,'l2');assert.equal(f.moves.l2.chain?.next,'l3');assert.equal(f.moves.l3.chain,undefined);
 }
});
test('combo feedback reports queued light/heavy and never claims a hit count',()=>{
 const s=setup(),a=s.actors[0];s.startMove(a,'nl',emptyInput());assert.equal(comboReadout(a)?.hint,'TAP LIGHT AGAIN');
 a.chainQueued='l2';assert.equal(comboReadout(a)?.hint,'LIGHT QUEUED');
 s.startMove(a,'l2',emptyInput());assert.equal(comboReadout(a)?.hint,'LIGHT OR HEAVY');a.chainQueued='sh';assert.equal(comboReadout(a)?.hint,'HEAVY QUEUED');
 s.startMove(a,'l3',emptyInput());assert.equal(comboReadout(a)?.hint,'FINISHER');a.grounded=false;assert.equal(comboReadout(a),null);
});
test('CPU fighters use the same legal combo transitions in seeded matches',()=>{
 let chained=0;
 for(const difficulty of ['easy','medium','hard'] as const){
  const s=new Simulation({...defaultConfig,items:'off',mode:'timed',seconds:60,slots:FIGHTERS.map(f=>({fighter:f.id,difficulty,team:0}))});s.countdown=0;
  for(let n=0;n<6000&&!s.ended;n++){s.step(s.ai(s.actors[0]));chained+=s.events.filter(e=>e.kind==='attack'&&(e.move==='l2'||e.move==='l3')).length;}
  assert(s.ended);assert(s.actors.every(a=>Number.isFinite(a.damage+a.x+a.y)));
 }
 assert(chained>20);
});
