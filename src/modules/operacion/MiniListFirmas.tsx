import React, { useState, useEffect, useRef } from 'react';
import { Eye, DollarSign, X, GripHorizontal, RefreshCw, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { extractChecadasForEco, pairVueltasForEco, type TrealChecada, type TrealVuelta } from '../../lib/trealUtils';

interface MiniListFirmasProps {
  eco?: string | null;
  initialPosition?: { x: number, y: number };
  onClose?: () => void;
}

export const MiniListFirmas: React.FC<MiniListFirmasProps> = ({ eco, initialPosition, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [vueltas, setVueltas] = useState<TrealVuelta[]>([]);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(initialPosition || { x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 360) : 800, y: 80 });
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const [modalidad, setModalidad] = useState('A Aforo');

  const fetchFirmas = async () => {
    if (!eco) return;
    setLoading(true);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const { data: unidad } = await supabase.from('unidades').select('modalidad').eq('numero', String(eco).trim()).maybeSingle();
      if (unidad) {
        setModalidad(unidad.modalidad || 'A Cuenta');
      }

      const { data: trealData, error } = await supabase
        .from('tablas_treal')
        .select('id, fecha, creado_por, created_at, rows, plantillas_predeterminadas(name)')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('fecha', { ascending: false })
        .limit(300);

      if (!error && trealData) {
        const allChecadas = extractChecadasForEco(trealData, eco);
        const groupedVueltas = pairVueltasForEco(allChecadas, false);
        setVueltas(groupedVueltas);
      } else {
        console.error('Error fetching tablas_treal in MiniListFirmas:', error);
      }
    } catch (e) {
      console.error('Error in MiniListFirmas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirmas();
    const channel = supabase
      .channel(`postit_treal_${eco}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tablas_treal' }, () => {
        fetchFirmas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eco]);

  const toggleAforo = async (firma: TrealChecada, vueltaId: string) => {
    if (firma.isMissing) return;

    const newStatus = firma.estado_aforo === 'aforada' ? 'pendiente' : 'aforada';
    const nowIso = new Date().toISOString();

    // Actualizar optimistamente en pantalla
    setVueltas(prev => prev.map(v => {
      if (v.id !== vueltaId) return v;
      return {
        ...v,
        checadas: v.checadas.map(f => f.row_id === firma.row_id ? { ...f, estado_aforo: newStatus } : f)
      };
    }));

    // Persistir en tablas_treal.rows (la fuente de verdad del campo)
    const { data: trealData } = await supabase
      .from('tablas_treal')
      .select('rows')
      .eq('id', firma.treal_id)
      .single();

    if (trealData && Array.isArray(trealData.rows)) {
      const updatedRows = trealData.rows.map((r: any) => {
        if (String(r.id) === String(firma.row_id)) {
          return {
            ...r,
            estado_aforo: newStatus,
            fecha_aforo: newStatus === 'aforada' ? nowIso : null
          };
        }
        return r;
      });
      await supabase.from('tablas_treal').update({ rows: updatedRows }).eq('id', firma.treal_id);
    }
  };

  const markRecaudadaFirma = async (firma: TrealChecada, vueltaId: string) => {
    if (firma.isMissing) return;
    const isAforoRequired = modalidad !== 'A Cuenta';
    const canRecaudar = !isAforoRequired || firma.estado_aforo === 'aforada';
    if (!canRecaudar) return;

    if (window.confirm(`¿Marcar esta media vuelta (${firma.base_nombre} - ${firma.horario}) como recaudada?`)) {
      const nowIso = new Date().toISOString();

      // Remover o marcar en la vista local
      setVueltas(prev => prev.map(v => {
        if (v.id !== vueltaId) return v;
        const updatedChecadas = v.checadas.map(f => f.row_id === firma.row_id ? { ...f, recaudado: true } : f);
        return {
          ...v,
          checadas: updatedChecadas
        };
      }).filter(v => v.checadas.some(f => !f.isMissing && !f.recaudado)));

      // 1. Actualizar tablas_treal.rows
      const { data: trealData } = await supabase
        .from('tablas_treal')
        .select('rows')
        .eq('id', firma.treal_id)
        .single();

      if (trealData && Array.isArray(trealData.rows)) {
        const updatedRows = trealData.rows.map((r: any) => {
          if (String(r.id) === String(firma.row_id)) {
            return {
              ...r,
              recaudado: true,
              fecha_recaudacion: nowIso
            };
          }
          return r;
        });
        await supabase.from('tablas_treal').update({ rows: updatedRows }).eq('id', firma.treal_id);
      }

      // 2. Registrar en historial de recaudaciones (0.5 vueltas = 1 media vuelta)
      await supabase.from('recaudaciones').insert([{
        eco: String(eco).trim(),
        fecha_recaudo: nowIso,
        vueltas_cobradas: 0.5,
        detalle_checadas: [{ treal_id: firma.treal_id, row_id: firma.row_id }]
      }]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position]);

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '360px',
        maxHeight: '480px',
        background: 'var(--surface-color)',
        border: '1px solid #eab308', 
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 10px 25px rgba(234, 179, 8, 0.25)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div 
        onMouseDown={handleMouseDown}
        style={{
          padding: '10px 15px',
          background: 'rgba(234, 179, 8, 0.12)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'grab',
          borderTopLeftRadius: 'var(--radius-md)',
          borderTopRightRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GripHorizontal size={16} color="#eab308" />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#eab308', fontWeight: 'bold' }}>
              Firmas TREAL • ECO {eco}
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Modalidad: {modalidad} (Nuevos → Indios)</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchFirmas} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Actualizar">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Cerrar">
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
        {vueltas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {loading ? 'Cargando checadas de TREAL...' : 'No hay vueltas pendientes en TREAL.'}
          </div>
        ) : (
          vueltas.map((vuelta, vIdx) => {
            const isAforoRequired = modalidad !== 'A Cuenta';

            return (
              <div 
                key={vuelta.id}
                style={{
                  marginBottom: '10px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--glass-border)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Vuelta #{vueltas.length - vIdx} • {vuelta.fecha}</span>
                  <span style={{ color: vuelta.completa ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                    {vuelta.completa ? 'Completa' : 'Falta firma'}
                  </span>
                </div>

                {/* Lista de Firmas en la Vuelta (Siempre [Nuevos Paseos, Indios Verdes]) */}
                <div style={{ padding: '10px' }}>
                  {vuelta.checadas.map((firma, i) => {
                    if (firma.isMissing) {
                      return (
                        <div key={firma.row_id} style={{ padding: '6px 8px', margin: '4px 0', border: '1px dashed #ef4444', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.08)' }}>
                          <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 'bold' }}>⚠️ {firma.base_nombre}</span>
                        </div>
                      );
                    }

                    const isAforada = firma.estado_aforo === 'aforada';
                    const canRecaudar = !isAforoRequired || isAforada;

                    return (
                      <div key={firma.row_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i === 0 && vuelta.checadas.length > 1 ? '1px dashed rgba(255,255,255,0.1)' : 'none', opacity: firma.recaudado ? 0.5 : 1 }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {i === 0 ? '1. ' : '2. '}{firma.base_nombre}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                            {firma.horario} <span style={{ color: '#eab308' }}>({firma.pax} pax)</span> <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>• {firma.checador}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          {firma.photoUrl && (
                            <button
                              onClick={() => setPhotoPreviewUrl(firma.photoUrl!)}
                              title="Ver foto de evidencia"
                              style={{
                                width: '28px', height: '28px', borderRadius: '4px',
                                background: 'rgba(59, 130, 246, 0.15)',
                                border: '1px solid #3b82f6',
                                color: '#3b82f6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                              }}
                            >
                              <Camera size={13} />
                            </button>
                          )}
                          {isAforoRequired && !firma.recaudado && (
                            <button 
                              onClick={() => toggleAforo(firma, vuelta.id)}
                              title={isAforada ? "Aforo validado" : "Validar aforo"}
                              style={{
                                width: '28px', height: '28px', borderRadius: '4px',
                                background: isAforada ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${isAforada ? '#3b82f6' : 'var(--glass-border)'}`,
                                color: isAforada ? '#3b82f6' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                              }}
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          {!firma.recaudado ? (
                            <button 
                              onClick={() => markRecaudadaFirma(firma, vuelta.id)}
                              title={canRecaudar ? "Recaudar Media Vuelta" : "Falta validar aforo primero"}
                              style={{
                                width: '28px', height: '28px', borderRadius: '4px',
                                background: canRecaudar ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${canRecaudar ? '#10b981' : 'var(--glass-border)'}`,
                                color: canRecaudar ? '#10b981' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canRecaudar ? 'pointer' : 'not-allowed',
                                opacity: canRecaudar ? 1 : 0.5
                              }}
                            >
                              <DollarSign size={14} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, padding: '2px 5px', border: '1px solid #10b981', borderRadius: '4px' }}>
                              COBRADA
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Lagos 2 (Informativas) */}
                  {vuelta.lagos.length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>Paso intermedio (Lagos 2):</div>
                      {vuelta.lagos.map((l) => (
                        <div key={l.row_id} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{l.horario} ({l.pax} pax)</span>
                          <span>{l.checador}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {photoPreviewUrl && (
        <div
          onClick={() => setPhotoPreviewUrl(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 20000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <img src={photoPreviewUrl} alt="Evidencia" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '8px', border: '2px solid var(--primary)' }} />
        </div>
      )}
    </div>
  );
};
