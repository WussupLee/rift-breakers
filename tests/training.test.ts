import test from 'node:test';
import assert from 'node:assert/strict';
import {TrainingSimulation,trainingConfig} from '../game/training';
import {Simulation} from '../game/simulation';
import {FIGHTERS,STAGES,defaultConfig,emptyInput} from '../game/data';

test('Training makes a separate two-fighter sandbox without mutating normal match rules',()=>{
 const normal={...structuredClone(defaultConfig),mode:'timed' as const,teams:true,items:'normal' as const};
 normal.slots.push({...normal.slots[1]},{...normal.slots[1]});const before=JSON.stringify(normal);
 const config=trainingConfig(normal),s=new TrainingSimulation(normal);
 assert.equal(JSON.stringify(normal),before);assert.equal(config.slots.length,2);
 assert.equal(config.items,'off');assert.equal(config.teams,false);assert.equal(config.mode,'stock');assert.equal(s.countdown,0);
 assert.equal(s.config.slots[0].human,true);assert.equal(s.config.slots[1].human,false);
});

for(const stage of STAGES)for(const f of FIGHTERS)test(`Training ${stage.id}/${f.id}: unlimited KOs, correct respawn resources and full reset`,()=>{
 const config=trainingConfig({...defaultConfig,stage:stage.id});config.slots[0].fighter=f.id;config.slots[1].fighter=f.id;
 const s=new TrainingSimulation(config);s.startingDamage=100;s.reset();const time=s.time;
 for(let n=0;n<7;n++){
  for(const a of s.actors){a.x=stage.blast.right+100;a.stocks=1;a.held=null;a.recoveryUsed=true;a.airJumps=0;}
  s.step(emptyInput(),[emptyInput(),emptyInput()]);
  assert(!s.ended);assert(s.actors.every(a=>!a.out&&a.respawn>0));assert.equal(s.actors[1].damage,100);
  for(let i=0;i<46;i++)s.step(emptyInput(),[emptyInput(),emptyInput()]);
  assert(s.actors.every(a=>!a.out&&a.respawn===0&&a.airJumps===2&&!a.recoveryUsed));
 }
 assert.equal(s.time,time);assert.deepEqual(s.winners,[]);
 const a=s.actors[0];s.startMove(a,'sh',emptyInput());a.chainQueued='l2';a.dodgeCD=130;a.history=['sh'];a.buffers.jump=5;s.spawnItem('bomb');s.spawnProjectile(a,FIGHTERS[3].moves.sl);
 s.reset();assert(s.actors.every(a=>a.move===null&&a.dodgeCD===0&&a.chainQueued===null&&a.held===null&&a.history.length===0&&Object.keys(a.buffers).length===0));
 assert.equal(s.projectiles.length,0);assert.equal(s.items.length,0);assert.equal(s.actors[0].x,stage.spawns[0]);assert.equal(s.actors[1].damage,100);assert.equal(s.stats.hits,0);
});

test('Stationary dummy remains passive; jump and dodge use normal input transitions and cooldowns',()=>{
 const s=new TrainingSimulation(defaultConfig),dummy=s.actors[1],start=dummy.x;
 for(let i=0;i<150;i++)s.step();
 assert.equal(dummy.x,start);assert.equal(dummy.damage,0);assert.equal(s.actors[0].damage,0);assert.equal(dummy.move,null);
 s.behavior='jump';s.step();assert(dummy.vy<0);assert.equal(dummy.previous.jump,true);
 s.step();assert.equal(dummy.previous.jump,false);
 s.behavior='dodge';s.reset();s.step();assert(s.actors[1].dodgeTime>0);
 const firstCD=s.actors[1].dodgeCD;s.step();assert.equal(s.actors[1].previous.dodge,false);assert(s.actors[1].dodgeCD<firstCD);
});
test('Fight-back dummy uses existing CPU AI with selected difficulty and normal moves',()=>{
 for(const difficulty of ['easy','medium','hard'] as const){
  const c=trainingConfig(defaultConfig);c.slots[1].difficulty=difficulty;const s=new TrainingSimulation(c);s.behavior='cpu';s.actors[0].x=s.actors[1].x-50;
  let attacks=0;for(let i=0;i<900;i++){s.step();attacks+=s.events.filter(e=>e.kind==='attack'&&e.actor===1).length;}
  assert(attacks>0);assert(!s.ended);
 }
});
test('Practice stats count landed player hits, exact damage after decay, and projectile move names',()=>{
 const s=new TrainingSimulation(defaultConfig),dummy=s.actors[1],m=FIGHTERS[0].moves.nl;
 for(let n=0;n<2;n++)s.hit(dummy,0,m.damage,m.base,m.scaling,m.angle,1,0,m.id);
 assert.equal(s.stats.hits,2);assert.equal(s.stats.totalDamage,dummy.damage);assert(s.stats.lastDamage<m.damage);assert.equal(s.stats.lastMove,m.name);
 s.hit(s.actors[0],1,5,2,.02,-20,-1);assert.equal(s.stats.hits,2);
 s.config.slots[0].fighter='omen';s.reset();const bolt=FIGHTERS[3].moves.sa;s.hit(s.actors[1],0,bolt.damage,bolt.base,bolt.scaling,bolt.angle,1,0,bolt.id);
 assert.equal(s.stats.lastMove,'Forward burst');assert.equal(s.stats.hits,1);
 s.startingDamage=150;s.reset();assert.equal(s.actors[1].damage,150);assert.equal(s.stats.totalDamage,0);
});
test('Training cannot end in victory or sudden death; ordinary stock matches still end',()=>{
 const s=new TrainingSimulation(defaultConfig);s.resolveTime();s.checkVictory();assert(!s.ended&&!s.sudden);
 const normal=new Simulation({...defaultConfig,stocks:1});normal.ko(normal.actors[1]);normal.checkVictory();assert(normal.ended);assert.deepEqual(normal.winners,[0]);
});
