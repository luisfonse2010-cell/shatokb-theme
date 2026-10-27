// Local-only fixture preview. No backend credentials, provider calls or writes.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { physical } from '../test/fixtures/opportunity-executive-v1.mjs';
const root=path.resolve(fileURLToPath(new URL('../kabuby/',import.meta.url)));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
const port=Number(process.env.KABUBY_PREVIEW_PORT||8767);
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 const fixtureName=new URL(req.headers.referer||req.url,'http://127.0.0.1').searchParams.get('fixture')||'empty-active';
 if(req.method!=='GET'){res.writeHead(405);return res.end();}
 if(url.pathname==='/api/v1/intelligence/physical'){
  if(fixtureName==='unauthorized'){res.writeHead(401,{'Content-Type':'application/json'});return res.end('{"error":"AUTH_REQUIRED"}');}
  res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify({data:{physical:physical(fixtureName)}}));
 }
 const target=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);return res.end();}
 try{let content=fs.readFileSync(target);if(path.extname(target)==='.html')content=Buffer.from(content.toString().replace('<body','<body').replace('</body>','<aside style="position:fixed;bottom:8px;right:8px;z-index:99999;background:#263644;color:#fff;border:1px solid #718693;padding:7px 12px;border-radius:8px;font:11px system-ui">VISTA LOCAL · FIXTURES · SIN ACTIVIDAD REAL</aside></body>'));
 res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Local fixture preview: http://127.0.0.1:${port}/?fixture=empty-active#opportunities?view=radar`));
