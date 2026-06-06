import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../core/supabaseClient';

export const Recaudacion = () => {
  const [costos, setCostos] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // En un sistema real esto vendría de `trips` con status finalizado.
  // Aquí lo simulamos para el sprint.
  const [viajesPorLiquidar, setViajesPorLiquidar] = useState([
    { id: 1, unidad: 'U-45', operador: 'Juan Pérez', boletos_vendidos: 124, ingreso_bruto: 1860.00, liquidado: false },
    { id: 2, unidad: 'U-12', operador: 'Mario Díaz', boletos_vendidos: 85, ingreso_bruto: 1275.00, liquidado: false }
  ]);

  useEffect(() => {
    const loadCostos = async () => {
      const { data } = await supabase.from('dynamic_costs').select('*');
      if (data) {
        const costMap: any = {};
        data.forEach(d => costMap[d.name] = d.value);
        setCostos(costMap);
      }
      setLoading(false);
    };
    loadCostos();
  }, []);

  const liquidarViaje = async (viajeId: number, ingresoBruto: number) => {
    // REGLAS INAMOVIBLES:
    const sueldoOperador = 200.00; 
    
    // Asumimos costos estándar por vuelta si no se sobreescriben en el viaje:
    // (Ejemplo: 40 litros de diesel, 2 casetas)
    const costoDiesel = (costos['Diesel'] || 24.50) * 40; 
    const costoCasetas = (costos['Caseta Tipo A'] || 150) * 2; 
    const costosOperativos = costoDiesel + costoCasetas;

    const utilidadNeta = ingresoBruto - costosOperativos - sueldoOperador;

    // Aquí iría el INSERT a la tabla `liquidations`
    const { error } = await supabase.from('liquidations').insert([{
      trip_id: viajeId, // fallará si el viaje no existe en la DB, por eso está simulado
      recaudo_total: ingresoBruto,
      diesel_cost: costoDiesel,
      casetas_cost: costoCasetas,
      sueldo_operador: sueldoOperador
    }]);

    // Como la DB validará llaves foráneas y el trip_id es simulado, para la demo en pantalla solo actualizamos el estado:
    setViajesPorLiquidar(prev => prev.map(v => v.id === viajeId ? { ...v, liquidado: true, utilidad: utilidadNeta } : v));
  };

  if (loading) return <div>Cargando motor de cálculo...</div>;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="topbar" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Caja / Recaudación</h1>
          <p className="page-subtitle">Liquidación automatizada de viajes finalizados.</p>
        </div>
      </div>

      <div className="grid-cards">
        {viajesPorLiquidar.map(viaje => (
          <div key={viaje.id} className="glass-card" style={{ borderLeft: viaje.liquidado ? '4px solid #10b981' : '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>{viaje.unidad}</h3>
                <span style={{ color: 'var(--text-muted)' }}>{viaje.operador}</span>
              </div>
              <div className="avatar" style={{ background: 'var(--surface-color)' }}>
                {viaje.liquidado ? <CheckCircle color="#10b981" /> : <Clock color="#f59e0b" />}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ingreso por Boletos:</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>${viaje.ingreso_bruto.toFixed(2)}</span>
              </div>
              
              {viaje.liquidado ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#ef4444' }}>- Diésel y Casetas:</span>
                    <span style={{ color: '#ef4444' }}>-${((costos['Diesel'] || 24.5) * 40 + (costos['Caseta Tipo A'] || 150) * 2).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#ef4444' }}>- Sueldo Fijo Operador:</span>
                    <span style={{ color: '#ef4444' }}>-$200.00</span>
                  </div>
                  <hr style={{ borderColor: 'var(--glass-border)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
                    <span style={{ color: 'var(--text-main)' }}>Utilidad Neta:</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>${(viaje as any).utilidad?.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Pendiente de cálculo matemático.
                </div>
              )}
            </div>

            {!viaje.liquidado && (
              <button 
                onClick={() => liquidarViaje(viaje.id, viaje.ingreso_bruto)}
                style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Calculator size={18} /> CALCULAR Y LIQUIDAR
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
