import React, { useState, useEffect } from 'react';
import { useTheme } from '../src/theme/ThemeContext';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/services/supabaseClient';

export default function NuevaTablaTREALScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseChequeo, setBaseChequeo] = useState<string | null>(null);

  const BASES = ['Nuevos Paseos', 'Lagos 2', 'Indios Verdes'];

  useEffect(() => {
    fetchActiveRoles();
  }, []);

  const fetchActiveRoles = async () => {
    setLoading(true);
    // Traer los roles oficiales más recientes para basar la tabla TREAL
    const { data, error } = await supabase
      .from('roles_del_dia')
      .select('*, plantillas_predeterminadas(name)')
      .ilike('creado_por', '[OTP]%')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!error && data) {
      setRoles(data);
    }
    setLoading(false);
  };

  const handleSelectRol = (rolId: string) => {
    router.push({ pathname: '/editor-treal', params: { source_rol_id: rolId, mode: 'create', base_chequeo: baseChequeo } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (baseChequeo) {
            setBaseChequeo(null);
          } else {
            router.back();
          }
        }}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Nueva Tabla TREAL</Text>
        <View style={{ width: 24 }} />
      </View>

      {!baseChequeo ? (
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
            ¿Desde dónde estás checando?
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 16, textAlign: 'center', marginBottom: 40 }}>
            Selecciona tu Base de Chequeo para iniciar la tabla TREAL.
          </Text>

          <View style={{ gap: 20 }}>
            {BASES.map(base => (
              <TouchableOpacity 
                key={base}
                style={styles.bigBaseBtn}
                onPress={() => setBaseChequeo(base)}
              >
                <Text style={styles.bigBaseBtnText}>{base}</Text>
                <Feather name="chevron-right" size={24} color={theme.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <>
          <View style={{ backgroundColor: theme.surface, padding: 15, marginHorizontal: 20, marginTop: 20, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>Base seleccionada:</Text>
              <Text style={{ color: theme.primary, fontSize: 18, fontWeight: 'bold' }}>{baseChequeo}</Text>
            </View>
            <TouchableOpacity onPress={() => setBaseChequeo(null)}>
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Cambiar</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: theme.textMuted, fontSize: 16, marginHorizontal: 20, marginTop: 20, marginBottom: 15 }}>
            Selecciona la Proyección de Servicio base (opcional):
          </Text>

          <TouchableOpacity 
            style={[styles.rolCard, { borderColor: '#8b5cf6', borderWidth: 2 }]}
            onPress={() => router.push({ pathname: '/editor-treal', params: { source_rol_id: 'empty', mode: 'create', base_chequeo: baseChequeo } })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="file-plus" size={24} color={theme.primary} style={{ marginRight: 12 }} />
              <View>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>
                  Iniciar Vacío
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>
                  Sin precargar ningún rol.
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color={theme.primary} />
          </TouchableOpacity>

          <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : roles.length === 0 ? (
          <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40 }}>No hay proyecciones OTP disponibles.</Text>
        ) : (
          roles.map(rol => (
            <TouchableOpacity 
              key={rol.id}
              style={styles.rolCard}
              onPress={() => handleSelectRol(rol.id)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', marginRight: 12 }} />
                <View>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>
                    {rol.plantillas_predeterminadas?.name || 'Rol Desconocido'}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>
                    Fecha: {rol.fecha} | Creado por: {rol.creado_por}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={24} color="#006847" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      </>
      )}
    </SafeAreaView>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  backBtn: { padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border },
  title: { fontSize: 20, fontWeight: '700', color: theme.text },
  rolCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border
  },
  bigBaseBtn: {
    backgroundColor: theme.surface,
    padding: 25,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bigBaseBtnText: {
    color: theme.text,
    fontSize: 20,
    fontWeight: 'bold'
  },
});
}
