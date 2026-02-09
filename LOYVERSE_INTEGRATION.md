# 🔗 Integración con Loyverse - Fubba Bubba Dashboard

## ✅ Estado Actual: CONECTADO Y FUNCIONANDO

### 🎯 Lo que ya está funcionando:

- ✅ **Conexión exitosa** con Loyverse API
- ✅ **Access Token** configurado y activo
- ✅ **Productos sincronizados** automáticamente desde Loyverse
- ✅ **API Endpoints** funcionando:
  - `/api/loyverse/items` - Productos
  - `/api/loyverse/stores` - Sucursales
  - `/api/loyverse/receipts` - Ventas/Recibos
  - `/api/loyverse/test` - Prueba de conexión

### 📊 Datos Actuales:

- **1 sucursal** configurada en Loyverse: "Fubba Bubba"
- **100+ productos** sincronizados
- **Dashboard mantiene 6 sucursales** (datos simulados para 5 pendientes)

---

## 🏪 Configurar las Otras 5 Sucursales en Loyverse

### Paso 1: Entrar al Back Office

1. Ve a: https://r.loyverse.com
2. Login: `fubbabubbad@gmail.com` / `fubba321`

### Paso 2: Agregar Sucursales

1. En el menú lateral, busca **"Stores"** o **"Sucursales"**
2. Haz clic en **"+ Add Store"** o **"+ Agregar Sucursal"**

### Paso 3: Crear cada sucursal

Repite esto 5 veces para:

#### Sucursal 1: **Sendero**
- Name: `Sendero`
- Address: (la dirección real)
- City: `San Luis Potosí`
- Country: `México`
- Phone: (opcional)

#### Sucursal 2: **Dorado**
- Name: `Dorado`
- Address: (la dirección real)
- City: `San Luis Potosí`
- Country: `México`

#### Sucursal 3: **Escobedo**
- Name: `Escobedo`
- Address: Escobedo 219-A (ya tienes esta info)
- City: `San Luis Potosí`
- Country: `México`

#### Sucursal 4: **Palacio**
- Name: `Palacio`
- Address: (la dirección real)
- City: `San Luis Potosí`
- Country: `México`

#### Sucursal 5: **Carranza**
- Name: `Carranza`
- Address: (la dirección real)
- City: `San Luis Potosí`
- Country: `México`

#### Sucursal 6: **Zaragoza**
- Name: `Zaragoza`
- Address: (la dirección real)
- City: `San Luis Potosí`
- Country: `México`

### Paso 4: Actualizar el Dashboard

Una vez que agregues las sucursales en Loyverse:

1. Obtén los IDs de cada sucursal (se ven en la URL o en el API)
2. Avísame y actualizo el archivo `lib/dataParser.ts`
3. El dashboard empezará a mostrar datos reales de cada sucursal

---

## 📦 Estructura de Datos

### Productos

Los productos se cargan automáticamente desde Loyverse con:
- Nombre
- Precio
- Costo
- SKU
- Categoría
- Imagen (si está configurada)
- Color y forma del ícono

### Ventas (Receipts)

Puedes obtener ventas con filtros:
- Por sucursal (`store_id`)
- Por rango de fechas (`created_at_min`, `created_at_max`)
- Límite de resultados (`limit`)

Ejemplo en el código:
```javascript
const receipts = await fetch('/api/loyverse/receipts?store_id=xxx&limit=100');
```

---

## 🔄 Actualización Automática

### Webhooks (Opcional - Para Tiempo Real)

Para que el dashboard se actualice automáticamente cuando hay ventas nuevas:

1. En Loyverse Back Office → **Settings** → **Webhooks**
2. Crea un nuevo webhook
3. URL: `https://tu-dominio.com/api/loyverse/webhook` (cuando deploys)
4. Eventos: `receipt.created`, `item.updated`, etc.

Por ahora, el dashboard se actualiza cuando:
- Recargas la página
- Navegas entre secciones

---

## 🎨 Personalización por Sucursal

Cuando todas las sucursales estén en Loyverse, el dashboard mostrará:

- ✅ **Ventas reales** por sucursal
- ✅ **Inventario específico** de cada ubicación
- ✅ **Productos más vendidos** por sucursal
- ✅ **Comparativas** entre sucursales
- ✅ **Tendencias** y proyecciones

---

## 🔐 Seguridad

### Access Token

- **Token actual:** Guardado en `.env.local`
- **Nunca** lo compartas ni lo subas a GitHub
- Puedes **revocar** el token en cualquier momento desde Loyverse
- Puedes crear **nuevos tokens** cuando necesites

### Regenerar Token

Si necesitas un nuevo token:

1. Ve a Loyverse Back Office → Access Tokens
2. Elimina el token actual
3. Crea uno nuevo
4. Actualiza `.env.local` con el nuevo
5. Reinicia el servidor

---

## 📈 Próximos Pasos Recomendados

1. **Agregar las 5 sucursales** en Loyverse Back Office
2. **Configurar categorías** de productos correctamente
3. **Subir imágenes** de los productos más populares
4. **Configurar webhooks** para actualizaciones en tiempo real
5. **Hacer deploy** del dashboard a un servidor (Vercel recomendado)

---

## 🆘 Troubleshooting

### "Error al conectar con Loyverse"

- Verifica que el token esté en `.env.local`
- Revisa que el servidor Next.js se haya reiniciado
- Prueba el endpoint: `http://localhost:3000/api/loyverse/test`

### "No se ven mis productos"

- Asegúrate de tener productos en Loyverse
- Verifica que estén marcados como "Available for sale"
- Revisa la consola del navegador para errores

### "Quiero más datos en el dashboard"

- Puedes agregar más endpoints en `lib/loyverse.ts`
- La API de Loyverse soporta: customers, employees, inventory, etc.
- Documentación completa: https://developer.loyverse.com/docs/

---

## 💡 Tips

- **Categorías:** Organiza bien tus productos en Loyverse → el dashboard los agrupa automáticamente
- **Precios:** Actualiza precios en Loyverse → se reflejan al instante en el dashboard
- **Inventario:** Si activas el tracking de inventario en Loyverse, el dashboard lo mostrará
- **Imágenes:** Sube fotos de tus productos → se ven más pro en el dashboard

---

**Última actualización:** 2026-02-09  
**Estado:** ✅ Funcional - Listo para agregar sucursales  
**Token:** ✅ Activo
