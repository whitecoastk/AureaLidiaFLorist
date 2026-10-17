(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));
  else root.FloristSheet=factory(root.FloristCore);
})(typeof globalThis!=='undefined'?globalThis:this,function(core){
  'use strict';
  const key=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const aliases={nombre:'name',producto:'name','precio mxn':'price',precio:'price',imagen:'image',fotografias:'images',descripcion:'description',categoria:'category',disponible:'availability',disponibilidad:'availability',estado:'status',modalidad:'pricetype',ocasiones:'occasions',flores:'flowers',colores:'colors',url:'slug',destacado:'featured'};
  const slug=s=>key(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  function parse(text){
    if(typeof text!=='string'||text.length>3000000)throw Error('Respuesta de catálogo inválida.');
    const match=text.match(/^\s*(?:\/\*O_o\*\/\s*)?google\.visualization\.Query\.setResponse\(([\s\S]*)\);?\s*$/);
    if(!match)throw Error('Respuesta de Google Sheets inesperada.');
    const data=JSON.parse(match[1]);if(data.status!=='ok')throw Error('Google Sheets no devolvió datos válidos.');
    return data.table;
  }
  function convert(table,previous=[]){
    if(!Array.isArray(table?.cols)||!Array.isArray(table?.rows)||!table.rows.length||table.rows.length>10000)throw Error('Hoja vacía o respuesta inválida.');
    const headers=table.cols.map(c=>aliases[key(c.label)]||key(c.label));
    if(new Set(headers.filter(Boolean)).size!==headers.filter(Boolean).length)throw Error('Columnas duplicadas.');
    for(const name of ['id','name','price'])if(!headers.includes(name))throw Error('Falta columna '+name);
    if(!headers.includes('image')&&!headers.includes('images'))throw Error('Falta columna image o images.');
    const list=v=>String(v??'').split('|').map(s=>s.trim()).filter(Boolean),seen=new Set(),result=[];
    const lookup=(map,value,label)=>{const v=map[key(value)];if(!v)throw Error('Valor inválido en '+label+': '+value);return v;};
    for(const row of table.rows){
      const value=name=>row.c?.[headers.indexOf(name)]?.v;
      if(!row.c?.some(c=>c?.v!==null&&c?.v!==undefined&&c.v!==''))continue;
      const id=String(value('id')??'').trim();if(!id)throw Error('Falta ID de un producto.');
      if(seen.has(id))throw Error('ID duplicado: '+id);seen.add(id);
      const old=previous.find(p=>p.id===id);
      const optional=(name,fallback)=>headers.includes(name)?value(name):fallback;
      const name=String(value('name')??'').trim();
      const priceType=lookup({reference:'reference',referencia:'reference',fixed:'fixed',fijo:'fixed',from:'from',desde:'from',quote:'quote',cotizar:'quote'},optional('pricetype',old?.priceType||'reference')||'reference','modalidad');
      const rawPrice=value('price');
      if(priceType!=='quote'&&(rawPrice===null||rawPrice===undefined||rawPrice===''||typeof rawPrice==='boolean'||!Number.isFinite(Number(rawPrice))))throw Error('Precio inválido: '+id);
      const imagePaths=list(headers.includes('images')?value('images'):value('image')).map(image=>/^https:\/\//i.test(image)||image.startsWith('resources/')?image:'resources/'+image);
      const availabilityInput=optional('availability',old?.availability||'confirm');
      const availability=lookup({si:'available',true:'available',available:'available',disponible:'available',no:'unavailable',false:'unavailable',unavailable:'unavailable','no disponible':'unavailable',disponibilidad:'confirm',confirm:'confirm','por confirmar':'confirm'},availabilityInput===null||availabilityInput===undefined||availabilityInput===''?'confirm':availabilityInput,'disponibilidad');
      const status=lookup({published:'published',publicado:'published',draft:'draft',borrador:'draft',retired:'retired',retirado:'retired'},optional('status',old?.status||'published')||'draft','estado');
      const badge=key(value('badge')),known=badge==='aniversario'?['aniversario']:badge.includes('san valentin')?['amor']:badge.includes('madres')?['madres']:[];
      const requestedSlug=String(value('slug')??'').trim();if(old&&requestedSlug&&requestedSlug!==old.slug)throw Error('No cambies la URL existente: '+id);
      result.push({...old,id,name,slug:old?.slug||requestedSlug||slug(name)+'-'+slug(id),status,availability,price:priceType==='quote'?null:Number(rawPrice),priceType,images:imagePaths,description:String(value('description')??'').trim(),category:String(value('category')??''),occasions:list(optional('occasions',(old?.occasions||known).join('|'))),flowers:list(optional('flowers',(old?.flowers||[]).join('|'))),colors:list(optional('colors',(old?.colors||[]).join('|'))),variations:headers.includes('variations')&&value('variations')?JSON.parse(value('variations')):old?.variations||[],featured:headers.includes('featured')?['si','true'].includes(key(value('featured'))):old?.featured||false,source:'Google Sheets del sitio original'});
    }
    if(!result.length)throw Error('Catálogo vacío.');
    for(const old of previous)if(!seen.has(old.id))result.push({...old,status:'retired'});
    return core.validateProducts(result);
  }
  function url(config){
    if(!/^[a-zA-Z0-9_-]{10,150}$/.test(config?.id||''))throw Error('Identificador de hoja inválido.');
    const u=new URL('https://docs.google.com/spreadsheets/d/'+config.id+'/gviz/tq');
    u.searchParams.set('gid',String(config.gid??0));u.searchParams.set('headers','1');u.searchParams.set('tqx','out:json');return u.href;
  }
  async function load(config,previous,fetcher=fetch){
    const response=await fetcher(url(config),{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error('Google Sheets respondió '+response.status);
    return convert(parse(await response.text()),previous);
  }
  return {parse,convert,url,load};
});
