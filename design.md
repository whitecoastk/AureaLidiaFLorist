# Áurea Lidia: sistema editorial y botánico

**Implementación del 16 de octubre de 2026:** el refinamiento editorial y la nueva experiencia de ficha/personalización ya se aplicaron localmente. La especificación vigente de cambios, tokens implementados, límites de datos, pruebas y recuperación está en `docs/FRONTEND-EDITORIAL.md`. Las propuestas de fases de este documento corresponden al plan original y deben leerse junto con esa actualización.

Documento de diseño y plan de implementación, 9 de octubre de 2026. La guía reemplaza las recomendaciones visuales históricas de este archivo. Su copia anterior está en `artifacts/design-respaldos/design-anterior.md`. Esta fase documenta el rediseño e implementa la administración y disponibilidad; no aplica todavía el cambio visual completo ni publica el sitio.

## Referencia, alcance y arquitectura

Se inspeccionó `C:/Users/bruno/Downloads/index.html` como referencia visual. También se revisaron `scripts/build.cjs`, `assets/styles.css`, `assets/core.js`, `assets/site.js`, `assets/order.js`, `scripts/import-excel.cjs` y `data/products.json`.

| Aspecto | Observado en la referencia | Decisión para Áurea Lidia |
| --- | --- | --- |
| Color | Marfil, crema, arena, salvia y rosa apagado | Conservar la familia cromática; asignar roles según contraste |
| Tipografía | Cormorant Garamond y Jost cargadas desde Google Fonts | Comenzar con Georgia y system-ui; evaluar fuentes locales en una fase posterior |
| Composición | Contenedor de 1220 px, márgenes fluidos, texto y fotografía, líneas discretas | Adoptar proporciones editoriales sin sustituir las fotos actuales |
| Detalle | Radios de 3–6 px, sombras suaves, títulos serif y espacio amplio | Simplificar la decoración; mantener controles y precios claramente visibles |
| Marca y contenido | Jardín Eterno y afirmaciones comerciales propias del ejemplo | Áurea Lidia será la marca principal; solo usar datos confirmados del proyecto |

El proyecto es un sitio estático con HTML generado por Node, CSS local y JavaScript sin framework. No necesita CMS, nuevas dependencias de interfaz ni suscripciones. `scripts/build.cjs` genera las páginas, `data/catalog.json`, metadatos, sitemap y archivos de distribución. `assets/site.js` se integra en `main.js` y `assets/catalog.js` en `catalogo.js` durante build. Editar las fuentes, nunca los HTML generados o esos bundles directamente.

Actualización del 15 de octubre de 2026: por petición del propietario, la entrada habitual pasa a ser la hoja pública de Google Sheets configurada. El navegador consulta sus datos al abrir inicio, catálogo, ficha y solicitud. `data/products.json` sigue siendo la fuente de la copia estática/SEO y `data/catalog.json` el respaldo publicado. `admin/catalogo.xlsx` queda como alternativa local. Para filas nuevas hay una ficha dinámica hasta que se regenere su URL estática y sitemap. Consulta `docs/CATALOGO-GOOGLE-SHEETS.md`. Publicar esta integración sigue siendo una fase independiente.

## Dirección comercial y contenido

La primera pantalla debe comunicar: arreglos florales bajo pedido, personalización desde **$250 MXN**, entrega en **CDMX y algunas zonas del Estado de México**, y cierre por **WhatsApp**, sujeto a confirmación de flores, precio y entrega.

Propuesta de hero: etiqueta «Flores bajo pedido en CDMX»; título «Flores para tu momento, hechas a tu medida»; texto breve con cobertura y mínimo real; CTA principal **Explorar arreglos**, secundario **Crear mi ramo personalizado**. La foto será una fotografía propia ya incluida en el proyecto, con alt descriptivo y sin texto superpuesto que dificulte leerla. La identidad Áurea Lidia permanecerá en cabecera, títulos y datos estructurados. Jardín Eterno CDMX se conserva como segunda marca y atribución de campaña.

Orden de inicio: hero, elaboración bajo pedido/personalización/confirmación por WhatsApp, catálogo destacado con datos reales, las dos opciones comerciales, tres pasos y preguntas frecuentes. No añadir testimonios, cifras, antigüedad, promociones, flores de temporada, entrega inmediata ni fotografías del ejemplo como si fueran datos del negocio. El mínimo de personalización procede de `site.config.json`, no de cada tarjeta.

