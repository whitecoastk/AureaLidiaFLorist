# Administrar productos y solicitudes

## Fuente principal: Google Sheets

Desde esta versión la presentación del sitio consulta directamente la hoja pública configurada (`gid=0`). Edita nombre, precio, image, descripción y categorías allí, y recarga. La columna opcional Disponible admite Sí/No/Disponibilidad. Las filas nuevas completas aparecen sin volver a generar el sitio; la copia estática y el SEO de nuevas fichas se actualizan con importación/build y publicación. Lee `CATALOGO-GOOGLE-SHEETS.md` para el formato, imágenes, estados y respaldo. El Excel que sigue se conserva como alternativa local.

## Productos

### Editar con Excel

Abre `admin/catalogo.xlsx`. La hoja **Productos** contiene los 20 productos originales. Añade nuevas filas con IDs únicos y datos reales. Mantén el ID y URL de las filas existentes. El Excel tiene filas vacías preparadas; puedes extender la tabla al continuar agregando.

La columna **Disponible** controla el catálogo: **Sí** permite solicitar; **No** muestra la tarjeta en gris con «No Disponible» y bloquea la solicitud en tarjeta, ficha y enlaces directos; **Disponibilidad** mantiene la fotografía en color y cambia el botón a «Preguntar por disponibilidad». Ese botón conserva los tres pasos y el mensaje de WhatsApp pregunta por disponibilidad. Es independiente de **Estado** (Publicado/Borrador/Retirado). Usa No para flores de temporada sin eliminar el producto. Se acepta Si sin acento y, por compatibilidad, el encabezado Disponibilidad y los valores antiguos Disponible/No disponible/Por confirmar.

Guarda el Excel y abre `Actualizar catalogo.cmd` en la carpeta del proyecto. Importa con respaldo local, regenera las páginas y verifica la configuración. Necesita Node y Python 3; en este equipo detecta los runtimes de Codex y no instala paquetes. Puedes validar sin cambiar datos con `node scripts/import-excel.cjs admin/catalogo.xlsx` y aplicar con `--apply`.

El Excel no contiene fotos incrustadas: escribe rutas a fotos propias en `resources/` o URLs HTTPS. Una ruta nueva debe existir antes de publicar ese arreglo. No admite fórmulas en Productos, macros, IDs duplicados ni precios vacíos salvo modalidad Cotizar. Las filas borradas se conservan como retiradas en JSON. Las variaciones ya definidas se preservan por ID.

**Importar no publica en Internet.** Después de revisar la vista local, sigue `docs/DESPLIEGUE.md` o pide a Codex subir y desplegar esta actualización. Cambiar el Excel guardado en tu equipo no puede modificar por sí solo GitHub Pages.

Cada producto tiene un ID permanente y un slug permanente. No cambies ambos al actualizar nombre o precio: así conservas enlaces y referencias de campaña. Todas las páginas se generan de la misma fuente.

| Campo | Valores y uso |
| --- | --- |
| `id` | Texto único: letras, números, guion o guion bajo |
| `slug` | URL única, minúsculas y guiones; no cambiar sin preparar redirección |
| `status` | `published` visible; `draft` pendiente; `retired` retirado |
| `name`, `description` | Información real del arreglo |
| `price` | Número MXN sin `$` ni separadores; `null` si solo cotiza |
| `priceType` | `reference`, `fixed`, `from`, `quote` |
| `images` | Lista de rutas `resources/foto.jpg` o URLs HTTPS |
| `category` | Tipo del arreglo; por ejemplo las categorías existentes `ramos`, `centros`, `especiales` |
| `occasions` | Lista de claves válidas, ver abajo |
| `flowers`, `colors` | Listas de etiquetas explícitas y verificadas |
| `variations` | Lista de opciones reales con `id`, `label`, `priceType`, `price` |
| `featured` | `true` para destacar en inicio; no significa “más vendido” |

