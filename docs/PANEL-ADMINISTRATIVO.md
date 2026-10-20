# Panel administrativo local — primera versión

> Esta sección conserva el alcance de la primera versión. Para la bandeja WhatsApp, la validación posterior y los pendientes actuales, consultar [ESTADO-BACKEND.md](ESTADO-BACKEND.md). El panel se mantiene fuera del despliegue público.

Archivos nuevos: `gestion.html`, `assets/gestion.css`, `assets/gestion-core.js`, `assets/gestion.js`, `assets/gestion-sdk.js`, las pruebas `tests/gestion*.test.cjs` y la API ficticia `tests/fixtures/admin-api.cjs`.

No se modifican las páginas comerciales, el generador, el manifiesto de despliegue, la configuración de producción, las migraciones aplicadas ni Google Sheets. No se subió ni publicó este panel. No se incorporaron URL, clave o UUID reales del propietario a los archivos.

## Qué permite

- Conectar una instancia Supabase HTTPS con su publishable key; rechaza claves secretas y destinos ajenos a Supabase. Para desarrollo admite HTTP en localhost.
- Iniciar sesión con correo y contraseña usando Auth. No permite registro público ni administrar roles. Si la cuenta requiere segundo factor TOTP, pide el código del autenticador.
- Comprobar mediante Auth el usuario y su perfil de personal activo antes de mostrar datos.
- Registrar compradores con contacto opcional. Buscar clientes por nombre y seleccionarlos para un pedido.
- Crear **borradores** con varias partidas y precios acordados o pendientes. Después completar entrega, dedicatoria, destinatario, preferencias y estado en el detalle.
- Modificar cantidad y precio de partidas mientras el pedido está en solicitud/cotización. Nombre y descripción iniciales se capturan al crear el borrador; edición completa de partidas queda para una siguiente versión.
- Consultar pedidos, filtrar estado/fecha solicitada y paginar. El selector inicial ofrece hasta 500 clientes recientes; un cliente anterior se selecciona desde la búsqueda paginada en Clientes.
- Registrar anticipos, cobros o devoluciones **pendientes**. Administración verifica manualmente o anula un movimiento pendiente. La base impide modificar movimientos finalizados.
- Consultar total cotizado, cobro neto y saldo. Un precio/envío aún pendiente conserva “Por cotizar”; no se interpreta como cero.
- Cerrar sesión y retirar datos de los formularios y listados de la pestaña.

No hay pagos en línea, sincronización del catálogo, mensajes automáticos a WhatsApp, archivos de clientes, exportaciones ni automatizaciones n8n. El registro es manual. No se incorporaron datos de demostración al negocio.

## Dependencia utilizada

SDK oficial `@supabase/supabase-js` **2.118.0**, artefacto de navegador `dist/umd/supabase.js` del paquete npm, copiado a `assets/gestion-sdk.js` sin modificar. Se verificó la integridad SHA512 del paquete al descargarlo. Su licencia está en `docs/SUPABASE-SDK-LICENSE.txt`.

Justificación: administrar Auth, sesiones y consultas sin implementar manualmente renovación de tokens. Solo lo carga el panel; no se cambió `package.json` ni se añadió un CDN remoto o una descarga al visitar la web. Revisar y probar actualizaciones del SDK antes de reemplazarlo.

## Activar al primer administrador

Haber creado la cuenta de Auth y ejecutado las migraciones no asigna un rol de personal. Desde SQL Editor, como propietario del proyecto, ejecutar la plantilla de `BACKEND-SUPABASE.md` con el UUID de la cuenta correspondiente. Para comprobar el resultado:

```sql
select user_id, role, active from public.staff_profiles;
```

Esta consulta es para SQL Editor; el panel solo permite el acceso que determinen RLS y el perfil activo. La cuenta del panel no recibe la contraseña de base de datos ni claves privilegiadas.

## Abrir localmente

```powershell
node scripts/serve.cjs
```

En el mismo equipo abrir `http://127.0.0.1:4173/gestion.html`. No usar `file://`. Desde el teléfono, `127.0.0.1` se refiere al propio teléfono: este panel todavía no está publicado ni accesible remotamente. El servidor de revisión solo escucha en el equipo local; no abrirlo a Internet.

Introducir en el formulario:

1. URL HTTPS del proyecto Supabase.
2. Publishable key, con prefijo `sb_publishable_`.
3. Correo y contraseña de tu cuenta de Auth.
4. Código TOTP si tu cuenta lo requiere.

No hay valores reales preconfigurados. La configuración escrita se conserva solo en el formulario de esa pestaña; la aplicación no la escribe en almacenamiento persistente. El SDK usa `persistSession: false` y no recoge credenciales desde la URL. Recargar cierra la sesión local de la aplicación; no guardes datos sin terminar.

No se pide ni se debe introducir una clave `sb_secret_`/`service_role`. Una publishable key no concede por sí sola acceso al personal. Si aparece “perfil de personal activo”, revisar el alta administrativa, no abrir permisos públicos.

## Flujo recomendado

