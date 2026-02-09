# 🚀 Instrucciones para Setup de Supabase

## Paso 1: Ejecutar el Schema SQL

1. Ve a tu proyecto de Supabase: https://npjzzglksflhtkvmwsyh.supabase.co
2. Click en **SQL Editor** en el menú lateral
3. Click en **New Query**
4. Copia y pega TODO el contenido del archivo `supabase-schema.sql`
5. Click en **Run** (o presiona Cmd/Ctrl + Enter)

Esto creará:
- ✅ 6 tablas (sucursales, categorías, productos, inventario, ventas, empleados)
- ✅ Las 6 sucursales de Fubba Bubba
- ✅ Las categorías de productos
- ✅ Índices para performance
- ✅ Políticas de seguridad básicas

## Paso 2: Migrar los Datos del CSV

Una vez que el schema esté creado, ejecuta:

```bash
cd ~/Desktop/fubba-dashboard
node scripts/migrate-data.js
```

Esto:
- ✅ Carga todos los productos del CSV
- ✅ Los inserta en la tabla `productos`
- ✅ Crea el inventario por sucursal
- ✅ Relaciona productos con categorías

## Paso 3: Verificar los Datos

En Supabase:
1. Click en **Table Editor** en el menú lateral
2. Verifica las tablas:
   - `sucursales` → Debe tener 6 registros
   - `categorias` → Debe tener ~8 categorías
   - `productos` → Debe tener todos tus productos del CSV
   - `inventario` → Debe tener el stock por sucursal

## Paso 4: Actualizar el Dashboard

El dashboard ya está configurado para usar Supabase (credenciales en `.env.local`).

Solo necesitas reiniciar el servidor:

```bash
cd ~/Desktop/fubba-dashboard
npm run dev
```

Abre: http://localhost:3000

---

## ⚠️ Nota Importante

El archivo `.env.local` contiene tus credenciales de Supabase.
**NUNCA** lo subas a GitHub (ya está en `.gitignore`).

---

## 🆘 Si algo falla

Manda screenshot del error y lo arreglamos al instante.
