(function(){
  'use strict';
  const core=window.FloristCore,analytics=window.FloristAnalytics;
  let productsPromise;
  window.FloristProducts=()=>productsPromise||(productsPromise=fetch('/data/catalog.json').then(r=>{if(!r.ok)throw Error('No fue posible leer el catálogo.');return r.json();}).then(core.validateProducts));
  document.addEventListener('DOMContentLoaded',()=>{
    const toggle=document.getElementById('menu-toggle'),menu=document.getElementById('nav-links');
    if(document.getElementById('order-form'))document.querySelector('.contact-float').hidden=true;
    toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));menu.classList.toggle('open',open);});
    document.addEventListener('keydown',e=>{if(e.key==='Escape' && toggle.getAttribute('aria-expanded')==='true'){toggle.setAttribute('aria-expanded','false');menu.classList.remove('open');toggle.focus();}});
    // El carrito legado incluía datos personales sin caducidad. Retirar esa copia local tras la migración.
    try{localStorage.removeItem('cart');}catch{}
    for(const link of document.querySelectorAll('[data-select-item]'))link.addEventListener('click',()=>analytics.track('select_item',{item_id:link.dataset.selectItem,item_list_name:'catalogo'},link.dataset.selectItem));
    for(const link of document.querySelectorAll('[data-contact]'))link.addEventListener('click',()=>analytics.track('contact',{method:'whatsapp',flow:link.dataset.contact},'contact-'+link.dataset.contact));
    const view=document.querySelector('[data-view-product]');
    if(view){
      const viewEvent=()=>analytics.track('view_item',{item_id:view.dataset.viewProduct,item_name:document.querySelector('h1').textContent},view.dataset.viewProduct);
      document.addEventListener('florist:analytics-ready',viewEvent);viewEvent();
      const variation=document.getElementById('product-variation');
      if(variation)window.FloristProducts().then(products=>{
        const p=products.find(p=>p.id===view.dataset.viewProduct);
        const update=()=>{const v=p.variations.find(v=>v.id===variation.value);if(!v)return;document.getElementById('product-price').textContent=core.priceLabel(v);const a=document.getElementById('product-request'),u=new URL(a.href);u.searchParams.set('variacion',v.id);a.href=u.pathname+u.search;};
        variation.addEventListener('change',update);update();
      }).catch(()=>{variation.disabled=true;});
    }
    document.querySelectorAll('[data-gallery-image]').forEach(b=>b.addEventListener('click',()=>{const img=document.getElementById('product-photo');img.removeAttribute('srcset');img.removeAttribute('sizes');img.src=b.dataset.galleryImage;}));
  });
})();
