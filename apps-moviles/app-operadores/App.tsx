import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Alert, ScrollView, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [screen, setScreen] = useState('home'); // home, registro_vuelta, cierre

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*, roles(name)').eq('id', userId).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  if (loading) return <View style={styles.center}><Text>Cargando Motor F1...</Text></View>;
  if (!session || !profile) return <LoginScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MOTOR F1</Text>
        <Text style={styles.headerSub}>{profile.nombre}</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()} style={styles.logoutBtn}>
          <Text style={{color: 'white'}}>Salir</Text>
        </TouchableOpacity>
      </View>

      {screen === 'home' && <DashboardScreen profile={profile} onNavigate={setScreen} />}
      {screen === 'registro_vuelta' && <RegistroVueltaScreen profile={profile} onBack={() => setScreen('home')} />}
      {screen === 'cierre' && <CierreScreen profile={profile} onBack={() => setScreen('home')} />}
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
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Motor F1 (Operadores)</Text>
      <TextInput style={styles.input} placeholder="Correo" autoCapitalize="none" onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry onChangeText={setPassword} />
      <TouchableOpacity style={styles.btn} onPress={handleLogin}><Text style={styles.btnText}>Entrar</Text></TouchableOpacity>
    </View>
  );
};

// ==========================================
// MÓDULO 1: DASHBOARD MOTIVACIONAL
// ==========================================
const DashboardScreen = ({ profile, onNavigate }: any) => {
  return (
    <View style={styles.content}>
      <Text style={{fontSize: 24, fontWeight: 'bold', marginBottom: 10}}>¡Qué tal, {profile.nombre}!</Text>
      <Text style={{fontSize: 16, color: '#666', marginBottom: 20}}>Es un gran día para mover a la ciudad.</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏆 Tus Logros Semanales</Text>
        <Text style={{color: 'white', fontSize: 16}}>Has completado 24 vueltas esta semana.</Text>
        <Text style={{color: '#a7f3d0', fontSize: 14, marginTop: 5}}>Tu mejor récord es de 30. ¡Tú puedes!</Text>
      </View>

      <TouchableOpacity style={[styles.card, {backgroundColor: '#3b82f6'}]} onPress={() => onNavigate('registro_vuelta')}>
        <Text style={styles.cardTitle}>🚌 Registrar Vuelta (Aforo)</Text>
        <Text style={{color: 'white'}}>Registra pasajeros, tarifa y alerta al monitorista.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, {backgroundColor: '#10b981'}]} onPress={() => onNavigate('cierre')}>
        <Text style={styles.cardTitle}>💰 Finanzas y Cierre</Text>
        <Text style={{color: 'white'}}>Cálculo de ingresos, cuenta final y WhatsApp.</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==========================================
// MÓDULO 2: REGISTRO DE VUELTA
// ==========================================
const RegistroVueltaScreen = ({ profile, onBack }: any) => {
  const [pasajeros, setPasajeros] = useState('');
  const [tarifa, setTarifa] = useState('15');
  const [tipo, setTipo] = useState('Normal');
  const [direccion, setDireccion] = useState('');

  const guardarVuelta = async () => {
    const vuelta = { operator_id: profile.id, pasajeros: parseInt(pasajeros), tarifa: parseFloat(tarifa), tipo_pasajero: tipo, direccion };
    
    // GUARDADO OFFLINE (AsyncStorage)
    const stored = await AsyncStorage.getItem('offline_trips');
    const trips = stored ? JSON.parse(stored) : [];
    trips.push(vuelta);
    await AsyncStorage.setItem('offline_trips', JSON.stringify(trips));

    // INTENTO DE SUBIDA ONLINE (Si hay red)
    const { error } = await supabase.from('operator_trips').insert([vuelta]);
    
    if (error) {
      Alert.alert('Guardado Offline', 'No hay conexión. La vuelta se guardó en tu teléfono y se sincronizará luego.');
    } else {
      Alert.alert('Alerta Enviada', 'Vuelta registrada. Monitorista notificado del aforo.');
      // Limpiar queue offline si pasó
      await AsyncStorage.setItem('offline_trips', '[]');
    }

    setPasajeros('');
    setDireccion('');
  };

  return (
    <ScrollView style={styles.content}>
      <Text style={{fontSize: 22, fontWeight: 'bold', marginBottom: 20}}>Registro de Vuelta</Text>
      
      <TextInput style={styles.input} placeholder="Dirección / Destino" value={direccion} onChangeText={setDireccion} />
      <TextInput style={styles.input} placeholder="Cantidad de Pasajeros" keyboardType="numeric" value={pasajeros} onChangeText={setPasajeros} />
      <TextInput style={styles.input} placeholder="Tarifa Cobrada" keyboardType="numeric" value={tarifa} onChangeText={setTarifa} />
      <TextInput style={styles.input} placeholder="Tipo de Pasajero (Ej. Normal, Estudiante)" value={tipo} onChangeText={setTipo} />

      <TouchableOpacity style={styles.btn} onPress={guardarVuelta}>
        <Text style={styles.btnText}>GUARDAR VUELTA</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 20, padding: 15 }} onPress={onBack}>
        <Text style={{ textAlign: 'center', color: '#666' }}>Volver al Menú</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ==========================================
