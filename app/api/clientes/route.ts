import { NextRequest, NextResponse } from 'next/server';
import { buscarClientes, crearCliente, buscarClientePorTelefono } from '@/lib/supabase';

// GET /api/clientes?q=búsqueda  o  ?telefono=8121234567
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telefono = searchParams.get('telefono');
    const q = searchParams.get('q');

    // Buscar por teléfono exacto
    if (telefono) {
      const cliente = await buscarClientePorTelefono(telefono);
      return NextResponse.json({ success: true, cliente });
    }

    // Buscar por query (nombre o teléfono parcial)
    if (q && q.length >= 2) {
      const clientes = await buscarClientes(q);
      return NextResponse.json({ success: true, clientes });
    }

    return NextResponse.json({ success: true, clientes: [] });
  } catch (error) {
    console.error('Error buscando clientes:', error);
    return NextResponse.json({ success: false, error: 'Error buscando clientes' }, { status: 500 });
  }
}

// POST /api/clientes  { nombre, telefono }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, telefono } = body;

    if (!nombre || !telefono) {
      return NextResponse.json({ success: false, error: 'Nombre y teléfono son requeridos' }, { status: 400 });
    }

    // Verificar que no exista
    const existente = await buscarClientePorTelefono(telefono);
    if (existente) {
      return NextResponse.json({ success: false, error: 'Ya existe un cliente con ese teléfono' }, { status: 409 });
    }

    const cliente = await crearCliente(nombre.trim(), telefono.trim());
    return NextResponse.json({ success: true, cliente });
  } catch (error) {
    console.error('Error creando cliente:', error);
    return NextResponse.json({ success: false, error: 'Error creando cliente' }, { status: 500 });
  }
}
