import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/services/supabaseClient';

export default function EditorRolScreen() {
  const { plantilla_id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plantillaName, setPlantillaName] = useState('');
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (plantilla_id) {
      fetchPlantilla();
    }
  }, [plantilla_id]);

  const fetchPlantilla = async () => {
    const { data, error } = await supabase.from('plantillas_predeterminadas').select('*').eq('id', plantilla_id).single();
    if (!error && data) {
      setPlantillaName(data.name);
      setRows(data.rows || []);
    }
    setLoading(false);
  };

  const handleUpdateECO = (id: string, text: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, eco: text } : r));
  };

  const handleUpdateFrec = (id: string, text: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, frec: text } : r));
    // En el futuro podemos portar la lógica matemática aquí también
  };

  const handleRemoveRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1];
    const newRow = {
      id: Date.now().toString(),
      no: (lastRow?.no || 0) + 1,
      frec: '15',
      horario: '--:--', // Simple placeholder unless we implement auto-calc here too
      eco: ''
    };
    setRows([...rows, newRow]);
  };

  const handleSaveRol = async () => {
    setSaving(true);
    const newRol = {
      plantilla_base_id: plantilla_id,
      rows: rows,
      creado_por: 'Tablerista (Motor J2)',
      fecha: new Date().toISOString().split('T')[0] // Hoy
    };

    const { error } = await supabase.from('roles_del_dia').insert([newRol]);
    setSaving(false);

    if (error) {
      alert('Error al guardar el rol: ' + error.message);
    } else {
      alert('¡Rol de despegue guardado con éxito!');
      router.replace('/(tabs)/rd');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#94a3b8', marginTop: 10 }}>Descargando plantilla...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.title}>Editando Rol: {plantillaName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 0.5 }]}>NO.</Text>
        <Text style={[styles.th, { flex: 1 }]}>FREC.</Text>
        <Text style={[styles.th, { flex: 1.2 }]}>HORARIO</Text>
        <Text style={[styles.th, { flex: 1.5, color: '#3b82f6' }]}>ECO</Text>
        <Text style={[styles.th, { flex: 0.5 }]}></Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {rows.map((row) => (
          <View key={row.id} style={[styles.tableRow, row.highlightColor && { backgroundColor: `${row.highlightColor}33` }]}>
            <Text style={[styles.td, { flex: 0.5, fontWeight: 'bold' }]}>{row.no}</Text>
            
            <View style={{ flex: 1, paddingHorizontal: 4 }}>
              <TextInput 
                style={styles.inputCell}
                value={row.frec}
                onChangeText={(t) => handleUpdateFrec(row.id, t)}
              />
            </View>

            <Text style={[styles.td, { flex: 1.2 }]}>{row.horario}</Text>
            
            <View style={{ flex: 1.5, paddingHorizontal: 4 }}>
              <TextInput 
                style={[styles.inputCell, { borderColor: '#3b82f6', color: '#38bdf8', fontWeight: 'bold' }]}
                value={row.eco}
                onChangeText={(t) => handleUpdateECO(row.id, t)}
                placeholder="---"
                placeholderTextColor="#475569"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={{ flex: 0.5, alignItems: 'center' }} onPress={() => handleRemoveRow(row.id)}>
              <Feather name="trash-2" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.btnAddRow} onPress={handleAddRow}>
          <Feather name="plus" size={18} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', marginLeft: 8 }}>Añadir Turno Extra</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnGuardar, saving && { opacity: 0.7 }]}
          disabled={saving}
          onPress={handleSaveRol}
        >
          <Feather name="save" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnGuardarText}>{saving ? 'Guardando...' : 'Publicar Rol Oficial'}</Text>
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
  title: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
  
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  th: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  
  content: { padding: 10, paddingBottom: 40 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    borderRadius: 8
  },
  td: { color: '#f8fafc', fontSize: 14, textAlign: 'center' },
  
  inputCell: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    color: '#f8fafc',
    textAlign: 'center',
    paddingVertical: 6,
    fontSize: 14
  },

  btnAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    borderRadius: 8
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a'
  },
  btnGuardar: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12
  },
  btnGuardarText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
