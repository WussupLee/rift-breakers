import {Simulation,type Actor} from './simulation';
import {emptyInput,fighter,type MatchConfig,type InputFrame,type MoveId} from './data';

export type DummyBehavior='stand'|'jump'|'dodge'|'cpu';
export interface TrainingStats {hits:number;totalDamage:number;lastDamage:number;lastMove:string}
export function trainingConfig(config:MatchConfig):MatchConfig {
 return {...structuredClone(config),mode:'stock',stocks:3,teams:false,friendlyFire:false,items:'off',
  slots:[{...config.slots[0],human:true,name:'',team:0},
   {...(config.slots[1]??config.slots[0]),human:false,name:'DUMMY',team:1}]};
}

/** Local-only sandbox. All attacks, movement, hitboxes and dodge timing use the real simulation. */
export class TrainingSimulation extends Simulation {
 behavior:DummyBehavior='stand';
 startingDamage=0;
 stats:TrainingStats={hits:0,totalDamage:0,lastDamage:0,lastMove:'Land a hit'};
 revision=0;
 constructor(config:MatchConfig){super(trainingConfig(config));this.countdown=0;}
 reset(){
  const fresh=new Simulation(this.config);
  this.actors=fresh.actors;this.actors[1].damage=this.startingDamage;
  this.projectiles=[];this.items=[];this.events=[];this.countdown=0;this.ended=false;this.winners=[];this.sudden=false;
  this.time=this.config.seconds*60;this.seed=fresh.seed;this.nextItem=fresh.nextItem;this.serial=1;
  this.stats={hits:0,totalDamage:0,lastDamage:0,lastMove:'Land a hit'};this.revision++;
 }
 override ai(a:Actor):InputFrame{
  if(this.behavior==='cpu')return super.ai(a);
  const input=emptyInput();a.aiIntent=this.behavior==='stand'?'Training dummy':this.behavior==='jump'?'Practice jumps':'Practice dodges';
  if(this.behavior==='jump'&&a.grounded&&!a.previous.jump)input.jump=true;
  if(this.behavior==='dodge'&&a.dodgeCD<=0&&!a.previous.dodge)input.dodge=true;
  return input;
 }
 override hit(b:Actor,owner:number,damage:number,base:number,scaling:number,angle:number,face:number,charge=0,move?:MoveId){
  const before=b.damage;
  super.hit(b,owner,damage,base,scaling,angle,face,charge,move);
  if(owner===0&&b.id===1){const dealt=b.damage-before;this.stats.hits++;this.stats.totalDamage+=dealt;this.stats.lastDamage=dealt;this.stats.lastMove=move?fighter(this.actors[0].slot.fighter).moves[move].name:'Item hit';}
 }
 override ko(a:Actor){
  super.ko(a);a.out=false;a.stocks=this.config.stocks;a.respawn=45;a.damage=a.id===1?this.startingDamage:0;
 }
 override checkVictory(){}
 override resolveTime(){}
}
