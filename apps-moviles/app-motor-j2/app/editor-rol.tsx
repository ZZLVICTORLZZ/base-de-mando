import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Alert, LayoutAnimation, UIManager, Pressable, FlatList } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [activeRolId, setActiveRolId] = useState<string | null>((rId as string) || null);

  const toggleExpand = (id: string | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // Marcatextos
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const COLORS = ['#FF1493', '#00FFFF', '#39FF14', '#FFFF00', '#FF8C00'];

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

  useEffect(() => {
    if (isReadOnly || loading || rows.length === 0) return;
    const timer = setTimeout(async () => {
      await performAutoSave();
    }, 2500);
    return () => clearTimeout(timer);
  }, [rows]);

  const performAutoSave = async () => {
    if (isReadOnly || loading || rows.length === 0) return;
    try {
      let currentUser = await AsyncStorage.getItem('apolo11_user_name');
      if (!currentUser || currentUser.toLowerCase() === 'tablerista') {
        currentUser = 'Emiliano';
      }
      const targetId = activeRolId || (rId as string);
      if (targetId) {
        await supabase.from('roles_del_dia').update({ rows: rows }).eq('id', targetId);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else if (pId) {
        let fechaBd = fechaStr || new Date().toISOString().split('T')[0];
        if (fechaStr && typeof fechaStr === 'string' && fechaStr.includes('/')) {
          const parts = fechaStr.split('/');
          if (parts.length === 3) fechaBd = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        const newRol = {
          plantilla_base_id: pId,
          rows: rows,
          creado_por: `[ROL] ${currentUser}`,
          fecha: fechaBd
        };
        const { data: inserted, error } = await supabase.from('roles_del_dia').insert([newRol]).select('id').single();
        if (inserted && !error) {
          setActiveRolId(inserted.id);
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (e) {
      console.log('Error en autoguardado rol:', e);
    }
  };

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
    const prevFrec = lastRow ? lastRow.frec : '15';
    const newRow = {
      id: Date.now().toString(),
      no: (lastRow?.no || 0) + 1,
      frec: prevFrec,
      horario: '--:--', 
      eco: ''
    };
    setRows(calculateTimes([...rows, newRow], rows.length - 1, 'frec'));
  };

  const handleSaveRol = async () => {
    setSaving(true);
    let errorObj = null;
    const targetId = activeRolId || (rId as string);

    if (targetId) {
      // Estamos editando un rol existente
      const { error } = await supabase.from('roles_del_dia').update({ rows: rows }).eq('id', targetId);
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

  const getNextDayTitle = () => {
    let baseDate = new Date();
    if (fechaStr && typeof fechaStr === 'string') {
      if (fechaStr.includes('-')) {
        const parts = fechaStr.split('-');
        if (parts.length === 3) baseDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else if (fechaStr.includes('/')) {
        const parts = fechaStr.split('/');
        if (parts.length === 3) baseDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    const diaNombre = dias[nextDate.getDay()];
    const diaNum = nextDate.getDate();
    const mesNombre = meses[nextDate.getMonth()];
    const anio = nextDate.getFullYear();

    return `ROL DESPEGUE ${diaNombre.toUpperCase()} ${diaNum} DE ${mesNombre.toUpperCase()} ${anio}`;
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={[styles.container, isDarkMode && { backgroundColor: "#1A1A1A" }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#006847" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.title, isDarkMode && { color: "#F5F5DC" }]}>ROL - {plantillaName}</Text>
            {lastSavedTime ? <Text style={{ fontSize: 10, color: '#10b981', fontWeight: 'bold' }}>⚡ Guardado {lastSavedTime}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)}>
              <Feather name={isDarkMode ? 'sun' : 'moon'} size={24} color={isDarkMode ? '#F5F5DC' : '#006847'} />
            </TouchableOpacity>
            <View style={{ width: 10 }} />
          </View>
        </View>

        {!isExporting && (
          <View style={[styles.tableHeader, isDarkMode && { backgroundColor: '#333' }]}>
            <Text style={[styles.th, { flex: 0.4 }, isDarkMode && { color: '#F5F5DC' }]}>NO.</Text>
            <Text style={[styles.th, { flex: 0.9 }, isDarkMode && { color: '#F5F5DC' }]}>FREC.</Text>
            <Text style={[styles.th, { flex: 1.5 }, isDarkMode && { color: '#F5F5DC' }]}>HORARIO</Text>
            <Text style={[styles.th, { flex: 1.1, color: '#000000' }, isDarkMode && { color: '#F5F5DC' }]}>ECO</Text>
          </View>
        )}
        {isExporting ? (
          <ScrollView horizontal style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={undefined}>
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => toggleExpand(null)}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ width: 900, backgroundColor: '#FDF8ED', padding: 30 }}>
                      {/* Header de Exportación */}
                      <View style={{ flexDirection: 'column', borderBottomWidth: 2, borderColor: '#0033A0', paddingBottom: 15, marginBottom: 20 }}>
                        <Text style={{ color: '#0033A0', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 }}>
                          {getNextDayTitle()}
                        </Text>
                        <Text style={{ color: '#475569', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
                          PLANTILLA: {plantillaName ? plantillaName.toUpperCase() : 'ENTRE SEMANA'}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#000000', fontSize: 16, fontWeight: 'bold' }}>Elaboró: Emiliano</Text>
                          <Text style={{ color: '#4A4A4A', fontSize: 16, fontWeight: 'bold' }}>
                            Fecha elaboración: {new Date().toLocaleDateString('es-MX')}
                          </Text>
                        </View>
                      </View>

                      {/* 2 Columnas (Corte en Turno 25) */}
                      <View style={{ flexDirection: 'row', gap: 40 }}>
                        
                        {/* Columna Izquierda (1-25) */}
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', backgroundColor: '#88D8C0', borderBottomWidth: 2, borderColor: '#000000', paddingVertical: 8, marginBottom: 8 }}>
                            <Text style={{ flex: 0.5, color: '#000000', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>NO.</Text>
                            <Text style={{ flex: 1, color: '#000000', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>FREC.</Text>
                            <Text style={{ flex: 1.2, color: '#000000', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>HORARIO</Text>
                            <Text style={{ flex: 1.5, color: '#000000', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>ECO</Text>
                          </View>
                          {rows.slice(0, 25).map((row) => (
                            <View key={row.id} style={{ flexDirection: 'row', backgroundColor: row.highlightColor ? `${row.highlightColor}60` : 'transparent', borderBottomWidth: 1, borderColor: '#D9D2C2', paddingVertical: 10 }}>
                              <Text style={{ flex: 0.5, color: '#000000', fontWeight: 'bold', fontSize: 18, textAlign: 'center', borderRightWidth: 1, borderColor: '#D9D2C2' }}>{row.no}</Text>
                              <Text style={{ flex: 1, color: '#000080', fontSize: 18, textAlign: 'center', fontWeight: 'bold' }}>{row.frec}</Text>
                              <Text style={{ flex: 1.2, color: '#000080', fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>{row.horario}</Text>
                              <Text style={{ flex: 1.5, color: '#000000', fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>{row.eco || '-'}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Columna Derecha (26 en adelante) */}
                        {rows.length > 25 && (
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', backgroundColor: '#88D8C0', borderBottomWidth: 2, borderColor: '#000000', paddingVertical: 8, marginBottom: 8 }}>
                              <Text style={{ flex: 0.5, color: '#000000', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>NO.</Text>
                              <Text style={{ flex: 1, color: '#000000', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>FREC.</Text>
                              <Text style={{ flex: 1.2, color: '#000000', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>HORARIO</Text>
                              <Text style={{ flex: 1.5, color: '#000000', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>ECO</Text>
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
                </TouchableOpacity>
              </ViewShot>
            </ScrollView>
          </ScrollView>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.content, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F5DC' }]}
            onScrollBeginDrag={() => setExpandedRowId(null)}
            initialNumToRender={20}
            renderItem={({ item: row, index }) => {
              const renderRightActions = () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4, marginLeft: 6 }}>
                  <TouchableOpacity style={{ backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', width: 62, height: '90%', borderRadius: 8, marginRight: 6 }} onPress={() => handleInsertRow(index)}>
                    <Feather name="plus-circle" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>Insertar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', width: 62, height: '90%', borderRadius: 8 }} onPress={() => handleRemoveRow(row.id)}>
                    <Feather name="trash-2" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>Borrar</Text>
                  </TouchableOpacity>
                </View>
              );

              return (
                <Swipeable renderRightActions={!isReadOnly ? renderRightActions : undefined} friction={1} rightThreshold={15} overshootRight={true} overshootFriction={8}>
                  <TouchableOpacity activeOpacity={0.8}
                    onPress={() => {
                      if (activeColor) handleApplyColor(row.id);
                      toggleExpand(null);
                    }}
                    style={[
                      styles.tableRow, 
                      isDarkMode && { backgroundColor: '#222', borderBottomColor: '#333' },
                      row.highlightColor && { backgroundColor: `${row.highlightColor}40` }
                    ]}
                  >
                    <Text style={[styles.td, { flex: 0.4, fontWeight: 'bold' }, isDarkMode && { color: '#F5F5DC' }]}>{row.no}</Text>
                    
                    <View style={{ flex: 0.9, paddingHorizontal: 2 }}>
                      <TextInput 
                        style={[styles.inputCell, isDarkMode && { backgroundColor: '#333', borderColor: '#444', color: '#F5F5DC' }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                        value={row.frec}
                        onChangeText={(t) => handleUpdateField(row.id, 'frec', t)}
                        onFocus={() => toggleExpand(null)}
                        editable={!isReadOnly}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>

                    <View style={{ flex: 1.5, paddingHorizontal: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      {!isReadOnly && (
                        <TouchableOpacity onPress={() => handleAdjustTime(row.id, -1)} style={{ padding: 2 }}>
                          <Feather name="minus-circle" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                      <TextInput 
                        style={[styles.inputCell, { flex: 1, paddingHorizontal: 2 }, isDarkMode && { backgroundColor: '#333', borderColor: '#444', color: '#F5F5DC' }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                        value={row.horario}
                        onChangeText={(t) => handleUpdateField(row.id, 'horario', t)}
                        onFocus={() => toggleExpand(null)}
                        editable={!isReadOnly}
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                      {!isReadOnly && (
                        <TouchableOpacity onPress={() => handleAdjustTime(row.id, 1)} style={{ padding: 2 }}>
                          <Feather name="plus-circle" size={16} color="#10b981" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={{ flex: 1.1, paddingHorizontal: 2 }}>
                      <TouchableOpacity 
                        style={[styles.inputCell, { borderColor: '#94a3b8', justifyContent: 'center' }, isDarkMode && { backgroundColor: '#333', borderColor: '#444' }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                        onPress={() => handleOpenEcoSelector(row.id)}
                        disabled={isReadOnly}
                      >
                        <Text style={[{ color: '#000000', fontWeight: 'bold', textAlign: 'center' }, isDarkMode && { color: '#F5F5DC' }]}>
                          {row.eco || '---'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              );
            }}
            ListFooterComponent={() => (
              !isReadOnly && !isExporting ? (
                <TouchableOpacity style={styles.btnAddRow} onPress={handleAddRow}>
                  <Feather name="plus" size={20} color="#006847" />
                  <Text style={{ color: '#006847', marginLeft: 8, fontWeight: 'bold' }}>+ Agregar Turno al Final</Text>
                </TouchableOpacity>
              ) : null
            )}
          />
        )}

      {!isReadOnly && !isExporting && (
        <View style={styles.marcatextosContainer}>
          <TouchableOpacity 
            style={[styles.colorCircle, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#64748b', marginRight: 4 }, activeColor === null && styles.colorCircleActive]} 
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D2C2',
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5DC'
  },
  td: { color: '#000000', fontSize: 14, textAlign: 'center' },
  
  inputCell: {
    backgroundColor: '#EAE5CE', // Burbujas en contraste con Hueso
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#C8C0AD',
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#0f172a',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
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
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    gap: 15,
    borderRadius: 30,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#D9D2C2'
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
