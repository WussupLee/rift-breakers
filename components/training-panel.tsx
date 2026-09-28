'use client';
import {FIGHTERS,type FighterId,type Difficulty} from '@/game/data';
import {TrainingSimulation,type DummyBehavior} from '@/game/training';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';

function Choice({label,value,options,onChange}:{label:string;value:string;options:{value:string;label:string}[];onChange:(value:string)=>void}){
 return <label className="training-choice"><span>{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></label>;
}
export function TrainingPanel({session,onReset,onFighter,onGuide,debug,onDebug}:{session:TrainingSimulation;onReset:()=>void;onFighter:(index:number,id:FighterId)=>void;onGuide:()=>void;debug:boolean;onDebug:()=>void}){
 const roster=FIGHTERS.map(f=>({value:f.id,label:f.name}));
 return <div className="training-panel">
  <p>No timer. Unlimited respawns. Practice uses the same moves, recovery and dodge windows as a real match.</p>
  <div className="training-choices">
   <Choice label="Your fighter" value={session.config.slots[0].fighter} options={roster} onChange={id=>onFighter(0,id as FighterId)}/>
   <Choice label="Dummy fighter" value={session.config.slots[1].fighter} options={roster} onChange={id=>onFighter(1,id as FighterId)}/>
   <Choice label="Dummy behavior" value={session.behavior} options={[{value:'stand',label:'Stand still'},{value:'jump',label:'Keep jumping'},{value:'dodge',label:'Dodge when ready'},{value:'cpu',label:'Fight back (CPU)'}]} onChange={v=>{session.behavior=v as DummyBehavior;onReset();}}/>
   <Choice label="Starting damage" value={String(session.startingDamage)} options={[0,50,100,150,200].map(n=>({value:String(n),label:n+'%'}))} onChange={v=>{session.startingDamage=Number(v);onReset();}}/>
   {session.behavior==='cpu'&&<Choice label="CPU difficulty" value={session.config.slots[1].difficulty} options={['easy','medium','hard'].map(v=>({value:v,label:v[0].toUpperCase()+v.slice(1)}))} onChange={v=>{session.config.slots[1].difficulty=v as Difficulty;onReset();}}/>}
  </div>
  <p className="training-hint">Damage builds normally after the starting value. Dummy KOs restore that value. Changing an option resets positions and clears the hit totals.</p>
  <button className="secondary-button" aria-pressed={debug} onClick={onDebug}>Hitboxes: {debug?'ON':'OFF'}</button>
  <div className="training-actions"><button className="primary-button" onClick={onReset}>RESET PRACTICE</button><button className="secondary-button" onClick={onGuide}>Moves &amp; controls</button></div>
 </div>;
}
