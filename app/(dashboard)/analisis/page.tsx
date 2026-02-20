'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { StatCard } from '@/components/StatCard';
import {
  DollarSign, ShoppingCart, TrendingUp, Loader2,
  BarChart3, Clock, Trophy, Store, Receipt,
} from 'lucide-react';

interface Resumen {
  totalVentas: number;
  totalTransacciones: number;
  ticketPromedio: number;
}

interface VentaHora {
  hora: number;
  label: string;
  ventas: number;
  total: number;
}

interface VentaDia {
  dia: string;
  ventas: number;
  total: number;
  gastos: number;
}

interface TopProducto {
  nombre: string;
  cantidad: number;
  total: number;
}

interface VentaSucursal {
  nombre: string;
  ventas: number;
  total: number;
}

interface MetodoPago {
  metodo: string;
  count: number;
  total: number;
}

interface GastosData {
  total: number;
  porCategoria: { categoria: string; total: number }[];
}

interface ComisionesData {
  tarjeta_total: number;
  comision: number;
  tasa: string;
}

const COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const metodoLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  app_plataforma: 'App Plataforma',
};

const categoriaLabels: Record<string, string> = {
  insumos: 'Insumos', proveedor: 'Proveedor', renta: 'Renta',
  nomina: 'Nómina', servicios: 'Servicios', limpieza: 'Limpieza', otros: 'Otros',
};

