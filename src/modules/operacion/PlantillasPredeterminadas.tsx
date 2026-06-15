import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Highlighter, Save, Edit3, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

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
  const calculateTimes = (rows: RowData[]) => {
    let currentRows = [...rows];
    for (let i = 1; i < currentRows.length; i++) {
      const prevTime = currentRows[i - 1].horario;
      const currentFrec = parseInt(currentRows[i].frec);
      
      if (prevTime && !isNaN(currentFrec)) {
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
    }
  };

  const handleUpdateRow = (rowId: string, field: keyof RowData, value: string) => {
    if (!activeTemplate) return;
    const updatedRows = activeTemplate.rows.map(r => 
      r.id === rowId ? { ...r, [field]: value } : r
    );
    
    // Si se modificó la frecuencia o el horario inicial, recalculamos
    const recalculatedRows = field === 'frec' || (field === 'horario' && updatedRows.findIndex(r=>r.id===rowId) === 0) 
      ? calculateTimes(updatedRows) 
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

    const updatedRows = calculateTimes([...activeTemplate.rows, newRow]);
    
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
          <button onClick={handleCreateTemplate} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Plus size={16} />
          </button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit3 size={24} color="var(--primary)" />
                {activeTemplate.name}
              </h2>
              
              {/* Marcatextos Tool */}
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
                          value={row.frec}
                          onChange={(e) => handleUpdateRow(row.id, 'frec', e.target.value)}
                          onClick={(e) => activeColor && e.stopPropagation()} // Prevent highlighting when editing
                          style={{ width: '80px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px' }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <input 
                          type="text" 
                          value={row.horario}
                          onChange={(e) => handleUpdateRow(row.id, 'horario', e.target.value)}
                          onClick={(e) => activeColor && e.stopPropagation()}
                          disabled={index > 0} // Only first row is editable, rest are calculated
                          style={{ width: '100px', textAlign: 'center', background: index === 0 ? 'rgba(0,0,0,0.2)' : 'transparent', border: index === 0 ? '1px solid var(--glass-border)' : 'none', color: index === 0 ? 'var(--text-main)' : '#eab308', padding: '6px', borderRadius: '4px', fontWeight: index > 0 ? 'bold' : 'normal' }}
                        />
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>---</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
                  else alert('¡Plantilla guardada en la nube con éxito!');
                }}
                disabled={isSaving}
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 'var(--radius-sm)', cursor: isSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />} 
                {isSaving ? 'Guardando...' : 'Guardar Plantilla en Nube'}
              </button>
            </div>
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
