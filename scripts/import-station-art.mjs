// Mechanical asset packing only: alpha-bound trimming and nearest-neighbor sizing.
// Artwork is generated with the built-in image tool, never drawn by this script.
import {PNG} from 'pngjs';
import fs from 'node:fs/promises';
const [background,platform,shuttle]=process.argv.slice(2);
if(!background||!platform||!shuttle)throw new Error('Pass the three generated PNG source paths.');
await fs.mkdir('public/assets/station',{recursive:true});
function pack(source,x,y,w,h,width,height){const out=new PNG({width,height});for(let oy=0;oy<height;oy++)for(let ox=0;ox<width;ox++){const src=((y+Math.floor(oy*h/height))*source.width+x+Math.floor(ox*w/width))*4;source.data.copy(out.data,(oy*width+ox)*4,src,src+4);}return PNG.sync.write(out,{deflateLevel:9});}
const sky=PNG.sync.read(await fs.readFile(background));
await fs.writeFile('public/assets/station/background.png',pack(sky,0,0,sky.width,sky.height,640,640));
for(const [name,path,width] of [['platform',platform,680],['shuttle',shuttle,32]]){
 const info=PNG.sync.read(await fs.readFile(path)),data=info.data;
 let x0=info.width,y0=info.height,x1=0,y1=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=128){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 if(x1<=x0||y1<=y0)throw new Error('Empty generated sprite '+name);
 if(name==='platform')for(let y=y0;y<=y1;y++){let opaque=0;for(let x=x0;x<=x1;x++)if(data[(y*info.width+x)*4+3]>=128)opaque++;if(opaque/(x1-x0+1)>.94){y0=y;break;}}
 await fs.writeFile(`public/assets/station/${name}.png`,pack(info,x0,y0,x1-x0+1,y1-y0+1,width,Math.round(width*(y1-y0+1)/(x1-x0+1))));
 console.log(name,{left:x0,top:y0,width:x1-x0+1,height:y1-y0+1});
}
