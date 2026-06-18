import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../src/services/supabaseClient';
import { useCallback } from 'react';
import { isAdmin } from '../../lib/permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OTPScreen() {
  const [dateDesde, setDateDesde] = useState('01/06/2026');
  const [dateHasta, setDateHasta] = useState('15/06/2026');
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
      .ilike('creado_por', '[OTP]%')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
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

  const isToday = (fechaStr: string) => {
    const today = new Date();
    const dStr = String(today.getDate()).padStart(2, '0');
    const mStr = String(today.getMonth() + 1).padStart(2, '0');
    const yStr = String(today.getFullYear());
    return fechaStr === `${dStr}/${mStr}/${yStr}`;
  };

  const canEdit = (item: any) => {
    return true; // Todos pueden editar por ahora
  };

  const handleDelete = (id: string) => {
    if (!userIsAdmin) {
      Alert.alert('Acceso Denegado', 'Solo los administradores pueden borrar proyecciones.');
      return;
    }
    Alert.alert('Confirmar Eliminación', '¿Estás seguro de eliminar permanentemente esta Proyección OTP?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('roles_del_dia').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else setRoles(roles.filter(r => r.id !== id));
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusColor = item.estatus === 'activa' ? '#8b5cf6' : item.estatus === 'finalizado' ? '#3b82f6' : '#64748b';

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={styles.cardTitle}>OTP {item.tipo}</Text>
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
            onPress={() => router.push({ pathname: '/editor-otp', params: { rol_id: item.id, mode: 'view' } })}
          >
            <Feather name="eye" size={18} color="#94a3b8" />
          </TouchableOpacity>
          {canEdit(item) && (
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => router.push({ pathname: '/editor-otp', params: { rol_id: item.id, mode: 'edit' } })}
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
        <Text style={styles.title}>Proyecciones OTP</Text>
        <TouchableOpacity 
          style={styles.btnNuevo} 
          onPress={() => router.push('/nueva-proyeccion-otp')}
        >
          <Feather name="plus" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.btnTextBold}>Nueva Proyección</Text>
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
            placeholderTextColor="#475569"
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
            placeholderTextColor="#475569"
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 40 }} />
      ) : roles.length === 0 ? (
        <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>No hay proyecciones creadadas.</Text>
      ) : (
        <FlatList
          data={roles}
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
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#f8fafc', letterSpacing: -0.5 },
  btnNuevo: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 8 
  },
  btnTextBold: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  
  // Filtros
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  filterIcon: { marginRight: 15 },
  dateInputWrapper: { flex: 1 },
  dateLabel: { fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateInput: { 
    color: '#f8fafc', 
    fontSize: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#334155',
    paddingVertical: 4
  },
  dateSeparator: { width: 1, height: 20, backgroundColor: '#334155', marginHorizontal: 15, marginTop: 15 },

  // Lista
  listPadding: { padding: 20 },
  card: { 
    backgroundColor: '#1e293b', 
    borderRadius: 12, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
  cardDate: { fontSize: 13, color: '#94a3b8', paddingLeft: 16 },
  
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 15 },
  iconBtn: { padding: 8, backgroundColor: '#0f172a', borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
});
