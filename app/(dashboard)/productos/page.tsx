'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CupSoda, Search, Plus, Pencil, Loader2, X, Check,
  ToggleLeft, ToggleRight, Tag, Layers, Settings2
} from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  categoria_id: number | null;
  descripcion: string | null;
  precio_default: number;
  costo: number;
  codigo_barras: string | null;
  activo: boolean;
}

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

interface Modificador {
  id: number;
  nombre: string;
  grupo: string;
  precio_extra: number;
  activo: boolean;
}

type Tab = 'productos' | 'categorias' | 'modificadores';

export default function ProductosPage() {
  const [tab, setTab] = useState<Tab>('productos');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modificadores, setModificadores] = useState<Modificador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [catFiltro, setCatFiltro] = useState<number | 'todas'>('todas');
  const [showInactivos, setShowInactivos] = useState(false);

  // Modal de edición
  const [editando, setEditando] = useState<Producto | null>(null);
  const [creando, setCreando] = useState(false);
  const [editandoCat, setEditandoCat] = useState<Categoria | null>(null);
  const [creandoCat, setCreandoCat] = useState(false);
  const [editandoMod, setEditandoMod] = useState<Modificador | null>(null);
  const [creandoMod, setCreandoMod] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, modRes] = await Promise.all([
        fetch(`/api/productos?all=${showInactivos}`),
        fetch('/api/categorias'),
        fetch('/api/pos/modificadores?all=true'),
      ]);
      const [prodData, catData, modData] = await Promise.all([
        prodRes.json(), catRes.json(), modRes.json(),
      ]);
      setProductos(prodData.data || []);
      setCategorias(catData.data || []);
      setModificadores(modData.modificadores || []);
    } catch (e) {
      console.error('Error cargando datos:', e);
    } finally {
      setLoading(false);
    }
  }, [showInactivos]);

  useEffect(() => { loadData(); }, [loadData]);

  const catMap = Object.fromEntries(categorias.map(c => [c.id, c.nombre]));

  // Filtrar productos
  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCat = catFiltro === 'todas' || p.categoria_id === catFiltro;
    return matchBusqueda && matchCat;
  });

  // === HANDLERS PRODUCTOS ===
  const handleSaveProducto = async (data: Partial<Producto> & { nombre: string; precio_default: number }) => {
    setSaving(true);
    try {
      const isEdit = !!editando;
      const res = await fetch('/api/productos', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editando!.id, ...data } : data),
      });
      const result = await res.json();
      if (result.success) {
        setEditando(null);
        setCreando(false);
        await loadData();
      } else {
        alert('Error: ' + (result.error || 'Error desconocido'));
      }
    } catch { alert('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleToggleActivo = async (producto: Producto) => {
    try {
      await fetch('/api/productos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: producto.id, activo: !producto.activo }),
      });
      await loadData();
    } catch { alert('Error de conexión'); }
  };

  // === HANDLERS CATEGORÍAS ===
  const handleSaveCategoria = async (data: { nombre: string; descripcion?: string }) => {
    setSaving(true);
    try {
      const isEdit = !!editandoCat;
      const res = await fetch('/api/categorias', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editandoCat!.id, ...data } : data),
      });
      const result = await res.json();
      if (result.success) {
        setEditandoCat(null);
        setCreandoCat(false);
        await loadData();
      } else {
        alert('Error: ' + (result.error || 'Error desconocido'));
      }
    } catch { alert('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleDeleteCategoria = async (id: number) => {
    if (!confirm('¿Eliminar esta categoría? Los productos quedarán sin categoría.')) return;
    try {
      await fetch(`/api/categorias?id=${id}`, { method: 'DELETE' });
      await loadData();
    } catch { alert('Error de conexión'); }
  };

  // === HANDLERS MODIFICADORES ===
  const handleSaveModificador = async (data: { nombre: string; grupo: string; precio_extra: number }) => {
    setSaving(true);
    try {
      const isEdit = !!editandoMod;
      const res = await fetch('/api/pos/modificadores', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editandoMod!.id, ...data } : data),
      });
      const result = await res.json();
      if (result.success) {
        setEditandoMod(null);
        setCreandoMod(false);
        await loadData();
      } else {
        alert('Error: ' + (result.error || 'Error desconocido'));
      }
    } catch { alert('Error de conexión'); }
    finally { setSaving(false); }
  };

  const handleToggleModificador = async (mod: Modificador) => {
    try {
      await fetch('/api/pos/modificadores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: mod.id, activo: !mod.activo }),
      });
      await loadData();
    } catch { alert('Error de conexión'); }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">Gestiona tu catálogo, categorías y modificadores</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { id: 'productos' as Tab, label: 'Productos', icon: CupSoda, count: productos.length },
          { id: 'categorias' as Tab, label: 'Categorías', icon: Layers, count: categorias.length },
          { id: 'modificadores' as Tab, label: 'Modificadores', icon: Settings2, count: modificadores.length },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab === t.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* === TAB PRODUCTOS === */}
      {tab === 'productos' && (
        <>
          {/* Barra de herramientas */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>
            <select
              value={catFiltro === 'todas' ? 'todas' : catFiltro}
              onChange={(e) => setCatFiltro(e.target.value === 'todas' ? 'todas' : parseInt(e.target.value))}
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactivos}
                onChange={(e) => setShowInactivos(e.target.checked)}
                className="rounded"
              />
              Ver inactivos
            </label>
            <button
              onClick={() => { setCreando(true); setEditando(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          </div>

          {/* Tabla de productos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Costo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Margen</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(p => {
                  const margen = p.precio_default > 0
                    ? ((p.precio_default - p.costo) / p.precio_default * 100)
                    : 0;
                  return (
                    <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!p.activo ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CupSoda className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{p.nombre}</p>
                            {p.codigo_barras && <p className="text-xs text-gray-400">{p.codigo_barras}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {p.categoria_id ? catMap[p.categoria_id] || 'Sin categoría' : 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        ${p.precio_default.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        ${p.costo.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          margen >= 60 ? 'bg-green-100 text-green-700'
                            : margen >= 40 ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {margen.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleToggleActivo(p)} title={p.activo ? 'Desactivar' : 'Activar'}>
                          {p.activo
                            ? <ToggleRight className="w-6 h-6 text-green-500 mx-auto" />
                            : <ToggleLeft className="w-6 h-6 text-gray-300 mx-auto" />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setEditando(p); setCreando(false); }}
                          className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-600 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {productosFiltrados.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <CupSoda className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* === TAB CATEGORÍAS === */}
      {tab === 'categorias' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => { setCreandoCat(true); setEditandoCat(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.map(cat => {
              const prodCount = productos.filter(p => p.categoria_id === cat.id).length;
              return (
                <div key={cat.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Layers className="w-4 h-4 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-gray-900">{cat.nombre}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditandoCat(cat); setCreandoCat(false); }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategoria(cat.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {cat.descripcion && <p className="text-sm text-gray-500 mb-2">{cat.descripcion}</p>}
                  <p className="text-xs text-gray-400">{prodCount} producto{prodCount !== 1 ? 's' : ''}</p>
                </div>
              );
            })}
            {categorias.length === 0 && (
              <div className="col-span-full p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No hay categorías. Crea la primera.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* === TAB MODIFICADORES === */}
      {tab === 'modificadores' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => { setCreandoMod(true); setEditandoMod(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Modificador
            </button>
          </div>

          {/* Agrupar por grupo */}
          {Object.entries(
            modificadores.reduce((acc, mod) => {
              (acc[mod.grupo] = acc[mod.grupo] || []).push(mod);
              return acc;
            }, {} as Record<string, Modificador[]>)
          ).map(([grupo, mods]) => (
            <div key={grupo} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-500" />
                  {grupo}
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{mods.length}</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {mods.map(mod => (
                  <div key={mod.id} className={`px-4 py-3 flex items-center justify-between ${!mod.activo ? 'opacity-50' : ''}`}>
                    <div>
                      <p className="font-medium text-gray-900">{mod.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {mod.precio_extra > 0 ? `+$${mod.precio_extra.toFixed(2)}` : 'Sin costo extra'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleModificador(mod)} title={mod.activo ? 'Desactivar' : 'Activar'}>
                        {mod.activo
                          ? <ToggleRight className="w-6 h-6 text-green-500" />
                          : <ToggleLeft className="w-6 h-6 text-gray-300" />
                        }
                      </button>
                      <button
                        onClick={() => { setEditandoMod(mod); setCreandoMod(false); }}
                        className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {modificadores.length === 0 && (
            <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
              <Settings2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No hay modificadores. Crea el primero.</p>
              <p className="text-xs mt-1">Ej: Tamaño (Chico, Mediano, Grande), Toppings (Perlas, Jelly)</p>
            </div>
          )}
        </>
      )}

      {/* === MODAL PRODUCTO === */}
      {(creando || editando) && (
        <ProductoForm
          producto={editando}
          categorias={categorias}
          saving={saving}
          onSave={handleSaveProducto}
          onClose={() => { setCreando(false); setEditando(null); }}
        />
      )}

      {/* === MODAL CATEGORÍA === */}
      {(creandoCat || editandoCat) && (
        <CategoriaForm
          categoria={editandoCat}
          saving={saving}
          onSave={handleSaveCategoria}
          onClose={() => { setCreandoCat(false); setEditandoCat(null); }}
        />
      )}

      {/* === MODAL MODIFICADOR === */}
      {(creandoMod || editandoMod) && (
        <ModificadorForm
          modificador={editandoMod}
          grupos={[...new Set(modificadores.map(m => m.grupo))]}
          saving={saving}
          onSave={handleSaveModificador}
          onClose={() => { setCreandoMod(false); setEditandoMod(null); }}
        />
      )}
    </div>
  );
}

// === FORMULARIO PRODUCTO ===
function ProductoForm({
  producto, categorias, saving, onSave, onClose,
}: {
  producto: Producto | null;
  categorias: Categoria[];
  saving: boolean;
  onSave: (data: Partial<Producto> & { nombre: string; precio_default: number }) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(producto?.nombre || '');
  const [categoriaId, setCategoriaId] = useState<string>(producto?.categoria_id?.toString() || '');
  const [precio, setPrecio] = useState(producto?.precio_default?.toString() || '');
  const [costo, setCosto] = useState(producto?.costo?.toString() || '0');
  const [codigoBarras, setCodigoBarras] = useState(producto?.codigo_barras || '');
  const [descripcion, setDescripcion] = useState(producto?.descripcion || '');

  const handleSubmit = () => {
    if (!nombre.trim() || !precio) return;
    onSave({
      nombre,
      categoria_id: categoriaId ? parseInt(categoriaId) : null,
      precio_default: parseFloat(precio),
      costo: parseFloat(costo || '0'),
      codigo_barras: codigoBarras || null,
      descripcion: descripcion || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Nombre *</label>
            <input
              type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Taro Milk Tea" autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Categoría</label>
            <select
              value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Sin categoría</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Precio *</label>
              <input
                type="number" inputMode="decimal" value={precio} onChange={e => setPrecio(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Costo</label>
              <input
                type="number" inputMode="decimal" value={costo} onChange={e => setCosto(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Código de barras</label>
            <input
              type="text" value={codigoBarras} onChange={e => setCodigoBarras(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Descripción</label>
            <textarea
              value={descripcion} onChange={e => setDescripcion(e.target.value)}
              placeholder="Opcional" rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Preview margen */}
          {parseFloat(precio) > 0 && parseFloat(costo) > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ganancia:</span>
                <span className="font-bold text-green-600">${(parseFloat(precio) - parseFloat(costo)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Margen:</span>
                <span className="font-bold">{((parseFloat(precio) - parseFloat(costo)) / parseFloat(precio) * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit} disabled={saving || !nombre.trim() || !precio}
            className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {producto ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

// === FORMULARIO CATEGORÍA ===
function CategoriaForm({
  categoria, saving, onSave, onClose,
}: {
  categoria: Categoria | null;
  saving: boolean;
  onSave: (data: { nombre: string; descripcion?: string }) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(categoria?.nombre || '');
  const [descripcion, setDescripcion] = useState(categoria?.descripcion || '');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Nombre *</label>
            <input
              type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Milk Teas" autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Descripción</label>
            <input
              type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => { if (nombre.trim()) onSave({ nombre, descripcion }); }}
            disabled={saving || !nombre.trim()}
            className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {categoria ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}

// === FORMULARIO MODIFICADOR ===
function ModificadorForm({
  modificador, grupos, saving, onSave, onClose,
}: {
  modificador: Modificador | null;
  grupos: string[];
  saving: boolean;
  onSave: (data: { nombre: string; grupo: string; precio_extra: number }) => void;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState(modificador?.nombre || '');
  const [grupo, setGrupo] = useState(modificador?.grupo || '');
  const [nuevoGrupo, setNuevoGrupo] = useState('');
  const [precioExtra, setPrecioExtra] = useState(modificador?.precio_extra?.toString() || '0');
  const [modoGrupo, setModoGrupo] = useState<'existente' | 'nuevo'>(grupos.length > 0 ? 'existente' : 'nuevo');

  const grupoFinal = modoGrupo === 'nuevo' ? nuevoGrupo : grupo;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">
            {modificador ? 'Editar Modificador' : 'Nuevo Modificador'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Nombre *</label>
            <input
              type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Grande, Perlas de tapioca" autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Grupo *</label>
            {grupos.length > 0 && (
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setModoGrupo('existente')}
                  className={`text-xs px-3 py-1 rounded-lg ${modoGrupo === 'existente' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
                >Grupo existente</button>
                <button
                  onClick={() => setModoGrupo('nuevo')}
                  className={`text-xs px-3 py-1 rounded-lg ${modoGrupo === 'nuevo' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}
                >Nuevo grupo</button>
              </div>
            )}
            {modoGrupo === 'existente' && grupos.length > 0 ? (
              <select
                value={grupo} onChange={e => setGrupo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccionar grupo</option>
                {grupos.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            ) : (
              <input
                type="text" value={nuevoGrupo} onChange={e => setNuevoGrupo(e.target.value)}
                placeholder="Ej: Tamaño, Toppings, Nivel de dulce"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Precio extra</label>
            <input
              type="number" inputMode="decimal" value={precioExtra} onChange={e => setPrecioExtra(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-400 mt-1">$0 si no tiene costo adicional</p>
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => { if (nombre.trim() && grupoFinal.trim()) onSave({ nombre, grupo: grupoFinal, precio_extra: parseFloat(precioExtra || '0') }); }}
            disabled={saving || !nombre.trim() || !grupoFinal.trim()}
            className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {modificador ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
}
