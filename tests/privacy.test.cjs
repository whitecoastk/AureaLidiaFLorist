const {test}=require('node:test'),assert=require('node:assert/strict');
const {privacyReady,renderPrivacy}=require('../scripts/privacy.cjs');
const core=require('../assets/core.js');
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fixture=()=>({whatsapp:'525618689260',url:'https://aurealidiaflorist.com',privacy:{reviewed:true,controller:'Responsable de prueba',controllerAddress:'Domicilio de prueba',rightsContact:'WhatsApp de prueba',contactEmail:''}});
test('La publicación requiere identidad, domicilio y revisión; WhatsApp no exige inventar correo',()=>{
  assert.equal(privacyReady(fixture()),true);
  for(const key of ['controller','controllerAddress','rightsContact']){const c=fixture();c.privacy[key]='  ';assert.equal(privacyReady(c),false);}
  const c=fixture();c.privacy.reviewed=false;assert.equal(privacyReady(c),false);
});
test('El aviso escapa datos del responsable y marca versiones incompletas como borrador',()=>{
  const c=fixture();c.privacy.controller='<script>alert(1)</script>';c.privacy.controllerAddress='<img src=x>';
  const html=renderPrivacy(c,esc,core.whatsappUrl);
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x>'));assert.ok(html.includes('&lt;script&gt;'));
  c.privacy.controllerAddress='';assert.match(renderPrivacy(c,esc,core.whatsappUrl),/Borrador:/);
});
