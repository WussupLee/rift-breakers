import test from 'node:test';import assert from 'node:assert/strict';
import {Simulation} from '../game/simulation';
import {defaultConfig,FIGHTERS,STAGE} from '../game/data';
import {frameFighters,cameraHud} from '../game/camera';
import {fighterWarnings,nearBlast,WARNING_WIDTH,WARNING_HEIGHT} from '../game/danger';
const setup=()=>new Simulation({...structuredClone(defaultConfig),slots:FIGHTERS.map((f,i)=>({fighter:f.id,difficulty:'medium',team:i%2}))});
test('KO warnings use all four true blast limits, not viewport edges',()=>{
 const b=STAGE.blast;
 for(const [x,y] of [[b.left+149,500],[b.right-149,500],[500,b.top+149],[500,b.bottom-149]])assert(nearBlast({x,y,vx:0,vy:0}));
 assert(!nearBlast({x:30,y:600,vx:0,vy:0}));assert(!nearBlast({x:500,y:610,vx:0,vy:0}));
 assert(nearBlast({x:30,y:600,vx:-20,vy:0}));assert(!nearBlast({x:30,y:600,vx:20,vy:0}));
 assert(nearBlast({x:500,y:810,vx:0,vy:20}));assert(!nearBlast({x:500,y:810,vx:0,vy:-20}));
});
for(const [width,height] of [[320,256],[390,592],[524,390],[1280,720]]){
 test(`warnings stay within safe bounds, legible and nonoverlapping for four fighters at ${width}x${height}`,()=>{
  for(const [x,y] of [[-160,500],[1160,500],[500,-190],[500,1000],[-160,1000]]){
   const s=setup();s.actors.forEach(a=>{a.x=x;a.y=y;a.grounded=false;});
   const c=frameFighters(s.actors,width,height),hud=cameraHud(width,height),warnings=fighterWarnings(s.actors,2,c,width,height,hud);
   assert.equal(warnings.length,4);assert.equal(warnings[0].id,2);assert.equal(warnings[0].local,true);
   for(const w of warnings){
    assert(w.danger);assert.equal(w.color,'#ff635e');assert(!('title' in w)&&!('message' in w));assert(w.x-WARNING_WIDTH/2>=0&&w.x+WARNING_WIDTH/2<=width);
    assert(w.y-WARNING_HEIGHT/2>=hud&&w.y+WARNING_HEIGHT/2<=height);
    for(const q of warnings)if(q.id!==w.id)assert(Math.abs(q.x-w.x)>=WARNING_WIDTH+4||Math.abs(q.y-w.y)>=WARNING_HEIGHT+4);
   }
  }
 });
}
test('all characters get yellow offscreen previews; dead/respawning fighters never create false alarms',()=>{
 const s=setup(),c=frameFighters(s.actors,390,592),hud=cameraHud(390,592);
 assert.deepEqual(fighterWarnings(s.actors,0,c,390,592,hud),[]);
 for(const a of s.actors){a.x=-10;a.y=500;a.grounded=false;const w=fighterWarnings(s.actors,a.id,c,390,592,hud).find(w=>w.id===a.id);assert(w);assert.equal(w.color,'#ffe45b');assert(w.offscreen);}
 s.actors.forEach((a,i)=>{a.x=-175;if(i%2)a.out=true;else a.respawn=60;});
 assert.deepEqual(fighterWarnings(s.actors,0,c,390,592,hud),[]);
});
test('warning calculation cannot move a fighter or alter KO limits',()=>{
 const s=setup();s.actors[0].x=STAGE.blast.right-1;
 const before=JSON.stringify(s.actors),bounds=JSON.stringify(STAGE);
 fighterWarnings(s.actors,0,frameFighters(s.actors,390,592),390,592,142);
 assert.equal(JSON.stringify(s.actors),before);assert.equal(JSON.stringify(STAGE),bounds);
});

test('visible fighters do not need an ordinary recovery marker',()=>{
 const s=setup();s.actors[0].x=100;s.actors[0].y=730;s.actors[0].grounded=false;
 const c=frameFighters(s.actors,390,592);
 assert(!fighterWarnings(s.actors,0,c,390,592,142).some(w=>w.id===0));
});
test('both opponents and local fighters use only yellow or red rings regardless of character color',()=>{
 const s=setup(),c=frameFighters(s.actors,390,592);
 s.actors.forEach(a=>{a.x=-10;a.y=500;});
 assert(fighterWarnings(s.actors,1,c,390,592,142).every(w=>w.color==='#ffe45b'));
 s.actors.forEach(a=>a.x=-170);
 assert(fighterWarnings(s.actors,1,c,390,592,142).every(w=>w.color==='#ff635e'));
 assert.equal(WARNING_WIDTH,34);assert.equal(WARNING_HEIGHT,34);
});