function formatMoney(n: number): string {
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AnalisisPage() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('semana');
  const [sucursalFiltro, setSucursalFiltro] = useState('todas');

  const [resumen, setResumen] = useState<Resumen>({ totalVentas: 0, totalTransacciones: 0, ticketPromedio: 0 });
  const [ventasPorHora, setVentasPorHora] = useState<VentaHora[]>([]);
  const [ventasPorDia, setVentasPorDia] = useState<VentaDia[]>([]);
  const [topProductos, setTopProductos] = useState<TopProducto[]>([]);
  const [ventasPorSucursal, setVentasPorSucursal] = useState<VentaSucursal[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [sucursales, setSucursales] = useState<{ id: number; nombre: string }[]>([]);
  const [gastos, setGastos] = useState<GastosData>({ total: 0, porCategoria: [] });
  const [comisiones, setComisiones] = useState<ComisionesData>({ tarjeta_total: 0, comision: 0, tasa: '4.05%' });

  const fechaDesde = useMemo(() => {
    const now = new Date();
    const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (periodo) {
      case 'hoy': return hoy.toISOString();
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
      case 'todo': return undefined;
      default: return hoy.toISOString();
    }
  }, [periodo]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (fechaDesde) params.set('desde', fechaDesde);
        if (sucursalFiltro !== 'todas') params.set('sucursal_id', sucursalFiltro);

        const res = await fetch(`/api/analytics?${params}`);
        const data = await res.json();

        if (data.success) {
          setResumen(data.resumen);
          setVentasPorHora(data.ventasPorHora);
          setVentasPorDia(data.ventasPorDia);
          setTopProductos(data.topProductos);
          setVentasPorSucursal(data.ventasPorSucursal);
          setMetodosPago(data.metodosPago);
          setSucursales(data.sucursales);
          setGastos(data.gastos || { total: 0, porCategoria: [] });
          setComisiones(data.comisiones || { tarjeta_total: 0, comision: 0, tasa: '4.05%' });
        }
      } catch (e) {
        console.error('Error cargando analytics:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fechaDesde, sucursalFiltro]);

  // Formatear labels de días para la gráfica
  const ventasDiaFormatted = useMemo(() =>
    ventasPorDia.map(d => ({
      ...d,
      label: new Date(d.dia + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
    })),
    [ventasPorDia]
  );

  // Solo mostrar horas con ventas o el rango comercial (8-22)
  const ventasHoraFiltradas = useMemo(() =>
    ventasPorHora.filter(h => h.hora >= 8 && h.hora <= 22),
    [ventasPorHora]
  );

  // Formatear categorías de gastos con labels bonitos
  const gastosCategoriaFormatted = useMemo(() =>
    gastos.porCategoria.map(g => ({
      ...g,
      label: categoriaLabels[g.categoria] || g.categoria,
    })),
    [gastos.porCategoria]
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Análisis</h1>
        <p className="text-gray-600 mt-1">Estadísticas y tendencias de ventas</p>
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
          className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
        >
          <option value="todas">Todas las sucursales</option>
          {sucursales.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

      {/* Stats resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Ventas Totales"
          value={formatMoney(resumen.totalVentas)}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Transacciones"
          value={resumen.totalTransacciones.toString()}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Ticket Promedio"
          value={formatMoney(resumen.ticketPromedio)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Gastos Operativos"
          value={formatMoney(gastos.total)}
          icon={Receipt}
          color="orange"
        />
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas vs Gastos por día (línea) */}
        {ventasDiaFormatted.length > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">Ventas vs Gastos por Día</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ventasDiaFormatted}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value, name) => [
                      formatMoney(Number(value || 0)),
                      name === 'total' ? 'Ventas' : 'Gastos',
                    ]}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Legend formatter={(value) => value === 'total' ? 'Ventas' : 'Gastos'} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={{ fill: '#7c3aed', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gastos"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 3 }}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Ventas por hora (barras) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-pink-600" />
            <h3 className="font-bold text-gray-900">Ventas por Hora</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasHoraFiltradas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'total' ? formatMoney(Number(value || 0)) : Number(value || 0),
                    name === 'total' ? 'Total' : 'Ventas',
                  ]}
                />
                <Bar dataKey="ventas" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top productos (barras horizontales) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-900">Productos Más Vendidos</h3>
          </div>
          {topProductos.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">Sin datos en este periodo</p>
          ) : (
            <div className="space-y-3">
              {topProductos.slice(0, 8).map((prod, i) => {
                const maxCantidad = topProductos[0]?.cantidad || 1;
                const pct = (prod.cantidad / maxCantidad) * 100;
                return (
                  <div key={prod.nombre}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium truncate flex-1 mr-2">
                        <span className="text-gray-400 mr-1">#{i + 1}</span>
                        {prod.nombre}
                      </span>
                      <span className="text-gray-900 font-bold whitespace-nowrap">
                        {prod.cantidad} uds
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Métodos de pago (pie) + comisión */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-gray-900">Métodos de Pago</h3>
          </div>
          {metodosPago.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">Sin datos en este periodo</p>
          ) : (
            <>
              <div className="flex items-center gap-6">
                <div className="h-48 w-48 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metodosPago}
                        dataKey="count"
                        nameKey="metodo"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={35}
                      >
                        {metodosPago.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `${Number(value || 0)} transacciones`,
                          metodoLabels[String(name)] || String(name),
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 flex-1">
                  {metodosPago.map((m, i) => (
                    <div key={m.metodo} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {metodoLabels[m.metodo] || m.metodo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {m.count} tx · {formatMoney(m.total)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Comisión de tarjeta */}
              {comisiones.comision > 0 && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700">Comisión Mercado Pago ({comisiones.tasa})</span>
                    <span className="font-bold text-red-700">-{formatMoney(comisiones.comision)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Ingreso neto tarjeta</span>
                    <span className="font-medium text-gray-800">{formatMoney(comisiones.tarjeta_total - comisiones.comision)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Gastos por categoría (barras horizontales) */}
        {gastosCategoriaFormatted.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-gray-900">Gastos por Categoría</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gastosCategoriaFormatted} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 12 }} width={90} />
                  <Tooltip formatter={(value) => [formatMoney(Number(value || 0)), 'Total']} />
                  <Bar dataKey="total" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-between items-center bg-amber-50 rounded-lg p-3">
              <span className="font-semibold text-amber-800">Total gastos:</span>
              <span className="text-lg font-bold text-amber-700">{formatMoney(gastos.total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Comparativa de sucursales */}
      {ventasPorSucursal.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Comparativa de Sucursales</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ventasPorSucursal} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="nombre" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'total' ? formatMoney(Number(value || 0)) : Number(value || 0),
                    name === 'total' ? 'Ventas $' : 'Transacciones',
                  ]}
                />
                <Legend />
                <Bar dataKey="total" name="Ventas $" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla resumen de sucursales */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-500">Sucursal</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-500">Transacciones</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-500">Total Ventas</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-500">Ticket Prom.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ventasPorSucursal.map(s => (
                  <tr key={s.nombre}>
                    <td className="px-4 py-2 font-medium text-gray-900">{s.nombre}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{s.ventas}</td>
                    <td className="px-4 py-2 text-right font-bold text-gray-900">{formatMoney(s.total)}</td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {formatMoney(s.ventas > 0 ? s.total / s.ventas : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
