'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem as CartItemType } from '@/lib/supabase';

interface CartItemProps {
  item: CartItemType;
  index: number;
  onUpdateQuantity: (index: number, cantidad: number) => void;
  onRemove: (index: number) => void;
}

// Palabras clave para identificar el modificador de tamaño
const SIZE_KEYWORDS = ['estándar', 'estandar', 'mini', 'grande', 'chico'];

export function CartItemRow({ item, index, onUpdateQuantity, onRemove }: CartItemProps) {
  // Separar modificador de tamaño de los extras
  const sizeMod = item.modificadores.find(m =>
    SIZE_KEYWORDS.some(kw => m.nombre.toLowerCase().includes(kw))
  );
  const extras = item.modificadores.filter(m => m !== sizeMod);
  const precioUnitarioTotal = item.precio_unitario + item.modificadores.reduce((s, m) => s + m.precio, 0);

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-100">
      {/* Línea principal: nombre + tamaño + precio del tamaño */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {item.nombre}
            {sizeMod && (
              <span className="text-purple-600 font-medium"> · {sizeMod.nombre}</span>
            )}
          </p>
        </div>
        {sizeMod ? (
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            ${sizeMod.precio.toFixed(2)}
          </span>
        ) : (
          <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
            ${item.subtotal.toFixed(2)}
          </span>
        )}
      </div>

      {/* Extras desglosados */}
      {extras.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {extras.map((mod, i) => (
            <div key={i} className="flex justify-between pl-2">
              <span className="text-xs text-gray-500">+ {mod.nombre}</span>
              <span className="text-xs text-gray-500">
                {mod.precio > 0 ? `+$${mod.precio.toFixed(2)}` : 'incluido'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Total por unidad si hay extras */}
      {extras.length > 0 && (
        <div className="flex justify-between mt-1 pt-1 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            {item.cantidad > 1 ? `$${precioUnitarioTotal.toFixed(2)} × ${item.cantidad}` : ''}
          </span>
          <span className="text-sm font-bold text-gray-900">
            ${item.subtotal.toFixed(2)}
          </span>
        </div>
      )}

      {/* Sin extras: mostrar cantidad × precio si qty > 1 */}
      {extras.length === 0 && item.cantidad > 1 && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">
            ${precioUnitarioTotal.toFixed(2)} × {item.cantidad}
          </span>
          <span className="text-sm font-bold text-gray-900">
            ${item.subtotal.toFixed(2)}
          </span>
        </div>
      )}

      {/* Controles de cantidad */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(index, item.cantidad - 1)}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors touch-manipulation"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-bold text-sm">{item.cantidad}</span>
          <button
            onClick={() => onUpdateQuantity(index, item.cantidad + 1)}
            className="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 flex items-center justify-center transition-colors touch-manipulation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors touch-manipulation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
