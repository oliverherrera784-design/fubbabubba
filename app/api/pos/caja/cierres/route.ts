import { NextResponse } from 'next/server';
import { getCierresCaja } from '@/lib/supabase';

// GET - obtener historial de cierres de caja
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sucursalId = searchParams.get('sucursal_id');
    const limit = searchParams.get('limit');
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');

    const cierres = await getCierresCaja({
      sucursalId: sucursalId ? parseInt(sucursalId) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    });

    return NextResponse.json({ cierres });
  } catch (error: any) {
    console.error('Error obteniendo cierres:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
