import React, { useState, useEffect } from 'react';
import { Truck, Plus, Eye, Edit3, Trash2, Save, ArrowLeft, Search, LayoutGrid, Activity, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { isAdmin } from '../../lib/permissions';

const tiposUnidad = ['Sprinter', 'Autobús', 'NV', 'Crafter', 'JAC'];

export const Unidades = () => {
  const [view, setView] = useState<'dashboard' | 'directorio_list' | 'directorio_form' | 'estado_list'>('dashboard');
  const [unidades, setUnidades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uiMessage, setUiMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);
  
  // States for List View Actions
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    setUserIsAdmin(isAdmin());
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('unidades').select('*').order('numero', { ascending: true });
    if (!error && data) {
      setUnidades(data);
    }
    setIsLoading(false);
  };

  const [formData, setFormData] = useState({
    ecoNum: '',
    tipo: 'Sprinter',
    marca: '',
    modelo: '',
    año: '',
    serie: '',
    capacidad: ''
  });

  const handleStatusChange = async (id: string, newStatus: boolean) => {
    const { error } = await supabase.from('unidades').update({ activo: newStatus }).eq('id', id);
    if (!error) {
      setUnidades(unidades.map(u => u.id === id ? { ...u, activo: newStatus } : u));
    }
  };

  const handleEdit = (u: any) => {
    setFormData({
      ecoNum: u.numero || '',
      tipo: u.tipo || 'Sprinter',
      marca: u.marca || '',
      modelo: u.modelo || '',
      año: u.anio || u.año || '',
      serie: u.serie || '',
      capacidad: u.capacidad || ''
    });
    setEditingId(u.id);
    setIsReadOnly(false);
    setView('directorio_form');
  };

  const handleView = (u: any) => {
    setFormData({
      ecoNum: u.numero || '',
      tipo: u.tipo || 'Sprinter',
      marca: u.marca || '',
      modelo: u.modelo || '',
      año: u.anio || u.año || '',
      serie: u.serie || '',
      capacidad: u.capacidad || ''
    });
    setEditingId(u.id);
    setIsReadOnly(true);
    setView('directorio_form');
  };

  const openNewForm = () => {
    setFormData({ ecoNum: '', tipo: 'Sprinter', marca: '', modelo: '', año: '', serie: '', capacidad: '' });
    setEditingId(null);
    setIsReadOnly(false);
    setView('directorio_form');
  };

  const handleDelete = async (id: string, numero: string) => {
    if (!userIsAdmin) {
      alert('Acceso denegado. Solo un administrador puede eliminar unidades.');
      return;
    }
    if (window.confirm(`¿Estás completamente seguro de ELIMINAR la unidad con ECO ${numero}? Esta acción no se puede deshacer.`)) {
      const { error } = await supabase.from('unidades').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        setUnidades(unidades.filter(u => u.id !== id));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      setView('directorio_list');
      return;
    }

    const ecoVal = String(formData.ecoNum).trim();

    setIsSaving(true);
    setUiMessage(null);
    try {
      if (editingId) {
        const payload = {
          numero: ecoVal,
          tipo: formData.tipo,
          marca: formData.marca || null,
          modelo: formData.modelo || null,
          anio: formData.año ? Number(formData.año) : null,
          serie: formData.serie || null,
          capacidad: formData.capacidad ? Number(formData.capacidad) : null
        };
        console.log('Actualizando unidad:', editingId, payload);
        const { data, error } = await supabase.from('unidades').update(payload).eq('id', editingId).select();
        console.log('Resultado update:', { data, error });
        
        setIsSaving(false);
        if (!error) {
          if (!data || data.length === 0) {
             setUiMessage({ type: 'error', text: 'Error de Permisos: Supabase bloqueó la actualización (RLS). Ve a Supabase > Table editor > unidades > RLS y permite el UPDATE.' });
          } else {
             setUiMessage({ type: 'success', text: 'Unidad actualizada correctamente.' });
             setTimeout(() => { setView('directorio_list'); setUiMessage(null); }, 1500);
          }
          await fetchUnidades();
        } else {
          if (error?.message?.includes('duplicate key') || error?.code === '23505') {
            setUiMessage({ type: 'error', text: 'Este número ECO ya está registrado.' });
          } else {
            setUiMessage({ type: 'error', text: 'Error: ' + (error?.message || 'Error desconocido') });
          }
        }
      } else {
        const payload = {
          numero: ecoVal,
          tipo: formData.tipo,
          marca: formData.marca || null,
          modelo: formData.modelo || null,
          anio: formData.año ? Number(formData.año) : null,
          serie: formData.serie || null,
          capacidad: formData.capacidad ? Number(formData.capacidad) : null,
          activo: true
        };
        const { error } = await supabase.from('unidades').insert([payload]);
        
        setIsSaving(false);
        if (!error) {
          await fetchUnidades();
          setUiMessage({ type: 'success', text: 'Unidad registrada correctamente.' });
          setTimeout(() => { setView('directorio_list'); setUiMessage(null); }, 1500);
        } else {
          if (error?.message?.includes('duplicate key') || error?.code === '23505') {
            setUiMessage({ type: 'error', text: 'Este número ECO ya está registrado.' });
          } else {
            setUiMessage({ type: 'error', text: error?.message || 'Error desconocido' });
          }
        }
      }
    } catch (err: any) {
      setIsSaving(false);
      setUiMessage({ type: 'error', text: 'Falla interna: ' + (err?.message || '') });
    }
  };

  const filteredUnidades = unidades.filter(u => 
    (u.numero && u.numero.toString().toLowerCase().includes(searchTerm.toLowerCase())) || 
    (u.serie && u.serie.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (view === 'dashboard') {
    return (
      <div className="animate-fade-in">
        <div className="topbar">
          <div>
            <h1 className="page-title">Módulo de Unidades</h1>
            <p className="page-subtitle">Selecciona un submódulo para operar</p>
          </div>
        </div>

        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          <div 
            onClick={() => setView('directorio_list')}
            className="glass-card table-row-hover" 
            style={{ padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#fff' }}>
              <Truck size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Directorio de Flota</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Registro y listado general de vehículos.</p>
            </div>
          </div>

          <div 
            onClick={() => setView('estado_list')}
            className="glass-card table-row-hover" 
            style={{ padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: 'var(--radius-md)', color: '#10b981' }}>
              <Activity size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Estado de Unidad</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Control de disponibilidad (Activo, Taller, Baja).</p>
            </div>
          </div>

          <div 
            className="glass-card" 
            style={{ padding: '2rem', opacity: 0.6, display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ background: 'var(--surface-color)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Documentación y Seguros</h3>
              <p style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem' }}>EN DESARROLLO</p>
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
            {view === 'directorio_list' || view === 'directorio_form' ? 'Directorio de Flota' : 'Estado de Unidades'}
          </h1>
          <p className="page-subtitle">
            {view === 'directorio_list' ? 'Listado de unidades registradas' : 
             view === 'directorio_form' ? (isReadOnly ? 'Detalles de la unidad' : (editingId ? 'Edición de registro' : 'Registro de nuevo vehículo')) : 
             'Gestión de disponibilidad y estatus'}
          </p>
        </div>
      </div>

      {view === 'directorio_list' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por número económico o serie..." 
                style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }} 
              />
            </div>
            <button 
              onClick={openNewForm}
              style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Plus size={18} /> Registrar Unidad
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Económico</th>
                  <th style={{ padding: '12px' }}>Tipo</th>
                  <th style={{ padding: '12px' }}>No. de Serie</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Año</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Pasajeros</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnidades.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--primary)' }}>{u.numero}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{u.tipo}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{u.serie || 'N/A'}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-main)' }}>{u.anio || u.año}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-main)' }}>{u.capacidad}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleView(u)}
                          title="Visualizar (Solo Lectura)" 
                          style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}>
                          <Eye size={16} />
                        </button>
                        {userIsAdmin && (
                          <>
                            <button 
                              onClick={() => handleEdit(u)}
                              title="Editar Unidad" 
                              style={{ background: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', padding: '6px' }}>
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(u.id, u.numero)}
                              title="Borrar Unidad (Solo Admin)" 
                              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', color: '#ef4444', cursor: 'pointer', padding: '6px' }}>
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUnidades.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron unidades que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'directorio_form' && (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <button 
                type="button"
                onClick={() => setView('directorio_list')}
                style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', margin: 0 }}>
                  {isReadOnly ? 'Visualizar Unidad' : (editingId ? 'Editar Unidad' : 'Nueva Unidad')}
                </h3>
                {isReadOnly && <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Modo Solo Lectura</span>}
              </div>
            </div>

            {uiMessage && (
              <div style={{ padding: '15px', borderRadius: 'var(--radius-sm)', background: uiMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${uiMessage.type === 'error' ? '#ef4444' : '#10b981'}`, color: uiMessage.type === 'error' ? '#ef4444' : '#10b981', fontWeight: 600, textAlign: 'center' }}>
                {uiMessage.text}
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Número Económico</label>
                <input 
                  type="text" 
                  disabled={isReadOnly}
                  value={formData.ecoNum}
                  onChange={e => setFormData({...formData, ecoNum: e.target.value})}
                  placeholder="Ej. 101" 
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Tipo de Unidad</label>
                <select 
                  value={formData.tipo}
                  disabled={isReadOnly}
                  onChange={e => setFormData({...formData, tipo: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none' }}>
                  {tiposUnidad.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Marca</label>
                <input 
                  type="text" 
                  disabled={isReadOnly}
                  value={formData.marca}
                  onChange={e => setFormData({...formData, marca: e.target.value})}
                  placeholder="Ej. Mercedes-Benz" 
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Modelo</label>
                <input 
                  type="text" 
                  disabled={isReadOnly}
                  value={formData.modelo}
                  onChange={e => setFormData({...formData, modelo: e.target.value})}
                  placeholder="Ej. Sprinter 315" 
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Año</label>
                <input 
                  type="number" 
                  disabled={isReadOnly}
                  value={formData.año}
                  onChange={e => setFormData({...formData, año: e.target.value})}
                  placeholder="Ej. 2024" 
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none' }} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Número de Serie (VIN)</label>
                <input 
                  type="text" 
                  disabled={isReadOnly}
                  value={formData.serie}
                  onChange={e => setFormData({...formData, serie: e.target.value})}
                  placeholder="17 caracteres" 
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Capacidad (Pasajeros)</label>
                <input 
                  type="number" 
                  disabled={isReadOnly}
                  value={formData.capacidad}
                  onChange={e => setFormData({...formData, capacidad: e.target.value})}
                  placeholder="Ej. 20" 
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <button 
                type="button"
                onClick={() => setView('directorio_list')}
                style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}>
                {isReadOnly ? 'Volver' : 'Cancelar'}
              </button>
              {(!isReadOnly && userIsAdmin) && (
                <button 
                  type="submit"
                  disabled={isSaving}
                  style={{ background: isSaving ? 'var(--surface-color)' : 'var(--primary)', color: isSaving ? 'var(--text-muted)' : '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: isSaving ? 'none' : '0 0 10px var(--primary-glow)' }}>
                  <Save size={18} /> {isSaving ? 'Procesando...' : (editingId ? 'Actualizar Unidad' : 'Guardar Unidad')}
                </button>
              )}
            </div>

          </form>
        </div>
      )}

      {view === 'estado_list' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Económico</th>
                  <th style={{ padding: '12px' }}>Tipo / Modelo</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Estatus Actual</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Cambiar Estado</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--primary)' }}>{u.numero}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{u.tipo} - {u.modelo}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600,
                        backgroundColor: u.activo ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: u.activo ? '#10b981' : '#f59e0b'
                      }}>
                        {u.activo ? 'Activo' : 'Taller'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <select 
                        value={u.activo ? 'true' : 'false'}
                        onChange={(e) => handleStatusChange(u.id, e.target.value === 'true')}
                        style={{ padding: '8px 12px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none', cursor: 'pointer' }}>
                        <option value="true">Activo</option>
                        <option value="false">Taller</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
