'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CupSoda, ArrowLeft, Store, Loader2, Vault, ArrowUpDown, RotateCcw, Lock, Star, WifiOff, CloudOff, RefreshCw, Check, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { Cart } from '@/components/pos/Cart';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { ModifierModal } from '@/components/pos/ModifierModal';
import { UpsellModal } from '@/components/pos/UpsellModal';
import { AbrirCajaModal } from '@/components/pos/AbrirCajaModal';
import { CerrarCajaModal } from '@/components/pos/CerrarCajaModal';
import { CambioTurnoModal } from '@/components/pos/CambioTurnoModal';
import { MovimientoCajaModal } from '@/components/pos/MovimientoCajaModal';
import { DescuentoModal } from '@/components/pos/DescuentoModal';
import { DescuentoEmpleadoModal } from '@/components/pos/DescuentoEmpleadoModal';
import { ReembolsoModal } from '@/components/pos/ReembolsoModal';
import { BuscarClienteModal } from '@/components/pos/BuscarClienteModal';
import { PinLoginModal } from '@/components/pos/PinLoginModal';
import { usePOS } from '@/lib/usePOS';
import { InstallPrompt } from '@/components/pos/InstallPrompt';
import { saveOfflineOrder, getPendingCount, syncAllPendingOrders, cleanSyncedOrders, getTempOrderNumber } from '@/lib/offlineQueue';
import type { Producto, Categoria, Modificador, Sucursal, Caja, Cliente, TarjetaLealtad, Plataforma } from '@/lib/supabase';
import { PLATAFORMAS } from '@/lib/supabase';

interface EmpleadoPOS {
  id: number;
  nombre: string;
  sucursal_id: number | null;
  puesto: string | null;
}

interface ClienteConLealtad extends Cliente {
  tarjeta_activa?: TarjetaLealtad | null;
  tarjeta_completa?: TarjetaLealtad | null;
}

