'use client';

import { useState, useMemo } from 'react';
import { LockOpen, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';

interface AbrirCajaModalProps {
  sucursalNombre: string;
  onConfirm: (montoApertura: number) => void;
  onClose: () => void;
  loading?: boolean;
  efectivoAnterior?: number | null;
}

const DENOMINACIONES = [
  { valor: 1000, label: '$1,000', tipo: 'billete' },
  { valor: 500, label: '$500', tipo: 'billete' },
  { valor: 200, label: '$200', tipo: 'billete' },
  { valor: 100, label: '$100', tipo: 'billete' },
  { valor: 50, label: '$50', tipo: 'billete' },
  { valor: 20, label: '$20', tipo: 'billete' },
  { valor: 10, label: '$10', tipo: 'moneda' },
  { valor: 5, label: '$5', tipo: 'moneda' },
  { valor: 2, label: '$2', tipo: 'moneda' },
  { valor: 1, label: '$1', tipo: 'moneda' },
  { valor: 0.5, label: '$0.50', tipo: 'moneda' },
];

export function AbrirCajaModal({ sucursalNombre, onConfirm, onClose, loading, efectivoAnterior }: AbrirCajaModalProps) {
  const [mode, setMode] = useState<'simple' | 'denominaciones'>('simple');
  const [monto, setMonto] = useState('');
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [confirmoAnterior, setConfirmoAnterior] = useState<boolean | null>(efectivoAnterior ? null : true);

  const montoSimple = parseFloat(monto) || 0;

  const totalDenominaciones = useMemo(() => {
    return DENOMINACIONES.reduce((sum, d) => sum + (cantidades[d.valor] || 0) * d.valor, 0);
  }, [cantidades]);

  const montoFinal = mode === 'simple' ? montoSimple : totalDenominaciones;

  const updateCantidad = (valor: number, cant: number) => {
    setCantidades(prev => ({ ...prev, [valor]: Math.max(0, cant) }));
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm(montoFinal);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-purple-600 to-pink-500 text-white text-center relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LockOpen className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Abrir Caja</h2>
          <p className="text-purple-200 mt-1">{sucursalNombre}</p>
        </div>

        {/* Toggle modo */}
        {confirmoAnterior !== null && (
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setMode('simple')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all touch-manipulation ${
                mode === 'simple' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              Monto directo
            </button>
            <button
              onClick={() => setMode('denominaciones')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all touch-manipulation ${
                mode === 'denominaciones' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'
              }`}
            >
              Por denominaciones
            </button>
          </div>
        </div>
        )}

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-6 pt-4">
          {/* Banner turno anterior */}
          {efectivoAnterior != null && efectivoAnterior > 0 && confirmoAnterior === null && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-semibold text-blue-800 mb-1">El turno anterior dejo:</p>
              <p className="text-2xl font-bold text-blue-700 text-center my-2">
                ${efectivoAnterior.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-blue-600 mb-3 text-center">Es correcto?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setConfirmoAnterior(true);
                    setMonto(efectivoAnterior.toString());
                  }}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors touch-manipulation"
                >
                  Si, es correcto
                </button>
                <button
                  onClick={() => setConfirmoAnterior(false)}
                  className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors touch-manipulation"
                >
                  No, es diferente
                </button>
              </div>
            </div>
          )}

          {/* Info si confirmó o rechazó */}
          {efectivoAnterior != null && efectivoAnterior > 0 && confirmoAnterior === true && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-sm text-green-700">
                Turno anterior: <span className="font-bold">${efectivoAnterior.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span> — Confirmado
              </p>
            </div>
          )}

          {efectivoAnterior != null && efectivoAnterior > 0 && confirmoAnterior === false && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
              <p className="text-sm text-amber-700">
                Turno anterior dejo <span className="font-bold">${efectivoAnterior.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span> — Ingresa el monto real
              </p>
            </div>
          )}

          {confirmoAnterior !== null && (mode === 'simple' ? (
            <>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Fondo de caja (efectivo inicial)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="w-full p-4 border border-gray-300 rounded-xl text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Ingresa la cantidad de efectivo con la que inicias el turno
              </p>

              {/* Montos rápidos */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {[0, 500, 1000, 1500, 2000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setMonto(amount.toString())}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors touch-manipulation"
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-3 text-center">
                Cuenta cada denominación del fondo de caja
              </p>

              {/* Billetes */}
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Billetes</h4>
              <div className="space-y-2 mb-4">
                {DENOMINACIONES.filter(d => d.tipo === 'billete').map(d => (
                  <DenominacionRow
                    key={d.valor}
                    label={d.label}
                    cantidad={cantidades[d.valor] || 0}
                    subtotal={(cantidades[d.valor] || 0) * d.valor}
                    onChange={(cant) => updateCantidad(d.valor, cant)}
                  />
                ))}
              </div>

              {/* Monedas */}
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Monedas</h4>
              <div className="space-y-2">
                {DENOMINACIONES.filter(d => d.tipo === 'moneda').map(d => (
                  <DenominacionRow
                    key={d.valor}
                    label={d.label}
                    cantidad={cantidades[d.valor] || 0}
                    subtotal={(cantidades[d.valor] || 0) * d.valor}
                    onChange={(cant) => updateCantidad(d.valor, cant)}
                  />
                ))}
              </div>
            </>
          ))}
        </div>

        {/* Total + Botón */}
        <div className="p-6 pt-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          {mode === 'denominaciones' && (
            <div className="flex justify-between items-center mb-3 bg-purple-50 p-3 rounded-xl">
              <span className="font-semibold text-purple-700">Total contado:</span>
              <span className="text-2xl font-bold text-purple-700">
                ${totalDenominaciones.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <button
            onClick={handleConfirm}
            disabled={loading || confirmoAnterior === null}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl transition-all touch-manipulation shadow-lg shadow-purple-200 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Abriendo...
              </span>
            ) : (
              `Abrir Caja con $${montoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DenominacionRow({ label, cantidad, subtotal, onChange }: {
  label: string;
  cantidad: number;
  subtotal: number;
  onChange: (cant: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
      <span className="font-bold text-gray-700 w-16 text-sm">{label}</span>
      <div className="flex items-center gap-1 flex-1">
        <button
          onClick={() => onChange(cantidad - 1)}
          disabled={cantidad <= 0}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 touch-manipulation disabled:opacity-30"
        >
          -
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={cantidad || ''}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-14 text-center font-bold text-gray-900 border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          placeholder="0"
        />
        <button
          onClick={() => onChange(cantidad + 1)}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 touch-manipulation"
        >
          +
        </button>
      </div>
      <span className="font-medium text-gray-500 text-sm w-20 text-right">
        {subtotal > 0 ? `$${subtotal.toLocaleString()}` : '-'}
      </span>
    </div>
  );
}
