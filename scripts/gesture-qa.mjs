import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';
const base=process.env.QA_URL||'http://localhost:5173/';
for(const [engineName,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{for(const [width,height] of [[320,480],[320,568],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+'?debug');await page.locator('main:not([inert])').waitFor();
  async function noScroll(){assert.deepEqual(await page.evaluate(()=>({x:scrollX,y:scrollY})),{x:0,y:0});const state=await page.locator('main>section').evaluate(el=>({overflow:getComputedStyle(el).overflowY,scroll:el.scrollTop}));assert.equal(state.overflow,'hidden');assert.equal(state.scroll,0);}
  async function visible(selector){const r=await page.locator(selector).boundingBox();assert(r&&r.y>=0&&r.y+r.height<=height+1,selector+' outside screen '+JSON.stringify(r));}
  await noScroll();await page.getByRole('button',{name:'LET’S PLAY'}).click();await noScroll();
  await page.getByRole('button',{name:'Add computer'}).click();await page.getByRole('button',{name:'Add computer'}).click();
  await page.getByRole('button',{name:'teams',exact:true}).click();await page.getByRole('switch',{name:'Team battle',exact:true}).click();await page.getByRole('switch',{name:'Friendly fire',exact:true}).click();await visible('.team-rules-page');
  await page.getByRole('button',{name:'fighters',exact:true}).click();await page.getByRole('button',{name:'CPU 3',exact:true}).click();await visible('.slot-row[data-active=true]');await noScroll();
  await page.getByRole('button',{name:'match',exact:true}).click();await visible('.match-rules-page');await page.getByRole('button',{name:'CHOOSE ARENA'}).click();await noScroll();await visible('.screen-footer');await page.getByRole('button',{name:'PLAY NOW',exact:true}).click();await page.waitForFunction(()=>window.rift?.simulation.tick>155,{},{timeout:60000});await noScroll();
  const guard=await page.locator('.touch-button.heavy b').evaluate(el=>{const style=getComputedStyle(el);const canceled={};for(const type of ['contextmenu','selectstart','dragstart','gesturestart','gesturechange','gestureend'])canceled[type]=!el.dispatchEvent(new Event(type,{bubbles:true,cancelable:true}));return {select:style.userSelect||style.webkitUserSelect,canceled};});assert.equal(guard.select,'none');assert(Object.values(guard.canceled).every(Boolean));
  if(engineName==='chromium'){
   const cdp=await context.newCDPSession(page),pad=await page.locator('.dpad').boundingBox(),a=await page.locator('.touch-button.heavy').boundingBox();
   let points=[{x:pad.x+pad.width*.8,y:pad.y+pad.height*.5,id:1},{x:a.x+a.width*.5,y:a.y+a.height*.5,id:2}];const scale=await page.evaluate(()=>visualViewport.scale);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await page.waitForTimeout(1200);
   const held=await page.evaluate(()=>window.rift.bridge.input.sample());assert.equal(held.x,1);assert.equal(held.heavy,true);
   points=points.map((p,i)=>({...p,x:p.x+(i?12:-12),y:p.y+(i?8:-8)}));await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points});await page.waitForTimeout(150);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert.equal(await page.evaluate(()=>visualViewport.scale),scale);assert.equal(await page.evaluate(()=>getSelection()?.toString()),'');assert.equal(await page.evaluate(()=>window.rift.bridge.input.sample().heavy),false);await noScroll();
  }
  await page.getByRole('button',{name:'START PAUSE',exact:true}).click();await visible('.pause-layer');await visible('.pause-layer .primary-button');await page.getByRole('button',{name:'RESUME',exact:true}).click();await page.evaluate(()=>{for(const a of window.rift.simulation.actors.slice(1)){a.stocks=1;a.x=1300;}});await page.getByRole('button',{name:'REMATCH',exact:true}).waitFor();await noScroll();await visible('.results-actions');await visible('.results-grid');assert.deepEqual(errors,[]);console.log(`PASS ${engineName} ${width}x${height}: no-scroll setup, contained pause, selection/callout/gesture guards${engineName==='chromium'?', sustained multitouch and pinch rejection':''}`);await context.close();
 }}finally{await browser.close();}
}
