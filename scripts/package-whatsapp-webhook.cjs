// Copia de un solo archivo para SQL/Function Editor. Sin secretos ni despliegues.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const handler=fs.readFileSync(path.join(root,'supabase/functions/whatsapp-webhook/handler.mjs'),'utf8').replace(/^export /gm,'');
const entry=fs.readFileSync(path.join(root,'supabase/functions/whatsapp-webhook/index.ts'),'utf8').replace(/^import .*\r?\n/m,'');
const target=path.join(root,'docs/generated/whatsapp-webhook-dashboard.ts');fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,'// GENERADO por scripts/package-whatsapp-webhook.cjs. Editar las fuentes en supabase/functions/whatsapp-webhook/.\n'+handler+'\n'+entry);
console.log('Archivo único para el editor de Supabase preparado. No se ha desplegado.');
