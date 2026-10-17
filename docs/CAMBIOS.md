# Cambios y verificación — versión comercial local

## Orden inicial aleatorio del catálogo

El selector inicia en Aleatorio. Se mezcla el catálogo una vez por apertura, conservando ese orden al filtrar, cargar más o volver desde orden por precio. Se mantienen Nombre, Precio: menor a mayor y Precio: mayor a menor. Si sessionStorage está disponible, se recuerda solo el primer ID por ocasión en esa pestaña para evitar que vuelva a encabezar la siguiente apertura cuando haya alternativas; sin almacenamiento, la mezcla funciona igualmente. No se guardan datos del cliente ni se cambia el catálogo fuente.

Fuentes: `assets/catalog.js`, `assets/core.js` y selector de `scripts/build.cjs`; archivos públicos regenerados. Dos pruebas nuevas verifican mezcla sin pérdida/mutación y orden estable con filtros y precios. Se comprobó en navegador dos aperturas distintas y ambas direcciones de precio. Cambio local, sin publicación.

## Frontend editorial y experiencia de pedido (16 de octubre de 2026)

Se aplicó el plan documentado en `FRONTEND-EDITORIAL.md`: base visual refinada, tarjetas y fotografías más amplias, ficha estática/dinámica compartida, variantes reales, dedicatoria y campos de preferencias. Se corrigió la sustitución incorrecta del personalizador por el cargador de productos. Se conservaron datos, imágenes, rutas, Sheets, WhatsApp, analítica y consentimiento. Punto de recuperación local: `d1d76d9`; rama `codex/frontend-editorial-20261016`. No se publicó.

Build y 57 pruebas correctos. Se probó dedicatoria de ficha a resumen, preferencias en mensaje, errores y fotografía local con recordatorio de adjunto manual; no se enviaron pedidos. Seis páginas revisadas a 320/390/768/1440 px sin desbordamiento horizontal. Los casos con variantes y varias fotos se verificaron con fixtures aislados, pues los 20 productos actuales no contienen esas opciones.

## Conexión directa a Google Sheets (15 de octubre de 2026)

- Se verificó por HTTPS la pestaña `gid=0` de la hoja proporcionada: 20 productos reales y columnas id/name/price/image/description/category/popular/badge. No se modificó la hoja ni sus permisos.
- `assets/sheet.js` comparte entre navegador e importador la lectura y validación: encabezados actuales/españoles, disponibilidad de tres estados, publicación, modalidades, fotos, variaciones e IDs/URLs estables. La respuesta se procesa con JSON.parse, sin eval ni scripts remotos. La consulta no envía credenciales ni referrer.
- `assets/live-catalog.js` y `assets/catalog-view.js` cargan la hoja y actualizan inicio, catálogo, fichas y datos de la solicitud. Nuevas filas tienen ficha dinámica en `arreglo.html`; las URLs individuales existentes siguen funcionando. Se conservaron optimización de fotos existentes, filtros, paginación y eventos deduplicados.
- En caso de fallo se muestra un aviso y el respaldo publicado, sin afirmar disponibilidad actual. Disponible=No sigue bloqueado. El flujo revalida los datos al abrir una solicitud. La columna Disponible aún no existe en la hoja, por lo que se mantiene consulta de disponibilidad.
- Se actualizó el importador local para compartir la conversión y guardar respaldo. Se importó la hoja actual al respaldo y se regeneraron páginas/manifiesto. No se publicaron cambios ni se configuró una automatización de despliegue.
- Las altas aparecen en el navegador sin regenerar. Para su URL estática, sitemap y vistas previas de redes se mantiene el proceso importación/build/publicación. La vista genérica tiene noindex; sin JavaScript se ve la copia estática.
- Se documentó el procedimiento en `CATALOGO-GOOGLE-SHEETS.md`, README, administración y despliegue. El aviso describe la conexión funcional a Google y lleva fecha del 15 de octubre.
- Compilación correcta y 50 pruebas aprobadas. Cobertura adicional de datos reales, nuevos registros, encabezados, disponibilidad/estados, errores y HTML escapado, lectura sin credenciales y fallback. Navegador: origen Google Sheets confirmado, filtro por nombre, ficha y flujo completo hasta resumen con precio $1,299 de Amor Eterno, sin abrir ni enviar el WhatsApp. Catálogo sin desbordamiento a 320/390/768/1440 px y sin errores JS observados. Captura local `artifacts/catalogo-google-sheets-movil.png`.

## Sistema de diseño y nuevo selector de disponibilidad

