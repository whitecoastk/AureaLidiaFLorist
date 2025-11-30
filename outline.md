# Estructura del Sitio Aurea Lidia Florist

## Archivos Principales

### index.html - Página Principal
- **Hero Section**: Imagen de fondo con arreglos florales, título elegante y CTA
- **Productos Destacados**: Carrusel con los arreglos más populares
- **Categorías**: Grid visual con tipos de arreglos
- **Testimonios**: Reseñas de clientes satisfechos
- **Sobre Nosotros**: Breve historia con enlace a página completa
- **Newsletter**: Suscripción con descuento inicial

### catalogo.html - Catálogo de Productos
- **Filtros Laterales**: Por tipo, precio, ocasión, color
- **Grid de Productos**: Tarjetas con imagen, precio, disponibilidad
- **Carrito de Compras**: Sidebar con resumen de compra
- **Paginación**: Carga infinita o paginación tradicional
- **Ordenamiento**: Por precio, popularidad, novedad

### personalizar.html - Personalización de Arreglos
- **Formulario Paso a Paso**: Selector de flores, tamaños, colores
- **Preview Visual**: Representación gráfica del arreglo
- **Calculadora de Precio**: Actualización en tiempo real
- **Opciones de Entrega**: Fecha, hora, dirección
- **Mensaje Personalizado**: Dedicatoria y tarjeta

### nosotros.html - Sobre Nosotros
- **Historia Familiar**: Orígenes de la florería
- **Nuestro Equipo**: Fotos y perfiles de los floristas
- **Instalaciones**: Galería del taller y tienda
- **Valores**: Compromiso con calidad y servicio
- **Certificaciones**: Reconocimientos y asociaciones

### contacto.html - Contacto y Ubicación
- **Formulario de Contacto**: Consultas y sugerencias
- **Información de Tienda**: Dirección, horarios, teléfonos
- **Mapa Interactivo**: Ubicación en CDMX
- **WhatsApp Directo**: Botón de chat inmediato
- **Redes Sociales**: Links a Facebook e Instagram

## Recursos Adicionales

### main.js - Funcionalidad Principal
- **Carrito de Compras**: Lógica de agregar/eliminar productos
- **Filtros del Catálogo**: Búsqueda y ordenamiento
- **Validación de Formularios**: Verificación de datos
- **Animaciones**: Efectos visuales con Anime.js
- **Integración WhatsApp**: Envío de mensajes personalizados

### admin.html - Panel Administrativo
- **Gestión de Productos**: CRUD de arreglos florales
- **Órdenes de Compra**: Vista y actualización de pedidos
- **Inventario**: Control de stock de flores
- **Reportes**: Ventas y estadísticas básicas
- **Configuración**: Precios, disponibilidad, horarios

## Estructura de Carpetas
```
/mnt/okcomputer/output/
├── index.html
├── catalogo.html
├── personalizar.html
├── nosotros.html
├── contacto.html
├── admin.html
├── main.js
├── resources/
│   ├── hero-flores.jpg
│   ├── arreglo-1.jpg
│   ├── arreglo-2.jpg
│   ├── ... (imágenes de productos)
│   ├── florista-equipo.jpg
│   └── tienda-interior.jpg
└── README.md
```

## Funcionalidades Especiales

### Optimización SEO
- **Meta Tags**: Descripciones y keywords relevantes
- **Schema Markup**: Microdatos para motores de búsqueda
- **Sitemap XML**: Estructura del sitio para Google
- **Open Graph**: Previews en redes sociales
- **Alt Text**: Descripciones en todas las imágenes

### Performance
- **Lazy Loading**: Carga diferida de imágenes
- **Compresión**: Imágenes optimizadas para web
- **CDN**: Librerías externas cargadas desde CDN
- **Minificación**: CSS y JavaScript comprimidos
- **Cache**: Estrategias de almacenamiento local