import React, { useState, useEffect } from 'react';
import { Shield, Key, Users as UsersIcon, Eye, Edit3, Trash2, Plus, DollarSign, Save, LayoutGrid, ArrowLeft, X, Smartphone, Monitor } from 'lucide-react';
import { supabase } from '../core/supabaseClient';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Cliente secundario para no cerrar la sesión del admin al crear usuarios
const altSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const TabAccesos = ({ perfiles, roles, onRefresh, onBack, canEdit }: { perfiles: any[], roles: any[], onRefresh: () => void, onBack: () => void, canEdit?: boolean }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ email: '', password: '', nombre: '', role_id: '', access_level: 1, can_edit: false });
  const [loading, setLoading] = useState(false);

  const handleEdit = (perfil: any) => {
    setEditingId(perfil.id);
    setEditForm({ ...perfil, access_level: perfil.access_level || 1, can_edit: perfil.can_edit || false });
  };

  const handleSave = async () => {
    try {
      await supabase
        .from('profiles')
        .update({
          role_id: editForm.role_id,
          nfc_tag: editForm.nfc_tag,
          is_shadow_mode: editForm.is_shadow_mode,
          status: editForm.status,
          access_level: editForm.access_level,
          can_edit: editForm.can_edit
        })
        .eq('id', editingId);
      setEditingId(null);
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.email || !newUserForm.password || !newUserForm.nombre) {
      alert('Por favor llene correo, contraseña y nombre');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await altSupabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
      });

      if (error) {
        alert('Error al crear usuario: ' + error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          nombre: newUserForm.nombre,
          role_id: newUserForm.role_id || null,
          status: 'activo',
          access_level: newUserForm.access_level,
          can_edit: newUserForm.can_edit
        });
        if (profileError) {
          console.error(profileError);
        }
      }

      alert('Acceso generado con éxito.');
      setIsAddingNew(false);
      setNewUserForm({ email: '', password: '', nombre: '', role_id: '', access_level: 1, can_edit: false });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const renderLevelSelector = (currentLevel: number, setLevel: (level: number) => void) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
      {[
        { level: 1, title: 'Nivel 1 (Operador)', apps: 'Solo App Operadores', icon: Smartphone },
        { level: 2, title: 'Nivel 2 (Checador)', apps: 'App J2 + Operadores', icon: Smartphone },
        { level: 3, title: 'Nivel 3 (Admin)', apps: 'Base de Mando + Todas las Apps', icon: Monitor }
      ].map(opt => (
        <div 
          key={opt.level}
          onClick={() => setLevel(opt.level)}
          style={{ 
            padding: '15px', 
            borderRadius: '12px', 
            border: currentLevel === opt.level ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
            background: currentLevel === opt.level ? 'rgba(0, 104, 71, 0.1)' : 'var(--bg-color)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '8px'
          }}
        >
          <opt.icon size={24} color={currentLevel === opt.level ? 'var(--primary)' : 'var(--text-muted)'} />
          <strong style={{ color: currentLevel === opt.level ? 'var(--primary)' : 'var(--text-main)' }}>{opt.title}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opt.apps}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="animate-fade-in p-6 h-full">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>Directorio y Permisos</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Gestiona los niveles de acceso a aplicaciones y permisos de edición.</p>
          </div>
        </div>
        {canEdit && (
          <button 
            onClick={() => setIsAddingNew(true)}
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            <Plus size={18} /> Generar Nuevo Acceso
          </button>
        )}
      </div>

      {/* MODAL CREAR NUEVO USUARIO */}
      {isAddingNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'var(--surface-color)', padding: '30px', borderRadius: '16px', border: '1px solid var(--primary)', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.5rem' }}>Crear Nuevo Usuario</h3>
              <button onClick={() => setIsAddingNew(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '5px' }}>Nombre Completo</label>
                <input type="text" value={newUserForm.nombre} onChange={e => setNewUserForm({...newUserForm, nombre: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '5px' }}>Correo Electrónico</label>
                <input type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '5px' }}>Contraseña (Min. 6 caracteres)</label>
                <input type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Nivel de Acceso (Apps)</label>
              {renderLevelSelector(newUserForm.access_level, (lvl) => setNewUserForm({...newUserForm, access_level: lvl}))}
            </div>

            <div style={{ marginBottom: '25px', padding: '15px', background: 'var(--bg-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--glass-border)' }}>
              <div>
                <strong style={{ color: 'var(--text-main)', display: 'block' }}>Permiso de Edición</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Si está inactivo, el usuario solo tendrá permisos de lectura (Ver).</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
                <span style={{ color: newUserForm.can_edit ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold' }}>{newUserForm.can_edit ? 'Modo Editar' : 'Modo Lectura'}</span>
                <input 
                  type="checkbox" 
                  checked={newUserForm.can_edit} 
                  onChange={e => setNewUserForm({...newUserForm, can_edit: e.target.checked})}
                  style={{ width: '20px', height: '20px' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setIsAddingNew(false)} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCreateUser} disabled={loading} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                {loading ? 'Generando...' : 'Guardar y Generar Acceso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO EXISTENTE */}
      {editingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'var(--surface-color)', padding: '30px', borderRadius: '16px', border: '1px solid var(--primary)', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.5rem' }}>Gestionar Permisos: {editForm.nombre}</h3>
              <button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Nivel de Acceso a Aplicaciones</label>
              {renderLevelSelector(editForm.access_level, (lvl) => setEditForm({...editForm, access_level: lvl}))}
            </div>

            <div style={{ marginBottom: '25px', padding: '15px', background: 'var(--bg-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--glass-border)' }}>
              <div>
                <strong style={{ color: 'var(--text-main)', display: 'block' }}>Privilegios de Edición global</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Habilita los botones de editar y configurar.</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
                <span style={{ color: editForm.can_edit ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold' }}>{editForm.can_edit ? 'Edición Habilitada' : 'Solo Lectura'}</span>
                <input 
                  type="checkbox" 
                  checked={editForm.can_edit} 
                  onChange={e => setEditForm({...editForm, can_edit: e.target.checked})}
                  style={{ width: '20px', height: '20px' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '5px' }}>Asignar Rol Interno (Opcional)</label>
                <select value={editForm.role_id || ''} onChange={e => setEditForm({...editForm, role_id: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }}>
                  <option value="">Ninguno</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '5px' }}>Estado de Cuenta</label>
                <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }}>
                  <option value="activo">Activo</option>
                  <option value="baja">Suspendido / Baja</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setEditingId(null)} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSave} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Nombre</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Nivel de Acceso</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Rol</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Permisos</th>
              <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Estado</th>
              <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {perfiles.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => handleEdit(user)} className="hover:bg-slate-800/30">
                <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-main)' }}>{user.nombre}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    background: user.access_level === 3 ? 'rgba(0, 104, 71, 0.2)' : user.access_level === 2 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    color: user.access_level === 3 ? '#34d399' : user.access_level === 2 ? '#60a5fa' : '#9ca3af',
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' 
                  }}>
                    {user.access_level === 3 ? 'Nivel 3 (Admin)' : user.access_level === 2 ? 'Nivel 2 (J2)' : 'Nivel 1 (Operador)'}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{user.roles?.name || '---'}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ color: user.can_edit ? '#10b981' : '#f59e0b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {user.can_edit ? <><Edit3 size={12} /> Editor</> : <><Eye size={12} /> Lectura</>}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ color: user.status === 'activo' ? '#10b981' : '#ef4444' }}>{user.status}</span>
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  {canEdit && (
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(user); }} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                      <Edit3 size={16} /> Configurar
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

