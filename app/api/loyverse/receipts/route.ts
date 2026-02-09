import { NextResponse } from 'next/server';
import { getReceipts } from '@/lib/loyverse';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const store_id = searchParams.get('store_id');
    const created_at_min = searchParams.get('created_at_min');
    const created_at_max = searchParams.get('created_at_max');
    const limit = searchParams.get('limit');
    const cursor = searchParams.get('cursor');

    const params: any = {};
    if (store_id) params.store_id = store_id;
    if (created_at_min) params.created_at_min = created_at_min;
    if (created_at_max) params.created_at_max = created_at_max;
    if (limit) params.limit = limit;
    if (cursor) params.cursor = cursor;

    const data = await getReceipts(params);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error obteniendo recibos:', error);
    return NextResponse.json(
      { error: 'Error al obtener ventas de Loyverse', details: error.message },
      { status: 500 }
    );
  }
}
