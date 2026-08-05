import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Key, Users as UsersIcon, Eye, Edit3, Trash2, Plus, DollarSign, Save, LayoutGrid, ArrowLeft, X, Smartphone, Monitor, UserCheck } from 'lucide-react';
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
  const [newUserForm, setNewUserForm] = useState({ 
    email: '', password: '', nombre: '', username: '', role_id: '', access_level: 1, can_edit: false, 
    modules_access: { administracion: true, j2: true, finanzas: false, recursos_humanos: false } 
  });
  const [loading, setLoading] = useState(false);

  const handleEdit = (perfil: any) => {
    setEditingId(perfil.id);
    setEditForm({ 
      ...perfil, 
      username: perfil.username || '',
      access_level: perfil.access_level || 1, 
      can_edit: perfil.can_edit || false,
      modules_access: perfil.modules_access || { administracion: false, j2: false }
    });
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: editForm.nombre,
          username: editForm.username,
          access_level: editForm.access_level,
          can_edit: editForm.can_edit,
          modules_access: editForm.modules_access
        })
        .eq('id', editingId);
        
      if (error) {
        alert("Error de guardado: " + error.message);
        console.error("Update error:", error);
        return;
      }

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
        options: {
          data: {
            nombre: newUserForm.nombre,
            username: newUserForm.username
          }
        }
      });

      if (error) {
        alert('Error al crear usuario: ' + error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Usamos update en lugar de upsert porque el trigger de Supabase ya creó el perfil en Level 1.
        // Si usamos upsert y no tenemos permiso de INSERT, falla silenciosamente por RLS.
        const { error: profileError } = await supabase.from('profiles').update({
          nombre: newUserForm.nombre,
          username: newUserForm.username,
          role_id: newUserForm.role_id || null,
          status: 'activo',
          access_level: newUserForm.access_level,
          can_edit: newUserForm.can_edit,
          modules_access: newUserForm.modules_access
        }).eq('id', data.user.id);
        
        if (profileError) {
          console.error(profileError);
          alert("Aviso: El usuario fue creado, pero hubo un error al guardar sus permisos: " + profileError.message);
        }
      }

      alert('Acceso generado con éxito.');
      setIsAddingNew(false);
      setNewUserForm({ 
        email: '', password: '', nombre: '', username: '', role_id: '', access_level: 1, can_edit: false, 
        modules_access: { administracion: true, j2: true, finanzas: false, recursos_humanos: false } 
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const renderLevelSelector = (currentLevel: number, setLevel: (level: number) => void) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '10px' }}>
      {[
        { level: 1, title: 'Nivel 1', apps: 'Motor F1 (Operadores)', icon: Smartphone },
        { level: 2, title: 'Nivel 2', apps: 'Motor J2 (Tableristas)', icon: Smartphone },
        { level: 3, title: 'Nivel 3', apps: 'Motor SPS (Mecánicos)', icon: Smartphone },
        { level: 9, title: 'Nivel 9', apps: 'Admin Supremo BDM', icon: Monitor },
        { level: 10, title: 'Nivel 10', apps: 'Dev Supremo BDM', icon: Monitor }
      ].map(opt => (
        <div 
          key={opt.level}
          onClick={() => setLevel(opt.level)}
          style={{ 
            padding: '12px 10px', 
            borderRadius: '12px', 
            border: currentLevel === opt.level ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
            background: currentLevel === opt.level ? 'rgba(0, 104, 71, 0.1)' : 'var(--bg-color)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '6px'
          }}
        >
          <opt.icon size={20} color={currentLevel === opt.level ? 'var(--primary)' : 'var(--text-muted)'} />
          <strong style={{ color: currentLevel === opt.level ? 'var(--primary)' : 'var(--text-main)', fontSize: '14px' }}>{opt.title}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opt.apps}</span>
        </div>
      ))}
    </div>
  );

  const renderModulesAccess = (modules: any, setModules: (m: any) => void) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
      {[
        { id: 'administracion', label: 'Administración BDM' },
        { id: 'j2', label: 'Monitor J2 BDM' },
        { id: 'finanzas', label: 'Finanzas BDM' },
        { id: 'recursos_humanos', label: 'Recursos Humanos BDM' }
      ].map(mod => (
        <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'var(--bg-color)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <input 
            type="checkbox" 
            checked={!!modules[mod.id]}
            onChange={e => setModules({ ...modules, [mod.id]: e.target.checked })}
            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
          />
          <span style={{ color: 'var(--text-main)', fontSize: '13px' }}>{mod.label}</span>
        </label>
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
      {isAddingNew && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, padding: '2rem', overflowY: 'auto' }}>
          <div className="animate-fade-in" style={{ background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', maxWidth: '1100px', margin: '0 auto' }}>
            
            {/* Encabezado */}
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px 16px 0 0' }}>
              <div>
                <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.75rem' }}>Generar Nuevo Acceso</h3>
                <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Completa los datos para dar de alta a un nuevo integrante del equipo en el sistema.</p>
              </div>
              <button onClick={() => setIsAddingNew(false)} style={{ background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={24} />
              </button>
            </div>
            
            {/* Contenido distribuido en Grid */}
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                
                {/* Columna 1: Credenciales */}
                <div style={{ background: 'var(--bg-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}><UserCheck size={22}/> Datos de Credenciales</h4>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Nombre de Usuario (Ecosistema Saturno V)</label>
                    <input type="text" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} placeholder="Ej. jperez_op" style={{ width: '100%', padding: '14px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '16px' }} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Nombre Completo</label>
                    <input type="text" value={newUserForm.nombre} onChange={e => setNewUserForm({...newUserForm, nombre: e.target.value})} style={{ width: '100%', padding: '14px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '16px' }} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Correo Electrónico</label>
                    <input type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} style={{ width: '100%', padding: '14px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '16px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Contraseña (Min. 6 car.)</label>
                    <input type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} style={{ width: '100%', padding: '14px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '16px' }} />
                  </div>
                </div>
                
                {/* Columna 2: Permisos y Nivel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ background: 'var(--bg-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)', flex: 1 }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Key size={22}/> Nivel de Acceso y Apps</h4>
                    {renderLevelSelector(newUserForm.access_level, (lvl) => setNewUserForm({...newUserForm, access_level: lvl}))}
                  </div>
                  
                  {/* Panel de Permisos Modulares */}
                  <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Permisos de Pestañas BDM</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Activa o desactiva qué módulos puede ver este usuario. (Si el Nivel es 9 o 10, verá todo de todas formas).</p>
                    {renderModulesAccess(newUserForm.modules_access, (m) => setNewUserForm({...newUserForm, modules_access: m}))}
                  </div>

                  <div style={{ background: 'var(--bg-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)', display: 'block', fontSize: '16px' }}>Privilegios de Edición</strong>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Activa esto para permitirle hacer modificaciones.</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                      <span style={{ color: newUserForm.can_edit ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '15px' }}>{newUserForm.can_edit ? 'Habilitado' : 'Solo Lectura'}</span>
                      <input 
                        type="checkbox" 
                        checked={newUserForm.can_edit} 
                        onChange={e => setNewUserForm({...newUserForm, can_edit: e.target.checked})}
                        style={{ width: '28px', height: '28px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                    </label>
                  </div>

                  <div style={{ background: 'var(--bg-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <label style={{ display: 'block', color: 'var(--text-main)', fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Asignar Rol Interno (Opcional)</label>
                    <select value={newUserForm.role_id || ''} onChange={e => setNewUserForm({...newUserForm, role_id: e.target.value})} style={{ width: '100%', padding: '14px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '16px' }}>
                      <option value="">Ninguno</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
                
              </div>
            </div>
            
            {/* Footer fijo con acciones */}
            <div style={{ padding: '2rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'flex-end', gap: '20px', borderRadius: '0 0 16px 16px' }}>
              <button onClick={() => setIsAddingNew(false)} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '14px 28px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 500 }}>Cancelar Operación</button>
              <button onClick={handleCreateUser} disabled={loading} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={20}/> {loading ? 'Creando Usuario...' : 'Generar Acceso Oficial'}
              </button>
            </div>
            
          </div>
        </div>,
        document.body
      )}

      {/* MODAL EDITAR USUARIO EXISTENTE */}
      {editingId && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div className="animate-fade-in" style={{ background: 'var(--surface-color)', padding: '30px', borderRadius: '16px', border: '1px solid var(--primary)', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
              <div>
                <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.5rem' }}>Configurar Accesos</h3>
                <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Estás modificando el perfil de: <strong style={{color: 'var(--primary)'}}>{editForm.nombre}</strong></p>
              </div>
              <button onClick={() => setEditingId(null)} style={{ background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Nombre de Usuario</label>
                <input type="text" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '16px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Nombre Completo</label>
                <input type="text" value={editForm.nombre} onChange={e => setEditForm({...editForm, nombre: e.target.value})} style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '16px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Nivel de Acceso</label>
              {renderLevelSelector(editForm.access_level, (lvl) => setEditForm({...editForm, access_level: lvl}))}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Permisos Modulares BDM</label>
              {renderModulesAccess(editForm.modules_access, (m) => setEditForm({...editForm, modules_access: m}))}
            </div>

            <div style={{ marginBottom: '30px', padding: '18px', background: 'var(--bg-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--glass-border)' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
              <button onClick={() => setEditingId(null)} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Descartar</button>
              <button onClick={handleSave} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18}/> Guardar Cambios
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>Usuario (ID)</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>Nombre Completo</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>Nivel</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>Rol</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>Permisos</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>Estado</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', textAlign: 'center', color: 'var(--text-muted)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {perfiles.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px', color: 'var(--primary)', fontWeight: 600 }}>@{user.username || 'sin_usuario'}</td>
                <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-main)' }}>{user.nombre}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    background: user.access_level >= 9 ? 'rgba(0, 104, 71, 0.2)' : user.access_level === 3 ? 'rgba(234, 179, 8, 0.2)' : user.access_level === 2 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    color: user.access_level >= 9 ? '#34d399' : user.access_level === 3 ? '#facc15' : user.access_level === 2 ? '#60a5fa' : '#9ca3af',
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' 
                  }}>
                    {user.access_level === 10 ? 'Nivel 10 (Dev)' : user.access_level === 9 ? 'Nivel 9 (Admin)' : user.access_level === 3 ? 'Nivel 3 (SPS)' : user.access_level === 2 ? 'Nivel 2 (J2)' : 'Nivel 1 (F1)'}
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
