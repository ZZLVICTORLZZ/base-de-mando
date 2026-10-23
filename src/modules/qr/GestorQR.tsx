import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../core/supabaseClient';
import { Truck, QrCode, Search, RefreshCw, Printer, ShieldCheck, Tag, CheckSquare, Square } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Unidad {
  id: number;
  numero: string;
  tipo: string;
  marca: string;
  anio: number | null;
  qr_token: string | null;
}

// Icono SVG del Cohete
const rocketSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="black" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>`;

export const GestorQR = () => {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchUnidades = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('unidades')
      .select('id, numero, tipo, marca, anio, qr_token')
      .order('numero');
      
    if (!error && data) {
      setUnidades(data as Unidad[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUnidades();
  }, []);

  const generateBatchQR = async () => {
    let updatedUnidades = [...unidades];
    let errors = 0;

    for (const id of selectedIds) {
      const u = updatedUnidades.find(x => x.id === id);
      if (u && !u.qr_token) {
        const newToken = crypto.randomUUID();
        const { error } = await supabase.from('unidades').update({ qr_token: newToken }).eq('id', id);
        if (!error) {
          u.qr_token = newToken;
        } else {
          errors++;
        }
      }
    }
    
    setUnidades(updatedUnidades);
    if (errors > 0) alert(`Hubo error al generar ${errors} tokens.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = unidades.filter(u => 
    String(u.numero).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAllFiltered = () => {
    if (filtered.every(u => selectedIds.includes(u.id))) {
      // Unselect all filtered
      const filteredIds = filtered.map(u => u.id);
      setSelectedIds(selectedIds.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered
      const newSelected = new Set([...selectedIds, ...filtered.map(u => u.id)]);
      setSelectedIds(Array.from(newSelected));
    }
  };

  const selectedUnidadesData = unidades.filter(u => selectedIds.includes(u.id));
  const allSelectedHaveQR = selectedUnidadesData.length > 0 && selectedUnidadesData.every(u => u.qr_token);

  // Componente de Tarjetón Individual (Diseño Minimalista / Transporte)
  const CardTemplate = ({ unidad, isPrint = false }: { unidad: Unidad, isPrint?: boolean }) => (
    <div style={{ 
      width: isPrint ? '85.6mm' : '420px', 
      height: isPrint ? '54mm' : '265px', 
      background: '#ffffff', 
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden',
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      boxShadow: isPrint ? 'none' : '0 20px 40px rgba(0,0,0,0.1)',
      borderRadius: isPrint ? '0' : '16px',
      border: isPrint ? '1px solid #cbd5e1' : 'none',
      pageBreakInside: 'avoid',
      margin: isPrint ? '0' : '0 auto',
      position: 'relative'
    }}>
      {/* Minimalist Accent Line */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: isPrint ? '1.5mm' : '6px', background: 'var(--primary)' }} />
      
      {/* Left Info Panel */}
      <div style={{ flex: 1, padding: isPrint ? '6mm 6mm 4mm 6mm' : '25px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Top row: Brand / Project */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isPrint ? '2mm' : '10px' }}>
          <Truck size={isPrint ? 14 : 22} color="#000" />
          <span style={{ fontWeight: 800, fontSize: isPrint ? '7pt' : '0.85rem', letterSpacing: '1.5px', color: '#000' }}>APOLO 11 TREAL</span>
        </div>
        
        {/* Middle: ECO Number */}
        <div style={{ marginTop: isPrint ? '2mm' : '10px' }}>
          <div style={{ fontSize: isPrint ? '7pt' : '0.85rem', color: '#64748b', fontWeight: 600, letterSpacing: '1.5px' }}>UNIDAD</div>
          <div style={{ fontSize: isPrint ? '42pt' : '5rem', fontWeight: 900, color: '#000', lineHeight: 0.85, letterSpacing: '-2px', marginTop: isPrint ? '1mm' : '4px' }}>
            {unidad.numero}
          </div>
        </div>
        
        {/* Bottom: Meta info */}
        <div style={{ borderTop: '2px solid #000', paddingTop: isPrint ? '2mm' : '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: isPrint ? '2mm' : '10px' }}>
          <div style={{ fontSize: isPrint ? '8pt' : '1rem', color: '#000', fontWeight: 700, textTransform: 'uppercase' }}>
            {unidad.anio ? `AÑO ${unidad.anio}` : (unidad.marca || 'GENÉRICO')}
          </div>
          <div style={{ fontSize: isPrint ? '6pt' : '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
            ID:{unidad.qr_token?.split('-')[0]}
          </div>
        </div>
      </div>
      
      {/* Right QR Panel (Ticket stub aesthetic) */}
      <div style={{ padding: isPrint ? '4mm' : '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderLeft: '2px dashed #cbd5e1' }}>
        <QRCodeSVG 
          value={`saturnov://checkin/unit?token=${unidad.qr_token}`} 
          size={isPrint ? 130 : 160}
          level={"H"}
          imageSettings={{
            src: rocketSvg,
            height: isPrint ? 30 : 38,
            width: isPrint ? 30 : 38,
            excavate: true,
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="module-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      <header className="module-header glass-panel" style={{ marginBottom: 0, padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '2rem', margin: 0 }}>
            <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
              <QrCode size={28} color="#fff" />
            </div>
            Gestor de Tarjetones QR (Lotes)
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 52px', fontSize: '1rem' }}>
            Selecciona múltiples unidades para imprimir sus tarjetones en una sola hoja.
          </p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT COLUMN - LISTA */}
        <div className="glass-panel" style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
          
          <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type="text" 
                  placeholder="Buscar ECO..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
              <button onClick={fetchUnidades} className="glass-button" style={{ padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)', cursor: 'pointer' }}>
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            
            {/* Controles de Lote */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={selectAllFiltered} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {filtered.length > 0 && filtered.every(u => selectedIds.includes(u.id)) ? <CheckSquare size={18} /> : <Square size={18} />}
                Seleccionar Todos
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedIds.length} seleccionados</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <RefreshCw size={30} color="var(--primary)" className="animate-spin" style={{ margin: '0 auto 15px' }} />
                <p style={{ color: 'var(--text-muted)' }}>Cargando unidades...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filtered.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => toggleSelection(u.id)}
                    style={{ 
                      padding: '12px 15px', 
                      borderRadius: '10px', 
                      border: '1px solid',
                      borderColor: selectedIds.includes(u.id) ? 'var(--primary)' : 'var(--glass-border)',
                      background: selectedIds.includes(u.id) ? 'rgba(59,130,246,0.1)' : 'var(--surface-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ color: selectedIds.includes(u.id) ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {selectedIds.includes(u.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Truck size={16} color="var(--primary)" /> ECO {u.numero}
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.marca}</span>
                      </div>
                    </div>
                    <div>
                      {u.qr_token ? (
                        <ShieldCheck size={24} color="#10b981" />
                      ) : (
                        <div style={{ background: '#f59e0b', width: '10px', height: '10px', borderRadius: '5px' }} title="Sin QR asignado"></div>
                      )}
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>No se encontraron unidades.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - PREVIEW & PRINT */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 40px', alignItems: 'center', justifyContent: 'flex-start', overflowY: 'auto' }}>
          
          {selectedIds.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
              
              <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text-main)', textAlign: 'center' }}>
                Impresión por Lotes ({selectedIds.length} Tarjetas)
              </h2>
              
              {allSelectedHaveQR ? (
                <>
                  {/* CSS para Impresión - Grid A4 */}
                  <style>
                    {`
                    @media print {
                      @page { size: auto; margin: 10mm; }
                      body > :not(#print-portal) { display: none !important; }
                      html, body { background: white !important; }
                      #print-portal {
                        display: flex !important;
                        flex-wrap: wrap;
                        gap: 2mm;
                        justify-content: flex-start;
                        align-content: flex-start;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                    }
                    `}
                  </style>

                  {/* PORTAL: Lo que realmente se imprime (Grid oculto) */}
                  {createPortal(
                    <div id="print-portal" style={{ display: 'none' }}>
                      {selectedUnidadesData.map(u => (
                        <CardTemplate key={u.id} unidad={u} isPrint={true} />
                      ))}
                    </div>,
                    document.body
                  )}

                  {/* PREVIEW EN PANTALLA */}
                  {selectedIds.length === 1 ? (
                    <div style={{ marginBottom: '30px' }}>
                      <CardTemplate unidad={selectedUnidadesData[0]} isPrint={false} />
                    </div>
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      background: 'rgba(59,130,246,0.05)', 
                      border: '1px solid rgba(59,130,246,0.2)', 
                      borderRadius: '16px', 
                      padding: '30px', 
                      textAlign: 'center',
                      marginBottom: '30px'
                    }}>
                      <Printer size={48} color="var(--primary)" style={{ margin: '0 auto 15px', opacity: 0.8 }} />
                      <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginBottom: '10px' }}>Lote Listo para Imprimir</h3>
                      <p style={{ color: 'var(--text-muted)' }}>Has seleccionado {selectedIds.length} unidades para imprimir juntas.<br/>Se acomodarán automáticamente en las hojas de papel para ahorrar espacio.</p>
                    </div>
                  )}

                  <button 
                    className="no-print"
                    onClick={handlePrint}
                    style={{ 
                      background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '16px 32px', 
                      borderRadius: '12px', 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      cursor: 'pointer',
                      boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Printer size={22} /> Imprimir {selectedIds.length > 1 ? 'Lote de Tarjetones' : 'Tarjetón'} QR
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '40px' }}>
                  <div style={{ width: '100%', border: '3px dashed #f59e0b', background: 'rgba(245,158,11,0.05)', borderRadius: '20px', padding: '30px', textAlign: 'center', color: 'var(--text-main)' }}>
                    <ShieldCheck size={48} color="#f59e0b" style={{ margin: '0 auto 15px' }} />
                    <h3 style={{ margin: '0 0 10px 0' }}>Faltan Códigos QR</h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Al menos una de las unidades seleccionadas aún no tiene un token QR generado.</p>
                  </div>
                  <button 
                    onClick={generateBatchQR}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <ShieldCheck size={20} /> Generar QR para la Selección
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '60px' }}>
              <div style={{ background: 'var(--surface-color)', width: '100px', height: '100px', borderRadius: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px' }}>
                <CheckSquare size={40} opacity={0.5} />
              </div>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '10px' }}>Ninguna Unidad Seleccionada</h3>
              <p>Selecciona una o más unidades marcando sus casillas en el panel izquierdo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
