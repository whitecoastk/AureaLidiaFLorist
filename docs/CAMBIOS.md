# Cambios y verificación — versión comercial local

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

- Build correcto y 35 pruebas automatizadas aprobadas, incluyendo bloqueo ante identidad o domicilio incompletos y protección de los datos del responsable frente a inyección HTML. Sin dependencias npm.
- Navegación móvil operativa y filtros combinados de tipo/presupuesto, así como ocasión/presupuesto/flor/color. Se corrigió también el servidor local que inicialmente no servía los JS de raíz; la revisión final sí ejecuta todos los scripts.
- Flujo de ficha → solicitud CDMX → errores de entrega → resumen válido → enlace codificado. No se abrió ni envió un pedido real a WhatsApp.
- Flujo personalizado con municipio de Edomex y horario flexible; marca Jardín Eterno y campaña conservadas en el mensaje. Referencia no publicada bloquea el formulario y ofrece volver a elegir.
- Foto existente elegida como referencia de prueba: vista previa blob local, aviso de adjunto manual, ninguna carga de archivo al servidor.
- Inicio comprobado a 320, 390, 768 y 1440 px; contacto, nosotros, personalizador y solicitud también a 320 px; catálogo/ficha/flujo a 390 px. Sin desbordamiento horizontal en esas vistas, sin imágenes rotas ni errores JavaScript en la inspección final.
- Medición externa ausente con IDs vacíos; consentimiento, rechazo, revocación y deduplicación verificados mediante proveedores simulados en pruebas. Cuentas reales pendientes de configuración.
- Hero original: 1,092,042 bytes. Derivados WebP: 15,636 bytes (400), 45,902 bytes (800), 70,472 bytes (1200). No se atribuye una puntuación de Core Web Vitals a esta reducción.
- Las imágenes remotas de Cloudinary existentes conservan sus URLs HTTPS. No se descargaron ni crearon transformaciones o servicios nuevos. Su disponibilidad y optimización requieren revisión al ampliar la galería; el importador admite tanto referencias remotas como archivos locales.
- Capturas locales en `artifacts/inicio-escritorio.jpg`, `artifacts/inicio-movil.jpg` y `artifacts/solicitud-movil.jpg`. No se incluyen en despliegue.