// MÓDULO 3: CIERRE Y FINANZAS
// ==========================================
const CierreScreen = ({ profile, onBack }: any) => {
  const [ingresoBruto, setIngresoBruto] = useState(0);
  const [gastos, setGastos] = useState('');
  const [descGasto, setDescGasto] = useState('');

  useEffect(() => {
    // En el mundo real se calcularía desde la DB leyendo las vueltas de hoy
    // Aquí lo simulamos cargando el historial offline
    AsyncStorage.getItem('offline_trips').then(data => {
      if (data) {
        const trips = JSON.parse(data);
        const sum = trips.reduce((acc: number, val: any) => acc + (val.pasajeros * val.tarifa), 0);
        setIngresoBruto(sum);
      }
    });
  }, []);

  const totalGastos = parseFloat(gastos || '0');
  const cuentaUnidad = ingresoBruto - totalGastos;

  const cerrarDia = async () => {
    // Insert a DB de cierre
    await supabase.from('operator_closures').insert([{
      operator_id: profile.id, ingreso_bruto: ingresoBruto, gastos_totales: totalGastos, cuenta_unidad: cuentaUnidad
    }]);

    const msg = `Cierre de Turno - ${profile.nombre}\nIngreso Bruto: $${ingresoBruto}\nGastos: $${totalGastos}\nCuenta Unidad: $${cuentaUnidad}`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`);
  };

  return (
    <ScrollView style={styles.content}>
      <Text style={{fontSize: 22, fontWeight: 'bold', marginBottom: 20}}>Liquidación del Día</Text>

      <View style={{backgroundColor: '#e5e7eb', padding: 20, borderRadius: 10, marginBottom: 20}}>
        <Text style={{fontSize: 16, color: '#666'}}>Ingreso Bruto Calculado</Text>
        <Text style={{fontSize: 32, fontWeight: 'bold', color: '#10b981'}}>${ingresoBruto.toFixed(2)}</Text>
      </View>

      <Text style={{fontWeight: 'bold', marginBottom: 5}}>Registrar Gastos (Combustible, Caseta)</Text>
      <TextInput style={styles.input} placeholder="Descripción del gasto..." value={descGasto} onChangeText={setDescGasto} />
      <TextInput style={styles.input} placeholder="Monto Total Gastos ($)" keyboardType="numeric" value={gastos} onChangeText={setGastos} />

      <View style={{backgroundColor: '#1f2937', padding: 20, borderRadius: 10, marginBottom: 20}}>
        <Text style={{fontSize: 16, color: '#9ca3af'}}>Cuenta Restante para Unidad</Text>
        <Text style={{fontSize: 32, fontWeight: 'bold', color: '#fff'}}>${cuentaUnidad.toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={[styles.btn, {backgroundColor: '#10b981'}]} onPress={cerrarDia}>
        <Text style={styles.btnText}>CERRAR TURNO Y COMPARTIR WA</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 20, padding: 15 }} onPress={onBack}>
        <Text style={{ textAlign: 'center', color: '#666' }}>Volver al Menú</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ESTILOS
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, backgroundColor: '#111827', paddingTop: 50 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#9ca3af', fontSize: 14 },
  logoutBtn: { position: 'absolute', right: 20, top: 60, padding: 5 },
  content: { padding: 20, flex: 1 },
  card: { padding: 20, borderRadius: 12, marginBottom: 15, backgroundColor: '#1f2937' },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  input: { width: '100%', padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb' },
  btn: { width: '100%', padding: 15, backgroundColor: '#3b82f6', borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
