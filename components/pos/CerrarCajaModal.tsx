'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Lock, Loader2, Printer } from 'lucide-react';

interface GastoCategoria {
  total: number;
  movimientos: { monto: number; comentario: string | null; created_at: string }[];
}

interface CuadreResumen {
  fondo_apertura: number;
  cobros_efectivo: number;
  reembolsos_efectivo: number;
  depositos: number;
  retiros: number;
  gastos: number;
  gastos_por_categoria: Record<string, GastoCategoria>;
  efectivo_teorico: number;
  ventas_brutas: number;
  reembolsos: number;
  descuentos: number;
  ventas_netas: number;
  por_metodo: { efectivo: number; tarjeta: number; app_plataforma: number };
  comision_tarjeta: number;
  ingreso_neto_tarjeta: number;
  por_plataforma?: Record<string, {
    ordenes: number;
    total: number;
    total_plataforma: number;
    sobreprecio: number;
    app: number;
    efectivo: number;
    comision_app: number;
    comision_efectivo: number;
  }>;
  sobreprecio_plataformas?: number;
  ventas_directas?: number;
  total_ordenes: number;
  total_canceladas: number;
  piezas_vendidas?: number;
}

const PLATAFORMA_LABELS: Record<string, string> = {
  uber_eats: 'Uber Eats',
  rappi: 'Rappi',
  didi: 'Didi',
};

interface EmpleadoBasico {
  id: number;
  nombre: string;
}

