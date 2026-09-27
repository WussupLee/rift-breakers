'use client';
import {useEffect,type RefObject} from 'react';

/** Native, non-passive guards complement CSS for iOS long presses/gestures.
 * Keep pointer events intact: the game reads multiple simultaneous pointers.
 * Do not apply these guards to portaled settings/help or browser chrome.
 */
export function useGameSurface(ref:RefObject<HTMLElement|null>) {
  useEffect(()=>{
    const root=ref.current;if(!root)return;
    const mobile=()=>matchMedia('(pointer:coarse)').matches||innerWidth<=900;
    const cancel=(event:Event)=>{if(event.target instanceof Element&&event.target.closest('input,textarea,select'))return;if(event.cancelable)event.preventDefault();};
    const control=(target:EventTarget|null)=>target instanceof Element&&!!target.closest('.touch-button,.dpad,.phaser-mount');
    const touchStart=(event:TouchEvent)=>{if(mobile()&&(control(event.target)||event.touches.length>1))cancel(event);};
    const touchEnd=(event:TouchEvent)=>{if(mobile()&&control(event.target))cancel(event);};
    const move=(event:Event)=>{if(mobile())cancel(event);};
    const clearSelection=(event:PointerEvent)=>{if(event.pointerType==='touch')window.getSelection()?.removeAllRanges();};
    const viewport=window.visualViewport;
    const fit=()=>{if(!viewport||Math.abs(viewport.scale-1)<.01)document.documentElement.style.setProperty('--device-height',`${Math.round(viewport?.height??innerHeight)}px`);};
    const options={passive:false};
    root.addEventListener('touchstart',touchStart,options);
    root.addEventListener('touchmove',move,options);
    root.addEventListener('touchend',touchEnd,options);
    for(const name of ['gesturestart','gesturechange','gestureend'])root.addEventListener(name,move,options);
    for(const name of ['contextmenu','selectstart','dragstart'])root.addEventListener(name,cancel);
    root.addEventListener('pointerdown',clearSelection);
    viewport?.addEventListener('resize',fit);window.addEventListener('resize',fit);fit();
    return()=>{
      root.removeEventListener('touchstart',touchStart);root.removeEventListener('touchmove',move);root.removeEventListener('touchend',touchEnd);
      for(const name of ['gesturestart','gesturechange','gestureend'])root.removeEventListener(name,move);
      for(const name of ['contextmenu','selectstart','dragstart'])root.removeEventListener(name,cancel);
      root.removeEventListener('pointerdown',clearSelection);viewport?.removeEventListener('resize',fit);window.removeEventListener('resize',fit);
      document.documentElement.style.removeProperty('--device-height');
    };
  },[ref]);
}
