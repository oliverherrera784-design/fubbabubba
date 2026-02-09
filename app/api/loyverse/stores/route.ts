import { NextResponse } from 'next/server';
import { getStores } from '@/lib/loyverse';

export async function GET() {
  try {
    const data = await getStores();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error obteniendo sucursales:', error);
    return NextResponse.json(
      { error: 'Error al obtener sucursales de Loyverse', details: error.message },
      { status: 500 }
    );
  }
}
