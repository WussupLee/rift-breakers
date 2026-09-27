'use client';
import {useState,type CSSProperties} from 'react';
import {ArrowRight,ArrowLeft,Plus,X} from 'lucide-react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Switch} from '@/components/ui/switch';
import {FIGHTERS,fighter,asset,type MatchConfig,type FighterId,type Difficulty} from '@/game/data';

function Pick({label,value,options,onChange}:{label:string;value:string;options:{value:string;label:string}[];onChange:(value:string)=>void}){return <label className="pick"><span>{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></label>;}

export function MatchSetup({config,onChange,onBack,onContinue}:{config:MatchConfig;onChange:(config:MatchConfig)=>void;onBack:()=>void;onContinue:()=>void}) {
 const [panel,setPanel]=useState('fighters'),[selected,setSelected]=useState(0);
 const active=Math.min(selected,config.slots.length-1);
 const patch=(value:Partial<MatchConfig>)=>onChange({...config,...value});
 const updateSlot=(index:number,value:Partial<MatchConfig['slots'][number]>)=>patch({slots:config.slots.map((s,i)=>i===index?{...s,...value}:s)});
 const invalid=config.teams&&new Set(config.slots.map(s=>s.team)).size<2;
 return <section className="setup-screen paged-setup" data-panel={panel}>
  <div className="section-heading"><h1>BUILD YOUR <em>BATTLE.</em></h1><button className="text-button" onClick={onBack}><ArrowLeft size={16}/> Fighters</button></div>
  <nav className="setup-page-nav" aria-label="Setup pages">{['fighters','match','teams'].map(p=><button key={p} aria-pressed={panel===p} onClick={()=>setPanel(p)}>{p}</button>)}</nav>
  <div className="setup-columns">
   <div className="slots-panel">
    <div className="panel-heading">THE LINEUP <span>{config.slots.length} / 4</span></div>
    <nav className="slot-page-nav" aria-label="Fighter slots">{config.slots.map((_,i)=><button key={i} aria-pressed={active===i} onClick={()=>setSelected(i)}>{i===0?'YOU':`CPU ${i}`}</button>)}</nav>
    {config.slots.map((slot,i)=><div className="slot-row" data-active={active===i} key={i} style={{'--fighter':fighter(slot.fighter).color} as CSSProperties}>
      <div className="slot-avatar"><img className="portrait" src={asset(`fighters/${slot.fighter}/portrait.png`)} alt="" draggable={false}/></div>
      <div className="slot-options"><span className="eyebrow">{i===0?'P1 / YOU':`CPU ${i}`}</span>
       <Pick label={i===0?'Your fighter':`CPU ${i} fighter`} value={slot.fighter} options={FIGHTERS.map(f=>({value:f.id,label:f.name}))} onChange={v=>updateSlot(i,{fighter:v as FighterId})}/>
       {i>0&&<Pick label={`CPU ${i} difficulty`} value={slot.difficulty} options={['easy','medium','hard'].map(v=>({value:v,label:v[0].toUpperCase()+v.slice(1)}))} onChange={v=>updateSlot(i,{difficulty:v as Difficulty})}/>}</div>
      {config.teams&&<Pick label={`Player ${i+1} team`} value={String(slot.team)} options={[{value:'0',label:'Cyan'},{value:'1',label:'Magenta'}]} onChange={v=>updateSlot(i,{team:Number(v)})}/>}
      {i>1&&<button className="icon-button" aria-label={`Remove CPU ${i}`} onClick={()=>{patch({slots:config.slots.filter((_,n)=>i!==n)});setSelected(Math.max(0,i-1));}}><X size={16}/></button>}
    </div>)}
    {config.slots.length<4&&<button className="add-cpu" onClick={()=>{patch({slots:[...config.slots,{fighter:FIGHTERS[config.slots.length].id,difficulty:'medium',team:1}]});setSelected(config.slots.length);}}><Plus size={18}/> Add computer</button>}
   </div>
   <div className="rules-panel">
    <div className="panel-heading">HOUSE RULES</div>
    <div className="match-rules-page">
     <Pick label="Battle mode" value={config.mode} options={[{value:'stock',label:'Stock — last fighter standing'},{value:'timed',label:'Timed — highest score wins'}]} onChange={v=>patch({mode:v as MatchConfig['mode']})}/>
     {config.mode==='stock'?<Pick label="Stocks per fighter" value={String(config.stocks)} options={[1,3,5].map(v=>({value:String(v),label:`${v} stocks`}))} onChange={v=>patch({stocks:Number(v)})}/>:<Pick label="Match duration" value={String(config.seconds)} options={[120,240,360].map(v=>({value:String(v),label:`${v/60} minutes`}))} onChange={v=>patch({seconds:Number(v)})}/>}
     <Pick label="Item frequency" value={config.items} options={[{value:'off',label:'Off — pure combat'},{value:'low',label:'Low — a little chaos'},{value:'normal',label:'Normal — embrace the chaos'}]} onChange={v=>patch({items:v as MatchConfig['items']})}/>
    </div>
    <div className="team-rules-page"><div className="toggle-row"><span>Team battle</span><Switch aria-label="Team battle" checked={config.teams} onCheckedChange={v=>patch({teams:v})}/></div>{config.teams&&<div className="toggle-row"><span>Friendly fire</span><Switch aria-label="Friendly fire" checked={config.friendlyFire} onCheckedChange={v=>patch({friendlyFire:v})}/></div>}<p className="rule-note">{config.teams?'Set each fighter’s team on the Fighters page.':'Free-for-all: every fighter for themselves.'}</p></div>
   </div>
  </div>
  <div className="screen-footer"><span className={invalid?'error-note':'muted'} role={invalid?'alert':undefined}>{invalid?'Assign fighters to both teams.':`${config.slots.length-1} CPUs / ${config.mode==='stock'?config.stocks+' stocks':config.seconds/60+' minutes'} / ${config.teams?'Teams':'Free-for-all'}`}</span><button className="primary-button" disabled={invalid} onClick={onContinue}>CHOOSE ARENA <ArrowRight size={20}/></button></div>
 </section>;
}
