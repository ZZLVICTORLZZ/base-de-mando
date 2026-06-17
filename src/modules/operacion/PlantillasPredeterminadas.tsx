import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Highlighter, Save, Edit3, Loader2, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { isAdmin } from '../../lib/permissions';

interface RowData {
  id: string;
  no: number;
  frec: string;
  horario: string;
  eco: string;
  highlightColor?: string;
}

interface Template {
  id: string;
  name: string;
  rows: RowData[];
}

export const PlantillasPredeterminadas = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  const colors = [
    '#fde047', // Amarillo
    '#86efac', // Verde
    '#fca5a5', // Rojo
    '#93c5fd', // Azul
    '#ff00ff', // Magenta Fosforescente
    '#ff7f00', // Naranja Fosforescente
    '#39ff14'  // Verde Fosforescente
  ];

  const activeTemplate = templates.find(t => t.id === activeTemplateId);

  // Auto-calculate times when a frequency or start time changes
  const calculateTimes = (rows: RowData[], changedIndex: number = 0, fieldChanged: 'frec' | 'horario' = 'frec') => {
    let currentRows = [...rows];
    
    // Si se cambió un horario manualmente (y no es la primera fila), calculamos su nueva frecuencia respecto al anterior
    if (fieldChanged === 'horario' && changedIndex > 0) {
      const prevTime = currentRows[changedIndex - 1].horario;
      const newTime = currentRows[changedIndex].horario;
      
      // Intentamos validar que ambos tiempos tengan formato HH:mm
      if (prevTime && prevTime.includes(':') && newTime && newTime.includes(':')) {
        const [hPrev, mPrev] = prevTime.split(':').map(Number);
        const [hNew, mNew] = newTime.split(':').map(Number);
        
        if (!isNaN(hPrev) && !isNaN(hNew)) {
          let diff = (hNew * 60 + mNew) - (hPrev * 60 + mPrev);
          if (diff < 0) diff += 24 * 60; // Caso cruce de medianoche
          currentRows[changedIndex].frec = diff.toString();
        }
      }
    }

    // A partir del índice modificado, recalculamos los horarios hacia abajo usando la frecuencia
    // (O si fue un cambio de horario, recalculamos desde el siguiente índice)
    const startIndexForCascade = fieldChanged === 'horario' ? changedIndex + 1 : changedIndex;
    
    for (let i = Math.max(1, startIndexForCascade); i < currentRows.length; i++) {
      const prevTime = currentRows[i - 1].horario;
      const currentFrec = parseInt(currentRows[i].frec);
      
      if (prevTime && prevTime.includes(':') && !isNaN(currentFrec)) {
        const [hours, minutes] = prevTime.split(':').map(Number);
        const date = new Date(2000, 0, 1, hours, minutes);
        date.setMinutes(date.getMinutes() + currentFrec);
        
        const newHours = String(date.getHours()).padStart(2, '0');
        const newMinutes = String(date.getMinutes()).padStart(2, '0');
        currentRows[i].horario = `${newHours}:${newMinutes}`;
      }
    }
    return currentRows;
  };

  useEffect(() => {
    setUserIsAdmin(isAdmin());
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('plantillas_predeterminadas').select('*').order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching templates:', error);
    } else if (data && data.length > 0) {
      const formatted = data.map(d => ({ id: d.id, name: d.name, rows: d.rows }));
      setTemplates(formatted);
      setActiveTemplateId(formatted[0].id);
    }
    setIsLoading(false);
  };

  const handleCreateTemplate = async () => {
    const name = prompt('Nombre de la nueva plantilla (Ej. Sabatino):');
    if (!name) return;
    
    const newTemplate = {
      name,
      rows: [{ id: Date.now().toString(), no: 1, frec: 'I.F.', horario: '05:00', eco: '' }]
    };

    setIsSaving(true);
    const { data, error } = await supabase.from('plantillas_predeterminadas').insert([newTemplate]).select();
    setIsSaving(false);

    if (error) {
      alert('Error al crear plantilla en la nube: ' + error.message);
      return;
    }

    if (data && data[0]) {
      const added: Template = { id: data[0].id, name: data[0].name, rows: data[0].rows };
      setTemplates([...templates, added]);
      setActiveTemplateId(added.id);
      setIsReadOnly(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string, name: string) => {
    if (!userIsAdmin) {
      alert('Solo un administrador puede borrar plantillas.');
      return;
    }
    if (window.confirm(`ATENCIÓN: ¿Estás seguro de eliminar permanentemente la plantilla "${name}"?`)) {
      const { error } = await supabase.from('plantillas_predeterminadas').delete().eq('id', templateId);
      if (error) {
        if (error.code === '23503') {
          alert('No se puede borrar esta plantilla porque ya hay "Roles del Día" históricos que la están usando. Borrarla arruinaría el historial.');
        } else {
          alert('Error al eliminar: ' + error.message);
        }
      } else {
        const remaining = templates.filter(t => t.id !== templateId);
        setTemplates(remaining);
        if (remaining.length > 0) setActiveTemplateId(remaining[0].id);
        else setActiveTemplateId('');
      }
    }
  };

  const handleUpdateRow = (rowId: string, field: keyof RowData, value: string) => {
    if (!activeTemplate) return;
    const rowIndex = activeTemplate.rows.findIndex(r => r.id === rowId);
    
    const updatedRows = activeTemplate.rows.map(r => 
      r.id === rowId ? { ...r, [field]: value } : r
    );
    
    // Recalcular cascada o frecuencia
    const recalculatedRows = (field === 'frec' || field === 'horario')
      ? calculateTimes(updatedRows, rowIndex, field as 'frec' | 'horario') 
      : updatedRows;

    const updatedTemplates = templates.map(t => 
      t.id === activeTemplate.id ? { ...t, rows: recalculatedRows } : t
    );
    setTemplates(updatedTemplates);
  };

  const handleAddRow = () => {
    if (!activeTemplate) return;
    const lastRow = activeTemplate.rows[activeTemplate.rows.length - 1];
    const newNo = (lastRow?.no || 0) + 1;
    
    const newRow: RowData = {
      id: Date.now().toString(),
      no: newNo,
      frec: '15', // Default frec
      horario: '', // Se calculará automático
      eco: ''
    };

    const updatedRows = calculateTimes([...activeTemplate.rows, newRow], activeTemplate.rows.length, 'frec');
    
    const updatedTemplates = templates.map(t => 
      t.id === activeTemplate.id ? { ...t, rows: updatedRows } : t
    );
    setTemplates(updatedTemplates);
  };

  const handleRowClick = (rowId: string) => {
    if (!activeColor || !activeTemplate) return;
    
    const updatedRows = activeTemplate.rows.map(r => {
      if (r.id === rowId) {
        // Toggle color off if same color is clicked
        return { ...r, highlightColor: r.highlightColor === activeColor ? undefined : activeColor };
      }
      return r;
    });

    const updatedTemplates = templates.map(t => 
      t.id === activeTemplate.id ? { ...t, rows: updatedRows } : t
    );
    setTemplates(updatedTemplates);
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', height: '100%' }}>
      {/* Sidebar: Lista de Plantillas */}
      <div style={{ width: '250px', background: 'var(--surface-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
        <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Mis Plantillas
          {userIsAdmin && (
            <button onClick={handleCreateTemplate} title="Nueva Plantilla" style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Plus size={16} />
            </button>
          )}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {templates.map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTemplateId(t.id)}
              style={{
                textAlign: 'left', padding: '10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                background: t.id === activeTemplateId ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: `1px solid ${t.id === activeTemplateId ? 'var(--primary)' : 'transparent'}`,
                color: t.id === activeTemplateId ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: t.id === activeTemplateId ? 600 : 400
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Edición de la Tabla */}
      <div style={{ flex: 1, background: 'var(--surface-glass)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
        {activeTemplate ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isReadOnly ? <Eye size={24} color="var(--primary)" /> : <Edit3 size={24} color="#eab308" />}
                {activeTemplate.name}
              </h2>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {/* Botones de Administrador */}
                {userIsAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => setIsReadOnly(!isReadOnly)}
                      style={{ background: isReadOnly ? 'var(--primary)' : 'transparent', color: isReadOnly ? '#fff' : 'var(--text-main)', border: `1px solid ${isReadOnly ? 'transparent' : 'var(--glass-border)'}`, padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isReadOnly ? <><Edit3 size={16} /> Editar</> : 'Cerrar Edición'}
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(activeTemplate.id, activeTemplate.name)}
                      title="Borrar Plantilla"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}

                {/* Marcatextos Tool (Solo Edición) */}
                {!isReadOnly && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--surface-color)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                    <Highlighter size={18} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '5px' }}>Marcatextos:</span>
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setActiveColor(activeColor === color ? null : color)}
                        style={{
                          width: '24px', height: '24px', borderRadius: '50%', background: color, border: 'none', cursor: 'pointer',
                          boxShadow: activeColor === color ? `0 0 0 2px var(--bg-color), 0 0 0 4px ${color}` : 'none'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
              <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--primary)', color: 'var(--primary)' }}>
                    <th style={{ padding: '12px' }}>NO.</th>
                    <th style={{ padding: '12px' }}>FRECUENCIA</th>
                    <th style={{ padding: '12px' }}>HORARIO</th>
                    <th style={{ padding: '12px' }}>ECO</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTemplate.rows.map((row, index) => (
                    <tr 
                      key={row.id} 
                      onClick={() => handleRowClick(row.id)}
                      style={{ 
                        borderBottom: '1px solid var(--glass-border)', 
                        background: row.highlightColor ? `${row.highlightColor}33` : 'transparent', // 33 is 20% opacity hex
                        cursor: activeColor ? 'pointer' : 'default',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}>{row.no}</td>
                      <td style={{ padding: '12px' }}>
                        <input 
                          type="text" 
                          disabled={isReadOnly}
                          value={row.frec}
                          onChange={(e) => handleUpdateRow(row.id, 'frec', e.target.value)}
                          onClick={(e) => !isReadOnly && activeColor && e.stopPropagation()} // Prevent highlighting when editing
                          style={{ width: '80px', textAlign: 'center', background: isReadOnly ? 'transparent' : 'rgba(0,0,0,0.2)', border: isReadOnly ? 'none' : '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input 
                          type="text" 
                          disabled={isReadOnly}
                          value={row.horario}
                          onChange={(e) => handleUpdateRow(row.id, 'horario', e.target.value)}
                          onClick={(e) => !isReadOnly && activeColor && e.stopPropagation()}
                          style={{ width: '100px', textAlign: 'center', background: isReadOnly ? 'transparent' : 'rgba(0,0,0,0.2)', border: isReadOnly ? 'none' : '1px solid var(--glass-border)', color: index === 0 ? 'var(--text-main)' : '#eab308', padding: '6px', borderRadius: '4px', fontWeight: index > 0 ? 'bold' : 'normal' }}
                        />
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>---</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isReadOnly && (
              <>
                <button onClick={handleAddRow} style={{ background: 'var(--surface-color)', color: 'var(--text-main)', border: '1px dashed var(--glass-border)', padding: '10px 20px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Plus size={18} /> Añadir Siguiente Turno
                </button>
                
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={async () => {
                      if(!activeTemplate) return;
                      setIsSaving(true);
                      const { error } = await supabase.from('plantillas_predeterminadas').update({ rows: activeTemplate.rows }).eq('id', activeTemplate.id);
                      setIsSaving(false);
                      if(error) alert('Error al guardar: ' + error.message);
                      else {
                        alert('¡Plantilla guardada en la nube con éxito!');
                        setIsReadOnly(true); // Exit edit mode after saving
                      }
                    }}
                    disabled={isSaving}
                    style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 'var(--radius-sm)', cursor: isSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', opacity: isSaving ? 0.7 : 1 }}>
                    {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />} 
                    {isSaving ? 'Guardando...' : 'Guardar Plantilla en Nube'}
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            {isLoading ? 'Conectando a Supabase...' : 'Selecciona o crea una plantilla para empezar.'}
          </div>
        )}
      </div>
    </div>
  );
};
