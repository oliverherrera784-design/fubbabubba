'use client';

import { useState } from 'react';
import { X, Tag, Percent } from 'lucide-react';

interface DescuentoModalProps {
  subtotal: number;
  descuentoActual: number;
  onConfirm: (descuento: number) => void;
  onClose: () => void;
}

export function DescuentoModal({ subtotal, descuentoActual, onConfirm, onClose }: DescuentoModalProps) {
  const [modo, setModo] = useState<'monto' | 'porcentaje'>('monto');
  const [valor, setValor] = useState(descuentoActual > 0 ? descuentoActual.toString() : '');

  const valorNum = parseFloat(valor) || 0;
  const descuentoFinal = modo === 'porcentaje'
    ? Math.round(subtotal * (valorNum / 100) * 100) / 100
    : Math.min(valorNum, subtotal);

  const handleConfirm = () => {
    onConfirm(descuentoFinal);
  };

  const handleQuitar = () => {
    onConfirm(0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg text-gray-900">Aplicar Descuento</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Subtotal actual: <span className="font-bold">${subtotal.toFixed(2)}</span>
          </p>

          {/* Modo: Monto fijo / Porcentaje */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setModo('monto'); setValor(''); }}
              className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all touch-manipulation ${
                modo === 'monto' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}
            >
              <Tag className={`w-4 h-4 ${modo === 'monto' ? 'text-purple-600' : 'text-gray-500'}`} />
              <span className={`font-medium text-sm ${modo === 'monto' ? 'text-purple-700' : 'text-gray-700'}`}>
                Monto fijo
              </span>
            </button>
            <button
              onClick={() => { setModo('porcentaje'); setValor(''); }}
              className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all touch-manipulation ${
                modo === 'porcentaje' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}
            >
              <Percent className={`w-4 h-4 ${modo === 'porcentaje' ? 'text-purple-600' : 'text-gray-500'}`} />
              <span className={`font-medium text-sm ${modo === 'porcentaje' ? 'text-purple-700' : 'text-gray-700'}`}>
                Porcentaje
              </span>
            </button>
          </div>

          {/* Input */}
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0"
              className="w-full p-4 border border-gray-300 rounded-xl text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">
              {modo === 'porcentaje' ? '%' : '$'}
            </span>
          </div>

          {/* Porcentajes rápidos */}
          {modo === 'porcentaje' && (
            <div className="flex gap-2 justify-center">
              {[5, 10, 15, 20, 50].map(p => (
                <button
                  key={p}
                  onClick={() => setValor(p.toString())}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors touch-manipulation"
                >
                  {p}%
                </button>
              ))}
            </div>
          )}

          {/* Preview */}
          {descuentoFinal > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
              <p className="text-sm text-purple-600">Descuento a aplicar</p>
              <p className="text-2xl font-bold text-purple-700">-${descuentoFinal.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          {descuentoActual > 0 && (
            <button
              onClick={handleQuitar}
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all touch-manipulation"
            >
              Quitar descuento
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={descuentoFinal <= 0}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all touch-manipulation disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
