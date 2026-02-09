'use client';

import { useState, useEffect, useMemo } from 'react';
import { CupSoda, Search, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useLoyverseItems, transformLoyverseItem } from '@/lib/loyverseData';
import { CATEGORIAS } from '@/lib/dataParser';

export default function ProductosPage() {
  const { items: rawItems, loading, error } = useLoyverseItems();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('TODAS');
  const [sortBy, setSortBy] = useState<'nombre' | 'precio' | 'margen'>('nombre');

  // Transformar items de Loyverse a formato del dashboard
  const productos = useMemo(() => {
    return rawItems.map(transformLoyverseItem);
  }, [rawItems]);

  const filteredProducts = productos
    .filter(p => {
      const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategoria = selectedCategoria === 'TODAS' || p.categoria === selectedCategoria;
      return matchesSearch && matchesCategoria;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'precio':
          return b.precio - a.precio;
        case 'margen':
          return ((b.precio - b.coste) / b.precio) - ((a.precio - a.coste) / a.precio);
        default:
          return 0;
      }
    });

  const calcularMargen = (precio: number, coste: number) => {
    if (precio === 0) return 0;
    return ((precio - coste) / precio) * 100;
  };

  const totalProductos = productos.length;
  const margenPromedio = productos.length > 0 
    ? productos.reduce((sum, p) => sum + calcularMargen(p.precio, p.coste), 0) / totalProductos 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos de Loyverse...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800 font-semibold">Error al cargar productos:</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">Catálogo completo de Loyverse • {totalProductos} productos</p>
        </div>
        <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
          <span className="text-green-700 font-semibold">✓ Conectado a Loyverse</span>
        </div>
      </div>

      {/* Stats Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Total Productos</p>
          <p className="text-2xl font-bold text-purple-600">{totalProductos}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Precio Promedio</p>
          <p className="text-2xl font-bold text-blue-600">
            ${productos.length > 0 ? (productos.reduce((sum, p) => sum + p.precio, 0) / totalProductos).toFixed(2) : '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Margen Promedio</p>
          <p className="text-2xl font-bold text-green-600">{margenPromedio.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-600 mb-1">Categorías</p>
          <p className="text-2xl font-bold text-orange-600">
            {new Set(productos.map(p => p.categoria)).size}
          </p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Ordenar */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="nombre">Nombre A-Z</option>
            <option value="precio">Precio mayor</option>
            <option value="margen">Mayor margen</option>
          </select>
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((producto) => {
          const margen = calcularMargen(producto.precio, producto.coste);
          const ganancia = producto.precio - producto.coste;

          return (
            <div key={producto.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Imagen del producto */}
              <div className="h-40 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center relative">
                {producto.imageUrl ? (
                  <img src={producto.imageUrl} alt={producto.nombre} className="w-full h-full object-cover" />
                ) : (
                  <CupSoda className="w-16 h-16 text-white opacity-80" />
                )}
                {producto.form && (
                  <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium">
                    {producto.form}
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 truncate">{producto.nombre}</h3>
                <p className="text-xs text-gray-500 mb-3">{producto.categoria}</p>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Precio:</span>
                    <span className="font-bold text-purple-600">${producto.precio}</span>
                  </div>

                  {producto.coste > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Costo:</span>
                        <span className="font-semibold text-gray-700">${producto.coste}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Ganancia:</span>
                        <span className="font-semibold text-green-600">${ganancia.toFixed(2)}</span>
                      </div>

                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Margen:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            margen >= 60 ? 'bg-green-100 text-green-700' : 
                            margen >= 40 ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {margen.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {producto.sku && (
                    <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                      SKU: {producto.sku}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <CupSoda className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No se encontraron productos</p>
          <p className="text-gray-500 text-sm mt-1">Intenta con otro término de búsqueda</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <div className="text-blue-600 mt-0.5">ℹ️</div>
          <div>
            <p className="text-sm text-blue-900 font-medium">Datos en tiempo real de Loyverse</p>
            <p className="text-sm text-blue-800 mt-1">
              Los productos se sincronizan automáticamente. Para actualizar, recarga la página.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
