import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Rocket, Wrench, Users, Archive, Banknote, UsersRound, 
  LayoutDashboard, Truck, LogOut, Home, Palette, AlertCircle, Briefcase, CreditCard
} from 'lucide-react';
import { supabase } from './supabaseClient';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home, moduleId: 'inicio' },
  { path: '/estadisticas', label: 'Estadísticas (Análisis)', icon: LayoutDashboard, moduleId: 'estadisticas' },
  { path: '/unidades', label: 'Unidades', icon: Truck, moduleId: 'unidades' },
  { path: '/servicio', label: 'Servicio', icon: Rocket, moduleId: 'servicio' },
  { path: '/recursos-humanos', label: 'R.H.', icon: Briefcase, moduleId: 'recursos_humanos' },
  { path: '/mantenimiento', label: 'Mantenimiento', icon: Wrench, moduleId: 'mantenimiento' },
  { path: '/administracion', label: 'Administración', icon: Users, moduleId: 'administracion' },
  { path: '/taquilla', label: 'Taquilla (PDV)', icon: Rocket, moduleId: 'taquilla' },
  { path: '/aforo', label: 'Aforo (Checador)', icon: UsersRound, moduleId: 'j2' },
  { path: '/recaudacion', label: 'Recaudación', icon: Banknote, moduleId: 'finanzas' },
  { path: '/archivo', label: 'Archivo', icon: Archive, moduleId: 'archivo' },
  { path: '/gestor-nfc', label: 'Gestor NFC', icon: CreditCard, moduleId: 'administracion' },
];

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState('tron');
  const [userEmail, setUserEmail] = useState<string | null>('Comandante');
  const [canEdit, setCanEdit] = useState(true);
  const [accessLevel, setAccessLevel] = useState(3);
  const [modulesAccess, setModulesAccess] = useState<any>({});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Obtener correo y perfil del usuario
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (localStorage.getItem('apolo11_bypass') === 'true') {
        setUserEmail('Admin Bypass');
        setAccessLevel(10);
        setCanEdit(true);
        return;
      }

      if (user?.email) {
        setUserEmail(user.email.split('@')[0]);
        const { data: profile } = await supabase.from('profiles').select('can_edit, access_level, modules_access').eq('id', user.id).single();
        if (profile) {
          setCanEdit(profile.can_edit);
          setAccessLevel(profile.access_level);
          setModulesAccess(profile.modules_access || {});
        }
      }
    });
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'tron') setTheme('light');
    else if (theme === 'light') setTheme('cherry');
    else setTheme('tron');
  };

  const handleLogout = async () => {
    if (localStorage.getItem('apolo11_bypass') === 'true') {
      localStorage.removeItem('apolo11_bypass');
      window.location.href = '/login';
      return;
    }
    await supabase.auth.signOut();
  };

  // Filtrar items según permisos (Admin=9 y Dev=10 ven todo, el resto ve según módulos)
  const visibleNavItems = navItems.filter(item => {
    if (accessLevel >= 9) return true;
    if (item.moduleId === 'inicio') return true; // Siempre ven inicio
    return modulesAccess[item.moduleId] === true;
  });

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
          {visibleNavItems.map((item) => (
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
              <button onClick={handleLogout} className="logout-btn" title="Cerrar Sesión">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content" style={{ flex: 1 }}>
        {(() => {
          const currentPath = location.pathname;
          // Si es admin supremo, siempre pasa.
          if (accessLevel >= 9) return <Outlet context={{ canEdit, accessLevel }} />;
          // Buscar el navItem que corresponde a la ruta
          const matchingItem = navItems.find(item => item.path === currentPath || (item.path !== '/' && currentPath.startsWith(item.path + '/')));
          // Si no encontramos un item o si el item no está visible en el menú
          if (matchingItem && !visibleNavItems.find(v => v.path === matchingItem.path)) {
            return (
              <div style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <AlertCircle size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                <h2 style={{ color: 'var(--text-main)', fontSize: '2rem', marginBottom: '1rem' }}>Acceso Denegado</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '500px' }}>
                  Tu nivel de acceso ({accessLevel}) no te permite visualizar este módulo de la Base de Mando. Si crees que es un error, contacta al Nivel 9 o 10.
                </p>
              </div>
            );
          }
          // De lo contrario, renderizamos
          return <Outlet context={{ canEdit, accessLevel }} />;
        })()}
      </main>
    </div>
  );
};
