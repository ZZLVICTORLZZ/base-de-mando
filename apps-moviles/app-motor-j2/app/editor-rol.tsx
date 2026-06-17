import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/services/supabaseClient';

export default function EditorRolScreen() {
  const { plantilla_id, rol_id, mode } = useLocalSearchParams();
  const isViewMode = mode === 'view';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plantillaName, setPlantillaName] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [ecoModalVisible, setEcoModalVisible] = useState(false);
  const [selectedRowIdForEco, setSelectedRowIdForEco] = useState<string | null>(null);

  useEffect(() => {
    fetchUnidades();
    if (rol_id) {
      fetchRol();
    } else if (plantilla_id) {
      fetchPlantilla();
    }
  }, [plantilla_id, rol_id]);

  const fetchUnidades = async () => {
    // La columna del número económico se llama 'numero' y el estado 'activo'
    const { data } = await supabase.from('unidades').select('id, numero, tipo').eq('activo', true);
    if (data) setUnidades(data);
  };

  const fetchRol = async () => {
    const { data, error } = await supabase.from('roles_del_dia').select('*, plantillas_predeterminadas(name)').eq('id', rol_id).single();
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
    const { data, error } = await supabase.from('plantillas_predeterminadas').select('*').eq('id', plantilla_id).single();
    if (error || !data) {
      alert('La plantilla seleccionada ya no existe o fue eliminada por un administrador.');
      router.back();
      return;
    }
    setPlantillaName(data.name);
    setRows(data.rows || []);
    setLoading(false);
  };

  const calculateTimes = (currentRows: any[], changedIndex: number = 0, fieldChanged: 'frec' | 'horario' = 'frec') => {
    let newRows = [...currentRows];
    
    if (fieldChanged === 'horario' && changedIndex > 0) {
      const prevTime = newRows[changedIndex - 1].horario;
      const newTime = newRows[changedIndex].horario;
      
      if (prevTime && prevTime.includes(':') && newTime && newTime.includes(':')) {
        const [hPrev, mPrev] = prevTime.split(':').map(Number);
        const [hNew, mNew] = newTime.split(':').map(Number);
        
        if (!isNaN(hPrev) && !isNaN(hNew)) {
          let diff = (hNew * 60 + mNew) - (hPrev * 60 + mPrev);
          if (diff < 0) diff += 24 * 60;
          newRows[changedIndex].frec = diff.toString();
        }
      }
    }

    const startIndexForCascade = fieldChanged === 'horario' ? changedIndex + 1 : changedIndex;
    
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
    if (isViewMode) return;
    setRows(rows.map(r => r.id === id ? { ...r, eco: text } : r));
  };

  const handleUpdateField = (id: string, field: 'frec' | 'horario', text: string) => {
    if (isViewMode) return;
    
    // Auto format time from 0530 to 05:30
    let formattedText = text;
    if (field === 'horario' && text.length === 4 && !text.includes(':')) {
      formattedText = `${text.substring(0, 2)}:${text.substring(2, 4)}`;
    }

    const rowIndex = rows.findIndex(r => r.id === id);
    const updatedRows = rows.map(r => r.id === id ? { ...r, [field]: formattedText } : r);
    setRows(calculateTimes(updatedRows, rowIndex, field));
  };

  const handleOpenEcoSelector = (rowId: string) => {
    if (isViewMode) return;
    setSelectedRowIdForEco(rowId);
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
    if (isViewMode) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const handleAddRow = () => {
    if (isViewMode) return;
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

    if (rol_id) {
      // Estamos editando un rol existente
      const { error } = await supabase.from('roles_del_dia').update({ rows: rows }).eq('id', rol_id);
      errorObj = error;
    } else {
      // Estamos creando uno nuevo desde una plantilla
      const newRol = {
        plantilla_base_id: plantilla_id,
        rows: rows,
        creado_por: 'Tablerista (Motor J2)',
        fecha: new Date().toISOString().split('T')[0] // Hoy
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

      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 0.5 }]}>NO.</Text>
        <Text style={[styles.th, { flex: 1 }]}>FREC.</Text>
        <Text style={[styles.th, { flex: 1.2 }]}>HORARIO</Text>
        <Text style={[styles.th, { flex: 1.5, color: '#3b82f6' }]}>ECO</Text>
        <Text style={[styles.th, { flex: 0.5 }]}></Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {rows.map((row) => (
          <View key={row.id} style={[styles.tableRow, row.highlightColor && { backgroundColor: `${row.highlightColor}33` }]}>
            <Text style={[styles.td, { flex: 0.5, fontWeight: 'bold' }]}>{row.no}</Text>
            
            <View style={{ flex: 1, paddingHorizontal: 4 }}>
              <TextInput 
                style={[styles.inputCell, isViewMode && { opacity: 0.8, borderColor: 'transparent' }]}
                value={row.frec}
                onChangeText={(t) => handleUpdateField(row.id, 'frec', t)}
                editable={!isViewMode}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <View style={{ flex: 1.2, paddingHorizontal: 4 }}>
              <TextInput 
                style={[styles.inputCell, { color: '#eab308' }, isViewMode && { opacity: 0.8, borderColor: 'transparent' }]}
                value={row.horario}
                onChangeText={(t) => handleUpdateField(row.id, 'horario', t)}
                editable={!isViewMode}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
            
            <View style={{ flex: 1.5, paddingHorizontal: 4 }}>
              <TouchableOpacity 
                style={[styles.inputCell, { borderColor: '#3b82f6', justifyContent: 'center' }, isViewMode && { opacity: 0.8, borderColor: 'transparent' }]}
                onPress={() => handleOpenEcoSelector(row.id)}
                disabled={isViewMode}
              >
                <Text style={{ color: row.eco ? '#38bdf8' : '#475569', fontWeight: 'bold', textAlign: 'center' }}>
                  {row.eco || '---'}
                </Text>
              </TouchableOpacity>
            </View>

            {!isViewMode && (
              <TouchableOpacity style={{ flex: 0.5, alignItems: 'center' }} onPress={() => handleRemoveRow(row.id)}>
                <Feather name="trash-2" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {!isViewMode && (
          <TouchableOpacity style={styles.btnAddRow} onPress={handleAddRow}>
            <Feather name="plus" size={18} color="#94a3b8" />
            <Text style={{ color: '#94a3b8', marginLeft: 8 }}>Añadir Turno Extra</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {!isViewMode && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.btnGuardar, saving && { opacity: 0.7 }]}
            disabled={saving}
            onPress={handleSaveRol}
          >
            <Feather name="save" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnGuardarText}>{saving ? 'Guardando...' : 'Publicar Rol Oficial'}</Text>
          </TouchableOpacity>
        </View>
      )}

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
            
            {unidades.length === 0 ? (
              <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>No hay unidades activas en la Base de Mando.</Text>
            ) : (
              <FlatList 
                data={unidades}
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity style={styles.ecoItem} onPress={() => handleSelectEco(item.numero)}>
                    <Text style={styles.ecoItemText}>{item.numero}</Text>
                    <Text style={styles.ecoItemSubtext}>{item.tipo || 'Vehículo'}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            
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
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  backBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
  
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  th: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  
  content: { padding: 10, paddingBottom: 40 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    borderRadius: 8
  },
  td: { color: '#f8fafc', fontSize: 14, textAlign: 'center' },
  
  inputCell: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    color: '#f8fafc',
    textAlign: 'center',
    paddingVertical: 6,
    fontSize: 14
  },

  btnAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 8
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a'
  },
  btnGuardar: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12
  },
  btnGuardarText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  
  // Modal Selector
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 15 },
  modalTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold' },
  ecoItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#334155', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ecoItemText: { color: '#38bdf8', fontSize: 18, fontWeight: 'bold' },
  ecoItemSubtext: { color: '#94a3b8', fontSize: 14 },
  ecoItemClear: { padding: 15, marginTop: 10, backgroundColor: '#450a0a', borderRadius: 8, borderWidth: 1, borderColor: '#7f1d1d' }
});
