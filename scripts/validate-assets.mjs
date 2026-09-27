import fs from 'node:fs';import assert from 'node:assert/strict';import {PNG} from 'pngjs';
const manifest=JSON.parse(fs.readFileSync('public/assets/manifest.json','utf8'));
for(const id of ['kairo','regent','vexa','omen']){for(const key of ['idle','run','jump','fall','attack1','attack2','attack3','hurt','death']){const a=manifest[id][key];assert(a&&a.frames>0);const png=PNG.sync.read(fs.readFileSync(`public/assets/fighters/${id}/${key}.png`));assert.equal(png.width,a.width*a.frames);assert.equal(png.height,a.height);assert(a.bounds.w>0&&a.bounds.h>0);}assert(fs.existsSync(`public/assets/fighters/${id}/LICENSE.txt`));}
console.log('Validated 36 animation mappings, frame grids, visible bounds, and 4 licenses.');
