import fs from 'node:fs';import path from 'node:path';import {PNG} from 'pngjs';
const specs={kairo:{folder:'Martial Hero 3/Sprite',counts:[10,8,3,3,7,6,9,3,11],files:['Idle','Run','Going Up','Going Down','Attack1','Attack2','Attack3','Take Hit','Death']},regent:{folder:'Medieval King Pack 2/Sprites',counts:[8,8,2,2,4,4,4,4,6],files:['Idle','Run','Jump','Fall','Attack1','Attack2','Attack3','Take Hit','Death']},vexa:{folder:'Huntress/Sprites',counts:[8,8,2,2,5,5,7,3,8],files:['Idle','Run','Jump','Fall','Attack1','Attack2','Attack3','Take hit','Death']},omen:{folder:'EVil Wizard 2/Sprites',counts:[8,8,2,2,8,8,8,3,7],files:['Idle','Run','Jump','Fall','Attack1','Attack2','Attack1','Take hit','Death']}};
const keys=['idle','run','jump','fall','attack1','attack2','attack3','hurt','death'];const manifest={};
for(const [id,spec] of Object.entries(specs)){
 const out=`public/assets/fighters/${id}`;fs.mkdirSync(out,{recursive:true});manifest[id]={};
 for(let a=0;a<keys.length;a++){
  const file=path.join('work/downloads',id,spec.folder,spec.files[a]+'.png');const png=PNG.sync.read(fs.readFileSync(file));const fw=png.width/spec.counts[a];
  if(!Number.isInteger(fw))throw new Error(file+' bad width');
  fs.copyFileSync(file,`${out}/${keys[a]}.png`);
  let minx=fw,miny=png.height,maxx=0,maxy=0;for(let y=0;y<png.height;y++)for(let x=0;x<fw;x++)if(png.data[(y*png.width+x)*4+3]>100){minx=Math.min(minx,x);miny=Math.min(miny,y);maxx=Math.max(maxx,x);maxy=Math.max(maxy,y);}
  manifest[id][keys[a]]={width:fw,height:png.height,frames:spec.counts[a],bounds:{x:minx,y:miny,w:maxx-minx+1,h:maxy-miny+1}};
  if(a===0){const portrait=new PNG({width:maxx-minx+9,height:maxy-miny+9});PNG.bitblt(png,portrait,minx,miny,maxx-minx+1,maxy-miny+1,4,4);fs.writeFileSync(`${out}/portrait.png`,PNG.sync.write(portrait));}
 }
 const license=path.join('work/downloads',id,spec.folder,'../License.txt');fs.copyFileSync(license,`${out}/LICENSE.txt`);
}
fs.writeFileSync('public/assets/manifest.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest,null,2));
