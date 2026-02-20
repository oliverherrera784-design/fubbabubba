import { NextResponse } from 'next/server';
import { getCajaAbierta, abrirCaja } from '@/lib/supabase';

// GET - obtener caja abierta de una sucursal
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sucursalId = searchParams.get('sucursal_id');

    if (!sucursalId) {
      return NextResponse.json({ error: 'sucursal_id es requerido' }, { status: 400 });
    }

    const caja = await getCajaAbierta(parseInt(sucursalId));
    return NextResponse.json({ caja });
  } catch (error: any) {
    console.error('Error obteniendo caja:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - abrir una nueva caja
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sucursal_id, monto_apertura } = body;

    if (!sucursal_id || monto_apertura === undefined) {
      return NextResponse.json(
        { error: 'sucursal_id y monto_apertura son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que no haya una caja abierta
    const cajaExistente = await getCajaAbierta(sucursal_id);
    if (cajaExistente) {
      return NextResponse.json(
        { error: 'Ya hay una caja abierta para esta sucursal', caja: cajaExistente },
        { status: 409 }
      );
    }

    const caja = await abrirCaja(sucursal_id, monto_apertura);
    return NextResponse.json({ success: true, caja });
  } catch (error: any) {
    console.error('Error abriendo caja:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
