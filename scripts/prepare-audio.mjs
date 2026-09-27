// Rebuild recorded-sample assets; no synthesis. Requires FFMPEG and fetched source packs.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const ffmpeg=process.env.FFMPEG;if(!ffmpeg)throw Error('Set FFMPEG to an installed FFmpeg executable.');
const out='public/assets/audio';mkdirSync(out+'/samples',{recursive:true});mkdirSync(out+'/music',{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
function run(args){const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error',...args],{maxBuffer:64*1024*1024});if(r.status!==0)throw Error(r.stderr?.toString());return r.stdout;}
function pcm(file,ss=0,duration=30){return run(['-ss',String(ss),'-i',file,'-t',String(duration),'-ac','1','-ar','44100','-f','f32le','pipe:1']);}
function meter(bytes){const a=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.length/4);let peak=0,sum=0;for(const v of a){peak=Math.max(peak,Math.abs(v));sum+=v*v;}return{duration:a.length/44100,peakDb:20*Math.log10(peak||1e-9),rmsDb:10*Math.log10(sum/a.length||1e-18)};}
const sources={
 rpg:{author:'Kenney',url:'https://kenney.nl/assets/rpg-audio',license:'CC0-1.0'},
 impact:{author:'Kenney',url:'https://kenney.nl/assets/impact-sounds',license:'CC0-1.0'},
 sci:{author:'Kenney',url:'https://kenney.nl/assets/sci-fi-sounds',license:'CC0-1.0'},
 ui:{author:'Kenney',url:'https://kenney.nl/assets/interface-sounds',license:'CC0-1.0'},
 digital:{author:'Kenney',url:'https://kenney.nl/assets/digital-audio',license:'CC0-1.0'},
 male:{author:'HaelDB and contributing voice performers',url:'https://opengameart.org/content/male-gruntyelling-sounds',license:'CC0-1.0 (selected from dual license)'},
 female:{author:'AuraVoice / Nocturnal_Vanguard',url:'https://opengameart.org/content/female-hurt-grunts-groans',license:'CC0-1.0'},
 gasp:{author:'Dvideoguy',url:'https://freesound.org/people/Dvideoguy/sounds/207779/',license:'CC0-1.0',download:'https://cdn.freesound.org/previews/207/207779_2046066-hq.mp3'},
 cheer:{author:'jessepash',url:'https://freesound.org/people/jessepash/sounds/139972/',license:'CC0-1.0',download:'https://cdn.freesound.org/previews/139/139972_968325-hq.mp3'},
};
const dirs={rpg:'work/audio-sources/rpg/Audio',impact:'work/downloads/impact-sounds/Audio',sci:'work/downloads/sci-fi-sounds/Audio',ui:'work/downloads/interface-sounds/Audio',digital:'work/downloads/digital-audio/Audio',male:'work/audio-sources/male/yelling sounds'};
const specs=[];
const add=(name,source,file,ss=0,duration=3)=>specs.push({name,source,file:dirs[source]?dirs[source]+'/'+file:'work/audio-sources/'+file,ss,duration});
for(let i=0;i<4;i++)add('step'+i,'rpg','footstep0'+i+'.ogg',0,.65);
for(let i=1;i<=3;i++)add('cloth'+i,'rpg','cloth'+i+'.ogg',0,.4);
add('slice1','rpg','knifeSlice.ogg');add('slice2','rpg','knifeSlice2.ogg');
add('handle','rpg','handleSmallLeather.ogg',0,.6);
for(let i=0;i<3;i++){add('punch'+i,'impact','impactPunch_medium_00'+i+'.ogg');add('heavy'+i,'impact','impactPunch_heavy_00'+i+'.ogg');}
add('land','impact','impactSoft_medium_000.ogg');
add('metal','impact','impactPlate_light_000.ogg');
add('magic1','sci','laserSmall_000.ogg',0,.65);add('magic2','sci','laserSmall_001.ogg',0,.65);
add('beam','sci','laserLarge_001.ogg',0,1);
add('portal','sci','forceField_000.ogg',0,1.2);
add('respawn','sci','doorOpen_000.ogg',0,.8);
add('explosion','sci','explosionCrunch_000.ogg',0,1.3);
add('charge','sci','forceField_002.ogg',0,.5);
add('repair','digital','powerUp1.ogg',0,.8);
add('click','ui','click_003.ogg');add('confirm','ui','confirmation_002.ogg');add('count','ui','drop_002.ogg');
for(const i of [1,3,4,5])add('grunt'+i,'male','3grunt'+i+'.wav',0,2);
add('vexa1','female','female.ogg',.4,.78);add('vexa2','female','female.ogg',2.05,.7);add('vexa3','female','female.ogg',3.68,.5);
add('gasp','gasp','gasp.mp3',0,1.486);
add('cheer','cheer','cheer.mp3',0,4.5);
const records=[];
for(const s of specs){
 // Locate audible onset/tail in the recording, retaining a short natural lead-in.
 const raw=pcm(s.file,s.ss,s.duration),a=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4);let first=0,last=a.length-1;
 while(first<last&&Math.abs(a[first])<.003)first++;while(last>first&&Math.abs(a[last])<.003)last--;
 const start=Math.max(0,first/44100-.008),duration=Math.min(s.duration,last/44100+.05)-start;
 const pre=meter(pcm(s.file,s.ss+start,duration));
 const db=Math.min(-20-pre.rmsDb,-6-pre.peakDb,20);
 const file='samples/'+s.name+'.mp3',fade=s.source==='cheer'?.65:.025;
 run(['-y','-ss',String(s.ss+start),'-i',s.file,'-t',String(duration),'-ac','1','-ar','44100','-af',
 'volume='+db+'dB,afade=t=in:d=0.004,afade=t=out:st='+Math.max(.004,duration-fade)+':d='+fade,
 '-map_metadata','-1','-c:a','libmp3lame','-b:a','128k',out+'/'+file]);
 const bytes=readFileSync(out+'/'+file),measured=meter(pcm(out+'/'+file));
 if(measured.peakDb> -4.5||measured.duration<.005)throw Error('Invalid levels: '+file+JSON.stringify(measured));
 records.push({...s,file,original:s.file,sourceSha256:hash(readFileSync(s.file)),sha256:hash(bytes),trimStart:s.ss+start,trimDuration:duration,gainDb:db,...measured});
 console.log(s.name,measured.duration.toFixed(2)+'s',measured.peakDb.toFixed(1)+'dB peak',measured.rmsDb.toFixed(1)+'dB RMS');
}
const musicOriginal='work/audio-sources/midnight-loop-background.mp3',musicFile='music/midnight-loop-background.mp3';
copyFileSync(musicOriginal,out+'/'+musicFile);
const music={file:musicFile,sha256:hash(readFileSync(musicOriginal)),source:'https://github.com/WussupLee/midnight-loop-highway-racer/blob/2770837bdc1f792e461315ec2f4dba689a750086/public/audio/midnight-loop-background.mp3',license:'Reused at project owner request. Upstream does not identify artist or license; not represented as CC0.',...meter(pcm(musicOriginal,0,600))};
writeFileSync(out+'/manifest.json',JSON.stringify({processing:'Recorded audio only. Trim, mono MP3 conversion, short fades, RMS normalization limited to -6 dB sample peak. Music copied byte-for-byte.',sources,samples:records,music},null,2)+'\n');
console.log('Music',music);
