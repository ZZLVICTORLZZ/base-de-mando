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
  const [loading, setLoading] = useState(true);

  // Motivational Stats (All-Time)
  const [totalPasajeros, setTotalPasajeros] = useState(0);
  const [totalDespachos, setTotalDespachos] = useState(0);
  const [diasTrabajados, setDiasTrabajados] = useState(0);
  const [recordDiario, setRecordDiario] = useState(0);
  
  // Rank system
  const getRango = (despachos: number) => {
    if (despachos < 100) return 'Novato de Base';
    if (despachos < 500) return 'Anotador Oficial';
    if (despachos < 1500) return 'Tablerista Experimentado';
    if (despachos < 5000) return 'Jefe de Despacho';
    if (despachos < 10000) return 'Comandante de Base';
    return 'Leyenda Saturno V';
  };

  const rangoActual = getRango(totalDespachos);

  // Progress to next rank
  const getNextRankTarget = (despachos: number) => {
    if (despachos < 100) return 100;
    if (despachos < 500) return 500;
    if (despachos < 1500) return 1500;
    if (despachos < 5000) return 5000;
    if (despachos < 10000) return 10000;
    return despachos; // Max rank
  };

  const nextTarget = getNextRankTarget(totalDespachos);
  const progressPercent = Math.min(100, Math.round((totalDespachos / nextTarget) * 100)) || 0;

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
      fetchHistoricalData();
    }, [])
  );

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      let name = await AsyncStorage.getItem('apolo11_user_name');
      if (!name) name = 'Checador';
      
      const cleanName = name.includes(' - ') ? name.split(' - ')[1].trim() : name.trim();
      const firstName = cleanName.split(' ')[0]; // Ej. "EMILIANO" de "EMILIANO R"
      setTableristaNombre(cleanName);

      const { data: roles, error } = await supabase
        .from('roles_del_dia')
        .select('fecha, rows')
        .ilike('creado_por', `%${firstName}%`);

      if (error) throw error;

      if (roles && roles.length > 0) {
        let pax = 0;
        let despachos = 0;
        const diasSet = new Set<string>();
        let maxRecord = 0;

        roles.forEach(rol => {
          diasSet.add(rol.fecha);
          
          let despachosTabla = 0;

          if (rol.rows && Array.isArray(rol.rows)) {
            rol.rows.forEach(row => {
              despachos += 1;
              despachosTabla += 1;

              const p = parseInt(row.pax);
              if (!isNaN(p)) {
                pax += p;
              }
            });
          }
          
          if (despachosTabla > maxRecord) {
            maxRecord = despachosTabla;
          }
        });

        setTotalPasajeros(pax);
        setTotalDespachos(despachos);
        setDiasTrabajados(diasSet.size);
        setRecordDiario(maxRecord);
      } else {
        setTotalPasajeros(0);
        setTotalDespachos(0);
        setDiasTrabajados(0);
        setRecordDiario(0);
      }

    } catch (e) {
      console.log('Error fetching historical data:', e);
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* HEADER HERO */}
      <View style={styles.headerHero}>
        <View style={styles.headerTop}>
          <Text style={styles.greetingText}>Expediente de Carrera</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.tableristaName}>{tableristaNombre}</Text>
        
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>🌟 {rangoActual}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#fff" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Nivel de Experiencia</Text>
              <Text style={styles.progressText}>{totalDespachos} / {nextTarget} despachos</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Tus Logros Históricos</Text>

      {/* METRIC: PASAJEROS (THE BIG ONE) */}
      <View style={[styles.metricBox, styles.metricHighlight]}>
        <Text style={styles.metricValueHighlight}>{totalPasajeros.toLocaleString('en-US')}</Text>
        <Text style={styles.metricLabelHighlight}>Pasajeros Movilizados Históricamente</Text>
        <Text style={styles.metricSubtext}>Gracias a ti, todas estas personas llegaron a su destino de manera coordinada y segura.</Text>
      </View>

      {/* METRICS: DESPACHOS Y DIAS */}
      <View style={styles.rowMetrics}>
        <View style={[styles.metricBox, { flex: 1 }]}>
          <Text style={styles.metricValue}>{totalDespachos.toLocaleString('en-US')}</Text>
          <Text style={styles.metricLabel}>Autobuses Despachados</Text>
        </View>
        
        <View style={[styles.metricBox, { flex: 1 }]}>
          <Text style={styles.metricValue}>{diasTrabajados}</Text>
          <Text style={styles.metricLabel}>Días en Servicio Activo</Text>
        </View>
      </View>

      {/* METRIC: RECORD PERSONAL */}
      <View style={[styles.metricBox, { marginTop: 16, borderLeftWidth: 6, borderLeftColor: '#FFD700' }]}>
        <Text style={[styles.metricValue, { color: '#B8860B', fontSize: 32 }]}>🏆 {recordDiario}</Text>
        <Text style={styles.metricLabel}>Tu Récord de Salidas (En una sola Tabla)</Text>
      </View>

      <TouchableOpacity 
        style={styles.updateBtn} 
        onPress={handleCheckUpdates}
      >
        <Text style={styles.updateBtnText}>Descargar Actualizaciones OTA</Text>
      </TouchableOpacity>
      
    </ScrollView>
  );
}

function getStyles(theme: any) { 
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 20, paddingTop: 10 },
    headerHero: {
      backgroundColor: theme.primary,
      borderRadius: 24,
      padding: 24,
      marginBottom: 24,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    greetingText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
    logoutBtn: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    tableristaName: { fontSize: 36, fontWeight: '900', color: theme.headerText, marginBottom: 12 },
    rankBadge: { 
      backgroundColor: '#FFD700', 
      alignSelf: 'flex-start', 
      paddingHorizontal: 12, 
      paddingVertical: 6, 
      borderRadius: 12,
      marginBottom: 24
    },
    rankText: { color: '#8B6508', fontWeight: '900', fontSize: 14 },
    progressContainer: { marginTop: 8 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
    
    sectionTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 16, marginLeft: 4 },
    rowMetrics: { flexDirection: 'row', gap: 16, marginTop: 16 },
    metricBox: {
      backgroundColor: theme.background,
      padding: 20,
      borderRadius: 16,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2
    },
    metricValue: { fontSize: 36, fontWeight: '900', color: theme.primary },
    metricLabel: { fontSize: 14, color: theme.textMuted, marginTop: 4, fontWeight: '600' },
    
    metricHighlight: {
      backgroundColor: '#0f172a',
      borderColor: '#0f172a',
    },
    metricValueHighlight: { fontSize: 48, fontWeight: '900', color: '#fff' },
    metricLabelHighlight: { fontSize: 16, color: '#94a3b8', marginTop: 4, fontWeight: '700' },
    metricSubtext: { fontSize: 13, color: '#64748b', marginTop: 8, fontStyle: 'italic' },
    
    updateBtn: { 
      marginTop: 32, 
      backgroundColor: 'transparent', 
      padding: 16, 
      borderRadius: 12, 
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.primary,
      borderStyle: 'dashed'
    },
    updateBtnText: { color: theme.primary, fontWeight: 'bold', fontSize: 15 }
  });
}
