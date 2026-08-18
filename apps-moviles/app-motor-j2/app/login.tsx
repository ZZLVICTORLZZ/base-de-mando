import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/services/supabaseClient';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {

    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      Alert.alert('Error', error.message);
      return;
    }

    if (data?.user) {
      const { data: profile, error: profErr } = await supabase.from('profiles').select('nombre, access_level').eq('id', data.user.id).single();
      if (profErr) console.warn('Error fetching profile:', profErr);
      
      if (profile && profile.access_level < 2) {
        await supabase.auth.signOut();
        setLoading(false);
        Alert.alert('Acceso Denegado', 'Tu nivel de acceso (Nivel 1) no permite ingresar a la App de Checadores (Requiere Nivel 2 o mayor).');
        return;
      }

      // Guardamos Solo el Username (Nombre ID) según solicitud del usuario
      let userName = 'Checador';
      if (profile?.nombre) {
        userName = profile.nombre;
      } else {
        userName = email.split('@')[0];
      }
      
      await AsyncStorage.setItem('apolo11_user_name', userName);
      await AsyncStorage.setItem('apolo11_user_level', profile?.access_level?.toString() || '0');
      await AsyncStorage.setItem('apolo11_user_uuid', data.user.id);
    }
    
    setLoading(false);
    router.replace('/(tabs)');
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
        <View style={styles.passwordContainer}>
          <TextInput 
            style={styles.passwordInput} 
            placeholder="Contraseña" 
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showPassword} 
            value={password}
            onChangeText={setPassword} 
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Text style={{ fontSize: 20 }}>{showPassword ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Cargando...' : 'Iniciar Sesión'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 30 }} onPress={handleCheckUpdates}>
          <Text style={{ color: '#006847', textDecorationLine: 'underline', fontWeight: 'bold' }}>¿Problemas? Buscar Actualizaciones Manualmente</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5DC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#4A4A4A', marginBottom: 30 },
  input: { 
    width: '100%', 
    padding: 15, 
    backgroundColor: '#FFFFFF', 
    color: '#000000',
    borderRadius: 12, 
    marginBottom: 15, 
    borderColor: '#D9D2C2' 
  },
  passwordContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D9D2C2',
    alignItems: 'center'
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    color: '#000000',
  },
  eyeBtn: {
    padding: 15,
  },
  btn: { 
    width: '100%', 
    padding: 18, 
    backgroundColor: '#006847', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#006847',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16, textTransform: 'uppercase' },
});
