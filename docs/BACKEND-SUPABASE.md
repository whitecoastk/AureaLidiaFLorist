# Backend privado — fase 1

Rama local: `codex/backend-supabase-fase1`. No se creó ni enlazó un proyecto remoto, no se publicaron cambios y no se usaron credenciales reales. La web, Google Sheets y WhatsApp siguen sin cambios. No hay panel administrativo todavía.

## Alcance y archivos

| Archivo | Propósito |
| --- | --- |
| `supabase/config.toml` | Entorno local, sin altas públicas ni usuarios anónimos de Auth. |
| `supabase/migrations/20261017000100_manual_orders.sql` | Tablas, restricciones, roles, RLS, trazabilidad y saldos. |
| `supabase/migrations/20261017000200_order_operations.sql` | Creación transaccional e idempotente de pedidos; protección de partidas. |
| `supabase/tests/manual_orders.sql` | Pruebas de integración SQL con cuentas sintéticas y rollback. |
| `scripts/test-backend.cjs` | Ejecución opcional con PostgreSQL embebido y contrato mínimo simulado de Auth. |

No se añadió un SDK ni dependencias a `package.json`. El futuro panel puede usar `supabase-js`; esta fase necesita solamente SQL y configuración. Los scripts públicos no importan Supabase.

## Modelo de datos

- `customers`: comprador, teléfono E.164 opcional y único cuando existe, correo opcional, notas, archivo y autor. No se requiere crear una cuenta de Auth para un cliente.
- `orders`: folio UUID `AL-…`, clave idempotente `creation_key`, referencia web opcional única, comprador opcional, marca, canal, estado, entrega, destinatario, dedicatoria, preferencias y presupuesto. El destinatario no se convierte automáticamente en cliente.
- `order_items`: pedido obligatorio, ID opcional de Google Sheets, nombre y variante históricos, cantidad y precio unitario acordado. No hay FK a una tabla de productos: Sheets sigue siendo la fuente y se permiten personalizados.
- `payments`: movimientos manuales de cobro/devolución, método, importe, clave idempotente, estado y verificación administrativa.
- `staff_profiles`: relación con `auth.users`, rol `admin`/`operator` y acceso activo. Altas y bajas únicamente desde SQL confiable por el propietario del proyecto.
- `audit_events`: registra tabla, ID, acción, actor y fecha. No guarda copias de teléfonos, dedicatorias ni domicilios. Es trazabilidad básica; no es un libro contable ni historial completo de valores antes/después.
- `order_balances`: vista con `security_invoker=true`; calcula subtotal, envío, cobrado neto y saldo respetando RLS. No se edita.

Los importes son **centavos enteros MXN**: $250 = `25000`. Un importe aún no cotizado es `NULL`, no cero. Envío gratuito confirmado = `0`; envío por confirmar = `NULL`. Las fechas de auditoría usan `timestamptz`; interpretar la fecha y franja de entrega en `America/Mexico_City` desde el futuro panel.

Estados de pedido: `request`, `quoted`, `confirmed`, `in_progress`, `ready`, `delivered`, `cancelled`. No existe estado de pedido `paid`. Antes de confirmar deben existir partidas cotizadas y un importe de envío definido. Las partidas solo se editan en solicitud/cotización; se pueden reabrir pedidos mediante cambio explícito de estado, que queda registrado. Esta fase no impone una máquina completa de transiciones.

Estados de movimiento: `pending`, `verified`, `void`. `verified` significa **recepción o devolución comprobada manualmente por administración**, no verificación bancaria automática. Una captura por sí sola no autoriza verificar. Los movimientos verificados/anulados no se editan ni se borran; para corregir un cobro verificado registrar la devolución correspondiente y, si aplica, un nuevo cobro. No se puede devolver más del cobro neto verificado. Se permiten anticipos y varios cobros. Un saldo negativo señala excedente: esta fase no lo asigna automáticamente a otro pedido.

## Permisos

