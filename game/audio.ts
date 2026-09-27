import type {Settings} from './data';
import type {Simulation,CombatEvent} from './simulation';
import {CUES,CueGate,SAMPLE_NAMES,MUSIC_PATH,eventCues,busVolume,type AudioCue,type AudioBus} from './audio-catalog';
type Voice={source:AudioBufferSourceNode;gain:GainNode;pan:StereoPannerNode;priority:number;bus:AudioBus};
export class GameAudio {
 context:AudioContext|null=null;buffers=new Map<string,AudioBuffer>();failures:string[]=[];
 private value:Settings;private buses:Partial<Record<AudioBus,GainNode>>={};private musicGain:GainNode|null=null;
 private musicSource:AudioBufferSourceNode|null=null;private loading:Promise<void>|null=null;private musicLoading:Promise<void>|null=null;
 private abort=new AbortController();private disposed=false;private voices=new Set<Voice>();private gate=new CueGate();
 private variants=new Map<AudioCue,number>();private targets=new WeakMap<GainNode,number>();private envelope:GainNode|null=null;private match=false;private paused=true;private preview=false;
 private offset=0;private musicStarted=0;private duckUntil=0;private previousTick=-1;private countdown=-1;private finished=false;
 private observations=new Map<number,{x:number;distance:number;charge:number;drop:number;fast:boolean}>();
 played:Partial<Record<AudioCue,number>>={};
 constructor(settings:Settings){this.value=settings;document.addEventListener('visibilitychange',this.visibility);}
 get settings(){return this.value;}
 set settings(value:Settings){this.value=value;this.sync();}
 private visibility=()=>{if(document.hidden)this.stopEffects();this.sync();};
 start(){
  if(this.disposed)return Promise.resolve();
  if(!this.context){
   const Context=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(!Context)return Promise.resolve();
   try{
    const c=this.context=new Context({latencyHint:'interactive'}),compressor=c.createDynamicsCompressor(),master=c.createGain();
    compressor.threshold.value=-10;compressor.knee.value=8;compressor.ratio.value=12;compressor.attack.value=.003;compressor.release.value=.15;
    master.gain.value=.75;compressor.connect(master).connect(c.destination);
    for(const bus of ['sfx','voices','crowd'] as const){const gain=c.createGain();gain.connect(compressor);this.buses[bus]=gain;}
    this.musicGain=c.createGain();this.musicGain.connect(compressor);
   }catch{return Promise.resolve();}
  }
  // Unlock inside the gesture, before any fetch/decode awaits (including iOS).
  if(this.context.state!=='running')void this.context.resume().then(()=>this.sync()).catch(()=>{});
  this.sync();
  if(!this.loading)this.loading=Promise.all(SAMPLE_NAMES.map(name=>this.load(name,'assets/audio/samples/'+name+'.mp3'))).then(()=>{});
  return this.loading;
 }
 private async load(name:string,path:string){
  const context=this.context;if(!context)return;
  try{const r=await fetch(new URL(path,document.baseURI),{signal:this.abort.signal});if(!r.ok)throw Error(String(r.status));const buffer=await context.decodeAudioData(await r.arrayBuffer());if(!this.disposed)this.buffers.set(name,buffer);}
  catch{if(!this.disposed&&!this.failures.includes(name)){this.failures.push(name);console.warn('Audio recording unavailable:',name);}}
 }
 private ensureMusic(){if(!this.context||this.musicLoading)return;this.musicLoading=this.load('music',MUSIC_PATH).then(()=>this.sync());}
 private ramp(node:GainNode|undefined|null,value:number){if(node&&this.context&&this.targets.get(node)!==value){node.gain.setTargetAtTime(value,this.context.currentTime,.025);this.targets.set(node,value);}}
 private sync(){
  const c=this.context;if(!c||this.disposed)return;const silent=this.value.mute||document.hidden;
  for(const bus of ['sfx','voices','crowd'] as const)this.ramp(this.buses[bus],silent?0:busVolume(bus,this.value));
  const wanted=(this.match&&!this.paused||this.preview)&&!silent&&this.value.music>0;
  if(wanted)this.ensureMusic();
  const volume=Number.isFinite(this.value.music)?Math.max(0,Math.min(1,this.value.music)):0;
  this.ramp(this.musicGain,wanted?volume*.30*(performance.now()<this.duckUntil?.46:1):0);
  if(wanted&&c.state==='running'&&this.buffers.has('music')&&!this.musicSource){
   const s=c.createBufferSource(),envelope=c.createGain();s.buffer=this.buffers.get('music')!;s.loop=true;s.connect(envelope).connect(this.musicGain!);envelope.gain.setValueAtTime(0,c.currentTime);envelope.gain.linearRampToValueAtTime(1,c.currentTime+.04);this.envelope=envelope;
   this.musicStarted=c.currentTime;s.start(0,this.offset%s.buffer.duration);this.musicSource=s;
  }else if(!wanted)this.stopMusic();
 }
 private stopMusic(){const c=this.context,s=this.musicSource,envelope=this.envelope;if(!s||!c)return;this.offset=(this.offset+c.currentTime-this.musicStarted)%(s.buffer?.duration||1);envelope?.gain.cancelScheduledValues(c.currentTime);envelope?.gain.setTargetAtTime(0,c.currentTime,.008);s.stop(c.currentTime+.04);s.onended=()=>{s.disconnect();envelope?.disconnect();};this.musicSource=null;this.envelope=null;}
 beginMatch(){this.stopEffects();this.stopMusic();this.offset=0;this.gate.reset();this.observations.clear();this.previousTick=-1;this.countdown=-1;this.finished=false;this.preview=false;this.match=true;this.paused=true;void this.start();}
 endMatch(){this.match=false;this.preview=false;this.stopEffects();this.stopMusic();this.sync();}
 setPaused(value:boolean){if(value&&!this.paused)this.stopEffects();this.paused=value;this.sync();}
 previewMusic(value:boolean){this.preview=value;void this.start();this.sync();}
 async audition(kind:AudioCue){await this.start();this.play(kind,-1,500,true);}
 play(kind:AudioCue,actor=-1,x=500,audition=false){
  const c=this.context,spec=CUES[kind];
  if(!c||c.state!=='running'||this.disposed||document.hidden||this.value.mute||busVolume(spec.bus,this.value)<=0)return;
  if(!audition&&this.match&&this.paused)return;
  const count=this.variants.get(kind)??0,name=spec.samples[count%spec.samples.length],buffer=this.buffers.get(name);
  if(!buffer||!this.gate.accept(kind,actor,performance.now()))return;
  if(spec.bus==='crowd')for(const v of this.voices)if(v.bus==='crowd')this.stopVoice(v);
  const same=[...this.voices].filter(v=>v.bus===spec.bus),limit=spec.bus==='sfx'?12:spec.bus==='voices'?3:1;
  if(same.length>=limit){const lowest=same.sort((a,b)=>a.priority-b.priority)[0];if(lowest.priority>spec.priority)return;this.stopVoice(lowest);}
  const source=c.createBufferSource(),gain=c.createGain(),pan=c.createStereoPanner();source.buffer=buffer;
  // Real recorded takes only. No generated fallback, noise or pitch-shifted voices.
  gain.gain.value=spec.gain;pan.pan.value=spec.bus==='crowd'||actor<0?0:Math.max(-.55,Math.min(.55,(x-500)/700));
  source.connect(gain).connect(pan).connect(this.buses[spec.bus]!);
  const v:Voice={source,gain,pan,priority:spec.priority,bus:spec.bus};this.voices.add(v);
  source.onended=()=>{source.disconnect();gain.disconnect();pan.disconnect();this.voices.delete(v);};source.start();
  this.variants.set(kind,count+1);this.played[kind]=(this.played[kind]??0)+1;
  if(['heavyHit','ko','explosion','gasp','cheer'].includes(kind)){this.duckUntil=performance.now()+(kind==='cheer'?1800:kind==='gasp'?800:280);this.sync();}
 }
 private stopVoice(v:Voice){const now=this.context?.currentTime??0;v.gain.gain.setTargetAtTime(0,now,.005);v.source.stop(now+.025);this.voices.delete(v);}
 private stopEffects(){for(const v of this.voices)this.stopVoice(v);}
 event(e:CombatEvent,sim:Simulation){const actor=sim.actors[e.actor];if(actor)for(const cue of eventCues(e,actor.slot.fighter))this.play(cue,e.actor,e.x);}
 update(sim:Simulation,paused:boolean){
  this.setPaused(paused);if(paused||sim.tick===this.previousTick)return;this.previousTick=sim.tick;
  const count=sim.countdown>30?Math.ceil((sim.countdown-30)/60):0;
  if(count!==this.countdown){if(sim.countdown>0)this.play(count?'count':'start');this.countdown=count;}
  if(sim.ended&&!this.finished){this.finished=true;this.play('victory');this.play('cheer');}
  for(const a of sim.actors){
   const prev=this.observations.get(a.id),fast=!a.grounded&&a.vy>13&&a.stun<=0;let distance=prev?.distance??0;
   if(prev&&!sim.ended&&sim.countdown===0&&!a.out&&!a.respawn&&!a.stun&&!a.freeze){
    if(a.grounded&&!a.move&&!a.dodgeTime&&Math.abs(a.vx)>.8){distance+=Math.min(30,Math.abs(a.x-prev.x));if(distance>=38){this.play('step',a.id,a.x);distance=0;}}else distance=0;
    if(a.charge>0&&prev.charge===0)this.play('charge',a.id,a.x);
    if(a.drop>prev.drop||fast&&!prev.fast)this.play('drop',a.id,a.x);
   }else distance=0;
   this.observations.set(a.id,{x:a.x,distance,charge:a.charge,drop:a.drop,fast});
  }
 }
 get status(){return {loaded:this.buffers.size,failures:[...this.failures],active:this.voices.size,musicPlaying:!!this.musicSource,context:this.context?.state};}
 destroy(){this.disposed=true;this.abort.abort();document.removeEventListener('visibilitychange',this.visibility);this.stopEffects();this.stopMusic();this.buffers.clear();if(this.context&&this.context.state!=='closed')void this.context.close().catch(()=>{});}
}
