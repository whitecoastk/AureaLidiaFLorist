-- Base de pruebas exclusivamente. No usa números, cuentas o mensajes reales.
begin;
create temporary table inbox_test_results (label text);
grant insert, select on inbox_test_results to anon, authenticated, service_role;
create function pg_temp.check_inbox(condition boolean,label text) returns void language plpgsql as $$
begin
  if condition is distinct from true then raise exception 'FALLO: %',label; end if;
  insert into pg_temp.inbox_test_results values(label);
end;
$$;
create function pg_temp.inbox_error(statement text,expected text,label text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if SQLSTATE <> expected then raise exception 'FALLO: %, esperaba %, recibió %',label,expected,SQLSTATE; end if;
    insert into pg_temp.inbox_test_results values(label);return;
  end;
  raise exception 'FALLO: % no produjo error',label;
end;
$$;
insert into auth.users(id,email) values
 ('90000000-0000-4000-8000-000000000001','inbox-admin@example.invalid'),
 ('90000000-0000-4000-8000-000000000002','inbox-outsider@example.invalid');
insert into public.staff_profiles(user_id,role) values ('90000000-0000-4000-8000-000000000001','admin');
select pg_temp.check_inbox((select relrowsecurity from pg_class where oid='public.whatsapp_inquiries'::regclass),'Bandeja con RLS');
set local role anon;
select pg_temp.inbox_error('select * from public.whatsapp_inquiries','42501','Anónimo no lee bandeja');
select pg_temp.inbox_error('select public.whatsapp_inbox_pending(20)','42501','Anónimo no llama RPC privada');
reset role;
set local role service_role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"service_role"}',true);
select pg_temp.check_inbox(public.whatsapp_inbox_ingest('[{"business_phone_number_id":"000000000000002","provider_message_id":"wamid.fixture.1","sender_id":"525500000099","received_at":"2026-10-17T00:00:00Z","message_type":"text","body":"Mensaje sintético"}]')=1,'Servidor guarda mensaje validado');
select pg_temp.check_inbox(public.whatsapp_inbox_ingest('[{"business_phone_number_id":"000000000000002","provider_message_id":"wamid.fixture.1","sender_id":"525500000099","received_at":"2026-10-17T00:00:00Z","message_type":"text","body":"Reintento con texto cambiado"}]')=0,'Reintento no duplica mensaje');
select pg_temp.check_inbox((select body='Mensaje sintético' from public.whatsapp_inquiries),'Reintento conserva el original');
select pg_temp.check_inbox((select count(*)=1 from public.whatsapp_inbox_pending(20)),'n8n obtiene pendientes');
select pg_temp.inbox_error($q$select public.whatsapp_inbox_ingest('[{"business_phone_number_id":"000000000000002","provider_message_id":"wamid.fixture.2","sender_id":"525500000099","received_at":"2026-10-17T00:00:00Z","message_type":"text","body":"Primero"},{"business_phone_number_id":"000000000000002","provider_message_id":"wamid.fixture.3","sender_id":"invalid","received_at":"2026-10-17T00:00:00Z","message_type":"text","body":"Segundo"}]')$q$,'23514','Lote inválido se revierte completo');
select pg_temp.check_inbox((select count(*)=1 from public.whatsapp_inquiries),'Sin registro parcial de lote fallido');
select pg_temp.check_inbox(public.whatsapp_inbox_ready(array(select id from public.whatsapp_inquiries))=1,'n8n marca lista para revisión');
select pg_temp.check_inbox(public.whatsapp_inbox_ready(array(select id from public.whatsapp_inquiries))=0,'Acuse repetido es idempotente');
select pg_temp.check_inbox((select count(*)=0 from public.whatsapp_inbox_pending(20)),'Procesado sale de pendientes');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select pg_temp.check_inbox((select count(*)=0 from public.whatsapp_inquiries),'Usuario ajeno no ve consultas existentes');
select pg_temp.inbox_error('select public.whatsapp_inbox_pending(20)','42501','Cuenta autenticada no obtiene permisos de automatización');
select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"90000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select pg_temp.check_inbox((select count(*)=1 from public.whatsapp_inquiries),'Personal activo lee consultas');
select pg_temp.inbox_error($q$update public.whatsapp_inquiries set body='Texto adulterado'$q$,'42501','Personal no puede alterar mensaje original');
select pg_temp.inbox_error($q$select public.whatsapp_inbox_ingest('[]')$q$,'42501','Administrador del panel tampoco puede simular recepción');
update public.whatsapp_inquiries set review_state='reviewed';
select pg_temp.check_inbox((select review_state='reviewed' from public.whatsapp_inquiries),'Personal puede marcar revisado');
select pg_temp.inbox_error('delete from public.whatsapp_inquiries','42501','API no borra consultas');
reset role;
select pg_temp.check_inbox((select count(*)=0 from public.orders),'Recepción no crea pedidos');
select pg_temp.check_inbox((select count(*)=0 from public.customers),'Recepción no crea clientes duplicados');
select pg_temp.check_inbox((select count(*)=0 from public.payments),'Recepción no registra pagos');
select count(*) as passed_assertions from pg_temp.inbox_test_results;
rollback;
