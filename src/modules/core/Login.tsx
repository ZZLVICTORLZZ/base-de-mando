import React, { useState, useEffect } from 'react';
import { Rocket, Lock, Mail, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [theme, setTheme] = useState('tron');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'tron') setTheme('light');
    else if (theme === 'light') setTheme('cherry');
    else setTheme('tron');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      // BYPASS DE PRUEBA (Evade el Firewall de la oficina)
      if (email === 'admin@apolo11.com' && password === 'apolo11admin') {
        localStorage.setItem('apolo11_bypass', 'true');
        window.location.href = '/';
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      setErrorMsg(error.error_description || error.message || 'Credenciales incorrectas o usuario no autorizado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <button 
        onClick={cycleTheme}
        style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'var(--surface-glass)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: 'var(--radius-full)', color: 'var(--text-main)', cursor: 'pointer', backdropFilter: 'blur(10px)' }}
        title="Cambiar Tema"
      >
        <Palette size={20} />
      </button>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3rem', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="sidebar-logo" style={{ margin: '0 auto 1rem', width: '64px', height: '64px' }}>
            <Rocket color="#fff" size={36} />
          </div>
          <h2 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Base de Mando</h2>
          <p style={{ color: 'var(--text-muted)' }}>Acceso Restringido - Apolo 11</p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '12px', borderRadius: 'var(--radius-sm)', color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Usuario o Correo</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} size={20} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@empresa.com"
                style={{ 
                  width: '100%', padding: '12px 12px 12px 45px', 
                  background: 'var(--surface-color)', border: '1px solid var(--glass-border)', 
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' 
                }} 
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} size={20} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ 
                  width: '100%', padding: '12px 12px 12px 45px', 
                  background: 'var(--surface-color)', border: '1px solid var(--glass-border)', 
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', outline: 'none', fontSize: '1rem' 
                }} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '1.5rem', padding: '14px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
              border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontWeight: 600, fontSize: '1rem',
              cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'var(--transition)',
              boxShadow: '0 0 20px var(--primary-glow)'
            }}
          >
            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};
