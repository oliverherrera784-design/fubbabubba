'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Users, Loader2, ArrowRightLeft, Printer } from 'lucide-react';

interface CambioTurnoModalProps {
  cajaId: string;
  sucursalId: number;
  sucursalNombre: string;
  empleadoSaliente: { id: number; nombre: string } | null;
  onConfirm: (empleadoEntranteId: number, efectivoContado: number, notas?: string) => void;
  onClose: () => void;
  loading?: boolean;
}

interface EmpleadoOption {
  id: number;
  nombre: string;
  puesto: string | null;
  rol: string | null;
  sucursal_id: number | null;
}

interface CuadreResumen {
  fondo_apertura: number;
  efectivo_teorico: number;
  cobros_efectivo: number;
  retiros: number;
  gastos: number;
  por_metodo: { efectivo: number; tarjeta: number; app_plataforma: number };
  sobreprecio_plataformas?: number;
  total_ordenes: number;
  piezas_vendidas?: number;
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

export function CambioTurnoModal({
  cajaId,
  sucursalId,
  sucursalNombre,
  empleadoSaliente,
  onConfirm,
  onClose,
  loading,
}: CambioTurnoModalProps) {
  const [empleados, setEmpleados] = useState<EmpleadoOption[]>([]);
  const [empleadoEntranteId, setEmpleadoEntranteId] = useState<number | null>(null);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [notas, setNotas] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [resumen, setResumen] = useState<CuadreResumen | null>(null);

  const totalDenominaciones = useMemo(() => {
    return DENOMINACIONES.reduce((sum, d) => sum + (cantidades[d.valor] || 0) * d.valor, 0);
  }, [cantidades]);

  const descuadre = resumen ? totalDenominaciones - resumen.efectivo_teorico : 0;

  const updateCantidad = (valor: number, cant: number) => {
    setCantidades(prev => ({ ...prev, [valor]: Math.max(0, cant) }));
  };

  // Cargar empleados y cuadre parcial
  useEffect(() => {
    async function loadData() {
      try {
        const [empRes, cuadreRes] = await Promise.all([
          fetch('/api/empleados'),
          fetch(`/api/pos/caja/cuadre?caja_id=${cajaId}`),
        ]);
        const empData = await empRes.json();
        const cuadreData = await cuadreRes.json();

        // Filtrar: excluir saliente, y solo mostrar empleados de esta sucursal + admin/gerente global
        const emps = (empData.empleados || []).filter(
          (e: EmpleadoOption) =>
            e.id !== empleadoSaliente?.id &&
            (e.rol === 'admin' || e.rol === 'gerente' || e.sucursal_id === sucursalId)
        );
        setEmpleados(emps);
        setResumen(cuadreData.resumen || null);
      } catch (e) {
        console.error('Error cargando datos:', e);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [cajaId, empleadoSaliente]);

  const canConfirm = empleadoEntranteId !== null && totalDenominaciones > 0;

  const handleConfirm = () => {
    if (!canConfirm || loading || !empleadoEntranteId) return;
    onConfirm(empleadoEntranteId, totalDenominaciones, notas || undefined);
  };

  const fmtMoney = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Cambio de Turno</h3>
              <p className="text-blue-200 text-sm">{sucursalNombre} — Corte parcial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-500 rounded-lg touch-manipulation">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingData ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-500 mt-2">Cargando...</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {/* Info del turno */}
            {resumen && (
              <div className="bg-blue-50 rounded-xl p-3 text-sm border border-blue-200">
                <div className="flex justify-between">
                  <span className="text-blue-700">Ventas este turno:</span>
                  <span className="font-bold text-blue-900">{resumen.total_ordenes} órdenes</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-blue-700">Efectivo teórico:</span>
                  <span className="font-bold text-blue-900">{fmtMoney(resumen.efectivo_teorico)}</span>
                </div>
              </div>
            )}

            {/* Empleado saliente → entrante */}
            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4" />
                Entrega y Recibe
              </h4>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-red-500 font-medium">Sale</p>
                  <p className="font-bold text-red-700 text-sm">
                    {empleadoSaliente?.nombre || 'Sin empleado'}
                  </p>
                </div>
                <ArrowRightLeft className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <select
                    value={empleadoEntranteId || ''}
                    onChange={(e) => setEmpleadoEntranteId(parseInt(e.target.value) || null)}
                    className="w-full bg-green-50 border-2 border-green-300 rounded-xl p-3 text-center text-sm font-bold text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Selecciona quién entra</option>
                    {empleados.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre} {emp.puesto ? `(${emp.puesto})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Conteo de efectivo por denominaciones */}
            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">
                Conteo de Efectivo (parcial)
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                Cuenta el efectivo que se queda en caja para el siguiente turno
              </p>

              {/* Billetes */}
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Billetes</h5>
              <div className="space-y-1.5 mb-3">
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
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Monedas</h5>
              <div className="space-y-1.5">
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

              {/* Total + descuadre */}
              <div className="mt-3 bg-blue-50 p-3 rounded-xl flex justify-between items-center">
                <span className="font-semibold text-blue-700">Total contado:</span>
                <span className="text-xl font-bold text-blue-700">{fmtMoney(totalDenominaciones)}</span>
              </div>

              {totalDenominaciones > 0 && resumen && (
                <div className={`mt-2 p-3 rounded-lg text-center font-bold text-sm ${
                  Math.abs(descuadre) < 0.01
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {Math.abs(descuadre) < 0.01
                    ? 'Cuadra perfecto'
                    : `Diferencia: ${descuadre >= 0 ? '+' : ''}${fmtMoney(descuadre)}`
                  }
                </div>
              )}
            </div>

            {/* === HOJA DE CORTE FINAL === */}
            {totalDenominaciones > 0 && resumen && (() => {
              const totalFormasPago = resumen.por_metodo.efectivo + resumen.por_metodo.tarjeta + resumen.por_metodo.app_plataforma;
              const fondoInicial = resumen.fondo_apertura;
              const total1 = totalFormasPago - fondoInicial;
              const plataformas = resumen.por_metodo.app_plataforma;
              const total2 = total1 - plataformas;
              const totalTarjetas = resumen.por_metodo.tarjeta;
              const total3 = total2 - totalTarjetas;
              const gastosCorte = resumen.gastos;
              const total4 = total3 - gastosCorte;
              const retiroEfectivo = resumen.retiros;
              const total5 = total4 - retiroEfectivo;
              const realidadCaja = totalDenominaciones;
              const totalFinal = total5;
              const diferencia = realidadCaja - totalFinal;
              const deudaPlataformas = resumen.sobreprecio_plataformas || 0;
              const pv = resumen.piezas_vendidas || 0;

              const imprimirCorte = () => {
                const ahora = new Date();
                const fechaStr = ahora.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const horaStr = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                const fmt = (n: number) => '$' + n.toFixed(2);
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Corte Cambio Turno</title>
<style>@page{size:58mm auto;margin:0}*{margin:0;padding:0;box-sizing:border-box}
body{width:58mm;font-family:'Courier New',monospace;font-size:11px;line-height:1.4;padding:3mm 2mm;color:#000}
h2{text-align:center;font-size:14px;margin-bottom:4px}
.row{display:flex;justify-content:space-between}.bold{font-weight:bold}
.sep{border-top:1px dashed #000;margin:3px 0}.indent{padding-left:8px}
</style></head><body>
<h2>HOJA CORTE FINAL</h2>
<div style="text-align:center;font-size:10px">(Cambio de Turno)</div>
<div class="row"><span>FECHA: ${fechaStr} ${horaStr}</span></div>
<div class="row"><span>REALIZA: ${sucursalNombre}</span></div>
<div class="sep"></div>
<div class="row bold"><span>+ TOTAL FORMAS PAGO</span><span>${fmt(totalFormasPago)}</span></div>
<div class="row indent"><span>FONDO INICIAL CAJA</span><span>${fmt(fondoInicial)}</span></div>
<div class="row bold"><span>- TOTAL 1=</span><span>${fmt(total1)}</span></div>
<div class="row indent"><span>PLATAFORMAS</span><span>${fmt(plataformas)}</span></div>
<div class="row bold"><span>- TOTAL 2=</span><span>${fmt(total2)}</span></div>
<div class="row indent"><span>TOTAL TARJETAS</span><span>${fmt(totalTarjetas)}</span></div>
<div class="row bold"><span>- TOTAL 3=</span><span>${fmt(total3)}</span></div>
<div class="row indent"><span>GASTOS</span><span>${fmt(gastosCorte)}</span></div>
<div class="row bold"><span>- TOTAL 4=</span><span>${fmt(total4)}</span></div>
<div class="row indent"><span>RETIRO DE EFECTIVO</span><span>${fmt(retiroEfectivo)}</span></div>
<div class="row bold"><span>- TOTAL 5=</span><span>${fmt(total5)}</span></div>
<div class="sep"></div>
<div class="row"><span>REALIDAD DE CAJA</span><span>${fmt(realidadCaja)}</span></div>
<div class="row bold"><span>TOTAL FINAL</span><span>${fmt(totalFinal)}</span></div>
<div class="row bold"><span>(+/-) ${diferencia >= 0 ? '- sobra' : '+ falta'}</span><span>${fmt(Math.abs(diferencia))}</span></div>
<div class="row"><span>PV=</span><span>${pv}</span></div>
<div class="sep"></div>
<div class="row bold" style="color:#b45309"><span>DEUDA PLATAFORMAS</span><span>${fmt(deudaPlataformas)}</span></div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close()},1000)}</script>
</body></html>`;
                const win = window.open('', '_blank', 'width=250,height=600');
                if (win) { win.document.write(html); win.document.close(); }
              };

              return (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Hoja de Corte Final</h4>
                  <div className="bg-white border-2 border-gray-800 rounded-lg divide-y divide-gray-200 font-mono text-xs">
                    <div className="flex justify-between px-3 py-1.5 bg-gray-900 text-white font-bold">
                      <span>+ TOTAL FORMAS PAGO</span>
                      <span>{fmtMoney(totalFormasPago)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 pl-6 text-gray-600">
                      <span>FONDO INICIAL CAJA</span>
                      <span>{fmtMoney(fondoInicial)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 font-bold bg-gray-50">
                      <span>- TOTAL 1=</span>
                      <span>{fmtMoney(total1)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 pl-6 text-gray-600">
                      <span>PLATAFORMAS</span>
                      <span>{fmtMoney(plataformas)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 font-bold bg-gray-50">
                      <span>- TOTAL 2=</span>
                      <span>{fmtMoney(total2)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 pl-6 text-gray-600">
                      <span>TOTAL TARJETAS</span>
                      <span>{fmtMoney(totalTarjetas)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 font-bold bg-gray-50">
                      <span>- TOTAL 3=</span>
                      <span>{fmtMoney(total3)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 pl-6 text-gray-600">
                      <span>GASTOS</span>
                      <span>{fmtMoney(gastosCorte)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 font-bold bg-gray-50">
                      <span>- TOTAL 4=</span>
                      <span>{fmtMoney(total4)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 pl-6 text-gray-600">
                      <span>RETIRO DE EFECTIVO</span>
                      <span>{fmtMoney(retiroEfectivo)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 font-bold bg-gray-50">
                      <span>- TOTAL 5=</span>
                      <span>{fmtMoney(total5)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 bg-blue-50 text-blue-800">
                      <span>REALIDAD DE CAJA</span>
                      <span className="font-bold">{fmtMoney(realidadCaja)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 font-bold bg-gray-100">
                      <span>TOTAL FINAL</span>
                      <span>{fmtMoney(totalFinal)}</span>
                    </div>
                    <div className={`flex justify-between px-3 py-1.5 font-bold ${diferencia >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <span>(+/-) {diferencia >= 0 ? '- sobra' : '+ falta'}</span>
                      <span>{fmtMoney(Math.abs(diferencia))}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 text-gray-600">
                      <span>PV=</span>
                      <span>{pv}</span>
                    </div>
                    {deudaPlataformas > 0 && (
                      <div className="flex justify-between px-3 py-1.5 font-bold bg-amber-50 text-amber-700">
                        <span>DEUDA PLATAFORMAS</span>
                        <span>{fmtMoney(deudaPlataformas)}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={imprimirCorte}
                    className="mt-2 w-full py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 text-sm touch-manipulation"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir Corte
                  </button>
                </div>
              );
            })()}

            {/* Notas */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Notas del cambio (opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones del cambio de turno..."
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <p className="text-xs text-gray-400 text-center mb-3">
            La caja NO se cierra. Solo se registra el cambio de responsable.
          </p>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading || loadingData}
            className={`w-full py-4 font-bold text-lg rounded-xl transition-all touch-manipulation ${
              canConfirm && !loading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Registrando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                Confirmar Cambio de Turno
              </span>
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
    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-1.5">
      <span className="font-bold text-gray-700 w-16 text-sm">{label}</span>
      <div className="flex items-center gap-1 flex-1">
        <button
          onClick={() => onChange(cantidad - 1)}
          disabled={cantidad <= 0}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 touch-manipulation disabled:opacity-30 text-sm"
        >
          -
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={cantidad || ''}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-12 text-center font-bold text-gray-900 border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="0"
        />
        <button
          onClick={() => onChange(cantidad + 1)}
          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 touch-manipulation text-sm"
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
