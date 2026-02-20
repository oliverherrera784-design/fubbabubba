import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/categorias
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nombre');

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error fetching categorias:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/categorias - Crear categoría
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion } = body;

    if (!nombre) {
      return NextResponse.json({ success: false, error: 'Nombre requerido' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categorias')
      .insert({ nombre: nombre.trim(), descripcion: descripcion?.trim() || null })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, categoria: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error creando categoria:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PUT /api/categorias - Editar categoría
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nombre, descripcion } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (nombre !== undefined) updateData.nombre = nombre.trim();
    if (descripcion !== undefined) updateData.descripcion = descripcion?.trim() || null;

    const { data, error } = await supabase
      .from('categorias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, categoria: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error editando categoria:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/categorias - Eliminar categoría
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    // Primero quitar la categoría de los productos que la usan
    await supabase
      .from('productos')
      .update({ categoria_id: null })
      .eq('categoria_id', parseInt(id));

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error eliminando categoria:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
