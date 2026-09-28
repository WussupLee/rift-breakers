import * as Phaser from 'phaser';
import {STAGE,type StageDefinition,fighter} from './data';
import {worldToScreen,type CameraState} from './camera';
import {fighterWarnings,WARNING_WIDTH,type WarningActor,type FighterWarning} from './danger';

/** Fixed-pixel, wordless fighter previews. No physics or network state is changed. */
export class BoundaryOverlay{
 readonly graphics:Phaser.GameObjects.Graphics;
 readonly previews:Phaser.GameObjects.Sprite[];
 readonly maskGraphics:Phaser.GameObjects.Graphics[];
 readonly masks:Phaser.Display.Masks.GeometryMask[];
 warnings:FighterWarning[]=[];
 constructor(scene:Phaser.Scene){
  this.graphics=scene.add.graphics().setDepth(40);
  this.maskGraphics=Array.from({length:4},()=>scene.make.graphics({},false));
  this.masks=this.maskGraphics.map(g=>g.createGeometryMask());
  this.previews=this.masks.map(mask=>scene.add.sprite(0,0,'kairo-idle').setDepth(41).setMask(mask).setVisible(false));
  scene.events.once('shutdown',()=>{
   this.previews.forEach(p=>p.clearMask());
   this.masks.forEach(m=>m.destroy());this.maskGraphics.forEach(g=>g.destroy());
  });
 }
 draw(actors:WarningActor[],local:number,c:CameraState,width:number,height:number,hud:number,sprites:Phaser.GameObjects.Sprite[],stage:StageDefinition=STAGE){
  const originX=c.x-width/(2*c.zoom),originY=c.y-height/(2*c.zoom),g=this.graphics;
  g.clear().setPosition(originX,originY).setScale(1/c.zoom);
  this.previews.forEach(p=>p.setVisible(false));
  const b=stage.blast,tl=worldToScreen(b.left,b.top,c,width,height),br=worldToScreen(b.right,b.bottom,c,width,height);
  // Keep the actual elimination boundary, but without captions or prominent shading.
  g.fillStyle(0x230c12,.12);
  if(tl.x>0)g.fillRect(0,hud,Math.min(tl.x,width),height-hud);
  if(br.x<width)g.fillRect(Math.max(br.x,0),hud,width-Math.max(br.x,0),height-hud);
  if(tl.y>hud)g.fillRect(0,hud,width,Math.min(tl.y,height)-hud);
  if(br.y<height)g.fillRect(0,Math.max(br.y,hud),width,height-Math.max(br.y,hud));
  g.lineStyle(1,0xff635e,.32);
  for(const x of [tl.x,br.x])if(x>=2&&x<=width-2)
   for(let y=hud;y<height;y+=16)g.lineBetween(x,y,x,Math.min(height,y+5));
  for(const y of [tl.y,br.y])if(y>=hud+2&&y<=height-2)
   for(let x=0;x<width;x+=16)g.lineBetween(x,y,Math.min(width,x+5),y);
  this.warnings=fighterWarnings(actors,local,c,width,height,hud,stage);
  for(const w of this.warnings){
   const source=sprites[w.id],a=actors.find(a=>a.id===w.id);if(!source||!a)continue;
   const color=Phaser.Display.Color.HexStringToColor(w.color).color,r=WARNING_WIDTH/2;
   g.fillStyle(0x080f17,.78);g.fillCircle(w.x,w.y,r-1);
   g.lineStyle(w.local?2:1.5,color,.82);g.strokeCircle(w.x,w.y,r-1);
   // A tiny notch indicates direction without a long tether or text.
   const point=worldToScreen(a.x,a.y-fighter(a.slot.fighter).height/2,c,width,height);
   const angle=Math.atan2(point.y-w.y,point.x-w.x),dx=Math.cos(angle),dy=Math.sin(angle);
   g.fillStyle(color,.8);g.fillTriangle(w.x+dx*(r+2),w.y+dy*(r+2),w.x+dx*(r-2)-dy*2,w.y+dy*(r-2)+dx*2,w.x+dx*(r-2)+dy*2,w.y+dy*(r-2)-dx*2);
   const mask=this.maskGraphics[w.id];
   mask.clear().setPosition(originX,originY).setScale(1/c.zoom).fillStyle(0xffffff).fillCircle(w.x,w.y,r-3);
   // Reuse the current sprite pose/pivot, fitting the body to 24 screen pixels.
   // The circular mask clips extending swords, staffs and scarf tails.
   const fit=24/fighter(a.slot.fighter).height;
   this.previews[w.id].setTexture(source.texture.key,source.frame.name)
    .setOrigin(source.originX,source.originY).setFlipX(source.flipX).setAngle(source.angle)
    .setPosition(originX+w.x/c.zoom,originY+(w.y+12)/c.zoom)
    .setScale(source.scaleX*fit/c.zoom,source.scaleY*fit/c.zoom)
    .setAlpha(.92).setVisible(true);
  }
 }
}
