import fs from 'node:fs/promises';
import {PNG} from 'pngjs';
const path=process.argv[2];if(!path)throw new Error('Pass the original generated PNG path.');
const source=PNG.sync.read(await fs.readFile(path)),out=new PNG({width:640,height:640});
for(let y=0;y<640;y++)for(let x=0;x<640;x++){
 const si=(Math.floor(y*source.height/640)*source.width+Math.floor(x*source.width/640))*4;
 source.data.copy(out.data,(y*640+x)*4,si,si+4);
}
await fs.mkdir('public/assets/factory',{recursive:true});
await fs.writeFile('public/assets/factory/background.png',PNG.sync.write(out));
console.log('Packed factory background at 640×640, nearest-neighbor.');
