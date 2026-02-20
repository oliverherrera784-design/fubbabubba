// Utilidades para generar tickets de venta — Formato fiscal mexicano

export interface TicketData {
  ordenNumero: number;
  fecha: string; // ISO string
  sucursal: string;
  sucursalId?: number;
  items: {
    cantidad: number;
    nombre: string;
    modificadores?: { nombre: string; precio: number }[];
    subtotal: number;
  }[];
  subtotal: number;
  descuento?: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  plataforma?: string | null;
  cambio?: number;
  montoPagado?: number;
  folio?: string; // UUID de la orden
  folioCon?: number; // Folio consecutivo por sucursal
  mesero?: string;
  personas?: number;
  cajero?: string;
  nombreCliente?: string | null;
}

// === DATOS FISCALES ===
const RAZON_SOCIAL = 'ANA FERNANDA PRECIADO TORRES';
const RFC_FISCAL = 'PETA021125G37';
const DIRECCION_FISCAL = 'ESCOBEDO 215, COL CENTRO SAN LUIS POTOSI MEXICO CP 78000';

// === DIRECCIONES DE SUCURSALES ===
// Carlos: edita aquí las direcciones y teléfonos de cada sucursal
export const SUCURSAL_INFO: Record<number, { direccion: string; telefono: string }> = {
  1: { direccion: '', telefono: '' }, // Sendero
  2: { direccion: '', telefono: '' }, // Dorado
  3: { direccion: '', telefono: '' }, // Escobedo
  4: { direccion: '', telefono: '' }, // Palacio
  5: { direccion: '', telefono: '' }, // Carranza
  6: { direccion: '', telefono: '' }, // Zaragoza
};

const LINE_WIDTH = 32; // chars para 58mm

function pad(left: string, right: string, width = LINE_WIDTH): string {
  const space = width - left.length - right.length;
  if (space <= 0) return left + ' ' + right;
  return left + ' '.repeat(space) + right;
}

function center(text: string, width = LINE_WIDTH): string {
  const space = Math.max(0, width - text.length);
  const left = Math.floor(space / 2);
  return ' '.repeat(left) + text;
}

function line(char = '=', width = LINE_WIDTH): string {
  return char.repeat(width);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.substring(0, max - 1) + '.';
}

function formatMoney(n: number): string {
  return '$' + n.toFixed(2);
}