| Operación | Visitante | Auth sin personal activo | Operador activo | Administrador activo |
| --- | --- | --- | --- | --- |
| Leer clientes/pedidos/partidas/cobros/saldos | No | No | Sí | Sí |
| Crear/actualizar clientes y pedidos | No | No | Sí | Sí |
| Modificar partidas de solicitudes/cotizaciones | No | No | Sí | Sí |
| Registrar cobro pendiente | No | No | Sí | Sí |
| Modificar/anular un movimiento pendiente | No | No | No | Sí |
| Verificar cobro o devolución | No | No | No | Sí |
| Leer auditoría | No | No | No | Sí |
| Asignar roles desde la API | No | No | No | No |
| Borrar clientes, pedidos o movimientos | No | No | No | No |

El operador puede consultar su propio perfil de personal, incluso si está desactivado; eso no le permite leer datos operativos. Todos los empleados activos trabajan sobre la misma operación y ambas marcas; no se separan como dos negocios/tenants.

Las funciones privilegiadas se limitan a verificar la pertenencia al personal y escribir eventos. Tienen `search_path` fijo y permisos de ejecución restringidos. La RPC de pedidos usa `SECURITY INVOKER`, por lo que mantiene RLS. Los metadatos editables de una cuenta no asignan permisos. `created_by` y las fechas se asignan en servidor.

## 1. Preparar un entorno local

Usar un entorno nuevo, sin datos reales. Instalar Supabase CLI desde las instrucciones oficiales y un runtime Docker compatible. Son herramientas de desarrollo para ejecutar Auth/Postgres y las pruebas; no se cargan en la web y no requieren contratar un servidor. No se instalaron CLI ni Docker en esta fase. Si se usa CLI vía npm, su documentación actual exige Node 20 o superior; el generador existente del sitio sigue manteniendo sus requisitos actuales.

Desde la raíz del repositorio:

```powershell
supabase --version
supabase start
supabase migration up --local
```

No ejecutar `supabase init`: ya existe `supabase/config.toml`. Revisar antes los puertos 54321–54324. `supabase start` descarga imágenes y puede mostrar credenciales **locales**: no pegarlas en Git, capturas o documentación. Esta configuración desactiva Storage, Realtime y Analytics del entorno local; no son necesarios todavía.

Si el entorno local ya contiene otros datos o migraciones, no usar `db reset` a ciegas. El reset borra datos; usar esta guía en una instancia nueva y conservar cualquier respaldo necesario.

## 2. Ejecutar la prueba SQL en Supabase local

Con las migraciones aplicadas y Docker en marcha:

```powershell
# Usa el usuario postgres local; no necesita credenciales de producción.
Get-Content -Raw -Encoding UTF8 supabase/tests/manual_orders.sql |
  docker exec -i supabase_db_aurea-backend-dev psql -U postgres -d postgres -v ON_ERROR_STOP=1
```

Alternativa con `psql` instalado: establecer `PGHOST`, `PGPORT`, `PGUSER` y `PGDATABASE` según la instancia local y ejecutar:

```powershell
psql -v ON_ERROR_STOP=1 -f supabase/tests/manual_orders.sql
```

El resultado debe incluir `passed_assertions` y terminar con `ROLLBACK`, sin errores. La suite crea usuarios sintéticos dentro de una transacción que se revierte. No usa pgTAP: **no se ejecuta con `supabase test db`**. Si falla con `psql`, la sesión se cierra y revierte; si se ejecuta en un editor que conserve la sesión, ejecutar `ROLLBACK` antes de reintentar. Usar únicamente una base de desarrollo.

Cubre relaciones, RLS, grants, intento de autoalta/escalada de roles, personal inactivo, autor falsificado, cotización pendiente, creación atómica, reintentos, bloqueo de partidas confirmadas, anticipos, verificación, inmutabilidad, devoluciones y acceso a saldos/auditoría.

## Alternativa de comprobación sin Docker

En esta fase se utilizó **PGlite 0.5.10** desde el registro oficial npm, con integridad SHA512 comprobada y archivos bajo `artifacts/backend-test-runtime/`, ignorado por Git. Es PostgreSQL embebido temporal, no una base de datos de producción. No se ejecutaron scripts de instalación ni se modificó `package.json`.

Si esa herramienta está disponible en este equipo:

```powershell
$env:FLORIST_PGLITE_PATH = Join-Path (Get-Location) 'artifacts/backend-test-runtime/package/dist/index.cjs'
node scripts/test-backend.cjs
```

