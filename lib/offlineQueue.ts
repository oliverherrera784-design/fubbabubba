// Cola de órdenes offline para el POS
// Guarda órdenes en localStorage cuando no hay internet y sincroniza al reconectar

const QUEUE_KEY = 'fubba_offline_orders';
const SYNCED_KEY = 'fubba_synced_count';

export interface OfflineOrder {
  id: string; // ID temporal generado en cliente
  timestamp: string;
  sucursal_id: number;
  empleado_id: number | null;
  descuento_empleado_id: number | null;
  plataforma: string | null;
  total_plataforma: number | null;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  items: {
    producto_id: number;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    modificadores: { nombre: string; precio: number }[];
    subtotal: number;
  }[];
  pagos: {
    metodo: 'efectivo' | 'tarjeta' | 'app_plataforma';
    monto: number;
  }[];
  notas?: string;
  synced: boolean;
  syncError?: string;
}

// Generar ID temporal
function generateTempId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Obtener todas las órdenes offline
export function getOfflineOrders(): OfflineOrder[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Obtener solo las pendientes (no sincronizadas)
export function getPendingOrders(): OfflineOrder[] {
  return getOfflineOrders().filter(o => !o.synced);
}

// Guardar una orden offline
export function saveOfflineOrder(orden: Omit<OfflineOrder, 'id' | 'timestamp' | 'synced'>): OfflineOrder {
  const orders = getOfflineOrders();
  const newOrder: OfflineOrder = {
    ...orden,
    id: generateTempId(),
    timestamp: new Date().toISOString(),
    synced: false,
  };
  orders.push(newOrder);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(orders));
  return newOrder;
}

// Marcar una orden como sincronizada
function markAsSynced(id: string, serverOrdenId?: string): void {
  const orders = getOfflineOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx >= 0) {
    orders[idx].synced = true;
    if (serverOrdenId) {
      orders[idx].id = serverOrdenId; // Reemplazar con el ID real del servidor
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(orders));

    // Incrementar contador de sincronizadas
    const count = parseInt(localStorage.getItem(SYNCED_KEY) || '0');
    localStorage.setItem(SYNCED_KEY, String(count + 1));
  }
}

// Marcar error en una orden
function markSyncError(id: string, error: string): void {
  const orders = getOfflineOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx >= 0) {
    orders[idx].syncError = error;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(orders));
  }
}

// Sincronizar una orden con el servidor
async function syncOrder(order: OfflineOrder): Promise<boolean> {
  try {
    const response = await fetch('/api/pos/ordenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sucursal_id: order.sucursal_id,
        empleado_id: order.empleado_id,
        descuento_empleado_id: order.descuento_empleado_id,
        plataforma: order.plataforma,
        total_plataforma: order.total_plataforma,
        subtotal: order.subtotal,
        descuento: order.descuento,
        impuesto: order.impuesto,
        total: order.total,
        items: order.items,
        pagos: order.pagos,
        notas: order.notas ? `${order.notas} [Offline: ${order.timestamp}]` : `[Offline: ${order.timestamp}]`,
      }),
    });

    const data = await response.json();

    if (data.success) {
      markAsSynced(order.id, data.orden?.id);
      return true;
    } else {
      markSyncError(order.id, data.error || 'Error del servidor');
      return false;
    }
  } catch (err) {
    markSyncError(order.id, err instanceof Error ? err.message : 'Error de red');
    return false;
  }
}

// Sincronizar todas las órdenes pendientes
export async function syncAllPendingOrders(): Promise<{
  total: number;
  synced: number;
  failed: number;
}> {
  const pending = getPendingOrders();
  let synced = 0;
  let failed = 0;

  for (const order of pending) {
    const success = await syncOrder(order);
    if (success) {
      synced++;
    } else {
      failed++;
    }
  }

  return { total: pending.length, synced, failed };
}

// Limpiar órdenes ya sincronizadas (mantener últimas 24h por seguridad)
export function cleanSyncedOrders(): void {
  const orders = getOfflineOrders();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const filtered = orders.filter(o => {
    if (!o.synced) return true; // Mantener no sincronizadas
    return new Date(o.timestamp).getTime() > oneDayAgo; // Mantener sincronizadas recientes
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

// Contar pendientes
export function getPendingCount(): number {
  return getPendingOrders().length;
}

// Obtener número de orden temporal (basado en timestamp)
export function getTempOrderNumber(): number {
  return Math.floor(Date.now() / 1000) % 100000;
}
