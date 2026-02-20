'use client';

import { Bell, Search, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth, ROL_LABELS } from '@/lib/auth';

export function Header() {
  const { user, logout } = useAuth();

  const [currentDate] = useState(new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  const rolLabel = user ? ROL_LABELS[user.rol] : '';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Bienvenido{user ? `, ${user.nombre}` : ''}
          </h2>
          <p className="text-sm text-gray-500 capitalize">{currentDate}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
            />
          </div>

          {/* Notificaciones */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Usuario */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">{user?.nombre || 'Usuario'}</p>
              <p className="text-xs text-gray-500">{rolLabel}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors ml-1"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
