import type {Peer,DataConnection} from 'peerjs';
import {z} from 'zod';
import {defaultConfig,emptyInput,FIGHTERS,type InputFrame,type MatchConfig,type FighterId,type Difficulty} from './data';
import type {Simulation,CombatEvent} from './simulation';
import {NETWORK_VERSION,cleanName,createRoomCode,validRoomCode,InputMailbox,configSchema,fighterSchema,difficultySchema,inputSchema,snapshotSchema,captureSnapshot,type NetSnapshot} from './network-protocol';

const memberSchema=z.object({id:z.string().max(100),name:z.string().max(16),fighter:fighterSchema,difficulty:difficultySchema,team:z.number().int().min(0).max(1),cpu:z.boolean(),ready:z.boolean()});
export type Member=z.infer<typeof memberSchema>;
export type RoomPhase='connecting'|'lobby'|'loading'|'playing'|'results'|'closed';
const roomSchema=z.object({code:z.string().length(12),phase:z.enum(['connecting','lobby','loading','playing','results','closed']),members:z.array(memberSchema).max(4),config:configSchema,notice:z.string().max(200)});
export type RoomState=z.infer<typeof roomSchema>;
const fromGuest=z.discriminatedUnion('type',[
 z.object({type:z.literal('hello'),version:z.literal(NETWORK_VERSION),name:z.string().max(100),fighter:fighterSchema}),
 z.object({type:z.literal('profile'),name:z.string().max(100),fighter:fighterSchema,ready:z.boolean()}),
 z.object({type:z.literal('loaded'),match:z.string().max(50)}),
 z.object({type:z.literal('input'),match:z.string().max(50),sequence:z.number().int().nonnegative(),input:inputSchema}),
 z.object({type:z.literal('pong'),sent:z.number().finite()}),
]);
const fromHost=z.discriminatedUnion('type',[
 z.object({type:z.literal('room'),state:roomSchema}),
 z.object({type:z.literal('start'),match:z.string().max(50),config:configSchema,ids:z.array(z.string().max(100)).min(2).max(4)}),
 z.object({type:z.literal('frame'),match:z.string().max(50),state:snapshotSchema}),
 z.object({type:z.literal('reject'),message:z.string().max(200)}),
 z.object({type:z.literal('ping'),sent:z.number().finite()}),
]);