export default function POSPage() {
  const pos = usePOS();

  // Datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modificadores, setModificadores] = useState<Modificador[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [empleadosList, setEmpleadosList] = useState<{ id: number; nombre: string }[]>([]);

  // Caja
  const [cajaActual, setCajaActual] = useState<Caja | null>(null);
  const [loadingCaja, setLoadingCaja] = useState(false);
  const [efectivoAnterior, setEfectivoAnterior] = useState<number | null>(null);

  // UI
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showModifiers, setShowModifiers] = useState<Producto | null>(null);
  const [showAbrirCaja, setShowAbrirCaja] = useState(false);
  const [showCerrarCaja, setShowCerrarCaja] = useState(false);
  const [showMovimiento, setShowMovimiento] = useState(false);
  const [showDescuento, setShowDescuento] = useState(false);
  const [showReembolso, setShowReembolso] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [showCambioTurno, setShowCambioTurno] = useState(false);
  const [showCajaMenu, setShowCajaMenu] = useState(false);
  const [showBuscarCliente, setShowBuscarCliente] = useState(false);
  const [showDescuentoEmpleado, setShowDescuentoEmpleado] = useState(false);

  // Empleado
  const [empleadoActual, setEmpleadoActual] = useState<EmpleadoPOS | null>(null);

  // Nombre del cliente
  const [nombreCliente, setNombreCliente] = useState('');

  // Conexión + cola offline
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOffline, setPendingOffline] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const syncingRef = useRef(false);

  // Sincronizar órdenes pendientes
  const syncPending = useCallback(async () => {
    if (syncingRef.current) return;
    const count = getPendingCount();
    if (count === 0) return;

    syncingRef.current = true;
    setSyncing(true);
    try {
      const result = await syncAllPendingOrders();
      setPendingOffline(getPendingCount());
      if (result.synced > 0) {
        setSyncResult(`${result.synced} orden${result.synced > 1 ? 'es' : ''} sincronizada${result.synced > 1 ? 's' : ''}`);
        setTimeout(() => setSyncResult(null), 4000);
        cleanSyncedOrders();
      }
      if (result.failed > 0) {
        console.warn(`${result.failed} orden(es) no se pudieron sincronizar`);
      }
    } catch (e) {
      console.error('Error sincronizando:', e);
    } finally {
      setSyncing(false);
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setPendingOffline(getPendingCount());

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync al reconectar
      setTimeout(() => syncPending(), 1000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPending]);

  // Lealtad
  const [clienteActual, setClienteActual] = useState<ClienteConLealtad | null>(null);
  const [canjeando, setCanjeando] = useState(false);
  const [canjeoPendiente, setCanjeoPendiente] = useState(false); // true si el descuento actual es un canje
  const [selloToast, setSelloToast] = useState<string | null>(null);

  const [lastOrder, setLastOrder] = useState<{ id: string; numero: number; metodo: string; cambio?: number; montoPagado?: number; plataforma?: string | null; nombreCliente?: string | null; folioCon?: number; sucursalId?: number; cajero?: string } | null>(null);
  const [lastCartSnapshot, setLastCartSnapshot] = useState<typeof pos.cart>([]);
  const [lastTotals, setLastTotals] = useState({ subtotal: 0, descuento: 0, impuesto: 0, total: 0 });

  // Cargar datos al inicio (funciona online y offline gracias al SW)
  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes, modRes, sucRes, empRes] = await Promise.all([
          fetch('/api/productos'),
          fetch('/api/categorias'),
          fetch('/api/pos/modificadores'),
          fetch('/api/sucursales'),
          fetch('/api/empleados'),
        ]);

        // Detectar si alguna respuesta viene del cache del SW
        const fromCache = [prodRes, catRes, modRes, sucRes, empRes].some(
          r => r.headers.get('X-From-Cache') === 'true'
        );
        if (fromCache) setUsingCachedData(true);

        const [prodData, catData, modData, sucData, empData] = await Promise.all([
          prodRes.json(),
          catRes.json(),
          modRes.json(),
          sucRes.json(),
          empRes.json(),
        ]);

        setProductos(prodData.data || []);
        setCategorias(catData.data || []);
        setModificadores(modData.modificadores || []);
        setSucursales(sucData.data || []);
        setEmpleadosList((empData.empleados || []).map((e: EmpleadoPOS) => ({ id: e.id, nombre: e.nombre })));

        const suc = sucData.data || [];
        if (suc.length > 0 && !pos.sucursalId) {
          pos.setSucursalId(suc[0].id);
        }

        // Si estamos online, pedirle al SW que refresque su cache de datos
        if (navigator.onLine && navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'REFRESH_DATA_CACHE' });
        }
      } catch (error) {
        console.error('Error cargando datos del POS:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Cargar caja cuando cambia la sucursal
  useEffect(() => {
    if (!pos.sucursalId) return;
    async function loadCaja() {
      try {
        const res = await fetch(`/api/pos/caja?sucursal_id=${pos.sucursalId}`);
        const data = await res.json();
        setCajaActual(data.caja || null);
        if (!data.caja) {
          setEfectivoAnterior(data.efectivo_anterior ?? null);
          setShowAbrirCaja(true);
        }
      } catch (e) {
        console.error('Error cargando caja:', e);
      }
    }
    loadCaja();
  }, [pos.sucursalId]);

  // Abrir caja
  const handleAbrirCaja = useCallback(async (montoApertura: number) => {
    if (!pos.sucursalId) return;
    setLoadingCaja(true);
    try {
      const res = await fetch('/api/pos/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sucursal_id: pos.sucursalId, monto_apertura: montoApertura }),
      });
      const data = await res.json();
      if (data.success) {
        setCajaActual(data.caja);
        setShowAbrirCaja(false);
      } else {
        alert('Error abriendo caja: ' + (data.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error abriendo caja:', e);
      alert('Error de conexión');
    } finally {
      setLoadingCaja(false);
    }
  }, [pos.sucursalId]);

  // Cerrar caja
  const handleCerrarCaja = useCallback(async (efectivoContado: number, notas?: string, recibeId?: number, efectivoSiguiente?: number) => {
    if (!cajaActual) return;
    setLoadingCaja(true);
    try {
      const recibeNombre = recibeId ? empleadosList.find(e => e.id === recibeId)?.nombre : undefined;
      const notasFinal = [notas, recibeNombre ? `Recibe: ${recibeNombre}` : ''].filter(Boolean).join(' | ');
      const res = await fetch('/api/pos/caja/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caja_id: cajaActual.id, efectivo_contado: efectivoContado, notas: notasFinal || undefined, efectivo_siguiente: efectivoSiguiente }),
      });
      const data = await res.json();
      if (data.success) {
        setCajaActual(null);
        setShowCerrarCaja(false);
        setShowAbrirCaja(true);
        pos.clearCart();
      } else {
        alert('Error cerrando caja: ' + (data.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error cerrando caja:', e);
      alert('Error de conexión');
    } finally {
      setLoadingCaja(false);
    }
  }, [cajaActual, pos, empleadosList]);

  // Movimiento de caja
  const handleMovimiento = useCallback(async (tipo: 'deposito' | 'retiro' | 'gasto', monto: number, comentario?: string, subcategoria?: string) => {
    if (!cajaActual) return;
    setLoadingCaja(true);
    try {
      const res = await fetch('/api/pos/caja/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caja_id: cajaActual.id, tipo, monto, comentario, subcategoria }),
      });
      const data = await res.json();
      if (data.success) {
        setShowMovimiento(false);
      } else {
        alert('Error: ' + (data.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error en movimiento:', e);
      alert('Error de conexión');
    } finally {
      setLoadingCaja(false);
    }
  }, [cajaActual]);

  // Reembolso
  const handleReembolso = useCallback(async (ordenId: string) => {
    setLoadingCaja(true);
    try {
      const res = await fetch('/api/pos/ordenes/reembolso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden_id: ordenId }),
      });
      const data = await res.json();
      if (data.success) {
        setShowReembolso(false);
      } else {
        alert('Error: ' + (data.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error en reembolso:', e);
      alert('Error de conexión');
    } finally {
      setLoadingCaja(false);
    }
  }, []);

  // Cambio de turno parcial
  const handleCambioTurno = useCallback(async (empleadoEntranteId: number, efectivoContado: number, notas?: string) => {
    if (!cajaActual) return;
    setLoadingCaja(true);
    try {
      // Registrar el cambio como movimiento de caja con nota descriptiva
      const comentario = `Cambio de turno: ${empleadoActual?.nombre || 'N/A'} → Empleado #${empleadoEntranteId}. Efectivo contado: $${efectivoContado.toFixed(2)}${notas ? `. ${notas}` : ''}`;
      await fetch('/api/pos/caja/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caja_id: cajaActual.id,
          tipo: 'deposito',
          monto: 0,
          comentario,
        }),
      });

      // Cambiar el empleado activo
      const empRes = await fetch('/api/empleados');
      const empData = await empRes.json();
      const nuevoEmpleado = (empData.empleados || []).find((e: EmpleadoPOS) => e.id === empleadoEntranteId);
      if (nuevoEmpleado) {
        setEmpleadoActual(nuevoEmpleado);
      }

      setShowCambioTurno(false);
    } catch (e) {
      console.error('Error en cambio de turno:', e);
      alert('Error de conexión');
    } finally {
      setLoadingCaja(false);
    }
  }, [cajaActual, empleadoActual]);

  // Categorías que NO son bebidas (se agregan directo al carrito sin modificadores)
  const nonDrinkCatIds = useMemo(() => {
    const keywords = ['topping', 'extra', 'botana', 'snack', 'complemento', 'adicional'];
    return new Set(
      categorias
        .filter(c => keywords.some(kw => c.nombre.toLowerCase().includes(kw)))
        .map(c => c.id)
    );
  }, [categorias]);

  // IDs de categorías snack (para descuento empleado: $5 en vez de $15)
  const snackCatIds = useMemo(() => {
    const keywords = ['botana', 'snack', 'complemento'];
    return new Set(
      categorias
        .filter(c => keywords.some(kw => c.nombre.toLowerCase().includes(kw)))
        .map(c => c.id)
    );
  }, [categorias]);

  // Precio del tamaño estándar (para mostrar en grid de productos)
  const precioEstandar = useMemo(() => {
    const mod = modificadores.find(m =>
      m.grupo.toLowerCase().includes('tamaño') &&
      m.nombre.toLowerCase().includes('est')
    );
    return mod?.precio_extra || 95;
  }, [modificadores]);

  // Código de sucursal actual (para Sendero surcharge)
  const sucursalCodigo = useMemo(() => {
    return sucursales.find(s => s.id === pos.sucursalId)?.codigo || '';
  }, [sucursales, pos.sucursalId]);

  // Click en producto
  const handleProductClick = useCallback((producto: Producto) => {
    // Si es snack/topping/extra → agregar directo sin modificadores
    if (producto.categoria_id && nonDrinkCatIds.has(producto.categoria_id)) {
      pos.addToCart(producto);
      return;
    }
    // Si es bebida y hay modificadores → mostrar modal
    if (modificadores.length > 0) {
      setShowModifiers(producto);
    } else {
      pos.addToCart(producto);
    }
  }, [modificadores, pos, nonDrinkCatIds]);

  // Confirmar modificadores
  const handleModifierConfirm = useCallback((producto: Producto, mods: { nombre: string; precio: number }[]) => {
    pos.addToCart(producto, mods);
    setShowModifiers(null);
  }, [pos]);

  // Procesar pago (online o offline)
  const handlePayment = useCallback(async (
    pagos: { metodo: 'efectivo' | 'tarjeta' | 'app_plataforma'; monto: number }[],
    plataforma?: Plataforma | null,
    totalPlataforma?: number | null,
    extras?: { montoRecibido?: number; cambio?: number }
  ) => {
    if (!pos.sucursalId) return;

    setProcessingPayment(true);

    const orderPayload = {
      sucursal_id: pos.sucursalId,
      empleado_id: empleadoActual?.id || null,
      descuento_empleado_id: pos.descuentoEmpleadoId || null,
      plataforma: plataforma || null,
      total_plataforma: totalPlataforma || null,
      nombre_cliente: nombreCliente.trim() || null,
      subtotal: pos.subtotal,
      descuento: pos.descuento,
      impuesto: pos.impuesto,
      total: pos.total,
      items: pos.cart.map(item => ({
        producto_id: item.producto_id,
        nombre_producto: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        modificadores: item.modificadores,
        subtotal: item.subtotal,
      })),
      pagos,
    };

    // Calcular método de pago para mostrar en recibo
    let metodoDisplay: string;
    if (plataforma) {
      const platLabel = PLATAFORMAS.find(p => p.value === plataforma)?.label || plataforma;
      metodoDisplay = `${platLabel} (${pagos[0].metodo === 'app_plataforma' ? 'App' : 'Efectivo'})`;
    } else {
      metodoDisplay = pagos.length > 1 ? 'mixto' : pagos[0].metodo;
    }
    const cambioCalc = extras?.cambio;
    const montoPagadoCalc = extras?.montoRecibido;

    // Si estamos offline, guardar en cola local
    if (!navigator.onLine) {
      try {
        const offlineOrder = saveOfflineOrder(orderPayload);

        setLastCartSnapshot([...pos.cart]);
        setLastTotals({ subtotal: pos.subtotal, descuento: pos.descuento, impuesto: pos.impuesto, total: pos.total });
        setLastOrder({
          id: offlineOrder.id,
          numero: getTempOrderNumber(),
          metodo: metodoDisplay,
          cambio: cambioCalc,
          montoPagado: montoPagadoCalc,
          plataforma: plataforma || null,
          nombreCliente: nombreCliente.trim() || null,
          sucursalId: pos.sucursalId,
          cajero: empleadoActual?.nombre,
        });

        setPendingOffline(getPendingCount());
        setShowPayment(false);
        setShowReceipt(true);
        pos.clearCart();
        setNombreCliente('');
      } catch (e) {
        console.error('Error guardando orden offline:', e);
        alert('Error al guardar la venta offline');
      } finally {
        setProcessingPayment(false);
      }
      return;
    }

    // Online: enviar al servidor
    try {
      const response = await fetch('/api/pos/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (data.success) {
        // Obtener folio consecutivo por sucursal
        let folioCon: number | undefined;
        try {
          const folioRes = await fetch('/api/pos/folio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sucursal_id: pos.sucursalId }),
          });
          const folioData = await folioRes.json();
          if (folioData.success) folioCon = folioData.folio;
        } catch {}

        setLastCartSnapshot([...pos.cart]);
        setLastTotals({ subtotal: pos.subtotal, descuento: pos.descuento, impuesto: pos.impuesto, total: pos.total });
        setLastOrder({
          id: data.orden.id,
          numero: data.orden.numero_orden,
          metodo: metodoDisplay,
          cambio: cambioCalc,
          montoPagado: montoPagadoCalc,
          plataforma: plataforma || null,
          nombreCliente: nombreCliente.trim() || null,
          folioCon,
          sucursalId: pos.sucursalId,
          cajero: empleadoActual?.nombre,
        });

        // Lealtad: agregar sello y/o canjear tarjeta
        if (clienteActual && pos.sucursalId) {
          try {
            if (canjeoPendiente && clienteActual.tarjeta_completa) {
              await fetch('/api/lealtad/canjear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tarjeta_id: clienteActual.tarjeta_completa.id,
                  orden_id: data.orden.id,
                }),
              });
              setSelloToast('Bebida gratis canjeada + 1 sello nuevo');
              setCanjeoPendiente(false);
            }

            const selloRes = await fetch('/api/lealtad/sello', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cliente_id: clienteActual.id,
                orden_id: data.orden.id,
                sucursal_id: pos.sucursalId,
              }),
            });
            const selloData = await selloRes.json();
            if (selloData.success) {
              if (!canjeoPendiente) {
                setSelloToast(selloData.mensaje);
              }
              setTimeout(() => setSelloToast(null), 4000);
              setClienteActual(prev => prev ? {
                ...prev,
                tarjeta_activa: selloData.tarjeta,
                tarjeta_completa: selloData.completada ? selloData.tarjeta : null,
              } : null);
            }
          } catch (e) {
            console.error('Error en lealtad:', e);
          }
        }

        setShowPayment(false);
        setShowReceipt(true);
        pos.clearCart();
        setNombreCliente('');
      } else {
        alert('Error al procesar la venta: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      // Falló la conexión durante el envío: guardar offline como fallback
      console.warn('Conexión perdida, guardando offline:', error);
      try {
        const offlineOrder = saveOfflineOrder(orderPayload);

        setLastCartSnapshot([...pos.cart]);
        setLastTotals({ subtotal: pos.subtotal, descuento: pos.descuento, impuesto: pos.impuesto, total: pos.total });
        setLastOrder({
          id: offlineOrder.id,
          numero: getTempOrderNumber(),
          metodo: metodoDisplay,
          cambio: cambioCalc,
          montoPagado: montoPagadoCalc,
          plataforma: plataforma || null,
          nombreCliente: nombreCliente.trim() || null,
          sucursalId: pos.sucursalId,
          cajero: empleadoActual?.nombre,
        });

        setPendingOffline(getPendingCount());
        setShowPayment(false);
        setShowReceipt(true);
        pos.clearCart();
        setNombreCliente('');
      } catch (e2) {
        console.error('Error guardando offline:', e2);
        alert('Error de conexión y no se pudo guardar offline');
      }
    } finally {
      setProcessingPayment(false);
    }
  }, [pos, empleadoActual, clienteActual, canjeoPendiente]);

  // Cerrar recibo
  const handleCloseReceipt = useCallback(() => {
    setShowReceipt(false);
    setLastOrder(null);
  }, []);

  // Seleccionar cliente de lealtad
  const handleSelectCliente = useCallback((cliente: ClienteConLealtad) => {
    setClienteActual(cliente);
    setShowBuscarCliente(false);
  }, []);

  // Quitar cliente
  const handleRemoveCliente = useCallback(() => {
    setClienteActual(null);
  }, []);

  // Canjear bebida gratis - aplica descuento del item más caro del carrito
  const handleCanjear = useCallback(() => {
    if (!clienteActual?.tarjeta_completa || pos.cart.length === 0) return;

    // El descuento es el precio del item más caro (1 bebida gratis)
    const maxPrecio = Math.max(...pos.cart.map(item => item.precio_unitario));
    pos.setDescuento(maxPrecio);
    setCanjeoPendiente(true);
  }, [clienteActual, pos]);

  // Descuento manual (limpia descuento empleado si existe)
  const handleDescuento = useCallback((monto: number) => {
    pos.clearDescuentoEmpleado();
    pos.setDescuento(monto);
    setShowDescuento(false);
  }, [pos]);

  // Descuento empleado confirmado
  const handleDescuentoEmpleado = useCallback((empleadoId: number, empleadoNombre: string) => {
    pos.applyDescuentoEmpleado(empleadoId, empleadoNombre, snackCatIds);
    setShowDescuentoEmpleado(false);
  }, [pos, snackCatIds]);

  // Login de empleado: si tiene sucursal asignada, forzar esa sucursal
  const handleEmpleadoLogin = useCallback((empleado: EmpleadoPOS) => {
    setEmpleadoActual(empleado);
    if (empleado.sucursal_id) {
      pos.setSucursalId(empleado.sucursal_id);
    }
  }, [pos]);

  // ¿El empleado tiene sucursal fija?
  const sucursalBloqueada = empleadoActual?.sucursal_id != null;

  const sucursalNombre = sucursales.find(s => s.id === pos.sucursalId)?.nombre || 'Sin sucursal';

  const cajaTiempo = cajaActual ? getTimeSince(cajaActual.opened_at) : '';

  // Pantalla de carga
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CupSoda className="w-10 h-10 text-white" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Cargando Punto de Venta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            title="Volver al Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
              <CupSoda className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm">Fubba Bubba POS</h1>
              <p className="text-xs text-gray-500">Punto de Venta</p>
            </div>
          </div>

          {/* Indicador de empleado */}
          {empleadoActual && (
            <PinLoginModal
              onLogin={handleEmpleadoLogin}
              empleadoActual={empleadoActual}
              onLogout={() => setEmpleadoActual(null)}
            />
          )}

          {/* Indicador offline */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-600">Sin conexión</span>
              {usingCachedData && (
                <span className="text-xs text-red-400">(datos en cache)</span>
              )}
            </div>
          )}

          {/* Cola offline pendiente */}
          {pendingOffline > 0 && (
            <button
              onClick={isOnline ? syncPending : undefined}
              disabled={syncing || !isOnline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isOnline
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
              title={isOnline ? 'Click para sincronizar' : 'Esperando conexión para sincronizar'}
            >
              {syncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudOff className="w-3.5 h-3.5" />
              )}
              {pendingOffline} pendiente{pendingOffline > 1 ? 's' : ''}
            </button>
          )}

          {/* Toast de sincronización exitosa */}
          {syncResult && (
            <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700">{syncResult}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Estado de caja */}
          {cajaActual ? (
            <div className="relative">
              <button
                onClick={() => setShowCajaMenu(!showCajaMenu)}
                className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition-colors touch-manipulation"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700">Caja abierta</span>
                <span className="text-xs text-green-600">{cajaTiempo}</span>
              </button>

              {showCajaMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCajaMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 w-56 z-50">
                    <button
                      onClick={() => { setShowMovimiento(true); setShowCajaMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <ArrowUpDown className="w-4 h-4 text-purple-600" />
                      <span>Depositar / Retirar</span>
                    </button>
                    <button
                      onClick={() => { setShowReembolso(true); setShowCajaMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 text-orange-600" />
                      <span>Reembolsar Orden</span>
                    </button>
                    <button
                      onClick={() => { setShowCambioTurno(true); setShowCajaMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                      <span>Cambio de Turno</span>
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { setShowCerrarCaja(true); setShowCajaMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 flex items-center gap-3 transition-colors text-red-600"
                    >
                      <Lock className="w-4 h-4" />
                      <span className="font-medium">Cerrar Caja</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAbrirCaja(true)}
              className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-300 hover:bg-yellow-100 transition-colors touch-manipulation"
            >
              <Vault className="w-4 h-4 text-yellow-700" />
              <span className="text-xs font-medium text-yellow-700">Abrir Caja</span>
            </button>
          )}

          {/* Selector de sucursal */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${sucursalBloqueada ? 'bg-gray-100' : 'bg-purple-50'}`}>
            <Store className={`w-4 h-4 ${sucursalBloqueada ? 'text-gray-400' : 'text-purple-600'}`} />
            <select
              value={pos.sucursalId || ''}
              onChange={(e) => pos.setSucursalId(parseInt(e.target.value))}
              disabled={sucursalBloqueada}
              className={`bg-transparent text-sm font-medium focus:outline-none ${
                sucursalBloqueada
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-purple-700 cursor-pointer'
              }`}
            >
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
            {sucursalBloqueada && (
              <Lock className="w-3 h-3 text-gray-400" />
            )}
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-hidden flex flex-col" style={{ flex: '7' }}>
          <ProductGrid
            productos={productos}
            categorias={categorias}
            onProductClick={handleProductClick}
            precioEstandar={precioEstandar}
          />
        </div>

        <div className="p-4 pl-0 overflow-hidden" style={{ flex: '3', minWidth: '320px', maxWidth: '400px' }}>
          <Cart
            items={pos.cart}
            subtotal={pos.subtotal}
            descuento={pos.descuento}
            impuesto={pos.impuesto}
            total={pos.total}
            itemCount={pos.itemCount}
            onUpdateQuantity={pos.updateQuantity}
            onRemove={pos.removeFromCart}
            onClear={pos.clearCart}
            onCheckout={() => setShowUpsell(true)}
            onDiscount={() => setShowDescuento(true)}
            onDescuentoEmpleado={() => setShowDescuentoEmpleado(true)}
            descuentoEmpleadoNombre={pos.descuentoEmpleadoNombre}
            cajaAbierta={!!cajaActual}
            cliente={clienteActual}
            onBuscarCliente={() => setShowBuscarCliente(true)}
            onRemoveCliente={handleRemoveCliente}
            onCanjear={handleCanjear}
            canjeando={canjeando}
            nombreCliente={nombreCliente}
            onNombreClienteChange={setNombreCliente}
          />
        </div>
      </div>

      {/* === MODALES === */}

      {/* Login por PIN - aparece si la caja está abierta y no hay empleado */}
      {cajaActual && !empleadoActual && !showAbrirCaja && (
        <PinLoginModal onLogin={handleEmpleadoLogin} />
      )}

      {showBuscarCliente && (
        <BuscarClienteModal
          onSelect={handleSelectCliente}
          onClose={() => setShowBuscarCliente(false)}
        />
      )}

      {/* Toast de sello de lealtad */}
      {selloToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-amber-500 text-white px-6 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2">
            <Star className="w-5 h-5 fill-white" />
            {selloToast}
          </div>
        </div>
      )}

      {showAbrirCaja && (
        <AbrirCajaModal
          sucursalNombre={sucursalNombre}
          onConfirm={handleAbrirCaja}
          onClose={() => setShowAbrirCaja(false)}
          loading={loadingCaja}
          efectivoAnterior={efectivoAnterior}
        />
      )}

      {showCerrarCaja && cajaActual && (
        <CerrarCajaModal
          cajaId={cajaActual.id}
          sucursalNombre={sucursalNombre}
          openedAt={cajaActual.opened_at}
          empleados={empleadosList}
          onConfirm={handleCerrarCaja}
          onClose={() => setShowCerrarCaja(false)}
          loading={loadingCaja}
        />
      )}

      {showMovimiento && (
        <MovimientoCajaModal
          onConfirm={handleMovimiento}
          onClose={() => setShowMovimiento(false)}
          loading={loadingCaja}
        />
      )}

      {showCambioTurno && cajaActual && (
        <CambioTurnoModal
          cajaId={cajaActual.id}
          sucursalId={pos.sucursalId!}
          sucursalNombre={sucursalNombre}
          empleadoSaliente={empleadoActual}
          onConfirm={handleCambioTurno}
          onClose={() => setShowCambioTurno(false)}
          loading={loadingCaja}
        />
      )}

      {showDescuento && (
        <DescuentoModal
          subtotal={pos.subtotal}
          descuentoActual={pos.descuento}
          onConfirm={handleDescuento}
          onClose={() => setShowDescuento(false)}
        />
      )}

      {showReembolso && pos.sucursalId && (
        <ReembolsoModal
          sucursalId={pos.sucursalId}
          onConfirm={handleReembolso}
          onClose={() => setShowReembolso(false)}
          loading={loadingCaja}
        />
      )}

      {showModifiers && (
        <ModifierModal
          producto={showModifiers}
          modificadores={modificadores}
          onConfirm={handleModifierConfirm}
          onClose={() => setShowModifiers(null)}
          sucursalCodigo={sucursalCodigo}
        />
      )}

      {showUpsell && (
        <UpsellModal
          productos={productos}
          categorias={categorias}
          onAddProduct={(producto) => pos.addToCart(producto)}
          onSkip={() => { setShowUpsell(false); setShowPayment(true); }}
          onClose={() => setShowUpsell(false)}
        />
      )}

      {showDescuentoEmpleado && (
        <DescuentoEmpleadoModal
          cart={pos.cart}
          snackCatIds={snackCatIds}
          subtotal={pos.subtotal}
          onConfirm={handleDescuentoEmpleado}
          onClose={() => setShowDescuentoEmpleado(false)}
        />
      )}

      {showPayment && (
        <PaymentModal
          total={pos.total}
          onConfirm={handlePayment}
          onClose={() => setShowPayment(false)}
          loading={processingPayment}
        />
      )}

      {showReceipt && lastOrder && (
        <ReceiptModal
          ordenNumero={lastOrder.numero}
          ordenId={lastOrder.id}
          items={lastCartSnapshot}
          subtotal={lastTotals.subtotal}
          descuento={lastTotals.descuento}
          impuesto={lastTotals.impuesto}
          total={lastTotals.total}
          metodoPago={lastOrder.metodo}
          plataforma={lastOrder.plataforma}
          cambio={lastOrder.cambio}
          montoPagado={lastOrder.montoPagado}
          sucursal={sucursalNombre}
          sucursalId={lastOrder.sucursalId}
          folioCon={lastOrder.folioCon}
          cajero={lastOrder.cajero}
          nombreCliente={lastOrder.nombreCliente}
          onClose={handleCloseReceipt}
        />
      )}

      {/* Prompt de instalación PWA */}
      <InstallPrompt />
    </div>
  );
}

function getTimeSince(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000 / 60);
  if (diff < 60) return `${diff}min`;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}h ${mins}m`;
}
