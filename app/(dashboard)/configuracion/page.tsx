'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Store, Save, Loader2, CupSoda,
  Percent, Receipt, MapPin, Phone, Clock,
  AlertTriangle, Check, RefreshCw,
} from 'lucide-react';

interface ConfigNegocio {
  nombre: string;
  slogan: string;
  telefono: string;
  email: string;
  iva: number;
  moneda: string;
  zona_horaria: string;
}

interface SucursalConfig {
  id: number;
  nombre: string;
  codigo: string;
  direccion: string;
  activa: boolean;
}

const CONFIG_KEY = 'fubba_config';

function loadConfig(): ConfigNegocio {
  if (typeof window === 'undefined') {
    return {
      nombre: 'Fubba Bubba',
      slogan: 'Bubble Tea & Más',
      telefono: '',
      email: '',
      iva: 16,
      moneda: 'MXN',
      zona_horaria: 'America/Mexico_City',
    };
  }
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    nombre: 'Fubba Bubba',
    slogan: 'Bubble Tea & Más',
    telefono: '',
    email: '',
    iva: 16,
    moneda: 'MXN',
    zona_horaria: 'America/Mexico_City',
  };
}

function persistConfig(config: ConfigNegocio) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfigNegocio>(loadConfig);
  const [sucursales, setSucursales] = useState<SucursalConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<SucursalConfig | null>(null);
  const [savingSucursal, setSavingSucursal] = useState(false);

  // Cargar sucursales
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/sucursales');
        const data = await res.json();
        setSucursales(data.data || []);
      } catch (e) {
        console.error('Error cargando sucursales:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSaveConfig = useCallback(() => {
    setSaving(true);
    persistConfig(config);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  }, [config]);

  const handleUpdateSucursal = useCallback(async () => {
    if (!editingSucursal) return;
    setSavingSucursal(true);
    try {
      const res = await fetch('/api/sucursales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSucursal),
      });
      const data = await res.json();
      if (data.success || data.data) {
        setSucursales(prev => prev.map(s => s.id === editingSucursal.id ? editingSucursal : s));
        setEditingSucursal(null);
      } else {
        alert('Error: ' + (data.error || 'No se pudo guardar'));
      }
    } catch (e) {
      console.error('Error actualizando sucursal:', e);
      alert('Error de conexión');
    } finally {
      setSavingSucursal(false);
    }
  }, [editingSucursal]);

  // Cache stats
  const [cacheInfo, setCacheInfo] = useState<string>('');
  useEffect(() => {
    if ('caches' in window) {
      caches.keys().then(keys => {
        setCacheInfo(`${keys.length} cache(s) activo(s)`);
      });
    }
  }, []);

  const handleClearCache = useCallback(async () => {
    if (!confirm('Limpiar cache? Esto borrará datos temporales guardados.')) return;
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      localStorage.removeItem('fubba_offline_orders');
      setCacheInfo('Cache limpiado');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      console.error('Error limpiando cache:', e);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 rounded-xl">
          <Settings className="w-7 h-7 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500">Ajustes del negocio y sucursales</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Datos del Negocio */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CupSoda className="w-5 h-5 text-purple-600" />
            Datos del Negocio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre del Negocio</label>
              <input
                type="text"
                value={config.nombre}
                onChange={(e) => setConfig(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Slogan</label>
              <input
                type="text"
                value={config.slogan}
                onChange={(e) => setConfig(prev => ({ ...prev, slogan: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                Teléfono
              </label>
              <input
                type="tel"
                value={config.telefono}
                onChange={(e) => setConfig(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="+52 444 123 4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contacto@fubbabubba.mx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Impuestos y Moneda */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-purple-600" />
            Impuestos y Moneda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">IVA (%)</label>
              <input
                type="number"
                value={config.iva}
                onChange={(e) => setConfig(prev => ({ ...prev, iva: parseFloat(e.target.value) || 0 }))}
                min={0}
                max={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">Se aplica automáticamente en el POS</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Moneda</label>
              <select
                value={config.moneda}
                onChange={(e) => setConfig(prev => ({ ...prev, moneda: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="MXN">MXN (Peso Mexicano)</option>
                <option value="USD">USD (Dólar)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Zona Horaria
              </label>
              <select
                value={config.zona_horaria}
                onChange={(e) => setConfig(prev => ({ ...prev, zona_horaria: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="America/Mexico_City">Centro (CDMX, SLP)</option>
                <option value="America/Monterrey">Monterrey</option>
                <option value="America/Tijuana">Pacífico (Tijuana)</option>
                <option value="America/Cancun">Sureste (Cancún)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>

        {/* Sucursales */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-purple-600" />
            Sucursales ({sucursales.length})
          </h2>
          <div className="space-y-3">
            {sucursales.map((suc) => (
              <div
                key={suc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${suc.activa ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-medium text-gray-900">{suc.nombre}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {suc.direccion || 'Sin dirección'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400 bg-gray-200 px-2 py-0.5 rounded">{suc.codigo}</span>
                  <button
                    onClick={() => setEditingSucursal({ ...suc })}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium px-2 py-1 hover:bg-purple-50 rounded transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            Configuración de Tickets
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Formato de impresión</span>
              <span className="text-sm font-medium text-gray-900">58mm (Ticket térmico)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Compartir por WhatsApp</span>
              <span className="text-sm font-medium text-gray-900">Texto formateado</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Datos incluidos</span>
              <span className="text-sm font-medium text-gray-900 text-right">Logo, Sucursal, Dirección, Fecha, Productos, IVA, Total, Pago, Folio</span>
            </div>
          </div>
        </div>

        {/* PWA / Cache */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
            App y Cache
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-700">Service Worker</span>
                <p className="text-xs text-gray-400">Permite uso offline del POS</p>
              </div>
              <span className="text-sm font-medium text-green-600">Activo</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-700">Cache local</span>
                <p className="text-xs text-gray-400">{cacheInfo || 'No disponible'}</p>
              </div>
              <button
                onClick={handleClearCache}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                Limpiar Cache
              </button>
            </div>
          </div>
        </div>

        {/* Zona de peligro */}
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zona de Peligro
          </h2>
          <p className="text-sm text-red-600 mb-4">
            Estas acciones son permanentes. Úsalas con precaución.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => alert('Para eliminar datos, contacta al administrador de Supabase')}
              className="text-xs text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
            >
              Purgar Datos de Prueba
            </button>
          </div>
        </div>
      </div>

      {/* Modal editar sucursal */}
      {editingSucursal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Sucursal</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={editingSucursal.nombre}
                  onChange={(e) => setEditingSucursal(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Código</label>
                <input
                  type="text"
                  value={editingSucursal.codigo}
                  onChange={(e) => setEditingSucursal(prev => prev ? { ...prev, codigo: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Dirección
                </label>
                <input
                  type="text"
                  value={editingSucursal.direccion || ''}
                  onChange={(e) => setEditingSucursal(prev => prev ? { ...prev, direccion: e.target.value } : null)}
                  placeholder="Ej: Av. Carranza #123, Centro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingSucursal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateSucursal}
                disabled={savingSucursal}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {savingSucursal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
