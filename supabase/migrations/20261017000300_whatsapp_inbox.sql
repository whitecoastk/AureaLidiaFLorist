-- Bandeja privada de consultas. No crea clientes, pedidos ni movimientos de pago.
begin;
create table public.whatsapp_inquiries (
  id uuid primary key default gen_random_uuid(),
  business_phone_number_id text not null check (business_phone_number_id ~ '^[0-9]{5,30}$'),
  provider_message_id text not null check (char_length(provider_message_id) between 1 and 250),
  sender_id text not null check (sender_id ~ '^[1-9][0-9]{7,14}$'),
  sender_display_name text check (char_length(sender_display_name) <= 160),
  received_at timestamptz not null,
  message_type text not null check (message_type in ('text','image','audio','document','video','sticker','location','contacts','interactive','button')),
  body text check (char_length(body) <= 4096),
  web_request_reference text check (web_request_reference ~ '^AL-[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$'),
  review_state text not null default 'received' check (review_state in ('received','review_ready','reviewed')),
  linked_order_id uuid references public.orders(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_phone_number_id, provider_message_id),
  check (message_type <> 'text' or (body is not null and char_length(btrim(body)) > 0))
);
create index whatsapp_inquiries_state_idx on public.whatsapp_inquiries(review_state, created_at, id);
create index whatsapp_inquiries_order_idx on public.whatsapp_inquiries(linked_order_id);
alter table public.whatsapp_inquiries enable row level security;
revoke all on public.whatsapp_inquiries from public, anon, authenticated, service_role;
grant select on public.whatsapp_inquiries to authenticated;
grant update (review_state, linked_order_id) on public.whatsapp_inquiries to authenticated;
grant select, insert, update on public.whatsapp_inquiries to service_role;
grant usage on schema public to service_role;
create policy whatsapp_staff_read on public.whatsapp_inquiries for select to authenticated using (app_private.is_staff());
create policy whatsapp_staff_review on public.whatsapp_inquiries for update to authenticated
  using (app_private.is_staff()) with check (app_private.is_staff());

create function app_private.stamp_inquiry() returns trigger
language plpgsql set search_path = '' as $$
begin
  NEW.updated_at := now();
  return NEW;
end;
$$;
revoke all on function app_private.stamp_inquiry() from public, anon, authenticated;
create trigger whatsapp_inquiry_stamp before update on public.whatsapp_inquiries
  for each row execute function app_private.stamp_inquiry();
create trigger whatsapp_inquiry_audit after insert or update on public.whatsapp_inquiries
  for each row execute function app_private.audit_record();

-- Solo el receptor del servidor (service_role) puede insertar un lote validado.
create function public.whatsapp_inbox_ingest(p_messages jsonb) returns integer
language plpgsql security invoker set search_path = '' as $$
declare message jsonb; inserted integer := 0; changed integer;
begin
  if jsonb_typeof(p_messages) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Se requiere una lista de mensajes.';
  end if;
  if jsonb_array_length(p_messages) > 100 then
    raise exception using errcode = '22023', message = 'Lote demasiado grande.';
  end if;
  for message in select value from jsonb_array_elements(p_messages) loop
    insert into public.whatsapp_inquiries(business_phone_number_id,provider_message_id,
      sender_id,sender_display_name,received_at,message_type,body,web_request_reference)
    values (message->>'business_phone_number_id',message->>'provider_message_id',
      message->>'sender_id',message->>'sender_display_name',(message->>'received_at')::timestamptz,
      message->>'message_type',message->>'body',message->>'web_request_reference')
    on conflict (business_phone_number_id,provider_message_id) do nothing;
    get diagnostics changed = row_count;
    inserted := inserted + changed;
  end loop;
  return inserted;
end;
$$;

create function public.whatsapp_inbox_pending(p_limit integer default 20)
returns table (id uuid, received_at timestamptz, message_type text, body text, web_request_reference text)
language sql stable security invoker set search_path = '' as $$
  select i.id,i.received_at,i.message_type,i.body,i.web_request_reference
  from public.whatsapp_inquiries i where i.review_state = 'received'
  order by i.created_at,i.id limit greatest(1,least(coalesce(p_limit,20),100));
$$;

-- Acuse de procesamiento, NO confirmación del pedido ni lectura del cliente.
-- Idempotente: dos ejecuciones concurrentes no crean registros nuevos.
create function public.whatsapp_inbox_ready(p_ids uuid[]) returns integer
language plpgsql security invoker set search_path = '' as $$
declare changed integer;
begin
  if p_ids is null or cardinality(p_ids) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'Incluye entre 1 y 100 IDs.';
  end if;
  update public.whatsapp_inquiries set review_state = 'review_ready'
  where id = any(p_ids) and review_state = 'received';
  get diagnostics changed = row_count;
  return changed;
end;
$$;
revoke all on function public.whatsapp_inbox_ingest(jsonb), public.whatsapp_inbox_pending(integer), public.whatsapp_inbox_ready(uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.whatsapp_inbox_ingest(jsonb), public.whatsapp_inbox_pending(integer), public.whatsapp_inbox_ready(uuid[]) to service_role;
commit;
