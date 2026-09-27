import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('work/downloads');
await fs.mkdir(root,{recursive:true});
const packs={kairo:'martial-hero-3',regent:'medieval-king-pack-2',vexa:'huntress',omen:'evil-wizard-2'};
for (const [id,slug] of Object.entries(packs)) {
  const url=`https://luizmelo.itch.io/${slug}`;
  const res=await fetch(url);const html=await res.text();
  const csrf=html.match(/name="csrf_token" value="([^"]+)"/)?.[1];
  const cookie=res.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
  const dl=await fetch(url+'/download_url',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:cookie,Referer:url},body:new URLSearchParams({csrf_token:csrf})});
  const data=await dl.json();if(!data.url)throw new Error(JSON.stringify(data));console.log('download page',data.url);
  const page=await fetch(data.url,{headers:{Cookie:cookie}});const body=await page.text();
  const upload=body.match(/data-upload_id="(\d+)"/)?.[1];
  if(!upload){console.log(body.slice(-8000));throw new Error('No upload');}
  console.log('upload',upload,body.match(/.{0,100}data-upload_id.{0,300}/g));
  const link=await fetch(`${url}/file/${upload}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Referer:data.url,Cookie:cookie},body:new URLSearchParams({csrf_token:csrf})});
  const down=await link.json();if(!down.url)throw new Error(JSON.stringify(down));
  const asset=await fetch(down.url);if(!asset.ok)throw new Error(asset.status);
  await fs.writeFile(path.join(root,id+'.zip'),Buffer.from(await asset.arrayBuffer()));
  await fs.writeFile(path.join(root,id+'-license.html'),html);
  console.log(id,'downloaded');
}
