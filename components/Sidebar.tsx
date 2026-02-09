'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Store, 
  Package, 
  TrendingUp, 
  Settings,
  CupSoda 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { name: 'Productos', href: '/productos', icon: CupSoda },
  { name: 'Sucursales', href: '/sucursales', icon: Store },
  { name: 'Inventario', href: '/inventario', icon: Package },
  { name: 'Análisis', href: '/analisis', icon: TrendingUp },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gradient-to-b from-purple-600 to-purple-800 text-white flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <CupSoda className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Fubba Bubba</h1>
            <p className="text-xs text-purple-200">Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                ${isActive 
                  ? 'bg-white text-purple-600 shadow-lg' 
                  : 'text-purple-100 hover:bg-purple-700'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-500/30">
        <div className="text-xs text-purple-200">
          <p className="font-semibold mb-1">6 Sucursales Activas</p>
          <p className="text-purple-300">San Luis Potosí, México</p>
        </div>
      </div>
    </div>
  );
}
