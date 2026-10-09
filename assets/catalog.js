(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded',()=>{
    const form=document.getElementById('catalog-filters'),panel=document.getElementById('filters-panel');
    if(!form)return;
    if(matchMedia('(max-width:760px)').matches)panel.open=false;
    const cards=[...document.querySelectorAll('[data-product-id]')], more=document.getElementById('load-more'),count=document.getElementById('results-count');
    let products=null,pageSize=12,visibleLimit=pageSize;
    const render=()=>{
      if(!products)return;
      const filters=Object.fromEntries(new FormData(form));
      const matching=window.FloristCore.filterProducts(products,filters),ids=matching.map(p=>p.id);
      let shown=0;
      const grid=document.getElementById('products-grid');
      // El orden visual y de teclado debe coincidir: mover nodos, no usar solo CSS order.
      for(const id of ids){const card=cards.find(card=>card.dataset.productId===id);if(card)grid.append(card);}
      for(const card of cards){const index=ids.indexOf(card.dataset.productId);card.hidden=index<0||index>=visibleLimit;if(!card.hidden)shown++;}
      count.textContent=matching.length+' arreglo'+(matching.length===1?'':'s')+' · '+shown+' visible'+(shown===1?'':'s');
      document.getElementById('no-results').hidden=matching.length!==0;
      more.hidden=visibleLimit>=matching.length;
      if(ids.length)window.FloristAnalytics.track('view_item_list',{item_list_name:'catalogo',content_ids:ids.slice(0,visibleLimit)},JSON.stringify([filters,visibleLimit]));
    };
    window.FloristProducts().then(data=>{products=data;const occasion=new URLSearchParams(location.search).get('ocasion');if(occasion && window.FloristCore.occasions[occasion])form.elements.occasion.value=occasion;render();}).catch(()=>{count.textContent=cards.length+' arreglos · filtros temporalmente no disponibles';});
    form.addEventListener('submit',e=>e.preventDefault());
    form.addEventListener('input',()=>{visibleLimit=pageSize;render();});
    form.addEventListener('reset',()=>setTimeout(()=>{visibleLimit=pageSize;render();},0));
    more.addEventListener('click',()=>{visibleLimit+=pageSize;render();});
    document.addEventListener('florist:analytics-ready',render);
  });
})();
