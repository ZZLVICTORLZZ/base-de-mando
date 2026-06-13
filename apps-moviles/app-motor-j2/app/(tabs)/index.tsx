import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';

export default function DashboardScreen() {
  const [tableristaNombre, setTableristaNombre] = useState('Capitán');
  const [horasTrabajadas, setHorasTrabajadas] = useState('02:15');
  const [tablasCompletadas, setTablasCompletadas] = useState(5);
  const [pasajerosTotales, setPasajerosTotales] = useState(142);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.welcomeText}>Bienvenido,</Text>
        <Text style={styles.nameText}>{tableristaNombre}</Text>
      </View>

      <Text style={styles.sectionTitle}>Métricas en Tiempo Real</Text>

      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{horasTrabajadas}</Text>
          <Text style={styles.metricLabel}>Horas Trabajadas</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{tablasCompletadas}</Text>
          <Text style={styles.metricLabel}>Tablas (RD/OTP/CTR)</Text>
        </View>

        <View style={[styles.metricBox, styles.metricHighlight]}>
          <Text style={styles.metricValueHighlight}>{pasajerosTotales}</Text>
          <Text style={styles.metricLabelHighlight}>Pasajeros Transportados</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  headerCard: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  welcomeText: { fontSize: 16, color: '#94a3b8' },
  nameText: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#cbd5e1', marginBottom: 16 },
  metricsContainer: { gap: 16 },
  metricBox: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  metricValue: { fontSize: 32, fontWeight: 'bold', color: '#38bdf8' },
  metricLabel: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  metricHighlight: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4
  },
  metricValueHighlight: { fontSize: 40, fontWeight: 'bold', color: '#ffffff' },
  metricLabelHighlight: { fontSize: 14, color: '#e0e7ff', marginTop: 4, fontWeight: '500' },
});
