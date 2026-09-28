// Mechanical atlas packing only: preserve generated alpha and nearest-neighbor pixels.
import fs from 'node:fs/promises';
import {PNG} from 'pngjs';
const [id,path]=process.argv.slice(2);if(!['kairo','regent','vexa','omen'].includes(id)||!path)throw Error('Usage: node scripts/import-motion-art.mjs fighter generated.png');
const png=PNG.sync.read(await fs.readFile(path));
// Generated canvases need not be multiples of the grid. Locate transparent gutters.
function cuts(count,horizontal){const extent=horizontal?png.width:png.height,other=horizontal?png.height:png.width,result=[0];for(let i=1;i<count;i++){let best=Math.round(i*extent/count),score=Infinity;for(let p=Math.floor((i-.22)*extent/count);p<Math.ceil((i+.22)*extent/count);p++){let n=0;for(let q=0;q<other;q++){const x=horizontal?p:q,y=horizontal?q:p;if(png.data[(y*png.width+x)*4+3]>32)n++;}const value=n*100+Math.abs(p-i*extent/count);if(value<score){score=value;best=p;}}result.push(best);}return [...result,extent];}
const xs=cuts(4,true),ys=cuts(8,false);
const cells=[];
for(let n=0;n<32;n++){
 const col=n%4,row=Math.floor(n/4),ox=xs[col],oy=ys[row],cw=xs[col+1]-ox,ch=ys[row+1]-oy;let left=cw,top=ch,right=-1,bottom=-1;
 for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(png.data[((y+oy)*png.width+x+ox)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<0)throw Error(`Empty pose ${n}`);
 if(left<2||right>cw-3||top<2||bottom>ch-3)console.warn(`Inspect pose ${n}: art approaches cell edge`,{left,top,right,bottom});
 let sx=0,count=0;for(let y=Math.max(top,bottom-5);y<=bottom;y++)for(let x=left;x<=right;x++)if(png.data[((y+oy)*png.width+x+ox)*4+3]>128){sx+=x;count++;}
 cells.push({ox,oy,left,top,right,bottom,pivotX:count?sx/count:(left+right)/2});
}
const original=JSON.parse(await fs.readFile('public/assets/manifest.json','utf8'))[id].idle;
const referenceHeight=cells.slice(0,4).map(c=>c.bottom-c.top+1).sort((a,b)=>a-b);
const scale=original.bounds.h/((referenceHeight[1]+referenceHeight[2])/2),size=256,baseline=208;
const out=new PNG({width:size*8,height:size*4}),frames=[];
for(const [n,c]of cells.entries()){
 const width=Math.round((c.right-c.left+1)*scale),height=Math.round((c.bottom-c.top+1)*scale),px=size/2-Math.round((c.pivotX-c.left)*scale),py=baseline-height;
 if(px<2||px+width>size-2||py<2)throw Error(`Pose ${n} exceeds packed cell`);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const si=((c.oy+c.top+Math.min(c.bottom-c.top,Math.floor(y/scale)))*png.width+c.ox+c.left+Math.min(c.right-c.left,Math.floor(x/scale)))*4;
  const di=((Math.floor(n/8)*size+py+y)*out.width+(n%8)*size+px+x)*4;png.data.copy(out.data,di,si,si+4);
 }
 frames.push({x:size/2,y:baseline,width,height});
}
const dir=`public/assets/fighters/${id}`;
await fs.writeFile(`${dir}/motion.png`,PNG.sync.write(out));
await fs.writeFile(`${dir}/motion.json`,JSON.stringify({width:size,height:size,frames:32,columns:8,baseline,source:'AI-authored supplementary poses; original CC0 character design by LuizMelo',pivots:frames},null,2)+'\n');
console.log(id,{source:[png.width,png.height],scale,bytes:PNG.sync.write(out).length,frames:32});
