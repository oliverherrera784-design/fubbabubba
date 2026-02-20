'use client';

import { useState, useCallback } from 'react';
import {
  FileSpreadsheet, Download, Loader2, Calendar,
  Store, Filter, Table, BarChart3, Package,
  Users, Vault, TrendingUp,
} from 'lucide-react';

interface Sucursal {
  id: number;
  nombre: string;
}

interface ReporteTipo {
  id: string;
  nombre: string;
  descripcion: string;
  icon: typeof FileSpreadsheet;
}

const TIPOS_REPORTE: ReporteTipo[] = [
  { id: 'ventas_detalle', nombre: 'Ventas Detalle', descripcion: 'Cada orden con sus productos, precios y método de pago', icon: Table },
  { id: 'ventas_resumen', nombre: 'Ventas Resumen', descripcion: 'Totales diarios por sucursal: transacciones, ticket promedio, IVA', icon: BarChart3 },
  { id: 'productos', nombre: 'Productos Vendidos', descripcion: 'Ranking de productos por unidades vendidas e ingresos', icon: TrendingUp },
  { id: 'inventario', nombre: 'Inventario Actual', descripcion: 'Stock actual por sucursal, alertas de stock bajo', icon: Package },
  { id: 'empleados', nombre: 'Ventas por Empleado', descripcion: 'Rendimiento por empleado: transacciones y total vendido', icon: Users },
  { id: 'cierres_caja', nombre: 'Cierres de Caja', descripcion: 'Historial de cierres con montos y diferencias', icon: Vault },
];

const PERIODOS = [
  { id: 'hoy', nombre: 'Hoy' },
  { id: 'semana', nombre: 'Esta semana' },
  { id: 'mes', nombre: 'Este mes' },
  { id: 'mes_pasado', nombre: 'Mes pasado' },
  { id: 'personalizado', nombre: 'Personalizado' },
];

function calcularFechas(periodo: string): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = new Date(hoy);
  hasta.setHours(23, 59, 59, 999);

  let desde = new Date(hoy);

  switch (periodo) {
    case 'hoy':
      desde.setHours(0, 0, 0, 0);
      break;
    case 'semana': {
      const dia = hoy.getDay();
      desde.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1));
      desde.setHours(0, 0, 0, 0);
      break;
    }
    case 'mes':
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      break;
    case 'mes_pasado':
      desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      hasta.setTime(new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59, 999).getTime());
      break;
    default:
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  return {
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
  };
}

function arrayToCSV(columnas: string[], datos: Record<string, unknown>[]): string {
  const escape = (val: unknown): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columnas.map(escape).join(',');
  const rows = datos.map(row =>
    columnas.map(col => escape(row[col])).join(',')
  );

  return [header, ...rows].join('\n');
}

