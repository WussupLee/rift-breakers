import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
const base=process.env.QA_URL||'http://localhost:5173/';await mkdir('work/qa/feel',{recursive:true});
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{localStorage.setItem('rift-breakers-settings-v1',JSON.stringify({mute:true}));window.hapticCalls=[];if(navigator.userAgent.includes('Chrome'))Object.defineProperty(navigator,'vibrate',{configurable:true,writable:true,value:n=>{window.hapticCalls.push(n);return true;}});else Object.defineProperty(navigator,'vibrate',{configurable:true,writable:true,value:undefined});});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(base+'?debug');await page.locator('main:not([inert])').waitFor();
  await page.getByRole('button',{name:'Open settings',exact:true}).click();const mode=page.getByRole('combobox',{name:'Game feel',exact:true});await mode.waitFor();assert((await mode.innerText()).includes('Auto'));
  if(name==='webkit'){assert(await page.getByRole('button',{name:'Test vibration',exact:true}).isDisabled());assert(await page.getByText(/iPhone browsers cannot reliably/).isVisible());}
  else{await page.getByRole('button',{name:'Test vibration',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.hapticCalls),[6]);}
  await page.locator('.game-dialog').evaluate(el=>el.scrollTop=0);await page.screenshot({path:`work/qa/feel/${name}-settings.png`});await page.getByRole('button',{name:'Close',exact:true}).click();await page.getByRole('button',{name:/LET.S PLAY/}).click();await page.getByRole('button',{name:'CHOOSE ARENA'}).click();await page.getByRole('button',{name:'PLAY NOW',exact:true}).click();await page.waitForFunction(()=>window.rift?.simulation.tick>185,{},{timeout:60000}).catch(async e=>{console.log(errors,await page.locator('main').innerText());throw e;});
  assert.deepEqual(await page.evaluate(()=>[window.rift.simulation.config.feel,window.rift.scene.timeScale]),['relaxed',.85]);
  // Freeze simulation updates for camera fixtures, leaving the renderer running.
  await page.evaluate(()=>{const s=window.rift.simulation;s.ended=true;s.actors[0].x=450;s.actors[1].x=550;s.actors.forEach(a=>{a.y=610;a.vx=0;a.vy=0;a.px=a.x;a.py=a.y;});});await page.waitForTimeout(1100);const close=await page.evaluate(()=>({...window.rift.scene.cameraState}));
  await page.evaluate(()=>{const a=window.rift.simulation.actors;a[0].x=-80;a[0].px=-80;a[1].x=1060;a[1].px=1060;});await page.waitForTimeout(550);const wide=await page.evaluate(()=>({...window.rift.scene.cameraState}));assert.equal(wide.x,close.x);assert(wide.zoom<close.zoom&&wide.zoom>=close.zoom*.84-1e-6);
  await page.evaluate(()=>{const a=window.rift.simulation.actors;a[0].x=250;a[0].px=250;a[0].y=920;a[0].py=920;a[1].x=670;a[1].px=670;});await page.waitForTimeout(700);assert(await page.evaluate(()=>window.rift.scene.boundaries.warnings.some(w=>w.local&&w.danger)));assert.equal(await page.evaluate(()=>window.rift.scene.cameraState.x),close.x);await page.screenshot({path:`work/qa/feel/${name}-recovery-camera.png`});
  // A long press sends one haptic request, never a repeating motor buzz.
  if(name==='chromium'){
   const cdp=await context.newCDPSession(page),r=await page.locator('.touch-button.jump').boundingBox();await page.evaluate(()=>{window.hapticCalls=[];});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});await page.waitForTimeout(350);assert.deepEqual(await page.evaluate(()=>window.hapticCalls),[6]);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.evaluate(()=>window.rift.bridge.input.sample());assert.equal(await page.evaluate(()=>window.rift.bridge.input.sample().jump),false);
  }
  await page.getByRole('button',{name:'Open settings',exact:true}).click();await page.getByRole('combobox',{name:'Game feel',exact:true}).click();await page.getByRole('option',{name:'Classic · original pace',exact:true}).click();
  if(name==='chromium')await page.getByRole('switch',{name:'Touch vibration',exact:true}).click();
  await page.waitForFunction(()=>window.rift.simulation.config.feel==='classic');assert.equal(await page.evaluate(()=>window.rift.scene.timeScale),1);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('rift-breakers-settings-v1')).gameFeel),'classic');
  await page.getByRole('button',{name:'Close',exact:true}).click();if(name==='chromium'){const n=await page.evaluate(()=>window.hapticCalls.length);await page.getByRole('button',{name:'X JUMP',exact:true}).tap();assert.equal(await page.evaluate(()=>window.hapticCalls.length),n);}
  assert.deepEqual(errors,[]);console.log(`PASS ${name}: auto relaxed profile, migrated settings, live classic override, stage-anchored camera and recovery warnings, haptic capability and touch behavior.`);await context.close();
 }finally{await browser.close();}
}
