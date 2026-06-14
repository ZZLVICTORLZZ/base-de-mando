import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

const MOCK_INCIDENCIAS = [
  { id: '1', fecha: '14/06/2026', tipo: 'Falla Mecánica', eco: '202', estado: 'Pendiente' },
  { id: '2', fecha: '13/06/2026', tipo: 'Retraso Tráfico', eco: '101', estado: 'Resuelto' },
  { id: '3', fecha: '13/06/2026', tipo: 'Accidente Menor', eco: '305', estado: 'En Revisión' },
];

export default function IncidenciasScreen() {
  const [search, setSearch] = useState('');

  const renderItem = ({ item }: { item: any }) => {
    const statusColor = item.estado === 'Resuelto' ? '#10b981' : item.estado === 'Pendiente' ? '#ef4444' : '#f59e0b';

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={styles.cardTitle}>{item.tipo}</Text>
          </View>
          <Text style={styles.cardSubtitle}>ECO: {item.eco}  •  {item.fecha}</Text>
        </View>
        
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="eye" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Incidencias</Text>
        <TouchableOpacity 
          style={styles.btnNuevo} 
          onPress={() => router.push('/nueva-incidencia')}
        >
          <Feather name="plus" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.btnTextBold}>Nueva</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <Feather name="search" size={16} color="#64748b" style={styles.filterIcon} />
        <TextInput 
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por ECO o Tipo..."
          placeholderTextColor="#475569"
        />
      </View>

      <FlatList
        data={MOCK_INCIDENCIAS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      />
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
    backgroundColor: '#ef4444', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 8 
  },
  btnTextBold: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10
  },
  filterIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 14, paddingVertical: 12 },

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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
  cardSubtitle: { fontSize: 13, color: '#94a3b8', paddingLeft: 16 },
  
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 15 },
  iconBtn: { padding: 8, backgroundColor: '#0f172a', borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
});
