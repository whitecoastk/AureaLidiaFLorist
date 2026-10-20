-- Integración sobre una base DE PRUEBAS con las dos migraciones aplicadas.
-- Ejecutar como postgres con psql -v ON_ERROR_STOP=1 -f ...
-- No requiere pgTAP. Fixtures sintéticas; todo se revierte al terminar.
begin;
create temporary table test_results (label text not null);
grant select, insert on table test_results to anon, authenticated;
create function pg_temp.assert_true(condition boolean, label text) returns void
language plpgsql as $$
begin
  if condition is distinct from true then raise exception 'FALLO: %', label; end if;
  insert into pg_temp.test_results values (label);
end;
$$;
create function pg_temp.expect_error(statement text, expected_state text, label text) returns void
language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if SQLSTATE <> expected_state then
      raise exception 'FALLO: %, SQLSTATE esperado %, recibido %: %', label, expected_state, SQLSTATE, SQLERRM;
    end if;
    insert into pg_temp.test_results values (label);
    return;
  end;
  raise exception 'FALLO: % no produjo error', label;
end;
$$;

-- Estas cuentas no son clientes ni usuarios reales y no tienen contraseña.
insert into auth.users(id, email) values
 ('10000000-0000-4000-8000-000000000001', 'admin-fixture@example.invalid'),
 ('10000000-0000-4000-8000-000000000002', 'operator-fixture@example.invalid'),
 ('10000000-0000-4000-8000-000000000003', 'outsider-fixture@example.invalid'),
 ('10000000-0000-4000-8000-000000000004', 'inactive-fixture@example.invalid');
insert into public.staff_profiles(user_id, role, active) values
 ('10000000-0000-4000-8000-000000000001', 'admin', true),
 ('10000000-0000-4000-8000-000000000002', 'operator', true),
 ('10000000-0000-4000-8000-000000000004', 'admin', false);

select pg_temp.assert_true((select count(*) = 6 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('staff_profiles','customers','orders','order_items','payments','audit_events') and c.relrowsecurity), 'RLS habilitada en las seis tablas');
select pg_temp.assert_true((select proconfig @> array['search_path=""'] from pg_proc where oid = 'app_private.is_staff()'::regprocedure), 'Helper privilegiado con search_path fijo');

set local role anon;
select pg_temp.expect_error('select * from public.customers', '42501', 'Anónimo no puede leer clientes');
select pg_temp.expect_error('select * from public.orders', '42501', 'Anónimo no puede leer pedidos');
select pg_temp.expect_error('select * from public.payments', '42501', 'Anónimo no puede leer cobros');
select pg_temp.expect_error('select * from public.order_balances', '42501', 'Anónimo no puede leer saldos');
select pg_temp.expect_error($q$insert into public.customers(name) values ('No permitido')$q$, '42501', 'Anónimo no puede crear clientes');
select pg_temp.expect_error($q$select public.create_manual_order(gen_random_uuid(), null, '[{"name":"No permitido"}]')$q$, '42501', 'Anónimo no puede ejecutar RPC');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","user_metadata":{"role":"admin"}}', true);
select pg_temp.assert_true(not app_private.is_staff(), 'Un usuario externo no es empleado aunque edite sus metadatos');
select pg_temp.assert_true((select count(*) = 0 from public.customers), 'Usuario externo no ve clientes');
select pg_temp.expect_error($q$insert into public.customers(name) values ('No permitido')$q$, '42501', 'Usuario externo no crea clientes');
select pg_temp.expect_error($q$insert into public.staff_profiles(user_id, role) values (auth.uid(), 'admin')$q$, '42501', 'No hay autoalta de administradores');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select pg_temp.assert_true(app_private.is_staff() and not app_private.is_admin(), 'Operador activo reconocido sin permisos de administrador');
select pg_temp.expect_error($q$update public.staff_profiles set role = 'admin' where user_id = auth.uid()$q$, '42501', 'Operador no puede escalar su rol');
insert into public.customers(id, name, phone_e164, created_by) values
 ('20000000-0000-4000-8000-000000000001', 'Comprador de prueba', '+525500000001', '10000000-0000-4000-8000-000000000001');
