import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';
import { supabase } from '../../src/services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function IncidenciasScreen() {
  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const [search, setSearch] = useState('');
  const [dateDesde, setDateDesde] = useState(todayStr);
  const [dateHasta, setDateHasta] = useState(todayStr);
  const [showPickerDesde, setShowPickerDesde] = useState(false);
  const [showPickerHasta, setShowPickerHasta] = useState(false);
  const [hojas, setHojas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newBase, setNewBase] = useState('Indios Verdes');
  const [creating, setCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchHojas();
    }, [])
  );

  const parseDateString = (dStr: string) => {
    if (!dStr) return new Date(0).getTime();
    if (dStr.includes('-')) {
      const [y, m, d] = dStr.split('-');
      return new Date(Number(y), Number(m)-1, Number(d)).getTime();
    }
    if (dStr.includes('/')) {
      const [d, m, y] = dStr.split('/');
      return new Date(Number(y), Number(m)-1, Number(d)).getTime();
    }
    return new Date(0).getTime();
  };

  const handleDateChangeDesde = (event: any, selectedDate?: Date) => {
    setShowPickerDesde(Platform.OS === 'ios');
    if (selectedDate) {
      const dStr = `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`;
      setDateDesde(dStr);
    }
  };

  const handleDateChangeHasta = (event: any, selectedDate?: Date) => {
    setShowPickerHasta(Platform.OS === 'ios');
    if (selectedDate) {
      const dStr = `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`;
      setDateHasta(dStr);
    }
  };

  const fetchHojas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('hojas_incidencias').select('*').order('created_at', { ascending: false });
    if (error) {
      console.log('Error fetch hojas:', error);
    } else {
      setHojas(data || []);
    }
    setLoading(false);
  };

  const handleCreateHoja = async () => {
    setCreating(true);
    const today = new Date();
    const fecha = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    
    const { data, error } = await supabase.from('hojas_incidencias').insert([{
      base: newBase,
      fecha: fecha,
      estado: 'Abierta'
    }]).select();

    setCreating(false);

    if (error) {
      console.log('Error creando hoja:', error);
      Alert.alert('Error de BD', error.message || 'No se pudo crear la hoja en Supabase.');
    } else if (data && data.length > 0) {
      setModalVisible(false);
      router.push(`/editor-incidencias?id=${data[0].id}`);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirmar', '¿Estás seguro de eliminar esta hoja y todos sus reportes?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('hojas_incidencias').delete().eq('id', id);
          if (!error) {
            setHojas(hojas.filter(h => h.id !== id));
          } else {
            Alert.alert('Error', 'No se pudo eliminar la hoja.');
          }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isClosed = item.estado === 'Cerrada';
    
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>Reporte de Incidencias</Text>
            <View style={[styles.statusBadge, { backgroundColor: isClosed ? '#10b98120' : '#3b82f620' }]}>
              <Text style={[styles.statusText, { color: isClosed ? '#10b981' : '#3b82f6' }]}>{item.estado || 'Abierta'}</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>
            <Feather name="map-pin" size={14} color="#94a3b8" /> Base: <Text style={{ color: '#f8fafc', fontWeight: 'bold' }}>{item.base}</Text>
          </Text>
          <Text style={styles.cardSubtitle}>
            <Feather name="calendar" size={14} color="#94a3b8" /> Fecha: {item.fecha}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/editor-incidencias?id=${item.id}`)}>
            <Feather name="eye" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(`/editor-incidencias?id=${item.id}`)}>
            <Feather name="edit-2" size={20} color="#38bdf8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item.id)}>
            <Feather name="trash-2" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredHojas = hojas.filter(h => {
    const matchesSearch = (h.base || '').toLowerCase().includes(search.toLowerCase());
    const rTime = parseDateString(h.fecha);
    const dTime = parseDateString(dateDesde);
    const hTime = parseDateString(dateHasta);
    const matchesDate = rTime >= dTime && rTime <= hTime;
    return matchesSearch && matchesDate;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registros de Incidencias</Text>
        <TouchableOpacity 
          style={styles.btnNuevo} 
          onPress={() => setModalVisible(true)}
        >
          <Feather name="plus" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.btnTextBold}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          <Feather name="search" size={16} color="#64748b" style={styles.filterIcon} />
          <TextInput 
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar hoja por base..."
            placeholderTextColor="#475569"
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="calendar" size={16} color="#64748b" style={styles.filterIcon} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: '#4A4A4A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Desde</Text>
            <TextInput 
              style={{ color: '#000000', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#C8C1B2', paddingVertical: 4 }}
              value={dateDesde}
              onChangeText={setDateDesde}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={{ width: 1, height: 20, backgroundColor: '#C8C1B2', marginHorizontal: 15, marginTop: 15 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: '#4A4A4A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hasta</Text>
            <TextInput 
              style={{ color: '#000000', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#C8C1B2', paddingVertical: 4 }}
              value={dateHasta}
              onChangeText={setDateHasta}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredHojas}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
             <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>
               No hay hojas de incidencias creadas.
             </Text>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Hoja de Incidencias</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Base a operar:</Text>
            <View style={styles.baseSelector}>
              {['Indios Verdes', 'Nuevos Paseos', 'Lagos 2'].map((b) => (
                <TouchableOpacity 
                  key={b}
                  style={[styles.baseBtn, newBase === b && styles.baseBtnActive]}
                  onPress={() => setNewBase(b)}
                >
                  <Text style={[styles.baseBtnText, newBase === b && styles.baseBtnTextActive]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, creating && { opacity: 0.7 }]} 
              onPress={handleCreateHoja}
              disabled={creating}
            >
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Crear Tabla</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  header: { 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#000000', letterSpacing: -0.5, marginBottom: 15 },
  btnNuevo: {
    backgroundColor: '#006847',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center'
  },
  btnTextBold: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D2C2',
    marginBottom: 10
  },
  filterIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#000000', fontSize: 14, paddingVertical: 12 },

  listPadding: { padding: 20 },
  card: { 
    backgroundColor: '#F5F5DC', 
    borderRadius: 12, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#D9D2C2',
    overflow: 'hidden'
  },
  cardInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D2C2'
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 4
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#F5F5DC',
    padding: 12,
    gap: 15
  },
  iconBtn: {
    padding: 6
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#F5F5DC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 10
  },
  baseSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30
  },
  baseBtn: {
    backgroundColor: '#F5F5DC',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D2C2'
  },
  baseBtnActive: {
    backgroundColor: '#006847',
    borderColor: '#006847'
  },
  baseBtnText: {
    color: '#4A4A4A',
    fontWeight: '500'
  },
  baseBtnTextActive: {
    color: '#fff',
    fontWeight: 'bold'
  },
  saveBtn: {
    backgroundColor: '#006847',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16
  }
});