function descargarCSV(csv: string, filename: string) {
  const BOM = '\uFEFF'; // Para que Excel reconozca acentos
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportesPage() {
  const [tipoSeleccionado, setTipoSeleccionado] = useState('ventas_detalle');
  const [periodo, setPeriodo] = useState('mes');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(false);
  const [sucursalesLoaded, setSucursalesLoaded] = useState(false);

  // Preview data
  const [previewData, setPreviewData] = useState<{
    titulo: string;
    columnas: string[];
    datos: Record<string, unknown>[];
    totalRegistros: number;
  } | null>(null);

  // Cargar sucursales una vez
  const cargarSucursales = useCallback(async () => {
    if (sucursalesLoaded) return;
    try {
      const res = await fetch('/api/sucursales');
      const data = await res.json();
      setSucursales(data.data || []);
      setSucursalesLoaded(true);
    } catch (err) {
      console.error('Error cargando sucursales:', err);
    }
  }, [sucursalesLoaded]);

  // Cargar sucursales al montar
  useState(() => {
    cargarSucursales();
  });

  const generarReporte = async (descargar: boolean) => {
    setLoading(true);
    try {
      const fechas = periodo === 'personalizado'
        ? {
            desde: fechaDesde ? new Date(fechaDesde).toISOString() : '',
            hasta: fechaHasta ? new Date(fechaHasta + 'T23:59:59').toISOString() : '',
          }
        : calcularFechas(periodo);

      const params = new URLSearchParams({ tipo: tipoSeleccionado });
      if (fechas.desde) params.set('desde', fechas.desde);
      if (fechas.hasta) params.set('hasta', fechas.hasta);
      if (sucursalId) params.set('sucursal_id', sucursalId);

      const res = await fetch(`/api/reportes?${params}`);
      const data = await res.json();

      if (!data.success) {
        alert('Error: ' + data.error);
        return;
      }

      if (descargar) {
        const csv = arrayToCSV(data.columnas, data.datos);
        const tipoInfo = TIPOS_REPORTE.find(t => t.id === tipoSeleccionado);
        const fecha = new Date().toISOString().split('T')[0];
        const filename = `${tipoInfo?.nombre || 'reporte'}_${fecha}.csv`;
        descargarCSV(csv, filename);
      } else {
        setPreviewData({
          titulo: data.titulo,
          columnas: data.columnas,
          datos: data.datos,
          totalRegistros: data.totalRegistros,
        });
      }
    } catch (err) {
      console.error('Error generando reporte:', err);
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const tipoActual = TIPOS_REPORTE.find(t => t.id === tipoSeleccionado);
  const noNecesitaFechas = tipoSeleccionado === 'inventario';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-100 rounded-xl">
          <FileSpreadsheet className="w-7 h-7 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">Genera y descarga reportes en CSV para Excel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Tipo de reporte */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Tipo de Reporte
            </h2>
            <div className="space-y-2">
              {TIPOS_REPORTE.map((tipo) => {
                const Icon = tipo.icon;
                const selected = tipoSeleccionado === tipo.id;
                return (
                  <button
                    key={tipo.id}
                    onClick={() => {
                      setTipoSeleccionado(tipo.id);
                      setPreviewData(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selected
                        ? 'bg-purple-50 border-2 border-purple-300 shadow-sm'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${selected ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className={`font-medium text-sm ${selected ? 'text-purple-700' : 'text-gray-700'}`}>
                        {tipo.nombre}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-6.5">{tipo.descripcion}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Filtros
            </h2>

            {!noNecesitaFechas && (
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Periodo</label>
                <select
                  value={periodo}
                  onChange={(e) => {
                    setPeriodo(e.target.value);
                    setPreviewData(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {PERIODOS.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>

                {periodo === 'personalizado' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="text-xs text-gray-500">Desde</label>
                      <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Hasta</label>
                      <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5" />
                Sucursal
              </label>
              <select
                value={sucursalId}
                onChange={(e) => {
                  setSucursalId(e.target.value);
                  setPreviewData(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* Botones */}
            <div className="space-y-2">
              <button
                onClick={() => generarReporte(false)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Table className="w-4 h-4" />
                )}
                Vista Previa
              </button>
              <button
                onClick={() => generarReporte(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Descargar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Panel derecho: Preview */}
        <div className="lg:col-span-2">
          {previewData ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header del preview */}
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{previewData.titulo}</h3>
                  <p className="text-sm text-gray-500">{previewData.totalRegistros} registros</p>
                </div>
                <button
                  onClick={() => {
                    const csv = arrayToCSV(previewData.columnas, previewData.datos);
                    const fecha = new Date().toISOString().split('T')[0];
                    descargarCSV(csv, `${previewData.titulo}_${fecha}.csv`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {previewData.columnas.map((col) => (
                        <th key={col} className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap border-b border-gray-200">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.datos.slice(0, 100).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {previewData.columnas.map((col) => (
                          <td key={col} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                            {typeof row[col] === 'number'
                              ? (col.includes('Total') || col.includes('Precio') || col.includes('Ingreso') || col.includes('IVA') || col.includes('Descuento') || col.includes('Monto') || col.includes('Ticket') || col.includes('Vendido') || col.includes('Diferencia'))
                                ? `$${Number(row[col]).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                                : String(row[col])
                              : String(row[col] ?? '-')
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.datos.length > 100 && (
                  <div className="px-4 py-3 bg-yellow-50 text-yellow-700 text-sm text-center border-t">
                    Mostrando 100 de {previewData.totalRegistros} registros. Descarga el CSV para ver todos.
                  </div>
                )}
              </div>

              {previewData.datos.length === 0 && (
                <div className="px-4 py-12 text-center text-gray-500">
                  No hay datos para el periodo y filtros seleccionados
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {tipoActual && <tipoActual.icon className="w-8 h-8 text-purple-400" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{tipoActual?.nombre}</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">{tipoActual?.descripcion}</p>
              <p className="text-gray-400 text-sm">
                Selecciona los filtros y haz clic en &quot;Vista Previa&quot; o &quot;Descargar CSV&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
