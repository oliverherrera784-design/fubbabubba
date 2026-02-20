import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/empleados?sucursal_id=N&all=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sucursalId = searchParams.get('sucursal_id');
    const includeInactive = searchParams.get('all') === 'true';

    let query = supabase
      .from('empleados')
      .select('id, nombre, sucursal_id, puesto, pin, activo, rol, created_at')
      .order('nombre');

    if (!includeInactive) {
      query = query.eq('activo', true);
    }
    if (sucursalId) {
      query = query.eq('sucursal_id', parseInt(sucursalId));
    }

    const { data, error } = await query;
    if (error) throw error;

    // Retornar has_pin en vez del PIN real por seguridad
    const empleados = (data || []).map(({ ...emp }: Record<string, unknown>) => ({
      ...emp,
      has_pin: !!emp.pin,
      pin: undefined,
    }));

    return NextResponse.json({ success: true, empleados });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error obteniendo empleados:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/empleados - Crear empleado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, sucursal_id, puesto, pin, rol } = body;

    if (!nombre) {
      return NextResponse.json({ success: false, error: 'Nombre requerido' }, { status: 400 });
    }

    if (pin && !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ success: false, error: 'El PIN debe ser de 4 dígitos' }, { status: 400 });
    }

    const validRoles = ['admin', 'gerente', 'gerente_sucursal', 'cajero'];
    if (rol && !validRoles.includes(rol)) {
      return NextResponse.json({ success: false, error: 'Rol inválido' }, { status: 400 });
    }

    // Verificar que el PIN no esté en uso (por otro empleado activo)
    if (pin) {
      const { data: existing } = await supabase
        .from('empleados')
        .select('id')
        .eq('pin', pin)
        .eq('activo', true)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({ success: false, error: 'Este PIN ya está en uso' }, { status: 409 });
      }
    }

    const { data, error } = await supabase
      .from('empleados')
      .insert({
        nombre: nombre.trim(),
        sucursal_id: sucursal_id || null,
        puesto: puesto?.trim() || null,
        pin: pin || null,
        rol: rol || 'cajero',
        activo: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, empleado: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error creando empleado:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PUT /api/empleados - Editar empleado
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nombre, sucursal_id, puesto, pin, activo, rol } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    if (pin !== undefined && pin !== null && pin !== '' && !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ success: false, error: 'El PIN debe ser de 4 dígitos' }, { status: 400 });
    }

    const validRoles = ['admin', 'gerente', 'gerente_sucursal', 'cajero'];
    if (rol !== undefined && !validRoles.includes(rol)) {
      return NextResponse.json({ success: false, error: 'Rol inválido' }, { status: 400 });
    }

    // Verificar PIN único (excluyendo el empleado actual)
    if (pin) {
      const { data: existing } = await supabase
        .from('empleados')
        .select('id')
        .eq('pin', pin)
        .eq('activo', true)
        .neq('id', id)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({ success: false, error: 'Este PIN ya está en uso' }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (nombre !== undefined) updateData.nombre = nombre.trim();
    if (sucursal_id !== undefined) updateData.sucursal_id = sucursal_id || null;
    if (puesto !== undefined) updateData.puesto = puesto?.trim() || null;
    if (pin !== undefined) updateData.pin = pin || null;
    if (activo !== undefined) updateData.activo = activo;
    if (rol !== undefined) updateData.rol = rol;

    const { data, error } = await supabase
      .from('empleados')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, empleado: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error editando empleado:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
