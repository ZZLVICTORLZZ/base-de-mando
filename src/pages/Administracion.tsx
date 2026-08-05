import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Key, Users as UsersIcon, Eye, Edit3, Trash2, Plus, Camera, X, Save, UserCheck, Settings } from 'lucide-react';

const rolesBasicos = [
  'Monitorista', 'Taquillero', 'Recaudador', 'Oficinista', 
  'Supervisor', 'Socio', 'Mecánico', 'Gerente', 'Administrador'
];

// REGLA DE ORO: Toda pestaña que se integre en la BDM (Base de Mando) debe declararse aquí para su control de permisos SIEMPRE.
export const APP_MODULES = [
  { id: 'ini', label: 'Inicio' },
  { id: 'est', label: 'Estadísticas' },
  { id: 'uni', label: 'Unidades' },
  { id: 'ser', label: 'Servicio' },
  { id: 'rh', label: 'R.H.' },
  { id: 'man', label: 'Mantenimiento' },
  { id: 'adm', label: 'Administración' },
  { id: 'taq', label: 'Taquilla' },
  { id: 'afo', label: 'Aforo' },
  { id: 'rec', label: 'Recaudación' },
  { id: 'arc', label: 'Archivo' }
];

const initialPermissions = [
  { 
    id: 1, name: 'Juan Pérez', role: 'Monitorista', nivel: 1,
    perms: APP_MODULES.reduce((acc, mod) => ({
      ...acc, 
      [mod.id]: { r: ['ini', 'afo'].includes(mod.id), w: false }
    }), {})
  },
  { 
    id: 2, name: 'María López', role: 'Administrador', nivel: 3,
    perms: APP_MODULES.reduce((acc, mod) => ({
      ...acc, 
      [mod.id]: { r: true, w: true }
    }), {})
  },
];