1. Registrar o buscar al comprador. El destinatario se captura por separado en el pedido.
2. Crear borrador con cliente opcional, marca, canal y partidas reales. Esta primera versión no consulta ni edita Sheets: escribir el nombre y precio acordados.
3. Abrir el borrador y completar fecha, franja, zona, domicilio si se necesita, dedicatoria y envío acordado.
4. Cotizar partidas y envío antes de cambiar a Confirmado. El estado no confirma capacidad de entrega automáticamente.
5. Registrar cada anticipo o devolución. Verificar solo después de comprobar la recepción/devolución real del dinero. La confirmación visual no sustituye una revisión bancaria.
6. Actualizar elaboración/entrega y cerrar sesión al terminar.

No se crea una cabecera parcial si falla una partida de la RPC. El borrador inicial y la captura posterior de entrega son pasos separados e intencionales: crear borrador no promete guardar datos de entrega todavía no introducidos.

## Errores y duplicados

- El botón se bloquea mientras se procesa una operación. Los borradores y movimientos conservan una clave idempotente **en memoria** para reintentar la misma solicitud en esa pestaña.
- Si una creación de borrador falla con resultado incierto, sus campos quedan bloqueados para que Reintentar reutilice la misma clave y contenido. Revisar Pedidos antes de “Descartar intento”.
- Un cobro con respuesta incierta mantiene sus datos bloqueados y puede reenviarse con la misma clave. Una respuesta de duplicado se comprueba buscando esa clave; no se crea un segundo cobro.
- Recargar/cerrar la pestaña pierde las claves pendientes: revisar el listado antes de volver a capturar una operación. No se promete idempotencia entre sesiones.
- Las actualizaciones de seguimiento y partidas comprueban `updated_at`. Si otra sesión editó el registro, recargar su detalle antes de intentarlo de nuevo.
- Los mensajes del panel no reproducen detalles crudos de errores del servidor, que podrían contener datos de clientes.

## Seguridad y límites de esta versión

Los datos reales solo se consultan tras login y perfil activo, y la base aplica RLS. La pantalla de acceso y `noindex` no sustituyen esos permisos. El panel no registra datos personales en analítica, URL o almacenamiento persistente. Incluye una CSP local para restringir scripts y conexiones; la configuración final de cabeceras del hosting se revisa al autorizar su publicación.

El flujo TOTP del SDK está preparado, pero la obligatoriedad de MFA a nivel de RLS no se añadió a las migraciones: no se afirma que toda operación de base de datos exija `aal2`. Debe decidirse y probarse antes de imponer esa política.

Antes del uso operativo: probar login real, revocación de personal, errores de red y cambios simultáneos; revisar el aviso de privacidad, respaldos y acceso del personal. No se validó el correo o contraseña del propietario ni se escribió en su proyecto remoto.

El navegador de automatización no estuvo disponible durante esta entrega. **Queda pendiente la revisión visual en móvil y escritorio y el recorrido real del DOM**. Las pruebas de SDK/HTTP usan una API ficticia; no prueban RLS ni firmas de JWT. La suite SQL prueba RLS separadamente con PostgreSQL embebido, según `BACKEND-SUPABASE.md`.

## Pruebas reproducibles

```powershell
node --test tests/*.test.cjs
$env:FLORIST_PGLITE_PATH = Join-Path (Get-Location) 'artifacts/backend-test-runtime/package/dist/index.cjs'
node scripts/test-backend.cjs
```

La prueba del SDK inicia un servidor HTTP exclusivamente en localhost, con puerto libre y cuentas sintéticas `.invalid`, y lo termina al concluir. No utiliza la URL o clave del propietario. Para pruebas manuales con datos ficticios:

```powershell
# Terminal 1: web local
node scripts/serve.cjs
# Terminal 2: API ficticia; no iniciar si ya está funcionando Supabase local en ese puerto.
node tests/fixtures/admin-api.cjs
```

En el panel usar `http://127.0.0.1:54321`, `sb_publishable_fixture`, `admin-fixture@example.invalid` y cualquier contraseña de prueba. Esta API devuelve un usuario sintético: **no implementa autenticación real ni RLS y no debe publicarse o usarse con datos reales**. Sus registros viven en memoria y desaparecen al detenerla. No expone puertos externos.

Comprobaciones de aceptación manual pendientes:

- Login correcto e incorrecto y cuenta sin perfil/inactiva; segundo factor cuando corresponda.
- Registrar cliente, borrador de varias partidas, completar entrega y editar precio antes de confirmar.
- Confirmar solo con cotización completa; revisar saldo con anticipo y devolución.
- Operador no verifica cobros; administrador sí, después de comprobación manual.
- Mensajes claros al perder conexión; no duplicar al reintentar.
- Logout/recarga retiran datos y sesión de la interfaz.
- Teclado, foco visible y ausencia de desbordamiento a 320, 390, 768 y 1440 px.

## Publicación futura

No ejecutar push o merge todavía. El panel y sus recursos no están en `deploy-manifest.json`, no se enlazan desde la web pública ni se empaquetan en la entrega comercial. Las exclusiones de GitHub Pages deben regenerarse/revisarse antes de cualquier publicación futura: `_config.yml` actual no constituye una exclusión automática de archivos nuevos.

Publicar el panel requerirá autorización y decidir qué archivos se sirven. No publicar `supabase/`, fixtures, SDK de pruebas ni archivos con datos de clientes. La licencia del SDK se conserva junto con las fuentes. No introducir claves reales privadas en Git ni al generar el sitio.
