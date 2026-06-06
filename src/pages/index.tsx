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

// Inicio: Datos Generales
export const Inicio = () => (
  <div className="animate-fade-in">
    <div className="topbar">
      <div>
        <h1 className="page-title">Inicio</h1>
        <p className="page-subtitle">Panel General de la Base de Mando Apolo 11</p>
      </div>
    </div>
    
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

export const Estadisticas = () => <PageTemplate title="Estadísticas" description="Análisis profundo y reportes detallados" icon={LayoutDashboard} />;
export const Mantenimiento = () => <PageTemplate title="Mantenimiento" description="Control de estado y reparaciones de unidades" icon={Wrench} />;
export const Archivo = () => <PageTemplate title="Archivo" description="Registros históricos y documentación" icon={Archive} />;

// Exportar módulos reales PWA (Satélite 2) y Recaudación
export { Aforo } from '../modules/operacion/Aforo';
export { Recaudacion } from '../modules/recaudacion/Recaudacion';
export { Taquilla } from '../modules/taquilla/Taquilla';
