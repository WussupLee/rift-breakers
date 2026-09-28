import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.QA_URL||'http://127.0.0.1:4173/rift-breakers/';
await mkdir('work/qa/camera',{recursive:true});
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>localStorage.setItem('rift-breakers-settings-v1',JSON.stringify({mute:true,shake:false,flashes:false})));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(base+'?debug');await page.locator('main:not([inert])').waitFor();
  await page.getByRole('button',{name:/LET.S PLAY/}).click();
  await page.getByRole('button',{name:'Add computer',exact:true}).click();await page.getByRole('button',{name:'Add computer',exact:true}).click();
  await page.getByRole('button',{name:'CHOOSE ARENA'}).click();await page.getByRole('button',{name:'PLAY NOW',exact:true}).click();
  await page.waitForFunction(()=>window.rift?.simulation.tick>185);
  const fixture=async(x,y)=>page.evaluate(({x,y})=>{
   const s=window.rift.simulation;s.ended=true;
   s.actors.forEach((a,i)=>Object.assign(a,{x:i?670:x,px:i?670:x,y:i?610:y,py:i?610:y,vx:0,vy:0,grounded:i?true:y===610,stun:0,move:null,out:false,respawn:0,invulnerable:0,dodgeTime:0,damage:0}));
  },{x,y});
  const state=()=>page.evaluate(()=>{
   const scene=window.rift.scene,c=scene.cameraState,w=scene.scale.width,h=scene.scale.height;
   return {camera:{...c},width:w,height:h,hud:scene.hudInset,deckY:(610-c.y)*c.zoom+h/2,
    ledges:[160,840].map(x=>(x-c.x)*c.zoom+w/2),
    warnings:scene.boundaries.warnings,labels:scene.boundaries.labels.filter(t=>t.visible).map(t=>({text:t.text,width:t.width*t.scaleX*c.zoom,height:t.height*t.scaleY*c.zoom})),
    limits:scene.boundaries.limits.filter(t=>t.visible).map(t=>t.text),
    scroll:document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1};
  });
  for(const [w,h] of [[390,844],[320,480],[844,390],[1440,1000]]){
   await page.setViewportSize({width:w,height:h});await fixture(450,610);await page.waitForTimeout(1500);
   const normal=await state();assert.equal(normal.scroll,false);assert.equal(normal.camera.x,500);assert.deepEqual(normal.warnings,[]);
   await page.screenshot({path:'work/qa/camera/'+name+'-'+w+'-arena.png'});
   for(const [label,x,y] of [['recover',100,730],['left',-150,610],['right',1150,610],['bottom',500,985],['top',500,-170]]){
    await fixture(x,y);await page.waitForTimeout(650);const s=await state();
    assert.equal(s.camera.x,500);assert(Math.abs(s.deckY-normal.deckY)<.01);
    assert(s.camera.zoom>=normal.camera.zoom*.84-1e-6);assert(s.ledges.every(x=>x>0&&x<s.width));
    const warning=s.warnings.find(w=>w.local);assert(warning);assert.equal(warning.danger,label!=='recover');
    assert(s.labels.some(l=>l.text.includes(label==='recover'?'RECOVER':'KO RISK')));
    for(const warning of s.warnings){assert(warning.x>=43&&warning.x<=s.width-43);assert(warning.y>=s.hud+18&&warning.y<=s.height-18);}
    assert(s.labels.every(l=>l.width<=86&&l.height<=36));
    const koY=(1020-s.camera.y)*s.camera.zoom+s.height/2;
    if(label==='bottom'&&koY>s.hud+2&&koY<s.height-2)assert(s.limits.includes('KO LIMIT'));
    await page.screenshot({path:'work/qa/camera/'+name+'-'+w+'-'+label+'.png'});
   }
   await page.evaluate(()=>{window.rift.simulation.actors[0].respawn=90;});
   await page.waitForTimeout(100);assert(!(await state()).warnings.some(w=>w.local));
  }
  await page.setViewportSize({width:320,height:480});
  await page.evaluate(()=>{const {simulation:s,bridge}=window.rift;bridge.localIndex=2;s.actors.forEach(a=>{Object.assign(a,{x:-150,px:-150,y:985,py:985,grounded:false,respawn:0});a.slot.name='WWWWWWWWWW';});});
  await page.waitForTimeout(700);const crowded=await state();assert.equal(crowded.warnings.length,4);assert.equal(crowded.warnings[0].id,2);
  for(const w of crowded.warnings)for(const q of crowded.warnings)if(w.id!==q.id)assert(Math.abs(w.x-q.x)>=90||Math.abs(w.y-q.y)>=40);
  assert(crowded.labels.every(l=>l.width<=86));await page.screenshot({path:'work/qa/camera/'+name+'-four-fighter-corner.png'});
  assert.deepEqual(errors,[]);console.log('PASS '+name+': anchored arena, bounded zoom, all four danger directions, recovery arrow, visible KO limit, four-fighter markers, resize, no scroll or runtime errors.');
  await context.close();
 }finally{await browser.close();}
}
