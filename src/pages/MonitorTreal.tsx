import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Camera, Calendar as CalendarIcon, Loader2, RefreshCw, Car } from 'lucide-react';

export const MonitorTreal = () => {
  const [tablas, setTablas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTablaId, setSelectedTablaId] = useState<string | null>(null);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

  const fetchTablas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tablas_treal')
      .select('*')
      .order('id', { ascending: false })
      .limit(50);
    
    if (data && data.length > 0) {
      setTablas(data);
      if (!selectedTablaId) setSelectedTablaId(data[0].id);
    } else {
      setTablas([]);
    }
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

  const selectedTabla = tablas.find(t => t.id === selectedTablaId);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', height: '100%' }}>
      {/* Sidebar: Historial de Tablas */}
      <div style={{ width: '300px', background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={18} color="var(--primary)" />
            Historial TREAL
          </h3>
          <button onClick={fetchTablas} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} title="Actualizar">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {loading && tablas.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}><Loader2 className="animate-spin" size={24} /></div>
        ) : tablas.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No hay tablas TREAL registradas.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tablas.map(tabla => (
              <button 
                key={tabla.id}
                onClick={() => setSelectedTablaId(tabla.id)}
                style={{
                  textAlign: 'left', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: tabla.id === selectedTablaId ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface-glass)',
                  border: `1px solid ${tabla.id === selectedTablaId ? 'var(--primary)' : 'var(--glass-border)'}`,
                }}
              >
                <div style={{ color: tabla.id === selectedTablaId ? 'var(--primary)' : 'var(--text-main)', fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>
                  Base: {tabla.base || 'Desconocida'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{tabla.fecha}</span>
                  <span style={{ color: '#10b981' }}>{tabla.ruta || 'N/A'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content: Vista de la Tabla */}
      <div style={{ flex: 1, background: 'var(--surface-glass)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', overflowY: 'auto' }}>
        {selectedTabla ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <Car size={24} />
                  Tabla Real: {selectedTabla.base}
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>Ruta: {selectedTabla.ruta}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedTabla.fecha}</div>
                <div style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '4px' }}>✓ Sincronizado en Vivo</div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--primary)', color: 'var(--primary)' }}>
                    <th style={{ padding: '12px' }}>NO.</th>
                    <th style={{ padding: '12px' }}>FRECUENCIA</th>
                    <th style={{ padding: '12px' }}>HORARIO</th>
                    <th style={{ padding: '12px', color: '#10b981' }}>ECO</th>
                    <th style={{ padding: '12px', color: '#8b5cf6' }}>RUTA</th>
                    <th style={{ padding: '12px', color: '#eab308' }}>PAX</th>
                    <th style={{ padding: '12px' }}>EVIDENCIA</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTabla.rows && selectedTabla.rows.filter((r:any) => !r.isGhost).map((row: any, i: number) => (
                    <tr 
                      key={i} 
                      style={{ borderBottom: '1px solid var(--glass-border)', background: 'transparent' }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '16px 12px', fontWeight: 'bold', color: 'var(--text-main)' }}>{row.no}</td>
                      <td style={{ padding: '16px 12px', color: 'var(--text-main)' }}>{row.frec}</td>
                      <td style={{ padding: '16px 12px', color: '#eab308', fontWeight: 'bold' }}>{row.horario}</td>
                      <td style={{ padding: '16px 12px', color: row.eco ? '#10b981' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        {row.eco || '---'}
                      </td>
                      <td style={{ padding: '16px 12px', color: row.ruta === 'MEX' ? '#10b981' : row.ruta === 'REY' ? '#ef4444' : '#8b5cf6', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {row.ruta || '---'}
                      </td>
                      <td style={{ padding: '16px 12px', color: '#eab308', fontWeight: 'bold' }}>{row.pax || '0'}</td>
                      <td style={{ padding: '16px 12px' }}>
                        {row.photoUrl ? (
                          <button 
                            onClick={() => setPhotoViewerUrl(row.photoUrl)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid #3b82f6', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <Camera size={14} /> Ver Foto
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Selecciona una tabla TREAL del historial para ver sus corridas.
          </div>
        )}
      </div>

      {/* Modal Visor de Foto */}
      {photoViewerUrl && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          onClick={() => setPhotoViewerUrl(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', background: 'transparent', padding: '1rem', borderRadius: '8px' }}>
            <button 
              onClick={() => setPhotoViewerUrl(null)}
              style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', border: 'none', width: 36, height: 36, borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              X
            </button>
            <img src={photoViewerUrl} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', border: '2px solid var(--primary)' }} />
          </div>
        </div>
      )}
    </div>
  );
};
