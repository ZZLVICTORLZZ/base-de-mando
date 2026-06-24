import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';
import { supabase } from '../../src/services/supabaseClient';
import { useCallback } from 'react';
import { isAdmin } from '../../lib/permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RDScreen() {
  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const [dateDesde, setDateDesde] = useState(todayStr);
  const [dateHasta, setDateHasta] = useState(todayStr);
  const [showPickerDesde, setShowPickerDesde] = useState(false);
  const [showPickerHasta, setShowPickerHasta] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState('Tablerista');

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        setUserIsAdmin(await isAdmin());
        const name = await AsyncStorage.getItem('apolo11_user_name') || 'Tablerista';
        setCurrentUser(name);
        fetchRoles();
      };
      init();
    }, [])
  );

  const fetchRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('roles_del_dia')
      .select('*, plantillas_predeterminadas(name)')
      .not('creado_por', 'ilike', '[OTP]%')
      .order('created_at', { ascending: false });
    
    if (error) {
      Alert.alert('Error de Conexión', 'No se pudieron cargar los roles: ' + error.message);
    } else if (data) {
      setRoles(data.map(d => ({
        id: d.id,
        fecha: d.fecha,
        tipo: d.plantillas_predeterminadas?.name || 'Desconocido',
        estatus: 'activa', // Hardcodeado por ahora
        creado_por: d.creado_por
      })));
    }
    setLoading(false);
  };

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

  const isToday = (fechaStr: string) => {
    const today = new Date();
    const dStr = String(today.getDate()).padStart(2, '0');
    const mStr = String(today.getMonth() + 1).padStart(2, '0');
    const yStr = String(today.getFullYear());
    return fechaStr === `${dStr}/${mStr}/${yStr}`;
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

  const filteredRoles = roles.filter(r => {
    const rTime = parseDateString(r.fecha);
    const dTime = parseDateString(dateDesde);
    const hTime = parseDateString(dateHasta);
    return rTime >= dTime && rTime <= hTime;
  });

  const canEdit = (item: any) => {
    return true; // Todos pueden editar por ahora
  };

  const handleDelete = (id: string) => {
    if (!userIsAdmin) {
      Alert.alert('Acceso Denegado', 'Solo los administradores pueden borrar roles.');
      return;
    }
    Alert.alert('Confirmar Eliminación', '¿Estás seguro de eliminar permanentemente este Rol Oficial?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('roles_del_dia').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else setRoles(roles.filter(r => r.id !== id));
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    // Definimos el color del indicador visual según estatus
    const statusColor = item.estatus === 'activa' ? '#10b981' : item.estatus === 'finalizado' ? '#3b82f6' : '#64748b';

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={styles.cardTitle}>Rol {item.tipo}</Text>
          </View>
          <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 4, paddingLeft: 16 }}>
            <Feather name="user" size={12} color="#64748b" style={{ marginRight: 4 }} /> {item.creado_por || 'Sistema'}
          </Text>
          <Text style={styles.cardDate}>
            <Feather name="calendar" size={12} color="#94a3b8" style={{ marginRight: 4 }} /> 
            {item.fecha && item.fecha.includes('-') ? item.fecha.split('-').reverse().join('/') : item.fecha}
          </Text>
        </View>
        
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => router.push({ pathname: '/editor-rol', params: { rol_id: item.id, mode: 'view' } })}
          >
            <Feather name="eye" size={18} color="#94a3b8" />
          </TouchableOpacity>
          {canEdit(item) && (
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => router.push({ pathname: '/editor-rol', params: { rol_id: item.id, mode: 'edit' } })}
            >
              <Feather name="edit-2" size={18} color="#10b981" />
            </TouchableOpacity>
          )}
          {userIsAdmin && (
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => handleDelete(item.id)}
            >
              <Feather name="trash-2" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rol de Despegue</Text>
        <TouchableOpacity 
          style={styles.btnNuevo} 
          onPress={() => router.push('/nuevo-rol')}
        >
          <Feather name="plus" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.btnTextBold}>Nuevo Rol</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Filtros Minimalista */}
      <View style={styles.filtersContainer}>
        <Feather name="filter" size={16} color="#64748b" style={styles.filterIcon} />
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>Desde</Text>
          <TextInput 
            style={styles.dateInput}
            value={dateDesde}
            onChangeText={setDateDesde}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#94a3b8"
          />
        </View>
        
        <View style={styles.dateSeparator} />
        
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>Hasta</Text>
          <TextInput 
            style={styles.dateInput}
            value={dateHasta}
            onChangeText={setDateHasta}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#94a3b8"
          />
        </View>

      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : roles.length === 0 ? (
        <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>No hay roles creados.</Text>
      ) : (
        <FlatList
          data={filteredRoles}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006847', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 12,
    alignSelf: 'center'
  },
  btnTextBold: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  
  // Filtros
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D2C2'
  },
  filterIcon: { marginRight: 15 },
  dateInputWrapper: { flex: 1 },
  dateLabel: { fontSize: 11, color: '#4A4A4A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateInput: { 
    color: '#000000', 
    fontSize: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#C8C1B2',
    paddingVertical: 4
  },
  dateSeparator: { width: 1, height: 20, backgroundColor: '#C8C1B2', marginHorizontal: 15, marginTop: 15 },

  // Lista
  listPadding: { padding: 20 },
  card: { 
    backgroundColor: '#F5F5DC', 
    borderRadius: 12, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    borderWidth: 1, 
    borderColor: '#D9D2C2' 
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000000' },
  cardDate: { fontSize: 13, color: '#666666', paddingLeft: 16 },
  
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 15 },
  iconBtn: { padding: 8, backgroundColor: '#F5F5DC', borderRadius: 6, borderWidth: 1, borderColor: '#D9D2C2' },
});
