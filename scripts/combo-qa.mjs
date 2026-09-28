import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
const base=process.env.QA_URL||'http://127.0.0.1:4173/rift-breakers/';await mkdir('work/qa/combos',{recursive:true});
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));await context.addInitScript(()=>localStorage.setItem('rift-breakers-settings-v1',JSON.stringify({mute:true})));
  await page.goto(base+'?debug');await page.locator('main:not([inert])').waitFor();await page.getByRole('button',{name:/LET.S PLAY/}).click();
  await page.getByRole('button',{name:'CHOOSE ARENA'}).click();await page.getByRole('button',{name:'PLAY NOW',exact:true}).click();await page.waitForFunction(()=>window.rift?.simulation.tick>185);
  const reset=async(id)=>page.evaluate(id=>{
   const {simulation:s,bridge}=window.rift;bridge.paused=true;bridge.input.clear();s.ended=false;s.countdown=0;s.items=[];s.projectiles=[];
   s.actors.forEach((a,i)=>Object.assign(a,{x:450+i*55,px:450+i*55,y:610,py:610,vx:0,vy:0,grounded:true,face:i?-1:1,damage:0,move:null,moveTick:0,chainQueued:null,freeze:0,stun:0,out:false,respawn:0,invulnerable:0,dodgeTime:0,dodgeCD:0,history:[],hit:new Set(),previous:{x:0,y:0,jump:false,light:false,heavy:false,dodge:false,item:false},buffers:{}}));
   s.actors[0].slot.fighter=id;bridge.onUpdate(s);
  },id);
  // Sample once: pending touch taps must not be consumed before the authoritative step.
  const advance=async(count=1)=>page.evaluate(count=>{
   const {simulation:s,bridge,scene}=window.rift,z={x:0,y:0,jump:false,light:false,heavy:false,dodge:false,item:false};
   for(let i=0;i<count;i++){const input=bridge.input.sample();s.step(input,[input,z]);s.events.forEach(e=>scene.effect(e));}bridge.onUpdate(s);
  },count);
  const until=async(kind)=>{for(let i=0;i<100;i++){if(await page.evaluate(kind=>{const a=window.rift.simulation.actors[0];return kind==='active'?a.move&&a.moveTick>=a.move.startup:a.move?.id===kind;},kind))return;await advance();}throw Error('Did not reach '+kind);};
  const tap=async(action)=>{await page.getByRole('button',{name:action==='light'?'B LIGHT':'A HEAVY',exact:true}).tap();await advance();};
  for(const id of ['kairo','regent','vexa','omen']){
   await reset(id);await tap('light');await until('active');await tap('light');
   await page.getByText('LIGHT QUEUED',{exact:true}).waitFor();await until('l2');
   await page.locator('.combo-status[data-step="2"]').waitFor();await until('active');await tap('light');await until('l3');await until('active');
   await page.locator('.combo-status[data-step="3"]').waitFor();
   for(let n=0;n<12&&!(await page.evaluate(()=>window.rift.simulation.actors[0].history.includes('l3')));n++)await advance();
   assert.deepEqual(await page.evaluate(()=>window.rift.simulation.actors[0].history),['nl','l2','l3']);
   const box=await page.locator('.combo-status').boundingBox(),screen=await page.locator('.game-screen').boundingBox();
   assert(box.x>=0&&box.x+box.width<=390&&box.y+box.height<=screen.y+screen.height);
   await page.screenshot({path:'work/qa/combos/'+name+'-'+id+'-finisher.png'});await advance(80);await page.locator('.combo-status').waitFor({state:'hidden'});
   await reset(id);await tap('light');await until('active');await tap('light');await until('l2');await until('active');await tap('heavy');
   await page.getByText('HEAVY QUEUED',{exact:true}).waitFor();await until('nh');assert.equal(await page.evaluate(()=>window.rift.simulation.actors[0].moveTick),0);
   await until('active');await page.screenshot({path:'work/qa/combos/'+name+'-'+id+'-heavy.png'});
   if(id==='omen')assert(await page.evaluate(()=>window.rift.simulation.projectiles.some(p=>p.kind==='crystal')));
  }
  assert.deepEqual(errors,[]);console.log('PASS '+name+': real touch taps produce all four three-hit chains, queued feedback, heavy branches, new crystal and no runtime errors.');
 }finally{await browser.close();}
}
