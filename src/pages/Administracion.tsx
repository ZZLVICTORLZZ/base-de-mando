import React, { useState } from 'react';
import { Shield, Key, Users as UsersIcon, Eye, Edit3, Trash2, Plus, Camera } from 'lucide-react';

const rolesBasicos = [
  'Monitorista', 'Taquillero', 'Recaudador', 'Oficinista', 
  'Supervisor', 'Socio', 'Mecánico', 'Gerente', 'Administrador'
];

const TabAccesos = () => (
  <div className="animate-fade-in">
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Directorio de Personal</h2>
        <p style={{ color: 'var(--text-muted)' }}>Crea y administra los usuarios del sistema.</p>
      </div>
      <button style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Plus size={18} /> Nuevo Empleado
      </button>
    </div>
    
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Formulario de Alta (Simulación)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-md)', background: 'var(--surface-color)', border: '1px dashed var(--glass-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
            <Camera size={32} color="var(--text-muted)" />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subir Fotografía</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nombre Completo</label>
              <input type="text" placeholder="Ej. Juan Pérez" style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Teléfono</label>
              <input type="text" placeholder="55 1234 5678" style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Correo Electrónico (Acceso)</label>
              <input type="email" placeholder="juan@apolo11.com" style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Contraseña Inicial</label>
              <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Puesto (Rol Base)</label>
            <select style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)' }}>
              {rolesBasicos.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer' }}>Guardar Perfil</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

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

const initialPermissions = [
  { 
    id: 1, name: 'Juan Pérez', role: 'Monitorista', 
    perms: { 
      aforo: { r: true, w: true }, 
      rec: { r: false, w: false }, 
      man: { r: false, w: false }, 
      est: { r: true, w: false },
      uni: { r: true, w: false }
    } 
  },
  { 
    id: 2, name: 'María López', role: 'Recaudador', 
    perms: { 
      aforo: { r: true, w: false }, 
      rec: { r: true, w: true }, 
      man: { r: false, w: false }, 
      est: { r: true, w: false },
      uni: { r: false, w: false }
    } 
  },
];

const TabPermisos = () => {
  const [permissions, setPermissions] = useState(initialPermissions);

  const togglePerm = (userId: number, module: string, type: 'r' | 'w') => {
    setPermissions(permissions.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          perms: {
            ...user.perms,
            [module as keyof typeof user.perms]: {
              ...user.perms[module as keyof typeof user.perms],
              [type]: !user.perms[module as keyof typeof user.perms][type]
            }
          }
        };
      }
      return user;
    }));
  };

  const renderIcon = (userId: number, module: string, type: 'r' | 'w', IconProps: any) => {
    const user = permissions.find(p => p.id === userId);
    const isActive = user?.perms[module as keyof typeof user.perms][type];
    const title = type === 'r' ? (isActive ? 'Lectura Activada' : 'Lectura Desactivada') : (isActive ? 'Escritura Activada' : 'Escritura Desactivada');

    return (
      <IconProps 
        size={20} 
        color={isActive ? "var(--primary)" : "rgba(255,255,255,0.1)"} 
        cursor="pointer" 
        title={title} 
        onClick={() => togglePerm(userId, module, type)}
        style={{ transition: 'var(--transition)' }}
      />
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Matriz de Permisos Interactiva (RBAC)</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Da clic en los iconos para activar o desactivar el acceso granular para cada usuario. <br/> <Eye size={14} style={{display:'inline'}}/> = Lectura (Solo ver) | <Edit3 size={14} style={{display:'inline'}}/> = Escritura (Crear/Modificar).</p>
      </div>
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Usuario</th>
              <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Unidades</th>
              <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Aforo</th>
              <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Recaudación</th>
              <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Mantenimiento</th>
              <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Estadísticas</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{user.role}</div>
                </td>
                {['uni', 'aforo', 'rec', 'man', 'est'].map(mod => (
                  <td key={mod} style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      {renderIcon(user.id, mod, 'r', Eye)}
                      {renderIcon(user.id, mod, 'w', Edit3)}
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
  const [activeTab, setActiveTab] = useState('permisos'); // Puesto por defecto para prueba

  const tabs = [
    { id: 'accesos', label: 'Accesos (Directorio)', icon: UsersIcon },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'permisos', label: 'Permisos', icon: Key },
  ];

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1 className="page-title">Administración del Sistema</h1>
          <p className="page-subtitle">Gestión de personal, seguridad y control de accesos a la Base de Mando</p>
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
        {activeTab === 'accesos' && <TabAccesos />}
        {activeTab === 'roles' && <TabRoles />}
        {activeTab === 'permisos' && <TabPermisos />}
      </div>
    </div>
  );
};
