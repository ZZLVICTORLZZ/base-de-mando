import React, { useState, useEffect } from 'react';
import { supabase } from '../modules/core/supabaseClient';
import { Search, Plus, FileText, ArrowLeft, Trash2, Edit3, CheckCircle, Clock } from 'lucide-react';

export const Incidencias = () => {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [hojas, setHojas] = useState<any[]>([]);
  const [incidencias, setIncidencias] = useState<any[]>([]);
  const [selectedHoja, setSelectedHoja] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Carga de hojas
  useEffect(() => {
    if (view === 'list') {
      fetchHojas();
    } else if (view === 'editor' && selectedHoja) {
      fetchIncidencias(selectedHoja.id);
    }
  }, [view, selectedHoja]);

  const fetchHojas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('hojas_incidencias').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setHojas(data);
    }
    setLoading(false);
  };

  const fetchIncidencias = async (hojaId: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('incidencias').select('*').eq('hoja_id', hojaId).order('created_at', { ascending: true });
    if (!error && data) {
      setIncidencias(data);
    }
    setLoading(false);
  };

  const toggleEstadoIncidencia = async (incidencia: any) => {
    const nuevoEstado = incidencia.estado === 'Pendiente' ? 'Resuelto' : 'Pendiente';
    const { error } = await supabase.from('incidencias').update({ estado: nuevoEstado }).eq('id', incidencia.id);
    if (!error) {
      setIncidencias(incidencias.map(i => i.id === incidencia.id ? { ...i, estado: nuevoEstado } : i));
    }
  };

  const deleteHoja = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar esta hoja de incidencias y todos sus reportes?')) {
      await supabase.from('hojas_incidencias').delete().eq('id', id);
      setHojas(hojas.filter(h => h.id !== id));
    }
  };

  const deleteIncidencia = async (id: string) => {
    if (window.confirm('¿Eliminar este reporte de incidencia?')) {
      await supabase.from('incidencias').delete().eq('id', id);
      setIncidencias(incidencias.filter(i => i.id !== id));
    }
  };

  const filteredHojas = hojas.filter(h => 
    h.base.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.fecha.includes(searchTerm)
  );

  if (view === 'editor' && selectedHoja) {
    return (
      <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="topbar" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setView('list')}
            title="Volver a Menú"
            style={{ 
              background: 'var(--surface-color)', 
              border: '1px solid var(--glass-border)', 
              padding: '10px 15px', 
              borderRadius: '25px', 
              color: 'var(--text-main)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
          >
            <ArrowLeft size={20} /> Volver a Menú
          </button>
          <div>
            <h1 className="page-title">Hoja de Incidencias: {selectedHoja.base}</h1>
            <p className="page-subtitle">Fecha: {selectedHoja.fecha} | Estado: {selectedHoja.estado}</p>
          </div>
        </div>

        <div className="glass-panel" style={{ flex: 1, padding: '2rem', overflow: 'auto', marginTop: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ECO</th>
                <th>TIPO</th>
                <th>DESCRIPCIÓN</th>
                <th>REPORTÓ</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {incidencias.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay reportes en esta hoja.</td></tr>
              ) : (
                incidencias.map((inc) => (
                  <tr key={inc.id}>
                    <td><strong>{inc.eco}</strong></td>
                    <td>{inc.tipo}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'normal', color: 'var(--text-muted)' }}>{inc.descripcion || '---'}</td>
                    <td>{inc.reportado_por}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: inc.estado === 'Resuelto' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: inc.estado === 'Resuelto' ? '#10b981' : '#f59e0b'
                      }}>
                        {inc.estado}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          className="btn-icon" 
                          title="Cambiar Estado"
                          onClick={() => toggleEstadoIncidencia(inc)}
                          style={{ color: inc.estado === 'Resuelto' ? '#f59e0b' : '#10b981' }}
                        >
                          {inc.estado === 'Resuelto' ? <Clock size={18} /> : <CheckCircle size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // VISTA LISTA (MENÚ 1)
  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="topbar">
        <div>
          <h1 className="page-title">Registros de Incidencias</h1>
          <p className="page-subtitle">Hojas de reportes de incidencias generadas desde la aplicación J2</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
            <input 
              type="text" 
              placeholder="Buscar hoja..." 
              style={{ 
                width: '100%', 
                padding: '12px 15px 12px 45px', 
                borderRadius: '25px', 
                border: '1px solid rgba(0, 210, 255, 0.3)', 
                background: 'var(--surface-color)', 
                color: 'var(--text-main)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 210, 255, 0.3)'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '2rem', overflow: 'auto', marginTop: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando hojas de incidencias...</div>
        ) : filteredHojas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No hay hojas de incidencias registradas.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredHojas.map((hoja) => (
              <div 
                key={hoja.id}
                className="glass-card table-row-hover"
                onClick={() => { setSelectedHoja(hoja); setView('editor'); }}
                style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '15px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '8px', color: '#ef4444' }}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>{hoja.base}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Fecha: {hoja.fecha}</p>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '12px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold',
                    backgroundColor: hoja.estado === 'Cerrada' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: hoja.estado === 'Cerrada' ? '#10b981' : '#3b82f6'
                  }}>
                    {hoja.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
