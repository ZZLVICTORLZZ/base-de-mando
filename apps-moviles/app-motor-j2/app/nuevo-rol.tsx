import React, { useState } from 'react';
import { useTheme } from '../src/theme/ThemeContext';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/services/supabaseClient';

export default function NuevoRolScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Date Picker States
  const [dateStr, setDateStr] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calDay} />);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `${String(d).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
      const isSelected = dateStr === dateString;
      
      days.push(
        <TouchableOpacity 
          key={d} 
          style={[styles.calDay, isSelected && styles.calDaySelected]}
          onPress={() => {
            setDateStr(dateString);
            setCalendarVisible(false);
          }}
        >
          <Text style={[styles.calDayText, isSelected && { color: theme.headerText, fontWeight: 'bold' }]}>{d}</Text>
        </TouchableOpacity>
      );
    }

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calHeaderRow}>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}>
            <Feather name="chevron-left" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.calMonthText}>{monthNames[month]} {year}</Text>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}>
            <Feather name="chevron-right" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </View>
        <View style={styles.calWeekDaysRow}>
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(day => (
            <Text key={day} style={styles.calWeekDayText}>{day}</Text>
          ))}
        </View>
        <View style={styles.calGrid}>
          {days}
        </View>
      </View>
    );
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
          <TouchableOpacity 
            style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => setCalendarVisible(true)}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16 }}>{dateStr}</Text>
            <Feather name="calendar" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Modal visible={calendarVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: 'bold' }}>Selecciona una Fecha</Text>
                <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                  <Feather name="x" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              {renderCalendar()}
            </View>
          </View>
        </Modal>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btnContinuar, !selectedTemplate && styles.btnContinuarDisabled]}
          disabled={!selectedTemplate}
          onPress={() => {
            if (selectedTemplate) {
              router.push({
                pathname: '/editor-rol',
                params: { plantilla_id: selectedTemplate, fecha: dateStr }
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

function getStyles(theme: any) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: theme.text },
  
  content: { padding: 20 },
  sectionTitle: { fontSize: 14, color: theme.textMuted, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 30 },
  templateCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: theme.background,
    borderRadius: 16,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
    position: 'relative'
  },
  templateCardSelected: { borderColor: theme.primary, backgroundColor: theme.background },
  templateIcon: { marginBottom: 12 },
  templateText: { color: theme.textMuted, fontSize: 14, fontWeight: '500', textAlign: 'center' },
  templateTextSelected: { color: theme.primary, fontWeight: 'bold' },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: theme.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: '500' },
  input: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 15,
    color: theme.text,
    fontSize: 16
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.background
  },
  btnContinuar: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12
  },
  btnContinuarDisabled: { backgroundColor: '#334155', opacity: 0.7 },
  btnContinuarText: { color: theme.headerText, fontSize: 16, fontWeight: '600' },

  // Calendar styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20 },
  calendarContainer: { width: '100%' },
  calHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calMonthText: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold' },
  calWeekDaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  calWeekDayText: { color: '#94a3b8', fontSize: 12, width: '14.28%', textAlign: 'center', fontWeight: 'bold' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', padding: 2 },
  calDaySelected: { backgroundColor: '#3b82f6', borderRadius: 20 },
  calDayText: { color: '#cbd5e1', fontSize: 16 }
});
}
