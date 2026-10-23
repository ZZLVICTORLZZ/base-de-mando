import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../modules/core/supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { 
  RefreshCw, Search, Plus, Trash2, Edit3, Save, X, Phone, Truck, 
  UserCheck, Users, CheckCircle2, AlertCircle, Shield, Star, Calendar, MessageCircle,
  Briefcase, ArrowLeft
} from 'lucide-react';

const TabOperadores = ({ onBack, canEdit }: { onBack: () => void, canEdit?: boolean }) => {
  const [operadores, setOperadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'perfiles' | 'directorio'>('perfiles');
  const [filterEstatus, setFilterEstatus] = useState<string>('Todos');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Opcional: validar tamaño (ej. < 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("La imagen es muy grande. Usa una menor a 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm((prev: any) => ({ ...prev, foto_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchOperadores();
  }, []);

  const fetchOperadores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('operadores')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setOperadores(data);
    setLoading(false);
  };

  const handleEdit = (op: any) => {
    setEditingId(op.id);
    setEditForm({
      nombre: op.nombre || op.name || '',
      apellidos: op.apellidos || op.last_name || op.apellido || '',
      apodo: op.apodo || '',
      foto_url: op.foto_url || '',
      telefono: op.telefono || op.phone || op.celular || '',
      email: op.email || '',
      password_app: op.password_app || '',
      is_active: op.is_active !== undefined ? op.is_active : true,
      unidad_asignada: op.unidad_asignada || op.eco || op.unidad || '',
      estatus: op.estatus || op.status || 'Activo',
      licencia: op.licencia || '',
      vigencia_licencia: op.vigencia_licencia || '',
      tipo_sangre: op.tipo_sangre || 'O+',
      calificacion: op.calificacion || 5,
      rol_preferido: op.rol_preferido || 'Entre Semana',
      observaciones: op.observaciones || ''
    });
    setIsAddingNew(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleSave = async () => {
    const payload = { ...editForm };
    
    // Postgres no acepta strings vacíos o inválidos en columnas DATE
    if (!payload.vigencia_licencia || payload.vigencia_licencia.trim() === '') {
      payload.vigencia_licencia = null;
    } else if (payload.vigencia_licencia.length < 8) {
      alert("Por favor ingresa una fecha de vigencia válida o déjala en blanco.");
      return;
    }

    if (isAddingNew) {
      console.log("Intentando guardar nuevo operador...", payload);
      const { error } = await supabase.from('operadores').insert([payload]);
      if (!error) { 
        console.log("Guardado exitoso. Cerrando modal.");
        fetchOperadores(); 
        setIsAddingNew(false); 
        setEditingId(null); 
      } else {
        console.error("Error al insertar:", error);
        alert('Error al guardar el registro: ' + error.message);
      }
    } else {
      if (editingId === 'new') {
        console.warn("Estado inconsistente detectado (intentando actualizar ID 'new'). Cerrando modal.");
        setIsAddingNew(false);
        setEditingId(null);
        return;
      }
      console.log("Intentando actualizar operador...", editingId, payload);
      const { error } = await supabase.from('operadores').update(payload).eq('id', editingId);
      if (!error) { 
        console.log("Actualización exitosa. Cerrando modal.");
        fetchOperadores(); 
        setEditingId(null); 
      } else {
        console.error("Error al actualizar:", error);
        alert('Error al actualizar: ' + error.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar operador?')) return;
    const { error } = await supabase.from('operadores').delete().eq('id', id);
    if (!error) setOperadores(operadores.filter(o => o.id !== id));
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingId('new');
    setEditForm({
      nombre: '', apellidos: '', apodo: '', foto_url: '', telefono: '', 
      email: '', password_app: '', is_active: true,
      unidad_asignada: '', estatus: 'Activo', licencia: '', vigencia_licencia: '', tipo_sangre: 'O+',
      calificacion: 5, rol_preferido: 'Entre Semana', observaciones: ''
    });
  };

  const filteredOperadores = operadores.filter(op => {
    const term = search.toLowerCase();
    const nombreCompleto = `${op.nombre || op.name || ''} ${op.apellidos || op.last_name || op.apellido || ''}`.toLowerCase();
    const apodo = (op.apodo || '').toLowerCase();
    const unidad = (op.unidad_asignada || op.eco || op.unidad || '').toLowerCase();
    const lic = (op.licencia || '').toLowerCase();
    const matchesSearch = nombreCompleto.includes(term) || apodo.includes(term) || unidad.includes(term) || lic.includes(term);

    if (filterEstatus === 'Todos') return matchesSearch;
    if (filterEstatus === 'Activos') return matchesSearch && (op.estatus || op.status) === 'Activo';
    if (filterEstatus === 'Descanso') return matchesSearch && (op.estatus || op.status) !== 'Activo';
    if (filterEstatus === 'SinUnidad') return matchesSearch && !op.unidad_asignada && !op.eco;
    return matchesSearch;
  });



  return (
    <div className="animate-fade-in p-6 h-full" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={onBack} className="p-3 rounded-xl bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700/60 transition-colors shadow-sm hover:bg-slate-700 hover:scale-105">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 m-0 flex items-center gap-3 tracking-tight">
              <Briefcase size={28} className="text-emerald-400" /> Directorio de Operadores
            </h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">Administra gafetes, identidad, unidades y situación operativa.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchOperadores} style={{ background: 'var(--bg-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {canEdit && (
            <button onClick={handleAddNew} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Plus size={18} /> Subir Perfil de Operador
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.1)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
          <button onClick={() => setActiveTab('perfiles')} style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'perfiles' ? 'var(--primary)' : 'transparent', color: activeTab === 'perfiles' ? '#fff' : 'var(--text-muted)' }}>
            <UserCheck size={18} /> Gafetes
          </button>
          <button onClick={() => setActiveTab('directorio')} style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'directorio' ? 'var(--primary)' : 'transparent', color: activeTab === 'directorio' ? '#fff' : 'var(--text-muted)' }}>
            <Users size={18} /> Directorio (Tabla)
          </button>
        </div>
        {activeTab === 'perfiles' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filtro:</span>
            {['Todos', 'Activos', 'Descanso', 'SinUnidad'].map(f => (
              <button key={f} onClick={() => setFilterEstatus(f)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', cursor: 'pointer', fontSize: '12px', background: filterEstatus === f ? 'var(--primary)' : 'var(--bg-color)', color: filterEstatus === f ? '#fff' : 'var(--text-main)' }}>
                {f === 'SinUnidad' ? 'Sin Unidad' : f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por Nombre, Apodo, ECO o Licencia..." style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }} />
      </div>

      {(isAddingNew || editingId) && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'grid', placeItems: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'var(--surface-color)', padding: '30px', borderRadius: '16px', border: '1px solid var(--primary)', width: '100%', maxWidth: '900px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={24} color="var(--primary)" /> {isAddingNew ? 'Nuevo Expediente de Operador' : 'Editar Ficha: ' + editForm.nombre}
              </h3>
              <button onClick={handleCancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '1 1 300px' }}>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '120px', height: '120px', borderRadius: '60px', overflow: 'hidden', border: '3px solid var(--primary)', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-color)' }}>
                    {editForm.foto_url ? <img src={editForm.foto_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCheck size={40} color="var(--text-muted)" />}
                  </div>
                  <label style={{ width: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--surface-color)', padding: '12px', borderRadius: '6px', border: '1px dashed var(--primary)', transition: 'all 0.3s ease' }} className="hover:bg-slate-800">
                    <span style={{ fontSize: '13px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                      <Plus size={16} color="var(--primary)" /> Seleccionar Archivo
                    </span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ color: 'var(--primary)', marginTop: 0, marginBottom: '15px' }}>Identidad Básica</h4>
                  <label style={{ display: 'block', marginBottom: '10px' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Nombre(s) *</span>
                    <input type="text" value={editForm.nombre || ''} onChange={e => setEditForm({...editForm, nombre: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }} />
                  </label>
                  <label style={{ display: 'block', marginBottom: '10px' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Apellidos *</span>
                    <input type="text" value={editForm.apellidos || ''} onChange={e => setEditForm({...editForm, apellidos: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }} />
                  </label>
                  <label style={{ display: 'block', marginBottom: '10px' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Apodo / Alias *</span>
                    <input type="text" value={editForm.apodo || ''} onChange={e => setEditForm({...editForm, apodo: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }} />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Teléfono Móvil (Solo números)</span>
                    <input 
                      type="tel" 
                      value={editForm.telefono || ''} 
                      onChange={e => {
                        const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                        setEditForm({...editForm, telefono: onlyNums});
                      }} 
                      style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }} 
                      placeholder="Ej. 5512345678"
                    />
                  </label>
                </div>
                
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ color: 'var(--primary)', marginTop: 0, marginBottom: '15px' }}>Acceso App Motor F1</h4>
                  <label style={{ display: 'block', marginBottom: '10px' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Correo Electrónico (Login)</span>
                    <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }} placeholder="operador@f1.com" />
                  </label>
                  <label style={{ display: 'block', marginBottom: '10px' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Contraseña de App</span>
                    <input type="text" value={editForm.password_app || ''} onChange={e => setEditForm({...editForm, password_app: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }} placeholder="Contraseña visible" />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '15px', background: 'var(--surface-color)', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                    <input type="checkbox" checked={editForm.is_active !== false} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                    <span style={{ fontSize: '14px', color: editForm.is_active !== false ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                      {editForm.is_active !== false ? '✅ Operador Activo (Con Acceso)' : '❌ Operador Suspendido/Baja (Sin Acceso)'}
                    </span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '2 1 400px' }}>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ color: '#60a5fa', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={18} /> Asignación Operativa</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <label style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Unidad (ECO)</span>
                      <input type="text" value={editForm.unidad_asignada || ''} onChange={e => setEditForm({...editForm, unidad_asignada: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px', fontWeight: 'bold' }} />
                    </label>
                    <label style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Estatus Operativo</span>
                      <select value={editForm.estatus || 'Activo'} onChange={e => setEditForm({...editForm, estatus: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }}>
                        <option value="Activo">Activo (Disponible)</option>
                        <option value="Descanso">En Descanso / Rola</option>
                        <option value="Permiso">Permiso / Incapacidad</option>
                        <option value="Inactivo">Inactivo / Baja</option>
                      </select>
                    </label>
                    <label style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Rol Preferido</span>
                      <select value={editForm.rol_preferido || 'Entre Semana'} onChange={e => setEditForm({...editForm, rol_preferido: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }}>
                        <option value="Entre Semana">Entre Semana</option>
                        <option value="Sabatino">Sabatino</option>
                        <option value="Dominical">Dominical / Festivo</option>
                        <option value="Rola Todos">Rola Todos los Turnos</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <h4 style={{ color: '#fbbf24', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={18} /> Licencia y Salud</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <label style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>No. Licencia</span>
                      <input type="text" value={editForm.licencia || ''} onChange={e => setEditForm({...editForm, licencia: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px', fontFamily: 'monospace' }} />
                    </label>
                    <label style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Vigencia</span>
                      <input type="date" value={editForm.vigencia_licencia || ''} onChange={e => setEditForm({...editForm, vigencia_licencia: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }} />
                    </label>
                    <label style={{ display: 'block' }}>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Tipo de Sangre</span>
                      <select value={editForm.tipo_sangre || 'O+'} onChange={e => setEditForm({...editForm, tipo_sangre: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px' }}>
                        <option value="O+">O+</option><option value="O-">O-</option>
                        <option value="A+">A+</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="AB+">AB+</option>
                      </select>
                    </label>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>Observaciones</span>
                    <textarea value={editForm.observaciones || ''} onChange={e => setEditForm({...editForm, observaciones: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--surface-color)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', borderRadius: '6px', minHeight: '80px', resize: 'vertical' }} />
                  </label>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
              <button onClick={handleCancel} style={{ background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleSave} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18} /> Guardar Expediente
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'perfiles' && (
          <div className="grid-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredOperadores.map(op => {
              const nombreCompleto = `${op.nombre || op.name || ''} ${op.apellidos || op.last_name || op.apellido || ''}`.trim();
              const estatus = op.estatus || op.status || 'Activo';
              return (
                <div key={op.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--bg-color)', border: '2px solid var(--primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {op.foto_url ? <img src={op.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{nombreCompleto[0]}</span>}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{nombreCompleto}</h3>
                        {op.apodo && <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--primary)', fontStyle: 'italic', fontWeight: 600 }}>"{op.apodo}"</p>}
                      </div>
                    </div>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => handleEdit(op)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit3 size={18} /></button>
                        <button onClick={() => handleDelete(op.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}><Truck size={14} color="#60a5fa" /> ECO: <strong style={{ color: 'var(--text-main)' }}>{op.unidad_asignada || 'N/A'}</strong></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}><Phone size={14} color="var(--primary)" /> {op.telefono || 'N/A'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}><Shield size={14} color="#fbbf24" /> Lic: <strong style={{ color: 'var(--text-main)' }}>{op.licencia || 'Pend.'}</strong></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}><Calendar size={14} color="#a78bfa" /> Rol: {op.rol_preferido}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {activeTab === 'directorio' && (
          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Operador</th>
                  <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Unidad</th>
                  <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Teléfono</th>
                  <th style={{ padding: '16px', color: 'var(--text-muted)' }}>Estatus</th>
                  {canEdit && <th style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredOperadores.map(op => (
                  <tr key={op.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '16px', color: 'var(--text-main)' }}>{op.nombre} {op.apellidos}</td>
                    <td style={{ padding: '16px', color: 'var(--text-main)' }}>{op.unidad_asignada || '---'}</td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{op.telefono || '---'}</td>
                    <td style={{ padding: '16px', color: op.estatus === 'Activo' ? '#10b981' : '#ef4444' }}>{op.estatus}</td>
                    {canEdit && (
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button onClick={() => handleEdit(op)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit3 size={18} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const RecursosHumanos = () => {
  const { canEdit } = useOutletContext<any>() || { canEdit: false };
  const [view, setView] = useState<'dashboard' | 'operadores'>('dashboard');

  if (view === 'dashboard') {
    return (
      <div className="animate-fade-in p-6 h-full flex flex-col">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 mb-2 tracking-tight">
            Módulo de Recursos Humanos
          </h1>
          <p className="text-slate-400 text-lg font-medium">Gestión integral de personal, expedientes y controles operativos de la ruta.</p>
        </div>

        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          <div 
            onClick={() => setView('operadores')}
            className="glass-card table-row-hover" 
            style={{ padding: '2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
          >
            <div style={{ background: 'var(--surface-color)', padding: '12px', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <Users size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontWeight: 'bold' }}>Expedientes de Operadores</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Perfiles, licencias, unidades asignadas, gafetes y bitácora de evaluación (Saturno V).
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <TabOperadores onBack={() => setView('dashboard')} canEdit={canEdit} />;
};
