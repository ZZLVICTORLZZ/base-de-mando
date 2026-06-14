import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NuevaIncidenciaScreen() {
  const [tipo, setTipo] = useState('');
  const [eco, setEco] = useState('');
  const [comentarios, setComentarios] = useState('');

  const tiposDisponibles = [
    'Falla Mecánica', 
    'Retraso Tráfico', 
    'Accidente Menor', 
    'Falta Operador', 
    'Otro'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.title}>Reportar Incidencia</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de Incidencia</Text>
          <View style={styles.chipsContainer}>
            {tiposDisponibles.map(t => (
              <TouchableOpacity 
                key={t}
                style={[styles.chip, tipo === t && styles.chipActive]}
                onPress={() => setTipo(t)}
              >
                <Text style={[styles.chipText, tipo === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número Económico (ECO)</Text>
          <TextInput 
            style={styles.input}
            placeholder="Ej. 101"
            placeholderTextColor="#475569"
            keyboardType="numeric"
            value={eco}
            onChangeText={setEco}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Comentarios Adicionales</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            placeholder="Describe la situación..."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={4}
            value={comentarios}
            onChangeText={setComentarios}
            textAlignVertical="top"
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnContinuar, (!tipo || !eco) && styles.btnContinuarDisabled]}
          disabled={!tipo || !eco}
          onPress={() => {
            router.back();
          }}
        >
          <Feather name="save" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnContinuarText}>Guardar Reporte</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: '#f8fafc' },
  
  content: { padding: 20 },
  
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 15,
    color: '#f8fafc',
    fontSize: 16
  },
  textArea: { height: 100 },

  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20
  },
  chipActive: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
  chipText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: '#ffffff', fontWeight: 'bold' },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a'
  },
  btnContinuar: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12
  },
  btnContinuarDisabled: { backgroundColor: '#334155', opacity: 0.7 },
  btnContinuarText: { color: '#ffffff', fontSize: 16, fontWeight: '600' }
});
