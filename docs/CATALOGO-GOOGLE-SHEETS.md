# Editar el catálogo desde Google Sheets

La fuente habitual es la pestaña `gid=0` de [la hoja de Áurea Lidia](https://docs.google.com/spreadsheets/d/1AYMtAh_G8P3jXRv8aSu3-QT6foWwG8HfGVHRjaa15PU/edit?gid=0). La web consulta esa pestaña al abrir inicio, catálogo, ficha o una solicitud con arreglo elegido. Tras publicar esta versión una vez, editar las celdas y recargar la página será suficiente para actualizar la presentación. Puede haber demora de propagación de Google; no se prometen cambios instantáneos en pestañas ya abiertas.

## Columnas que ya tienes

| Columna | Qué escribir |
| --- | --- |
| `id` | Identificador único y estable. Para nuevos arreglos usa un ID que no hayas utilizado. No cambies el de los existentes |
| `name` | Nombre real del arreglo |
| `price` | Número en MXN, sin texto de moneda. Ejemplo de formato: 599.50. No representa una promoción |
| `image` | Nombre de una foto ya subida a `resources`, como `ramo-rojo.jpg`, o URL HTTPS directa de una imagen pública |
| `description` | Descripción opcional; puede quedar vacía |
| `category` | Categoría, por ejemplo la que ya usa la fila; las nuevas aparecen automáticamente en filtros |

`popular` y `badge` se conservan en tu hoja. No se convierten automáticamente en testimonios, promociones o afirmaciones de popularidad. Solo se reconocen ocasiones explícitas ya usadas por la importación anterior.

## Disponibilidad y publicación

Añade a la fila de encabezados una columna llamada **Disponible**. El código está listo para leerla; esta tarea no modificó tu hoja ni sus permisos.

| Valor | Resultado |
| --- | --- |
| `Sí` o `Si` | Foto normal y botón Solicitar este arreglo |
| `No` | Foto en gris, etiqueta No Disponible, solicitud bloqueada en ficha y por enlace directo |
| `Disponibilidad` o celda vacía | Foto normal y botón Preguntar por disponibilidad |

Si falta esa columna se conserva el estado local previo cuando exista; los 20 registros actuales están por confirmar. Una casilla booleana es compatible con Sí/No, pero no permite el tercer estado; para los tres usa texto o una lista desplegable.

Puedes añadir **Estado**: Publicado, Borrador o Retirado. Al estar presente, una celda vacía es Borrador. Si la columna no existe, las filas nuevas completas se publican en el catálogo al leerlas; no agregues filas incompletas en la hoja visible. Para preparar productos con calma, usa Estado=Borrador. No borres ni cambies IDs para marcar flores de temporada: usa Disponible=No. Si eliminas una fila, desaparece de la lista actual y el formulario deja de admitir su referencia.

## Opciones adicionales

Se aceptan encabezados en español: ID, Nombre o Producto, Precio o Precio MXN, Imagen o Fotografías, Descripción, Categoría. No repitas encabezados equivalentes.

- **Modalidad**: Referencia, Fijo, Desde o Cotizar. Al faltar, conserva la modalidad previa y usa Referencia para filas nuevas. Solo Cotizar permite precio vacío.
- **Fotografías**: varias rutas o URLs separadas por `|`; reemplaza la columna image como origen cuando está presente.
- **Ocasiones**, **Flores**, **Colores**: valores separados por `|`. Ocasiones válidas: cumpleanos, aniversario, amor, agradecimiento, condolencias, madres, boda, graduacion, otro. Flores/colores son etiquetas libres basadas en datos reales.
- **Destacado**: Sí/No. Los destacados alimentan la sección de inicio; no equivale a Más vendido.
- **URL**: slug estable. No cambiar el de una ficha existente. Si lo dejas vacío en un producto nuevo, se genera con nombre e ID.

Las variaciones existentes se conservan por ID. La columna avanzada `variations` admite JSON validado; para mantenimiento sencillo déjala fuera y solicita cambios de variaciones cuando los necesites.

## Fotografías

Pegar un enlace en image carga esa imagen; insertar una foto dentro de una celda o usar `IMAGE()` no entrega una URL utilizable por esta conexión. Usa el enlace directo del archivo público, no una página de Google Drive/Instagram ni una ruta de tu computadora. Para imágenes nuevas alojadas en `resources/` hay que subir esos archivos al sitio una vez. Después puedes reutilizar su nombre desde la hoja.

Las fotos existentes conservan sus variantes WebP optimizadas cuando coincide la ruta. Una imagen remota nueva se muestra sin transformaciones automáticas ni contratación de servicios.

## Fallos y respaldo

Se valida toda la respuesta antes de usarla: IDs/URLs únicos, imágenes seguras, estados, precios y variaciones. No se ejecuta el JavaScript recibido: se extrae el objeto y se utiliza JSON.parse. Si Google falla, la hoja está vacía o hay datos inválidos, se presenta el respaldo publicado con aviso. Los estados disponibles del respaldo se convierten en consulta; los No disponibles siguen bloqueados. Revisa la hoja y recarga. No hay almacenamiento persistente del catálogo en el navegador.

La hoja tiene que seguir accesible para lectura pública, como se comprobó en esta tarea. No necesita permisos públicos de edición. Nunca guardes datos de clientes, pedidos ni credenciales en esta hoja. El navegador pide únicamente los datos comerciales públicos, sin credenciales ni datos del formulario.

## SEO y copia estática

Las URLs individuales actuales se conservan y sus datos visibles se actualizan desde Sheets. Para una fila nueva todavía sin página estática se ofrece `/arreglo.html?arreglo=ID`, con ficha y solicitud funcionales; esa vista tiene noindex para evitar indexar una página genérica. Para añadirla al sitemap con URL legible y actualizar la copia HTML/SEO y vistas previas compartidas, ejecuta:

```powershell
node scripts/import-sheet.cjs
node scripts/build.cjs
node --test tests/*.test.cjs
node scripts/check-release.cjs
```

Después publica los cambios siguiendo DESPLIEGUE.md. No es necesario repetir este proceso para cada edición visible en la hoja, pero conviene mantener la copia estática y el respaldo actualizados. Sin JavaScript se muestra la copia estática. No se configuraron cron, bots, pagos, claves API ni nuevos servicios de pago.

El Excel local sigue disponible como alternativa para preparar una copia, pero ya no es el origen principal de la presentación online. No uses dos fuentes divergentes para administrar los mismos productos. `site.config.json` permite desactivar `sheet.enabled` y volver a la copia local si se necesita.