- Se actualizó `design.md` con referencia observada, propuestas, tokens con contraste calculado, tipografía y CSS de ejemplo, componentes, arquitectura, criterios de aceptación y fases de implementación. El rediseño completo queda documentado para una fase posterior.
- La columna de trabajo del Excel se llama Disponible y admite Sí/No/Disponibilidad. Se conservaron nombres, precios, fotografías, descripciones, IDs y URLs reales. No se confirmó disponibilidad inexistente: los 20 arreglos parten de Disponibilidad.
- El importador acepta también Si sin acento y formatos anteriores. Se importó el XLSX al catálogo normalizado con respaldo y se regeneraron las páginas. El navegador consume el JSON generado, no el archivo administrativo.
- No muestra «No Disponible» en gris y bloquea solicitud; Sí permite solicitud; Disponibilidad cambia los CTA de catálogo, ficha y envío final a «Preguntar por disponibilidad», y el mensaje preparado consulta disponibilidad. Se conserva el flujo en tres pasos y se muestra disponibilidad en el resumen.
- Se aprobaron 43 pruebas. Se verificó catálogo móvil a 390 px y flujo completo de consulta hasta el resumen, sin enviar mensajes. El resumen no presenta desbordamiento a 320/390/768/1440 px y no mostró errores JavaScript. Evidencia local en `artifacts/consulta-disponibilidad-movil.png`.
- Las dos hojas del Excel se renderizaron y revisaron. Se actualizaron las instrucciones de administración. No se cambiaron credenciales ni se publicó en GitHub Pages.

## Catálogo con Excel y disponibilidad (octubre de 2026)

- Se agregó `admin/catalogo.xlsx` con los 20 productos reales, desplegables y guía. No se añadieron productos inventados. La disponibilidad inicial es Por confirmar hasta que el negocio la revise.
- `scripts/read-xlsx.py` y `scripts/import-excel.cjs` validan el archivo antes de importar, conservan los IDs y variaciones, rechazan fórmulas y datos inválidos y generan respaldo al aplicar. `Actualizar catalogo.cmd` permite actualizar las páginas localmente sin editar código.
- No disponible mantiene tarjeta y ficha en gris, con etiqueta visible; elimina su botón de solicitud y bloquea el formulario incluso con enlace directo. Disponible permite solicitar, sujeto a confirmación comercial.
- Las carpetas administrativas y de entregables quedan excluidas de GitHub Pages. Esta fase no se ha publicado.
- `docs/PROMPT-DESIGN.md` contiene el prompt solicitado basado en la referencia botánica editorial; no copia sus promesas comerciales.
- Verificación: build y control de configuración correctos; 41 pruebas aprobadas, incluyendo importación real del Excel, validaciones, altas/retiros, formulario con enlace directo y generación de la ficha no disponible. Las dos hojas del Excel se revisaron mediante imágenes renderizadas.

## Respaldo y decisiones

- Commit inicial `af9c631` conserva los 28 archivos originales. Se inició Git y se realizó la excepción de propiedad solo por comando. No se cambiaron credenciales ni configuración global.
- Se mantuvo arquitectura estática, identidad rosa/salvia, tipografía serif y fotografías existentes. Se sustituyeron plantillas duplicadas por generación común para evitar discrepancias. No se adoptó framework ni CMS nuevo.
- Se retiraron de presentación pública provisional testimonios, trayectoria, estadísticas, badges de popularidad/promoción, dirección, horarios y redes inconsistentes porque no hay confirmación. El contenido no se perdió: está en Git. El mapa sin dirección verificada y newsletter sin servicio real no se publican.
- Se conservan descripciones y precios de las 20 filas originales. Se muestran como referencias, sin prometer disponibilidad. El centro de mesa usa $999 desde Sheets y no el $799 del botón contradictorio.

## Funcionalidades

- Inicio y navegación móvil con dos rutas comerciales claras; CTA persistente de consulta.
- Catálogo estático indexable, filtros combinados, presupuesto, búsqueda y ordenamiento. Ocasiones sin datos muestran estado vacío con alternativa personalizada. Se estructuraron las flores y colores mencionados explícitamente en los nombres/descripciones originales, sin deducir características desde fotografías. No hay variaciones inventadas.
- 20 fichas individuales con precio, descripción, aviso de variación de flores y solicitud. Infraestructura para variaciones explícitas.
- Formulario común en tres pasos: arreglo/presupuesto/foto local; entrega/dedicatoria/notas; resumen editable y WhatsApp. No exige datos personales innecesarios ni solicita pago.
- Mensaje codificado de manera íntegra y referencia AL para conciliación manual. Foto no adjuntada automáticamente. No hay bots ni confirmaciones ficticias.
- GA4/Meta configurables, consentimiento, atribución UTM y marca, deduplicación y eventos de contacto/lead. Sin IDs configurados, no hay medición externa. No hay evento de compra.
- HTML semántico, nombres accesibles, errores por campo, enfoque de pasos, teclado, reducción de movimiento y contraste reforzado.
- WebP en tres tamaños, lazy loading, dimensiones, srcset y recursos locales. Se eliminó carga de Tailwind CDN, Anime, Splide, Typed y fuentes de terceros del runtime nuevo. Los originales se conservan.
- SEO estático: canonical, OG, Product/BreadcrumbList, sitemap, robots y 404.

