import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/inventario?sucursal_id=N
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sucursalId = searchParams.get('sucursal_id');
    const soloAlertas = searchParams.get('alertas') === 'true';

    let query = supabase
      .from('inventario')
      .select('*, productos(nombre, precio_default, activo, categoria_id), sucursales(nombre)')
      .order('updated_at', { ascending: false });

    if (sucursalId) {
      query = query.eq('sucursal_id', parseInt(sucursalId));
    }

    const { data, error } = await query;
    if (error) throw error;

    let items = (data || []).map((item: Record<string, unknown>) => {
      const producto = item.productos as { nombre: string; precio_default: number; activo: boolean; categoria_id: number | null } | null;
      const sucursal = item.sucursales as { nombre: string } | null;
      return {
        id: item.id,
        producto_id: item.producto_id,
        sucursal_id: item.sucursal_id,
        cantidad: item.cantidad as number,
        precio_sucursal: item.precio_sucursal,
        stock_minimo: item.stock_minimo as number,
        disponible_venta: item.disponible_venta,
        updated_at: item.updated_at,
        producto_nombre: producto?.nombre || 'Desconocido',
        producto_precio: producto?.precio_default || 0,
        producto_activo: producto?.activo ?? true,
        sucursal_nombre: sucursal?.nombre || 'Desconocida',
        alerta_stock: (item.cantidad as number) <= (item.stock_minimo as number),
      };
    });

    if (soloAlertas) {
      items = items.filter((i: { alerta_stock: boolean }) => i.alerta_stock);
    }

    return NextResponse.json({ success: true, inventario: items });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error obteniendo inventario:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/inventario - Crear o actualizar registro de inventario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { producto_id, sucursal_id, cantidad, stock_minimo, precio_sucursal } = body;

    if (!producto_id || !sucursal_id) {
      return NextResponse.json({ success: false, error: 'producto_id y sucursal_id requeridos' }, { status: 400 });
    }

    // Upsert: crear o actualizar
    const { data, error } = await supabase
      .from('inventario')
      .upsert(
        {
          producto_id,
          sucursal_id,
          cantidad: cantidad ?? 0,
          stock_minimo: stock_minimo ?? 0,
          precio_sucursal: precio_sucursal || null,
          disponible_venta: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'producto_id,sucursal_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, inventario: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error actualizando inventario:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PUT /api/inventario - Ajustar cantidad (sumar o restar)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, cantidad, stock_minimo, precio_sucursal, disponible_venta } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (cantidad !== undefined) updateData.cantidad = cantidad;
    if (stock_minimo !== undefined) updateData.stock_minimo = stock_minimo;
    if (precio_sucursal !== undefined) updateData.precio_sucursal = precio_sucursal || null;
    if (disponible_venta !== undefined) updateData.disponible_venta = disponible_venta;

    const { data, error } = await supabase
      .from('inventario')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, inventario: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error editando inventario:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
