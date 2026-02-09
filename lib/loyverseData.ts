'use client';

// Hook para obtener datos de Loyverse en el cliente
import { useEffect, useState } from 'react';

export function useLoyverseItems() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch('/api/loyverse/items?limit=100');
        if (!response.ok) throw new Error('Error al obtener productos');
        const data = await response.json();
        setItems(data.items || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);

  return { items, loading, error };
}

export function useLoyverseStores() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStores() {
      try {
        const response = await fetch('/api/loyverse/stores');
        if (!response.ok) throw new Error('Error al obtener sucursales');
        const data = await response.json();
        setStores(data.stores || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  return { stores, loading, error };
}

export function useLoyverseReceipts(params?: {
  store_id?: string;
  created_at_min?: string;
  created_at_max?: string;
  limit?: number;
}) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipts() {
      try {
        const queryParams = new URLSearchParams();
        if (params?.store_id) queryParams.append('store_id', params.store_id);
        if (params?.created_at_min) queryParams.append('created_at_min', params.created_at_min);
        if (params?.created_at_max) queryParams.append('created_at_max', params.created_at_max);
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const response = await fetch(`/api/loyverse/receipts?${queryParams}`);
        if (!response.ok) throw new Error('Error al obtener ventas');
        const data = await response.json();
        setReceipts(data.receipts || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReceipts();
  }, [params?.store_id, params?.created_at_min, params?.created_at_max, params?.limit]);

  return { receipts, loading, error };
}

// Transformar items de Loyverse a formato del dashboard
export function transformLoyverseItem(item: any) {
  const variant = item.variants?.[0];
  
  return {
    id: item.id,
    handle: item.handle,
    nombre: item.item_name,
    categoria: getCategoryName(item.category_id),
    precio: variant?.default_price || 0,
    coste: variant?.cost || 0,
    sku: variant?.sku,
    inventario: variant?.stores?.[0]?.available_for_sale ? 100 : 0, // Simulado
    imageUrl: item.image_url,
    color: item.color,
    form: item.form,
  };
}

// Mapeo de IDs de categorías (esto se puede cargar dinámicamente)
function getCategoryName(categoryId: string | null): string {
  const categoryMap: Record<string, string> = {
    'eae0eacf-1c97-48ef-bdaf-1976b6a10a20': 'EXTRAS',
    // Agrega más categorías según tu Loyverse
  };
  return categoryMap[categoryId || ''] || 'Sin categoría';
}

// Calcular totales de recibos
export function calculateReceiptTotals(receipts: any[]) {
  const total = receipts.reduce((sum, receipt) => {
    return sum + (receipt.total_money || 0);
  }, 0);

  const transacciones = receipts.length;
  const promedio = transacciones > 0 ? total / transacciones : 0;

  return {
    total,
    transacciones,
    promedio,
  };
}

// Obtener ventas de los últimos N días
export function getDateRange(days: number = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return {
    created_at_min: start.toISOString(),
    created_at_max: end.toISOString(),
  };
}
