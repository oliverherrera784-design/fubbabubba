import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/pos/ordenes/[id] - Obtener detalle completo de una orden
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Obtener la orden con items y pagos
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select('*')
      .eq('id', id)
      .single();

    if (ordenError) {
      if (ordenError.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 });
      }
      throw ordenError;
    }

    const [itemsRes, pagosRes] = await Promise.all([
      supabase
        .from('orden_items')
        .select('*')
        .eq('orden_id', id)
        .order('id'),
      supabase
        .from('pagos')
        .select('*')
        .eq('orden_id', id)
        .order('created_at'),
    ]);

    if (itemsRes.error) throw itemsRes.error;
    if (pagosRes.error) throw pagosRes.error;

    return NextResponse.json({
      success: true,
      orden: {
        ...orden,
        items: itemsRes.data || [],
        pagos: pagosRes.data || [],
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error obteniendo detalle de orden:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
