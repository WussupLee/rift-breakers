import {fighter,type FighterId,type Animation,type MoveId} from './data';
import type {Actor,CombatEvent} from './simulation';

export const MOTION_STATES=['idle','run','runStart','brake','turn','crouch','jump','airJump','apex','fall','fastFall','land','heavyLand','wall','wallJump','dash','spotDodge','airDodge','hurt','launch','tumble','airRecover','pickup','throw','respawn','defeat','charge'] as const;
export type MotionState=typeof MOTION_STATES[number]|`attack:${MoveId}`;
export const ATTACK_POSES:Record<MoveId,number>={nl:0,sl:2,dl:4,nh:6,sh:8,dh:10,na:12,sa:14,da:16,rec:18,gp:20,l2:22,l3:24};
export const MOTION_PROFILE:Record<FighterId,{scale:number;bounce:number;lean:number;spin:number;overshoot:number}>={
 kairo:{scale:1.6,bounce:1.1,lean:9,spin:15,overshoot:5},
 regent:{scale:1.4,bounce:.65,lean:5,spin:10,overshoot:3},
 vexa:{scale:1.55,bounce:1.3,lean:13,spin:19,overshoot:7},
 omen:{scale:1.15,bounce:.7,lean:6,spin:12,overshoot:4}
};
export interface RenderPose{state:MotionState;animation:Animation|'motion';frame:number;angle:number;sx:number;sy:number;dx:number;dy:number;center:boolean;trail:boolean;active:boolean;phase:'none'|'startup'|'active'|'recovery';}
interface Track{tick:number;age:number;state:MotionState;previous:{x:number;vx:number;face:number;grounded:boolean;wall:number};stride:number;event:MotionState|null;eventAge:number;eventPower:number;launchAge:number;launched:boolean;frozenPose:RenderPose|null;}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const smooth=(t:number)=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const originalBaseline=(id:FighterId,anim:Animation)=>id==='kairo'?(anim==='jump'||anim==='fall'?96:82):id==='regent'?105:id==='vexa'?97:167;
export {originalBaseline};

