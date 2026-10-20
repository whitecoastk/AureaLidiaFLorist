-- Fase 1: administración privada. Sin catálogo, pagos en línea ni acceso público.
begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'operator')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER evita la recursión de la política de staff_profiles.
-- Solo consulta; no acepta un user_id arbitrario ni metadatos editables del JWT.
create function app_private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_profiles s
    where s.user_id = auth.uid() and s.active);
$$;
create function app_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_profiles s
    where s.user_id = auth.uid() and s.active and s.role = 'admin');
$$;
revoke all on function app_private.is_staff(), app_private.is_admin() from public, anon, authenticated;
grant execute on function app_private.is_staff(), app_private.is_admin() to authenticated;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  phone_e164 text check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  email text check (char_length(email) <= 254),
  notes text check (char_length(notes) <= 2000),
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Evita duplicar al comprador por el mismo teléfono; no exige teléfono ni correo.
create unique index customers_phone_unique on public.customers(phone_e164) where phone_e164 is not null;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('AL-' || gen_random_uuid()::text),
  creation_key uuid not null unique default gen_random_uuid(),
  web_request_reference text unique check (char_length(web_request_reference) <= 100),
  customer_id uuid references public.customers(id) on delete restrict,
  brand text not null default 'aurea_lidia' check (brand in ('aurea_lidia', 'jardin_eterno')),
  source text not null default 'whatsapp' check (source in ('whatsapp', 'web', 'instagram', 'facebook', 'other')),
  status text not null default 'request' check (status in ('request', 'quoted', 'confirmed', 'in_progress', 'ready', 'delivered', 'cancelled')),
  currency text not null default 'MXN' check (currency = 'MXN'),
  budget_cents bigint check (budget_cents between 0 and 100000000000),
  shipping_cents bigint check (shipping_cents between 0 and 100000000000),
  requested_delivery_date date,
  preferred_time_slot text check (char_length(preferred_time_slot) <= 120),
  delivery_region text check (delivery_region in ('cdmx', 'edomex')),
  neighborhood text check (char_length(neighborhood) <= 160),
  municipality text check (char_length(municipality) <= 160),
  postal_code text check (postal_code ~ '^[0-9]{5}$'),
  delivery_address text check (char_length(delivery_address) <= 500),
  recipient_name text check (char_length(recipient_name) <= 160),
  recipient_phone text check (recipient_phone ~ '^\+[1-9][0-9]{7,14}$'),
  dedication text check (char_length(dedication) <= 500),
  preferences text check (char_length(preferences) <= 2000),
  notes text check (char_length(notes) <= 2000),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_idx on public.orders(customer_id);
create index orders_delivery_idx on public.orders(requested_delivery_date, status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  -- Referencia opcional de Sheets: no crea dependencia ni sincronización automática.
  catalog_product_id text check (char_length(catalog_product_id) <= 100),
  name_snapshot text not null check (char_length(btrim(name_snapshot)) between 1 and 200),
  variation_snapshot text check (char_length(variation_snapshot) <= 300),
  description text check (char_length(description) <= 2000),
  quantity integer not null default 1 check (quantity between 1 and 10000),
  unit_price_cents bigint check (unit_price_cents between 0 and 100000000000),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items(order_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  kind text not null default 'receipt' check (kind in ('receipt', 'refund')),
  amount_cents bigint not null check (amount_cents between 1 and 100000000000),
  currency text not null default 'MXN' check (currency = 'MXN'),
  method text not null check (method in ('cash', 'transfer', 'other')),
  status text not null default 'pending' check (status in ('pending', 'verified', 'void')),
  external_reference text check (char_length(external_reference) <= 200),
  -- La futura UI genera una clave por operación, y la reutiliza al reintentar.
  idempotency_key uuid not null unique,
  occurred_at timestamptz not null default now(),
  notes text check (char_length(notes) <= 1000),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  verified_by uuid references auth.users(id) on delete restrict,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'verified' and verified_by is not null and verified_at is not null)
      or (status <> 'verified' and verified_by is null and verified_at is null))
);
create index payments_order_idx on public.payments(order_id);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  entity_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid references auth.users(id) on delete set null,
  happened_at timestamptz not null default now()
);
create index audit_events_entity_idx on public.audit_events(table_name, entity_id, happened_at);

-- Trazabilidad: el cliente no puede falsificar el autor ni las fechas del registro.
create function app_private.stamp_record() returns trigger
language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    NEW.created_by := auth.uid();
    NEW.created_at := now();
  else
    if NEW.id <> OLD.id then
      raise exception using errcode = '23514', message = 'El ID es estable.';
    end if;
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$;

