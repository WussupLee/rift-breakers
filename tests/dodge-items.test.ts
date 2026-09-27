import test from 'node:test';
import assert from 'node:assert/strict';
import {DODGE} from '../game/dodge';
import {Simulation} from '../game/simulation';
import {defaultConfig,emptyInput} from '../game/data';
const setup=()=>{const s=new Simulation({...structuredClone(defaultConfig),items:'off'});s.countdown=0;return s;};
const step=(s:Simulation,input={})=>s.step(emptyInput(),[{...emptyInput(),...input},emptyInput()]);

test('spot, aerial and moving ground dodges protect for the full declared window',()=>{
 for(const airborne of [false,true]){const s=setup(),a=s.actors[0];if(airborne){a.grounded=false;a.y=350;}
  step(s,{dodge:true,x:airborne?1:0});assert.equal(a.dodgeTime,DODGE.invulnerableTicks);
  for(let n=DODGE.invulnerableTicks;n>0;n--){assert.equal(a.dodgeTime,n);assert.equal(s.canHit(1,a),false);assert.equal(s.canHit(1,a,true),false);step(s);}
  assert.equal(s.canHit(1,a),true);
 }
 const s=setup(),a=s.actors[0];step(s,{dodge:true,x:1});assert.equal(a.dodgeTime,DODGE.invulnerableTicks);assert.equal(s.canHit(1,a),false);
});
test('gravity cancel ends protection immediately',()=>{const s=setup(),a=s.actors[0];a.grounded=false;a.y=350;step(s,{dodge:true});step(s,{light:true});assert.equal(a.move?.id,'nl');assert.equal(s.canHit(1,a),true);});
test('resting items auto-collect for humans and CPUs, and throw releases ownership',()=>{
 for(const index of [0,1])for(const kind of ['bomb','spike'] as const){const s=setup(),a=s.actors[index];s.spawnItem(kind,a.x);const it=s.items[0];it.y=a.y-9;s.stepItems();assert.equal(a.held,it.id);assert.equal(it.heldBy,index);s.useItem(a,{...emptyInput(),x:1});assert.equal(a.held,null);assert.equal(it.armed,true);s.stepItems();assert.equal(a.held,null);}
});
test('repair auto-consumes once, while dangerous or unavailable items never auto-collect',()=>{
 const s=setup(),a=s.actors[0];a.damage=60;s.spawnItem('repair',a.x);s.items[0].y=a.y-9;s.stepItems();assert.equal(a.damage,35);assert.equal(s.items.length,0);s.stepItems();assert.equal(a.damage,35);
 for(const state of ['armed','airborne','grace','stun','respawn','out','occupied','expired'] as const){const s=setup(),a=s.actors[0];s.spawnItem('bomb',a.x);const it=s.items[0];it.y=a.y-9;
  if(state==='armed'){it.armed=true;it.fuse=90;it.grace=10;}if(state==='airborne')it.y-=60;if(state==='grace')it.grace=30;if(state==='stun')a.stun=20;if(state==='respawn')a.respawn=20;if(state==='out')a.out=true;if(state==='occupied')a.held=999;if(state==='expired')it.life=0;
  s.stepItems();assert.notEqual(a.held,it.id,state);
 }
});
