// Receptor sin dependencias externas. El payload entrante es dato, nunca instrucciones.
const encoder=new TextEncoder(),MAX_BYTES=512*1024;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function response(body,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
async function secretEqual(left,right){
  if(typeof left!=='string'||!left||typeof right!=='string'||!right)return false;
  const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(left)),crypto.subtle.digest('SHA-256',encoder.encode(right))]);
  const x=new Uint8Array(a),y=new Uint8Array(b);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;
}
export async function validSignature(raw,header,secret){
  if(!secret||!/^sha256=[0-9a-f]{64}$/i.test(header||''))return false;
  const signature=Uint8Array.from(header.slice(7).match(/../g),h=>parseInt(h,16));
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  return crypto.subtle.verify('HMAC',key,signature,raw);
}
async function limitedBody(request){
  if(Number(request.headers.get('content-length')||0)>MAX_BYTES)throw {status:413};
  if(!request.body)return new Uint8Array();
  const reader=request.body.getReader(),chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw {status:413};}chunks.push(value);}}
  finally{reader.releaseLock();}
  const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}return body;
}
// Solo para payloads que ya pasaron HMAC. Ignora estados de entrega y campos internos.
export function incomingMessages(payload,wabaId,phoneId){
  if(payload?.object!=='whatsapp_business_account'||!Array.isArray(payload.entry))throw {status:400};
  const output=[],seen=new Set();let total=0;
  if(payload.entry.length>100)throw {status:400};
  for(const entry of payload.entry){
    if(String(entry.id)!==wabaId)continue;
    if(!Array.isArray(entry.changes)||entry.changes.length>100)throw {status:400};
    for(const change of entry.changes){
      if(change.field!=='messages'||String(change.value?.metadata?.phone_number_id)!==phoneId)continue;
      const value=change.value,messages=value.messages??[];if(!Array.isArray(messages))throw {status:400};
      for(const m of messages){
        if(++total>100)throw {status:400};
        if(typeof m.id!=='string'||!m.id.trim()||m.id.length>250||!/^[1-9]\d{7,14}$/.test(String(m.from||'')))throw {status:400};
        if(!/^\d{9,11}$/.test(String(m.timestamp||'')))throw {status:400};
        const type=m.type;if(!['text','image','audio','document','video','sticker','location','contacts','interactive','button'].includes(type))continue;
        const body=type==='text'?m.text?.body:null;if(type==='text'&&(typeof body!=='string'||!body.trim()||body.length>4096))throw {status:400};
        if(seen.has(m.id))continue;
        const contacts=Array.isArray(value.contacts)?value.contacts:[],name=contacts.find(c=>c.wa_id===m.from)?.profile?.name;
        const reference=body?.match(/\bAL-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/i)?.[0]??null;
        output.push({business_phone_number_id:phoneId,provider_message_id:m.id,sender_id:String(m.from),
          sender_display_name:typeof name==='string'?name.slice(0,160):null,received_at:new Date(Number(m.timestamp)*1000).toISOString(),
          message_type:type,body,web_request_reference:reference});seen.add(m.id);
      }
    }
  }
  return output;
}
export function createHandler(config,fetchImpl=fetch){
  async function rpc(name,args){
    const headers={'apikey':config.dbSecret,'Content-Type':'application/json'};
    // Los JWT heredados necesitan Authorization; las nuevas sb_secret usan apikey.
    if(!config.dbSecret.startsWith('sb_secret_'))headers.Authorization='Bearer '+config.dbSecret;
    const result=await fetchImpl(config.dbUrl+'/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(args),signal:AbortSignal.timeout(10000)});
    if(!result.ok)throw {status:503};return result.json();
  }
  return async request=>{
    try{
      const u=new URL(request.url),mode=u.searchParams.get('mode');
      if(!config.appSecret||!config.verifyToken||!/^\d{5,30}$/.test(config.wabaId||'')||!/^\d{5,30}$/.test(config.phoneId||''))return response({error:'Receptor sin configurar'},503);
      if(request.method==='GET'&&u.searchParams.get('hub.mode')==='subscribe'){
        if(!await secretEqual(u.searchParams.get('hub.verify_token'),config.verifyToken))return response({error:'No autorizado'},403);
        const challenge=u.searchParams.get('hub.challenge');if(!challenge||challenge.length>200)return response({error:'Desafío inválido'},400);
        return new Response(challenge,{headers:{'Content-Type':'text/plain','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
      }
      if(mode){
        if(!config.n8nToken||config.n8nToken.length<32||!await secretEqual(request.headers.get('x-inbox-token'),config.n8nToken))return response({error:'No autorizado'},403);
        if(!config.dbUrl||!config.dbSecret)return response({error:'Almacenamiento sin configurar'},503);
        if(mode==='pending'&&request.method==='GET')return response({items:await rpc('whatsapp_inbox_pending',{p_limit:20})});
        if(mode==='ready'&&request.method==='POST'){
          let payload;try{payload=JSON.parse(new TextDecoder().decode(await limitedBody(request)));}catch(error){throw error.status?error:{status:400};}
          if(!Array.isArray(payload.ids)||payload.ids.length<1||payload.ids.length>100||payload.ids.some(id=>typeof id!=='string'||!uuid.test(id)))return response({error:'IDs inválidos'},400);
          return response({updated:await rpc('whatsapp_inbox_ready',{p_ids:[...new Set(payload.ids)]})});
        }
        return response({error:'Operación no disponible'},405);
      }
      if(request.method!=='POST')return response({error:'Método no disponible'},405);
      const raw=await limitedBody(request);
      if(!await validSignature(raw,request.headers.get('x-hub-signature-256'),config.appSecret))return response({error:'Firma inválida'},401);
      let payload;try{payload=JSON.parse(new TextDecoder().decode(raw));}catch{throw {status:400};}
      const messages=incomingMessages(payload,config.wabaId,config.phoneId);
      if(!messages.length)return response({received:true,inserted:0});
      if(!config.dbUrl||!config.dbSecret)return response({error:'Almacenamiento sin configurar'},503);
      const inserted=await rpc('whatsapp_inbox_ingest',{p_messages:messages});
      return response({received:true,inserted});
    }catch(error){return response({error:error.status===413?'Evento demasiado grande':error.status===400?'Evento inválido':'No se pudo procesar el evento'},error.status||503);}
  };
}
