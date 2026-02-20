const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 50, bottom: 50, left: 55, right: 55 },
  info: {
    Title: 'Manual Fubba Bubba - Guía Completa',
    Author: 'Fubba Bubba',
    Subject: 'Manual del sistema Dashboard + POS',
  },
});

const stream = fs.createWriteStream('Manual-Fubba-Bubba.pdf');
doc.pipe(stream);

// ═══════════════════════════════════════════
// COLORES
// ═══════════════════════════════════════════
const purple = '#7c3aed';
const purpleDark = '#5b21b6';
const purpleLight = '#ede9fe';
const pink = '#db2777';
const pinkLight = '#fce7f3';
const green = '#059669';
const greenLight = '#d1fae5';
const amber = '#d97706';
const amberLight = '#fef3c7';
const red = '#dc2626';
const redLight = '#fee2e2';
const blue = '#2563eb';
const blueLight = '#dbeafe';
const gray = '#6b7280';
const grayLight = '#f3f4f6';
const dark = '#1f2937';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
function drawRoundedRect(x, y, w, h, r, fillColor, strokeColor) {
  doc.save();
  if (fillColor) doc.fillColor(fillColor);
  if (strokeColor) doc.strokeColor(strokeColor).lineWidth(1);
  doc.roundedRect(x, y, w, h, r);
  if (fillColor && strokeColor) doc.fillAndStroke();
  else if (fillColor) doc.fill();
  else if (strokeColor) doc.stroke();
  doc.restore();
}

function sectionTitle(text, color = purple) {
  doc.moveDown(0.8);
  const y = doc.y;
  drawRoundedRect(doc.x - 5, y - 4, 500, 30, 6, color);
  doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text(text, doc.x, y, { continued: false });
  doc.moveDown(0.5);
  doc.fillColor(dark);
}

function subTitle(text, color = purpleDark) {
  doc.moveDown(0.4);
  doc.fillColor(color).fontSize(13).font('Helvetica-Bold').text(text);
  doc.fillColor(dark).font('Helvetica');
  doc.moveDown(0.2);
}

function paragraph(text) {
  doc.fontSize(10.5).font('Helvetica').fillColor(dark).text(text, { lineGap: 3 });
  doc.moveDown(0.3);
}

function bulletPoint(text, bulletColor = purple) {
  const x = doc.x;
  const y = doc.y;
  doc.save();
  doc.fillColor(bulletColor).fontSize(10.5);
  doc.text('●', x, y, { continued: false, width: 15 });
  doc.restore();
  doc.fillColor(dark).fontSize(10.5).font('Helvetica');
  doc.text(text, x + 18, y, { width: 470, lineGap: 2 });
  doc.moveDown(0.15);
}

function tipBox(text, bgColor = amberLight, iconColor = amber, label = 'Tip') {
  doc.moveDown(0.3);
  const y = doc.y;
  drawRoundedRect(doc.x - 3, y - 3, 500, 40, 6, bgColor);
  doc.fillColor(iconColor).fontSize(10).font('Helvetica-Bold').text(`💡 ${label}: `, doc.x + 5, y + 5, { continued: true });
  doc.fillColor(dark).font('Helvetica').text(text, { lineGap: 2 });
  doc.y = y + 45;
  doc.moveDown(0.2);
}

function infoBox(title, items, bgColor = blueLight, titleColor = blue) {
  doc.moveDown(0.3);
  const startY = doc.y;
  const boxHeight = 20 + items.length * 18;
  drawRoundedRect(doc.x - 3, startY - 3, 500, boxHeight, 6, bgColor);
  doc.fillColor(titleColor).fontSize(10.5).font('Helvetica-Bold').text(title, doc.x + 8, startY + 5);
  doc.fillColor(dark).font('Helvetica').fontSize(10);
  items.forEach((item, i) => {
    doc.text(`  → ${item}`, doc.x + 8, startY + 22 + i * 18);
  });
  doc.y = startY + boxHeight + 5;
  doc.moveDown(0.2);
}

function checkPage(needed = 100) {
  if (doc.y > 680 - needed) {
    doc.addPage();
  }
}

