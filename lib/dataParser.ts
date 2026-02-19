export interface Product {
  handle: string;
  ref: string;
  nombre: string;
  categoria: string;
  precio: number;
  coste: number;
  inventario: {
    [sucursal: string]: number;
  };
}

export interface SalesData {
  sucursal: string;
  ventas: number;
  productos: string[];
}

export const SUCURSALES = [
  'Sendero',
  'Dorado',
  'Escobedo',
  'Palacio',
  'Carranza',
  'Zaragoza'
];

// Mapa de sucursales: nombre → ID de Loyverse (cuando estén configuradas)
export const SUCURSAL_LOYVERSE_MAP: Record<string, string | null> = {
  'Sendero': null, // Pendiente de configurar en Loyverse
  'Dorado': null,
  'Escobedo': null,
  'Palacio': null,
  'Carranza': null,
  'Zaragoza': null,
  // Cuando configures las sucursales en Loyverse, agrega sus IDs aquí:
  // 'Sendero': '2e93b0ef-0231-4645-a49d-9788a3de43a1',
};

export const CATEGORIAS = [
  'SABORES FRIOS',
  'SABORES CALIENTES',
  'EXTRAS',
  'BOTANA',
  'BASES',
  'LATTES',
  'Combinaciones Fubba',
  'Fubba minis'
];

// Parser simple de los datos CSV
export function parseProductData(csvData: string): Product[] {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  
  const products: Product[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 4) continue;

    const product: Product = {
      handle: values[0] || '',
      ref: values[1] || '',
      nombre: values[2] || '',
      categoria: values[3] || '',
      precio: parseFloat(values[12]) || 0,
      coste: parseFloat(values[13]) || 0,
      inventario: {
        'Fubba Bubba': parseFloat(values[20]) || 0,
        'Fubba 1': parseFloat(values[24]) || 0,
      }
    };

    if (product.nombre) {
      products.push(product);
    }
  }

  return products;
}

// Generar datos de ejemplo para ventas (esto se reemplazará con datos reales de Loyverse)
export function generateMockSalesData(): any[] {
  const now = new Date();
  const salesData: any[] = [];

  // Últimos 30 días
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    SUCURSALES.forEach(sucursal => {
      salesData.push({
        fecha: date.toISOString().split('T')[0],
        sucursal,
        ventas: Math.floor(Math.random() * 5000) + 2000,
        transacciones: Math.floor(Math.random() * 50) + 20,
        productosVendidos: Math.floor(Math.random() * 100) + 50
      });
    });
  }

  return salesData;
}

// Obtener top productos (mockeado por ahora)
export function getTopProducts(products: Product[], limit = 5) {
  return products
    .filter(p => p.categoria === 'SABORES FRIOS')
    .sort((a, b) => {
      const aTotal = Object.values(a.inventario).reduce((sum, val) => sum + Math.abs(val), 0);
      const bTotal = Object.values(b.inventario).reduce((sum, val) => sum + Math.abs(val), 0);
      return bTotal - aTotal;
    })
    .slice(0, limit);
}

// Calcular rentabilidad
export function calculateProfitMargin(precio: number, coste: number): number {
  if (precio === 0) return 0;
  return ((precio - coste) / precio) * 100;
}

// Estadísticas por sucursal
export function getSucursalStats(salesData: any[], sucursal: string) {
  const sucursalData = salesData.filter(s => s.sucursal === sucursal);
  
  const totalVentas = sucursalData.reduce((sum, s) => sum + s.ventas, 0);
  const totalTransacciones = sucursalData.reduce((sum, s) => sum + s.transacciones, 0);
  const promedioPorTransaccion = totalVentas / totalTransacciones;

  return {
    totalVentas,
    totalTransacciones,
    promedioPorTransaccion,
    tendencia: calculateTrend(sucursalData)
  };
}

// Calcular tendencia (últimos 7 días vs 7 días anteriores)
function calculateTrend(data: any[]): number {
  if (data.length < 14) return 0;

  const recent = data.slice(-7).reduce((sum, d) => sum + d.ventas, 0);
  const previous = data.slice(-14, -7).reduce((sum, d) => sum + d.ventas, 0);

  if (previous === 0) return 0;
  return ((recent - previous) / previous) * 100;
}