En otro equipo se puede instalar la versión fijada en una carpeta temporal ignorada (`npm install --prefix artifacts/backend-test-runtime @electric-sql/pglite@0.5.10 --ignore-scripts`) y apuntar la variable al módulo `node_modules/@electric-sql/pglite/dist/index.cjs`. No añadirla a las dependencias del sitio. El runner no descarga nada ni usa red; ejecuta la base en memoria y la cierra al terminar.

**Límite:** se simulan `auth.users`, `auth.uid()` y los roles para probar el contrato SQL. No prueba autenticación real, emisión/verificación de JWT, recuperación de contraseña, correo, PostgREST, exposición del esquema privado ni carreras entre múltiples conexiones. Repetir la suite en Supabase y las comprobaciones HTTP siguientes antes de trabajar con datos reales.

## 3. Crear Supabase Free (acción pendiente del propietario)

1. Crear un proyecto **Free de desarrollo** en la cuenta del propietario. Elegir región y guardar la contraseña de base de datos en un gestor privado. No contratar complementos.
2. Mantener el proyecto separado de cualquier operación real mientras se validan políticas.
3. En Auth desactivar **Allow new users to sign up** y acceso anónimo. Exigir confirmación de correo y limitar URL de sitio/redirecciones al futuro panel. El `config.toml` configura lo local; **no actualiza por sí solo los ajustes del proyecto alojado**.
4. Mantener `app_private` fuera de los esquemas expuestos de la Data API. No habilitar lectura pública de las tablas, Realtime ni buckets.
5. Recomendado: MFA para las cuentas administrativas. Antes de depender de invitaciones/recuperaciones, probar el envío y límites del correo; no suponer que la entrega está lista ni añadir un proveedor de pago sin autorización.

No hay usuarios predeterminados, contraseñas compartidas ni autoalta del primer administrador.

## 4. Conectar y aplicar las migraciones (no se ejecutó)

Antes de enlazar, comprobar que el destino es **el nuevo proyecto de desarrollo**. El usuario autorizó preparar esta fase local, no publicar ni modificar una base remota.

```powershell
supabase login
supabase link --project-ref TU_REFERENCIA_DE_DESARROLLO
supabase db push --dry-run
# Solo después de revisar el destino y las migraciones pendientes:
supabase db push
```

El login abre el flujo del CLI. No poner tokens, contraseñas ni cadenas de conexión en scripts, argumentos guardados, commits o mensajes. Los archivos locales de enlace en `supabase/.temp/` están ignorados. Mantener backups/exportaciones fuera de Git y de carpetas públicas.

Si se usa SQL Editor en lugar de CLI, aplicar cada migración en orden, una sola vez, y documentarlo: hacerlo por el editor no registra automáticamente el historial del CLI. No mezclar ambos procedimientos sin reconciliar el historial.

## 5. Primer administrador

Crear/invitar la cuenta del propietario desde **Authentication → Users** del proyecto; usar su correo real únicamente allí, nunca en los fuentes. Completar el acceso y copiar su UUID. En SQL Editor, como propietario confiable, ejecutar esta plantilla sustituyendo el marcador:

```sql
insert into public.staff_profiles(user_id, role, active)
values ('SUSTITUIR_POR_UUID_DE_AUTH'::uuid, 'admin', true);
```

La FK impide dar permisos a una cuenta inexistente. No hay función pública para dar de alta administradores. Para un operador, repetir con su propio UUID y rol `operator`. Para revocar acceso:

```sql
update public.staff_profiles
set active = false
where user_id = 'SUSTITUIR_POR_UUID_DE_AUTH'::uuid;
```

RLS consulta el perfil activo en cada solicitud; no depende de que caduque el JWT para bloquear datos. La revocación de sesiones y recuperación de cuentas se administra también desde Auth. No compartir una cuenta entre empleados.

## 6. Conexión del futuro panel

Solo harán falta la URL del proyecto y su **publishable key** (o clave `anon` heredada), más la sesión de un usuario de Auth. Son configuración pública de cliente, no privilegios administrativos. La contraseña de base de datos, clave secreta y `service_role` no deben entrar al navegador ni a Git.

