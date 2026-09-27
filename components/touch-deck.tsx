'use client';
import {useEffect,useRef,type CSSProperties,type PointerEvent,type RefObject} from 'react';
import {ChevronUp,ChevronDown,ChevronLeft,ChevronRight} from 'lucide-react';
import type {GameBridge} from '@/game/scene';
import type {Settings} from '@/game/data';
import {TouchHaptics} from '@/game/haptics';

function Action({action,label,sub,bridge,onTap,disabled=false}:{action:string;label:string;sub:string;bridge:RefObject<GameBridge|null>;disabled?:boolean;onTap:()=>void}) {
  const pointers=useRef(new Set<number>()),button=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(disabled){for(const id of pointers.current)bridge.current?.input?.release(id);pointers.current.clear();button.current?.classList.remove('pressed');}},[disabled,bridge]);
  useEffect(()=>()=>{for(const id of pointers.current)bridge.current?.input?.release(id);pointers.current.clear();},[bridge]);
  const release=(event:PointerEvent<HTMLButtonElement>)=>{pointers.current.delete(event.pointerId);bridge.current?.input?.release(event.pointerId);event.currentTarget.classList.remove('pressed');};
  return <button ref={button} disabled={disabled} title={action==='item'?(disabled?'Walk over a resting item to pick it up':'Throw held item'):sub} className={`touch-button ${action}`} aria-label={`${label} ${sub}`} onContextMenu={e=>e.preventDefault()} onPointerDown={e=>{e.preventDefault();if(disabled||(action==='item'&&bridge.current?.sim?.actors[bridge.current?.localIndex??0]?.held==null))return;if(e.pointerType==='touch')onTap();pointers.current.add(e.pointerId);e.currentTarget.setPointerCapture(e.pointerId);bridge.current?.input?.press(e.pointerId,action);void bridge.current?.audio?.start();e.currentTarget.classList.add('pressed');}} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}><b>{label}</b><small>{sub}</small></button>;
}

export function TouchDeck({bridge,settings,held,onPause,onGuide}:{held:number|null;bridge:RefObject<GameBridge|null>;settings:Settings;onPause:()=>void;onGuide:()=>void}) {
  const haptics=useRef(new TouchHaptics());
  const tap=()=>{haptics.current.tap(settings.haptics);};
  function move(event:PointerEvent<HTMLDivElement>) {
    if(!event.currentTarget.hasPointerCapture(event.pointerId))return;
    const r=event.currentTarget.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;
    const action=[x<-.15?'left':x>.15?'right':'',y<-.15?'up':y>.15?'down':''].filter(Boolean).join('+');
    if(event.pointerType==='touch'&&action&&event.currentTarget.dataset.direction!==action)tap();
    bridge.current?.input?.press(event.pointerId,action);
    event.currentTarget.dataset.direction=action;
  }
  const release=(e:PointerEvent<HTMLDivElement>)=>{bridge.current?.input?.release(e.pointerId);delete e.currentTarget.dataset.direction;};
  return <div className="handheld-controls cube-deck" style={{'--touch-scale':settings.touchScale,opacity:settings.touchOpacity} as CSSProperties}>
    <div className="control-deck">
      <div className="dpad" aria-label="Directional pad" onContextMenu={e=>e.preventDefault()} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);move(e);void bridge.current?.audio?.start();}} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
        <span className="dpad-up"><ChevronUp/></span><span className="dpad-left"><ChevronLeft/></span><span className="dpad-middle"/><span className="dpad-right"><ChevronRight/></span><span className="dpad-down"><ChevronDown/></span>
      </div>
      <div className="action-buttons" aria-label="Combat buttons">
        <Action onTap={tap} bridge={bridge} action="dodge" label="Y" sub="DODGE"/>
        <Action onTap={tap} bridge={bridge} action="jump" label="X" sub="JUMP"/>
        <Action onTap={tap} bridge={bridge} action="light" label="B" sub="LIGHT"/>
        <Action onTap={tap} bridge={bridge} action="heavy" label="A" sub="HEAVY"/>
      </div>
    </div>
    <div className="deck-utility"><button className="console-start" onClick={onPause}>START <span>PAUSE</span></button><button className="console-guide" onClick={onGuide}>MOVE GUIDE</button><Action onTap={tap} bridge={bridge} action="item" label="Z" sub="THROW" disabled={held===null}/></div>
  </div>;
}
