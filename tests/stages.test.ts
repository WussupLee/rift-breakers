import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../game/simulation';
import {STAGES,STAGE,stageDefinition,defaultConfig,FIGHTERS,emptyInput,type StageId} from '../game/data';
import {frameFighters,worldToScreen,cameraHud} from '../game/camera';
import {nearBlast} from '../game/danger';
import {configSchema} from '../game/network-protocol';
const setup=(stage:StageId)=>{const s=new Simulation({...defaultConfig,stage,items:'off'});s.countdown=0;return s;};
test('Default arena is unchanged; factory has a wider deck and three distinct routes',()=>{
 assert.equal(stageDefinition(),STAGE);assert.deepEqual(STAGE.platforms,[{x:160,y:610,width:680,oneWay:false},{x:380,y:425,width:240,oneWay:true}]);
 const f=stageDefinition('neon-foundry');assert.equal(f.platforms.length,4);assert(f.platforms[0].width>STAGE.platforms[0].width*1.25);assert.equal(new Set(f.platforms.map(p=>p.y)).size,4);
});
for(const stage of STAGES){
 test(`${stage.name}: spawns, sudden death and protected respawn use selected geometry`,()=>{
  const s=setup(stage.id),a=s.actors[0];assert.equal(a.x,stage.spawns[0]);assert.equal(a.y,stage.platforms[0].y);
  a.platform=2;s.resolveTime();assert(s.sudden);assert.equal(a.platform,0);assert.equal(a.y,stage.platforms[0].y);
  a.respawn=1;s.stepActor(a,emptyInput());assert.equal(a.x,stage.spawns[0]);assert(a.y<Math.min(...stage.platforms.map(p=>p.y)));assert(a.invulnerable>0);
 });
 for(const def of FIGHTERS)for(const [index,p]of stage.platforms.entries())test(`${stage.name}: ${def.id} lands on platform ${index} and drops only through one-way surfaces`,()=>{
  const s=setup(stage.id),a=s.actors[0];a.slot.fighter=def.id;Object.assign(a,{x:p.x+p.width/2,y:p.y-5,grounded:false,vy:10,airJumps:0,recoveryUsed:true});
  s.stepActor(a,emptyInput());assert.equal(a.y,p.y);assert.equal(a.platform,index);assert(a.grounded);assert.equal(a.airJumps,2);assert(!a.recoveryUsed);
  s.stepActor(a,{...emptyInput(),y:1,jump:true});assert(!a.grounded);if(p.oneWay){assert(a.y>p.y);assert(a.drop>0);}else{assert(a.y<p.y);assert.equal(a.drop,0);}
 });
 test(`${stage.name}: blast zones, recovery intent and item bounds are stage-specific`,()=>{
  const s=setup(stage.id),a=s.actors[0],deck=stage.platforms[0];a.x=deck.x+deck.width-25;a.y=deck.y;s.ai(a);assert.notEqual(a.aiIntent,'Recover');
  a.aiNext=0;a.x=deck.x+deck.width+30;a.y=deck.y+50;assert.equal(s.ai(a).x,-1);assert.equal(a.aiIntent,'Recover');
  a.x=stage.blast.right+1;s.step(emptyInput(),s.actors.map(()=>emptyInput()));assert.equal(a.stocks,defaultConfig.stocks-1);
  for(let i=0;i<100;i++)s.spawnItem();assert(s.items.every(i=>i.x>deck.x&&i.x<deck.x+deck.width));
 });
 for(const [width,height]of [[390,390],[844,310],[1280,720]])test(`${stage.name}: anchored ${width}×${height} camera contains every playable surface`,()=>{
  const s=setup(stage.id),hud=cameraHud(width,height),c=frameFighters(s.actors,width,height,hud,stage);
  for(const p of stage.platforms){const left=worldToScreen(p.x,p.y-65,c,width,height),right=worldToScreen(p.x+p.width,p.y,c,width,height);assert(left.x>=0&&right.x<=width);assert(left.y>=hud-1);assert(right.y<height);}
  s.actors[0].x=stage.blast.right;const danger=frameFighters(s.actors,width,height,hud,stage);assert.equal(danger.x,c.x);assert(danger.zoom>=c.zoom*.84-.001);
 });
}
test('Factory warnings use factory blast limits, not the original arena',()=>{
 const a={x:1035,y:650,vx:0,vy:0};assert(nearBlast(a,STAGE));assert(!nearBlast(a,stageDefinition('neon-foundry')));
});
test('Network config round-trips both maps and rejects unrecognized maps',()=>{
 const config={...defaultConfig,feel:'relaxed',slots:defaultConfig.slots.map(s=>({...s,name:'Test',human:true}))};
 for(const stage of STAGES)assert.equal(configSchema.parse({...config,stage:stage.id}).stage,stage.id);
 assert(!configSchema.safeParse({...config,stage:'missing'}).success);
});
for(const difficulty of ['easy','medium','hard'] as const)test(`Factory ${difficulty} four-fighter seeded soak stays finite, fights and finishes`,()=>{
 const config={...defaultConfig,stage:'neon-foundry' as const,feel:'relaxed' as const,mode:'timed' as const,seconds:60,items:'normal' as const,slots:FIGHTERS.map((f,i)=>({fighter:f.id,difficulty,team:i%2}))};
 const a=new Simulation(config),b=new Simulation(config);a.countdown=b.countdown=0;
 for(let n=0;n<15000&&!a.ended;n++){a.step(a.ai(a.actors[0]));b.step(b.ai(b.actors[0]));for(const f of a.actors)assert(Number.isFinite(f.x+f.y+f.damage)&&f.airJumps>=0);}
 assert(a.ended);assert(a.actors.reduce((n,f)=>n+f.damageDone,0)>100);assert.deepEqual(a.actors,b.actors);assert(a.items.length<20&&a.projectiles.length<50);
});
