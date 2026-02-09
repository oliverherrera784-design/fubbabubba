const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Configuración de Supabase
const SUPABASE_URL = 'https://npjzzglksflhtkvmwsyh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wanp6Z2xrc2ZsaHRrdm13c3loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY4ODk5NCwiZXhwIjoyMDg2MjY0OTk0fQ.lCoDIYD7PfjiB_rpc5bC4KDpmeiC5szN6_gkBsbV1Mo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Mapeo de categorías del CSV
const categoriasMap = {};

async function loadCSV(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
}

async function migrateData() {
  console.log('🚀 Iniciando migración de datos...\n');

  try {
    // 1. Verificar y obtener categorías
    console.log('📋 Obteniendo categorías...');
    const { data: categorias, error: catError } = await supabase
      .from('categorias')
      .select('*');

    if (catError) {
      console.error('❌ Error al obtener categorías:', catError);
      throw catError;
    }

    categorias.forEach(cat => {
      categoriasMap[cat.nombre] = cat.id;
    });
    console.log(`✅ ${categorias.length} categorías encontradas`);

    // 2. Cargar datos del CSV
    console.log('\n📄 Cargando productos del CSV...');
    const csvPath = path.join(__dirname, '..', '..', 'Downloads', 'export_items.csv');
    const productos = await loadCSV(csvPath);
    console.log(`✅ ${productos.length} productos encontrados en CSV`);

    // 3. Insertar productos
    console.log('\n📦 Insertando productos...');
    let insertados = 0;
    let errores = 0;

    for (const prod of productos) {
      const categoriaId = categoriasMap[prod.Categoria] || null;
      
      const productoData = {
        handle: prod.Handle || null,
        ref: prod.REF || null,
        nombre: prod.Nombre,
        categoria_id: categoriaId,
        descripcion: prod.Descripción || null,
        precio_default: parseFloat(prod['Precio por defecto']) || 0,
        costo: parseFloat(prod.Coste) || 0,
        codigo_barras: prod['Codigo de barras'] || null,
        activo: true
      };

      const { data, error } = await supabase
        .from('productos')
        .upsert(productoData, { onConflict: 'handle' })
        .select();

      if (error) {
        console.error(`  ❌ Error en ${prod.Nombre}:`, error.message);
        errores++;
      } else {
        insertados++;
        console.log(`  ✅ ${prod.Nombre}`);
        
        // Insertar inventario si existe
        if (data && data[0]) {
          await insertarInventario(data[0].id, prod);
        }
      }
    }

    console.log(`\n✨ Migración completada!`);
    console.log(`   Insertados: ${insertados}`);
    console.log(`   Errores: ${errores}`);

  } catch (err) {
    console.error('❌ Error en migración:', err);
    process.exit(1);
  }
}

async function insertarInventario(productoId, csvRow) {
  // Obtener sucursales
  const { data: sucursales } = await supabase
    .from('sucursales')
    .select('id, codigo');

  for (const sucursal of sucursales) {
    let cantidad = 0;
    let precio = 0;
    let disponible = false;

    // Mapeo dinámico de columnas
    if (sucursal.codigo === 'SENDERO') {
      // Asumir que "Fubba Bubba" es Sendero en los CSVs
      cantidad = parseFloat(csvRow['En inventario [Fubba Bubba]']) || 0;
      precio = parseFloat(csvRow['Precio [Fubba Bubba]']) || 0;
      disponible = csvRow['Disponibles para la venta [Fubba Bubba]'] === 'Y';
    } else if (sucursal.codigo === 'DORADO') {
      cantidad = parseFloat(csvRow['En inventario [Fubba 1]']) || 0;
      precio = parseFloat(csvRow['Precio [Fubba 1]']) || 0;
      disponible = csvRow['Disponibles para la venta [Fubba 1]'] === 'Y';
    }
    // Agregar más sucursales según el CSV

    if (disponible) {
      await supabase
        .from('inventario')
        .upsert({
          producto_id: productoId,
          sucursal_id: sucursal.id,
          cantidad: cantidad,
          precio_sucursal: precio || null,
          disponible_venta: disponible
        }, { onConflict: 'producto_id,sucursal_id' });
    }
  }
}

migrateData();
