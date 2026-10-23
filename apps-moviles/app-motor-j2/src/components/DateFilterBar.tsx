import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export const BASES_LIST = ['Todas', 'Nuevos Paseos', 'Indios Verdes', 'Lagos 2'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEK_DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

export function parseDDMMYYYY(dStr: string): Date {
  if (!dStr) return new Date();
  if (dStr.includes('-')) {
    const [y, m, d] = dStr.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d, 12, 0, 0);
    }
  }
  if (dStr.includes('/')) {
    const [d, m, y] = dStr.split('/').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d, 12, 0, 0);
    }
  }
  return new Date();
}

export function formatDDMMYYYY(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function getDayTimestamp(dStr: string): number {
  const dt = parseDDMMYYYY(dStr);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
}

interface DateFilterBarProps {
  dateDesde: string;
  dateHasta: string;
  onChangeDesde: (val: string) => void;
  onChangeHasta: (val: string) => void;
  selectedBase?: string;
  onSelectBase?: (base: string) => void;
  bases?: string[];
}

export default function DateFilterBar({
  dateDesde,
  dateHasta,
  onChangeDesde,
  onChangeHasta,
  selectedBase,
  onSelectBase,
  bases = BASES_LIST,
}: DateFilterBarProps) {
  const { theme } = useTheme();
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [activeField, setActiveField] = useState<'desde' | 'hasta'>('desde');
  const [baseDropdownOpen, setBaseDropdownOpen] = useState(false);

  const initialDate = parseDDMMYYYY(activeField === 'desde' ? dateDesde : dateHasta);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const openCalendar = (field: 'desde' | 'hasta') => {
    setActiveField(field);
    const refDate = parseDDMMYYYY(field === 'desde' ? dateDesde : dateHasta);
    setViewYear(refDate.getFullYear());
    setViewMonth(refDate.getMonth());
    setCalendarVisible(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d, 12, 0, 0));
    }
    return cells;
  }, [viewYear, viewMonth]);

  const desdeTime = getDayTimestamp(dateDesde);
  const hastaTime = getDayTimestamp(dateHasta);

  const handleSelectDay = (dayDate: Date) => {
    const formatted = formatDDMMYYYY(dayDate);
    const pickedTime = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()).getTime();

    if (activeField === 'desde') {
      onChangeDesde(formatted);
      if (pickedTime > hastaTime) {
        onChangeHasta(formatted);
      }
      setActiveField('hasta');
    } else {
      if (pickedTime < desdeTime) {
        onChangeDesde(formatted);
        onChangeHasta(dateDesde);
      } else {
        onChangeHasta(formatted);
      }
    }
  };

  const applyPreset = (preset: 'hoy' | 'ayer' | '7dias' | 'mes') => {
    const now = new Date();
    if (preset === 'hoy') {
      const s = formatDDMMYYYY(now);
      onChangeDesde(s);
      onChangeHasta(s);
    } else if (preset === 'ayer') {
      const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);
      const s = formatDDMMYYYY(yest);
      onChangeDesde(s);
      onChangeHasta(s);
    } else if (preset === '7dias') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 12, 0, 0);
      onChangeDesde(formatDDMMYYYY(start));
      onChangeHasta(formatDDMMYYYY(now));
    } else if (preset === 'mes') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
      onChangeDesde(formatDDMMYYYY(start));
      onChangeHasta(formatDDMMYYYY(now));
    }
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  return (
    <View style={[styles.wrapper, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
      {/* Fila de Rango de Fechas (Abre Calendario) */}
      <View style={styles.dateRow}>
        <Feather name="calendar" size={16} color={theme.primary} style={{ marginRight: 10 }} />

        <TouchableOpacity
          style={[styles.dateBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => openCalendar('desde')}
          activeOpacity={0.75}
        >
          <Text style={[styles.dateLabel, { color: theme.textMuted }]}>Desde</Text>
          <View style={styles.dateValueRow}>
            <Text style={[styles.dateValue, { color: theme.text }]}>{dateDesde}</Text>
            <Feather name="chevron-down" size={14} color={theme.primary} />
          </View>
        </TouchableOpacity>

        <Feather name="arrow-right" size={14} color={theme.textMuted} style={{ marginHorizontal: 8 }} />

        <TouchableOpacity
          style={[styles.dateBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => openCalendar('hasta')}
          activeOpacity={0.75}
        >
          <Text style={[styles.dateLabel, { color: theme.textMuted }]}>Hasta</Text>
          <View style={styles.dateValueRow}>
            <Text style={[styles.dateValue, { color: theme.text }]}>{dateHasta}</Text>
            <Feather name="chevron-down" size={14} color={theme.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Filtro de Bases Desplegable hacia abajo */}
      {onSelectBase && selectedBase !== undefined && (
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              {
                backgroundColor: theme.surface,
                borderColor: baseDropdownOpen ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setBaseDropdownOpen(prev => !prev)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="map-pin" size={15} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '600', marginRight: 6 }}>
                Base:
              </Text>
              <Text style={{ fontSize: 14, color: theme.text, fontWeight: '800' }}>
                {selectedBase === 'Todas' ? 'Todas las Bases' : selectedBase}
              </Text>
            </View>
            <Feather
              name={baseDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>

          {baseDropdownOpen && (
            <View
              style={[
                styles.dropdownMenu,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {bases.map((base, idx) => {
                const isActive = selectedBase === base;
                return (
                  <TouchableOpacity
                    key={base}
                    style={[
                      styles.dropdownItem,
                      idx < bases.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                      isActive && { backgroundColor: theme.primary },
                    ]}
                    onPress={() => {
                      onSelectBase(base);
                      setBaseDropdownOpen(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather
                        name={base === 'Todas' ? 'layers' : 'map-pin'}
                        size={14}
                        color={isActive ? theme.headerText : theme.textMuted}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isActive ? '800' : '600',
                          color: isActive ? theme.headerText : theme.text,
                        }}
                      >
                        {base === 'Todas' ? 'Todas las Bases' : base}
                      </Text>
                    </View>
                    {isActive && <Feather name="check" size={16} color={theme.headerText} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Modal de Calendario para Seleccionar Rango Desde / Hasta */}
      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Seleccionar Periodo</Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)} style={{ padding: 4 }}>
                <Feather name="x" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Selector activo: Desde vs Hasta */}
            <View style={styles.rangeTabs}>
              <TouchableOpacity
                style={[
                  styles.rangeTab,
                  {
                    backgroundColor: activeField === 'desde' ? theme.primary : theme.background,
                    borderColor: activeField === 'desde' ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setActiveField('desde')}
              >
                <Text style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: '700', color: activeField === 'desde' ? theme.headerText : theme.textMuted }}>
                  Desde
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: activeField === 'desde' ? theme.headerText : theme.text, marginTop: 2 }}>
                  {dateDesde}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rangeTab,
                  {
                    backgroundColor: activeField === 'hasta' ? theme.primary : theme.background,
                    borderColor: activeField === 'hasta' ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setActiveField('hasta')}
              >
                <Text style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: '700', color: activeField === 'hasta' ? theme.headerText : theme.textMuted }}>
                  Hasta
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: activeField === 'hasta' ? theme.headerText : theme.text, marginTop: 2 }}>
                  {dateHasta}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Atajos Rápidos */}
            <View style={styles.presetsRow}>
              {[
                { key: 'hoy', label: 'Hoy' },
                { key: 'ayer', label: 'Ayer' },
                { key: '7dias', label: '7 Días' },
                { key: 'mes', label: 'Este Mes' },
              ].map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.presetBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={() => applyPreset(p.key as any)}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Navegación de Mes y Año */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={handlePrevMonth} style={[styles.navBtn, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Feather name="chevron-left" size={18} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: theme.text }]}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={[styles.navBtn, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Feather name="chevron-right" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Encabezados de días de la semana */}
            <View style={styles.weekHeader}>
              {WEEK_DAYS.map((wd) => (
                <Text key={wd} style={[styles.weekDayText, { color: theme.textMuted }]}>
                  {wd}
                </Text>
              ))}
            </View>

            {/* Cuadrícula de días */}
            <View style={styles.daysGrid}>
              {calendarDays.map((dayDate, index) => {
                if (!dayDate) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }
                const cellTime = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()).getTime();
                const isStart = cellTime === desdeTime;
                const isEnd = cellTime === hastaTime;
                const isSelected = isStart || isEnd;
                const isInRange = cellTime > desdeTime && cellTime < hastaTime;

                return (
                  <TouchableOpacity
                    key={dayDate.toISOString()}
                    style={[
                      styles.dayCell,
                      isInRange && { backgroundColor: `${theme.primary}25`, borderRadius: 8 },
                      isSelected && { backgroundColor: theme.primary, borderRadius: 10 },
                    ]}
                    onPress={() => handleSelectDay(dayDate)}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isSelected || isInRange ? '800' : '500',
                        color: isSelected ? theme.headerText : theme.text,
                      }}
                    >
                      {dayDate.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botón Listo */}
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: theme.primary }]}
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={{ color: theme.headerText, fontWeight: '800', fontSize: 15 }}>
                Aplicar Fechas
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  dateValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownWrapper: {
    marginTop: 10,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  rangeTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  doneBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
});