select pg_temp.assert_true((select created_by = auth.uid() from public.customers where id = '20000000-0000-4000-8000-000000000001'), 'Autor no puede falsificarse desde el navegador');
select pg_temp.expect_error($q$insert into public.customers(name,phone_e164) values ('Duplicado','+525500000001')$q$, '23505', 'Teléfono normalizado evita cliente duplicado');
select pg_temp.expect_error($q$insert into public.customers(name,phone_e164) values ('Formato inválido','55123')$q$, '23514', 'Teléfono inválido rechazado');
select pg_temp.expect_error($q$insert into public.orders(customer_id) values ('20000000-0000-4000-8000-999999999999')$q$, '23503', 'Pedido exige cliente existente cuando se especifica');

select public.create_manual_order('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
 '[{"name":"Arreglo de prueba","catalog_product_id":"fixture-only","quantity":2,"unit_price_cents":25000}]', 'jardin_eterno', 'whatsapp', 5000);
select pg_temp.assert_true((select count(*) = 1 from public.orders where creation_key = '30000000-0000-4000-8000-000000000001'), 'RPC crea un pedido');
select pg_temp.assert_true((select count(*) = 1 from public.order_items), 'RPC crea la partida relacionada');
select public.create_manual_order('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
 '[{"name":"Arreglo de prueba","quantity":2,"unit_price_cents":25000}]');
select pg_temp.assert_true((select count(*) = 1 from public.order_items), 'Reintento de creación no duplica partidas');
select pg_temp.assert_true((select total_cents = 55000 and balance_cents = 55000 from public.order_balances), 'Subtotal, envío y saldo calculados en la base');
select pg_temp.expect_error($q$select public.create_manual_order('30000000-0000-4000-8000-000000000002',null,
 '[{"name":"Primera válida"},{"name":"Segunda inválida","quantity":0}]')$q$, '23514', 'Una partida inválida revierte toda la creación');
select pg_temp.assert_true(not exists (select 1 from public.orders where creation_key = '30000000-0000-4000-8000-000000000002'), 'Sin cabecera huérfana tras error transaccional');
select pg_temp.expect_error($q$select public.create_manual_order(gen_random_uuid(),null,'[]')$q$, '22023', 'RPC rechaza pedido vacío');
select pg_temp.expect_error($q$insert into public.order_items(order_id,name_snapshot) values ('99999999-0000-4000-8000-000000000000','Huérfana')$q$, '42501', 'Política impide crear partidas sin pedido accesible');
select pg_temp.expect_error($q$insert into public.payments(order_id,amount_cents,method,idempotency_key)
 values ('99999999-0000-4000-8000-000000000000',100,'cash',gen_random_uuid())$q$, '23503', 'Cobro exige un pedido existente');

insert into public.orders(id) values ('30000000-0000-4000-8000-000000000003');
insert into public.order_items(order_id,name_snapshot) values ('30000000-0000-4000-8000-000000000003','Personalizado por cotizar');
select pg_temp.assert_true((select total_cents is null and balance_cents is null from public.order_balances where order_id = '30000000-0000-4000-8000-000000000003'), 'Importes sin cotizar no se convierten en cero');
select pg_temp.expect_error($q$update public.orders set status = 'confirmed' where id = '30000000-0000-4000-8000-000000000003'$q$, '23514', 'No confirma sin precio ni envío cotizados');
select pg_temp.expect_error($q$update public.orders set status = 'paid' where id = '30000000-0000-4000-8000-000000000003'$q$, '23514', 'Pedido y estado de pago son independientes');
update public.orders set status = 'confirmed' where creation_key = '30000000-0000-4000-8000-000000000001';
with changed as (update public.order_items set unit_price_cents = 1
 where order_id = (select id from public.orders where creation_key = '30000000-0000-4000-8000-000000000001') returning *)
 select pg_temp.assert_true((select count(*) = 0 from changed), 'Partidas confirmadas no se editan');

insert into public.payments(id,order_id,amount_cents,method,idempotency_key)
 select '40000000-0000-4000-8000-000000000001',id,20000,'transfer','50000000-0000-4000-8000-000000000001'
 from public.orders where creation_key = '30000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select received_cents = 0 from public.order_balances where total_cents = 55000), 'Cobro pendiente no disminuye saldo');
