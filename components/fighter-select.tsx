'use client';
import {type CSSProperties} from 'react';
import {ArrowRight,ChevronLeft,ChevronRight,Check} from 'lucide-react';
import {FIGHTERS,fighter,asset,type FighterId} from '@/game/data';
import atlases from '@/public/assets/manifest.json';

function AnimatedFighter({id}:{id:FighterId}) {
  const meta=atlases[id].idle;
  const crop={x:meta.bounds.x-10,y:meta.bounds.y-8,w:meta.bounds.w+20,h:meta.bounds.h+8};
  const scale=214/crop.h;
  const style={width:crop.w*scale,height:214,backgroundImage:`url(${asset(`fighters/${id}/idle.png`)})`,backgroundSize:`${meta.width*meta.frames*scale}px ${meta.height*scale}px`,backgroundPositionY:-crop.y*scale,'--frame-start':`${-crop.x*scale}px`,'--frame-end':`${-(crop.x+meta.width*meta.frames)*scale}px`,animation:`fighter-idle ${meta.frames*.12}s steps(${meta.frames}) infinite`} as CSSProperties;
  return <div className="preview-character" role="img" aria-label={`${fighter(id).name} standing on the selection platform`}><div className="idle-sprite" style={style}/></div>;
}

export function FighterSelect({id,onChoose,onContinue,onGuide}:{id:FighterId;onChoose:(id:FighterId)=>void;onContinue:()=>void;onGuide:()=>void}) {
  const selected=fighter(id),index=FIGHTERS.findIndex(f=>f.id===id);
  const cycle=(direction:number)=>onChoose(FIGHTERS[(index+direction+FIGHTERS.length)%FIGHTERS.length].id);
  return <section className="roster-screen selection-screen" style={{'--fighter':selected.color} as CSSProperties}>
    <div className="selection-heading"><span className="eyebrow">PLAYER 01</span><h1>CHOOSE YOUR <em>FIGHTER.</em></h1></div>
    <div className="selection-body">
      <div className="fighter-showcase">
        <span className="showcase-number" aria-hidden="true">0{index+1}</span>
        <span className="showcase-role">{selected.role}</span>
        <div className="preview-stage">
          <div className="selection-portal" aria-hidden="true"/>
          <AnimatedFighter key={id} id={id}/>
          <div className="select-platform" aria-hidden="true"><span/><span/><span/></div>
        </div>
        <button className="cycle-fighter previous" aria-label="Previous fighter" onClick={()=>cycle(-1)}><ChevronLeft/></button>
        <button className="cycle-fighter next" aria-label="Next fighter" onClick={()=>cycle(1)}><ChevronRight/></button>
        <div className="showcase-pagination" aria-label={`Fighter ${index+1} of 4`}>{FIGHTERS.map(f=><i key={f.id} className={id===f.id?'current':''}/>)}</div>
      </div>
      <div className="selection-info">
        <div className="selected-identity" aria-live="polite"><p className="eyebrow">{selected.title}</p><h2>{selected.name}</h2><p className="selected-bio">{selected.bio}</p></div>
        <div className="selection-stats">{[['Speed',selected.speed/7],['Power',selected.power/1.3],['Weight',selected.weight/1.4]].map(([label,value])=><div key={label}><span>{label}</span><meter min={0} max={1} value={Number(value)} aria-label={String(label)}/></div>)}</div>
        <div className="fighter-picker" role="group" aria-label="Choose a fighter">{FIGHTERS.map(f=><button key={f.id} className={`fighter-card fighter-option ${id===f.id?'selected':''}`} style={{'--fighter':f.color} as CSSProperties} onClick={()=>onChoose(f.id)} aria-label={`Select ${f.name}`} aria-pressed={id===f.id}><img src={asset(`fighters/${f.id}/portrait.png`)} alt=""/><span>{f.name.split(' ')[0]}</span>{id===f.id&&<Check className="fighter-check" size={14}/>}</button>)}</div>
        <div className="selection-actions"><button className="primary-button" onClick={onContinue}>LET’S PLAY <ArrowRight size={24}/></button><button className="text-button" onClick={onGuide}>How to play</button></div>
      </div>
    </div>
  </section>;
}
