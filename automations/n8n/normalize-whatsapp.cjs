// Transformación pura para simulación. NO verifica firmas ni guarda pedidos.
// En producción el receptor deberá validar la firma Meta ANTES de usarla.
function normalizeWhatsApp(payload){
  if(!payload||payload.object!=='whatsapp_business_account'||!Array.isArray(payload.entry))throw Error('Evento de WhatsApp no válido.');
  const results=[],seen=new Set();let count=0;
  for(const entry of payload.entry){
    for(const change of entry.changes||[]){
      if(change.field!=='messages')continue;
      const value=change.value||{},businessId=value.metadata?.phone_number_id;
      if(!/^\d{5,30}$/.test(String(businessId||'')))continue;
      for(const message of value.messages||[]){
        if(++count>100)throw Error('Demasiados mensajes en un evento.');
        if(typeof message.id!=='string'||message.id.length>250||!message.id.trim())continue;
        const from=String(message.from||'');if(!/^[1-9]\d{7,14}$/.test(from))continue;
        const key=businessId+':'+message.id;if(seen.has(key))continue;
        const timestamp=String(message.timestamp||'');if(!/^\d{9,11}$/.test(timestamp))continue;
        const seconds=Number(timestamp),date=new Date(seconds*1000);if(!Number.isFinite(date.getTime()))continue;
        const supported=['text','image','audio','document','video','sticker','location','contacts','interactive','button'];
        if(!supported.includes(message.type))continue;
        const text=message.type==='text'?message.text?.body:null;
        if(message.type==='text'&&(typeof text!=='string'||!text.trim()||text.length>4096))continue;
        const contact=(value.contacts||[]).find(c=>c.wa_id===from),name=contact?.profile?.name;
        const reference=typeof text==='string'?text.match(/\bAL-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/i)?.[0]:null;
        results.push({provider:'whatsapp_cloud',business_phone_number_id:String(businessId),provider_message_id:message.id,
          sender_phone_e164:'+'+from,sender_display_name:typeof name==='string'?name.slice(0,160):null,
          received_at:date.toISOString(),message_type:message.type,text:text??null,web_request_reference:reference??null,
          requires_manual_review:true,proposed_state:'inquiry',payment_verified:false});
        seen.add(key);
      }
    }
  }
  return results;
}
module.exports={normalizeWhatsApp};
