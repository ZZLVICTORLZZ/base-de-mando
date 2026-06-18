import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ListOrdered, Search, Calendar as CalendarIcon, Loader2, Trash2 } from 'lucide-react';
import { isAdmin } from '../../lib/permissions';

interface RolOficial {
  id: string;
  fecha: string;
  plantilla_base_id: string;
  plantillas_predeterminadas: { name: string };
  creado_por: string;
  created_at: string;
  rows: any[];
}

export const RolDespegue = () => {
  const [roles, setRoles] = useState<RolOficial[]>([]);
  const [selectedRolId, setSelectedRolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    setUserIsAdmin(isAdmin());
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('roles_del_dia')
      .select('*, plantillas_predeterminadas(name)')
      .not('creado_por', 'ilike', '[OTP]%')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRoles(data as RolOficial[]);
      if (data.length > 0) setSelectedRolId(data[0].id);
    }
    setLoading(false);
  };

  const handleDeleteRol = async (id: string) => {
    if (!userIsAdmin) {
      alert('Acceso denegado. Solo un administrador puede eliminar roles oficiales.');
      return;
    }
    if (window.confirm('¿Estás completamente seguro de ELIMINAR este Rol Oficial? Se perderá el registro de los autobuses asignados ese día.')) {
      const { error } = await supabase.from('roles_del_dia').delete().eq('id', id);
      if (error) alert('Error al borrar: ' + error.message);
      else {
        const remaining = roles.filter(r => r.id !== id);
        setRoles(remaining);
        if (remaining.length > 0) setSelectedRolId(remaining[0].id);
        else setSelectedRolId(null);
      }
    }
  };

  const selectedRol = roles.find(r => r.id === selectedRolId);

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', height: '100%' }}>
      {/* Sidebar: Historial de Roles */}
      <div style={{ width: '300px', background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
        <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={18} color="var(--primary)" />
          Historial de Roles
        </h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}><Loader2 className="spin" size={24} /></div>
        ) : roles.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>No hay roles oficiales publicados aún desde J2.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {roles.map(rol => (
              <button 
                key={rol.id}
                onClick={() => setSelectedRolId(rol.id)}
                style={{
                  textAlign: 'left', padding: '12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: rol.id === selectedRolId ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface-glass)',
                  border: `1px solid ${rol.id === selectedRolId ? 'var(--primary)' : 'var(--glass-border)'}`,
                }}
              >
                <div style={{ color: rol.id === selectedRolId ? 'var(--primary)' : 'var(--text-main)', fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>
                  {rol.plantillas_predeterminadas?.name || 'Plantilla Desconocida'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fecha: {rol.fecha}</span>
                  <span style={{ color: '#10b981' }}>Activo</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content: Vista del Rol */}
      <div style={{ flex: 1, background: 'var(--surface-glass)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
        {selectedRol ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <ListOrdered size={24} />
                  Rol Oficial: {selectedRol.plantillas_predeterminadas?.name}
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>Creado por: {selectedRol.creado_por}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedRol.fecha}</div>
                <div style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '4px' }}>✓ Sincronizado desde J2</div>
                {userIsAdmin && (
                  <button 
                    onClick={() => handleDeleteRol(selectedRol.id)} 
                    style={{ marginTop: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={16} /> Borrar Rol
                  </button>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--primary)', color: 'var(--primary)' }}>
                    <th style={{ padding: '12px' }}>NO.</th>
                    <th style={{ padding: '12px' }}>FRECUENCIA</th>
                    <th style={{ padding: '12px' }}>HORARIO</th>
                    <th style={{ padding: '12px', color: '#10b981' }}>UNIDAD (ECO)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRol.rows.map((row: any) => (
                    <tr 
                      key={row.id} 
                      style={{ 
                        borderBottom: '1px solid var(--glass-border)', 
                        background: row.highlightColor ? `${row.highlightColor}33` : 'transparent',
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '16px 12px', fontWeight: 'bold', color: 'var(--text-main)' }}>{row.no}</td>
                      <td style={{ padding: '16px 12px', color: 'var(--text-main)' }}>{row.frec}</td>
                      <td style={{ padding: '16px 12px', color: '#eab308', fontWeight: 'bold' }}>{row.horario}</td>
                      <td style={{ padding: '16px 12px', color: row.eco ? '#10b981' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        {row.eco || '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Selecciona un rol del historial para ver sus unidades asignadas.
          </div>
        )}
      </div>
    </div>
  );
};
