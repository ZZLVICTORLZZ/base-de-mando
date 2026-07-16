import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './modules/core/supabaseClient';
import { Layout } from './modules/core/Layout';
import { Inicio, Estadisticas, Mantenimiento, Archivo, Recaudacion, Aforo, Taquilla, RecursosHumanos } from './pages';
import { Login } from './modules/core/Login';
import { Unidades } from './modules/flota/Unidades';
import { Servicio } from './modules/operacion/Servicio';
import { Administracion } from './modules/admin/Administracion';
import type { Session } from '@supabase/supabase-js';

import { ShadowModeProvider } from './modules/core/ShadowModeContext';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('apolo11_bypass') === 'true') {
      setSession({ user: { email: 'admin@apolo11.com' } } as any);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        localStorage.setItem('apolo11_role', 'admin');
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        localStorage.setItem('apolo11_role', 'admin');
      } else {
        // Solo borrar el rol de admin si NO estamos en modo bypass
        if (localStorage.getItem('apolo11_bypass') !== 'true') {
          localStorage.removeItem('apolo11_role');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)', color: 'var(--primary)' }}>Cargando Base de Mando...</div>;
  }

  return (
    <ShadowModeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          
          <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Inicio />} />
            <Route path="estadisticas" element={<Estadisticas />} />
            <Route path="analisis-servicio" element={<Estadisticas />} />
            <Route path="unidades" element={<Unidades />} />
            <Route path="servicio" element={<Servicio />} />
            <Route path="mantenimiento" element={<Mantenimiento />} />
            <Route path="administracion" element={<Administracion />} />
            <Route path="archivo" element={<Archivo />} />
            <Route path="recaudacion" element={<Recaudacion />} />
            <Route path="aforo" element={<Aforo />} />
            <Route path="taquilla" element={<Taquilla />} />
            <Route path="recursos-humanos" element={<RecursosHumanos />} />
            <Route path="operadores" element={<RecursosHumanos />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ShadowModeProvider>
  );
}

export default App;
