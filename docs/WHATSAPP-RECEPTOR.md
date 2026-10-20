# Receptor oficial de WhatsApp y bandeja privada

> Estado actualizado: ver [ESTADO-BACKEND.md](ESTADO-BACKEND.md). El propietario validó manualmente el circuito con mensajes sintéticos. La recepción real y la verificación comercial de Meta siguen pendientes. Las instrucciones siguientes describen la preparación técnica; no implican un despliegue automático ni una conexión comercial activa.

Preparación local. **No se aplicó la tercera migración remota, no se desplegó una función ni se suscribió Meta automáticamente.** El número comercial sigue sin migrarse. No se enviaron mensajes ni se guardó el payload real compartido en el chat dentro del repositorio.

## Arquitectura de esta etapa

Meta → función HTTPS `whatsapp-webhook` → `whatsapp_inquiries` privada → n8n manual → revisión humana en el panel.

La entrada se guarda antes de contestar éxito a Meta. Si la base falla, devuelve 503 para permitir reintentos; el mismo mensaje no se duplica gracias a la clave única `(business_phone_number_id, provider_message_id)`. Un lote inválido se revierte completo. Los estados de entrega/lectura no se guardan como consultas.

n8n marca consultas como `review_ready`; **no crea clientes, pedidos o pagos ni envía respuestas**. La recepción funciona aunque el n8n local esté apagado, siempre que la función y la base alojadas estén disponibles. No se garantiza disponibilidad continua del plan Free: revisar límites y pausas antes del uso operativo.

## 1. Aplicar la nueva migración

En SQL Editor del MISMO proyecto de desarrollo, ejecutar una sola vez todo el contenido de:

`supabase/migrations/20261017000300_whatsapp_inbox.sql`

No repetir las primeras dos migraciones. Conservarlas intactas. La nueva tabla no modifica el catálogo de Sheets ni el flujo público de WhatsApp.

Comprobar desde SQL Editor:

```sql
select count(*) from public.whatsapp_inquiries;
```

El panel administrativo añade **Consultas WhatsApp**. Si la tabla aún no existe, esa pestaña explica qué migración falta; el inicio de sesión y las otras secciones no dependen de la tabla nueva. Recargar el panel local requiere volver a iniciar sesión porque no se persisten tokens.

## 2. Configurar secretos de la función

En Supabase → Edge Functions → Secrets, introducir directamente estos valores. No compartirlos en chat, capturas, workflows exportados o Git:

| Nombre | Valor |
| --- | --- |
| `META_APP_SECRET` | Clave secreta de la app de Meta, no el access token temporal. |
| `META_VERIFY_TOKEN` | Una cadena aleatoria propia; usar exactamente la misma al verificar el webhook en Meta. |
| `META_WABA_ID` | ID de la cuenta WhatsApp Business **de prueba**. |
| `META_PHONE_NUMBER_ID` | Phone Number ID **de prueba**, no el teléfono ni el ID de la app. |
| `N8N_INBOX_TOKEN` | Otra cadena aleatoria, diferente de la anterior y de al menos 32 caracteres, para n8n. |

Para generar cada token en tu computadora, ejecutar por separado:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copiar directamente al gestor de secretos correspondiente. No poner los valores reales en el código. La URL del proyecto y claves del servidor las obtiene el runtime de Supabase: se prioriza `SUPABASE_SECRET_KEYS.default` y se admite el `SUPABASE_SERVICE_ROLE_KEY` inyectado como compatibilidad. **No crear manualmente variables con prefijo `SUPABASE_`.**

Si el runtime no inyecta una clave válida, se admite una clave secreta específica almacenada como `WHATSAPP_DB_SECRET` únicamente en Edge Function Secrets. No usar la publishable key para esta operación ni entregar esta clave de base de datos a n8n. Las claves del servidor tienen privilegios elevados y solo deben permanecer en ese entorno protegido.

El receptor no necesita el access token temporal de WhatsApp para recibir eventos: verifica las firmas con `META_APP_SECRET`. Una clave que haya quedado expuesta debe revocarse en el proveedor correspondiente; generar otro access token no garantiza invalidar el anterior.

## 3. Crear la función desde el navegador

1. Supabase → Edge Functions → crear/desplegar una función desde el editor.
2. Nombre exacto: `whatsapp-webhook`.
3. Reemplazar el ejemplo del editor por TODO el contenido de `docs/generated/whatsapp-webhook-dashboard.ts`.
4. Para esta función nueva, desactivar la comprobación de JWT de Supabase del gateway. Meta no envía un JWT de tu proyecto. **No cambiar Auth, RLS ni las otras funciones.**
5. Desplegar manualmente y copiar su URL HTTPS desde Supabase.

La URL tendrá esta forma, usando tu proyecto real:

```text
https://TU_PROYECTO.supabase.co/functions/v1/whatsapp-webhook
```

Desactivar el JWT del gateway NO deja los datos abiertos: el código exige firma HMAC SHA256 válida sobre el cuerpo original para los eventos de Meta; el acceso de n8n exige un token diferente en cabecera. No desplegar un handler de ejemplo sin estas comprobaciones. El archivo generado es una copia exacta de las fuentes probadas, sin dependencias externas.

