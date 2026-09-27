import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.QA_URL||'http://localhost:5173/';
await mkdir('work/qa/audio',{recursive:true});
const reports=[];
for(const [name,engine] of Object.entries({chromium,...(process.env.QA_FIREFOX?{firefox}:{}),webkit})){
 if(process.env.QA_ENGINE&&name!==process.env.QA_ENGINE)continue;
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:name!=='firefox',hasTouch:true});
  const page=await context.newPage(),errors=[],failed=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.url().includes('/audio/')&&r.status()>=400)failed.push(r.url());});
  await page.goto(base+'?debug');await page.locator('main:not([inert])').waitFor();
  const available=await page.evaluate(()=>typeof AudioContext!=='undefined'||typeof webkitAudioContext!=='undefined');
  await page.getByRole('button',{name:/LET.S PLAY/}).tap();await page.getByRole('button',{name:'CHOOSE ARENA',exact:true}).tap();await page.getByRole('button',{name:'PLAY NOW',exact:true}).tap();
  if(!available){await page.waitForFunction(()=>window.rift?.simulation.tick>155);assert.deepEqual(errors,[]);reports.push({engine:name,audio:'NOT VERIFIED: this test engine exposes no Web Audio API',gameplay:'runs without audio API'});console.log(name,'No Web Audio API in this test engine; silent gameplay verified, audio NOT verified.');continue;}
  try{await page.waitForFunction(()=>window.rift?.bridge.audio?.status.musicPlaying&&window.rift.simulation.tick>155,{},{timeout:30000});}catch(e){console.log(name,'audio diagnostics',await page.evaluate(()=>({audio:window.rift?.bridge.audio?.status,tick:window.rift?.simulation.tick,text:document.body.innerText.slice(-1000)})),errors,failed);throw e;}
  const initial=await page.evaluate(()=>window.rift.bridge.audio.status);assert.deepEqual(initial.failures,[]);assert(initial.loaded>=38,JSON.stringify(initial));
  await page.evaluate(()=>{window.audioBeforeRematch=window.rift.bridge.audio;window.rift.simulation.actors.forEach(a=>a.invulnerable=3600);});
  await page.getByRole('button',{name:'X JUMP',exact:true}).tap();await page.waitForFunction(()=>window.rift.bridge.audio.played.jump>0);
  await page.getByRole('button',{name:'START PAUSE',exact:true}).tap();await page.waitForFunction(()=>!window.rift.bridge.audio.status.musicPlaying);
  await page.getByRole('button',{name:'Audio & settings',exact:true}).click();
  await page.getByRole('slider',{name:'Character voices',exact:true}).waitFor();await page.getByRole('slider',{name:'Crowd reactions',exact:true}).waitFor();
  await page.locator('#sound-cue').selectOption('jump');await page.getByRole('button',{name:'Play sound',exact:true}).click();await page.getByRole('status').filter({hasText:'Playing at your current mix levels.'}).waitFor();
  await page.getByRole('button',{name:'Preview fight music',exact:true}).click();await page.waitForFunction(()=>window.rift.bridge.audio.status.musicPlaying);
  await page.evaluate(()=>window.rift.bridge.audio.audition('heavyHit'));await page.waitForTimeout(900);assert(await page.evaluate(()=>Math.abs(window.rift.bridge.audio.musicGain.gain.value-window.rift.bridge.audio.settings.music*.3)<.001),'Music duck releases while gameplay is paused');
  await page.getByRole('button',{name:'Stop music',exact:true}).click();await page.waitForFunction(()=>!window.rift.bridge.audio.status.musicPlaying);
  await page.screenshot({path:'work/qa/audio/'+name+'-sound-check.png'});
  const mix=await page.evaluate(async()=>{
   const audio=window.rift.bridge.audio;
   // Audition every cue via the production mixer while gameplay is paused.
   const keys=[...document.querySelector('#sound-cue').options].map(o=>o.value);
   for(const key of keys){audio.gate.reset();await audio.audition(key);if(!audio.played[key])throw Error('Cue not played: '+key);}
   if(audio.status.active>16)throw Error('Voice cap exceeded');
   audio.stopEffects();
   async function render(stress){
    const c=new OfflineAudioContext(2,44100*6,44100),comp=c.createDynamicsCompressor(),master=c.createGain();
    comp.threshold.value=-10;comp.knee.value=8;comp.ratio.value=12;comp.attack.value=.003;comp.release.value=.15;master.gain.value=.75;comp.connect(master).connect(c.destination);
    const add=(key,gain,when=0,offset=0,duration)=>{const s=c.createBufferSource(),g=c.createGain();s.buffer=audio.buffers.get(key);g.gain.value=gain;s.connect(g).connect(comp);s.start(when,offset,duration);};
    if(stress){add('music',.3,0,30,6);for(let t=.1;t<5;t+=.7){for(let i=0;i<12;i++)add('heavy'+i%3,1,t);for(let i=0;i<3;i++)add('grunt4',.28,t);}add('cheer',.48,.1);}
    else add('cloth1',.17*.55,.1);
    const b=await c.startRendering();let peak=0,sum=0;
    for(let ch=0;ch<b.numberOfChannels;ch++)for(const v of b.getChannelData(ch)){peak=Math.max(peak,Math.abs(v));sum+=v*v;}
    return {peak,peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(sum/(b.length*b.numberOfChannels))};
   }
   return {stress:await render(true),jump:await render(false),played:audio.played,status:audio.status};
  });
  assert(mix.stress.peak<.95,'Full-volume worst-case mix clips: '+JSON.stringify(mix));
  await page.getByRole('button',{name:'Close',exact:true}).click();await page.getByRole('button',{name:'RESUME',exact:true}).click();await page.waitForFunction(()=>window.rift.bridge.audio.status.musicPlaying);
  await page.getByRole('button',{name:'Mute sound',exact:true}).click();await page.waitForFunction(()=>!window.rift.bridge.audio.status.musicPlaying);await page.getByRole('button',{name:'Unmute sound',exact:true}).click();await page.waitForFunction(()=>window.rift.bridge.audio.status.musicPlaying);
  await page.evaluate(()=>{for(const a of window.rift.simulation.actors.slice(1)){a.stocks=1;a.x=1300;a.invulnerable=0;}});
  await page.getByRole('button',{name:'REMATCH',exact:true}).waitFor({timeout:15000});assert.equal(await page.evaluate(()=>window.audioBeforeRematch.status.musicPlaying),false);
  await page.getByRole('button',{name:'REMATCH',exact:true}).click();await page.waitForFunction(()=>window.rift?.simulation.tick>155&&window.rift.bridge.audio.status.musicPlaying);
  assert(await page.evaluate(()=>window.audioBeforeRematch===window.rift.bridge.audio),'Reuse one audio engine on rematch');
  await page.getByRole('button',{name:'START PAUSE',exact:true}).click();await page.getByRole('button',{name:'Return to fighters',exact:true}).click();await page.getByRole('button',{name:'Open settings',exact:true}).click();await page.getByRole('button',{name:'Preview fight music',exact:true}).click();
  await page.waitForFunction(()=>window.audioBeforeRematch.status.musicPlaying);await page.evaluate(()=>window.audioBeforeRematch.audition('heavyHit'));await page.waitForTimeout(900);
  assert(await page.evaluate(()=>Math.abs(window.audioBeforeRematch.musicGain.gain.value-window.audioBeforeRematch.settings.music*.3)<.001),'Ducking releases in menus without a game update loop');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  reports.push({engine:name,initial,...mix,errors,failed});console.log(name,'PASS',JSON.stringify({initial,stress:mix.stress,cues:Object.keys(mix.played).length}));
  await context.close();
 }finally{await browser.close();}
}
await writeFile('work/qa/audio/report.json',JSON.stringify(reports,null,2));
