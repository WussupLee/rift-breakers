import {tuneMoves} from './move-tuning';
import type {FeelMode,FeelPreference} from './feel';
export type FighterId = 'kairo' | 'regent' | 'vexa' | 'omen';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type MoveId = 'nl'|'sl'|'dl'|'nh'|'sh'|'dh'|'na'|'sa'|'da'|'rec'|'gp'|'l2'|'l3';
export type Animation = 'idle'|'run'|'jump'|'fall'|'attack1'|'attack2'|'attack3'|'hurt'|'death';
export interface InputFrame { x:number; y:number; jump:boolean; light:boolean; heavy:boolean; dodge:boolean; item:boolean }
export const emptyInput = ():InputFrame => ({x:0,y:0,jump:false,light:false,heavy:false,dodge:false,item:false});
export interface HitShape { x:number; y:number; radius:number; endX?:number; endY?:number }
export interface MoveDefinition { id:MoveId; name:string; animation:Animation; startup:number; active:number; recovery:number; damage:number; base:number; scaling:number; angle:number; hitbox:HitShape; impulse:number; armor:boolean; projectile?:'bolt'|'sigil'|'beam'|'mine'|'shard'|'crystal'; charge?:boolean; lift?:number; chainStep?:1|2|3; chain?:{next:MoveId;cancelRecovery:number;heavyBranch?:boolean}; projectileStats?:{speed?:number;vy?:number;radius?:number;life?:number;arm?:number;offsetX?:number;offsetY?:number} }
export interface FighterDefinition { id:FighterId; name:string; title:string; role:string; color:string; speed:number; acceleration:number; jump:number; gravity:number; weight:number; power:number; height:number; width:number; source:string; bio:string; moves:Record<MoveId,MoveDefinition> }
const names:Record<FighterId,string[]>={kairo:['Jab string','Advancing palm','Low sweep','Rising uppercut','Scarf breaker','Orbit spin','Aerial kick','Flying punch','Heel dive','Corkscrew','Meteor fist'],regent:['Hilt jab','Royal sweep','Low scoop','Rising cleave','Iron decree','Ground slam','Royal orbit','Greatsword arc','Blade plunge','Crown ascent','Kingsfall'],vexa:['Haft combo','Dash thrust','Sliding sweep','Thorn rise','Vault cleave','Low cyclone','Pole spin','Forward poke','Downward hook','Sky vault','Thornfall'],omen:['Orb burst','Staff bolt','Floor sigil','Anti-air crystal','Rift beam','Rift mine','Orbiting orb','Forward burst','Downward shard','Rift shift','Void column']};
const ids:MoveId[]=['nl','sl','dl','nh','sh','dh','na','sa','da','rec','gp'];
function moves(id:FighterId):Record<MoveId,MoveDefinition>{
  const heavy=id==='regent',fast=id==='vexa',mage=id==='omen';
  const base=Object.fromEntries(ids.map((key,i)=>{
    const strong=i>=3&&i<=5||i>=9, up=key==='nh'||key==='rec',down=key==='da'||key==='gp',low=key==='dl'||key==='dh';
    const projectile=mage?({sl:'bolt',dl:'sigil',sh:'beam',dh:'mine',da:'shard'} as const)[key as 'sl']:undefined;
    return [key,{id:key,name:names[id][i],animation:(i%3===0?'attack1':i%3===1?'attack2':'attack3'),startup:(strong?16:6)+(heavy?3:fast?-2:0),active:strong?8:5,recovery:(strong?28:15)+(heavy?5:fast?-2:0),damage:(strong?17:7)+(heavy?3:fast?-1:0),base:strong?6.5:3.2,scaling:strong?.087:.047,angle:down?75:up?-86:key==='dl'?-72:key==='dh'?-42:-27,hitbox:{x:up?4:low?33:39,y:up?-62:down?5:low?-9:-32,radius:strong?39:25,endX:up?4:low?68:65,endY:up?-92:down?38:low?-9:-32},impulse:key==='sl'?5:key==='sh'?7:0,armor:heavy&&key==='sh',projectile,charge:key==='sh'} satisfies MoveDefinition];
  })) as Record<MoveId,MoveDefinition>;
  return tuneMoves(id,base);
}
export const FIGHTERS:FighterDefinition[]=[
 {id:'kairo',name:'Kairo Venn',title:'THE RIFT WALKER',role:'All-rounder',color:'#27e8ed',speed:5.6,acceleration:.95,jump:12.8,gravity:.54,weight:1,power:1,height:58,width:25,source:'martial-hero-3',bio:'A wandering fighter. A world between worlds. Quick strings, balanced power, and a rising corkscrew to find your way home.',moves:moves('kairo')},
 {id:'regent',name:'Regent-9',title:'THE FALLEN SOVEREIGN',role:'Heavyweight',color:'#ffe45b',speed:4.6,acceleration:.7,jump:13,gravity:.64,weight:1.24,power:1.13,height:70,width:30,source:'medieval-king-pack-2',bio:'A king with no kingdom. Trade speed for armored pressure, sweeping steel, and a royal decree that sends rivals into orbit.',moves:moves('regent')},
 {id:'vexa',name:'Vexa Thorn',title:'THE VOID HUNTRESS',role:'Rushdown',color:'#ff58b1',speed:6.8,acceleration:1.1,jump:12.4,gravity:.56,weight:.86,power:.94,height:57,width:23,source:'huntress',bio:'Never where you expect her. Close the gap, catch a dodge, and carry opponents offstage with razor-sharp aerial pressure.',moves:moves('vexa')},
 {id:'omen',name:'Omen Null',title:'THE LAST SIGNAL',role:'Zoner',color:'#b7a1ff',speed:4.9,acceleration:.8,jump:12.2,gravity:.48,weight:.95,power:1,height:67,width:27,source:'evil-wizard-2',bio:'Something answered from the other side. Control the arena with bolts, delayed traps, and a short rift-shift recovery.',moves:moves('omen')}
];
export const fighter=(id:FighterId)=>FIGHTERS.find(f=>f.id===id)!;
export interface Slot { fighter:FighterId; difficulty:Difficulty; team:number; name?:string; human?:boolean }
export type StageId='rift-array'|'neon-foundry';
export interface MatchConfig { stage?:StageId; feel?:FeelMode; mode:'stock'|'timed'; stocks:number; seconds:number; teams:boolean; friendlyFire:boolean; slots:Slot[]; items:'off'|'low'|'normal'; seed:number }
export const defaultConfig:MatchConfig={stage:'rift-array',mode:'stock',stocks:3,seconds:240,teams:false,friendlyFire:false,slots:[{fighter:'kairo',difficulty:'medium',team:0},{fighter:'vexa',difficulty:'medium',team:1}],items:'low',seed:743};
export interface StageDefinition { id:StageId; name:string; subtitle:string; description:string; art:'station'|'factory'; platforms:{x:number;y:number;width:number;oneWay:boolean}[]; blast:{left:number;right:number;top:number;bottom:number}; spawns:number[] }
export const STAGE:StageDefinition={id:'rift-array',name:'Rift Array',subtitle:'ORBITAL DOCK',description:'A moonlit orbital station. One battle deck, one floating ledge, and distant launches.',art:'station',platforms:[{x:160,y:610,width:680,oneWay:false},{x:380,y:425,width:240,oneWay:true}],blast:{left:-180,right:1180,top:-200,bottom:1020},spawns:[330,670,450,550]};
export const STAGES:StageDefinition[]=[STAGE,{id:'neon-foundry',name:'Neon Foundry',subtitle:'DEEP-SPACE MANUFACTURING',description:'A sprawling automated factory. A wider battle deck and three staggered gantries open new routes through the machinery.',art:'factory',platforms:[{x:60,y:650,width:880,oneWay:false},{x:155,y:465,width:220,oneWay:true},{x:650,y:420,width:220,oneWay:true},{x:405,y:300,width:210,oneWay:true}],blast:{left:-280,right:1280,top:-280,bottom:1100},spawns:[230,770,390,610]}];
export const stageDefinition=(id:StageId='rift-array')=>STAGES.find(s=>s.id===id)??STAGE;
export type ItemKind='bomb'|'spike'|'repair';
export interface ItemDefinition {name:string;damage:number;base:number;scaling:number;lifetime:number;color:number}
export const ITEMS:Record<ItemKind,ItemDefinition>={bomb:{name:'Rift Bomb',damage:22,base:9,scaling:.085,lifetime:900,color:0xff58b1},spike:{name:'Gravity Spike',damage:12,base:5,scaling:.06,lifetime:900,color:0xffe45b},repair:{name:'Repair Byte',damage:-25,base:0,scaling:0,lifetime:900,color:0x27e8ed}};
export interface Settings { gameFeel:FeelPreference;haptics:boolean; music:number;sfx:number;voices:number;crowd:number;mute:boolean;shake:boolean;flashes:boolean;contrast:boolean;touchScale:number;touchOpacity:number;keys:Record<string,string> }
export const defaultSettings:Settings={gameFeel:'auto',haptics:true,music:.16,sfx:.55,voices:.65,crowd:.65,mute:false,shake:true,flashes:true,contrast:false,touchScale:1,touchOpacity:1,keys:{left:'KeyA',right:'KeyD',up:'KeyW',down:'KeyS',jump:'Space',light:'KeyJ',heavy:'KeyK',dodge:'KeyL',item:'KeyH'}};
export function asset(path:string){return `./assets/${path}`;}
export function damageColor(d:number){const stops=[[0,245,247,245],[40,255,230,91],[90,255,155,62],[150,255,70,92],[240,155,31,65]];let a=stops[0],b=stops[1];for(let i=1;i<stops.length;i++){b=stops[i];if(d<=b[0])break;a=b;}const t=Math.min(1,Math.max(0,(d-a[0])/(b[0]-a[0]||1)));return '#'+a.slice(1).map((n,i)=>Math.round(n+(b[i+1]-n)*t).toString(16).padStart(2,'0')).join('');}
