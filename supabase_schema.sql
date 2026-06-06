-- ==============================================================================
-- ECOSISTEMA SATURNO V - SPRINT 1
-- Script de Inicialización de Base de Datos Supabase
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLAS CORE Y SEGURIDAD
-- ==============================================================================

-- Roles de Usuario
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    permissions JSONB DEFAULT '{}'::jsonb
);

-- Inserción de Roles Base
INSERT INTO public.roles (name, permissions) VALUES 
('Admin', '{"all": true}'),
('Operador', '{"trips": true, "attendance": true}'),
('Checador', '{"dispatch": true, "validation": true}'),
('Taquilla', '{"sales": true}'),
('Mecanico', '{"maintenance": true}');

-- Perfiles (Extensión de auth.users de Supabase)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    role_id INTEGER REFERENCES public.roles(id),
    nfc_tag VARCHAR(100) UNIQUE,
    is_shadow_mode BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unidades (Flota)
CREATE TABLE public.units (
    id SERIAL PRIMARY KEY,
    numero_economico VARCHAR(20) NOT NULL UNIQUE,
    modelo VARCHAR(50),
    anio INTEGER,
    status VARCHAR(20) DEFAULT 'activo', -- activo, taller, baja
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rutas
CREATE TABLE public.routes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo_plantilla VARCHAR(50) DEFAULT 'semana' -- semana, sabatino, dominical
);

-- ==============================================================================
-- 3. TABLAS DE OPERACIÓN (ROLES DE DESPEGUE)
-- ==============================================================================

-- Asistencia Diaria
CREATE TABLE public.attendance (
    id SERIAL PRIMARY KEY,
    operator_id UUID REFERENCES public.profiles(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    confirma_asistencia BOOLEAN DEFAULT FALSE,
    hora_confirmacion TIMESTAMP WITH TIME ZONE,
    UNIQUE(operator_id, fecha)
);

-- Rol de Despegue Maestro
CREATE TABLE public.dispatch_roles (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES public.routes(id),
    fecha DATE NOT NULL,
    plantilla_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'borrador', -- borrador, publicado, finalizado
    UNIQUE(route_id, fecha)
);

-- Vueltas Asignadas en el Rol (Turnos)
CREATE TABLE public.dispatch_turns (
    id SERIAL PRIMARY KEY,
    dispatch_role_id INTEGER REFERENCES public.dispatch_roles(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES public.units(id),
    operator_id UUID REFERENCES public.profiles(id),
    orden_salida INTEGER NOT NULL,
    hora_salida_programada TIME NOT NULL
);

-- ==============================================================================
-- 4. TABLAS DE CHEQUEO Y RECAUDACIÓN
-- ==============================================================================

-- Viajes (Medias Vueltas / Vueltas)
CREATE TABLE public.trips (
    id SERIAL PRIMARY KEY,
    dispatch_turn_id INTEGER REFERENCES public.dispatch_turns(id),
    hora_inicio TIMESTAMP WITH TIME ZONE,
    hora_fin TIMESTAMP WITH TIME ZONE,
    aforo_operador INTEGER DEFAULT 0,
    aforo_checador INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'en_ruta' -- en_ruta, finalizado, liquidado
);

-- Boletos (Venta Taquilla PWA)
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id INTEGER REFERENCES public.trips(id),
    monto DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Liquidación Diaria
CREATE TABLE public.liquidations (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES public.trips(id) UNIQUE,
    recaudo_total DECIMAL(10, 2) DEFAULT 0.00,
    diesel_cost DECIMAL(10, 2) DEFAULT 0.00,
    casetas_cost DECIMAL(10, 2) DEFAULT 0.00,
    sueldo_operador DECIMAL(10, 2) DEFAULT 200.00, -- Regla Inamovible
    utilidad_neta DECIMAL(10, 2) GENERATED ALWAYS AS (recaudo_total - diesel_cost - casetas_cost - sueldo_operador) STORED,
    status VARCHAR(20) DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABLAS DE MANTENIMIENTO Y SINIESTROS
-- ==============================================================================

CREATE TABLE public.maintenance_logs (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER REFERENCES public.units(id),
    mechanic_id UUID REFERENCES public.profiles(id),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    descripcion TEXT NOT NULL,
    costo DECIMAL(10, 2) DEFAULT 0.00
);

CREATE TABLE public.incidents (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER REFERENCES public.units(id),
    operator_id UUID REFERENCES public.profiles(id),
    tipo VARCHAR(50) NOT NULL, -- Multa, Choque, Corralon
    costo_penalizacion DECIMAL(10, 2) DEFAULT 0.00,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    descripcion TEXT
);

-- ==============================================================================
-- 6. POLÍTICAS DE SEGURIDAD (RLS) - ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica de perfiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Actualizacion propia" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Lectura de unidades" ON public.units FOR SELECT USING (true);

-- ==============================================================================
-- 7. TRIGGERS / FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, is_shadow_mode)
  VALUES (new.id, new.raw_user_meta_data->>'nombre', false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
