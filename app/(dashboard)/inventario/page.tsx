'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package, Loader2, AlertTriangle, Search,
  Plus, Edit3, X, Store, ArrowUpDown,
} from 'lucide-react';

interface InventarioItem {
  id: number;
  producto_id: number;
  sucursal_id: number;
  cantidad: number;
  precio_sucursal: number | null;
  stock_minimo: number;
  disponible_venta: boolean;
  updated_at: string;
  producto_nombre: string;
  producto_precio: number;
  producto_activo: boolean;
  sucursal_nombre: string;
  alerta_stock: boolean;
}

interface Sucursal {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  precio_default: number;
}

export default function InventarioPage() {
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sucursalFiltro, setSucursalFiltro] = useState('todas');
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [showAjuste, setShowAjuste] = useState<InventarioItem | null>(null);
  const [showAgregar, setShowAgregar] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sucursalFiltro !== 'todas') params.set('sucursal_id', sucursalFiltro);
      if (soloAlertas) params.set('alertas', 'true');

      const [invRes, sucRes, prodRes] = await Promise.all([
        fetch(`/api/inventario?${params}`),
        fetch('/api/sucursales'),
        fetch('/api/productos?all=true'),
      ]);

      const [invData, sucData, prodData] = await Promise.all([
        invRes.json(), sucRes.json(), prodRes.json(),
      ]);

      setInventario(invData.inventario || []);
      setSucursales(sucData.data || []);
      setProductos(prodData.data || []);
    } catch (e) {
      console.error('Error cargando inventario:', e);
    } finally {
      setLoading(false);
    }
  }, [sucursalFiltro, soloAlertas]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtrado = useMemo(() => {
    if (!busqueda.trim()) return inventario;
    const q = busqueda.toLowerCase();
    return inventario.filter(i =>
      i.producto_nombre.toLowerCase().includes(q) ||
      i.sucursal_nombre.toLowerCase().includes(q)
    );
  }, [inventario, busqueda]);

  const alertasCount = useMemo(() =>
    inventario.filter(i => i.alerta_stock).length,
    [inventario]
  );

  const handleAjusteGuardado = useCallback(() => {
    setShowAjuste(null);
    loadData();
  }, [loadData]);

  const handleAgregado = useCallback(() => {
    setShowAgregar(false);
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Stock por producto y sucursal</p>
        </div>
        <button
          onClick={() => setShowAgregar(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Agregar Stock
        </button>
      </div>

      {/* Alerta de bajo stock */}
      {alertasCount > 0 && !soloAlertas && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">
              {alertasCount} producto{alertasCount !== 1 ? 's' : ''} con stock bajo
            </p>
            <p className="text-sm text-amber-600">Productos por debajo del mínimo configurado</p>
          </div>
          <button
            onClick={() => setSoloAlertas(true)}
            className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded-lg text-sm font-medium transition-colors"
          >
            Ver alertas
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={sucursalFiltro}
          onChange={e => setSucursalFiltro(e.target.value)}
          className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
        >
          <option value="todas">Todas las sucursales</option>
          {sucursales.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloAlertas}
            onChange={e => setSoloAlertas(e.target.checked)}
            className="rounded text-amber-500"
          />
          Solo alertas ({alertasCount})
        </label>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">
            Stock ({filtrado.length} registros)
          </h3>
        </div>

        {filtrado.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {soloAlertas ? 'No hay alertas de stock' : 'No hay registros de inventario'}
            </p>
            {!soloAlertas && (
              <button
                onClick={() => setShowAgregar(true)}
                className="mt-3 text-purple-600 font-medium text-sm hover:underline"
              >
                Agregar primer registro
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sucursal</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Mínimo</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ajustar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrado.map(item => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${item.alerta_stock ? 'bg-amber-50/50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{item.producto_nombre}</p>
                      {item.precio_sucursal && (
                        <p className="text-xs text-gray-500">
                          Precio sucursal: ${item.precio_sucursal.toFixed(2)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.sucursal_nombre}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${
                        item.alerta_stock ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.cantidad % 1 === 0 ? item.cantidad : item.cantidad.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {item.stock_minimo % 1 === 0 ? item.stock_minimo : item.stock_minimo.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.alerta_stock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Bajo
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setShowAjuste(item)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ajustar stock"
                      >
                        <ArrowUpDown className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Ajustar stock */}
      {showAjuste && (
        <AjusteModal
          item={showAjuste}
          onDone={handleAjusteGuardado}
          onClose={() => setShowAjuste(null)}
        />
      )}

      {/* Modal: Agregar stock */}
      {showAgregar && (
        <AgregarStockModal
          productos={productos}
          sucursales={sucursales}
          onDone={handleAgregado}
          onClose={() => setShowAgregar(false)}
        />
      )}
    </div>
  );
}

// --- Modal de ajuste de stock ---
function AjusteModal({
  item,
  onDone,
  onClose,
}: {
  item: InventarioItem;
  onDone: () => void;
  onClose: () => void;
}) {
  const [cantidad, setCantidad] = useState(item.cantidad.toString());
  const [stockMinimo, setStockMinimo] = useState(item.stock_minimo.toString());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/inventario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          cantidad: parseFloat(cantidad) || 0,
          stock_minimo: parseFloat(stockMinimo) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) onDone();
      else alert(data.error);
    } catch {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 bg-gradient-to-br from-orange-500 to-amber-500 text-white text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
          <ArrowUpDown className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-bold">Ajustar Stock</h3>
          <p className="text-orange-100 text-sm mt-0.5">{item.producto_nombre}</p>
          <p className="text-orange-200 text-xs">{item.sucursal_nombre}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad actual</label>
            <input
              type="number"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              step="0.1"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-bold text-center"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo (alerta)</label>
            <input
              type="number"
              value={stockMinimo}
              onChange={e => setStockMinimo(e.target.value)}
              step="0.1"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Modal: Agregar stock para un producto ---
function AgregarStockModal({
  productos,
  sucursales,
  onDone,
  onClose,
}: {
  productos: Producto[];
  sucursales: Sucursal[];
  onDone: () => void;
  onClose: () => void;
}) {
  const [productoId, setProductoId] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [cantidad, setCantidad] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId || !sucursalId) {
      setError('Selecciona producto y sucursal');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: parseInt(productoId),
          sucursal_id: parseInt(sucursalId),
          cantidad: parseFloat(cantidad) || 0,
          stock_minimo: parseFloat(stockMinimo) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) onDone();
      else setError(data.error);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 bg-gradient-to-br from-purple-600 to-pink-500 text-white text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
          <Package className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-bold">Agregar Stock</h3>
          <p className="text-purple-200 text-sm">Registrar inventario de un producto</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
            <select
              value={productoId}
              onChange={e => setProductoId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Seleccionar producto</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} (${p.precio_default.toFixed(2)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={sucursalId}
                onChange={e => setSucursalId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Seleccionar sucursal</option>
                {sucursales.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
              <input
                type="number"
                value={stockMinimo}
                onChange={e => setStockMinimo(e.target.value)}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
