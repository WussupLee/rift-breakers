import {STAGE} from './data';
export interface CameraState{x:number;y:number;zoom:number}
interface TrackedFighter{x:number;y:number;vx:number;vy:number;out:boolean;respawn:number}
export const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export const cameraHud=(width:number,height:number)=>Math.min(width<=900?142:92,height*.58);

/** Keep the deck at one screen-space anchor. Fighters never drag the view into a blast zone. */
export function anchorCamera(zoom:number,width:number,height:number,hud=cameraHud(width,height)):CameraState{
 const deck=STAGE.platforms[0],deckY=hud+Math.max(1,height-hud-20)*.58;
 return {x:deck.x+deck.width/2,y:deck.y-(deckY-height/2)/zoom,zoom};
}
export function frameFighters(actors:TrackedFighter[],width:number,height:number,hud=cameraHud(width,height)):CameraState{
 const deck=STAGE.platforms[0];
 const normal=Math.max(.01,Math.min(Math.max(1,width-48)/(deck.width+120),Math.max(1,height-hud-20)/460));
 let pressure=0;
 for(const a of actors){
  if(a.out||a.respawn)continue;
  const x=a.x+clamp(a.vx*4,-60,60),y=a.y+clamp(a.vy*4,-60,60);
  pressure=Math.max(pressure,(deck.x-x)/240,(x-deck.x-deck.width)/240,(250-y)/240,(y-740)/240);
 }
 // Retain a little dynamic zoom, but never shrink the arena endlessly to chase a KO.
 return anchorCamera(normal*(1-.16*clamp(pressure,0,1)),width,height,hud);
}
export function easeCamera(current:CameraState,target:CameraState,delta:number):CameraState{
 if(current.zoom<=0)return target;
 const dt=clamp(delta,0,100),pan=1-Math.exp(-dt/120),zoom=1-Math.exp(-dt/(target.zoom<current.zoom?75:360));
 return {x:current.x+(target.x-current.x)*pan,y:current.y+(target.y-current.y)*pan,zoom:current.zoom+(target.zoom-current.zoom)*zoom};
}
export function worldToScreen(x:number,y:number,camera:CameraState,width:number,height:number){
 return {x:(x-camera.x)*camera.zoom+width/2,y:(y-camera.y)*camera.zoom+height/2};
}