function formatFechaTicket(isoStr: string): string {
  const d = new Date(isoStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${mins}:${secs} ${ampm}`;
}

function centerMultiline(text: string, width = LINE_WIDTH): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > width) {
      lines.push(center(currentLine.trim(), width));
      currentLine = word;
    } else {
      currentLine = (currentLine + ' ' + word).trim();
    }
  }
  if (currentLine) lines.push(center(currentLine, width));
  return lines;
}

// === TOTAL EN LETRA ===
const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const ESPECIALES = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
const DECENAS = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function convertirGrupo(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  let resultado = '';
  const centena = Math.floor(n / 100);
  const resto = n % 100;

  if (centena > 0) {
    resultado += CENTENAS[centena];
    if (resto > 0) resultado += ' ';
  }

  if (resto >= 10 && resto <= 19) {
    resultado += ESPECIALES[resto - 10];
  } else if (resto >= 21 && resto <= 29) {
    resultado += 'VEINTI' + UNIDADES[resto - 20];
  } else {
    const decena = Math.floor(resto / 10);
    const unidad = resto % 10;
    if (decena > 0) {
      resultado += DECENAS[decena];
      if (unidad > 0) resultado += ' Y ';
    }
    if (unidad > 0) {
      resultado += UNIDADES[unidad];
    }
  }

  return resultado;
}

function totalEnLetraEntero(n: number): string {
  if (n === 0) return '';
  if (n >= 1000) {
    const miles = Math.floor(n / 1000);
    const resto = n % 1000;
    let texto = miles === 1 ? 'MIL' : convertirGrupo(miles) + ' MIL';
    if (resto > 0) texto += ' ' + convertirGrupo(resto);
    return texto;
  }
  return convertirGrupo(n);
}

export function totalEnLetra(monto: number): string {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const centavosStr = String(centavos).padStart(2, '0');

  if (entero === 0) return `CERO PESOS ${centavosStr}/100 M.N.`;

  let texto = '';
  if (entero >= 1000000) {
    const millones = Math.floor(entero / 1000000);
    const resto = entero % 1000000;
    texto += millones === 1 ? 'UN MILLON' : convertirGrupo(millones) + ' MILLONES';
    if (resto > 0) texto += ' ' + totalEnLetraEntero(resto);
  } else {
    texto = totalEnLetraEntero(entero);
  }

  return `${texto} PESOS ${centavosStr}/100 M.N.`;
}

function metodoLabel(metodo: string, plataforma?: string | null): string {
  if (plataforma) {
    const platLabel: Record<string, string> = { uber_eats: 'Uber Eats', rappi: 'Rappi', didi: 'Didi' };
    return `${platLabel[plataforma] || plataforma} (${metodo === 'app_plataforma' ? 'App' : 'Efvo'})`;
  }
  switch (metodo) {
    case 'efectivo': return 'Efectivo';
    case 'tarjeta': return 'Tarjeta';
    case 'app_plataforma': return 'App Plataforma';
    default: return metodo;
  }
}

/**
 * Genera el ticket como texto plano para impresora térmica 58mm — formato fiscal
 */
export function generarTicketTexto(data: TicketData): string {
  const lines: string[] = [];
  const sucInfo = data.sucursalId ? SUCURSAL_INFO[data.sucursalId] : null;

  // === ENCABEZADO FISCAL ===
  lines.push(center('FUBBA BUBBA'));
  lines.push(center(RAZON_SOCIAL));
  lines.push(center(RFC_FISCAL));
  lines.push(...centerMultiline(DIRECCION_FISCAL));
  lines.push(center('LUGAR DE EXPEDICION'));
  if (sucInfo?.direccion) {
    lines.push(...centerMultiline(sucInfo.direccion));
  } else {
    lines.push(center(data.sucursal));
  }
  if (sucInfo?.telefono) {
    lines.push(center(`TEL: ${sucInfo.telefono}`));
  }
  lines.push(line('='));

  // === DATOS DE LA ORDEN ===
  if (data.mesero) {
    lines.push(`MESERO: ${data.mesero}`);
  }
  const personasOrden: string[] = [];
  if (data.personas) personasOrden.push(`PERSONAS: ${data.personas}`);
  personasOrden.push(`ORDEN: ${data.ordenNumero}`);
  lines.push(personasOrden.join('     '));

  if (data.folioCon) {
    lines.push(`FOLIO: ${data.folioCon}`);
  }

  const fechaStr = formatFechaTicket(data.fecha);
  lines.push(fechaStr);

  if (data.cajero) {
    lines.push(`CAJERO: ${data.cajero}`);
  }
  if (data.nombreCliente) {
    lines.push(`CLIENTE: ${data.nombreCliente}`);
  }
  lines.push(line('='));

  // === TABLA DE PRODUCTOS ===
  lines.push(pad('CANT.', pad('DESCRIPCION', 'IMPORTE', LINE_WIDTH - 6)));
  for (const item of data.items) {
    const qty = `  ${item.cantidad}   `;
    const price = formatMoney(item.subtotal);
    const nameMaxLen = LINE_WIDTH - qty.length - price.length - 1;
    const name = truncate(item.nombre.toUpperCase(), nameMaxLen);
    lines.push(pad(qty + name, price));

    if (item.modificadores && item.modificadores.length > 0) {
      for (const mod of item.modificadores) {
        const modLine = `      + ${mod.nombre}`;
        if (mod.precio > 0) {
          lines.push(pad(modLine, `+${formatMoney(mod.precio)}`));
        } else {
          lines.push(modLine);
        }
      }
    }
  }
  lines.push(line('='));

  // === TOTAL ===
  lines.push(pad('TOTAL:', formatMoney(data.total)));
  lines.push(line('='));

  // === TOTAL EN LETRA ===
  const enLetra = totalEnLetra(data.total);
  lines.push(...centerMultiline(`SON: ${enLetra}`));

  // === DESGLOSE FISCAL ===
  const subtotalFiscal = data.total / 1.16;
  const ivaFiscal = data.total - subtotalFiscal;
  lines.push(pad('SUBTOTAL:', formatMoney(subtotalFiscal)));
  lines.push(pad('IVA:', formatMoney(ivaFiscal)));

  // === PAGO ===
  if (data.metodoPago) {
    lines.push(pad('PAGO:', metodoLabel(data.metodoPago, data.plataforma)));
  }
  if (data.montoPagado !== undefined && data.montoPagado > 0) {
    lines.push(pad('RECIBIDO:', formatMoney(data.montoPagado)));
  }
  if (data.cambio !== undefined && data.cambio > 0) {
    lines.push(pad('CAMBIO:', formatMoney(data.cambio)));
  }

  lines.push(line('-'));

  // === LEYENDAS FINALES ===
  lines.push(center('ESTE NO ES UN'));
  lines.push(center('COMPROBANTE FISCAL'));
  lines.push(center('PROPINA NO INCLUIDA'));
  lines.push('');

  return lines.join('\n');
}

/**
 * Genera texto formateado para compartir por WhatsApp — formato fiscal
 */
export function generarTicketWhatsApp(data: TicketData): string {
  const lines: string[] = [];

  lines.push('🧋 *FUBBA BUBBA*');
  lines.push(`📍 ${data.sucursal}`);
  lines.push('');
  lines.push(`🧾 *Orden #${data.ordenNumero}*`);
  if (data.folioCon) lines.push(`📋 Folio: ${data.folioCon}`);
  lines.push(`📅 ${formatFechaTicket(data.fecha)}`);
  if (data.nombreCliente) lines.push(`👤 ${data.nombreCliente}`);
  lines.push('─────────────');

  for (const item of data.items) {
    lines.push(`${item.cantidad}x ${item.nombre} — ${formatMoney(item.subtotal)}`);
    if (item.modificadores && item.modificadores.length > 0) {
      for (const mod of item.modificadores) {
        const extra = mod.precio > 0 ? ` (+${formatMoney(mod.precio)})` : '';
        lines.push(`   ↳ ${mod.nombre}${extra}`);
      }
    }
  }

  lines.push('─────────────');
  const subtotalFiscal = data.total / 1.16;
  const ivaFiscal = data.total - subtotalFiscal;
  lines.push(`Subtotal: ${formatMoney(subtotalFiscal)}`);
  lines.push(`IVA (16%): ${formatMoney(ivaFiscal)}`);
  if (data.descuento && data.descuento > 0) {
    lines.push(`Descuento: -${formatMoney(data.descuento)}`);
  }
  lines.push(`*TOTAL: ${formatMoney(data.total)}*`);
  lines.push(`_${totalEnLetra(data.total)}_`);
  lines.push('');
  lines.push(`💳 ${metodoLabel(data.metodoPago, data.plataforma)}`);
  if (data.montoPagado !== undefined && data.montoPagado > 0) {
    lines.push(`💵 Recibido: ${formatMoney(data.montoPagado)}`);
  }
  if (data.cambio !== undefined && data.cambio > 0) {
    lines.push(`💰 Cambio: ${formatMoney(data.cambio)}`);
  }
  lines.push('');
  lines.push('¡Gracias por tu compra en Fubba Bubba! 🧋');

  return lines.join('\n');
}

/**
 * Abre una ventana nueva con el ticket formateado para impresión térmica 58mm
 */
export function imprimirTicket(data: TicketData): void {
  const ticketTexto = generarTicketTexto(data);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Ticket #${data.ordenNumero}</title>
<style>
  @page {
    size: 58mm auto;
    margin: 0;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    width: 58mm;
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    line-height: 1.3;
    padding: 3mm 2mm;
    color: #000;
  }
  pre {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: inherit;
    font-size: inherit;
  }
</style>
</head>
<body>
<pre>${ticketTexto}</pre>
<script>
  window.onload = function() {
    window.print();
    setTimeout(function() { window.close(); }, 1000);
  };
</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=250,height=600');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

/**
 * Abre WhatsApp con el texto del ticket
 */
export function compartirWhatsApp(data: TicketData, telefono?: string): void {
  const texto = generarTicketWhatsApp(data);
  const encoded = encodeURIComponent(texto);

  if (telefono) {
    let tel = telefono.replace(/\D/g, '');
    if (tel.length === 10) tel = '52' + tel;
    window.open(`https://wa.me/${tel}?text=${encoded}`, '_blank');
  } else {
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }
}
