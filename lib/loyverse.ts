// Cliente de API de Loyverse
const LOYVERSE_API_URL = process.env.LOYVERSE_API_URL || 'https://api.loyverse.com/v1.0';
const ACCESS_TOKEN = process.env.LOYVERSE_ACCESS_TOKEN;

interface LoyverseRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  params?: Record<string, string>;
}

async function loyverseRequest(endpoint: string, options: LoyverseRequestOptions = {}) {
  const { method = 'GET', body, params } = options;
  
  // Construir URL con parámetros
  let url = `${LOYVERSE_API_URL}${endpoint}`;
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`Loyverse API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en Loyverse API:', error);
    throw error;
  }
}

// Funciones específicas de la API

export async function getItems(params?: { limit?: number; cursor?: string }) {
  return loyverseRequest('/items', { params: params as any });
}

export async function getStores() {
  return loyverseRequest('/stores');
}

export async function getReceipts(params?: { 
  store_id?: string;
  created_at_min?: string;
  created_at_max?: string;
  limit?: number;
  cursor?: string;
}) {
  return loyverseRequest('/receipts', { params: params as any });
}

export async function getInventory(params?: {
  store_id?: string;
  variant_id?: string;
  limit?: number;
}) {
  return loyverseRequest('/inventory', { params: params as any });
}

export async function getCategories() {
  return loyverseRequest('/categories');
}

export async function getEmployees() {
  return loyverseRequest('/employees');
}

export async function getCustomers(params?: { limit?: number; cursor?: string }) {
  return loyverseRequest('/customers', { params: params as any });
}

// Webhooks (para configurar más adelante)
export async function createWebhook(webhookUrl: string, events: string[]) {
  return loyverseRequest('/webhooks', {
    method: 'POST',
    body: {
      url: webhookUrl,
      events,
    },
  });
}

export async function getWebhooks() {
  return loyverseRequest('/webhooks');
}
