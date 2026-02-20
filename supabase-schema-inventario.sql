-- Migración: Función para descontar inventario al vender
-- Ejecutar en Supabase SQL Editor

-- Función RPC para descontar stock de forma segura
CREATE OR REPLACE FUNCTION descontar_inventario(
  p_producto_id INTEGER,
  p_sucursal_id INTEGER,
  p_cantidad DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE inventario
  SET
    cantidad = GREATEST(0, cantidad - p_cantidad),
    updated_at = NOW()
  WHERE
    producto_id = p_producto_id
    AND sucursal_id = p_sucursal_id;

  -- Si no existe el registro, no hace nada (no bloquea la venta)
END;
$$ LANGUAGE plpgsql;

-- Política para escritura completa en inventario
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventario' AND policyname = 'inventario_full_access'
  ) THEN
    CREATE POLICY "inventario_full_access" ON inventario FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;
