import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos de datos
export interface Sucursal {
  id: number;
  nombre: string;
  codigo: string;
  direccion?: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  created_at: string;
}

export interface Producto {
  id: number;
  handle?: string;
  ref?: string;
  nombre: string;
  categoria_id?: number;
  descripcion?: string;
  precio_default: number;
  costo: number;
  codigo_barras?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inventario {
  id: number;
  producto_id: number;
  sucursal_id: number;
  cantidad: number;
  precio_sucursal?: number;
  stock_minimo: number;
  disponible_venta: boolean;
  updated_at: string;
}

export interface Venta {
  id: number;
  sucursal_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  total: number;
  fecha: string;
  canal: 'local' | 'uber_eats' | 'didi_food';
  created_at: string;
}

// === TIPOS POS ===

export interface Orden {
  id: string;
  numero_orden: number;
  sucursal_id: number;
  empleado_id: number | null;
  descuento_empleado_id: number | null;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  total_plataforma: number | null;
  estado: 'pendiente' | 'completada' | 'cancelada';
  estado_preparacion: EstadoPreparacion;
  notas: string | null;
  plataforma: Plataforma | null;
  nombre_cliente: string | null;
  created_at: string;
}

export type EstadoPreparacion = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado';

export interface OrdenItem {
  id: string;
  orden_id: string;
  producto_id: number;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  modificadores: { nombre: string; precio: number }[];
  subtotal: number;
  notas: string | null;
}

export interface Pago {
  id: string;
  orden_id: string;
  metodo: 'efectivo' | 'tarjeta' | 'app_plataforma';
  monto: number;
  referencia: string | null;
  created_at: string;
}

export interface Caja {
  id: string;
  sucursal_id: number;
  empleado_id: number | null;
  monto_apertura: number;
  monto_cierre: number | null;
  efectivo_contado: number | null;
  notas: string | null;
  estado: 'abierta' | 'cerrada';
  opened_at: string;
  closed_at: string | null;
  prefijo_orden: number | null;
  contador_orden: number;
}

export type SubcategoriaGasto = 'insumos' | 'proveedor' | 'renta' | 'nomina' | 'servicios' | 'limpieza' | 'otros';

export const SUBCATEGORIAS_GASTO: { value: SubcategoriaGasto; label: string }[] = [
  { value: 'insumos', label: 'Insumos' },
  { value: 'proveedor', label: 'Proveedor' },
  { value: 'renta', label: 'Renta' },
  { value: 'nomina', label: 'Nómina' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'otros', label: 'Otros' },
];

export const COMISION_TARJETA = 0.0349 * 1.16; // 3.49% + IVA 16% = ~4.05%

// === PLATAFORMAS DE DELIVERY ===
export type Plataforma = 'uber_eats' | 'rappi' | 'didi';

export const PLATAFORMAS: { value: Plataforma; label: string; color: string }[] = [
  { value: 'uber_eats', label: 'Uber Eats', color: 'green' },
  { value: 'rappi', label: 'Rappi', color: 'orange' },
  { value: 'didi', label: 'Didi', color: 'blue' },
];

// Comisiones por plataforma — Carlos: ajusta estos valores con tus contratos
export const COMISIONES_PLATAFORMA: Record<Plataforma, { app: number; efectivo: number }> = {
  uber_eats:  { app: 0.30, efectivo: 0.30 },
  rappi:      { app: 0.25, efectivo: 0.25 },
  didi:       { app: 0.25, efectivo: 0.25 },
};

// Precios IVA-incluido por tamaño
export const PRECIO_ESTANDAR = 95;
export const PRECIO_MINI = 75;
export const PRECIO_SENDERO_ESPECIAL = 110; // Nutella y Taro en Sendero

// Productos con precio especial en Sendero (buscar por nombre, lowercase)
export const SENDERO_ESPECIAL_PRODUCTOS = ['nutella', 'taro'];

export interface MovimientoCaja {
  id: string;
  caja_id: string;
  tipo: 'deposito' | 'retiro' | 'gasto';
  subcategoria: SubcategoriaGasto | null;
  monto: number;
  comentario: string | null;
  created_at: string;
}

export interface Modificador {
  id: number;
  nombre: string;
  grupo: string;
  precio_extra: number;
  activo: boolean;
}

// === TIPOS LEALTAD ===

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  notas: string | null;
  created_at: string;
}

export interface TarjetaLealtad {
  id: string;
  cliente_id: string;
  sellos_actuales: number;
  estado: 'activa' | 'completa' | 'canjeada';
  created_at: string;
  completed_at: string | null;
  canjeada_at: string | null;
  canjeada_en_orden_id: string | null;
}

