import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface ShadowModeContextType {
  isShadowMode: boolean;
  loading: boolean;
}

const ShadowModeContext = createContext<ShadowModeContextType>({
  isShadowMode: false,
  loading: true,
});

export const useShadowMode = () => useContext(ShadowModeContext);

export const ShadowModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isShadowMode, setIsShadowMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_shadow_mode')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setIsShadowMode(profile.is_shadow_mode);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  return (
    <ShadowModeContext.Provider value={{ isShadowMode, loading }}>
      {/* Indicador visual de Modo Sombra */}
      {isShadowMode && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          background: 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 10px, #d97706 10px, #d97706 20px)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold',
          padding: '4px',
          zIndex: 9999,
          fontSize: '0.8rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}>
          ⚠️ MODO SOMBRA (ENTRENAMIENTO) - LOS DATOS GENERADOS NO AFECTAN LA OPERACIÓN REAL ⚠️
        </div>
      )}
      {children}
    </ShadowModeContext.Provider>
  );
};
