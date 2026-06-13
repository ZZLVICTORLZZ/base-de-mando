import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';

// Datos de prueba para el historial
const MOCK_HISTORIAL = [
  { id: '1', fecha: '2026-06-12', tipo: 'Entre semana', base: 'Nuevos Paseos', estatus: 'finalizado' },
  { id: '2', fecha: '2026-06-13', tipo: 'Sabatino', base: 'Indios Verdes', estatus: 'activa' },
];

export default function RDScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  const renderItem = ({ item }: any) => (
    <View style={styles.historyCard}>
      <View>
        <Text style={styles.historyTitle}>Rol {item.tipo}</Text>
        <Text style={styles.historySubtitle}>{item.fecha} - {item.base}</Text>
      </View>
      <View style={styles.actionsBox}>
        <TouchableOpacity style={[styles.btnAction, styles.btnVer]}><Text style={styles.btnText}>👁️ Ver</Text></TouchableOpacity>
        {item.estatus === 'activa' && (
          <TouchableOpacity style={[styles.btnAction, styles.btnEditar]}><Text style={styles.btnText}>✏️ Editar</Text></TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Roles (RD)</Text>
        <TouchableOpacity style={styles.btnNuevo} onPress={() => setModalVisible(true)}>
          <Text style={styles.btnTextBold}>+ Nuevo Rol</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_HISTORIAL}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
      />

      {/* MODAL NUEVO ROL */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Crear Nuevo Rol</Text>
            <Text style={styles.modalSubtitle}>Selecciona la plantilla base:</Text>

            <TouchableOpacity style={styles.templateBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.templateText}>📅 Entre semana</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.templateBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.templateText}>🎉 Sabatino</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.templateBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.templateText}>⛪ Dominical</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.templateBtn, { borderColor: '#3b82f6', borderWidth: 1 }]} onPress={() => setModalVisible(false)}>
              <Text style={styles.templateText}>📄 Desde cero (Blanco)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}>
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#334155' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
  btnNuevo: { backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnTextBold: { color: '#fff', fontWeight: 'bold' },
  historyCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#38bdf8', marginBottom: 4 },
  historySubtitle: { fontSize: 14, color: '#94a3b8' },
  actionsBox: { flexDirection: 'row', gap: 10 },
  btnAction: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnVer: { backgroundColor: '#334155' },
  btnEditar: { backgroundColor: '#059669' },
  btnText: { color: '#f8fafc', fontSize: 12, fontWeight: 'bold' },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#1e293b', width: '85%', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20 },
  templateBtn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 8, marginBottom: 12 },
  templateText: { color: '#f8fafc', fontSize: 16, fontWeight: '500' },
  btnCancelar: { marginTop: 10, padding: 12, alignItems: 'center' },
  btnCancelarText: { color: '#ef4444', fontWeight: 'bold' }
});
