-- ============================================
-- Schema POS para Fubba Bubba
-- Ejecutar en Supabase SQL Editor DESPUÉS del schema original
-- ============================================

-- Ordenes (agrupa items en una transacción)
CREATE TABLE ordenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden SERIAL,
  sucursal_id INTEGER REFERENCES sucursales(id),
  empleado_id INTEGER REFERENCES empleados(id),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  descuento DECIMAL(10,2) DEFAULT 0,
  impuesto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'completada',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items dentro de cada orden
CREATE TABLE orden_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(id),
  nombre_producto VARCHAR(200) NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  modificadores JSONB DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL,
  notas TEXT
);

-- Pagos (una orden puede tener múltiples pagos)
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID REFERENCES ordenes(id) ON DELETE CASCADE,
  metodo VARCHAR(30) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  referencia VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Control de caja (apertura/cierre por turno)
CREATE TABLE cajas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id INTEGER REFERENCES sucursales(id),
  empleado_id INTEGER REFERENCES empleados(id),
  monto_apertura DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_cierre DECIMAL(10,2),
  estado VARCHAR(20) DEFAULT 'abierta',
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Modificadores de producto (tamaños, toppings)
CREATE TABLE modificadores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  grupo VARCHAR(100) NOT NULL,
  precio_extra DECIMAL(10,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true
);

-- Índices para performance
CREATE INDEX idx_ordenes_sucursal ON ordenes(sucursal_id);
CREATE INDEX idx_ordenes_fecha ON ordenes(created_at);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_orden_items_orden ON orden_items(orden_id);
CREATE INDEX idx_pagos_orden ON pagos(orden_id);
CREATE INDEX idx_cajas_sucursal ON cajas(sucursal_id);
CREATE INDEX idx_cajas_estado ON cajas(estado);

-- RLS
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE modificadores ENABLE ROW LEVEL SECURITY;

-- Políticas (permitir todo por ahora)
CREATE POLICY "Allow all for ordenes" ON ordenes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for orden_items" ON orden_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for pagos" ON pagos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for cajas" ON cajas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for modificadores" ON modificadores FOR ALL USING (true) WITH CHECK (true);

-- Insertar modificadores iniciales de Fubba Bubba
INSERT INTO modificadores (nombre, grupo, precio_extra) VALUES
-- Tamaños
('Chico', 'Tamaño', 0),
('Mediano', 'Tamaño', 10),
('Grande', 'Tamaño', 20),
-- Toppings
('Perlas de Tapioca', 'Topping', 15),
('Jelly', 'Topping', 15),
('Pudín', 'Topping', 15),
('Crema Batida', 'Topping', 10),
('Oreo Triturado', 'Topping', 12),
-- Extras
('Extra Dulce', 'Extra', 0),
('Sin Azúcar', 'Extra', 0),
('Leche de Almendra', 'Extra', 15),
('Shot de Espresso', 'Extra', 20);
