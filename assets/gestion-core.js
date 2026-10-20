(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloristAdmin=api;})(typeof window==='undefined'?globalThis:window,()=>{
  'use strict';
  const statuses={request:'Solicitud',quoted:'Cotizado',confirmed:'Confirmado',in_progress:'En elaboración',ready:'Listo',delivered:'Entregado',cancelled:'Cancelado'};
  function cents(value,optional=false){
    const text=String(value??'').trim();if(!text&&optional)return null;
    if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(text))throw Error('Escribe un importe en MXN con hasta dos decimales, sin comas.');
    const [whole,fraction='']=text.split('.');const result=Number(whole)*100+Number(fraction.padEnd(2,'0'));
    if(result>100000000000)throw Error('El importe excede el límite permitido.');return result;
  }
  const money=n=>n===null||n===undefined?'Por cotizar':new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(n)/100);
  function connection(url,key){
    const u=new URL(url.trim());const local=['127.0.0.1','localhost'].includes(u.hostname)&&u.protocol==='http:';
    if(!(local||(u.protocol==='https:'&&/^[a-z0-9]+\.supabase\.co$/.test(u.hostname)))||u.username||u.password||u.search||u.hash||(u.pathname!=='/'&&u.pathname!==''))throw Error('Usa la URL HTTPS de tu proyecto Supabase o una instancia local.');
    if(!/^sb_publishable_[a-zA-Z0-9_-]+$/.test(key.trim()))throw Error('Introduce únicamente una publishable key, nunca una clave secreta.');
    return {url:u.origin,key:key.trim()};
  }
  function items(rows){
    if(!rows.length||rows.length>50)throw Error('Incluye entre 1 y 50 partidas.');
    return rows.map(row=>{
      const name=row.name.trim(),quantity=Number(row.quantity);if(!name||name.length>200)throw Error('Cada partida necesita un nombre de hasta 200 caracteres.');
      if(!Number.isInteger(quantity)||quantity<1||quantity>10000)throw Error('La cantidad debe ser un entero entre 1 y 10,000.');
      return {name,quantity,unit_price_cents:cents(row.price,true)};
    });
  }
  function errorMessage(error){
    if(error?.code==='42501')return 'No tienes permiso para esta operación. Comprueba tu perfil de personal activo.';
    if(error?.code==='23505')return 'Ya existe un registro con ese teléfono o clave de operación. Revisa el listado antes de repetir.';
    if(error?.code==='23503')return 'La referencia relacionada no existe o no se puede modificar.';
    if(error?.code==='23514')return 'Revisa los importes y el estado: cotiza partidas y envío antes de confirmar; no edites movimientos finalizados ni devuelvas más de lo cobrado.';
    if(error?.code==='PGRST116')return 'El registro no está disponible o tu acceso fue revocado.';
    if(error?.code==='invalid_credentials')return 'Correo o contraseña incorrectos.';
    return 'No se pudo completar la operación. Comprueba la conexión y revisa los registros antes de reintentar.';
  }
  return {statuses,cents,money,connection,items,errorMessage};
});
