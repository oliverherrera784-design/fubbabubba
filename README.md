# 🧋 Fubba Bubba Dashboard

Dashboard completo de administración para Fubba Bubba - Sistema de bubble tea con 6 sucursales en San Luis Potosí.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green)

## ✨ Características

- 📊 **Dashboard en tiempo real** con métricas clave
- 🏪 **6 Sucursales:** Sendero, Dorado, Escobedo, Palacio, Carranza, Zaragoza
- 📦 **Gestión de Productos** con categorías y precios
- 📈 **Análisis de Ventas** con gráficos interactivos
- 📋 **Control de Inventario** por sucursal
- 🔗 **Integración con Loyverse POS**
- 🗄️ **Base de datos en la nube** con Supabase
- 🎨 **Diseño moderno** inspirado en Loyverse

## 🚀 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/oliverherrera784-design/fubbabubba.git
cd fubbabubba
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 4. Configurar Supabase

Ver instrucciones detalladas en: [INSTRUCCIONES_SUPABASE.md](./INSTRUCCIONES_SUPABASE.md)

**Resumen:**
1. Ejecuta `supabase-schema.sql` en el SQL Editor de Supabase
2. Ejecuta el script de migración: `node scripts/migrate-data.js`

### 5. Iniciar el servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
fubba-dashboard/
├── app/                    # Pages y routing (Next.js 14 App Router)
│   ├── page.tsx           # Dashboard principal
│   ├── sucursales/        # Gestión de sucursales
│   ├── productos/         # Catálogo de productos
│   ├── ventas/            # Análisis de ventas
│   ├── inventario/        # Control de inventario
│   ├── analisis/          # Analytics avanzados
│   └── configuracion/     # Configuración general
├── components/            # Componentes reutilizables
│   ├── Header.tsx         # Header del dashboard
│   ├── Sidebar.tsx        # Menú lateral
│   └── StatCard.tsx       # Card de estadísticas
├── lib/                   # Utilidades y helpers
│   ├── supabase.ts        # Cliente y tipos de Supabase
│   └── dataParser.ts      # Parseo de datos CSV
├── scripts/               # Scripts de migración
│   ├── setup-database.js  # Setup inicial de DB
│   └── migrate-data.js    # Migración de datos CSV
├── data/                  # Datos estáticos (backups)
├── public/                # Assets estáticos
└── supabase-schema.sql    # Schema de base de datos
```

## 🗄️ Base de Datos

### Tablas principales

- **sucursales** - 6 sucursales de Fubba Bubba
- **categorias** - Categorías de productos (Frappes, Lattes, Botanas, etc.)
- **productos** - Catálogo completo de productos
- **inventario** - Stock por sucursal y producto
- **ventas** - Historial de transacciones
- **empleados** - Gestión de personal (futuro)

Ver schema completo en: `supabase-schema.sql`

## 🔗 Integraciones

### Loyverse POS

El sistema se integra con Loyverse para:
- Sincronización de productos en tiempo real
- Importación de ventas
- Control de inventario unificado

Credenciales: `fubbabubbad@gmail.com`

Ver: [LOYVERSE_INTEGRATION.md](./LOYVERSE_INTEGRATION.md)

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Build
npm run build        # Crea build de producción
npm start            # Inicia servidor de producción

# Database
node scripts/migrate-data.js     # Migra datos CSV a Supabase
```

## 📊 Funcionalidades del Dashboard

### Dashboard Principal
- Ventas totales y transacciones
- Ticket promedio
- Gráficos de ventas por día y sucursal
- Ranking de sucursales
- Productos más vendidos

### Sucursales
- Lista de todas las sucursales
- Ventas individuales por sucursal
- Comparación de performance

### Productos
- Catálogo completo
- Filtrado por categoría
- Edición de precios y costos
- Estado de inventario

### Ventas
- Historial completo de ventas
- Filtros por sucursal, fecha y canal
- Análisis de tendencias

### Inventario
- Stock actual por sucursal
- Alertas de stock bajo
- Movimientos de inventario

### Análisis
- Métricas avanzadas
- Comparaciones mes a mes
- Exportación de reportes

## 🎨 Tecnologías

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18 + TypeScript
- **Estilos:** Tailwind CSS
- **Gráficos:** Recharts
- **Base de Datos:** Supabase (PostgreSQL)
- **Íconos:** Lucide React
- **POS:** Loyverse API

## 🔐 Seguridad

- Variables de entorno para credenciales sensibles
- Row Level Security (RLS) en Supabase
- API keys nunca expuestas en el cliente
- `.env.local` en `.gitignore`

## 📝 Notas Importantes

1. **Nunca subas `.env.local` a GitHub**
2. Mantén las credenciales de Supabase seguras
3. Haz backups regulares de la base de datos
4. Usa `service_role_key` solo en scripts server-side

## 🚀 Deployment

### Vercel (Recomendado)

1. Push a GitHub
2. Conecta el repo en Vercel
3. Configura las variables de entorno
4. Deploy automático

### Otras opciones

- Netlify
- Railway
- Self-hosted con PM2

## 📞 Soporte

Para dudas o problemas:
- GitHub Issues: [Ver issues](https://github.com/oliverherrera784-design/fubbabubba/issues)
- Email: fubbabubbad@gmail.com

## 📄 Licencia

Privado - © 2026 Fubba Bubba

---

**Desarrollado con ❤️ para Fubba Bubba**