interface CerrarCajaModalProps {
  cajaId: string;
  sucursalNombre: string;
  openedAt: string;
  empleados: EmpleadoBasico[];
  onConfirm: (efectivoContado: number, notas?: string, recibeId?: number) => void;
  onClose: () => void;
  loading?: boolean;
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

const SUBCATEGORIAS_LABELS: Record<string, string> = {
  insumos: 'Insumos',
  proveedor: 'Proveedor',
  renta: 'Renta',
  nomina: 'Nómina',
  servicios: 'Servicios',
  limpieza: 'Limpieza',
  otros: 'Otros',
};

export function CerrarCajaModal({
  cajaId,
  sucursalNombre,
  openedAt,
  empleados,
  onConfirm,
  onClose,
  loading,
}: CerrarCajaModalProps) {
  const [countMode, setCountMode] = useState<'simple' | 'denominaciones'>('denominaciones');
  const [efectivoContado, setEfectivoContado] = useState('');
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [notas, setNotas] = useState('');
  const [recibeId, setRecibeId] = useState<number | ''>('');
  const [resumen, setResumen] = useState<CuadreResumen | null>(null);
  const [loadingCuadre, setLoadingCuadre] = useState(true);

  const efectivoSimple = parseFloat(efectivoContado) || 0;

  const totalDenominaciones = useMemo(() => {
    return DENOMINACIONES.reduce((sum, d) => sum + (cantidades[d.valor] || 0) * d.valor, 0);
  }, [cantidades]);

  const efectivoNum = countMode === 'simple' ? efectivoSimple : totalDenominaciones;
  const descuadre = resumen ? efectivoNum - resumen.efectivo_teorico : 0;

  const updateCantidad = (valor: number, cant: number) => {
    setCantidades(prev => ({ ...prev, [valor]: Math.max(0, cant) }));
  };

  useEffect(() => {
    async function loadCuadre() {
      try {
        const res = await fetch(`/api/pos/caja/cuadre?caja_id=${cajaId}`);
        const data = await res.json();
        setResumen(data.resumen);
      } catch (e) {
        console.error('Error cargando cuadre:', e);
      } finally {
        setLoadingCuadre(false);
      }
    }
    loadCuadre();
  }, [cajaId]);

  const TOPE_CAJA = 1850;
  const superaTope = efectivoNum > TOPE_CAJA;

  const handleConfirm = () => {
    if (loading) return;
    if (superaTope) {
      alert(`No puedes dejar más de $${TOPE_CAJA.toLocaleString()} en caja. Haz un retiro antes de cerrar.`);
      return;
    }
    onConfirm(efectivoNum, notas || undefined, recibeId || undefined);
  };

  const fmtMoney = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-red-600 text-white rounded-t-2xl flex-shrink-0">
          <div>
            <h3 className="font-bold text-lg">Cuadre de Efectivo</h3>
            <p className="text-red-200 text-sm">{sucursalNombre}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-500 rounded-lg touch-manipulation">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingCuadre ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-gray-500 mt-2">Calculando cuadre...</p>
          </div>
        ) : resumen ? (
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {/* Info del turno */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Abierto:</span>
                <span className="font-medium">{new Date(openedAt).toLocaleString('es-MX', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Órdenes:</span>
                <span className="font-medium">{resumen.total_ordenes} completadas, {resumen.total_canceladas} canceladas</span>
              </div>
            </div>

            {/* Cajón de efectivo */}
            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Cajón de Efectivo</h4>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                <Row label="Fondo de caja anterior" value={fmtMoney(resumen.fondo_apertura)} />
                <Row label="Cobros en efectivo" value={fmtMoney(resumen.cobros_efectivo)} />
                <Row label="Reembolsos en efectivo" value={fmtMoney(resumen.reembolsos_efectivo)} />
                <Row label="Depositado" value={fmtMoney(resumen.depositos)} />
                <Row label="Retiro de efectivo" value={resumen.retiros > 0 ? `-${fmtMoney(resumen.retiros)}` : fmtMoney(0)} negative={resumen.retiros > 0} />
                <Row label="Gastos operativos" value={resumen.gastos > 0 ? `-${fmtMoney(resumen.gastos)}` : fmtMoney(0)} negative={resumen.gastos > 0} />
                <Row label="Efectivo teórico en caja" value={fmtMoney(resumen.efectivo_teorico)} bold />
                {(resumen.sobreprecio_plataformas || 0) > 0 && (
                  <Row label="↳ Del cual es sobreprecio plataforma" value={fmtMoney(resumen.sobreprecio_plataformas!)} indent />
                )}
              </div>
            </div>

            {/* Desglose de gastos */}
            {resumen.gastos > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Desglose de Gastos</h4>
                <div className="bg-white border border-amber-200 rounded-lg divide-y divide-amber-100">
                  {Object.entries(resumen.gastos_por_categoria).map(([cat, data]) => (
                    <div key={cat}>
                      <div className="flex justify-between px-3 py-2 text-sm font-bold">
                        <span className="text-amber-800">{SUBCATEGORIAS_LABELS[cat] || cat}</span>
                        <span className="text-amber-700">-{fmtMoney(data.total)}</span>
                      </div>
                      {data.movimientos.map((mov, i) => (
                        <div key={i} className="flex justify-between px-3 py-1.5 text-xs pl-6">
                          <span className="text-gray-500 truncate flex-1 mr-2">
                            {mov.comentario || 'Sin detalle'}
                            <span className="text-gray-400 ml-1">
                              · {new Date(mov.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </span>
                          <span className="text-red-600 font-medium whitespace-nowrap">-{fmtMoney(mov.monto)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="flex justify-between px-3 py-2 text-sm font-bold bg-amber-50">
                    <span className="text-amber-900">Total gastos</span>
                    <span className="text-amber-700">-{fmtMoney(resumen.gastos)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Conteo de efectivo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Cantidad de efectivo real
                </label>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setCountMode('simple')}
                    className={`px-2 py-1 text-xs font-medium rounded transition-all touch-manipulation ${
                      countMode === 'simple' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Directo
                  </button>
                  <button
                    onClick={() => setCountMode('denominaciones')}
                    className={`px-2 py-1 text-xs font-medium rounded transition-all touch-manipulation ${
                      countMode === 'denominaciones' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Denominaciones
                  </button>
                </div>
              </div>

              {countMode === 'simple' ? (
                <input
                  type="number"
                  inputMode="decimal"
                  value={efectivoContado}
                  onChange={(e) => setEfectivoContado(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 border border-gray-300 rounded-xl text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoFocus
                />
              ) : (
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Billetes</h5>
                    <div className="space-y-1.5">
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
                  </div>
                  <div>
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
                  </div>
                  <div className="bg-red-50 p-3 rounded-xl flex justify-between items-center">
                    <span className="font-semibold text-red-700">Total contado:</span>
                    <span className="text-xl font-bold text-red-700">{fmtMoney(totalDenominaciones)}</span>
                  </div>
                </div>
              )}

              {efectivoNum > 0 && (
                <>
                  <div className={`mt-2 p-3 rounded-lg text-center font-bold text-lg ${
                    Math.abs(descuadre) < 0.01
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    Descuadre: {descuadre >= 0 ? '+' : ''}{fmtMoney(descuadre)}
                  </div>
                  {superaTope && (
                    <div className="mt-2 p-3 rounded-lg text-center font-bold text-sm bg-amber-50 text-amber-700 border border-amber-300">
                      El efectivo ({fmtMoney(efectivoNum)}) supera el tope de {fmtMoney(TOPE_CAJA)}. Haz un retiro antes de cerrar.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* === HOJA DE CORTE FINAL === */}
            {efectivoNum > 0 && (() => {
              const totalFormasPago = resumen.por_metodo.efectivo + resumen.por_metodo.tarjeta + resumen.por_metodo.app_plataforma;
              const fondoInicial = resumen.fondo_apertura;
              const depositosCorte = resumen.depositos;
              const total1 = totalFormasPago + fondoInicial + depositosCorte;
              const plataformas = resumen.por_metodo.app_plataforma;
              const total2 = total1 - plataformas;
              const totalTarjetas = resumen.por_metodo.tarjeta;
              const total3 = total2 - totalTarjetas;
              const gastosCorte = resumen.gastos;
              const total4 = total3 - gastosCorte;
              const retiroEfectivo = resumen.retiros;
              const total5 = total4 - retiroEfectivo;
              const realidadCaja = efectivoNum;
              const totalFinal = total5 - realidadCaja;
              const deudaPlataformas = resumen.sobreprecio_plataformas || 0;
              const pv = resumen.piezas_vendidas || 0;

              const recibeNombre = recibeId ? empleados.find(e => e.id === recibeId)?.nombre : null;

              const imprimirCorte = () => {
                const ahora = new Date();
                const fechaStr = ahora.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const horaStr = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                const fmt = (n: number) => '$' + n.toFixed(2);
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Corte Final</title>
<style>@page{size:58mm auto;margin:0}*{margin:0;padding:0;box-sizing:border-box}
body{width:58mm;font-family:'Courier New',monospace;font-size:11px;line-height:1.4;padding:3mm 2mm;color:#000}
h2{text-align:center;font-size:14px;margin-bottom:4px}
.row{display:flex;justify-content:space-between}.bold{font-weight:bold}
.sep{border-top:1px dashed #000;margin:3px 0}.indent{padding-left:8px}
.small{font-size:9px;color:#000}
</style></head><body>
<h2>HOJA CORTE FINAL</h2>
<div class="row"><span>FECHA: ${fechaStr} ${horaStr}</span></div>
<div class="row"><span>SUCURSAL: ${sucursalNombre}</span></div>
${recibeNombre ? `<div class="row"><span>RECIBE: ${recibeNombre}</span></div>` : ''}
<div class="sep"></div>
<div class="row bold"><span>+ TOTAL FORMAS PAGO</span><span>${fmt(totalFormasPago)}</span></div>
<div class="small indent">Efvo:${fmt(resumen.por_metodo.efectivo)} Tarj:${fmt(resumen.por_metodo.tarjeta)} Plat:${fmt(resumen.por_metodo.app_plataforma)}</div>
<div class="row indent"><span>FONDO INICIAL CAJA</span><span>${fmt(fondoInicial)}</span></div>
${depositosCorte > 0 ? `<div class="row indent"><span>DEPOSITOS</span><span>${fmt(depositosCorte)}</span></div>` : ''}
<div class="row bold"><span>= TOTAL 1</span><span>${fmt(total1)}</span></div>
<div class="row indent"><span>PLATAFORMAS</span><span>${fmt(plataformas)}</span></div>
<div class="row bold"><span>= TOTAL 2</span><span>${fmt(total2)}</span></div>
<div class="row indent"><span>TOTAL TARJETAS</span><span>${fmt(totalTarjetas)}</span></div>
<div class="row bold"><span>= TOTAL 3</span><span>${fmt(total3)}</span></div>
<div class="row indent"><span>GASTOS</span><span>${fmt(gastosCorte)}</span></div>
<div class="row bold"><span>= TOTAL 4</span><span>${fmt(total4)}</span></div>
<div class="row indent"><span>RETIRO DE EFECTIVO</span><span>${fmt(retiroEfectivo)}</span></div>
<div class="row bold"><span>= EFECTIVO TEORICO</span><span>${fmt(total5)}</span></div>
<div class="sep"></div>
<div class="row"><span>REALIDAD DE CAJA</span><span>${fmt(realidadCaja)}</span></div>
<div class="row bold"><span>TOTAL FINAL ${totalFinal > 0.01 ? '(+ falta)' : totalFinal < -0.01 ? '(- sobra)' : '(cuadra)'}</span><span>${fmt(Math.abs(totalFinal))}</span></div>
<div class="row"><span>PV=</span><span>${pv}</span></div>
${deudaPlataformas > 0 ? `<div class="sep"></div><div class="row bold"><span>DEUDA PLATAFORMAS</span><span>${fmt(deudaPlataformas)}</span></div>` : ''}
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
                    <div className="flex justify-between px-3 py-0.5 pl-8 text-gray-700 text-[10px]">
                      <span>Efvo: {fmtMoney(resumen.por_metodo.efectivo)} | Tarj: {fmtMoney(resumen.por_metodo.tarjeta)} | Plat: {fmtMoney(resumen.por_metodo.app_plataforma)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 pl-6 text-gray-900">
                      <span>FONDO INICIAL CAJA</span>
                      <span>{fmtMoney(fondoInicial)}</span>
                    </div>
                    {depositosCorte > 0 && (
                      <div className="flex justify-between px-3 py-1 pl-6 text-gray-900">
                        <span>DEPÓSITOS</span>
                        <span>{fmtMoney(depositosCorte)}</span>
                      </div>
                    )}
                    <div className="flex justify-between px-3 py-1.5 font-bold bg-gray-50">
                      <span>= TOTAL 1</span>
                      <span>{fmtMoney(total1)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 pl-6 text-gray-900">
                      <span>PLATAFORMAS</span>
                      <span>{fmtMoney(plataformas)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 font-bold bg-gray-50">
                      <span>= TOTAL 2</span>
                      <span>{fmtMoney(total2)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 pl-6 text-gray-900">
                      <span>TOTAL TARJETAS</span>
                      <span>{fmtMoney(totalTarjetas)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 font-bold bg-gray-50">
                      <span>= TOTAL 3</span>
                      <span>{fmtMoney(total3)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 pl-6 text-gray-900">
                      <span>GASTOS</span>
                      <span>{fmtMoney(gastosCorte)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 font-bold bg-gray-50">
                      <span>= TOTAL 4</span>
                      <span>{fmtMoney(total4)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 pl-6 text-gray-900">
                      <span>RETIRO DE EFECTIVO</span>
                      <span>{fmtMoney(retiroEfectivo)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 font-bold bg-purple-50 text-purple-800">
                      <span>= EFECTIVO TEÓRICO</span>
                      <span>{fmtMoney(total5)}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1.5 bg-blue-50 text-blue-800">
                      <span>REALIDAD DE CAJA</span>
                      <span className="font-bold">{fmtMoney(realidadCaja)}</span>
                    </div>
                    <div className={`flex justify-between px-3 py-1.5 font-bold ${Math.abs(totalFinal) < 0.01 ? 'bg-green-50 text-green-700' : totalFinal > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      <span>TOTAL FINAL {totalFinal > 0.01 ? '(+ falta)' : totalFinal < -0.01 ? '(- sobra)' : '(cuadra)'}</span>
                      <span>{fmtMoney(Math.abs(totalFinal))}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1 text-gray-900">
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

            {/* Quién recibe */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">¿Quién recibe el efectivo?</label>
              <select
                value={recibeId}
                onChange={(e) => setRecibeId(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Selecciona quién recibe...</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>

            {/* Notas */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Notas (opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones del turno..."
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">Error cargando datos del cuadre</div>
        )}

        {/* Botón cerrar */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={handleConfirm}
            disabled={loading || loadingCuadre || superaTope}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl transition-all touch-manipulation disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Cerrando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                Cerrar Caja
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, indent, negative }: {
  label: string; value: string; bold?: boolean; indent?: boolean; negative?: boolean;
}) {
  return (
    <div className={`flex justify-between px-3 py-2 text-sm ${indent ? 'pl-6' : ''}`}>
      <span className={`${bold ? 'font-bold text-gray-900' : 'text-gray-600'} ${indent ? 'text-gray-500' : ''}`}>
        {label}
      </span>
      <span className={`${bold ? 'font-bold text-gray-900' : 'text-gray-800'} ${negative ? 'text-red-600' : ''}`}>
        {value}
      </span>
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
          className="w-12 text-center font-bold text-gray-900 border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
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
