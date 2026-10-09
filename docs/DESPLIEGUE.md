# Desplegar sin publicar fuentes privadas

El despliegue sigue pendiente; no se publicaron cambios automáticamente. Esta versión es para un hosting estático en la raíz de `aurealidiaflorist.com`. No requiere PHP, base de datos ni Node en el hosting. El proceso de generación sí utiliza Node localmente.

## Antes de publicar

1. Confirma con el negocio el WhatsApp `525618689260` y marca `whatsappVerified=true`. Se verificó formato y consistencia predominante con el sitio existente, no titularidad del número. No envíes pedidos de prueba a clientes.
2. Completa el responsable, domicilio del responsable, contacto y procedimiento de derechos en `privacy` y revisa el aviso integral, finalidades, conservación operativa y políticas comerciales con quien corresponda. `privacy.reviewed=true` debe representar una revisión real. El control técnico no certifica cumplimiento legal.
3. Revisa los 20 productos y precios importados. “Centro de Mesa Elegante” conserva $999 desde Sheets; se retiró la discrepancia del botón de $799. Confirma ese precio y cualquier cambio comercial.
4. Confirma fotografías, descripciones, cobertura, políticas de cambios/cancelación y perfiles sociales; no publiques ejemplos ni datos pendientes como reales. No hay dirección comercial pública ni horarios inventados.
5. Si quieres medir campañas, configura los IDs reales y prueba consentimiento, eventos y ausencia de duplicación en las cuentas de GA4/Meta. Si están vacíos, el sitio funciona sin medición.

Ejecuta:

```powershell
node scripts/build.cjs
node --test tests/*.test.cjs
node scripts/check-release.cjs
```

El último comando debe terminar sin pendientes de configuración. Actualmente falla intencionalmente por WhatsApp y aviso de privacidad. No cambia ni publica archivos en el hosting.

El control comprueba también las huellas de fuentes y archivos públicos: si editaste datos, plantillas o un HTML generado después del build, exige regenerar. En una copia/checkout nuevo puede ser necesario ejecutar build por normalización de finales de línea.

## Qué subir

`deploy-manifest.json` enumera solo archivos públicos. **Sube exclusivamente esos archivos**, manteniendo carpetas y nombres. No subas `.git`, `.env`, fuentes administrativas, pruebas, documentación, `catalog-source.json`, `data/products.json`, `site.config.json` ni contratos de backend. El archivo público de catálogo es `data/catalog.json`, con productos publicados únicamente.

Para generar una carpeta de entrega después de resolver pendientes:

```powershell
node scripts/package-release.cjs
```

El empaquetador ejecuta el control de configuración, exige una carpeta de destino nueva y copia el manifiesto a `release/`. No tiene red, no modifica el hosting y no borra archivos. Si ya existe, usa un nombre nuevo: `node scripts/package-release.cjs release-revision-2`.

Haz una copia del sitio en el hosting antes de reemplazarlo. Conserva las rutas existentes `/catalogo.html`, `/personalizar.html`, `/nosotros.html`, `/contacto.html`. Las fichas viven en `/arreglos/nombre-id.html`. No necesitan reglas de reescritura. Configura el hosting para servir `index.html` y devolver `404.html` con **estado HTTP 404** en URLs inexistentes.

HTTPS debe estar activo. Recomendaciones de cabeceras del hosting: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Configura CSP según los dominios de imágenes y proveedores que realmente habilites; no copies una política que bloquee WhatsApp, fotos o analítica sin probarla. El sitio no requiere iframes ni scripts inline ejecutables.

Sirve HTML, JSON y JS con revalidación o caché corta; imágenes optimizadas pueden tener caché más larga. Las rutas de recursos no tienen hash, por lo que al reemplazar fotografías hay que invalidar caché o usar nombres nuevos. No caches el catálogo durante días si modificas precios. No añadas service worker que deje precios obsoletos.

## Después de publicar manualmente

Comprueba navegación, filtros, enlaces directos a fichas, formulario, mensaje y foto manual. Prueba CDMX y municipio de Edomex. Revisa 320, 390, 768 y 1440 px, teclado y lector de pantalla. Asegura que no existe scroll horizontal ni solicitudes a proveedores antes del consentimiento. Revisa que archivos privados no sean accesibles.

Verifica canonical, Open Graph, sitemap y robots en el dominio real. Envía sitemap a Search Console si tienes acceso. Mide Lighthouse/PageSpeed y datos de campo de Core Web Vitals; la reducción de bytes local no permite afirmar una puntuación ni garantizar resultados SEO o ventas.

Si falla producción, restaura la copia anterior del hosting; conserva primero la nueva versión para investigar. No se configuró ningún servicio de despliegue ni costo recurrente.
