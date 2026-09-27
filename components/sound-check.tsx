'use client';
import {useEffect,useState} from 'react';
import {CUES,type AudioCue} from '@/game/audio-catalog';
import type {GameAudio} from '@/game/audio';
export function SoundCheck({getAudio}:{getAudio:()=>GameAudio}){
 const [cue,setCue]=useState<AudioCue>('jump'),[music,setMusic]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{const audio=getAudio();return()=>audio.previewMusic(false);},[getAudio]);
 async function test(){setMessage('Loading recording…');const audio=getAudio();await audio.audition(cue);setMessage(!audio.context?'Audio is unavailable in this browser. Try a current Safari, Chrome or Firefox browser.':audio.failures.length?'Some recordings could not load. Check your connection and reload.':audio.settings.mute?'Audio is muted. Unmute to listen.':audio.context.state!=='running'?'Tap Play sound again to enable browser audio.':'Playing at your current mix levels.');}
 return <section className="sound-check" data-audio-preview><h3>SOUND CHECK</h3><p className="muted">Recorded effects only. Movement stays quiet; contact leads the mix. Voice and crowd levels are relative to Sound effects.</p><label htmlFor="sound-cue">Audition a game action</label><select id="sound-cue" value={cue} onChange={e=>setCue(e.target.value as AudioCue)}>{Object.entries(CUES).map(([id,c])=><option key={id} value={id}>{c.label}</option>)}</select><div className="sound-check-actions"><button className="secondary-button" onClick={()=>void test()}>Play sound</button><button className="secondary-button" aria-pressed={music} onClick={()=>{const next=!music;setMusic(next);getAudio().previewMusic(next);}}>{music?'Stop music':'Preview fight music'}</button></div><p role="status" className="muted">{message}</p><a href="assets/audio/SOUND-DESIGN.md" target="_blank" rel="noreferrer">Full cue list, sources & level measurements ↗</a></section>;
}
