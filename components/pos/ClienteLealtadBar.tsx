'use client';

import { Star, X, Gift, User, Phone } from 'lucide-react';
import type { Cliente, TarjetaLealtad } from '@/lib/supabase';

interface ClienteConLealtad extends Cliente {
  tarjeta_activa?: TarjetaLealtad | null;
  tarjeta_completa?: TarjetaLealtad | null;
}

interface ClienteLealtadBarProps {
  cliente: ClienteConLealtad;
  onRemove: () => void;
  onCanjear: () => void;
  canjeando?: boolean;
}

export function ClienteLealtadBar({ cliente, onRemove, onCanjear, canjeando }: ClienteLealtadBarProps) {
  const tarjeta = cliente.tarjeta_activa;
  const tarjetaCompleta = cliente.tarjeta_completa;
  const sellos = tarjeta?.estado === 'completa' ? 10 : (tarjeta?.sellos_actuales || 0);

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3">
      {/* Info del cliente */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-amber-700" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{cliente.nombre}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {cliente.telefono}
            </p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-1 hover:bg-amber-200 rounded-lg transition-colors touch-manipulation flex-shrink-0"
          title="Quitar cliente"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Sellos visuales */}
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-6 rounded-md flex items-center justify-center transition-all ${
              i < sellos
                ? 'bg-amber-400 shadow-sm'
                : 'bg-white border border-amber-200'
            }`}
          >
            <Star
              className={`w-3 h-3 ${
                i < sellos ? 'text-white fill-white' : 'text-amber-200'
              }`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-amber-700 font-medium">
          {sellos}/10 sellos
        </p>
        {/* Indicador de próximo sello */}
        {sellos < 10 && !tarjetaCompleta && (
          <p className="text-xs text-amber-600">
            +1 sello con esta compra
          </p>
        )}
      </div>

      {/* Tarjeta completa disponible para canjear */}
      {tarjetaCompleta && (
        <button
          onClick={onCanjear}
          disabled={canjeando}
          className="w-full mt-2 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-600 transition-all touch-manipulation shadow-md disabled:opacity-50"
        >
          <Gift className="w-4 h-4" />
          {canjeando ? 'Canjeando...' : 'Canjear Bebida Gratis'}
        </button>
      )}
    </div>
  );
}
