import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Rate limiting en memoria: máx 5 intentos por IP en 5 minutos
const intentos: Map<string, { count: number; firstAttempt: number }> = new Map();
const MAX_INTENTOS = 5;
const VENTANA_MS = 5 * 60 * 1000; // 5 minutos

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = intentos.get(ip);

  if (!record || now - record.firstAttempt > VENTANA_MS) {
    intentos.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: MAX_INTENTOS - 1 };
  }

  if (record.count >= MAX_INTENTOS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_INTENTOS - record.count };
}

function clearRateLimit(ip: string) {
  intentos.delete(ip);
}

// POST /api/empleados/pin - Login por PIN
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Espera 5 minutos.' },
        { status: 429 }
      );
    }

    const { pin } = await request.json();

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ success: false, error: 'PIN inválido' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('empleados')
      .select('id, nombre, sucursal_id, puesto, rol')
      .eq('pin', pin)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: `PIN incorrecto (${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''})` },
          { status: 401 }
        );
      }
      throw error;
    }

    // Login exitoso: limpiar intentos
    clearRateLimit(ip);

    return NextResponse.json({ success: true, empleado: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en login por PIN:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
