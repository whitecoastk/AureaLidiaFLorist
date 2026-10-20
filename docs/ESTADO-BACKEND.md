# Estado del sistema privado y siguientes fases

## Implementado

- Backend Supabase con tres migraciones versionadas: clientes, pedidos, partidas, pagos manuales, perfiles de personal y bandeja de consultas WhatsApp.
- Autenticación administrativa y permisos RLS. La clave pública no concede acceso a clientes, pedidos ni pagos a visitantes anónimos. Las claves privilegiadas permanecen en el servidor.
- Panel local `gestion.html` para personal autorizado. Permite gestionar pedidos y cobros manuales y revisar consultas. No es parte del sitio comercial ni tiene enlace desde él.
- n8n local con flujos importables sin credenciales: simulación y procesamiento manual de la bandeja. No envía mensajes ni confirma ventas.
- Receptor con validación HMAC, filtros por cuenta/número e idempotencia. Es una integración opcional; no es necesaria para usar el panel o Supabase.

## Validación realizada con el propietario

El propietario informó haber aplicado las tres migraciones, iniciado sesión en el panel y completado el recorrido de mensajes sintéticos firmados hasta Supabase, n8n y la bandeja administrativa. Las consultas aparecieron como `review_ready` / «Preparada por n8n». Esas pruebas no son pedidos ni clientes reales. Los registros y las credenciales de esas pruebas no se incluyen en Git.

La prueba del panel de Meta alcanzó el receptor; su ejemplo utiliza identificadores ficticios que se descartan. Esto no demuestra recepción de conversaciones reales. La vinculación/verificación de la cuenta comercial no quedó validada para producción.

## Decisión actual

Se deja pendiente la integración de producción con Meta por los requisitos de verificación del negocio. No se contrataron alternativas ni se activaron respuestas automáticas como parte de esta entrega. No usar conectores no oficiales como sustituto automático del número comercial.

La siguiente fase propuesta es guardar las solicitudes del formulario público en Supabase mediante un punto de entrada específico con validación, límites y protección contra abuso, conservando el resumen y cierre por WhatsApp. **Esa conexión aún no está implementada.** Los pedidos que lleguen directamente por chat seguirán registrándose manualmente.

## Separación y publicación

- El catálogo continúa en Google Sheets y el sitio comercial conserva su flujo por WhatsApp.
- `deploy-manifest.json` es la lista de archivos del paquete público. Excluye panel, SQL, automatizaciones, documentación y pruebas.
- `_config.yml`, generado por `scripts/github-pages.cjs`, excluye los mismos módulos privados de GitHub Pages. No agregar `.nojekyll` ni desplegar la raíz con un servicio que ignore estas exclusiones.
- GitHub contiene el código fuente, no una base de datos. Si el repositorio es público, los fuentes del panel y las migraciones son públicos; la protección de datos depende de Auth/RLS y las claves del servidor, no de ocultar código.
- Esta entrega se sube a una rama de desarrollo. No fusionar ni activar Pages/funciones/automatizaciones de producción sin revisar un despliegue separado. El panel permanece local.

## Configuración y mantenimiento pendientes

1. Continuar desde [BACKEND-SUPABASE.md](BACKEND-SUPABASE.md) y [PANEL-ADMINISTRATIVO.md](PANEL-ADMINISTRATIVO.md). Cada instalación configura sus propias URL y claves fuera del repositorio.
2. Mantener secretos de funciones en Supabase y credenciales de n8n en su almacén, nunca en JSON exportados, SQL, capturas ni código. No se versionan URL/UID administrativos reales ni datos de clientes.
3. Documentar respaldos, retención y recuperación antes del uso diario; los planes gratuitos tienen límites. n8n local solo procesa mientras la computadora y su servicio estén funcionando.
4. Probar permisos reales con usuarios de cada rol antes de publicar el panel; las pruebas SQL embebidas no sustituyen todas las comprobaciones de Auth/JWT y concurrencia en Supabase.
5. Definir y validar la nueva entrada de solicitudes web antes de conectarla. No reutilizar para visitantes las claves privadas ni el token de bandeja de n8n.
6. Si se retoma Meta, revisar elegibilidad, coexistencia, permisos, facturación y suscripción de la cuenta/número real. No dar por validada la producción por una prueba sintética.

## Comprobaciones reproducibles

```text
node scripts/build.cjs
node --test tests/*.test.cjs
node scripts/check-release.cjs
node scripts/test-backend.cjs
```

La última comprobación requiere PGlite instalado por separado y la variable `FLORIST_PGLITE_PATH`, como explica BACKEND-SUPABASE.md. No se incorporan dependencias de producción al frontend. Los fixtures de pruebas son sintéticos y los flujos se distribuyen desactivados, sin credenciales.
