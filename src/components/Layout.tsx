import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Rocket, Wrench, Users, Archive, Banknote, UsersRound, 
  LayoutDashboard, Truck, LogOut, Home, Palette
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/estadisticas', label: 'Estadísticas', icon: LayoutDashboard },
  { path: '/unidades', label: 'Unidades', icon: Truck },
  { path: '/servicio', label: 'Servicio', icon: Rocket },
  { path: '/mantenimiento', label: 'Mantenimiento', icon: Wrench },
  { path: '/administracion', label: 'Administración', icon: Users },
  { path: '/archivo', label: 'Archivo', icon: Archive },
  { path: '/recaudacion', label: 'Recaudación', icon: Banknote },
  { path: '/aforo', label: 'Aforo', icon: UsersRound },
];

export const Layout = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('tron');
  const [userEmail, setUserEmail] = useState<string | null>('Comandante');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Obtener correo del usuario
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email.split('@')[0]);
      }
    });
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'tron') setTheme('light');
    else if (theme === 'light') setTheme('cherry');
    else setTheme('tron');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Rocket color="#fff" size={24} />
          </div>
          <div>
            <h2 className="title-gradient" style={{ fontSize: '1.25rem' }}>Apolo 11</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Base de Mando</span>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="user-profile" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="avatar">
                <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold' }}>{userEmail ? userEmail[0].toUpperCase() : 'C'}</span>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={cycleTheme} 
                style={{ background: 'transparent', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                title={`Cambiar Tema (Actual: ${theme})`}
              >
                <Palette size={16} />
              </button>
              <button 
                onClick={handleLogout} 
                style={{ background: 'transparent', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
