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
    warnings:scene.boundaries.warnings,previews:scene.boundaries.previews.map((p,id)=>({id,visible:p.visible,texture:p.texture.key,frame:p.frame.name,flip:p.flipX,masked:!!p.mask,source:scene.sprites[id]?.texture.key,sourceFrame:scene.sprites[id]?.frame.name})).filter(p=>p.visible),
    captions:scene.children.list.filter(t=>t.type==='Text'&&/KO LIMIT|KO RISK|RECOVER|OFFSCREEN/.test(t.text)).map(t=>t.text),
    scroll:document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1};
  });
  for(const [w,h] of (process.env.QA_SMOKE?[[390,844]]:[[390,844],[320,480],[844,390],[1440,1000]])){
   await page.setViewportSize({width:w,height:h});await fixture(450,610);await page.waitForTimeout(1500);
   const normal=await state();assert.equal(normal.scroll,false);assert.equal(normal.camera.x,500);assert.deepEqual(normal.warnings,[]);
   await page.screenshot({path:'work/qa/camera/'+name+'-'+w+'-arena.png'});
   for(const [label,x,y] of [['recover',100,730],['yellow',-10,610],['left',-150,610],['right',1150,610],['bottom',500,985],['top',500,-170]]){
    await fixture(x,y);await page.waitForTimeout(650);const s=await state();
    assert.equal(s.camera.x,500);assert(Math.abs(s.deckY-normal.deckY)<.01);
    assert(s.camera.zoom>=normal.camera.zoom*.84-1e-6);assert(s.ledges.every(x=>x>0&&x<s.width));
    const warning=s.warnings.find(w=>w.local);
    const px=(x-s.camera.x)*s.camera.zoom+s.width/2;
    if(label==='recover'||label==='yellow'&&px>=12&&px<=s.width-12){assert(!warning);}else{assert(warning);assert.equal(warning.danger,label!=='yellow');assert.equal(warning.color,label==='yellow'?'#ffe45b':'#ff635e');}
    for(const warning of s.warnings){assert(warning.x>=17&&warning.x<=s.width-17);assert(warning.y>=s.hud+17&&warning.y<=s.height-17);}
    assert.equal(s.previews.length,s.warnings.length);assert(s.previews.every(p=>p.masked&&p.texture===p.source&&p.frame===p.sourceFrame));
    assert.deepEqual(s.captions,[]);
    await page.screenshot({path:'work/qa/camera/'+name+'-'+w+'-'+label+'.png'});
   }
   await page.evaluate(()=>{window.rift.simulation.actors[0].respawn=90;});
   await page.waitForTimeout(100);assert(!(await state()).warnings.some(w=>w.local));
  }
  await page.setViewportSize({width:320,height:480});
  await page.evaluate(()=>{const {simulation:s,bridge}=window.rift;bridge.localIndex=2;s.actors.forEach(a=>{Object.assign(a,{x:-150,px:-150,y:985,py:985,vy:-9,face:a.id%2?-1:1,grounded:false,respawn:0});a.slot.fighter=['kairo','regent','vexa','omen'][a.id];a.slot.name='WWWWWWWWWW';});});
  await page.waitForTimeout(700);const crowded=await state();assert.equal(crowded.warnings.length,4);assert.equal(crowded.warnings[0].id,2);
  for(const w of crowded.warnings)for(const q of crowded.warnings)if(w.id!==q.id)assert(Math.abs(w.x-q.x)>=38||Math.abs(w.y-q.y)>=38);
  assert.equal(crowded.previews.length,4);assert(crowded.previews.every(p=>p.masked&&p.texture===p.source&&p.texture.endsWith('-jump')&&p.flip===(p.id%2===1)));await page.screenshot({path:'work/qa/camera/'+name+'-four-fighter-corner.png'});
  // Restart also exercises explicit mask cleanup, on both rendering engines.
  await page.getByRole('button',{name:'Pause match',exact:true}).click();
  await page.getByRole('button',{name:'Restart match',exact:true}).click();
  await page.waitForFunction(()=>window.rift?.simulation.tick>155&&!window.rift.simulation.ended);
  assert.equal(await page.evaluate(()=>window.rift.scene.boundaries.previews.length),4);
  assert.deepEqual(errors,[]);console.log('PASS '+name+': anchored arena, bounded zoom, all four danger directions, wordless yellow/red live masked previews, four-fighter markers, resize, no scroll or runtime errors.');
  await context.close();
 }finally{await browser.close();}
}