## Tokens de color y contraste

Las bases cromáticas se observaron en la referencia; sus roles y las restricciones de uso son propuestas para este proyecto. Ratios calculados con luminancia sRGB de los colores sólidos; los valores mostrados están redondeados, la validación usa el valor completo. Revalidar cuando se añada transparencia, otro fondo o un estado interactivo.

| Token propuesto | Valor | Uso |
| --- | --- | --- |
| `--paper` | `#FAF8F4` | Fondo general marfil |
| `--cream` | `#F2EDE6` | Alternancia de secciones |
| `--sand` | `#EAE3D8` | Fondos secundarios y avisos suaves |
| `--sage` | `#879584` | Acento decorativo, nunca texto normal sobre marfil |
| `--green` | `#5C6A57` | CTA principal, enlaces y etiqueta comercial |
| `--ink` | `#292B28` | Títulos, precio y texto principal |
| `--muted` | `#585B52` | Descripciones, ayudas y condiciones |
| `--rose` | `#D8B7B2` | Fondo de personalización y detalle de marca |
| `--rose-deep` | `#B98F89` | Acento decorativo; no texto claro sobre este fondo |
| `--line` | `rgba(41,43,40,.14)` | Separador decorativo; no límite único de un input |
| `--control-line` | `#5C6A57` | Borde perceptible de controles |
| `--focus` | `#292B28` | Foco con espacio marfil alrededor |
| `--unavailable-bg` | `#E5E5E3` | Superficie de arreglo no disponible |
| `--unavailable-ink` | `#484B46` | Etiqueta y texto de estado |

| Texto / fondo | Ratio | Decisión |
| --- | ---: | --- |
| Carbón / marfil | 13.46:1 | Texto y títulos |
| Verde profundo / marfil | 5.42:1 | Texto normal; también marfil sobre CTA verde |
| Verde profundo / crema | 4.93:1 | Enlaces y etiquetas |
| Verde profundo / arena | 4.51:1 | Pasa por margen pequeño; preferir carbón para texto largo |
| Texto secundario / marfil | 6.53:1 | Ayudas y condiciones |
| Salvia / marfil | 2.97:1 | No usar para texto ni para un borde esencial |
| Rosa profundo / marfil | 2.69:1 | Solo decorativo |
| Carbón / rosa | 7.71:1 | Texto en panel de personalización |
| Gris de estado / gris de fondo | 7.02:1 | Estado no disponible legible |

