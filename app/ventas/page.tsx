'use client';

import { useState } from 'react';
import { Calendar, Download, Filter } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { DollarSign, ShoppingCart, TrendingUp, CreditCard } from 'lucide-react';

export default function VentasPage() {
  const [periodo, setPeriodo] = useState('hoy');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600 mt-1">Historial y análisis de ventas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          <Download className="w-5 h-5" />
          Exportar Reporte
        </button>
      </div>

      <div className="flex gap-2">
        {['hoy', 'semana', 'mes', 'año'].map(p => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
              periodo === p ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ventas del Día" value="$12,450" change={8.5} icon={DollarSign} color="purple" />
        <StatCard title="Transacciones" value="156" change={12} icon={ShoppingCart} color="blue" />
        <StatCard title="Ticket Promedio" value="$79.81" change={-2.1} icon={TrendingUp} color="green" />
        <StatCard title="Métodos de Pago" value="3" icon={CreditCard} color="orange" />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4">Próximamente</h3>
        <p className="text-gray-600">Esta sección se completará con datos en tiempo real de Loyverse.</p>
      </div>
    </div>
  );
}
