'use client';

import { useState, useMemo } from 'react';
import { X, Banknote, CreditCard, Loader2, Trash2, Split, Smartphone, Truck, ArrowLeft } from 'lucide-react';
import type { Plataforma } from '@/lib/supabase';

interface PagoEntry {
  metodo: 'efectivo' | 'tarjeta';
  monto: string;
}

type MetodoPago = 'efectivo' | 'tarjeta' | 'app_plataforma';

interface PaymentModalProps {
  total: number;
  onConfirm: (pagos: { metodo: MetodoPago; monto: number }[], plataforma?: Plataforma | null, totalPlataforma?: number | null, extras?: { montoRecibido?: number; cambio?: number }) => void;
  onClose: () => void;
  loading?: boolean;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const METODO_CONFIG = {
  efectivo: { label: 'Efectivo', icon: Banknote, color: 'green' },
  tarjeta: { label: 'Tarjeta', icon: CreditCard, color: 'blue' },
} as const;

const PLATAFORMA_CONFIG: { value: Plataforma; label: string; bg: string; activeBg: string; border: string; text: string }[] = [
  { value: 'uber_eats', label: 'Uber Eats', bg: 'bg-green-50', activeBg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' },
  { value: 'rappi', label: 'Rappi', bg: 'bg-orange-50', activeBg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
  { value: 'didi', label: 'Didi', bg: 'bg-blue-50', activeBg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
];

export function PaymentModal({ total, onConfirm, onClose, loading }: PaymentModalProps) {
  const [mixto, setMixto] = useState(false);

  // Pago simple (directo)
  const [metodo, setMetodo] = useState<'efectivo' | 'tarjeta'>('efectivo');
  const [montoRecibido, setMontoRecibido] = useState<string>('');

  // Plataforma
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  const [plataformaMetodo, setPlataformaMetodo] = useState<'app' | 'efectivo' | null>(null);
  const [totalPlataforma, setTotalPlataforma] = useState<string>('');
  const [plataformaMonto, setPlataformaMonto] = useState<string>('');

  // Pago mixto
  const [pagos, setPagos] = useState<PagoEntry[]>([
    { metodo: 'efectivo', monto: '' },
    { metodo: 'tarjeta', monto: '' },
  ]);

  // Simple
  const montoNum = parseFloat(montoRecibido) || 0;
  const cambioSimple = metodo === 'efectivo' ? Math.max(0, montoNum - total) : 0;
  const canPaySimple = metodo === 'efectivo' ? montoNum >= total : true;

  // Plataforma
  const totalPlatNum = parseFloat(totalPlataforma) || 0;
  const platMontoNum = parseFloat(plataformaMonto) || 0;
  const totalACobrar = totalPlatNum > 0 ? totalPlatNum : total; // Si no puso total plataforma, usa el total sucursal
  const platCambio = Math.max(0, platMontoNum - totalACobrar);
  const sobreprecio = totalPlatNum > total ? Math.round((totalPlatNum - total) * 100) / 100 : 0;
  const canPayPlataforma = plataformaMetodo === 'app'
    ? totalPlatNum >= total
    : (platMontoNum >= totalACobrar && totalPlatNum >= total);

  // Mixto
  const totalPagado = useMemo(() =>
    pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0),
    [pagos]
  );
  const restante = total - totalPagado;
  const cambioMixto = Math.max(0, -restante);

  const canPayMixto = useMemo(() => {
    if (totalPagado < total - 0.01) return false;
    for (const p of pagos) {
      const m = parseFloat(p.monto) || 0;
      if (m <= 0) return false;
    }
    return true;
  }, [pagos, totalPagado, total]);

  const updatePago = (index: number, field: keyof PagoEntry, value: string) => {
    setPagos(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const removePago = (index: number) => {
    if (pagos.length <= 2) return;
    setPagos(prev => prev.filter((_, i) => i !== index));
  };

  const autoFillRestante = (index: number) => {
    const otrosPagos = pagos.reduce((sum, p, i) => i === index ? sum : sum + (parseFloat(p.monto) || 0), 0);
    const resto = Math.max(0, total - otrosPagos);
    updatePago(index, 'monto', resto.toFixed(2));
  };

  const toggleMixto = () => {
    if (!mixto) {
      setPagos([
        { metodo: 'efectivo', monto: '' },
        { metodo: 'tarjeta', monto: '' },
      ]);
    }
    setMixto(!mixto);
  };

  // Seleccionar plataforma+método directo (un solo click)
  const selectPlataformaDirecto = (plat: Plataforma, met: 'app' | 'efectivo') => {
    setPlataforma(plat);
    setPlataformaMetodo(met);
    setTotalPlataforma('');
    setPlataformaMonto('');
  };

  const clearPlataforma = () => {
    setPlataforma(null);
    setPlataformaMetodo(null);
    setTotalPlataforma('');
    setPlataformaMonto('');
  };

  const handleConfirm = () => {
    if (loading) return;

    if (plataforma && plataformaMetodo) {
      const met: MetodoPago = plataformaMetodo === 'app' ? 'app_plataforma' : 'efectivo';
      const extras = plataformaMetodo === 'efectivo' && platMontoNum > totalACobrar
        ? { montoRecibido: platMontoNum, cambio: platCambio }
        : undefined;
      onConfirm(
        [{ metodo: met, monto: totalACobrar }],
        plataforma,
        totalPlatNum > 0 ? totalPlatNum : null,
        extras
      );
    } else if (mixto) {
      if (!canPayMixto) return;
      const extras = cambioMixto > 0 ? { cambio: cambioMixto } : undefined;
      onConfirm(pagos.map(p => ({
        metodo: p.metodo as MetodoPago,
        monto: parseFloat(p.monto) || 0,
      })), undefined, undefined, extras);
    } else {
      if (!canPaySimple) return;
      const extras = metodo === 'efectivo' && montoNum > total
        ? { montoRecibido: montoNum, cambio: cambioSimple }
        : undefined;
      onConfirm([{
        metodo,
        monto: total,
      }], undefined, undefined, extras);
    }
  };

  const canConfirm = plataforma && plataformaMetodo
    ? canPayPlataforma
    : mixto
      ? canPayMixto
      : canPaySimple;

  const platConfig = plataforma ? PLATAFORMA_CONFIG.find(p => p.value === plataforma) : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-purple-600 text-white flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg">Cobrar</h3>
            <p className="text-purple-200 text-sm">Total sucursal</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold">${total.toFixed(2)}</span>
            <button onClick={onClose} className="p-2 hover:bg-purple-500 rounded-lg touch-manipulation">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* === VISTA DE PLATAFORMA SELECCIONADA === */}
          {plataforma && plataformaMetodo ? (
            <div className="p-4 space-y-4">
              <button
                onClick={clearPlataforma}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a métodos de pago
              </button>

              <div className="text-center">
                <Truck className={`w-8 h-8 mx-auto mb-1 ${platConfig?.text || 'text-purple-600'}`} />
                <p className="font-bold text-gray-900">
                  {platConfig?.label} — {plataformaMetodo === 'app' ? 'Por App' : 'Efectivo'}
                </p>
              </div>

              {/* Campo: Total que cobra la plataforma */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Total que cobra {platConfig?.label}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={totalPlataforma}
                  onChange={(e) => setTotalPlataforma(e.target.value)}
                  placeholder={total.toFixed(2)}
                  className="w-full p-4 border border-gray-300 rounded-xl text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1 text-center">
                  Escribe el total que aparece en la app de {platConfig?.label}
                </p>
              </div>

              {/* Sobreprecio */}
              {sobreprecio > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-amber-700">Sobreprecio plataforma</span>
                    <span className="font-bold text-amber-700">${sobreprecio.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    Este dinero está en caja pero es de la plataforma
                  </p>
                </div>
              )}

              {plataformaMetodo === 'app' ? (
                /* Pago por App — mostrar resumen */
                totalPlatNum >= total && (
                  <div className={`${platConfig?.bg} border ${platConfig?.border} rounded-xl p-5 text-center`}>
                    <Smartphone className={`w-10 h-10 mx-auto mb-2 ${platConfig?.text}`} />
                    <p className={`font-semibold ${platConfig?.text}`}>Pago por App</p>
                    <p className="text-sm text-gray-600 mt-2">
                      El cliente paga <span className="font-bold">${totalACobrar.toFixed(2)}</span> por la app de {platConfig?.label}.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">No entra al cajón de efectivo.</p>
                  </div>
                )
              ) : (
                /* Pago en efectivo del repartidor */
                totalPlatNum >= total && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Monto recibido del repartidor</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={plataformaMonto}
                        onChange={(e) => setPlataformaMonto(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-4 border border-gray-300 rounded-xl text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setPlataformaMonto(totalACobrar.toFixed(2))}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium text-sm hover:bg-purple-200 transition-colors touch-manipulation"
                      >
                        Exacto (${totalACobrar.toFixed(2)})
                      </button>
                      {QUICK_AMOUNTS.filter(a => a >= totalACobrar * 0.5).slice(0, 4).map(amount => (
                        <button
                          key={amount}
                          onClick={() => setPlataformaMonto(amount.toString())}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors touch-manipulation"
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                    {platMontoNum > 0 && (
                      <div className={`p-4 rounded-xl ${platMontoNum >= totalACobrar ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${platMontoNum >= totalACobrar ? 'text-green-700' : 'text-red-700'}`}>
                            {platMontoNum >= totalACobrar ? 'Cambio:' : 'Falta:'}
                          </span>
                          <span className={`text-2xl font-bold ${platMontoNum >= totalACobrar ? 'text-green-700' : 'text-red-700'}`}>
                            ${platMontoNum >= totalACobrar ? platCambio.toFixed(2) : (totalACobrar - platMontoNum).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 text-center">Este efectivo entra al cajón de caja.</p>
                  </div>
                )
              )}
            </div>
          ) : (
            /* === VISTA NORMAL (sin plataforma) === */
            <>
              {/* Toggle pago mixto */}
              <div className="px-4 pt-4">
                <button
                  onClick={toggleMixto}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-medium text-sm transition-all touch-manipulation ${
                    mixto
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Split className="w-4 h-4" />
                  {mixto ? 'Pago Mixto activado' : 'Dividir pago (Pago Mixto)'}
                </button>
              </div>

              {!mixto ? (
                <>
                  {/* Venta Directa */}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Venta Directa</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(['efectivo', 'tarjeta'] as const).map((id) => {
                        const { label, icon: Icon } = METODO_CONFIG[id];
                        return (
                          <button
                            key={id}
                            onClick={() => setMetodo(id)}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all touch-manipulation ${
                              metodo === id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className={`w-6 h-6 ${metodo === id ? 'text-purple-600' : 'text-gray-500'}`} />
                            <span className={`text-sm font-medium ${metodo === id ? 'text-purple-700' : 'text-gray-700'}`}>
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plataformas — botones directos */}
                  <div className="px-4 pb-2">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Plataformas</p>
                    <div className="space-y-2">
                      {PLATAFORMA_CONFIG.map((plat) => (
                        <div key={plat.value} className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => selectPlataformaDirecto(plat.value, 'app')}
                            className={`p-3 rounded-xl border-2 border-gray-200 hover:${plat.border} ${plat.bg} flex items-center justify-center gap-2 transition-all touch-manipulation`}
                          >
                            <Smartphone className={`w-4 h-4 ${plat.text}`} />
                            <span className={`text-xs font-medium ${plat.text}`}>{plat.label} App</span>
                          </button>
                          <button
                            onClick={() => selectPlataformaDirecto(plat.value, 'efectivo')}
                            className={`p-3 rounded-xl border-2 border-gray-200 hover:${plat.border} ${plat.bg} flex items-center justify-center gap-2 transition-all touch-manipulation`}
                          >
                            <Banknote className={`w-4 h-4 ${plat.text}`} />
                            <span className={`text-xs font-medium ${plat.text}`}>{plat.label} Efectivo</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Input según método directo */}
                  <div className="px-4 pb-4">
                    {metodo === 'efectivo' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-2">Monto recibido</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={montoRecibido}
                            onChange={(e) => setMontoRecibido(e.target.value)}
                            placeholder="0.00"
                            className="w-full p-4 border border-gray-300 rounded-xl text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setMontoRecibido(total.toFixed(2))}
                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium text-sm hover:bg-purple-200 transition-colors touch-manipulation"
                          >
                            Exacto
                          </button>
                          {QUICK_AMOUNTS.map(amount => (
                            <button
                              key={amount}
                              onClick={() => setMontoRecibido(amount.toString())}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors touch-manipulation"
                            >
                              ${amount}
                            </button>
                          ))}
                        </div>
                        {montoNum > 0 && (
                          <div className={`p-4 rounded-xl ${montoNum >= total ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex justify-between items-center">
                              <span className={`font-medium ${montoNum >= total ? 'text-green-700' : 'text-red-700'}`}>
                                {montoNum >= total ? 'Cambio:' : 'Falta:'}
                              </span>
                              <span className={`text-2xl font-bold ${montoNum >= total ? 'text-green-700' : 'text-red-700'}`}>
                                ${montoNum >= total ? cambioSimple.toFixed(2) : (total - montoNum).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {metodo === 'tarjeta' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                        <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <p className="font-semibold text-blue-900">Cobro con tarjeta</p>
                        <p className="text-sm text-blue-700 mt-2">
                          Procesa el cobro de ${total.toFixed(2)} en la terminal de pago y confirma.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Pago Mixto */
                <div className="p-4 space-y-3">
                  {pagos.map((pago, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                          <select
                            value={pago.metodo}
                            onChange={(e) => updatePago(index, 'metodo', e.target.value)}
                            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => autoFillRestante(index)}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors touch-manipulation"
                          >
                            Resto
                          </button>
                          {pagos.length > 2 && (
                            <button onClick={() => removePago(index)} className="p-1 text-red-400 hover:text-red-600 touch-manipulation">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-bold text-lg">$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={pago.monto}
                          onChange={(e) => updatePago(index, 'monto', e.target.value)}
                          placeholder="0.00"
                          className="flex-1 p-3 border border-gray-300 rounded-xl text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}

                  <div className={`p-4 rounded-xl ${restante <= 0.01 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="space-y-1.5">
                      {pagos.map((p, i) => {
                        const m = parseFloat(p.monto) || 0;
                        if (m <= 0) return null;
                        return (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-600">{METODO_CONFIG[p.metodo].label}</span>
                            <span className="font-medium">${m.toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="border-t border-gray-200 pt-1.5 flex justify-between">
                        <span className="font-semibold text-gray-700">Total pagado</span>
                        <span className="font-bold">${totalPagado.toFixed(2)}</span>
                      </div>
                      {restante > 0.01 && (
                        <div className="flex justify-between text-red-600 font-medium">
                          <span>Falta</span>
                          <span>${restante.toFixed(2)}</span>
                        </div>
                      )}
                      {cambioMixto > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>Cambio</span>
                          <span>${cambioMixto.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Botón confirmar */}
        {(!(plataforma && plataformaMetodo) || totalPlatNum >= total) && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || loading}
              className={`
                w-full py-4 font-bold text-lg rounded-xl transition-all touch-manipulation
                ${canConfirm && !loading
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </span>
              ) : (
                'Confirmar Pago'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
