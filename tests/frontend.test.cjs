const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../assets/core.js'),view=require('../assets/catalog-view.js'),base=require('../data/products.json')[0];
const config={images:require('../data/images.json'),staticIds:[base.id]};
const variants=[{id:'opcion-a',label:'Opción definida A',priceType:'reference',price:600},{id:'opcion-b',label:'Opción definida B',priceType:'from',price:800.5}];
test('Ficha muestra únicamente variantes y fotografías definidas, con foco y nombres accesibles',()=>{
 const one=view.product({...base,variations:[]},config);assert.ok(!one.includes('type="radio"'));assert.ok(!one.includes('aria-label="Fotografías'));
 const p={...base,variations:variants,images:[base.images[0],'resources/hero-flores.jpg']},html=view.product(p,config);
 assert.match(html,/fieldset class="variant-options"/);assert.equal((html.match(/type="radio"/g)||[]).length,2);assert.match(html,/Desde \$800.50 MXN/);assert.match(html,/aria-pressed="true"/);assert.match(html,/aria-pressed="false"/);assert.match(html,/maxlength="500"/);assert.match(html,/variacion=opcion-a/);
 const no=view.product({...p,availability:'unavailable'},config);assert.ok(!no.includes('data-product-continue'));assert.ok(!no.includes('type="radio"'));assert.match(no,/no está disponible/);
});
test('Cambiar una variante real actualiza precio estimado y enlace conservando ID',async()=>{
 const listeners={},price={},link={href:''},root={dataset:{productDetail:base.id}};
 const document={addEventListener:(name,fn)=>listeners[name]=fn,getElementById:id=>id==='product-price'?price:link};
 vm.runInNewContext(fs.readFileSync('assets/product.js','utf8'),{window:{FloristCore:core,FloristCatalogView:view,FloristProducts:async()=>[{...base,variations:variants}]},document});
 await listeners.change({target:{matches:()=>true,closest:()=>root,value:'opcion-b'}});
 assert.equal(price.textContent,'Desde $800.50 MXN');assert.equal(link.href,'/solicitud.html?arreglo='+base.id+'&variacion=opcion-b');
});
test('Dedicatoria pasa una sola vez al mismo producto sin quedar en el enlace',()=>{
 const listeners={},data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k),removeItem:k=>data.delete(k)};
 const input={value:'Para ti, con cariño & flores + alegría'},root={dataset:{productDetail:base.id}},link={href:'/solicitud.html?arreglo='+base.id,hasAttribute:()=>true,closest:()=>root};
 const document={addEventListener:(name,fn)=>listeners[name]=fn,getElementById:()=>input};
 vm.runInNewContext(fs.readFileSync('assets/product.js','utf8'),{window:{FloristCore:core},sessionStorage:storage,document});
 listeners.click({target:{closest:()=>link}});assert.equal(link.href,'/solicitud.html?arreglo='+base.id);
 assert.equal(core.consumeDedication(storage,base.id),input.value);assert.equal(core.consumeDedication(storage,base.id),'');assert.equal(data.size,0);
});
test('No se reutilizan dedicatorias caducadas, corruptas o de otro producto; almacenamiento bloqueado es opcional',()=>{
 const make=value=>({getItem:()=>value,removeItem(){this.removed=true;}});
 for(const draft of [{productId:'otro',text:'Privado',at:100},{productId:base.id,text:'Caducado',at:100},{productId:base.id,text:'Futuro',at:10000000},{productId:base.id,text:'x'.repeat(501),at:700000}]){
  const storage=make(JSON.stringify(draft));assert.equal(core.consumeDedication(storage,base.id,700001),'');assert.equal(storage.removed,true);
 }
 assert.equal(core.consumeDedication(make('{corrupto'),base.id),'');assert.equal(core.consumeDedication(undefined,base.id),'');
});
test('Flores, colores y presentación llegan al resumen de WhatsApp como preferencias sin agregar cargos',()=>{
 const order={budget:599,date:'2026-10-17',time:'flexible',region:'cdmx',neighborhood:'Centro',borough:'Cuauhtémoc',postalCode:'06500',accepted:true,requestId:'AL-TEST',flowerPreference:'Mis flores favoritas',colorPreference:'Rosa & crema',presentation:'Presentación solicitada',variation:variants[1]};
 assert.deepEqual(core.validateOrder(order,'2026-10-16'),{});const text=core.orderMessage(order,{...base,variations:variants});assert.match(text,/Flores preferidas: Mis flores favoritas/);assert.match(text,/Colores preferidos: Rosa & crema/);assert.match(text,/Tamaño o presentación preferida: Presentación solicitada/);assert.match(text,/Precio de referencia: Desde \$800.50 MXN/);assert.equal(new URL(core.whatsappUrl('525618689260',text)).searchParams.get('text'),text);
 assert.ok(core.validateOrder({...order,presentation:'x'.repeat(161)},'2026-10-16').presentation);
});
test('La página de personalización no se sustituye por una ficha de producto vacía',async()=>{
 const listeners={},layout={querySelector:()=>null};let fetched=false;
 const document={addEventListener:(name,fn)=>listeners[name]=fn,getElementById:()=>null,querySelector:()=>layout};
 vm.runInNewContext(fs.readFileSync('assets/live-catalog.js','utf8'),{window:{FloristCore:core,FloristCatalogView:view,FLORIST_CONFIG:{}},document,fetch:async()=>{fetched=true;throw Error('no debe consultar');}});
 await listeners.DOMContentLoaded();assert.equal(fetched,false);
});
test('La galería actualiza imagen y selección sin perder el estado gris de disponibilidad',()=>{
 const listeners={},image={removeAttribute(){},src:''},buttons=[{dataset:{liveImage:'/resources/hero-flores.jpg'},setAttribute(k,v){this[k]=v;}},{setAttribute(k,v){this[k]=v;}}];
 const document={addEventListener:(name,fn)=>listeners[name]=fn,querySelector:()=>image,querySelectorAll:()=>buttons};
 vm.runInNewContext(fs.readFileSync('assets/live-catalog.js','utf8'),{window:{FloristCore:core,FloristCatalogView:view,FLORIST_CONFIG:{}},document});
 listeners.click({target:{closest:selector=>selector==='[data-live-image]'?buttons[0]:null}});
 assert.equal(image.src,'/resources/hero-flores.jpg');assert.equal(buttons[0]['aria-pressed'],'true');assert.equal(buttons[1]['aria-pressed'],'false');
});
