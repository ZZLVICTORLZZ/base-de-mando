import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [screen, setScreen] = useState('home'); // home, taquilla, checador

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
      const roleName = data.roles?.name;
      if (['Taquilla', 'Taquillero', 'Checador', 'Admin'].includes(roleName)) {
        setProfile(data);
      } else {
        Alert.alert('Acceso Denegado', 'Esta app es exclusiva para Taquilla y Checadores.');
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  };

  if (loading) return <View style={styles.center}><Text>Cargando Satélite...</Text></View>;
  if (!session || !profile) return <LoginScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Satélite Operativo</Text>
        <Text style={styles.headerSub}>{profile.nombre} - {profile.roles?.name}</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()} style={styles.logoutBtn}>
          <Text style={{color: 'white'}}>Salir</Text>
        </TouchableOpacity>
      </View>

      {screen === 'home' && (
        <View style={styles.content}>
          <Text style={{fontSize: 20, marginBottom: 20, textAlign: 'center', fontWeight: 'bold'}}>Selecciona el Módulo</Text>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#3b82f6' }]} onPress={() => setScreen('taquilla')}>
            <Text style={styles.cardTitle}>🎟️ Taquilla (Punto de Venta)</Text>
            <Text style={styles.cardDesc}>Venta de boletos por ruta.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.card, { backgroundColor: '#10b981' }]} onPress={() => setScreen('checador')}>
            <Text style={styles.cardTitle}>⏱️ Checador (Despegue)</Text>
            <Text style={styles.cardDesc}>Validar operador y registrar aforo.</Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'taquilla' && <TaquillaScreen onBack={() => setScreen('home')} />}
      {screen === 'checador' && <ChecadorScreen onBack={() => setScreen('home')} />}
    </SafeAreaView>
  );
}

// ==========================================
// LOGIN
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
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Satélite Operativo</Text>
      <TextInput style={styles.input} placeholder="Correo Electrónico" autoCapitalize="none" onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Contraseña" secureTextEntry onChangeText={setPassword} />
      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==========================================
// PANTALLA: TAQUILLA
// ==========================================
const TaquillaScreen = ({ onBack }: any) => {
  const [rutas, setRutas] = useState<any[]>([]);
  const [selectedRuta, setSelectedRuta] = useState<any>(null);
  const [precio, setPrecio] = useState('15');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('routes').select('*').then(({ data }) => {
      if (data) setRutas(data);
    });
  }, []);

  const handleVenta = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tickets').insert([{ monto: parseFloat(precio) }]).select().single();
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Éxito', `Boleto emitido. ID: ${data.id.slice(0,8)}`);
  };

  return (
    <View style={styles.content}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Punto de Venta</Text>
      
      <Text style={{ marginBottom: 5 }}>Seleccionar Ruta:</Text>
      <ScrollView style={{maxHeight: 150, marginBottom: 20}}>
        {rutas.map(r => (
          <TouchableOpacity 
            key={r.id} 
            style={[styles.rutaBtn, selectedRuta?.id === r.id && { borderColor: '#3b82f6', borderWidth: 2 }]}
            onPress={() => setSelectedRuta(r)}
          >
            <Text>{r.nombre}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={{ marginBottom: 5 }}>Precio del Boleto ($):</Text>
      <TextInput 
        style={[styles.input, { fontSize: 24, fontWeight: 'bold' }]} 
        keyboardType="numeric" 
        value={precio} 
        onChangeText={setPrecio} 
      />

      <TouchableOpacity style={[styles.btn, { padding: 20, backgroundColor: '#3b82f6', marginTop: 10 }]} onPress={handleVenta} disabled={!selectedRuta || loading}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>IMPRIMIR BOLETO</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={{ marginTop: 20, padding: 15 }} onPress={onBack}>
        <Text style={{ textAlign: 'center', color: '#666' }}>Volver al Menú</Text>
      </TouchableOpacity>
    </View>
  );
};

// ==========================================
// PANTALLA: CHECADOR
// ==========================================
const ChecadorScreen = ({ onBack }: any) => {
  const [nfcTag, setNfcTag] = useState('');
  const [operadorInfo, setOperadorInfo] = useState<any>(null);
  const [aforo, setAforo] = useState('');

  const buscarNFC = async () => {
    const { data } = await supabase.from('profiles').select('*, roles(name)').eq('nfc_tag', nfcTag).single();
    if (data) setOperadorInfo(data);
    else Alert.alert('No encontrado', 'Tag NFC no coincide con ningún operador.');
  };

  const despachar = () => {
    Alert.alert('Despachado', 'Unidad en ruta con ' + aforo + ' pasajeros.');
    setOperadorInfo(null);
    setNfcTag('');
    setAforo('');
  };

  return (
    <View style={styles.content}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Control de Despegue</Text>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <TextInput 
          style={[styles.input, { flex: 1, marginBottom: 0 }]} 
          placeholder="Simular Tag NFC" 
          value={nfcTag} 
          onChangeText={setNfcTag} 
        />
        <TouchableOpacity style={[styles.btn, { width: 100, marginBottom: 0 }]} onPress={buscarNFC}>
          <Text style={styles.btnText}>Verificar</Text>
        </TouchableOpacity>
      </View>

      {operadorInfo && (
        <View style={{ backgroundColor: '#e5e7eb', padding: 20, borderRadius: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{operadorInfo.nombre}</Text>
          <Text style={{ color: '#6b7280', marginBottom: 15 }}>{operadorInfo.roles?.name}</Text>
          
          <Text>Aforo Visual (Pasajeros):</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={aforo} onChangeText={setAforo} />

          <TouchableOpacity style={[styles.btn, { backgroundColor: '#10b981' }]} onPress={despachar}>
            <Text style={styles.btnText}>DAR SALIDA</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={{ marginTop: 30, padding: 15 }} onPress={onBack}>
        <Text style={{ textAlign: 'center', color: '#666' }}>Volver al Menú</Text>
      </TouchableOpacity>
    </View>
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
  btn: { width: '100%', padding: 15, backgroundColor: '#3b82f6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  rutaBtn: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' }
});
