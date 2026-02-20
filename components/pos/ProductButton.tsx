'use client';

import { CupSoda } from 'lucide-react';
import type { Producto } from '@/lib/supabase';

interface ProductButtonProps {
  producto: Producto;
  onClick: (producto: Producto) => void;
  precioDisplay?: number;
}

export function ProductButton({ producto, onClick, precioDisplay }: ProductButtonProps) {
  return (
    <button
      onClick={() => onClick(producto)}
      className="
        bg-white rounded-xl p-4 shadow-sm border border-gray-200
        hover:shadow-md hover:border-purple-300 active:scale-95
        transition-all flex flex-col items-center justify-center
        min-h-[100px] touch-manipulation select-none
      "
    >
      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-2">
        <CupSoda className="w-6 h-6 text-white" />
      </div>
      <p className="text-sm font-semibold text-gray-900 text-center leading-tight line-clamp-2">
        {producto.nombre}
      </p>
      <p className="text-sm font-bold text-purple-600 mt-1">
        ${(precioDisplay ?? producto.precio_default).toFixed(2)}
      </p>
    </button>
  );
}
