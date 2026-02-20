'use client';

import { useState, useCallback } from 'react';
import { X, KeyRound, Delete, Loader2, UserCheck } from 'lucide-react';
import type { CartItem } from '@/lib/supabase';

interface DescuentoEmpleadoModalProps {
  cart: CartItem[];
  snackCatIds: Set<number>;
  subtotal: number;
  onConfirm: (empleadoId: number, empleadoNombre: string) => void;
  onClose: () => void;
}

export function DescuentoEmpleadoModal({ cart, snackCatIds, subtotal, onConfirm, onClose }: DescuentoEmpleadoModalProps) {
  const [step, setStep] = useState<'pin' | 'preview'>('pin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [empleado, setEmpleado] = useState<{ id: number; nombre: string } | null>(null);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 4) return;
    setError('');
    setPin(prev => prev + digit);
  }, [pin]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/empleados/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (data.success) {
        setEmpleado({ id: data.empleado.id, nombre: data.empleado.nombre });
        setStep('preview');
      } else {
        setError(data.error || 'PIN incorrecto');
        setPin('');
      }
    } catch {
      setError('Error de conexión');
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [pin]);

  // Auto-submit al completar 4 dígitos
  if (pin.length === 4 && !loading && step === 'pin') {
    handleSubmit();
  }

  // Calcular desglose del descuento
  const desglose = cart.map(item => {
    const isSnack = item.categoria_id !== undefined && snackCatIds.has(item.categoria_id);
    const descPerUnit = isSnack ? 5 : 15;
    return {
      nombre: item.nombre,
      cantidad: item.cantidad,
      tipo: isSnack ? 'Botana' : 'Bebida',
      descPerUnit,
      descTotal: descPerUnit * item.cantidad,
    };
  });
  const totalDescuento = Math.min(desglose.reduce((s, d) => s + d.descTotal, 0), subtotal);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

        {step === 'pin' ? (
          <>
            {/* Header PIN */}
            <div className="p-6 bg-gradient-to-br from-amber-500 to-orange-500 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">Descuento Empleado</h2>
              <p className="text-amber-100 mt-1 text-sm">Ingresa tu PIN</p>
            </div>

            {/* Display PIN */}
            <div className="p-6 pb-2">
              <div className="flex justify-center gap-3 mb-4">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                      i < pin.length
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {i < pin.length ? '●' : ''}
                  </div>
                ))}
              </div>

              {error && <p className="text-red-500 text-sm text-center font-medium mb-2">{error}</p>}
              {loading && (
                <div className="flex justify-center mb-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                </div>
              )}
            </div>

            {/* Teclado */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
                  if (key === '') return <div key="empty" />;
                  if (key === 'del') {
                    return (
                      <button
                        key="del"
                        onClick={handleDelete}
                        disabled={loading}
                        className="h-14 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors touch-manipulation active:scale-95"
                      >
                        <Delete className="w-5 h-5 text-gray-600" />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={key}
                      onClick={() => handleDigit(key)}
                      disabled={loading || pin.length >= 4}
                      className="h-14 rounded-xl bg-gray-50 hover:bg-gray-100 text-xl font-bold text-gray-700 transition-colors touch-manipulation active:scale-95 active:bg-amber-100"
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón cerrar */}
            <div className="px-6 pb-6">
              <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium touch-manipulation">
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Preview del descuento */}
            <div className="p-6 bg-gradient-to-br from-amber-500 to-orange-500 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold">{empleado?.nombre}</h2>
              <p className="text-amber-100 text-sm">Descuento de empleado</p>
            </div>

            <div className="p-4 space-y-2">
              {desglose.map((d, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-gray-700">{d.cantidad}x {d.nombre}</span>
                    <span className="text-xs text-gray-400 ml-1">({d.tipo})</span>
                  </div>
                  <span className="text-red-600 font-medium">-${d.descTotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                <span className="text-gray-900">Total descuento</span>
                <span className="text-red-600">-${totalDescuento.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Total a pagar</span>
                <span className="font-medium text-gray-900">${(subtotal - totalDescuento).toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <button
                onClick={() => empleado && onConfirm(empleado.id, empleado.nombre)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all touch-manipulation shadow-lg shadow-amber-200"
              >
                Aplicar Descuento
              </button>
              <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium touch-manipulation">
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
