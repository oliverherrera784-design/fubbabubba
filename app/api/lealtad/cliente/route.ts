import { NextRequest, NextResponse } from 'next/server';
import { getTarjetaActiva, getTarjetaCompleta, getHistorialTarjetas } from '@/lib/supabase';

// GET /api/lealtad/cliente?cliente_id=xxx
// Devuelve la tarjeta activa, tarjeta completa (si hay), e historial
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('cliente_id');

    if (!clienteId) {
      return NextResponse.json({ success: false, error: 'cliente_id requerido' }, { status: 400 });
    }

    const [tarjetaActiva, tarjetaCompleta, historial] = await Promise.all([
      getTarjetaActiva(clienteId),
      getTarjetaCompleta(clienteId),
      getHistorialTarjetas(clienteId),
    ]);

    return NextResponse.json({
      success: true,
      tarjeta_activa: tarjetaActiva,
      tarjeta_completa: tarjetaCompleta,
      historial,
      total_canjeadas: historial.filter(t => t.estado === 'canjeada').length,
    });
  } catch (error) {
    console.error('Error obteniendo lealtad:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo datos de lealtad' }, { status: 500 });
  }
}
