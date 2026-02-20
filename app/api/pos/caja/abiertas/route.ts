import { NextResponse } from 'next/server';
import { getCajasAbiertas, supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const cajas = await getCajasAbiertas();

    // Para cada caja abierta, buscar el último empleado que hizo una venta
    const cajasConEmpleado = await Promise.all(
      cajas.map(async (caja) => {
        const { data: ultimaOrden } = await supabase
          .from('ordenes')
          .select('empleado_id')
          .eq('sucursal_id', caja.sucursal_id)
          .gte('created_at', caja.opened_at)
          .not('empleado_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        let empleadoNombre: string | null = null;
        if (ultimaOrden?.empleado_id) {
          const { data: emp } = await supabase
            .from('empleados')
            .select('nombre')
            .eq('id', ultimaOrden.empleado_id)
            .single();
          empleadoNombre = emp?.nombre || null;
        }

        return { ...caja, empleado_nombre: empleadoNombre };
      })
    );

    return NextResponse.json({ cajas: cajasConEmpleado });
  } catch (error: any) {
    console.error('Error obteniendo cajas abiertas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
