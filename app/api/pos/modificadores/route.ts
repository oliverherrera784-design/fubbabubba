import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/pos/modificadores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    let query = supabase
      .from('modificadores')
      .select('*')
      .order('grupo')
      .order('nombre');

    if (!all) {
      query = query.eq('activo', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, modificadores: data || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error obteniendo modificadores:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/pos/modificadores - Crear modificador
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, grupo, precio_extra } = body;

    if (!nombre || !grupo) {
      return NextResponse.json(
        { success: false, error: 'Nombre y grupo son requeridos' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('modificadores')
      .insert({
        nombre: nombre.trim(),
        grupo: grupo.trim(),
        precio_extra: parseFloat(precio_extra || 0),
        activo: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, modificador: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error creando modificador:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PUT /api/pos/modificadores - Editar modificador
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nombre, grupo, precio_extra, activo } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (nombre !== undefined) updateData.nombre = nombre.trim();
    if (grupo !== undefined) updateData.grupo = grupo.trim();
    if (precio_extra !== undefined) updateData.precio_extra = parseFloat(precio_extra);
    if (activo !== undefined) updateData.activo = activo;

    const { data, error } = await supabase
      .from('modificadores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, modificador: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error editando modificador:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
