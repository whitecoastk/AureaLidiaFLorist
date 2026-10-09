(function(){
  'use strict';
  const core=window.FloristCore, config=window.FLORIST_CONFIG;
  const consentKey='aurea-consent-v1', attrKey='aurea-attribution-v1';
  const gaValid=/^G-[A-Z0-9]+$/.test(config.ga4Id || ''), metaValid=/^\d{5,25}$/.test(config.metaPixelId || '');
  let consent=null, started=false;
  const sent=new Set();
  const current=core.attributionFrom(location.search);
  let attribution=current;
  const storage={get(k,session=false){try{return (session?sessionStorage:localStorage).getItem(k);}catch{return null;}},set(k,v,session=false){try{(session?sessionStorage:localStorage).setItem(k,v);}catch{}},remove(k,session=false){try{(session?sessionStorage:localStorage).removeItem(k);}catch{}}};
  try{const c=JSON.parse(storage.get(consentKey));if(c && ['accepted','rejected'].includes(c.state) && Date.now()-c.at>=0 && Date.now()-c.at<180*86400000)consent=c.state;}catch{}
  function storeAttribution(){
    let saved={};try{saved=JSON.parse(storage.get(attrKey,true))||{};}catch{}
    // Nuevos parámetros de campaña reemplazan la atribución previa; una visita interna la conserva.
    const explicit=new URLSearchParams(location.search);
    attribution=Object.keys(current).some(k=>k.startsWith('utm_'))||explicit.has('marca')?current:{...core.attributionFrom(new URLSearchParams(saved).toString()),brand:saved.brand==='Jardín Eterno CDMX'?'Jardín Eterno CDMX':'Áurea Lidia'};
    storage.set(attrKey,JSON.stringify(attribution),true);
  }
  function start(){
    if(started || consent!=='accepted')return;
    started=true;storeAttribution();
    // Meta lee automáticamente la URL. Limitar sus parámetros antes de cargar cualquier proveedor.
    const clean=new URLSearchParams();
    for(const [k,v]of Object.entries(current))if(k.startsWith('utm_'))clean.set(k,v);
    const routeParams=new URLSearchParams(location.search);
    for(const key of ['arreglo','variacion']){const value=routeParams.get(key);if(value && /^[a-zA-Z0-9_-]{1,100}$/.test(value))clean.set(key,value);}
    if(current.brand==='Jardín Eterno CDMX')clean.set('marca','jardin-eterno-cdmx');
    if(core.occasions[routeParams.get('ocasion')])clean.set('ocasion',routeParams.get('ocasion'));
    history.replaceState(null,'',location.pathname+(clean.size?'?'+clean.toString():'')+location.hash);
    const publicLocation=location.origin+location.pathname; // Nunca enviar query con mensaje o datos personales a GA4.
    if(gaValid){
      window.dataLayer=window.dataLayer||[];
      window.gtag=function(){window.dataLayer.push(arguments);};
      window['ga-disable-'+config.ga4Id]=false;
      gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      gtag('js',new Date());
      gtag('config',config.ga4Id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:publicLocation,page_referrer:document.referrer?new URL(document.referrer).origin+new URL(document.referrer).pathname:'',campaign_source:attribution.utm_source,campaign_medium:attribution.utm_medium,campaign_name:attribution.utm_campaign,campaign_content:attribution.utm_content,campaign_term:attribution.utm_term});
      const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(config.ga4Id);document.head.append(script);
      gtag('event','page_view',{page_location:publicLocation,page_title:document.title,brand:attribution.brand,...campaignParams()});
    }
    if(metaValid){
      const fbq=function(){fbq.callMethod?fbq.callMethod.apply(fbq,arguments):fbq.queue.push(arguments);};
      fbq.queue=[];fbq.push=fbq;fbq.loaded=true;fbq.version='2.0';window.fbq=fbq;
      fbq('consent','grant');fbq('set','autoConfig',false,config.metaPixelId);fbq('init',config.metaPixelId);
      const script=document.createElement('script');script.async=true;script.src='https://connect.facebook.net/en_US/fbevents.js';document.head.append(script);
      fbq('track','PageView');
    }
    document.dispatchEvent(new CustomEvent('florist:analytics-ready'));
  }
  function campaignParams(){const o={};for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'])if(attribution[k])o[k]=attribution[k];return o;}
  function track(name,params={},onceKey){
    if(consent!=='accepted')return false;
    if(onceKey && sent.has(name+':'+onceKey))return false;
    if(onceKey)sent.add(name+':'+onceKey);
    // Lista cerrada de propiedades: nunca serializar formulario, evento DOM ni URL completa.
    const allowed=['item_id','item_name','item_list_name','request_id','method','flow','content_ids'];
    const safe={brand:attribution.brand,...campaignParams()};
    for(const key of allowed)if(params[key]!=null)safe[key]=params[key];
    if(gaValid && window.gtag){
      if(['view_item','select_item','begin_checkout'].includes(name)&&safe.item_id)safe.items=[{item_id:safe.item_id,...(safe.item_name?{item_name:safe.item_name}:{})}];
      if(name==='view_item_list' && Array.isArray(safe.content_ids))safe.items=safe.content_ids.map(id=>({item_id:id}));
      gtag('event',name,{...safe,page_location:location.origin+location.pathname});
    }
    if(metaValid && window.fbq){
      const map={view_item:'ViewContent',begin_checkout:'InitiateCheckout',generate_lead:'Lead',contact:'Contact'};
      const metaParams={brand:safe.brand,...(safe.request_id?{request_id:safe.request_id}:{}),...(safe.item_id?{content_ids:[safe.item_id],content_type:'product'}:{}),...(safe.method?{method:safe.method}:{})};
      const eventID=name+'-'+(onceKey||crypto.randomUUID());
      if(map[name])fbq('track',map[name],metaParams,{eventID});
      else if(['view_item_list','select_item','form_complete'].includes(name))fbq('trackCustom',name,metaParams,{eventID});
    }
    return true;
  }
  function revoke(){
    if(gaValid)window['ga-disable-'+config.ga4Id]=true;
    if(window.fbq)window.fbq('consent','revoke');
    storage.remove(attrKey,true);
    // Borra las cookies accesibles de estos proveedores; no afecta otras cookies del hosting.
    for(const cookie of document.cookie.split(';')){
      const name=cookie.split('=')[0].trim();if(!/^(_ga(?:_|$)|_gid$|_gat|_fbp$|_fbc$)/.test(name))continue;
      document.cookie=name+'=; Max-Age=0; path=/; SameSite=Lax';
      const host=location.hostname.split('.');for(let i=0;i<host.length-1;i++)document.cookie=name+'=; Max-Age=0; path=/; domain=.'+host.slice(i).join('.')+'; SameSite=Lax';
    }
  }
  function choose(state){
    const wasStarted=started;consent=state;storage.set(consentKey,JSON.stringify({state,at:Date.now()}));
    document.getElementById('consent-banner').hidden=true;
    if(state==='accepted')start();else{revoke();if(wasStarted)location.reload();}
  }
  function propagate(){
    const params=new URLSearchParams();
    for(const [k,v] of Object.entries(current))if(k.startsWith('utm_'))params.set(k,v);
    if(current.brand==='Jardín Eterno CDMX')params.set('marca','jardin-eterno-cdmx');
    if(!params.size)return;
    for(const a of document.querySelectorAll('a[href]')){
      const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.hash||a.getAttribute('href').startsWith('#'))continue;
      for(const [k,v]of params)if(!u.searchParams.has(k))u.searchParams.set(k,v);
      a.href=u.pathname+u.search+u.hash;
    }
  }
  window.FloristAnalytics={track,attribution:()=>({...attribution}),consent:()=>consent,propagate};
  document.addEventListener('DOMContentLoaded',()=>{
    const banner=document.getElementById('consent-banner');banner.hidden=consent!==null || (!gaValid&&!metaValid);
    document.querySelectorAll('[data-consent]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.consent)));
    document.getElementById('cookie-settings').addEventListener('click',()=>{banner.hidden=false;document.getElementById('consent-close').hidden=consent===null && (gaValid||metaValid);banner.querySelector('button').focus();});
    document.getElementById('consent-close').addEventListener('click',()=>{banner.hidden=true;document.getElementById('cookie-settings').focus();});
    propagate();
    if(consent==='accepted')start();else storage.remove(attrKey,true);
  });
})();
