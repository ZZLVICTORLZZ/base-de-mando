import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ListOrdered, LayoutGrid, ArrowLeft, ScanLine } from 'lucide-react';
import { PlantillasPredeterminadas } from './PlantillasPredeterminadas';
import { RolDespegue } from './RolDespegue';
import { OtpProyecciones } from './OtpProyecciones';
import { Incidencias } from '../../pages/Incidencias';

import { supabase } from '../../lib/supabaseClient';

export const Servicio = () => {
  const [view, setView] = useState<'dashboard' | 'tablas_dia' | 'rol_despegue' | 'roles_predeterminados' | 'otp' | 'incidencias'>('dashboard');
  const [rolActivo, setRolActivo] = useState<any>(null);
  const [reporte, setReporte] = useState<any[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchLiveRol = async () => {
      const { data, error } = await supabase
        .from('roles_del_dia')
        .select('*, plantillas_predeterminadas(name)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (!error && data) {
        setRolActivo(data);
        setReporte(Array.isArray(data.rows) ? data.rows : []);
      }
    };

    if (view === 'tablas_dia') {
      fetchLiveRol(); // fetch once immediately
      interval = setInterval(fetchLiveRol, 5000); // poll every 5 seconds
    }

    return () => clearInterval(interval);
  }, [view]);

  // Removido simulador NFC y lógica de despacho a petición del usuario.

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
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Monitor del Rol Activo</h3>
              <p style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>VISTA DE SOLO LECTURA</p>
            </div>
          </div>
          
          <div 
            onClick={() => setView('otp')}
            className="glass-card table-row-hover" 
            style={{ padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <ListOrdered size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>OTP (Proyecciones)</h3>
              <p style={{ color: '#8b5cf6', fontSize: '0.9rem', fontWeight: 600 }}>VISTA DE SOLO LECTURA</p>
            </div>
          </div>

          <div 
            onClick={() => setView('incidencias')}
            className="glass-card table-row-hover" 
            style={{ padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <ScanLine size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Incidencias</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reporte y control de incidencias en tiempo real.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="topbar">
        <button 
          className="btn btn-secondary" 
          onClick={() => setView('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Volver a Opciones
        </button>
      </div>

      <div style={{ flex: 1, padding: '20px 0', overflow: 'auto' }}>
        {view === 'roles_predeterminados' && <PlantillasPredeterminadas />}
        {view === 'rol_despegue' && <RolDespegue />}
        {view === 'otp' && <OtpProyecciones />}
        {view === 'incidencias' && <Incidencias />}
        {view === 'tablas_dia' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
              <div>
                <h2 style={{ color: '#eab308', fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: '0.5rem' }}>
                  MONITOR DEL ROL ACTIVO - BASE INDIOS VERDES
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
                    <th style={{ padding: '16px 12px' }}>HORARIO</th>
                    <th style={{ padding: '16px 12px' }}>ECO</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', color: 'var(--text-muted)' }}>No hay un rol del día activo publicado.</td>
                    </tr>
                  ) : reporte.map(r => {
                    if (!r) return null;
                    return (
                    <tr key={r.id || Math.random()} style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-main)', transition: 'background 0.2s', background: 'transparent' }} className="table-row-hover">
                      <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{r.no}</td>
                      <td style={{ padding: '16px 12px', color: r.frec === 'I.F.' ? 'var(--text-muted)' : '#eab308' }}>{r.frec}</td>
                      <td style={{ padding: '16px 12px' }}>{r.horario || '--:--'}</td>
                      <td style={{ padding: '16px 12px', fontWeight: 'bold', color: r.eco ? '#fff' : 'var(--text-muted)' }}>{r.eco || 'S/A'}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
