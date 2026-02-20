import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { EstadoPreparacion } from '@/lib/supabase';

const ESTADOS_VALIDOS: EstadoPreparacion[] = ['pendiente', 'en_preparacion', 'listo', 'entregado'];

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { estado_preparacion } = await request.json();

    if (!ESTADOS_VALIDOS.includes(estado_preparacion)) {
      return NextResponse.json(
        { error: `Estado inválido. Válidos: ${ESTADOS_VALIDOS.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('ordenes')
      .update({ estado_preparacion })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, orden: data });
  } catch (error: any) {
    console.error('Error actualizando estado preparación:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
