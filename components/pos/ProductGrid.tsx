'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ProductButton } from './ProductButton';
import { CategoryTabs } from './CategoryTabs';
import type { Producto, Categoria } from '@/lib/supabase';

interface ProductGridProps {
  productos: Producto[];
  categorias: Categoria[];
  onProductClick: (producto: Producto) => void;
  precioEstandar?: number;
}

export function ProductGrid({ productos, categorias, onProductClick, precioEstandar }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('TODAS');

  const categoriaNombres = useMemo(() =>
    categorias.map(c => c.nombre),
    [categorias]
  );

  const categoriaMap = useMemo(() => {
    const map: Record<number, string> = {};
    categorias.forEach(c => { map[c.id] = c.nombre; });
    return map;
  }, [categorias]);

  const filteredProducts = useMemo(() => {
    return productos.filter(p => {
      const matchesSearch = !searchTerm ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategoria = selectedCategoria === 'TODAS' ||
        categoriaMap[p.categoria_id || 0] === selectedCategoria;
      return matchesSearch && matchesCategoria;
    });
  }, [productos, searchTerm, selectedCategoria, categoriaMap]);

  return (
    <div className="flex flex-col h-full">
      {/* Búsqueda */}
      <div className="relative mb-3">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-base"
        />
      </div>

      {/* Categorías */}
      <CategoryTabs
        categorias={categoriaNombres}
        selected={selectedCategoria}
        onSelect={setSelectedCategoria}
      />

      {/* Grid de Productos */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((producto) => (
            <ProductButton
              key={producto.id}
              producto={producto}
              onClick={onProductClick}
              precioDisplay={producto.precio_default === 0 ? precioEstandar : undefined}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No se encontraron productos</p>
            <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
}