## Archivos

Modificados: las cinco páginas originales, `main.js`, `catalogo.js`.

Agregados: `solicitud.html`, `privacidad.html`, `terminos.html`, `404.html`, `arreglos/*.html`, `robots.txt`, `sitemap.xml`; `site.config.json`, `data/products.json`, `data/catalog.json`, `data/images.json`, `catalog-source.json`; `assets/*`, `scripts/*`, `tests/*`, `domain/contracts.d.ts`, `deploy-manifest.json`, `package.json`, `.gitignore`, `README.md`, `docs/*`, `resources/optimized/*`.

Los archivos generados se mantienen para servirlos directamente en el hosting actual. Los originales de imágenes y documentos de diseño permanecen. No se publicó, no se modificó la hoja ni se creó suscripción.

## Pruebas automatizadas

Ejecutar `node scripts/build.cjs` y `node --test tests/*.test.cjs`.

Cobertura crítica: esquema de catálogo, filtros combinados, borradores/retirados, importación y errores, variaciones, fecha CDMX y fechas inválidas, presupuesto, código postal, alcaldía/municipio, campos extensos, codificación de WhatsApp, indicación honesta de fotografía, UTM, scripts sin consentimiento, inicialización por plataforma, deduplicación, exclusión de datos personales y ausencia de compras. Validación de títulos, un h1, enlaces/recursos, JSON-LD, sitemap, JavaScript y precios comunes.

Los IDs de analítica usados en tests están aislados en memoria con proveedores simulados y no se escriben en configuración real.

## Limitaciones de verificación

Los envíos a WhatsApp se prueban hasta el mensaje preparado, sin enviar pedidos reales. El propietario confirmó el número oficial; no se verifican atención operativa, disponibilidad, precios vigentes, costos reales de entrega ni los identificadores/cuentas de medición. No hay datos de campo de Core Web Vitals ni métricas de ventas para prometer mejoras.

El propietario confirmó WhatsApp y aportó los datos necesarios para el aviso; el control de configuración mínima ya pasa. El aviso y su procedimiento operativo se documentan en `docs/PRIVACIDAD.md`. El propietario informó que revisó el despliegue; no se publicó ni fusionó automáticamente.

## Resultado final de revisión local

- Build correcto y 36 pruebas automatizadas aprobadas, incluyendo bloqueo ante identidad o domicilio incompletos, protección frente a inyección HTML y exclusión de fuentes administrativas en GitHub Pages. Sin dependencias npm.
- Navegación móvil operativa y filtros combinados de tipo/presupuesto, así como ocasión/presupuesto/flor/color. Se corrigió también el servidor local que inicialmente no servía los JS de raíz; la revisión final sí ejecuta todos los scripts.
- Flujo de ficha → solicitud CDMX → errores de entrega → resumen válido → enlace codificado. No se abrió ni envió un pedido real a WhatsApp.
- Flujo personalizado con municipio de Edomex y horario flexible; marca Jardín Eterno y campaña conservadas en el mensaje. Referencia no publicada bloquea el formulario y ofrece volver a elegir.
- Foto existente elegida como referencia de prueba: vista previa blob local, aviso de adjunto manual, ninguna carga de archivo al servidor.
- Inicio comprobado a 320, 390, 768 y 1440 px; contacto, nosotros, personalizador y solicitud también a 320 px; catálogo/ficha/flujo a 390 px. Sin desbordamiento horizontal en esas vistas, sin imágenes rotas ni errores JavaScript en la inspección final.
- Medición externa ausente con IDs vacíos; consentimiento, rechazo, revocación y deduplicación verificados mediante proveedores simulados en pruebas. Cuentas reales pendientes de configuración.
- Hero original: 1,092,042 bytes. Derivados WebP: 15,636 bytes (400), 45,902 bytes (800), 70,472 bytes (1200). No se atribuye una puntuación de Core Web Vitals a esta reducción.
- Las imágenes remotas de Cloudinary existentes conservan sus URLs HTTPS. No se descargaron ni crearon transformaciones o servicios nuevos. Su disponibilidad y optimización requieren revisión al ampliar la galería; el importador admite tanto referencias remotas como archivos locales.
- Capturas locales en `artifacts/inicio-escritorio.jpg`, `artifacts/inicio-movil.jpg` y `artifacts/solicitud-movil.jpg`. No se incluyen en despliegue.
