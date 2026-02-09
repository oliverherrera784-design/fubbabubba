-- Schema para Fubba Bubba Dashboard
-- Ejecutar en Supabase SQL Editor

-- Tabla de sucursales
CREATE TABLE sucursales (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  direccion TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de categorías
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  handle VARCHAR(100) UNIQUE,
  ref VARCHAR(50),
  nombre VARCHAR(200) NOT NULL,
  categoria_id INTEGER REFERENCES categorias(id),
  descripcion TEXT,
  precio_default DECIMAL(10,2) DEFAULT 0,
  costo DECIMAL(10,2) DEFAULT 0,
  codigo_barras VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de inventario por sucursal
CREATE TABLE inventario (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
  sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE CASCADE,
  cantidad DECIMAL(10,3) DEFAULT 0,
  precio_sucursal DECIMAL(10,2),
  stock_minimo DECIMAL(10,3) DEFAULT 0,
  disponible_venta BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(producto_id, sucursal_id)
);

-- Tabla de ventas
CREATE TABLE ventas (
  id SERIAL PRIMARY KEY,
  sucursal_id INTEGER REFERENCES sucursales(id),
  producto_id INTEGER REFERENCES productos(id),
  cantidad DECIMAL(10,3) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  canal VARCHAR(50) DEFAULT 'local', -- local, uber_eats, didi_food
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de empleados (para futuro)
CREATE TABLE empleados (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  sucursal_id INTEGER REFERENCES sucursales(id),
  puesto VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_inventario_producto ON inventario(producto_id);
CREATE INDEX idx_inventario_sucursal ON inventario(sucursal_id);
CREATE INDEX idx_ventas_sucursal ON ventas(sucursal_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);

-- Insertar las 6 sucursales
INSERT INTO sucursales (nombre, codigo, activa) VALUES
('Sendero', 'SENDERO', true),
('Dorado', 'DORADO', true),
('Escobedo', 'ESCOBEDO', true),
('Palacio', 'PALACIO', true),
('Carranza', 'CARRANZA', true),
('Zaragoza', 'ZARAGOZA', true);

-- Insertar categorías comunes
INSERT INTO categorias (nombre, descripcion) VALUES
('SABORES FRIOS', 'Frappes fríos'),
('SABORES CALIENTES', 'Bebidas calientes'),
('LATTES', 'Lattes especiales'),
('BOTANA', 'Botanas y snacks'),
('EXTRAS', 'Extras y complementos'),
('BASES', 'Bases para bebidas'),
('Fubba minis', 'Versiones mini'),
('Combinaciones Fubba', 'Combinaciones especiales');

-- Enable Row Level Security (opcional pero recomendado)
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora, ajustar después)
CREATE POLICY "Enable read access for all users" ON sucursales FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON categorias FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON productos FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON inventario FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON ventas FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON empleados FOR SELECT USING (true);
