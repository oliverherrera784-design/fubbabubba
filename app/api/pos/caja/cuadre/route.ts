import { NextResponse } from 'next/server';
import { supabase, getMovimientosCaja, COMISION_TARJETA, COMISIONES_PLATAFORMA } from '@/lib/supabase';
import type { Plataforma } from '@/lib/supabase';

// GET - obtener cuadre/resumen completo de una caja
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cajaId = searchParams.get('caja_id');

    if (!cajaId) {
      return NextResponse.json({ error: 'caja_id es requerido' }, { status: 400 });
    }

    // Obtener la caja
    const { data: caja, error: cajaError } = await supabase
      .from('cajas')
      .select('*')
      .eq('id', cajaId)
      .single();
    if (cajaError) throw cajaError;

    // Obtener movimientos
    const movimientos = await getMovimientosCaja(cajaId);

    // Obtener órdenes del turno
    const hasta = caja.closed_at || new Date().toISOString();
    const { data: ordenes, error: ordError } = await supabase
      .from('ordenes')
      .select('*, plataforma, total_plataforma, pagos(metodo, monto), orden_items(cantidad)')
      .eq('sucursal_id', caja.sucursal_id)
      .gte('created_at', caja.opened_at)
      .lte('created_at', hasta);
    if (ordError) throw ordError;

    const completadas = (ordenes || []).filter((o: any) => o.estado === 'completada');
    const canceladas = (ordenes || []).filter((o: any) => o.estado === 'cancelada');

    // Cajón de efectivo
    const cobros_efectivo = completadas.reduce((sum: number, o: any) => {
      return sum + (o.pagos || [])
        .filter((p: any) => p.metodo === 'efectivo')
        .reduce((s: number, p: any) => s + p.monto, 0);
    }, 0);

    const reembolsos_efectivo = canceladas.reduce((sum: number, o: any) => {
      return sum + (o.pagos || [])
        .filter((p: any) => p.metodo === 'efectivo')
        .reduce((s: number, p: any) => s + p.monto, 0);
    }, 0);

    const depositos = movimientos
      .filter(m => m.tipo === 'deposito')
      .reduce((sum, m) => sum + m.monto, 0);

    const retiros = movimientos
      .filter(m => m.tipo === 'retiro')
      .reduce((sum, m) => sum + m.monto, 0);

    const gastos = movimientos
      .filter(m => m.tipo === 'gasto')
      .reduce((sum, m) => sum + m.monto, 0);

    // Gastos agrupados por subcategoría
    const gastos_por_categoria: Record<string, {
      total: number;
      movimientos: { monto: number; comentario: string | null; created_at: string }[];
    }> = {};
    for (const m of movimientos.filter(m => m.tipo === 'gasto')) {
      const cat = m.subcategoria || 'otros';
      if (!gastos_por_categoria[cat]) {
        gastos_por_categoria[cat] = { total: 0, movimientos: [] };
      }
      gastos_por_categoria[cat].total += m.monto;
      gastos_por_categoria[cat].movimientos.push({
        monto: m.monto,
        comentario: m.comentario,
        created_at: m.created_at,
      });
    }

    // Gastos y retiros restan del efectivo teórico
    const efectivo_teorico = caja.monto_apertura + cobros_efectivo - reembolsos_efectivo + depositos - retiros - gastos;

    // Resumen de ventas (subtotal = antes de descuento; fallback a total para órdenes antiguas)
    const ventas_brutas = completadas.reduce((sum: number, o: any) => sum + (o.subtotal || o.total), 0);
    const descuentos = completadas.reduce((sum: number, o: any) => sum + (o.descuento || 0), 0);
    const reembolsos_total = canceladas.reduce((sum: number, o: any) => sum + o.total, 0);
    const ventas_netas = ventas_brutas - descuentos - reembolsos_total;

    const por_metodo = {
      efectivo: cobros_efectivo,
      tarjeta: completadas.reduce((sum: number, o: any) => {
        return sum + (o.pagos || [])
          .filter((p: any) => p.metodo === 'tarjeta')
          .reduce((s: number, p: any) => s + p.monto, 0);
      }, 0),
      app_plataforma: completadas.reduce((sum: number, o: any) => {
        return sum + (o.pagos || [])
          .filter((p: any) => p.metodo === 'app_plataforma')
          .reduce((s: number, p: any) => s + p.monto, 0);
      }, 0),
    };

    // Comisión de tarjeta (Mercado Pago 3.49% + IVA)
    const comision_tarjeta = Math.round(por_metodo.tarjeta * COMISION_TARJETA * 100) / 100;
    const ingreso_neto_tarjeta = Math.round((por_metodo.tarjeta - comision_tarjeta) * 100) / 100;

    // Ventas por plataforma
    const por_plataforma: Record<string, {
      ordenes: number;
      total: number;
      total_plataforma: number;
      sobreprecio: number;
      app: number;
      efectivo: number;
      comision_app: number;
      comision_efectivo: number;
    }> = {};

    for (const o of completadas as any[]) {
      const plat = o.plataforma;
      if (!plat) continue;
      if (!por_plataforma[plat]) {
        por_plataforma[plat] = { ordenes: 0, total: 0, total_plataforma: 0, sobreprecio: 0, app: 0, efectivo: 0, comision_app: 0, comision_efectivo: 0 };
      }
      por_plataforma[plat].ordenes++;
      por_plataforma[plat].total += o.total;
      const tp = o.total_plataforma || o.total;
      por_plataforma[plat].total_plataforma += tp;
      por_plataforma[plat].sobreprecio += Math.max(0, tp - o.total);
      for (const p of (o.pagos || [])) {
        if (p.metodo === 'app_plataforma') {
          por_plataforma[plat].app += p.monto;
        } else if (p.metodo === 'efectivo') {
          por_plataforma[plat].efectivo += p.monto;
        }
      }
    }

    // Sobreprecio total de plataformas (dinero en caja que es de las plataformas)
    const sobreprecio_plataformas = completadas.reduce((sum: number, o: any) => {
      if (!o.plataforma || !o.total_plataforma) return sum;
      return sum + Math.max(0, o.total_plataforma - o.total);
    }, 0);

    // Calcular comisiones por plataforma
    for (const [plat, data] of Object.entries(por_plataforma)) {
      const rates = COMISIONES_PLATAFORMA[plat as Plataforma];
      if (rates) {
        data.comision_app = Math.round(data.app * rates.app * 100) / 100;
        data.comision_efectivo = Math.round(data.efectivo * rates.efectivo * 100) / 100;
      }
    }

    const ventas_directas = completadas
      .filter((o: any) => !o.plataforma)
      .reduce((sum: number, o: any) => sum + o.total, 0);

    // Piezas vendidas (suma de cantidades de todos los items)
    const piezas_vendidas = completadas.reduce((sum: number, o: any) => {
      return sum + (o.orden_items || []).reduce((s: number, item: any) => s + (item.cantidad || 0), 0);
    }, 0);

    return NextResponse.json({
      caja,
      movimientos,
      resumen: {
        fondo_apertura: caja.monto_apertura,
        cobros_efectivo,
        reembolsos_efectivo,
        depositos,
        retiros,
        gastos,
        gastos_por_categoria,
        efectivo_teorico,
        efectivo_contado: caja.efectivo_contado,
        descuadre: caja.efectivo_contado !== null ? caja.efectivo_contado - efectivo_teorico : null,
        ventas_brutas,
        reembolsos: reembolsos_total,
        descuentos,
        ventas_netas,
        por_metodo,
        comision_tarjeta,
        ingreso_neto_tarjeta,
        por_plataforma,
        sobreprecio_plataformas,
        ventas_directas,
        total_ordenes: completadas.length,
        total_canceladas: canceladas.length,
        piezas_vendidas,
      },
    });
  } catch (error: any) {
    console.error('Error obteniendo cuadre:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
