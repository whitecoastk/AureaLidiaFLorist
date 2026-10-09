(function(){
  'use strict';
  const core=window.FloristCore,analytics=window.FloristAnalytics;
  document.addEventListener('DOMContentLoaded',async()=>{
    const form=document.getElementById('order-form');if(!form)return;
    const params=new URLSearchParams(location.search);
    let product=null,variation=null,referenceURL='',step=1,message='',requestId='',reviewed=false;
    const banner=document.getElementById('order-unavailable');
    if(params.has('arreglo')){
      // Deshabilitar mientras se valida la referencia para no enviar un personalizado por error.
      form.querySelector('[data-next]').disabled=true;
      try{
        product=(await window.FloristProducts()).find(p=>p.id===params.get('arreglo')&&p.status==='published');
        if(!product)throw Error('Esta referencia ya no está publicada.');
        if(params.has('variacion')){variation=product.variations.find(v=>v.id===params.get('variacion'));if(!variation)throw Error('La variación solicitada no está definida.');}
        else if(product.variations.length)variation=product.variations[0];
        document.getElementById('chosen-product').textContent=product.name+(variation?' · '+variation.label:'')+' · '+core.priceLabel(variation||product)+' · precio final por confirmar';
        if((variation||product).priceType!=='quote')form.elements.budget.value=(variation||product).price;
        form.querySelector('[data-next]').disabled=false;
      }catch(e){
        banner.hidden=false;banner.textContent=e.message+' Vuelve al catálogo o crea una solicitud personalizada.';
        const a=document.createElement('a');a.href='/personalizar.html';a.textContent=' Crear solicitud personalizada';banner.append(a);form.hidden=true;return;
      }
    }
    const date=form.elements.date;date.min=core.localDate();
    const read=()=>({budget:form.elements.budget.value.trim(),date:date.value,time:form.elements.time.value,region:form.elements.region.value,neighborhood:form.elements.neighborhood.value.trim(),borough:form.elements.borough.value.trim(),postalCode:form.elements.postalCode.value.trim(),dedication:form.elements.dedication.value.trim(),customization:form.elements.customization.value.trim(),notes:form.elements.notes.value.trim(),accepted:form.elements.accepted.checked,hasReference:Boolean(referenceURL),variation,requestId});
    const errorFields=['budget','date','time','region','neighborhood','borough','postalCode','dedication','customization','notes','accepted'];
    function errorsFor(fields){
      const all=core.validateOrder(read(),undefined,window.FLORIST_CONFIG.minimumCustomBudget),errors={};
      for(const id of errorFields){const error=fields.includes(id)?all[id]:'';document.getElementById(id+'-error').textContent=error||'';form.elements[id].setAttribute('aria-invalid',String(Boolean(error)));if(error)errors[id]=error;}
      const first=Object.keys(errors)[0];if(first)form.elements[first].focus();
      return !first;
    }
    function show(n){
      step=n;document.querySelectorAll('[data-step]').forEach(el=>el.hidden=Number(el.dataset.step)!==n);
      document.querySelectorAll('[data-progress]').forEach(el=>{if(Number(el.dataset.progress)===n)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
      const heading=document.querySelector('[data-step="'+n+'"] '+(n===3?'h2':'legend'));heading.focus();heading.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
    }
    form.querySelector('[data-next]').addEventListener('click',()=>{
      if(!errorsFor(['budget','customization']))return;
      analytics.track('begin_checkout',{...(product?{item_id:product.id}:{}),flow:product?'catalogo':'personalizado'},'order-start');show(2);
    });
    form.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>{reviewed=false;show(Number(b.dataset.back));}));
    function summary(){
      if(!errorsFor(errorFields))return false;
      if(!requestId)requestId='AL-'+crypto.randomUUID();
      const o=read();message=core.orderMessage(o,product,analytics.attribution());
      const rows=[['Referencia',requestId],['Arreglo',product?product.name:'Ramo personalizado'],...(variation?[['Variación',variation.label]]:[]),...(product?[['Precio de referencia',core.priceLabel(variation||product)]]:[]),['Presupuesto',core.money(Number(o.budget))+' MXN'],['Fecha solicitada',o.date],['Horario preferido',core.timeLabels[o.time]],['Zona',[o.neighborhood,o.borough,o.postalCode,o.region==='edomex'?'Estado de México':'CDMX'].join(', ')],['Dedicatoria',o.dedication||'Sin dedicatoria'],['Personalización',o.customization||'Sin preferencias adicionales'],['Observaciones',o.notes||'Sin observaciones'],['Fotografía',o.hasReference?'Seleccionada; debes adjuntarla en WhatsApp':'Sin fotografía de referencia']];
      const list=document.getElementById('order-summary');list.replaceChildren();
      for(const [label,value]of rows){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);list.append(div);}
      document.getElementById('photo-reminder').hidden=!o.hasReference;
      document.getElementById('send-whatsapp').href=core.whatsappUrl(window.FLORIST_CONFIG.whatsapp,message);
      document.getElementById('request-reference').textContent='Referencia de solicitud: '+requestId+'. Es una referencia local; no indica que el negocio haya recibido o confirmado el pedido.';
      reviewed=true;analytics.track('form_complete',{request_id:requestId,flow:product?'catalogo':'personalizado'},requestId);show(3);return true;
    }
    form.addEventListener('submit',e=>{e.preventDefault();if(step===2)summary();else if(step===1)form.querySelector('[data-next]').click();});
    form.addEventListener('input',()=>{if(step!==3)reviewed=false;});
    form.elements.region.addEventListener('change',()=>{form.elements.borough.value='';if(form.elements.region.value==='edomex')form.elements.borough.removeAttribute('list');else form.elements.borough.setAttribute('list','borough-options');});
    const input=document.getElementById('reference'),preview=document.getElementById('reference-preview'),remove=document.getElementById('remove-reference');
    function clearReference(){if(referenceURL)URL.revokeObjectURL(referenceURL);referenceURL='';input.value='';preview.hidden=true;preview.removeAttribute('src');remove.hidden=true;document.getElementById('reference-error').textContent='';}
    input.addEventListener('change',()=>{
      const file=input.files?.[0];if(referenceURL)URL.revokeObjectURL(referenceURL);referenceURL='';preview.hidden=true;remove.hidden=true;
      if(!file){clearReference();return;}
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){clearReference();document.getElementById('reference-error').textContent='Elige una imagen JPG, PNG o WebP de hasta 8 MB.';input.focus();return;}
      referenceURL=URL.createObjectURL(file);preview.src=referenceURL;preview.hidden=false;remove.hidden=false;document.getElementById('reference-error').textContent='';
    });
    preview.addEventListener('error',()=>{clearReference();document.getElementById('reference-error').textContent='No se pudo leer la imagen. Elige otra fotografía.';});
    remove.addEventListener('click',clearReference);
    window.addEventListener('pagehide',()=>{if(referenceURL)URL.revokeObjectURL(referenceURL);});
    document.getElementById('send-whatsapp').addEventListener('click',e=>{
      if(!reviewed||!errorsFor(errorFields)){e.preventDefault();show(2);return;}
      // Regenerar por si el consentimiento o atribución cambió desde el resumen.
      message=core.orderMessage(read(),product,analytics.attribution());e.currentTarget.href=core.whatsappUrl(window.FLORIST_CONFIG.whatsapp,message);
      analytics.track('generate_lead',{request_id:requestId,method:'whatsapp',flow:product?'catalogo':'personalizado'},requestId);
      analytics.track('contact',{request_id:requestId,method:'whatsapp',flow:'solicitud'},requestId);
    });
    document.getElementById('copy-request').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(message);document.getElementById('copy-status').textContent='Mensaje copiado. Pégalo en WhatsApp y adjunta tu foto, si elegiste una.';}catch{document.getElementById('copy-status').textContent='No se pudo copiar. Puedes usar el enlace de WhatsApp.';}});
    document.addEventListener('florist:analytics-ready',()=>{if(step>=2)analytics.track('begin_checkout',{...(product?{item_id:product.id}:{}),flow:product?'catalogo':'personalizado'},'order-start');if(reviewed)analytics.track('form_complete',{request_id:requestId,flow:product?'catalogo':'personalizado'},requestId);});
  });
})();
