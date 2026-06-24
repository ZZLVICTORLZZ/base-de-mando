import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

const MOCK_CHEQUEOS = [
  { id: '1', eco: '202', hora: '05:45', estado: 'A Tiempo', diferencia: '+0 min' },
  { id: '2', eco: '101', hora: '05:32', estado: 'Atrasado', diferencia: '-2 min' },
  { id: '3', eco: '303', hora: '06:00', estado: 'Adelantado', diferencia: '+1 min' },
];

export default function CTRScreen() {
  const [search, setSearch] = useState('');

  const renderItem = ({ item }: { item: any }) => {
    const statusColor = item.estado === 'A Tiempo' ? '#10b981' : item.estado === 'Atrasado' ? '#ef4444' : '#f59e0b';

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={styles.cardTitle}>ECO: {item.eco}</Text>
          </View>
          <Text style={styles.cardSubtitle}>Hora real: {item.hora} ({item.diferencia})</Text>
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
        <Text style={styles.title}>Control en T. Real</Text>
        <TouchableOpacity 
          style={styles.btnNuevo} 
          onPress={() => {
            // Podría abrir un modal o navegar a nueva pantalla de escaneo
            console.log('Nuevo Chequeo Manual');
          }}
        >
          <Feather name="plus" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.btnTextBold}>Checar Unidad</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <Feather name="search" size={16} color="#64748b" style={styles.filterIcon} />
        <TextInput 
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar ECO..."
          placeholderTextColor="#475569"
          keyboardType="numeric"
        />
      </View>

      <FlatList
        data={MOCK_CHEQUEOS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#000000', letterSpacing: -0.5 },
  btnNuevo: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#006847', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 8 
  },
  btnTextBold: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  
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
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    borderWidth: 1, 
    borderColor: '#D9D2C2' 
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000000' },
  cardSubtitle: { fontSize: 13, color: '#4A4A4A', paddingLeft: 16 },
  
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 15 },
  iconBtn: { padding: 8, backgroundColor: '#F5F5DC', borderRadius: 6, borderWidth: 1, borderColor: '#D9D2C2' },
});
