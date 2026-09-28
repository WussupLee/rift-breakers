'use client';
import {useEffect,useState} from 'react';
import QRCode from 'qrcode';
import {FIGHTERS,STAGES,stageDefinition,asset,type FighterId,type MatchConfig} from '@/game/data';
import {cleanName,inviteURL,roomCode,validRoomCode} from '@/game/network-protocol';
import type {MultiplayerRoom,RoomState,Member} from '@/game/multiplayer';

function Choice({label,value,onChange,children,disabled=false}:{label:string;value:string;onChange:(v:string)=>void;children:React.ReactNode;disabled?:boolean}){return <label className="room-field"><span>{label}</span><select aria-label={label} value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}>{children}</select></label>;}
function FighterChoice({value,onChange,label='Your fighter'}:{value:FighterId;onChange:(v:FighterId)=>void;label?:string}){return <Choice label={label} value={value} onChange={v=>onChange(v as FighterId)}>{FIGHTERS.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</Choice>;}
export function MultiplayerLobby({room,state,initialCode,selected,onOpen,onLeave}:{room:MultiplayerRoom|null;state:RoomState|null;initialCode:string;selected:FighterId;onOpen:(host:boolean,name:string,fighter:FighterId,code:string)=>void;onLeave:()=>void}){
 const [name,setName]=useState(''),[fighter,setFighter]=useState(selected),[code,setCode]=useState(initialCode),[tab,setTab]=useState<'invite'|'players'|'rules'>('invite'),[qr,setQR]=useState(''),[status,setStatus]=useState(''),[editing,setEditing]=useState(0);
 useEffect(()=>{try{setName(localStorage.getItem('rift-player-name')??'');}catch{}},[]);
 const url=state&&typeof window!=='undefined'?inviteURL(location.href,state.code):'';
 useEffect(()=>{if(!url)return;let current=true;QRCode.toDataURL(url,{width:256,margin:4,errorCorrectionLevel:'M',color:{dark:'#09111f',light:'#ffffff'}}).then(data=>{if(current)setQR(data);}).catch(()=>setStatus('QR unavailable. Share the link or room code below.'));return()=>{current=false;};},[url]);
 const me=state?.members.find(m=>m.id===room?.id),isHost=room?.isHost??false;
 const ownIndex=state?.members.findIndex(m=>m.id===room?.id)??-1;
 useEffect(()=>{if(ownIndex>=0&&!isHost)setEditing(ownIndex);},[ownIndex,isHost]);
 const saveName=()=>{const value=cleanName(name);try{localStorage.setItem('rift-player-name',value);}catch{}return value;};
 function open(host:boolean){setStatus('');onOpen(host,saveName(),fighter,roomCode(code));setTab(host?'invite':'players');}
 function profile(ready:boolean){room?.setProfile(saveName(),fighter,ready);}
 async function share(){try{if(navigator.share)await navigator.share({title:'Join my RIFT//BREAKERS room',url});else{await navigator.clipboard.writeText(url);setStatus('Invite link copied.');}}catch{setStatus('Share canceled or unavailable. Use the room code instead.');}}
 const member=state?.members[Math.min(editing,(state?.members.length??1)-1)];
 return <section className="room-screen">
  <div className="room-heading"><div><p className="eyebrow">ONLINE BETA / UP TO FOUR FIGHTERS</p><h1><span>BRING YOUR </span><em>CREW.</em></h1></div><button className="text-button" onClick={onLeave}>{room?'Leave room':'Back'}</button></div>
  {!room?<div className="room-entry">
   <label className="room-field"><span>What name do you want to play as?</span><input aria-label="Player name" autoComplete="nickname" maxLength={16} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>
   <FighterChoice value={fighter} onChange={setFighter}/>
   <div className="room-entry-actions"><button className="primary-button" disabled={!name.trim()} onClick={()=>open(true)}>HOST A ROOM</button><p>Hosting? A QR invite appears instantly once connected.</p></div>
   <div className="room-join"><label className="room-field"><span>Joining friends?</span><input aria-label="Room code" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={16} value={code} onChange={e=>setCode(roomCode(e.target.value))} placeholder="12-character code"/></label><button className="secondary-button" disabled={!name.trim()||!validRoomCode(roomCode(code))} onClick={()=>open(false)}>JOIN ROOM</button></div>
   <p className="room-note">Scan with your phone camera or enter a code. Internet + PeerJS signaling required. Names stay on your device and in the room; peers can see network addresses.</p>
  </div>:state?.phase==='connecting'||state?.phase==='closed'?<div className="room-connection" role="status"><h2>{state.phase==='closed'?'SIGNAL LOST.':'OPENING A RIFT…'}</h2><p>{state.notice}</p>{state.phase==='closed'&&<button className="primary-button" onClick={onLeave}>BACK TO SETUP</button>}</div>:<>
   <nav className="room-tabs" aria-label="Room pages">{(['invite','players','rules'] as const).map(t=><button key={t} onClick={()=>setTab(t)} aria-pressed={tab===t}>{t==='players'?`Players ${state?.members.length}/4`:t}</button>)}</nav>
   <div className="room-body">
    {tab==='invite'&&<div className="room-invite"><div className="room-qr">{qr?<img src={qr} alt="Scan this QR code to join the multiplayer room" draggable={false}/>:<p>Creating QR…</p>}</div><div><p className="eyebrow">SCAN. NAME YOURSELF. PLAY.</p><strong className="room-code">{state?.code}</strong><button className="secondary-button" onClick={share}>SHARE INVITE</button><p className="room-note">{isHost?'Host: keep this tab open.':'Invite another friend.'} Same Wi-Fi works best. Some networks need a relay.</p></div></div>}
    {tab==='players'&&<div className="room-players">
     <nav className="room-slot-tabs" aria-label="Room fighters">{state?.members.map((m,i)=><button key={m.id} aria-pressed={editing===i} onClick={()=>setEditing(i)}><span>P{i+1}</span>{m.name}<small>{m.cpu?'CPU':m.ready?'READY':'CHOOSING'}</small></button>)}</nav>
     {member&&<div className="room-member"><img src={asset(`fighters/${member.fighter}/portrait.png`)} alt=""/><div><h2>{member.name}{member.id===room.id?' · YOU':''}</h2><p>{member.cpu?'Computer':member.id===state?.members[0]?.id?'Room host':'Connected player'}</p></div>{isHost&&member.id!==room.id&&<button className="text-button" onClick={()=>{room.remove(member.id);setEditing(0);}}>Remove</button>}</div>}
     {member?.id===room.id?<div className="room-profile"><label className="room-field"><span>Your name</span><input aria-label="Your room name" maxLength={16} value={name} onChange={e=>{setName(e.target.value);room.setProfile(e.target.value,fighter,false);}} onBlur={()=>profile(false)}/></label><FighterChoice value={fighter} onChange={v=>{setFighter(v);room.setProfile(name,v,false);}}/>{!isHost&&<button className="primary-button" onClick={()=>profile(!me?.ready)}>{me?.ready?'NOT READY':'READY TO BRAWL'}</button>}</div>:member?.cpu&&isHost?<div className="room-profile"><FighterChoice label="Computer fighter" value={member.fighter} onChange={v=>room.setMember(member.id,{fighter:v})}/><Choice label="Computer difficulty" value={member.difficulty} onChange={v=>room.setMember(member.id,{difficulty:v as Member['difficulty']})}>{['easy','medium','hard'].map(v=><option key={v}>{v}</option>)}</Choice></div>:<p className="room-note">{member?.ready?'Ready for the host to start.':'Choosing a name and fighter on their device.'}</p>}
     {isHost&&state?.config.teams&&member&&<Choice label="Player team" value={String(member.team)} onChange={v=>room.setMember(member.id,{team:Number(v)})}><option value="0">Cyan</option><option value="1">Magenta</option></Choice>}
     {isHost&&state&&state.members.length<4&&<button className="secondary-button" onClick={()=>{room.addCPU();setEditing(state.members.length);}}>+ ADD COMPUTER</button>}
    </div>}
    {tab==='rules'&&state&&<div className="room-rules"><p className="room-note">{stageDefinition(state.config.stage).name.toUpperCase()} · {isHost?'You set the rules. Changes reset guest readiness.':'The host sets rules for everyone.'}</p>
     <Choice label="Arena" value={state.config.stage??'rift-array'} disabled={!isHost} onChange={v=>room.setRules({stage:v as MatchConfig['stage']})}>{STAGES.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Choice>
     <Choice label="Battle mode" value={state.config.mode} disabled={!isHost} onChange={v=>room.setRules({mode:v as MatchConfig['mode']})}><option value="stock">Stock</option><option value="timed">Timed</option></Choice>
     {state.config.mode==='stock'?<Choice label="Stock count" value={String(state.config.stocks)} disabled={!isHost} onChange={v=>room.setRules({stocks:Number(v)})}>{[1,3,5].map(v=><option key={v} value={v}>{v} stocks</option>)}</Choice>:<Choice label="Time limit" value={String(state.config.seconds)} disabled={!isHost} onChange={v=>room.setRules({seconds:Number(v)})}>{[120,240,360].map(v=><option key={v} value={v}>{v/60} minutes</option>)}</Choice>}
     <Choice label="Teams" value={state.config.teams?'teams':'ffa'} disabled={!isHost} onChange={v=>room.setRules({teams:v==='teams'})}><option value="ffa">Free-for-all</option><option value="teams">Teams</option></Choice>
     {state.config.teams&&<Choice label="Friendly fire" value={String(state.config.friendlyFire)} disabled={!isHost} onChange={v=>room.setRules({friendlyFire:v==='true'})}><option value="false">Off</option><option value="true">On</option></Choice>}
     <Choice label="Items" value={state.config.items} disabled={!isHost} onChange={v=>room.setRules({items:v as MatchConfig['items']})}>{['off','low','normal'].map(v=><option key={v}>{v}</option>)}</Choice>
     <Choice label="Room pace" value={state.config.feel??'relaxed'} disabled={!isHost} onChange={v=>room.setRules({feel:v as 'classic'|'relaxed'})}><option value="relaxed">Relaxed · 85% pace</option><option value="classic">Classic · original pace</option></Choice>
    </div>}
   </div>
   <div className="room-bottom"><p role="status">{status||state?.notice||(!isHost?'Ready up on your player card. The host starts the battle.':'Everyone ready? Open the rift.')}</p>{isHost?<button className="primary-button" disabled={!room.canStart()} onClick={()=>room.start()}>START BATTLE</button>:<button className="secondary-button" onClick={()=>{setTab('players');setEditing(state?.members.findIndex(m=>m.id===room.id)??0);}}>YOUR PLAYER · {me?.ready?'READY':'NOT READY'}</button>}</div>
  </>}
 </section>;
}
