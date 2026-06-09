import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { supabase } from '../src/services/supabaseClient';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Satélite Operativo J2</Text>
        <Text style={styles.subtitle}>Base de Mando - Checadores</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="Correo Electrónico" 
          placeholderTextColor="#9ca3af"
          autoCapitalize="none" 
          value={email}
          onChangeText={setEmail} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Contraseña" 
          placeholderTextColor="#9ca3af"
          secureTextEntry 
          value={password}
          onChangeText={setPassword} 
        />
        
        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Cargando...' : 'Iniciar Sesión'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#9ca3af', marginBottom: 30 },
  input: { 
    width: '100%', 
    padding: 15, 
    backgroundColor: '#1f2937', 
    color: 'white',
    borderRadius: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#374151' 
  },
  btn: { 
    width: '100%', 
    padding: 18, 
    backgroundColor: '#3b82f6', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 10
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
