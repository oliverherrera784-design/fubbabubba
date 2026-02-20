'use client';

import { useState } from 'react';
import { Printer, MessageCircle, CheckCircle2 } from 'lucide-react';
import type { CartItem } from '@/lib/supabase';
import { imprimirTicket, compartirWhatsApp, generarTicketTexto, totalEnLetra, SUCURSAL_INFO, type TicketData } from '@/lib/ticket';

interface ReceiptModalProps {
  ordenNumero: number;
  ordenId?: string;
  items: CartItem[];
  subtotal: number;
  descuento?: number;
  impuesto: number;
  total: number;
  metodoPago: string;
  plataforma?: string | null;
  cambio?: number;
  montoPagado?: number;
  sucursal: string;
  sucursalId?: number;
  folioCon?: number;
  cajero?: string;
  nombreCliente?: string | null;
  onClose: () => void;
}

export function ReceiptModal({
  ordenNumero,
  ordenId,
  items,
  subtotal,
  descuento,
  impuesto,
  total,
  metodoPago,
  plataforma,
  cambio,
  montoPagado,
  sucursal,
  sucursalId,
  folioCon,
  cajero,
  nombreCliente,
  onClose,
}: ReceiptModalProps) {
  const [mesero, setMesero] = useState('');
  const [personas, setPersonas] = useState('');

  const ticketData: TicketData = {
    ordenNumero,
    fecha: new Date().toISOString(),
    sucursal,
    sucursalId,
    items: items.map(item => ({
      cantidad: item.cantidad,
      nombre: item.nombre,
      modificadores: item.modificadores,
      subtotal: item.subtotal,
    })),
    subtotal,
    descuento: descuento && descuento > 0 ? descuento : undefined,
    impuesto,
    total,
    metodoPago,
    plataforma,
    cambio,
    montoPagado,
    folio: ordenId,
    folioCon,
    mesero: mesero.trim() || undefined,
    personas: personas ? parseInt(personas) : undefined,
    cajero,
    nombreCliente,
  };

  const ticketTexto = generarTicketTexto(ticketData);

  const handleImprimir = () => {
    imprimirTicket(ticketData);
  };

  const handleWhatsApp = () => {
    compartirWhatsApp(ticketData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-md overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header éxito compacto */}
        <div className="bg-green-500 px-4 py-3 text-center text-white flex-shrink-0 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-lg">Venta Exitosa</span>
          <span className="text-green-100">— Orden #{ordenNumero}</span>
        </div>

        {/* Campos editables: Mesero y Personas */}
        <div className="px-4 pt-3 pb-2 flex gap-2 flex-shrink-0">
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Mesero</label>
            <input
              type="text"
              value={mesero}
              onChange={(e) => setMesero(e.target.value)}
              placeholder="(opcional)"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="w-24">
            <label className="text-xs font-medium text-gray-500 uppercase">Personas</label>
            <input
              type="number"
              inputMode="numeric"
              value={personas}
              onChange={(e) => setPersonas(e.target.value)}
              placeholder="0"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Vista previa del ticket — estilo térmico */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <div className="bg-white border border-gray-200 rounded-lg shadow-inner mx-auto" style={{ maxWidth: '300px' }}>
            <pre
              className="text-xs leading-tight p-4 text-black whitespace-pre-wrap break-words"
              style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '11px', lineHeight: '1.4' }}
            >
              {ticketTexto}
            </pre>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl space-y-2 flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handleImprimir}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm touch-manipulation"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex-1 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm touch-manipulation"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all touch-manipulation"
          >
            Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
}