/** Presentation-only. Never modifies actors, move timing, collision, or input. */
export class AnimationDirector{
 tracks=new Map<number,Track>();
 track(a:Actor,tick:number){let t=this.tracks.get(a.id);if(!t){t={tick,age:0,state:'idle',previous:{x:a.x,vx:a.vx,face:a.face,grounded:a.grounded,wall:a.wall},stride:0,event:null,eventAge:999,eventPower:0,launchAge:0,launched:false,frozenPose:null};this.tracks.set(a.id,t);}return t;}
 event(e:CombatEvent,a:Actor,tick:number){const t=this.track(a,tick);t.eventAge=0;t.eventPower=e.power;
  if(e.kind==='hit'){t.event='hurt';t.launchAge=0;t.launched=e.power>=10;t.frozenPose=null;}
  else if(e.kind==='jump')t.event=t.previous.wall?'wallJump':a.airJumps<2?'airJump':'jump';
  else if(e.kind==='land')t.event=e.power>11?'heavyLand':'land';
  else if(e.kind==='item')t.event=e.cue==='throw'?'throw':e.cue==='pickup'||e.cue==='repair'?'pickup':null;
  else if(e.kind==='respawn'){t.event='respawn';t.launched=false;}
 }
 sample(a:Actor,tick:number,frames:Record<Animation,number>,reducedMotion=false):RenderPose{
  const t=this.track(a,Math.floor(tick)),whole=Math.floor(tick),elapsed=clamp(whole-t.tick,0,12),frac=tick-whole,def=fighter(a.slot.fighter),profile=MOTION_PROFILE[def.id];
  const prev=t.previous;
  if(elapsed>0){
   if(a.freeze<=0){t.age+=elapsed;t.eventAge+=elapsed;if(t.launched)t.launchAge+=elapsed;t.stride+=Math.min(80,Math.abs(a.x-prev.x));}
   if(!a.stun)t.launched=false;
   if(!a.stun&&!a.move&&!a.dodgeTime&&a.grounded){
    if(prev.face!==a.face&&Math.abs(a.vx)>.5){t.event='turn';t.eventAge=0;}
    else if(Math.abs(prev.vx)>.8&&Math.abs(a.vx)<.8){t.event='brake';t.eventAge=0;}
    else if(Math.abs(prev.vx)<.8&&Math.abs(a.vx)>.8){t.event='runStart';t.eventAge=0;}
   }
   t.tick=whole;t.previous={x:a.x,vx:a.vx,face:a.face,grounded:a.grounded,wall:a.wall};
  }
  const speed=Math.hypot(a.vx,a.vy),recent=t.eventAge<8;
  let state:MotionState=a.out?'defeat':a.respawn?'respawn':a.stun?(a.grounded?'hurt':t.launched||speed>10?(t.launchAge<8?'launch':'tumble'):'hurt'):
   a.dodgeTime?(a.grounded?(a.spot?'spotDodge':'dash'):'airDodge'):
   a.move?(a.charge>0&&a.moveTick<a.move.startup?'charge':`attack:${a.move.id}`):
   a.landing?(t.eventPower>11?'heavyLand':'land'):
   recent&&t.event&&t.event!=='hurt'?t.event:
   a.wall?'wall':!a.grounded?(Math.abs(a.vy)<1.8?'apex':a.vy<0?'jump':a.vy>13?'fastFall':'fall'):
   a.previous.y>0&&Math.abs(a.vx)<.8?'crouch':Math.abs(a.vx)>.8?'run':'idle';
  if(!a.stun&&t.state==='tumble'&&!a.grounded&&!a.move&&!a.dodgeTime){t.event='airRecover';t.eventAge=0;state='airRecover';}
  if(state!==t.state){t.state=state;t.age=0;}
  // Hitstop holds the exact contact pose rather than advancing the tumble through the freeze.
  if(a.freeze>0&&t.frozenPose&&t.frozenPose.state===state)return {...t.frozenPose};
  const age=t.age+(a.freeze>0?0:frac),eventAge=t.eventAge+frac;
  const p:RenderPose={state,animation:'idle',frame:0,angle:0,sx:1,sy:1,dx:0,dy:0,center:false,trail:false,active:false,phase:'none'};
  const motion=(frame:number)=>{p.animation='motion';p.frame=frame;};
  if(a.move&&!a.stun&&!a.dodgeTime){
   const m=a.move,base=ATTACK_POSES[m.id],at=a.moveTick+(a.freeze>0?0:frac);
   if(at<m.startup){p.phase='startup';motion(base);const wind=smooth(at/m.startup);p.dx=-a.face*profile.overshoot*.6*wind;p.sy=1-.045*wind;p.sx=1+.045*wind;p.angle=-a.face*profile.lean*.45*wind;if(a.charge)p.dy=-Math.sin(at*.5)*Math.min(1.5,a.charge/30);}
   else if(at<m.startup+m.active){p.phase='active';p.active=true;motion(base+1);const strike=(at-m.startup)/m.active,pop=Math.sin(strike*Math.PI);p.dx=a.face*profile.overshoot*pop;p.sx=1+pop*.06;p.sy=1-pop*.025;p.trail=true;
    if(m.id==='na'||m.id==='dh'){p.angle=a.face*Math.sin(strike*Math.PI*2)*(def.id==='regent'?9:15);}
    if(m.id==='rec'){p.angle=a.face*Math.sin(strike*Math.PI)*20;p.dy=-3*pop;}
   }else{p.phase='recovery';const recover=clamp((at-m.startup-m.active)/m.recovery,0,1);motion(recover<.48?base+1:base);p.dx=a.face*profile.overshoot*(1-smooth(recover));p.angle=a.face*Math.sin(recover*Math.PI*2)*3*(1-recover);if(recover>.88){p.animation=a.grounded?'idle':'fall';p.frame=0;}}
  }else switch(state){
   case 'idle':p.frame=Math.floor((whole+a.id*11)/8)%frames.idle;p.sy=1+Math.sin(tick*.065)*.008*profile.bounce;break;
   case 'run':p.animation='run';p.frame=Math.floor(t.stride/(def.id==='regent'?19:22))%frames.run;p.angle=a.face*profile.lean*.4;p.dy=-Math.abs(Math.sin(t.stride*.075))*profile.bounce;break;
   case 'runStart':motion(28);p.angle=a.face*profile.lean*(1-smooth(eventAge/8));p.sx=1.05;p.sy=.96;break;
   case 'brake':motion(26);p.angle=-a.face*profile.lean*(1-smooth(eventAge/8));break;
   case 'turn':motion(27);p.sx=.82+.18*smooth(eventAge/8);p.angle=-a.face*5*(1-smooth(eventAge/8));break;
   case 'crouch':motion(26);break;
   case 'jump':case 'airJump':case 'wallJump':p.animation='jump';p.frame=Math.min(frames.jump-1,Math.floor(age/5));p.sy=1+.08*(1-smooth(age/9));p.sx=1-.05*(1-smooth(age/9));if(state==='airJump'){motion(29);p.angle=reducedMotion?0:a.face*Math.min(360,eventAge*45);p.center=true;}else p.angle=clamp(a.vx,-7,7)*1.2;break;
   case 'apex':p.animation='jump';p.frame=frames.jump-1;p.sx=1.035;p.sy=.97;break;
   case 'fall':case 'fastFall':p.animation='fall';p.frame=Math.min(frames.fall-1,Math.floor(age/5));p.angle=clamp(a.vx,-7,7);p.sy=state==='fastFall'?1.1:1.025;p.sx=state==='fastFall'?.94:1;break;
   case 'land':case 'heavyLand':motion(a.landing>3?26:27);p.sy=1-(state==='heavyLand'?.12:.06)*a.landing/6;p.sx=1+(state==='heavyLand'?.1:.05)*a.landing/6;break;
   case 'wall':motion(29);p.angle=-a.face*12;p.sy=1.03;break;
   case 'dash':motion(28);p.sx=1.08;p.sy=.94;p.trail=true;break;
   case 'spotDodge':motion(29);p.sx=.88;p.sy=.96;break;
   case 'airDodge':motion(29);p.center=true;p.angle=reducedMotion?0:a.face*Math.sin(a.dodgeAge/16*Math.PI)*35;p.trail=true;break;
   case 'hurt':p.animation='hurt';p.frame=Math.min(frames.hurt-1,Math.floor(age/5));p.angle=clamp(a.vx*1.8,-22,22);p.sx=.97;p.sy=1.03;break;
   case 'launch':case 'tumble':motion(state==='launch'?30:31);p.center=true;p.angle=reducedMotion?clamp(a.vx*2,-25,25):90+Math.atan2(a.vy,a.vx)*180/Math.PI+(state==='tumble'?Math.sign(a.vx||a.face)*(t.launchAge+frac-8)*profile.spin:0);p.trail=!reducedMotion;break;
   case 'airRecover':p.animation='fall';p.frame=0;p.angle=reducedMotion?0:a.face*18*(1-smooth(eventAge/8));p.center=true;break;
   case 'pickup':motion(eventAge<4?26:27);break;
   case 'throw':motion(eventAge<2?2:3);p.angle=a.face*7*(1-smooth(eventAge/8));break;
   case 'respawn':p.animation='fall';p.frame=0;p.sy=.86+.14*smooth(eventAge/8);break;
   case 'defeat':p.animation='death';p.frame=Math.min(frames.death-1,Math.floor(age/5));break;
  }
  if(reducedMotion){p.angle=clamp(p.angle,-15,15);p.sx=1;p.sy=1;p.dx=0;p.dy=0;p.trail=false;}
  p.frame=Math.max(0,Math.floor(p.frame));t.frozenPose=a.freeze>0?{...p}:null;return p;
 }
}
