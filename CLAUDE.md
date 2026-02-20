# Fubba Bubba - Dashboard & POS

## Descripción
Sistema completo de **Dashboard de gestión** y **Punto de Venta (POS)** para **Fubba Bubba**, una cadena de bubble tea con 6 sucursales en San Luis Potosí, México.

## Stack Tecnológico
- **Framework:** Next.js 16.1.6 (App Router, Turbopack)
- **UI:** React 19.2.3 + TypeScript 5
- **Estilos:** Tailwind CSS 4 + PostCSS
- **Base de datos:** Supabase (PostgreSQL)
- **Gráficas:** Recharts 3.7
- **Iconos:** Lucide React
- **PWA:** Service Worker + modo offline

## Comandos
```bash
npm run dev      # Servidor de desarrollo (localhost:3000)
npm run build    # Build de producción
npm run start    # Iniciar producción
npm run lint     # Linting con ESLint
```

## Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL       # URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Clave pública de Supabase
SUPABASE_SERVICE_ROLE_KEY      # Clave de servicio (backend)
```

## Estructura del Proyecto
```
app/
├── layout.tsx                     # Layout raíz (solo html + body)
├── globals.css                    # Estilos globales + Tailwind
├── (dashboard)/                   # Route group - Dashboard con sidebar
│   ├── layout.tsx                 # Layout con Sidebar + Header
│   ├── page.tsx                   # Dashboard principal
│   ├── ventas/page.tsx
│   ├── productos/page.tsx
│   ├── sucursales/page.tsx
│   ├── inventario/page.tsx
│   ├── analisis/page.tsx
│   └── configuracion/page.tsx
├── (pos)/                         # Route group - POS pantalla completa
│   ├── layout.tsx                 # Layout fullscreen sin sidebar
│   └── pos/page.tsx               # Pantalla principal del POS
└── api/
    ├── pos/
    │   ├── ordenes/route.ts       # POST: crear orden, GET: listar
    │   ├── caja/route.ts          # Abrir/cerrar caja
    │   └── modificadores/route.ts # GET: tamaños, toppings, extras
    ├── productos/route.ts
    ├── sucursales/route.ts
components/
├── Sidebar.tsx                    # Navegación lateral púrpura
├── Header.tsx                     # Barra superior con usuario "Carly"
├── StatCard.tsx                   # Tarjeta de KPI reutilizable
└── pos/                           # Componentes del Punto de Venta
    ├── ProductGrid.tsx            # Grid de productos con búsqueda
    ├── ProductButton.tsx          # Botón de producto (touch-friendly)
    ├── CategoryTabs.tsx           # Tabs de categorías
    ├── Cart.tsx                   # Panel del carrito
    ├── CartItem.tsx               # Item individual +/-
    ├── PaymentModal.tsx           # Modal de cobro
    ├── ReceiptModal.tsx           # Recibo post-venta
    └── ModifierModal.tsx          # Modal de tamaño/toppings

lib/
├── supabase.ts                    # Cliente Supabase + tipos + funciones
├── usePOS.ts                      # Hook del carrito (IVA 16%)
├── offlineQueue.ts                # Cola de órdenes offline
└── dataParser.ts                  # Parser CSV + datos mock + utilidades
```

## Base de Datos (Supabase)

### Tablas existentes
| Tabla | Descripción |
|-------|-------------|
| `sucursales` | 6 ubicaciones: Sendero, Dorado, Escobedo, Palacio, Carranza, Zaragoza |
| `categorias` | SABORES FRIOS, SABORES CALIENTES, LATTES, BOTANA, EXTRAS, BASES, etc. |
| `productos` | Catálogo completo con precio, costo, código de barras |
| `inventario` | Stock por producto por sucursal |
| `ventas` | Registro de ventas (canal: local, uber_eats, didi_food) |
| `empleados` | Empleados por sucursal |

### Tablas POS (nuevas)
| Tabla | Descripción |
|-------|-------------|
| `ordenes` | Transacciones del POS (UUID, numero_orden auto-incremental) |
| `orden_items` | Items de cada orden (con modificadores JSONB) |
| `pagos` | Pagos por orden (efectivo, tarjeta, transferencia) |
| `cajas` | Control de apertura/cierre de caja por turno |
| `modificadores` | Tamaños (Chico/Mediano/Grande), Toppings, Extras |

### Schemas SQL
- `supabase-schema.sql` - Tablas base originales
- `supabase-schema-pos.sql` - Tablas del POS

## Tipos TypeScript Principales (lib/supabase.ts)
- `Sucursal`, `Categoria`, `Producto`, `Inventario`, `Venta`
- `Orden`, `OrdenItem`, `Pago`, `Caja`, `Modificador`, `CartItem`

## Funciones Helper Principales
- `getSucursales()`, `getProductos()`, `getCategorias()`
- `getInventario(sucursalId?)`, `getVentas(filtros?)`
- `crearOrden(orden)` - Crea orden + items + pagos en una transacción
- `getOrdenes(filtros?)`, `getModificadores()`
- `abrirCaja()`, `cerrarCaja()`, `getCajaAbierta()`

## Flujo del POS
1. Empleado abre `/pos` → selecciona sucursal
2. Toca productos → se agregan al carrito (con modificadores opcionales)
3. Ajusta cantidades con +/-
4. Toca "Cobrar" → selecciona método de pago
5. Efectivo: ingresa monto, calcula cambio
6. Se crea orden en Supabase → muestra recibo

## Convenciones
- **Idioma del código:** Español para nombres de variables de negocio, inglés para código técnico
- **Moneda:** MXN (pesos mexicanos), formato `es-MX`
- **Impuesto:** IVA 16% (constante `IVA_RATE = 0.16` en usePOS.ts)
- **Tema visual:** Púrpura (#9333ea) como color principal
- **Path alias:** `@/*` apunta a la raíz del proyecto
- **Componentes:** Funcionales con hooks, sin clases
- **Estado:** Hooks de React (useState, useMemo, useCallback), sin Redux
- **API routes:** Next.js App Router (route.ts con NextResponse)
- **Base de datos:** Supabase client directo, sin ORM

## Roadmap (por implementar)
- **Fase 2:** Integración Mercado Pago para cobros con tarjeta + transferencias SPEI
- **Fase 3:** Autenticación del dashboard + acceso por rol (gerente de sucursal)

## Notas importantes
- El proyecto está en la carpeta `fubba-dashboard copy` (con espacio) - tener cuidado con paths
- Las políticas RLS de Supabase están abiertas (permitir todo) - ajustar antes de producción
- Los datos del Dashboard principal usan datos mock (`generateMockSalesData()`) - reemplazar con datos reales
- Ejecutar el servidor siempre desde dentro de `fubba-dashboard copy/`
