# Primer paso de n8n: recepción de consultas de WhatsApp

Estado inicial de esta guía: configuración y simulación local. Posteriormente el propietario instaló n8n y validó el circuito sintético con Supabase y el panel. Consultar [ESTADO-BACKEND.md](ESTADO-BACKEND.md) para el estado vigente. La recepción real desde Meta sigue pendiente y no se activaron envíos automáticos.

## Qué estamos construyendo

Objetivo posterior: mensaje entrante oficial → consulta privada → revisión del negocio → vinculación a pedido. No todos los mensajes son pedidos: un saludo, pregunta o seguimiento debe conservarse como consulta. No convertir cada mensaje de una conversación en un pedido nuevo. Un acuse de entrega de WhatsApp tampoco prueba que se entregó un arreglo o se recibió un pago.

En esta entrega solamente se prueba la transformación de un evento con datos ficticios. No hay nodos de envío, conexiones a Supabase, claves, horarios activos ni bots. Los mensajes no se interpretan con IA, no se cotizan y no se inventan fechas, productos, disponibilidad o importes.

## Paso 1 — instalar Docker Desktop en esta computadora

1. Descargar Docker Desktop para Windows desde https://docs.docker.com/desktop/setup/install/windows-install/ y seguir las instrucciones oficiales.
2. Usar el backend WSL2; la herramienta `wsl.exe` existe en este equipo, pero no se comprobó que su distribución, virtualización y versión estén listas. El instalador puede pedir reinicio o pasos de Windows que debe completar el propietario. No se cambiaron esas opciones automáticamente.
3. Abrir Docker Desktop y esperar a que el motor esté funcionando. Revisar los requisitos y términos aplicables antes de instalar.

Docker permite ejecutar n8n aislado de las dependencias del sitio. No implica contratar n8n Cloud ni un servidor remoto. Esta configuración usa Community sin clave de licencia, SQLite local y un volumen persistente. No incluye AI Assistant, proveedores de IA, Redis, dominios o servicios adicionales.

## Paso 2 — iniciar n8n

Abrir **`Iniciar n8n.cmd`** en la raíz del proyecto. Alternativa en PowerShell:

```powershell
docker compose -f automations/n8n/compose.yaml up -d
docker compose -f automations/n8n/compose.yaml ps
```

La primera vez descargará la imagen oficial fijada a **2.43.7**. No se descargó ni ejecutó esta imagen durante la preparación. Abrir **http://localhost:5678** en la misma computadora y crear la cuenta propietaria de n8n. Esta cuenta es distinta de tu usuario de Supabase: no es necesario reutilizar contraseña.

No es una dirección accesible desde el teléfono. El puerto está publicado solamente en `127.0.0.1`; no abrirlo a Internet, no configurar router, túneles ni exposición pública con este Compose. Se permite cookie de sesión sin atributo Secure únicamente porque este entorno usa HTTP en loopback: una instalación remota requerirá HTTPS y otra configuración.

Para detenerlo conservando los datos:

```powershell
docker compose -f automations/n8n/compose.yaml stop
```

No usar `down -v`: elimina el volumen con configuración y credenciales. La clave de cifrado de n8n queda junto con su configuración en el volumen; respaldar ese volumen de forma privada antes de uso real. No guardar exportaciones de credenciales, bases SQLite ni backups en Git.

El servicio no se reinicia automáticamente con esta configuración (`restart: no`). Si la computadora duerme, se apaga o Docker se cierra, n8n deja de trabajar. Es para aprender y probar; no se promete recepción continua de clientes.

## Paso 3 — importar la simulación

1. En n8n crear/abrir un workflow y usar la opción de importar desde archivo.
2. Elegir `automations/n8n/workflows/01-whatsapp-simulacion.json`.
3. Ejecutar manualmente **Ejecutar prueba**.
4. Inspeccionar la salida de **Preparar consulta para revisión**.

Debe aparecer una consulta ficticia con `requires_manual_review: true`, `proposed_state: inquiry` y `payment_verified: false`. No se guardó un cliente, pedido o pago. El workflow se importa inactivo y no requiere credenciales. No sustituir la muestra por mensajes reales durante esta etapa.

El flujo no guarda ejecuciones manuales, correctas o fallidas en su historial mediante los ajustes preparados. Mientras se ejecuta, n8n muestra la información en su interfaz: estas opciones no sustituyen controles de acceso ni autorizan exponer datos personales. Evitar fijar datos reales con pin data, guardarlos como ejemplos o incluirlos al exportar workflows.

## Qué falta para WhatsApp real

La aplicación **WhatsApp Business del teléfono** y **WhatsApp Business Platform/Cloud API** son productos de integración distintos. El enlace `wa.me` existente no ofrece una suscripción a mensajes para n8n.

Para el camino oficial se necesita:

