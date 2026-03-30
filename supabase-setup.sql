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

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'equipos' AND column_name = 'estado_operativo'
  ) THEN
    ALTER TABLE equipos ADD COLUMN estado_operativo TEXT DEFAULT 'operativo'
      CHECK (estado_operativo IN ('operativo', 'atencion', 'mantenimiento', 'critico'));
  END IF;

  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'equipos' AND column_name = 'prioridad'
  ) THEN
    ALTER TABLE equipos ADD COLUMN prioridad TEXT DEFAULT 'normal'
      CHECK (prioridad IN ('normal', 'atencion', 'critico'));
  END IF;
END $$;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_equipos_cliente_id ON equipos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_equipos_estado_operativo ON equipos(estado_operativo);
CREATE INDEX IF NOT EXISTS idx_equipos_prioridad ON equipos(prioridad);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- Tabla de perfiles para autenticación y roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'visor' CHECK (role IN ('admin', 'tecnico', 'visor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Trigger de actualización de timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-creación de perfil cuando se registra un usuario nuevo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    'visor'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helpers de rol para políticas RLS
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_data()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() IN ('admin', 'tecnico'), false);
$$;

-- Habilitar Row Level Security (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for clientes" ON clientes;
DROP POLICY IF EXISTS "clientes_select_authenticated" ON clientes;
DROP POLICY IF EXISTS "clientes_write_staff" ON clientes;
CREATE POLICY "clientes_select_authenticated" ON clientes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "clientes_write_staff" ON clientes
  FOR ALL TO authenticated
  USING (public.can_manage_data())
  WITH CHECK (public.can_manage_data());

DROP POLICY IF EXISTS "equipos_select_authenticated" ON equipos;
DROP POLICY IF EXISTS "equipos_write_staff" ON equipos;
CREATE POLICY "equipos_select_authenticated" ON equipos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "equipos_write_staff" ON equipos
  FOR ALL TO authenticated
  USING (public.can_manage_data())
  WITH CHECK (public.can_manage_data());

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "profiles_update_own_or_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.current_user_role() = 'admin')
  WITH CHECK (id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "profiles_insert_own_or_admin" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.current_user_role() = 'admin');

-- Comentarios informativos
COMMENT ON TABLE clientes IS 'Tabla de clientes para el sistema PowerCool';
COMMENT ON COLUMN equipos.cliente_id IS 'Relación con el cliente propietario del equipo';
COMMENT ON COLUMN equipos.estado_operativo IS 'Estado operativo del equipo: operativo, atencion, mantenimiento o critico';
COMMENT ON COLUMN equipos.prioridad IS 'Prioridad de atención del equipo: normal, atencion o critico';

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

DROP POLICY IF EXISTS "Enable all access for tramites" ON tramites;
DROP POLICY IF EXISTS "tramites_select_authenticated" ON tramites;
DROP POLICY IF EXISTS "tramites_write_staff" ON tramites;
CREATE POLICY "tramites_select_authenticated" ON tramites
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "tramites_write_staff" ON tramites
  FOR ALL TO authenticated
  USING (public.can_manage_data())
  WITH CHECK (public.can_manage_data());

-- Comentarios para la tabla de trámites
COMMENT ON TABLE tramites IS 'Tabla de trámites (mantenimientos y abonos) para equipos';
COMMENT ON COLUMN tramites.tipo IS 'Tipo de trámite: mantenimiento o abono';
COMMENT ON COLUMN tramites.estado IS 'Estado actual del trámite';
COMMENT ON COLUMN tramites.moneda IS 'Moneda del monto: USD (dólares) o UYU (pesos uruguayos)';

-- Tabla de repuestos
CREATE TABLE IF NOT EXISTS repuestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  unidad TEXT DEFAULT 'unidad',
  stock_actual INTEGER NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  ubicacion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabla de movimientos de repuestos (constancia)
CREATE TABLE IF NOT EXISTS movimientos_repuestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repuesto_id UUID NOT NULL REFERENCES repuestos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'salida', 'ajuste')),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  motivo TEXT,
  referencia_tipo TEXT DEFAULT 'manual' CHECK (referencia_tipo IN ('manual', 'tramite', 'mantenimiento', 'compra', 'ajuste')),
  referencia_id UUID,
  equipo_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  usuario TEXT,
  fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para repuestos y movimientos
CREATE INDEX IF NOT EXISTS idx_repuestos_nombre ON repuestos(nombre);
CREATE INDEX IF NOT EXISTS idx_repuestos_codigo ON repuestos(codigo);
CREATE INDEX IF NOT EXISTS idx_repuestos_categoria ON repuestos(categoria);
CREATE INDEX IF NOT EXISTS idx_repuestos_activo ON repuestos(activo);

CREATE INDEX IF NOT EXISTS idx_mov_repuestos_repuesto_id ON movimientos_repuestos(repuesto_id);
CREATE INDEX IF NOT EXISTS idx_mov_repuestos_tipo ON movimientos_repuestos(tipo);
CREATE INDEX IF NOT EXISTS idx_mov_repuestos_fecha ON movimientos_repuestos(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_mov_repuestos_equipo_id ON movimientos_repuestos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_mov_repuestos_cliente_id ON movimientos_repuestos(cliente_id);

-- Habilitar Row Level Security (RLS) para repuestos y movimientos
ALTER TABLE repuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_repuestos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for repuestos" ON repuestos;
DROP POLICY IF EXISTS "repuestos_select_authenticated" ON repuestos;
DROP POLICY IF EXISTS "repuestos_write_staff" ON repuestos;
CREATE POLICY "repuestos_select_authenticated" ON repuestos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "repuestos_write_staff" ON repuestos
  FOR ALL TO authenticated
  USING (public.can_manage_data())
  WITH CHECK (public.can_manage_data());

DROP POLICY IF EXISTS "Enable all access for movimientos_repuestos" ON movimientos_repuestos;
DROP POLICY IF EXISTS "movimientos_select_authenticated" ON movimientos_repuestos;
DROP POLICY IF EXISTS "movimientos_write_staff" ON movimientos_repuestos;
CREATE POLICY "movimientos_select_authenticated" ON movimientos_repuestos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "movimientos_write_staff" ON movimientos_repuestos
  FOR ALL TO authenticated
  USING (public.can_manage_data())
  WITH CHECK (public.can_manage_data());

-- Comentarios para repuestos y movimientos
COMMENT ON TABLE repuestos IS 'Inventario de repuestos consumibles y de mantenimiento';
COMMENT ON TABLE movimientos_repuestos IS 'Constancia histórica de ingresos, salidas y ajustes de repuestos';
COMMENT ON COLUMN movimientos_repuestos.referencia_tipo IS 'Origen del movimiento: manual, tramite, mantenimiento, compra o ajuste';
