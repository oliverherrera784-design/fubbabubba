'use client';

import { useState } from 'react';
import { Clock, ChefHat, CheckCircle2, Loader2 } from 'lucide-react';
import type { EstadoPreparacion } from '@/lib/supabase';

interface KDSItem {
  id: string;
  nombre_producto: string;
  cantidad: number;
  modificadores: { nombre: string; precio: number }[] | null;
  notas: string | null;
}

interface KDSOrden {
  id: string;
  numero_orden: number;
  nombre_cliente: string | null;
  estado_preparacion: EstadoPreparacion;
  created_at: string;
  notas: string | null;
  orden_items: KDSItem[];
}

interface OrderCardProps {
  orden: KDSOrden;
  onUpdateEstado: (ordenId: string, estado: EstadoPreparacion) => Promise<void>;
  ahora: number;
}

const ESTADO_CONFIG: Record<EstadoPreparacion, {
  bg: string; border: string; badge: string; badgeText: string; label: string;
}> = {
  pendiente: {
    bg: 'bg-amber-50', border: 'border-amber-400', badge: 'bg-amber-500', badgeText: 'text-white', label: 'Pendiente',
  },
  en_preparacion: {
    bg: 'bg-blue-50', border: 'border-blue-400', badge: 'bg-blue-500', badgeText: 'text-white', label: 'Preparando',
  },
  listo: {
    bg: 'bg-green-50', border: 'border-green-400', badge: 'bg-green-500', badgeText: 'text-white', label: 'Listo',
  },
  entregado: {
    bg: 'bg-gray-50', border: 'border-gray-300', badge: 'bg-gray-400', badgeText: 'text-white', label: 'Entregado',
  },
};

function tiempoTranscurrido(createdAt: string, ahora: number): { texto: string; urgente: boolean } {
  const diff = ahora - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (mins < 1) return { texto: `${secs}s`, urgente: false };
  if (mins < 5) return { texto: `${mins}m`, urgente: false };
  return { texto: `${mins}m`, urgente: true };
}

export function OrderCard({ orden, onUpdateEstado, ahora }: OrderCardProps) {
  const [loading, setLoading] = useState(false);
  const config = ESTADO_CONFIG[orden.estado_preparacion];
  const tiempo = tiempoTranscurrido(orden.created_at, ahora);

  const handleNextEstado = async () => {
    const next: Record<string, EstadoPreparacion> = {
      pendiente: 'en_preparacion',
      en_preparacion: 'listo',
      listo: 'entregado',
    };
    const nextEstado = next[orden.estado_preparacion];
    if (!nextEstado) return;

    setLoading(true);
    try {
      await onUpdateEstado(orden.id, nextEstado);
    } finally {
      setLoading(false);
    }
  };

  const nextLabel: Record<string, string> = {
    pendiente: 'Preparar',
    en_preparacion: 'Listo',
    listo: 'Entregar',
  };

  const nextColor: Record<string, string> = {
    pendiente: 'bg-blue-600 hover:bg-blue-700',
    en_preparacion: 'bg-green-600 hover:bg-green-700',
    listo: 'bg-gray-600 hover:bg-gray-700',
  };

  return (
    <div className={`rounded-xl border-2 ${config.border} ${config.bg} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-gray-900">#{orden.numero_orden}</span>
          {orden.nombre_cliente && (
            <span className="text-sm font-medium text-gray-600 truncate max-w-[120px]">
              {orden.nombre_cliente}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badge} ${config.badgeText}`}>
            {config.label}
          </span>
          <span className={`flex items-center gap-1 text-sm font-bold ${tiempo.urgente ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
            <Clock className="w-3.5 h-3.5" />
            {tiempo.texto}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-3 pb-2 space-y-1.5">
        {orden.orden_items.map((item) => (
          <div key={item.id} className="bg-white/70 rounded-lg px-2.5 py-1.5">
            <div className="flex items-start gap-2">
              <span className="text-lg font-black text-gray-900 leading-none mt-0.5">
                {item.cantidad}x
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm leading-tight">
                  {item.nombre_producto}
                </p>
                {item.modificadores && item.modificadores.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {item.modificadores.map((mod, i) => (
                      <span key={i} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                        {mod.nombre}
                      </span>
                    ))}
                  </div>
                )}
                {item.notas && (
                  <p className="text-xs text-amber-700 mt-0.5 italic">
                    {item.notas}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {orden.notas && (
          <p className="text-xs text-gray-600 italic px-1">
            Nota: {orden.notas}
          </p>
        )}
      </div>

      {/* Action button */}
      {orden.estado_preparacion !== 'entregado' && (
        <button
          onClick={handleNextEstado}
          disabled={loading}
          className={`w-full py-3 text-white font-bold text-base transition-all touch-manipulation disabled:opacity-50 flex items-center justify-center gap-2 ${nextColor[orden.estado_preparacion] || 'bg-gray-600'}`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : orden.estado_preparacion === 'pendiente' ? (
            <ChefHat className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          {nextLabel[orden.estado_preparacion]}
        </button>
      )}
    </div>
  );
}
