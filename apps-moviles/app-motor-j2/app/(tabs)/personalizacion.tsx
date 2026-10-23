import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useTheme,
  THEME_ORDER,
  THEME_METADATA,
  themes,
  ThemeType,
} from '../../src/theme/ThemeContext';
import { useOtpNotificationMonitor } from '../../src/services/OtpNotificationMonitor';
import { router } from 'expo-router';

const FONT_SCALE_PRESETS = [
  { label: 'Compacto', value: 0.85, pct: '85%' },
  { label: 'Normal', value: 1.0, pct: '100%' },
  { label: 'Grande', value: 1.15, pct: '115%' },
  { label: 'Extra', value: 1.3, pct: '130%' },
  { label: 'Máximo', value: 1.45, pct: '145%' },
];

const MINUTES_BEFORE_PRESETS = [1, 2, 3, 5, 10, 15, 20];
const VOLUME_PRESETS = [0, 25, 50, 75, 100];
const REPEAT_COUNT_PRESETS = [1, 2, 3, 5, 8, 10];
const REPEAT_INTERVAL_PRESETS = [
  { label: '10 seg', seconds: 10 },
  { label: '15 seg', seconds: 15 },
  { label: '30 seg', seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
];
const BASE_OPTIONS = ['Todas', 'Nuevos Paseos', 'Indios Verdes', 'Lagos 2'];

export default function PersonalizacionScreen() {
  const {
    theme,
    themeName,
    setThemeByName,
    fontScale,
    setFontScale,
    otpNotifConfig,
    updateOtpNotifConfig,
  } = useTheme();

  const {
    currentUser,
    userOtpTables,
    activeUserTable,
    requiresTableSelection,
    selectUserOtpTable,
    upcomingDepartures,
    lastScanTime,
    isTestingSequence,
    testSequenceProgress,
    refreshOtpSchedule,
    triggerSingleSoundTest,
    triggerTestNotificationSequence,
    stopTestSequence,
  } = useOtpNotificationMonitor();

  const styles = getStyles(theme);

  const formatIntervalLabel = (sec: number) => {
    if (sec < 60) return `${sec} seg`;
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return rem > 0 ? `${mins}m ${rem}s` : `${mins} min`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      {/* CABECERA PRINCIPAL */}
      <View style={styles.heroCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.heroIconBox}>
            <Feather name="sliders" size={24} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Panel de Personalización</Text>
            <Text style={styles.heroSubtitle}>
              Ajusta el tamaño de letra, tema visual y alertas de salida OTP
            </Text>
          </View>
        </View>
      </View>

      {/* =========================================================
          SECCIÓN 1: TAMAÑO DE LETRA DE LA APP
         ========================================================= */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="type" size={20} color={theme.primary} />
            <Text style={styles.sectionTitle}>Tamaño de Letra</Text>
          </View>
          <View style={styles.valuePill}>
            <Text style={styles.valuePillText}>{Math.round(fontScale * 100)}%</Text>
          </View>
        </View>
        <Text style={styles.sectionDesc}>
          Escala globalmente los textos, tablas y botones en toda la aplicación.
        </Text>

        {/* Controles finos - / + */}
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setFontScale(fontScale - 0.05)}
          >
            <Feather name="minus" size={18} color={theme.text} />
            <Text style={styles.stepperBtnText}>Reducir (-5%)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepperBtn, { borderColor: theme.primary }]}
            onPress={() => setFontScale(1.0)}
          >
            <Text style={[styles.stepperBtnText, { color: theme.primary }]}>
              Restaurar 100%
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => setFontScale(fontScale + 0.05)}
          >
            <Feather name="plus" size={18} color={theme.text} />
            <Text style={styles.stepperBtnText}>Aumentar (+5%)</Text>
          </TouchableOpacity>
        </View>

        {/* Presets rápidos */}
        <View style={styles.chipsWrap}>
          {FONT_SCALE_PRESETS.map((preset) => {
            const active = Math.abs(fontScale - preset.value) < 0.03;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[
                  styles.chipBtn,
                  active && {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => setFontScale(preset.value)}
              >
                <Text
                  style={[
                    styles.chipTitle,
                    active && { color: theme.headerText },
                  ]}
                >
                  {preset.label}
                </Text>
                <Text
                  style={[
                    styles.chipSub,
                    active && { color: theme.headerText, opacity: 0.9 },
                  ]}
                >
                  {preset.pct}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Vista previa en vivo del tamaño de fuente */}
        <View style={styles.fontPreviewBox}>
          <Text style={styles.fontPreviewHeader}>
            VISTA PREVIA DE FILA OPERATIVA:
          </Text>
          <View style={styles.fontPreviewRow}>
            <Text style={styles.fontPreviewCell}>#01</Text>
            <Text style={[styles.fontPreviewCell, { color: theme.primary }]}>
              14:30
            </Text>
            <Text style={styles.fontPreviewCell}>ECO 1320</Text>
            <Text style={[styles.fontPreviewCell, { color: '#10B981' }]}>
              MEX
            </Text>
            <Text style={styles.fontPreviewCell}>19 PAX</Text>
          </View>
        </View>
      </View>

      {/* =========================================================
          SECCIÓN 2: TEMA VISUAL DE LA APLICACIÓN
         ========================================================= */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons
              name="palette-outline"
              size={22}
              color={theme.primary}
            />
            <Text style={styles.sectionTitle}>Tema y Estilo de Colores</Text>
          </View>
          <View style={styles.valuePill}>
            <Text style={styles.valuePillText}>
              {THEME_METADATA[themeName]?.label || themeName}
            </Text>
          </View>
        </View>
        <Text style={styles.sectionDesc}>
          Selecciona cualquiera de los 10 esquemas cromáticos diseñados para día, noche o alto contraste.
        </Text>

        <View style={styles.themeGrid}>
          {THEME_ORDER.map((tKey: ThemeType) => {
            const tColors = themes[tKey];
            const meta = THEME_METADATA[tKey];
            const isSelected = themeName === tKey;
            return (
              <TouchableOpacity
                key={tKey}
                activeOpacity={0.85}
                onPress={() => setThemeByName(tKey)}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: tColors.surface,
                    borderColor: isSelected ? tColors.primary : tColors.border,
                    borderWidth: isSelected ? 2.5 : 1,
                  },
                ]}
              >
                <View style={styles.themeCardTop}>
                  <View style={styles.swatchRow}>
                    <View
                      style={[
                        styles.swatchCircle,
                        { backgroundColor: tColors.background, borderColor: tColors.border },
                      ]}
                    />
                    <View
                      style={[
                        styles.swatchCircle,
                        { backgroundColor: tColors.primary, borderColor: tColors.border },
                      ]}
                    />
                    <View
                      style={[
                        styles.swatchCircle,
                        { backgroundColor: tColors.text, borderColor: tColors.border },
                      ]}
                    />
                  </View>
                  {isSelected ? (
                    <View
                      style={[
                        styles.activeCheckBadge,
                        { backgroundColor: tColors.primary },
                      ]}
                    >
                      <Feather name="check" size={12} color={tColors.headerText} />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.themeTypeBadge,
                        { borderColor: tColors.border },
                      ]}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '800', color: tColors.textMuted }}>
                        {meta.badge}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={{
                    color: tColors.text,
                    fontWeight: '900',
                    fontSize: 13,
                    marginTop: 6,
                  }}
                >
                  {meta.label}
                </Text>
                <Text
                  style={{
                    color: tColors.textMuted,
                    fontSize: 10.5,
                    marginTop: 2,
                    lineHeight: 14,
                  }}
                  numberOfLines={2}
                >
                  {meta.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* =========================================================
          SECCIÓN 3: NOTIFICACIONES DE SALIDA (PROYECCIÓN OTP)
         ========================================================= */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Feather name="bell" size={20} color={theme.primary} />
            <Text style={styles.sectionTitle}>
              Alertas de Salida (Proyección OTP)
            </Text>
          </View>
          <Switch
            value={otpNotifConfig.enabled}
            onValueChange={(val) => updateOtpNotifConfig({ enabled: val })}
            trackColor={{ false: '#64748b', true: theme.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <Text style={styles.sectionDesc}>
          Las notificaciones se configuran exclusivamente con la tabla de Proyección OTP creada hoy por tu usuario en sesión ({currentUser || 'Sin sesión'}). También suenan y aparecen en pantalla de bloqueo y barra de notificaciones al minimizar la app.
        </Text>

        {/* Sub-config 3.1: Tabla OTP del usuario que inició sesión */}
        <View style={styles.subConfigBlock}>
          <View style={styles.subHeaderBetween}>
            <Text style={styles.subConfigTitle}>
              1. Tabla OTP de tu Usuario ({currentUser || 'Sesión Actual'})
            </Text>
            <TouchableOpacity
              style={styles.refreshMiniBtn}
              onPress={refreshOtpSchedule}
            >
              <Feather name="refresh-cw" size={12} color={theme.primary} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: theme.primary }}>
                Actualizar
              </Text>
            </TouchableOpacity>
          </View>

          {userOtpTables.length === 0 ? (
            <View
              style={[
                styles.emptyOtpBox,
                { paddingVertical: 14, paddingHorizontal: 14 },
              ]}
            >
              <Feather name="user-check" size={22} color={theme.textMuted} />
              <Text style={styles.emptyOtpTitle}>
                No tienes tablas OTP creadas hoy con tu usuario ({currentUser || 'Sesión'})
              </Text>
              <Text style={styles.emptyOtpSub}>
                En cuanto crees una tabla de Proyección OTP hoy con tu cuenta, aparecerá aquí automáticamente para gestionar tus alertas de salida.
              </Text>
            </View>
          ) : userOtpTables.length === 1 ? (
            <View
              style={[
                styles.departureRow,
                {
                  borderColor: theme.primary,
                  borderWidth: 2,
                  marginBottom: 0,
                },
              ]}
            >
              <View
                style={[
                  styles.depEcoBadge,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Text
                  style={{
                    color: theme.headerText,
                    fontWeight: '900',
                    fontSize: 11,
                  }}
                >
                  ACTIVA
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.depMainText}>
                  {userOtpTables[0].baseName} • {userOtpTables[0].tipoRol}
                </Text>
                <Text style={styles.depSubText}>
                  {userOtpTables[0].unitCount} turnos ({userOtpTables[0].firstHorario} -{' '}
                  {userOtpTables[0].lastHorario}) • Usuario: {userOtpTables[0].creadoPorUser}
                </Text>
              </View>
              <Feather name="check-circle" size={20} color={theme.primary} />
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <Text
                style={[
                  styles.sectionDesc,
                  {
                    marginBottom: 4,
                    color: requiresTableSelection ? '#F59E0B' : theme.textMuted,
                    fontWeight: requiresTableSelection ? '800' : '600',
                  },
                ]}
              >
                {requiresTableSelection
                  ? `⚠️ Tienes ${userOtpTables.length} tablas creadas hoy con tu usuario. Selecciona cuál gestionará las salidas y notificaciones:`
                  : `Tienes ${userOtpTables.length} tablas creadas hoy con tu usuario. Toca una para cambiar la tabla activa:`}
              </Text>
              {userOtpTables.map((tbl, idx) => {
                const isSelected = activeUserTable?.id === tbl.id;
                return (
                  <TouchableOpacity
                    key={tbl.id}
                    style={[
                      styles.departureRow,
                      {
                        marginBottom: 0,
                        borderColor: isSelected ? theme.primary : theme.border,
                        borderWidth: isSelected ? 2.5 : 1,
                      },
                    ]}
                    onPress={() => selectUserOtpTable(tbl.id)}
                  >
                    <View
                      style={[
                        styles.depEcoBadge,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : theme.surface,
                          borderWidth: isSelected ? 0 : 1,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: isSelected ? theme.headerText : theme.text,
                          fontWeight: '900',
                          fontSize: 11,
                        }}
                      >
                        {isSelected ? 'ACTIVA' : `TABLA #${idx + 1}`}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.depMainText}>
                        {tbl.baseName} • {tbl.tipoRol}
                      </Text>
                      <Text style={styles.depSubText}>
                        {tbl.unitCount} turnos ({tbl.firstHorario} - {tbl.lastHorario})
                        {tbl.createdAtLabel ? ` • Creada ${tbl.createdAtLabel}` : ''}
                      </Text>
                    </View>
                    <Feather
                      name={isSelected ? 'check-circle' : 'circle'}
                      size={20}
                      color={isSelected ? theme.primary : theme.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Sub-config 3.2: Minutos antes de que salga la unidad */}
        <View style={styles.subConfigBlock}>
          <View style={styles.subHeaderBetween}>
            <Text style={styles.subConfigTitle}>
              2. ¿Cuántos minutos antes de salir te notifica?
            </Text>
            <View style={styles.highlightBadge}>
              <Text style={styles.highlightBadgeText}>
                {otpNotifConfig.minutesBefore} min antes
              </Text>
            </View>
          </View>

          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() =>
                updateOtpNotifConfig({
                  minutesBefore: Math.max(1, otpNotifConfig.minutesBefore - 1),
                })
              }
            >
              <Feather name="minus" size={16} color={theme.text} />
              <Text style={styles.stepperBtnText}>-1 min</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', paddingHorizontal: 10 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: theme.primary }}>
                {otpNotifConfig.minutesBefore} min
              </Text>
              <Text style={{ fontSize: 10, color: theme.textMuted }}>
                Anticipación
              </Text>
            </View>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() =>
                updateOtpNotifConfig({
                  minutesBefore: Math.min(60, otpNotifConfig.minutesBefore + 1),
                })
              }
            >
              <Feather name="plus" size={16} color={theme.text} />
              <Text style={styles.stepperBtnText}>+1 min</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chipsWrap}>
            {MINUTES_BEFORE_PRESETS.map((m) => {
              const active = otpNotifConfig.minutesBefore === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.smallChip,
                    active && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => updateOtpNotifConfig({ minutesBefore: m })}
                >
                  <Text
                    style={[
                      styles.smallChipText,
                      active && { color: theme.headerText },
                    ]}
                  >
                    {m} min
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sub-config 3.3: Volumen de la notificación */}
        <View style={styles.subConfigBlock}>
          <View style={styles.subHeaderBetween}>
            <Text style={styles.subConfigTitle}>
              3. Volumen de la Notificación
            </Text>
            <View style={styles.highlightBadge}>
              <Feather
                name={
                  otpNotifConfig.volume === 0
                    ? 'volume-x'
                    : otpNotifConfig.volume < 50
                    ? 'volume-1'
                    : 'volume-2'
                }
                size={14}
                color={theme.headerText}
              />
              <Text style={styles.highlightBadgeText}>
                {otpNotifConfig.volume}%
              </Text>
            </View>
          </View>

          {/* Barra de progreso de volumen */}
          <View style={styles.volumeBarTrack}>
            <View
              style={[
                styles.volumeBarFill,
                {
                  width: `${otpNotifConfig.volume}%`,
                  backgroundColor:
                    otpNotifConfig.volume === 0 ? '#64748b' : theme.primary,
                },
              ]}
            />
          </View>

          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => {
                const nextVol = Math.max(0, otpNotifConfig.volume - 10);
                updateOtpNotifConfig({ volume: nextVol });
                triggerSingleSoundTest(nextVol);
              }}
            >
              <Feather name="volume-1" size={16} color={theme.text} />
              <Text style={styles.stepperBtnText}>-10%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.stepperBtn,
                { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => triggerSingleSoundTest(otpNotifConfig.volume)}
            >
              <Feather name="volume-2" size={16} color={theme.headerText} />
              <Text style={[styles.stepperBtnText, { color: theme.headerText }]}>
                Probar Tonos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => {
                const nextVol = Math.min(100, otpNotifConfig.volume + 10);
                updateOtpNotifConfig({ volume: nextVol });
                triggerSingleSoundTest(nextVol);
              }}
            >
              <Feather name="volume-2" size={16} color={theme.text} />
              <Text style={styles.stepperBtnText}>+10%</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chipsWrap}>
            {VOLUME_PRESETS.map((v) => {
              const active = otpNotifConfig.volume === v;
              return (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.smallChip,
                    active && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => {
                    updateOtpNotifConfig({ volume: v });
                    triggerSingleSoundTest(v);
                  }}
                >
                  <Text
                    style={[
                      styles.smallChipText,
                      active && { color: theme.headerText },
                    ]}
                  >
                    {v === 0 ? 'Silencio (0%)' : `${v}%`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sub-config 3.4: Cuántas notificaciones y cada cuánto tiempo */}
        <View style={styles.subConfigBlock}>
          <View style={styles.subHeaderBetween}>
            <Text style={styles.subConfigTitle}>
              4. Repeticiones por Unidad y Frecuencia
            </Text>
            <View style={styles.highlightBadge}>
              <Text style={styles.highlightBadgeText}>
                {otpNotifConfig.repeatCount}x cada{' '}
                {formatIntervalLabel(otpNotifConfig.repeatIntervalSeconds)}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionDesc, { marginBottom: 8 }]}>
            ¿Cuántas notificaciones enviar por cada salida programada?
          </Text>
          <View style={styles.chipsWrap}>
            {REPEAT_COUNT_PRESETS.map((c) => {
              const active = otpNotifConfig.repeatCount === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.smallChip,
                    active && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => updateOtpNotifConfig({ repeatCount: c })}
                >
                  <Text
                    style={[
                      styles.smallChipText,
                      active && { color: theme.headerText },
                    ]}
                  >
                    {c} {c === 1 ? 'aviso' : 'avisos'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionDesc, { marginTop: 14, marginBottom: 8 }]}>
            ¿Cada cuánto tiempo repetir la notificación?
          </Text>
          <View style={styles.chipsWrap}>
            {REPEAT_INTERVAL_PRESETS.map((item) => {
              const active = otpNotifConfig.repeatIntervalSeconds === item.seconds;
              return (
                <TouchableOpacity
                  key={item.seconds}
                  style={[
                    styles.smallChip,
                    active && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() =>
                    updateOtpNotifConfig({ repeatIntervalSeconds: item.seconds })
                  }
                >
                  <Text
                    style={[
                      styles.smallChipText,
                      active && { color: theme.headerText },
                    ]}
                  >
                    Cada {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Botón de Prueba de Secuencia Completa */}
        <View style={{ marginTop: 14 }}>
          {!isTestingSequence ? (
            <TouchableOpacity
              style={[styles.testSequenceBtn, { backgroundColor: theme.primary }]}
              onPress={triggerTestNotificationSequence}
            >
              <Feather name="bell" size={18} color={theme.headerText} />
              <Text
                style={[styles.testSequenceBtnText, { color: theme.headerText }]}
              >
                Simular Alerta de Salida ({otpNotifConfig.repeatCount} avisos cada{' '}
                {formatIntervalLabel(otpNotifConfig.repeatIntervalSeconds)})
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.testSequenceBtn, { backgroundColor: '#EF4444' }]}
              onPress={stopTestSequence}
            >
              <Feather name="square" size={18} color="#FFFFFF" />
              <Text style={[styles.testSequenceBtnText, { color: '#FFFFFF' }]}>
                Detener Simulación en Curso
              </Text>
            </TouchableOpacity>
          )}
          {testSequenceProgress ? (
            <Text style={styles.testProgressText}>{testSequenceProgress}</Text>
          ) : null}
        </View>
      </View>

      {/* =========================================================
          SECCIÓN 4: MONITOR EN VIVO DE PRÓXIMAS SALIDAS OTP DE HOY
         ========================================================= */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Feather name="clock" size={20} color={theme.primary} />
            <Text style={styles.sectionTitle}>Próximas Salidas OTP (Hoy)</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshMiniBtn}
            onPress={refreshOtpSchedule}
          >
            <Feather name="refresh-cw" size={14} color={theme.primary} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary }}>
              Actualizar
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionDesc}>
          Última sincronización: {lastScanTime} • Mostrando unidades programadas en los próximos 90 min.
        </Text>

        {upcomingDepartures.length === 0 ? (
          <View style={styles.emptyOtpBox}>
            <Feather name="calendar" size={28} color={theme.textMuted} />
            <Text style={styles.emptyOtpTitle}>
              Sin salidas OTP próximas en los siguientes 90 minutos
            </Text>
            <Text style={styles.emptyOtpSub}>
              En cuanto haya una tabla de Proyección OTP activa hoy con horarios próximos, aparecerán aquí automáticamente.
            </Text>
          </View>
        ) : (
          upcomingDepartures.map((dep) => {
            const isSoon = dep.minutesRemaining <= otpNotifConfig.minutesBefore;
            return (
              <TouchableOpacity
                key={dep.key}
                style={[
                  styles.departureRow,
                  isSoon && {
                    borderColor: '#F59E0B',
                    borderWidth: 1.5,
                  },
                ]}
                onPress={() =>
                  router.push(`/editor-otp?rol_id=${dep.rolId}&mode=edit` as any)
                }
              >
                <View
                  style={[
                    styles.depEcoBadge,
                    {
                      backgroundColor: isSoon ? '#F59E0B' : theme.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isSoon ? '#0F172A' : theme.headerText,
                      fontWeight: '900',
                      fontSize: 13,
                    }}
                  >
                    ECO {dep.eco}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.depMainText}>
                    Salida: {dep.horario} ({dep.ruta})
                  </Text>
                  <Text style={styles.depSubText}>
                    {dep.baseName} • Avisos enviados: {dep.alertsSent}/{dep.maxAlerts}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={{
                      fontWeight: '900',
                      fontSize: 13,
                      color:
                        dep.minutesRemaining <= 0
                          ? '#EF4444'
                          : isSoon
                          ? '#F59E0B'
                          : theme.primary,
                    }}
                  >
                    {dep.minutesRemaining <= 0
                      ? '¡En salida!'
                      : `En ${dep.minutesRemaining} min`}
                  </Text>
                  {dep.dismissed && (
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>
                      Silenciada
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    heroCard: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    heroIconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: `${theme.primary}20`,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.primary,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.text,
    },
    heroSubtitle: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
      fontWeight: '600',
    },
    sectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: theme.text,
    },
    sectionDesc: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 12,
      lineHeight: 17,
    },
    valuePill: {
      backgroundColor: `${theme.primary}20`,
      borderWidth: 1,
      borderColor: theme.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    valuePillText: {
      fontSize: 12,
      fontWeight: '900',
      color: theme.primary,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 12,
    },
    stepperBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    stepperBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.text,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chipBtn: {
      flexGrow: 1,
      minWidth: 90,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    chipTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: theme.text,
    },
    chipSub: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textMuted,
      marginTop: 2,
    },
    fontPreviewBox: {
      marginTop: 14,
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    fontPreviewHeader: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.textMuted,
      marginBottom: 6,
    },
    fontPreviewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fontPreviewCell: {
      fontSize: 14,
      fontWeight: '900',
      color: theme.text,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    themeCard: {
      width: '48%',
      flexGrow: 1,
      borderRadius: 14,
      padding: 12,
    },
    themeCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    swatchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    swatchCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1,
    },
    activeCheckBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeTypeBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
    },
    subConfigBlock: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    subHeaderBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
      gap: 8,
    },
    subConfigTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.text,
      flex: 1,
    },
    highlightBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    highlightBadgeText: {
      color: theme.headerText,
      fontSize: 11,
      fontWeight: '900',
    },
    smallChip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    smallChipText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.text,
    },
    volumeBarTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      marginBottom: 10,
    },
    volumeBarFill: {
      height: '100%',
      borderRadius: 5,
    },
    testSequenceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 14,
    },
    testSequenceBtnText: {
      fontSize: 13,
      fontWeight: '900',
      textAlign: 'center',
    },
    testProgressText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.primary,
      textAlign: 'center',
      marginTop: 8,
    },
    refreshMiniBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyOtpBox: {
      padding: 20,
      borderRadius: 14,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    emptyOtpTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.text,
      marginTop: 8,
      textAlign: 'center',
    },
    emptyOtpSub: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
    departureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 8,
    },
    depEcoBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    depMainText: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.text,
    },
    depSubText: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
  });
}
