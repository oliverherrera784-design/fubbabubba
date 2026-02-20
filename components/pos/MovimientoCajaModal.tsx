'use client';

import { useState } from 'react';
import { X, ArrowDownToLine, ArrowUpFromLine, Receipt, Loader2 } from 'lucide-react';
import { SUBCATEGORIAS_GASTO, type SubcategoriaGasto } from '@/lib/supabase';

interface MovimientoCajaModalProps {
  onConfirm: (tipo: 'deposito' | 'retiro' | 'gasto', monto: number, comentario?: string, subcategoria?: SubcategoriaGasto) => void;
  onClose: () => void;
  loading?: boolean;
}

export function MovimientoCajaModal({ onConfirm, onClose, loading }: MovimientoCajaModalProps) {
  const [tipo, setTipo] = useState<'deposito' | 'retiro' | 'gasto'>('deposito');
  const [subcategoria, setSubcategoria] = useState<SubcategoriaGasto | ''>('');
  const [monto, setMonto] = useState('');
  const [comentario, setComentario] = useState('');

  const montoNum = parseFloat(monto) || 0;
  const canConfirm = montoNum > 0 && (tipo !== 'gasto' || subcategoria !== '');

  const handleConfirm = () => {
    if (loading || !canConfirm) return;
    onConfirm(
      tipo,
      montoNum,
      comentario || undefined,
      tipo === 'gasto' ? (subcategoria as SubcategoriaGasto) : undefined
    );
  };

  const buttonColors = {
    deposito: 'bg-green-600 hover:bg-green-700',
    gasto: 'bg-amber-600 hover:bg-amber-700',
    retiro: 'bg-red-600 hover:bg-red-700',
  };

  const buttonLabel = {
    deposito: 'Depositar',
    gasto: 'Registrar Gasto',
    retiro: 'Retirar Efectivo',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-lg text-gray-900">Gestión de Tesorería</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Tipo: 3 opciones */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setTipo('deposito'); setSubcategoria(''); }}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all touch-manipulation ${
                tipo === 'deposito' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ArrowDownToLine className={`w-5 h-5 ${tipo === 'deposito' ? 'text-green-600' : 'text-gray-500'}`} />
              <span className={`font-medium text-xs ${tipo === 'deposito' ? 'text-green-700' : 'text-gray-700'}`}>
                Depositar
              </span>
            </button>
            <button
              onClick={() => setTipo('gasto')}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all touch-manipulation ${
                tipo === 'gasto' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Receipt className={`w-5 h-5 ${tipo === 'gasto' ? 'text-amber-600' : 'text-gray-500'}`} />
              <span className={`font-medium text-xs ${tipo === 'gasto' ? 'text-amber-700' : 'text-gray-700'}`}>
                Gasto
              </span>
            </button>
            <button
              onClick={() => { setTipo('retiro'); setSubcategoria(''); }}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all touch-manipulation ${
                tipo === 'retiro' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ArrowUpFromLine className={`w-5 h-5 ${tipo === 'retiro' ? 'text-red-600' : 'text-gray-500'}`} />
              <span className={`font-medium text-xs ${tipo === 'retiro' ? 'text-red-700' : 'text-gray-700'}`}>
                Retiro Efectivo
              </span>
            </button>
          </div>

          {/* Descripción del tipo */}
          <p className="text-xs text-gray-500 text-center">
            {tipo === 'deposito' && 'Agregar efectivo a la caja (cambio, fondo extra)'}
            {tipo === 'gasto' && 'Pago operativo que sale de caja (proveedor, insumos, etc.)'}
            {tipo === 'retiro' && 'Retiro de efectivo al banco o caja fuerte (nocturno)'}
          </p>

          {/* Selector de categoría (solo para gastos) */}
          {tipo === 'gasto' && (
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Categoría del gasto <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SUBCATEGORIAS_GASTO.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSubcategoria(cat.value)}
                    className={`px-2 py-2.5 rounded-lg text-xs font-medium transition-all touch-manipulation ${
                      subcategoria === cat.value
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Monto</label>
            <input
              type="number"
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="w-full p-4 border border-gray-300 rounded-xl text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>

          {/* Comentario */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Descripción {tipo === 'gasto' ? '' : '(opcional)'}
            </label>
            <input
              type="text"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={
                tipo === 'gasto' ? 'Ej: Compra de vasos y popotes'
                  : tipo === 'retiro' ? 'Ej: Depósito nocturno'
                  : 'Ej: Cambio adicional'
              }
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Botón */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={loading || !canConfirm}
            className={`w-full py-4 font-bold text-lg rounded-xl transition-all touch-manipulation disabled:opacity-50 text-white ${buttonColors[tipo]}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </span>
            ) : (
              `${buttonLabel[tipo]} $${montoNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
