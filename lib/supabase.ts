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
