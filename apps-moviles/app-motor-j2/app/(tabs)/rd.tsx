import React, { useState, useCallback } from 'react';
import { useTheme } from '../../src/theme/ThemeContext';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../src/services/supabaseClient';
import { isAdmin } from '../../lib/permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateFilterBar from '../../src/components/DateFilterBar';

export default function RDScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const [dateDesde, setDateDesde] = useState(todayStr);
  const [dateHasta, setDateHasta] = useState(todayStr);
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
        estatus: 'activa',
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

  const filteredRoles = roles.filter(r => {
    const rTime = parseDateString(r.fecha);
    const dTime = parseDateString(dateDesde);
    const hTime = parseDateString(dateHasta);
    return rTime >= dTime && rTime <= hTime;
  });

  const canEdit = (item: any) => {
    return true;
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
          <Feather name="plus" size={18} color={theme.headerText} style={{ marginRight: 6 }} />
          <Text style={styles.btnTextBold}>Nuevo Rol</Text>
        </TouchableOpacity>
      </View>

      <DateFilterBar
        dateDesde={dateDesde}
        dateHasta={dateHasta}
        onChangeDesde={setDateDesde}
        onChangeHasta={setDateHasta}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : roles.length === 0 ? (
        <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>No hay roles creados.</Text>
      ) : (
        <FlatList
          data={filteredRoles}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 30 }}>
              No se encontraron roles para el periodo seleccionado.
            </Text>
          }
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

  // Lista
  listPadding: { padding: 20 },
  card: { 
    backgroundColor: theme.surface, 
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
  cardDate: { fontSize: 13, color: theme.textMuted, paddingLeft: 16 },
  
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 15 },
  iconBtn: { padding: 8, backgroundColor: theme.background, borderRadius: 6, borderWidth: 1, borderColor: theme.border },
});
}
