'use client';

import { StatCard } from '@/components/StatCard';
import { LoyverseStatus } from '@/components/LoyverseStatus';
import { DollarSign, ShoppingCart, Store, TrendingUp, Package, Users } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { generateMockSalesData, SUCURSALES } from '@/lib/dataParser';
import { useMemo } from 'react';

const COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function Dashboard() {
  const salesData = useMemo(() => generateMockSalesData(), []);

  // Últimos 7 días para el gráfico
  const last7Days = salesData.slice(-42);
  const chartData = last7Days.reduce((acc: any[], item) => {
    const existing = acc.find(d => d.fecha === item.fecha);
    if (existing) {
      existing[item.sucursal] = item.ventas;
      existing.total += item.ventas;
    } else {
      acc.push({
        fecha: new Date(item.fecha).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
        [item.sucursal]: item.ventas,
        total: item.ventas
      });
    }
    return acc;
  }, []);

  // Ventas por sucursal (últimos 30 días)
  const salesBySucursal = SUCURSALES.map(sucursal => {
    const total = salesData
      .filter(s => s.sucursal === sucursal)
      .reduce((sum, s) => sum + s.ventas, 0);
    return {
      name: sucursal,
      ventas: total
    };
  });

  // Totales
  const totalVentas = salesData.reduce((sum, s) => sum + s.ventas, 0);
  const totalTransacciones = salesData.reduce((sum, s) => sum + s.transacciones, 0);
  const promedioTicket = totalVentas / totalTransacciones;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard General</h1>
        <p className="text-gray-600 mt-1">Vista general de todas las sucursales</p>
      </div>

      {/* Estado de Loyverse */}
      <LoyverseStatus />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas Totales"
          value={`$${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          change={8.5}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Transacciones"
          value={totalTransacciones.toLocaleString('es-MX')}
          change={12.3}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Ticket Promedio"
          value={`$${promedioTicket.toFixed(2)}`}
          change={-2.1}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Sucursales Activas"
          value="6"
          icon={Store}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Día */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas por Día (Últimos 7 días)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value: any) => `$${value.toLocaleString('es-MX')}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#9333ea" 
                strokeWidth={3}
                dot={{ fill: '#9333ea', r: 4 }}
                name="Total"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ventas por Sucursal */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas por Sucursal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesBySucursal}>
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
        </div>
      </div>

      {/* Distribución de Ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución por Sucursal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salesBySucursal}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="ventas"
              >
                {salesBySucursal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${value.toLocaleString('es-MX')}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking de Sucursales */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ranking de Sucursales</h3>
          <div className="space-y-4">
            {salesBySucursal
              .sort((a, b) => b.ventas - a.ventas)
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
                        style={{ 
                          width: `${(sucursal.ventas / salesBySucursal[0].ventas) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">
                    ${sucursal.ventas.toLocaleString('es-MX')}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Productos Top */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Productos Más Vendidos</h3>
          <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
            Ver todos →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {['TARO 🟣', 'FRESA 🍓', 'CHOCOLATE 🍫', 'MANGO 🥭', 'OREO'].map((producto, index) => (
            <div key={producto} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{['🟣', '🍓', '🍫', '🥭', '🍪'][index]}</span>
                <p className="font-semibold text-gray-900 text-sm">{producto}</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">{Math.floor(Math.random() * 500) + 200}</p>
              <p className="text-xs text-gray-500 mt-1">unidades vendidas</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
