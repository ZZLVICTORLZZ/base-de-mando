import React, { useState } from 'react';
import { Search, Bus, Activity, AlertCircle, RefreshCw, Camera } from 'lucide-react';
import { supabase } from '../core/supabaseClient';
import { extractChecadasForEco, type TrealChecada } from '../../lib/trealUtils';

export const Monitoreo = () => {
  const [ecoInput, setEcoInput] = useState('');
  const [activeEco, setActiveEco] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [checadas, setChecadas] = useState<TrealChecada[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecoInput.trim()) return;
    setActiveEco(ecoInput.trim());
    fetchDataForEco(ecoInput.trim());
  };

  const fetchDataForEco = async (eco: string) => {
    setLoadingData(true);
    setErrorMsg(null);
    try {
      const { data: trealData, error } = await supabase
        .from('tablas_treal')
        .select(`
          id, 
          fecha, 
          creado_por,
          created_at,
          rows, 
          plantillas_predeterminadas (name)
        `)
        .order('fecha', { ascending: false })
        .limit(500);

      if (error) throw error;

      const allChecadas = extractChecadasForEco(trealData || [], eco);
      // Ordenar más recientes arriba
      allChecadas.sort((a, b) => b.timestamp - a.timestamp);

      setChecadas(allChecadas);

      if (allChecadas.length === 0) {
        setErrorMsg(`No se encontraron registros recientes para la unidad ${eco}`);
      }

    } catch (e) {
      console.error(e);
      setErrorMsg('Error al buscar historial.');
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="topbar" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Monitoreo de Frecuencias</h1>
          <p className="page-subtitle">Rastreo cronológico de validaciones en bases principales y de paso (TREAL).</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search color="var(--text-muted)" size={20} style={{ position: 'absolute', left: '15px', top: '15px' }} />
            <input 
              type="text" 
              placeholder="Ingrese el número de Unidad (ECO)..." 
              value={ecoInput}
              onChange={(e) => setEcoInput(e.target.value)}
              style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loadingData}
            style={{ padding: '15px 30px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            {loadingData ? <RefreshCw className="animate-spin" /> : <Activity />} RASTREAR
          </button>
        </form>
      </div>

      {errorMsg && (
        <div style={{ background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      {activeEco && !errorMsg && checadas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '5px solid var(--primary)', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: 50, height: 50, borderRadius: '25px', backgroundColor: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bus color="var(--primary)" size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Historial Unidad {activeEco}</h2>
                <span style={{ color: 'var(--text-muted)' }}>{checadas.length} checadas recientes en TREAL</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-postit', { detail: { eco: activeEco } }))}
                style={{ padding: '10px 16px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid #eab308', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Abrir Post-it de Firmas
              </button>
              <button 
                onClick={() => fetchDataForEco(activeEco)}
                disabled={loadingData}
                className="glass-button"
                style={{ padding: '10px 16px', background: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} /> Actualizar
              </button>
            </div>
          </div>

          <div className="glass-card">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--text-main)' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 0' }}>Fecha</th>
                  <th>Ubicación (Base)</th>
                  <th>Checador</th>
                  <th>Hora</th>
                  <th>Pax</th>
                  <th>Método de Validación</th>
                  <th>Recaudación</th>
                </tr>
              </thead>
              <tbody>
                {checadas.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                    <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>{c.fecha}</td>
                    <td style={{ fontWeight: 'bold' }}>{c.base_nombre}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.checador}</td>
                    <td style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 'bold' }}>{c.horario}</td>
                    <td style={{ fontWeight: 'bold' }}>{c.pax}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!c.es_manual ? (
                          <span style={{ background: '#10b98120', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✓ {c.photoUrl ? 'QR + Foto' : 'Validado TREAL'}
                          </span>
                        ) : (
                          <span style={{ background: '#f59e0b20', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ⚠ Captura Manual
                          </span>
                        )}
                        {c.photoUrl && (
                          <button
                            onClick={() => setPhotoViewerUrl(c.photoUrl!)}
                            style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid #3b82f6', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                          >
                            <Camera size={13} /> Foto
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      {c.recaudado ? (
                        <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>✓ Ponchado</span>
                      ) : c.estado_aforo === 'aforada' ? (
                        <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.9rem' }}>👁 Aforada</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem' }}>⏳ Pendiente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {photoViewerUrl && (
        <div 
          onClick={() => setPhotoViewerUrl(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <img src={photoViewerUrl} alt="Evidencia" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '8px', border: '2px solid var(--primary)' }} />
        </div>
      )}
    </div>
  );
};
