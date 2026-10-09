const text=value=>typeof value==='string'&&value.trim().length>0;
const privacyReady=config=>config.privacy?.reviewed===true&&['controller','controllerAddress','rightsContact'].every(key=>text(config.privacy[key]));

function renderPrivacy(config,esc,whatsappUrl){
  const p=config.privacy,ready=privacyReady(config);
  const contact=whatsappUrl(config.whatsapp,'Hola, quiero ejercer mis derechos sobre datos personales o consultar el aviso de privacidad.');
  return `${ready?'':`<div class="notice pending"><strong>Borrador: falta completar la identidad y el domicilio del responsable y confirmar el texto antes de publicar.</strong> Los apartados siguientes describen el funcionamiento de la web y el procedimiento propuesto para atender solicitudes de privacidad.</div>`}
<p>Versión del aviso: 8 de octubre de 2026.</p>
<h2>Responsable y contacto</h2>
<p>Este aviso corresponde a la operación de Áurea Lidia y Jardín Eterno CDMX en <a href="${esc(config.url)}">${esc(config.url)}</a>. Responsable de los datos: ${text(p.controller)?esc(p.controller):'<strong>Pendiente de proporcionar nombre completo o razón social.</strong>'} Domicilio para asuntos de privacidad: ${text(p.controllerAddress)?esc(p.controllerAddress):'<strong>Pendiente de proporcionar por el negocio.</strong>'}</p>
<p>Contacto para privacidad: ${esc(p.rightsContact)}. <a href="${esc(contact)}" target="_blank" rel="noopener noreferrer">Consultar privacidad por WhatsApp ↗</a>.${text(p.contactEmail)?` También puedes escribir a ${esc(p.contactEmail)}.`:''}</p>
<h2>Datos que utiliza la web</h2>
<p>El formulario solicita el arreglo o referencia, presupuesto, fecha, horario preferido, colonia, alcaldía o municipio y código postal. Puedes añadir dedicatoria, preferencias e instrucciones. No solicita nombre, correo, teléfono, dirección exacta ni datos de tarjetas; los datos de contacto y entrega necesarios se coordinan después por WhatsApp.</p>
<p>La foto de referencia se visualiza solamente en tu dispositivo. No se carga a nuestro servidor ni se adjunta automáticamente. Si deseas enviarla, debes hacerlo manualmente en WhatsApp. Evita compartir datos sensibles o fotografías de personas que no sean necesarias para el arreglo.</p>
<h2>Para qué usamos la información</h2>
<p>Las solicitudes sirven para cotizar, revisar disponibilidad, acordar el arreglo y precio final, coordinar la entrega y atender consultas o aclaraciones. Si compartes datos de un destinatario, proporciona únicamente lo necesario para la entrega y asegúrate de poder compartirlos para ese fin.</p>
<p>La medición de navegación y campañas es opcional y requiere aceptar las herramientas configuradas. El formulario no suscribe a boletines ni autoriza mensajes promocionales. Rechazar la medición no impide pedir un arreglo.</p>
<h2>WhatsApp y proveedores</h2>
<p>Al pulsar «Abrir solicitud en WhatsApp», el resumen se incluye en una URL dirigida a WhatsApp; tendrás que enviar el mensaje para continuar con el negocio. La URL puede quedar en el historial del navegador. WhatsApp recibe esa URL y trata información de acuerdo con su <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">política de privacidad</a>.</p>
<p>Los datos necesarios para una entrega podrán comunicarse a quien la realice, exclusivamente para coordinarla. Si interviene un tercero que actúe por cuenta propia, se informará del destinatario y finalidad y se solicitará el consentimiento cuando corresponda. No se ofrece venta de datos personales ni uso del contenido de la solicitud para publicidad.</p>
<h2>Cookies y medición opcional</h2>
<p>La elección de privacidad se guarda en el navegador por un máximo de 180 días. Con consentimiento, la atribución de campaña se conserva durante la sesión. Sin él, los parámetros de campaña pueden acompañar enlaces internos y el mensaje preparado, sin guardarse en almacenamiento persistente.</p>
<p>Google Analytics 4 y Meta Pixel solo se cargan si sus identificadores están configurados y aceptas las herramientas opcionales. Pueden recibir navegación, identificadores de catálogo, campañas, clics y acciones de solicitud, además de información técnica tratada por sus servicios, como dirección IP y navegador. No reciben la dedicatoria, zona de entrega, observaciones ni fotografía del formulario. Estos servicios pueden procesar información fuera de México conforme a sus políticas: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google</a> y <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">Meta</a>.</p>
<p>Para aceptar, rechazar o revocar la medición, abre «Preferencias de cookies» al pie de cualquier página. Al rechazarla se bloquean nuevos eventos y se borra la atribución guardada por la web; esto no elimina información ya recibida por los proveedores. El alojamiento también puede generar registros técnicos de acceso, según su configuración.</p>
<h2>Conservación</h2>
<p>El formulario y la fotografía no se guardan en almacenamiento persistente de esta web. Los mensajes que envíes y los datos de pedidos se gestionan en WhatsApp y en la operación del negocio. Deben conservarse solo para atender la solicitud, entrega, aclaraciones y obligaciones aplicables; después procede su bloqueo o eliminación. El historial del navegador y las copias mantenidas por proveedores se gestionan con sus propios controles.</p>
<h2>Derechos y limitación de uso</h2>
<p>Puedes pedir acceso, rectificación, cancelación u oposición; también revocar consentimiento o limitar uso y divulgación mediante el contacto indicado. Envía tu nombre, un medio de respuesta, el derecho y datos involucrados y, si la tienes, la referencia AL de solicitud. Para rectificación, indica la corrección. Se acordará un medio para acreditar tu identidad o representación, solicitando solo lo necesario.</p>
<p>La determinación de una solicitud ARCO se comunica en un máximo de 20 días hábiles; si procede, se hace efectiva en los siguientes 15 días hábiles, con las ampliaciones legalmente permitidas. La revocación no es retroactiva y puede existir conservación por obligación legal. Para revocar cookies no necesitas acreditar identidad: utiliza las preferencias del sitio.</p>
<h2>Actualizaciones del aviso</h2>
<p>Las modificaciones se comunicarán en esta misma página, con la fecha de actualización. Si cambia una finalidad que requiera consentimiento, se solicitará antes de utilizar los datos para ella. Puedes consultar cualquier cambio por WhatsApp.</p>`;
}
module.exports={privacyReady,renderPrivacy};
