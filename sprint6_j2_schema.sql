-- ==============================================================================
-- SPRINT 6: ESQUEMA MOTOR J2 (CHECADORES / TABLERISTAS)
-- Actualización para arquitectura "Saturno V"
-- ==============================================================================

-- 1. ACTUALIZACIÓN DE UNIDADES
-- Se añade la columna tipo_unidad para identificar "Autobús" o "Camioneta"
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS tipo_unidad VARCHAR(50) DEFAULT 'Camioneta';

-- 2. TABLA: J2_ROLES_DESPEGUE (RD)
-- Almacena la cabecera de las tablas creadas en el módulo RD y OTP
CREATE TABLE IF NOT EXISTS public.j2_tablas_operativas (
    id SERIAL PRIMARY KEY,
    tablerista_id UUID REFERENCES public.profiles(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_tabla VARCHAR(20) NOT NULL, -- 'RD', 'OTP', 'CTR'
    base_operativa VARCHAR(100), -- 'Nuevos Paseos', 'Indios Verdes', etc.
    vuelta INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'activa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA: J2_FILAS_OPERATIVAS
-- Almacena las filas de cada tabla (aplicable para RD, OTP, CTR)
CREATE TABLE IF NOT EXISTS public.j2_filas_operativas (
    id SERIAL PRIMARY KEY,
    tabla_id INTEGER REFERENCES public.j2_tablas_operativas(id) ON DELETE CASCADE,
    orden_no INTEGER NOT NULL, -- NO.
    frecuencia VARCHAR(20), -- FREC. (Acepta "I.F." o string numérico)
    hora_paso TIME, -- HORARIO / HORA DE PASO
    eco VARCHAR(50), -- ECO (Número de unidad)
    aforo VARCHAR(50), -- AFORO / PASAJEROS (Acepta sumas explícitas "19+2")
    ruta VARCHAR(100), -- RUTA
    observaciones TEXT, -- OBSERVACIONES
    row_color_hex VARCHAR(10), -- Herramienta Marcatextos Digital
    timestamp_nfc TIMESTAMP WITH TIME ZONE -- Captura real de paso en CTR
);

-- 4. TABLA: J2_INCIDENCIAS_RUTA (MÓDULO REPORTES)
CREATE TABLE IF NOT EXISTS public.j2_incidencias (
    id SERIAL PRIMARY KEY,
    tablerista_id UUID REFERENCES public.profiles(id),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    descripcion TEXT NOT NULL,
    synced_from_offline BOOLEAN DEFAULT FALSE
);

-- 5. POLÍTICAS DE SEGURIDAD PARA NUEVAS TABLAS
ALTER TABLE public.j2_tablas_operativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.j2_filas_operativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.j2_incidencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Full access para Tableristas en tablas" ON public.j2_tablas_operativas FOR ALL USING (true);
CREATE POLICY "Full access para Tableristas en filas" ON public.j2_filas_operativas FOR ALL USING (true);
CREATE POLICY "Full access para Tableristas en incidencias" ON public.j2_incidencias FOR ALL USING (true);
