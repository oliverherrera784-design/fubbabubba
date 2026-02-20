import { NextRequest, NextResponse } from 'next/server';
import { getClientesConLealtad } from '@/lib/supabase';

// GET /api/lealtad?q=busqueda&limit=50
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busqueda = searchParams.get('q') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    const clientes = await getClientesConLealtad({ busqueda, limit });

    return NextResponse.json({
      success: true,
      clientes,
      total: clientes.length,
    });
  } catch (error) {
    console.error('Error obteniendo datos de lealtad:', error);
    return NextResponse.json({ success: false, error: 'Error obteniendo datos' }, { status: 500 });
  }
}
