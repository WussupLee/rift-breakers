/** Best-effort browser vibration, not an iOS native-haptics bridge. */
export function supportsHaptics(){return typeof navigator!=='undefined'&&typeof navigator.vibrate==='function';}
export class TouchHaptics {
 private last=-Infinity;
 tap(enabled:boolean,now=performance.now()){
  if(!enabled||!supportsHaptics()||now-this.last<50)return false;
  this.last=now;
  try{return navigator.vibrate(6);}catch{return false;}
 }
}
