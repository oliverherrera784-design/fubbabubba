'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays, Loader2, ChevronDown, ChevronUp, Store,
  DollarSign, ShoppingCart, CreditCard, Banknote, Smartphone,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface OrdenItem {
  id: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  modificadores: { nombre: string; precio: number }[];
  subtotal: number;
}

interface Orden {
  id: string;
  numero_orden: number;
  sucursal_id: number;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  estado: string;
  plataforma?: string | null;
  total_plataforma?: number | null;
  created_at: string;
  pagos: { metodo: string; monto: number }[];
  orden_items: OrdenItem[];
}

interface Sucursal {
  id: number;
  nombre: string;
}

interface SucursalStats {
  totalVentas: number;
  totalOrdenes: number;
  piezas: number;
  efectivo: number;
  tarjeta: number;
  plataforma: number;
  canceladas: number;
}

function formatFechaInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function metodoPagoLabel(metodo: string, plataforma?: string | null): string {
  if (plataforma) {
    const labels: Record<string, string> = { uber_eats: 'Uber Eats', rappi: 'Rappi', didi: 'Didi' };
    return `${labels[plataforma] || plataforma} (${metodo === 'app_plataforma' ? 'App' : 'Efvo'})`;
  }
  switch (metodo) {
    case 'efectivo': return 'Efectivo';
    case 'tarjeta': return 'Tarjeta';
    case 'app_plataforma': return 'App';
    default: return metodo;
  }
}

