import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

// Datos Mock limpios sin el campo 'base'
const MOCK_HISTORIAL = [
  { id: '1', fecha: '12/06/2026', tipo: 'Entre semana', estatus: 'finalizado' },
  { id: '2', fecha: '13/06/2026', tipo: 'Sabatino', estatus: 'activa' },
  { id: '3', fecha: '14/06/2026', tipo: 'Dominical', estatus: 'pendiente' },
];

export default function RDScreen() {
  const [dateDesde, setDateDesde] = useState('01/06/2026');
  const [dateHasta, setDateHasta] = useState('15/06/2026');

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
          <Text style={styles.cardDate}>{item.fecha}</Text>
        </View>
        
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="eye" size={18} color="#94a3b8" />
          </TouchableOpacity>
          {item.estatus === 'activa' && (
            <TouchableOpacity style={styles.iconBtn}>
              <Feather name="edit-2" size={18} color="#10b981" />
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

      <FlatList
        data={MOCK_HISTORIAL}
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
    backgroundColor: '#3b82f6', 
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
