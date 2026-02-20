import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/reportes?tipo=ventas_detalle&desde=ISO&hasta=ISO&sucursal_id=N
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'ventas_detalle';
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    const sucursalId = searchParams.get('sucursal_id');

    // Sucursales map para todos los reportes
    const { data: sucursales } = await supabase
      .from('sucursales')
      .select('id, nombre')
      .eq('activa', true);
    const sucMap = Object.fromEntries((sucursales || []).map(s => [s.id, s.nombre]));

    switch (tipo) {
      case 'ventas_detalle':
        return await reporteVentasDetalle(desde, hasta, sucursalId, sucMap);
      case 'ventas_resumen':
        return await reporteVentasResumen(desde, hasta, sucursalId, sucMap);
      case 'productos':
        return await reporteProductos(desde, hasta, sucursalId);
      case 'inventario':
        return await reporteInventario(sucursalId);
      case 'empleados':
        return await reporteEmpleados(desde, hasta, sucursalId, sucMap);
      case 'cierres_caja':
        return await reporteCierres(desde, hasta, sucursalId, sucMap);
      default:
        return NextResponse.json({ success: false, error: 'Tipo de reporte no válido' }, { status: 400 });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error generando reporte:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// --- Ventas Detalle: cada orden con sus items ---
async function reporteVentasDetalle(
  desde: string | null, hasta: string | null, sucursalId: string | null,
  sucMap: Record<number, string>
) {
  let query = supabase
    .from('ordenes')
    .select('id, numero_orden, sucursal_id, empleado_id, subtotal, descuento, impuesto, total, estado, created_at, pagos(metodo, monto)')
    .eq('estado', 'completada')
    .order('created_at', { ascending: false });

  if (desde) query = query.gte('created_at', desde);
  if (hasta) query = query.lte('created_at', hasta);
  if (sucursalId) query = query.eq('sucursal_id', parseInt(sucursalId));

  const { data: ordenes, error } = await query;
  if (error) throw error;

  // Fetch items for all orders
  const ordenIds = (ordenes || []).map(o => o.id);
  let allItems: { orden_id: string; nombre_producto: string; cantidad: number; precio_unitario: number; subtotal: number }[] = [];
  const batchSize = 100;
  for (let i = 0; i < ordenIds.length; i += batchSize) {
    const batch = ordenIds.slice(i, i + batchSize);
    const { data, error: itemError } = await supabase
      .from('orden_items')
      .select('orden_id, nombre_producto, cantidad, precio_unitario, subtotal')
      .in('orden_id', batch);
    if (itemError) throw itemError;
    allItems = allItems.concat(data || []);
  }

  // Empleados map
  const empleadoIds = [...new Set((ordenes || []).map(o => o.empleado_id).filter(Boolean))];
  let empMap: Record<number, string> = {};
  if (empleadoIds.length > 0) {
    const { data: emps } = await supabase
      .from('empleados')
      .select('id, nombre')
      .in('id', empleadoIds);
    empMap = Object.fromEntries((emps || []).map(e => [e.id, e.nombre]));
  }

  // Group items by orden
  const itemsByOrden: Record<string, typeof allItems> = {};
  for (const item of allItems) {
    if (!itemsByOrden[item.orden_id]) itemsByOrden[item.orden_id] = [];
    itemsByOrden[item.orden_id].push(item);
  }

  // Build rows: one row per item
  const rows = [];
  for (const o of ordenes || []) {
    const pagos = o.pagos as { metodo: string; monto: number }[] | null;
    const metodoPago = pagos?.map(p => p.metodo).join(', ') || '';
    const items = itemsByOrden[o.id] || [];

    if (items.length === 0) {
      rows.push({
        Folio: o.numero_orden,
        Fecha: new Date(o.created_at).toLocaleString('es-MX'),
        Sucursal: sucMap[o.sucursal_id] || `Suc ${o.sucursal_id}`,
        Empleado: empMap[o.empleado_id as number] || '-',
        Producto: '-',
        Cantidad: 0,
        'Precio Unitario': 0,
        'Subtotal Item': 0,
        'Subtotal Orden': o.subtotal,
        Descuento: o.descuento,
        IVA: o.impuesto,
        Total: o.total,
        'Método Pago': metodoPago,
      });
    } else {
      for (const item of items) {
        rows.push({
          Folio: o.numero_orden,
          Fecha: new Date(o.created_at).toLocaleString('es-MX'),
          Sucursal: sucMap[o.sucursal_id] || `Suc ${o.sucursal_id}`,
          Empleado: empMap[o.empleado_id as number] || '-',
          Producto: item.nombre_producto,
          Cantidad: item.cantidad,
          'Precio Unitario': item.precio_unitario,
          'Subtotal Item': item.subtotal,
          'Subtotal Orden': o.subtotal,
          Descuento: o.descuento,
          IVA: o.impuesto,
          Total: o.total,
          'Método Pago': metodoPago,
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    titulo: 'Ventas Detalle',
    columnas: ['Folio', 'Fecha', 'Sucursal', 'Empleado', 'Producto', 'Cantidad', 'Precio Unitario', 'Subtotal Item', 'Subtotal Orden', 'Descuento', 'IVA', 'Total', 'Método Pago'],
    datos: rows,
    totalRegistros: rows.length,
  });
}

// --- Ventas Resumen: totales por día ---
async function reporteVentasResumen(
  desde: string | null, hasta: string | null, sucursalId: string | null,
  sucMap: Record<number, string>
) {
  let query = supabase
    .from('ordenes')
    .select('sucursal_id, total, descuento, impuesto, created_at')
    .eq('estado', 'completada')
    .order('created_at', { ascending: true });

  if (desde) query = query.gte('created_at', desde);
  if (hasta) query = query.lte('created_at', hasta);
  if (sucursalId) query = query.eq('sucursal_id', parseInt(sucursalId));

  const { data: ordenes, error } = await query;
  if (error) throw error;

  // Agrupar por día + sucursal
  const agrupado: Record<string, {
    dia: string; sucursal: string; transacciones: number;
    totalVentas: number; totalDescuento: number; totalIVA: number;
  }> = {};

  for (const o of ordenes || []) {
    const dia = new Date(o.created_at).toISOString().split('T')[0];
    const key = `${dia}_${o.sucursal_id}`;
    if (!agrupado[key]) {
      agrupado[key] = {
        dia,
        sucursal: sucMap[o.sucursal_id] || `Suc ${o.sucursal_id}`,
        transacciones: 0,
        totalVentas: 0,
        totalDescuento: 0,
        totalIVA: 0,
      };
    }
    agrupado[key].transacciones++;
    agrupado[key].totalVentas += o.total;
    agrupado[key].totalDescuento += o.descuento;
    agrupado[key].totalIVA += o.impuesto;
  }

  const rows = Object.values(agrupado)
    .sort((a, b) => b.dia.localeCompare(a.dia))
    .map(r => ({
      Fecha: r.dia,
      Sucursal: r.sucursal,
      Transacciones: r.transacciones,
      'Ticket Promedio': Math.round((r.totalVentas / r.transacciones) * 100) / 100,
      Descuentos: Math.round(r.totalDescuento * 100) / 100,
      IVA: Math.round(r.totalIVA * 100) / 100,
      'Total Ventas': Math.round(r.totalVentas * 100) / 100,
    }));

  return NextResponse.json({
    success: true,
    titulo: 'Ventas Resumen Diario',
    columnas: ['Fecha', 'Sucursal', 'Transacciones', 'Ticket Promedio', 'Descuentos', 'IVA', 'Total Ventas'],
    datos: rows,
    totalRegistros: rows.length,
  });
}

// --- Productos más vendidos ---
async function reporteProductos(
  desde: string | null, hasta: string | null, sucursalId: string | null
) {
  let query = supabase
    .from('ordenes')
    .select('id, sucursal_id')
    .eq('estado', 'completada');

  if (desde) query = query.gte('created_at', desde);
  if (hasta) query = query.lte('created_at', hasta);
  if (sucursalId) query = query.eq('sucursal_id', parseInt(sucursalId));

  const { data: ordenes, error } = await query;
  if (error) throw error;

  const ordenIds = (ordenes || []).map(o => o.id);
  let allItems: { nombre_producto: string; cantidad: number; subtotal: number }[] = [];
  const batchSize = 100;
  for (let i = 0; i < ordenIds.length; i += batchSize) {
    const batch = ordenIds.slice(i, i + batchSize);
    const { data, error: itemError } = await supabase
      .from('orden_items')
      .select('nombre_producto, cantidad, subtotal')
      .in('orden_id', batch);
    if (itemError) throw itemError;
    allItems = allItems.concat(data || []);
  }

  const productoMap: Record<string, { cantidad: number; ingresos: number }> = {};
  for (const item of allItems) {
    if (!productoMap[item.nombre_producto]) {
      productoMap[item.nombre_producto] = { cantidad: 0, ingresos: 0 };
    }
    productoMap[item.nombre_producto].cantidad += item.cantidad;
    productoMap[item.nombre_producto].ingresos += item.subtotal;
  }

  const rows = Object.entries(productoMap)
    .map(([nombre, d]) => ({
      Producto: nombre,
      'Unidades Vendidas': d.cantidad,
      Ingresos: Math.round(d.ingresos * 100) / 100,
      'Precio Promedio': d.cantidad > 0 ? Math.round((d.ingresos / d.cantidad) * 100) / 100 : 0,
    }))
    .sort((a, b) => b['Unidades Vendidas'] - a['Unidades Vendidas']);

  return NextResponse.json({
    success: true,
    titulo: 'Productos Más Vendidos',
    columnas: ['Producto', 'Unidades Vendidas', 'Ingresos', 'Precio Promedio'],
    datos: rows,
    totalRegistros: rows.length,
  });
}

// --- Inventario actual ---
async function reporteInventario(sucursalId: string | null) {
  let query = supabase
    .from('inventario')
    .select('cantidad, stock_minimo, precio_sucursal, disponible_venta, productos(nombre, precio_default), sucursales(nombre)')
    .order('sucursales(nombre)');

  if (sucursalId) query = query.eq('sucursal_id', parseInt(sucursalId));

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data || []).map((inv: Record<string, unknown>) => {
    const prod = inv.productos as { nombre: string; precio_default: number } | null;
    const suc = inv.sucursales as { nombre: string } | null;
    const cantidad = inv.cantidad as number;
    const minimo = inv.stock_minimo as number;

    return {
      Producto: prod?.nombre || '-',
      Sucursal: suc?.nombre || '-',
      'Stock Actual': cantidad,
      'Stock Mínimo': minimo,
      Estado: cantidad <= minimo ? 'BAJO' : 'OK',
      'Precio Sucursal': (inv.precio_sucursal as number | null) || prod?.precio_default || 0,
      'Disponible Venta': (inv.disponible_venta as boolean) ? 'Sí' : 'No',
    };
  });

  return NextResponse.json({
    success: true,
    titulo: 'Inventario Actual',
    columnas: ['Producto', 'Sucursal', 'Stock Actual', 'Stock Mínimo', 'Estado', 'Precio Sucursal', 'Disponible Venta'],
    datos: rows,
    totalRegistros: rows.length,
  });
}

// --- Ventas por empleado ---
async function reporteEmpleados(
  desde: string | null, hasta: string | null, sucursalId: string | null,
  sucMap: Record<number, string>
) {
  let query = supabase
    .from('ordenes')
    .select('empleado_id, sucursal_id, total, created_at')
    .eq('estado', 'completada');

  if (desde) query = query.gte('created_at', desde);
  if (hasta) query = query.lte('created_at', hasta);
  if (sucursalId) query = query.eq('sucursal_id', parseInt(sucursalId));

  const { data: ordenes, error } = await query;
  if (error) throw error;

  // Empleados map
  const { data: empleados } = await supabase
    .from('empleados')
    .select('id, nombre, puesto');
  const empMap = Object.fromEntries(
    (empleados || []).map(e => [e.id, { nombre: e.nombre, puesto: e.puesto }])
  );

  const agrupado: Record<string, {
    empleado: string; puesto: string; sucursal: string;
    transacciones: number; total: number;
  }> = {};

  for (const o of ordenes || []) {
    const empId = o.empleado_id || 0;
    const key = `${empId}_${o.sucursal_id}`;
    if (!agrupado[key]) {
      const emp = empMap[empId];
      agrupado[key] = {
        empleado: emp?.nombre || 'Sin asignar',
        puesto: emp?.puesto || '-',
        sucursal: sucMap[o.sucursal_id] || `Suc ${o.sucursal_id}`,
        transacciones: 0,
        total: 0,
      };
    }
    agrupado[key].transacciones++;
    agrupado[key].total += o.total;
  }

  const rows = Object.values(agrupado)
    .sort((a, b) => b.total - a.total)
    .map(r => ({
      Empleado: r.empleado,
      Puesto: r.puesto,
      Sucursal: r.sucursal,
      Transacciones: r.transacciones,
      'Ticket Promedio': Math.round((r.total / r.transacciones) * 100) / 100,
      'Total Vendido': Math.round(r.total * 100) / 100,
    }));

  return NextResponse.json({
    success: true,
    titulo: 'Ventas por Empleado',
    columnas: ['Empleado', 'Puesto', 'Sucursal', 'Transacciones', 'Ticket Promedio', 'Total Vendido'],
    datos: rows,
    totalRegistros: rows.length,
  });
}

// --- Cierres de caja ---
async function reporteCierres(
  desde: string | null, hasta: string | null, sucursalId: string | null,
  sucMap: Record<number, string>
) {
  let query = supabase
    .from('cajas')
    .select('*')
    .eq('estado', 'cerrada')
    .order('closed_at', { ascending: false });

  if (desde) query = query.gte('closed_at', desde);
  if (hasta) query = query.lte('closed_at', hasta);
  if (sucursalId) query = query.eq('sucursal_id', parseInt(sucursalId));

  const { data: cajas, error } = await query;
  if (error) throw error;

  const rows = (cajas || []).map(c => ({
    'Fecha Apertura': new Date(c.opened_at).toLocaleString('es-MX'),
    'Fecha Cierre': c.closed_at ? new Date(c.closed_at).toLocaleString('es-MX') : '-',
    Sucursal: sucMap[c.sucursal_id] || `Suc ${c.sucursal_id}`,
    'Monto Apertura': c.monto_apertura,
    'Efectivo Contado': c.efectivo_contado || 0,
    'Monto Cierre': c.monto_cierre || 0,
    Diferencia: (c.efectivo_contado || 0) - (c.monto_cierre || 0),
    Notas: c.notas || '',
  }));

  return NextResponse.json({
    success: true,
    titulo: 'Cierres de Caja',
    columnas: ['Fecha Apertura', 'Fecha Cierre', 'Sucursal', 'Monto Apertura', 'Efectivo Contado', 'Monto Cierre', 'Diferencia', 'Notas'],
    datos: rows,
    totalRegistros: rows.length,
  });
}
