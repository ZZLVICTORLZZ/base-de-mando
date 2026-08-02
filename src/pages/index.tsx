import React from 'react';
import { Rocket, Wrench, Users, Archive, Banknote, UsersRound, LayoutDashboard, Truck, Ticket } from 'lucide-react';

const PageTemplate = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <div className="animate-fade-in">
    <div className="topbar">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{description}</p>
      </div>
    </div>
    
    <div className="grid-cards">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="avatar" style={{ background: 'var(--primary-glow)', border: '1px solid var(--glass-border)' }}>
              <Icon size={18} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Módulo {i}</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Información preliminar sobre el área de {title.toLowerCase()}. Próximamente se conectarán los datos en tiempo real de la base central.
          </p>
        </div>
      ))}
    </div>
  </div>
);

import { supabase } from '../modules/core/supabaseClient';
import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

// Inicio: Datos Generales
export const Inicio = () => {
  const [expiringOps, setExpiringOps] = useState<any[]>([]);

  useEffect(() => {
    const fetchExpiringLicenses = async () => {
      const { data } = await supabase.from('operadores').select('nombre, apellidos, apodo, vigencia_licencia');
      if (data) {
        const today = new Date();
        const warningDate = new Date();
        warningDate.setDate(today.getDate() + 30);
        
        const expiring = data.filter(op => {
          if (!op.vigencia_licencia) return false;
          // Asumiendo formato YYYY-MM-DD
          const [year, month, day] = op.vigencia_licencia.split('-').map(Number);
          const vigencia = new Date(year, month - 1, day);
          return vigencia <= warningDate;
        });
        setExpiringOps(expiring);
      }
    };
    fetchExpiringLicenses();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1 className="page-title">Inicio</h1>
          <p className="page-subtitle">Panel General de la Base de Mando Apolo 11</p>
        </div>
      </div>
      
      {expiringOps.length > 0 && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', padding: '15px 20px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
          <AlertCircle color="#ef4444" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: '#ef4444', margin: '0 0 8px 0', fontSize: '1.1rem' }}>Atención: Licencias por Vencer o Vencidas</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {expiringOps.map((op, idx) => {
                const nombreCompleto = `${op.nombre || ''} ${op.apellidos || ''}`.trim();
                const displayName = op.apodo ? `${nombreCompleto} "${op.apodo}"` : nombreCompleto;
                return (
                  <li key={idx}>
                    <strong>{displayName}</strong> - Vence: {op.vigencia_licencia}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <div className="grid-cards" style={{ marginBottom: '2rem' }}>
        {[
          { title: 'Unidades Activas', value: '42 / 50', icon: Truck, trend: '+3%', color: 'var(--primary)' },
          { title: 'Recaudación del Día', value: '$124,500', icon: Banknote, trend: '+12%', color: '#10b981' },
          { title: 'Viajes en Curso', value: '18', icon: Rocket, trend: 'Normal', color: 'var(--secondary)' },
          { title: 'Alertas Críticas', value: '3', icon: Wrench, trend: '-1', color: '#ef4444' },
        ].map((kpi, i) => (
          <div key={i} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 500 }}>{kpi.title}</p>
                <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-main)' }}>{kpi.value}</h2>
              </div>
              <div className="avatar" style={{ background: `var(--surface-color)`, border: `1px solid ${kpi.color}` }}>
                <kpi.icon size={20} color={kpi.color} />
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: kpi.color, fontWeight: 500 }}>
              Tendencia: {kpi.trend}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Mantenimiento = () => <PageTemplate title="Mantenimiento" description="Control de estado y reparaciones de unidades" icon={Wrench} />;
export const Archivo = () => <PageTemplate title="Archivo" description="Registros históricos y documentación" icon={Archive} />;

// Exportar módulos reales PWA (Satélite 2) y Recaudación
export { Aforo } from '../modules/operacion/Aforo';
export { Recaudacion } from '../modules/recaudacion/Recaudacion';
export { Taquilla } from '../modules/taquilla/Taquilla';
export { Incidencias } from './Incidencias';
export { RecursosHumanos } from './RecursosHumanos';
export { Estadisticas } from './Estadisticas';
