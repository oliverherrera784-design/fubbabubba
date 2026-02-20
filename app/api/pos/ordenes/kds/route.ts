import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sucursalId = searchParams.get('sucursal_id');

    if (!sucursalId) {
      return NextResponse.json({ error: 'sucursal_id requerido' }, { status: 400 });
    }

    // Solo órdenes de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicioDelDia = hoy.toISOString();

    const { data, error } = await supabase
      .from('ordenes')
      .select('id, numero_orden, nombre_cliente, estado_preparacion, created_at, notas, orden_items(id, nombre_producto, cantidad, modificadores, notas)')
      .eq('sucursal_id', sucursalId)
      .eq('estado', 'completada')
      .neq('estado_preparacion', 'entregado')
      .gte('created_at', inicioDelDia)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ ordenes: data || [] });
  } catch (error: any) {
    console.error('Error obteniendo órdenes KDS:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
