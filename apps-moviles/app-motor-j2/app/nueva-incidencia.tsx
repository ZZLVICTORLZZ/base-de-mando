import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/services/supabaseClient';

const TIPOS_INCIDENCIA = [
  'Alta de Unidad',
  'Baja de Unidad',
  'Falla Mecánica',
  'Accidente',
  'Retraso Tráfico',
  'Falta de Operador',
  'Desenrolado',
  'Otro'
];

export default function NuevaIncidenciaScreen() {
  const [eco, setEco] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [base, setBase] = useState('Indios Verdes');
  
  const [unidades, setUnidades] = useState<any[]>([]);
  const [ecoModalVisible, setEcoModalVisible] = useState(false);
  const [searchEco, setSearchEco] = useState('');
  
  const [tipoModalVisible, setTipoModalVisible] = useState(false);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUnidades();
    loadUserBase();
  }, []);

  const loadUserBase = async () => {
    // In a real scenario, base would come from user profile, using a default for now.
    const savedBase = await AsyncStorage.getItem('apolo11_user_base');
    if (savedBase) setBase(savedBase);
  };

  const fetchUnidades = async () => {
    const { data } = await supabase.from('unidades').select('numero, tipo').eq('activo', true);
    if (data) setUnidades(data.sort((a, b) => parseInt(a.numero) - parseInt(b.numero)));
  };

  const handleSave = async () => {
    if (!eco || !tipo) {
      Alert.alert('Faltan Datos', 'Por favor selecciona un número económico y un tipo de incidencia.');
      return;
    }

    setSaving(true);
    const currentUser = await AsyncStorage.getItem('apolo11_user_name') || 'Tablerista';
    
    // Obtener fecha actual en formato DD/MM/YYYY
    const today = new Date();
    const dStr = String(today.getDate()).padStart(2, '0');
    const mStr = String(today.getMonth() + 1).padStart(2, '0');
    const yStr = String(today.getFullYear());
    const fecha = `${dStr}/${mStr}/${yStr}`;

    const newIncidencia = {
      fecha,
      eco,
      tipo,
      estado: 'Pendiente',
      descripcion,
      reportado_por: `${currentUser} | ${base}`
    };

    const { error } = await supabase.from('incidencias').insert([newIncidencia]);
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.title}>Reportar Incidencia</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Número Económico (ECO)</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setEcoModalVisible(true)}>
            <Text style={[styles.selectBtnText, !eco && { color: '#64748b' }]}>{eco || 'Seleccionar ECO'}</Text>
            <Feather name="chevron-down" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <Text style={styles.label}>Tipo de Incidencia</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setTipoModalVisible(true)}>
            <Text style={[styles.selectBtnText, !tipo && { color: '#64748b' }]}>{tipo || 'Seleccionar Tipo'}</Text>
            <Feather name="chevron-down" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <Text style={styles.label}>Descripción / Notas</Text>
          <TextInput 
            style={styles.textArea}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Escribe los detalles aquí..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.btnGuardar, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="check" size={20} color="#fff" />}
            <Text style={styles.btnGuardarText}>{saving ? 'Guardando...' : 'Registrar Incidencia'}</Text>
          </TouchableOpacity>
        </View>

        {/* Modal ECO */}
        <Modal visible={ecoModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Unidad (ECO)</Text>
                <TouchableOpacity onPress={() => setEcoModalVisible(false)}>
                  <Feather name="x" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar económico..."
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                value={searchEco}
                onChangeText={setSearchEco}
              />

              <ScrollView style={{ marginTop: 10, marginBottom: 15 }}>
                {unidades.filter(u => (u.numero?.toString() || '').toLowerCase().includes(searchEco.toLowerCase())).map(item => (
                  <TouchableOpacity 
                    key={item.numero?.toString() || Math.random().toString()} 
                    style={styles.modalItem} 
                    onPress={() => { setEco(item.numero?.toString() || ''); setEcoModalVisible(false); setSearchEco(''); }}
                  >
                    <Text style={styles.modalItemText}>{item.numero} - {item.tipo}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal Tipo */}
        <Modal visible={tipoModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: '50%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tipo de Incidencia</Text>
                <TouchableOpacity onPress={() => setTipoModalVisible(false)}>
                  <Feather name="x" size={24} color="#4A4A4A" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={{ marginTop: 10, marginBottom: 15 }}>
                {TIPOS_INCIDENCIA.map(item => (
                  <TouchableOpacity 
                    key={item} 
                    style={styles.modalItem} 
                    onPress={() => { setTipo(item); setTipoModalVisible(false); }}
                  >
                    <Text style={styles.modalItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#D9D2C2' },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: '#000000' },
  content: { padding: 20 },
  label: { color: '#4A4A4A', fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 15 },
  selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9D2C2', borderRadius: 10, padding: 16 },
  selectBtnText: { color: '#000000', fontSize: 16 },
  textArea: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9D2C2', borderRadius: 10, padding: 16, color: '#000000', fontSize: 16, textAlignVertical: 'top', minHeight: 120 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#D9D2C2', backgroundColor: '#F5F5DC' },
  btnGuardar: { backgroundColor: '#006847', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  btnGuardarText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5F5DC', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#D9D2C2', paddingBottom: 15 },
  modalTitle: { color: '#000000', fontSize: 18, fontWeight: 'bold' },
  searchInput: { backgroundColor: '#FFFFFF', color: '#000000', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D9D2C2', fontSize: 16 },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#D9D2C2' },
  modalItemText: { color: '#000000', fontSize: 16 },
});
