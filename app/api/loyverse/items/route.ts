import { NextResponse } from 'next/server';
import { getItems } from '@/lib/loyverse';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const cursor = searchParams.get('cursor');

    const params: any = {};
    if (limit) params.limit = limit;
    if (cursor) params.cursor = cursor;

    const data = await getItems(params);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error obteniendo items:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos de Loyverse', details: error.message },
      { status: 500 }
    );
  }
}
