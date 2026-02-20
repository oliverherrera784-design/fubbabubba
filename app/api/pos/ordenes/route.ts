import { NextResponse } from 'next/server';
import { crearOrden, getOrdenes, getCajaAbierta, supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { sucursal_id, empleado_id, descuento_empleado_id, plataforma, total_plataforma, items, pagos, subtotal, descuento, impuesto, total, notas, nombre_cliente } = body;

    if (!sucursal_id || !items?.length || !pagos?.length) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: sucursal_id, items, pagos' },
        { status: 400 }
      );
    }

    // Calcular número de orden de 4 dígitos (prefijo turno + secuencial)
    let numeroOrden: number | undefined;
    try {
      const caja = await getCajaAbierta(sucursal_id);
      if (caja?.prefijo_orden != null) {
        // Incrementar contador_orden en la caja
        const { data: cajaActualizada } = await supabase
          .from('cajas')
          .update({ contador_orden: (caja.contador_orden || 0) + 1 })
          .eq('id', caja.id)
          .select('contador_orden')
          .single();

        const contador = cajaActualizada?.contador_orden ?? 1;
        numeroOrden = caja.prefijo_orden * 100 + contador;
      }
    } catch (e) {
      console.warn('No se pudo calcular numero_orden por turno:', e);
    }

    const orden = await crearOrden({
      sucursal_id,
      empleado_id: empleado_id || undefined,
      descuento_empleado_id: descuento_empleado_id || undefined,
      plataforma: plataforma || null,
      total_plataforma: total_plataforma || null,
      subtotal,
      descuento: descuento || 0,
      impuesto,
      total,
      notas,
      nombre_cliente: nombre_cliente || null,
      numero_orden: numeroOrden,
      items,
      pagos,
    });

    return NextResponse.json({ success: true, orden });
  } catch (error: any) {
    console.error('Error creando orden:', error);
    return NextResponse.json(
      { error: 'Error al crear la orden', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sucursalId = searchParams.get('sucursal_id');
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    const limit = searchParams.get('limit');

    const ordenes = await getOrdenes({
      sucursalId: sucursalId ? parseInt(sucursalId) : undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ ordenes });
  } catch (error: any) {
    console.error('Error obteniendo ordenes:', error);
    return NextResponse.json(
      { error: 'Error al obtener ordenes', details: error.message },
      { status: 500 }
    );
  }
}
