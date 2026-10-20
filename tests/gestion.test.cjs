const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const admin=require('../assets/gestion-core.js');
test('Importes del panel convierten centavos sin redondear y conservan cotización pendiente',()=>{
  assert.equal(admin.cents('0.29'),29);assert.equal(admin.cents('250.5'),25050);assert.equal(admin.cents('',true),null);assert.equal(admin.cents('0'),0);
  for(const bad of ['-1','1,000','1.001','1e3','Infinity',''])assert.throws(()=>admin.cents(bad));
  assert.equal(admin.money(null),'Por cotizar');assert.notEqual(admin.money(0),'Por cotizar');
});
test('Panel acepta solo configuración pública y destinos Supabase o localhost',()=>{
  assert.deepEqual(admin.connection('https://fixture.supabase.co/','sb_publishable_fixture'),{url:'https://fixture.supabase.co',key:'sb_publishable_fixture'});
  assert.equal(admin.connection('http://127.0.0.1:54321','sb_publishable_fixture').url,'http://127.0.0.1:54321');
  for(const url of ['https://supabase.co.attacker.invalid','https://example.invalid','http://fixture.supabase.co','https://fixture.supabase.co/?secret=x','https://user:pass@fixture.supabase.co','javascript:alert(1)'])assert.throws(()=>admin.connection(url,'sb_publishable_fixture'));
  for(const key of ['sb_secret_fixture','eyJfixture',''])assert.throws(()=>admin.connection('https://fixture.supabase.co',key));
});
test('Partidas manuales permiten personalizados sin precio e impiden cantidades o importes inválidos',()=>{
  assert.deepEqual(admin.items([{name:' Personalizado ',quantity:'2',price:''}]),[{name:'Personalizado',quantity:2,unit_price_cents:null}]);
  for(const bad of [[],[{name:'',quantity:1,price:'250'}],[{name:'Arreglo',quantity:0,price:'250'}],[{name:'Arreglo',quantity:1.5,price:'250'}],[{name:'Arreglo',quantity:1,price:'-1'}]])assert.throws(()=>admin.items(bad));
});
test('Errores mostrados no reproducen datos personales devueltos por el servidor',()=>{
  const pii='Datos privados del cliente';assert.ok(!admin.errorMessage({code:'23505',message:pii,details:pii}).includes(pii));assert.ok(!admin.errorMessage({message:pii}).includes(pii));
});
test('Panel permanece fuera del despliegue comercial y usa recursos locales propios',()=>{
  const files=require('../deploy-manifest.json'),html=fs.readFileSync('gestion.html','utf8');
  assert.ok(!files.some(f=>f==='gestion.html'||f.startsWith('assets/gestion')));
  assert.match(html,/noindex,nofollow,noarchive/);assert.match(html,/name="password" type="password"/);
  for(const [,src]of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g))assert.ok(fs.existsSync('.'+src),src);
});
