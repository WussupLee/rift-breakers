import fs from 'node:fs/promises';import path from 'node:path';
const root='dist/client';
if(process.env.GITHUB_ACTIONS){
 async function visit(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await visit(file);else if(/\.(html|js|css|json|rsc)$/.test(file)){const source=await fs.readFile(file,'utf8');const result=source.replace(/(?<!\/rift-breakers)\/_next\//g,'/rift-breakers/_next/').replace(/(["'`])_next\//g,'$1rift-breakers/_next/');if(result!==source)await fs.writeFile(file,result);}}}
 await visit(root);
}
const html=await fs.readFile(path.join(root,'index.html'),'utf8');
if(!html.includes('selection-screen')||!html.includes('RIFT'))throw new Error('Static export is missing the game entry screen');
await fs.writeFile(path.join(root,'.nojekyll'),'');
console.log('Static entry page verified; GitHub Pages assets prepared.');
