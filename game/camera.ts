import {STAGE,fighter,type FighterId} from './data';
export interface CameraState{x:number;y:number;zoom:number}
interface TrackedFighter{x:number;y:number;vx:number;vy:number;out:boolean;respawn:number;slot:{fighter:FighterId}}
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export function frameFighters(actors:TrackedFighter[],width:number,height:number):CameraState{
 const alive=actors.filter(a=>!a.out&&!a.respawn);
 // Keep both landing surfaces in context while fitting fighters in both axes.
 let left=360,right=640,top=380,bottom=650;
 for(const a of alive){
  const x=clamp(a.x+clamp(a.vx*6,-120,120),STAGE.blast.left,STAGE.blast.right);
  const y=clamp(a.y+clamp(a.vy*6,-120,120),STAGE.blast.top,STAGE.blast.bottom);
  left=Math.min(left,x-30,a.x-30);right=Math.max(right,x+30,a.x+30);
  top=Math.min(top,y-fighter(a.slot.fighter).height,a.y-fighter(a.slot.fighter).height);bottom=Math.max(bottom,y+16,a.y+16);
 }
 left-=100;right+=100;top-=70;bottom+=50;
 const hud=width<700?112:82,foot=20;
 const base=Math.min(width/1000,height/720);
 const zoom=clamp(Math.min(Math.max(100,width-32)/(right-left),Math.max(100,height-hud-foot)/(bottom-top)),base*.4,base*1.42);
 return {x:(left+right)/2,y:(top+bottom)/2-(hud-foot)/(2*zoom),zoom};
}
export function easeCamera(current:CameraState,target:CameraState,delta:number):CameraState{
 if(current.zoom<=0)return target;
 const dt=clamp(delta,0,100),pan=1-Math.exp(-dt/120),zoom=1-Math.exp(-dt/(target.zoom<current.zoom?75:360));
 return {x:current.x+(target.x-current.x)*pan,y:current.y+(target.y-current.y)*pan,zoom:current.zoom+(target.zoom-current.zoom)*zoom};
}
