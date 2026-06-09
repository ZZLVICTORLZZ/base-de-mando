import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';

export default function ReportesScreen() {
  const [incidencia, setIncidencia] = useState('');

  const handleEnviar = () => {
    if (!incidencia) {
      Alert.alert('Error', 'Describe la incidencia antes de enviar.');
      return;
    }
    // Lógica para guardar offline y sincronizar después
    Alert.alert('Reporte Guardado', 'La incidencia se sincronizará cuando haya conexión.');
    setIncidencia('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Reportes e Incidencias</Text>
      <Text style={styles.subHeader}>Registro de eventualidades en ruta</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Descripción de la Incidencia</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej. La unidad 05 presenta falla mecánica..." 
          multiline
          numberOfLines={4}
          value={incidencia}
          onChangeText={setIncidencia}
        />

        <TouchableOpacity style={styles.btn} onPress={handleEnviar}>
          <Text style={styles.btnText}>GUARDAR REPORTE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subHeader: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, elevation: 2 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  input: { 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 20,
    fontSize: 16,
    textAlignVertical: 'top'
  },
  btn: { 
    backgroundColor: '#ef4444', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
