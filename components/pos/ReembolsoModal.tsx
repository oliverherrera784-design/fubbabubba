'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw, Loader2, Search } from 'lucide-react';

interface Orden {
  id: string;
  numero_orden: number;
  total: number;
  estado: string;
  created_at: string;
  pagos: { metodo: string; monto: number }[];
}

interface ReembolsoModalProps {
  sucursalId: number;
  onConfirm: (ordenId: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export function ReembolsoModal({ sucursalId, onConfirm, onClose, loading }: ReembolsoModalProps) {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const params = new URLSearchParams({
          sucursal_id: sucursalId.toString(),
          desde: hoy.toISOString(),
        });
        const res = await fetch(`/api/pos/ordenes?${params}`);
        const data = await res.json();
        // Solo mostrar ordenes completadas
        setOrdenes((data.ordenes || []).filter((o: Orden) => o.estado === 'completada'));
      } catch (e) {
        console.error('Error cargando ordenes:', e);
      } finally {
        setLoadingOrdenes(false);
      }
    }
    load();
  }, [sucursalId]);

  const filtradas = busqueda
    ? ordenes.filter(o => o.numero_orden.toString().includes(busqueda))
    : ordenes;

  const handleConfirm = () => {
    if (!selected || loading) return;
    onConfirm(selected);
  };

  const selectedOrden = ordenes.find(o => o.id === selected);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-lg text-gray-900">Reembolsar Orden</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Buscar */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por # de orden..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Lista de órdenes */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {loadingOrdenes ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
            </div>
          ) : filtradas.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No hay órdenes para reembolsar hoy</p>
          ) : (
            <div className="space-y-2">
              {filtradas.map(orden => (
                <button
                  key={orden.id}
                  onClick={() => setSelected(orden.id)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all touch-manipulation ${
                    selected === orden.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-900">#{orden.numero_orden}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(orden.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900">
                      ${orden.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {orden.pagos?.[0]?.metodo || 'N/A'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Confirmación */}
        {selectedOrden && (
          <div className="p-4 border-t border-gray-100 bg-red-50">
            <p className="text-sm text-red-700 mb-3 text-center">
              Cancelar orden #{selectedOrden.numero_orden} por ${selectedOrden.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all touch-manipulation disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </span>
              ) : (
                'Confirmar Reembolso'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
