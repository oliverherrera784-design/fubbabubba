'use client';

import { StatCard } from '@/components/StatCard';
import { Store, DollarSign, ShoppingCart, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { generateMockSalesData, SUCURSALES, getSucursalStats } from '@/lib/dataParser';
import { useMemo, useState } from 'react';

export default function SucursalesPage() {
  const salesData = useMemo(() => generateMockSalesData(), []);
  const [selectedSucursal, setSelectedSucursal] = useState(SUCURSALES[0]);

  const sucursalStats = getSucursalStats(salesData, selectedSucursal);
  const sucursalData = salesData.filter(s => s.sucursal === selectedSucursal).slice(-7);
  
  const chartData = sucursalData.map(item => ({
    fecha: new Date(item.fecha).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
    ventas: item.ventas,
    transacciones: item.transacciones,
    productos: item.productosVendidos
  }));

  // Comparativa entre sucursales
  const comparativaData = SUCURSALES.map(sucursal => {
    const stats = getSucursalStats(salesData, sucursal);
    return {
      nombre: sucursal,
      ventas: stats.totalVentas,
      transacciones: stats.totalTransacciones,
      promedio: stats.promedioPorTransaccion
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sucursales</h1>
        <p className="text-gray-600 mt-1">Análisis detallado por ubicación</p>
      </div>

      {/* Selector de Sucursal */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2">
          {SUCURSALES.map(sucursal => (
            <button
              key={sucursal}
              onClick={() => setSelectedSucursal(sucursal)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${selectedSucursal === sucursal 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {sucursal}
            </button>
          ))}
        </div>
      </div>

      {/* Stats de Sucursal Seleccionada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas Totales"
          value={`$${sucursalStats.totalVentas.toLocaleString('es-MX')}`}
          change={sucursalStats.tendencia}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Transacciones"
          value={sucursalStats.totalTransacciones.toLocaleString('es-MX')}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Ticket Promedio"
          value={`$${sucursalStats.promedioPorTransaccion.toFixed(2)}`}
          icon={Package}
          color="green"
        />
        <StatCard
          title="Sucursal"
          value={selectedSucursal}
          icon={Store}
          color="orange"
        />
      </div>

      {/* Gráficas de Sucursal Seleccionada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas Últimos 7 Días - {selectedSucursal}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Legend />
              <Line type="monotone" dataKey="ventas" stroke="#9333ea" strokeWidth={2} name="Ventas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Transacciones - {selectedSucursal}</h3>
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

      {/* Comparativa entre Sucursales */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Comparativa General</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={comparativaData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="nombre" type="category" width={80} tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
            <Legend />
            <Bar dataKey="ventas" fill="#9333ea" radius={[0, 8, 8, 0]} name="Ventas" />
            <Bar dataKey="transacciones" fill="#3b82f6" radius={[0, 8, 8, 0]} name="Transacciones" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla Detallada */}
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
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {comparativaData.map((sucursal) => {
                const stats = getSucursalStats(salesData, sucursal.nombre);
                return (
                  <tr key={sucursal.nombre} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-900">{sucursal.nombre}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-gray-900">
                      ${sucursal.ventas.toLocaleString('es-MX')}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {sucursal.transacciones.toLocaleString('es-MX')}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      ${sucursal.promedio.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-semibold
                        ${stats.tendencia >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {stats.tendencia >= 0 ? '+' : ''}{stats.tendencia.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
