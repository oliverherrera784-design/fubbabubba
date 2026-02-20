-- =====================================================
-- PROGRAMA DE LEALTAD - Fubba Bubba
-- 10 sellos = 1 bebida gratis
-- Identificación por teléfono y nombre
-- =====================================================

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre varchar(100) NOT NULL,
  telefono varchar(15) NOT NULL UNIQUE,
  notas text,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabla de tarjetas de lealtad
-- Cada cliente tiene UNA tarjeta activa a la vez.
-- Cuando llega a 10 sellos → estado = 'completa'
-- Cuando canjea la bebida gratis → estado = 'canjeada' y se crea nueva tarjeta activa
CREATE TABLE IF NOT EXISTS tarjetas_lealtad (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  sellos_actuales integer NOT NULL DEFAULT 0 CHECK (sellos_actuales >= 0 AND sellos_actuales <= 10),
  estado varchar(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'completa', 'canjeada')),
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  canjeada_at timestamp with time zone,
  canjeada_en_orden_id uuid REFERENCES ordenes(id)
);

-- Historial individual de cada sello (para auditoría y detalle)
CREATE TABLE IF NOT EXISTS sellos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tarjeta_id uuid REFERENCES tarjetas_lealtad(id) ON DELETE CASCADE NOT NULL,
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  orden_id uuid REFERENCES ordenes(id),
  sucursal_id integer REFERENCES sucursales(id),
  created_at timestamp with time zone DEFAULT now()
);

-- RLS (Row Level Security) - permitir todo para la app
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for clientes" ON clientes FOR ALL USING (true);

ALTER TABLE tarjetas_lealtad ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for tarjetas_lealtad" ON tarjetas_lealtad FOR ALL USING (true);

ALTER TABLE sellos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for sellos" ON sellos FOR ALL USING (true);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_tarjetas_cliente_estado ON tarjetas_lealtad(cliente_id, estado);
CREATE INDEX IF NOT EXISTS idx_sellos_tarjeta ON sellos(tarjeta_id);
CREATE INDEX IF NOT EXISTS idx_sellos_cliente ON sellos(cliente_id);

-- =====================================================
-- Después de crear las tablas, corre esto para verificar:
-- SELECT * FROM clientes LIMIT 5;
-- SELECT * FROM tarjetas_lealtad LIMIT 5;
-- =====================================================
