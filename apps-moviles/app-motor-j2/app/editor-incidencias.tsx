import React, { useState, useEffect, useRef } from 'react';
import { useTheme, shareCapturedReportImage } from '../src/theme/ThemeContext';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView, Alert, Image, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { supabase } from '../src/services/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIPOS_INCIDENCIA = [
  'Incorporación',
  'Falla Mecánica',
  'Retraso',
  'Pérdida de Turno',
  'Sustitución',
  'Desenrolado',
  'Otro'
];

export default function EditorIncidenciasScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { id } = useLocalSearchParams();
  const [hoja, setHoja] = useState<any>(null);
  const [incidencias, setIncidencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [eco, setEco] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  const [ecoModalVisible, setEcoModalVisible] = useState(false);
  const [searchEco, setSearchEco] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const formatTime = (isoStr: string) => {
    if (!isoStr) return '--:--';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const viewShotRef = useRef<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [userName, setUserName] = useState('Tablerista');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserName(session.user.email.split('@')[0]);
      }
    };
    fetchUser();
    if (id) {
      fetchHojaDetails();
      fetchIncidencias();
      fetchUnidades();
    }
  }, [id]);

  const fetchHojaDetails = async () => {
    const { data } = await supabase.from('hojas_incidencias').select('*').eq('id', id).single();
    if (data) setHoja(data);
  };

  const fetchIncidencias = async () => {
    setLoading(true);
    const { data } = await supabase.from('incidencias').select('*').eq('hoja_id', id).order('created_at', { ascending: true });
    if (data) setIncidencias(data);
    setLoading(false);
  };

  const fetchUnidades = async () => {
    const { data } = await supabase.from('unidades').select('numero, tipo').eq('activo', true);
    if (data) setUnidades(data.sort((a, b) => parseInt(a.numero) - parseInt(b.numero)));
  };

  const handleSaveReporte = async () => {
    if (!eco || !tipo) {
      Alert.alert('Faltan Datos', 'Selecciona económico y tipo.');
      return;
    }
    setSaving(true);
    const currentUser = await AsyncStorage.getItem('apolo11_user_name') || 'Tablerista';
    
    if (editingId) {
      const { data, error } = await supabase.from('incidencias').update({
        eco,
        tipo,
        descripcion,
        reportado_por: currentUser
      }).eq('id', editingId).select();

      setSaving(false);
      if (!error && data) {
        setIncidencias(incidencias.map(i => i.id === editingId ? data[0] : i));
        setModalVisible(false);
        setEditingId(null);
        setEco('');
        setTipo('');
        setDescripcion('');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el reporte.');
      }
    } else {
      const { data, error } = await supabase.from('incidencias').insert([{
        hoja_id: id,
        eco,
        tipo,
        descripcion,
        reportado_por: currentUser,
        fecha: hoja?.fecha,
        estado: 'Pendiente'
      }]).select();

      setSaving(false);
      if (!error && data) {
        setIncidencias([...incidencias, data[0]]);
        setModalVisible(false);
        setEco('');
        setTipo('');
        setDescripcion('');
      } else {
        Alert.alert('Error', 'No se pudo guardar el reporte.');
      }
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEco(item.eco);
    setTipo(item.tipo);
    setDescripcion(item.descripcion || '');
    setModalVisible(true);
  };

  const handleDelete = (incidenciaId: string) => {
    Alert.alert('Confirmar', '¿Eliminar este reporte?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('incidencias').delete().eq('id', incidenciaId);
        if (!error) {
          setIncidencias(incidencias.filter(i => i.id !== incidenciaId));
        }
      }}
    ]);
  };

  const handleExport = async () => {
    const webPayload = {
      type: 'INCIDENCIAS' as const,
      title: 'REPORTE DE INCIDENCIAS',
      baseName: hoja?.base || '',
      tablerista: userName,
      fechaStr: hoja?.fecha || new Date().toLocaleDateString('es-MX'),
      baseColor: theme.primary,
      incidencias: (incidencias || []).map((inc) => ({
        hora: formatTime(inc.created_at),
        eco: inc.eco || '-',
        tipo: inc.tipo || '',
        descripcion: inc.descripcion || '---',
      })),
    };

    if (Platform.OS === 'web') {
      await shareCapturedReportImage('', 'Compartir Hoja de Incidencias', webPayload);
      return;
    }

    setIsExporting(true);
    setTimeout(async () => {
      if (!viewShotRef.current) {
        setIsExporting(false);
        return;
      }
      try {
        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 0.95,
          result: 'tmpfile',
          useRenderInContext: true,
        });
        setIsExporting(false);
        await shareCapturedReportImage(uri, 'Compartir Hoja de Incidencias');
      } catch (error) {
        setIsExporting(false);
        Alert.alert('Error', 'No se pudo generar la imagen.');
      }
    }, 600);
  };

  if (loading && !hoja) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#38bdf8" style={{marginTop: 50}} /></View>;
  }

  return (
    <View style={styles.container}>
      {isExporting ? (
        <ScrollView horizontal style={{ flex: 1 }}>
          <ScrollView>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95, result: 'tmpfile', useRenderInContext: true }}>
            <View style={{ backgroundColor: '#FFFFFF', padding: 30, width: 900 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 3, borderBottomColor: theme.primary, paddingBottom: 15, marginBottom: 20 }}>
                <View style={{ width: 60, height: 60, backgroundColor: theme.primary, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                  <Text style={{ color: '#FDF8ED', fontWeight: 'bold', fontSize: 10, textAlign: 'center' }}>WITCH{'\n'}LOGO</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 26, fontWeight: '900', textTransform: 'uppercase' }}>
                    Reporte de Incidencias
                  </Text>
                  <Text style={{ color: theme.primary, fontSize: 18, fontWeight: '700' }}>
                    Base: {hoja?.base}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>Usuario: {userName}</Text>
                  <Text style={{ color: '#000', fontSize: 16 }}>Fecha: {hoja?.fecha}</Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', backgroundColor: '#88D8C0', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: theme.text }}>
                <Text style={{ flex: 0.5, fontSize: 16, fontWeight: 'bold', color: '#000', textAlign: 'center' }}>HORA</Text>
                <Text style={{ flex: 0.5, fontSize: 16, fontWeight: 'bold', color: '#000', textAlign: 'center' }}>ECO</Text>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: 'bold', color: '#000' }}>TIPO DE INCIDENCIA</Text>
                <Text style={{ flex: 2, fontSize: 16, fontWeight: 'bold', color: '#000' }}>DESCRIPCIÓN</Text>
              </View>

              {incidencias.length === 0 ? (
                <Text style={{ textAlign: 'center', padding: 20, color: '#000', fontStyle: 'italic' }}>Sin incidencias reportadas en este día.</Text>
              ) : (
                incidencias.map((item, index) => (
                  <View key={item.id} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 15 }}>
                    <Text style={{ flex: 0.5, fontSize: 18, color: '#000', textAlign: 'center' }}>{formatTime(item.created_at)}</Text>
                    <Text style={{ flex: 0.5, fontSize: 18, fontWeight: 'bold', color: '#000', textAlign: 'center' }}>{item.eco}</Text>
                    <Text style={{ flex: 1, fontSize: 18, fontWeight: 'bold', color: '#000' }}>{item.tipo}</Text>
                    <Text style={{ flex: 2, fontSize: 18, color: '#000' }}>{item.descripcion || '---'}</Text>
                  </View>
                ))
              )}
              <Text style={{ textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 14 }}>Apolo 11 - Documento Generado Automáticamente</Text>
            </View>
          </ViewShot>
          </ScrollView>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="#000000" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Hoja de Incidencias</Text>
              <Text style={styles.subtitle}>{hoja?.base} • {hoja?.fecha}</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.bigExportBtn} onPress={handleExport}>
              <Feather name="share-2" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.bigExportBtnText}>Exportar a WhatsApp</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 0.5, textAlign: 'center' }]}>Hora</Text>
            <Text style={[styles.th, { flex: 0.5 }]}>ECO</Text>
            <Text style={[styles.th, { flex: 1 }]}>Tipo</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Descripción</Text>
            <Text style={[styles.th, { flex: 0.6, textAlign: 'center' }]}>Acciones</Text>
          </View>

          <FlatList
            data={incidencias}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={[styles.td, { flex: 0.5, textAlign: 'center', fontSize: 12, color: theme.textMuted }]}>{formatTime(item.created_at)}</Text>
                <Text style={[styles.td, { flex: 0.5, fontWeight: 'bold' }]}>{item.eco}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{item.tipo}</Text>
                <Text style={[styles.td, { flex: 1.5, color: theme.textMuted }]} numberOfLines={2}>{item.descripcion || '---'}</Text>
                <View style={{ flex: 0.6, flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                  <TouchableOpacity onPress={() => handleEdit(item)}>
                    <Feather name="edit-2" size={18} color="#10b981" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Feather name="trash-2" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar Reporte' : 'Agregar Reporte'}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setEditingId(null); setEco(''); setTipo(''); setDescripcion(''); }}>
                <Feather name="x" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Número Económico</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setEcoModalVisible(true)}>
              <Text style={{ color: eco ? theme.text : theme.textMuted }}>{eco || 'Seleccionar ECO'}</Text>
              <Feather name="chevron-down" size={20} color="#000000" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ marginTop: 8, padding: 10, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }} 
              onPress={() => setEco('NOTA')}
            >
               <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>+ Agregar Nota General</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Tipo de Incidencia</Text>
            <View style={styles.typesGrid}>
              {TIPOS_INCIDENCIA.map((t) => (
                <TouchableOpacity 
                  key={t}
                  style={[styles.typeBtn, tipo === t && styles.typeBtnActive]}
                  onPress={() => setTipo(t)}
                >
                  <Text style={[styles.typeBtnText, tipo === t && styles.typeBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Descripción (Opcional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Detalles de la incidencia..."
              placeholderTextColor="#64748b"
              multiline
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReporte} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingId ? 'Actualizar Reporte' : 'Guardar Reporte'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={ecoModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { flex: 0.8 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Unidad (ECO)</Text>
              <TouchableOpacity onPress={() => setEcoModalVisible(false)}>
                <Feather name="x" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar económico..."
              placeholderTextColor="#4A4A4A"
              keyboardType="number-pad"
              value={searchEco}
              onChangeText={setSearchEco}
            />
            <ScrollView style={{ marginTop: 10 }}>
              {unidades.filter(u => (u.numero?.toString() || '').includes(searchEco)).map(item => (
                <TouchableOpacity 
                  key={item.numero?.toString() || Math.random().toString()} 
                  style={styles.ecoItem} 
                  onPress={() => { setEco(item.numero?.toString() || ''); setEcoModalVisible(false); setSearchEco(''); }}
                >
                  <Text style={styles.ecoItemText}>{item.numero} - {item.tipo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: '700', color: theme.text },
  subtitle: { fontSize: 14, color: theme.primary, marginTop: 2 },
  exportBtn: {
    backgroundColor: theme.primary,
    padding: 10,
    borderRadius: 8
  },
  actionsContainer: {
    padding: 15,
    backgroundColor: theme.background
  },
  bigExportBtn: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
  },
  bigExportBtnText: {
    color: theme.headerText,
    fontWeight: 'bold',
    fontSize: 16
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.background,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  th: { color: theme.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    alignItems: 'center',
    backgroundColor: theme.background
  },
  td: { color: theme.text, fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  label: { fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 8, marginTop: 15 },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.background,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  typeBtn: {
    backgroundColor: theme.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border
  },
  typeBtnActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary
  },
  typeBtnText: { color: theme.textMuted, fontSize: 13 },
  typeBtnTextActive: { color: theme.headerText, fontWeight: 'bold' },
  textArea: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 15,
    color: theme.text,
    height: 100,
    textAlignVertical: 'top'
  },
  saveBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25
  },
  saveBtnText: { color: theme.headerText, fontWeight: 'bold', fontSize: 16 },
  searchInput: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 15,
    color: theme.text,
    fontSize: 16
  },
  ecoItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  ecoItemText: { color: theme.text, fontSize: 16 }
});
}
