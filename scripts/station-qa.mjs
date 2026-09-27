import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.QA_URL||'http://localhost:5173/';await mkdir('work/qa/station',{recursive:true});
for(const [name,engine] of Object.entries({chromium,webkit}).filter(([name])=>!process.env.QA_ENGINE||name===process.env.QA_ENGINE)){
 const browser=await engine.launch();
 try{for(const [width,height] of [[1440,1000],[390,844],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status());});
  await page.goto(base+'?debug');await page.locator('main:not([inert])').waitFor();await page.getByRole('button',{name:/LET.S PLAY/}).click();await page.getByRole('button',{name:'CHOOSE ARENA'}).click();
  assert(await page.locator('.station-preview-sky').evaluate(async img=>{await img.decode();return img.naturalWidth===640;}));await page.screenshot({path:`work/qa/station/${name}-${width}-select.png`});
  await page.getByRole('button',{name:'PLAY NOW',exact:true}).click();await page.waitForFunction(()=>window.rift?.simulation.tick>185,{},{timeout:60000}).catch(async e=>{console.log(errors,await page.locator('main').innerText());await page.screenshot({path:`work/qa/station/${name}-${width}-failure.png`});throw e;});
  const state=await page.evaluate(()=>{const {scene,bridge,simulation:s}=window.rift;bridge.paused=true;const art=scene.station;const before=JSON.stringify(s.actors);const count=scene.children.length;
   const draw=t=>art.draw(t,scene.cameras.main.zoom,scene.scale.width,scene.scale.height);
   draw(120);const first=art.ships[0].y;draw(360);const second=art.ships[0].y;
   for(let i=0;i<3000;i++)draw(i*17);
   return {platforms:art.platforms.map(p=>({x:p.x,y:p.y,width:Math.round(p.displayWidth)})),moving:second<first,unchanged:before===JSON.stringify(s.actors),bounded:count===scene.children.length,ships:art.ships.length};
  });assert.deepEqual(state.platforms,[{x:160,y:610,width:680},{x:380,y:425,width:240}]);assert(state.moving&&state.unchanged&&state.bounded);assert.equal(state.ships,3);
  await page.evaluate(()=>{window.rift.simulation.tick=950;});await page.waitForTimeout(100);await page.screenshot({path:`work/qa/station/${name}-${width}-match.png`});
  const positions=await page.evaluate(()=>window.rift.scene.station.ships.map(s=>[s.x,s.y,s.visible]));await page.waitForTimeout(200);assert.deepEqual(await page.evaluate(()=>window.rift.scene.station.ships.map(s=>[s.x,s.y,s.visible])),positions,'Pause freezes background');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);assert(await page.evaluate(()=>window.rift.scene.station.ships.every(s=>!s.visible)),'Reduced motion hides moving scenery');
  assert.deepEqual(errors,[]);console.log(`PASS ${name} ${width}x${height}: station preview, exact collision-top alignment, ship movement, bounded objects, pause and reduced motion.`);await context.close();
 }}finally{await browser.close();}
}
