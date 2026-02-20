'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// Tipos
export type Rol = 'admin' | 'gerente' | 'gerente_sucursal' | 'cajero';

export interface UserSession {
  id: number;
  nombre: string;
  rol: Rol;
  sucursal_id: number | null;
  puesto: string | null;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  canAccessAll: boolean;       // admin o gerente → ve todo
  canAccessDashboard: boolean; // admin, gerente, o gerente_sucursal
}

const STORAGE_KEY = 'fubba_dashboard_session';

const AuthContext = createContext<AuthContextType | null>(null);

// Labels para mostrar en UI
export const ROL_LABELS: Record<Rol, string> = {
  admin: 'Administrador',
  gerente: 'Gerente General',
  gerente_sucursal: 'Gerente de Sucursal',
  cajero: 'Cajero',
};

// Páginas que puede ver cada rol
const GERENTE_SUCURSAL_PAGES = ['/', '/ventas', '/cierres', '/empleados'];

export function getVisiblePages(rol: Rol): string[] | 'all' {
  if (rol === 'admin' || rol === 'gerente') return 'all';
  if (rol === 'gerente_sucursal') return GERENTE_SUCURSAL_PAGES;
  return [];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión de localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserSession;
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/empleados/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();

      if (!data.success) {
        return { success: false, error: data.error || 'PIN incorrecto' };
      }

      const empleado = data.empleado;
      const rol: Rol = empleado.rol || 'cajero';

      // Solo admin, gerente y gerente_sucursal pueden acceder al dashboard
      if (rol === 'cajero') {
        return { success: false, error: 'Acceso denegado. Solo gerentes y administradores.' };
      }

      const session: UserSession = {
        id: empleado.id,
        nombre: empleado.nombre,
        rol,
        sucursal_id: empleado.sucursal_id,
        puesto: empleado.puesto,
      };

      setUser(session);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return { success: true };
    } catch {
      return { success: false, error: 'Error de conexión' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Sin usuario (auth desactivado) → acceso completo
  const canAccessAll = !user || user.rol === 'admin' || user.rol === 'gerente';
  const canAccessDashboard = !user || canAccessAll || user.rol === 'gerente_sucursal';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, canAccessAll, canAccessDashboard }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
