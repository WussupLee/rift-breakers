import type {CombatEvent} from './simulation';
import type {FighterId,MoveId,Settings} from './data';
export type AudioBus='sfx'|'voices'|'crowd';
type Cue={label:string;samples:string[];gain:number;bus:AudioBus;cooldown:number;priority:number};
const cue=(label:string,samples:string[],gain:number,cooldown=70,priority=1,bus:AudioBus='sfx'):Cue=>({label,samples,gain,cooldown,priority,bus});
/** Existing recordings only. Gains are relative to measured asset levels. */
export const CUES={
 step:cue('Running footsteps',['step0','step1','step2','step3'],.16,170),
 jump:cue('Jump / air jump / wall jump',['cloth1','cloth2'],.17,100),
 land:cue('Soft landing',['land'],.24,130),
 hardLand:cue('Heavy landing',['land','heavy0'],.36,180),
 dodge:cue('Spot / air dodge',['cloth3'],.30,150),
 dash:cue('Ground dash',['cloth2'],.22,150),
 drop:cue('Drop through / fast fall',['cloth1'],.10,300),
 swing:cue('Martial light swing',['cloth3'],.34,85),
 heavySwing:cue('Martial heavy swing',['slice2'],.40,100),
 blade:cue('Sword / poleaxe swing',['slice1','slice2'],.40,85),
 magic:cue('Staff bolt / orb / shard',['magic1','magic2'],.34,100),
 beam:cue('Rift beam / crystal / mine',['beam'],.42,180),
 recovery:cue('Rising recovery',['slice2'],.36,180),
 teleport:cue('Teleport recovery',['respawn'],.38,250),
 charge:cue('Heavy charge onset',['charge'],.20,500),
 hit:cue('Light hit contact',['punch0','punch1','punch2'],.85,45,3),
 heavyHit:cue('Heavy hit contact',['heavy0','heavy1','heavy2'],1,65,4),
 launch:cue('Strong launch accent',['metal'],.65,160,4),
 ko:cue('Knockout portal',['portal'],.85,200,5),
 respawn:cue('Respawn portal',['respawn'],.32,200,2),
 pickup:cue('Item pickup / catch',['handle'],.27,150),
 throw:cue('Item throw',['slice1'],.33,150),
 repair:cue('Repair Byte consumed',['repair'],.32,300,2),
 explosion:cue('Rift Bomb explosion',['explosion'],.85,160,4),
 count:cue('Countdown tick',['count'],.32,500,2),
 start:cue('Brawl begins',['confirm'],.48,700,3),
 sudden:cue('Sudden death',['beam'],.55,1000,4),
 victory:cue('Match complete',['confirm'],.48,1000,4),
 ui:cue('Menu selection',['click'],.32,60,2),
 kairoVoice:cue('Kairo quiet hurt grunt',['grunt4','grunt5'],.28,650,2,'voices'),
 regentVoice:cue('Regent quiet hurt grunt',['grunt3','grunt5'],.27,650,2,'voices'),
 vexaVoice:cue('Vexa quiet hurt grunt',['vexa1','vexa2','vexa3'],.26,650,2,'voices'),
 omenVoice:cue('Omen quiet hurt grunt',['grunt1','grunt4'],.25,650,2,'voices'),
 gasp:cue('Crowd gasp — strong hit',['gasp'],.42,5500,3,'crowd'),
 cheer:cue('Crowd cheer — knockout / finish',['cheer'],.48,6500,5,'crowd'),
} satisfies Record<string,Cue>;
export type AudioCue=keyof typeof CUES;
export const MUSIC_PATH='assets/audio/music/midnight-loop-background.mp3';
export const SAMPLE_NAMES=[...new Set(Object.values(CUES).flatMap(c=>c.samples))];
export const isHeavy=(move?:MoveId)=>!!move&&['nh','sh','dh','rec','gp'].includes(move);
export function attackCue(id:FighterId,move?:MoveId):AudioCue {
 if(move==='rec')return id==='omen'?'teleport':'recovery';
 if(id==='omen')return isHeavy(move)?'beam':'magic';
 if(id==='regent'||id==='vexa')return 'blade';
 return isHeavy(move)?'heavySwing':'swing';
}
export function eventCues(e:CombatEvent,id:FighterId):AudioCue[]{
 if(e.cue)return [e.cue];
 switch(e.kind){
 case 'attack':return [attackCue(id,e.move)];
 case 'hit':return [e.power>=11?'heavyHit':'hit',...(e.power>=17?['launch'] as AudioCue[]:[]),(id+'Voice') as AudioCue,...(e.power>=14?['gasp'] as AudioCue[]:[])];
 case 'ko':return ['ko','cheer'];
 case 'item':return [e.power>=35?'explosion':e.power===25?'repair':'pickup'];
 case 'land':return [e.power>=10?'hardLand':'land'];
 case 'sudden':return ['sudden'];
 default:return [e.kind];
 }
}
export function busVolume(bus:AudioBus,s:Settings){
 const clamp=(n:number,fallback:number)=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback;
 return s.mute?0:clamp(s.sfx,.55)*(bus==='sfx'?1:clamp(s[bus],.65));
}
/** Wall-clock cooldowns prevent sound backlogs during slow-motion/network jitter. */
export class CueGate{
 last=new Map<string,number>();crowdUntil=0;crowdPriority=0;
 accept(kind:AudioCue,actor:number,now:number){
  const c=CUES[kind],key=c.bus==='voices'?'voice:'+actor:kind+':'+actor;
  if(now-(this.last.get(key)??-Infinity)<c.cooldown)return false;
  if(c.bus==='crowd'){
   if(now<this.crowdUntil&&c.priority<=this.crowdPriority)return false;
   this.crowdUntil=now+c.cooldown;this.crowdPriority=c.priority;
  }
  this.last.set(key,now);return true;
 }
 reset(){this.last.clear();this.crowdUntil=0;this.crowdPriority=0;}
}

