const fs=require('node:fs');
const config=require('../site.config.json');
const {validateProducts}=require('../assets/core.js');
const issues=[];
if(!config.whatsappVerified)issues.push('Confirmar que '+config.whatsapp+' es el WhatsApp oficial y marcar whatsappVerified=true.');
if(!config.privacy.reviewed||!config.privacy.controller||!config.privacy.contactEmail||!config.privacy.rightsContact||!config.privacy.controllerAddress)issues.push('Completar y revisar el aviso de privacidad del negocio.');
if(config.ga4Id&&!/^G-[A-Z0-9]+$/.test(config.ga4Id))issues.push('Identificador GA4 inválido.');
if(config.metaPixelId&&!/^\d{5,25}$/.test(config.metaPixelId))issues.push('Identificador Meta Pixel inválido.');
validateProducts(require('../data/products.json'));
const digest=file=>require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex');
if(!fs.existsSync('data/build-state.json'))issues.push('Generar el sitio antes de preparar entrega.');
else{
  const state=JSON.parse(fs.readFileSync('data/build-state.json','utf8'));
  for(const [file,hash]of Object.entries({...state.sources,...state.outputs}))if(!fs.existsSync(file)||digest(file)!==hash){issues.push('Regenerar el sitio: cambios posteriores al build en '+file);break;}
}
console.log(issues.length?'Pendientes antes de desplegar:\n- '+issues.join('\n- '):'Configuración mínima de publicación verificada. No se ha publicado ningún cambio.');
if(!config.ga4Id&&!config.metaPixelId)console.log('Analítica desactivada: no se configuraron identificadores.');
process.exitCode=issues.length?1:0;
