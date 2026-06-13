import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';

export default function CTRScreen() {
  const [nfcInput, setNfcInput] = useState('');

  const handleSimulateNFC = () => {
    // Simulador: el usuario teclea el ECO y hace POST a la DB
    if (!nfcInput) return;
    console.log(`NFC Simulado: Unidad ${nfcInput} en ruta`);
    setNfcInput('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chequeo en Tiempo Real</Text>
        <Text style={styles.subtitle}>Esperando hardware NFC...</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.nfcBox}>
          <Text style={styles.nfcTitle}>Simulador NFC</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ingrese número ECO" 
            placeholderTextColor="#64748b"
            value={nfcInput}
            onChangeText={setNfcInput}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.btnSimulate} onPress={handleSimulateNFC}>
            <Text style={styles.btnText}>Simular Lectura Tarjeta</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.fabReporte}>
        <Text style={styles.fabText}>⚠️ Incidencia</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#38bdf8' },
  content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  nfcBox: { backgroundColor: '#1e293b', padding: 20, borderRadius: 12, width: '100%', borderWidth: 1, borderColor: '#334155' },
  nfcTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 15 },
  btnSimulate: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  fabReporte: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 30, elevation: 5 }
});
