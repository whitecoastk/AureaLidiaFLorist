// La hoja pública solo debe contener información de catálogo; nunca pedidos o datos personales.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const config = require('../site.config.json');
const core = require('../assets/core.js');
const slug = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function convert(table, previous = []) {
  if (!table || !Array.isArray(table.cols) || !Array.isArray(table.rows) || !table.rows.length) throw Error('Hoja vacía o respuesta inválida. No se modificó el catálogo.');
  const headers = table.cols.map(c => c.label.trim());
  for (const h of ['id','name','price','image','description','category']) if (!headers.includes(h)) throw Error('Falta columna '+h);
  const seen = new Set();
  const parseList = v => String(v || '').split('|').map(s=>s.trim()).filter(Boolean);
  const result = table.rows.filter(r=>r.c?.[headers.indexOf('id')]?.v != null).map(r => {
    const value = key => r.c?.[headers.indexOf(key)]?.v;
    const id = String(value('id'));
    seen.add(id);
    const old = previous.find(p=>p.id===id);
    const optional = (key,fallback) => headers.includes(key) && value(key)!=null ? value(key) : fallback;
    const image = String(value('image') || '');
    const badge = String(value('badge') || '').toLowerCase();
    const knownOccasions = badge === 'aniversario' ? ['aniversario'] : badge.includes('san valentín') || badge.includes('san valentin') ? ['amor'] : badge.includes('madres') ? ['madres'] : [];
    return {id, slug:String(optional('slug',old?.slug || slug(String(value('name')))+'-'+id)), status:String(optional('status',old?.status || 'published')), name:String(value('name') || '').trim(), description:String(value('description') || '').trim(), price:Number(value('price')), priceType:String(optional('priceType',old?.priceType || 'reference')), images:headers.includes('images') && value('images') ? parseList(value('images')) : [image.startsWith('https://') ? image : 'resources/'+image], category:String(value('category') || ''), occasions:parseList(optional('occasions',(old?.occasions || knownOccasions).join('|'))), flowers:parseList(optional('flowers',(old?.flowers || []).join('|'))), colors:parseList(optional('colors',(old?.colors || []).join('|'))), variations:headers.includes('variations') && value('variations') ? JSON.parse(value('variations')) : old?.variations || [], featured:optional('featured',old?.featured || false)===true, source:'Google Sheets del sitio original'};
  });
  // Una fila retirada no desaparece sin rastro: se conserva con status retired.
  for (const p of previous) if (!seen.has(p.id)) result.push({...p,status:'retired'});
  return core.validateProducts(result);
}
async function main() {
  const previousPath = path.join(root,'data/products.json');
  const previous = fs.existsSync(previousPath) ? JSON.parse(fs.readFileSync(previousPath,'utf8')) : [];
  let table;
  if (process.argv.includes('--snapshot')) table = require('../catalog-source.json');
  else {
    const u = new URL('https://docs.google.com/spreadsheets/d/'+config.sheet.id+'/gviz/tq');
    u.searchParams.set('sheet',config.sheet.name);
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
  fs.writeFileSync(previousPath,JSON.stringify(result,null,2)+'\n');
  console.log('Catálogo importado: '+result.filter(p=>p.status==='published').length+' publicados. Revisa los cambios y ejecuta npm run build.');
}
if (require.main === module) main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={convert};