/** Browser-hosted, authoritative match. Only the host simulates damage, AI and scoring. */
export class MultiplayerRoom{
 peer:Peer|null=null;connections=new Map<string,DataConnection>();mailboxes=new Map<string,InputMailbox>();
 id='';isHost:boolean;state:RoomState;localIndex=0;match='';matchIds:string[]=[];
 latest:NetSnapshot|null=null;receivedAt=0;latency=0;hostPaused=false;
 onChange:(state:RoomState)=>void=()=>{};onStart:(config:MatchConfig,index:number)=>void=()=>{};
 private disposed=false;private initialized=false;private timer:ReturnType<typeof setInterval>|null=null;private deadline=0;private seen=new Map<string,number>();private loaded=new Set<string>();private lastPublish=0;private lastTick=-1;private events:CombatEvent[]=[];private sequence=0;private lastInput='';private lastInputAt=0;private frame:unknown=null;
 constructor(host:boolean,name:string,fighter:FighterId,code=host?createRoomCode():''){
  this.isHost=host;this.state={code,phase:'connecting',members:[],notice:'Connecting to the room service…',config:{...structuredClone(defaultConfig),feel:'relaxed',slots:[]}};
  this.profile={name:cleanName(name),fighter};
 }
 private profile:{name:string;fighter:FighterId};
 async open(){
  if(typeof RTCPeerConnection==='undefined'){this.fail('This browser does not support WebRTC multiplayer. Use a current browser with WebRTC enabled, or play solo.');return;}
  if(!validRoomCode(this.state.code)){this.fail('Enter a valid 12-character room code.');return;}
  this.deadline=performance.now()+20000;
  this.timer=setInterval(()=>this.heartbeat(),1000);
  try{const {default:Peer}=await import('peerjs');if(this.disposed)return;
   this.id=this.isHost?`rb1-${this.state.code}`:`rb1-${crypto.randomUUID()}`;
   this.peer=new Peer(this.id,{debug:0,config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}]}});
   this.peer.on('open',()=>{if(this.disposed)return;if(this.initialized){this.state.notice='Connection service restored.';this.emit();return;}this.initialized=true;if(this.isHost){this.state.members=[{id:this.id,...this.profile,cpu:false,ready:true,team:0,difficulty:'medium'}];this.state.phase='lobby';this.state.notice='Room open. Invite friends or add computers.';this.sync();}else this.attach(this.peer!.connect(`rb1-${this.state.code}`,{reliable:true,serialization:'json',metadata:{version:NETWORK_VERSION}}));});
   this.peer.on('connection',connection=>{if(!this.isHost||this.connections.size>=8){connection.close();return;}this.attach(connection);});
   this.peer.on('error',error=>{if(this.disposed)return;const type=(error as {type?:string}).type;if(this.state.phase==='connecting')this.fail(type==='peer-unavailable'?'Room not found. Check the code and ask the host to keep the room open.':type==='unavailable-id'?'That room code is in use. Create a new room.':'Could not connect. Try the same Wi-Fi without a VPN; some networks require a relay.');else{this.state.notice='Connection service interrupted. Existing players may continue; new joins may be unavailable.';this.emit();}});
   this.peer.on('disconnected',()=>{if(!this.disposed&&this.peer&&!this.peer.destroyed){this.state.notice='Reconnecting to the room service…';this.emit();try{this.peer.reconnect();}catch{}}});
  }catch{this.fail('Multiplayer could not load. Check your connection and try again.');}
 }
 private emit(){this.onChange(structuredClone(this.state));}
 private send(connection:DataConnection,message:unknown){if(!connection.open)return;try{if(connection.dataChannel?.bufferedAmount>256000){connection.close();return;}connection.send(message);}catch{connection.close();}}
 private broadcast(message:unknown){for(const [id,c] of this.connections)if(this.state.members.some(m=>m.id===id))this.send(c,message);}
 private attach(connection:DataConnection){
  if(this.connections.has(connection.peer)){connection.close();return;}
  this.connections.set(connection.peer,connection);this.seen.set(connection.peer,performance.now());
  connection.on('open',()=>{if(this.disposed){connection.close();return;}if(!this.isHost)this.send(connection,{type:'hello',version:NETWORK_VERSION,...this.profile});});
  connection.on('data',data=>{
   // Bound work and reject untrusted message shapes before touching the simulation.
   if(this.disposed)return;try{if(JSON.stringify(data).length>64000){connection.close();return;}}catch{connection.close();return;}
   if(this.isHost)this.receiveGuest(connection,data);else this.receiveHost(connection,data);
  });
  connection.on('close',()=>this.depart(connection.peer));connection.on('error',()=>{connection.close();this.depart(connection.peer);});
 }
 private receiveGuest(connection:DataConnection,data:unknown){
  const parsed=fromGuest.safeParse(data);if(!parsed.success){if(data&&typeof data==='object'&&'type' in data&&data.type==='hello'&&'version' in data&&typeof data.version==='number'&&data.version!==NETWORK_VERSION)this.reject(connection,'Game version changed. Refresh on every device, then create a new room.');return;}const message=parsed.data;this.seen.set(connection.peer,performance.now());
  if(message.type==='hello'){
   if(this.state.members.some(m=>m.id===connection.peer))return;
   if(this.state.phase!=='lobby'){this.reject(connection,'This match has started. Ask the host to return to the lobby.');return;}
   const free=this.state.members.findIndex(m=>m.cpu);
   if(this.state.members.length>=4&&free<0){this.reject(connection,'Room full: all four player slots are occupied.');return;}
   const member:Member={id:connection.peer,name:cleanName(message.name),fighter:message.fighter,cpu:false,ready:false,team:(free<0?this.state.members.length:free)%2,difficulty:'medium'};
   if(free>=0)this.state.members[free]=member;else this.state.members.push(member);
   this.mailboxes.set(member.id,new InputMailbox());this.state.notice=`${member.name} joined.`;this.sync();return;
  }
  const member=this.state.members.find(m=>m.id===connection.peer&&!m.cpu);if(!member)return;
  if(message.type==='pong'){this.latency=Math.max(0,performance.now()-message.sent);return;}
  if(message.type==='profile'&&this.state.phase==='lobby'){member.name=cleanName(message.name);member.fighter=message.fighter;member.ready=message.ready;this.sync();}
  if(message.type==='loaded'&&message.match===this.match&&this.state.phase==='loading'){this.loaded.add(member.id);this.checkLoaded();}
  if(message.type==='input'&&message.match===this.match&&this.state.phase==='playing')this.mailboxes.get(member.id)?.receive(message.sequence,message.input,performance.now());
 }
 private receiveHost(connection:DataConnection,data:unknown){
  const parsed=fromHost.safeParse(data);if(!parsed.success)return;const message=parsed.data;this.seen.set(connection.peer,performance.now());
  if(message.type==='ping'){this.send(connection,{type:'pong',sent:message.sent});return;}
  if(message.type==='reject'){this.fail(message.message);return;}
  if(message.type==='room'){const previous=this.state.phase;this.state=message.state;this.emit();if(previous!=='lobby'&&this.state.phase==='lobby'){this.latest=null;this.match='';}return;}
  if(message.type==='start'){
   const index=message.ids.indexOf(this.id);if(index<0||message.ids.length!==message.config.slots.length)return;
   this.localIndex=index;this.match=message.match;this.matchIds=message.ids;this.latest=null;this.lastTick=-1;this.sequence=0;this.lastInput='';this.state.config=message.config;this.state.phase='loading';this.emit();this.onStart(message.config,index);
  }
  if(message.type==='frame'&&message.match===this.match&&message.state.tick>=this.lastTick){this.latest=message.state;this.lastTick=message.state.tick;this.receivedAt=performance.now();this.hostPaused=message.state.paused;}
 }
 private reject(connection:DataConnection,message:string){this.send(connection,{type:'reject',message});setTimeout(()=>connection.close(),300);}
 private sync(){this.state.config.slots=this.state.members.map(m=>({fighter:m.fighter,difficulty:m.difficulty,team:m.team,name:m.name,human:!m.cpu}));this.emit();this.broadcast({type:'room',state:this.state});}
 setProfile(name:string,fighter:FighterId,ready=false){this.profile={name:cleanName(name),fighter};if(this.state.phase!=='lobby')return;if(this.isHost){Object.assign(this.state.members[0],this.profile,{ready:true});this.sync();}else{const host=[...this.connections.values()][0];if(host)this.send(host,{type:'profile',...this.profile,ready});}}
 setRules(patch:Partial<MatchConfig>){if(!this.isHost||this.state.phase!=='lobby')return;const parsed=configSchema.safeParse({...this.state.config,...patch,slots:this.state.config.slots});if(!parsed.success)return;this.state.config=parsed.data;for(const m of this.state.members)if(!m.cpu&&m.id!==this.id)m.ready=false;this.sync();}
 setMember(id:string,patch:Partial<Pick<Member,'fighter'|'difficulty'|'team'>>){if(!this.isHost||this.state.phase!=='lobby')return;const m=this.state.members.find(m=>m.id===id);if(!m)return;const parsed=memberSchema.safeParse({...m,...patch});if(!parsed.success)return;if(!m.cpu){m.team=parsed.data.team;if(m.id!==this.id)m.ready=false;}else Object.assign(m,parsed.data);this.sync();}
 addCPU(){if(!this.isHost||this.state.phase!=='lobby'||this.state.members.length>=4)return;const n=this.state.members.length;this.state.members.push({id:`cpu-${crypto.randomUUID()}`,name:`CPU ${n}`,fighter:FIGHTERS[n%4].id,difficulty:'medium',team:n%2,cpu:true,ready:true});this.sync();}
 remove(id:string){if(!this.isHost||this.state.phase!=='lobby'||id===this.id)return;const c=this.connections.get(id);if(c)this.reject(c,'The host removed you from the room.');this.state.members=this.state.members.filter(m=>m.id!==id);this.sync();}
 canStart(){return this.isHost&&this.state.phase==='lobby'&&this.state.members.length>=2&&this.state.members.every(m=>m.cpu||m.ready)&&(!this.state.config.teams||new Set(this.state.members.map(m=>m.team)).size>1);}
 start(){if(!this.canStart())return;this.match=crypto.randomUUID();this.matchIds=this.state.members.map(m=>m.id);this.localIndex=0;this.state.config.seed=crypto.getRandomValues(new Uint32Array(1))[0];this.state.phase='loading';this.state.notice='Loading all fighters…';this.loaded.clear();this.latest=null;this.frame=null;this.events=[];this.lastTick=-1;this.deadline=performance.now()+30000;for(const id of this.mailboxes.keys())this.mailboxes.set(id,new InputMailbox());this.sync();const message={type:'start',match:this.match,config:this.state.config,ids:this.matchIds};this.broadcast(message);this.onStart(structuredClone(this.state.config),0);}
 ready(){if(this.isHost){this.loaded.add(this.id);this.checkLoaded();}else{const c=[...this.connections.values()][0];if(c)this.send(c,{type:'loaded',match:this.match});}}
 private checkLoaded(){if(this.state.phase==='loading'&&this.state.members.every(m=>m.cpu||this.loaded.has(m.id))){this.state.phase='playing';this.state.notice='';this.sync();}}
 backToLobby(){if(!this.isHost)return;this.state.phase='lobby';this.match='';this.latest=null;this.frame=null;this.state.notice='Choose your next battle.';for(const m of this.state.members)m.ready=m.cpu||m.id===this.id;this.sync();}
 inputs(local:InputFrame):InputFrame[]{return this.matchIds.map((id,i)=>i===0?local:this.state.members.find(m=>m.id===id)?.cpu?undefined:this.mailboxes.get(id)?.sample(performance.now())??emptyInput()) as InputFrame[];}
 sendInput(input:InputFrame){if(this.isHost||this.state.phase!=='playing')return;const now=performance.now(),key=JSON.stringify(input);if(key===this.lastInput&&now-this.lastInputAt<100)return;this.lastInput=key;this.lastInputAt=now;const c=[...this.connections.values()][0];if(c)this.send(c,{type:'input',match:this.match,sequence:this.sequence++,input});}
 publish(sim:Simulation,events:CombatEvent[],paused:boolean){if(!this.isHost)return;this.events.push(...events);if(this.events.length>128)this.events=this.events.slice(-128);const now=performance.now();if(now-this.lastPublish<50&&!sim.ended&&paused===this.hostPaused)return;this.lastPublish=now;this.hostPaused=paused;
  const snapshot=captureSnapshot(sim,this.events,paused);this.events=[];this.frame={type:'frame',match:this.match,state:snapshot};this.broadcast(this.frame);
  if(sim.ended&&this.state.phase==='playing'){this.state.phase='results';this.sync();}
 }
 private heartbeat(){if(this.disposed)return;const now=performance.now();if(this.state.phase==='connecting'&&now>this.deadline){this.fail('Connection timed out. Keep the host open and try the same Wi-Fi. A restricted network may need a relay.');return;}
  if(this.isHost&&this.state.phase==='loading'&&now>this.deadline){this.backToLobby();this.state.notice='A player could not finish loading. Please retry or remove them.';this.sync();}
  for(const [id,c] of this.connections){if(now-(this.seen.get(id)??now)>12000){c.close();this.depart(id);continue;}if(this.isHost)this.send(c,{type:'ping',sent:now});}
 }
 private depart(id:string){if(!this.connections.has(id))return;this.connections.delete(id);this.seen.delete(id);this.mailboxes.delete(id);if(this.disposed)return;
  if(!this.isHost){this.fail('The host disconnected or stopped responding. Rejoin with a fresh invite.');return;}
  const m=this.state.members.find(m=>m.id===id);if(!m)return;
  if(this.state.phase==='lobby')this.state.members=this.state.members.filter(m=>m.id!==id);else{m.cpu=true;m.ready=true;m.name=cleanName(`${m.name.slice(0,10)} · CPU`);}
  this.state.notice='A player disconnected. '+(this.state.phase==='lobby'?'Their slot is open.':'A computer has taken over.');this.sync();this.checkLoaded();
 }
 private fail(message:string){this.state.phase='closed';this.state.notice=message;this.emit();this.destroy();}
 destroy(){if(this.disposed)return;this.disposed=true;if(this.timer)clearInterval(this.timer);this.peer?.destroy();this.connections.clear();this.mailboxes.clear();}
}
