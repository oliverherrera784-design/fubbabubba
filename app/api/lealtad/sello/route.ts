import { NextRequest, NextResponse } from 'next/server';
import { agregarSello } from '@/lib/supabase';

// POST /api/lealtad/sello  { cliente_id, orden_id, sucursal_id }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cliente_id, orden_id, sucursal_id } = body;

    if (!cliente_id || !orden_id || !sucursal_id) {
      return NextResponse.json(
        { success: false, error: 'cliente_id, orden_id y sucursal_id son requeridos' },
        { status: 400 }
      );
    }

    const { tarjeta, completada } = await agregarSello(cliente_id, orden_id, sucursal_id);

    return NextResponse.json({
      success: true,
      tarjeta,
      completada,
      mensaje: completada
        ? '🎉 ¡Tarjeta completada! El cliente tiene una bebida gratis.'
        : `Sello agregado (${tarjeta.sellos_actuales}/10)`,
    });
  } catch (error) {
    console.error('Error agregando sello:', error);
    return NextResponse.json({ success: false, error: 'Error agregando sello' }, { status: 500 });
  }
}
