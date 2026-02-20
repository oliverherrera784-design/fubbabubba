'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Monitor, Wifi, WifiOff, Volume2, VolumeX, ChefHat, Clock, CheckCircle2 } from 'lucide-react';
import { OrderCard } from '@/components/kds/OrderCard';
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

interface Sucursal {
  id: number;
  nombre: string;
}

const POLL_INTERVAL = 5000; // 5 segundos

export default function KDSPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [ordenes, setOrdenes] = useState<KDSOrden[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [sonido, setSonido] = useState(true);
  const [ahora, setAhora] = useState(Date.now());
  const prevCountRef = useRef(0);

  // Timer que se actualiza cada segundo para los contadores
  useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar sucursales al iniciar
  useEffect(() => {
    async function loadSucursales() {
      try {
        const res = await fetch('/api/sucursales');
        const data = await res.json();
        const sucs = data.sucursales || data || [];
        setSucursales(sucs);
        if (sucs.length > 0 && !sucursalId) {
          setSucursalId(sucs[0].id);
        }
      } catch {
        console.error('Error cargando sucursales');
      }
    }
    loadSucursales();
  }, []);

  // Polling de órdenes
  const fetchOrdenes = useCallback(async () => {
    if (!sucursalId) return;
    try {
      const res = await fetch(`/api/pos/ordenes/kds?sucursal_id=${sucursalId}`);
      const data = await res.json();
      const nuevas: KDSOrden[] = data.ordenes || [];

      // Detectar nuevas órdenes para sonido
      const pendientes = nuevas.filter(o => o.estado_preparacion === 'pendiente');
      if (pendientes.length > prevCountRef.current && sonido && prevCountRef.current > 0) {
        playBeep();
      }
      prevCountRef.current = pendientes.length;

      setOrdenes(nuevas);
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, [sucursalId, sonido]);

  useEffect(() => {
    fetchOrdenes();
    const interval = setInterval(fetchOrdenes, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrdenes]);

  const handleUpdateEstado = async (ordenId: string, estado: EstadoPreparacion) => {
    try {
      const res = await fetch(`/api/pos/ordenes/${ordenId}/preparacion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado_preparacion: estado }),
      });
      if (!res.ok) throw new Error('Error actualizando');
      // Actualizar localmente para UI instantánea
      setOrdenes(prev =>
        estado === 'entregado'
          ? prev.filter(o => o.id !== ordenId)
          : prev.map(o => o.id === ordenId ? { ...o, estado_preparacion: estado } : o)
      );
    } catch (e) {
      console.error('Error actualizando estado:', e);
    }
  };

  const pendientes = ordenes.filter(o => o.estado_preparacion === 'pendiente');
  const enPreparacion = ordenes.filter(o => o.estado_preparacion === 'en_preparacion');
  const listas = ordenes.filter(o => o.estado_preparacion === 'listo');

  const sucursalNombre = sucursales.find(s => s.id === sucursalId)?.nombre || '';

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Monitor className="w-6 h-6 text-purple-400" />
          <h1 className="text-lg font-bold">KDS Cocina</h1>
          <select
            value={sucursalId || ''}
            onChange={(e) => { setSucursalId(parseInt(e.target.value)); setLoading(true); }}
            className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {sucursales.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          {/* Contadores */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-lg font-bold">
              <Clock className="w-4 h-4" />
              {pendientes.length}
            </span>
            <span className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg font-bold">
              <ChefHat className="w-4 h-4" />
              {enPreparacion.length}
            </span>
            <span className="flex items-center gap-1.5 bg-green-500/20 text-green-400 px-2.5 py-1 rounded-lg font-bold">
              <CheckCircle2 className="w-4 h-4" />
              {listas.length}
            </span>
          </div>

          {/* Sonido toggle */}
          <button
            onClick={() => setSonido(!sonido)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors touch-manipulation"
          >
            {sonido ? <Volume2 className="w-5 h-5 text-green-400" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
          </button>

          {/* Estado conexión */}
          <div className={`flex items-center gap-1.5 text-xs font-medium ${online ? 'text-green-400' : 'text-red-400'}`}>
            {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {online ? 'Conectado' : 'Sin conexión'}
          </div>

          {/* Hora */}
          <span className="text-gray-400 text-sm font-mono">
            {new Date(ahora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </header>

      {/* Columnas */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ChefHat className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
            <p className="text-gray-400 mt-3">Cargando órdenes...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-3 p-3 overflow-hidden">
          {/* Pendientes */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                Pendientes ({pendientes.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {pendientes.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Sin órdenes pendientes</p>
                </div>
              ) : (
                pendientes.map(orden => (
                  <OrderCard key={orden.id} orden={orden} onUpdateEstado={handleUpdateEstado} ahora={ahora} />
                ))
              )}
            </div>
          </div>

          {/* En Preparación */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                En Preparación ({enPreparacion.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {enPreparacion.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <ChefHat className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Nada en preparación</p>
                </div>
              ) : (
                enPreparacion.map(orden => (
                  <OrderCard key={orden.id} orden={orden} onUpdateEstado={handleUpdateEstado} ahora={ahora} />
                ))
              )}
            </div>
          </div>

          {/* Listas */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <h2 className="text-sm font-bold text-green-400 uppercase tracking-wider">
                Listas ({listas.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {listas.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Sin órdenes listas</p>
                </div>
              ) : (
                listas.map(orden => (
                  <OrderCard key={orden.id} orden={orden} onUpdateEstado={handleUpdateEstado} ahora={ahora} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio no disponible
  }
}
