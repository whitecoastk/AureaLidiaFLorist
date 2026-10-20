const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {writePagesConfig}=require('../scripts/github-pages.cjs');

test('Pages excluye panel, backend y automatizaciones incluso antes de agregarlos al directorio',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'florist-pages-'));
  try{
    fs.writeFileSync(path.join(root,'site.config.json'),JSON.stringify({url:'https://example.invalid'}));
    fs.writeFileSync(path.join(root,'deploy-manifest.json'),JSON.stringify(['index.html']));
    fs.writeFileSync(path.join(root,'index.html'),'<h1>Catálogo</h1>');
    writePagesConfig(root);
    const yaml=fs.readFileSync(path.join(root,'_config.yml'),'utf8');
    for(const entry of ['supabase','automations','gestion.html','assets/gestion.css','assets/gestion.js','assets/gestion-core.js','assets/gestion-sdk.js']){
      assert.ok(yaml.includes('  - '+JSON.stringify(entry)+'\n'),entry);
    }
    assert.ok(!yaml.includes('  - "index.html"'));
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('el paquete comercial no incluye fuentes del sistema privado',()=>{
  const files=JSON.parse(fs.readFileSync(path.join(__dirname,'../deploy-manifest.json'),'utf8'));
  assert.ok(files.length>0);
  for(const file of files){
    assert.ok(!/^(?:gestion\.html$|assets\/gestion[^/]*$|supabase\/|automations\/|docs\/|tests\/|\.env)/.test(file),file);
  }
});
