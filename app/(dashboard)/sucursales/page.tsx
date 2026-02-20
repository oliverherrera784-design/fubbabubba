'use client';

import { StatCard } from '@/components/StatCard';
import { Store, DollarSign, ShoppingCart, Package, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useState, useEffect, useCallback } from 'react';

interface Sucursal {
  id: number;
  nombre: string;
}

interface AnalyticsData {
  resumen: { totalVentas: number; totalTransacciones: number; ticketPromedio: number };
  ventasPorDia: { dia: string; ventas: number; total: number }[];
  ventasPorSucursal: { nombre: string; ventas: number; total: number }[];
}

function formatMoney(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [globalData, setGlobalData] = useState<AnalyticsData | null>(null);
  const [sucursalData, setSucursalData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSuc, setLoadingSuc] = useState(false);

  // Rango: últimos 30 días
  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const hasta = new Date().toISOString();

  // Cargar sucursales y datos globales
  useEffect(() => {
    async function load() {
      try {
        const [sucRes, analyticsRes] = await Promise.all([
          fetch('/api/sucursales'),
          fetch(`/api/analytics?desde=${desde}&hasta=${hasta}`),
        ]);
        const sucData = await sucRes.json();
        const anlData = await analyticsRes.json();

        const sucs = sucData.data || [];
        setSucursales(sucs);
        if (sucs.length > 0) setSelectedId(sucs[0].id);
        if (anlData.success) setGlobalData(anlData);
      } catch (e) {
        console.error('Error cargando datos:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Cargar datos de sucursal seleccionada
  const loadSucursalData = useCallback(async (sucId: number) => {
    setLoadingSuc(true);
    try {
      const res = await fetch(`/api/analytics?desde=${desde}&hasta=${hasta}&sucursal_id=${sucId}`);
      const data = await res.json();
      if (data.success) setSucursalData(data);
    } catch (e) {
      console.error('Error cargando datos de sucursal:', e);
    } finally {
      setLoadingSuc(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    if (selectedId) loadSucursalData(selectedId);
  }, [selectedId, loadSucursalData]);

  const selectedNombre = sucursales.find(s => s.id === selectedId)?.nombre || '';

  // Datos para gráficas de sucursal seleccionada
  const chartData = (sucursalData?.ventasPorDia || []).slice(-7).map(d => ({
    fecha: new Date(d.dia).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    ventas: Math.round(d.total * 100) / 100,
    transacciones: d.ventas,
  }));

  // Comparativa entre sucursales (datos globales)
  const comparativaData = (globalData?.ventasPorSucursal || []).map(s => ({
    nombre: s.nombre,
    ventas: Math.round(s.total * 100) / 100,
    transacciones: s.ventas,
    promedio: s.ventas > 0 ? Math.round((s.total / s.ventas) * 100) / 100 : 0,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const stats = sucursalData?.resumen;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sucursales</h1>
        <p className="text-gray-600 mt-1">Análisis detallado por ubicación (últimos 30 días)</p>
      </div>

      {/* Selector de Sucursal */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2">
          {sucursales.map(suc => (
            <button
              key={suc.id}
              onClick={() => setSelectedId(suc.id)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${selectedId === suc.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {suc.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Stats de Sucursal Seleccionada */}
      {loadingSuc ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ventas Totales"
            value={formatMoney(stats.totalVentas)}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Transacciones"
            value={stats.totalTransacciones.toLocaleString('es-MX')}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Ticket Promedio"
            value={formatMoney(stats.ticketPromedio)}
            icon={Package}
            color="green"
          />
          <StatCard
            title="Sucursal"
            value={selectedNombre}
            icon={Store}
            color="orange"
          />
        </div>
      ) : null}

      {/* Gráficas de Sucursal Seleccionada */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas Últimos 7 Días - {selectedNombre}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend />
                <Line type="monotone" dataKey="ventas" stroke="#9333ea" strokeWidth={2} name="Ventas ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transacciones - {selectedNombre}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="transacciones" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Comparativa entre Sucursales */}
      {comparativaData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Comparativa General</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparativaData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="nombre" type="category" width={80} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Legend />
              <Bar dataKey="ventas" fill="#9333ea" radius={[0, 8, 8, 0]} name="Ventas ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla Detallada */}
      {comparativaData.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Detalles por Sucursal</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Sucursal</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Ventas Totales</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Transacciones</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Ticket Promedio</th>
                </tr>
              </thead>
              <tbody>
                {comparativaData.map((suc) => (
                  <tr key={suc.nombre} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-900">{suc.nombre}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-gray-900">
                      {formatMoney(suc.ventas)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {suc.transacciones.toLocaleString('es-MX')}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {formatMoney(suc.promedio)}
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
