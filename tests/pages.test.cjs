const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('Pages excluye fuentes administrativas y conserva todos los archivos públicos',()=>{
  const yaml=fs.readFileSync('_config.yml','utf8');
  const excluded=yaml.split('\n').filter(line=>line.startsWith('  - ')).map(line=>JSON.parse(line.slice(4)));
  const blocked=file=>excluded.some(item=>file===item||file.startsWith(item+'/'));
  for(const file of ['site.config.json','data/products.json','data/build-state.json','catalog-source.json','scripts/build.cjs','tests/privacy.test.cjs','docs/PRIVACIDAD.md','domain/contracts.d.ts'])assert.ok(blocked(file),file);
  for(const file of require('../deploy-manifest.json'))assert.ok(!blocked(file),file);
  assert.ok(!fs.existsSync('.nojekyll'),'No desactivar las exclusiones de Jekyll');
  assert.equal(fs.readFileSync('CNAME','utf8').trim(),'aurealidiaflorist.com');
});
