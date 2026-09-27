'use client';
import {type CSSProperties,type PointerEvent,type RefObject} from 'react';
import {ChevronUp,ChevronDown,ChevronLeft,ChevronRight} from 'lucide-react';
import type {GameBridge} from '@/game/scene';
import type {Settings} from '@/game/data';

function Action({action,label,sub,bridge}:{action:string;label:string;sub:string;bridge:RefObject<GameBridge|null>}) {
  const release=(event:PointerEvent<HTMLButtonElement>)=>{bridge.current?.input?.release(event.pointerId);event.currentTarget.classList.remove('pressed');};
  return <button className={`touch-button ${action}`} aria-label={`${label} ${sub}`} onContextMenu={e=>e.preventDefault()} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);bridge.current?.input?.press(e.pointerId,action);void bridge.current?.audio?.start();e.currentTarget.classList.add('pressed');}} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}><b>{label}</b><small>{sub}</small></button>;
}

export function TouchDeck({bridge,settings,onPause,onGuide}:{bridge:RefObject<GameBridge|null>;settings:Settings;onPause:()=>void;onGuide:()=>void}) {
  function move(event:PointerEvent<HTMLDivElement>) {
    if(!event.currentTarget.hasPointerCapture(event.pointerId))return;
    const r=event.currentTarget.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;
    const action=[x<-.15?'left':x>.15?'right':'',y<-.15?'up':y>.15?'down':''].filter(Boolean).join('+');
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
        <Action bridge={bridge} action="dodge" label="Y" sub="DODGE"/>
        <Action bridge={bridge} action="jump" label="X" sub="JUMP"/>
        <Action bridge={bridge} action="light" label="B" sub="LIGHT"/>
        <Action bridge={bridge} action="heavy" label="A" sub="HEAVY"/>
      </div>
    </div>
    <div className="deck-utility"><Action bridge={bridge} action="item" label="Z" sub="ITEM"/><button className="console-start" onClick={onPause}>START <span>PAUSE</span></button><button className="console-guide" onClick={onGuide}>MOVE GUIDE</button></div>
  </div>;
}
