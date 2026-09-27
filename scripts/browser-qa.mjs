import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.QA_URL||'http://localhost:5173/';
await mkdir('work/qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];
async function start(page){await page.locator('main:not([inert])').waitFor();await page.getByRole('button',{name:'LET’S PLAY'}).click();await page.getByRole('button',{name:'CHOOSE ARENA'}).click();await page.getByRole('button',{name:'PLAY NOW'}).click();await page.waitForFunction(()=>window.rift?.simulation?.tick>155,{},{timeout:60000});}
try {
 const desktop=await browser.newContext({viewport:{width:1440,height:1000}});const page=await desktop.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base+'?debug');await page.getByRole('button',{name:'LET’S PLAY'}).waitFor();await page.screenshot({path:'work/qa/desktop-roster.png',fullPage:true});await start(page);await page.screenshot({path:'work/qa/desktop-match.png'});
 await page.evaluate(()=>{window.rift.simulation.actors[0].invulnerable=600;});
 const x=await page.evaluate(()=>window.rift.simulation.actors[0].x);await page.keyboard.down('d');await page.waitForTimeout(250);await page.keyboard.up('d');assert.ok(await page.evaluate(()=>window.rift.simulation.actors[0].x)>x+20,'Keyboard movement');
 await page.keyboard.press('Space');await page.keyboard.press('j');await page.waitForTimeout(80);assert.ok(await page.evaluate(()=>window.rift.simulation.actors[0].y)<610,'Jump');
 await page.keyboard.press('Escape');await page.getByRole('heading',{name:'Paused.'}).waitFor();const tick=await page.evaluate(()=>window.rift.simulation.tick);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.rift.simulation.tick),tick,'Pause freezes simulation');await page.getByRole('button',{name:'RESUME',exact:true}).click();
 await page.evaluate(()=>{const s=window.rift.simulation;for(const a of s.actors.slice(1)){a.stocks=1;a.x=1300;}});await page.getByRole('button',{name:'REMATCH',exact:true}).waitFor({timeout:15000});await page.screenshot({path:'work/qa/results.png'});await page.getByRole('button',{name:'REMATCH',exact:true}).click();await page.waitForFunction(()=>window.rift?.simulation?.tick<150);await desktop.close();
 const phone=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const mobile=await phone.newPage();mobile.on('pageerror',e=>errors.push(String(e)));await mobile.goto(base+'?debug');await mobile.getByRole('button',{name:'LET’S PLAY'}).waitFor();await mobile.screenshot({path:'work/qa/phone-roster.png',fullPage:true});await start(mobile);await mobile.screenshot({path:'work/qa/phone-match.png'});
 const geometry=await mobile.locator('.game-screen').boundingBox();assert.ok(Math.abs(geometry.width-geometry.height)<25,'Phone arena is square');assert.ok(await mobile.locator('.handheld-controls').isVisible());assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
 // Real simultaneous browser touches, including a HUD rerender while held.
 const cdp=await phone.newCDPSession(mobile),pad=await mobile.locator('.dpad').boundingBox(),button=await mobile.getByRole('button',{name:'X JUMP',exact:true}).boundingBox();
 const p1={x:pad.x+pad.width*.87,y:pad.y+pad.height*.5,id:1},p2={x:button.x+button.width*.5,y:button.y+button.height*.5,id:2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1,p2]});await mobile.waitForTimeout(160);let input=await mobile.evaluate(()=>window.rift.bridge.input.sample());assert.equal(input.x,1);assert.equal(input.jump,true);await mobile.waitForTimeout(160);input=await mobile.evaluate(()=>window.rift.bridge.input.sample());assert.equal(input.jump,true,'Touch survives HUD updates');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await mobile.evaluate(()=>window.rift.bridge.input.sample().jump),false);
 await mobile.getByRole('button',{name:'START PAUSE',exact:true}).click();await mobile.getByRole('heading',{name:'Paused.'}).waitFor();await mobile.setViewportSize({width:844,height:390});await mobile.screenshot({path:'work/qa/phone-landscape.png',fullPage:true});assert.ok(await mobile.locator('.handheld-controls').isVisible());await phone.close();
 assert.deepEqual(errors,[]);console.log('PASS: desktop flow, keyboard combat, pause, results, rematch, portrait geometry, multitouch across HUD updates, landscape controls; no browser errors.');
}finally{await browser.close();}