// ═══════════════════════════════════════════
// PORTADA
// ═══════════════════════════════════════════
// Fondo gradient header
drawRoundedRect(0, 0, 650, 320, 0, purple);
drawRoundedRect(0, 200, 650, 120, 0, purpleDark);

// Título
doc.fillColor('white').fontSize(42).font('Helvetica-Bold');
doc.text('Fubba Bubba', 0, 80, { align: 'center' });
doc.fontSize(18).font('Helvetica');
doc.text('Manual del Sistema', 0, 135, { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(13).fillColor('#e9d5ff');
doc.text('Dashboard de Gestión + Punto de Venta (POS)', 0, 170, { align: 'center' });

// Info box en portada
drawRoundedRect(130, 230, 350, 70, 10, 'white');
doc.fillColor(purple).fontSize(11).font('Helvetica-Bold');
doc.text('Preparado para:', 150, 245, { width: 310, align: 'center' });
doc.fillColor(dark).fontSize(13);
doc.text('Fubba Bubba - San Luis Potosí, México', 150, 262, { width: 310, align: 'center' });
doc.fillColor(gray).fontSize(9).font('Helvetica');
doc.text('6 Sucursales · Febrero 2026', 150, 282, { width: 310, align: 'center' });

// Contenido después de la portada
doc.y = 360;

doc.fillColor(dark).fontSize(11).font('Helvetica');
doc.text('Este manual explica paso a paso cómo funciona tu sistema de Fubba Bubba: desde el Dashboard donde administras todo tu negocio, hasta el Punto de Venta (POS) donde tus cajeros cobran a los clientes.', { lineGap: 3, width: 500 });
doc.moveDown(0.5);

// Índice
drawRoundedRect(doc.x - 3, doc.y - 3, 500, 200, 8, grayLight);
doc.fillColor(purpleDark).fontSize(14).font('Helvetica-Bold').text('📋 Contenido', doc.x + 10, doc.y + 8);
doc.moveDown(0.4);
const tocItems = [
  '1. ¿Qué es tu sistema?  ............................  Visión general',
  '2. El Dashboard  ........................................  Tu centro de control',
  '3. El Punto de Venta (POS)  ......................  Para cobrar',
  '4. Modo Offline  .........................................  Sin internet',
  '5. Reportes y CSV  .....................................  Exportar datos',
  '6. Configuración  ........................................  Ajustes del sistema',
  '7. Flujo de datos  .......................................  Cómo se conecta todo',
  '8. Preguntas frecuentes  ............................  FAQ',
];
doc.fillColor(dark).fontSize(10).font('Helvetica');
tocItems.forEach(item => {
  doc.text(item, doc.x + 15, doc.y + 2, { lineGap: 5 });
});
doc.y += 10;

// ═══════════════════════════════════════════
// SECCIÓN 1: VISIÓN GENERAL
// ═══════════════════════════════════════════
doc.addPage();
sectionTitle('1. ¿Qué es tu sistema?', purple);

paragraph('Tu sistema de Fubba Bubba es una aplicación web que tiene dos partes principales que trabajan juntas:');

doc.moveDown(0.3);
// Dashboard box
drawRoundedRect(doc.x - 3, doc.y, 240, 80, 8, purpleLight);
doc.fillColor(purple).fontSize(12).font('Helvetica-Bold').text('🖥️ Dashboard', doc.x + 10, doc.y + 10);
doc.fillColor(dark).fontSize(9.5).font('Helvetica');
doc.text('Para ti (Carlos) y gerentes.\nVer ventas, administrar productos,\nempleados, inventario y reportes.', doc.x + 10, doc.y + 2, { width: 215 });

// POS box
const posBoxX = doc.x + 255;
drawRoundedRect(posBoxX, doc.y - 45, 240, 80, 8, pinkLight);
doc.fillColor(pink).fontSize(12).font('Helvetica-Bold').text('📱 Punto de Venta', posBoxX + 10, doc.y - 35);
doc.fillColor(dark).fontSize(9.5).font('Helvetica');
doc.text('Para tus cajeros.\nCobrar clientes, manejar pagos,\nimprimir tickets.', posBoxX + 10, doc.y - 18, { width: 215 });

doc.y += 50;
doc.moveDown(0.5);

paragraph('Ambas partes se conectan a Supabase, que es tu base de datos en la nube. Ahí se guarda TODO: productos, ventas, empleados, inventario. Esto significa que puedes ver las ventas de cualquier sucursal desde cualquier lugar.');

tipBox('Tu app funciona en cualquier navegador (Chrome, Safari, etc.) y no necesita instalarse como app nativa.', greenLight, green, 'Ventaja');

// ═══════════════════════════════════════════
// SECCIÓN 2: DASHBOARD
// ═══════════════════════════════════════════
checkPage(200);
doc.addPage();
sectionTitle('2. El Dashboard - Tu Centro de Control', purple);

paragraph('Cuando abres tu app, llegas al Dashboard. En el lado izquierdo tienes un menú morado con todas las secciones:');

doc.moveDown(0.3);

// Dashboard sections
const sections = [
  { name: '🏠 Inicio', desc: 'Pantalla principal con resumen del día: ventas totales, número de órdenes, ticket promedio y gráfica de los últimos 7 días.', color: purple },
  { name: '🛒 Ventas', desc: 'Lista de todas las ventas realizadas. Puedes filtrar por fecha, sucursal y método de pago. Ver detalle de cada venta.', color: blue },
  { name: '🏦 Cierres de Caja', desc: 'Registro de cuándo se abrió y cerró cada caja, con el conteo de efectivo y diferencias.', color: green },
  { name: '⭐ Lealtad', desc: 'Programa de sellos para clientes frecuentes. Cada compra = 1 sello. 10 sellos = 1 bebida gratis.', color: amber },
  { name: '🧋 Productos', desc: 'Tu catálogo completo: bebidas, toppings, modificadores. Nombre, precio, categoría, si está activo.', color: pink },
  { name: '👥 Empleados', desc: 'Tu equipo: nombre, sucursal, puesto, PIN de acceso al POS. Puedes activar/desactivar empleados.', color: purpleDark },
];

sections.forEach(s => {
  checkPage(55);
  const y = doc.y;
  drawRoundedRect(doc.x - 3, y, 500, 42, 6, grayLight);
  doc.fillColor(s.color).fontSize(11).font('Helvetica-Bold').text(s.name, doc.x + 8, y + 5);
  doc.fillColor(dark).fontSize(9.5).font('Helvetica').text(s.desc, doc.x + 8, y + 22, { width: 480 });
  doc.y = y + 48;
});

const sections2 = [
  { name: '🏪 Sucursales', desc: 'Las 6 sucursales con nombre, código y dirección. Puedes editar la info de cada una.', color: green },
  { name: '📦 Inventario', desc: 'Stock de cada producto por sucursal. Se descuenta automáticamente al vender.', color: amber },
  { name: '📈 Análisis', desc: 'Gráficas detalladas: ventas por hora, productos más vendidos, comparación entre sucursales.', color: blue },
  { name: '📊 Reportes', desc: 'Genera reportes en CSV (Excel): ventas, productos, inventario, empleados, cierres de caja.', color: purple },
  { name: '⚙️ Configuración', desc: 'Datos del negocio, IVA, sucursales, caché de la app y zona de peligro.', color: gray },
];

checkPage(300);
doc.addPage();
doc.fillColor(purpleDark).fontSize(14).font('Helvetica-Bold').text('Dashboard (continuación)');
doc.moveDown(0.5);

sections2.forEach(s => {
  checkPage(55);
  const y = doc.y;
  drawRoundedRect(doc.x - 3, y, 500, 42, 6, grayLight);
  doc.fillColor(s.color).fontSize(11).font('Helvetica-Bold').text(s.name, doc.x + 8, y + 5);
  doc.fillColor(dark).fontSize(9.5).font('Helvetica').text(s.desc, doc.x + 8, y + 22, { width: 480 });
  doc.y = y + 48;
});

doc.moveDown(0.3);
tipBox('Todas las secciones se actualizan en tiempo real con los datos de Supabase.', greenLight, green, 'Dato');

// ═══════════════════════════════════════════
// SECCIÓN 3: POS
// ═══════════════════════════════════════════
doc.addPage();
sectionTitle('3. El Punto de Venta (POS) - Para Cobrar', pink);

paragraph('El POS es la pantalla que usan tus cajeros todos los días. Es pantalla completa (sin el menú lateral) para que sea fácil de usar en tablets. Así funciona paso a paso:');

doc.moveDown(0.5);

// Paso 1
checkPage(80);
drawRoundedRect(doc.x - 3, doc.y, 500, 65, 8, purpleLight);
doc.fillColor(purple).fontSize(13).font('Helvetica-Bold').text('Paso 1: Login con PIN', doc.x + 10, doc.y + 8);
doc.fillColor(dark).fontSize(10).font('Helvetica');
doc.text('El cajero escribe su PIN de 4 dígitos (ejemplo: 1234). El sistema automáticamente identifica quién es y en qué sucursal trabaja. No necesita usuario ni contraseña, solo el PIN.', doc.x + 10, doc.y + 4, { width: 475 });
doc.y += 10;
doc.moveDown(0.5);

// Paso 2
checkPage(80);
drawRoundedRect(doc.x - 3, doc.y, 500, 65, 8, blueLight);
doc.fillColor(blue).fontSize(13).font('Helvetica-Bold').text('Paso 2: Seleccionar Productos', doc.x + 10, doc.y + 8);
doc.fillColor(dark).fontSize(10).font('Helvetica');
doc.text('Aparece una cuadrícula con todos los productos disponibles. El cajero puede filtrar por categoría (bebidas, toppings, etc.). Toca un producto y se agrega al carrito del lado derecho.', doc.x + 10, doc.y + 4, { width: 475 });
doc.y += 10;
doc.moveDown(0.5);

// Paso 3
checkPage(90);
drawRoundedRect(doc.x - 3, doc.y, 500, 80, 8, greenLight);
doc.fillColor(green).fontSize(13).font('Helvetica-Bold').text('Paso 3: El Carrito', doc.x + 10, doc.y + 8);
doc.fillColor(dark).fontSize(10).font('Helvetica');
doc.text('En el lado derecho se ven los productos agregados con:\n• Cantidad de cada producto (se puede cambiar con + y -)\n• Precio unitario y subtotal por producto\n• Al final: Subtotal + IVA (16%) = Total a cobrar', doc.x + 10, doc.y + 4, { width: 475 });
doc.y += 10;
doc.moveDown(0.5);

// Paso 4
checkPage(90);
drawRoundedRect(doc.x - 3, doc.y, 500, 80, 8, pinkLight);
doc.fillColor(pink).fontSize(13).font('Helvetica-Bold').text('Paso 4: Cobrar', doc.x + 10, doc.y + 8);
doc.fillColor(dark).fontSize(10).font('Helvetica');
doc.text('El cajero presiona "Cobrar" y elige el método de pago:\n• 💵 Efectivo → Ingresa cuánto dio el cliente, el sistema calcula el cambio\n• 💳 Tarjeta → Para pagos con Mercado Pago\n• 🏦 Transferencia → Para pagos por SPEI', doc.x + 10, doc.y + 4, { width: 475 });
doc.y += 10;
doc.moveDown(0.5);

// Paso 5
checkPage(80);
drawRoundedRect(doc.x - 3, doc.y, 500, 65, 8, amberLight);
doc.fillColor(amber).fontSize(13).font('Helvetica-Bold').text('Paso 5: Ticket / Recibo', doc.x + 10, doc.y + 8);
doc.fillColor(dark).fontSize(10).font('Helvetica');
doc.text('Después de cobrar aparece un resumen tipo ticket con todos los detalles de la venta. Se puede compartir por WhatsApp al cliente o imprimir en impresora de tickets (58mm).', doc.x + 10, doc.y + 4, { width: 475 });
doc.y += 10;
doc.moveDown(0.5);

checkPage(60);
tipBox('Si el cajero se equivoca, puede quitar productos del carrito antes de cobrar. También puede aplicar descuentos.', amberLight, amber, 'Tip');

// Funciones extra del POS
checkPage(200);
doc.addPage();
subTitle('Funciones Extra del POS', pink);

const posFeatures = [
  ['Abrir/Cerrar Caja', 'Al inicio del turno se abre la caja con el monto inicial. Al final se cierra con el conteo de efectivo.'],
  ['Modificadores', 'Si un producto tiene opciones (tamaño, topping extra, leche de almendra, etc.) aparece un modal para elegir.'],
  ['Descuentos', 'Se puede aplicar descuento porcentual o fijo a toda la orden.'],
  ['Programa de Lealtad', 'Si el cliente da su teléfono, se busca y se le agrega un sello. 10 sellos = 1 bebida gratis.'],
  ['Reembolsos', 'Si hay que devolver dinero, se registra el reembolso ligado a la orden original.'],
  ['Movimientos de Caja', 'Registrar entradas y salidas de efectivo que no sean ventas (ej: cambio, gastos menores).'],
];

posFeatures.forEach(([title, desc]) => {
  checkPage(45);
  bulletPoint(`${title}: ${desc}`, pink);
  doc.moveDown(0.15);
});

// ═══════════════════════════════════════════
// SECCIÓN 4: MODO OFFLINE
// ═══════════════════════════════════════════
checkPage(200);
doc.moveDown(0.5);
sectionTitle('4. Modo Offline - Vender Sin Internet', red);

paragraph('Esta función es muy importante. Si se cae el internet en alguna sucursal, tus cajeros pueden seguir vendiendo sin perder ni una venta. Así funciona:');

doc.moveDown(0.3);

// Steps
const offlineSteps = [
  { num: '1', title: 'Se cae el internet', desc: 'Aparece un indicador ROJO arriba que dice "Sin conexión". El cajero sabe que está offline.', color: red, bg: redLight },
  { num: '2', title: 'El cajero sigue cobrando', desc: 'Cobra exactamente igual que siempre. La venta se guarda en la memoria del dispositivo (no se pierde).', color: amber, bg: amberLight },
  { num: '3', title: 'Contador de pendientes', desc: 'Aparece un botón AMARILLO que dice cuántas ventas están pendientes de subir (ej: "3 pendientes").', color: amber, bg: amberLight },
  { num: '4', title: 'Regresa el internet', desc: 'AUTOMÁTICAMENTE sube todas las ventas pendientes a Supabase. Aparece un mensaje VERDE de confirmación.', color: green, bg: greenLight },
];

offlineSteps.forEach(s => {
  checkPage(55);
  const y = doc.y;
  drawRoundedRect(doc.x - 3, y, 500, 45, 6, s.bg);
  doc.fillColor('white');
  drawRoundedRect(doc.x + 5, y + 8, 25, 25, 12, s.color);
  doc.fillColor('white').fontSize(14).font('Helvetica-Bold').text(s.num, doc.x + 12, y + 12);
  doc.fillColor(s.color).fontSize(11).font('Helvetica-Bold').text(s.title, doc.x + 40, y + 5);
  doc.fillColor(dark).fontSize(9.5).font('Helvetica').text(s.desc, doc.x + 40, y + 22, { width: 450 });
  doc.y = y + 50;
});

doc.moveDown(0.3);

drawRoundedRect(doc.x - 3, doc.y, 500, 35, 6, greenLight);
doc.fillColor(green).fontSize(11).font('Helvetica-Bold').text('✅ Resultado: NUNCA pierdes una venta, aunque no haya internet.', doc.x + 10, doc.y + 10);
doc.y += 42;

doc.moveDown(0.3);
tipBox('También puedes tocar el botón amarillo para forzar la sincronización manualmente.', amberLight, amber, 'Tip');

// ═══════════════════════════════════════════
// SECCIÓN 5: REPORTES
// ═══════════════════════════════════════════
doc.addPage();
sectionTitle('5. Reportes y CSV - Exportar Datos', blue);

paragraph('En la sección de Reportes puedes generar archivos CSV que se abren directamente en Excel. Tienes 6 tipos de reporte:');

doc.moveDown(0.3);

const reportTypes = [
  { name: '📋 Ventas Detalladas', desc: 'Cada venta individual con fecha, productos, montos, método de pago y empleado que cobró.' },
  { name: '📊 Resumen de Ventas', desc: 'Totales por día: cuántas ventas, ingreso total, ticket promedio. Ideal para ver tendencias.' },
  { name: '🧋 Productos', desc: 'Catálogo completo con nombre, precio, categoría y si están activos.' },
  { name: '📦 Inventario', desc: 'Stock actual de cada producto en cada sucursal. Útil para pedidos a proveedores.' },
  { name: '👥 Empleados', desc: 'Lista del equipo con sucursal, puesto y estatus (activo/inactivo).' },
  { name: '🏦 Cierres de Caja', desc: 'Historial de aperturas y cierres con montos iniciales, finales y diferencias.' },
];

reportTypes.forEach(r => {
  checkPage(40);
  bulletPoint(`${r.name}: ${r.desc}`, blue);
  doc.moveDown(0.1);
});

doc.moveDown(0.3);
subTitle('¿Cómo generar un reporte?', blue);

paragraph('1. Ve a la sección "Reportes" en el menú lateral');
paragraph('2. Elige el tipo de reporte que quieres');
paragraph('3. Selecciona el periodo: hoy, esta semana, este mes, o fechas personalizadas');
paragraph('4. (Opcional) Filtra por sucursal específica');
paragraph('5. Dale "Vista Previa" para ver los datos en pantalla');
paragraph('6. Si se ve bien, dale "Descargar CSV" y se baja un archivo que abres en Excel');

tipBox('Los archivos CSV se abren perfectamente en Excel con acentos y ñ, no te preocupes por caracteres raros.', greenLight, green, 'Dato');

// ═══════════════════════════════════════════
// SECCIÓN 6: CONFIGURACIÓN
// ═══════════════════════════════════════════
checkPage(200);
doc.addPage();
sectionTitle('6. Configuración - Ajustes del Sistema', gray);

paragraph('En esta sección puedes personalizar tu sistema:');

doc.moveDown(0.3);

const configSections = [
  { title: '🏢 Datos del Negocio', items: ['Nombre del negocio, slogan, teléfono, email', 'Se guardan localmente y se usan en tickets y reportes'] },
  { title: '💰 Impuestos y Moneda', items: ['IVA configurado al 16% (se puede cambiar)', 'Moneda: MXN (pesos mexicanos)', 'Zona horaria: América/México_City'] },
  { title: '🏪 Sucursales', items: ['Ver y editar las 6 sucursales', 'Cambiar nombre, código o dirección'] },
  { title: '🧾 Configuración de Tickets', items: ['Formato: 58mm (térmico estándar)', 'Incluye: logo, datos del negocio, detalle, IVA, método de pago'] },
  { title: '📱 App y Caché', items: ['Ver estado del Service Worker (para modo offline)', 'Limpiar caché si algo no funciona bien'] },
];

configSections.forEach(s => {
  checkPage(70);
  const y = doc.y;
  const boxH = 20 + s.items.length * 16;
  drawRoundedRect(doc.x - 3, y, 500, boxH, 6, grayLight);
  doc.fillColor(purpleDark).fontSize(11).font('Helvetica-Bold').text(s.title, doc.x + 8, y + 5);
  doc.fillColor(dark).fontSize(9.5).font('Helvetica');
  s.items.forEach((item, i) => {
    doc.text(`  → ${item}`, doc.x + 12, y + 22 + i * 16, { width: 470 });
  });
  doc.y = y + boxH + 8;
});

// ═══════════════════════════════════════════
// SECCIÓN 7: FLUJO DE DATOS
// ═══════════════════════════════════════════
checkPage(250);
doc.moveDown(0.5);
sectionTitle('7. Cómo Se Conecta Todo', purpleDark);

paragraph('Aquí te explico cómo fluye la información en tu sistema:');

doc.moveDown(0.5);

// Flow diagram with boxes
const flowY = doc.y;
const boxW = 140;
const boxH = 50;

// POS Box
drawRoundedRect(55, flowY, boxW, boxH, 8, pinkLight);
drawRoundedRect(55, flowY, boxW, 20, 8, pink);
doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text('PUNTO DE VENTA', 60, flowY + 4, { width: 130, align: 'center' });
doc.fillColor(dark).fontSize(8).font('Helvetica').text('Cajeros cobran aquí', 60, flowY + 28, { width: 130, align: 'center' });

// Arrow 1
doc.fillColor(gray).fontSize(16).text('→', 200, flowY + 15);

// Supabase Box
drawRoundedRect(225, flowY, boxW, boxH, 8, greenLight);
drawRoundedRect(225, flowY, boxW, 20, 8, green);
doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text('SUPABASE', 230, flowY + 4, { width: 130, align: 'center' });
doc.fillColor(dark).fontSize(8).font('Helvetica').text('Base de datos nube', 230, flowY + 28, { width: 130, align: 'center' });

// Arrow 2
doc.fillColor(gray).fontSize(16).text('→', 370, flowY + 15);

// Dashboard Box
drawRoundedRect(395, flowY, boxW, boxH, 8, purpleLight);
drawRoundedRect(395, flowY, boxW, 20, 8, purple);
doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text('DASHBOARD', 400, flowY + 4, { width: 130, align: 'center' });
doc.fillColor(dark).fontSize(8).font('Helvetica').text('Tú ves todo aquí', 400, flowY + 28, { width: 130, align: 'center' });

doc.y = flowY + boxH + 15;

// Offline flow
drawRoundedRect(55, doc.y, 480, 40, 8, amberLight);
doc.fillColor(amber).fontSize(9).font('Helvetica-Bold').text('📴 Si no hay internet:', 65, doc.y + 5);
doc.fillColor(dark).fontSize(9).font('Helvetica').text('POS → Guarda en el dispositivo → Regresa internet → Se sube automáticamente a Supabase', 65, doc.y + 22, { width: 460 });
doc.y += 50;

doc.moveDown(0.3);
paragraph('En resumen:');
bulletPoint('Todo lo que pasa en el POS se sube a Supabase automáticamente', green);
bulletPoint('Todo lo que ves en el Dashboard viene de Supabase', blue);
bulletPoint('Si no hay internet, las ventas se guardan local y se suben después', amber);

// ═══════════════════════════════════════════
// SECCIÓN 8: FAQ
// ═══════════════════════════════════════════
doc.addPage();
sectionTitle('8. Preguntas Frecuentes', purple);

const faqs = [
  { q: '¿Se pierde una venta si se va el internet?', a: 'No. La venta se guarda en el dispositivo y se sube automáticamente cuando regresa el internet.' },
  { q: '¿Cómo agrego un nuevo empleado?', a: 'Ve a Dashboard → Empleados → Agregar. Ponle nombre, sucursal, puesto y un PIN de 4 dígitos.' },
  { q: '¿Cómo cambio el precio de un producto?', a: 'Ve a Dashboard → Productos → Click en el producto → Editar → Cambiar precio → Guardar.' },
  { q: '¿Puedo ver las ventas de otra sucursal?', a: 'Sí. En el Dashboard puedes filtrar por cualquier sucursal o ver todas juntas.' },
  { q: '¿Cómo funciona el programa de lealtad?', a: 'El cajero busca al cliente por teléfono. Cada compra le da 1 sello. Cuando junta 10 sellos, su siguiente bebida es gratis.' },
  { q: '¿Los reportes se pueden abrir en Excel?', a: 'Sí. Se descargan como CSV, que se abre directamente en Excel con todos los acentos correctos.' },
  { q: '¿Qué pasa si un cajero olvida su PIN?', a: 'Tú (como admin) puedes ver y cambiar el PIN del empleado desde Dashboard → Empleados.' },
  { q: '¿Funciona en celular/tablet?', a: 'Sí. Es una app web responsive. El POS está optimizado para tablets y el Dashboard para computadora.' },
  { q: '¿Necesito instalar algo?', a: 'No. Solo necesitas un navegador (Chrome recomendado). Se puede "instalar" como PWA para acceso rápido.' },
  { q: '¿Cómo abro y cierro caja?', a: 'En el POS, el cajero abre caja al inicio del turno ingresando el monto inicial. Al final, cierra caja contando el efectivo.' },
];

faqs.forEach(({ q, a }) => {
  checkPage(55);
  const y = doc.y;
  doc.fillColor(purple).fontSize(10.5).font('Helvetica-Bold').text(`¿ ${q}`, doc.x, y, { width: 490 });
  doc.fillColor(dark).fontSize(10).font('Helvetica').text(a, doc.x, doc.y + 2, { width: 490, lineGap: 2 });
  doc.moveDown(0.5);
  // Separator line
  doc.save().strokeColor('#e5e7eb').lineWidth(0.5).moveTo(doc.x, doc.y).lineTo(doc.x + 495, doc.y).stroke().restore();
  doc.moveDown(0.3);
});

// ═══════════════════════════════════════════
// TABLA RESUMEN
// ═══════════════════════════════════════════
checkPage(200);
doc.addPage();
sectionTitle('Resumen Rápido', purpleDark);
doc.moveDown(0.3);

// Table header
const tableX = doc.x - 3;
const colWidths = [120, 200, 170];
const tableW = colWidths.reduce((a, b) => a + b, 0);
let tableY = doc.y;

drawRoundedRect(tableX, tableY, tableW, 25, 4, purple);
doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
doc.text('¿QUÉ?', tableX + 10, tableY + 7, { width: colWidths[0] });
doc.text('¿PARA QUÉ?', tableX + colWidths[0] + 10, tableY + 7, { width: colWidths[1] });
doc.text('¿QUIÉN LO USA?', tableX + colWidths[0] + colWidths[1] + 10, tableY + 7, { width: colWidths[2] });
tableY += 25;

const tableRows = [
  ['Dashboard', 'Administrar, reportes, inventario', 'Tú (Carlos)'],
  ['POS', 'Cobrar a los clientes', 'Tus cajeros'],
  ['Supabase', 'Guardar toda la información', 'Automático'],
  ['Modo Offline', 'No perder ventas sin internet', 'Se activa solo'],
  ['Reportes CSV', 'Exportar datos a Excel', 'Tú (Carlos)'],
  ['Lealtad', 'Sellos y bebidas gratis', 'Cajeros + clientes'],
];

tableRows.forEach((row, i) => {
  const bg = i % 2 === 0 ? grayLight : 'white';
  drawRoundedRect(tableX, tableY, tableW, 22, 0, bg);
  doc.fillColor(dark).fontSize(9.5).font(i === 0 ? 'Helvetica' : 'Helvetica');
  doc.font('Helvetica-Bold').text(row[0], tableX + 10, tableY + 6, { width: colWidths[0] });
  doc.font('Helvetica').text(row[1], tableX + colWidths[0] + 10, tableY + 6, { width: colWidths[1] });
  doc.text(row[2], tableX + colWidths[0] + colWidths[1] + 10, tableY + 6, { width: colWidths[2] });
  tableY += 22;
});

// Border around table
doc.save().strokeColor(purple).lineWidth(1).roundedRect(tableX, doc.y, tableW, tableY - doc.y, 4).stroke().restore();

doc.y = tableY + 20;

// ═══════════════════════════════════════════
// PIE DE PÁGINA / CIERRE
// ═══════════════════════════════════════════
doc.moveDown(1);
drawRoundedRect(doc.x - 3, doc.y, 500, 80, 10, purpleLight);
doc.fillColor(purple).fontSize(14).font('Helvetica-Bold').text('¡Listo! 🧋', doc.x + 10, doc.y + 12, { width: 480, align: 'center' });
doc.fillColor(dark).fontSize(10.5).font('Helvetica');
doc.text('Tu sistema de Fubba Bubba está completo y listo para usarse.', doc.x + 10, doc.y + 5, { width: 480, align: 'center' });
doc.text('Si tienes dudas, consulta este manual o pregúntale a tu equipo de desarrollo.', doc.x + 10, doc.y + 3, { width: 480, align: 'center' });
doc.y += 20;

doc.moveDown(1.5);
doc.fillColor(gray).fontSize(8).font('Helvetica').text('Fubba Bubba © 2026 · San Luis Potosí, México · Manual v1.0', { align: 'center' });

// ═══════════════════════════════════════════
doc.end();

stream.on('finish', () => {
  console.log('✅ PDF generado: Manual-Fubba-Bubba.pdf');
});
