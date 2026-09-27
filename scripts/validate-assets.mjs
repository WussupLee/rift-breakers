import fs from 'node:fs';import assert from 'node:assert/strict';import {PNG} from 'pngjs';
const manifest=JSON.parse(fs.readFileSync('public/assets/manifest.json','utf8'));
for(const id of ['kairo','regent','vexa','omen']){for(const key of ['idle','run','jump','fall','attack1','attack2','attack3','hurt','death']){const a=manifest[id][key];assert(a&&a.frames>0);const png=PNG.sync.read(fs.readFileSync(`public/assets/fighters/${id}/${key}.png`));assert.equal(png.width,a.width*a.frames);assert.equal(png.height,a.height);assert(a.bounds.w>0&&a.bounds.h>0);}assert(fs.existsSync(`public/assets/fighters/${id}/LICENSE.txt`));}
console.log('Validated 36 animation mappings, frame grids, visible bounds, and 4 licenses.');
for(const name of ['background','platform','shuttle']){
 const bytes=fs.readFileSync(`public/assets/station/${name}.png`),png=PNG.sync.read(bytes);
 assert(bytes.length<1024*1024,'Station art must stay below 1 MiB per texture');assert(png.width>0&&png.height>0);
 if(name==='background'){assert.equal(png.width,640);assert.equal(png.height,640);}
 else{assert(png.data.some((v,i)=>i%4===3&&v===0),'Sprite must preserve transparency');}
 if(name==='platform'){let opaque=0;for(let x=0;x<png.width;x++)if(png.data[x*4+3]>=128)opaque++;assert(opaque/png.width>.9,'Platform walking edge must span sprite width');}
}
assert(fs.existsSync('public/assets/station/ART-NOTES.md'));
console.log('Validated three station textures, transparent sprites, walking edge, size budgets, and provenance.');
