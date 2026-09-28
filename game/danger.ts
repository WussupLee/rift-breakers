import {STAGE,type StageDefinition,fighter,type FighterId} from './data';
import {clamp,worldToScreen,type CameraState} from './camera';

export interface WarningActor{
 id:number;x:number;y:number;vx:number;vy:number;out:boolean;respawn:number;grounded:boolean;
 slot:{fighter:FighterId;name?:string;human?:boolean}
}
export interface FighterWarning{
 id:number;x:number;y:number;offscreen:boolean;danger:boolean;local:boolean;
 color:'#ffe45b'|'#ff635e';
}
export const WARNING_WIDTH=34,WARNING_HEIGHT=34;
/** Uses the same foot/origin position and exact blast limits as Simulation. */
export function nearBlast(a:Pick<WarningActor,'x'|'y'|'vx'|'vy'>,stage:StageDefinition=STAGE){
 const b=stage.blast;
 return Math.min(a.x-b.left,b.right-a.x,a.y-b.top,b.bottom-a.y)<150||
  Math.min(a.x+Math.min(0,a.vx)*10-b.left,b.right-a.x-Math.max(0,a.vx)*10,
   a.y+Math.min(0,a.vy)*10-b.top,b.bottom-a.y-Math.max(0,a.vy)*10)<70;
}
export function fighterWarnings(actors:WarningActor[],localIndex:number,camera:CameraState,width:number,height:number,hud:number,stage:StageDefinition=STAGE):FighterWarning[]{
 const halfW=WARNING_WIDTH/2,halfH=WARNING_HEIGHT/2;
 const left=halfW+8,right=Math.max(left,width-halfW-8),top=Math.min(height-halfH-8,hud+halfH+6),bottom=Math.max(top,height-halfH-8);
 const placed:FighterWarning[]=[];
 // Reserve the best marker position for the local fighter when several share an edge.
 for(const a of [...actors].sort((a,b)=>Number(b.id===localIndex)-Number(a.id===localIndex))){
  if(a.out||a.respawn)continue;
  const def=fighter(a.slot.fighter),point=worldToScreen(a.x,a.y-def.height/2,camera,width,height);
  const offscreen=point.x<12||point.x>width-12||point.y<hud||point.y>height-12;
  const local=a.id===localIndex,danger=nearBlast(a,stage);
  if(!offscreen&&!danger)continue;
  const x=clamp(point.x,left,right),y=clamp(point.y-(offscreen?0:36),top,bottom);
  const w:FighterWarning={id:a.id,x,y,offscreen,danger,local,
   color:danger?'#ff635e':'#ffe45b'};
  // Finite candidate grid avoids overlapping four-player markers, including corners.
  if(placed.some(q=>Math.abs(q.x-x)<WARNING_WIDTH+4&&Math.abs(q.y-y)<WARNING_HEIGHT+4)){
  const candidates=[{x,y}];
  for(let row=0;row<=Math.ceil((bottom-top)/(WARNING_HEIGHT+6));row++)
   for(let col=0;col<=Math.ceil((right-left)/(WARNING_WIDTH+6));col++)
    candidates.push({x:Math.min(right,left+col*(WARNING_WIDTH+6)),y:Math.min(bottom,top+row*(WARNING_HEIGHT+6))});
  candidates.sort((a,b)=>(a.x-x)**2+(a.y-y)**2-((b.x-x)**2+(b.y-y)**2));
  const free=candidates.find(c=>placed.every(q=>Math.abs(q.x-c.x)>=WARNING_WIDTH+4||Math.abs(q.y-c.y)>=WARNING_HEIGHT+4));
  if(free){w.x=free.x;w.y=free.y;}
  }
  placed.push(w);
 }
 return placed;
}
