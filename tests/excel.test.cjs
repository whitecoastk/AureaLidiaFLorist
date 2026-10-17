const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const {convertRows,readWorkbook}=require('../scripts/import-excel.cjs'),core=require('../assets/core.js');
const products=require('../data/products.json'),root=path.resolve(__dirname,'..');
const rows=readWorkbook(path.join(root,'admin/catalogo.xlsx')),header=rows.findIndex(r=>r.includes('ID')&&r.includes('Producto'));
test('El Excel conserva productos, precios, URLs, fotografías y etiquetas reales',()=>{
 const imported=convertRows(rows,products);assert.equal(imported.length,products.length);
 for(const p of products){const q=imported.find(x=>x.id===p.id);for(const k of ['name','price','slug','description','images','occasions','flowers','colors','variations'])assert.deepEqual(q[k],p[k],p.id+' '+k);}
});
test('Disponibilidad cambia sin retirar la ficha; precio vacío y errores no se importan',()=>{
 const r=structuredClone(rows);r[header+1][3]='No';const p=convertRows(r,products)[0];assert.equal(p.status,'published');assert.equal(core.canRequest(p),false);assert.equal(core.availabilityLabel(p),'No Disponible');
 r[header+1][3]='Disponible';assert.equal(core.canRequest(convertRows(r,products)[0]),true);
 r[header+1][2]='';assert.throws(()=>convertRows(r,products),/Precio obligatorio/);
 r[header+1][2]=599;r[header+1][3]='Tal vez';assert.throws(()=>convertRows(r,products),/Disponibilidad/);
 r[header+1][3]='Por confirmar';r[header+2][0]=r[header+1][0];assert.throws(()=>convertRows(r,products),/duplicado/);
});
test('Excel admite Sí, Si, No y Disponibilidad sin afirmar disponibilidad para el tercer estado',()=>{
 const r=structuredClone(rows);
 for(const [input,expected]of [['Sí','available'],['Si','available'],['No','unavailable'],['Disponibilidad','confirm']]){r[header+1][3]=input;assert.equal(convertRows(r,products)[0].availability,expected);}
});
test('La consulta usa etiqueta y mensaje de disponibilidad; el arreglo disponible conserva solicitud',()=>{
 const order={requestId:'AL-prueba',budget:599,date:'2026-10-10',time:'flexible',region:'cdmx',neighborhood:'Centro',borough:'Cuauhtémoc',postalCode:'06500'};
 const uncertain={...products[0],availability:'confirm'};
 assert.equal(core.requestLabel(uncertain),'Preguntar por disponibilidad');
 assert.match(core.orderMessage(order,uncertain),/^Hola, quisiera preguntar por disponibilidad/);
 assert.match(decodeURIComponent(core.whatsappUrl('525618689260',core.orderMessage(order,uncertain))),/Ramo Mediano \(ref\. 1\)/);
 const available={...uncertain,availability:'available'};
 assert.equal(core.requestLabel(available),'Solicitar este arreglo');
 assert.match(core.orderMessage(order,available),/^Hola, quisiera solicitar/);
 assert.match(core.orderMessage(order,null),/^Hola, quisiera solicitar/);
});
test('Se pueden añadir filas nuevas y retirar filas ausentes sin borrar su historial',()=>{
 const r=structuredClone(rows);const added=[...r[header+1]];added[0]='prueba-temporal';added[1]='Arreglo de prueba no publicable';added[4]='Borrador';added[12]='';r.push(added);const imported=convertRows(r,products);assert.equal(imported.at(-1).status,'draft');assert.equal(imported.at(-1).id,'prueba-temporal');
 r.splice(header+1,1);assert.equal(convertRows(r,products).find(p=>p.id===products[0].id).status,'retired');
});
test('Enlace directo no permite comenzar solicitud de un arreglo no disponible',async()=>{
 let callback;const button={},form={hidden:false,querySelector:()=>button},banner={hidden:true,append(){}};
 const doc={addEventListener:(name,fn)=>callback=fn,getElementById:id=>id==='order-form'?form:banner,createElement:()=>({})};
 const unavailable={...products[0],availability:'unavailable'};
 vm.runInNewContext(fs.readFileSync(path.join(root,'assets/order.js'),'utf8'),{document:doc,location:{search:'?arreglo='+unavailable.id},URLSearchParams,window:{FloristCore:core,FloristAnalytics:{},FloristProducts:async()=>[unavailable]}});
 await callback();assert.equal(form.hidden,true);assert.equal(button.disabled,true);assert.match(banner.textContent,/no disponible/);
});
test('Build real muestra tarjeta gris y omite la solicitud de la ficha no disponible',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aurea-disponibilidad-'));
 for(const name of ['scripts','assets','data','resources'])fs.cpSync(path.join(root,name),path.join(dir,name),{recursive:true});
 fs.copyFileSync(path.join(root,'site.config.json'),path.join(dir,'site.config.json'));
 const copy=structuredClone(products);copy[0].availability='unavailable';copy[1].availability='available';copy[2].availability='confirm';fs.writeFileSync(path.join(dir,'data/products.json'),JSON.stringify(copy));
 const built=spawnSync(process.execPath,[path.join(dir,'scripts/build.cjs')],{cwd:dir,encoding:'utf8'});assert.equal(built.status,0,built.stderr);
 const catalog=fs.readFileSync(path.join(dir,'catalogo.html'),'utf8');assert.match(catalog,/class="card is-unavailable"/);
 const detail=fs.readFileSync(path.join(dir,'arreglos/'+copy[0].slug+'.html'),'utf8');assert.ok(!detail.includes('id="product-request"'));assert.ok(!detail.includes('/solicitud.html?arreglo='+copy[0].id));assert.match(detail,/no está disponible/);
 for(const p of copy.slice(1,3)){
  const html=fs.readFileSync(path.join(dir,'arreglos/'+p.slug+'.html'),'utf8');assert.match(html,new RegExp('>'+core.requestLabel(p)+'</a>'));
  const article=catalog.split('data-product-id="'+p.id+'"')[1].split('</article>')[0];assert.match(article,new RegExp('>'+core.requestLabel(p)+'</a>'));
 }
});
