-- ==============================================================================
-- ECOSISTEMA SATURNO V - SPRINT 2
-- Script para Costos Dinámicos
-- ==============================================================================

CREATE TABLE public.dynamic_costs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL, -- ej. 'litro', 'viaje', 'fijo'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar costos base
INSERT INTO public.dynamic_costs (name, value, unit) VALUES 
('Diesel', 24.50, 'litro'),
('Caseta Tipo A', 150.00, 'viaje'),
('Caseta Tipo B', 85.00, 'viaje'),
('Fianza Diaria', 100.00, 'fijo'),
('Fondo de Seguridad', 50.00, 'fijo');

ALTER TABLE public.dynamic_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica de costos" ON public.dynamic_costs FOR SELECT USING (true);
CREATE POLICY "Actualizacion de costos" ON public.dynamic_costs FOR UPDATE USING (true); -- Idealmente restringir a Admin
