-- =============================================
-- FUBBA BUBBA POS - Extensión: Caja y Tesorería
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Agregar columnas nuevas a tabla cajas
ALTER TABLE cajas ADD COLUMN IF NOT EXISTS efectivo_contado decimal(10,2);
ALTER TABLE cajas ADD COLUMN IF NOT EXISTS notas text;

-- 2. Tabla de movimientos de caja (depósitos y retiros durante turno)
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caja_id uuid REFERENCES cajas(id) ON DELETE CASCADE NOT NULL,
  tipo varchar(20) NOT NULL CHECK (tipo IN ('deposito', 'retiro')),
  monto decimal(10,2) NOT NULL CHECK (monto > 0),
  comentario text,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. RLS para movimientos_caja
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for movimientos_caja" ON movimientos_caja FOR ALL USING (true);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_caja_id ON movimientos_caja(caja_id);
CREATE INDEX IF NOT EXISTS idx_cajas_sucursal_estado ON cajas(sucursal_id, estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_sucursal_created ON ordenes(sucursal_id, created_at);
