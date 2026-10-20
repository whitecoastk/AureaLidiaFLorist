const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Workflow de bandeja es manual, no envía mensajes ni contiene claves y maneja lotes vacíos',()=>{
  const workflow=JSON.parse(fs.readFileSync('automations/n8n/workflows/02-whatsapp-bandeja-manual.json','utf8'));
  assert.equal(workflow.active,false);assert.ok(!workflow.nodes.some(n=>n.type.includes('scheduleTrigger')||n.type.includes('whatsApp')));
  for(const node of workflow.nodes)assert.ok(!node.credentials,'Asignar credenciales desde n8n, no exportarlas');
  const nodes=workflow.nodes.filter(n=>n.type==='n8n-nodes-base.httpRequest');assert.equal(nodes.length,2);assert.ok(nodes.every(n=>n.parameters.genericAuthType==='httpHeaderAuth'));
  const code=workflow.nodes.find(n=>n.id==='prepare').parameters.jsCode;
  const run=items=>vm.runInNewContext('(function(){'+code+'})()',{$input:{first:()=>({json:{items}})}});
  assert.equal(run([]).length,0);const result=run([{id:'fixture-1'},{id:'fixture-2'}]);assert.equal(result[0].json.ids.join(','),'fixture-1,fixture-2');assert.equal(result[0].json.count,2);
});
test('Copia para Function Editor conserva exactamente el handler y entrada probados',()=>{
  const handler=fs.readFileSync('supabase/functions/whatsapp-webhook/handler.mjs','utf8').replace(/^export /gm,'');
  const entry=fs.readFileSync('supabase/functions/whatsapp-webhook/index.ts','utf8').replace(/^import .*\r?\n/m,'');
  const generated=fs.readFileSync('docs/generated/whatsapp-webhook-dashboard.ts','utf8');
  assert.ok(generated.endsWith(handler+'\n'+entry),'Regenerar con node scripts/package-whatsapp-webhook.cjs');
});
