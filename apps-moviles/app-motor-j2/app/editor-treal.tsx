import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../src/theme/ThemeContext';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Alert, LayoutAnimation, UIManager, Pressable, FlatList } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { supabase } from '../src/services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncManager } from '../src/services/SyncManager';

const FrecModal = ({ visible, onClose, initialFrec, onSave, isDarkMode }: any) => {
  const { theme, themeName } = useTheme();
  const styles = getStyles(theme);
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
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
        <View style={[styles.modalContent, { height: 'auto', paddingBottom: 30 }, isDarkMode && { backgroundColor: '#222' }]}>
          <View style={[styles.modalHeader, isDarkMode && { borderBottomColor: '#333' }]}>
            <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>Configurar Frecuencia</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          
          <TextInput 
            style={[{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: theme.border, borderRadius: 12, color: '#0f172a', padding: 18, fontSize: 24, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' }, isDarkMode && { backgroundColor: '#333', borderColor: '#444', color: theme.text }]}
            value={val}
            onChangeText={setVal}
            keyboardType="number-pad"
            placeholder="Ej. 15"
            placeholderTextColor={isDarkMode ? '#888' : '#94a3b8'}
            editable={!isSF}
            autoFocus={true}
          />

          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }} onPress={() => { setIsCascada(!isCascada); setIsSF(false); }}>
            <View style={{ width: 24, height: 24, borderWidth: 2, borderColor: isCascada ? theme.primary : '#94a3b8', borderRadius: 6, marginRight: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: isCascada ? theme.primary : 'transparent' }}>
              {isCascada && <Feather name="check" size={16} color="#fff" />}
            </View>
            <Text style={{ color: isDarkMode ? theme.text : theme.text, fontSize: 16 }}>Aplicar en Cascada a las demás</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }} onPress={() => { setIsSF(!isSF); setIsCascada(false); }}>
            <View style={{ width: 24, height: 24, borderWidth: 2, borderColor: isSF ? '#D2042D' : '#94a3b8', borderRadius: 6, marginRight: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: isSF ? '#D2042D' : 'transparent' }}>
              {isSF && <Feather name="check" size={16} color="#fff" />}
            </View>
            <Text style={{ color: isDarkMode ? theme.text : theme.text, fontSize: 16 }}>S.F. (Sin Frecuencia - Aislada)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: theme.primary, padding: 18, borderRadius: 12 }} onPress={() => onSave(val, isSF, isCascada)}>
            <Text style={{ color: theme.headerText, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Aceptar y Guardar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


const ControlledCellInput = ({ value, onChangeText, onFocus, ...props }: any) => {
  const [localVal, setLocalVal] = React.useState(value);
  
  React.useEffect(() => {
    setLocalVal(value);
  }, [value]);

  return (
    <TextInput 
      {...props}
      value={localVal}
      onChangeText={setLocalVal}
      onEndEditing={(e) => {
        if (localVal !== value) {
            onChangeText(e.nativeEvent.text);
        }
      }}
      onFocus={(e) => {
        if (onFocus) onFocus(e);
      }}
    />
  );
};

export default function EditorTREALScreen() {
  const { theme, themeName } = useTheme();
  const styles = getStyles(theme);
  const { source_rol_id, rol_id, mode, base_chequeo } = useLocalSearchParams();
  const isReadOnly = mode === 'view';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plantillaName, setPlantillaName] = useState('');
  const [tipoRolName, setTipoRolName] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const swipeableRefs = useRef(new Map());
  const [frecModalVisible, setFrecModalVisible] = useState(false);
  const [selectedRowIdForFrec, setSelectedRowIdForFrec] = useState<string | null>(null);
  const [initialFrecForModal, setInitialFrecForModal] = useState('');
  
  const [obsModalVisible, setObsModalVisible] = useState(false);
  const [selectedRowIdForObs, setSelectedRowIdForObs] = useState<string | null>(null);
  const [obsInputValue, setObsInputValue] = useState('');
  
  const [ecoModalVisible, setEcoModalVisible] = useState(false);
  const [selectedRowIdForEco, setSelectedRowIdForEco] = useState<string | null>(null);
  const [ecoInputValue, setEcoInputValue] = useState('');

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  // Novedades: Modo Oscuro, Foco y Toasts
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchEco, setSearchEco] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [activeRolId, setActiveRolId] = useState<string | null>((rol_id as string) || null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [unidadesList, setUnidadesList] = useState<any[]>([]);
  const [paxPromedioDia, setPaxPromedioDia] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'online'|'offline'|'syncing'>('online');
  const [userAccessLevel, setUserAccessLevel] = useState(0);
  const [isAllowedToEdit, setIsAllowedToEdit] = useState(true);
  
  
  useEffect(() => {
    AsyncStorage.getItem('apolo11_user_level').then(val => setUserAccessLevel(val ? parseInt(val) : 0));
    
    SyncManager.setOnSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    // Subscripción Realtime
    const targetId = activeRolId || rol_id;
    let channel;
    if (targetId) {
      channel = supabase.channel(`public:tablas_treal:${targetId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tablas_treal', filter: `id=eq.${targetId}` }, (payload) => {
          // Si otra persona actualizó los rows, los refrescamos si no estamos editando algo crítico localmente
          if (payload.new && payload.new.rows) {
             setRows(payload.new.rows);
             setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (Realtime)');
          }
        })
        .subscribe();
    }
    
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeRolId, rol_id]);

  useEffect(() => {
    AsyncStorage.getItem('TREAL_DARK_MODE').then(val => {
      if (val === 'true') setIsDarkMode(true);
    });
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    AsyncStorage.setItem('TREAL_DARK_MODE', String(next));
  };

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
  const COLORS = ['#FF1493', '#00FFFF', '#39FF14', '#FFFF00', '#FF8C00', '#8A2BE2', '#FF4500'];
  const [creadorName, setCreadorName] = useState<string>('');

// Exportación
  const [isExporting, setIsExporting] = useState(false);
  const viewShotRef = React.useRef<any>(null);

  const getBaseColor = (name: string) => {
    const lower = (name || '').toLowerCase();
    
    // Las 3 bases reales
    if (lower.includes('indios verdes')) return '#00502A'; // Verde oscuro muy legible
    if (lower.includes('paseos del lago 2') || lower.includes('lagos')) return '#1D4ED8'; // Azul (Lagos 2)
    if (lower.includes('nuevos paseos')) return '#A04000'; // Naranja oscuro / Óxido
    
    // Color por defecto si no coincide exactamente pero contiene palabras clave
    if (lower.includes('indios')) return '#00502A';
    if (lower.includes('lago')) return '#1D4ED8';
    if (lower.includes('paseos')) return '#A04000';

    return '#002244'; // Azul marino muy oscuro por defecto
  };
  const baseColor = getBaseColor(plantillaName);

  const getExportTheme = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('indios')) return { bg: '#fca5a5', border: '#ef4444', text: '#ef4444', emoji: '🔴' };
    if (lower.includes('nuevos') || lower.includes('paseos')) return { bg: '#fed7aa', border: '#f97316', text: '#ea580c', emoji: '🟠' };
    if (lower.includes('lago')) return { bg: '#fef08a', border: '#eab308', text: '#ca8a04', emoji: '🟡' };
    return { bg: '#fca5a5', border: '#ef4444', text: '#ef4444', emoji: '🔴' };
  };
  const exportTheme = getExportTheme(plantillaName);

  useEffect(() => {
    const init = async () => {
      const loadedUnidades = await fetchUnidades();
      if (rol_id) {
        // Viendo o editando un TREAL existente
        await fetchRol();
      } else if (source_rol_id) {
        // Creando uno nuevo basado en un Rol Oficial
        await fetchSourceRol(loadedUnidades);
      }
    };
    init();
  }, [source_rol_id, rol_id]);

  // Autoguardado silencioso cada vez que cambian las filas
  useEffect(() => {
    if (isReadOnly || !isAllowedToEdit || loading || rows.length === 0) return;
    const timer = setTimeout(async () => {
      await performAutoSave();
    }, 2500);
    return () => clearTimeout(timer);
  }, [rows]);

  const performAutoSave = async () => {
    if (isReadOnly || !isAllowedToEdit || loading || rows.length === 0) return;
    try {
      let currentUser = await AsyncStorage.getItem('apolo11_user_name');
      if (!currentUser || currentUser.toLowerCase() === 'tablerista') {
        currentUser = 'Emiliano';
      }
      const targetId = activeRolId || (rol_id as string);
      if (targetId) {
        const success = await SyncManager.queueTREALUpdate(targetId, rows);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else if (source_rol_id) {
        // Primera vez que se autoguarda un nuevo TREAL
        const { data: sourceData } = await supabase.from('tablas_treal').select('plantilla_base_id').eq('id', source_rol_id).single();
        let finalPlantillaId = sourceData?.plantilla_base_id || null;
        if (base_chequeo) {
          const { data: bData } = await supabase.from('plantillas_predeterminadas').select('id').ilike('name', `%${base_chequeo}%`).limit(1).single();
          if (bData) finalPlantillaId = bData.id;
        }
        const newTREAL = {
          fecha: new Date().toISOString().split('T')[0],
          plantilla_base_id: finalPlantillaId,
          creado_por: `[TREAL] ${currentUser} | ${plantillaName} | ${tipoRolName}`,
          rows: rows
        };
        const { data: inserted, error } = await supabase.from('tablas_treal').insert([newTREAL]).select('id').single();
        if (inserted && !error) {
          setActiveRolId(inserted.id);
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (e) {
      console.log('Error en autoguardado:', e);
    }
  };

  const fetchUnidades = async () => {
    const { data } = await supabase.from('unidades').select('*').eq('activo', true);
    if (data) {
      setUnidadesList(data);
      return data;
    }
    setUnidadesList([]);
    return [];
  };

  const fetchPaxPromedioDia = async (baseName: string, fechaStr?: string, rolName?: string) => {
    try {
      if (!baseName) return;
      const targetDate = fechaStr && fechaStr.includes('-') ? new Date(fechaStr + 'T12:00:00') : new Date();
      const targetDayOfWeek = targetDate.getDay();
      const targetDateStr = fechaStr && fechaStr.includes('-') ? fechaStr : new Date().toISOString().split('T')[0];

      const twoMonthsAgo = new Date();
      twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
      const dateLimitStr = twoMonthsAgo.toISOString().split('T')[0];

      const { data } = await supabase
        .from('tablas_treal')
        .select('fecha, rows, creado_por, plantillas_predeterminadas(name)')
        .gte('fecha', dateLimitStr)
        .lt('fecha', targetDateStr)
        .ilike('creado_por', '[TREAL]%');

      if (!data || data.length === 0) {
        setPaxPromedioDia(0);
        return;
      }

      const matchingRoles = data.filter(d => {
        const parts = d.creado_por?.split('|') || [];
        const bName = parts.length > 1 ? parts[1].trim() : (d.plantillas_predeterminadas?.name || '');
        const rName = parts.length > 2 ? parts[2].trim() : (d.plantillas_predeterminadas?.name || '');
        
        // 1. Coincidencia de Base
        if (!bName.toLowerCase().includes(baseName.toLowerCase()) && !baseName.toLowerCase().includes(bName.toLowerCase())) {
          return false;
        }

        // 2. Coincidencia de Rol (Mismo tipo de rol e.g. Entre Semana, Sabatino, Dominical)
        const targetRol = (rolName || tipoRolName || '').toLowerCase();
        const currentRol = rName.toLowerCase();
        if (targetRol.includes('entre semana') && !currentRol.includes('entre semana')) return false;
        if (targetRol.includes('sabatino') && !currentRol.includes('sabatino')) return false;
        if (targetRol.includes('dominical') && !currentRol.includes('dominical')) return false;
        if (!targetRol.includes('entre semana') && !targetRol.includes('sabatino') && !targetRol.includes('dominical') && targetRol !== '') {
          if (!currentRol.includes(targetRol) && !targetRol.includes(currentRol)) return false;
        }

        // 3. Coincidencia de Día de la semana y estrictamente fechas anteriores a la actual
        if (!d.fecha || !d.fecha.includes('-')) return false;
        if (d.fecha >= targetDateStr) return false;
        const dDate = new Date(d.fecha + 'T12:00:00');
        return dDate.getDay() === targetDayOfWeek;
      });

      if (matchingRoles.length === 0) {
        setPaxPromedioDia(0);
        return;
      }

      // Agrupar por fecha única para sumar todas las tablas creadas en ese mismo día
      const paxPorFecha: { [fecha: string]: number } = {};
      matchingRoles.forEach(r => {
        const rRows = r.rows || [];
        const sumThisRol = rRows.reduce((sum: number, row: any) => {
          const p = parseInt(String(row.pax || '').replace(/[^0-9]/g, ''));
          return sum + (!isNaN(p) ? p : 0);
        }, 0);
        if (!paxPorFecha[r.fecha]) paxPorFecha[r.fecha] = 0;
        paxPorFecha[r.fecha] += sumThisRol;
      });

      const fechas = Object.keys(paxPorFecha).sort();
      const recentFechas = fechas.slice(-5); // Tomamos solo de 4 a 6 días recientes (5 fechas más recientes)
      const totalPaxSum = recentFechas.reduce((sum, f) => sum + paxPorFecha[f], 0);
      const prom = recentFechas.length > 0 ? Math.round(totalPaxSum / recentFechas.length) : 0;
      setPaxPromedioDia(prom);
    } catch (e) {
      console.log('Error calculando pax promedio dia:', e);
    }
  };

  const fetchRol = async () => {
    const { data, error } = await supabase.from('tablas_treal').select('*, plantillas_predeterminadas(name)').eq('id', rol_id).single();
    if (error || !data) {
      alert('Esta proyección ya no existe o fue eliminada.');
      router.back();
      return;
    }
    
    const parts = data.creado_por?.split('|') || [];
    const savedName = parts.length > 1 ? parts[1].trim() : '';
    const savedTipoRol = parts.length > 2 ? parts[2].trim() : (data.plantillas_predeterminadas?.name || '');
    const baseToUse = savedName || data.plantillas_predeterminadas?.name || 'Proyección Sin Nombre';
    
    setPlantillaName(baseToUse);
    setTipoRolName(savedTipoRol);
    
    let rawCreador = parts[0]?.replace('[TREAL]', '').trim() || '';
    if (!rawCreador || rawCreador.toLowerCase() === 'tablerista') {
      rawCreador = 'Emiliano';
    }
    setCreadorName(`[TREAL] ${rawCreador}`);
    setRows(data.rows || []);
    await fetchPaxPromedioDia(baseToUse, data.fecha, savedTipoRol);
    
    // Validar permisos: Solo el creador o un admin (nivel 10) pueden editar
    const currentName = await AsyncStorage.getItem('apolo11_user_name');
    const uLevel = await AsyncStorage.getItem('apolo11_user_level');
    const levelNum = uLevel ? parseInt(uLevel) : 0;
    
    if (levelNum < 10 && currentName !== rawCreador) {
       setIsAllowedToEdit(false);
       if (!isReadOnly) {
          alert('Solo el administrador o el creador original puede editar esta hoja. Activando Modo Lectura.');
       }
    } else {
       setIsAllowedToEdit(true);
    }
    
    setLoading(false);
  };

  const fetchSourceRol = async (loadedUnidades: any[]) => {
    if (source_rol_id === 'empty') {
      const effectiveBase = base_chequeo ? (base_chequeo as string) : 'Base Desconocida';
      setTipoRolName('Vacío');
      setPlantillaName(effectiveBase);
      let currentUser = await AsyncStorage.getItem('apolo11_user_name');
      if (!currentUser || currentUser.toLowerCase() === 'tablerista') {
        currentUser = 'Emiliano';
      }
      setCreadorName(`[TREAL] ${currentUser}`);
      setRows([]);
      setLoading(false);
      return;
    }

    // Change to query from roles_del_dia instead of tablas_treal
    const { data, error } = await supabase.from('roles_del_dia').select('*, plantillas_predeterminadas(name)').eq('id', source_rol_id).single();
    if (error || !data) {
      alert('El rol oficial origen ya no existe.');
      router.back();
      return;
    }
    
    const baseName = data.plantillas_predeterminadas?.name || '';
    setTipoRolName(baseName);
    // Usar la base_chequeo si existe (para nueva proyeccion), de lo contrario la baseName original
    const effectiveBase = base_chequeo ? (base_chequeo as string) : baseName;
    setPlantillaName(effectiveBase);
    let currentUser = await AsyncStorage.getItem('apolo11_user_name');
    if (!currentUser || currentUser.toLowerCase() === 'tablerista') {
      currentUser = 'Emiliano';
    }
    setCreadorName(`[TREAL] ${currentUser}`);
    
    let processedRows = (data.rows || []).map((r: any) => ({ ...r, isGhost: true, highlightColor: '#cbd5e1', pax: '' }));
    
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
    await fetchPaxPromedioDia(effectiveBase, undefined, baseName);
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
    if (isReadOnly || !isAllowedToEdit) return;
    setRows(rows.map(r => r.id === id ? { ...r, eco: text } : r));
  };

  const handleToggleRuta = (id: string) => {
    if (isReadOnly || !isAllowedToEdit) return;
    setRows(rows.map(r => {
      if (r.id === id) {
        if (r.ruta === 'MEX') return { ...r, ruta: 'REY' };
        return { ...r, ruta: 'MEX' };
      }
      return r;
    }));
  };

  const handleOpenFrecSelector = (rowId: string, currentFrec: string) => {
    if (isReadOnly || !isAllowedToEdit) return;
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
    if (isReadOnly || !isAllowedToEdit) return;
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
    if (isReadOnly || !isAllowedToEdit) return;
    let formattedText = text;
    if (field === 'horario' && text.length === 4 && !text.includes(':')) {
      formattedText = `${text.substring(0, 2)}:${text.substring(2, 4)}`;
    }
    if (field === 'eco' || field === 'pax') {
      formattedText = text.replace(/[^0-9]/g, '');
    }
    setRows(prevRows => {
      const rowIndex = prevRows.findIndex(r => r.id === id);
      if (rowIndex === -1) return prevRows;
      const updatedRows = prevRows.map(r => r.id === id ? { ...r, [field]: formattedText } : r);
      if (field === 'frec' || field === 'horario') {
        return calculateTimes(updatedRows, rowIndex, field);
      }
      return updatedRows;
    });
  };

  const handleAdjustTime = (id: string, minutesToAdd: number) => {
    if (isReadOnly || !isAllowedToEdit) return;
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
    if (isReadOnly || !isAllowedToEdit) return;
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
    if (isReadOnly || !isAllowedToEdit) return;
    const prevFrec = rows[index] ? rows[index].frec : '15';
    const newRow = { id: Date.now().toString(), no: 0, frec: prevFrec, horario: '--:--', eco: '', ruta: 'MEX', observaciones: '', pax: '', es_manual: true };
    const newRows = [...rows];
    newRows.splice(index + 1, 0, newRow);
    setRows(calculateTimes(newRows, index, 'frec'));
    showToast('Turno Agregado');
  };

  
  const handleSimulateNFC = () => {
    Alert.prompt('Nueva Firma', 'Ingresa el ECO detectado por el tag NFC (ej. 101):', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Firmar', onPress: (eco: any) => {
          if (!eco) return;
          const now = new Date();
          const horas = String(now.getHours()).padStart(2, '0');
          const minutos = String(now.getMinutes()).padStart(2, '0');
          const horarioStr = `${horas}:${minutos}`;
          
          let hc = null;
          let ecoNum = parseInt(eco);
          if (!isNaN(ecoNum) && ecoNum >= 1000) {
            const count = rows.filter((r: any) => r.eco === eco).length;
            if (count === 0) hc = '#a855f7'; 
            else hc = '#14b8a6'; 
          }
          
          const ghostIndex = rows.findIndex((r: any) => r.isGhost);
          let newData = [...rows];
          
          if (ghostIndex !== -1) {
            newData[ghostIndex] = {
              ...newData[ghostIndex],
              eco: eco,
              isGhost: false,
              es_manual: false,
              highlightColor: hc !== null ? hc : (newData[ghostIndex].highlightColor === '#cbd5e1' ? null : newData[ghostIndex].highlightColor)
            };
            setRows(newData);
          } else {
            const lastRow = rows[rows.length - 1];
            const prevFrec = lastRow?.frec || '';
            const newRow = { 
              id: Date.now().toString(), 
              no: (lastRow?.no || 0) + 1, 
              frec: prevFrec, 
              horario: horarioStr, 
              eco: eco, 
              ruta: 'MEX', 
              observaciones: '', 
              pax: '',
              es_manual: false,
              highlightColor: hc,
              isGhost: false
            };
            newData.push(newRow);
            setRows(newData);
          }
          
          const targetId = activeRolId || (rol_id as string);
          if (targetId) {
            SyncManager.queueTREALUpdate(targetId, newData);
          }
      }}
    ], 'plain-text');
  };


  const handleDuplicateRound = () => {
    if (isReadOnly || !isAllowedToEdit) return;
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
    if (isReadOnly || !isAllowedToEdit) return;
    const ghostIndex = rows.findIndex((r: any) => r.isGhost);
    if (ghostIndex !== -1) {
      const newData = [...rows];
      newData[ghostIndex] = {
        ...newData[ghostIndex],
        eco: '',
        isGhost: false,
        es_manual: true,
        highlightColor: newData[ghostIndex].highlightColor === '#cbd5e1' ? null : newData[ghostIndex].highlightColor
      };
      setRows(newData);
      const targetId = activeRolId || (rol_id as string);
      if (targetId) {
        SyncManager.queueTREALUpdate(targetId, newData);
      }
    } else {
      const lastRow = rows[rows.length - 1];
      const prevFrec = lastRow ? lastRow.frec : '15';
      const newRow = { id: Date.now().toString(), no: (lastRow?.no || 0) + 1, frec: prevFrec, horario: '--:--', eco: '', ruta: 'MEX', observaciones: '', pax: '', es_manual: true, isGhost: false };
      setRows(calculateTimes([...rows, newRow], rows.length - 1, 'frec'));
    }
  };

  const handleSaveTREAL = async () => {
    setSaving(true);
    let errorObj = null;
    const targetId = activeRolId || (rol_id as string);

    if (targetId) {
      const { error } = await supabase.from('tablas_treal').update({ rows: rows }).eq('id', targetId);
      errorObj = error;
    } else {
      // Creando nuevo TREAL
      const { data: sourceData } = await supabase.from('tablas_treal').select('plantilla_base_id').eq('id', source_rol_id).single();
      let currentUser = await AsyncStorage.getItem('apolo11_user_name');
      if (!currentUser || currentUser.toLowerCase() === 'tablerista') {
        currentUser = 'Emiliano';
      }
      
      let finalPlantillaId = sourceData?.plantilla_base_id || null;
      if (base_chequeo) {
        // Buscar si existe una plantilla base con el nombre de la base de chequeo
        const { data: bData } = await supabase.from('plantillas_predeterminadas').select('id').ilike('name', `%${base_chequeo}%`).limit(1).single();
        if (bData) {
          finalPlantillaId = bData.id;
        }
      }

      const newTREAL = {
        fecha: new Date().toISOString().split('T')[0],
        plantilla_base_id: finalPlantillaId,
        creado_por: `[TREAL] ${currentUser} | ${plantillaName} | ${tipoRolName}`, // Guardar nombre y tipo de rol para que isIndios funcione
        rows: rows
      };

      const { error } = await supabase.from('tablas_treal').insert([newTREAL]);
      errorObj = error;
    }

    setSaving(false);
    if (errorObj) {
      alert('Error al guardar: ' + errorObj.message);
    } else {
      router.replace('/(tabs)/ctr');
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
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir Proyección TREAL', UTI: 'public.png' });
        }
      } catch (error) {
        setIsExporting(false);
        alert('No se pudo generar la imagen.');
      }
    }, 400);
  };

  // Cálculo de Frecuencia Promedio, Pasajeros Totales, Capacidad Proyectada y Mapa de Unidades
  const { frecPromedioMin, pasajerosTotales, capacidadRestante, proyeccionTotalPax, unidadesMap } = React.useMemo(() => {
    // Construir mapa de unidades por número ECO para búsqueda rápida O(1)
    const uMap: { [ecoNum: string]: number } = {};
    (unidadesList || []).forEach(u => {
      const numStr = String(u.numero || '').replace(/[^0-9]/g, '');
      if (numStr) {
        const cap = Number(u.capacidad || u.pasajeros || u.aforo || u.asientos || 0);
        if (cap > 0) {
          uMap[numStr] = cap;
        }
      }
    });

    if (!rows || rows.length === 0) {
      return { frecPromedioMin: 0, pasajerosTotales: 0, capacidadRestante: 0, proyeccionTotalPax: 0, unidadesMap: uMap };
    }

    // 1. Calcular Pasajeros Totales (suma de todos los pax escritos en las unidades)
    const totalPax = rows.reduce((acc, r) => {
      const p = parseInt(String(r.pax || '').replace(/[^0-9]/g, ''));
      return acc + (!isNaN(p) ? p : 0);
    }, 0);

    // 2. Encontrar el índice de la última unidad que tenga escritos pasajeros (> 0 o texto numérico válido)
    let lastPaxIndex = -1;
    for (let i = rows.length - 1; i >= 0; i--) {
      const pStr = String(rows[i].pax || '').trim();
      const p = parseInt(pStr.replace(/[^0-9]/g, ''));
      if (pStr !== '' && !isNaN(p)) {
        lastPaxIndex = i;
        break;
      }
    }

    // Si todavía ninguna unidad tiene pasajeros escritos, tomamos la última unidad del listado
    const targetIndex = lastPaxIndex !== -1 ? lastPaxIndex : rows.length - 1;

    // 3. Tomar los últimos 7 turnos (incluyendo unidades con marcatextos sin discriminación) desde targetIndex hacia arriba
    const startIndex = Math.max(0, targetIndex - 6);
    const last7Turns = rows.slice(startIndex, targetIndex + 1);
    
    // Sumar los minutos de carga (frec) y dividir entre la cantidad de turnos tomada (hasta 7)
    const countTurns = last7Turns.length;
    const sumFrec = last7Turns.reduce((acc, r) => {
      const f = parseInt(String(r.frec || '0').replace(/[^0-9]/g, ''));
      return acc + (!isNaN(f) ? f : 0);
    }, 0);

    const frecProm = countTurns > 0 ? Math.round(sumFrec / countTurns) : 0;

    // 4. Calcular la capacidad restante de todas las unidades que aún no han entrado a cargar (sin pax registrado)
    let capRest = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.pax || String(r.pax).trim() === '') {
        const ecoNum = String(r.eco || '').replace(/[^0-9]/g, '');
        if (ecoNum && uMap[ecoNum]) {
          capRest += uMap[ecoNum];
        }
      }
    }

    return { 
      frecPromedioMin: frecProm, 
      pasajerosTotales: totalPax,
      capacidadRestante: capRest,
      proyeccionTotalPax: totalPax + capRest,
      unidadesMap: uMap
    };
  }, [rows, unidadesList]);

  const renderTurnoIndicator = (row: any, isDark: boolean = false, isExport: boolean = false) => {
    const ecoClean = String(row.eco || '').replace(/[^0-9]/g, '');
    const unitCap = ecoClean ? (unidadesMap[ecoClean] || 0) : 0;
    const hasWrittenPax = row.pax !== undefined && row.pax !== null && String(row.pax).trim() !== '';
    const paxNum = hasWrittenPax ? parseInt(String(row.pax).replace(/[^0-9]/g, '')) : NaN;

    let fillHeight = '0%';
    let fillColor = 'transparent';
    let showBox = false;

    if (hasWrittenPax && !isNaN(paxNum) && unitCap > 0) {
      showBox = true;
      if (paxNum >= unitCap) {
        fillHeight = '100%';
        fillColor = '#10b981';
      } else if (paxNum >= unitCap * 0.75) {
        fillHeight = '75%';
        fillColor = '#f97316';
      } else if (paxNum >= unitCap * 0.5) {
        fillHeight = '50%';
        fillColor = '#f59e0b';
      } else {
        fillHeight = '25%';
        fillColor = '#ef4444';
      }
    }

    return (
      <View style={{ flex: 0.4, alignItems: 'center', justifyContent: 'center' }}>
        {showBox ? (
          <View style={{
            width: 28,
            height: 24,
            borderRadius: 4,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isDark ? '#555' : '#CBD5E1',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
            position: 'relative'
          }}>
            <View style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: fillHeight as any,
              backgroundColor: fillColor
            }} />
            <Text style={[
              styles.td,
              { 
                fontWeight: 'bold', 
                fontSize: 13, 
                zIndex: 1,
                color: '#fff',
                textShadowColor: 'rgba(0, 0, 0, 0.6)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2
              }
            ]}>
              {row.no}
            </Text>
          </View>
        ) : (
          <Text style={[
            styles.td, 
            { fontWeight: 'bold' }, 
            isDark && { color: theme.text },
            isExport && { color: '#0f172a' }
          ]}>
            {row.no}
          </Text>
        )}
      </View>
    );
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
        <View style={[styles.header, { borderBottomWidth: 4, borderBottomColor: '#ef4444', backgroundColor: isDarkMode ? '#2a1111' : '#fff0f0' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#ef4444" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.title, { color: '#ef4444' }]}>🔴 TREAL - {plantillaName}</Text>
            {tipoRolName ? <Text style={{ fontSize: 11, color: isDarkMode ? '#aaa' : '#64748b', fontWeight: 'bold' }}>Rol: {tipoRolName}</Text> : null}
            
            {lastSavedTime ? <Text style={{ fontSize: 10, color: '#10b981', fontWeight: 'bold' }}>⚡ Guardado {lastSavedTime}</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: syncStatus === 'online' ? '#10b981' : syncStatus === 'syncing' ? '#3b82f6' : '#f59e0b', marginRight: 4 }} />
              <Text style={{ fontSize: 10, color: isDarkMode ? '#aaa' : '#64748b' }}>
                {syncStatus === 'online' ? 'En línea' : syncStatus === 'syncing' ? 'Sincronizando...' : 'Sin conexión (Guardando local)'}
              </Text>
            </View>

          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <TouchableOpacity onPress={toggleDarkMode}>
              <Feather name={isDarkMode ? 'sun' : 'moon'} size={24} color={isDarkMode ? theme.background : theme.primary} />
            </TouchableOpacity>
            <View style={{ width: 10 }} />
          </View>
        </View>

        {!isExporting && (
          <View style={{ paddingHorizontal: 15, paddingTop: 6, paddingBottom: 5 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 6 }}>
              <View style={[
                { flexDirection: 'row', width: 210, height: 32, borderRadius: 16, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1 },
                isDarkMode ? { backgroundColor: '#262626', borderColor: '#404040' } : { backgroundColor: theme.headerText, borderColor: '#CBD5E1' }
              ]}>
                <Feather name="search" size={15} color={isDarkMode ? '#A3A3A3' : '#64748b'} />
                <TextInput 
                  style={{ flex: 1, marginLeft: 6, fontSize: 13, paddingVertical: 0, color: (themeName === 'neon' || isDarkMode) ? '#FFFFFF' : '#1E293B' }}
                  placeholder="Buscar ECO..."
                  placeholderTextColor={isDarkMode ? '#737373' : '#94a3b8'}
                  value={searchEco}
                  onChangeText={setSearchEco}
                  keyboardType="number-pad"
                />
                {searchEco.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchEco('')}>
                    <Feather name="x-circle" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={{ backgroundColor: theme.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 }}>
              {/* Hilera 1: Datos en vivo (Minimalista) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)' }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#88D8C0', fontSize: 8.5, fontWeight: 'bold' }}>FREC. PROM.</Text>
                  <Text style={{ color: theme.headerText, fontSize: 13, fontWeight: 'bold' }}>
                    {rows.length > 0 ? `${frecPromedioMin} min` : '--'}
                  </Text>
                </View>
                <View style={{ width: 1, height: 20, backgroundColor: '#88D8C0', opacity: 0.4 }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#88D8C0', fontSize: 8.5, fontWeight: 'bold' }}>T. AUTOBUSES</Text>
                  <Text style={{ color: theme.headerText, fontSize: 13, fontWeight: 'bold' }}>
                    {new Set(rows.filter(r => r.eco && r.highlightColor).map(r => r.eco)).size} / {new Set(rows.filter(r => r.eco).map(r => r.eco)).size}
                  </Text>
                </View>
                <View style={{ width: 1, height: 20, backgroundColor: '#88D8C0', opacity: 0.4 }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#88D8C0', fontSize: 8.5, fontWeight: 'bold' }}>PAX ABORDADOS</Text>
                  <Text style={{ color: theme.headerText, fontSize: 13, fontWeight: 'bold' }}>
                    {pasajerosTotales}
                  </Text>
                </View>
              </View>

              {/* Hilera 2: Proyección y Cierre (Promedio del Día vs Capacidad Proyectada) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 4 }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#A7F3D0', fontSize: 8.5, fontWeight: 'bold' }}>PROM. DEL DÍA</Text>
                  <Text style={{ color: theme.headerText, fontSize: 12, fontWeight: 'bold' }}>
                    {paxPromedioDia > 0 ? `${paxPromedioDia} pax` : '--'}
                  </Text>
                </View>
                <View style={{ width: 1, height: 20, backgroundColor: '#88D8C0', opacity: 0.4 }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: '#A7F3D0', fontSize: 8.5, fontWeight: 'bold' }}>CAP. PROYECTADA</Text>
                  <Text style={{ color: theme.headerText, fontSize: 12, fontWeight: 'bold' }}>
                    {proyeccionTotalPax} pax
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {!isExporting && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: isDarkMode ? '#1A1A1A' : theme.headerText, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#333' : theme.border }}>
            <View style={{ flex: 0.4 }}><Text style={[styles.th, {fontSize: 11}, isDarkMode && {color: '#aaa'}]}>NO.</Text></View>
            <View style={{ flex: 0.5, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11}, isDarkMode && {color: '#aaa'}]}>FREC</Text></View>
            <View style={{ flex: 0.8, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11}, isDarkMode && {color: '#aaa'}]}>HORA</Text></View>
            <View style={{ flex: 0.8, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11, color: isDarkMode ? '#aaa' : theme.text}]}>ECO</Text></View>
            {!isIndios && <View style={{ flex: 0.8, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11}, isDarkMode && {color: '#aaa'}]}>RUTA</Text></View>}
            {(isIndios || isLagos) && <View style={{ flex: 0.5, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11}, isDarkMode && {color: '#aaa'}]}>PAX</Text></View>}
            <View style={{ flex: 0.6, paddingHorizontal: 1 }}><Text style={[styles.th, {fontSize: 11}, isDarkMode && {color: '#aaa'}]}>OBS</Text></View>
            {!isReadOnly && <View style={{ width: 30 }} />}
          </View>
        )}

        
        {isExporting ? (
          <ScrollView horizontal style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={undefined} onScrollBeginDrag={() => setExpandedRowId(null)}>
              <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
                <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => toggleExpand(null)}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ width: 900, backgroundColor: '#FFFFFF', padding: 30 }}>
                    {/* Header de Exportación TREAL */}
                    <View style={{ flexDirection: 'column', borderBottomWidth: 2, borderColor: baseColor, paddingBottom: 15, marginBottom: 20 }}>
                      <Text style={{ color: exportTheme.text, fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: tipoRolName ? 4 : 10 }}>
                        {exportTheme.emoji} PROYECCIÓN TREAL - {plantillaName?.toUpperCase()}
                      </Text>
                      {tipoRolName ? (
                        <Text style={{ color: '#475569', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
                          Rol: {tipoRolName}
                        </Text>
                      ) : null}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: 'bold' }}>
                          Sistema Saturno V | Tablerista: {(() => {
                            let name = creadorName.replace('[TREAL] ', '').trim();
                            if (!name || name.toLowerCase() === 'tablerista') return 'Emiliano';
                            // If the name is literally "Nombre Completo Nombre_ID" (duplicated words), we can deduplicate it if needed.
                            // But since the user complained about "Emiliano R" becoming "R", we will just print the full name.
                            return name;
                          })()}
                        </Text>
                        <Text style={{ color: baseColor, fontSize: 16, fontWeight: 'bold' }}>Fecha: {new Date().toLocaleDateString()}</Text>
                      </View>
                    </View>

                    {/* Tabla de Exportación 2 Columnas */}
                    <View style={{ flexDirection: 'row', gap: 40 }}>
                      
                      {/* Columna Izquierda */}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', backgroundColor: exportTheme.bg, borderBottomWidth: 2, borderColor: exportTheme.border, paddingVertical: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                          <Text style={{ flex: 0.4, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>NO.</Text>
                          <Text style={{ flex: 0.5, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>FREC</Text>
                          <Text style={{ flex: 0.8, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>HORA</Text>
                          <Text style={{ flex: 0.8, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>ECO</Text>
                          {!isIndios && <Text style={{ flex: 0.8, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>RUTA</Text>}
                          {(isIndios || isLagos) && <Text style={{ flex: 0.5, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>PAX</Text>}
                          <Text style={{ flex: (isIndios || !isLagos) ? 2.2 : 1.6, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>OBS</Text>
                        </View>
                        {rows.slice(0, Math.ceil(rows.length / 2)).map((row) => (
                          <View key={row.id} style={[{ flexDirection: 'row', backgroundColor: row.highlightColor ? `${row.highlightColor}60` : 'transparent', borderBottomWidth: 1, borderColor: baseColor, paddingVertical: 10, alignItems: 'center' }, row.es_manual && { borderWidth: 2, borderColor: '#ef4444', borderStyle: 'dashed', borderRadius: 4, marginVertical: 2 }, row.isGhost && { opacity: 0.35 }]}>
                            {renderTurnoIndicator(row, false, true)}
                            <Text style={{ flex: 0.5, color: baseColor, fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.frec}</Text>
                            <Text style={{ flex: 0.8, color: baseColor, fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.horario}</Text>
                            <Text style={{ flex: 0.8, color: '#0f172a', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.isGhost ? '-' : (row.eco || '-')}</Text>
                            {!isIndios && <Text style={{ flex: 0.8, color: row.ruta === 'MEX' ? '#008000' : row.ruta === 'REY' ? '#D22B2B' : '#4B0082', fontSize: 11, textAlign: 'center', fontWeight: 'bold' }}>{row.ruta || '-'}</Text>}
                            {(isIndios || isLagos) && <Text style={{ flex: 0.5, color: '#0f172a', fontSize: 13, textAlign: 'center' }}>{row.isGhost ? '-' : (row.pax || '-')}</Text>}
                            <Text style={{ flex: (isIndios || !isLagos) ? 2.2 : 1.6, color: '#0f172a', fontSize: 11, textAlign: 'center', paddingHorizontal: 2, flexShrink: 1, flexWrap: 'wrap' }}>{row.observaciones || ''}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Columna Derecha */}
                      {rows.length > 1 && (
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', backgroundColor: exportTheme.bg, borderBottomWidth: 2, borderColor: exportTheme.border, paddingVertical: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                            <Text style={{ flex: 0.4, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>NO.</Text>
                            <Text style={{ flex: 0.6, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>FREC</Text>
                            <Text style={{ flex: 1, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>HORA</Text>
                            <Text style={{ flex: 1, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>ECO</Text>
                            {!isIndios && <Text style={{ flex: 0.8, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>RUTA</Text>}
                            {(isIndios || isLagos) && <Text style={{ flex: 0.5, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>PAX</Text>}
                            <Text style={{ flex: (isIndios || !isLagos) ? 2.2 : 1.6, color: '#0f172a', fontWeight: 'bold', fontSize: 11, textAlign: 'center' }}>OBS</Text>
                          </View>
                          {rows.slice(Math.ceil(rows.length / 2)).map((row) => (
                            <View key={row.id} style={[{ flexDirection: 'row', backgroundColor: row.highlightColor ? `${row.highlightColor}60` : 'transparent', borderBottomWidth: 1, borderColor: baseColor, paddingVertical: 10, alignItems: 'center' }, row.es_manual && { borderWidth: 2, borderColor: '#ef4444', borderStyle: 'dashed', borderRadius: 4, marginVertical: 2 }, row.isGhost && { opacity: 0.35 }]}>
                              {renderTurnoIndicator(row, false, true)}
                              <Text style={{ flex: 0.6, color: baseColor, fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.frec}</Text>
                              <Text style={{ flex: 1, color: baseColor, fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.horario}</Text>
                              <Text style={{ flex: 1, color: '#0f172a', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>{row.isGhost ? '-' : (row.eco || '-')}</Text>
                              {!isIndios && <Text style={{ flex: 0.8, color: row.ruta === 'MEX' ? '#008000' : row.ruta === 'REY' ? '#D22B2B' : '#4B0082', fontSize: 11, textAlign: 'center', fontWeight: 'bold' }}>{row.ruta || '-'}</Text>}
                              {(isIndios || isLagos) && <Text style={{ flex: 0.5, color: '#0f172a', fontSize: 13, textAlign: 'center' }}>{row.isGhost ? '-' : (row.pax || '-')}</Text>}
                              <Text style={{ flex: (isIndios || !isLagos) ? 2.2 : 1.6, color: '#0f172a', fontSize: 11, textAlign: 'center', paddingHorizontal: 2, flexShrink: 1, flexWrap: 'wrap' }}>{row.observaciones || ''}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Frecuencia Promedio y Total de Pasajeros en Exportación */}
                    <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderColor: baseColor, paddingTop: 10 }}>
                      <Text style={{ color: baseColor, fontSize: 18, fontWeight: 'bold' }}>
                        FREC. PROMEDIO: {frecPromedioMin} MIN
                      </Text>
                      <Text style={{ color: baseColor, fontSize: 18, fontWeight: 'bold' }}>
                        TOTAL PASAJEROS: {pasajerosTotales}
                      </Text>
                    </View>
                    </View>
                  </ScrollView>
                </TouchableOpacity>
              </ViewShot>
            </ScrollView>
          </ScrollView>
        ) : (
          <>
          <FlatList
            data={rows}
            keyExtractor={item => item.id}
            contentContainerStyle={[styles.content, { backgroundColor: isDarkMode ? '#1A1A1A' : theme.background }]}
            onScrollBeginDrag={() => setExpandedRowId(null)}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            renderItem={({ item: row, index }) => {
              const renderRightActions = () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4, marginLeft: 6 }}>
                  <TouchableOpacity style={{ backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', width: 62, height: '90%', borderRadius: 8, marginRight: 6 }} onPress={() => { swipeableRefs.current.get(row.id)?.close(); handleInsertRow(index); }}>
                    <Feather name="plus-circle" size={20} color="#fff" />
                    <Text style={{ color: theme.headerText, fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>Insertar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', width: 62, height: '90%', borderRadius: 8 }} onPress={() => handleRemoveRow(row.id)}>
                    <Feather name="trash-2" size={20} color="#fff" />
                    <Text style={{ color: theme.headerText, fontSize: 10, fontWeight: 'bold', marginTop: 2 }}>Borrar</Text>
                  </TouchableOpacity>
                </View>
              );

              return (
              <View pointerEvents={row.isGhost ? 'none' : 'auto'}>
              <Swipeable 
                ref={(ref) => {
                  if (ref) {
                    swipeableRefs.current.set(row.id, ref);
                  } else {
                    swipeableRefs.current.delete(row.id);
                  }
                }}
                renderRightActions={!isReadOnly ? renderRightActions : undefined} friction={1} rightThreshold={15} overshootRight={true} overshootFriction={8}>
              <TouchableOpacity activeOpacity={0.8}
                onPress={() => {
                  if (activeColor) handleApplyColor(row.id);
                  toggleExpand(null);
                }}
                style={[
                  styles.tableRow, 
                  isDarkMode && { backgroundColor: '#222', borderBottomColor: '#333' },
                  row.highlightColor && { backgroundColor: `${row.highlightColor}40` },
                  row.es_manual && { borderWidth: 2, borderColor: '#ef4444', borderStyle: 'dashed' },
                  row.isGhost && { opacity: 0.35, backgroundColor: isDarkMode ? '#333' : '#f8fafc' },
                  searchEco.trim() !== '' && String(row.eco) !== searchEco.trim() && { opacity: 0.15 }
                ]}
              >
                {renderTurnoIndicator(row, isDarkMode)}
                
                <View style={{ flex: 0.6, paddingHorizontal: 1 }}>
                  <TouchableOpacity 
                    style={[styles.inputCell, isDarkMode && { backgroundColor: '#333', borderColor: '#444' }, { justifyContent: 'center', paddingVertical: 8 }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                    onPress={() => handleOpenFrecSelector(row.id, row.frec)}
                    disabled={isReadOnly}
                  >
                    <Text style={[{ color: '#000080', fontWeight: 'bold', textAlign: 'center', fontSize: 13 }, isDarkMode && { color: theme.text }]}>
                      {row.frec || '---'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 0.8, paddingHorizontal: 1, justifyContent: 'center' }}>
                  <ControlledCellInput style={[styles.inputCell, { flex: 1, color: '#000080', fontWeight: 'bold', paddingVertical: 8, fontSize: 13, textAlign: 'center' }, isDarkMode && { backgroundColor: '#333', borderColor: '#444', color: theme.text }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                    value={row.horario}
                    onChangeText={(t) => handleUpdateField(row.id, 'horario', t)}
                    onFocus={() => toggleExpand(null)}
                    editable={!isReadOnly}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                
                <View style={{ flex: 1, paddingHorizontal: 1 }}>
                  <TouchableOpacity 
                    style={[styles.inputCell, { justifyContent: 'center', paddingVertical: 8 }, isDarkMode && { backgroundColor: '#333', borderColor: '#444' }, isReadOnly && { opacity: 0.8, borderColor: 'transparent' }]}
                    onPress={() => {
                      if(isReadOnly || !isAllowedToEdit) return;
                      setSelectedRowIdForEco(row.id);
                      setEcoInputValue(String(row.eco || ''));
                      setEcoModalVisible(true);
                    }}
                    disabled={isReadOnly}
                  >
                    <Text style={[{ color: '#0f172a', fontWeight: 'bold', textAlign: 'center', fontSize: 13 }, !row.eco && { color: isDarkMode ? "#666" : "#475569" }, isDarkMode && row.eco && { color: theme.text }]}>
                      {row.eco ? String(row.eco) : '--'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {!isIndios && (
                  <View style={{ flex: 0.8, paddingHorizontal: 1 }}>
                    <TouchableOpacity 
                      style={[
                        styles.inputCell, 
                        { justifyContent: 'center', paddingVertical: 8 }, 
                        row.ruta === 'MEX' ? { borderColor: '#10b981' } : row.ruta === 'REY' ? { borderColor: '#ef4444' } : { borderColor: '#a855f7' },
                        isDarkMode && { backgroundColor: '#333', borderColor: '#444' },
                        isReadOnly && { opacity: 0.8, borderColor: 'transparent' }
                      ]}
                      onPress={() => handleToggleRuta(row.id)}
                      disabled={isReadOnly}
                    >
                      <Text style={[
                        { fontWeight: 'bold', textAlign: 'center', fontSize: 13 },
                        row.ruta === 'MEX' ? { color: '#10b981' } : row.ruta === 'REY' ? { color: '#ef4444' } : { color: isDarkMode ? '#aaa' : '#475569' }
                      ]}>
                        {row.ruta || '---'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {(isIndios || isLagos) && (
                  <View style={{ flex: 0.5, paddingHorizontal: 1 }}>
                    {(() => {
                      const ecoClean = String(row.eco || '').replace(/[^0-9]/g, '');
                      const unitCap = ecoClean ? (unidadesMap[ecoClean] || 0) : 0;
                      const hasWrittenPax = row.pax !== undefined && row.pax !== null && String(row.pax).trim() !== '';
                      
                      return (
                        <ControlledCellInput 
                          style={[
                            styles.inputCell, 
                            { paddingVertical: 8, fontSize: 13 },
                            hasWrittenPax ? { color: '#0f172a', fontWeight: 'bold' } : { color: '#94a3b8', fontStyle: 'italic', opacity: unitCap > 0 ? 0.9 : 1 },
                            isDarkMode && { backgroundColor: '#333', borderColor: '#444', color: hasWrittenPax ? theme.text : '#888' },
                            isReadOnly && { opacity: 0.8, borderColor: 'transparent' }
                          ]}
                          value={hasWrittenPax ? String(row.pax) : ''}
                          onChangeText={(t) => handleUpdateField(row.id, 'pax', t)}
                          onFocus={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); toggleExpand(null); }}
                          editable={!isReadOnly}
                          keyboardType="number-pad"
                          maxLength={2}
                          placeholder={unitCap > 0 ? `${unitCap}` : '--'}
                          placeholderTextColor={unitCap > 0 ? (isDarkMode ? "#888" : "#94a3b8") : (isDarkMode ? "#666" : "#475569")}
                        />
                      );
                    })()}
                  </View>
                )}

                <View style={{ flex: 0.6, paddingHorizontal: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <TouchableOpacity 
                    style={{ padding: 6, backgroundColor: row.observaciones ? '#eab30820' : 'transparent', borderRadius: 8 }}
                    onPress={() => handleOpenObsModal(row.id, row.observaciones)}
                  >
                    <Feather name="message-square" size={18} color={row.observaciones ? '#eab308' : '#64748b'} />
                  </TouchableOpacity>
                </View>

                
              </TouchableOpacity>
              </Swipeable>
              </View>
              );
            }}
            ListFooterComponent={null}
          />
          <View style={{ position: 'absolute', bottom: 160, alignSelf: 'center', alignItems: 'center', zIndex: 100 }}>
            <TouchableOpacity 
              style={{ backgroundColor: '#3b82f6', borderColor: '#2563eb', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8, marginBottom: 15 }} 
              onPress={handleSimulateNFC}
            >
              <Feather name="edit-3" size={24} color="#ffffff" />
              <Text style={{ color: '#ffffff', marginLeft: 8, fontWeight: 'bold', fontSize: 18 }}>Nueva Firma</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 15 }}>
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#f97316', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4 }} 
                onPress={handleAddRow}
              >
                <Feather name="plus" size={16} color="#f97316" />
                <Text style={{ color: '#f97316', marginLeft: 5, fontSize: 14, fontWeight: 'bold' }}>Registro Manual</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.95)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#eab308', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4 }} 
                onPress={handleDuplicateRound}
              >
                <Feather name="copy" size={16} color="#eab308" />
                <Text style={{ color: '#eab308', marginLeft: 5, fontSize: 14, fontWeight: 'bold' }}>Duplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
          </>
        )}

        {!isReadOnly && !isExporting && (
          <View style={[styles.marcatextosContainer, isDarkMode && { backgroundColor: 'rgba(30, 30, 30, 0.95)', borderColor: '#444' }]}>
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

        <View style={[styles.footer, isDarkMode && { backgroundColor: '#1A1A1A', borderTopColor: '#333' }]}>
          <TouchableOpacity style={styles.btnShare} onPress={exportToWhatsApp}>
            <Feather name="share-2" size={20} color="#fff" />
          </TouchableOpacity>
          {(!isReadOnly && isAllowedToEdit) && (
            <TouchableOpacity style={[styles.btnGuardar, saving && { opacity: 0.7 }]} onPress={handleSaveTREAL} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnGuardarText}>{saving ? 'Guardando...' : 'Guardar'}</Text>}
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
        <Modal visible={obsModalVisible} animationType="none" transparent={true} onRequestClose={() => setObsModalVisible(false)}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
            <View style={[styles.modalContent, { height: 'auto', paddingBottom: 30 }, isDarkMode && { backgroundColor: '#222' }]}>
              <View style={[styles.modalHeader, isDarkMode && { borderBottomColor: '#333' }]}>
                <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>Observaciones</Text>
                <TouchableOpacity onPress={() => setObsModalVisible(false)}>
                  <Feather name="x" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              
              <TextInput 
                autoFocus={true}
                style={[{ backgroundColor: theme.headerText, borderWidth: 1, borderColor: theme.border, borderRadius: 12, color: themeName === 'neon' ? '#FFFFFF' : '#0f172a', padding: 18, fontSize: 16, marginBottom: 25, textAlignVertical: 'top' }, isDarkMode && { backgroundColor: '#333', borderColor: '#444', color: theme.text }]}
                value={obsInputValue}
                onChangeText={setObsInputValue}
                placeholder="Ej. Salió a ruta 3 min tarde..."
                placeholderTextColor={isDarkMode ? '#888' : '#94a3b8'}
                multiline={true}
                numberOfLines={4}
              />

              <TouchableOpacity style={{ backgroundColor: theme.primary, padding: 18, borderRadius: 12 }} onPress={handleSaveObs}>
                <Text style={{ color: theme.headerText, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Guardar Observación</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal ECO */}
        <Modal visible={ecoModalVisible} animationType="none" transparent={true} onRequestClose={() => setEcoModalVisible(false)}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
            <View style={[styles.modalContent, { height: 'auto', paddingBottom: 30 }, isDarkMode && { backgroundColor: '#222' }]}>
              <View style={[styles.modalHeader, isDarkMode && { borderBottomColor: '#333' }]}>
                <Text style={[styles.modalTitle, isDarkMode && { color: theme.text }]}>Unidad (ECO)</Text>
                <TouchableOpacity onPress={() => setEcoModalVisible(false)}>
                  <Feather name="x" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              
              <TextInput 
                style={[{ backgroundColor: theme.headerText, borderWidth: 1, borderColor: theme.border, borderRadius: 12, color: themeName === 'neon' ? '#FFFFFF' : '#0f172a', padding: 18, fontSize: 24, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' }, isDarkMode && { backgroundColor: '#333', borderColor: '#444', color: theme.text }]}
                value={ecoInputValue}
                onChangeText={setEcoInputValue}
                placeholder="Ej. 1320"
                placeholderTextColor={isDarkMode ? '#888' : '#94a3b8'}
                keyboardType="number-pad"
                autoFocus={true}
              />

              <TouchableOpacity style={{ backgroundColor: theme.primary, padding: 18, borderRadius: 12 }} onPress={() => {
                if (selectedRowIdForEco) {
                  handleUpdateField(selectedRowIdForEco, 'eco', ecoInputValue);
                }
                setEcoModalVisible(false);
                setSelectedRowIdForEco(null);
              }}>
                <Text style={{ color: theme.headerText, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
      {toastMsg ? (
        <View style={{ position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#0f172a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, shadowColor: '#000', shadowOffset: {width:0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 10 }}>
          <Text style={{ color: theme.headerText, fontSize: 14, fontWeight: 'bold' }}>{toastMsg}</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border },
  backBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '600', color: theme.text },
  th: { color: theme.textMuted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  content: { padding: 10, paddingBottom: 40 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, borderRadius: 8, marginBottom: 8, backgroundColor: theme.background },
  td: { color: theme.text, fontSize: 12, textAlign: 'center' },
  inputCell: {
    backgroundColor: '#EAE5CE', // Burbujas color hueso
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
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
  btnAddRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, marginTop: 10, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed', borderRadius: 8 },
  footer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.background, gap: 15 },
  btnShare: { flex: 1, backgroundColor: theme.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 6, borderRadius: 6, gap: 4 },
  btnGuardar: { flex: 1, backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 6, gap: 4 },
  btnGuardarText: { color: theme.headerText, fontSize: 13, fontWeight: 'bold' },
  marcatextosContainer: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(255, 255, 255, 0.95)', gap: 15, borderRadius: 30, zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 8, borderWidth: 1, borderColor: theme.border },
  colorCircle: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#0f172a',
    transform: [{ scale: 1.2 }]
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 15 },
  modalTitle: { color: theme.text, fontSize: 20, fontWeight: 'bold' },
  ecoItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ecoItemText: { color: theme.primary, fontSize: 24, fontWeight: 'bold' },
  ecoItemSubtext: { color: theme.textMuted, fontSize: 16 },
  ecoItemClear: { padding: 20, marginTop: 10, backgroundColor: '#FFD1D1', borderRadius: 8, borderWidth: 1, borderColor: '#D2042D' }
});
}
