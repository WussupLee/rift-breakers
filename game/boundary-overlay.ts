import * as Phaser from 'phaser';
import {STAGE,fighter} from './data';
import {clamp,worldToScreen,type CameraState} from './camera';
import {fighterWarnings,WARNING_WIDTH,WARNING_HEIGHT,type WarningActor,type FighterWarning} from './danger';

/** Pixel-sized, non-interactive HUD objects; no physics or network state is changed. */
export class BoundaryOverlay{
 readonly graphics:Phaser.GameObjects.Graphics;
 readonly labels:Phaser.GameObjects.Text[];
 readonly limits:Phaser.GameObjects.Text[];
 warnings:FighterWarning[]=[];
 constructor(scene:Phaser.Scene){
  this.graphics=scene.add.graphics().setDepth(40);
  this.labels=Array.from({length:4},()=>scene.add.text(0,0,'',{
   fontFamily:'Arial, sans-serif',fontSize:'11px',fontStyle:'bold',align:'center',lineSpacing:2,
  }).setOrigin(.5).setDepth(41).setVisible(false));
  this.limits=Array.from({length:4},()=>scene.add.text(0,0,'KO LIMIT',{
   fontFamily:'Arial, sans-serif',fontSize:'10px',fontStyle:'bold',color:'#ff9ab1',
   backgroundColor:'#211321',padding:{x:5,y:2},
  }).setOrigin(.5).setDepth(40).setVisible(false));
 }
 draw(actors:WarningActor[],local:number,c:CameraState,width:number,height:number,hud:number){
  const originX=c.x-width/(2*c.zoom),originY=c.y-height/(2*c.zoom),g=this.graphics;
  g.clear().setPosition(originX,originY).setScale(1/c.zoom);
  const position=(t:Phaser.GameObjects.Text,x:number,y:number)=>t.setPosition(originX+x/c.zoom,originY+y/c.zoom).setScale(1/c.zoom).setVisible(true);
  this.labels.forEach(t=>t.setVisible(false));this.limits.forEach(t=>t.setVisible(false));
  const b=STAGE.blast,tl=worldToScreen(b.left,b.top,c,width,height),br=worldToScreen(b.right,b.bottom,c,width,height);
  // Shade only beyond the real KO boundary. The viewport edge itself is NOT a KO line.
  g.fillStyle(0x2d071a,.3);
  if(tl.x>0)g.fillRect(0,hud,Math.min(tl.x,width),height-hud);
  if(br.x<width)g.fillRect(Math.max(br.x,0),hud,width-Math.max(br.x,0),height-hud);
  if(tl.y>hud)g.fillRect(0,hud,width,Math.min(tl.y,height)-hud);
  if(br.y<height)g.fillRect(0,Math.max(br.y,hud),width,height-Math.max(br.y,hud));
  g.lineStyle(2,0xff6e8a,.8);
  for(const [i,x] of [tl.x,br.x].entries())if(x>=2&&x<=width-2){
   for(let y=hud;y<height;y+=14)g.lineBetween(x,y,x,Math.min(height,y+7));
   position(this.limits[i],clamp(x+(i===0?40:-40),38,width-38),hud+12);
  }
  for(const [i,y] of [tl.y,br.y].entries())if(y>=hud+2&&y<=height-2){
   for(let x=0;x<width;x+=14)g.lineBetween(x,y,Math.min(width,x+7),y);
   position(this.limits[i+2],width/2,clamp(y+(i===0?12:-12),hud+10,height-10));
  }
  this.warnings=fighterWarnings(actors,local,c,width,height,hud);
  // On tiny screens a fighter warning takes priority over a boundary caption.
  // The actual dashed boundary remains visible and never moves with a marker.
  for(const t of this.limits)if(t.visible){
   const x=(t.x-originX)*c.zoom,y=(t.y-originY)*c.zoom;
   if(this.warnings.some(w=>Math.abs(w.x-x)<WARNING_WIDTH/2+t.width/2+4&&Math.abs(w.y-y)<WARNING_HEIGHT/2+t.height/2+4))t.setVisible(false);
  }
  for(const w of this.warnings){
   const color=Phaser.Display.Color.HexStringToColor(w.color).color;
   const a=actors.find(a=>a.id===w.id)!;
   const point=worldToScreen(a.x,a.y-fighter(a.slot.fighter).height/2,c,width,height);
   const px=clamp(point.x,4,width-4),py=clamp(point.y,hud+2,height-4);
   // A tether keeps stacked markers associated with their actual offscreen direction.
   g.lineStyle(1,color,.75);g.lineBetween(w.x,w.y,px,py);
   g.fillStyle(color,1);g.fillCircle(px,py,w.local?4:3);
   g.fillStyle(0x080f20,.94);g.fillRoundedRect(w.x-WARNING_WIDTH/2,w.y-WARNING_HEIGHT/2,WARNING_WIDTH,WARNING_HEIGHT,5);
   g.lineStyle(w.local?2:1,color,1);g.strokeRoundedRect(w.x-WARNING_WIDTH/2,w.y-WARNING_HEIGHT/2,WARNING_WIDTH,WARNING_HEIGHT,5);
   const label=position(this.labels[w.id],w.x,w.y),text=w.title+'\n'+w.message;
   if(label.text!==text){
    label.setFontSize(11).setText(text);
    if(label.width>WARNING_WIDTH-8)label.setFontSize(11*(WARNING_WIDTH-8)/label.width);
   }
   if(label.style.color!==w.color)label.setColor(w.color);
  }
 }
}
