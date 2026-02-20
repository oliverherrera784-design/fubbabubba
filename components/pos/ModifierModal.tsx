'use client';

import { useState, useMemo } from 'react';
import { X, Check, ChevronRight, CakeSlice } from 'lucide-react';
import type { Producto, Modificador } from '@/lib/supabase';
import { SENDERO_ESPECIAL_PRODUCTOS, PRECIO_SENDERO_ESPECIAL } from '@/lib/supabase';

interface ModifierModalProps {
  producto: Producto;
  modificadores: Modificador[];
  onConfirm: (producto: Producto, selectedMods: { nombre: string; precio: number }[]) => void;
  onClose: () => void;
  sucursalCodigo?: string;
}

// Grupos que son obligatorios (el cajero DEBE elegir uno)
const REQUIRED_GROUPS = ['base', 'tamaño'];

// Grupos donde solo se puede elegir uno (radio-style)
const SINGLE_SELECT_GROUPS = ['base', 'tamaño'];

// Nombre del modificador de crema batida (se busca en los modificadores)
const CREMA_KEYWORDS = ['crema batida', 'crema', 'whipped'];

export function ModifierModal({ producto, modificadores, onConfirm, onClose, sucursalCodigo }: ModifierModalProps) {
  const [selectedMods, setSelectedMods] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<'modifiers' | 'crema'>('modifiers');
  const [cremaDecided, setCremaDecided] = useState(false);

  // Ajustar precios para Sendero (Nutella/Taro = $110 estándar)
  const adjustedModificadores = useMemo(() => {
    const isSendero = sucursalCodigo?.toUpperCase() === 'SENDERO';
    const isEspecial = SENDERO_ESPECIAL_PRODUCTOS.some(
      kw => producto.nombre.toLowerCase().includes(kw)
    );
    if (!isSendero || !isEspecial) return modificadores;

    return modificadores.map(m => {
      if (m.grupo.toLowerCase().includes('tamaño') && m.nombre.toLowerCase().includes('estándar')) {
        return { ...m, precio_extra: PRECIO_SENDERO_ESPECIAL };
      }
      return m;
    });
  }, [modificadores, sucursalCodigo, producto.nombre]);

  // Agrupar modificadores
  const groups = useMemo(() => {
    const map: Record<string, Modificador[]> = {};
    adjustedModificadores.forEach(m => {
      if (!map[m.grupo]) map[m.grupo] = [];
      map[m.grupo].push(m);
    });
    return map;
  }, [adjustedModificadores]);

  // Encontrar el modificador de crema batida
  const cremaMod = useMemo(() => {
    return adjustedModificadores.find(m =>
      CREMA_KEYWORDS.some(kw => m.nombre.toLowerCase().includes(kw))
    );
  }, [adjustedModificadores]);

  // Verificar si un grupo es obligatorio
  const isRequired = (grupo: string) =>
    REQUIRED_GROUPS.some(rg => grupo.toLowerCase().includes(rg));

  // Verificar si un grupo es single-select
  const isSingleSelect = (grupo: string) =>
    SINGLE_SELECT_GROUPS.some(sg => grupo.toLowerCase().includes(sg));

  // Verificar que todos los grupos obligatorios tengan selección
  const requiredSatisfied = useMemo(() => {
    for (const [grupo, mods] of Object.entries(groups)) {
      if (isRequired(grupo)) {
        const hasSelection = mods.some(m => selectedMods.has(m.id));
        if (!hasSelection) return false;
      }
    }
    return true;
  }, [groups, selectedMods]);

  // Ordenar grupos: obligatorios primero
  const sortedGroups = useMemo(() => {
    return Object.entries(groups).sort(([a], [b]) => {
      const aReq = isRequired(a) ? 0 : 1;
      const bReq = isRequired(b) ? 0 : 1;
      return aReq - bReq;
    });
  }, [groups]);

  const toggleMod = (modId: number, grupo: string) => {
    setSelectedMods(prev => {
      const next = new Set(prev);
      if (isSingleSelect(grupo)) {
        adjustedModificadores.filter(m => m.grupo === grupo).forEach(m => next.delete(m.id));
        next.add(modId);
      } else {
        if (next.has(modId)) {
          next.delete(modId);
        } else {
          next.add(modId);
        }
      }
      return next;
    });
  };

  const precioExtra = useMemo(() => {
    return adjustedModificadores
      .filter(m => selectedMods.has(m.id))
      .reduce((sum, m) => sum + m.precio_extra, 0);
  }, [selectedMods, adjustedModificadores]);

  const precioTotal = producto.precio_default + precioExtra;

  const handleNext = () => {
    if (!requiredSatisfied) return;
    if (cremaMod && !cremaDecided) {
      setStep('crema');
    } else {
      doConfirm();
    }
  };

  const handleCrema = (addCrema: boolean) => {
    if (addCrema && cremaMod) {
      setSelectedMods(prev => new Set(prev).add(cremaMod.id));
    }
    setCremaDecided(true);
    const mods = adjustedModificadores
      .filter(m => selectedMods.has(m.id) || (addCrema && cremaMod && m.id === cremaMod.id))
      .map(m => ({ nombre: m.nombre, precio: m.precio_extra }));
    onConfirm(producto, mods);
  };

  const doConfirm = () => {
    const mods = adjustedModificadores
      .filter(m => selectedMods.has(m.id))
      .map(m => ({ nombre: m.nombre, precio: m.precio_extra }));
    onConfirm(producto, mods);
  };

  const missingRequired = useMemo(() => {
    const missing: string[] = [];
    for (const [grupo, mods] of Object.entries(groups)) {
      if (isRequired(grupo)) {
        const hasSelection = mods.some(m => selectedMods.has(m.id));
        if (!hasSelection) missing.push(grupo);
      }
    }
    return missing;
  }, [groups, selectedMods]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{producto.nombre}</h3>
            {producto.precio_default > 0 ? (
              <p className="text-sm text-gray-500">${producto.precio_default.toFixed(2)} base</p>
            ) : (
              <p className="text-sm text-gray-400">Selecciona tamaño</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'modifiers' ? (
          <>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {sortedGroups.map(([grupo, mods]) => {
                const required = isRequired(grupo);
                const singleSelect = isSingleSelect(grupo);
                const hasSelection = mods.some(m => selectedMods.has(m.id));

                return (
                  <div key={grupo}>
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                      {grupo}
                      {required && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          hasSelection
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600 animate-pulse'
                        }`}>
                          {hasSelection ? '✓ Seleccionado' : '⚠ Obligatorio'}
                        </span>
                      )}
                      {singleSelect && !required && (
                        <span className="text-gray-400 font-normal text-xs">(elige uno)</span>
                      )}
                    </h4>

                    <div className={`space-y-2 ${required && !hasSelection ? 'p-2 border-2 border-red-200 rounded-xl bg-red-50/50' : ''}`}>
                      {mods.map(mod => {
                        if (cremaMod && mod.id === cremaMod.id) return null;

                        return (
                          <button
                            key={mod.id}
                            onClick={() => toggleMod(mod.id, grupo)}
                            className={`
                              w-full flex items-center justify-between p-3 rounded-xl border transition-all touch-manipulation
                              ${selectedMods.has(mod.id)
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center
                                ${selectedMods.has(mod.id) ? 'border-purple-600 bg-purple-600' : 'border-gray-300'}
                              `}>
                                {selectedMods.has(mod.id) && <Check className="w-4 h-4 text-white" />}
                              </div>
                              <span className="font-medium text-gray-900">{mod.nombre}</span>
                            </div>
                            {grupo.toLowerCase().includes('tamaño') ? (
                              <span className="text-sm font-semibold text-purple-600">
                                ${mod.precio_extra.toFixed(2)}
                              </span>
                            ) : mod.precio_extra > 0 ? (
                              <span className="text-sm font-semibold text-purple-600">
                                +${mod.precio_extra.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">incluido</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              {missingRequired.length > 0 && (
                <p className="text-xs text-red-500 font-medium text-center mb-2">
                  Falta seleccionar: {missingRequired.join(', ')}
                </p>
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-600">Total:</span>
                <span className="text-xl font-bold text-gray-900">
                  ${precioTotal.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleNext}
                disabled={!requiredSatisfied}
                className={`w-full py-3 font-bold rounded-xl transition-all touch-manipulation flex items-center justify-center gap-2 ${
                  requiredSatisfied
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {cremaMod && !cremaDecided ? (
                  <>Siguiente <ChevronRight className="w-5 h-5" /></>
                ) : (
                  'Agregar al pedido'
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <CakeSlice className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                ¿El cliente desea crema batida en su bebida?
              </h3>
              {cremaMod && cremaMod.precio_extra > 0 && (
                <p className="text-sm text-gray-500 mb-6">
                  Costo adicional: <span className="font-bold text-purple-600">+${cremaMod.precio_extra.toFixed(2)}</span>
                </p>
              )}
              {cremaMod && cremaMod.precio_extra === 0 && (
                <p className="text-sm text-green-600 font-medium mb-6">
                  ¡Sin costo extra!
                </p>
              )}

              <div className="flex gap-3 w-full max-w-xs">
                <button
                  onClick={() => handleCrema(false)}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg rounded-xl transition-all touch-manipulation"
                >
                  No
                </button>
                <button
                  onClick={() => handleCrema(true)}
                  className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg rounded-xl transition-all touch-manipulation shadow-lg shadow-amber-200"
                >
                  Sí
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setStep('modifiers')}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium touch-manipulation"
              >
                ← Regresar a modificadores
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
