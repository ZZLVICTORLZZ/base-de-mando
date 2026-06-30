import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Alert, LayoutAnimation, UIManager, Pressable, FlatList } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { supabase } from '../src/services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FrecModal = ({ visible, onClose, initialFrec, onSave }: any) => {
  const [val, setVal] = useState('');
  const [isCascada, setIsCascada] = useState(false);
  const [isSF, setIsSF] = useState(false);

  useEffect(() => {
    if (visible) {
      setVal(initialFrec === 'S.F.' || initialFrec === 'I.F.' ? '' : (initialFrec ? String(initialFrec) : ''));
      setIsSF(initialFrec === 'S.F.');
      setIsCascada(false);
    }
  }, [visible, initialFrec]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configurar Frecuencia</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          
          <TextInput 
            style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#D9D2C2', borderRadius: 12, color: '#000000', padding: 18, fontSize: 24, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' }}
            value={val}
            onChangeText={setVal}
            keyboardType="number-pad"
            placeholder="Ej. 15"
            placeholderTextColor="#94a3b8"
            editable={!isSF}
          />

          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }} onPress={() => { setIsCascada(!isCascada); setIsSF(false); }}>
            <View style={{ width: 24, height: 24, borderWidth: 2, borderColor: isCascada ? '#006847' : '#94a3b8', borderRadius: 6, marginRight: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: isCascada ? '#006847' : 'transparent' }}>
              {isCascada && <Feather name="check" size={16} color="#fff" />}
            </View>
            <Text style={{ color: '#000000', fontSize: 16 }}>Aplicar en Cascada a las demás</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }} onPress={() => { setIsSF(!isSF); setIsCascada(false); }}>
            <View style={{ width: 24, height: 24, borderWidth: 2, borderColor: isSF ? '#D2042D' : '#94a3b8', borderRadius: 6, marginRight: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: isSF ? '#D2042D' : 'transparent' }}>
              {isSF && <Feather name="check" size={16} color="#fff" />}
            </View>
            <Text style={{ color: '#000000', fontSize: 16 }}>S.F. (Sin Frecuencia - Aislada)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#006847', padding: 18, borderRadius: 12 }} onPress={() => onSave(val, isSF, isCascada)}>
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Aceptar y Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function EditorOTPScreen() {
  const { source_rol_id, rol_id, mode, base_chequeo } = useLocalSearchParams();
  const isReadOnly = mode === 'view';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plantillaName, setPlantillaName] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [frecModalVisible, setFrecModalVisible] = useState(false);
  const [selectedRowIdForFrec, setSelectedRowIdForFrec] = useState<string | null>(null);
  const [initialFrecForModal, setInitialFrecForModal] = useState('');
  
  const [obsModalVisible, setObsModalVisible] = useState(false);
  const [selectedRowIdForObs, setSelectedRowIdForObs] = useState<string | null>(null);
  const [obsInputValue, setObsInputValue] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  // Novedades: Modo Oscuro, Foco y Toasts
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchEco, setSearchEco] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };


  const toggleExpand = (id: string | null) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const isIndios = plantillaName.toLowerCase().includes('indios');
  const isLagos = plantillaName.toLowerCase().includes('lagos');
  
  // Marcatextos
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const COLORS = ['#FF1493', '#00FFFF', '#39FF14', '#FFFF00', '#FF8C00'];
  const [creadorName, setCreadorName] = useState<string>('');

  // Exportación
  const [isExporting, setIsExporting] = useState(false);
  const viewShotRef = React.useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      const loadedUnidades = await fetchUnidades();
      if (rol_id) {
        // Viendo o editando un OTP existente
        await fetchRol();
      } else if (source_rol_id) {
        // Creando uno nuevo basado en un Rol Oficial
        await fetchSourceRol(loadedUnidades);
      }
    };
    init();
  }, [source_rol_id, rol_id]);

  const fetchUnidades = async () => {
    const { data } = await supabase.from('unidades').select('id, numero, tipo').eq('activo', true);
    if (data) {
      return data;
    }
    return [];
  };

  const fetchRol = async () => {
    const { data, error } = await supabase.from('roles_del_dia').select('*, plantillas_predeterminadas(name)').eq('id', rol_id).single();
    if (error || !data) {
      alert('Esta proyección ya no existe o fue eliminada.');
      router.back();
      return;
    }
    const savedName = data.creado_por?.includes('|') ? data.creado_por.split('|')[1].trim() : '';
    // Preferir savedName para que mantenga el formato de la base de chequeo (Ej: Indios Verdes en lugar de Sabatino)
    setPlantillaName(savedName || data.plantillas_predeterminadas?.name || 'Proyección Sin Nombre');
    setCreadorName(data.creado_por?.split('|')[0].trim() || '');
    setRows(data.rows || []);
    setLoading(false);
  };

  const fetchSourceRol = async (loadedUnidades: any[]) => {
    const { data, error } = await supabase.from('roles_del_dia').select('*, plantillas_predeterminadas(name)').eq('id', source_rol_id).single();
    if (error || !data) {
      alert('El rol oficial origen ya no existe.');
      router.back();
      return;
    }
    
    const baseName = data.plantillas_predeterminadas?.name || '';
    // Usar la base_chequeo si existe (para nueva proyeccion), de lo contrario la baseName original
    const effectiveBase = base_chequeo ? (base_chequeo as string) : baseName;
    setPlantillaName(effectiveBase);
    const currentUser = await AsyncStorage.getItem('apolo11_user_name') || 'Tablerista';
    setCreadorName(`[OTP] ${currentUser}`);
    
    let processedRows = data.rows || [];
    
    if (effectiveBase.toLowerCase().includes('indios')) {
      // Indios Verdes: Filtrar autobuses, usar todas las demás, iniciando 05:30, frec 20 min
      processedRows = processedRows.filter((r: any) => {
        if (!r.eco) return true; // Si no tiene eco, lo dejamos
        const u = loadedUnidades.find(un => String(un.numero) === String(r.eco));
        const tipo = u?.tipo?.toLowerCase().trim() || '';
        // Usar igualación estricta para evitar borrar Sprinters si su nombre incluye 'autobus'
        if (tipo === 'autobus' || tipo === 'autobús') {
          return false;
        }
        return true;
      });

      processedRows = processedRows.map((r: any, i: number) => {
        const totalMins = 330 + (i * 20); // 330 mins = 05:30
        const h = Math.floor(totalMins / 60) % 24;
        const min = totalMins % 60;
        return { 
          ...r, 
          horario: `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`, 
          frec: '20', 
          ruta: '' 
        };
      });
    } else if (effectiveBase.toLowerCase().includes('lagos')) {
      // Lagos 2: +20 mins de tiempo
      processedRows = processedRows.map((r: any) => {
        let newTime = r.horario;
        if (r.horario && r.horario.includes(':')) {
          const [h, m] = r.horario.split(':').map(Number);
          if (!isNaN(h) && !isNaN(m)) {
            const date = new Date(2000, 0, 1, h, m);
            date.setMinutes(date.getMinutes() + 20);
            const newH = String(date.getHours()).padStart(2, '0');
            const newM = String(date.getMinutes()).padStart(2, '0');
            newTime = `${newH}:${newM}`;
          }
        }
        return { ...r, horario: newTime, ruta: '' };
      });
    } else {
      // Nuevos Paseos y otros: Carga exactamente igual
      processedRows = processedRows.map((r: any) => ({ ...r, ruta: '' }));
    }

    // Re-indexar y limpiar
    processedRows.forEach((r: any, idx: number) => {
      r.no = idx + 1;
      if (!r.ruta) r.ruta = 'MEX';
      if (r.observaciones === undefined) r.observaciones = '';
      if (r.pax === undefined) r.pax = '';
      
      // Solo borrar marcatextos si la base es Indios Verdes
      if (effectiveBase.toLowerCase().includes('indios')) {
        r.highlightColor = null; 
      }
    });

    if (processedRows.length > 0) {
      processedRows[0].frec = 'I.F.';
    }

    setRows(processedRows);
    setLoading(false);
  };

  const getValidPrevTime = (currentRows: any[], currentIndex: number) => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (currentRows[i].frec !== 'S.F.') return currentRows[i].horario;
    }
    return null;
  };

  const calculateTimes = (currentRows: any[], startIndex: number, fieldChanged: 'frec' | 'horario', cascadeFrecValue?: string) => {
    let newRows = [...currentRows];
    newRows.forEach((r, idx) => r.no = idx + 1);

    if (cascadeFrecValue) {
      for (let i = startIndex; i < newRows.length; i++) {
        newRows[i].frec = cascadeFrecValue;
      }
    }

    if (newRows.length > 0) newRows[0].frec = 'I.F.';

    if (fieldChanged === 'horario' && startIndex > 0) {
      const prevTime = getValidPrevTime(newRows, startIndex);
      const newTime = newRows[startIndex].horario;
      
      if (newRows[startIndex].frec !== 'S.F.' && prevTime && prevTime.includes(':') && newTime && newTime.includes(':')) {
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
      if (newRows[i].frec === 'S.F.' || newRows[i].frec === 'I.F.') continue;
      
      const prevTime = getValidPrevTime(newRows, i);
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

  const handleToggleRuta = (id: string) => {
    if (isReadOnly) return;
    setRows(rows.map(r => {
      if (r.id === id) {
        if (r.ruta === 'MEX') return { ...r, ruta: 'REY' };
        return { ...r, ruta: 'MEX' };
      }
      return r;
    }));
  };

  const handleOpenFrecSelector = (rowId: string, currentFrec: string) => {
    if (isReadOnly) return;
    setSelectedRowIdForFrec(rowId);
    setInitialFrecForModal(currentFrec);
    setFrecModalVisible(true);
  };

  const handleApplyFrecConfirm = (val: string, isSF: boolean, isCascada: boolean) => {
    if (!selectedRowIdForFrec) return;
    const rowIndex = rows.findIndex(r => r.id === selectedRowIdForFrec);
    if (rowIndex === -1) return;

    let updatedRows = [...rows];
    let newFrec = val || '15';

    if (isSF) {
      updatedRows[rowIndex].frec = 'S.F.';
      setRows(calculateTimes(updatedRows, rowIndex, 'frec'));
    } else if (isCascada) {
      updatedRows[rowIndex].frec = newFrec;
      setRows(calculateTimes(updatedRows, rowIndex, 'frec', newFrec));
    } else {
      updatedRows[rowIndex].frec = newFrec;
      setRows(calculateTimes(updatedRows, rowIndex, 'frec'));
    }

    setFrecModalVisible(false);
    setSelectedRowIdForFrec(null);
  };

  const handleOpenObsModal = (rowId: string, currentObs: string) => {
    if (isReadOnly) return;
    setSelectedRowIdForObs(rowId);
    setObsInputValue(currentObs || '');
    setObsModalVisible(true);
  };

  const handleSaveObs = () => {
    if (selectedRowIdForObs) {
      handleUpdateField(selectedRowIdForObs, 'observaciones', obsInputValue);
    }
    setObsModalVisible(false);
    setSelectedRowIdForObs(null);
  };

  const handleUpdateField = (id: string, field: 'frec' | 'horario' | 'eco' | 'ruta' | 'observaciones' | 'pax', text: string) => {
    if (isReadOnly) return;
    let formattedText = text;
    if (field === 'horario' && text.length === 4 && !text.includes(':')) {
      formattedText = `${text.substring(0, 2)}:${text.substring(2, 4)}`;
    }
    if (field === 'eco' || field === 'pax') {
      formattedText = text.replace(/[^0-9]/g, '');
    }
    const rowIndex = rows.findIndex(r => r.id === id);
    const updatedRows = rows.map(r => r.id === id ? { ...r, [field]: formattedText } : r);
    setRows(calculateTimes(updatedRows, rowIndex, field as 'frec' | 'horario'));
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

  const handleRemoveRow = (id: string) => {
    if (isReadOnly) return;
    Alert.alert('Eliminar Turno', '¿Seguro que quieres eliminar este turno?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
          const index = rows.findIndex(r => r.id === id);
          if (index === -1) return;
          const newRows = rows.filter(r => r.id !== id);
          setRows(calculateTimes(newRows, Math.max(0, index - 1), 'frec'));
          showToast('Turno Eliminado');
      }}
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
    const newRow = { id: Date.now().toString(), no: 0, frec: prevFrec, horario: '--:--', eco: '', ruta: 'MEX', observaciones: '', pax: '' };
    const newRows = [...rows];
    newRows.splice(index + 1, 0, newRow);
    setRows(calculateTimes(newRows, index, 'frec'));
    showToast('Turno Agregado');
  };

  const handleDuplicateRound = () => {
    if (isReadOnly) return;
    const currentRows = [...rows];
    if (currentRows.length === 0) return;
    
    // Identificar el inicio de la última vuelta (recorriendo de abajo hacia arriba hasta encontrar un ECO repetido)
    let seenEcos = new Set();
    let startCloneIndex = 0;

    for (let i = currentRows.length - 1; i >= 0; i--) {
      const r = currentRows[i];
      const ecoStr = (r.eco || '').trim();
      
      if (ecoStr) {
        // Ignoramos autobuses (highlightColor) y S.F. para la detección de la vuelta
        const isAutobus = !!r.highlightColor;
        const isSF = r.frec?.toUpperCase() === 'S.F.';
        
        if (!isAutobus && !isSF) {
          if (seenEcos.has(ecoStr)) {
            // Ya vimos este ECO, significa que aquí empieza la vuelta anterior
            startCloneIndex = i + 1;
            break;
          }
          seenEcos.add(ecoStr);
        }
      }
    }

    let rowsToClone = currentRows.slice(startCloneIndex);

    // Filtrar autobuses (marcatextos) y unidades con S.F. al momento de clonar
    rowsToClone = rowsToClone.filter(r => !r.highlightColor && r.frec?.toUpperCase() !== 'S.F.');
    
    if (rowsToClone.length === 0) {
      Alert.alert('Aviso', 'No hay unidades válidas en la última vuelta para duplicar (todas son autobuses o S.F.).');
      return;
    }

    // Determinar el número de vuelta basado en las apariciones del primer ECO clonado en el historial completo
    let roundNumber = 2;
    const firstEcoToClone = rowsToClone.find(r => (r.eco || '').trim())?.eco;
    if (firstEcoToClone) {
      const appearances = currentRows.filter(r => r.eco === firstEcoToClone).length;
      roundNumber = appearances + 1;
    }

    const lastRoundFrec = currentRows[currentRows.length - 1].frec;

    const newRows = rowsToClone.map((r, index) => {
      const isStartOfRound = (index === 0);
      return {
        ...r,
        id: Date.now().toString() + index,
        no: currentRows.length + index + 1,
        frec: lastRoundFrec,
        horario: '--:--',
        observaciones: isStartOfRound ? `Vuelta ${roundNumber}` : '',
        pax: '',
        highlightColor: null
      };
    });

    const combinedRows = [...currentRows, ...newRows];
    setRows(calculateTimes(combinedRows, currentRows.length - 1, 'frec'));
  };

  const handleAddRow = () => {
    if (isReadOnly) return;
    const lastRow = rows[rows.length - 1];
    const prevFrec = lastRow ? lastRow.frec : '15';
    const newRow = { id: Date.now().toString(), no: (lastRow?.no || 0) + 1, frec: prevFrec, horario: '--:--', eco: '', ruta: 'MEX', observaciones: '', pax: '' };
    setRows(calculateTimes([...rows, newRow], rows.length - 1, 'frec'));
  };

  const handleSaveOTP = async () => {
    setSaving(true);
    let errorObj = null;

    if (rol_id) {
      // Editando OTP existente
      const { error } = await supabase.from('roles_del_dia').update({ rows: rows }).eq('id', rol_id);
      errorObj = error;
    } else {
      // Creando nuevo OTP
      const { data: sourceData } = await supabase.from('roles_del_dia').select('plantilla_base_id').eq('id', source_rol_id).single();
      const currentUser = await AsyncStorage.getItem('apolo11_user_name') || 'Tablerista';
      
      let finalPlantillaId = sourceData?.plantilla_base_id || null;
      if (base_chequeo) {
        // Buscar si existe una plantilla base con el nombre de la base de chequeo
        const { data: bData } = await supabase.from('plantillas_predeterminadas').select('id').ilike('name', `%${base_chequeo}%`).limit(1).single();
        if (bData) {
          finalPlantillaId = bData.id;
        }
      }

      const newOTP = {
        fecha: new Date().toISOString().split('T')[0],
        plantilla_base_id: finalPlantillaId,
        creado_por: `[OTP] ${currentUser} | ${plantillaName}`, // Guardar nombre para que isIndios funcione
        rows: rows
      };

      const { error } = await supabase.from('roles_del_dia').insert([newOTP]);
      errorObj = error;
    }

    setSaving(false);
    if (errorObj) {
      alert('Error al guardar: ' + errorObj.message);
    } else {
      router.replace('/(tabs)/otp');
    }
  };

  const exportToWhatsApp = async () => {
    setIsExporting(true);
    setTimeout(async () => {
      if (!viewShotRef.current) {
        setIsExporting(false);
        return;
      }
      try {
        const uri = await viewShotRef.current.capture();
        setIsExporting(false);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir Proyección OTP', UTI: 'public.png' });
        }
      } catch (error) {
        setIsExporting(false);
        alert('No se pudo generar la imagen.');
      }
    }, 400);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={[styles.container, isDarkMode && { backgroundColor: "#1A1A1A" }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#006847" />
          </TouchableOpacity>
          <Text style={[styles.title, isDarkMode && { color: "#F5F5DC" }]}>OTP - {plantillaName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)}>
              <Feather name={isDarkMode ? 'sun' : 'moon'} size={24} color={isDarkMode ? '#F5F5DC' : '#006847'} />
            </TouchableOpacity>
            <View style={{ width: 10 }} />
          </View>
        </View>

        {!isExporting && (
          <View style={{ paddingHorizontal: 15, paddingTop: 10, paddingBottom: 5 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', flex: 1, backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: '#D9D2C2', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}>
                <Feather name="search" size={20} color="#94a3b8" />
                <TextInput 
                  style={{ flex: 1, marginLeft: 10, fontSize: 14, color: '#000000' }}
                  placeholder="Buscar ECO (Modo Foco)"
                  placeholderTextColor="#94a3b8"
                  value={searchEco}
                  onChangeText={setSearchEco}
                  keyboardType="number-pad"
                />
                {searchEco.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchEco('')}>
                    <Feather name="x-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={{ backgroundColor: '#006847', borderRadius: 8, padding: 8, flexDirection: 'row', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: '#88D8C0', fontSize: 9, fontWeight: 'bold' }}>FREC. PROM.</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>
                  {rows.length > 0 ? Math.round(rows.reduce((acc, r) => acc + (parseInt(r.frec) || 15), 0) / rows.length) + ' min' : '--'}
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#88D8C0', opacity: 0.5 }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: '#88D8C0', fontSize: 9, fontWeight: 'bold' }}>T. AUTOBUSES</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>
                  {new Set(rows.filter(r => r.eco && r.highlightColor).map(r => r.eco)).size} / {new Set(rows.filter(r => r.eco).map(r => r.eco)).size}
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#88D8C0', opacity: 0.5 }} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: '#88D8C0', fontSize: 9, fontWeight: 'bold' }}>TÉRMINO</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>
                  {rows.length > 0 ? rows[rows.length - 1].horario || '--:--' : '--:--'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {!isExporting && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#333' : '#D9D2C2' }}>
            <View style={{ flex: 0.4 }}><Text style={[styles.th, {fontSize: 11}, isDarkMode && {color: '#888'}]}>NO.</Text></View>
            <View style={{ flex: 0.7, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11}]}>FREC</Text></View>
            <View style={{ flex: 1.4, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11}]}>HORA</Text></View>
            <View style={{ flex: 1, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11, color: '#000000'}]}>ECO</Text></View>
            {!isIndios && <View style={{ flex: 0.7, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11}]}>RUTA</Text></View>}
            {(isIndios || isLagos) && <View style={{ flex: 0.6, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11}]}>PAX</Text></View>}
            <View style={{ flex: 0.5, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11}]}>OBS</Text></View>
            {!isReadOnly && <View style={{ width: 30 }} />}
          </View>
        )}

        
        {isExporting ? (
          <ScrollView horizontal style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={undefined} onScrollBeginDrag={() => setExpandedRowId(null)}>
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => toggleExpand(null)}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ width: 900, backgroundColor: '#FDF8ED', padding: 30 }}>
                    {/* Header de Exportación OTP */}
                    <View style={{ flexDirection: 'column', borderBottomWidth: 2, borderColor: '#0033A0', paddingBottom: 15, marginBottom: 20 }}>
                      <Text style={{ color: '#0033A0', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
                        PROYECCIÓN OTP - {plantillaName?.toUpperCase()}
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#000000', fontSize: 16, fontWeight: 'bold' }}>Sistema Saturno V | Elaboró: {creadorName.replace('[OTP] ', '')}</Text>
                        <Text style={{ color: '#0033A0', fontSize: 16, fontWeight: 'bold' }}>Fecha: {new Date().toLocaleDateString()}</Text>
                      </View>
                    </View>

                    {/* Tabla de Exportación 2 Columnas */}
                    <View style={{ flexDirection: 'row', gap: 40 }}>
                      
                      {/* Columna Izquierda */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', backgroundColor: '#88D8C0', borderBottomWidth: 2, borderColor: '#000000', paddingVertical: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                          <Text style={{ flex: 0.4, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>NO.</Text>
                          <Text style={{ flex: 0.6, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>FREC</Text>
                          <Text style={{ flex: 1, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>HORA</Text>
                          <Text style={{ flex: 1, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>ECO</Text>
                          {!isIndios && <Text style={{ flex: 0.6, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>RUTA</Text>}
                          {(isIndios || isLagos) && <Text style={{ flex: 0.5, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>PAX</Text>}
                          <Text style={{ flex: 2.2, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>OBS</Text>
                        </View>
                        {rows.slice(0, Math.ceil(rows.length / 2)).map((row) => (
                          <View key={row.id} style={{ flexDirection: 'row', backgroundColor: row.highlightColor ? `${row.highlightColor}60` : 'transparent', borderBottomWidth: 1, borderColor: '#0033A0', paddingVertical: 10, alignItems: 'center' }}>
                            <Text style={{ flex: 0.4, color: '#000000', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>{row.no}</Text>
                            <Text style={{ flex: 0.6, color: '#000080', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.frec}</Text>
                            <Text style={{ flex: 1, color: '#000080', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.horario}</Text>
                            <Text style={{ flex: 1, color: '#000000', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.eco || '-'}</Text>
                            {!isIndios && <Text style={{ flex: 0.6, color: row.ruta === 'MEX' ? '#008000' : row.ruta === 'REY' ? '#D22B2B' : '#4B0082', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.ruta || '-'}</Text>}
                            {(isIndios || isLagos) && <Text style={{ flex: 0.5, color: '#000000', fontSize: 13, textAlign: 'center' }}>{row.pax || '-'}</Text>}
                            <Text style={{ flex: 2.2, color: '#000000', fontSize: 11, textAlign: 'center', paddingHorizontal: 2, flexShrink: 1, flexWrap: 'wrap' }}>{row.observaciones || ''}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Columna Derecha */}
                      {rows.length > 1 && (
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', backgroundColor: '#88D8C0', borderBottomWidth: 2, borderColor: '#000000', paddingVertical: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                            <Text style={{ flex: 0.4, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>NO.</Text>
                            <Text style={{ flex: 0.6, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>FREC</Text>
                            <Text style={{ flex: 1, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>HORA</Text>
                            <Text style={{ flex: 1, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>ECO</Text>
                            {!isIndios && <Text style={{ flex: 0.6, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>RUTA</Text>}
                            {(isIndios || isLagos) && <Text style={{ flex: 0.5, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>PAX</Text>}
                            <Text style={{ flex: 2.2, color: '#000000', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>OBS</Text>
                          </View>
                          {rows.slice(Math.ceil(rows.length / 2)).map((row) => (
                            <View key={row.id} style={{ flexDirection: 'row', backgroundColor: row.highlightColor ? `${row.highlightColor}60` : 'transparent', borderBottomWidth: 1, borderColor: '#0033A0', paddingVertical: 10, alignItems: 'center' }}>
                              <Text style={{ flex: 0.4, color: '#000000', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>{row.no}</Text>
                              <Text style={{ flex: 0.6, color: '#000080', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.frec}</Text>
                              <Text style={{ flex: 1, color: '#000080', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.horario}</Text>
                              <Text style={{ flex: 1, color: '#000000', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.eco || '-'}</Text>
                              {!isIndios && <Text style={{ flex: 0.6, color: row.ruta === 'MEX' ? '#008000' : row.ruta === 'REY' ? '#D22B2B' : '#4B0082', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.ruta || '-'}</Text>}
                              {(isIndios || isLagos) && <Text style={{ flex: 0.5, color: '#000000', fontSize: 13, textAlign: 'center' }}>{row.pax || '-'}</Text>}
                              <Text style={{ flex: 2.2, color: '#000000', fontSize: 11, textAlign: 'center', paddingHorizontal: 2, flexShrink: 1, flexWrap: 'wrap' }}>{row.observaciones || ''}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Total de Pasajeros */}
                    {(isIndios || isLagos) && (
                      <View style={{ marginTop: 20, alignItems: 'flex-end', borderTopWidth: 2, borderColor: '#0033A0', paddingTop: 10 }}>
                        <Text style={{ color: '#0033A0', fontSize: 20, fontWeight: 'bold' }}>
                          TOTAL PASAJEROS: {rows.reduce((sum, r) => sum + (parseInt(r.pax) || 0), 0)}
                        </Text>
                      </View>
                    )}
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
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            renderItem={({ item: row, index }) => {
              const renderRightActions = () => (
                <TouchableOpacity style={{ backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', width: 70, height: '90%', borderRadius: 8, marginVertical: 4, marginLeft: 8 }} onPress={() => handleRemoveRow(row.id)}>
                  <Feather name="trash-2" size={24} color="#fff" />
                </TouchableOpacity>
              );
              const renderLeftActions = () => (
                <TouchableOpacity style={{ backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', width: 70, height: '90%', borderRadius: 8, marginVertical: 4, marginRight: 8 }} onPress={() => handleInsertRow(index)}>
                  <Feather name="plus-circle" size={24} color="#fff" />
                </TouchableOpacity>
              );

              return (
              <Swipeable renderRightActions={!isReadOnly ? renderRightActions : undefined} renderLeftActions={!isReadOnly ? renderLeftActions : undefined}>
              <TouchableOpacity activeOpacity={0.8}
                onPress={() => {
                  if (activeColor) handleApplyColor(row.id);
                  toggleExpand(null);
                }}
                style={[
                  styles.tableRow, 
                  isDarkMode && { backgroundColor: '#222', borderBottomColor: '#333' },
                  row.highlightColor && { backgroundColor: `${row.highlightColor}40` },
                  searchEco.trim() !== '' && String(row.eco) !== searchEco.trim() && { opacity: 0.15 }
                ]}
              >
                <View style={{ flex: 0.4 }}>
                  <Text style={[styles.td, { fontWeight: 'bold' }, isDarkMode && { color: '#F5F5DC' }]}>{row.no}</Text>
                </View>
                
                <View style={{ flex: 0.7, paddingHorizontal: 1 }}>
                  <TouchableOpacity 
                    style={[styles.inputCell, isDarkMode && { backgroundColor: '#333', borderColor: '#444' }, { justifyContent: 'center', paddingVertical: 8 }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                    onPress={() => handleOpenFrecSelector(row.id, row.frec)}
                    disabled={isReadOnly}
                  >
                    <Text style={[{ color: '#000080', fontWeight: 'bold', textAlign: 'center', fontSize: 13 }, isDarkMode && { color: '#F5F5DC' }]}>
                      {row.frec || '---'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1.4, paddingHorizontal: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  {!isReadOnly && (
                    <TouchableOpacity onPress={() => handleAdjustTime(row.id, -1)} style={{ padding: 2 }}>
                      <Feather name="minus-circle" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                  <TextInput 
                    style={[styles.inputCell, { flex: 1, color: '#000080', fontWeight: 'bold', paddingVertical: 8, fontSize: 13 }, isDarkMode && { backgroundColor: '#333', borderColor: '#444', color: '#F5F5DC' }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
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
                
                <View style={{ flex: 1, paddingHorizontal: 1 }}>
                  <TextInput 
                    style={[styles.inputCell, { color: '#000000', fontWeight: 'bold', paddingVertical: 8, fontSize: 13 }, isDarkMode && { backgroundColor: '#333', borderColor: '#444', color: '#F5F5DC' }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                    value={String(row.eco || '')}
                    onChangeText={(t) => handleUpdateField(row.id, 'eco', t)}
                    onFocus={() => toggleExpand(null)}
                    editable={!isReadOnly}
                    keyboardType="number-pad"
                    placeholder="--"
                    placeholderTextColor={isDarkMode ? "#666" : "#475569"}
                  />
                </View>

                {!isIndios && (
                  <View style={{ flex: 0.7, paddingHorizontal: 1 }}>
                    <TouchableOpacity 
                      style={[
                        styles.inputCell, 
                        { justifyContent: 'center', paddingVertical: 8 }, 
                        row.ruta === 'MEX' ? { borderColor: '#10b981' } : row.ruta === 'REY' ? { borderColor: '#ef4444' } : { borderColor: '#a855f7' },
                        isReadOnly && { opacity: 0.8, borderColor: 'transparent' }
                      ]}
                      onPress={() => handleToggleRuta(row.id)}
                      disabled={isReadOnly}
                    >
                      <Text style={[
                        { fontWeight: 'bold', textAlign: 'center', fontSize: 13 },
                        row.ruta === 'MEX' ? { color: '#10b981' } : row.ruta === 'REY' ? { color: '#ef4444' } : { color: '#475569' }
                      ]}>
                        {row.ruta || '---'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {(isIndios || isLagos) && (
                  <View style={{ flex: 0.6, paddingHorizontal: 1 }}>
                    <TextInput 
                      style={[styles.inputCell, { color: '#000000', paddingVertical: 8, fontSize: 13 }, isDarkMode && { backgroundColor: '#333', borderColor: '#444', color: '#F5F5DC' }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                      value={String(row.pax || '')}
                      onChangeText={(t) => handleUpdateField(row.id, 'pax', t)}
                      onFocus={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); toggleExpand(null); }}
                      editable={!isReadOnly}
                      keyboardType="number-pad"
                      placeholder="--"
                      placeholderTextColor={isDarkMode ? "#666" : "#475569"}
                    />
                  </View>
                )}

                <View style={{ flex: 0.5, paddingHorizontal: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <TouchableOpacity 
                    style={{ padding: 6, backgroundColor: row.observaciones ? '#eab30820' : 'transparent', borderRadius: 8 }}
                    onPress={() => handleOpenObsModal(row.id, row.observaciones)}
                  >
                    <Feather name="message-square" size={18} color={row.observaciones ? '#eab308' : '#64748b'} />
                  </TouchableOpacity>
                </View>

                
              </TouchableOpacity>
              </Swipeable>
              );
            }}
            ListFooterComponent={
              !isReadOnly ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15 }}>
                  <TouchableOpacity style={[styles.btnAddRow, { flex: 1, marginRight: 10, marginTop: 0 }]} onPress={handleAddRow}>
                    <Feather name="plus" size={20} color="#8b5cf6" />
                    <Text style={{ color: '#8b5cf6', marginLeft: 8, fontWeight: 'bold' }}>Agregar Turno</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.btnAddRow, { flex: 1, marginLeft: 10, marginTop: 0, borderColor: '#eab308' }]} onPress={handleDuplicateRound}>
                    <Feather name="copy" size={20} color="#eab308" />
                    <Text style={{ color: '#eab308', marginLeft: 8, fontWeight: 'bold' }}>Duplicar Vuelta</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}


        {!isReadOnly && !isExporting && (
          <View style={styles.marcatextosContainer}>
            <TouchableOpacity 
              style={[styles.colorCircle, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#64748b', marginRight: 10 }, activeColor === null && styles.colorCircleActive]} 
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
            <TouchableOpacity style={[styles.btnGuardar, saving && { opacity: 0.7 }]} onPress={handleSaveOTP} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="save" size={20} color="#fff" />}
              <Text style={styles.btnGuardarText}>{saving ? 'Guardando...' : 'Guardar OTP'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <FrecModal 
          visible={frecModalVisible} 
          onClose={() => setFrecModalVisible(false)} 
          initialFrec={initialFrecForModal}
          onSave={handleApplyFrecConfirm}
        />

        {/* Modal Observaciones */}
        <Modal visible={obsModalVisible} animationType="fade" transparent={true} onRequestClose={() => setObsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: 'auto', paddingBottom: 30 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Observaciones</Text>
                <TouchableOpacity onPress={() => setObsModalVisible(false)}>
                  <Feather name="x" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              
              <TextInput 
                style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9D2C2', borderRadius: 12, color: '#000000', padding: 18, fontSize: 16, marginBottom: 25, textAlignVertical: 'top' }}
                value={obsInputValue}
                onChangeText={setObsInputValue}
                placeholder="Ej. Salió a ruta 3 min tarde..."
                placeholderTextColor="#94a3b8"
                multiline={true}
                numberOfLines={4}
              />

              <TouchableOpacity style={{ backgroundColor: '#006847', padding: 18, borderRadius: 12 }} onPress={handleSaveObs}>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Guardar Observación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
      {toastMsg ? (
        <View style={{ position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#0f172a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, shadowColor: '#000', shadowOffset: {width:0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 10 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{toastMsg}</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#D9D2C2' },
  backBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '600', color: '#000000' },
  th: { color: '#4A4A4A', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  content: { padding: 10, paddingBottom: 40 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#D9D2C2', borderRadius: 8, marginBottom: 8, backgroundColor: '#F5F5DC' },
  td: { color: '#000000', fontSize: 12, textAlign: 'center' },
  inputCell: {
    backgroundColor: '#EAE5CE', // Burbujas color hueso
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9D2C2',
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 14,
    color: '#0f172a',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  fab: { paddingVertical: 12, fontSize: 16, fontWeight: 'bold' },
  btnAddRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, marginTop: 10, borderWidth: 1, borderColor: '#D9D2C2', borderStyle: 'dashed', borderRadius: 8 },
  footer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#D9D2C2', backgroundColor: '#F5F5DC', gap: 15 },
  btnShare: { flex: 1.3, backgroundColor: '#006847', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, gap: 8 },
  btnGuardar: { flex: 1, backgroundColor: '#006847', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  btnGuardarText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  marcatextosContainer: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(255, 255, 255, 0.95)', gap: 15, borderRadius: 30, zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 8, borderWidth: 1, borderColor: '#D9D2C2' },
  colorCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#000000',
    transform: [{ scale: 1.2 }]
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5F5DC', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#D9D2C2', paddingBottom: 15 },
  modalTitle: { color: '#000000', fontSize: 18, fontWeight: 'bold' },
  ecoItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#D9D2C2', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ecoItemText: { color: '#006847', fontSize: 18, fontWeight: 'bold' },
  ecoItemSubtext: { color: '#4A4A4A', fontSize: 14 },
  ecoItemClear: { padding: 15, marginTop: 10, backgroundColor: '#FFD1D1', borderRadius: 8, borderWidth: 1, borderColor: '#D2042D' }
});
