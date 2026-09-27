import test from 'node:test';import assert from 'node:assert/strict';
import {Simulation} from '../game/simulation';
import {FIGHTERS,defaultConfig,emptyInput} from '../game/data';
import {FEEL,resolveFeel,scaledDelta,FIXED_STEP_MS,type FeelMode} from '../game/feel';
import {frameFighters,easeCamera} from '../game/camera';
import {TouchHaptics} from '../game/haptics';
const setup=(feel:FeelMode)=>{const s=new Simulation({...structuredClone(defaultConfig),feel,items:'off'});s.countdown=0;return s;};
const step=(s:Simulation,input={})=>s.step(emptyInput(),[{...emptyInput(),...input},emptyInput()]);
test('auto feel is relaxed on touch; manual preference wins',()=>{assert.equal(resolveFeel('auto',true),'relaxed');assert.equal(resolveFeel('auto',false),'classic');assert.equal(resolveFeel('classic',true),'classic');assert.equal(resolveFeel('relaxed',false),'relaxed');});
test('fixed-tick pacing slows the entire simulation by 15%, not individual fighters',()=>{for(const mode of ['classic','relaxed'] as const){let acc=0,ticks=0;for(let i=0;i<600;i++){acc+=scaledDelta(FIXED_STEP_MS,mode);while(acc>=FIXED_STEP_MS){acc-=FIXED_STEP_MS;ticks++;}}assert(Math.abs(ticks-600*FEEL[mode].speed)<1.01);}assert.equal(scaledDelta(500,'relaxed'),85);assert.equal(scaledDelta(-10,'relaxed'),0);});
for(const f of FIGHTERS)test(`${f.id}: relaxed jump stays airborne longer and reaches higher`,()=>{
 const result=(feel:FeelMode)=>{const s=setup(feel),a=s.actors[0];a.slot.fighter=f.id;let apex=a.y,ticks=0;step(s,{jump:true});do{step(s);apex=Math.min(apex,a.y);ticks++;}while(!a.grounded&&ticks<180);assert(a.grounded);return{apex,ticks};};
 const classic=result('classic'),relaxed=result('relaxed');assert(relaxed.apex<classic.apex);assert(relaxed.ticks>classic.ticks);assert(relaxed.ticks<classic.ticks*1.3);
});
test('relaxed ledge grace saves a slightly late jump without extra air jumps',()=>{for(const mode of ['classic','relaxed'] as const){const s=setup(mode),a=s.actors[0];a.x=850;a.vx=6;a.airJumps=0;step(s,{x:1});for(let i=0;i<5;i++)step(s);step(s,{jump:true});assert.equal(a.vy<0,mode==='relaxed');assert.equal(a.airJumps,0);}});
test('early attack input is retained longer but never skips recovery',()=>{
 for(const mode of ['classic','relaxed'] as const){const s=setup(mode),a=s.actors[0],m=FIGHTERS[0].moves.nh;a.move=m;a.moveTick=m.startup+m.active+m.recovery-8;
  step(s,{light:true});assert.equal(a.move,m);for(let i=0;i<6;i++){step(s);assert.equal(a.move,m);}step(s);assert.equal(a.move?.id,mode==='relaxed'?'nl':undefined);
 }
});
test('fall assistance does not soften hitstun launch physics or remove fast-fall',()=>{
 for(const mode of ['classic','relaxed'] as const){const s=setup(mode),a=s.actors[0];a.grounded=false;a.y=250;a.vy=12;step(s);assert.equal(a.vy,mode==='relaxed'?11.5:12.54);a.y=250;a.vy=12;step(s,{y:1});assert(a.vy>12.5);}
 const a=setup('classic'),b=setup('relaxed');for(const s of [a,b]){s.actors[0].grounded=false;s.actors[0].y=200;s.actors[0].stun=20;s.actors[0].vy=10;step(s);}assert.equal(a.actors[0].vy,b.actors[0].vy);
});
test('all fighters, including CPUs, receive the same air assistance',()=>{const s=setup('relaxed');for(const a of s.actors){a.slot.fighter='kairo';a.grounded=false;a.y=200;a.vy=3;}s.step(emptyInput(),s.actors.map(()=>emptyInput()));assert.equal(s.actors[0].vy,s.actors[1].vy);});
test('relaxed four-fighter match stays finite and reaches a result',()=>{const s=new Simulation({...defaultConfig,feel:'relaxed',mode:'timed',seconds:60,items:'normal',slots:FIGHTERS.map((f,i)=>({fighter:f.id,difficulty:i===0?'hard':'medium',team:i%2}))});s.countdown=0;for(let i=0;i<8000&&!s.ended;i++){s.step(s.ai(s.actors[0]));for(const a of s.actors)assert(Number.isFinite(a.x+a.y+a.damage)&&a.airJumps>=0);}assert(s.ended);assert(s.actors.reduce((total,a)=>total+a.damageDone,0)>100);});
test('camera zooms out and tracks vertical recovery, ignoring eliminated fighters',()=>{const s=setup('classic');const close=frameFighters(s.actors,390,592);s.actors[0].x=-100;s.actors[1].x=1100;const wide=frameFighters(s.actors,390,592);assert(wide.zoom<close.zoom);s.actors[0].x=330;s.actors[1].x=670;s.actors[0].y=960;const low=frameFighters(s.actors,390,592);assert(low.y>close.y);s.actors[0].out=true;const out=frameFighters(s.actors,390,592);s.actors[0].y=-500;assert.deepEqual(frameFighters(s.actors,390,592),out);});
test('camera target keeps on-stage and offstage bodies clear of HUD and viewport edges',()=>{for(const [w,h] of [[390,592],[320,256],[1280,720]]){const s=setup('classic');s.actors[0].x=-100;s.actors[0].y=940;s.actors[1].x=1080;s.actors[1].y=200;const c=frameFighters(s.actors,w,h);for(const a of s.actors){const x=(a.x-c.x)*c.zoom+w/2,y=(a.y-c.y)*c.zoom+h/2;assert(x>0&&x<w);assert(y>80&&y<h);}}});
test('camera easing is frame-rate independent and zooms out faster than in',()=>{const start={x:500,y:470,zoom:.5},target={x:600,y:600,zoom:.3};let a=start,b=start;for(let i=0;i<60;i++)a=easeCamera(a,target,1000/60);for(let i=0;i<120;i++)b=easeCamera(b,target,1000/120);assert(Math.abs(a.x-b.x)<1e-8&&Math.abs(a.zoom-b.zoom)<1e-8);const out=easeCamera(start,target,16).zoom,inward=easeCamera(start,{...target,zoom:.7},16).zoom;assert(.5-out>inward-.5);});
test('haptic requests are subtle, opt-out, rate-limited, and safe when unsupported',()=>{
 const calls:number[]=[];const previous=Object.getOwnPropertyDescriptor(navigator,'vibrate');
 Object.defineProperty(navigator,'vibrate',{configurable:true,value:(n:number)=>{calls.push(n);return true;}});
 try{const h=new TouchHaptics();assert.equal(h.tap(false,0),false);assert(h.tap(true,0));assert.equal(h.tap(true,20),false);assert(h.tap(true,60));assert.deepEqual(calls,[6,6]);Object.defineProperty(navigator,'vibrate',{configurable:true,value:undefined});assert.equal(h.tap(true,120),false);}finally{if(previous)Object.defineProperty(navigator,'vibrate',previous);else Reflect.deleteProperty(navigator,'vibrate');}
});
