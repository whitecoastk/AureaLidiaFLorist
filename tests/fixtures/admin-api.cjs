// API ficticia SOLO para probar la interfaz. No simula la seguridad RLS.
// Nunca conectar clientes reales ni publicar este servidor.
const http=require('node:http'),{randomUUID}=require('node:crypto');
const userId='10000000-0000-4000-8000-000000000001';
const user={id:userId,email:'admin-fixture@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},factors:[]};
const db={customers:[],orders:[],order_items:[],payments:[],whatsapp_inquiries:[]};
const token=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:userId,role:'authenticated',aal:'aal1',amr:[{method:'password',timestamp:Math.floor(Date.now()/1000)}],exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.'+Buffer.from('synthetic-signature-not-valid-for-real-auth').toString('base64url');
const stamp=()=>new Date().toISOString();
const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin||'';
  res.setHeader('Access-Control-Allow-Origin',origin==='http://127.0.0.1:4173'?origin:'http://127.0.0.1:4173');
  res.setHeader('Access-Control-Allow-Headers','authorization,apikey,content-type,x-client-info,prefer,range,range-unit,x-supabase-api-version');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,OPTIONS');res.setHeader('Access-Control-Expose-Headers','Content-Range');
  if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
  const url=new URL(req.url,'http://127.0.0.1'),path=url.pathname;let body='';for await(const chunk of req)body+=chunk;
  let data;try{data=body?JSON.parse(body):null;}catch{res.writeHead(400).end();return;}
  function send(value,status=200){res.setHeader('Content-Type','application/json');res.writeHead(status).end(JSON.stringify(value));}
  if(path==='/auth/v1/token'){send({access_token:token,refresh_token:'fixture-refresh',expires_in:3600,token_type:'bearer',user});return;}
  if(path==='/auth/v1/user'){send(user);return;}
  if(path==='/auth/v1/logout'){send({});return;}
  if(!req.headers.authorization?.startsWith('Bearer ')){send({code:'42501'},403);return;}
  if(path==='/rest/v1/staff_profiles'){send([{role:'admin',active:true}]);return;}
  if(path==='/rest/v1/rpc/create_manual_order'){
    const existing=db.orders.find(o=>o.creation_key===data.p_creation_key);if(existing){send(existing.id);return;}
    const order={id:randomUUID(),reference:'AL-'+randomUUID(),creation_key:data.p_creation_key,customer_id:data.p_customer_id,brand:data.p_brand,source:data.p_source,status:'request',shipping_cents:data.p_shipping_cents,budget_cents:null,created_at:stamp(),updated_at:stamp()};
    db.orders.push(order);db.order_items.push(...data.p_items.map(i=>({id:randomUUID(),order_id:order.id,name_snapshot:i.name,quantity:i.quantity,unit_price_cents:i.unit_price_cents,created_at:stamp(),updated_at:stamp()})));send(order.id);return;
  }
  const table=path.split('/').at(-1);let rows;
  if(table==='order_balances')rows=db.orders.map(o=>{
    const items=db.order_items.filter(i=>i.order_id===o.id),payments=db.payments.filter(p=>p.order_id===o.id&&p.status==='verified');
    const subtotal=items.length&&items.every(i=>i.unit_price_cents!==null)?items.reduce((s,i)=>s+i.quantity*i.unit_price_cents,0):null;
    const total=subtotal!==null&&o.shipping_cents!==null?subtotal+o.shipping_cents:null;
    const received=payments.reduce((s,p)=>s+(p.kind==='refund'?-p.amount_cents:p.amount_cents),0);
    return {order_id:o.id,total_cents:total,received_cents:received,balance_cents:total===null?null:total-received};
  });else rows=db[table];
  if(!rows){send({code:'404'},404);return;}
  if(req.method==='POST'){
    if(table==='payments'&&rows.some(r=>r.idempotency_key===data.idempotency_key)){send({code:'23505'},409);return;}
    const row={id:randomUUID(),created_at:stamp(),updated_at:stamp(),...data};rows.push(row);send(req.headers.accept?.includes('vnd.pgrst.object')?row:[row],201);return;
  }
  let selected=rows.filter(row=>[...url.searchParams].every(([key,val])=>{
    if(val.startsWith('eq.'))return String(row[key])===val.slice(3);
    if(val==='is.null')return row[key]==null;
    if(val.startsWith('ilike.'))return String(row[key]||'').toLowerCase().includes(val.slice(6).replaceAll('%','').toLowerCase());
    return true;
  }));
  if(req.method==='PATCH'){
    for(const row of selected){Object.assign(row,data,{updated_at:stamp()});if(table==='payments'&&data.status==='verified'){row.verified_by=userId;row.verified_at=stamp();}}
  }
  const count=selected.length,offset=Number(url.searchParams.get('offset')||0),limit=Number(url.searchParams.get('limit')||500);
  selected=selected.slice(offset,offset+limit).map(row=>table==='orders'?{...row,customers:db.customers.find(c=>c.id===row.customer_id)||null}:row);
  res.setHeader('Content-Range',`${offset}-${Math.max(offset,offset+selected.length-1)}/${count}`);
  if(req.headers.accept?.includes('vnd.pgrst.object')){if(selected.length!==1){send({code:'PGRST116'},406);return;}send(selected[0]);}else send(selected);
});
server.listen(Number(process.env.FLORIST_FIXTURE_PORT||54321),'127.0.0.1',()=>console.log('API ficticia del panel: http://127.0.0.1:'+server.address().port+' · solo datos sintéticos'));
