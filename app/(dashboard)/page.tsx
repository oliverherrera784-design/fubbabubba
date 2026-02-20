'use client';

import { useState, useEffect, useMemo } from 'react';
import { StatCard } from '@/components/StatCard';
import { DollarSign, ShoppingCart, Store, TrendingUp, Loader2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '@/lib/auth';

const COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

interface OrdenConPagos {
  id: string;
  numero_orden: number;
  sucursal_id: number;
  total: number;
  created_at: string;
  pagos: { metodo: string; monto: number }[];
}

interface Sucursal {
  id: number;
  nombre: string;
}

export default function Dashboard() {
  const { user, canAccessAll } = useAuth();
  const [ordenes, setOrdenes] = useState<OrdenConPagos[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (!canAccessAll && user?.sucursal_id) {
          params.set('sucursal_id', String(user.sucursal_id));
        }
        const query = params.toString() ? `?${params}` : '';
        const [ordRes, sucRes] = await Promise.all([
          fetch(`/api/pos/ordenes${query}`),
          fetch('/api/sucursales'),
        ]);
        const [ordData, sucData] = await Promise.all([ordRes.json(), sucRes.json()]);
        setOrdenes(ordData.ordenes || []);
        setSucursales(sucData.data || []);
      } catch (e) {
        console.error('Error cargando dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [canAccessAll, user?.sucursal_id]);

  const sucursalMap = useMemo(
    () => Object.fromEntries(sucursales.map(s => [s.id, s.nombre])),
    [sucursales]
  );

  // Stats generales
  const totalVentas = ordenes.reduce((s, o) => s + o.total, 0);
  const totalTx = ordenes.length;
  const ticketProm = totalTx > 0 ? totalVentas / totalTx : 0;

  // Ventas por día (últimos 7 días)
  const ventasPorDia = useMemo(() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().split('T')[0]] = 0;
    }
    for (const o of ordenes) {
      const key = new Date(o.created_at).toISOString().split('T')[0];
      if (key in days) days[key] += o.total;
    }
    return Object.entries(days).map(([fecha, total]) => ({
      fecha: new Date(fecha).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
      total,
    }));
  }, [ordenes]);

  // Ventas por sucursal
  const ventasPorSucursal = useMemo(() => {
    const map: Record<number, number> = {};
    for (const o of ordenes) {
      map[o.sucursal_id] = (map[o.sucursal_id] || 0) + o.total;
    }
    return sucursales.map(s => ({
      name: s.nombre,
      ventas: map[s.id] || 0,
    }));
  }, [ordenes, sucursales]);

  const maxVentas = Math.max(...ventasPorSucursal.map(s => s.ventas), 1);

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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard General</h1>
        <p className="text-gray-600 mt-1">Vista general de todas las sucursales</p>
      </div>

      {/* POS Activo */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
        <span className="text-purple-800 text-sm font-medium">
          POS propio activo — Las ventas se registran directamente en Supabase
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas Totales"
          value={`$${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Transacciones"
          value={totalTx.toLocaleString('es-MX')}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Ticket Promedio"
          value={`$${ticketProm.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Sucursales Activas"
          value={sucursales.length.toString()}
          icon={Store}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Día */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas (Últimos 7 días)</h3>
          {ventasPorDia.every(d => d.total === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              Sin ventas en los últimos 7 días
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: any) => `$${value.toLocaleString('es-MX')}`}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#9333ea"
                  strokeWidth={3}
                  dot={{ fill: '#9333ea', r: 4 }}
                  name="Ventas"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ventas por Sucursal */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas por Sucursal</h3>
          {ventasPorSucursal.every(s => s.ventas === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              Sin datos aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasPorSucursal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: any) => `$${value.toLocaleString('es-MX')}`}
                />
                <Bar dataKey="ventas" fill="#9333ea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Distribución + Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución por Sucursal</h3>
          {ventasPorSucursal.every(s => s.ventas === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              Sin datos aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ventasPorSucursal.filter(s => s.ventas > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="ventas"
                >
                  {ventasPorSucursal.filter(s => s.ventas > 0).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${value.toLocaleString('es-MX')}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ranking */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ranking de Sucursales</h3>
          {ventasPorSucursal.every(s => s.ventas === 0) ? (
            <p className="text-gray-400 py-8 text-center">Sin datos aún — crea ventas desde el POS</p>
          ) : (
            <div className="space-y-4">
              {[...ventasPorSucursal]
                .sort((a, b) => b.ventas - a.ventas)
                .filter(s => s.ventas > 0)
                .map((sucursal, index) => (
                  <div key={sucursal.name} className="flex items-center gap-4">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{sucursal.name}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${(sucursal.ventas / maxVentas) * 100}%` }}
                        />
                      </div>
                    </div>
                    <p className="font-bold text-gray-900">
                      ${sucursal.ventas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimas Ventas */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Últimas Ventas</h3>
        {ordenes.length === 0 ? (
          <p className="text-gray-400 py-8 text-center">
            No hay ventas registradas — usa el POS para crear tu primera venta
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sucursal</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordenes.slice(0, 10).map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">#{o.numero_orden}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(o.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {sucursalMap[o.sucursal_id] || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      ${o.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {o.pagos?.[0]?.metodo || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
