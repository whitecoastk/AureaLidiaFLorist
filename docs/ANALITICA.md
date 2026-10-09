# Medición y consentimiento

Configura identificadores reales en `site.config.json`: `ga4Id` con formato `G-…` y `metaPixelId` numérico. Ambos están vacíos; no se usa ningún ID de prueba en producción. Ejecuta build después de cambiarlos. Los IDs de medición son públicos; nunca agregues tokens de API o claves privadas aquí.

Los scripts externos solo se cargan con consentimiento opcional aceptado. Sin consentimiento, el catálogo y formulario funcionan; no se envían eventos ni se persiste atribución de campaña. La elección se conserva 180 días como preferencia necesaria. Rechazar detiene inicialización; revocar intenta eliminar cookies accesibles de proveedores y recarga la página. Las cookies inaccesibles del proveedor deben gestionarse también conforme a sus políticas. El banner inicial solo aparece cuando hay al menos un proveedor configurado; las preferencias siguen accesibles desde el pie.

Antes del consentimiento, los UTM válidos se propagan en enlaces internos y se usan temporalmente en la pestaña. Si se acepta, la atribución se conserva en `sessionStorage` durante esa sesión. No se almacena contenido del formulario. Una campaña explícita nueva reemplaza la atribución previa. URLs con parámetros personales no se envían a GA4; antes de cargar Meta se limita la URL a parámetros aprobados, pues Meta lee la URL automáticamente. `gclid` y `fbclid` no se conservan en esta versión; la atribución preparada se basa en UTM.

## Eventos

| Acción | GA4 | Meta | Significado |
| --- | --- | --- | --- |
| Página | `page_view` | `PageView` | Una visita por carga con consentimiento |
| Lista de catálogo | `view_item_list` | personalizado `view_item_list` | Resultados mostrados; IDs de productos |
| Abrir ficha desde tarjeta | `select_item` | personalizado `select_item` | Selección de referencia |
| Ficha | `view_item` | `ViewContent` | Visualización del arreglo |
| Avanzar tras presupuesto válido | `begin_checkout` | `InitiateCheckout` | Inicio de solicitud, sin compra |
| Revisar formulario válido | personalizado `form_complete` | personalizado `form_complete` | Formulario completo local, no recibido por el negocio |
| Abrir enlace del resumen | `generate_lead` | `Lead` | Intención de solicitar por WhatsApp |
| Abrir WhatsApp | personalizado `contact` | `Contact` | Contacto, no compra |

`generate_lead` y `contact` describen aspectos diferentes de la misma apertura; **no se suman como dos solicitudes**. Cuenta `generate_lead` por `request_id` para el embudo. Cada acción se deduplica dentro de la página; reabrir una solicitud después de recargar es una nueva intención. Las vistas de lista usan la combinación de filtros y cantidad visible; no se afirma exposición en viewport individual de todas las tarjetas. No hay evento `purchase` ni `Purchase`.

Los eventos de formulario no se recuperan retrospectivamente si se rechazó el consentimiento al hacer clic. Si se acepta antes de abrir WhatsApp, la solicitud futura puede medirse. Nunca se envía dedicatoria, zona, fotografía, nombre, correo ni teléfono de cliente a estas herramientas. La propiedad `request_id` es una referencia aleatoria; no identifica a una persona por sí sola.

## Evitar duplicaciones desde las cuentas

No instales otro Pixel, plugin de analítica o Google Tag Manager que vuelva a disparar estos eventos. En GA4 desactiva medición automática de formularios y clics salientes que duplique este flujo; revisa también medición de vistas de página/historial. En Meta desactiva reglas de eventos automáticas y configuraciones creadas con la herramienta de eventos que cuenten el botón como compra. El código deshabilita autoConfig y no utiliza coincidencia avanzada.

Usa herramientas de prueba oficiales para validar IDs reales: GA4 DebugView/Realtime y Meta Test Events. Esas cuentas no se han comprobado aquí porque no están configuradas. Configura dimensiones personalizadas si deseas reportar `brand`, `request_id`, `flow` y los UTM conservados. No publiques datos de clientes en etiquetas de campaña.

## Enlaces de campaña

Áurea Lidia:

```text
https://aurealidiaflorist.com/?utm_source=instagram&utm_medium=paid_social&utm_campaign=nombre_real_de_campana
```

Jardín Eterno CDMX:

```text
https://aurealidiaflorist.com/?marca=jardin-eterno-cdmx&utm_source=facebook&utm_medium=paid_social&utm_campaign=nombre_real_de_campana
```

Son plantillas de URL, no campañas existentes. `marca=jardin-eterno-cdmx` conserva Áurea Lidia como marca de la web e identifica procedencia en solicitud y analítica. Preserva también `utm_content` y `utm_term` si son etiquetas válidas. Solo se aceptan valores de hasta 100 caracteres con letras, números y separadores sencillos; no correos ni HTML.

## Conciliar con ventas

Conserva la referencia en el mensaje de WhatsApp y el registro operativo privado. Una segunda versión puede relacionar ese registro con una cotización aceptada y un pago verificado. Solo entonces emitir conversiones reales con deduplicación y consentimiento aplicable. La web actual no confirma recepción ni dispone de backend para sincronizar ventas.
