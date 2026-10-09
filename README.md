# Áurea Lidia — sitio comercial estático

Versión local para revisión. No se ha publicado ni se han integrado pagos. El sitio conserva HTML/JavaScript, la identidad rosa/salvia y los recursos del proyecto; no usa framework, CDN de interfaz ni servicios nuevos de pago.

## Inicio rápido

Necesitas Node.js 18 o posterior. No hay dependencias npm que instalar.

```powershell
node scripts/build.cjs
node --test tests/*.test.cjs
node scripts/serve.cjs
```

Abre **http://localhost:4173**. Los equivalentes son `npm run build`, `npm test` y `npm start` si tienes npm. El servidor es solo para revisión, escucha en el equipo local y no es un servidor de producción. No abras directamente el HTML con `file://`: las rutas y el catálogo necesitan HTTP.

## Archivos que se editan

| Archivo | Uso |
| --- | --- |
| `data/products.json` | Fuente única de productos, precios, fotografías y etiquetas |
| `site.config.json` | WhatsApp, marcas, dominio, datos del aviso y herramientas de medición |
| `scripts/build.cjs` | Plantillas compartidas de páginas y SEO |
| `assets/styles.css` | Identidad visual y estilos móviles |
| `assets/core.js` | Validación, filtros y construcción del mensaje |
| `assets/site.js` | Navegación y comportamiento común |
| `assets/catalog.js` | Filtros, ordenamiento y paginación |
| `assets/order.js` | Formulario, foto local y resumen |
| `assets/analytics.js` | Consentimiento, atribución y eventos |

**No edites los HTML, `main.js`, `catalogo.js`, `assets/config.js`, `data/catalog.json` ni sitemap manualmente:** se regeneran con build. `index.js` y los tres documentos de diseño originales permanecen como referencia histórica, no se cargan en el sitio nuevo. El contenido original está recuperable en el commit inicial `af9c631`.

Lee `docs/ADMINISTRACION.md`, `docs/ANALITICA.md`, `docs/DESPLIEGUE.md` y `docs/CAMBIOS.md` para operación y entrega.

## Google Sheets

La hoja existente se consulta **al actualizar**, no en cada visita del cliente:

```powershell
node scripts/import-sheet.cjs
node scripts/build.cjs
node --test tests/*.test.cjs
```

El importador valida la respuesta y los datos antes de reemplazar la fuente local. Una importación fallida conserva el catálogo. Una fila que desaparece se conserva como `retired`. No modifica la hoja, sus permisos ni credenciales. Usa solo una hoja de catálogo público; nunca compartas pedidos ni datos personales en ella.

Los cambios permanecen locales hasta que despliegues explícitamente. Para trabajar sin red, edita `data/products.json`. `catalog-source.json` es el respaldo de las 20 filas originales, no una fuente que deba importarse habitualmente.

## Pendientes antes de producción

```powershell
node scripts/check-release.cjs
```

El propietario confirmó **525618689260** como WhatsApp oficial y proporcionó identidad y domicilio del negocio para el aviso de privacidad. El control de configuración mínima ya pasa. La configuración de despliegue fue revisada por el propietario; no se ha publicado automáticamente. Consulta `docs/PRIVACIDAD.md` para atender solicitudes de datos y mantener el aviso. GA4 y Meta están vacíos y desactivados. Los precios de la hoja se conservan como referencias. No se han añadido reseñas, stock, promociones ni nuevas tarifas.

La fecha y franjas horarias son preferencias; no reflejan capacidad operativa comprobada. Las etiquetas iniciales de flores y colores proceden exclusivamente de los nombres/descripciones originales; valida su vigencia. Algunas ocasiones aún no tienen referencias y no hay variaciones definidas.

## Recuperación

Para consultar un archivo original sin sobrescribir cambios:

```powershell
git show af9c631:index.html
git diff --stat
```

En este equipo Git puede advertir sobre propiedad del directorio. Se utilizó `git -c safe.directory='D:/Desktop/OKComputer_Aurea Lidia Florist Website' ...` solo para este comando, sin cambiar configuraciones globales. Para recuperar producción, vuelve a desplegar la copia anterior del hosting; no uses un reset destructivo sin revisar tus cambios.
