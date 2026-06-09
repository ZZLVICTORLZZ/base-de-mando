import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';

const dummyCola = [
  { id: '1', nombre: 'Unidad 01', estado: 'LISTO', color: '#10b981' },
  { id: '2', nombre: 'Unidad 12', estado: 'LISTO', color: '#10b981' },
  { id: '3', nombre: 'Unidad 05', estado: 'AVERIADO', color: '#ef4444' },
];

export default function TablaDelDiaScreen() {
  const [cola, setCola] = useState(dummyCola);

  // Marcatextos digital: cambia el color/estado
  const aplicarMarcatextos = (id: string) => {
    setCola(prev => prev.map(u => {
      if (u.id === id) {
        return { 
          ...u, 
          estado: u.estado === 'LISTO' ? 'AVERIADO' : 'LISTO',
          color: u.estado === 'LISTO' ? '#ef4444' : '#10b981' 
        };
      }
      return u;
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Tabla del Día</Text>
      <Text style={styles.subHeader}>Cola operativa (Marcatextos Digital)</Text>
      
      {cola.map((item, index) => (
        <TouchableOpacity 
          key={item.id} 
          style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 6 }]}
          onPress={() => aplicarMarcatextos(item.id)}
        >
          <View>
            <Text style={styles.posText}>Turno #{index + 1}</Text>
            <Text style={styles.unidadText}>{item.nombre}</Text>
          </View>
          <Text style={[styles.statusText, { color: item.color }]}>{item.estado}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subHeader: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  posText: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  unidadText: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  statusText: { fontWeight: 'bold', fontSize: 14 }
});
