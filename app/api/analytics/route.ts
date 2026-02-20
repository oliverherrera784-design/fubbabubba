import { NextRequest, NextResponse } from 'next/server';
import { supabase, COMISION_TARJETA } from '@/lib/supabase';

// GET /api/analytics?desde=ISO&hasta=ISO&sucursal_id=N
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    const sucursalId = searchParams.get('sucursal_id');

    // 1. Órdenes completadas con items y pagos
    let ordenQuery = supabase
      .from('ordenes')
      .select('id, numero_orden, sucursal_id, subtotal, descuento, impuesto, total, created_at, pagos(metodo, monto)')
      .eq('estado', 'completada')
      .order('created_at', { ascending: true });

    if (desde) ordenQuery = ordenQuery.gte('created_at', desde);
    if (hasta) ordenQuery = ordenQuery.lte('created_at', hasta);
    if (sucursalId) ordenQuery = ordenQuery.eq('sucursal_id', parseInt(sucursalId));

    const { data: ordenes, error: ordError } = await ordenQuery;
    if (ordError) throw ordError;

    // 2. Items de esas órdenes (productos más vendidos)
    const ordenIds = (ordenes || []).map(o => o.id);

    let items: { nombre_producto: string; cantidad: number; subtotal: number; orden_id: string }[] = [];
    if (ordenIds.length > 0) {
      // Fetch in batches to avoid URL limits
      const batchSize = 100;
      for (let i = 0; i < ordenIds.length; i += batchSize) {
        const batch = ordenIds.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('orden_items')
          .select('nombre_producto, cantidad, subtotal, orden_id')
          .in('orden_id', batch);
        if (error) throw error;
        items = items.concat(data || []);
      }
    }

    // 3. Sucursales
    const { data: sucursales, error: sucError } = await supabase
      .from('sucursales')
      .select('id, nombre')
      .eq('activa', true);
    if (sucError) throw sucError;

    // --- Procesar datos ---

    // Ventas por hora del día (0-23)
    const ventasPorHora: Record<number, { ventas: number; total: number }> = {};
    for (let h = 0; h < 24; h++) {
      ventasPorHora[h] = { ventas: 0, total: 0 };
    }
    for (const o of ordenes || []) {
      const hora = new Date(o.created_at).getHours();
      ventasPorHora[hora].ventas++;
      ventasPorHora[hora].total += o.total;
    }

    // Ventas por día
    const ventasPorDia: Record<string, { ventas: number; total: number }> = {};
    for (const o of ordenes || []) {
      const dia = new Date(o.created_at).toISOString().split('T')[0];
      if (!ventasPorDia[dia]) ventasPorDia[dia] = { ventas: 0, total: 0 };
      ventasPorDia[dia].ventas++;
      ventasPorDia[dia].total += o.total;
    }

    // Productos más vendidos
    const productoMap: Record<string, { nombre: string; cantidad: number; total: number }> = {};
    for (const item of items) {
      const key = item.nombre_producto;
      if (!productoMap[key]) productoMap[key] = { nombre: key, cantidad: 0, total: 0 };
      productoMap[key].cantidad += item.cantidad;
      productoMap[key].total += item.subtotal;
    }
    const topProductos = Object.values(productoMap)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    // Ventas por sucursal
    const sucMap = Object.fromEntries((sucursales || []).map(s => [s.id, s.nombre]));
    const ventasPorSucursal: Record<number, { nombre: string; ventas: number; total: number }> = {};
    for (const o of ordenes || []) {
      if (!ventasPorSucursal[o.sucursal_id]) {
        ventasPorSucursal[o.sucursal_id] = {
          nombre: sucMap[o.sucursal_id] || `Suc ${o.sucursal_id}`,
          ventas: 0,
          total: 0,
        };
      }
      ventasPorSucursal[o.sucursal_id].ventas++;
      ventasPorSucursal[o.sucursal_id].total += o.total;
    }

    // Métodos de pago
    const metodoMap: Record<string, { count: number; total: number }> = {};
    for (const o of ordenes || []) {
      const pagos = o.pagos as { metodo: string; monto: number }[] | null;
      if (pagos) {
        for (const p of pagos) {
          if (!metodoMap[p.metodo]) metodoMap[p.metodo] = { count: 0, total: 0 };
          metodoMap[p.metodo].count++;
          metodoMap[p.metodo].total += p.monto;
        }
      }
    }

    // Totales generales
    const totalVentas = (ordenes || []).reduce((s, o) => s + o.total, 0);
    const totalTx = (ordenes || []).length;
    const ticketPromedio = totalTx > 0 ? totalVentas / totalTx : 0;

    // 4. Gastos operativos (movimientos_caja tipo='gasto')
    let gastosQuery = supabase
      .from('movimientos_caja')
      .select('tipo, subcategoria, monto, created_at, caja_id')
      .eq('tipo', 'gasto');

    if (desde) gastosQuery = gastosQuery.gte('created_at', desde);
    if (hasta) gastosQuery = gastosQuery.lte('created_at', hasta);

    if (sucursalId) {
      const { data: cajasDelSuc } = await supabase
        .from('cajas')
        .select('id')
        .eq('sucursal_id', parseInt(sucursalId));
      if (cajasDelSuc && cajasDelSuc.length > 0) {
        gastosQuery = gastosQuery.in('caja_id', cajasDelSuc.map(c => c.id));
      }
    }

    const { data: gastosData } = await gastosQuery;

    // Procesar gastos por categoría y por día
    const gastosPorCategoria: Record<string, number> = {};
    const gastosPorDia: Record<string, number> = {};
    let totalGastos = 0;

    for (const g of gastosData || []) {
      const cat = g.subcategoria || 'otros';
      gastosPorCategoria[cat] = (gastosPorCategoria[cat] || 0) + g.monto;
      totalGastos += g.monto;

      const dia = new Date(g.created_at).toISOString().split('T')[0];
      gastosPorDia[dia] = (gastosPorDia[dia] || 0) + g.monto;
    }

    // Comisión de tarjeta
    const totalTarjeta = metodoMap['tarjeta']?.total || 0;
    const comisionTarjeta = Math.round(totalTarjeta * COMISION_TARJETA * 100) / 100;

    return NextResponse.json({
      success: true,
      resumen: {
        totalVentas,
        totalTransacciones: totalTx,
        ticketPromedio,
      },
      ventasPorHora: Object.entries(ventasPorHora).map(([hora, d]) => ({
        hora: parseInt(hora),
        label: `${hora.padStart(2, '0')}:00`,
        ventas: d.ventas,
        total: Math.round(d.total * 100) / 100,
      })),
      ventasPorDia: Object.entries(ventasPorDia)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dia, d]) => ({
          dia,
          ventas: d.ventas,
          total: Math.round(d.total * 100) / 100,
          gastos: Math.round((gastosPorDia[dia] || 0) * 100) / 100,
        })),
      topProductos,
      ventasPorSucursal: Object.values(ventasPorSucursal)
        .sort((a, b) => b.total - a.total),
      metodosPago: Object.entries(metodoMap).map(([metodo, d]) => ({
        metodo,
        count: d.count,
        total: Math.round(d.total * 100) / 100,
      })),
      gastos: {
        total: Math.round(totalGastos * 100) / 100,
        porCategoria: Object.entries(gastosPorCategoria)
          .map(([categoria, total]) => ({
            categoria,
            total: Math.round(total * 100) / 100,
          }))
          .sort((a, b) => b.total - a.total),
      },
      comisiones: {
        tarjeta_total: totalTarjeta,
        comision: comisionTarjeta,
        tasa: '4.05%',
      },
      sucursales: sucursales || [],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en analytics:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
