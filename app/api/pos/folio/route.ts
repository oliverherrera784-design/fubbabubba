import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { sucursal_id } = await request.json();

    if (!sucursal_id) {
      return NextResponse.json(
        { error: 'sucursal_id requerido' },
        { status: 400 }
      );
    }

    // Incrementar folio atómicamente y retornar el nuevo valor
    const { data, error } = await supabase.rpc('siguiente_folio', {
      p_sucursal_id: sucursal_id,
    });

    if (error) {
      // Si la función RPC no existe, usar fallback con update + select
      const { data: updateData, error: updateError } = await supabase
        .from('folios_sucursal')
        .select('ultimo_folio')
        .eq('sucursal_id', sucursal_id)
        .single();

      if (updateError || !updateData) {
        return NextResponse.json(
          { error: 'No se encontró folio para esta sucursal' },
          { status: 404 }
        );
      }

      const nuevoFolio = updateData.ultimo_folio + 1;

      const { error: setError } = await supabase
        .from('folios_sucursal')
        .update({ ultimo_folio: nuevoFolio })
        .eq('sucursal_id', sucursal_id);

      if (setError) throw setError;

      return NextResponse.json({ success: true, folio: nuevoFolio });
    }

    return NextResponse.json({ success: true, folio: data });
  } catch (error: any) {
    console.error('Error obteniendo folio:', error);
    return NextResponse.json(
      { error: 'Error al obtener folio', details: error.message },
      { status: 500 }
    );
  }
}
