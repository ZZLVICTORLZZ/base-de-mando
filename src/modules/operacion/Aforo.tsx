import React, { useState, useEffect } from 'react';
import { ScanFace, UserCheck, Send, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../core/supabaseClient';

export const Aforo = () => {
  const [nfcTag, setNfcTag] = useState('');
  const [operadorInfo, setOperadorInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [aforoChecador, setAforoChecador] = useState('');
  const [loading, setLoading] = useState(false);

  const buscarNFC = async () => {
    if (!nfcTag) return;
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .eq('nfc_tag', nfcTag)
      .single();

    if (error || !data) {
      setError('Tag NFC no registrado o inválido.');
      setOperadorInfo(null);
    } else {
      setOperadorInfo(data);
    }
    setLoading(false);
  };

  const despachar = async () => {
    // Aquí iría la lógica para insertar en dispatch_turns y trips
    // Para el Sprint 4: solo simularemos el éxito
    setLoading(true);
    setTimeout(() => {
      setOperadorInfo(null);
      setNfcTag('');
      setAforoChecador('');
      setLoading(false);
      alert('Unidad despachada exitosamente con aforo validado.');
    }, 1000);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="topbar" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Punto de Control (Checador)</h1>
          <p className="page-subtitle">Escaneo NFC de Operadores y captura de Aforo visual.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ScanFace color="var(--primary)" />
          Paso 1: Escanear Tarjeta del Operador
        </h3>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Simular lectura de TAG (Ej: TAG-001)"
            value={nfcTag}
            onChange={(e) => setNfcTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && buscarNFC()}
            style={{ flex: 1, padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', fontSize: '1.2rem', fontFamily: 'monospace' }}
          />
          <button 
            onClick={buscarNFC}
            disabled={loading}
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0 2rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            VERIFICAR
          </button>
        </div>
        {error && <p style={{ color: '#ef4444', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '5px' }}><XCircle size={16} /> {error}</p>}
      </div>

      {operadorInfo && (
        <div className="animate-fade-in glass-panel" style={{ padding: '2rem', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="avatar" style={{ width: '60px', height: '60px', background: 'var(--surface-color)', border: '2px solid #10b981' }}>
              <UserCheck size={32} color="#10b981" />
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-main)' }}>{operadorInfo.nombre}</h2>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{operadorInfo.roles?.name}</span>
              {operadorInfo.is_shadow_mode && <span style={{ marginLeft: '10px', background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>APRENDIZ</span>}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />

          <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Paso 2: Aforo (Opcional)</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Ingresa la cantidad de pasajeros que cuentas visualmente al momento de despachar.</p>
          
          <input 
            type="number" 
            placeholder="Número de pasajeros..."
            value={aforoChecador}
            onChange={(e) => setAforoChecador(e.target.value)}
            style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', fontSize: '1.5rem', marginBottom: '1.5rem' }}
          />

          <button 
            onClick={despachar}
            disabled={loading}
            style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '15px', borderRadius: 'var(--radius-md)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
          >
            <Send /> DAR SALIDA A UNIDAD
          </button>
        </div>
      )}
    </div>
  );
};
