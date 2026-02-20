'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { StatCard } from '@/components/StatCard';
import {
  DollarSign, ShoppingCart, TrendingUp, CreditCard, Loader2,
  Printer, MessageCircle, X, Receipt, ChevronDown, ChevronUp,
} from 'lucide-react';
import { imprimirTicket, compartirWhatsApp, type TicketData } from '@/lib/ticket';
import { useAuth } from '@/lib/auth';

interface OrdenConPagos {
  id: string;
  numero_orden: number;
  sucursal_id: number;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  estado: string;
  plataforma?: string | null;
  created_at: string;
  pagos: { metodo: string; monto: number }[];
}

interface OrdenDetalle extends OrdenConPagos {
  items: {
    id: string;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    modificadores: { nombre: string; precio: number }[];
    subtotal: number;
  }[];
}

interface SucursalInfo {
  id: number;
  nombre: string;
  direccion?: string;
}

export default function VentasPage() {
  const { user, canAccessAll } = useAuth();
  const [ordenes, setOrdenes] = useState<OrdenConPagos[]>([]);
  const [sucursales, setSucursales] = useState<SucursalInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('hoy');
  const [sucursalFiltro, setSucursalFiltro] = useState(
    !canAccessAll && user?.sucursal_id ? String(user.sucursal_id) : 'todas'
  );

  // Modal de ticket
  const [ticketOrden, setTicketOrden] = useState<OrdenDetalle | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  const fechaDesde = useMemo(() => {
    const now = new Date();
    const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (periodo) {
      case 'hoy':
        return hoy.toISOString();
      case 'semana': {
        const d = new Date(hoy);
        d.setDate(d.getDate() - 7);
        return d.toISOString();
      }
      case 'mes': {
        const d = new Date(hoy);
        d.setMonth(d.getMonth() - 1);
        return d.toISOString();
      }
      case 'todo':
        return undefined;
      default:
        return hoy.toISOString();
    }
  }, [periodo]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (fechaDesde) params.set('desde', fechaDesde);
        if (sucursalFiltro !== 'todas') params.set('sucursal_id', sucursalFiltro);

        const [ordRes, sucRes] = await Promise.all([
          fetch(`/api/pos/ordenes?${params}`),
          fetch('/api/sucursales'),
        ]);

        const [ordData, sucData] = await Promise.all([ordRes.json(), sucRes.json()]);
        setOrdenes(ordData.ordenes || []);
        setSucursales(sucData.data || []);
      } catch (e) {
        console.error('Error cargando ventas:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fechaDesde, sucursalFiltro]);

  const stats = useMemo(() => {
    const completadas = ordenes.filter(o => o.estado === 'completada');
    const totalVentas = completadas.reduce((s, o) => s + o.total, 0);
    const totalTx = completadas.length;
    const ticketProm = totalTx > 0 ? totalVentas / totalTx : 0;
    const metodos = new Set(completadas.flatMap(o => (o.pagos || []).map(p => p.metodo)));
    return { totalVentas, totalTx, ticketProm, metodos: metodos.size };
  }, [ordenes]);

  const sucursalMap = useMemo(
    () => Object.fromEntries(sucursales.map(s => [s.id, s])),
    [sucursales]
  );

  const metodoPagoLabel = (metodo: string, plataforma?: string | null) => {
    if (plataforma) {
      const platLabel: Record<string, string> = { uber_eats: 'Uber Eats', rappi: 'Rappi', didi: 'Didi' };
      return `${platLabel[plataforma] || plataforma} (${metodo === 'app_plataforma' ? 'App' : 'Efectivo'})`;
    }
    switch (metodo) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'app_plataforma': return 'App Plataforma';
      default: return metodo;
    }
  };

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'completada': return { text: 'Completada', cls: 'bg-green-100 text-green-700' };
      case 'cancelada': return { text: 'Cancelada', cls: 'bg-red-100 text-red-700' };
      case 'pendiente': return { text: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' };
      default: return { text: estado, cls: 'bg-gray-100 text-gray-700' };
    }
  };

  // Ver ticket de una orden
  const handleVerTicket = useCallback(async (ordenId: string) => {
    setLoadingTicket(true);
    try {
      const res = await fetch(`/api/pos/ordenes/${ordenId}`);
      const data = await res.json();
      if (data.success) {
        setTicketOrden(data.orden);
      } else {
        alert('Error cargando orden: ' + (data.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error cargando detalle:', e);
      alert('Error de conexión');
    } finally {
      setLoadingTicket(false);
    }
  }, []);

  // Construir TicketData desde OrdenDetalle
  const buildTicketData = useCallback((orden: OrdenDetalle): TicketData => {
    const suc = sucursalMap[orden.sucursal_id];
    const metodo = orden.pagos?.[0]?.metodo || 'efectivo';
    const montoRecibido = orden.pagos?.[0]?.monto;
    // Solo mostrar cambio si el monto registrado es mayor al total (órdenes anteriores al fix)
    const cambio = metodo === 'efectivo' && montoRecibido && montoRecibido > orden.total
      ? Math.round((montoRecibido - orden.total) * 100) / 100
      : undefined;

    return {
      ordenNumero: orden.numero_orden,
      fecha: orden.created_at,
      sucursal: suc?.nombre || `Sucursal ${orden.sucursal_id}`,
      sucursalId: orden.sucursal_id,
      items: orden.items.map(item => ({
        cantidad: item.cantidad,
        nombre: item.nombre_producto,
        modificadores: item.modificadores,
        subtotal: item.subtotal,
      })),
      subtotal: orden.subtotal,
      descuento: orden.descuento > 0 ? orden.descuento : undefined,
      impuesto: orden.impuesto,
      total: orden.total,
      metodoPago: metodo,
      cambio,
      folio: orden.id,
    };
  }, [sucursalMap]);

  const handleImprimir = useCallback(() => {
    if (!ticketOrden) return;
    imprimirTicket(buildTicketData(ticketOrden));
  }, [ticketOrden, buildTicketData]);

  const handleWhatsApp = useCallback(() => {
    if (!ticketOrden) return;
    compartirWhatsApp(buildTicketData(ticketOrden));
  }, [ticketOrden, buildTicketData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
        <p className="text-gray-600 mt-1">Historial de ventas del POS</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {[
            { key: 'hoy', label: 'Hoy' },
            { key: 'semana', label: '7 días' },
            { key: 'mes', label: '30 días' },
            { key: 'todo', label: 'Todo' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                periodo === p.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <select
          value={sucursalFiltro}
          onChange={(e) => setSucursalFiltro(e.target.value)}
          disabled={!canAccessAll}
          className={`px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:outline-none ${canAccessAll ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
        >
          {canAccessAll && <option value="todas">Todas las sucursales</option>}
          {sucursales.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas del Periodo"
          value={`$${stats.totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Transacciones"
          value={stats.totalTx.toString()}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Ticket Promedio"
          value={`$${stats.ticketProm.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Métodos Usados"
          value={stats.metodos.toString()}
          icon={CreditCard}
          color="orange"
        />
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Órdenes ({ordenes.length})</h3>
        </div>

        {ordenes.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No hay ventas en este periodo
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#Orden</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sucursal</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordenes.map(orden => {
                  const badge = estadoBadge(orden.estado);
                  const metodo = orden.pagos?.[0]?.metodo || 'N/A';
                  return (
                    <tr key={orden.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">#{orden.numero_orden}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(orden.created_at).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sucursalMap[orden.sucursal_id]?.nombre || `Sucursal ${orden.sucursal_id}`}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        ${orden.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {metodoPagoLabel(metodo, orden.plataforma)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleVerTicket(orden.id)}
                          disabled={loadingTicket}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                          title="Ver ticket"
                        >
                          <Receipt className="w-4 h-4" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loading de ticket */}
      {loadingTicket && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-gray-600 mt-3 text-sm">Cargando ticket...</p>
          </div>
        </div>
      )}

      {/* Modal de ticket */}
      {ticketOrden && !loadingTicket && (
        <TicketModal
          orden={ticketOrden}
          sucursal={sucursalMap[ticketOrden.sucursal_id]}
          onClose={() => setTicketOrden(null)}
          onImprimir={handleImprimir}
          onWhatsApp={handleWhatsApp}
        />
      )}
    </div>
  );
}

// --- Modal de Ticket ---
function TicketModal({
  orden,
  sucursal,
  onClose,
  onImprimir,
  onWhatsApp,
}: {
  orden: OrdenDetalle;
  sucursal?: SucursalInfo;
  onClose: () => void;
  onImprimir: () => void;
  onWhatsApp: () => void;
}) {
  const [expandItems, setExpandItems] = useState(true);
  const metodo = orden.pagos?.[0]?.metodo || 'N/A';
  const montoRecibido = orden.pagos?.[0]?.monto || orden.total;
  const cambio = metodo === 'efectivo' ? Math.max(0, montoRecibido - orden.total) : 0;

  const fecha = new Date(orden.created_at).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const metodoPagoLabel = (m: string, plataforma?: string | null) => {
    if (plataforma) {
      const platLabel: Record<string, string> = { uber_eats: 'Uber Eats', rappi: 'Rappi', didi: 'Didi' };
      return `${platLabel[plataforma] || plataforma} (${m === 'app_plataforma' ? 'App' : 'Efectivo'})`;
    }
    switch (m) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'app_plataforma': return 'App Plataforma';
      default: return m;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-purple-600 to-pink-500 text-white text-center relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-90" />
          <h3 className="text-xl font-bold">Ticket de Venta</h3>
          <p className="text-purple-200 mt-0.5">Orden #{orden.numero_orden}</p>
        </div>

        {/* Contenido del ticket */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Info */}
          <div className="text-center mb-4 pb-4 border-b border-dashed border-gray-300">
            <p className="font-bold text-gray-900">Fubba Bubba - {sucursal?.nombre || 'Sin sucursal'}</p>
            {sucursal?.direccion && (
              <p className="text-xs text-gray-500 mt-0.5">{sucursal.direccion}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">{fecha}</p>
            <p className="text-xs text-gray-400 mt-0.5">Folio: {orden.id.substring(0, 8)}</p>
          </div>

          {/* Items */}
          <div className="mb-4 pb-4 border-b border-dashed border-gray-300">
            <button
              onClick={() => setExpandItems(!expandItems)}
              className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-2"
            >
              <span>Productos ({orden.items.length})</span>
              {expandItems ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandItems && (
              <div className="space-y-2">
                {orden.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <span className="text-gray-700">
                        {item.cantidad}x {item.nombre_producto}
                      </span>
                      {item.modificadores && item.modificadores.length > 0 && (
                        <p className="text-xs text-gray-500 ml-4">
                          {item.modificadores.map(m => m.nombre).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="text-gray-900 font-medium ml-2">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${orden.subtotal.toFixed(2)}</span>
            </div>
            {orden.descuento > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Descuento</span>
                <span>-${orden.descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA (16%)</span>
              <span>${orden.impuesto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>${orden.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Pago */}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Método:</span>
              <span className="font-medium text-gray-900">{metodoPagoLabel(metodo, orden.plataforma)}</span>
            </div>
            {metodo === 'efectivo' && cambio > 0 && (
              <>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Recibido:</span>
                  <span className="text-gray-900">${montoRecibido.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Cambio:</span>
                  <span className="font-bold text-green-600">${cambio.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Estado cancelada */}
          {orden.estado === 'cancelada' && (
            <div className="mt-3 p-3 bg-red-50 rounded-xl text-center">
              <span className="text-red-700 font-bold text-sm">ORDEN CANCELADA / REEMBOLSADA</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onImprimir}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Imprimir
          </button>
          <button
            onClick={onWhatsApp}
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

