const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sheet=require('../assets/sheet.js'),core=require('../assets/core.js'),view=require('../assets/catalog-view.js'),snapshot=require('../catalog-source.json'),products=require('../data/products.json');
const add=(table,label,value)=>{table.cols.push({label});for(const row of table.rows)row.c.push({v:value});return table;};
test('Google Sheets conserva datos reales, URLs existentes y normaliza imágenes locales y HTTPS',()=>{
 const result=sheet.convert(snapshot,products);assert.equal(result.filter(p=>p.status==='published').length,20);
 for(const p of products){const q=result.find(q=>q.id===p.id);assert.equal(q.name,p.name);assert.equal(q.price,p.price);assert.equal(q.slug,p.slug);assert.deepEqual(q.images,p.images);}
});
test('Disponible acepta Sí, Si, No, Disponibilidad y casillas booleanas; estado es independiente',()=>{
 for(const [input,expected]of [['Sí','available'],['Si','available'],['No','unavailable'],['Disponibilidad','confirm'],[true,'available'],[false,'unavailable'],['','confirm']]){
  const table=add(structuredClone(snapshot),'Disponible',input);const p=sheet.convert(table,products)[0];assert.equal(p.availability,expected);assert.equal(p.status,'published');
 }
 const table=add(add(structuredClone(snapshot),'Disponible','Sí'),'Estado','Borrador');assert.equal(sheet.convert(table,products)[0].status,'draft');
});
test('Encabezados españoles, descripción opcional, cotización y nuevas filas funcionan',()=>{
 const table=structuredClone(snapshot);const names={id:'ID',name:'Nombre',price:'Precio',image:'Imagen',description:'Descripción',category:'Categoría'};table.cols.forEach(c=>c.label=names[c.label]||c.label);
 const row=structuredClone(table.rows[0]);row.c[0].v='nueva-prueba';row.c[1].v='Arreglo solo de prueba';row.c[3].v='https://example.com/real.jpg';row.c[4].v=null;table.rows.push(row);
 const p=sheet.convert(table,products).find(p=>p.id==='nueva-prueba');assert.equal(p.description,'');assert.equal(p.availability,'confirm');assert.equal(p.images[0],'https://example.com/real.jpg');
 const quote=add(structuredClone(snapshot),'Modalidad','Cotizar');quote.rows[0].c[2].v=null;assert.equal(sheet.convert(quote,products)[0].price,null);
});
test('Duplicados, precios vacíos, imágenes inseguras, errores de hoja y wrappers ejecutables se rechazan',()=>{
 const invalid=structuredClone(snapshot);invalid.rows[1].c[0].v=1;assert.throws(()=>sheet.convert(invalid,products),/duplicado/);
 invalid.rows[1].c[0].v=2;invalid.rows[0].c[2].v=null;assert.throws(()=>sheet.convert(invalid,products),/Precio/);
 invalid.rows[0].c[2].v=599;invalid.rows[0].c[3].v='javascript:alert(1)';assert.throws(()=>sheet.convert(invalid,products),/Fotografía/);
 assert.throws(()=>sheet.parse('alert(1)'));assert.throws(()=>sheet.parse('google.visualization.Query.setResponse({"status":"error"});'));
 assert.throws(()=>sheet.parse('google.visualization.Query.setResponse({"status":"ok"});alert(1)'));
 const before=JSON.stringify(products);const fewer=sheet.convert({...snapshot,rows:snapshot.rows.slice(1)},products);assert.equal(fewer.find(p=>p.id===products[0].id).status,'retired');assert.equal(JSON.stringify(products),before);
});
test('La carga usa gid=0, lectura sin credenciales y JSON.parse, sin ejecutar la respuesta',async()=>{
 let seen;const data=await sheet.load({id:'1AYMtAh_G8P3jXRv8aSu3-QT6foWwG8HfGVHRjaa15PU',gid:0},products,async(url,options)=>{seen={url,options};return {ok:true,text:async()=> '/*O_o*/\ngoogle.visualization.Query.setResponse('+JSON.stringify({status:'ok',table:snapshot})+');'};});
 assert.equal(new URL(seen.url).searchParams.get('gid'),'0');assert.equal(seen.options.credentials,'omit');assert.equal(seen.options.referrerPolicy,'no-referrer');assert.equal(data.length,20);
 await assert.rejects(sheet.load({id:'id-valido-12345'},products,async()=>({ok:false,status:403})),/403/);
});
test('Nuevos productos tienen ficha consultable y HTML escapado, y No carece de solicitud',()=>{
 const config={staticIds:products.map(p=>p.id),images:{}};
 const p={...products[0],id:'nuevo',name:'<img src=x onerror=alert(1)>',description:'<script>error</script>',availability:'unavailable'};
 const html=view.card(p,config);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('is-unavailable'));assert.ok(html.includes('No Disponible'));assert.ok(!html.includes('/solicitud.html?'));
 assert.equal(view.detail(p,config),'/arreglo.html?arreglo=nuevo');assert.equal(view.detail(products[0],config),'/arreglos/'+products[0].slug+'.html');
 assert.ok(!view.product(p,config).includes('id="live-request"'));assert.match(view.card({...p,availability:'confirm'},config),/Preguntar por disponibilidad/);
});
test('Si Google falla, se muestra respaldo explícito y se consulta antes de afirmar disponibilidad',async()=>{
 const listeners={},html={dataset:{}},document={documentElement:html,addEventListener:(name,fn)=>listeners[name]=fn,dispatchEvent:()=>{}};
 const context={window:{FloristCore:core,FloristCatalogView:view,FLORIST_CONFIG:{sheet:{enabled:true}},FloristSheet:{load:async()=>{throw Error('sin red');}}},document,CustomEvent:class{},fetch:async()=>({ok:true,json:async()=>[{...products[0],availability:'available'}]})};
 vm.runInNewContext(fs.readFileSync('assets/live-catalog.js','utf8'),context);const loaded=await context.window.FloristProducts();assert.equal(loaded[0].availability,'confirm');assert.equal(html.dataset.catalogSource,'backup');
});
