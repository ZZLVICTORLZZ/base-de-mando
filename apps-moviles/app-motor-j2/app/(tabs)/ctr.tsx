import React, { useState, useEffect } from 'react';
import { useTheme } from '../../src/theme/ThemeContext';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Platform } from 'react-native';
import { supabase } from '../../src/services/supabaseClient';
import { useCallback } from 'react';
import { isAdmin } from '../../lib/permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CTRScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
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
      .from('tablas_treal')
      .select('*, plantillas_predeterminadas(name)')
      .order('created_at', { ascending: false });
    
    if (error) {
      if (!error.message.includes('relation "public.tablas_treal" does not exist')) {
        Alert.alert('Error de Conexión', 'No se pudieron cargar las tablas TREAL: ' + error.message);
      }
    } else if (data) {
      setRoles(data.map(d => {
        const baseName = d.creado_por?.includes('|') ? d.creado_por.split('|')[1].trim() : 'Base Desconocida';
        const plantillaName = d.plantillas_predeterminadas?.name || 'Plantilla Desconocida';
        return {
          id: d.id,
          fecha: d.fecha,
          baseName: baseName,
          plantillaName: plantillaName,
          estatus: 'activa',
          creado_por: d.creado_por?.split('|')[0].trim() || ''
        };
      }));
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

  const filteredRoles = roles.filter(r => {
    const rTime = parseDateString(r.fecha);
    const dTime = parseDateString(dateDesde);
    const hTime = parseDateString(dateHasta);
    return rTime >= dTime && rTime <= hTime;
  });

  const handleDelete = (id: string) => {
    if (!userIsAdmin) {
      Alert.alert('Acceso Denegado', 'Solo los administradores pueden borrar tablas de TREAL.');
      return;
    }
    Alert.alert('Confirmar Eliminación', '¿Estás seguro de eliminar permanentemente esta Tabla TREAL?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('tablas_treal').delete().eq('id', id);
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
            <Text style={styles.cardTitle}>TREAL {item.baseName}</Text>
          </View>
          <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4, paddingLeft: 16, fontWeight: '500' }}>
            <Feather name="activity" size={12} color="#94a3b8" style={{ marginRight: 4 }} /> TREAL {item.plantillaName}
          </Text>
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
            onPress={() => router.push({ pathname: '/editor-treal', params: { rol_id: item.id, mode: 'view' } })}
          >
            <Feather name="eye" size={18} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => router.push({ pathname: '/editor-treal', params: { rol_id: item.id, mode: 'edit' } })}
          >
            <Feather name="edit-2" size={18} color="#10b981" />
          </TouchableOpacity>
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
        <Text style={styles.title}>Control en T. Real</Text>
        <TouchableOpacity 
          style={styles.btnNuevo} 
          onPress={() => router.push('/nueva-tabla-treal')}
        >
          <Feather name="plus" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.btnTextBold}>Nueva Tabla TREAL</Text>
        </TouchableOpacity>
      </View>

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
        <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 40 }} />
      ) : roles.length === 0 ? (
        <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>No hay tablas de control real registradas.</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary, 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 12,
    alignSelf: 'center'
  },
  btnTextBold: { color: theme.headerText, fontWeight: '600', fontSize: 14 },
  
  // Filtros
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  filterIcon: { marginRight: 15 },
  dateInputWrapper: { flex: 1 },
  dateLabel: { fontSize: 11, color: theme.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateInput: { 
    color: theme.text, 
    fontSize: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#C8C1B2',
    paddingVertical: 4
  },
  dateSeparator: { width: 1, height: 20, backgroundColor: '#C8C1B2', marginHorizontal: 15, marginTop: 15 },

  // Lista
  listPadding: { padding: 20 },
  card: { 
    backgroundColor: theme.background, 
    borderRadius: 12, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    borderWidth: 1, 
    borderColor: theme.border 
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: theme.text },
  cardDate: { fontSize: 13, color: '#666666', paddingLeft: 16 },
  
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 15 },
  iconBtn: { padding: 8, backgroundColor: theme.background, borderRadius: 6, borderWidth: 1, borderColor: theme.border },
});
}
