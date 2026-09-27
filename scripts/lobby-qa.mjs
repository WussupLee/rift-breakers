import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.QA_URL||'http://localhost:5173/';await mkdir('work/qa/multiplayer',{recursive:true});
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(base);await page.getByRole('button',{name:'PLAY FRIENDS',exact:true}).click();
  const boxes=async()=>{await page.waitForTimeout(150);const result=await page.evaluate(()=>({w:innerWidth,h:innerHeight,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('.room-screen input,.room-screen select,.room-screen button')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height).map(e=>({name:e.textContent||e.getAttribute('aria-label'),r:e.getBoundingClientRect().toJSON()}))}));assert(result.scroll<=result.w);for(const e of result.elements)assert(e.r.x>=-1&&e.r.right<=result.w+1&&e.r.y>=0&&e.r.bottom<=result.h+1,`${name} ${result.w}x${result.h}: ${e.name} outside viewport ${JSON.stringify(e.r)}`);};
  for(const [w,h] of [[320,480],[390,844],[844,390]]){await page.setViewportSize({width:w,height:h});await boxes();await page.screenshot({path:`work/qa/multiplayer/${name}-${w}-entry.png`});}
  await page.setViewportSize({width:390,height:844});await page.getByRole('textbox',{name:'Player name',exact:true}).fill('Layout pilot');await page.getByRole('button',{name:'HOST A ROOM',exact:true}).click();
  if(await page.evaluate(()=>typeof RTCPeerConnection==='undefined')){await page.getByText(/This browser does not support WebRTC multiplayer/).waitFor();console.log(`PASS ${name}: responsive entry + explicit unsupported-WebRTC fallback (this Windows WebKit build has no RTCPeerConnection).`);}
  else{
   await page.locator('.room-code').waitFor({timeout:30000});for(const [w,h] of [[320,480],[390,844],[844,390]]){await page.setViewportSize({width:w,height:h});await boxes();await page.screenshot({path:`work/qa/multiplayer/${name}-${w}-invite.png`});}
   await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Players 1/4',exact:true}).click();for(let i=0;i<3;i++)await page.getByRole('button',{name:'+ ADD COMPUTER',exact:true}).click();await page.getByRole('button',{name:'rules',exact:true}).click();await page.getByRole('combobox',{name:'Teams',exact:true}).selectOption('teams');
   for(const tab of ['rules','Players 4/4']){await page.getByRole('button',{name:tab,exact:true}).click();for(const [w,h] of [[320,480],[390,844],[844,390]]){await page.setViewportSize({width:w,height:h});await boxes();await page.screenshot({path:`work/qa/multiplayer/${name}-${w}-${tab.split(' ')[0]}.png`});}}
   await page.getByRole('button',{name:'Leave room',exact:true}).click();console.log(`PASS ${name}: entry, QR invite, four slots and team rules fit 320x480 / 390x844 / 844x390.`);
  }assert.deepEqual(errors,[]);await context.close();
 }finally{await browser.close();}
}
