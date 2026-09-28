import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.QA_URL||'http://127.0.0.1:4173/rift-breakers/';await mkdir('work/qa/animation',{recursive:true});
for(const [name,engine]of Object.entries({chromium,webkit}).filter(([name])=>!process.env.QA_ENGINE||process.env.QA_ENGINE===name)){
 const browser=await engine.launch();try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));await page.goto(base+'?debug');await page.locator('main:not([inert])').waitFor();await page.getByRole('button',{name:/LET.S PLAY/}).click();await page.getByRole('button',{name:'CHOOSE ARENA'}).click();await page.getByRole('button',{name:'PLAY NOW',exact:true}).click();await page.waitForFunction(()=>window.rift?.simulation.tick>180);
  const checks=await page.evaluate(()=>{
   const {simulation:s,scene,bridge}=window.rift;bridge.paused=true;s.actors[1].out=true;const a=s.actors[0],keys=['nl','sl','dl','nh','sh','dh','na','sa','da','rec','gp','l2','l3'],z={x:0,y:0,jump:false,light:false,heavy:false,dodge:false,item:false};
   const startCount=scene.children.length;let samples=0;
   for(const id of ['kairo','regent','vexa','omen'])for(const face of [-1,1])for(const key of keys){
    Object.assign(a,{slot:{...a.slot,fighter:id},x:500,px:500,y:610,py:610,face,vx:0,vy:0,grounded:true,freeze:0,stun:0,landing:0,dodgeTime:0,charge:0,invulnerable:0,out:false,respawn:0});s.startMove(a,key,z);scene.motion.tracks.clear();
    for(const phase of ['startup','active','recovery']){a.moveTick=phase==='startup'?0:phase==='active'?a.move.startup:a.move.startup+a.move.active;s.tick++;scene.renderWorld(1,0);const p=scene.poses[0];if(p.phase!==phase)throw Error(`${id}/${key}/${phase} incorrect phase`);if(scene.sprites[0].flipX!==(face<0))throw Error('Facing mismatch');if(phase!=='recovery'&&scene.sprites[0].texture.key!==id+'-motion')throw Error('Missing new pose texture');samples++;}
   }
   a.move=null;a.slot.fighter='kairo';Object.assign(a,{grounded:false,stun:40,freeze:0,vx:16,vy:-3,y:440,py:440});scene.motion.tracks.clear();scene.motion.event({kind:'hit',actor:0,x:a.x,y:a.y,power:16,color:'#ffffff'},a,s.tick);const angles=[];
   for(let n=0;n<40;n++){s.tick++;scene.renderWorld(1,1);angles.push(scene.sprites[0].angle);}
   const trailCount=scene.motionTrails.sprites.flat().length;for(let n=0;n<500;n++){s.tick++;scene.renderWorld(1,1);}
   return {samples,angles,trailCount,bounded:startCount===scene.children.length,texture:scene.sprites[0].texture.key,state:scene.poses[0].state};
  });assert.equal(checks.samples,312);assert.equal(checks.texture,'kairo-motion');assert.equal(checks.state,'tumble');assert(checks.bounded);assert.equal(checks.trailCount,6);assert(Math.max(...checks.angles)-Math.min(...checks.angles)>300);
  await page.screenshot({path:`work/qa/animation/${name}-tumble.png`});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>window.rift.scene.station.motion.matches);await page.evaluate(()=>window.rift.scene.renderWorld(1,1));assert(await page.evaluate(()=>Math.abs(window.rift.scene.sprites[0].angle)<=15&&window.rift.scene.motionTrails.sprites.flat().every(s=>!s.visible)));
  // Contact sheet presents actual shipped pixels: idle reference + each attack's new strike pose.
  await page.setViewportSize({width:1560,height:720});await page.evaluate(async()=>{
   document.body.innerHTML='';document.body.style.cssText='margin:0;background:#101b29;color:white;overflow:auto;font:12px monospace;';
   const title=document.createElement('h2');title.textContent='RIFT//BREAKERS — SHIPPED ATTACK POSE AUDIT';document.body.append(title);
   for(const id of ['kairo','regent','vexa','omen']){const row=document.createElement('div');row.style.cssText='display:flex;gap:4px;height:150px;';document.body.append(row);const img=new Image();img.src=`./assets/fighters/${id}/motion.png`;await img.decode();for(const [i,label]of ['NL','SL','DL','NH','SH','DH','NA','SA','DA','REC','GP','L2','L3'].entries()){const cell=document.createElement('div');cell.style.cssText='width:112px;flex-shrink:0;background:#152333;text-align:center';const canvas=document.createElement('canvas');canvas.width=112;canvas.height=125;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const frame=i*2+1;c.drawImage(img,frame%8*256,Math.floor(frame/8)*256,256,256,-72,-95,256,256);cell.append(canvas);const caption=document.createElement('div');caption.textContent=id.toUpperCase()+' / '+label;cell.append(caption);row.append(cell);}}
  });await page.screenshot({path:`work/qa/animation/${name}-attack-atlas.png`});assert.deepEqual(errors,[]);console.log(`PASS ${name}: 312 pose/phase/facing checks, 4 fighter atlases, full tumble, bounded echoes, reduced-motion fallback; no runtime errors.`);await context.close();
 }finally{await browser.close();}
}
