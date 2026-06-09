import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';

// Datos de prueba temporales para el UI
const dummyData = [
  { id: '1', nombre: 'Unidad 01', estado: 'trabajando' },
  { id: '2', nombre: 'Unidad 05', estado: 'faltó' },
  { id: '3', nombre: 'Unidad 12', estado: 'trabajando' },
];

export default function RolDelDiaScreen() {
  const [unidades, setUnidades] = useState(dummyData);

  const toggleEstado = (id: string) => {
    setUnidades(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, estado: u.estado === 'trabajando' ? 'faltó' : 'trabajando' };
      }
      return u;
    }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rol del Día en Vivo</Text>
      <Text style={styles.subHeader}>Estado de unidades de la base</Text>

      <FlatList
        data={unidades}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.unidadText}>{item.nombre}</Text>
            <TouchableOpacity 
              style={[styles.statusBadge, item.estado === 'trabajando' ? styles.statusGreen : styles.statusRed]}
              onPress={() => toggleEstado(item.id)}
            >
              <Text style={styles.statusText}>{item.estado.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subHeader: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  unidadText: { fontSize: 18, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusGreen: { backgroundColor: '#10b981' },
  statusRed: { backgroundColor: '#ef4444' },
  statusText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 }
});
