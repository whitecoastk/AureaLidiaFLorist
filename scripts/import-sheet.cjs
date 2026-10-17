// La hoja pública solo debe contener información de catálogo; nunca pedidos o datos personales.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const config = require('../site.config.json');
const core = require('../assets/core.js');
const sheet=require('../assets/sheet.js');
const convert=sheet.convert;
async function main() {
  const previousPath = path.join(root,'data/products.json');
  const previous = fs.existsSync(previousPath) ? JSON.parse(fs.readFileSync(previousPath,'utf8')) : [];
  let table;
  if (process.argv.includes('--snapshot')) table = require('../catalog-source.json');
  else {
    const u = sheet.url(config.sheet);
    const resp = await fetch(u, {signal:AbortSignal.timeout(15000)});
    if (!resp.ok) throw Error('Google Sheets respondió '+resp.status);
    const match = (await resp.text()).match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
    if (!match) throw Error('Respuesta de Google Sheets inesperada.');
    const data = JSON.parse(match[1]);
    if (data.status !== 'ok') throw Error('Google Sheets no devolvió datos válidos.');
    table=data.table;
  }
  const result=convert(table,previous);
  for (const p of result.filter(p=>p.status==='published')) for (const image of p.images) if (image.startsWith('resources/') && !fs.existsSync(path.join(root,image))) throw Error('Falta la imagen '+image+'. No se modificó el catálogo.');
  fs.mkdirSync(path.dirname(previousPath),{recursive:true});
  const backupDir=path.join(root,'artifacts/catalogo-respaldos');fs.mkdirSync(backupDir,{recursive:true});if(fs.existsSync(previousPath))fs.copyFileSync(previousPath,path.join(backupDir,'products-sheet-'+Date.now()+'.json'));
  fs.writeFileSync(previousPath,JSON.stringify(result,null,2)+'\n');
  console.log('Catálogo importado: '+result.filter(p=>p.status==='published').length+' publicados. Revisa los cambios y ejecuta npm run build.');
}
if (require.main === module) main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={convert};
