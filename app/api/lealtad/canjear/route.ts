import { NextRequest, NextResponse } from 'next/server';
import { canjearTarjeta } from '@/lib/supabase';

// POST /api/lealtad/canjear  { tarjeta_id, orden_id }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tarjeta_id, orden_id } = body;

    if (!tarjeta_id || !orden_id) {
      return NextResponse.json(
        { success: false, error: 'tarjeta_id y orden_id son requeridos' },
        { status: 400 }
      );
    }

    const tarjeta = await canjearTarjeta(tarjeta_id, orden_id);

    return NextResponse.json({
      success: true,
      tarjeta,
      mensaje: 'Bebida gratis canjeada exitosamente',
    });
  } catch (error) {
    console.error('Error canjeando tarjeta:', error);
    return NextResponse.json({ success: false, error: 'Error canjeando tarjeta' }, { status: 500 });
  }
}
