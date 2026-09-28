import type * as Phaser from 'phaser';
interface Echo{tick:number;texture:string;frame:string|number;x:number;y:number;sx:number;sy:number;angle:number;ox:number;oy:number;flip:boolean}
/** Three pooled echoes per fighter, never unbounded sprites or emitters. */
export class MotionTrails{
 readonly sprites:Phaser.GameObjects.Sprite[][];readonly history:Echo[][];last:number[];
 constructor(scene:Phaser.Scene,count:number){this.sprites=Array.from({length:count},()=>Array.from({length:3},()=>scene.add.sprite(0,0,'kairo-idle').setDepth(4).setVisible(false)));this.history=Array.from({length:count},()=>[]);this.last=Array(count).fill(-1);}
 hide(id:number){this.history[id]=[];this.sprites[id].forEach(s=>s.setVisible(false));}
 draw(id:number,source:Phaser.GameObjects.Sprite,tick:number,emit:boolean,reduced:boolean,color:number){
  if(reduced){this.hide(id);return;}
  this.history[id]=this.history[id].filter(e=>tick-e.tick<=9);
  this.sprites[id].forEach((s,i)=>{const e=this.history[id][i];if(!e){s.setVisible(false);return;}s.setVisible(true).setTexture(e.texture,e.frame).setPosition(e.x,e.y).setScale(e.sx,e.sy).setOrigin(e.ox,e.oy).setAngle(e.angle).setFlipX(e.flip).setTintFill(color).setAlpha(.16*(1-(tick-e.tick)/10));});
  if(emit&&tick-this.last[id]>=3){this.last[id]=tick;this.history[id].unshift({tick,texture:source.texture.key,frame:source.frame.name,x:source.x,y:source.y,sx:source.scaleX,sy:source.scaleY,angle:source.angle,ox:source.originX,oy:source.originY,flip:source.flipX});this.history[id].length=Math.min(3,this.history[id].length);}
 }
}
