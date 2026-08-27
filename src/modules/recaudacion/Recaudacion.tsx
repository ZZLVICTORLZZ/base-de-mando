import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, Bus, FileText, AlertCircle, RefreshCw, Trash2, Eye, Search, Plus, ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../core/supabaseClient';
import { useNfcReader } from '../../lib/hooks/useNfcReader';

interface Checada {
  treal_id: string;
  fecha: string;
  base_nombre: string;
  row_id: string;
  horario: string;
  pax: string;
  tipo_registro: string;
  recaudado: boolean;
  fecha_recaudacion?: string;
  timestamp: number;
  isMissing?: boolean;
}

interface Vuelta {
  id: string;
  checadas: Checada[];
  completa: boolean;
  yaPonchada: boolean;
}

interface RecaudacionRecord {
  id: string;
  eco: string;
  fecha_recaudo: string;
  vueltas_cobradas: number;
  detalle_checadas: any[];
}

export const Recaudacion = () => {
  const [view, setView] = useState<'list' | 'scan'>('list');
  
  // --- Estado Menú 1 (Historial) ---
  const [recaudaciones, setRecaudaciones] = useState<RecaudacionRecord[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- Estado Menú 2 (Escaneo y Cobro) ---
  const [activeEco, setActiveEco] = useState<string | null>(null);
  const [loadingEco, setLoadingEco] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [vueltas, setVueltas] = useState<Vuelta[]>([]);
  const [selectedMedias, setSelectedMedias] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar historial
  const fetchRecaudaciones = async () => {
    setListLoading(true);
    try {
      const { data, error } = await supabase
        .from('recaudaciones')
        .select('*')
        .order('fecha_recaudo', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setRecaudaciones(data || []);
    } catch (e) {
      console.error('Error fetching recaudaciones', e);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchRecaudaciones();
    }
  }, [view]);

  // Hook NFC - Se activa en cualquier momento y cambia la vista a 'scan'
  useNfcReader({
    onRead: async (uid: string) => {
    if (!uid) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setView('scan');
    setLoadingEco(true);
    
    const cleanUid = uid.replace(/:/g, '');
    
    // Función para invertir bytes (Little Endian vs Big Endian)
    const reverseHex = (hex: string) => {
      if (hex.length % 2 !== 0) return hex;
      const bytes = [];
      for (let i = 0; i < hex.length; i += 2) {
        bytes.push(hex.substring(i, i + 2));
      }
      return bytes.reverse().join('');
    };
    
    const reversedUid = reverseHex(cleanUid);

    const { data: unidadData, error } = await supabase
      .from('unidades')
      .select('numero')
      .or(`nfc_uid.ilike.${cleanUid},nfc_uid.ilike.${reversedUid}`)
      .limit(1)
      .maybeSingle();

    if (error || !unidadData) {
      setErrorMsg(`Tarjeta no reconocida (UID: ${cleanUid} o ${reversedUid})`);
      setLoadingEco(false);
      return;
    }

      setActiveEco(String(unidadData.numero));
      setSelectedMedias({});
      setLoadingEco(false);
    fetchDataForEco(unidadData.numero);
  }});

  const fetchDataForEco = async (rawEco: string) => {
    const eco = String(rawEco).trim();
    setLoadingData(true);
    try {
      const { data: trealData, error } = await supabase
        .from('tablas_treal')
        .select(`
          id, 
          fecha, 
          rows, 
          plantillas_predeterminadas (name)
        `)
        .contains('rows', JSON.stringify([{ eco: eco }]))
        .order('fecha', { ascending: false })
        .limit(2000);

      if (error) throw error;

      let allChecadas: Checada[] = [];

      trealData?.forEach(treal => {
        const plantillas: any = treal.plantillas_predeterminadas;
        const baseName = (Array.isArray(plantillas) ? plantillas[0]?.name : plantillas?.name) || 'Desconocida';
        const baseLower = baseName.toLowerCase();
        
        if (baseLower.includes('lago 2') || baseLower.includes('puente')) {
          return;
        }

        const rows = treal.rows || [];
        rows.forEach((row: any) => {
          if (String(row.eco) === eco && row.horario) {
            let timestamp = 0;
            if (row.horario !== '--:--') {
              const [hh, mm] = row.horario.split(':').map(Number);
              const dateObj = new Date(treal.fecha + 'T12:00:00'); 
              if (!isNaN(hh) && !isNaN(mm)) {
                dateObj.setHours(hh, mm, 0, 0);
                timestamp = dateObj.getTime();
              }
            }

            allChecadas.push({
              treal_id: treal.id,
              fecha: treal.fecha,
              base_nombre: baseName,
              row_id: row.id,
              horario: row.horario,
              pax: row.pax || '0',
              tipo_registro: row.tipo_registro || (row.es_manual ? 'Manual' : 'Desconocido'),
              recaudado: !!row.recaudado,
              fecha_recaudacion: row.fecha_recaudacion,
              timestamp: timestamp
            });
          }
        });
      });

      allChecadas.sort((a, b) => a.timestamp - b.timestamp);

      const agrupadas: Vuelta[] = [];
      let i = 0;
      while (i < allChecadas.length) {
        const c1 = allChecadas[i];
        const c2 = i + 1 < allChecadas.length ? allChecadas[i + 1] : null;

        if (c2 && c1.base_nombre !== c2.base_nombre) {
          // Vuelta completa (bases diferentes)
          const yaPonchada = c1.recaudado && c2.recaudado;
          if (!yaPonchada) {
            agrupadas.push({
              id: `vuelta-${c1.row_id}`,
              checadas: [c1, c2],
              completa: true,
              yaPonchada: false
            });
          }
          i += 2;
        } else {
          // Media vuelta sin regreso (o regreso perdido)
          const missingChecada: Checada = {
            ...c1,
            row_id: `missing-${c1.row_id}`,
            base_nombre: 'FALTANTE',
            horario: '--:--',
            pax: '0',
            isMissing: true,
            recaudado: true, // Se marca como recaudado para que no se cobre
          };
          
          const yaPonchada = c1.recaudado;
          if (!yaPonchada) {
            agrupadas.push({
              id: `vuelta-${c1.row_id}`,
              checadas: [c1, missingChecada],
              completa: false,
              yaPonchada: false
            });
          }
          i += 1;
        }
      }

      // Ordenar vueltas de forma descendente (las más recientes primero)
      agrupadas.sort((a, b) => b.checadas[0].timestamp - a.checadas[0].timestamp);

      setVueltas(agrupadas);
      
      // Auto-seleccionar todas por defecto (solo las reales no cobradas)
      const initialSelection: Record<string, boolean> = {};
      agrupadas.forEach(v => {
        v.checadas.forEach(c => {
          if (!c.isMissing && !c.recaudado) {
            initialSelection[c.row_id] = true;
          }
        });
      });
      setSelectedMedias(initialSelection);

    } catch (e) {
      console.error(e);
      setErrorMsg('Error al cargar historial.');
    } finally {
      setLoadingData(false);
    }
  };

  const toggleMediaSelection = (row_id: string) => {
    setSelectedMedias(prev => ({ ...prev, [row_id]: !prev[row_id] }));
  };

  const handleGuardarRecaudacion = async () => {
    const selectedIds = Object.keys(selectedMedias).filter(id => selectedMedias[id]);
    
    if (selectedIds.length === 0) {
      setErrorMsg('Selecciona al menos una media vuelta para recaudar.');
      return;
    }

    setLoadingData(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const detalleChecadas = [];
    const fechaActual = new Date().toISOString();

    try {
      // 1. Actualizar las tablas_treal
      for (const vuelta of vueltas) {
        for (const checada of vuelta.checadas) {
          if (checada.isMissing || checada.recaudado || !selectedMedias[checada.row_id]) continue;

          detalleChecadas.push({ treal_id: checada.treal_id, row_id: checada.row_id });

          const { data: trealData } = await supabase
            .from('tablas_treal')
            .select('rows')
            .eq('id', checada.treal_id)
            .single();

          if (trealData) {
            const newRows = [...trealData.rows];
            const rowIndex = newRows.findIndex((r: any) => r.id === checada.row_id);
            
            if (rowIndex !== -1) {
              newRows[rowIndex] = {
                ...newRows[rowIndex],
                recaudado: true,
                fecha_recaudacion: fechaActual
              };

              await supabase
                .from('tablas_treal')
                .update({ rows: newRows })
                .eq('id', checada.treal_id);
            }
          }
        }
      }

      // 2. Insertar en recaudaciones
      // Vueltas cobradas puede ser fraccional, lo contaremos como (número de medias vueltas) / 2
      await supabase.from('recaudaciones').insert([{
        eco: activeEco,
        fecha_recaudo: fechaActual,
        vueltas_cobradas: selectedIds.length / 2,
        detalle_checadas: detalleChecadas
      }]);

      setSuccessMsg('Recaudación guardada exitosamente.');
      
      // Regresar a listado principal después de un instante
      setTimeout(() => {
        setView('list');
        setActiveEco(null);
        setSuccessMsg(null);
      }, 2000);

    } catch (e) {
      console.error(e);
      setErrorMsg('Error al guardar la recaudación.');
      setLoadingData(false);
    }
  };

  const handleBorrarRecaudacion = async (record: RecaudacionRecord) => {
    if (!window.confirm(`¿Estás seguro de que deseas borrar la recaudación de la unidad ${record.eco}? Se revertirán las vueltas.`)) {
      return;
    }

    setListLoading(true);
    try {
      // Revertir tablas_treal
      for (const checada of record.detalle_checadas) {
        const { data: trealData } = await supabase
          .from('tablas_treal')
          .select('rows')
          .eq('id', checada.treal_id)
          .single();

        if (trealData) {
          const newRows = [...trealData.rows];
          const rowIndex = newRows.findIndex((r: any) => r.id === checada.row_id);
          
          if (rowIndex !== -1) {
            newRows[rowIndex] = {
              ...newRows[rowIndex],
              recaudado: false,
              fecha_recaudacion: null
            };

            await supabase
              .from('tablas_treal')
              .update({ rows: newRows })
              .eq('id', checada.treal_id);
          }
        }
      }

      // Borrar registro
      await supabase.from('recaudaciones').delete().eq('id', record.id);
      
      // Recargar
      fetchRecaudaciones();
    } catch (e) {
      console.error('Error al borrar recaudacion', e);
      alert('Error al borrar la recaudación');
    } finally {
      setListLoading(false);
    }
  };

  const filteredRecaudaciones = recaudaciones.filter(r => 
    r.eco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      
      {/* VISTA 1: Historial de Recaudaciones */}
      {view === 'list' && (
        <>
          <div className="topbar" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="page-title">Historial de Recaudación</h1>
              <p className="page-subtitle">Visualiza y gestiona los cobros realizados a las unidades.</p>
            </div>
            <button 
              onClick={() => { setView('scan'); setActiveEco(null); setErrorMsg(null); }}
              className="glass-button"
              style={{ 
                background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)', 
                color: '#fff', 
                border: 'none', 
                padding: '10px 24px', 
                fontWeight: '600', 
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <CreditCard size={18} /> Nuevo Escaneo
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por Unidad (ECO)..." 
                  style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }} 
                />
              </div>
              <input 
                type="date" 
                style={{ padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }} 
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>Fecha y Hora</th>
                    <th style={{ padding: '12px' }}>Unidad</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Vueltas Cobradas</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {listLoading && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                        <RefreshCw className="animate-spin" size={24} color="var(--primary)" />
                      </td>
                    </tr>
                  )}
                  {!listLoading && filteredRecaudaciones.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                      <td style={{ padding: '12px', color: 'var(--text-main)' }}>{new Date(r.fecha_recaudo).toLocaleString()}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--primary)' }}>ECO {r.eco}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-main)' }}>
                        <span style={{ background: '#10b98120', color: '#10b981', padding: '4px 10px', borderRadius: '10px', fontWeight: 'bold' }}>
                          {r.vueltas_cobradas}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            title="Ver Detalles"
                            style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '8px', color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleBorrarRecaudacion(r)}
                            title="Deshacer / Borrar Recaudación"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px', borderRadius: '8px', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!listLoading && filteredRecaudaciones.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No hay registros de recaudación.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VISTA 2: Nuevo Escaneo y Recaudación */}
      {view === 'scan' && (
        <>
          <div className="topbar" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={() => setView('list')}
              style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="page-title">Nuevo Cobro</h1>
              <p className="page-subtitle">Acerca la tarjeta a tu lector para procesar el pago de la unidad.</p>
            </div>
          </div>

          {errorMsg && (
            <div style={{ background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#10b98120', border: '1px solid #10b981', color: '#10b981', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={20} /> {successMsg}
            </div>
          )}

          {!activeEco && !loadingEco && (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <CreditCard size={64} color="var(--primary)" className="animate-pulse" style={{ marginBottom: '1rem', opacity: 0.8 }} />
              <h2 style={{ color: 'var(--text-main)' }}>Esperando Tarjeta NFC...</h2>
              <p style={{ color: 'var(--text-muted)' }}>Asegúrate de que Wakdev o el emulador esté ejecutándose.</p>
            </div>
          )}

          {loadingEco && (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <RefreshCw size={48} color="var(--primary)" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ color: 'var(--text-main)' }}>Procesando Tarjeta...</h2>
            </div>
          )}

          {activeEco && !loadingEco && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '5px solid var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: 50, height: 50, borderRadius: '25px', backgroundColor: 'var(--surface-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bus color="var(--primary)" size={24} />
                  </div>
                  <div style={{ background: 'red', color: 'white', padding: '10px', fontWeight: 'bold', borderRadius: '5px', marginBottom: '15px' }}>
                    🚩 SI VES ESTE RECUADRO ROJO, ESTÁS VIENDO LA VERSIÓN MÁS RECIENTE DEL CÓDIGO
                  </div>
                  <div>
                    <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>UNIDAD {activeEco}</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Selecciona las vueltas a recaudar</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => fetchDataForEco(activeEco)}
                    disabled={loadingData}
                    className="glass-button"
                  >
                    <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
                  </button>
                  <button 
                    onClick={handleGuardarRecaudacion}
                    disabled={loadingData || Object.values(selectedMedias).filter(Boolean).length === 0}
                    style={{ 
                      background: 'var(--primary)', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '12px 24px', 
                      borderRadius: '8px', 
                      fontSize: '1rem', 
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: (loadingData || Object.values(selectedMedias).filter(Boolean).length === 0) ? 'not-allowed' : 'pointer', 
                      opacity: (loadingData || Object.values(selectedMedias).filter(Boolean).length === 0) ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <Save size={18} /> Procesar Pago ({Object.values(selectedMedias).filter(Boolean).length} Medias Vueltas)
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {vueltas.length === 0 && !loadingData && (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ color: 'var(--text-main)', margin: 0 }}>Todo al corriente</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Esta unidad no tiene vueltas pendientes de pago.</p>
                  </div>
                )}

                {vueltas.map((vuelta, idx) => {
                  const getHoyDate = () => {
                    const d = new Date();
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  };
                  
                  const esHoy = vuelta.checadas[0].fecha === getHoyDate();
                  const borderColor = esHoy ? '#3b82f6' : '#8b5cf6';

                  return (
                  <div key={vuelta.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: `4px solid ${borderColor}`, opacity: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Vuelta #{vueltas.length - idx}
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: esHoy ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)', color: borderColor, fontWeight: 'bold' }}>
                          {esHoy ? 'Hoy' : vuelta.checadas[0].fecha}
                        </span>
                      </h3>
                      <span style={{ color: vuelta.completa ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                        {vuelta.completa ? 'Completa' : 'Incompleta'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      {vuelta.checadas.map((c, i) => (
                        c.isMissing ? (
                          <div key={c.row_id} style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '8px', color: '#ef4444', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={16} />
                            MEDIA VUELTA SIN REGISTRAR
                          </div>
                        ) : (
                          <div key={c.row_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', opacity: c.recaudado ? 0.5 : 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <input 
                                type="checkbox" 
                                checked={!!selectedMedias[c.row_id] || c.recaudado}
                                onChange={() => toggleMediaSelection(c.row_id)}
                                disabled={c.recaudado}
                                style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: c.recaudado ? 'not-allowed' : 'pointer' }}
                              />
                              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: i === 0 ? 'var(--primary)' : 'var(--text-muted)' }}></div>
                              <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>{(c.base_nombre || 'Desconocida').toUpperCase()}</span>
                              {c.recaudado && <span style={{ fontSize: '0.7rem', background: '#10b98120', color: '#10b981', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px', fontWeight: 'bold' }}>YA COBRADA</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              {c.tipo_registro === 'NFC' ? 
                                <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={12}/> NFC</span> :
                                <span style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>Manual</span>
                              }
                              <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{c.pax} PAX</span>
                              <div style={{ background: 'var(--surface-color)', padding: '4px 10px', borderRadius: '6px' }}>
                                <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{c.horario}</span>
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )})}
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
};
