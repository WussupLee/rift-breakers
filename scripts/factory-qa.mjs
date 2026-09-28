import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.QA_URL||'http://127.0.0.1:4173/rift-breakers/';
await mkdir('work/qa/factory',{recursive:true});
for(const [name,engine]of Object.entries({chromium,webkit}).filter(([n])=>!process.env.QA_ENGINE||n===process.env.QA_ENGINE)){
 const browser=await engine.launch();try{for(const [width,height]of [[1440,1000],[390,844],[320,568],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status());});
  await page.goto(base+'?debug');await page.locator('main:not([inert])').waitFor();await page.getByRole('button',{name:/LET.S PLAY/}).click();await page.getByRole('button',{name:'CHOOSE ARENA'}).click();
  await page.getByRole('button',{name:/Neon Foundry/}).click();
  assert.equal(await page.locator('.stage-info h2').innerText(),'Neon Foundry');assert.equal(await page.locator('.station-preview-platform').count(),4);
  assert(await page.locator('.station-preview-sky').evaluate(async img=>{await img.decode();return img.naturalWidth===640&&img.src.includes('factory');}));
  const button=await page.getByRole('button',{name:'PLAY NOW',exact:true}).boundingBox();assert(button&&button.y+button.height<=height+1,'Play button fits device');
  if(width<1000)assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'No page scrolling');
  await page.screenshot({path:`work/qa/factory/${name}-${width}-select.png`});
  await page.getByRole('button',{name:'PLAY NOW',exact:true}).click();await page.waitForFunction(()=>window.rift?.simulation.tick>185,{},{timeout:60000});
  const state=await page.evaluate(()=>{const {simulation:s,scene,bridge}=window.rift;bridge.paused=true;const art=scene.station,before=JSON.stringify(s.actors),count=scene.children.length;
   const draw=t=>art.draw(t,scene.cameras.main.zoom,scene.scale.width,scene.scale.height,scene.cameraState.x,scene.cameraState.y);
   draw(120);const a=[...art.atmosphere.commandBuffer];draw(320);const moving=JSON.stringify(a)!==JSON.stringify(art.atmosphere.commandBuffer);
   for(let i=0;i<500;i++)draw(i*17);
   return {stage:s.config.stage,texture:art.background.texture.key,platforms:art.platforms.map(p=>({x:p.x,y:p.y,width:Math.round(p.displayWidth)})),geometry:s.stage.platforms.map(({x,y,width})=>({x,y,width})),moving,unchanged:before===JSON.stringify(s.actors),bounded:count===scene.children.length};
  });assert.equal(state.stage,'neon-foundry');assert.equal(state.texture,'factory-background');assert.deepEqual(state.platforms,state.geometry);assert(state.moving&&state.unchanged&&state.bounded);
  await page.screenshot({path:`work/qa/factory/${name}-${width}-match.png`});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.rift.scene.station.motion.matches);assert(await page.evaluate(()=>{const {scene}=window.rift,art=scene.station;const draw=t=>art.draw(t,scene.cameras.main.zoom,scene.scale.width,scene.scale.height);draw(120);const a=JSON.stringify(art.atmosphere.commandBuffer);draw(400);return a===JSON.stringify(art.atmosphere.commandBuffer);}),'Reduced motion freezes machinery');
  await page.getByRole('button',{name:'Pause match',exact:true}).click();await page.getByRole('button',{name:'Restart match',exact:true}).click();await page.waitForFunction(()=>window.rift?.simulation.tick>150);assert.equal(await page.evaluate(()=>window.rift.simulation.config.stage),'neon-foundry');
  assert.deepEqual(errors,[]);console.log(`PASS ${name} ${width}×${height}: factory selection, no-scroll controls, geometry, cosmetic animation, reduced motion and restart.`);await context.close();
 }}finally{await browser.close();}
}
