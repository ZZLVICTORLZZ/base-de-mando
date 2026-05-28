import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { Layout } from './components/Layout';
import { Inicio, Estadisticas, Servicio, Mantenimiento, Administracion, Archivo, Recaudacion, Aforo, Unidades } from './pages';
import { Login } from './pages/Login';
import type { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-color)', color: 'var(--primary)' }}>Cargando Base de Mando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Inicio />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="unidades" element={<Unidades />} />
          <Route path="servicio" element={<Servicio />} />
          <Route path="mantenimiento" element={<Mantenimiento />} />
          <Route path="administracion" element={<Administracion />} />
          <Route path="archivo" element={<Archivo />} />
          <Route path="recaudacion" element={<Recaudacion />} />
          <Route path="aforo" element={<Aforo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
