import { NextResponse } from 'next/server';
import { getSucursales } from '@/lib/supabase';

export async function GET() {
  try {
    const sucursales = await getSucursales();
    return NextResponse.json({ success: true, data: sucursales });
  } catch (error: any) {
    console.error('Error fetching sucursales:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
