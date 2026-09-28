import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.QA_URL||'http://127.0.0.1:4173/rift-breakers/';
await mkdir('work/qa/training',{recursive:true});
for(const [name,engine]of Object.entries({chromium,webkit}).filter(([name])=>!process.env.QA_ENGINE||name===process.env.QA_ENGINE)){
 const browser=await engine.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await context.addInitScript(()=>localStorage.setItem('rift-breakers-settings-v1',JSON.stringify({mute:true})));
  await page.goto(base+'?debug');await page.locator('main:not([inert])').waitFor();
  for(const [width,height]of [[320,568],[390,844],[844,390],[1440,1000]]){
   await page.setViewportSize({width,height});await page.waitForFunction(h=>Math.abs(parseFloat(document.documentElement.style.getPropertyValue('--device-height'))-h)<2,height);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const button=await page.getByRole('button',{name:'TRAINING',exact:true}).boundingBox();
   assert(button&&button.x>=0&&button.x+button.width<=width+1&&button.y+button.height<=height,'Training entry fits '+width+'x'+height+': '+JSON.stringify(button));
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:`work/qa/training/${name}-roster.png`});
  await page.getByRole('button',{name:'TRAINING',exact:true}).click();await page.waitForFunction(()=>window.rift?.bridge.practice&&window.rift.simulation.tick>5);
  assert.equal(await page.evaluate(()=>window.rift.simulation.countdown),0);assert.equal(await page.locator('[aria-label="Unlimited respawns"]').count(),2);
  const dummyX=await page.evaluate(()=>window.rift.simulation.actors[1].x);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.rift.simulation.actors[1].x),dummyX);
  const options=page.getByRole('button',{name:'Training options',exact:true});
  await options.click();await page.getByRole('heading',{name:'THE TRAINING LAB.'}).waitFor();await page.waitForFunction(()=>window.rift.bridge.paused);
  const tick=await page.evaluate(()=>window.rift.simulation.tick);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.rift.simulation.tick),tick);
  const choice=async(label,text)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:text,exact:true}).click();};
  for(const [id,label]of [['kairo','Kairo Venn'],['regent','Regent-9'],['vexa','Vexa Thorn'],['omen','Omen Null']]){
   await choice('Your fighter',label);await page.waitForFunction(id=>window.rift.simulation.actors[0].slot.fighter===id&&window.rift.scene.sprites[0].texture.key.startsWith(id+'-'),id);
  }
  await choice('Dummy fighter','Regent-9');await choice('Starting damage','100%');
  assert.equal(await page.evaluate(()=>window.rift.simulation.actors[1].damage),100);
  await choice('Dummy behavior','Keep jumping');await page.getByRole('button',{name:'Close',exact:true}).click();await page.waitForFunction(()=>!window.rift.simulation.actors[1].grounded);
  await options.click();await choice('Dummy behavior','Dodge when ready');await page.getByRole('button',{name:'Close',exact:true}).click();await page.waitForFunction(()=>window.rift.simulation.actors[1].dodgeTime>0);
  await options.click();await choice('Dummy behavior','Fight back (CPU)');await choice('CPU difficulty','Hard');assert.equal(await page.evaluate(()=>window.rift.simulation.actors[1].slot.difficulty),'hard');
  await choice('Dummy behavior','Stand still');await page.getByRole('button',{name:'Hitboxes: OFF',exact:true}).click();assert(await page.evaluate(()=>window.rift.bridge.debug));
  await page.getByRole('button',{name:'Hitboxes: ON',exact:true}).click();await page.screenshot({path:`work/qa/training/${name}-options.png`});
  await page.getByRole('button',{name:'Close',exact:true}).click();
  if(process.env.QA_DIAG)await page.screenshot({path:`work/qa/training/${name}-diag-closed.png`});
  // Exercise actual touch input against a close target, not just a fake statistics counter.
  await page.evaluate(()=>{const s=window.rift.simulation,a=s.actors[0],b=s.actors[1];a.x=a.px=480;b.x=b.px=535;a.face=1;});
  await page.getByRole('button',{name:'B LIGHT',exact:true}).tap();await page.waitForFunction(()=>window.rift.simulation.stats.hits>0);
  await page.waitForFunction(()=>document.querySelector('[aria-label="Training hit statistics"]')?.textContent.includes('HITS 1'));
  await page.getByRole('button',{name:'Reset training',exact:true}).click();assert.equal(await page.evaluate(()=>window.rift.simulation.stats.hits),0);assert.equal(await page.evaluate(()=>window.rift.simulation.actors[1].damage),100);
  if(process.env.QA_DIAG)await page.screenshot({path:`work/qa/training/${name}-diag-hit-reset.png`});
  // Unlimited fall/KO loop does not navigate to results.
  await page.evaluate(()=>{const s=window.rift.simulation;for(let i=0;i<5;i++){for(const a of s.actors){a.respawn=0;a.stocks=1;a.x=s.stage.blast.right+20;}s.step();}});
  assert.equal(await page.evaluate(()=>window.rift.simulation.ended),false);await page.getByRole('button',{name:'Reset training',exact:true}).click();
  if(process.env.QA_DIAG)await page.screenshot({path:`work/qa/training/${name}-diag-ko-reset.png`});
  for(const [width,height]of [[320,568],[390,844],[844,390],[1440,1000]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(150);
   assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1),'No page scrolling');
   const tools=await options.boundingBox();assert(tools&&tools.x>=0&&tools.x+tools.width<=width&&tools.y+tools.height<=height,'Options fit screen');
   const overlaps=await page.evaluate(()=>{const a=document.querySelector('.training-tools').getBoundingClientRect(),b=document.querySelector('.top-actions').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});assert(!overlaps,'Training controls do not overlap header actions at '+width+'x'+height);
   if(process.env.QA_DIAG)console.log(name,width,await page.evaluate(()=>{const scene=window.rift.scene,game=scene.game;return {tick:scene.sim.tick,paused:window.rift.bridge.paused,camera:{x:scene.cameraState.x,y:scene.cameraState.y,zoom:scene.cameraState.zoom},renderer:game.renderer.type,lost:game.renderer.gl?.isContextLost(),running:game.loop.running,canvas:[game.canvas.width,game.canvas.height],sceneActive:scene.scene.isActive(),visible:scene.sys.settings.visible,children:scene.children.length};}));
   if(process.env.QA_DIAG)console.log('GL',await page.evaluate(()=>{const r=window.rift.scene.game.renderer,g=r.gl;return {buffer:[g.drawingBufferWidth,g.drawingBufferHeight],viewport:[...g.getParameter(g.VIEWPORT)],scissor:[...g.getParameter(g.SCISSOR_BOX)],stencil:g.isEnabled(g.STENCIL_TEST),framebuffer:!!g.getParameter(g.FRAMEBUFFER_BINDING),error:g.getError()};}));
   const renderedColors=await page.evaluate(()=>new Promise(resolve=>window.rift.scene.game.renderer.snapshot(img=>{const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const c=canvas.getContext('2d');c.drawImage(img,0,0);const data=c.getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();for(let i=0;i<data.length;i+=16)colors.add(data[i]*65536+data[i+1]*256+data[i+2]);resolve(colors.size);})));
   if(process.env.QA_DIAG)console.log('Rendered colors',renderedColors);
   assert(renderedColors>500,'Arena framebuffer contains scenery and fighters after resize');
   await page.screenshot({path:`work/qa/training/${name}-${width}.png`});
  }
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Pause match',exact:true}).click();await page.getByRole('heading',{name:'Training paused.'}).waitFor();
  await page.getByRole('button',{name:'Return to fighters',exact:true}).click();await page.getByRole('button',{name:'TRAINING',exact:true}).waitFor();
  await page.getByRole('button',{name:/LET.S PLAY/}).click();await page.getByRole('button',{name:'CHOOSE ARENA',exact:true}).click();await page.getByRole('button',{name:'PLAY NOW',exact:true}).click();
  await page.waitForFunction(()=>window.rift?.bridge.practice===false&&window.rift.simulation.countdown>0);
  assert.equal(await page.locator('[aria-label="Training hit statistics"]').count(),0);
  assert.deepEqual(errors,[]);console.log(`PASS ${name}: training entry, all fighters, dummy settings, touch hit stats, unlimited KOs, reset, pause, responsive layout and normal-match isolation.`);
  await context.close();
 }finally{await browser.close();}
}
