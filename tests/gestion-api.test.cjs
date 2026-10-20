// Contrato SDK/HTTP contra una API ficticia. RLS se prueba con la suite SQL.
const {test}=require('node:test'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const vm=require('node:vm'),fs=require('node:fs');
// El artefacto oficial es para navegador: expone `var supabase`, no CommonJS.
const {createClient}=vm.runInNewContext(fs.readFileSync('assets/gestion-sdk.js','utf8')+';supabase;',{
  URL,URLSearchParams,fetch,Headers,Request,Response,AbortController,WebSocket,TextEncoder,TextDecoder,
  crypto:require('node:crypto').webcrypto,Buffer,console,setTimeout,clearTimeout,setInterval,clearInterval,process
});
const {randomUUID}=require('node:crypto');
test('SDK del panel: login, perfil, cliente, borrador idempotente, seguimiento, anticipo y cierre',async t=>{
  const child=spawn(process.execPath,['tests/fixtures/admin-api.cjs'],{env:{...process.env,FLORIST_FIXTURE_PORT:'0'},stdio:['ignore','pipe','pipe']});
  let sdk;
  t.after(async()=>{sdk?.auth.stopAutoRefresh();child.kill();});
  const origin=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('La API ficticia no inició.')),10000);
    child.once('error',error=>{clearTimeout(timer);reject(error);});
    child.stdout.on('data',chunk=>{const match=chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
  });
  sdk=createClient(origin,'sb_publishable_fixture',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const login=await sdk.auth.signInWithPassword({email:'admin-fixture@example.invalid',password:'synthetic-not-real'});assert.ifError(login.error);assert.ok(login.data.user.id);
  const assurance=await sdk.auth.mfa.getAuthenticatorAssuranceLevel();assert.ifError(assurance.error);assert.equal(assurance.data.currentLevel,'aal1');
  const profile=await sdk.from('staff_profiles').select('role,active').eq('user_id',login.data.user.id).maybeSingle();assert.ifError(profile.error);assert.equal(profile.data.role,'admin');
  const customer=await sdk.from('customers').insert({name:'Comprador sintético',phone_e164:'+525500000099'}).select('id').single();assert.ifError(customer.error);assert.ok(customer.data.id);
  const operation={p_creation_key:randomUUID(),p_customer_id:customer.data.id,p_items:[{name:'Arreglo sintético',quantity:2,unit_price_cents:25000}],p_brand:'aurea_lidia',p_source:'whatsapp',p_shipping_cents:null};
  const created=await sdk.rpc('create_manual_order',operation);assert.ifError(created.error);assert.ok(created.data);
  const retry=await sdk.rpc('create_manual_order',operation);assert.ifError(retry.error);assert.equal(retry.data,created.data);
  const list=await sdk.from('orders').select('id,customers(name)',{count:'exact'}).range(0,24);assert.ifError(list.error);assert.equal(list.count,1);assert.equal(list.data[0].customers.name,'Comprador sintético');
  let balance=await sdk.from('order_balances').select('*').eq('order_id',created.data).single();assert.ifError(balance.error);assert.equal(balance.data.total_cents,null);
  const detail=await sdk.from('orders').select('*').eq('id',created.data).single();assert.ifError(detail.error);
  const update=await sdk.from('orders').update({shipping_cents:0,status:'confirmed',dedication:'Texto de prueba <>&'}).eq('id',created.data).eq('updated_at',detail.data.updated_at).select('id').single();assert.ifError(update.error);
  const payment={order_id:created.data,kind:'receipt',amount_cents:20000,method:'transfer',status:'pending',idempotency_key:randomUUID()};
  const inserted=await sdk.from('payments').insert(payment).select('id').single();assert.ifError(inserted.error);
  balance=await sdk.from('order_balances').select('*').eq('order_id',created.data).single();assert.equal(balance.data.received_cents,0);
  const verified=await sdk.from('payments').update({status:'verified'}).eq('id',inserted.data.id).eq('status','pending').select('id').single();assert.ifError(verified.error);
  balance=await sdk.from('order_balances').select('*').eq('order_id',created.data).single();assert.equal(balance.data.total_cents,50000);assert.equal(balance.data.balance_cents,30000);
  const duplicate=await sdk.from('payments').insert(payment).select('id').single();assert.equal(duplicate.error.code,'23505');
  const logout=await sdk.auth.signOut({scope:'local'});assert.ifError(logout.error);assert.equal((await sdk.auth.getSession()).data.session,null);
});
