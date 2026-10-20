import { createHandler } from './handler.mjs';

// Solo variables del servidor. No hay valores reales en los fuentes.
const injected = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
Deno.serve(createHandler({
  appSecret: Deno.env.get('META_APP_SECRET') || '',
  verifyToken: Deno.env.get('META_VERIFY_TOKEN') || '',
  wabaId: Deno.env.get('META_WABA_ID') || '',
  phoneId: Deno.env.get('META_PHONE_NUMBER_ID') || '',
  n8nToken: Deno.env.get('N8N_INBOX_TOKEN') || '',
  dbUrl: Deno.env.get('SUPABASE_URL') || '',
  dbSecret: Deno.env.get('WHATSAPP_DB_SECRET') || injected.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
}));
