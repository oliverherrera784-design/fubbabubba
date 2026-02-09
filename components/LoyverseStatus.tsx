'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function LoyverseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch('/api/loyverse/test');
        const result = await response.json();
        
        if (result.success) {
          setStatus('connected');
          setData(result.data);
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    }
    
    checkConnection();
  }, []);

  if (status === 'checking') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        <span className="text-blue-800 text-sm font-medium">
          Verificando conexión con Loyverse...
        </span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <span className="text-red-800 text-sm font-medium">
          Error de conexión con Loyverse
        </span>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3 mb-2">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <span className="text-green-800 text-sm font-semibold">
          ✓ Conectado a Loyverse
        </span>
      </div>
      {data && (
        <div className="text-xs text-green-700 ml-8 space-y-1">
          <p>• {data.totalItems} productos sincronizados</p>
          <p>• {data.totalStores} sucursal configurada en Loyverse</p>
          <p className="text-green-600">• 6 sucursales activas en el dashboard (5 pendientes de configurar en Loyverse)</p>
        </div>
      )}
    </div>
  );
}