-- La verificación es manual y exclusiva de administradores activos.
-- Movimientos verificados son inmutables: corregir con devolución, no borrarlos.
create function app_private.guard_payment() returns trigger
language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if OLD.status in ('verified', 'void') then
      raise exception using errcode = '23514', message = 'El movimiento finalizado es inmutable.';
    end if;
    if NEW.order_id <> OLD.order_id or NEW.idempotency_key <> OLD.idempotency_key then
      raise exception using errcode = '23514', message = 'No se puede reasignar el movimiento.';
    end if;
  end if;
  if NEW.status = 'verified' then
    if not app_private.is_admin() then
      raise exception using errcode = '42501', message = 'Solo administración puede verificar cobros o devoluciones.';
    end if;
    NEW.verified_by := auth.uid();
    NEW.verified_at := now();
    -- Serializa verificaciones del mismo pedido para evitar devoluciones dobles.
    perform 1 from public.orders where id = NEW.order_id for update;
    if NEW.kind = 'refund' and NEW.amount_cents > (
      select coalesce(sum(case when kind = 'receipt' then amount_cents else -amount_cents end), 0)
      from public.payments where order_id = NEW.order_id and status = 'verified'
    ) then
      raise exception using errcode = '23514', message = 'La devolución supera los cobros verificados.';
    end if;
  else
    NEW.verified_by := null;
    NEW.verified_at := null;
  end if;
  return NEW;
end;
$$;

create function app_private.audit_record() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_events(table_name, entity_id, action, actor_id)
  values (TG_TABLE_NAME, case when TG_OP = 'DELETE' then OLD.id else NEW.id end, TG_OP, auth.uid());
  -- No copia teléfonos, domicilios, dedicatorias ni comprobantes al historial.
  return null;
end;
$$;
revoke all on function app_private.stamp_record(), app_private.guard_payment(), app_private.audit_record() from public, anon, authenticated;

create trigger customers_stamp before insert or update on public.customers for each row execute function app_private.stamp_record();
create trigger orders_stamp before insert or update on public.orders for each row execute function app_private.stamp_record();
create trigger order_items_stamp before insert or update on public.order_items for each row execute function app_private.stamp_record();
create trigger payments_stamp before insert or update on public.payments for each row execute function app_private.stamp_record();
create trigger payments_guard before insert or update on public.payments for each row execute function app_private.guard_payment();
create trigger customers_audit after insert or update on public.customers for each row execute function app_private.audit_record();
create trigger orders_audit after insert or update on public.orders for each row execute function app_private.audit_record();
create trigger order_items_audit after insert or update or delete on public.order_items for each row execute function app_private.audit_record();
create trigger payments_audit after insert or update on public.payments for each row execute function app_private.audit_record();

alter table public.staff_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.staff_profiles, public.customers, public.orders,
  public.order_items, public.payments, public.audit_events from public, anon, authenticated;
grant select on public.staff_profiles to authenticated;
grant select, insert, update on public.customers, public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update on public.payments to authenticated;
grant select on public.audit_events to authenticated;

-- Las altas/bajas de personal se hacen desde SQL confiable, nunca desde el cliente.
create policy staff_read on public.staff_profiles for select to authenticated
  using (user_id = auth.uid() or app_private.is_admin());
create policy customers_read on public.customers for select to authenticated using (app_private.is_staff());
create policy customers_insert on public.customers for insert to authenticated with check (app_private.is_staff());
create policy customers_update on public.customers for update to authenticated using (app_private.is_staff()) with check (app_private.is_staff());
create policy orders_read on public.orders for select to authenticated using (app_private.is_staff());
create policy orders_insert on public.orders for insert to authenticated with check (app_private.is_staff());
create policy orders_update on public.orders for update to authenticated using (app_private.is_staff()) with check (app_private.is_staff());
create policy items_read on public.order_items for select to authenticated using (app_private.is_staff());
create policy items_insert on public.order_items for insert to authenticated with check (
  app_private.is_staff() and exists (select 1 from public.orders o where o.id = order_id and o.status in ('request', 'quoted')));
create policy items_update on public.order_items for update to authenticated using (
  app_private.is_staff() and exists (select 1 from public.orders o where o.id = order_id and o.status in ('request', 'quoted')))
  with check (app_private.is_staff() and exists (select 1 from public.orders o where o.id = order_id and o.status in ('request', 'quoted')));
create policy items_delete on public.order_items for delete to authenticated using (
  app_private.is_staff() and exists (select 1 from public.orders o where o.id = order_id and o.status in ('request', 'quoted')));
create policy payments_read on public.payments for select to authenticated using (app_private.is_staff());
create policy payments_insert on public.payments for insert to authenticated with check (
  app_private.is_staff() and (status = 'pending' or app_private.is_admin()));
create policy payments_update on public.payments for update to authenticated using (app_private.is_admin()) with check (app_private.is_admin());
create policy audit_read on public.audit_events for select to authenticated using (app_private.is_admin());

-- Resumen derivado, no editable y sin saltarse RLS. Precios sin cotizar siguen NULL.
create view public.order_balances with (security_invoker = true) as
with items as (
  select order_id, case when count(*) > 0 and count(unit_price_cents) = count(*)
    then sum(quantity::bigint * unit_price_cents) else null end as subtotal_cents
  from public.order_items group by order_id
), paid as (
  select order_id, sum(case when kind = 'receipt' then amount_cents else -amount_cents end) as received_cents
  from public.payments where status = 'verified' group by order_id
)
select o.id as order_id, o.currency, i.subtotal_cents, o.shipping_cents,
  i.subtotal_cents + o.shipping_cents as total_cents,
  coalesce(p.received_cents, 0) as received_cents,
  i.subtotal_cents + o.shipping_cents - coalesce(p.received_cents, 0) as balance_cents
from public.orders o left join items i on i.order_id = o.id left join paid p on p.order_id = o.id;
revoke all on public.order_balances from public, anon, authenticated;
grant select on public.order_balances to authenticated;

commit;
