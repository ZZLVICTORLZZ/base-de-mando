import React, { useState, useEffect } from 'react';
import { Shield, Key, Users as UsersIcon, Eye, Edit3, Trash2, Plus, DollarSign, Save } from 'lucide-react';
import { supabase } from '../core/supabaseClient';

const TabAccesos = ({ perfiles, roles, onRefresh }: { perfiles: any[], roles: any[], onRefresh: () => void }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const handleEdit = (perfil: any) => {
    setEditingId(perfil.id);
    setEditForm(perfil);
  };

  const handleSave = async () => {
    try {
      await supabase
        .from('profiles')
        .update({
          role_id: editForm.role_id,
          nfc_tag: editForm.nfc_tag,
          is_shadow_mode: editForm.is_shadow_mode,
          status: editForm.status
        })
        .eq('id', editingId);
      setEditingId(null);
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Directorio de Personal</h2>
          <p style={{ color: 'var(--text-muted)' }}>Administra los usuarios, tags NFC y Modo Sombra.</p>
        </div>
        <button style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Plus size={18} /> Nuevo (Requiere Edge Function)
        </button>
      </div>
      
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Nombre</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Rol</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Tag NFC</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Modo Sombra</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Estado</th>
              <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {perfiles.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-main)' }}>{user.nombre}</td>
                <td style={{ padding: '16px' }}>
                  {editingId === user.id ? (
                    <select 
                      value={editForm.role_id || ''} 
                      onChange={e => setEditForm({...editForm, role_id: e.target.value})}
                      style={{ background: 'var(--bg-color)', color: 'var(--text-main)', padding: '5px', borderRadius: '4px' }}
                    >
                      <option value="">Seleccione...</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  ) : (
                    <span style={{ color: 'var(--primary)' }}>{user.roles?.name || 'Sin Rol'}</span>
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  {editingId === user.id ? (
                    <input 
                      type="text" 
                      value={editForm.nfc_tag || ''} 
                      onChange={e => setEditForm({...editForm, nfc_tag: e.target.value})}
                      style={{ background: 'var(--bg-color)', color: 'var(--text-main)', padding: '5px', borderRadius: '4px', width: '100px' }}
                      placeholder="Tag NFC"
                    />
                  ) : (
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{user.nfc_tag || '---'}</span>
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  {editingId === user.id ? (
                    <input 
                      type="checkbox" 
                      checked={editForm.is_shadow_mode || false} 
                      onChange={e => setEditForm({...editForm, is_shadow_mode: e.target.checked})}
                    />
                  ) : (
                    <span style={{ color: user.is_shadow_mode ? '#f59e0b' : 'var(--text-muted)' }}>
                      {user.is_shadow_mode ? 'Sí (Aprendiz)' : 'No'}
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  {editingId === user.id ? (
                    <select 
                      value={editForm.status} 
                      onChange={e => setEditForm({...editForm, status: e.target.value})}
                      style={{ background: 'var(--bg-color)', color: 'var(--text-main)', padding: '5px', borderRadius: '4px' }}
                    >
                      <option value="activo">Activo</option>
                      <option value="baja">Baja</option>
                    </select>
                  ) : (
                    <span style={{ color: user.status === 'activo' ? '#10b981' : '#ef4444' }}>{user.status}</span>
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  {editingId === user.id ? (
                    <button onClick={handleSave} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Guardar</button>
                  ) : (
                    <button onClick={() => handleEdit(user)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                      <Edit3 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {perfiles.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay perfiles registrados en la base de datos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TabCostos = () => {
  const [costos, setCostos] = useState<any[]>([]);

  const fetchCostos = async () => {
    const { data } = await supabase.from('dynamic_costs').select('*').order('id');
    if (data) setCostos(data);
  };

  useEffect(() => { fetchCostos(); }, []);

  const handleUpdate = async (id: number, newValue: number) => {
    await supabase.from('dynamic_costs').update({ value: newValue }).eq('id', id);
    fetchCostos();
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Costos Dinámicos</h2>
        <p style={{ color: 'var(--text-muted)' }}>Actualiza los precios base que afectan el cálculo automático de liquidaciones.</p>
      </div>
      
      <div className="grid-cards">
        {costos.map((costo) => (
          <div key={costo.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="avatar" style={{ background: 'var(--surface-color)', border: '1px solid var(--primary)' }}>
                <DollarSign size={20} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>{costo.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Por {costo.unit}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>$</span>
              <input 
                type="number" 
                defaultValue={costo.value} 
                onBlur={(e) => handleUpdate(costo.id, parseFloat(e.target.value))}
                style={{ flex: 1, padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: 'var(--radius-sm)' }} 
              />
            </div>
          </div>
        ))}
        {costos.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No hay costos configurados. (Asegúrate de correr el script SQL del Sprint 2).</p>}
      </div>
    </div>
  );
};

export const Administracion = () => {
  const [activeTab, setActiveTab] = useState('accesos');
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const fetchData = async () => {
    const { data: pData } = await supabase.from('profiles').select('*, roles(name)');
    const { data: rData } = await supabase.from('roles').select('*');
    if (pData) setPerfiles(pData);
    if (rData) setRoles(rData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tabs = [
    { id: 'accesos', label: 'Personal y Accesos', icon: UsersIcon },
    { id: 'costos', label: 'Costos Dinámicos', icon: DollarSign },
  ];

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1 className="page-title">Administración del Sistema</h1>
          <p className="page-subtitle">Gestión de personal, seguridad y variables financieras.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px',
              background: activeTab === tab.id ? 'var(--surface-glass)' : 'transparent',
              border: activeTab === tab.id ? '1px solid var(--primary)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'var(--transition)'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'accesos' && <TabAccesos perfiles={perfiles} roles={roles} onRefresh={fetchData} />}
        {activeTab === 'costos' && <TabCostos />}
      </div>
    </div>
  );
};