const TabCostos = ({ onBack }: { onBack: () => void }) => {
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
    <div className="animate-fade-in p-6 h-full">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1.5rem' }}>
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>Costos Dinámicos</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Actualiza los precios base que afectan el cálculo automático de liquidaciones.</p>
        </div>
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

import { useOutletContext } from 'react-router-dom';

export const Administracion = () => {
  const { canEdit, accessLevel } = useOutletContext<any>() || { canEdit: false, accessLevel: 1 };
  const [view, setView] = useState<'dashboard' | 'accesos' | 'costos'>('dashboard');
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

  if (view === 'dashboard') {
    return (
      <div className="animate-fade-in">
        <div className="topbar">
          <div>
            <h1 className="page-title">Administración del Sistema</h1>
            <p className="page-subtitle">Gestión de personal, seguridad y variables financieras.</p>
          </div>
        </div>

        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          <div 
            onClick={() => setView('accesos')}
            className="glass-card table-row-hover" 
            style={{ padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ background: 'var(--surface-color)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--text-main)' }}>
              <UsersIcon size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Personal y Accesos</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Tarjetas de Nivel (Permisos), Generador de accesos y Modo Lectura/Edición.
              </p>
            </div>
          </div>

          <div 
            onClick={() => setView('costos')}
            className="glass-card table-row-hover" 
            style={{ padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ background: 'var(--surface-color)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--text-main)' }}>
              <DollarSign size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Costos Dinámicos</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Variables financieras y precios base para liquidaciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content" style={{ height: '100%' }}>
      {view === 'accesos' && <TabAccesos perfiles={perfiles} roles={roles} onRefresh={fetchData} onBack={() => setView('dashboard')} canEdit={canEdit} />}
      {view === 'costos' && <TabCostos onBack={() => setView('dashboard')} />}
    </div>
  );
};
