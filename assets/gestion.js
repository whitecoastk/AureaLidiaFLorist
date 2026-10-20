(function(){
  'use strict';
  const C=window.FloristAdmin,$=id=>document.getElementById(id);
  let client=null,profile=null,epoch=0,subscription=null,factorId=null,currentOrder=null,ordersPage=0,customersPage=0,inboxPage=0,draftAttempt=null;
  const paymentAttempts=new Map(),pageSize=25;
  const fields=['status','budget_cents','shipping_cents','requested_delivery_date','preferred_time_slot','delivery_region','neighborhood','municipality','postal_code','delivery_address','recipient_name','recipient_phone','dedication','preferences','notes'];
  function el(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
  function notice(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error);}
  function fail(message){throw {userMessage:message};}
  function validate(fn){try{return fn();}catch(e){fail(e.message);}}
  async function read(query){const active=epoch;const result=await query;if(active!==epoch)throw {code:'cancelled'};if(result.error)throw result.error;return result;}
  async function run(action,button){if(button)button.disabled=true;try{await action();}catch(e){if(e.code!=='cancelled')notice(e.userMessage||C.errorMessage(e),true);}finally{if(button)button.disabled=false;}}
  function options(select,map,empty){select.replaceChildren();if(empty!==undefined)select.add(new Option(empty,''));for(const [key,label]of Object.entries(map))select.add(new Option(label,key));}
  function tab(id){for(const x of ['orders','customers','new-order','order-detail','whatsapp-inbox'])$(x).hidden=x!==id;document.querySelectorAll('[data-tab]').forEach(b=>{if(b.dataset.tab===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}
  function clearPrivate(){
    epoch++;profile=null;currentOrder=null;draftAttempt=null;paymentAttempts.clear();
    for(const id of ['orders-list','customers-list','detail-items','detail-payments','detail-balances','inbox-list'])$(id).replaceChildren();
    $('inbox-filters').reset();$('inbox-page').textContent='';inboxPage=0;
    for(const id of ['customer-form','new-order-form','detail-form','payment-form'])$(id).reset();
    $('new-order-form').elements.customer.replaceChildren(new Option('Sin cliente asignado',''));
    $('draft-fields').disabled=false;$('discard-attempt').hidden=true;$('detail-meta').textContent='';$('identity').textContent='';$('detail-heading').textContent='Detalle del pedido';
    $('workspace').hidden=true;$('access').hidden=false;$('logout').hidden=true;$('mfa-form').hidden=true;$('login-form').hidden=false;
    $('login-form').elements.password.value='';$('mfa-form').reset();$('draft-items').replaceChildren();addItem();
  }
  async function signOut(){
    const old=client;client=null;subscription?.unsubscribe();subscription=null;clearPrivate();
    try{if(old)await old.auth.signOut({scope:'local'});}finally{old?.auth.stopAutoRefresh();notice('Sesión cerrada. Los datos del panel se han retirado de esta pestaña.');}
  }
  async function authorize(){
    const {data:{user}}=await read(client.auth.getUser());if(!user)fail('No hay una sesión válida.');
    const {data}=await read(client.from('staff_profiles').select('role,active').eq('user_id',user.id).maybeSingle());
    if(!data?.active){await signOut();fail('Tu cuenta necesita un perfil de personal activo. Un usuario de Auth por sí solo no concede acceso.');}
    profile=data;$('identity').textContent='Sesión de '+(data.role==='admin'?'administración':'operación')+' · datos privados';
    $('access').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;
    $('login-form').elements.password.value='';$('mfa-form').reset();tab('orders');
    const {data:{subscription:sub}}=client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){clearPrivate();notice('La sesión terminó. Vuelve a iniciar sesión.');}});subscription=sub;
    await Promise.all([loadOrders(),loadCustomers(),loadCustomerChoices()]);notice('Sesión iniciada. El catálogo público sigue administrándose desde Google Sheets.');
  }
  $('login-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
    if(!window.supabase?.createClient)fail('No se pudo cargar el SDK local de Supabase.');
    const f=e.target.elements,config=validate(()=>C.connection(f.url.value,f.key.value));
    client?.auth.stopAutoRefresh();subscription?.unsubscribe();epoch++;
    client=window.supabase.createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});
    await read(client.auth.signInWithPassword({email:f.email.value.trim(),password:f.password.value}));f.password.value='';
    const {data:assurance}=await read(client.auth.mfa.getAuthenticatorAssuranceLevel());
    if(assurance.nextLevel==='aal2'&&assurance.currentLevel!=='aal2'){
      const {data:factors}=await read(client.auth.mfa.listFactors());factorId=factors.totp.find(f=>f.status==='verified')?.id;
      if(!factorId){await signOut();fail('Esta cuenta requiere un factor que este panel todavía no admite.');}
      $('login-form').hidden=true;$('mfa-form').hidden=false;$('mfa-form').elements.code.focus();notice('Introduce el código de tu autenticador.');return;
    }
    await authorize();
  },e.submitter);});
  $('mfa-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{await read(client.auth.mfa.challengeAndVerify({factorId,code:e.target.elements.code.value}));await authorize();},e.submitter);});
  $('logout').addEventListener('click',()=>run(signOut));
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>run(async()=>{tab(b.dataset.tab);if(b.dataset.tab==='orders')await loadOrders();if(b.dataset.tab==='customers')await loadCustomers();if(b.dataset.tab==='new-order')await loadCustomerChoices();if(b.dataset.tab==='whatsapp-inbox')await loadInbox();})));
  options($('order-filters').elements.status,C.statuses,'Todos');options($('detail-form').elements.status,C.statuses);

  async function loadOrders(){
    let q=client.from('orders').select('id,reference,status,requested_delivery_date,brand,customers(name)',{count:'exact'}).order('created_at',{ascending:false}).order('id').range(ordersPage*pageSize,(ordersPage+1)*pageSize-1);
    const f=$('order-filters').elements;if(f.status.value)q=q.eq('status',f.status.value);if(f.date.value)q=q.eq('requested_delivery_date',f.date.value);
    const {data,count}=await read(q),list=$('orders-list');list.replaceChildren();
    if(!data.length)list.append(el('p','No hay pedidos en esta página.'));
    for(const o of data){const row=el('article',undefined,'record');row.append(el('strong',o.reference),el('p',(o.customers?.name||'Sin cliente asignado')+' · '+C.statuses[o.status]+' · '+(o.requested_delivery_date||'Entrega por confirmar')));const b=el('button','Abrir pedido');b.type='button';b.addEventListener('click',()=>run(()=>loadDetail(o.id),b));row.append(b);list.append(row);}
    $('orders-page').textContent='Página '+(ordersPage+1)+' · '+count+' pedidos';$('orders-prev').disabled=ordersPage===0;$('orders-next').disabled=(ordersPage+1)*pageSize>=count;
  }
  $('order-filters').addEventListener('submit',e=>{e.preventDefault();ordersPage=0;run(loadOrders,e.submitter);});
  $('orders-prev').addEventListener('click',()=>{ordersPage=Math.max(0,ordersPage-1);run(loadOrders);});$('orders-next').addEventListener('click',()=>{ordersPage++;run(loadOrders);});
  async function loadInbox(){
    let q=client.from('whatsapp_inquiries').select('id,sender_id,sender_display_name,received_at,message_type,body,web_request_reference,review_state,updated_at',{count:'exact'}).order('created_at',{ascending:false}).order('id').range(inboxPage*pageSize,(inboxPage+1)*pageSize-1);
    const state=$('inbox-filters').elements.state.value;if(state)q=q.eq('review_state',state);
    let result;try{result=await read(q);}catch(error){if(error.code==='PGRST205'||error.code==='42P01')fail('Primero aplica la migración 20261017000300_whatsapp_inbox.sql. El resto del panel puede seguir utilizándose.');throw error;}
    const {data,count}=result,list=$('inbox-list');list.replaceChildren();if(!data.length)list.append(el('p','No hay consultas con este filtro.'));
    for(const inquiry of data){
      const row=el('article',undefined,'record');row.append(el('strong',inquiry.sender_display_name||'Contacto de WhatsApp'),el('p','Identificador WhatsApp: '+inquiry.sender_id+' · '+new Date(inquiry.received_at).toLocaleString('es-MX',{timeZone:'America/Mexico_City'})));
      row.append(el('p',inquiry.body||'Mensaje de tipo '+inquiry.message_type+': revisa el contenido en WhatsApp.','inquiry-body'));
      if(inquiry.web_request_reference)row.append(el('p','Referencia indicada por el remitente: '+inquiry.web_request_reference));
      row.append(el('p',({received:'Recibida',review_ready:'Preparada por n8n',reviewed:'Revisada'}[inquiry.review_state])));
      if(inquiry.review_state!=='reviewed'){const b=el('button','Marcar como revisada');b.type='button';b.addEventListener('click',()=>run(async()=>{await read(client.from('whatsapp_inquiries').update({review_state:'reviewed'}).eq('id',inquiry.id).eq('updated_at',inquiry.updated_at).select('id').single());await loadInbox();notice('Consulta marcada como revisada. No se creó ni confirmó un pedido.');},b));row.append(b);}list.append(row);
    }
    $('inbox-page').textContent='Página '+(inboxPage+1)+' · '+count+' consultas';$('inbox-prev').disabled=inboxPage===0;$('inbox-next').disabled=(inboxPage+1)*pageSize>=count;
  }
  $('inbox-filters').addEventListener('submit',e=>{e.preventDefault();inboxPage=0;run(loadInbox,e.submitter);});
  $('inbox-prev').addEventListener('click',()=>{inboxPage=Math.max(0,inboxPage-1);run(loadInbox);});$('inbox-next').addEventListener('click',()=>{inboxPage++;run(loadInbox);});
  async function loadCustomers(){
    let q=client.from('customers').select('id,name,phone_e164,email',{count:'exact'}).is('archived_at',null).order('created_at',{ascending:false}).order('id').range(customersPage*pageSize,(customersPage+1)*pageSize-1);
    const query=$('customer-search').elements.query.value.trim();if(query)q=q.ilike('name','%'+query.replace(/[\\%_]/g,'\\$&')+'%');
    const {data,count}=await read(q),list=$('customers-list');list.replaceChildren();if(!data.length)list.append(el('p','No hay clientes con este filtro.'));
    for(const c of data){const row=el('article',undefined,'record');row.append(el('strong',c.name),el('p',[c.phone_e164,c.email].filter(Boolean).join(' · ')||'Sin contacto adicional'));const b=el('button','Usar en nuevo pedido');b.type='button';b.addEventListener('click',()=>{const select=$('new-order-form').elements.customer;if(![...select.options].some(o=>o.value===c.id))select.add(new Option(c.name,c.id));select.value=c.id;tab('new-order');});row.append(b);list.append(row);}
    $('customers-page').textContent='Página '+(customersPage+1)+' · '+count+' clientes';$('customers-prev').disabled=customersPage===0;$('customers-next').disabled=(customersPage+1)*pageSize>=count;
  }
  $('customer-search').addEventListener('submit',e=>{e.preventDefault();customersPage=0;run(loadCustomers,e.submitter);});
  $('customers-prev').addEventListener('click',()=>{customersPage=Math.max(0,customersPage-1);run(loadCustomers);});$('customers-next').addEventListener('click',()=>{customersPage++;run(loadCustomers);});
  async function loadCustomerChoices(){
    const {data}=await read(client.from('customers').select('id,name').is('archived_at',null).order('created_at',{ascending:false}).limit(500));
    const select=$('new-order-form').elements.customer,old=select.value,oldLabel=select.selectedOptions[0]?.textContent;select.replaceChildren(new Option('Sin cliente asignado',''));
    for(const c of data)select.add(new Option(c.name,c.id));if(old&&!data.some(c=>c.id===old))select.add(new Option(oldLabel,old));select.value=old;
  }
  $('customer-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
    const f=e.target.elements;await read(client.from('customers').insert({name:f.name.value.trim(),phone_e164:f.phone.value.trim()||null,email:f.email.value.trim()||null}).select('id').single());
    e.target.reset();customersPage=0;await Promise.all([loadCustomers(),loadCustomerChoices()]);notice('Cliente registrado.');
  },e.submitter);});
  function addItem(){
    if($('draft-items').children.length>=50){notice('Máximo 50 partidas por borrador.',true);return;}
    const row=el('div',undefined,'draft-line');
    for(const [name,label,type]of [['name','Arreglo o personalización','text'],['quantity','Cantidad','number'],['price','Precio unitario MXN','text']]){const l=el('label',label),i=el('input');i.name=name;i.type=type;if(name==='name'){i.required=true;i.maxLength=200;}if(name==='quantity'){i.required=true;i.min='1';i.max='10000';i.step='1';i.value='1';}if(name==='price'){i.inputMode='decimal';i.placeholder='Por cotizar';}l.append(i);row.append(l);}
    const b=el('button','Quitar');b.type='button';b.addEventListener('click',()=>{if($('draft-items').children.length>1)row.remove();else notice('Conserva al menos una partida.',true);});row.append(b);$('draft-items').append(row);
  }
  $('add-item').addEventListener('click',addItem);addItem();
  $('new-order-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
    const f=e.target.elements;
    if(!draftAttempt){const lines=validate(()=>C.items([...$('draft-items').children].map(row=>({name:row.querySelector('[name=name]').value,quantity:row.querySelector('[name=quantity]').value,price:row.querySelector('[name=price]').value}))));draftAttempt={p_creation_key:crypto.randomUUID(),p_customer_id:f.customer.value||null,p_items:lines,p_brand:f.brand.value,p_source:f.source.value,p_shipping_cents:validate(()=>C.cents(f.shipping.value,true))};}
    $('draft-fields').disabled=true;$('discard-attempt').hidden=false;
    const {data:id}=await read(client.rpc('create_manual_order',draftAttempt));
    draftAttempt=null;$('draft-fields').disabled=false;$('discard-attempt').hidden=true;e.target.reset();$('draft-items').replaceChildren();addItem();
    notice('Borrador creado. Completa la entrega antes de confirmar.');await loadDetail(id);
  },e.submitter);});
  $('discard-attempt').addEventListener('click',()=>{draftAttempt=null;$('draft-fields').disabled=false;$('discard-attempt').hidden=true;notice('Intento descartado. Comprueba el listado antes de crear otro pedido.');});

  async function loadDetail(id){
    const [{data:o},{data:items},{data:payments},{data:balance}]=await Promise.all([
      read(client.from('orders').select('*,customers(name)').eq('id',id).single()),read(client.from('order_items').select('id,name_snapshot,quantity,unit_price_cents,updated_at').eq('order_id',id).order('created_at')),
      read(client.from('payments').select('id,kind,status,amount_cents,method,external_reference,occurred_at').eq('order_id',id).order('created_at',{ascending:false})),read(client.from('order_balances').select('*').eq('order_id',id).single())]);
    currentOrder=o;$('detail-heading').textContent=o.reference;$('detail-meta').textContent=(o.customers?.name||'Sin cliente asignado')+' · '+(o.brand==='aurea_lidia'?'Áurea Lidia':'Jardín Eterno CDMX')+' · '+o.source;
    $('detail-balances').replaceChildren();for(const [label,value]of [['Total cotizado',balance.total_cents],['Cobrado neto',balance.received_cents],['Saldo',balance.balance_cents]]){const b=el('div',undefined,'balance');b.append(el('span',label),el('strong',C.money(value)));$('detail-balances').append(b);}
    const editable=['request','quoted'].includes(o.status);$('detail-items').replaceChildren(el('h3','Partidas acordadas'));
    for(const item of items){const form=el('form',undefined,'record');form.append(el('strong',item.name_snapshot));const quantity=el('input'),price=el('input');quantity.type='number';quantity.min='1';quantity.max='10000';quantity.step='1';quantity.required=true;quantity.value=item.quantity;price.inputMode='decimal';price.value=item.unit_price_cents===null?'':String(item.unit_price_cents/100);price.placeholder='Por cotizar';for(const [label,input]of [['Cantidad',quantity],['Precio unitario MXN',price]]){const l=el('label',label);l.append(input);form.append(l);input.disabled=!editable;}
      if(editable){const b=el('button','Guardar partida');b.type='submit';form.append(b);form.addEventListener('submit',e=>{e.preventDefault();run(async()=>{const line=validate(()=>C.items([{name:item.name_snapshot,quantity:quantity.value,price:price.value}]))[0];const {data}=await read(client.from('order_items').update({quantity:line.quantity,unit_price_cents:line.unit_price_cents}).eq('id',item.id).eq('updated_at',item.updated_at).select('id').single());if(data){await loadDetail(id);notice('Partida actualizada.');}},b);});} $('detail-items').append(form);
    }
    const f=$('detail-form').elements;for(const field of fields)f[field].value=field.endsWith('_cents')?(o[field]===null?'':String(o[field]/100)):(o[field]??'');
    $('detail-payments').replaceChildren();if(!payments.length)$('detail-payments').append(el('p','Sin movimientos registrados.'));
    for(const payment of payments){const row=el('article',undefined,'record');row.append(el('strong',(payment.kind==='refund'?'Devolución':'Cobro')+' · '+C.money(payment.amount_cents)),el('p',({pending:'Pendiente de verificar',verified:'Verificado manualmente',void:'Anulado'}[payment.status])+' · '+payment.method+(payment.external_reference?' · '+payment.external_reference:'')));
      if(profile.role==='admin'&&payment.status==='pending')for(const [state,label]of [['verified','Verificar recepción o devolución'],['void','Anular pendiente']]){const b=el('button',label);b.type='button';b.addEventListener('click',()=>run(async()=>{if(state==='verified'&&!window.confirm('Confirma que comprobaste personalmente '+(payment.kind==='refund'?'la devolución':'la recepción')+' de '+C.money(payment.amount_cents)+'.'))return;await read(client.from('payments').update({status:state}).eq('id',payment.id).eq('status','pending').select('id').single());await loadDetail(id);notice('Movimiento actualizado.');},b));row.append(b);} $('detail-payments').append(row);
    }
    $('payment-form').reset();const attempt=paymentAttempts.get(id);$('payment-fields').disabled=Boolean(attempt);if(attempt){const f=$('payment-form').elements;f.kind.value=attempt.kind;f.amount.value=attempt.amount_cents/100;f.method.value=attempt.method;f.reference.value=attempt.external_reference||'';}
    tab('order-detail');$('detail-heading').focus();
  }
  $('detail-close').addEventListener('click',()=>run(async()=>{tab('orders');await loadOrders();}));
  $('detail-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
    const f=e.target.elements,patch={};for(const field of fields)patch[field]=field.endsWith('_cents')?validate(()=>C.cents(f[field].value,true)):(f[field].value.trim()||null);
    const id=currentOrder.id;await read(client.from('orders').update(patch).eq('id',id).eq('updated_at',currentOrder.updated_at).select('id').single());await loadDetail(id);notice('Seguimiento guardado. La entrega sigue siendo una preferencia hasta confirmación operativa.');
  },e.submitter);});
  $('payment-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
    const id=currentOrder.id,f=e.target.elements;let attempt=paymentAttempts.get(id);
    if(!attempt){const amount=validate(()=>C.cents(f.amount.value));if(amount<=0)fail('El movimiento debe ser mayor a cero.');attempt={order_id:id,kind:f.kind.value,amount_cents:amount,method:f.method.value,external_reference:f.reference.value.trim()||null,status:'pending',idempotency_key:crypto.randomUUID()};paymentAttempts.set(id,attempt);}
    $('payment-fields').disabled=true;
    try{await read(client.from('payments').insert(attempt).select('id').single());}catch(error){
      if(error.code==='23505'){const {data}=await read(client.from('payments').select('id').eq('idempotency_key',attempt.idempotency_key).maybeSingle());if(!data)throw error;}
      else{if(error.code&&/^(235|425|PGRST)/.test(error.code)){paymentAttempts.delete(id);$('payment-fields').disabled=false;}throw error;}
    }
    paymentAttempts.delete(id);await loadDetail(id);notice('Movimiento pendiente registrado. No cuenta como dinero recibido hasta verificación administrativa.');
  },e.submitter);});
})();
