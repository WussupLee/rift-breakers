import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.QA_URL||'http://127.0.0.1:4173/rift-breakers/';
await mkdir('work/qa/dodge',{recursive:true});
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+'?debug');await page.locator('main:not([inert])').waitFor();await page.getByRole('button',{name:/LET.S PLAY/}).tap();await page.getByRole('button',{name:'CHOOSE ARENA'}).tap();await page.getByRole('button',{name:'PLAY NOW',exact:true}).tap();await page.waitForFunction(()=>window.rift?.simulation.tick>155);
  const button=page.getByRole('button',{name:'Y DODGE',exact:true});
  for(const id of ['kairo','regent','vexa','omen']){
   await page.evaluate(id=>{const {simulation:s,bridge}=window.rift;bridge.paused=true;bridge.settings.flashes=true;bridge.input.clear();s.items=[];s.projectiles=[];s.events=[];s.ended=false;s.actors.forEach((a,i)=>Object.assign(a,{x:400+i*220,y:610,px:400+i*220,py:610,vx:0,vy:0,stun:0,freeze:0,move:null,grounded:true,out:false,respawn:0,invulnerable:0,dodgeTime:0,dodgeCD:0,dodgeAge:99,damage:0,buffers:{},previous:{x:0,y:0,jump:false,light:false,heavy:false,dodge:false,item:false}}));s.actors[0].slot.fighter=id;bridge.onUpdate(s);},id);
   await page.locator('.dodge[data-dodge-state=ready]').waitFor();
   if(name==='chromium'){
    const cdp=await context.newCDPSession(page),p=await page.locator('.dpad').boundingBox(),b=await button.boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x+p.width*.87,y:p.y+p.height*.5,id:1},{x:b.x+b.width*.5,y:b.y+b.height*.5,id:2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
   }else {await page.evaluate(()=>window.rift.bridge.input.press(901,'right'));await button.tap();}
   const result=await page.evaluate(()=>{const {simulation:s,bridge}=window.rift,input=bridge.input.sample();bridge.input.clear();s.step(input,[input,{x:0,y:0,jump:false,light:false,heavy:false,dodge:false,item:false}]);bridge.onUpdate(s);return {input,time:s.actors[0].dodgeTime,canHit:s.canHit(1,s.actors[0])};});
   assert.equal(result.input.x,1);assert.equal(result.input.dodge,true);assert.equal(result.time,16);assert.equal(result.canHit,false);
   await page.locator('.dodge[data-dodge-state=active]').waitFor();assert.equal(await page.locator('.dodge-readout').innerText(),'SAFE');
   await page.waitForTimeout(60);assert.equal(await page.evaluate(()=>window.rift.scene.sprites[0].tintFill),true);assert.equal(await page.evaluate(()=>window.rift.scene.sprites[0].alpha),.6);
   const evasion=await page.evaluate(()=>{const {simulation:s,bridge,scene}=window.rift,a=s.actors[0],b=s.actors[1];s.stepActor(b,{x:0,y:0,jump:false,light:true,heavy:false,dodge:false,item:false});b.moveTick=b.move.startup;b.face=1;b.x=a.x-b.move.hitbox.x;b.y=a.y;s.resolveAttack(b);const evades=s.events.filter(e=>e.kind==='evade');evades.forEach(e=>scene.effect(e));b.move=null;bridge.onUpdate(s);return {damage:a.damage,evades:evades.length,text:scene.children.list.some(c=>c.text==='EVADED')};});
   assert.deepEqual(evasion,{damage:0,evades:1,text:true});await page.screenshot({path:'work/qa/dodge/'+name+'-'+id+'.png'});
   await page.evaluate(()=>{const {simulation:s,bridge}=window.rift,z={x:0,y:0,jump:false,light:false,heavy:false,dodge:false,item:false};for(let i=0;i<16;i++)s.step(z,[z,z]);bridge.onUpdate(s);});
   await page.locator('.dodge[data-dodge-state=cooldown]').waitFor();assert.match(await page.locator('.dodge-readout').innerText(),/^\d\.\ds$/);
   assert(await page.evaluate(()=>window.rift.simulation.canHit(1,window.rift.simulation.actors[0])));
   await page.waitForTimeout(40);assert.equal(await page.evaluate(()=>window.rift.scene.sprites[0].isTinted),false);
   await page.evaluate(()=>{const {simulation:s,bridge}=window.rift;bridge.settings.flashes=false;s.actors[0].dodgeTime=16;s.actors[0].dodgeAge=0;bridge.onUpdate(s);});
   await page.waitForTimeout(40);assert.equal(await page.evaluate(()=>window.rift.scene.sprites[0].isTinted),false);assert.equal(await page.evaluate(()=>window.rift.scene.sprites[0].alpha),.6);
  }
  assert.deepEqual(errors,[]);console.log('PASS '+name+': all four fighters, moving-ground touch dodge, 16 protected frames, SAFE/cooldown, confirmed EVADED, reduced flashes; no browser errors.');
  await context.close();
 }finally{await browser.close();}
}
