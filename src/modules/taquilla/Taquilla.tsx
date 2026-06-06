import React, { useState, useEffect } from 'react';
import { Ticket, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../core/supabaseClient';

export const Taquilla = () => {
  const [rutas, setRutas] = useState<any[]>([]);
  const [selectedRuta, setSelectedRuta] = useState<number | null>(null);
  const [precio, setPrecio] = useState<string>('15.00');
  const [loading, setLoading] = useState(false);
  const [lastTicket, setLastTicket] = useState<string | null>(null);

  useEffect(() => {
    const fetchRutas = async () => {
      const { data } = await supabase.from('routes').select('*');
      if (data) setRutas(data);
    };
    fetchRutas();
  }, []);

  const handleVenta = async () => {
    if (!selectedRuta || !precio) return;
    setLoading(true);
    
    // Simular que vendemos a un viaje activo en esa ruta (en un sistema real buscaríamos el trip_id activo de esa ruta)
    // Por ahora lo insertaremos sin trip_id (como venta libre) o con trip_id 1 para simulación
    const { data, error } = await supabase.from('tickets').insert([{ 
      monto: parseFloat(precio) 
    }]).select().single();

    setLoading(false);

    if (!error && data) {
      setLastTicket(data.id);
      setTimeout(() => setLastTicket(null), 3000);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="topbar" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Punto de Venta (Taquilla)</h1>
          <p className="page-subtitle">Emisión rápida de boletos físicos/digitales.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Configuración de Venta</h3>
          
          <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ruta Destino</label>
          <select 
            value={selectedRuta || ''} 
            onChange={(e) => setSelectedRuta(Number(e.target.value))}
            style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '1.1rem' }}
          >
            <option value="">-- Seleccionar --</option>
            {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>

          <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Precio de Tarifa ($)</label>
          <input 
            type="number" 
            value={precio} 
            onChange={(e) => setPrecio(e.target.value)}
            style={{ width: '100%', padding: '12px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', fontSize: '1.5rem', fontWeight: 'bold' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            disabled={!selectedRuta || loading}
            onClick={handleVenta}
            style={{ 
              flex: 1, 
              background: !selectedRuta ? 'var(--surface-color)' : 'var(--primary)', 
              color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', 
              fontSize: '2rem', fontWeight: 'bold', cursor: !selectedRuta ? 'not-allowed' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'transform 0.1s', transform: loading ? 'scale(0.98)' : 'scale(1)'
            }}
          >
            <Ticket size={48} />
            {loading ? 'EMITIENDO...' : 'IMPRIMIR BOLETO'}
          </button>

          {lastTicket && (
            <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 color="#10b981" />
              <div>
                <strong style={{ color: '#10b981' }}>Éxito</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {lastTicket.slice(0,8)}... emitido por ${precio}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
