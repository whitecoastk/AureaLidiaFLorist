(function(){
  'use strict';
  const core=window.FloristCore,key='aurea-product-dedication-v1';
  // Delegación: la ficha puede ser sustituida al terminar la consulta a Google Sheets.
  document.addEventListener('change',async e=>{
    if(!e.target.matches('[name="product-variant"]'))return;
    const root=e.target.closest('[data-product-detail]');
    try{
      const products=await window.FloristProducts(),p=products.find(p=>p.id===root.dataset.productDetail),v=p?.variations.find(v=>v.id===e.target.value);
      if(!p||!v||!core.canRequest(p))return;
      document.getElementById('product-price').textContent=core.priceLabel(v);
      document.getElementById('product-request').href=window.FloristCatalogView.request(p)+'&variacion='+encodeURIComponent(v.id);
    }catch{document.getElementById('product-dedication-status').textContent='No pudimos comprobar la opción. Recarga la ficha antes de continuar.';}
  });
  document.addEventListener('click',e=>{
    const link=e.target.closest('[data-product-continue]');if(!link||!link.hasAttribute('href'))return;
    const root=link.closest('[data-product-detail]'),input=document.getElementById('product-dedication');if(!root||!input)return;
    if(input.value.length>500){e.preventDefault();document.getElementById('product-dedication-status').textContent='Usa hasta 500 caracteres.';input.focus();return;}
    try{
      sessionStorage.removeItem(key);
      if(input.value.trim())sessionStorage.setItem(key,JSON.stringify({productId:root.dataset.productDetail,text:input.value.trim(),at:Date.now()}));
    }catch{
      if(!input.value.trim())return;
      e.preventDefault();const status=document.getElementById('product-dedication-status');status.textContent='Este navegador no permite conservar el mensaje. Cópialo para añadirlo en el formulario. ';
      const fallback=document.createElement('a');fallback.href=link.href;fallback.textContent='Continuar y escribir la dedicatoria después';status.append(fallback);
    }
  });
})();
