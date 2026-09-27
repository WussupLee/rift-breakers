import fs from 'node:fs/promises';
for(const slug of ['impact-sounds','interface-sounds','digital-audio','sci-fi-sounds','planets','smoke-particles']){
 const html=await (await fetch('https://kenney.nl/assets/'+slug)).text();
 const links=[...html.matchAll(/href=['"]([^'"]+)['"]/g)].map(m=>m[1]);const url=links.find(l=>l.includes('.zip'));
 if(!url){console.log(slug,links.filter(l=>l.includes('download')));continue;}
 const full=new URL(url,'https://kenney.nl').href;const r=await fetch(full);if(!r.ok)throw new Error(full);
 await fs.writeFile('work/downloads/'+slug+'.zip',Buffer.from(await r.arrayBuffer()));console.log(slug,'downloaded');
}
