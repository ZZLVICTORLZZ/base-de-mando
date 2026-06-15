import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/services/supabaseClient';

export default function NuevoRolScreen() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [templates, setTemplates] = useState<{ id: string, name: string, rows: any[] }[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('plantillas_predeterminadas').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.title}>Crear Nuevo Rol</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Selecciona la plantilla base</Text>
        
        <View style={styles.grid}>
          {loading ? (
            <Text style={{ color: '#94a3b8' }}>Cargando plantillas de la nube...</Text>
          ) : templates.length === 0 ? (
            <Text style={{ color: '#94a3b8' }}>No hay plantillas creadas. Ve a la Base de Mando Web para crear una.</Text>
          ) : (
            templates.map(tpl => {
              const isSelected = selectedTemplate === tpl.id;
              return (
                <TouchableOpacity 
                  key={tpl.id}
                  style={[styles.templateCard, isSelected && styles.templateCardSelected]}
                  onPress={() => setSelectedTemplate(tpl.id)}
                >
                  <Feather name="file-text" size={28} color={isSelected ? '#3b82f6' : '#64748b'} style={styles.templateIcon} />
                  <Text style={[styles.templateText, isSelected && styles.templateTextSelected]}>
                    {tpl.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fecha Operativa</Text>
          <TextInput 
            style={styles.input}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#475569"
            defaultValue="15/06/2026"
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnContinuar, !selectedTemplate && styles.btnContinuarDisabled]}
          disabled={!selectedTemplate}
          onPress={() => {
            if (selectedTemplate) {
              router.push({
                pathname: '/editor-rol',
                params: { plantilla_id: selectedTemplate }
              });
            }
          }}
        >
          <Text style={styles.btnContinuarText}>Llenar ECOs (Crear Rol)</Text>
          <Feather name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
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
  sectionTitle: { fontSize: 14, color: '#94a3b8', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 30 },
  templateCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative'
  },
  templateCardSelected: { borderColor: '#3b82f6', backgroundColor: '#0f172a' },
  templateIcon: { marginBottom: 12 },
  templateText: { color: '#cbd5e1', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  templateTextSelected: { color: '#38bdf8', fontWeight: 'bold' },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: '500' },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 15,
    color: '#f8fafc',
    fontSize: 16
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a'
  },
  btnContinuar: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12
  },
  btnContinuarDisabled: { backgroundColor: '#334155', opacity: 0.7 },
  btnContinuarText: { color: '#ffffff', fontSize: 16, fontWeight: '600' }
});
