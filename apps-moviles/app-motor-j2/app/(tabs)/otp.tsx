import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';

// Tipos base
type UnitRow = {
  id: string;
  no: number;
  frec: string | number; // 'I.F.' o minutos
  horario: string; // HH:mm
  eco: string;
  tipo: 'Camioneta' | 'Autobús';
  ruta: string;
};

// Datos Mock
const MOCK_RD_INITIAL: UnitRow[] = [
  { id: 'u1', no: 1, frec: 'I.F.', horario: '05:30', eco: '101', tipo: 'Camioneta', ruta: 'Nuevos Paseos' },
  { id: 'u2', no: 2, frec: 15, horario: '05:45', eco: '202', tipo: 'Autobús', ruta: 'Indios Verdes' },
  { id: 'u3', no: 3, frec: 15, horario: '06:00', eco: '303', tipo: 'Camioneta', ruta: 'Nuevos Paseos' },
  { id: 'u4', no: 4, frec: 20, horario: '06:20', eco: '404', tipo: 'Camioneta', ruta: 'Nuevos Paseos' },
];

export default function OTPScreen() {
  const [baseActiva, setBaseActiva] = useState<'Nuevos Paseos' | 'Indios Verdes'>('Nuevos Paseos');
  const [data, setData] = useState<UnitRow[]>([]);

  useEffect(() => {
    cargarTabla();
  }, [baseActiva]);

  const cargarTabla = () => {
    let filtered = [...MOCK_RD_INITIAL];
    filtered = filtered.filter(u => u.tipo !== 'Autobús');
    if (filtered.length > 0) {
      filtered[0].frec = 'I.F.';
      if (baseActiva === 'Indios Verdes') {
        filtered[0].horario = '05:30';
      }
    }
    setData(recalcularCascada(filtered));
  };

  const recalcularCascada = (list: UnitRow[]): UnitRow[] => {
    if (list.length === 0) return list;
    const newList = [...list];
    let currentTotalMinutes = timeToMinutes(newList[0].horario);
    
    for (let i = 0; i < newList.length; i++) {
      newList[i].no = i + 1;
      if (i === 0) {
        newList[i].frec = 'I.F.';
      } else {
        let freqVal = typeof newList[i].frec === 'number' ? (newList[i].frec as number) : 15;
        newList[i].frec = freqVal;
        currentTotalMinutes += freqVal;
        newList[i].horario = minutesToTime(currentTotalMinutes);
      }
    }
    return newList;
  };

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
  };

  const minutesToTime = (totalMins: number) => {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === data.length - 1) return;
    
    const newData = [...data];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newData[index];
    newData[index] = newData[swapIndex];
    newData[swapIndex] = temp;
    
    setData(recalcularCascada(newData));
  };

  const updateFrecuencia = (index: number, newFrec: string) => {
    const val = parseInt(newFrec, 10);
    if (isNaN(val)) return;
    const copy = [...data];
    copy[index].frec = val;
    setData(recalcularCascada(copy));
  };

  const renderItem = ({ item, index }: { item: UnitRow, index: number }) => (
    <View style={styles.row}>
      <View style={styles.arrowsBox}>
        <TouchableOpacity onPress={() => moveRow(index, 'up')} disabled={index === 0}>
          <Text style={[styles.arrowBtn, index === 0 && {opacity: 0.2}]}>▲</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => moveRow(index, 'down')} disabled={index === data.length - 1}>
          <Text style={[styles.arrowBtn, index === data.length - 1 && {opacity: 0.2}]}>▼</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.cell, { width: 30 }]}>{item.no}</Text>
      <View style={[styles.cell, { width: 60 }]}>
         {index === 0 ? (
           <Text style={styles.textWhite}>{item.frec}</Text>
         ) : (
           <TextInput 
             style={styles.frecInput}
             keyboardType="numeric"
             defaultValue={item.frec.toString()}
             onEndEditing={(e) => updateFrecuencia(index, e.nativeEvent.text)}
           />
         )}
      </View>
      <Text style={[styles.cell, { width: 70, fontWeight: 'bold', color: '#38bdf8' }]}>{item.horario}</Text>
      <Text style={[styles.cell, { width: 50 }]}>{item.eco}</Text>
      <Text style={[styles.cell, { flex: 1 }]} numberOfLines={1}>{item.ruta}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Proyección OTP (Vuelta 2)</Text>
        <View style={styles.filters}>
          <TouchableOpacity 
            style={[styles.btnBase, baseActiva === 'Nuevos Paseos' && styles.btnBaseActive]}
            onPress={() => setBaseActiva('Nuevos Paseos')}
          >
            <Text style={styles.btnBaseText}>Nuevos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btnBase, baseActiva === 'Indios Verdes' && styles.btnBaseActive]}
            onPress={() => setBaseActiva('Indios Verdes')}
          >
            <Text style={styles.btnBaseText}>Indios</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.th, { width: 40 }]}>ORD</Text>
        <Text style={[styles.th, { width: 30 }]}>NO</Text>
        <Text style={[styles.th, { width: 60 }]}>FREC</Text>
        <Text style={[styles.th, { width: 70 }]}>HORA</Text>
        <Text style={[styles.th, { width: 50 }]}>ECO</Text>
        <Text style={[styles.th, { flex: 1 }]}>RUTA</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#334155' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 10 },
  filters: { flexDirection: 'row', gap: 10 },
  btnBase: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  btnBaseActive: { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
  btnBaseText: { color: '#f8fafc', fontWeight: 'bold' },
  
  tableHeader: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#0f172a', borderBottomWidth: 2, borderBottomColor: '#38bdf8' },
  th: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  
  row: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155', alignItems: 'center' },
  cell: { color: '#f8fafc', fontSize: 13 },
  textWhite: { color: '#f8fafc' },
  frecInput: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 4, borderRadius: 4, borderWidth: 1, borderColor: '#38bdf8', textAlign: 'center' },
  
  arrowsBox: { width: 40, alignItems: 'center', justifyContent: 'center' },
  arrowBtn: { color: '#38bdf8', fontSize: 18, fontWeight: 'bold', padding: 2 }
});
