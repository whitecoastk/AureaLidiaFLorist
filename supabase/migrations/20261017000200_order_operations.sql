begin;

-- Entrada transaccional del futuro panel: cabecera y partidas se guardan juntas.
-- SECURITY INVOKER: aplica permisos y RLS del empleado, no de un superusuario.
create function public.create_manual_order(
  p_creation_key uuid,
  p_customer_id uuid,
  p_items jsonb,
  p_brand text default 'aurea_lidia',
  p_source text default 'whatsapp',
  p_shipping_cents bigint default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  order_id uuid;
  line jsonb;
begin
  if not app_private.is_staff() then
    raise exception using errcode = '42501', message = 'Se requiere personal activo.';
  end if;
  if p_creation_key is null or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Clave de operación y arreglo de partidas obligatorios.';
  end if;
  if jsonb_array_length(p_items) not between 1 and 50 then
    raise exception using errcode = '22023', message = 'Incluye entre 1 y 50 partidas.';
  end if;
  -- Un reintento de la MISMA operación conserva pedido y partidas.
  -- ON CONFLICT también protege contra dos solicitudes simultáneas.
  insert into public.orders(creation_key, customer_id, brand, source, shipping_cents)
  values (p_creation_key, p_customer_id, p_brand, p_source, p_shipping_cents)
  on conflict (creation_key) do nothing returning id into order_id;
  if order_id is null then
    select id into order_id from public.orders where creation_key = p_creation_key;
    return order_id;
  end if;
  for line in select value from jsonb_array_elements(p_items) loop
    insert into public.order_items(order_id, catalog_product_id, name_snapshot,
      variation_snapshot, description, quantity, unit_price_cents)
    values (order_id, line->>'catalog_product_id', line->>'name', line->>'variation',
      line->>'description', coalesce((line->>'quantity')::integer, 1),
      (line->>'unit_price_cents')::bigint);
  end loop;
  return order_id;
end;
$$;
revoke all on function public.create_manual_order(uuid, uuid, jsonb, text, text, bigint) from public, anon, authenticated;
grant execute on function public.create_manual_order(uuid, uuid, jsonb, text, text, bigint) to authenticated;

create function app_private.guard_order() returns trigger
language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' and NEW.creation_key <> OLD.creation_key then
    raise exception using errcode = '23514', message = 'La clave de creación es estable.';
  end if;
  if NEW.status in ('confirmed', 'in_progress', 'ready', 'delivered') then
    if NEW.shipping_cents is null or not exists (select 1 from public.order_items where order_id = NEW.id)
      or exists (select 1 from public.order_items where order_id = NEW.id and unit_price_cents is null) then
      raise exception using errcode = '23514', message = 'Cotiza las partidas y el envío antes de confirmar.';
    end if;
  end if;
  return NEW;
end;
$$;
revoke all on function app_private.guard_order() from public, anon, authenticated;
create trigger orders_guard before insert or update on public.orders for each row execute function app_private.guard_order();

-- Serializa cambios de partidas con confirmaciones y evita moverlas entre pedidos.
create function app_private.guard_item() returns trigger
language plpgsql set search_path = '' as $$
declare target_id uuid; parent_status text;
begin
  if TG_OP = 'UPDATE' and NEW.order_id <> OLD.order_id then
    raise exception using errcode = '23514', message = 'No se puede reasignar una partida.';
  end if;
  target_id := case when TG_OP = 'DELETE' then OLD.order_id else NEW.order_id end;
  select status into parent_status from public.orders where id = target_id for update;
  if parent_status is not null and parent_status not in ('request', 'quoted') then
    raise exception using errcode = '23514', message = 'Solo se editan partidas de solicitudes o cotizaciones.';
  end if;
  if TG_OP = 'DELETE' then return OLD; end if;
  return NEW;
end;
$$;
revoke all on function app_private.guard_item() from public, anon, authenticated;
create trigger items_guard before insert or update or delete on public.order_items for each row execute function app_private.guard_item();

commit;
