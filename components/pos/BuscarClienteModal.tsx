'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, UserPlus, Phone, User, Loader2, Star } from 'lucide-react';
import type { Cliente, TarjetaLealtad } from '@/lib/supabase';

interface ClienteConLealtad extends Cliente {
  tarjeta_activa?: TarjetaLealtad | null;
  tarjeta_completa?: TarjetaLealtad | null;
}

interface BuscarClienteModalProps {
  onSelect: (cliente: ClienteConLealtad) => void;
  onClose: () => void;
}

export function BuscarClienteModal({ onSelect, onClose }: BuscarClienteModalProps) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<'buscar' | 'registrar'>('buscar');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automático
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [modo]);

  // Buscar mientras escribe
  useEffect(() => {
    if (busqueda.length < 2) {
      setResultados([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clientes?q=${encodeURIComponent(busqueda)}`);
        const data = await res.json();
        setResultados(data.clientes || []);
      } catch (e) {
        console.error('Error buscando:', e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [busqueda]);

  const handleSelectCliente = async (cliente: Cliente) => {
    // Cargar datos de lealtad del cliente
    try {
      const res = await fetch(`/api/lealtad/cliente?cliente_id=${cliente.id}`);
      const data = await res.json();
      onSelect({
        ...cliente,
        tarjeta_activa: data.tarjeta_activa || null,
        tarjeta_completa: data.tarjeta_completa || null,
      });
    } catch {
      // Si falla cargar lealtad, pasar el cliente sin datos de tarjeta
      onSelect({ ...cliente, tarjeta_activa: null, tarjeta_completa: null });
    }
  };

  const handleRegistrar = async () => {
    if (!nuevoNombre.trim() || !nuevoTelefono.trim()) {
      setError('Nombre y teléfono son requeridos');
      return;
    }

    // Validar teléfono (10 dígitos para México)
    const telLimpio = nuevoTelefono.replace(/\D/g, '');
    if (telLimpio.length !== 10) {
      setError('El teléfono debe tener 10 dígitos');
      return;
    }

    setRegistrando(true);
    setError('');
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre.trim(), telefono: telLimpio }),
      });
      const data = await res.json();

      if (data.success) {
        // Seleccionar el cliente recién creado
        onSelect({
          ...data.cliente,
          tarjeta_activa: { id: '', cliente_id: data.cliente.id, sellos_actuales: 0, estado: 'activa', created_at: '', completed_at: null, canjeada_at: null, canjeada_en_orden_id: null },
          tarjeta_completa: null,
        });
      } else {
        setError(data.error || 'Error al registrar');
      }
    } catch (e) {
      console.error('Error registrando:', e);
      setError('Error de conexión');
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <h3 className="font-bold text-lg">Programa de Lealtad</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg touch-manipulation">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setModo('buscar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                modo === 'buscar' ? 'bg-white text-amber-700' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Search className="w-4 h-4 inline mr-1" />
              Buscar cliente
            </button>
            <button
              onClick={() => setModo('registrar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all touch-manipulation ${
                modo === 'registrar' ? 'bg-white text-amber-700' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-1" />
              Nuevo cliente
            </button>
          </div>
        </div>

        {modo === 'buscar' ? (
          <>
            {/* Buscador */}
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por teléfono o nombre..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Resultados */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                </div>
              ) : busqueda.length < 2 ? (
                <div className="text-center py-8 text-gray-400">
                  <Phone className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Escribe un teléfono o nombre para buscar</p>
                </div>
              ) : resultados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-3">No se encontró ningún cliente</p>
                  <button
                    onClick={() => {
                      setModo('registrar');
                      // Si buscó un teléfono, pre-llenar
                      if (/^\d+$/.test(busqueda)) {
                        setNuevoTelefono(busqueda);
                      } else {
                        setNuevoNombre(busqueda);
                      }
                    }}
                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium text-sm hover:bg-amber-200 transition-colors touch-manipulation"
                  >
                    <UserPlus className="w-4 h-4 inline mr-1" />
                    Registrar nuevo cliente
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {resultados.map(cliente => (
                    <button
                      key={cliente.id}
                      onClick={() => handleSelectCliente(cliente)}
                      className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-amber-400 text-left transition-all touch-manipulation hover:bg-amber-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{cliente.nombre}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {cliente.telefono}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Formulario de registro */
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Nombre del cliente</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={modo === 'registrar' ? inputRef : undefined}
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Teléfono (10 dígitos)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="8121234567"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <Star className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <p className="text-sm text-amber-700">
                Se creará una tarjeta de lealtad automáticamente.
              </p>
              <p className="text-xs text-amber-600 mt-1">10 sellos = 1 bebida gratis</p>
            </div>

            <button
              onClick={handleRegistrar}
              disabled={registrando || !nuevoNombre.trim() || !nuevoTelefono.trim()}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all touch-manipulation disabled:opacity-50"
            >
              {registrando ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registrando...
                </span>
              ) : (
                'Registrar Cliente'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