export interface Sello {
  id: string;
  tarjeta_id: string;
  cliente_id: string;
  orden_id: string | null;
  sucursal_id: number | null;
  created_at: string;
}

// === TIPOS CARRITO (client-side) ===

export interface CartItem {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  modificadores: { nombre: string; precio: number }[];
  subtotal: number;
  categoria_id?: number;
}

// Funciones helper
export async function getSucursales(): Promise<Sucursal[]> {
  const { data, error } = await supabase
    .from('sucursales')
    .select('*')
    .eq('activa', true)
    .order('nombre');
  
  if (error) throw error;
  return data || [];
}

export async function getProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('nombre');
  
  if (error) throw error;
  return data || [];
}

export async function getInventario(sucursalId?: number): Promise<Inventario[]> {
  let query = supabase
    .from('inventario')
    .select('*');
  
  if (sucursalId) {
    query = query.eq('sucursal_id', sucursalId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function getVentas(filtros?: {
  sucursalId?: number;
  desde?: string;
  hasta?: string;
}): Promise<Venta[]> {
  let query = supabase
    .from('ventas')
    .select('*')
    .order('fecha', { ascending: false });
  
  if (filtros?.sucursalId) {
    query = query.eq('sucursal_id', filtros.sucursalId);
  }
  
  if (filtros?.desde) {
    query = query.gte('fecha', filtros.desde);
  }
  
  if (filtros?.hasta) {
    query = query.lte('fecha', filtros.hasta);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nombre');

  if (error) throw error;
  return data || [];
}

// === FUNCIONES POS ===

export async function getModificadores(): Promise<Modificador[]> {
  const { data, error } = await supabase
    .from('modificadores')
    .select('*')
    .eq('activo', true)
    .order('grupo');

  if (error) throw error;
  return data || [];
}

export async function crearOrden(orden: {
  sucursal_id: number;
  empleado_id?: number;
  descuento_empleado_id?: number | null;
  plataforma?: Plataforma | null;
  total_plataforma?: number | null;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  notas?: string;
  nombre_cliente?: string | null;
  numero_orden?: number;
  items: {
    producto_id: number;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    modificadores: { nombre: string; precio: number }[];
    subtotal: number;
    notas?: string;
  }[];
  pagos: {
    metodo: 'efectivo' | 'tarjeta' | 'app_plataforma';
    monto: number;
    referencia?: string;
  }[];
}): Promise<Orden> {
  // Insertar la orden
  const insertData: Record<string, unknown> = {
    sucursal_id: orden.sucursal_id,
    empleado_id: orden.empleado_id || null,
    descuento_empleado_id: orden.descuento_empleado_id || null,
    subtotal: orden.subtotal,
    descuento: orden.descuento,
    impuesto: orden.impuesto,
    total: orden.total,
    estado: 'completada',
    estado_preparacion: 'pendiente',
    notas: orden.notas || null,
    nombre_cliente: orden.nombre_cliente || null,
    plataforma: orden.plataforma || null,
    total_plataforma: orden.total_plataforma || null,
  };
  if (orden.numero_orden) {
    insertData.numero_orden = orden.numero_orden;
  }
  const { data: ordenData, error: ordenError } = await supabase
    .from('ordenes')
    .insert(insertData)
    .select()
    .single();

  if (ordenError) throw ordenError;

  // Insertar los items
  const itemsToInsert = orden.items.map(item => ({
    orden_id: ordenData.id,
    producto_id: item.producto_id,
    nombre_producto: item.nombre_producto,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    modificadores: item.modificadores,
    subtotal: item.subtotal,
    notas: item.notas || null,
  }));

  const { error: itemsError } = await supabase
    .from('orden_items')
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  // Insertar los pagos
  const pagosToInsert = orden.pagos.map(pago => ({
    orden_id: ordenData.id,
    metodo: pago.metodo,
    monto: pago.monto,
    referencia: pago.referencia || null,
  }));

  const { error: pagosError } = await supabase
    .from('pagos')
    .insert(pagosToInsert);

  if (pagosError) throw pagosError;

  // Descontar inventario (best-effort, no bloquea la venta)
  try {
    for (const item of orden.items) {
      await supabase.rpc('descontar_inventario', {
        p_producto_id: item.producto_id,
        p_sucursal_id: orden.sucursal_id,
        p_cantidad: item.cantidad,
      }).then(({ error }) => {
        if (error) console.warn(`Inventario no descontado para producto ${item.producto_id}:`, error.message);
      });
    }
  } catch (invErr) {
    console.warn('Error descontando inventario (no bloquea la venta):', invErr);
  }

  return ordenData;
}

export async function getOrdenes(filtros?: {
  sucursalId?: number;
  desde?: string;
  hasta?: string;
  limit?: number;
  includeItems?: boolean;
}) {
  const selectStr = filtros?.includeItems
    ? '*, pagos(metodo, monto), orden_items(id, nombre_producto, cantidad, precio_unitario, modificadores, subtotal)'
    : '*, pagos(metodo, monto)';
  let query = supabase
    .from('ordenes')
    .select(selectStr)
    .order('created_at', { ascending: false });

  if (filtros?.sucursalId) {
    query = query.eq('sucursal_id', filtros.sucursalId);
  }
  if (filtros?.desde) {
    query = query.gte('created_at', filtros.desde);
  }
  if (filtros?.hasta) {
    query = query.lte('created_at', filtros.hasta);
  }
  if (filtros?.limit) {
    query = query.limit(filtros.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCajaAbierta(sucursalId: number): Promise<Caja | null> {
  const { data, error } = await supabase
    .from('cajas')
    .select('*')
    .eq('sucursal_id', sucursalId)
    .eq('estado', 'abierta')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function abrirCaja(sucursalId: number, montoApertura: number): Promise<Caja> {
  const prefijoOrden = Math.floor(Math.random() * 90) + 10; // 10-99
  const { data, error } = await supabase
    .from('cajas')
    .insert({
      sucursal_id: sucursalId,
      monto_apertura: montoApertura,
      estado: 'abierta',
      prefijo_orden: prefijoOrden,
      contador_orden: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cerrarCaja(cajaId: string, efectivoContado: number, notas?: string): Promise<Caja> {
  const { data, error } = await supabase
    .from('cajas')
    .update({
      monto_cierre: efectivoContado,
      efectivo_contado: efectivoContado,
      notas: notas || null,
      estado: 'cerrada',
      closed_at: new Date().toISOString(),
    })
    .eq('id', cajaId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// === FUNCIONES CAJA EXTENDIDAS ===

export async function getMovimientosCaja(cajaId: string): Promise<MovimientoCaja[]> {
  const { data, error } = await supabase
    .from('movimientos_caja')
    .select('*')
    .eq('caja_id', cajaId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function crearMovimientoCaja(
  cajaId: string,
  tipo: 'deposito' | 'retiro' | 'gasto',
  monto: number,
  comentario?: string,
  subcategoria?: SubcategoriaGasto
): Promise<MovimientoCaja> {
  const { data, error } = await supabase
    .from('movimientos_caja')
    .insert({ caja_id: cajaId, tipo, monto, comentario: comentario || null, subcategoria: subcategoria || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCajasAbiertas(): Promise<Caja[]> {
  const { data, error } = await supabase
    .from('cajas')
    .select('*')
    .eq('estado', 'abierta')
    .order('opened_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getCierresCaja(filtros?: {
  sucursalId?: number;
  limit?: number;
  desde?: string;
  hasta?: string;
}): Promise<Caja[]> {
  let query = supabase
    .from('cajas')
    .select('*')
    .eq('estado', 'cerrada')
    .order('closed_at', { ascending: false });
  if (filtros?.sucursalId) query = query.eq('sucursal_id', filtros.sucursalId);
  if (filtros?.desde) query = query.gte('closed_at', filtros.desde);
  if (filtros?.hasta) query = query.lte('closed_at', filtros.hasta);
  if (filtros?.limit) query = query.limit(filtros.limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function reembolsarOrden(ordenId: string): Promise<Orden> {
  // Obtener info de la orden para restaurar inventario
  const { data: ordenInfo } = await supabase
    .from('ordenes')
    .select('sucursal_id')
    .eq('id', ordenId)
    .single();

  const { data: items } = await supabase
    .from('orden_items')
    .select('producto_id, cantidad')
    .eq('orden_id', ordenId);

  // Marcar como cancelada
  const { data, error } = await supabase
    .from('ordenes')
    .update({ estado: 'cancelada' })
    .eq('id', ordenId)
    .select()
    .single();
  if (error) throw error;

  // Restaurar inventario (best-effort, no bloquea el reembolso)
  if (ordenInfo && items) {
    for (const item of items) {
      try {
        await supabase.rpc('descontar_inventario', {
          p_producto_id: item.producto_id,
          p_sucursal_id: ordenInfo.sucursal_id,
          p_cantidad: -item.cantidad,
        });
      } catch (err) {
        console.warn(`Inventario no restaurado para producto ${item.producto_id}:`, err);
      }
    }
  }

  return data;
}

// === FUNCIONES LEALTAD ===

export async function buscarClientePorTelefono(telefono: string): Promise<Cliente | null> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('telefono', telefono)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function buscarClientes(query: string): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .or(`telefono.ilike.%${query}%,nombre.ilike.%${query}%`)
    .order('nombre')
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function crearCliente(nombre: string, telefono: string): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({ nombre, telefono })
    .select()
    .single();

  if (error) throw error;

  // Crear tarjeta activa automáticamente
  const { error: tarjetaError } = await supabase
    .from('tarjetas_lealtad')
    .insert({ cliente_id: data.id, sellos_actuales: 0, estado: 'activa' });

  if (tarjetaError) {
    console.error('Error creando tarjeta de lealtad para cliente', data.id, tarjetaError.message);
  }

  return data;
}

export async function getTarjetaActiva(clienteId: string): Promise<TarjetaLealtad | null> {
  const { data, error } = await supabase
    .from('tarjetas_lealtad')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('estado', 'activa')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getTarjetaCompleta(clienteId: string): Promise<TarjetaLealtad | null> {
  const { data, error } = await supabase
    .from('tarjetas_lealtad')
    .select('*')
    .eq('cliente_id', clienteId)
    .eq('estado', 'completa')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function agregarSello(
  clienteId: string,
  ordenId: string,
  sucursalId: number
): Promise<{ tarjeta: TarjetaLealtad; completada: boolean }> {
  // Buscar tarjeta activa
  let tarjeta = await getTarjetaActiva(clienteId);

  // Si no hay tarjeta activa, crear una
  if (!tarjeta) {
    const { data: newTarjeta, error: newError } = await supabase
      .from('tarjetas_lealtad')
      .insert({ cliente_id: clienteId, sellos_actuales: 0, estado: 'activa' })
      .select()
      .single();
    if (newError || !newTarjeta) throw newError || new Error('No se pudo crear tarjeta');
    tarjeta = newTarjeta;
  }

  const tarjetaActual = tarjeta!;

  // Registrar el sello individual
  const { error: selloError } = await supabase
    .from('sellos')
    .insert({
      tarjeta_id: tarjetaActual.id,
      cliente_id: clienteId,
      orden_id: ordenId,
      sucursal_id: sucursalId,
    });

  if (selloError) {
    console.error('Error registrando sello para tarjeta', tarjetaActual.id, selloError.message);
  }

  const nuevosSellos = tarjetaActual.sellos_actuales + 1;
  const completada = nuevosSellos >= 10;

  // Actualizar tarjeta
  const { data: tarjetaActualizada, error: updateError } = await supabase
    .from('tarjetas_lealtad')
    .update({
      sellos_actuales: nuevosSellos,
      ...(completada ? { estado: 'completa', completed_at: new Date().toISOString() } : {}),
    })
    .eq('id', tarjetaActual.id)
    .select()
    .single();

  if (updateError) throw updateError;

  // Si se completó, crear nueva tarjeta activa para el siguiente ciclo
  if (completada) {
    await supabase
      .from('tarjetas_lealtad')
      .insert({ cliente_id: clienteId, sellos_actuales: 0, estado: 'activa' });
  }

  return { tarjeta: tarjetaActualizada, completada };
}

export async function canjearTarjeta(
  tarjetaId: string,
  ordenId: string
): Promise<TarjetaLealtad> {
  const { data, error } = await supabase
    .from('tarjetas_lealtad')
    .update({
      estado: 'canjeada',
      canjeada_at: new Date().toISOString(),
      canjeada_en_orden_id: ordenId,
    })
    .eq('id', tarjetaId)
    .eq('estado', 'completa')
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getHistorialTarjetas(clienteId: string): Promise<TarjetaLealtad[]> {
  const { data, error } = await supabase
    .from('tarjetas_lealtad')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getClientesConLealtad(filtros?: {
  limit?: number;
  busqueda?: string;
}): Promise<(Cliente & { tarjeta_activa: TarjetaLealtad | null; tarjetas_canjeadas: number })[]> {
  let query = supabase
    .from('clientes')
    .select('*, tarjetas_lealtad(*)')
    .order('created_at', { ascending: false });

  if (filtros?.busqueda) {
    query = query.or(`telefono.ilike.%${filtros.busqueda}%,nombre.ilike.%${filtros.busqueda}%`);
  }
  if (filtros?.limit) {
    query = query.limit(filtros.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((cliente: Record<string, unknown>) => {
    const tarjetas = (cliente.tarjetas_lealtad || []) as TarjetaLealtad[];
    const tarjeta_activa = tarjetas.find(t => t.estado === 'activa') ||
                           tarjetas.find(t => t.estado === 'completa') || null;
    const tarjetas_canjeadas = tarjetas.filter(t => t.estado === 'canjeada').length;

    return {
      id: cliente.id as string,
      nombre: cliente.nombre as string,
      telefono: cliente.telefono as string,
      notas: cliente.notas as string | null,
      created_at: cliente.created_at as string,
      tarjeta_activa,
      tarjetas_canjeadas,
    };
  });
}