Si prefieres CLI en una fase posterior: la configuración específica ya figura en `supabase/config.toml` y la entrada es `supabase/functions/whatsapp-webhook/index.ts`. Ningún comando de despliegue se ejecutó durante esta preparación.

## 4. Suscribir el webhook de Meta, solo para pruebas

En la configuración del caso de uso WhatsApp de la app, localizar la sección de webhooks:

- URL de devolución de llamada: la URL HTTPS de la función, **sin** `?mode=`.
- Token de verificación: el valor de `META_VERIFY_TOKEN`.
- Verificar/guardar y suscribirse al campo `messages` según la pantalla disponible en la cuenta.

No elegir todavía el número comercial ni activar su migración. Revisar antes la política de privacidad y qué se guardará; empezar con mensajes de prueba propios. No mostrar capturas con secretos. La verificación del callback realiza una llamada GET con un desafío; no crea un pedido.

Responder desde el teléfono al número de prueba con un texto ficticio. Confirmar que aparece una consulta en el panel o en SQL Editor. El evento observado antes en el probador de Meta no se importa automáticamente ni se recupera un historial: enviar una prueba nueva después de configurar la suscripción.

## 5. Conectar n8n a la bandeja

1. Importar `automations/n8n/workflows/02-whatsapp-bandeja-manual.json` como workflow nuevo. Mantener la simulación anterior separada.
2. En el nodo **Configuración**, sustituir solo `webhook_url` por la URL HTTPS de la función. No introducir secretos en ese nodo.
3. Crear una credencial genérica **Header Auth**: nombre de cabecera `x-inbox-token`; valor igual a `N8N_INBOX_TOKEN`.
4. Seleccionar esa misma credencial en **Obtener pendientes** y **Marcar listas para revisión**. No seleccionar la credencial Supabase con clave administrativa.
5. Ejecutar manualmente. Si no hay pendientes, el flujo termina sin marcar nada. Si hay, procesa como máximo 20 consultas y las deja listas para revisión.

La ruta `?mode=pending` solo devuelve ID, fecha, tipo, texto y referencia; no entrega el teléfono ni el nombre del remitente a n8n. El texto puede contener datos personales: el historial de ejecuciones está desactivado, pero la ejecución se ve en el editor mientras está abierta. No fijar datos reales ni exportar ejecuciones con mensajes de clientes.

Las rutas protegidas de n8n no permiten confirmar pedidos, editar precios, borrar registros, descargar archivos o verificar pagos. Un acuse repetido es idempotente. Por ahora no hay programación periódica ni una promesa de procesamiento continuo. Las consultas siguen visibles en el panel aunque n8n no se haya ejecutado.

## 6. Revisar desde el panel

En el panel local, abrir **Consultas WhatsApp**, filtrar y pulsar **Actualizar bandeja**. Un usuario sin perfil activo no debe ver filas. Marcar una consulta revisada no crea un pedido. Si procede una venta, registrar el pedido con el flujo manual existente y los datos acordados.

El ID del remitente se conserva tal como lo entrega WhatsApp. No se elimina automáticamente el dígito histórico de algunos identificadores mexicanos ni se crean clientes a partir de esa transformación: esto evita duplicados o asociaciones erróneas. Una referencia `AL-…` escrita en un mensaje es una pista del remitente, no autorización para revelar datos de un pedido.

Imágenes, audios y documentos se registran solo por su tipo. No se descargan, no se simulan adjuntos, y no se guarda el payload completo con metadatos internos o de facturación de Meta. La decisión de vincular consultas a pedidos se mantiene humana.

## Pruebas y mantenimiento

```powershell
node scripts/package-whatsapp-webhook.cjs
node automations/n8n/build-inbox-workflow.cjs
node --test tests/*.test.cjs
$env:FLORIST_PGLITE_PATH = Join-Path (Get-Location) 'artifacts/backend-test-runtime/package/dist/index.cjs'
node scripts/test-backend.cjs
```

Se prueban firma válida/inválida, cuerpo alterado, desafío, aislamiento de cuenta/número, límites de tamaño, errores de base, token de n8n, estados de entrega, reintentos y permisos de bandeja. Las pruebas usan datos ficticios, PostgreSQL embebido y llamadas HTTP simuladas; no se aplicaron contra una base remota. Se comprobó la importación del workflow en un contenedor n8n 2.43.7 desechable sin red, sin montar la base ni credenciales de la instancia del propietario. Esa prueba no ejecuta aún el ciclo HTTP completo del workflow.

Pendientes antes de clientes reales: desplegar y comprobar el runtime Deno alojado, firma y reintentos de Meta reales, callback, credenciales n8n y ciclo completo de la cuenta de prueba. Verificar retención/eliminación, aviso de privacidad y respaldos; no se automatizó el borrado ni se definió una conservación ilimitada como política.

Los generadores no despliegan. Después de modificar fuentes, regenerar la copia del editor y el workflow. No editar directamente esos generados. Los archivos no forman parte del despliegue comercial; antes de publicar cualquier cambio en GitHub Pages revisar las exclusiones. No se contrató ningún servicio, se publicó la web o se activaron mensajes salientes.

Fuentes: [secretos de Edge Functions](https://supabase.com/docs/guides/functions/secrets), [configuración por función](https://supabase.com/docs/guides/functions/function-configuration), [nodo HTTP de n8n](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/).
