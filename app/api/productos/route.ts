import { NextResponse } from 'next/server';
import { getProductos } from '@/lib/supabase';

export async function GET() {
  try {
    const productos = await getProductos();
    return NextResponse.json({ success: true, data: productos });
  } catch (error: any) {
    console.error('Error fetching productos:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