const TabAccesos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Directorio de Personal</h2>
          <p style={{ color: 'var(--text-muted)' }}>Crea y administra los usuarios del sistema.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <Plus size={18} /> Nuevo Registro
        </button>
      </div>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Usuarios Registrados (Simulación)</h3>
        <p style={{ color: 'var(--text-muted)' }}>No hay usuarios mostrados en la simulación. Haz clic en "Nuevo Registro" para abrir el formulario.</p>
      </div>

      {isModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
          <div className="animate-fade-in" style={{ background: 'var(--surface-color)', padding: '25px', borderRadius: '16px', border: '1px solid var(--primary)', width: '100%', maxWidth: '500px', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={22} color="var(--primary)" /> Nuevo Personal
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-color)', border: '1px dashed var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                  <Camera size={24} color="var(--text-muted)" />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Subir Foto</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Nombre Completo</label>
                  <input type="text" placeholder="Ej. Juan Pérez" style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Teléfono</label>
                    <input type="text" placeholder="55 1234 5678" style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Contraseña</label>
                    <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Correo Electrónico</label>
                  <input type="email" placeholder="usuario@apolo11.com" style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Puesto (Rol)</label>
                    <select style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }}>
                      {rolesBasicos.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Nivel de Acceso</label>
                    <select style={{ width: '100%', padding: '10px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }}>
                      <option value="1">Nivel 1</option>
                      <option value="2">Nivel 2</option>
                      <option value="3">Nivel 3</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', gap: '10px' }}>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '10px 15px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={18} /> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const TabRoles = () => (
  <div className="animate-fade-in">
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Gestión de Roles</h2>
        <p style={{ color: 'var(--text-muted)' }}>Agrega o elimina los puestos operativos de la empresa.</p>
      </div>
      <button style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Plus size={18} /> Nuevo Rol
      </button>
    </div>
    
    <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
      {rolesBasicos.map((rol, i) => (
        <div key={i} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="var(--primary)" />
            <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{rol}</span>
          </div>
          <button style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const TabPermisos = () => {
  const [permissions, setPermissions] = useState(initialPermissions);

  const togglePerm = (userId: number, moduleId: string, type: 'r' | 'w') => {
    setPermissions(permissions.map(user => {
      if (user.id === userId) {
        const currentPerms: any = user.perms[moduleId as keyof typeof user.perms] || { r: false, w: false };
        return {
          ...user,
          perms: {
            ...user.perms,
            [moduleId]: {
              ...currentPerms,
              [type]: !currentPerms[type]
            }
          }
        };
      }
      return user;
    }));
  };

  const renderIcon = (userId: number, moduleId: string, type: 'r' | 'w', IconProps: any) => {
    const user = permissions.find(p => p.id === userId);
    const modPerms: any = user?.perms[moduleId as keyof typeof user?.perms] || { r: false, w: false };
    const isActive = modPerms[type];
    
    // Si es Nivel 3 y estamos renderizando iconos, Nivel 3 puede ver BDM y customizar pestañas.
    // Si no es nivel 3, tal vez bloqueamos edición? Pero la UI es interactiva para todos en este demo.
    
    const title = type === 'r' ? (isActive ? 'Lectura Activada' : 'Lectura Desactivada') : (isActive ? 'Escritura Activada' : 'Escritura Desactivada');

    return (
      <IconProps 
        size={20} 
        color={isActive ? "var(--primary)" : "rgba(255,255,255,0.1)"} 
        cursor="pointer" 
        title={title} 
        onClick={() => togglePerm(userId, moduleId, type)}
        style={{ transition: 'var(--transition)' }}
        className="hover:scale-110"
      />
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderLeft: '4px solid #3b82f6', borderRadius: 'var(--radius-sm)' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={18} /> Regla de Oro BDM
        </h4>
        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', margin: 0 }}>
          Toda pestaña que integremos en la BDM deberá integrarse también en este módulo de permisos. El Nivel 3 de acceso incluye entrada a la BDM con la capacidad de personalizar exactamente qué pestañas visualizar (Lectura) o modificar (Escritura).
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Matriz de Permisos Interactiva (RBAC)</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Da clic en los iconos para activar o desactivar el acceso granular a cada módulo de la BDM. <br/> <Eye size={14} style={{display:'inline'}}/> = Lectura (Ver) | <Edit3 size={14} style={{display:'inline'}}/> = Escritura (Modificar).</p>
      </div>
      
      <div className="glass-panel" style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '1000px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '16px', color: 'var(--text-muted)', position: 'sticky', left: 0, background: 'var(--surface-color)', zIndex: 10 }}>Usuario / Nivel</th>
              {APP_MODULES.map(mod => (
                <th key={mod.id} style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {mod.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                <td style={{ padding: '16px', position: 'sticky', left: 0, background: 'var(--surface-color)', zIndex: 10 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{user.role} - Nivel {user.nivel}</div>
                </td>
                {APP_MODULES.map(mod => (
                  <td key={mod.id} style={{ padding: '16px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {renderIcon(user.id, mod.id, 'r', Eye)}
                      {renderIcon(user.id, mod.id, 'w', Edit3)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const Administracion = () => {
  const [activeTab, setActiveTab] = useState('permisos');

  const tabs = [
    { id: 'accesos', label: 'Accesos (Directorio)', icon: UsersIcon },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'permisos', label: 'Permisos', icon: Key },
  ];

  return (
    <div className="animate-fade-in p-6 h-full flex flex-col">
      <div className="mb-8">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 mb-2 tracking-tight">
            Administración del Sistema
          </h1>
          <p className="text-slate-400 text-lg font-medium">Gestión de personal, seguridad y control de accesos a la Base de Mando</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px',
              background: activeTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              border: activeTab === tab.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'var(--transition)',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content" style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'accesos' && <TabAccesos />}
        {activeTab === 'roles' && <TabRoles />}
        {activeTab === 'permisos' && <TabPermisos />}
      </div>
    </div>
  );
};
