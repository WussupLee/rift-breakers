import {FEEL,type FeelMode} from './feel';

/** The same rules apply to every fighter, CPU, keyboard and touch input. */
export const DODGE={invulnerableTicks:16,groundCooldownTicks:45,airCooldownTicks:130,gravityCancelTicks:8} as const;
export type DodgeReadout={state:'ready'|'active'|'cooldown'|'busy';label:string;description:string};
type DodgeActor={dodgeTime:number;dodgeCD:number;stun:number;freeze:number;move:unknown;out:boolean;respawn:number};
export function dodgeReadout(a:DodgeActor,feel:FeelMode):DodgeReadout{
 if(a.out||a.respawn)return {state:'busy',label:'WAIT',description:'Dodge unavailable during respawn or elimination'};
 if(a.dodgeTime>0)return {state:'active',label:'SAFE',description:'Invulnerable to attacks during this dodge'};
 if(a.dodgeCD>0){const seconds=a.dodgeCD/(60*FEEL[feel].speed);return {state:'cooldown',label:seconds.toFixed(1)+'s',description:'Dodge recharging: '+seconds.toFixed(1)+' seconds'};}
 if(a.stun||a.freeze||a.move)return {state:'busy',label:'BUSY',description:'Dodge unavailable until hitstun or attack recovery ends; a late tap can buffer'};
 return {state:'ready',label:'READY',description:'Dodge ready: tap to avoid attacks, with or without a direction'};
}
