import {z} from 'zod';
import {emptyInput,type InputFrame,type MatchConfig,type MoveId,fighter} from './data';
import type {Simulation,Actor,CombatEvent,Projectile,Item} from './simulation';

export const NETWORK_VERSION=1;
export const fighterSchema=z.enum(['kairo','regent','vexa','omen']);
export const difficultySchema=z.enum(['easy','medium','hard']);
const finite=z.number().finite().min(-1e6).max(1e6);
export const inputSchema=z.object({x:z.number().int().min(-1).max(1),y:z.number().int().min(-1).max(1),jump:z.boolean(),light:z.boolean(),heavy:z.boolean(),dodge:z.boolean(),item:z.boolean()});
export const configSchema=z.object({feel:z.enum(['classic','relaxed']),mode:z.enum(['stock','timed']),stocks:z.number().int().min(1).max(5),seconds:z.number().int().min(60).max(360),teams:z.boolean(),friendlyFire:z.boolean(),items:z.enum(['off','low','normal']),seed:z.number().int().min(0).max(0xffffffff),slots:z.array(z.object({fighter:fighterSchema,difficulty:difficultySchema,team:z.number().int().min(0).max(1),name:z.string().max(16),human:z.boolean()})).min(1).max(4)});
export function cleanName(value:string){let result='';for(const char of value.normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu,'').trim().replace(/\s+/g,' ')){if(result.length+char.length>16)break;result+=char;}return result||'Rift player';}
export function roomCode(value:string){return value.toUpperCase().replace(/[\s-]/g,'');}
export const validRoomCode=(value:string)=>/^[A-Z2-9]{12}$/.test(value);
export function createRoomCode(){const values=crypto.getRandomValues(new Uint8Array(12)),alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return [...values].map(n=>alphabet[n%32]).join('');}
export function inviteURL(base:string,code:string){const url=new URL(base);url.search='';url.hash=`room=${code}`;return url.toString();}

/** Preserve taps that arrive and release between two authoritative simulation ticks. */
export class InputMailbox{
 held=emptyInput();pending=emptyInput();sequence=-1;seen=0;
 receive(sequence:number,input:unknown,now:number){const result=inputSchema.safeParse(input);if(!result.success||!Number.isSafeInteger(sequence)||sequence<=this.sequence)return false;const next=result.data;
  for(const k of ['jump','light','heavy','dodge','item'] as const)if(next[k]&&!this.held[k])this.pending[k]=true;
  this.held=next;this.sequence=sequence;this.seen=now;return true;
 }
 sample(now:number){if(now-this.seen>350){this.held=emptyInput();this.pending=emptyInput();return emptyInput();}const value={...this.held};for(const k of ['jump','light','heavy','dodge','item'] as const)value[k] ||= this.pending[k];this.pending=emptyInput();return value;}
 clear(){this.held=emptyInput();this.pending=emptyInput();}
}

const moveSchema=z.enum(['nl','sl','dl','nh','sh','dh','na','sa','da','rec','gp']);
const actorSchema=z.object({id:z.number().int().min(0).max(3),x:finite,y:finite,vx:finite,vy:finite,face:finite,damage:finite,stocks:finite,score:finite,kos:finite,deaths:finite,out:z.boolean(),airJumps:finite,recoveryUsed:z.boolean(),held:finite.nullable(),damageDone:finite,respawn:finite,stun:finite,freeze:finite,grounded:z.boolean(),platform:finite,dodgeTime:finite,dodgeAge:finite,invulnerable:finite,landing:finite,charge:finite,drop:finite.optional().default(0),moveTick:finite,dodgeCD:finite,move:moveSchema.nullable()});
const projectileSchema=z.object({id:finite,owner:z.number().int().min(0).max(3),kind:z.string().max(16),x:finite,y:finite,px:finite,py:finite,vx:finite,vy:finite,radius:finite,life:finite,arm:finite,damage:finite,base:finite,scaling:finite,angle:finite,gravity:finite});
const itemSchema=z.object({id:finite,kind:z.enum(['bomb','spike','repair']),x:finite,y:finite,px:finite,py:finite,vx:finite,vy:finite,life:finite,fuse:finite,owner:finite,heldBy:finite,armed:z.boolean(),grace:finite});
const eventSchema=z.object({kind:z.enum(['hit','ko','jump','dodge','land','attack','respawn','item','sudden']),x:finite,y:finite,color:z.string().regex(/^#[\da-f]{6}$/i),power:finite,actor:z.number().int().min(0).max(3),move:moveSchema.optional(),cue:z.enum(['dash','throw','pickup','repair','explosion']).optional()});
export const snapshotSchema=z.object({tick:z.number().int().nonnegative(),countdown:finite,time:finite,sudden:z.boolean(),ended:z.boolean(),winners:z.array(z.number().int().min(0).max(3)).max(4),actors:z.array(actorSchema).min(2).max(4),projectiles:z.array(projectileSchema).max(128),items:z.array(itemSchema).max(64),events:z.array(eventSchema).max(128),paused:z.boolean()});
export type NetSnapshot=z.infer<typeof snapshotSchema>;
export function captureSnapshot(sim:Simulation,events:CombatEvent[],paused:boolean):NetSnapshot{
 return {tick:sim.tick,countdown:sim.countdown,time:sim.time,sudden:sim.sudden,ended:sim.ended,winners:[...sim.winners],paused,
  actors:sim.actors.map(a=>actorSchema.parse({...a,move:a.move?.id??null})),projectiles:sim.projectiles.map(p=>projectileSchema.parse(p)),items:sim.items.map(i=>({...i})),events:events.slice(-128)};
}
export function applySnapshot(sim:Simulation,state:NetSnapshot){
 if(state.actors.length!==sim.actors.length||state.actors.some((a,i)=>a.id!==i)||state.projectiles.some(p=>p.owner>=sim.actors.length)||state.events.some(e=>e.actor>=sim.actors.length))return false;
 sim.tick=state.tick;sim.countdown=state.countdown;sim.time=state.time;sim.sudden=state.sudden;sim.ended=state.ended;sim.winners=[...state.winners];
 state.actors.forEach((a,i)=>{const target=sim.actors[i],px=target.x,py=target.y;Object.assign(target,a,{px,py,move:a.move?fighter(target.slot.fighter).moves[a.move as MoveId]:null});});
 sim.projectiles=state.projectiles.map(p=>({...p,hit:new Set<number>()})) as Projectile[];sim.items=state.items.map(i=>({...i})) as Item[];return true;
}
