'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Loader2, Edit3, ToggleLeft, ToggleRight,
  KeyRound, X, Eye, EyeOff, Store, Shield,
} from 'lucide-react';
import { useAuth, ROL_LABELS, type Rol } from '@/lib/auth';

interface Empleado {
  id: number;
  nombre: string;
  sucursal_id: number | null;
  puesto: string | null;
  pin: string | null;
  has_pin: boolean;
  rol: Rol | null;
  activo: boolean;
  created_at: string;
}

const ROL_COLORS: Record<Rol, string> = {
  admin: 'bg-red-50 text-red-700 border-red-200',
  gerente: 'bg-purple-50 text-purple-700 border-purple-200',
  gerente_sucursal: 'bg-blue-50 text-blue-700 border-blue-200',
  cajero: 'bg-gray-50 text-gray-600 border-gray-200',
};

interface Sucursal {
  id: number;
  nombre: string;
}

export default function EmpleadosPage() {
  const { user, canAccessAll } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactivos, setShowInactivos] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Empleado | null>(null);

  const loadData = useCallback(async () => {
    try {
      const params = showInactivos ? '?all=true' : '';
      const [empRes, sucRes] = await Promise.all([
        fetch(`/api/empleados${params}`),
        fetch('/api/sucursales'),
      ]);
      const [empData, sucData] = await Promise.all([empRes.json(), sucRes.json()]);
      setEmpleados(empData.empleados || []);
      setSucursales(sucData.data || []);
    } catch (e) {
      console.error('Error cargando empleados:', e);
    } finally {
      setLoading(false);
    }
  }, [showInactivos]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActivo = useCallback(async (emp: Empleado) => {
    try {
      const res = await fetch('/api/empleados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emp.id, activo: !emp.activo }),
      });
      const data = await res.json();
      if (data.success) {
        setEmpleados(prev =>
          prev.map(e => e.id === emp.id ? { ...e, activo: !e.activo } : e)
        );
      }
    } catch (e) {
      console.error('Error:', e);
    }
  }, []);

  const handleEdit = useCallback((emp: Empleado) => {
    setEditando(emp);
    setShowForm(true);
  }, []);

  const handleFormDone = useCallback(() => {
    setShowForm(false);
    setEditando(null);
    loadData();
  }, [loadData]);

  const sucursalMap = Object.fromEntries(sucursales.map(s => [s.id, s.nombre]));

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
          <p className="text-gray-600 mt-1">Gestión de personal y acceso al POS</p>
        </div>
        {canAccessAll && (
          <button
            onClick={() => { setEditando(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Empleado
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactivos}
            onChange={(e) => setShowInactivos(e.target.checked)}
            className="rounded text-purple-600"
          />
          Ver inactivos
        </label>
        <span className="text-sm text-gray-400">
          {empleados.length} empleado{empleados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {empleados.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay empleados registrados</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-purple-600 font-medium text-sm hover:underline"
            >
              Agregar primer empleado
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Puesto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sucursal</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">PIN</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Activo</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {empleados.filter(emp => canAccessAll || emp.sucursal_id === user?.sucursal_id).map(emp => (
                  <tr key={emp.id} className={`transition-colors ${emp.activo ? 'hover:bg-gray-50' : 'bg-gray-50/50 opacity-60'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {emp.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{emp.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {emp.puesto || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const rol = emp.rol || 'cajero';
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${ROL_COLORS[rol]}`}>
                            <Shield className="w-3 h-3" />
                            {ROL_LABELS[rol]}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {emp.sucursal_id ? sucursalMap[emp.sucursal_id] || 'Desconocida' : <span className="text-gray-400">Todas</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(emp.has_pin || emp.pin) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-mono font-bold">
                          <KeyRound className="w-3 h-3" />
                          ●●●●
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sin PIN</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActivo(emp)}
                        className="inline-flex items-center"
                        title={emp.activo ? 'Desactivar' : 'Activar'}
                      >
                        {emp.activo ? (
                          <ToggleRight className="w-8 h-8 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <EmpleadoForm
          empleado={editando}
          sucursales={sucursales}
          onDone={handleFormDone}
          onClose={() => { setShowForm(false); setEditando(null); }}
        />
      )}
    </div>
  );
}

// --- Form de empleado ---
function EmpleadoForm({
  empleado,
  sucursales,
  onDone,
  onClose,
}: {
  empleado: Empleado | null;
  sucursales: Sucursal[];
  onDone: () => void;
  onClose: () => void;
}) {
  const { canAccessAll } = useAuth();
  const [nombre, setNombre] = useState(empleado?.nombre || '');
  const [puesto, setPuesto] = useState(empleado?.puesto || '');
  const [rol, setRol] = useState<Rol>(empleado?.rol || 'cajero');
  const [sucursalId, setSucursalId] = useState(empleado?.sucursal_id?.toString() || '');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!empleado;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (pin && !/^\d{4}$/.test(pin)) {
      setError('El PIN debe ser exactamente 4 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const body: Record<string, unknown> = {
        nombre: nombre.trim(),
        sucursal_id: sucursalId ? parseInt(sucursalId) : null,
        puesto: puesto.trim() || null,
        pin: pin || null,
        rol,
      };

      if (isEdit) body.id = empleado.id;

      const res = await fetch('/api/empleados', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        onDone();
      } else {
        setError(data.error || 'Error guardando');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
          <Users className="w-10 h-10 mx-auto mb-2 opacity-90" />
          <h3 className="text-lg font-bold">{isEdit ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del empleado"
              required
            />
          </div>

          {/* Puesto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puesto</label>
            <input
              type="text"
              value={puesto}
              onChange={e => setPuesto(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Cajero, Gerente, Barista"
            />
          </div>

          {/* Rol */}
          {canAccessAll && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol de acceso</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={rol}
                  onChange={e => setRol(e.target.value as Rol)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cajero">Cajero — Solo POS</option>
                  <option value="gerente_sucursal">Gerente de Sucursal — Su sucursal</option>
                  <option value="gerente">Gerente General — Todo</option>
                  <option value="admin">Administrador — Todo + configuración</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Define qué puede ver y hacer este empleado
              </p>
            </div>
          )}

          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={sucursalId}
                onChange={e => setSucursalId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN de acceso (4 dígitos)
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                }}
                className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono tracking-widest"
                placeholder="●●●●"
                maxLength={4}
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              El empleado usará este PIN para identificarse en el POS
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nombre.trim()}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
