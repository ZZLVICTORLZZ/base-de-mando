import React, { useState } from 'react';
import { Calendar, Clock, ListOrdered, LayoutGrid, ArrowLeft, ScanLine } from 'lucide-react';
import { PlantillasPredeterminadas } from './PlantillasPredeterminadas';

const mockReporte = [
  { no: 1, frec: 'I.F.', hEntrada: '05:00', hSalida: '05:30', pax: 2, eco: '2540' },
  { no: 2, frec: '25', hEntrada: '05:30', hSalida: '05:55', pax: 3, eco: '2114' },
  { no: 3, frec: '25', hEntrada: '05:55', hSalida: '06:20', pax: 6, eco: '2526' },
  { no: 4, frec: '25', hEntrada: '06:20', hSalida: '06:45', pax: 11, eco: '2541' },
  { no: 5, frec: '25', hEntrada: '06:45', hSalida: '07:10', pax: 16, eco: '2460' },
  { no: 6, frec: '25', hEntrada: '', hSalida: '', pax: 0, eco: '' },
  { no: 7, frec: '20', hEntrada: '', hSalida: '', pax: 0, eco: '' },
];

export const Servicio = () => {
  const [view, setView] = useState<'dashboard' | 'tablas_dia' | 'rol_despegue' | 'roles_predeterminados'>('dashboard');
  const [reporte, setReporte] = useState(mockReporte);

  const simulateNFC = (no: number) => {
    // Fill pending data with current time for demo
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    setReporte(reporte.map(row => {
      if(row.no === no) {
        return { ...row, hEntrada: timeStr, hSalida: timeStr, eco: '2438', pax: Math.floor(Math.random() * 20) + 1 };
      }
      return row;
    }));
  };

  if (view === 'dashboard') {
    return (
      <div className="animate-fade-in">
        <div className="topbar">
          <div>
            <h1 className="page-title">Módulo de Servicio</h1>
            <p className="page-subtitle">Control operativo, frecuencias y despegues de unidades en tiempo real</p>
          </div>
        </div>

        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          <div 
            onClick={() => setView('roles_predeterminados')}
            className="glass-card table-row-hover" 
            style={{ padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ background: 'var(--surface-color)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--text-main)' }}>
              <Calendar size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Roles y Tablas Predeterminadas</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configuración de plantillas base de horarios e intervalos.</p>
            </div>
          </div>

          <div 
            onClick={() => setView('rol_despegue')}
            className="glass-card table-row-hover" 
            style={{ padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#f59e0b' }}>
              <ListOrdered size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Rol de Despegue Diario</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Asignación oficial de unidades a la tabla del día.</p>
            </div>
          </div>

          <div 
            onClick={() => setView('tablas_dia')}
            className="glass-card table-row-hover" 
            style={{ padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <Clock size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Tablas del Día (Tiempo Real)</h3>
              <p style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>MONITOR EN VIVO Y NFC</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => setView('dashboard')}
          title="Regresar a Módulos"
          style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <LayoutGrid size={20} />
        </button>
        <div>
          <h1 className="page-title">
            {view === 'tablas_dia' ? 'Reporte de Salidas' : 
             view === 'rol_despegue' ? 'Rol de Despegue Diario' : 
             'Roles Predeterminados'}
          </h1>
          <p className="page-subtitle">
            {view === 'tablas_dia' ? 'Monitor en vivo conectado a escáner NFC (Base Indios Verdes)' : 
             view === 'rol_despegue' ? 'Asignación de parque vehicular al rol del día' : 
             'Configuración de plantillas maestras por día de la semana'}
          </p>
        </div>
      </div>

      {view === 'tablas_dia' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
            <div>
              <h2 style={{ color: '#eab308', fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '0.5rem' }}>
                REPORTE DE SALIDAS - BASE INDIOS VERDES
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Sistema Operativo Inteligente (Saturno V)</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Checador en Turno: <span style={{ color: 'var(--primary)' }}>Emiliano</span>
              </div>
              <div style={{ color: '#eab308', fontSize: '1rem', fontWeight: 500 }}>
                Fecha: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eab308', color: '#eab308' }}>
                  <th style={{ padding: '16px 12px' }}>NO.</th>
                  <th style={{ padding: '16px 12px' }}>FREC.</th>
                  <th style={{ padding: '16px 12px' }}>H. ENTRADA</th>
                  <th style={{ padding: '16px 12px' }}>H. SALIDA</th>
                  <th style={{ padding: '16px 12px' }}>PAX</th>
                  <th style={{ padding: '16px 12px' }}>ECO</th>
                  <th style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--primary)' }}>Acción (Simulador NFC)</th>
                </tr>
              </thead>
              <tbody>
                {reporte.map(r => (
                  <tr key={r.no} style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-main)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{r.no}</td>
                    <td style={{ padding: '16px 12px', color: r.frec === 'I.F.' ? 'var(--text-muted)' : '#eab308' }}>{r.frec}</td>
                    <td style={{ padding: '16px 12px' }}>{r.hEntrada || '--:--'}</td>
                    <td style={{ padding: '16px 12px' }}>{r.hSalida || '--:--'}</td>
                    <td style={{ padding: '16px 12px', color: '#eab308', fontWeight: 'bold' }}>{r.pax || '-'}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 'bold', color: r.eco ? '#fff' : 'var(--text-muted)' }}>{r.eco || '---'}</td>
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                      {!r.hEntrada ? (
                        <button 
                          onClick={() => simulateNFC(r.no)}
                          style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                          <ScanLine size={16} /> Toque NFC
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          ✓ Registrado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', letterSpacing: '2px', fontSize: '1.2rem' }}>
              TOTAL PASAJEROS (PAX): {reporte.reduce((sum, r) => sum + r.pax, 0)}
            </div>
          </div>
        </div>
      )}

      {view === 'rol_despegue' && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <ListOrdered size={64} color="var(--primary)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
          <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.8rem' }}>Pantalla de Rol de Despegue</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Aquí el tablerista seleccionará el modelo de frecuencias del día y asignará los números económicos a cada horario antes de iniciar la jornada.</p>
        </div>
      )}

      {view === 'roles_predeterminados' && (
        <PlantillasPredeterminadas />
      )}
    </div>
  );
};
