const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {normalizeWhatsApp}=require('../automations/n8n/normalize-whatsapp.cjs');
const message={id:'wamid.fixture',from:'525500000099',timestamp:'1792195200',type:'text',text:{body:'Consulta de prueba'}};
const payload=messages=>({object:'whatsapp_business_account',entry:[{changes:[{field:'messages',value:{metadata:{phone_number_id:'000000000000002'},messages}}]}]});
test('WhatsApp entrante se prepara como consulta pendiente sin inventar pedido, precio o pago',()=>{
  const [result]=normalizeWhatsApp(payload([message]));assert.equal(result.sender_phone_e164,'+525500000099');assert.equal(result.text,message.text.body);assert.equal(result.requires_manual_review,true);assert.equal(result.payment_verified,false);assert.equal(result.proposed_state,'inquiry');assert.ok(!('price' in result));assert.ok(!('order_id' in result));
});
test('Los acuses de entrega no se interpretan como consultas y duplicados del lote se agrupan',()=>{
  assert.equal(normalizeWhatsApp(payload([message,message])).length,1);
  assert.equal(normalizeWhatsApp(payload([])).length,0);
  const p=payload([]);p.entry[0].changes[0].value.statuses=[{status:'delivered',id:'wamid.fixture'}];assert.equal(normalizeWhatsApp(p).length,0);
});
test('Referencia AL se conserva y una imagen no se simula como archivo adjunto o descargado',()=>{
  const id='AL-10000000-0000-4000-8000-000000000001';assert.equal(normalizeWhatsApp(payload([{...message,text:{body:'SOLICITUD '+id}}]))[0].web_request_reference,id);
  const [image]=normalizeWhatsApp(payload([{...message,type:'image',image:{id:'media-fixture',caption:'referencia'}}]));assert.equal(image.message_type,'image');assert.equal(image.text,null);assert.ok(!('file_url' in image));
});
test('Payloads inválidos o datos excesivos no se procesan como consultas válidas',()=>{
  assert.throws(()=>normalizeWhatsApp({}));assert.throws(()=>normalizeWhatsApp(payload(Array(101).fill(message))));
  for(const extra of [{from:'invalid'},{timestamp:'abc'},{id:''},{text:{body:'x'.repeat(4097)}}])assert.equal(normalizeWhatsApp(payload([{...message,...extra}])).length,0);
});
test('Workflow generado está inactivo, sin credenciales ni envíos, y ejecuta la misma transformación probada',()=>{
  const workflow=JSON.parse(fs.readFileSync('automations/n8n/workflows/01-whatsapp-simulacion.json','utf8'));
  assert.equal(workflow.active,false);assert.ok(workflow.nodes.every(n=>!n.credentials));assert.ok(workflow.nodes.every(n=>!['n8n-nodes-base.httpRequest','n8n-nodes-base.whatsApp','n8n-nodes-base.webhook'].includes(n.type)));
  const code=workflow.nodes.find(n=>n.id==='normalize').parameters.jsCode;
  const result=vm.runInNewContext('(function(){'+code+'})()',{$input:{all:()=>[{json:payload([message])}]}});
  assert.equal(result.length,1);assert.equal(result[0].json.provider_message_id,message.id);
});