- Cuenta de desarrollador de Meta, portafolio comercial y una app configurada con WhatsApp, conforme a los requisitos de Meta.
- Comenzar con recursos de prueba que Meta ofrezca a la cuenta, si están disponibles. No registrar, eliminar, migrar o desconectar el número comercial durante las pruebas.
- Verificar si la cuenta/número permite una modalidad compatible con mantener la app. **No se ha comprobado elegibilidad de coexistencia** y no se garantiza que esté disponible para esta cuenta.
- Un receptor HTTPS accesible por Meta. `localhost:5678` no lo es. No basta instalar n8n localmente para recibir webhooks reales.
- Configurar credenciales directamente en el almacenamiento seguro del servicio correspondiente. No enviar app secrets o access tokens por chat ni guardarlos en fuentes.
- Revisar costos, condiciones y requisitos de Meta/proveedores antes de activar producción. No se contrató nada ni se promete que toda la integración sea gratuita.

La documentación de Meta devolvió limitación de solicitudes durante esta revisión; la guía oficial de n8n sí permitió comprobar los requisitos de integración. Los pasos exactos del panel Meta y compatibilidad del número deberán verificarse en la cuenta antes de activarla.

## Diseño de la siguiente fase (aún no implementado)

Para conservar costos bajos y no depender de una computadora encendida todo el tiempo, evaluar un receptor HTTPS en Supabase Edge Functions que verifique la firma de Meta y almacene mensajes autorizados en una bandeja privada. n8n podría procesar pendientes cuando esté disponible. Esto exige implementar y probar el receptor y la bandeja: hoy no existen.

Requisitos de esa fase:

1. Verificar desafío de suscripción y firma `X-Hub-Signature-256` sobre el cuerpo original antes de aceptar mensajes. Un normalizador de JSON no valida autenticidad.
2. Validar la cuenta y el ID de número autorizados, limitar tamaño y manejar todos los mensajes de un evento. No registrar secretos ni payloads completos en logs.
3. Mantener una clave única por número/message ID para deduplicar reintentos persistentes. La simulación solo elimina duplicados dentro de un lote; no entre ejecuciones.
4. Separar mensajes entrantes, estados de entrega/lectura y eventos de la cuenta. Conservar consultas y vincularlas a pedidos mediante revisión, sin duplicar cada mensaje como venta.
5. Acceso privado con un permiso específico para la automatización. No dar a n8n la contraseña del administrador ni una clave privilegiada general como solución por defecto.
6. Guardar texto y datos mínimos con política de conservación revisada. Imágenes, documentos, audios y sus permisos de descarga/almacenamiento requieren una fase propia. La simulación identifica su tipo pero no descarga ni simula adjuntos.
7. No responder, prometer disponibilidad ni verificar pagos automáticamente. Cualquier envío posterior a clientes requiere definir destinatarios, contenido y autorización.
8. Probar reintentos, pérdida de conexión, mensajes duplicados y revocación antes de habilitar datos reales.

No se añadió una migración nueva para esta bandeja todavía: primero completar la instalación local y los requisitos de Meta, para no desplegar un esquema de recepción sin un canal autorizado.

## Archivos y pruebas

- `automations/n8n/compose.yaml`: solo el servicio local de n8n y su volumen privado.
- `Iniciar n8n.cmd`: comprueba Docker e inicia el Compose; no instala software automáticamente.
- `automations/n8n/normalize-whatsapp.cjs`: transformación pura, no autenticación ni persistencia.
- `automations/n8n/build-workflow.cjs`: genera el JSON de simulación a partir de la función probada.
- `automations/n8n/workflows/01-whatsapp-simulacion.json`: archivo importable inactivo.
- `tests/n8n.test.cjs`: texto, referencias, tipos de mensaje, duplicados del lote y eventos inválidos.

```powershell
node automations/n8n/build-workflow.cjs
node --test tests/n8n.test.cjs
```

Las pruebas ejecutan la función de transformación y el código exportado con Node. No se ejecutó el workflow dentro del motor de n8n y no se probó el Compose con Docker, porque Docker no está instalado. La validación de esos dos puntos queda pendiente.

No hay cambios publicados. Los nuevos archivos no están en el manifiesto comercial; antes de cualquier publicación futura revisar/regenerar las exclusiones de Pages. No subir datos ni credenciales de la instancia local.

## Fuentes oficiales revisadas

- n8n Community y métodos de instalación: https://docs.n8n.io/hosting/
- Versión fijada: https://github.com/n8n-io/n8n/releases/tag/n8n%402.43.7
- Credenciales y requisitos de WhatsApp: https://docs.n8n.io/integrations/builtin/credentials/whatsapp/
- Trigger y limitaciones de webhooks: https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.whatsapptrigger/
- Historial de ejecuciones: https://docs.n8n.io/hosting/configuration/environment-variables/executions/
