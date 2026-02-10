const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const SUPABASE_URL = 'https://npjzzglksflhtkvmwsyh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wanp6Z2xrc2ZsaHRrdm13c3loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY4ODk5NCwiZXhwIjoyMDg2MjY0OTk0fQ.lCoDIYD7PfjiB_rpc5bC4KDpmeiC5szN6_gkBsbV1Mo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parsear CSV manualmente (sin dependencias externas)
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
}

async function checkTablesExist() {
  console.log('🔍 Verificando si las tablas existen...\n');
  
  try {
    const { data, error } = await supabase.from('sucursales').select('count').limit(1);
    if (error) {
      console.log('❌ Las tablas NO existen todavía.');
      console.log('   Por favor ejecuta supabase-schema.sql en el SQL Editor de Supabase');
      console.log('   URL: https://supabase.com/dashboard/project/npjzzglksflhtkvmwsyh/sql/new\n');
      return false;
    }
    console.log('✅ Las tablas existen\n');
    return true;
  } catch (err) {
    console.log('❌ Error verificando tablas:', err.message);
    return false;
  }
}

async function migrateData() {
  console.log('🚀 MIGRACIÓN DE DATOS FUBBA BUBBA\n');
  console.log('=' .repeat(50) + '\n');

  // 1. Verificar que las tablas existan
  const tablesExist = await checkTablesExist();
  if (!tablesExist) {
    process.exit(1);
  }

  try {
    // 2. Obtener categorías existentes
    console.log('📋 Obteniendo categorías...');
    const { data: categorias, error: catError } = await supabase
      .from('categorias')
      .select('*');
    
    if (catError) throw catError;
    
    const categoriasMap = {};
    categorias.forEach(cat => {
      categoriasMap[cat.nombre.toUpperCase()] = cat.id;
    });
    console.log(`   ✅ ${categorias.length} categorías encontradas\n`);

    // 3. Obtener sucursales
    console.log('🏪 Obteniendo sucursales...');
    const { data: sucursales, error: sucError } = await supabase
      .from('sucursales')
      .select('*');
    
    if (sucError) throw sucError;
    console.log(`   ✅ ${sucursales.length} sucursales encontradas\n`);

    // 4. Leer y parsear CSV
    console.log('📄 Leyendo archivo CSV...');
    const csvPath = path.join(__dirname, '..', 'data', 'export_items.csv');
    
    let csvContent;
    try {
      csvContent = fs.readFileSync(csvPath, 'utf8');
    } catch (e) {
      // Intentar desde Downloads
      const altPath = path.join(process.env.HOME, 'Downloads', 'export_items.csv');
      csvContent = fs.readFileSync(altPath, 'utf8');
    }
    
    const productos = parseCSV(csvContent);
    console.log(`   ✅ ${productos.length} productos encontrados en CSV\n`);

    // 5. Insertar productos
    console.log('📦 Insertando productos...\n');
    let insertados = 0;
    let errores = 0;
    let actualizados = 0;

    for (const prod of productos) {
      const categoria = prod.Categoria ? prod.Categoria.toUpperCase() : null;
      const categoriaId = categoria ? categoriasMap[categoria] : null;
      
      // Si la categoría no existe, crearla
      if (categoria && !categoriaId) {
        const { data: newCat, error: newCatError } = await supabase
          .from('categorias')
          .insert({ nombre: prod.Categoria })
          .select()
          .single();
        
        if (!newCatError && newCat) {
          categoriasMap[categoria] = newCat.id;
        }
      }
      
      const productoData = {
        handle: prod.Handle || null,
        ref: prod.REF || null,
        nombre: prod.Nombre,
        categoria_id: categoriasMap[categoria] || null,
        descripcion: prod['Descripción'] || null,
        precio_default: parseFloat(prod['Precio por defecto']) || 0,
        costo: parseFloat(prod.Coste) || 0,
        codigo_barras: prod['Codigo de barras'] || null,
        activo: true
      };

      const { data, error } = await supabase
        .from('productos')
        .upsert(productoData, { onConflict: 'handle' })
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Error en "${prod.Nombre}": ${error.message}`);
        errores++;
      } else {
        console.log(`   ✅ ${prod.Nombre}`);
        insertados++;
        
        // Insertar inventario para sucursales conocidas
        if (data) {
          // Mapeo de columnas CSV a sucursales
          const inventarioMappings = [
            { col: 'Fubba Bubba', sucursal: 'Sendero' },
            { col: 'Fubba 1', sucursal: 'Dorado' }
          ];
          
          for (const mapping of inventarioMappings) {
            const sucursal = sucursales.find(s => s.nombre === mapping.sucursal);
            if (!sucursal) continue;
            
            const disponible = prod[`Disponibles para la venta [${mapping.col}]`] === 'Y';
            const precio = parseFloat(prod[`Precio [${mapping.col}]`]) || 0;
            const cantidad = parseFloat(prod[`En inventario [${mapping.col}]`]) || 0;
            
            if (disponible || precio > 0) {
              await supabase
                .from('inventario')
                .upsert({
                  producto_id: data.id,
                  sucursal_id: sucursal.id,
                  cantidad: cantidad,
                  precio_sucursal: precio,
                  disponible_venta: disponible
                }, { onConflict: 'producto_id,sucursal_id' });
            }
          }
        }
      }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('\n✨ MIGRACIÓN COMPLETADA\n');
    console.log(`   📦 Productos insertados: ${insertados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📊 Total procesados: ${productos.length}\n`);

    // 6. Verificar conteos finales
    console.log('📊 Verificando datos finales...\n');
    
    const { count: prodCount } = await supabase.from('productos').select('*', { count: 'exact', head: true });
    const { count: invCount } = await supabase.from('inventario').select('*', { count: 'exact', head: true });
    
    console.log(`   Productos en DB: ${prodCount}`);
    console.log(`   Registros de inventario: ${invCount}\n`);
    
    console.log('🎉 ¡Todo listo! El dashboard ahora puede usar datos reales.\n');

  } catch (err) {
    console.error('\n❌ Error durante la migración:', err);
    process.exit(1);
  }
}

migrateData();