Meta: WCAG 2.2 AA. El texto normal requiere al menos 4.5:1 y el texto grande 3:1 según [W3C, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Mantener indicador de foco visible según [W3C, foco visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html). Un sistema de tokens no certifica por sí solo toda la web; comprobar también navegación, errores, zoom y lector de pantalla. El objetivo táctil del proyecto es 44 × 44 px como mínimo.

## Tipografía, ritmo y geometría

| Token | Propuesta |
| --- | --- |
| `--serif` | `Georgia, 'Times New Roman', serif` inicialmente |
| `--sans` | `system-ui, -apple-system, 'Segoe UI', sans-serif` |
| Título principal | `clamp(2.25rem, 5.2vw, 4.9rem)`, altura 1.08, peso 400–500 |
| H2 | `clamp(1.8rem, 3.5vw, 3.3rem)`, altura 1.15 |
| H3 | `clamp(1.35rem, 2vw, 1.75rem)`, altura 1.25 |
| Cuerpo | `clamp(1rem, 1.1vw, 1.075rem)`, altura 1.65 |
| Ayudas y condiciones | 14 px, altura 1.5; nunca ocultar condiciones con letra diminuta |
| Etiqueta editorial | 12 px, espaciado moderado `.12em`; reservar mayúsculas para frases cortas |
| Lectura | Descripciones de 50–65 caracteres por línea |
| Espacios | 4, 8, 12, 16, 24, 32, 48, 72, 112 px |
| Contenedor | 1220 px con padding incluido, `box-sizing:border-box` |
| Gutter | `clamp(16px, 5vw, 64px)`; 16 px a 320, 19.5 px a 390 |
| Sección | `clamp(48px, 7vw, 112px)`; formulario usa 24–48 px |
| Radio | 3 px botones; 6 px tarjetas, fotos y controles |
| Borde | 1 px; distinguir separador decorativo de borde funcional |
| Sombra | `0 18px 50px -32px rgba(41,43,40,.34)` solo en paneles puntuales |

La referencia carga dos familias con varios pesos y cursivas, lo que añade solicitudes y bytes y puede cambiar la composición al terminar la descarga. En la primera implementación usar fuentes del sistema, que no añaden descargas. Si luego se aprueban Cormorant Garamond/Jost, comprobar licencia y alojar WOFF2 locales con subconjunto que incluya español, solo pesos necesarios y `font-display:swap`. Medir peso real y cambios de layout; no añadir importaciones remotas ni fuentes decorativas script.

## Especificaciones de componentes

| Componente | Estructura y presentación | Estados y comportamiento |
| --- | --- | --- |
| Cabecera y navegación | Marca, enlaces existentes y acceso a catálogo; borde fino y fondo sólido | En móvil, menú con botón 44 px, `aria-expanded`, Escape cierra y devuelve foco; enlace activo con `aria-current`. No usar hover como única vía. Cabecera no debe tapar foco ni títulos |
| Hero | Texto, mínimo real, dos CTA y foto propia; dos columnas desde 1024 px | En móvil texto y CTA antes de foto; botones de ancho completo cuando no quepan. Foto principal eager con dimensiones y `srcset`; descripción y precio permanecen sin JS |
| Encabezados | Un h1 por página, h2 por sección, etiqueta opcional y descripción breve | Sin saltos de nivel; enlaces visibles y subrayados cuando estén dentro de texto |
| Ocasiones | Enlaces a filtros existentes: cumpleaños, aniversario, amor, agradecimiento, condolencias y etiquetas reales | Mostrar categorías sin atribuir características no registradas; fila envuelve, sin carrusel obligatorio. Resultado vacío ofrece limpiar filtros o personalizar |
| Tarjeta | Foto cuadrada, nombre enlazado, precio/modalidad, disponibilidad, descripción opcional, CTA siempre visible | Toda acción funciona táctil y con teclado. El cambio a gris afecta foto/superficie, no opacidad global del texto. No Disponible conserva acceso a ficha, elimina solicitud y muestra etiqueta |
| Filtros | Nombre, ocasión, tipo, presupuesto; flor/color solo con datos; reset y conteo | `details` compacto en móvil, panel lateral desde 1024. Controles >=44 px. Conteo `role=status`; DOM en el orden visual. Mantener tarjetas legibles sin JS |
| Ficha | Breadcrumbs, galería, nombre, precio, descripción, disponibilidad, variaciones reales, condiciones y CTA | Miniaturas con botones y nombre accesible, 44 px. No inventar variaciones. No Disponible bloquea formulario también por URL directa; enlace de retorno «Volver al catálogo» |
| Solicitud | Tres pasos: diseño/presupuesto/foto; entrega/dedicatoria; resumen editable y WhatsApp | Etiquetas persistentes, errores por campo, `aria-invalid`, foco en primer error. Botones Atrás/Siguiente no pierden datos. Indicar que fecha y horario son preferencias |
| Botones | Principal verde/marfil; secundario borde verde y texto verde; mínimo 50 px alto | Default, hover opcional, active, focus-visible y disabled. Texto puede ocupar dos líneas. No icono como único nombre; no animación necesaria para comprender una acción |
| Avisos | Condiciones junto al CTA, error junto al campo y vacío con salida útil | Texto explícito más color; `role=alert` para error inmediato cuando corresponda. No sustituir errores por mensajes vagos |
| Cookies | Preferencias con aceptar, rechazar y configurar; texto legible | Conservar consentimiento antes de cargar proveedores, acceso permanente para revocar y foco correcto. Sin IDs configurados no cargar GA4/Meta |
| Pie | Marca, navegación, cobertura, términos, privacidad y preferencias | Solo datos actuales de `site.config.json`; no copiar contacto/dirección del ejemplo. No incorporar domicilio personal |

## Excel y estados comerciales

La columna **Disponible** usa los valores solicitados **Sí**, **No** y **Disponibilidad**. El importador también acepta `Si` sin acento y los nombres anteriores para archivos ya entregados. Internamente se mantienen `available`, `unavailable` y `confirm`, sin introducir otro esquema de catálogo.

| Campo Excel | Tipo / regla | Campo normalizado |
| --- | --- | --- |
| ID | Texto único; no cambiar después de publicar | `id` |
| Producto | Nombre obligatorio, hasta 150 caracteres | `name` |
| Precio MXN | Número positivo; vacío únicamente en Cotizar | `price` |
| Disponible | Sí / No / Disponibilidad | `availability` |
| Estado | Publicado / Borrador / Retirado | `status` |
| Modalidad | Referencia / Fijo / Desde / Cotizar | `priceType` |
| Fotografías | Rutas propias `resources/foto.jpg` o HTTPS; varias separadas con `\|` | `images` |
| Descripción | Texto opcional; celda vacía válida | `description` |
| Categoría / Ocasiones / Flores / Colores | Datos reales; listas separadas con `\|` | `category`, `occasions`, `flowers`, `colors` |
| URL | Slug existente estable; se genera para nuevos si está vacío | `slug` |
| Destacado | Sí / No | `featured` |

Disponibilidad y publicación son independientes. **Publicado + No** mantiene el arreglo visible pero impide pedirlo. Borrador y Retirado quedan fuera del catálogo independientemente de disponibilidad; sus URLs mantienen la salida segura existente. No eliminar filas para representar temporada. Una fila ausente pasa a Retirado, sin borrar su historial. Las variaciones ya definidas se conservan por ID; esta plantilla no inventa ni redefine variaciones.

| Disponible en Excel | Presentación pública | Acción |
| --- | --- | --- |
| Sí | Foto en color y etiqueta Disponible | «Solicitar este arreglo»; inicia los tres pasos, sujeto a confirmación |
| No | Foto en escala de grises, superficie gris y «No Disponible» legible | Sin CTA de solicitud ni enlace WhatsApp de ese producto; ficha con retorno al catálogo; URL directa bloqueada |
| Disponibilidad | Foto normal y «Disponibilidad por confirmar» | «Preguntar por disponibilidad» en tarjeta, ficha y envío final; mensaje pregunta por ese arreglo y su referencia |
| Dato ausente en catálogo anterior | Igual que Disponibilidad | Consulta, nunca disponibilidad inventada |

En el tercer caso el CTA conserva el formulario para recoger la fecha y zona que necesita la operación, y después abre `wa.me` con el mensaje codificado. No afirma que la consulta sea un pedido confirmado. Los arreglos actuales no tienen disponibilidad comprobada; por eso comienzan como Disponibilidad. No se crean productos de ejemplo públicos.

Proceso del propietario: editar `admin/catalogo.xlsx`, guardar y cerrar Excel, abrir `Actualizar catalogo.cmd`, revisar web local y solicitar publicación o seguir `docs/DESPLIEGUE.md`. Las fotos son rutas/URLs, no fotos incrustadas: un archivo local nuevo debe existir antes de importar un producto Publicado. El importador rechaza fórmulas, duplicados, precios inválidos y fotografías faltantes; valida antes de escribir y crea respaldo local. El XLSX no se sirve por GitHub Pages.

## Flujo móvil y WhatsApp

1. Diseño: arreglo elegido o personalizado, presupuesto y foto opcional de referencia. Indicar modalidad de precio y disponibilidad. Un producto No no puede iniciar el flujo.
2. Entrega: fecha, franja preferida, colonia, alcaldía/municipio y CP; dedicatoria e instrucciones opcionales. No añadir datos personales innecesarios.
3. Resumen: conservar posibilidad de volver y editar, mostrar datos y advertencias, preparar mensaje completo con referencia AL. CTA «Preguntar por disponibilidad» para confirm, «Solicitar este arreglo» para available; el flujo personalizado mantiene su CTA de solicitud.

El mensaje para confirm comienza preguntando por disponibilidad; los datos de fecha, zona y presupuesto aportan contexto sin confirmar precio, flores o entrega. Conservar codificación con `encodeURIComponent`, número oficial configurado, referencia y atribución existentes. La fotografía solo se previsualiza localmente: recordar que debe adjuntarse manualmente en WhatsApp. No subirla a un servicio externo ni simular que se envió.

Conservar eventos `view_item_list`, `view_item`, `select_item`, `begin_checkout`, `form_complete`, `generate_lead` y `contact` con las traducciones a cada plataforma que ya existen. Una consulta también es un contacto potencial; no registrar Purchase ni venta confirmada. No cambiar IDs, credenciales, consentimiento ni deduplicación.

## Responsive, accesibilidad y rendimiento

| Ancho | Contenedor y grillas propuestas | Revisión |
| --- | --- | --- |
| 320 px | Gutter 16, hero apilado, catálogo una columna, botones completos, formulario una columna | Sin scroll horizontal; nombre/precio/estado/CTA legibles, incluso CTA de dos líneas |
| 390 px | Gutter 19.5, catálogo una columna, foto con ancho estable | Teclado virtual, controles nativos y errores no ocultan acciones |
| 768 px | Catálogo dos columnas; filtros arriba; hero apilado o composición holgada | Foco y orden de lectura coinciden; no forzar ficha estrecha en dos columnas |
| 1440 px | Contenedor 1220, catálogo tres columnas con panel de 240 px, hero y ficha en dos columnas | Espacio suficiente para condiciones, CTA y galería |

Grillas con `minmax(0,1fr)`, contenido con `min-width:0`, etiquetas largas con wrap. No esconder overflow para disimular fallos. Texto base >=16 px; prueba zoom 200% y reflow a 320 px. Controles nativos, enlaces con destino, botones para acciones, skip link, labels asociados, alt según foto, contraste y estados sin depender del color. Cambios de paso enfocan el heading; mensajes de error se asocian con `aria-describedby`.

Mantener fotos originales y variantes WebP existentes de 400/800/1200 px. Hero y foto principal eager; las demás lazy, con width/height, `srcset` y `sizes` apropiados a la nueva grilla. Revisar encuadre por foto, sin recortar detalles comerciales ni sustituir por imágenes generadas. Las fotos remotas HTTPS siguen siendo recursos reales; un nuevo URL no garantiza optimización automática.

Conservar JS defer, recursos locales y generación estática. No añadir librería de animación o carrusel; transición opcional de color de 150–220 ms. `prefers-reduced-motion` elimina movimiento y scroll animado. Evaluar LCP, INP y CLS en móvil antes/después con la misma metodología; no prometer puntuaciones sin medir. Preservar títulos únicos, canonical, OG, Product/BreadcrumbList, robots y sitemap. No declarar InStock a partir de «Sí»: sigue siendo elaboración bajo pedido.

## Ejemplos de CSS para la implementación visual posterior

Estos ejemplos son especificaciones, todavía no se aplican al runtime de esta fase. Adaptan nombres de clases y tokens que ya existen.

```css
:root {
  --paper:#FAF8F4; --cream:#F2EDE6; --sand:#EAE3D8;
  --sage:#879584; --green:#5C6A57; --ink:#292B28;
  --muted:#585B52; --rose:#D8B7B2; --rose-deep:#B98F89;
  --line:rgba(41,43,40,.14); --control-line:#5C6A57;
  --serif:Georgia,'Times New Roman',serif;
  --sans:system-ui,-apple-system,'Segoe UI',sans-serif;
  --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px;
  --s6:32px; --s7:48px; --s8:72px; --s9:112px;
  --gutter:clamp(16px,5vw,64px); --maxw:1220px;
}
.wrap { max-width:var(--maxw); padding-inline:var(--gutter); margin-inline:auto; }
.section { padding-block:clamp(48px,7vw,var(--s9)); }
.grid { display:grid; grid-template-columns:minmax(0,1fr); gap:24px; }
.btn { min-height:50px; border-radius:3px; white-space:normal; }
.card,.product-image { border-radius:6px; }
:where(a,button,input,select,textarea,summary):focus-visible {
  outline:3px solid var(--ink); outline-offset:4px;
  box-shadow:0 0 0 4px var(--paper);
}
.card.is-unavailable { background:#E5E5E3; }
.card.is-unavailable img,.product-layout.is-unavailable .product-image img {
  filter:grayscale(1); /* el texto conserva contraste y opacidad */
}
@media (min-width:640px) { .grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (min-width:1024px) { .grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
@media (prefers-reduced-motion:reduce) {
  html { scroll-behavior:auto; }
  *,*::before,*::after { animation:none!important; transition:none!important; }
}
```

La cascada actual contiene reglas específicas como `.catalog-layout .grid`; actualizarlas en sus breakpoints junto con la regla general al aplicar el rediseño. Revisar `.hero-copy`, que calcula márgenes con 1180 px, para que use el nuevo contenedor sin duplicar padding. No copiar el ejemplo de CSS a ciegas al final del archivo.

## Plan por impacto y fuentes que se modificarán

| Fase | Cambio | Fuentes | Validación / estado |
| --- | --- | --- | --- |
| 1 | Excel y tres estados de disponibilidad, CTA y mensaje coherentes | `admin/catalogo.xlsx`, importadores, `assets/core.js`, `assets/order.js`, `scripts/build.cjs` | Implementado en esta entrega; build, importación y pruebas de estados/enlace directo |
| 2 | Tokens accesibles, tipografía local, geometría y componentes base | `assets/styles.css`, plantillas en `scripts/build.cjs` | Propuesto; comprobar contraste, 320/390/768/1440, teclado, foco y zoom |
| 3 | Hero, dos opciones, ocasiones, catálogo y ficha editorial | Plantillas, estilos y `assets/catalog.js`/`assets/site.js` solo si cambia interacción | Propuesto; mismas fotos/datos/URLs, filtros, galería y navegación |
| 4 | Pulir formulario, avisos y preferencias, medir rendimiento | `assets/order.js`, estilos, plantillas; analytics solo si hace falta mantener integración | Propuesto; tres pasos, errores, resumen, foto manual, consentimiento y eventos sin duplicación |
| 5 | Revisar y publicar con autorización expresa | Build, `scripts/check-release.cjs`, manifiesto y documentación de despliegue | Pendiente; no publicar desde esta tarea |

Antes de cambios amplios, crear rama `codex/` y punto de recuperación cuando Git permita escritura; conservar el trabajo existente. Para esta actualización documental y de estados se respaldaron el diseño y Excel anteriores en `artifacts/design-respaldos`. No resetear el repositorio ni eliminar recursos reales.

## Lista verificable de aceptación

- [ ] Hero identifica producto, cobertura, mínimo real y las dos rutas sin scroll innecesario en móvil.
- [ ] Marca principal Áurea Lidia y segunda marca conservadas; ningún dato comercial copiado del ejemplo.
- [ ] Tokens aplicados cumplen ratios en cada fondo/estado; foco visible y objetivo táctil >=44 px.
- [ ] Navegación, catálogo, ficha, filtros, galería y formulario funcionan con teclado y tacto sin hover.
- [ ] Revisar 320, 390, 768 y 1440 px; sin desbordamiento, texto truncado esencial ni foco oculto por cabecera.
- [ ] Excel conserva los 20 arreglos reales y sus IDs, URLs, precios y fotografías; admite filas nuevas completas.
- [ ] Sí permite solicitud; No deja visible en gris con «No Disponible» y bloquea el enlace directo.
- [ ] Disponibilidad conserva foto normal y «Preguntar por disponibilidad» en tarjeta, ficha y CTA final.
- [ ] Mensaje del tercer estado pregunta por disponibilidad, con arreglo, referencia y contexto correctos.
- [ ] Borrador/Retirado no se publican; descripción vacía válida y precio vacío solo en Cotizar.
- [ ] Importación inválida conserva catálogo; importación válida crea respaldo antes de escribir.
- [ ] Tres pasos conservan valores al editar; errores específicos, resumen y wa.me correctamente codificado.
- [ ] Foto solo previsualizada; recordatorio de adjuntarla en WhatsApp; no pagos ni confirmaciones ficticias.
- [ ] Sin IDs configurados no se cargan proveedores; consentimiento/rechazo/revocación preservados y sin Purchase.
- [ ] Fotografías responsivas sin distorsión; eager solo donde corresponde; dimensiones evitan saltos.
- [ ] SEO y navegación preservados, build y `node --test tests/*.test.cjs` correctos, control de release pasa.
- [ ] Comparar rendimiento móvil antes/después y registrar resultados sin afirmar mejoras no medidas.
- [ ] Cambios locales revisables y publicación solo tras instrucción expresa.

Las casillas sirven para aceptar la implementación visual posterior, no representan una certificación ni una afirmación de que ya se haya rediseñado todo el sitio.
