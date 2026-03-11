-- Script SQL para configurar las tablas necesarias en Supabase
-- Ejecuta este script en tu panel de Supabase (SQL Editor)

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  ciudad TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Agregar columna cliente_id a la tabla equipos si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'equipos' AND column_name = 'cliente_id'
  ) THEN
    ALTER TABLE equipos ADD COLUMN cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Agregar columnas adicionales a equipos si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'equipos' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE equipos ADD COLUMN tipo TEXT DEFAULT 'split';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'equipos' AND column_name = 'capacidad'
  ) THEN
    ALTER TABLE equipos ADD COLUMN capacidad TEXT;
  END IF;
END $$;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_equipos_cliente_id ON equipos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- Habilitar Row Level Security (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (ajustar según tus necesidades de seguridad)
DROP POLICY IF EXISTS "Enable all access for clientes" ON clientes;
CREATE POLICY "Enable all access for clientes" ON clientes
  FOR ALL USING (true) WITH CHECK (true);

-- Comentarios informativos
COMMENT ON TABLE clientes IS 'Tabla de clientes para el sistema PowerCool';
COMMENT ON COLUMN equipos.cliente_id IS 'Relación con el cliente propietario del equipo';

-- Tabla de trámites (mantenimientos y abonos)
CREATE TABLE IF NOT EXISTS tramites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('mantenimiento', 'abono')),
  equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  descripcion TEXT,
  monto DECIMAL(10, 2),
  fecha_programada DATE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Agregar columna moneda a la tabla tramites si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'tramites' AND column_name = 'moneda'
  ) THEN
    ALTER TABLE tramites ADD COLUMN moneda TEXT DEFAULT 'USD' CHECK (moneda IN ('USD', 'UYU'));
  END IF;
END $$;

-- Índices para la tabla de trámites
CREATE INDEX IF NOT EXISTS idx_tramites_equipo_id ON tramites(equipo_id);
CREATE INDEX IF NOT EXISTS idx_tramites_cliente_id ON tramites(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tramites_tipo ON tramites(tipo);
CREATE INDEX IF NOT EXISTS idx_tramites_estado ON tramites(estado);
CREATE INDEX IF NOT EXISTS idx_tramites_fecha ON tramites(fecha_programada);

-- Habilitar Row Level Security (RLS) para trámites
ALTER TABLE tramites ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones en trámites
DROP POLICY IF EXISTS "Enable all access for tramites" ON tramites;
CREATE POLICY "Enable all access for tramites" ON tramites
  FOR ALL USING (true) WITH CHECK (true);

-- Comentarios para la tabla de trámites
COMMENT ON TABLE tramites IS 'Tabla de trámites (mantenimientos y abonos) para equipos';
COMMENT ON COLUMN tramites.tipo IS 'Tipo de trámite: mantenimiento o abono';
COMMENT ON COLUMN tramites.estado IS 'Estado actual del trámite';
COMMENT ON COLUMN tramites.moneda IS 'Moneda del monto: USD (dólares) o UYU (pesos uruguayos)';
