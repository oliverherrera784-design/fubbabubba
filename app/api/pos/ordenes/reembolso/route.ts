import { NextResponse } from 'next/server';
import { reembolsarOrden } from '@/lib/supabase';

// POST - reembolsar/cancelar una orden
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orden_id } = body;

    if (!orden_id) {
      return NextResponse.json({ error: 'orden_id es requerido' }, { status: 400 });
    }

    const orden = await reembolsarOrden(orden_id);
    return NextResponse.json({ success: true, orden });
  } catch (error: any) {
    console.error('Error reembolsando orden:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