Todavía no se creó un `.env` con datos reales ni se cambió `site.config.json`/`assets/config.js`. GitHub Pages no ejecuta servidores ni convierte variables de entorno en secretos: cualquier valor empaquetado en JavaScript es público.

Antes de construir el panel, comprobar en el proyecto de desarrollo:

- Login del propietario correcto; no se permite registro público ni acceso con contraseña inválida.
- Con clave publicable sin sesión, la API no lee ni escribe clientes/pedidos/cobros ni ejecuta la RPC.
- Con JWT de una cuenta sin perfil activo, no se reciben filas operativas ni se permiten escrituras.
- Con operador, se registra pedido y anticipo pendiente; no puede verificarlo ni cambiar su rol.
- Con administrador, se verifica manualmente y se obtiene saldo correcto.
- Desactivar un perfil bloquea el acceso con su sesión existente.
- `app_private` no está expuesto por HTTP. No basta con probar desde SQL Editor como `postgres`, que tiene privilegios superiores.

## Ejemplo de contrato del panel (datos sintéticos; no ejecutar en producción)

El cliente genera una clave UUID por intento de creación y conserva **la misma** al reintentar. Una clave nueva corresponde a un pedido nuevo. Reutilizarla devuelve el pedido anterior y no cambia sus datos: es prevención de duplicados, no edición.

```javascript
// Futuro panel: supabase será un cliente autenticado como personal activo.
const { data: orderId, error } = await supabase.rpc('create_manual_order', {
  p_creation_key: operationId,
  p_customer_id: customerId ?? null,
  p_items: [{ name: 'Nombre acordado', quantity: 1, unit_price_cents: agreedCents }],
  p_brand: 'aurea_lidia',
  p_source: 'whatsapp',
  p_shipping_cents: null
});
// Comprobar error antes de mostrar éxito. No registra ningún pago.
```

Las partidas pueden incluir `catalog_product_id`, `variation` y `description` solo con información real. La RPC admite 1–50 partidas y aplica las mismas restricciones/RLS; si una falla, no se guarda una cabecera parcial. Las solicitudes directas a tablas siguen limitadas por RLS; se recomienda la RPC para guardar el formulario completo.

## Privacidad, respaldo y n8n

Definir conservación y procedimientos de acceso/corrección/eliminación antes de ingresar clientes reales. La API no borra datos financieros: las solicitudes de privacidad deben resolverse desde administración confiable, evaluando anonimización y obligaciones de conservación. No se cargaron comprobantes ni fotos de clientes y Storage está desactivado localmente.

Free es apropiado para desarrollo, pero revisar los límites actuales, pausa por inactividad y ausencia de backups automáticos en la página de precios. Definir exportaciones privadas cifradas y probar restauración antes del uso operativo; un respaldo de la base no sustituye respaldar archivos si se incorporan después. No crear tareas artificiales para evitar pausas.

Para n8n se conservan UUID, claves idempotentes, marcas y canales. Aún no hay webhook, credencial de servicio ni automatización. En una fase posterior añadir una API limitada y una cola de eventos transaccional con reintentos; **audit_events no es una cola de entrega**. Evitar conectar n8n con permisos generales de administrador.

## Publicación futura y separación del frontend

Esta fase **no se sube a GitHub ni se despliega**. Al preparar una publicación futura ejecutar el generador existente para que `_config.yml` excluya los nuevos archivos de Supabase ajenos al manifiesto, y revisar la exclusión completa de `supabase/`. No cambiar ahora `_config.yml` ni el manifiesto público. El servidor local ya deniega esos archivos y el empaquetador publica solo el manifiesto. No incorporar dumps, credenciales ni datos de clientes al repositorio aunque no se sirvan por Pages.

## Referencias oficiales

- CLI y entorno local: https://supabase.com/docs/guides/local-development/cli/getting-started
- Permisos y RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Claves: https://supabase.com/docs/guides/getting-started/api-keys
- Configuración de Auth: https://supabase.com/docs/guides/auth/general-configuration
- Precios: https://supabase.com/pricing
- Herramienta temporal de pruebas: https://pglite.dev/docs/
