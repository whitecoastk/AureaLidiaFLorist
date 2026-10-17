(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded',()=>{
    const form=document.getElementById('catalog-filters'),panel=document.getElementById('filters-panel');
    if(!form)return;
    if(matchMedia('(max-width:760px)').matches)panel.open=false;
    let cards=[...document.querySelectorAll('[data-product-id]')];
    const more=document.getElementById('load-more'),count=document.getElementById('results-count');
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
    window.FloristProducts().then(data=>{
      products=window.FloristCore.shuffleProducts(data.filter(p=>p.status==='published'));cards=[...document.querySelectorAll('[data-product-id]')];
      const occasion=new URLSearchParams(location.search).get('ocasion');if(occasion&&window.FloristCore.occasions[occasion])form.elements.occasion.value=occasion;
      // Solo se recuerda el primer ID en esta pestaña; no se guardan productos ni datos del cliente.
      try{
        const key='aurea-catalog-first-'+form.elements.occasion.value,initial={occasion:form.elements.occasion.value,sort:'random'};
        let matches=window.FloristCore.filterProducts(products,initial);
        if(matches.length>1&&matches[0].id===sessionStorage.getItem(key)){
          products.push(...products.splice(products.indexOf(matches[0]),1));matches=window.FloristCore.filterProducts(products,initial);
        }
        if(matches.length)sessionStorage.setItem(key,matches[0].id);
      }catch{} // Si se bloquea almacenamiento, el orden sigue siendo aleatorio.
      for(const [field,key,label]of [['category','category','Tipo de arreglo'],['flower','flowers','Tipo de flor'],['color','colors','Color']]){
        const values=[...new Set(data.filter(p=>p.status==='published').flatMap(p=>Array.isArray(p[key])?p[key]:[p[key]]))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));
        let select=form.elements[field];
        if(!select&&values.length){const wrap=document.createElement('div'),l=document.createElement('label');wrap.className='field';l.htmlFor=field;l.textContent=label;select=document.createElement('select');select.id=select.name=field;wrap.append(l,select);form.insertBefore(wrap,form.elements.sort.closest('.field'));}
        if(select){select.replaceChildren();for(const [v,t]of [['','Todas las opciones'],...values.map(v=>[v,v])]){const o=document.createElement('option');o.value=v;o.textContent=t;select.append(o);}}
      }
      render();
    }).catch(()=>{count.textContent=cards.length+' arreglos · filtros temporalmente no disponibles';});
    form.addEventListener('submit',e=>e.preventDefault());
    form.addEventListener('input',()=>{visibleLimit=pageSize;render();});
    form.addEventListener('reset',()=>setTimeout(()=>{visibleLimit=pageSize;render();},0));
    more.addEventListener('click',()=>{visibleLimit+=pageSize;render();});
    document.addEventListener('florist:analytics-ready',render);
  });
})();
