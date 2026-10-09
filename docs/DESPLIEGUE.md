# Desplegar sin publicar fuentes privadas

El propietario autorizó publicar esta versión en GitHub Pages el 8 de octubre de 2026. El sitio usa la raíz de `main` y el dominio `aurealidiaflorist.com`, conservando la configuración existente. No requiere PHP, base de datos ni Node en el hosting. El proceso de generación utiliza Node localmente.

## Antes de publicar

1. WhatsApp `525618689260` confirmado por el propietario; `whatsappVerified=true`. Si cambia, verificar nuevamente. No envíes pedidos de prueba a clientes.
2. Aviso preparado por encargo del propietario con identidad y domicilio del negocio proporcionados; contacto de privacidad por WhatsApp. Ver `docs/PRIVACIDAD.md` para mantener el texto y atender solicitudes. `privacy.reviewed=true` representa revisión del texto con estos datos, no una certificación legal ni verificación de la operación.
3. Revisa los 20 productos y precios importados. “Centro de Mesa Elegante” conserva $999 desde Sheets; se retiró la discrepancia del botón de $799. Confirma ese precio y cualquier cambio comercial.
4. Mantén vigentes fotografías, descripciones, cobertura, políticas de cambios/cancelación y perfiles sociales; no publiques ejemplos ni datos pendientes como reales. El domicilio confirmado figura en privacidad; no se añadieron horarios.
5. Si quieres medir campañas, configura los IDs reales y prueba consentimiento, eventos y ausencia de duplicación en las cuentas de GA4/Meta. Si están vacíos, el sitio funciona sin medición.

Ejecuta:

```powershell
node scripts/build.cjs
node --test tests/*.test.cjs
node scripts/check-release.cjs
```

El último comando debe terminar sin pendientes de configuración; ahora pasa con los datos confirmados y el aviso preparado. No cambia ni publica archivos en el hosting. El propietario informó que revisó la configuración de despliegue el 8 de octubre de 2026; esta declaración no equivale a un despliegue ejecutado por el agente.

El control comprueba también las huellas de fuentes y archivos públicos: si editaste datos, plantillas o un HTML generado después del build, exige regenerar. En una copia/checkout nuevo puede ser necesario ejecutar build por normalización de finales de línea.

## Qué subir

`deploy-manifest.json` enumera solo archivos públicos. **Sube exclusivamente esos archivos**, manteniendo carpetas y nombres. No subas `.git`, `.env`, fuentes administrativas, pruebas, documentación, `catalog-source.json`, `data/products.json`, `site.config.json` ni contratos de backend. El archivo público de catálogo es `data/catalog.json`, con productos publicados únicamente.

En este repositorio, GitHub Pages ya publica `main` mediante Jekyll. El build genera `_config.yml` para excluir del sitio todo archivo ajeno al manifiesto, incluidos directorios de mantenimiento y archivos de configuración. También conserva `CNAME`. **No añadir `.nojekyll`**: desactivaría las exclusiones. Las fuentes permanecen en el repositorio público, aunque no se sirvan bajo el dominio; nunca guardar datos de clientes ni secretos en Git.

Para actualizar posteriormente: editar productos/configuración, ejecutar build, pruebas y check de release, revisar los cambios y subir a `main` los fuentes y archivos generados. Pages recompila y publica automáticamente. El generador del catálogo no se ejecuta en el hosting: no basta con cambiar `data/products.json` sin regenerar las páginas. Consultar el resultado en la pestaña Actions antes de dar la actualización por terminada.

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
