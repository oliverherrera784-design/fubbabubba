import { NextResponse } from 'next/server';
import { cerrarCaja } from '@/lib/supabase';

// POST - cerrar caja con cuadre de efectivo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caja_id, efectivo_contado, notas, efectivo_siguiente } = body;

    if (!caja_id || efectivo_contado === undefined) {
      return NextResponse.json(
        { error: 'caja_id y efectivo_contado son requeridos' },
        { status: 400 }
      );
    }

    const caja = await cerrarCaja(caja_id, efectivo_contado, notas, efectivo_siguiente);
    return NextResponse.json({ success: true, caja });
  } catch (error: any) {
    console.error('Error cerrando caja:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
