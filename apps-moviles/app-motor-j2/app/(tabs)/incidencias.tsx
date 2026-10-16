import React, { useState, useCallback } from 'react';
import { useTheme } from '../../src/theme/ThemeContext';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../src/services/supabaseClient';
import DateFilterBar from '../../src/components/DateFilterBar';

export default function IncidenciasScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const [selectedBase, setSelectedBase] = useState('Todas');
  const [dateDesde, setDateDesde] = useState(todayStr);
  const [dateHasta, setDateHasta] = useState(todayStr);
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
            <Feather name="map-pin" size={14} color="#94a3b8" /> Base: <Text style={{ color: theme.text, fontWeight: 'bold' }}>{item.base}</Text>
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
    const matchesBase =
      selectedBase === 'Todas' ||
      (h.base || '').toLowerCase().includes(selectedBase.toLowerCase());
    const rTime = parseDateString(h.fecha);
    const dTime = parseDateString(dateDesde);
    const hTime = parseDateString(dateHasta);
    const matchesDate = rTime >= dTime && rTime <= hTime;
    return matchesBase && matchesDate;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registros de Incidencias</Text>
        <TouchableOpacity 
          style={styles.btnNuevo} 
          onPress={() => setModalVisible(true)}
        >
          <Feather name="plus" size={18} color={theme.headerText} style={{ marginRight: 6 }} />
          <Text style={styles.btnTextBold}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      <DateFilterBar
        dateDesde={dateDesde}
        dateHasta={dateHasta}
        onChangeDesde={setDateDesde}
        onChangeHasta={setDateHasta}
        selectedBase={selectedBase}
        onSelectBase={setSelectedBase}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredHojas}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
             <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>
               No hay hojas de incidencias para el filtro seleccionado.
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

function getStyles(theme: any) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: { fontSize: 24, fontWeight: '700', color: theme.text, letterSpacing: -0.5, marginBottom: 15 },
  btnNuevo: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center'
  },
  btnTextBold: { color: theme.headerText, fontWeight: 'bold', fontSize: 14 },

  listPadding: { padding: 20 },
  card: { 
    backgroundColor: theme.surface, 
    borderRadius: 12, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: theme.border,
    overflow: 'hidden'
  },
  cardInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
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
    color: theme.text
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
    color: theme.textMuted,
    marginBottom: 4
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: theme.background,
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
    backgroundColor: theme.surface,
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
    color: theme.text
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 10
  },
  baseSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30
  },
  baseBtn: {
    backgroundColor: theme.background,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border
  },
  baseBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary
  },
  baseBtnText: {
    color: theme.textMuted,
    fontWeight: '500'
  },
  baseBtnTextActive: {
    color: theme.headerText,
    fontWeight: 'bold'
  },
  saveBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  saveBtnText: {
    color: theme.headerText,
    fontWeight: 'bold',
    fontSize: 16
  }
});
}
