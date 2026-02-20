'use client';

import { useState, useMemo } from 'react';
import { X, Plus, ChevronRight, Cookie, Cherry } from 'lucide-react';
import type { Producto, Categoria } from '@/lib/supabase';

interface UpsellModalProps {
  productos: Producto[];
  categorias: Categoria[];
  onAddProduct: (producto: Producto) => void;
  onSkip: () => void;
  onClose: () => void;
}

// Categorías que se consideran "extras" para el upsell
const UPSELL_KEYWORDS = ['topping', 'extra', 'botana', 'snack', 'complemento', 'adicional'];

export function UpsellModal({ productos, categorias, onAddProduct, onSkip, onClose }: UpsellModalProps) {
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  // Encontrar categorías de toppings/snacks/extras
  const upsellCategorias = useMemo(() => {
    return categorias.filter(c =>
      UPSELL_KEYWORDS.some(kw => c.nombre.toLowerCase().includes(kw))
    );
  }, [categorias]);

  const upsellCatIds = useMemo(() => new Set(upsellCategorias.map(c => c.id)), [upsellCategorias]);

  // Productos de esas categorías
  const upsellProductos = useMemo(() => {
    return productos.filter(p => p.activo && p.categoria_id && upsellCatIds.has(p.categoria_id));
  }, [productos, upsellCatIds]);

  // Agrupar por categoría
  const grouped = useMemo(() => {
    const groups: { categoria: string; items: Producto[] }[] = [];
    for (const cat of upsellCategorias) {
      const items = upsellProductos.filter(p => p.categoria_id === cat.id);
      if (items.length > 0) {
        groups.push({ categoria: cat.nombre, items });
      }
    }
    return groups;
  }, [upsellCategorias, upsellProductos]);

  const handleAdd = (producto: Producto) => {
    onAddProduct(producto);
    setAddedIds(prev => new Set(prev).add(producto.id));
  };

  const totalAdded = addedIds.size;

  // Si no hay productos de upsell, skip automáticamente
  if (upsellProductos.length === 0) {
    // Llamar skip en el siguiente tick para evitar update durante render
    setTimeout(onSkip, 0);
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Cookie className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">¿Algo más?</h3>
                <p className="text-amber-100 text-sm">Agrega toppings o snacks</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg touch-manipulation">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Productos */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {grouped.map(({ categoria, items }) => (
            <div key={categoria}>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Cherry className="w-4 h-4" />
                {categoria}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {items.map(producto => {
                  const isAdded = addedIds.has(producto.id);
                  return (
                    <button
                      key={producto.id}
                      onClick={() => handleAdd(producto)}
                      className={`p-3 rounded-xl border-2 text-left transition-all touch-manipulation ${
                        isAdded
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${isAdded ? 'text-green-700' : 'text-gray-900'}`}>
                            {producto.nombre}
                          </p>
                          <p className={`text-sm font-bold ${isAdded ? 'text-green-600' : 'text-amber-600'}`}>
                            +${producto.precio_default.toFixed(2)}
                          </p>
                        </div>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ml-2 ${
                          isAdded ? 'bg-green-500' : 'bg-amber-100'
                        }`}>
                          <Plus className={`w-4 h-4 ${isAdded ? 'text-white' : 'text-amber-600'}`} />
                        </div>
                      </div>
                      {isAdded && (
                        <p className="text-xs text-green-600 mt-1 font-medium">Agregado - toca para agregar otro</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          {totalAdded > 0 && (
            <p className="text-center text-sm text-green-600 font-medium mb-3">
              {totalAdded} producto{totalAdded > 1 ? 's' : ''} agregado{totalAdded > 1 ? 's' : ''}
            </p>
          )}
          <button
            onClick={onSkip}
            className="w-full py-4 font-bold text-lg rounded-xl transition-all touch-manipulation bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
          >
            {totalAdded > 0 ? 'Continuar al pago' : 'No, gracias → Cobrar'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
