'use client';
import {useEffect,useState,useRef} from 'react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Switch} from '@/components/ui/switch';
import {TouchHaptics,supportsHaptics} from '@/game/haptics';
import type {Settings} from '@/game/data';
import type {FeelPreference} from '@/game/feel';
export function FeelSettings({settings,onChange}:{settings:Settings;onChange:(patch:Partial<Settings>)=>void}){
 const [supported,setSupported]=useState(false),[tested,setTested]=useState(false);const haptics=useRef(new TouchHaptics());
 useEffect(()=>setSupported(supportsHaptics()),[]);
 return <div className="feel-settings">
  <label className="pick"><span>Game feel</span><Select value={settings.gameFeel} onValueChange={v=>onChange({gameFeel:v as FeelPreference})}><SelectTrigger aria-label="Game feel"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="auto">Auto · relaxed on touch</SelectItem><SelectItem value="relaxed">Relaxed · 85% pace</SelectItem><SelectItem value="classic">Classic · original pace</SelectItem></SelectContent></Select></label>
  <p className="muted">15% slower combat; floatier jumps, gentler falls, and more air control. Extra input and ledge-jump grace. Same rules for all fighters. Classic restores the original feel.</p>
  <div className="toggle-row"><span>Touch vibration</span><Switch aria-label="Touch vibration" disabled={!supported} checked={supported&&settings.haptics} onCheckedChange={v=>onChange({haptics:v})}/></div>
  <p className="muted">{supported?'Short, subtle taps on supported hardware. Device settings can still suppress vibration.':'This browser does not offer game-button vibration. iPhone browsers cannot reliably reproduce native-app haptics; visual press feedback stays active.'}</p>
  <button className="secondary-button" disabled={!supported||!settings.haptics} onClick={()=>{haptics.current.tap(settings.haptics);setTested(true);}}>Test vibration</button>
  {tested&&supported&&<p className="muted" role="status">Tap requested. Whether you feel it depends on your device and its vibration settings.</p>}
 </div>;
}
