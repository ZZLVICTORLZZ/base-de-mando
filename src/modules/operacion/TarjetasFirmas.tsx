import React, { useState } from 'react';
import { Search, MapPin, Clock, User, Calendar as CalendarIcon, ArrowRight, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { extractChecadasForEco, type TrealChecada } from '../../lib/trealUtils';

export const TarjetasFirmas = () => {
  const [ecoInput, setEcoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<TrealChecada[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!ecoInput.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    setRecords([]);

    // Despachar evento para abrir el Post-it global
    window.dispatchEvent(new CustomEvent('open-postit', { detail: { eco: ecoInput.trim() } }));

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('tablas_treal')
        .select('id, fecha, creado_por, rows, created_at, plantillas_predeterminadas(name)')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tablas_treal:', error);
        setLoading(false);
        return;
      }

      const foundRecords = extractChecadasForEco(data || [], ecoInput.trim());
      foundRecords.sort((a, b) => b.timestamp - a.timestamp);
      setRecords(foundRecords);
    } catch (err) {
      console.error('Error during search:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={24} /> Tarjetas y Firmas de Checada (TREAL)
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Historial de firmas reales (últimos 30 días) y tarjeta de vueltas en vivo para una unidad específica.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', maxWidth: '500px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Ingrese el Número Económico (ECO)..."
            value={ecoInput}
            onChange={(e) => setEcoInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--text-main)',
              fontSize: '1rem'
            }}
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading || !ecoInput.trim()}
          style={{
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            padding: '0 24px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'bold',
            cursor: loading || !ecoInput.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !ecoInput.trim() ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem auto' }}></div>
          Buscando firmas en las tablas TREAL...
        </div>
      )}

      {!loading && hasSearched && records.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--glass-border)' }}>
          <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No se encontraron firmas</p>
          <p style={{ color: 'var(--text-muted)' }}>No hay registros de checadas en TREAL para la unidad <strong>{ecoInput}</strong> en los últimos 30 días.</p>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ marginBottom: '1rem', color: 'var(--text-main)', fontWeight: '500' }}>
            Se encontraron <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{records.length}</span> firmas reales en TREAL para la unidad {records[0].eco}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600' }}><CalendarIcon size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> FECHA</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600' }}><MapPin size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> BASE</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600' }}><Clock size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> HORA</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600' }}>PAX</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600' }}><User size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}/> CHECADOR</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '600' }}>ESTADO / FOTO</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={record.row_id + index} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)', background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '500' }}>{new Date(record.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: 'bold' }}>{record.base_nombre}</td>
                  <td style={{ padding: '16px', color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>{record.horario}</td>
                  <td style={{ padding: '16px', color: '#eab308', fontWeight: 'bold' }}>{record.pax}</td>
                  <td style={{ padding: '16px', color: 'var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ArrowRight size={14} color="var(--text-muted)" />
                      {record.checador}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {record.recaudado ? (
                        <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem' }}>✓ Ponchado</span>
                      ) : record.estado_aforo === 'aforada' ? (
                        <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.85rem' }}>👁 Aforada</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.85rem' }}>⏳ Pendiente</span>
                      )}
                      {record.photoUrl && (
                        <button
                          onClick={() => setPhotoViewerUrl(record.photoUrl!)}
                          style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid #3b82f6', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                        >
                          <Camera size={13} /> Foto
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
