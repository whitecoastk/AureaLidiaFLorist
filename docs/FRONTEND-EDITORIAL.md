# Frontend editorial y experiencia de pedido

Actualización del 16 de octubre de 2026. Cambios locales sobre la arquitectura existente. No se publicó en producción.

## Análisis y plan aplicado

Se revisaron la web pública de Áurea Lidia, las fuentes del proyecto y la referencia de Stitch en `https://e5510bb2-jard-n-eterno-florist-website.netlify.app/`. El navegador permitió ver su fotografía protagonista, miniaturas seleccionables, jerarquía tipográfica, opciones de volumen/presentación y composición de dos columnas. Se tomaron esos patrones de interfaz como orientación, conservando marca, fotos y condiciones reales de Áurea Lidia.

El proyecto sigue usando generación estática con Node, CSS local y JavaScript sin framework. Se reutilizaron las plantillas, cabecera y pie, catálogo y filtros, imágenes WebP, estados comerciales, tres pasos del formulario, validación, consentimiento y analítica. No se cambió el backend ni la fuente de Google Sheets.

Los principales riesgos eran la duplicación de fichas estáticas/dinámicas, perder selección/dedicatoria al cargar datos o cambiar de página, romper disponibilidad y añadir opciones sin respaldo comercial. La revisión encontró además que el cargador dinámico podía confundir el diseño de dos columnas del personalizador con una ficha. Se añadió una salida temprana cuando no existe referencia de producto.

Se creó la rama local `codex/frontend-editorial-20261016` y el commit de recuperación `d1d76d9`, antes de editar el frontend. Guarda todo el trabajo anterior del proyecto. No se ejecutó push ni despliegue.

Orden aplicado: unificación de fichas y recuperación; refinamiento visual y móvil; dedicatoria/preferencias; pruebas automatizadas y revisión de navegador. Los HTML se regeneraron desde las plantillas.

## Archivos y finalidad

| Fuente | Cambio |
| --- | --- |
| `assets/styles.css` | Tokens marfil/rosa/salvia/verde, escala serif, aire editorial, cabecera con cobertura, tarjetas y fotos más grandes, variantes, galería, formularios y breakpoints |
| `assets/catalog-view.js` | Un único componente de ficha para build y navegador. Galería accesible, opciones de variantes reales, precio inicial de la opción seleccionada, dedicatoria opcional, condiciones y CTA |
| `assets/product.js` | Nuevo comportamiento delegado para variantes y dedicatoria. Se mantiene al sustituirse la ficha durante la carga de Sheets |
| `assets/live-catalog.js` | Usa la misma ficha, conserva dedicatoria y opción seleccionada al refrescar datos, marca miniatura activa y evita sustituir la página de personalización |
| `assets/core.js` | Valida preferencias y las incorpora al mensaje. Consume una dedicatoria temporal una sola vez, para el mismo ID y con vigencia de diez minutos |
| `assets/order.js` | Precarga dedicatoria, recoge preferencias, valida y presenta resumen; conserva foto local y tres pasos |
| `scripts/build.cjs` | Reutiliza ficha compartida; añade accesos por ocasión, campos de preferencias, barra de cobertura y script de producto al manifiesto y control de integridad |
| `scripts/privacy.cjs` | Explica el traslado temporal de la dedicatoria en la misma pestaña y los campos de preferencias |
| `tests/frontend.test.cjs` | Regresiones críticas de variantes, galería, dedicatoria, preferencias y personalizador |

Páginas generadas: inicio, catálogo, fichas individuales y genérica, solicitud, personalizador, páginas informativas y legales. También se actualizaron manifiesto y huellas de construcción. El catálogo, los precios, IDs, URLs, fotografías, configuración y conexión a Sheets se conservaron.

## Decisiones visuales

- Fondo marfil `#FAF8F4`, crema `#F2EDE6`, rosa `#F2E4E3`, salvia clara `#E9EEE6`, verde principal `#304D3B`, texto `#29392F` y secundario `#566257`. Mantiene la familia cromática de Áurea Lidia con más contraste en acciones y lectura.
- Contrastes calculados de colores sólidos: texto/marfil 11.51:1, secundario/crema 5.50:1, blanco/verde 9.33:1 y acento/marfil 6.81:1. Borde funcional sobre blanco: 3.24:1. Se mantienen los datos Product y BreadcrumbList al actualizar fichas desde Sheets.
- Georgia para títulos y system-ui para texto. Sin descargas de fuentes ni nuevas dependencias.
- Radios de 4–6 px, líneas discretas y espacios fluidos. Fotos completas en ficha con object-fit:contain; recorte editorial explícito en tarjetas.
- Tarjetas en una columna hasta 520 px para que fotos, precio y botón tengan espacio; dos columnas en tamaños intermedios, tres cuando hay ancho suficiente.
- Hover solo con puntero fino; movimiento de 3 px y zoom suave. `prefers-reduced-motion` elimina transformaciones y transiciones. El contenido nunca depende de una animación para aparecer.
- El acceso general flotante pasa al final de página en móvil para no tapar formularios ni botones. El CTA de cada producto permanece junto a sus condiciones.
- Controles amplios, etiquetas visibles, foco, semántica nativa de fieldset/radio, aria-pressed en miniaturas y precio aria-live. No se añadieron carruseles, cuentas ni carrito.

