import React, { useState } from 'react';
import { Truck, Plus, Eye, Edit3, Save, ArrowLeft, Search, LayoutGrid, Activity, ShieldAlert } from 'lucide-react';

const tiposUnidad = ['Sprinter', 'Autobús', 'NV', 'Crafter', 'JAC'];

const initialUnidades = [
  { id: 1, eco: 'ECO 01', tipo: 'Sprinter', marca: 'Mercedes-Benz', modelo: 'Sprinter 315', año: 2022, serie: 'VIN1234567890ABCD', capacidad: 20, estado: 'Activo' },
  { id: 2, eco: 'ECO 10', tipo: 'Autobús', marca: 'Mercedes-Benz', modelo: 'Toreto', año: 2020, serie: 'VIN0987654321WXYZ', capacidad: 45, estado: 'Taller' },
  { id: 3, eco: 'ECO 05', tipo: 'Crafter', marca: 'Volkswagen', modelo: 'Crafter Pasajeros', año: 2023, serie: 'VIN5678901234FGHJ', capacidad: 21, estado: 'Activo' },
];

export const Unidades = () => {
  const [view, setView] = useState<'dashboard' | 'directorio_list' | 'directorio_form' | 'estado_list'>('dashboard');
  const [unidades, setUnidades] = useState(initialUnidades);
  
  // States for List View Actions
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [formData, setFormData] = useState({
    ecoNum: '',
    tipo: 'Sprinter',
    marca: '',
    modelo: '',
    año: '',
    serie: '',
    capacidad: ''
  });

  const handleStatusChange = (id: number, newStatus: string) => {
    setUnidades(unidades.map(u => u.id === id ? { ...u, estado: newStatus } : u));
  };

  const handleEdit = (u: any) => {
    setFormData({
      ecoNum: u.eco.replace('ECO ', ''),
      tipo: u.tipo,
      marca: u.marca || '',
      modelo: u.modelo || '',
      año: u.año || '',
      serie: u.serie || '',
      capacidad: u.capacidad || ''
    });
    setEditingId(u.id);
    setIsReadOnly(false);
    setView('directorio_form');
  };

  const handleView = (u: any) => {
    setFormData({
      ecoNum: u.eco.replace('ECO ', ''),
      tipo: u.tipo,
      marca: u.marca || '',
      modelo: u.modelo || '',
      año: u.año || '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      setView('directorio_list');
      return;
    }

    const ecoPadded = formData.ecoNum.padStart(2, '0');

    if (editingId) {
      setUnidades(unidades.map(u => u.id === editingId ? {
        ...u,
        eco: `ECO ${ecoPadded}`,
        tipo: formData.tipo,
        marca: formData.marca,
        modelo: formData.modelo,
        año: Number(formData.año),
        serie: formData.serie,
        capacidad: Number(formData.capacidad)
      } : u));
    } else {
      const newUnidad = {
        id: Date.now(),
        eco: `ECO ${ecoPadded}`,
        tipo: formData.tipo,
        marca: formData.marca,
        modelo: formData.modelo,
        año: Number(formData.año),
        serie: formData.serie,
        capacidad: Number(formData.capacidad),
        estado: 'Activo'
      };
      setUnidades([...unidades, newUnidad]);
    }
    
    setFormData({ ecoNum: '', tipo: 'Sprinter', marca: '', modelo: '', año: '', serie: '', capacidad: '' });
    setView('directorio_list');
  };

  const filteredUnidades = unidades.filter(u => 
    u.eco.toLowerCase().includes(searchTerm.toLowerCase()) || 
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
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--primary)' }}>{u.eco}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{u.tipo}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{u.serie || 'N/A'}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-main)' }}>{u.año}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-main)' }}>{u.capacidad}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleView(u)}
                          title="Visualizar (Solo Lectura)" 
                          style={{ background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}>
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEdit(u)}
                          title="Editar Unidad" 
                          style={{ background: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', cursor: 'pointer', padding: '6px' }}>
                          <Edit3 size={16} />
                        </button>
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
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Número Económico</label>
                <div style={{ display: 'flex', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <span style={{ padding: '10px 15px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-muted)', fontWeight: 600, borderRight: '1px solid var(--glass-border)' }}>ECO</span>
                  <input 
                    type="number" 
                    required
                    disabled={isReadOnly}
                    value={formData.ecoNum}
                    onChange={e => setFormData({...formData, ecoNum: e.target.value})}
                    placeholder="01" 
                    style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }} 
                  />
                </div>
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
                  required
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
                  required
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
                  required
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
                  required
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
              {!isReadOnly && (
                <button 
                  type="submit"
                  style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 0 10px var(--primary-glow)' }}>
                  <Save size={18} /> {editingId ? 'Actualizar Unidad' : 'Guardar Unidad'}
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
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--primary)' }}>{u.eco}</td>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{u.tipo} - {u.modelo}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600,
                        background: 
                          u.estado === 'Activo' ? 'rgba(16, 185, 129, 0.1)' : 
                          u.estado === 'Taller' ? 'rgba(245, 158, 11, 0.1)' :
                          u.estado === 'Inactivo' ? 'rgba(107, 114, 128, 0.1)' :
                          'rgba(239, 68, 68, 0.1)',
                        color: 
                          u.estado === 'Activo' ? '#10b981' : 
                          u.estado === 'Taller' ? '#f59e0b' :
                          u.estado === 'Inactivo' ? '#9ca3af' :
                          '#ef4444'
                      }}>
                        {u.estado}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <select 
                        value={u.estado}
                        onChange={(e) => handleStatusChange(u.id, e.target.value)}
                        style={{ padding: '8px 12px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', outline: 'none', cursor: 'pointer' }}>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                        <option value="Taller">Taller</option>
                        <option value="Baja">Baja</option>
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
