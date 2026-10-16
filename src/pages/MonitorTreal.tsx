import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Camera, Calendar as CalendarIcon, Loader2, RefreshCw, Car, Filter, FileSignature } from 'lucide-react';
import { getTrealBase, getTrealChecador } from '../lib/trealUtils';

export const MonitorTreal = () => {
  const [tablas, setTablas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTablaId, setSelectedTablaId] = useState<string | null>(null);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);
  const [unidadesCapMap, setUnidadesCapMap] = useState<Record<string, number>>({});

  // Filtros en barra lateral
  const [baseFilter, setBaseFilter] = useState<string>('TODAS');
  const [dateFilter, setDateFilter] = useState<string>('');

  const fetchUnidades = async () => {
    const { data } = await supabase.from('unidades').select('numero, capacidad').eq('activo', true);
    if (data) {
      const map: Record<string, number> = {};
      data.forEach((u: any) => {
        const clean = String(u.numero || '').replace(/[^0-9]/g, '');
        if (clean) map[clean] = Number(u.capacidad) || 0;
      });
      setUnidadesCapMap(map);
    }
  };

  const fetchTablas = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data } = await supabase
      .from('tablas_treal')
      .select('*, plantillas_predeterminadas(name)')
      .order('id', { ascending: false })
      .limit(80);
    
    if (data && data.length > 0) {
      setTablas(data);
      setSelectedTablaId(prev => prev || data[0].id);
    } else {
      setTablas([]);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchUnidades();
    fetchTablas(false);
    
    // Suscripción Zero-Flicker en tiempo real
    const channel = supabase.channel('realtime_treal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tablas_treal' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setTablas(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
        } else if (payload.eventType === 'INSERT') {
          setTablas(prev => [payload.new, ...prev]);
          setSelectedTablaId(prev => prev || payload.new.id);
        } else if (payload.eventType === 'DELETE') {
          setTablas(prev => prev.filter(t => t.id !== payload.old.id));
        } else {
          fetchTablas(true);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredTablas = useMemo(() => {
    return tablas.filter(t => {
      const base = getTrealBase(t).toLowerCase();
      if (baseFilter !== 'TODAS') {
        if (baseFilter === 'INDIOS' && !base.includes('indios')) return false;
        if (baseFilter === 'NUEVOS' && !base.includes('nuevos')) return false;
        if (baseFilter === 'LAGOS' && !base.includes('lago')) return false;
      }
      if (dateFilter && t.fecha !== dateFilter) return false;
      return true;
    });
  }, [tablas, baseFilter, dateFilter]);

  const selectedTabla = tablas.find(t => t.id === selectedTablaId) || filteredTablas[0] || null;
  const activeRows = useMemo(() => {
    if (!selectedTabla || !Array.isArray(selectedTabla.rows)) return [];
    return selectedTabla.rows.filter((r: any) => !r.isGhost);
  }, [selectedTabla]);

  const totalPaxTabla = useMemo(() => {
    return activeRows.reduce((acc: number, r: any) => {
      const n = parseInt(String(r.pax || '').replace(/[^0-9]/g, ''), 10);
      return acc + (isNaN(n) ? 0 : n);
    }, 0);
  }, [activeRows]);

  const openUnitPostIt = (eco: string) => {
    if (!eco || eco === '---') return;
    window.dispatchEvent(new CustomEvent('open-postit', { detail: { eco: String(eco).trim() } }));
  };

  return (
    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', height: '100%' }}>
      {/* Sidebar: Historial y Filtros de Tablas TREAL */}
      <div style={{ width: '320px', background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', maxHeight: '82vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={18} color="var(--primary)" />
            Historial TREAL
          </h3>
          <button onClick={() => fetchTablas(false)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} title="Actualizar">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filtros Rápidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { id: 'TODAS', label: 'Todas' },
              { id: 'NUEVOS', label: 'Nuevos' },
              { id: 'INDIOS', label: 'Indios' },
              { id: 'LAGOS', label: 'Lagos 2' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setBaseFilter(tab.id)}
                style={{
                  flex: 1,
                  padding: '5px 6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: `1px solid ${baseFilter === tab.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                  background: baseFilter === tab.id ? 'var(--primary-glow)' : 'transparent',
                  color: baseFilter === tab.id ? 'var(--primary)' : 'var(--text-muted)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Filter size={14} color="var(--text-muted)" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                flex: 1,
                padding: '5px 8px',
                fontSize: '0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--glass-border)',
                background: 'var(--bg-color)',
                color: 'var(--text-main)'
              }}
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
        
        {loading && tablas.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}><Loader2 className="animate-spin" size={24} /></div>
        ) : filteredTablas.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No hay tablas TREAL para este filtro.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
            {filteredTablas.map(tabla => {
              const realCount = Array.isArray(tabla.rows) ? tabla.rows.filter((r: any) => !r.isGhost && r.eco).length : 0;
              const isSelected = selectedTabla?.id === tabla.id;
              return (
                <button 
                  key={tabla.id}
                  onClick={() => setSelectedTablaId(tabla.id)}
                  style={{
                    textAlign: 'left', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    background: isSelected ? 'var(--primary-glow)' : 'var(--surface-glass)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--glass-border)'}`,
                  }}
                >
                  <div style={{ color: isSelected ? 'var(--primary)' : 'var(--text-main)', fontWeight: 700, fontSize: '0.98rem', marginBottom: '2px' }}>
                    {getTrealBase(tabla)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '6px' }}>
                    Checador: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{getTrealChecador(tabla)}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{tabla.fecha}</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>{realCount} salidas</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content: Vista de la Tabla */}
      <div style={{ flex: 1, background: 'var(--surface-glass)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', overflowY: 'auto' }}>
        {selectedTabla ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <Car size={24} />
                  TABLA EN TIEMPO REAL — {getTrealBase(selectedTabla)}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Checador en turno: <strong style={{ color: 'var(--text-main)' }}>{getTrealChecador(selectedTabla)}</strong>
                  <span style={{ margin: '0 10px' }}>•</span>
                  Haz clic en cualquier <strong>ECO</strong> para abrir su tarjeta de vueltas y aforo en vivo.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', padding: '6px 14px', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Despachos</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{activeRows.length}</div>
                </div>
                <div style={{ textAlign: 'center', padding: '6px 14px', borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total PAX</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#eab308' }}>{totalPaxTabla}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: 'bold' }}>{selectedTabla.fecha}</div>
                  <div style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '2px', fontWeight: 600 }}>● Sincronizado en Vivo</div>
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '1.05rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontSize: '0.9rem' }}>
                    <th style={{ padding: '12px 8px' }}>NO.</th>
                    <th style={{ padding: '12px 8px' }}>FREC.</th>
                    <th style={{ padding: '12px 8px' }}>HORARIO</th>
                    <th style={{ padding: '12px 8px', color: '#10b981' }}>ECO (FIRMAS)</th>
                    <th style={{ padding: '12px 8px', color: '#8b5cf6' }}>RUTA</th>
                    <th style={{ padding: '12px 8px', color: '#eab308' }}>PAX / CUPO</th>
                    <th style={{ padding: '12px 8px' }}>OBSERVACIONES</th>
                    <th style={{ padding: '12px 8px' }}>ESTADO / EVIDENCIA</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((row: any, i: number) => {
                    const ecoClean = String(row.eco || '').replace(/[^0-9]/g, '');
                    const unitCap = ecoClean ? (unidadesCapMap[ecoClean] || 0) : 0;
                    const paxNum = parseInt(String(row.pax || '').replace(/[^0-9]/g, ''), 10);
                    const hasPax = !isNaN(paxNum) && paxNum > 0;
                    const fillPercent = unitCap > 0 && hasPax ? Math.min(100, Math.round((paxNum / unitCap) * 100)) : 0;
                    const extraPax = unitCap > 0 && hasPax && paxNum > unitCap ? paxNum - unitCap : 0;

                    return (
                      <tr 
                        key={row.id || i} 
                        style={{
                          borderBottom: '1px solid var(--glass-border)',
                          background: row.highlightColor ? `${row.highlightColor}40` : 'transparent',
                          outline: row.es_manual ? '1px dashed rgba(249, 115, 22, 0.6)' : 'none'
                        }}
                        className="table-row-hover"
                      >
                        <td style={{ padding: '14px 8px', fontWeight: 900, color: 'var(--text-main)' }}>{row.no}</td>
                        <td style={{ padding: '14px 8px', fontWeight: 800, color: 'var(--text-main)' }}>{row.frec || '---'}</td>
                        <td style={{ padding: '14px 8px', color: '#eab308', fontWeight: 900 }}>{row.horario}</td>
                        <td style={{ padding: '14px 8px' }}>
                          {row.eco ? (
                            <button
                              onClick={() => openUnitPostIt(row.eco)}
                              title="Abrir Post-it de Firmas y Recaudación de esta unidad"
                              style={{
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#10b981',
                                fontWeight: 900,
                                fontSize: '1.1rem',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {row.eco}
                              <FileSignature size={14} />
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>---</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 8px', color: row.ruta === 'MEX' ? '#10b981' : row.ruta === 'REY' ? '#ef4444' : '#8b5cf6', fontWeight: 900 }}>
                          {row.ruta || '---'}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{ color: '#eab308', fontWeight: 900, fontSize: '1.05rem' }}>{row.pax || '0'}</span>
                        </td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.9rem', minWidth: '190px', maxWidth: '260px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <div>
                              {row.observaciones || <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>}
                            </div>
                            {hasPax && unitCap > 0 && (
                              <div style={{ width: '100%', maxWidth: '170px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, lineHeight: 1 }}>
                                  {paxNum} de {unitCap}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '5px', marginTop: '3px' }}>
                                  <div style={{ flex: 1, height: '5px', background: 'rgba(148, 163, 184, 0.25)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${fillPercent}%`, height: '100%', background: paxNum >= unitCap ? '#10b981' : '#3b82f6', borderRadius: '3px' }} />
                                  </div>
                                  {extraPax > 0 && (
                                    <span style={{ fontSize: '0.72rem', color: '#eab308', fontWeight: 900, lineHeight: 1 }}>
                                      +{extraPax}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {row.recaudado ? (
                              <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.35)', fontWeight: 800 }}>
                                💲 Ponchada
                              </span>
                            ) : row.estado_aforo === 'aforada' ? (
                              <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.35)', fontWeight: 800 }}>
                                👁 Aforada
                              </span>
                            ) : row.es_manual ? (
                              <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '6px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.35)', fontWeight: 700 }}>
                                Manual
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700 }}>
                                QR
                              </span>
                            )}

                            {row.photoUrl ? (
                              <button 
                                onClick={() => setPhotoViewerUrl(row.photoUrl)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid #3b82f6', padding: '5px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
                                <Camera size={14} /> Foto
                              </button>
                            ) : row.photoUploadStatus === 'pending' || row.photoUploadStatus === 'uploading' ? (
                              <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700 }}>⏳ Subiendo foto...</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
