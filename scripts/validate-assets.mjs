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

const {createHash}=await import('node:crypto');
const audio=JSON.parse(fs.readFileSync('public/assets/audio/manifest.json','utf8'));
for(const s of [...audio.samples,audio.music]){
 const bytes=fs.readFileSync('public/assets/audio/'+s.file);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),s.sha256,'Audio asset hash: '+s.file);
 assert(s.duration>0&&Number.isFinite(s.peakDb));
 if(s.sourceSha256){assert(s.peakDb<=-4.5);assert(audio.sources[s.source].license.includes('CC0'));}
}
assert(fs.existsSync('public/assets/audio/SOUND-DESIGN.md'));
console.log('Validated recorded audio hashes, measured levels, source records and music provenance.');

const factoryBytes=fs.readFileSync('public/assets/factory/background.png'),factory=PNG.sync.read(factoryBytes);
assert.equal(factory.width,640);assert.equal(factory.height,640);assert(factoryBytes.length<1024*1024);assert(fs.existsSync('public/assets/factory/ART-NOTES.md'));
console.log('Validated Neon Foundry background, texture budget and provenance.');

assert(fs.existsSync('public/assets/fighters/ANIMATION-NOTES.md'),'Supplementary art provenance and generation prompts are required');
for(const id of ['kairo','regent','vexa','omen']){
 const meta=JSON.parse(fs.readFileSync(`public/assets/fighters/${id}/motion.json`,'utf8')),bytes=fs.readFileSync(`public/assets/fighters/${id}/motion.png`),png=PNG.sync.read(bytes);
 assert.equal(meta.frames,32);assert.equal(meta.width,256);assert.equal(meta.height,256);assert.equal(png.width,2048);assert.equal(png.height,1024);assert(bytes.length<1024*1024);
 const hashes=new Set();for(let frame=0;frame<32;frame++){let visible=0;const pixels=[];for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=((Math.floor(frame/8)*256+y)*png.width+frame%8*256+x)*4;pixels.push(...png.data.subarray(i,i+4));if(png.data[i+3]>32){visible++;assert(x>0&&x<255&&y>0&&y<255,'Packed sprite clipped');}}assert(visible>60);hashes.add(createHash('sha256').update(Buffer.from(pixels)).digest('hex'));assert.equal(meta.pivots[frame].x,128);assert.equal(meta.pivots[frame].y,208);}assert.equal(hashes.size,32,'Every supplementary pose must be distinct');
}
console.log('Validated 128 supplementary poses: unique pixels, complete cells, transparent padding, pivots and texture budgets.');
