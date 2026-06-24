import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Alert, LayoutAnimation, UIManager, Pressable } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { supabase } from '../src/services/supabaseClient';

export default function EditorRolScreen() {
  const { plantilla_id, rol_id, mode, fecha } = useLocalSearchParams();
  
  const pId = Array.isArray(plantilla_id) ? plantilla_id[0] : plantilla_id;
  const rId = Array.isArray(rol_id) ? rol_id[0] : rol_id;
  const fechaStr = Array.isArray(fecha) ? fecha[0] : fecha;

  const isReadOnly = mode === 'view';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plantillaName, setPlantillaName] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [ecoModalVisible, setEcoModalVisible] = useState(false);
  const [selectedRowIdForEco, setSelectedRowIdForEco] = useState<string | null>(null);
  const [searchEco, setSearchEco] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const toggleExpand = (id: string | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // Marcatextos
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const COLORS = ['#e3dac9', '#D2042D', '#00FFFF', '#10b981', '#eab308'];

  // Exportación
  const [isExporting, setIsExporting] = useState(false);
  const viewShotRef = React.useRef<any>(null);

  useEffect(() => {
    fetchUnidades();
    if (rId) {
      fetchRol();
    } else if (pId) {
      fetchPlantilla();
    }
  }, [pId, rId]);

  const fetchUnidades = async () => {
    // La columna del número económico se llama 'numero' y el estado 'activo'
    const { data } = await supabase.from('unidades').select('id, numero, tipo').eq('activo', true);
    if (data) setUnidades(data);
  };

  const fetchRol = async () => {
    const { data, error } = await supabase.from('roles_del_dia').select('*, plantillas_predeterminadas(name)').eq('id', rId).single();
    if (error || !data) {
      alert('Este rol ya no existe o fue eliminado.');
      router.back();
      return;
    }
    setPlantillaName(data.plantillas_predeterminadas?.name || 'Rol Sin Plantilla');
    setRows(data.rows || []);
    setLoading(false);
  };

  const fetchPlantilla = async () => {
    const { data, error } = await supabase.from('plantillas_predeterminadas').select('*').eq('id', pId).single();
    if (error || !data) {
      alert('La plantilla seleccionada ya no existe o fue eliminada por un administrador.');
      router.back();
      return;
    }
    setPlantillaName(data.name);
    setRows(data.rows || []);
    setLoading(false);
  };

  const calculateTimes = (currentRows: any[], startIndex: number, fieldChanged: 'frec' | 'horario') => {
    let newRows = [...currentRows];
    
    // Re-indexar los números de turno siempre
    newRows.forEach((r, idx) => {
      r.no = idx + 1;
    });

    if (fieldChanged === 'horario' && startIndex > 0) {
      const prevTime = newRows[startIndex - 1].horario;
      const newTime = newRows[startIndex].horario;
      
      if (prevTime && prevTime.includes(':') && newTime && newTime.includes(':')) {
        const [hPrev, mPrev] = prevTime.split(':').map(Number);
        const [hNew, mNew] = newTime.split(':').map(Number);
        
        if (!isNaN(hPrev) && !isNaN(hNew)) {
          let diff = (hNew * 60 + mNew) - (hPrev * 60 + mPrev);
          if (diff < 0) diff += 24 * 60;
          newRows[startIndex].frec = diff.toString();
        }
      }
    }

    const startIndexForCascade = fieldChanged === 'horario' ? startIndex + 1 : startIndex;
    
    for (let i = Math.max(1, startIndexForCascade); i < newRows.length; i++) {
      const prevTime = newRows[i - 1].horario;
      const currentFrec = parseInt(newRows[i].frec);
      
      if (prevTime && prevTime.includes(':') && !isNaN(currentFrec)) {
        const [hours, minutes] = prevTime.split(':').map(Number);
        const date = new Date(2000, 0, 1, hours, minutes);
        date.setMinutes(date.getMinutes() + currentFrec);
        
        const newHours = String(date.getHours()).padStart(2, '0');
        const newMinutes = String(date.getMinutes()).padStart(2, '0');
        newRows[i].horario = `${newHours}:${newMinutes}`;
      }
    }
    return newRows;
  };

  const handleUpdateECO = (id: string, text: string) => {
    if (isReadOnly) return;
    setRows(rows.map(r => r.id === id ? { ...r, eco: text } : r));
  };

  const handleUpdateField = (id: string, field: 'frec' | 'horario', text: string) => {
    if (isReadOnly) return;
    
    // Auto format time from 0530 to 05:30
    let formattedText = text;
    if (field === 'horario' && text.length === 4 && !text.includes(':')) {
      formattedText = `${text.substring(0, 2)}:${text.substring(2, 4)}`;
    }

    const rowIndex = rows.findIndex(r => r.id === id);
    const updatedRows = rows.map(r => r.id === id ? { ...r, [field]: formattedText } : r);
    setRows(calculateTimes(updatedRows, rowIndex, field));
  };

  const handleAdjustTime = (id: string, minutesToAdd: number) => {
    if (isReadOnly) return;
    const rowIndex = rows.findIndex(r => r.id === id);
    if (rowIndex === -1) return;
    const currentRow = rows[rowIndex];
    if (!currentRow.horario || !currentRow.horario.includes(':')) return;
    
    const [h, m] = currentRow.horario.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;
    
    const date = new Date(2000, 0, 1, h, m);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    
    const newH = String(date.getHours()).padStart(2, '0');
    const newM = String(date.getMinutes()).padStart(2, '0');
    
    handleUpdateField(id, 'horario', `${newH}:${newM}`);
  };

  const handleOpenEcoSelector = (rowId: string) => {
    if (isReadOnly) return;
    setSelectedRowIdForEco(rowId);
    setSearchEco('');
    setEcoModalVisible(true);
  };

  const handleSelectEco = (ecoNum: string) => {
    if (selectedRowIdForEco) {
      handleUpdateECO(selectedRowIdForEco, ecoNum);
    }
    setEcoModalVisible(false);
    setSelectedRowIdForEco(null);
  };

  const handleRemoveRow = (id: string) => {
    if (isReadOnly) return;
    Alert.alert('Confirmar', '¿Estás seguro de borrar este turno?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Borrar', 
        style: 'destructive',
        onPress: () => {
          const index = rows.findIndex(r => r.id === id);
          if (index === -1) return;
          const newRows = rows.filter(r => r.id !== id);
          setRows(calculateTimes(newRows, Math.max(0, index - 1), 'frec'));
        }
      }
    ]);
  };

  const handleApplyColor = (id: string) => {
    if (isReadOnly || !activeColor) return;
    if (activeColor === 'eraser') {
      setRows(rows.map(r => r.id === id ? { ...r, highlightColor: null } : r));
      return;
    }
    setRows(rows.map(r => r.id === id ? { ...r, highlightColor: r.highlightColor === activeColor ? null : activeColor } : r));
  };

  const handleInsertRow = (index: number) => {
    if (isReadOnly) return;
    const prevFrec = rows[index] ? rows[index].frec : '15';
    const newRow = {
      id: Date.now().toString(),
      no: 0,
      frec: prevFrec,
      horario: '--:--', 
      eco: ''
    };
    const newRows = [...rows];
    newRows.splice(index + 1, 0, newRow);
    setRows(calculateTimes(newRows, index, 'frec'));
  };

  const handleAddRow = () => {
    if (isReadOnly) return;
    const lastRow = rows[rows.length - 1];
    const newRow = {
      id: Date.now().toString(),
      no: (lastRow?.no || 0) + 1,
      frec: '15',
      horario: '--:--', 
      eco: ''
    };
    setRows(calculateTimes([...rows, newRow], rows.length, 'frec'));
  };

  const handleSaveRol = async () => {
    setSaving(true);
    let errorObj = null;

    if (rId) {
      // Estamos editando un rol existente
      const { error } = await supabase.from('roles_del_dia').update({ rows: rows }).eq('id', rId);
      errorObj = error;
    } else {
      let fechaBd = fechaStr || new Date().toISOString().split('T')[0];
      if (fechaStr && fechaStr.includes('/')) {
        const parts = fechaStr.split('/');
        if (parts.length === 3) {
           fechaBd = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const newRol = {
        plantilla_base_id: pId,
        rows: rows,
        creado_por: 'Tablerista (Motor J2)',
        fecha: fechaBd
      };
      const { error } = await supabase.from('roles_del_dia').insert([newRol]);
      errorObj = error;
    }

    setSaving(false);

    if (errorObj) {
      alert('Error al guardar el rol: ' + errorObj.message);
    } else {
      alert('¡Rol guardado con éxito!');
      router.replace('/(tabs)/rd');
    }
  };

  const exportToWhatsApp = async () => {
    setIsExporting(true);
    setTimeout(async () => {
      try {
        if (!viewShotRef.current) return;
        const uri = await viewShotRef.current.capture();
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, { dialogTitle: 'Compartir Rol del Día', mimeType: 'image/png' });
        } else {
          Alert.alert('Aviso', 'La función de compartir no está disponible en este dispositivo o simulador.');
        }
      } catch (e: any) {
        Alert.alert('Error', 'No se pudo generar la imagen del rol: ' + e.message);
      } finally {
        setIsExporting(false);
      }
    }, 300);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#94a3b8', marginTop: 10 }}>Descargando plantilla...</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.title}>Editando Rol: {plantillaName}</Text>
        <View style={{ width: 24 }} />
      </View>

      {!isReadOnly && !isExporting && (
        <View style={styles.marcatextosContainer}>
          <TouchableOpacity 
            style={[styles.colorCircle, { backgroundColor: '#F5F5DC', borderWidth: 1, borderColor: '#64748b' }, activeColor === 'eraser' && styles.colorCircleActive]} 
            onPress={() => setActiveColor('eraser')}
          >
            <Feather name="x" size={16} color="#ef4444" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.colorCircle, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#64748b', marginLeft: 5, marginRight: 10 }, activeColor === null && styles.colorCircleActive]} 
            onPress={() => setActiveColor(null)}
          >
            <Feather name="slash" size={16} color="#64748b" />
          </TouchableOpacity>
          {COLORS.map(c => (
            <TouchableOpacity 
              key={c}
              style={[styles.colorCircle, { backgroundColor: c }, activeColor === c && styles.colorCircleActive]}
              onPress={() => setActiveColor(c)}
            />
          ))}
        </View>
      )}

      {!isExporting && (
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 0.5 }]}>NO.</Text>
          <Text style={[styles.th, { flex: 1 }]}>FREC.</Text>
          <Text style={[styles.th, { flex: 1.6 }]}>HORARIO</Text>
          <Text style={[styles.th, { flex: 1.5, color: '#000000' }]}>ECO</Text>
          {!isReadOnly && <View style={{ width: 35 }} />}
        </View>
      )}

      <ScrollView horizontal={isExporting} style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={isExporting ? undefined : styles.content}
        onScrollBeginDrag={() => setExpandedRowId(null)}
      >
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => toggleExpand(null)}>
          {isExporting ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ width: 900, backgroundColor: '#F5F5DC', padding: 30 }}>
                {/* Header de Exportación */}
                <View style={{ flexDirection: 'column', borderBottomWidth: 1, borderColor: '#D9D2C2', paddingBottom: 15, marginBottom: 20 }}>
                  <Text style={{ color: '#000000', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
                    ROL DE DESPEGUE - {plantillaName?.toUpperCase()}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#000000', fontSize: 18, fontWeight: 'bold' }}>Elaboró: Tablerista en Turno</Text>
                    <Text style={{ color: '#4A4A4A', fontSize: 18, fontWeight: 'bold' }}>Fecha: {fecha || new Date().toLocaleDateString()}</Text>
                  </View>
                </View>

                {/* 2 Columnas (Corte en Turno 25) */}
                <View style={{ flexDirection: 'row', gap: 40 }}>
                  
                  {/* Columna Izquierda (1-25) */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#D9D2C2', paddingBottom: 8, marginBottom: 8 }}>
                      <Text style={{ flex: 0.5, color: '#000000', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>NO.</Text>
                      <Text style={{ flex: 1, color: '#000000', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>FREC.</Text>
                      <Text style={{ flex: 1.2, color: '#000000', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>HORARIO</Text>
                      <Text style={{ flex: 1.5, color: '#000000', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>ECO</Text>
                    </View>
                    {rows.slice(0, 25).map((row) => (
                      <View key={row.id} style={{ flexDirection: 'row', backgroundColor: row.highlightColor ? `${row.highlightColor}60` : 'transparent', borderBottomWidth: 1, borderColor: '#D9D2C2', paddingVertical: 10 }}>
                        <Text style={{ flex: 0.5, color: '#000000', fontWeight: 'bold', fontSize: 20, textAlign: 'center', borderRightWidth: 1, borderColor: '#D9D2C2' }}>{row.no}</Text>
                        <Text style={{ flex: 1, color: '#000080', fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>{row.frec}</Text>
                        <Text style={{ flex: 1.2, color: '#000080', fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>{row.horario}</Text>
                        <Text style={{ flex: 1.5, color: '#000000', fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>{row.eco || '-'}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Columna Derecha (26 en adelante) */}
                  {rows.length > 25 && (
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#D9D2C2', paddingBottom: 8, marginBottom: 8 }}>
                        <Text style={{ flex: 0.5, color: '#000000', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>NO.</Text>
                        <Text style={{ flex: 1, color: '#000000', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>FREC.</Text>
                        <Text style={{ flex: 1.2, color: '#000000', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>HORARIO</Text>
                        <Text style={{ flex: 1.5, color: '#000000', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>ECO</Text>
                      </View>
                      {rows.slice(25).map((row) => (
                        <View key={row.id} style={{ flexDirection: 'row', backgroundColor: row.highlightColor ? `${row.highlightColor}60` : 'transparent', borderBottomWidth: 1, borderColor: '#D9D2C2', paddingVertical: 10 }}>
                          <Text style={{ flex: 0.5, color: '#000000', fontWeight: 'bold', fontSize: 20, textAlign: 'center', borderRightWidth: 1, borderColor: '#D9D2C2' }}>{row.no}</Text>
                          <Text style={{ flex: 1, color: '#000080', fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>{row.frec}</Text>
                          <Text style={{ flex: 1.2, color: '#000080', fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>{row.horario}</Text>
                          <Text style={{ flex: 1.5, color: '#000000', fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>{row.eco || '-'}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={{ backgroundColor: '#F5F5DC' }}>
              {rows.map((row) => (
                <TouchableOpacity activeOpacity={0.8}
                  key={row.id} 
                  onPress={() => {
                    if (activeColor) handleApplyColor(row.id);
                    toggleExpand(null);
                  }}
                  style={[
                    styles.tableRow, 
                    row.highlightColor && { backgroundColor: `${row.highlightColor}33` }
                  ]}
                >
                  <Text style={[styles.td, { flex: 0.5, fontWeight: 'bold' }]}>{row.no}</Text>
                  
                  <View style={{ flex: 1, paddingHorizontal: 4 }}>
                    <TextInput 
                      style={[styles.inputCell, { color: '#000080', fontWeight: 'bold' }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                      value={row.frec}
                      onChangeText={(t) => handleUpdateField(row.id, 'frec', t)}
                      onFocus={() => toggleExpand(null)}
                      editable={!isReadOnly}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>

                  <View style={{ flex: 1.6, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    {!isReadOnly && (
                      <TouchableOpacity onPress={() => handleAdjustTime(row.id, -1)} style={{ padding: 4 }}>
                        <Feather name="minus-circle" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                    <TextInput 
                      style={[styles.inputCell, { flex: 1, color: '#000080', fontWeight: 'bold', paddingHorizontal: 2 }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                      value={row.horario}
                      onChangeText={(t) => handleUpdateField(row.id, 'horario', t)}
                      onFocus={() => toggleExpand(null)}
                      editable={!isReadOnly}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                    {!isReadOnly && (
                      <TouchableOpacity onPress={() => handleAdjustTime(row.id, 1)} style={{ padding: 4 }}>
                        <Feather name="plus-circle" size={18} color="#10b981" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={{ flex: 1.5, paddingHorizontal: 4 }}>
                    <TouchableOpacity 
                      style={[styles.inputCell, { borderColor: '#94a3b8', justifyContent: 'center' }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                      onPress={() => handleOpenEcoSelector(row.id)}
                      disabled={isReadOnly}
                    >
                      <Text style={{ color: '#000000', fontWeight: 'bold', textAlign: 'center' }}>
                        {row.eco || '---'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {!isReadOnly && (
                    <View style={{ width: expandedRowId === row.id ? 80 : 35, alignItems: 'center', justifyContent: 'center' }}>
                      {expandedRowId === row.id ? (
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                          <TouchableOpacity onPress={() => { handleInsertRow(rows.findIndex(r => r.id === row.id)); toggleExpand(null); }}>
                            <Feather name="plus-circle" size={24} color="#10b981" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => { handleRemoveRow(row.id); toggleExpand(null); }}>
                            <Feather name="trash-2" size={24} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={{ flexDirection: 'row', gap: 3, paddingVertical: 10, paddingHorizontal: 5 }} 
                          onPress={() => toggleExpand(row.id)}
                        >
                          <View style={{ width: 4, height: 18, backgroundColor: '#10b981', borderRadius: 2 }} />
                          <View style={{ width: 4, height: 18, backgroundColor: '#ef4444', borderRadius: 2 }} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {!isReadOnly && !isExporting && (
                <TouchableOpacity style={styles.btnAddRow} onPress={handleAddRow}>
                  <Feather name="plus" size={20} color="#3b82f6" />
                  <Text style={{ color: '#3b82f6', marginLeft: 8, fontWeight: 'bold' }}>Agregar Turno al Final</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          </TouchableOpacity>
        </ViewShot>
      </ScrollView>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnShare} onPress={exportToWhatsApp}>
          <Feather name="share-2" size={20} color="#fff" />
          <Text style={styles.btnGuardarText}>Compartir</Text>
        </TouchableOpacity>
        {!isReadOnly && (
          <TouchableOpacity style={[styles.btnGuardar, saving && { opacity: 0.7 }]} onPress={handleSaveRol} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="save" size={20} color="#fff" />}
            <Text style={styles.btnGuardarText}>{saving ? 'Guardando...' : 'Guardar Oficial'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selector de Unidades (ECO Modal) */}
      <Modal visible={ecoModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEcoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Unidad (ECO)</Text>
              <TouchableOpacity onPress={() => setEcoModalVisible(false)}>
                <Feather name="x" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            {(() => {
              const assignedEcos = rows.map(r => String(r.eco)).filter(Boolean);
              const availableUnidades = unidades
                .filter(u => u && u.numero && !assignedEcos.includes(String(u.numero)))
                .filter(u => String(u.numero).toLowerCase().includes((searchEco || '').toLowerCase()))
                .sort((a, b) => parseInt(String(a.numero)) - parseInt(String(b.numero)));
                
              const autobuses = availableUnidades.filter(u => u.tipo?.toLowerCase() === 'autobús' || u.tipo?.toLowerCase() === 'autobus');
              const otrasUnidades = availableUnidades.filter(u => u.tipo?.toLowerCase() !== 'autobús' && u.tipo?.toLowerCase() !== 'autobus');

              return (
                <>
                  <TextInput
                    style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 10, fontSize: 16 }}
                    placeholder="Buscar económico..."
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    value={searchEco}
                    onChangeText={setSearchEco}
                  />
                  <ScrollView style={{ marginTop: 10, marginBottom: 15 }}>
                  {unidades.length === 0 ? (
                    <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>No hay unidades activas en la Base de Mando.</Text>
                  ) : (
                    <>
                      {autobuses.length > 0 && (
                        <View style={{ marginBottom: 20 }}>
                          <Text style={{ color: '#10b981', fontWeight: 'bold', marginBottom: 10, fontSize: 16 }}>Autobuses Disponibles</Text>
                          {autobuses.map(item => (
                            <TouchableOpacity key={item.id} style={styles.ecoItem} onPress={() => handleSelectEco(item.numero)}>
                              <Text style={styles.ecoItemText}>{item.numero}</Text>
                              <Text style={styles.ecoItemSubtext}>{item.tipo || 'Vehículo'}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      {otrasUnidades.length > 0 && (
                        <View>
                          <Text style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: 10, fontSize: 16 }}>Vagonetas y Otras Unidades</Text>
                          {otrasUnidades.map(item => (
                            <TouchableOpacity key={item.id} style={styles.ecoItem} onPress={() => handleSelectEco(item.numero)}>
                              <Text style={styles.ecoItemText}>{item.numero}</Text>
                              <Text style={styles.ecoItemSubtext}>{item.tipo || 'Vehículo'}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      {autobuses.length === 0 && otrasUnidades.length === 0 && (
                        <Text style={{ color: '#ef4444', textAlign: 'center', marginTop: 20 }}>Todos los vehículos ya han sido asignados a este rol.</Text>
                      )}
                    </>
                  )}
                </ScrollView>
                </>
              );
            })()}
            
            <TouchableOpacity style={styles.ecoItemClear} onPress={() => handleSelectEco('')}>
              <Text style={{ color: '#ef4444', textAlign: 'center', fontWeight: 'bold' }}>Quitar ECO (Dejar vacío)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D2C2'
  },
  backBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '600', color: '#000000' },
  
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#F5F5DC',
    borderBottomWidth: 1,
    borderBottomColor: '#D9D2C2'
  },
  th: { color: '#4A4A4A', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  
  content: { padding: 10, paddingBottom: 40 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#ffffff'
  },
  td: { color: '#000000', fontSize: 14, textAlign: 'center' },
  
  inputCell: {
    backgroundColor: '#EAE5CE', // Burbujas color hueso
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9D2C2',
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#0f172a',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  fab: { paddingVertical: 6,
    fontSize: 14
  },

  btnAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D9D2C2',
    borderStyle: 'dashed',
    borderRadius: 8
  },

  footer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#D9D2C2',
    backgroundColor: '#F5F5DC',
    gap: 15
  },
  btnShare: {
    flex: 1,
    backgroundColor: '#006847',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  btnGuardar: {
    flex: 2,
    backgroundColor: '#006847',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12
  },
  btnGuardarText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  
  marcatextosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F5F5DC',
    gap: 10
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#000000',
    transform: [{ scale: 1.2 }]
  },

  // Modal Selector
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5F5DC', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#D9D2C2', paddingBottom: 15 },
  modalTitle: { color: '#000000', fontSize: 18, fontWeight: 'bold' },
  ecoItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#D9D2C2', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ecoItemText: { color: '#006847', fontSize: 18, fontWeight: 'bold' },
  ecoItemSubtext: { color: '#4A4A4A', fontSize: 14 },
  ecoItemClear: { padding: 15, marginTop: 10, backgroundColor: '#FFD1D1', borderRadius: 8, borderWidth: 1, borderColor: '#D2042D' }
});
