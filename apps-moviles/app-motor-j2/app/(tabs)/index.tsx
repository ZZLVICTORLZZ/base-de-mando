import { useTheme } from '../../src/theme/ThemeContext';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/services/supabaseClient';
import { useFocusEffect, router } from 'expo-router';
import * as Updates from 'expo-updates';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [tableristaNombre, setTableristaNombre] = useState('Cargando...');
  const [horasTrabajadas, setHorasTrabajadas] = useState('00:00');
  const [tablasCompletadas, setTablasCompletadas] = useState(0);
  const [pasajerosTotales, setPasajerosTotales] = useState(0);
  const [promedioCorridas, setPromedioCorridas] = useState('0');
  const [loading, setLoading] = useState(true);
  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Salir', 
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            await AsyncStorage.multiRemove([
              'apolo11_user_name',
              'apolo11_user_level',
              'apolo11_user_uuid'
            ]);
            router.replace('/login');
          }
        }
      ]
    );
  };

  useFocusEffect(

    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Obtener nombre del usuario desde AsyncStorage
      let name = await AsyncStorage.getItem('apolo11_user_name');
      if (!name) name = 'Checador';
      setTableristaNombre(name.includes(' - ') ? name.split(' - ')[1] : name);

      // Obtener fecha actual en formato YYYY-MM-DD local
      const now = new Date();
      const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      const todayStr = localDate.toISOString().split('T')[0];

      // Consultar Supabase para Tablas del día
      const { data: roles } = await supabase
        .from('roles_del_dia')
        .select('*')
        .eq('fecha', todayStr)
        .ilike('creado_por', `%${name}%`);

      if (roles && roles.length > 0) {
        setTablasCompletadas(roles.length);
        
        let totalPax = 0;
        let totalTurnos = 0;

        roles.forEach(rol => {
          if (rol.rows && Array.isArray(rol.rows)) {
            rol.rows.forEach(row => {
              totalTurnos += 1;
              const pax = parseInt(row.pax);
              if (!isNaN(pax)) {
                totalPax += pax;
              }
            });
          }
        });

        setPasajerosTotales(totalPax);

        // Aproximar horas trabajadas: asumiendo 1 hora por cada 15 turnos registrados (esto es una métrica simulada basada en la carga de trabajo).
        const hours = Math.floor(totalTurnos / 15);
        const mins = (totalTurnos % 15) * 4;
        setHorasTrabajadas(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
        
        // Corridas Promedio (Turnos / Tablas)
        setPromedioCorridas(roles.length > 0 ? (totalTurnos / roles.length).toFixed(1) : '0');
        
      } else {
        setTablasCompletadas(0);
        setPasajerosTotales(0);
        setHorasTrabajadas('00:00');
        setPromedioCorridas('0');
      }

    } catch (e) {
      console.log('Error fetching dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUpdates = async () => {
    try {
      Alert.alert('Buscando...', 'Comprobando si hay actualizaciones en el servidor.');
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert('¡Actualización Encontrada!', 'Descargando e instalando... la app se reiniciará sola en unos segundos.');
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } else {
        Alert.alert('Al Día', 'Ya tienes la versión más reciente instalada.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo buscar actualizaciones: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
            <View style={[styles.headerCard, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View>
          <Text style={styles.welcomeText}>Bienvenido,</Text>
          <Text style={styles.nameText}>{tableristaNombre}</Text>
        </View>
        <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }} onPress={handleLogout}>
          <Text style={{ color: theme?.headerText || '#fff', fontWeight: 'bold' }}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Métricas de Hoy</Text>
        {loading && <ActivityIndicator size="small" color="#006847" />}
      </View>

      <View style={styles.metricsContainer}>
        
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={[styles.metricBox, { flex: 1 }]}>
            <Text style={styles.metricValue}>{tablasCompletadas}</Text>
            <Text style={styles.metricLabel}>Tablas (RD/OTP)</Text>
          </View>
          
          <View style={[styles.metricBox, { flex: 1 }]}>
            <Text style={styles.metricValue}>{promedioCorridas}</Text>
            <Text style={styles.metricLabel}>Horas Trabajadas</Text>
          </View>
        </View>

        <View style={[styles.metricBox, styles.metricHighlight]}>
          <Text style={styles.metricValueHighlight}>{pasajerosTotales}</Text>
          <Text style={styles.metricLabelHighlight}>Pasajeros Totales (Hoy)</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
          <View style={[styles.metricBox, { flex: 1, backgroundColor: '#EAEAD2', borderColor: '#C8C8B4' }]}>
            <Text style={[styles.metricValue, { color: '#737365' }]}>--</Text>
            <Text style={[styles.metricLabel, { color: '#737365' }]}>Unidades Activas (F1 - Pendiente)</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={{ marginTop: 30, backgroundColor: theme.primary, padding: 15, borderRadius: 12, alignItems: 'center' }} 
          onPress={handleCheckUpdates}
        >
          <Text style={{ color: theme.headerText, fontWeight: 'bold', fontSize: 16 }}>Descargar Actualizaciones OTA</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20 },
  headerCard: {
    backgroundColor: theme.background,
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    borderWidth: 1,
    borderColor: theme.border
  },
  welcomeText: { fontSize: 16, color: theme.textMuted },
  nameText: { fontSize: 28, fontWeight: 'bold', color: theme.text, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.text },
  metricsContainer: { gap: 16 },
  metricBox: {
    backgroundColor: theme.background,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border
  },
  metricValue: { fontSize: 32, fontWeight: 'bold', color: theme.primary },
  metricLabel: { fontSize: 14, color: theme.textMuted, marginTop: 4 },
  metricHighlight: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
    shadowColor: theme.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4
  },
  metricValueHighlight: { fontSize: 40, fontWeight: 'bold', color: theme.headerText },
  metricLabelHighlight: { fontSize: 14, color: '#e0e7ff', marginTop: 4, fontWeight: '500' },
});
}