function estadoBadge(estado: string) {
  switch (estado) {
    case 'completada': return { text: 'Completada', cls: 'bg-green-100 text-green-700' };
    case 'cancelada': return { text: 'Cancelada', cls: 'bg-red-100 text-red-700' };
    case 'pendiente': return { text: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' };
    default: return { text: estado, cls: 'bg-gray-100 text-gray-700' };
  }
}

export default function ReporteDiarioPage() {
  const { user, canAccessAll } = useAuth();
  const [fecha, setFecha] = useState(formatFechaInput(new Date()));
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrdenes, setExpandedOrdenes] = useState<Set<string>>(new Set());

  // Rango del día seleccionado
  const { desde, hasta } = useMemo(() => {
    const d = new Date(fecha + 'T00:00:00');
    const h = new Date(fecha + 'T23:59:59.999');
    return { desde: d.toISOString(), hasta: h.toISOString() };
  }, [fecha]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          desde,
          hasta,
          include_items: 'true',
        });
        if (!canAccessAll && user?.sucursal_id) {
          params.set('sucursal_id', String(user.sucursal_id));
        }

        const [ordRes, sucRes] = await Promise.all([
          fetch(`/api/pos/ordenes?${params}`),
          fetch('/api/sucursales'),
        ]);

        const [ordData, sucData] = await Promise.all([ordRes.json(), sucRes.json()]);
        setOrdenes(ordData.ordenes || []);
        setSucursales(sucData.data || []);
      } catch (e) {
        console.error('Error cargando reporte:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [desde, hasta, canAccessAll, user?.sucursal_id]);

  // Agrupar por sucursal
  const porSucursal = useMemo(() => {
    const map = new Map<number, Orden[]>();
    for (const o of ordenes) {
      if (!map.has(o.sucursal_id)) map.set(o.sucursal_id, []);
      map.get(o.sucursal_id)!.push(o);
    }
    // Ordenar por sucursal_id
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [ordenes]);

  const sucursalMap = useMemo(
    () => Object.fromEntries(sucursales.map(s => [s.id, s.nombre])),
    [sucursales]
  );

  // Stats por sucursal
  function calcStats(ordenesSuc: Orden[]): SucursalStats {
    const completadas = ordenesSuc.filter(o => o.estado === 'completada');
    const canceladas = ordenesSuc.filter(o => o.estado === 'cancelada');
    return {
      totalVentas: completadas.reduce((s, o) => s + o.total, 0),
      totalOrdenes: completadas.length,
      canceladas: canceladas.length,
      piezas: completadas.reduce((s, o) =>
        s + (o.orden_items || []).reduce((ss, item) => ss + item.cantidad, 0), 0),
      efectivo: completadas.reduce((s, o) =>
        s + (o.pagos || []).filter(p => p.metodo === 'efectivo').reduce((ss, p) => ss + p.monto, 0), 0),
      tarjeta: completadas.reduce((s, o) =>
        s + (o.pagos || []).filter(p => p.metodo === 'tarjeta').reduce((ss, p) => ss + p.monto, 0), 0),
      plataforma: completadas.reduce((s, o) =>
        s + (o.pagos || []).filter(p => p.metodo === 'app_plataforma').reduce((ss, p) => ss + p.monto, 0), 0),
    };
  }

  // Stats totales
  const statsGlobal = useMemo(() => {
    const all = porSucursal.flatMap(([, ords]) => ords);
    return calcStats(all);
  }, [porSucursal]);

  const toggleOrden = (id: string) => {
    setExpandedOrdenes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandirTodo = () => {
    setExpandedOrdenes(new Set(ordenes.map(o => o.id)));
  };

  const colapsarTodo = () => {
    setExpandedOrdenes(new Set());
  };

  // Botones de fecha rápida
  const hoy = formatFechaInput(new Date());
  const ayer = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatFechaInput(d);
  })();

  const fechaDisplay = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporte Diario</h1>
          <p className="text-gray-600 mt-1 capitalize">{fechaDisplay}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFecha(ayer)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              fecha === ayer ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ayer
          </button>
          <button
            onClick={() => setFecha(hoy)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              fecha === hoy ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoy
          </button>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="pl-10 pr-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-500 uppercase">Ventas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${statsGlobal.totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-500 uppercase">Ordenes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{statsGlobal.totalOrdenes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-gray-500 uppercase">Efectivo</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${statsGlobal.efectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-gray-500 uppercase">Tarjeta</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${statsGlobal.tarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : ordenes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No hay ventas para este día</p>
          <p className="text-gray-400 text-sm mt-1">Selecciona otra fecha</p>
        </div>
      ) : (
        <>
          {/* Botones expandir/colapsar */}
          <div className="flex justify-end gap-2">
            <button
              onClick={expandirTodo}
              className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              Expandir todo
            </button>
            <button
              onClick={colapsarTodo}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Colapsar todo
            </button>
          </div>

          {/* Por sucursal */}
          {porSucursal.map(([sucId, ordenesSuc]) => {
            const stats = calcStats(ordenesSuc);
            const nombreSuc = sucursalMap[sucId] || `Sucursal ${sucId}`;

            return (
              <div key={sucId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header de sucursal */}
                <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-white border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Store className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">{nombreSuc}</h2>
                        <p className="text-sm text-gray-500">
                          {stats.totalOrdenes} orden{stats.totalOrdenes !== 1 ? 'es' : ''} &middot; {stats.piezas} pieza{stats.piezas !== 1 ? 's' : ''}
                          {stats.canceladas > 0 && (
                            <span className="text-red-500"> &middot; {stats.canceladas} cancelada{stats.canceladas !== 1 ? 's' : ''}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-purple-700">
                      ${stats.totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Tabla de órdenes */}
                <div className="divide-y divide-gray-100">
                  {ordenesSuc.map(orden => {
                    const isExpanded = expandedOrdenes.has(orden.id);
                    const badge = estadoBadge(orden.estado);
                    const hora = new Date(orden.created_at).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    // Método de pago principal (si es mixto, mostrar todos)
                    const metodos = (orden.pagos || []).map(p =>
                      metodoPagoLabel(p.metodo, p.metodo === 'app_plataforma' || p.metodo === 'efectivo' && orden.plataforma ? orden.plataforma : null)
                    );
                    const metodosUnicos = [...new Set(metodos)];

                    return (
                      <div key={orden.id}>
                        {/* Fila principal */}
                        <button
                          onClick={() => toggleOrden(orden.id)}
                          className="w-full px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-5 flex-shrink-0">
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-gray-400" />
                              : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                          <span className="font-medium text-gray-900 w-16">#{orden.numero_orden}</span>
                          <span className="text-sm text-gray-500 w-14">{hora}</span>
                          <span className="text-sm text-gray-600 flex-1 truncate">
                            {(orden.orden_items || []).map(i => `${i.cantidad}x ${i.nombre_producto}`).join(', ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                            {badge.text}
                          </span>
                          <div className="text-right w-28">
                            {orden.pagos?.length > 1 ? (
                              <span className="text-xs text-purple-600 font-medium">Mixto</span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {metodoPagoLabel(orden.pagos?.[0]?.metodo || '', orden.plataforma)}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-gray-900 w-24 text-right">
                            ${orden.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </button>

                        {/* Detalle expandido */}
                        {isExpanded && (
                          <div className="px-6 pb-4 pt-1 ml-9 bg-gray-50 border-t border-gray-100">
                            {/* Productos */}
                            <div className="space-y-1.5 mb-3">
                              {(orden.orden_items || []).map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <div>
                                    <span className="text-gray-700">
                                      {item.cantidad}x {item.nombre_producto}
                                    </span>
                                    <span className="text-gray-400 ml-1">
                                      @${item.precio_unitario.toFixed(2)}
                                    </span>
                                    {item.modificadores && item.modificadores.length > 0 && (
                                      <p className="text-xs text-gray-500 ml-4">
                                        + {item.modificadores.map(m => `${m.nombre} ($${m.precio})`).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                  <span className="font-medium text-gray-900">${item.subtotal.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Totales */}
                            <div className="border-t border-gray-200 pt-2 space-y-1 text-sm">
                              <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${orden.subtotal.toFixed(2)}</span>
                              </div>
                              {orden.descuento > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span>Descuento</span>
                                  <span>-${orden.descuento.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-gray-600">
                                <span>IVA (16%)</span>
                                <span>${orden.impuesto.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                                <span>Total</span>
                                <span>${orden.total.toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Pagos */}
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Pagos</p>
                              {(orden.pagos || []).map((p, i) => (
                                <div key={i} className="flex justify-between text-sm text-gray-700">
                                  <span>{metodoPagoLabel(p.metodo, p.metodo === 'app_plataforma' ? orden.plataforma : null)}</span>
                                  <span>${p.monto.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Plataforma info */}
                            {orden.plataforma && orden.total_plataforma && orden.total_plataforma > orden.total && (
                              <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
                                Precio plataforma: ${orden.total_plataforma.toFixed(2)} (sobreprecio: ${(orden.total_plataforma - orden.total).toFixed(2)})
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Resumen de sucursal */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-medium">Total Ventas</p>
                      <p className="font-bold text-gray-900">${stats.totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-medium flex items-center gap-1">
                        <Banknote className="w-3 h-3" /> Efectivo
                      </p>
                      <p className="font-bold text-green-700">${stats.efectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-medium flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> Tarjeta
                      </p>
                      <p className="font-bold text-blue-700">${stats.tarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-medium flex items-center gap-1">
                        <Smartphone className="w-3 h-3" /> Plataforma
                      </p>
                      <p className="font-bold text-orange-700">${stats.plataforma.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Resumen general (si hay más de 1 sucursal) */}
          {porSucursal.length > 1 && (
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-bold mb-4">Resumen General — Todas las Sucursales</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <p className="text-purple-200 text-xs uppercase font-medium">Total Ventas</p>
                  <p className="text-2xl font-bold">${statsGlobal.totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs uppercase font-medium">Ordenes</p>
                  <p className="text-2xl font-bold">{statsGlobal.totalOrdenes}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs uppercase font-medium">Piezas</p>
                  <p className="text-2xl font-bold">{statsGlobal.piezas}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs uppercase font-medium">Ticket Prom.</p>
                  <p className="text-2xl font-bold">
                    ${statsGlobal.totalOrdenes > 0
                      ? (statsGlobal.totalVentas / statsGlobal.totalOrdenes).toLocaleString('es-MX', { minimumFractionDigits: 2 })
                      : '0.00'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-purple-200 text-xs uppercase">Efectivo</p>
                  <p className="text-lg font-bold">${statsGlobal.efectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs uppercase">Tarjeta</p>
                  <p className="text-lg font-bold">${statsGlobal.tarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs uppercase">Plataforma</p>
                  <p className="text-lg font-bold">${statsGlobal.plataforma.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
