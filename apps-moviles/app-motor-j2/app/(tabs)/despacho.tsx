import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';

export default function DespachoScreen() {
  const [nfcTag, setNfcTag] = useState('');
  const [aforo, setAforo] = useState('');

  const handleDespacho = () => {
    if (!nfcTag || !aforo) {
      Alert.alert('Faltan datos', 'Ingresa el tag NFC y el aforo visual.');
      return;
    }
    Alert.alert('Despacho Exitoso', `Unidad con tag ${nfcTag} despachada con ${aforo} pasajeros.`);
    setNfcTag('');
    setAforo('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Operación en Sitio</Text>
      <Text style={styles.subHeader}>Validación de despacho y aforo</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Simular Lector NFC (ID de Operador)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Acerca la tarjeta o teclea ID..." 
          value={nfcTag}
          onChangeText={setNfcTag}
        />

        <Text style={styles.label}>Aforo Visual (Pasajeros)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej. 15" 
          keyboardType="numeric"
          value={aforo}
          onChangeText={setAforo}
        />

        <TouchableOpacity style={styles.btn} onPress={handleDespacho}>
          <Text style={styles.btnText}>VALIDAR DESPACHO</Text>
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
    fontSize: 16
  },
  btn: { 
    backgroundColor: '#3b82f6', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
