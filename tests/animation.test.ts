import test from 'node:test';
import assert from 'node:assert/strict';
import {AnimationDirector,ATTACK_POSES,MOTION_STATES} from '../game/animation';
import {Simulation} from '../game/simulation';
import {FIGHTERS,defaultConfig,emptyInput,type Animation} from '../game/data';
import {captureSnapshot,applySnapshot} from '../game/network-protocol';
const frames:Record<Animation,number>={idle:8,run:8,jump:3,fall:3,attack1:7,attack2:7,attack3:7,hurt:3,death:8};
const setup=()=>{const s=new Simulation({...defaultConfig,items:'off'});s.countdown=0;return {s,a:s.actors[0],d:new AnimationDirector()};};
test('40 animation states per fighter cover 27 motion states and 13 distinct attacks',()=>{assert.equal(MOTION_STATES.length,27);assert.equal(Object.keys(ATTACK_POSES).length,13);assert.equal(new Set(Object.values(ATTACK_POSES)).size,13);});
for(const def of FIGHTERS)for(const move of Object.values(def.moves))for(const face of [-1,1])test(`${def.id}/${move.id}/${face}: pose phases match authored attack timing`,()=>{
 const {a,d}=setup();a.slot.fighter=def.id;a.face=face;a.move=move;
 for(let tick=0;tick<move.startup+move.active+move.recovery;tick++){
  a.moveTick=tick;const p=d.sample(a,tick,frames),active=tick>=move.startup&&tick<move.startup+move.active;
  assert.equal(p.active,active);assert.equal(p.phase,tick<move.startup?'startup':active?'active':'recovery');
  if(tick<move.startup)assert.equal(p.frame,ATTACK_POSES[move.id]);
  if(active){assert.equal(p.animation,'motion');assert.equal(p.frame,ATTACK_POSES[move.id]+1);assert(p.trail);}
  assert(Number.isFinite(p.angle+p.dx+p.dy+p.sx+p.sy));assert(p.sx>.75&&p.sy>.75);
 }
});
test('Animation sampling never changes gameplay state or extends the attack',()=>{const {a,s,d}=setup();a.move=FIGHTERS[0].moves.sh;a.moveTick=17;const before=JSON.stringify(captureSnapshot(s,[],false));for(let i=0;i<1000;i++)d.sample(a,i/4,frames);assert.equal(JSON.stringify(captureSnapshot(s,[],false)),before);});
test('Hard hits fly sideways, tumble fully, freeze during hitstop and settle when control returns',()=>{
 const {a,d}=setup();Object.assign(a,{grounded:false,stun:40,vx:16,vy:0,freeze:6});d.event({kind:'hit',actor:0,x:a.x,y:a.y,color:'#ffffff',power:16},a,0);
 const start=d.sample(a,0,frames);assert.equal(start.state,'launch');assert.equal(start.angle,90);assert(start.center);
 assert.deepEqual(d.sample(a,5,frames),start);a.freeze=0;
 const angles=[];for(let tick=6;tick<38;tick++)angles.push(d.sample(a,tick,frames).angle);assert(Math.max(...angles)-Math.min(...angles)>=360);assert.equal(d.sample(a,38,frames).state,'tumble');a.stun=0;assert.equal(d.sample(a,39,frames).state,'airRecover');
});
test('Reduced motion keeps hit direction readable without spins, squash or echoes',()=>{const {a,d}=setup();Object.assign(a,{grounded:false,stun:40,vx:16,vy:-4});d.event({kind:'hit',actor:0,x:0,y:0,color:'#ffffff',power:16},a,0);for(let tick=0;tick<30;tick++){const p=d.sample(a,tick,frames,true);assert(Math.abs(p.angle)<=15);assert.equal(p.sx,1);assert.equal(p.sy,1);assert(!p.trail);}});
test('Run phase depends on travelled distance and pause does not advance animation',()=>{const {a,d}=setup();a.vx=5;d.sample(a,0,frames);for(let n=1;n<20;n++){a.x+=5;d.sample(a,n,frames);}const p=d.sample(a,20,frames);for(let i=0;i<100;i++)assert.deepEqual(d.sample(a,20,frames),p);});
test('Movement transitions include brake, pivot, landing, air-jump, throw and pickup',()=>{const {a,d}=setup();a.vx=4;d.sample(a,0,frames);a.vx=0;assert.equal(d.sample(a,1,frames).state,'brake');a.vx=-4;a.face=-1;assert.equal(d.sample(a,2,frames).state,'turn');a.vx=0;a.landing=6;d.event({kind:'land',actor:0,x:0,y:0,color:'#fff',power:15},a,3);assert.equal(d.sample(a,3,frames).state,'heavyLand');a.landing=0;a.grounded=false;a.airJumps=1;d.event({kind:'jump',actor:0,x:0,y:0,color:'#fff',power:1},a,4);assert.equal(d.sample(a,4,frames).state,'airJump');for(const cue of ['throw','pickup'] as const){d.event({kind:'item',cue,actor:0,x:0,y:0,color:'#fff',power:1},a,5);assert.equal(d.sample(a,5,frames).state,cue);}});
test('Network carries wall, spot dodge and directional intent for guest micro-animations',()=>{const {a,s}=setup(),other=new Simulation(defaultConfig);a.wall=-1;a.spot=true;a.previous={...emptyInput(),y:1};assert(applySnapshot(other,captureSnapshot(s,[],false)));assert.equal(other.actors[0].wall,-1);assert.equal(other.actors[0].spot,true);assert.equal(other.actors[0].previous.y,1);});
test('Aerial attacks have character-specific reach, timing and projectile identity',()=>{for(const key of ['na','sa','da'] as const){assert.equal(new Set(FIGHTERS.map(f=>JSON.stringify([f.moves[key].startup,f.moves[key].recovery,f.moves[key].hitbox,f.moves[key].projectile]))).size,4);}assert.equal(FIGHTERS[3].moves.sa.projectile,'bolt');assert.equal(FIGHTERS[3].moves.da.projectile,'shard');});
