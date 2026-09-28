import type * as Phaser from 'phaser';
import type {Actor} from './simulation';
/** Draw the authored reach, not an unrelated circular slash centered on the body. */
export function drawAttack(g:Phaser.GameObjects.Graphics,a:Actor,x:number,y:number,color:number){
 const m=a.move;if(!m)return;
 const active=a.moveTick>=m.startup&&a.moveTick<m.startup+m.active;
 const strong=['nh','sh','dh','rec','gp'].includes(m.id),b=m.hitbox;
 if(active&&!m.projectile){
  const t=(a.moveTick-m.startup)/m.active,r=b.radius*(.85+Math.sin(t*Math.PI)*.15);
  const sweep=m.id==='dh'||m.id==='na',ax=x+(sweep?-b.x:b.x)*a.face,ay=y+b.y,bx=x+(b.endX??b.x)*a.face,by=y+(b.endY??b.y);
  g.lineStyle(r*2,color,strong?.22:.13);g.lineBetween(ax,ay,bx,by);
  g.fillStyle(color,strong?.22:.13);g.fillCircle(ax,ay,r);g.fillCircle(bx,by,r);
  if(a.slot.fighter==='omen'){
   g.lineStyle(3,color,.9);g.strokeCircle(ax,ay,r*.7);g.strokeCircle(bx,by,r);
   g.lineStyle(2,0xffffff,.8);g.lineBetween(ax,ay,bx,by);
   for(let i=0;i<4;i++){const ang=i*Math.PI/2+t*2;g.fillStyle(color,.9);g.fillRect(bx+Math.cos(ang)*r-3,by+Math.sin(ang)*r-3,6,6);}
  }else if(a.slot.fighter==='vexa'){
   g.lineStyle(strong?5:3,0xffffff,.9);g.lineBetween(ax,ay,bx,by);
   g.lineStyle(2,color,1);g.lineBetween(ax,ay+6,bx,by+6);
  }else{
   g.lineStyle(strong?6:3,color,.95);g.beginPath();const angle=a.face>0?-1.4:1.7;
   g.arc((ax+bx)/2,(ay+by)/2,Math.hypot(bx-ax,by-ay)/2+r*.7,angle,angle+(a.slot.fighter==='regent'?3:2.4));g.strokePath();
   g.lineStyle(2,0xffffff,.8);g.lineBetween(ax,ay,bx,by);
  }
 }
 if(m.armor&&a.moveTick<m.startup){g.lineStyle(3,0xffe45b,.7);g.strokeRoundedRect(x-23,y-75,46,78,8);}
 if(a.charge>0){g.lineStyle(3,0xffe45b,.85);g.strokeCircle(x,y-30,35+a.charge*.4);}
}