Las ocasiones disponibles son `cumpleanos`, `aniversario`, `amor`, `agradecimiento`, `condolencias`, `madres`, `boda`, `graduacion`, `otro`. Una lista vacía significa sin clasificación. No se deducen flores, colores ni cantidades desde fotografías. Los badges de aniversario, San Valentín y Día de las Madres se tradujeron desde datos existentes; los demás badges comerciales no se publican como afirmaciones verificadas. También se etiquetaron cumpleaños, aniversario y boda donde el texto original lo menciona expresamente, y flores/colores explícitos en nombre o descripción. No se asumió color naranja por un nombre comercial ni preferencias genéricas como flores favoritas. `metadataSource` documenta esta procedencia; el negocio debe validar vigencia.

`reference` muestra el precio existente y exige confirmación. `from` muestra “Desde”; úsalo únicamente si el negocio confirmó ese mínimo. `fixed` representa un precio real definido, aun sujeto a confirmación de entrega. `quote` muestra “Solicita cotización” y queda fuera de filtros numéricos. Las variaciones funcionan sin añadir opciones inventadas: el catálogo actual no contiene ninguna.

## Edición desde la hoja existente

Conserva los encabezados originales `id`, `name`, `price`, `image`, `description`, `category`. Puedes añadir `slug`, `status`, `priceType`, `occasions`, `flowers`, `colors`, `featured`, `images`, `variations`. Separa listas con `|`; para variaciones utiliza un array JSON con los campos arriba. En `featured` usa booleano de Sheets. Si no hay columnas nuevas, el importador conserva los metadatos agregados localmente.

Al importar, los campos originales se actualizan desde la hoja; una celda vacía en una columna opcional conserva el dato local, por lo que para vaciar una lista conviene hacerlo explícitamente en JSON. No uses celdas de ejemplo como catálogo real. Para agregar un arreglo sin precio confirmado usa `priceType=quote`; si faltan fotografías o características, mantenlo como `draft` y completa antes de publicar. No eliminar filas como forma principal de gestión: usa `retired`.

Después de cualquier cambio: importa si procede, genera, ejecuta las pruebas y revisa el producto en la vista local. Solo entonces despliega.

## Fotografías

Las originales se conservan. Pon nuevas fotografías propias en `resources/` con nombres sin espacios ni acentos, agrega la ruta al producto y genera derivados:

```powershell
python scripts/optimize-images.py
node scripts/build.cjs
```

La optimización necesita Python y Pillow. Es una herramienta de mantenimiento, no una dependencia de la web. Si no tienes Pillow, puedes añadir una fotografía ya optimizada; el build admite el original y no necesita Python. No subas fotografías privadas de clientes a recursos públicos sin la autorización adecuada. La foto de referencia del formulario no se carga al servidor.

## Solicitudes y ventas confirmadas

1. El cliente prepara su solicitud y abre WhatsApp. Debe enviar el mensaje.
2. La referencia `AL-…` identifica esa intención local; no es un número de pedido confirmado.
3. Confirma flores, diseño, presupuesto, envío, fecha y horario. Pide domicilio exacto y datos del destinatario solo cuando sean necesarios.
4. Registra en un archivo o sistema **privado** la referencia, marca, UTM, fecha de recepción, estado, importe confirmado y resultado.
5. Marca una venta como confirmada o pagada únicamente con evidencia real. Una apertura de WhatsApp no acredita que el mensaje se haya enviado ni que el negocio lo haya recibido.

Campos sugeridos para el registro privado: `request_id`, `received_at`, `brand`, `utm_source`, `utm_medium`, `utm_campaign`, `status`, `quoted_amount_mxn`, `delivery_amount_mxn`, `confirmed_at`, `paid_at`, `payment_evidence_reference`. No hay filas ficticias ni exportación automática de conversiones.

El identificador se conserva al editar la solicitud en la misma pestaña y cambia tras recargar. No debe usarse como autorización de pago. No guardamos dedicatoria, dirección ni foto en el navegador persistente; al migrar, el sitio retira el carrito legado de `localStorage`, que incluía datos personales sin caducidad. Se documenta esta limpieza porque las selecciones antiguas no se trasladan al nuevo flujo.
