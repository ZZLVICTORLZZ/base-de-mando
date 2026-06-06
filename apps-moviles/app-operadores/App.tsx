import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Pantallas: 'home', 'asistencia', 'checklist'
  const [screen, setScreen] = useState('home');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*, roles(name)').eq('id', userId).single();
    if (data) {
      // Verificar que sea operador o admin
      if (data.roles?.name === 'Operador' || data.roles?.name === 'Admin') {
        setProfile(data);
      } else {
        Alert.alert('Acceso Denegado', 'Esta app es exclusiva para Operadores.');
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  };

  if (loading) return <View style={styles.center}><Text>Cargando Apolo 11...</Text></View>;

  if (!session || !profile) return <LoginScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Apolo 11 - Operador</Text>
        <Text style={styles.headerSub}>{profile.nombre}</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()} style={styles.logoutBtn}>
          <Text style={{color: 'white'}}>Salir</Text>
        </TouchableOpacity>
      </View>

      {screen === 'home' && (
        <View style={styles.content}>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#3b82f6' }]} onPress={() => setScreen('asistencia')}>
            <Text style={styles.cardTitle}>Asistencia</Text>
            <Text style={styles.cardDesc}>Reportar tu estado para el día de mañana.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, { backgroundColor: '#10b981' }]} onPress={() => setScreen('checklist')}>
            <Text style={styles.cardTitle}>Recepción de Unidad</Text>
            <Text style={styles.cardDesc}>Checklist físico y reporte de daños.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, { backgroundColor: '#ef4444' }]} onPress={() => Alert.alert('Desvío', 'Geolocalización guardada.')}>
            <Text style={styles.cardTitle}>Reportar Desvío</Text>
            <Text style={styles.cardDesc}>Tráfico, Cierre, Manifestación.</Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'asistencia' && <AsistenciaScreen profile={profile} onBack={() => setScreen('home')} />}
      {screen === 'checklist' && <ChecklistScreen onBack={() => setScreen('home')} />}
    </SafeAreaView>
  );
}

// ==========================================
// PANTALLA: LOGIN
// ==========================================
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
  };

  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>App Operadores</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Correo Electrónico" 
        autoCapitalize="none" 
        onChangeText={setEmail} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Contraseña" 
        secureTextEntry 
        onChangeText={setPassword} 
      />
      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==========================================
// PANTALLA: ASISTENCIA
// ==========================================
const AsistenciaScreen = ({ profile, onBack }: any) => {
  const reportar = async (confirma: boolean) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    try {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          operator_id: profile.id,
          fecha: dateStr,
          confirma_asistencia: confirma,
          hora_confirmacion: new Date().toISOString()
        }, { onConflict: 'operator_id,fecha' });

      if (error) throw error;
      Alert.alert('Éxito', `Has reportado que ${confirma ? 'SÍ' : 'NO'} trabajas mañana.`);
      onBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.content}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        ¿Trabajas el día de mañana?
      </Text>
      <TouchableOpacity style={[styles.card, { backgroundColor: '#10b981' }]} onPress={() => reportar(true)}>
        <Text style={styles.cardTitle}>SÍ, Confirmo Asistencia</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.card, { backgroundColor: '#ef4444' }]} onPress={() => reportar(false)}>
        <Text style={styles.cardTitle}>NO, Pido Descanso</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 20, padding: 15 }} onPress={onBack}>
        <Text style={{ textAlign: 'center', color: '#666' }}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==========================================
// PANTALLA: CHECKLIST
// ==========================================
const ChecklistScreen = ({ onBack }: any) => {
  return (
    <ScrollView style={styles.content}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Revisión de Unidad</Text>
      <View style={{ backgroundColor: '#f3f4f6', padding: 15, borderRadius: 10, marginBottom: 15 }}>
        <Text style={{ fontWeight: 'bold' }}>1. Estado Exterior (Golpes, Rayones)</Text>
        <TouchableOpacity style={styles.photoBtn}><Text>📷 Tomar Foto</Text></TouchableOpacity>
      </View>
      <View style={{ backgroundColor: '#f3f4f6', padding: 15, borderRadius: 10, marginBottom: 15 }}>
        <Text style={{ fontWeight: 'bold' }}>2. Limpieza Interior</Text>
        <TouchableOpacity style={styles.photoBtn}><Text>📷 Tomar Foto</Text></TouchableOpacity>
      </View>
      <View style={{ backgroundColor: '#f3f4f6', padding: 15, borderRadius: 10, marginBottom: 15 }}>
        <Text style={{ fontWeight: 'bold' }}>3. Niveles (Agua, Aceite, Llantas)</Text>
        <TouchableOpacity style={styles.photoBtn}><Text>📷 Tomar Foto</Text></TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.btn} onPress={() => { Alert.alert('Guardado', 'Checklist enviado.'); onBack(); }}>
        <Text style={styles.btnText}>Enviar Reporte</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 20, padding: 15 }} onPress={onBack}>
        <Text style={{ textAlign: 'center', color: '#666' }}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ==========================================
// ESTILOS
// ==========================================
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, backgroundColor: '#111827', paddingTop: 50 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#9ca3af', fontSize: 14 },
  logoutBtn: { position: 'absolute', right: 20, top: 60, padding: 5 },
  content: { padding: 20, flex: 1 },
  card: { padding: 20, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  cardDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  input: { width: '100%', padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb' },
  btn: { width: '100%', padding: 15, backgroundColor: '#3b82f6', borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  photoBtn: { marginTop: 10, padding: 10, backgroundColor: '#e5e7eb', borderRadius: 8, alignItems: 'center' }
});
