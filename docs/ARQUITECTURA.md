# Arquitectura y evolución

Se conserva un sitio estático económico: datos → generador → HTML y recursos → hosting existente. El catálogo ya no depende de Google Sheets durante la visita. El importador consulta la hoja públicamente disponible solo en mantenimiento, valida y conserva metadatos. No se creó un admin ficticio ni un servicio nuevo.

`core.js` separa validación y mensajes del DOM, y se prueba con Node. El pedido es una **intención**, no una orden confirmada: se mantiene en memoria, se revisa y se convierte en un enlace oficial `wa.me`. Ningún envío local crea un registro en el negocio. La fotografía se maneja con una URL blob local que se libera; nunca se adjunta o sube a un servidor.

`analytics.js` se inicializa solo tras consentimiento, filtra propiedades y deduplica por evento/referencia. No registra compras. Los datos estáticos se escapan en HTML/JSON-LD y las entradas del usuario se presentan con `textContent`. Las imágenes admiten recursos locales seguros o HTTPS, no rutas arbitrarias ni esquemas ejecutables.

## Pagos, fase futura

`domain/contracts.d.ts` define los contratos previstos, sin dependencia TypeScript ni código de pagos operativo:

1. Guardar intención en backend autenticado/protegido, si el negocio necesita registro central.
2. Emitir una cotización real con precio y envío, caducidad y aceptación.
3. Crear checkout de Mercado Pago o Stripe exclusivamente desde backend, usando la cotización; nunca confiar en importes enviados por el navegador.
4. Verificar webhook firmado, estado, moneda, importe e idempotencia con el proveedor.
5. Solo después registrar `verified_paid` y, con consentimiento y deduplicación aplicables, una compra real en analítica.

No se instalaron SDK de pagos, credenciales, endpoints, botones de cobro ni estados de pago simulados. El proveedor debe elegirse después de confirmar costos y operación. Una página de retorno de pago no prueba que el dinero fue recibido.

## Foto segura y ventas reales, fase futura

Una carga de fotos requerirá validación de tipo real, límites, almacenamiento privado, URLs temporales, borrado y control de acceso. No deben alojarse referencias de clientes en `resources/`. Un CRM/registro privado puede relacionar `request_id` con cotización, confirmación y evidencia de pago; el sitio actual solo prepara esa referencia para conciliación manual.

## SEO local

Las páginas tienen contenido estático, idioma es-MX, títulos diferentes, canonical, imágenes OG absolutas, sitemap y robots. Las fichas generan Product y BreadcrumbList. Solo productos con precio `fixed` tienen Offer, sin inventar stock. Los precios de referencia no emiten Offer. La organización declara CDMX y Edomex como área de operación general; el texto aclara zonas sujetas a confirmación. No se inventó dirección para emitir Florist/LocalBusiness; puede agregarse cuando el negocio confirme la información pública. No se generan AggregateRating ni testimonios estructurados.
