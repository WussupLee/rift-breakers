import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.QA_URL||'http://localhost:5173/';
await mkdir('work/qa/combat-ui',{recursive:true});
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+'?debug');await page.locator('main:not([inert])').waitFor();
  const heights=[];
  for(const fighter of ['Kairo Venn','Regent-9','Vexa Thorn','Omen Null']){await page.getByRole('button',{name:'Select '+fighter,exact:true}).click();await page.waitForTimeout(100);heights.push(Number(await page.locator('.preview-character').getAttribute('data-body-height')));const sprite=await page.locator('.preview-character').boundingBox(),stage=await page.locator('.preview-stage').boundingBox();assert(sprite.y>=stage.y-1,'Staff must fit above platform');await page.screenshot({path:`work/qa/combat-ui/${name}-${fighter.split(' ')[0]}.png`});}
  assert(Math.max(...heights)-Math.min(...heights)<1,'All body heights match');
  await page.getByRole('button',{name:/LET.S PLAY/}).click();await page.getByRole('button',{name:'CHOOSE ARENA'}).click();await page.getByRole('button',{name:'PLAY NOW',exact:true}).click();await page.waitForFunction(()=>window.rift?.simulation.tick>155);
  const arena=await page.locator('.game-screen').boundingBox();assert.equal(arena.x,0);assert.equal(arena.y,0);assert.equal(arena.width,390);
  const bounds=[];for(const action of ['dodge','jump','light','heavy','item'])bounds.push(await page.locator('.touch-button.'+action).boundingBox());for(const b of bounds){assert(Math.abs(b.width-bounds[0].width)<1);assert(Math.abs(b.height-bounds[0].height)<1);assert(b.width>=44);}
  assert(bounds[4].x>195);assert(bounds[4].y>bounds[3].y);assert(bounds[1].y<bounds[3].y,'Jump above heavy');
  const throwButton=page.getByRole('button',{name:'Z THROW',exact:true});assert(await throwButton.isDisabled());
  await page.evaluate(()=>{const {simulation:s,bridge}=window.rift;bridge.paused=true;const a=s.actors[0];a.x=330;a.y=610;a.grounded=true;a.move=null;a.stun=0;a.freeze=0;a.dodgeTime=0;s.spawnItem('spike',a.x);s.items.at(-1).y=601;s.stepItems();bridge.onUpdate(s);});
  await page.locator('.touch-button.item:enabled').waitFor();await throwButton.tap();
  await page.evaluate(()=>{const {simulation:s,bridge}=window.rift;const input=bridge.input.sample();s.step(input,[input,{x:0,y:0,jump:false,light:false,heavy:false,dodge:false,item:false}]);bridge.onUpdate(s);});
  assert.equal(await page.evaluate(()=>window.rift.simulation.actors[0].held),null);await page.locator('.touch-button.item:disabled').waitFor();assert.equal(await page.evaluate(()=>window.rift.simulation.items[0].armed),true);
  await page.evaluate(()=>{const {simulation:s,bridge}=window.rift;const a=s.actors[0];a.move=null;a.freeze=0;a.invulnerable=0;a.dodgeTime=12;a.dodgeAge=0;bridge.settings.flashes=true;});
  await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.rift.scene.sprites[0].tintFill),true);await page.screenshot({path:`work/qa/combat-ui/${name}-dodge.png`});
  await page.evaluate(()=>{window.rift.simulation.actors[0].dodgeTime=0;});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.rift.scene.sprites[0].isTinted),false);
  await page.evaluate(()=>{window.rift.simulation.actors[0].dodgeTime=12;window.rift.bridge.settings.flashes=false;});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.rift.scene.sprites[0].isTinted),false);
  assert.deepEqual(errors,[]);console.log('PASS '+name+': equal fighter body scales, edge-to-edge arena, equal buttons, gated Throw/pickup, white dodge and reduced flashes.');await context.close();
 }finally{await browser.close();}
}
