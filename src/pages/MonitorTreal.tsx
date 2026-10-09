import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Camera, Calendar, RefreshCw, Car } from 'lucide-react';

export const MonitorTreal = ({ onBack }: { onBack: () => void }) => {
  const [tablas, setTablas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTabla, setSelectedTabla] = useState<any>(null);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

  const fetchTablas = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tablas_treal')
      .select('*')
      .order('id', { ascending: false })
      .limit(50);
    
    if (data) setTablas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTablas();
    
    const channel = supabase.channel('realtime_treal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tablas_treal' }, () => {
        fetchTablas();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (selectedTabla) {
    return (
      <div className="animate-fade-in" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
          <button 
            onClick={() => setSelectedTabla(null)}
            className="glass-button"
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Volver
          </button>
          <div>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Tabla Real (TREAL) - {selectedTabla.base}</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Fecha: {selectedTabla.fecha} | Ruta: {selectedTabla.ruta || 'N/A'}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-color)' }}>
                <th style={{ padding: '1rem' }}>No.</th>
                <th style={{ padding: '1rem' }}>Frec</th>
                <th style={{ padding: '1rem' }}>Horario</th>
                <th style={{ padding: '1rem' }}>Eco</th>
                <th style={{ padding: '1rem' }}>Ruta</th>
                <th style={{ padding: '1rem' }}>Pax</th>
                <th style={{ padding: '1rem' }}>Obs</th>
                <th style={{ padding: '1rem' }}>Evidencia</th>
              </tr>
            </thead>
            <tbody>
              {selectedTabla.rows && selectedTabla.rows.filter((r:any) => !r.isGhost).map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                  <td style={{ padding: '1rem' }}>{row.no}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{row.frec}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{row.horario}</td>
                  <td style={{ padding: '1rem' }}>{row.eco}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      background: row.ruta === 'MEX' ? 'rgba(16, 185, 129, 0.1)' : row.ruta === 'REY' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                      color: row.ruta === 'MEX' ? '#10b981' : row.ruta === 'REY' ? '#ef4444' : '#a855f7'
                    }}>{row.ruta || '-'}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>{row.pax}</td>
                  <td style={{ padding: '1rem' }}>{row.observaciones}</td>
                  <td style={{ padding: '1rem' }}>
                    {row.photoUrl ? (
                      <button 
                        onClick={() => setPhotoViewerUrl(row.photoUrl)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                        <Camera size={14} /> Ver Foto
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin evidencia</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {photoViewerUrl && (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            onClick={() => setPhotoViewerUrl(null)}
          >
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', background: '#000', padding: '1rem', borderRadius: '8px' }}>
              <button 
                onClick={() => setPhotoViewerUrl(null)}
                style={{ position: 'absolute', top: -15, right: -15, background: 'var(--primary)', color: 'white', border: 'none', width: 30, height: 30, borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
                X
              </button>
              <img src={photoViewerUrl} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '1rem' }}>
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={onBack}
          title="Regresar a Módulo de Servicio"
          className="glass-button"
          style={{ padding: '10px', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">Monitor TREAL en Vivo</h1>
          <p className="page-subtitle">Supervisión en tiempo real de salidas, frecuencias y evidencias fotográficas</p>
        </div>
        <button 
          onClick={fetchTablas}
          className="glass-button"
          style={{ padding: '10px', display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="glass-panel">
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-color)' }}>
              <th style={{ padding: '1.2rem' }}>Fecha</th>
              <th style={{ padding: '1.2rem' }}>Base / Ubicación</th>
              <th style={{ padding: '1.2rem' }}>Ruta de Despegue</th>
              <th style={{ padding: '1.2rem' }}>Checador</th>
              <th style={{ padding: '1.2rem' }}>Corridas</th>
              <th style={{ padding: '1.2rem' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && tablas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando información en vivo...</td>
              </tr>
            ) : tablas.map((t: any) => (
              <tr 
                key={t.id} 
                onClick={() => setSelectedTabla(t)}
                style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }} 
                className="table-row-hover"
              >
                <td style={{ padding: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="var(--primary)" />
                    {t.fecha}
                  </div>
                </td>
                <td style={{ padding: '1.2rem', fontWeight: 'bold' }}>{t.base}</td>
                <td style={{ padding: '1.2rem' }}>{t.ruta || 'N/A'}</td>
                <td style={{ padding: '1.2rem', color: 'var(--text-muted)' }}>
                   {t.rows && t.rows.length > 0 ? (t.rows[t.rows.length-1].firmado_por || 'Activo') : 'N/A'}
                </td>
                <td style={{ padding: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Car size={16} />
                    {t.rows ? t.rows.filter((r:any) => !r.isGhost).length : 0} registradas
                  </div>
                </td>
                <td style={{ padding: '1.2rem' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold',
                    background: 'rgba(16, 185, 129, 0.1)', 
                    color: '#10b981' 
                  }}>ACTIVA</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
