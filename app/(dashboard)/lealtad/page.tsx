'use client';

import { useState, useEffect } from 'react';
import { Star, Search, Loader2, Phone, User, Gift, Crown } from 'lucide-react';
import type { Cliente, TarjetaLealtad } from '@/lib/supabase';

interface ClienteConLealtad extends Cliente {
  tarjeta_activa: TarjetaLealtad | null;
  tarjetas_canjeadas: number;
}

export default function LealtadPage() {
  const [clientes, setClientes] = useState<ClienteConLealtad[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '100' });
        if (busqueda.length >= 2) params.set('q', busqueda);

        const res = await fetch(`/api/lealtad?${params}`);
        const data = await res.json();
        setClientes(data.clientes || []);
      } catch (e) {
        console.error('Error cargando lealtad:', e);
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(load, busqueda ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  // Estadísticas
  const totalClientes = clientes.length;
  const totalCanjeados = clientes.reduce((acc, c) => acc + c.tarjetas_canjeadas, 0);
  const clientesCerca = clientes.filter(c => {
    const sellos = c.tarjeta_activa?.sellos_actuales || 0;
    return sellos >= 7 && c.tarjeta_activa?.estado === 'activa';
  }).length;
  const tarjetasCompletas = clientes.filter(c =>
    c.tarjeta_activa?.estado === 'completa'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Programa de Lealtad</h1>
        <p className="text-gray-600 mt-1">10 sellos = 1 bebida gratis</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600">Clientes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalClientes}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Gift className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Bebidas canjeadas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalCanjeados}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Tarjetas listas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{tarjetasCompletas}</p>
          <p className="text-xs text-gray-500">por canjear</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-sm text-gray-600">Cerca de completar</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{clientesCerca}</p>
          <p className="text-xs text-gray-500">7+ sellos</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
        />
      </div>

      {/* Lista de clientes */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {busqueda ? 'No se encontraron clientes' : 'Aún no hay clientes registrados'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Los clientes se registran desde el Punto de Venta
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Teléfono</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sellos</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Canjeadas</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Desde</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(cliente => {
                const sellos = cliente.tarjeta_activa?.sellos_actuales || 0;
                const estado = cliente.tarjeta_activa?.estado || 'activa';

                return (
                  <tr key={cliente.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="font-medium text-gray-900">{cliente.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {cliente.telefono}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {/* Mini sellos visuales */}
                      <div className="flex items-center justify-center gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                              i < sellos ? 'bg-amber-400' : 'bg-gray-100'
                            }`}
                          >
                            <Star className={`w-2.5 h-2.5 ${
                              i < sellos ? 'text-white fill-white' : 'text-gray-300'
                            }`} />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-center text-gray-500 mt-1">{sellos}/10</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {estado === 'completa' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <Gift className="w-3 h-3" />
                          Lista
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <Star className="w-3 h-3" />
                          Activa
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cliente.tarjetas_canjeadas > 0 ? (
                        <span className="font-bold text-green-600">{cliente.tarjetas_canjeadas}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-500">
                        {new Date(cliente.created_at).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
