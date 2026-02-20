-- Migración: Agregar PIN a empleados y políticas
-- Ejecutar en Supabase SQL Editor

-- Agregar columna pin (4 dígitos) a la tabla empleados
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS pin VARCHAR(4);

-- Crear índice para búsqueda rápida por PIN + sucursal
CREATE INDEX IF NOT EXISTS idx_empleados_pin ON empleados(pin) WHERE activo = true;

-- Política para permitir todas las operaciones (dev mode)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'empleados' AND policyname = 'empleados_full_access'
  ) THEN
    CREATE POLICY "empleados_full_access" ON empleados FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;
