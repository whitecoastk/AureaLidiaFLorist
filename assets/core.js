(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FloristCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const occasions = {cumpleanos:'Cumpleaños', aniversario:'Aniversario', amor:'Amor', agradecimiento:'Agradecimiento', condolencias:'Condolencias', madres:'Día de las Madres', boda:'Boda', graduacion:'Graduación', otro:'Otra ocasión'};
  const money = n => new Intl.NumberFormat('es-MX', {style:'currency', currency:'MXN', minimumFractionDigits:Number.isInteger(Number(n))?0:2, maximumFractionDigits:2}).format(n);
  function safeImage(value) {
    if (typeof value !== 'string') return '';
    if (/^resources\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp|avif)$/i.test(value) && !value.includes('..')) return value;
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
  }
  function validateProducts(products) {
    if (!Array.isArray(products)) throw Error('El catálogo debe ser una lista.');
    const ids = new Set(), slugs = new Set();
    for (const p of products) {
      if (!p || typeof p.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(p.id) || ids.has(p.id)) throw Error('ID inválido o duplicado.');
      if (typeof p.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) || slugs.has(p.slug)) throw Error('URL de producto inválida o duplicada.');
      ids.add(p.id); slugs.add(p.slug);
      if (!['published','draft','retired'].includes(p.status)) throw Error('Estado inválido: '+p.id);
      if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 150 || typeof p.description !== 'string') throw Error('Nombre o descripción inválidos: '+p.id);
      if (!['reference','fixed','from','quote'].includes(p.priceType)) throw Error('Modalidad de precio inválida: '+p.id);
      if (p.priceType !== 'quote' && (!Number.isFinite(p.price) || p.price <= 0 || p.price > 1000000)) throw Error('Precio inválido: '+p.id);
      if (!Array.isArray(p.images) || (p.status === 'published' && !p.images.length) || p.images.some(i => !safeImage(i))) throw Error('Fotografía inválida: '+p.id);
      for (const key of ['occasions','flowers','colors']) if (!Array.isArray(p[key]) || p[key].some(v => typeof v !== 'string' || v.length > 100)) throw Error('Etiquetas inválidas: '+p.id);
      if (p.occasions.some(o => !occasions[o])) throw Error('Ocasión desconocida: '+p.id);
      if (typeof p.category !== 'string') throw Error('Categoría inválida: '+p.id);
      if (!Array.isArray(p.variations)) throw Error('Variaciones inválidas: '+p.id);
      const vids = new Set();
      for (const v of p.variations) {
        if (!v || typeof v.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(v.id) || vids.has(v.id) || typeof v.label !== 'string' || !v.label.trim() || !['reference','fixed','from','quote'].includes(v.priceType) || (v.priceType !== 'quote' && (!Number.isFinite(v.price) || v.price <= 0))) throw Error('Variación inválida: '+p.id);
        vids.add(v.id);
      }
    }
    return products;
  }
  function priceLabel(p) {
    if (p.priceType === 'quote') return 'Solicita cotización';
    return (p.priceType === 'from' ? 'Desde ' : '') + money(p.price) + ' MXN';
  }
  function filterProducts(products, f = {}) {
    let result = products.filter(p => p.status === 'published' && (!f.category || p.category === f.category) && (!f.occasion || p.occasions.includes(f.occasion)) && (!f.flower || p.flowers.includes(f.flower)) && (!f.color || p.colors.includes(f.color)) && (!f.budget || (p.priceType !== 'quote' && p.price <= Number(f.budget))) && (!f.query || (p.name+' '+p.description).toLocaleLowerCase('es').includes(f.query.toLocaleLowerCase('es'))));
    if (f.sort === 'price-low') result.sort((a,b)=>(a.priceType==='quote'?Infinity:a.price)-(b.priceType==='quote'?Infinity:b.price));
    else if (f.sort === 'price-high') result.sort((a,b)=>(b.priceType==='quote'?-Infinity:b.price)-(a.priceType==='quote'?-Infinity:a.price));
    else result.sort((a,b)=>a.name.localeCompare(b.name,'es'));
    return result;
  }
  function localDate(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {timeZone:'America/Mexico_City', year:'numeric', month:'2-digit', day:'2-digit'}).format(date);
  }
  function validateOrder(o, today = localDate(), minimumBudget = 250) {
    const errors = {};
    if (!Number.isFinite(Number(o.budget)) || Number(o.budget)<minimumBudget || Number(o.budget)>1000000) errors.budget = 'Indica un presupuesto entre '+money(minimumBudget)+' y $1,000,000 MXN.';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(o.date || '') ? new Date(o.date+'T12:00:00Z') : null;
    if (!date || Number.isNaN(date.getTime()) || date.toISOString().slice(0,10)!==o.date || o.date<today) errors.date = 'Elige una fecha válida a partir de hoy. La disponibilidad se confirmará.';
    if (!['09-13','13-17','17-20','flexible'].includes(o.time)) errors.time = 'Selecciona un horario preferido.';
    if (!['cdmx','edomex'].includes(o.region)) errors.region = 'Selecciona CDMX o Estado de México.';
    if (!(o.neighborhood || '').trim() || o.neighborhood.length>100) errors.neighborhood = 'Indica la colonia (máximo 100 caracteres).';
    const boroughs = ['Álvaro Obregón','Azcapotzalco','Benito Juárez','Coyoacán','Cuajimalpa de Morelos','Cuauhtémoc','Gustavo A. Madero','Iztacalco','Iztapalapa','La Magdalena Contreras','Miguel Hidalgo','Milpa Alta','Tláhuac','Tlalpan','Venustiano Carranza','Xochimilco'];
    if (!(o.borough || '').trim() || o.borough.length>100 || (o.region==='cdmx' && !boroughs.includes(o.borough))) errors.borough = 'Indica una alcaldía válida o el municipio de entrega.';
    if (!/^\d{5}$/.test(o.postalCode || '')) errors.postalCode = 'Escribe un código postal de cinco dígitos.';
    if ((o.dedication || '').length>500) errors.dedication='La dedicatoria admite hasta 500 caracteres.';
    if ((o.customization || '').length>1000) errors.customization='Usa hasta 1,000 caracteres.';
    if ((o.notes || '').length>1000) errors.notes='Usa hasta 1,000 caracteres.';
    if (!o.accepted) errors.accepted='Confirma que la solicitud está sujeta a disponibilidad, precio y entrega.';
    return errors;
  }
  const timeLabels = {'09-13':'9:00–13:00','13-17':'13:00–17:00','17-20':'17:00–20:00',flexible:'Horario flexible'};
  function orderMessage(o, p, attribution = {}) {
    return ['Hola, quisiera solicitar un arreglo de Áurea Lidia.', '', 'SOLICITUD '+o.requestId,
      'Arreglo: '+(p ? p.name+' (ref. '+p.id+')' : 'Ramo personalizado'),
      ...(o.variation ? ['Variación: '+o.variation.label] : []),
      ...(p ? ['Precio de referencia: '+priceLabel(o.variation || p)] : []),
      'Presupuesto: '+money(Number(o.budget))+' MXN', 'Fecha solicitada: '+o.date,
      'Horario preferido: '+timeLabels[o.time],
      'Zona: '+[o.neighborhood,o.borough,o.postalCode,o.region==='edomex'?'Estado de México':'CDMX'].join(', '),
      'Dedicatoria: '+(o.dedication || 'Sin dedicatoria'),
      'Personalizaciones: '+(o.customization || 'Sin preferencias adicionales'),
      'Observaciones: '+(o.notes || 'Sin observaciones'),
      ...(o.hasReference ? ['Fotografía de referencia: seleccionada en la web. La adjuntaré aquí; no se ha enviado automáticamente.'] : []),
      'Marca de procedencia: '+(attribution.brand || 'Áurea Lidia'),
      ...(attribution.utm_source ? ['Origen: '+attribution.utm_source] : []),
      ...(attribution.utm_medium ? ['Medio: '+attribution.utm_medium] : []),
      ...(attribution.utm_campaign ? ['Campaña: '+attribution.utm_campaign] : []),
      '', 'Solicito confirmación de flores disponibles, precio final y costo y disponibilidad de entrega. Esta solicitud no confirma compra ni pago.'
    ].join('\n');
  }
  function whatsappUrl(number, text) {
    if (!/^[1-9]\d{7,14}$/.test(number || '')) throw Error('Número de WhatsApp inválido.');
    return 'https://wa.me/'+number+'?text='+encodeURIComponent(text);
  }
  function attributionFrom(search) {
    const params = new URLSearchParams(search), result = {brand:'Áurea Lidia'};
    for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {
      const v = params.get(key); if (v && /^[\p{L}\p{N}_ .+-]{1,100}$/u.test(v)) result[key]=v;
    }
    if (params.get('marca') === 'jardin-eterno-cdmx') result.brand='Jardín Eterno CDMX';
    return result;
  }
  return {occasions, money, safeImage, validateProducts, priceLabel, filterProducts, localDate, validateOrder, orderMessage, whatsappUrl, attributionFrom, timeLabels};
});
