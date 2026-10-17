(function(){
  'use strict';
  const core=window.FloristCore,view=window.FloristCatalogView,config=window.FLORIST_CONFIG;
  let pending;
  window.FloristProducts=()=>pending||(pending=(async()=>{
    const r=await fetch('/data/catalog.json');if(!r.ok)throw Error('No fue posible leer el catálogo.');
    const backup=core.validateProducts(await r.json());
    if(!config.sheet?.enabled)return backup;
    try{const products=await window.FloristSheet.load(config.sheet,backup);document.documentElement.dataset.catalogSource='google-sheets';return products;}
    catch{
      document.documentElement.dataset.catalogSource='backup';document.dispatchEvent(new CustomEvent('florist:catalog-fallback'));
      return backup.map(p=>({...p,availability:p.availability==='unavailable'?'unavailable':'confirm'}));
    }
  })());
  document.addEventListener('florist:catalog-fallback',()=>{
    const main=document.getElementById('contenido'),notice=document.createElement('p');notice.className='wrap notice';notice.setAttribute('role','status');notice.textContent='No pudimos consultar la hoja en este momento. Mostramos el catálogo de respaldo; pregunta por disponibilidad y precio vigente.';main.prepend(notice);
  });
  document.addEventListener('DOMContentLoaded',async()=>{
    const grid=document.getElementById('products-grid'),home=document.getElementById('home-products'),existing=document.querySelector('.product-layout'),generic=document.getElementById('live-product');
    if(!grid&&!home&&!existing&&!generic)return;
    if(grid){grid.setAttribute('aria-busy','true');document.getElementById('results-count').textContent='Consultando catálogo…';}
    const id=generic?new URLSearchParams(location.search).get('arreglo'):existing?.querySelector('[data-view-product]')?.dataset.viewProduct;
    // La página de personalización también tiene dos columnas, pero no es una ficha.
    if(existing&&!id&&!grid&&!home&&!generic)return;
    // No permitir pedir una referencia mientras se comprueba el estado en la hoja.
    if(existing){existing.querySelectorAll('#product-request').forEach(a=>{a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.textContent='Consultando disponibilidad…';});}
    try{
      const products=await window.FloristProducts(),published=products.filter(p=>p.status==='published');
      if(grid)grid.innerHTML=published.map(p=>view.card(p,config)).join('');
      if(home){const featured=published.filter(p=>p.featured);home.innerHTML=(featured.length?featured:published).slice(0,6).map(p=>view.card(p,config)).join('');}
      if(existing||generic){
        const p=published.find(p=>p.id===id),target=generic||existing.parentElement;
        if(!p){target.innerHTML='<h1>Este arreglo ya no está publicado.</h1><a class="btn" href="/catalogo.html">Volver al catálogo</a>';return;}
        const dedication=existing?.querySelector('#product-dedication')?.value||'',chosen=existing?.querySelector('[name="product-variant"]:checked')?.value;
        if(existing)existing.outerHTML=view.product(p,config);else generic.innerHTML=view.product(p,config);
        if(dedication&&document.getElementById('product-dedication'))document.getElementById('product-dedication').value=dedication;
        const selected=p.variations.find(v=>v.id===chosen);
        if(selected&&core.canRequest(p)){
          document.querySelectorAll('[name="product-variant"]').forEach(input=>input.checked=input.value===selected.id);
          document.getElementById('product-price').textContent=core.priceLabel(selected);document.getElementById('product-request').href=view.request(p)+'&variacion='+encodeURIComponent(selected.id);
        }
        document.title=p.name+' | Áurea Lidia';
        for(const selector of ['meta[name="description"]','meta[property="og:description"]'])document.querySelector(selector)?.setAttribute('content',p.description||'Arreglo floral bajo pedido. Consulta disponibilidad, precio final y entrega.');
        document.querySelector('meta[property="og:title"]')?.setAttribute('content',document.title);
        document.querySelector('meta[property="og:image"]')?.setAttribute('content',new URL(p.images[0].startsWith('resources/')?'/'+p.images[0]:p.images[0],location.origin).href);
        const schema=document.querySelector('script[type="application/ld+json"]');
        if(schema){
          const updated={'@context':'https://schema.org','@type':'Product',name:p.name,sku:p.id,description:p.description,image:p.images.map(image=>new URL(image.startsWith('resources/')?'/'+image:image,location.origin).href),brand:{'@type':'Brand',name:config.name},...(p.priceType==='fixed'?{offers:{'@type':'Offer',price:p.price,priceCurrency:'MXN'}}:{})};
          let previous;try{previous=JSON.parse(schema.textContent);}catch{}
          // Conservar BreadcrumbList y los identificadores de la ficha estática al refrescarla.
          schema.textContent=JSON.stringify(Array.isArray(previous?.['@graph'])?{...previous,'@graph':previous['@graph'].map(node=>node['@type']==='Product'?{...updated,...(node['@id']?{'@id':node['@id']}:{}),...(node.url?{url:node.url}:{})}:node)}:updated);
        }
        const track=()=>window.FloristAnalytics.track('view_item',{item_id:p.id,item_name:p.name},p.id);track();document.addEventListener('florist:analytics-ready',track);
      }
    }catch{
      if(generic)generic.innerHTML='<h1>No pudimos cargar este arreglo.</h1><a class="btn" href="/catalogo.html">Volver al catálogo</a>';
    }finally{if(grid)grid.setAttribute('aria-busy','false');}
  });
  document.addEventListener('click',e=>{
    const link=e.target.closest('[data-select-item]');if(link)window.FloristAnalytics.track('select_item',{item_id:link.dataset.selectItem,item_list_name:'catalogo'},link.dataset.selectItem);
    const thumb=e.target.closest('[data-live-image]');if(thumb){const image=document.querySelector('.product-image img');image.removeAttribute('srcset');image.removeAttribute('sizes');image.src=thumb.dataset.liveImage;document.querySelectorAll('[data-live-image]').forEach(b=>b.setAttribute('aria-pressed',String(b===thumb)));}
  });
})();
