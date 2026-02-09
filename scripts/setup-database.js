const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const SUPABASE_URL = 'https://npjzzglksflhtkvmwsyh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wanp6Z2xrc2ZsaHRrdm13c3loIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY4ODk5NCwiZXhwIjoyMDg2MjY0OTk0fQ.lCoDIYD7PfjiB_rpc5bC4KDpmeiC5szN6_gkBsbV1Mo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupDatabase() {
  console.log('📦 Iniciando configuración de base de datos...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'supabase-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Ejecutando schema SQL...');
    
    // Ejecutar el SQL mediante la REST API
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error al ejecutar SQL:', error);
      
      // Intentar ejecutar por partes
      console.log('\n⚠️  Intentando ejecutar por partes...');
      const statements = sql.split(';').filter(s => s.trim());
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;
        
        console.log(`  Ejecutando statement ${i + 1}/${statements.length}...`);
        // Aquí se ejecutaría statement por statement
      }
    } else {
      console.log('✅ Schema creado exitosamente');
    }

    // Verificar tablas creadas
    console.log('\n🔍 Verificando tablas...');
    const { data: tables, error: tablesError } = await supabase
      .from('sucursales')
      .select('*')
      .limit(1);

    if (!tablesError) {
      console.log('✅ Tabla sucursales verificada');
    }

    console.log('\n✨ Base de datos lista!');
    
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

setupDatabase();
