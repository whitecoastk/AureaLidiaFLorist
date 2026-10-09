const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
  let filename;try{filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  if (filename.endsWith('/')) filename+='index.html';
  const file=path.resolve(root,'.'+filename);
  const relative=path.relative(root,file).replaceAll('\\','/');
  const allowed=/^(?:[^/]+\.html|main\.js|catalogo\.js|robots\.txt|sitemap\.xml|assets\/[^/]+\.(?:js|css)|arreglos\/[^/]+\.html|resources\/(?:optimized\/)?[^/]+\.(?:jpg|jpeg|png|webp|avif)|data\/catalog\.json)$/i.test(relative);
  if (!file.startsWith(root+path.sep) || !allowed){res.writeHead(404).end('No encontrado');return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'}).end(fs.readFileSync(path.join(root,'404.html'),'utf8'));return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':'no-store'}).end(data);});
}).listen(4173,'127.0.0.1',()=>console.log('Vista local: http://127.0.0.1:4173'));
