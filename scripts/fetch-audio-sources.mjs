import {mkdir,writeFile} from 'node:fs/promises';
const sources={
 'rpg.zip':'https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip',
 'male.zip':'https://opengameart.org/sites/default/files/yelling%20sounds.zip',
 'female.ogg':'https://opengameart.org/sites/default/files/female_hurt_grunts_groans_1.ogg',
 'gasp.mp3':'https://cdn.freesound.org/previews/207/207779_2046066-hq.mp3',
 'cheer.mp3':'https://cdn.freesound.org/previews/139/139972_968325-hq.mp3',
 'midnight-loop-background.mp3':'https://raw.githubusercontent.com/WussupLee/midnight-loop-highway-racer/2770837bdc1f792e461315ec2f4dba689a750086/public/audio/midnight-loop-background.mp3',
};
await mkdir('work/audio-sources',{recursive:true});
await Promise.all(Object.entries(sources).map(async([file,url])=>{const r=await fetch(url);if(!r.ok)throw new Error(`${r.status}: ${url}`);const data=Buffer.from(await r.arrayBuffer());await writeFile(`work/audio-sources/${file}`,data);console.log(file,data.length);}));
