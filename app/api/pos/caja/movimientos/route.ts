import { NextResponse } from 'next/server';
import { getMovimientosCaja, crearMovimientoCaja } from '@/lib/supabase';

// GET - obtener movimientos de una caja
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cajaId = searchParams.get('caja_id');

    if (!cajaId) {
      return NextResponse.json({ error: 'caja_id es requerido' }, { status: 400 });
    }

    const movimientos = await getMovimientosCaja(cajaId);
    return NextResponse.json({ movimientos });
  } catch (error: any) {
    console.error('Error obteniendo movimientos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - crear un depósito, retiro o gasto
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caja_id, tipo, monto, comentario, subcategoria } = body;

    if (!caja_id || !tipo || !monto) {
      return NextResponse.json(
        { error: 'caja_id, tipo y monto son requeridos' },
        { status: 400 }
      );
    }

    if (!['deposito', 'retiro', 'gasto'].includes(tipo)) {
      return NextResponse.json({ error: 'tipo debe ser deposito, retiro o gasto' }, { status: 400 });
    }

    if (monto <= 0) {
      return NextResponse.json({ error: 'monto debe ser mayor a 0' }, { status: 400 });
    }

    const validSubcats = ['insumos', 'proveedor', 'renta', 'nomina', 'servicios', 'limpieza', 'otros'];
    if (tipo === 'gasto' && (!subcategoria || !validSubcats.includes(subcategoria))) {
      return NextResponse.json({ error: 'subcategoria es requerida para gastos' }, { status: 400 });
    }

    const movimiento = await crearMovimientoCaja(
      caja_id, tipo, monto, comentario,
      tipo === 'gasto' ? subcategoria : undefined
    );
    return NextResponse.json({ success: true, movimiento });
  } catch (error: any) {
    console.error('Error creando movimiento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