select pg_temp.assert_true((select count(*) = 0 from public.audit_events), 'Operador no ve historial reservado a administración');
select pg_temp.expect_error($q$insert into public.payments(order_id,amount_cents,method,status,idempotency_key,verified_by,verified_at)
 select id,100,'cash','verified',gen_random_uuid(),auth.uid(),now() from public.orders limit 1$q$, '42501', 'Operador no puede verificar cobros al insertar');
with changed as (update public.payments set status = 'verified', verified_by = auth.uid(), verified_at = now()
 where id = '40000000-0000-4000-8000-000000000001' returning *)
 select pg_temp.assert_true((select count(*) = 0 from changed), 'Operador no puede verificar cobros al actualizar');
select pg_temp.expect_error('delete from public.payments', '42501', 'No se borran movimientos financieros');
select pg_temp.expect_error('delete from public.orders', '42501', 'No se borran pedidos');
select pg_temp.expect_error('delete from public.customers', '42501', 'No se borran clientes desde la API');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
update public.payments set status = 'verified' where id = '40000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select verified_by = auth.uid() and verified_at is not null from public.payments where id = '40000000-0000-4000-8000-000000000001'), 'Administrador verifica con autor y fecha asignados por servidor');
select pg_temp.assert_true((select received_cents = 20000 and balance_cents = 35000 from public.order_balances where total_cents = 55000), 'Anticipo verificado deja saldo parcial');
select pg_temp.expect_error($q$update public.payments set amount_cents = 1 where id = '40000000-0000-4000-8000-000000000001'$q$, '23514', 'Cobro verificado es inmutable');
select pg_temp.expect_error($q$insert into public.payments(order_id,amount_cents,method,idempotency_key)
 select id,100,'cash','50000000-0000-4000-8000-000000000001' from public.orders limit 1$q$, '23505', 'Clave idempotente evita cobro duplicado');
select pg_temp.expect_error($q$insert into public.payments(order_id,kind,amount_cents,method,status,idempotency_key)
 select id,'refund',20001,'transfer','verified',gen_random_uuid() from public.orders where creation_key = '30000000-0000-4000-8000-000000000001'$q$, '23514', 'No devuelve más de lo cobrado');
insert into public.payments(order_id,kind,amount_cents,method,status,idempotency_key)
 select id,'refund',5000,'transfer','verified',gen_random_uuid() from public.orders where creation_key = '30000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select received_cents = 15000 and balance_cents = 40000 from public.order_balances where total_cents = 55000), 'Devolución verificada ajusta saldo sin borrar anticipo');
select pg_temp.assert_true((select count(*) > 0 from public.audit_events), 'Administrador puede consultar auditoría');
select pg_temp.expect_error($q$insert into public.audit_events(table_name,entity_id,action) values ('orders',gen_random_uuid(),'DELETE')$q$, '42501', 'Ni administrador de aplicación puede falsificar auditoría');

-- Datos existentes: usuarios ajenos o desactivados no los ven tampoco en la vista.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select pg_temp.assert_true((select count(*) = 0 from public.orders), 'Usuario ajeno no ve pedidos existentes');
select pg_temp.assert_true((select count(*) = 0 from public.payments), 'Usuario ajeno no ve cobros existentes');
select pg_temp.assert_true((select count(*) = 0 from public.order_balances), 'Vista de saldos respeta RLS del usuario');
select pg_temp.expect_error($q$select public.create_manual_order(gen_random_uuid(),null,'[{"name":"No permitido"}]')$q$, '42501', 'Usuario ajeno no puede crear pedido por RPC');
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select pg_temp.assert_true(not app_private.is_admin() and not app_private.is_staff(), 'Administrador desactivado pierde permisos');
select pg_temp.assert_true((select count(*) = 0 from public.customers), 'Personal desactivado no ve clientes existentes');
select pg_temp.expect_error($q$insert into public.customers(name) values ('No permitido')$q$, '42501', 'Personal desactivado no escribe');

reset role;
select count(*) as passed_assertions from pg_temp.test_results;
rollback;
