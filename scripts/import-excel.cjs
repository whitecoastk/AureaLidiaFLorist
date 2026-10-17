const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const core=require('../assets/core.js'),root=path.resolve(__dirname,'..');
const key=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
function convertRows(rows,previous){
  const header=rows.findIndex(row=>row?.includes('ID')&&row.includes('Producto'));
  if(header<0)throw Error('Faltan encabezados ID y Producto.');
  // Admitir el nombre anterior para no romper archivos ya entregados.
  const headers=rows[header].map(h=>key(h)==='disponible'?'Disponibilidad':h);
  for(const col of ['Precio MXN','Modalidad','Disponibilidad','Estado','Fotografias'])if(!headers.some(h=>key(h)===key(col)))throw Error('Falta columna '+col);
  if(new Set(headers.filter(Boolean).map(key)).size!==headers.filter(Boolean).length)throw Error('Hay encabezados duplicados.');
  const list=v=>String(v??'').split('|').map(s=>s.trim()).filter(Boolean);
  const lookup=(map,value,column)=>{const v=map[key(value)];if(!v)throw Error('Valor inválido en '+column+': '+value);return v;};
  const seen=new Set();
  const result=[];
  for(const row of rows.slice(header+1)){
    const get=column=>row[headers.findIndex(h=>key(h)===key(column))];
    if(row.every(v=>v===null||v===undefined||v===''))continue;
    const id=String(get('ID')??'').trim();
    if(!id)throw Error('Falta ID en '+String(get('Producto')??'una fila')+'. Usa un ID único para cada arreglo.');
    if(seen.has(id))throw Error('ID duplicado: '+id);seen.add(id);
    const old=previous.find(p=>p.id===id),name=String(get('Producto')??'').trim();
    const priceType=lookup({referencia:'reference',fijo:'fixed',desde:'from',cotizar:'quote'},get('Modalidad'),'Modalidad');
    const price=get('Precio MXN');
    if(priceType!=='quote'&&(price==null||price===''||typeof price==='boolean'||!Number.isFinite(Number(price))))throw Error('Precio obligatorio y numérico: '+id);
    const requestedSlug=String(get('URL')??'').trim();
    if(old&&requestedSlug&&old.slug!==requestedSlug)throw Error('No cambies la URL existente: '+id);
    result.push({...old,id,name,description:String(get('Descripcion')??''),slug:old?.slug||requestedSlug||key(name).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+id,status:lookup({publicado:'published',borrador:'draft',retirado:'retired'},get('Estado'),'Estado'),availability:lookup({si:'available',no:'unavailable',disponibilidad:'confirm',disponible:'available','no disponible':'unavailable','por confirmar':'confirm'},get('Disponibilidad'),'Disponibilidad'),priceType,price:priceType==='quote'?null:Number(price),images:list(get('Fotografias')),category:String(get('Categoria')??''),occasions:list(get('Ocasiones')),flowers:list(get('Flores')),colors:list(get('Colores')),featured:key(get('Destacado'))==='si',variations:old?.variations||[],source:old?.source||'Excel del negocio'});
  }
  if(!result.length)throw Error('Excel vacío: no se modificó el catálogo.');
  for(const old of previous)if(!seen.has(old.id))result.push({...old,status:'retired'});
  return core.validateProducts(result);
}
function readWorkbook(filename){
  let parsed;
  const bundledPython=path.join(process.env.USERPROFILE||'','.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe');
  for(const python of [process.env.FLORIST_PYTHON,fs.existsSync(bundledPython)?bundledPython:null,'python','py'].filter(Boolean)){
    const r=spawnSync(python,[path.join(__dirname,'read-xlsx.py'),path.resolve(filename)],{encoding:'utf8',env:{...process.env,PYTHONIOENCODING:'utf-8'},maxBuffer:15000000});
    if(r.error?.code==='ENOENT')continue;
    if(r.status!==0)throw Error(r.stderr||r.error?.message||'No se pudo leer Excel.');parsed=JSON.parse(r.stdout);break;
  }
  if(!parsed)throw Error('Necesitas Python 3 para leer Excel. No requiere paquetes adicionales.');
  return parsed;
}
function main(){
  const filename=process.argv[2];if(!filename)throw Error('Uso: node scripts/import-excel.cjs archivo.xlsx [--apply]');
  const parsed=readWorkbook(filename);
  const file=path.join(root,'data/products.json'),previous=JSON.parse(fs.readFileSync(file,'utf8')),products=convertRows(parsed,previous);
  for(const p of products.filter(p=>p.status==='published'))for(const image of p.images)if(image.startsWith('resources/')&&!fs.existsSync(path.join(root,image)))throw Error('Falta fotografía: '+image);
  if(process.argv.includes('--apply')){
    const dir=path.join(root,'artifacts/catalogo-respaldos');fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(file,path.join(dir,'products-'+Date.now()+'.json'));
    fs.writeFileSync(file+'.tmp',JSON.stringify(products,null,2)+'\n');fs.renameSync(file+'.tmp',file);
  }
  console.log('Excel validado: '+products.filter(p=>p.status==='published').length+' publicados. '+(process.argv.includes('--apply')?'Catálogo actualizado con respaldo local.':'Sin modificar archivos. Usa --apply para importar.'));
}
if(require.main===module)try{main();}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={convertRows,readWorkbook};
