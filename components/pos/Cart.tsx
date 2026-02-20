'use client';

import { ShoppingCart, Trash2, Tag, Star, UserCheck, User } from 'lucide-react';
import { CartItemRow } from './CartItem';
import { ClienteLealtadBar } from './ClienteLealtadBar';
import type { CartItem, Cliente, TarjetaLealtad } from '@/lib/supabase';

interface ClienteConLealtad extends Cliente {
  tarjeta_activa?: TarjetaLealtad | null;
  tarjeta_completa?: TarjetaLealtad | null;
}

interface CartProps {
  items: CartItem[];
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  itemCount: number;
  onUpdateQuantity: (index: number, cantidad: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onCheckout: () => void;
  onDiscount: () => void;
  onDescuentoEmpleado: () => void;
  descuentoEmpleadoNombre?: string | null;
  cajaAbierta: boolean;
  cliente?: ClienteConLealtad | null;
  onBuscarCliente: () => void;
  onRemoveCliente: () => void;
  onCanjear: () => void;
  canjeando?: boolean;
  nombreCliente: string;
  onNombreClienteChange: (nombre: string) => void;
}

export function Cart({
  items,
  subtotal,
  descuento,
  impuesto,
  total,
  itemCount,
  onUpdateQuantity,
  onRemove,
  onClear,
  onCheckout,
  onDiscount,
  onDescuentoEmpleado,
  descuentoEmpleadoNombre,
  cajaAbierta,
  cliente,
  onBuscarCliente,
  onRemoveCliente,
  onCanjear,
  canjeando,
  nombreCliente,
  onNombreClienteChange,
}: CartProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl border border-gray-200">
      {/* Header del carrito */}
      <div className="p-4 border-b border-gray-200 bg-white rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900">Pedido Actual</h3>
            {itemCount > 0 && (
              <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Botón de lealtad */}
            <button
              onClick={onBuscarCliente}
              className={`p-1 transition-colors touch-manipulation ${
                cliente ? 'text-amber-500 hover:text-amber-700' : 'text-gray-400 hover:text-amber-500'
              }`}
              title="Programa de lealtad"
            >
              <Star className={`w-4 h-4 ${cliente ? 'fill-amber-400' : ''}`} />
            </button>
            {items.length > 0 && (
              <>
                <button
                  onClick={onDescuentoEmpleado}
                  className="text-amber-500 hover:text-amber-700 p-1 transition-colors touch-manipulation"
                  title="Descuento empleado"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={onDiscount}
                  className="text-purple-500 hover:text-purple-700 p-1 transition-colors touch-manipulation"
                  title="Aplicar descuento"
                >
                  <Tag className="w-4 h-4" />
                </button>
                <button
                  onClick={onClear}
                  className="text-red-500 hover:text-red-700 p-1 transition-colors touch-manipulation"
                  title="Vaciar carrito"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Barra de lealtad del cliente */}
        {cliente && (
          <div className="mt-3">
            <ClienteLealtadBar
              cliente={cliente}
              onRemove={onRemoveCliente}
              onCanjear={onCanjear}
              canjeando={canjeando}
            />
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Carrito vacío</p>
            <p className="text-sm mt-1">Toca un producto para agregarlo</p>
          </div>
        ) : (
          items.map((item, index) => (
            <CartItemRow
              key={`${item.producto_id}-${index}`}
              item={item}
              index={index}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Totales y botón de cobrar */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 bg-white rounded-b-2xl p-4">
          {/* Nombre del cliente */}
          <div className="mb-3">
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={nombreCliente}
                onChange={(e) => onNombreClienteChange(e.target.value)}
                placeholder="Nombre del cliente *"
                className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  !nombreCliente.trim() ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className={`flex justify-between text-sm font-medium ${descuentoEmpleadoNombre ? 'text-amber-600' : 'text-red-600'}`}>
                <span>{descuentoEmpleadoNombre ? `Desc. Empleado (${descuentoEmpleadoNombre})` : 'Descuento'}</span>
                <span>-${descuento.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA incluido (16%)</span>
              <span>${impuesto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={onCheckout}
            disabled={!cajaAbierta || !nombreCliente.trim()}
            className={`
              w-full py-4 font-bold text-lg rounded-xl transition-all touch-manipulation
              ${!cajaAbierta || !nombreCliente.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-lg shadow-purple-200'
              }
            `}
          >
            {!cajaAbierta ? 'Abre la caja primero' : !nombreCliente.trim() ? 'Ingresa nombre del cliente' : `Cobrar $${total.toFixed(2)}`}
          </button>
        </div>
      )}
    </div>
  );
}
