'use client';

import { useState, useCallback, useMemo } from 'react';
import type { CartItem, Producto } from './supabase';

const IVA_RATE = 0.16;

export function usePOS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sucursalId, setSucursalId] = useState<number | null>(null);
  const [descuento, setDescuento] = useState(0);

  // Descuento de empleado
  const [descuentoEmpleadoId, setDescuentoEmpleadoId] = useState<number | null>(null);
  const [descuentoEmpleadoNombre, setDescuentoEmpleadoNombre] = useState<string | null>(null);

  const addToCart = useCallback((producto: Producto, modificadores: { nombre: string; precio: number }[] = []) => {
    setCart(prev => {
      const modKey = JSON.stringify(modificadores.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      const existingIndex = prev.findIndex(item =>
        item.producto_id === producto.id &&
        JSON.stringify(item.modificadores.sort((a, b) => a.nombre.localeCompare(b.nombre))) === modKey
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        const item = updated[existingIndex];
        item.cantidad += 1;
        const modTotal = item.modificadores.reduce((sum, m) => sum + m.precio, 0);
        item.subtotal = item.cantidad * (item.precio_unitario + modTotal);
        return updated;
      }

      const precioBase = producto.precio_default;
      const modTotal = modificadores.reduce((sum, m) => sum + m.precio, 0);
      const newItem: CartItem = {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_unitario: precioBase,
        cantidad: 1,
        modificadores,
        subtotal: precioBase + modTotal,
        categoria_id: producto.categoria_id ?? undefined,
      };
      return [...prev, newItem];
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, cantidad: number) => {
    if (cantidad <= 0) {
      setCart(prev => prev.filter((_, i) => i !== index));
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;
      item.cantidad = cantidad;
      const modTotal = item.modificadores.reduce((sum, m) => sum + m.precio, 0);
      item.subtotal = cantidad * (item.precio_unitario + modTotal);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDescuento(0);
    setDescuentoEmpleadoId(null);
    setDescuentoEmpleadoNombre(null);
  }, []);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const subtotalConDescuento = useMemo(() => {
    return Math.max(0, subtotal - descuento);
  }, [subtotal, descuento]);

  // IVA-inclusive: los precios YA incluyen IVA, se desglosa para contabilidad
  const total = useMemo(() => {
    return Math.round(subtotalConDescuento * 100) / 100;
  }, [subtotalConDescuento]);

  // Descuento empleado = después de IVA → IVA se calcula sobre subtotal original
  // Descuento manual/canje = antes de IVA → IVA se calcula sobre el total con descuento
  const impuesto = useMemo(() => {
    const base = descuentoEmpleadoId ? subtotal : total;
    return Math.round(base * (IVA_RATE / (1 + IVA_RATE)) * 100) / 100;
  }, [total, subtotal, descuentoEmpleadoId]);

  const itemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.cantidad, 0);
  }, [cart]);

  // Aplicar descuento de empleado: -$15/bebida, -$5/botana
  const applyDescuentoEmpleado = useCallback((
    empleadoId: number,
    empleadoNombre: string,
    snackCatIds: Set<number>
  ) => {
    let totalDescuento = 0;
    for (const item of cart) {
      const isSnack = item.categoria_id !== undefined && snackCatIds.has(item.categoria_id);
      const discountPerUnit = isSnack ? 5 : 15;
      totalDescuento += discountPerUnit * item.cantidad;
    }
    totalDescuento = Math.min(totalDescuento, subtotal);
    setDescuento(totalDescuento);
    setDescuentoEmpleadoId(empleadoId);
    setDescuentoEmpleadoNombre(empleadoNombre);
  }, [cart, subtotal]);

  const clearDescuentoEmpleado = useCallback(() => {
    setDescuentoEmpleadoId(null);
    setDescuentoEmpleadoNombre(null);
    setDescuento(0);
  }, []);

  return {
    cart,
    sucursalId,
    setSucursalId,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    descuento,
    setDescuento,
    subtotalConDescuento,
    impuesto,
    total,
    itemCount,
    descuentoEmpleadoId,
    descuentoEmpleadoNombre,
    applyDescuentoEmpleado,
    clearDescuentoEmpleado,
  };
}
