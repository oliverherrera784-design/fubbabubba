'use client';

import { useState, useCallback } from 'react';
import { KeyRound, Delete, Loader2, LogOut } from 'lucide-react';

interface Empleado {
  id: number;
  nombre: string;
  sucursal_id: number | null;
  puesto: string | null;
}

interface PinLoginModalProps {
  onLogin: (empleado: Empleado) => void;
  empleadoActual?: Empleado | null;
  onLogout?: () => void;
}

export function PinLoginModal({ onLogin, empleadoActual, onLogout }: PinLoginModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        onLogin(data.empleado);
        setPin('');
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
  }, [pin, onLogin]);

  // Si el PIN tiene 4 dígitos, enviar automáticamente
  if (pin.length === 4 && !loading) {
    handleSubmit();
  }

  // Si ya hay empleado logueado, mostrar opción de cambiar
  if (empleadoActual) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
          <KeyRound className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">{empleadoActual.nombre}</span>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Cambiar empleado"
          >
            <LogOut className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Ingresa tu PIN</h2>
          <p className="text-blue-200 mt-1 text-sm">Empleado del turno</p>
        </div>

        {/* Display del PIN */}
        <div className="p-6 pb-2">
          <div className="flex justify-center gap-3 mb-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                  i < pin.length
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {i < pin.length ? '●' : ''}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium mb-2">{error}</p>
          )}

          {loading && (
            <div className="flex justify-center mb-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}
        </div>

        {/* Teclado numérico */}
        <div className="px-6 pb-6">
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
                  className="h-14 rounded-xl bg-gray-50 hover:bg-gray-100 text-xl font-bold text-gray-700 transition-colors touch-manipulation active:scale-95 active:bg-blue-100"
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
