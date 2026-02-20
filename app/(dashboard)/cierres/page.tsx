'use client';

import { useState, useEffect, useMemo } from 'react';
import { Vault, Loader2, Eye, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface Caja {
  id: string;
  sucursal_id: number;
  monto_apertura: number;
  monto_cierre: number | null;
  efectivo_contado: number | null;
  notas: string | null;
  estado: string;
  opened_at: string;
  closed_at: string | null;
  empleado_nombre?: string | null;
}

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
  efectivo_contado: number | null;
  descuadre: number | null;
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
}

const PLATAFORMA_LABELS: Record<string, string> = {
  uber_eats: 'Uber Eats', rappi: 'Rappi', didi: 'Didi',
};

const SUBCATEGORIAS_LABELS: Record<string, string> = {
  insumos: 'Insumos', proveedor: 'Proveedor', renta: 'Renta',
  nomina: 'Nómina', servicios: 'Servicios', limpieza: 'Limpieza', otros: 'Otros',
};

function getTimeSince(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000 / 60);
  if (diff < 60) return `${diff}min`;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}h ${mins}m`;
}

export default function CierresPage() {
  const { user, canAccessAll } = useAuth();
  const [cajasAbiertas, setCajasAbiertas] = useState<Caja[]>([]);
  const [cierres, setCierres] = useState<Caja[]>([]);
  const [sucursales, setSucursales] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sucursalFiltro, setSucursalFiltro] = useState(
    !canAccessAll && user?.sucursal_id ? String(user.sucursal_id) : 'todas'
  );
  const [detalleCaja, setDetalleCaja] = useState<string | null>(null);
  const [cuadre, setCuadre] = useState<{ caja: Caja; resumen: CuadreResumen } | null>(null);
  const [loadingCuadre, setLoadingCuadre] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (sucursalFiltro !== 'todas') params.set('sucursal_id', sucursalFiltro);
        params.set('limit', '50');

        const [cierresRes, sucRes, abiertasRes] = await Promise.all([
          fetch(`/api/pos/caja/cierres?${params}`),
          fetch('/api/sucursales'),
          fetch('/api/pos/caja/abiertas'),
        ]);

        const [cierresData, sucData, abiertasData] = await Promise.all([cierresRes.json(), sucRes.json(), abiertasRes.json()]);
        setCierres(cierresData.cierres || []);
        setSucursales(sucData.data || []);
        setCajasAbiertas(abiertasData.cajas || []);
      } catch (e) {
        console.error('Error cargando cierres:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sucursalFiltro]);

  const sucursalMap = useMemo(
    () => Object.fromEntries(sucursales.map(s => [s.id, s.nombre])),
    [sucursales]
  );

  const handleVerDetalle = async (cajaId: string) => {
    if (detalleCaja === cajaId) {
      setDetalleCaja(null);
      setCuadre(null);
      return;
    }
    setDetalleCaja(cajaId);
    setLoadingCuadre(true);
    try {
      const res = await fetch(`/api/pos/caja/cuadre?caja_id=${cajaId}`);
      const data = await res.json();
      setCuadre({ caja: data.caja, resumen: data.resumen });
    } catch (e) {
      console.error('Error cargando cuadre:', e);
    } finally {
      setLoadingCuadre(false);
    }
  };

  const fmtMoney = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cierres de Caja</h1>
        <p className="text-gray-600 mt-1">Historial de cuadres de efectivo</p>
      </div>

      {/* Filtro */}
      <select
        value={sucursalFiltro}
        onChange={(e) => setSucursalFiltro(e.target.value)}
        disabled={!canAccessAll}
        className={`px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:outline-none ${canAccessAll ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
      >
        {canAccessAll && <option value="todas">Todas las sucursales</option>}
        {sucursales.map(s => (
          <option key={s.id} value={s.id}>{s.nombre}</option>
        ))}
      </select>

      {/* Turnos abiertos */}
      {cajasAbiertas.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Turnos Abiertos ({cajasAbiertas.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cajasAbiertas.map(caja => (
              <div key={caja.id} className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900">
                    {sucursalMap[caja.sucursal_id] || `Sucursal ${caja.sucursal_id}`}
                  </p>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    Abierta
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {caja.empleado_nombre && (
                    <div className="flex justify-between">
                      <span>En turno</span>
                      <span className="font-semibold text-purple-700">{caja.empleado_nombre}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Apertura</span>
                    <span className="font-medium text-gray-900">
                      {new Date(caja.opened_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiempo</span>
                    <span className="font-medium text-gray-900">{getTimeSince(caja.opened_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fondo</span>
                    <span className="font-medium text-gray-900">{fmtMoney(caja.monto_apertura)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de cierres */}
      {cierres.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <Vault className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay cierres de caja registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cierres.map(cierre => (
            <div key={cierre.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Fila principal */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Vault className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {sucursalMap[cierre.sucursal_id] || `Sucursal ${cierre.sucursal_id}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {cierre.closed_at && new Date(cierre.closed_at).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Efectivo contado</p>
                    <p className="font-bold text-gray-900">
                      {cierre.efectivo_contado !== null ? fmtMoney(cierre.efectivo_contado) : '-'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleVerDetalle(cierre.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      detalleCaja === cierre.id ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Detalle expandido */}
              {detalleCaja === cierre.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  {loadingCuadre ? (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
                    </div>
                  ) : cuadre ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Cajón de efectivo */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Cajón de Efectivo</h4>
                        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 text-sm">
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-gray-600">Fondo de caja</span>
                            <span>{fmtMoney(cuadre.resumen.fondo_apertura)}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-gray-600">Cobros en efectivo</span>
                            <span>{fmtMoney(cuadre.resumen.cobros_efectivo)}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-gray-600">Reembolsos</span>
                            <span>{fmtMoney(cuadre.resumen.reembolsos_efectivo)}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-gray-600">Depositado</span>
                            <span>{fmtMoney(cuadre.resumen.depositos)}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-gray-600">Retiro de efectivo</span>
                            <span className={cuadre.resumen.retiros > 0 ? 'text-red-600' : ''}>
                              {cuadre.resumen.retiros > 0 ? `-${fmtMoney(cuadre.resumen.retiros)}` : fmtMoney(0)}
                            </span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-gray-600">Gastos operativos</span>
                            <span className={(cuadre.resumen.gastos || 0) > 0 ? 'text-red-600' : ''}>
                              {(cuadre.resumen.gastos || 0) > 0 ? `-${fmtMoney(cuadre.resumen.gastos)}` : fmtMoney(0)}
                            </span>
                          </div>
                          <div className="flex justify-between px-3 py-2 font-bold">
                            <span>Efectivo teórico</span>
                            <span>{fmtMoney(cuadre.resumen.efectivo_teorico)}</span>
                          </div>
                          {(cuadre.resumen.sobreprecio_plataformas || 0) > 0 && (
                            <div className="flex justify-between px-3 py-1.5 text-xs text-amber-700">
                              <span className="pl-3">↳ Sobreprecio plataforma</span>
                              <span>{fmtMoney(cuadre.resumen.sobreprecio_plataformas!)}</span>
                            </div>
                          )}
                          <div className="flex justify-between px-3 py-2 font-bold">
                            <span>Efectivo real</span>
                            <span>{cuadre.resumen.efectivo_contado !== null ? fmtMoney(cuadre.resumen.efectivo_contado) : '-'}</span>
                          </div>
                          <div className={`flex justify-between px-3 py-2 font-bold ${
                            cuadre.resumen.descuadre !== null && Math.abs(cuadre.resumen.descuadre) > 0.01
                              ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'
                          }`}>
                            <span>Descuadre</span>
                            <span>
                              {cuadre.resumen.descuadre !== null
                                ? `${cuadre.resumen.descuadre >= 0 ? '+' : ''}${fmtMoney(cuadre.resumen.descuadre)}`
                                : '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Desglose de gastos */}
                      {(cuadre.resumen.gastos || 0) > 0 && cuadre.resumen.gastos_por_categoria && (
                        <div className="md:col-span-2">
                          <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Desglose de Gastos</h4>
                          <div className="bg-white border border-amber-200 rounded-lg divide-y divide-amber-100 text-sm">
                            {Object.entries(cuadre.resumen.gastos_por_categoria).map(([cat, data]) => (
                              <div key={cat}>
                                <div className="flex justify-between px-3 py-2 font-bold">
                                  <span className="text-amber-800">{SUBCATEGORIAS_LABELS[cat] || cat}</span>
                                  <span className="text-amber-700">-{fmtMoney(data.total)}</span>
                                </div>
                                {data.movimientos.map((mov: { monto: number; comentario: string | null; created_at: string }, i: number) => (
                                  <div key={i} className="flex justify-between px-3 py-1 text-xs pl-6">
                                    <span className="text-gray-500 truncate flex-1 mr-2">
                                      {mov.comentario || 'Sin detalle'}
                                      <span className="text-gray-400 ml-1">
                                        · {new Date(mov.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </span>
                                    <span className="text-red-600 font-medium">-{fmtMoney(mov.monto)}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                            <div className="flex justify-between px-3 py-2 font-bold bg-amber-50">
                              <span className="text-amber-900">Total gastos</span>
                              <span className="text-amber-700">-{fmtMoney(cuadre.resumen.gastos)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Resumen de ventas */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide">Resumen de Ventas</h4>
                        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 text-sm">
                          <div className="flex justify-between px-3 py-2 font-bold">
                            <span>Ventas brutas</span>
                            <span>{fmtMoney(cuadre.resumen.ventas_brutas)}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-gray-600">Reembolsos</span>
                            <span>{fmtMoney(cuadre.resumen.reembolsos)}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-gray-600">Descuentos</span>
                            <span>{fmtMoney(cuadre.resumen.descuentos)}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2 font-bold text-green-700 bg-green-50">
                            <span>Ventas netas</span>
                            <span>{fmtMoney(cuadre.resumen.ventas_netas)}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-gray-600 pl-3">Efectivo</span>
                            <span>{fmtMoney(cuadre.resumen.por_metodo.efectivo)}</span>
                          </div>
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-gray-600 pl-3">Tarjeta</span>
                            <span>{fmtMoney(cuadre.resumen.por_metodo.tarjeta)}</span>
                          </div>
                          {(cuadre.resumen.comision_tarjeta || 0) > 0 && (
                            <>
                              <div className="flex justify-between px-3 py-2">
                                <span className="text-red-600 pl-6">Comisión MP (4.05%)</span>
                                <span className="text-red-600">-{fmtMoney(cuadre.resumen.comision_tarjeta)}</span>
                              </div>
                              <div className="flex justify-between px-3 py-2">
                                <span className="text-gray-600 pl-6">Neto tarjeta</span>
                                <span>{fmtMoney(cuadre.resumen.ingreso_neto_tarjeta)}</span>
                              </div>
                            </>
                          )}
                          {(cuadre.resumen.por_metodo.app_plataforma || 0) > 0 && (
                            <div className="flex justify-between px-3 py-2">
                              <span className="text-gray-600 pl-3">App Plataforma</span>
                              <span>{fmtMoney(cuadre.resumen.por_metodo.app_plataforma)}</span>
                            </div>
                          )}
                          <div className="flex justify-between px-3 py-2">
                            <span className="text-gray-600">Órdenes</span>
                            <span>{cuadre.resumen.total_ordenes} completadas, {cuadre.resumen.total_canceladas} canceladas</span>
                          </div>
                          {/* Plataformas de Delivery */}
                          {cuadre.resumen.por_plataforma && Object.keys(cuadre.resumen.por_plataforma).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="px-3 py-1 font-bold text-sm text-gray-700">Plataformas</div>
                              {Object.entries(cuadre.resumen.por_plataforma).map(([plat, data]) => (
                                <div key={plat} className="px-3 py-1.5">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 pl-3">{PLATAFORMA_LABELS[plat] || plat}</span>
                                    <span>{fmtMoney(data.total_plataforma || data.total)} ({data.ordenes})</span>
                                  </div>
                                  {data.sobreprecio > 0 && (
                                    <div className="flex justify-between text-xs text-amber-600 pl-6">
                                      <span>Sobreprecio</span>
                                      <span>{fmtMoney(data.sobreprecio)}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {cierre.notas && (
                          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-yellow-700">Notas:</p>
                            <p className="text-sm text-yellow-800">{cierre.notas}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Error cargando datos</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