## Productos, variantes y galería

En la copia real revisada hay 20 productos, una imagen por producto y ninguna variación definida. Por tanto no se muestran miniaturas ni tamaños/precios ficticios. Cuando `images` tenga más fotografías, se mostrarán miniaturas con selección activa. Cuando `variations` contenga opciones válidas, se mostrarán radios con `label`, `price` y `priceType` reales.

El esquema actual ofrece variantes completas. El nombre de cada opción puede describir el tamaño, número de flores y presentación que el negocio haya definido. No se crean dimensiones ni suplementos independientes, y elegir una opción actualiza su precio estimado y transmite su ID al formulario. Para definir nuevas variantes usa el formato ya documentado en la administración de Sheets.

Los tres estados siguen vigentes: Sí permite solicitar, No muestra gris y bloquea, Disponibilidad invita a preguntar. El formulario vuelve a consultar la fuente al iniciar. No se garantiza stock, precio final ni entrega.

## Dedicatoria y personalización

La dedicatoria de la ficha es opcional, hasta 500 caracteres. Al continuar, se pasa mediante sessionStorage de la misma pestaña, asociada al ID del producto. Se elimina al leerla; una entrada caducada, corrupta, futura o de otro producto se descarta. No viaja en la URL ni se añade a eventos. Si el navegador bloquea almacenamiento, se conserva el texto en la ficha y se ofrece continuar para escribirlo después.

La solicitud añade flores, colores y tamaño/presentación preferidos, cada uno opcional y hasta 160 caracteres. Son preferencias abiertas para cotizar, no variantes comprables ni cargos. Aparecen en el resumen y mensaje de WhatsApp. Se conserva presupuesto, fecha, horario, zona, dedicatoria y notas.

La imagen de referencia sigue siendo un blob local: no se carga a ningún servidor y se avisa que debe adjuntarse manualmente en WhatsApp. No se creó almacenamiento externo, bot ni pago. Los eventos de lead/contacto no se convierten en compras.

## Validación

- Build correcto y 57 pruebas automatizadas aprobadas. Se conservaron las pruebas anteriores de catálogo, importación, disponibilidad, WhatsApp, consentimiento, SEO y distribución.
- Las opciones y galería con múltiples imágenes se probaron con fixtures aislados en memoria, sin añadir productos u opciones de ejemplo al catálogo real. Se verificó el cambio de precio y enlace de variante, selección de miniatura y ausencia de solicitud para No disponible.
- Navegador: inicio → catálogo → ficha real → dedicatoria → solicitud → errores de entrega → resumen completo y mensaje codificado. No se abrió ni envió un pedido real a WhatsApp.
- Flujo personalizado: presupuesto y preferencias, foto real de prueba previsualizada como blob, fecha y zona, resumen con recordatorio de adjunto manual. No se subió la foto a un servidor.
- Inicio, catálogo, personalizador, ficha, solicitud y contacto revisados a 320, 390, 768 y 1440 px: un h1 y sin desbordamiento horizontal. Menú móvil abre/cierra y Escape devuelve el foco.
- Sin errores JavaScript observados en esas páginas. La conexión a Sheets sigue activa; no se modificó la hoja ni se publicó.

No se atribuye una puntuación de Core Web Vitals ni certificación de accesibilidad a estas comprobaciones. No hay medidas de campo de conversión. Antes de publicar, revisar las capturas, ejecutar build/test/check:release y seguir el procedimiento existente de despliegue.

## Revisión local y recuperación

```powershell
node scripts/build.cjs
node --test tests/*.test.cjs
node scripts/check-release.cjs
node scripts/serve.cjs
```

Abrir `http://127.0.0.1:4173`. El commit `d1d76d9` conserva el estado anterior; para consultar un archivo sin sobrescribir el trabajo, usar `git show d1d76d9:ruta/al/archivo`. No ejecutar reset destructivo para revisar diferencias. La publicación requiere una instrucción expresa.
