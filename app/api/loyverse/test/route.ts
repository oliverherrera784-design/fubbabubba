import { NextResponse } from 'next/server';
import { getStores, getItems } from '@/lib/loyverse';

export async function GET() {
  try {
    console.log('🔍 Probando conexión con Loyverse API...');
    
    // Probar obtener stores
    const stores = await getStores();
    console.log('✅ Stores obtenidas:', stores);
    
    // Probar obtener items (límite de 5 para prueba rápida)
    const items = await getItems({ limit: 5 });
    console.log('✅ Items obtenidos:', items);
    
    return NextResponse.json({
      success: true,
      message: '¡Conexión con Loyverse exitosa! 🎉',
      data: {
        stores: stores,
        items: items,
        totalStores: stores?.stores?.length || 0,
        totalItems: items?.items?.length || 0,
      }
    });
  } catch (error: any) {
    console.error('❌ Error en conexión con Loyverse:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al conectar con Loyverse', 
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
