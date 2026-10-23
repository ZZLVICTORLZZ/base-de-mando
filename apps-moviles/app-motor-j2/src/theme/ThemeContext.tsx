import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  Alert,
  Platform,
  Modal,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';

export type ThemeType =
  | 'classic'
  | 'neon'
  | 'minimal'
  | 'industrial'
  | 'ocean'
  | 'midnight'
  | 'ruby'
  | 'forest'
  | 'titanium'
  | 'terracotta';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  success: string;
  warning: string;
  headerText: string;
  highlightText: string;
  fontScale?: number;
}

export interface OtpNotifConfig {
  enabled: boolean;
  minutesBefore: number;
  volume: number; // 0 - 100
  repeatCount: number; // cuántas notificaciones por salida
  repeatIntervalSeconds: number; // cada cuántos segundos se repite
  monitoredBase: string; // legacy compat
  selectedOtpRolId?: string | null; // ID de la tabla OTP seleccionada cuando el usuario tiene 2 o más tablas hoy
}

export const DEFAULT_OTP_NOTIF_CONFIG: OtpNotifConfig = {
  enabled: true,
  minutesBefore: 5,
  volume: 85,
  repeatCount: 3,
  repeatIntervalSeconds: 30,
  monitoredBase: 'Todas',
  selectedOtpRolId: null,
};

export const THEME_METADATA: Record<
  ThemeType,
  { label: string; description: string; badge: string }
> = {
  classic: {
    label: 'Clásico Institucional',
    description: 'Arena cálido con verde oficial de alta legibilidad bajo el sol',
    badge: 'Oficial',
  },
  neon: {
    label: 'Neón Nocturno',
    description: 'Azul profundo con acentos esmeralda brillantes para turno nocturno',
    badge: 'Oscuro',
  },
  minimal: {
    label: 'Minimalista Puro',
    description: 'Blanco y negro de máximo contraste tipo papel impreso',
    badge: 'Claro',
  },
  industrial: {
    label: 'Ámbar Industrial',
    description: 'Tonos ámbar de alta visibilidad para patio y despacho',
    badge: 'Cálido',
  },
  ocean: {
    label: 'Océano Atlántico',
    description: 'Azul cielo limpio y fresco con contraste marino profundo',
    badge: 'Claro',
  },
  midnight: {
    label: 'Medianoche Violeta',
    description: 'Oscuro elegante con acentos violeta de baja fatiga visual',
    badge: 'Oscuro',
  },
  ruby: {
    label: 'Rubí Táctico',
    description: 'Modo oscuro carmesí para preservar visión nocturna en base',
    badge: 'Oscuro',
  },
  forest: {
    label: 'Bosque Esmeralda',
    description: 'Verde pino oscuro con indicadores menta de alto contraste',
    badge: 'Oscuro',
  },
  titanium: {
    label: 'Titanio Ejecutivo',
    description: 'Grafito profundo con detalles en oro ejecutivo',
    badge: 'Nuevo',
  },
  terracotta: {
    label: 'Terracota Solar',
    description: 'Crema solar con cobre intenso ideal para exteriores soleados',
    badge: 'Nuevo',
  },
};

export const themes: Record<ThemeType, ThemeColors> = {
  classic: {
    background: '#F5F5DC',
    surface: '#F5F5DC',
    primary: '#006847',
    text: '#000000',
    textMuted: '#4A4A4A',
    border: '#D9D2C2',
    danger: '#D2042D',
    success: '#10B981',
    warning: '#F59E0B',
    headerText: '#FFFFFF',
    highlightText: '#006847',
  },
  neon: {
    background: '#0F172A',
    surface: '#1E293B',
    primary: '#10B981',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: '#334155',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    headerText: '#0F172A',
    highlightText: '#10B981',
  },
  minimal: {
    background: '#FFFFFF',
    surface: '#F8FAFC',
    primary: '#000000',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    headerText: '#FFFFFF',
    highlightText: '#000000',
  },
  industrial: {
    background: '#FEF3C7',
    surface: '#FFFBEB',
    primary: '#D97706',
    text: '#1E293B',
    textMuted: '#475569',
    border: '#FDE68A',
    danger: '#DC2626',
    success: '#059669',
    warning: '#D97706',
    headerText: '#FFFFFF',
    highlightText: '#D97706',
  },
  ocean: {
    background: '#E0F2FE',
    surface: '#F0F9FF',
    primary: '#0369A1',
    text: '#082F49',
    textMuted: '#1E40AF',
    border: '#BAE6FD',
    danger: '#E11D48',
    success: '#059669',
    warning: '#D97706',
    headerText: '#FFFFFF',
    highlightText: '#0284C7',
  },
  midnight: {
    background: '#0F0E17',
    surface: '#1A1829',
    primary: '#7C3AED',
    text: '#F5F3FF',
    textMuted: '#A5B4FC',
    border: '#4338CA',
    danger: '#F43F5E',
    success: '#10B981',
    warning: '#F59E0B',
    headerText: '#FFFFFF',
    highlightText: '#8B5CF6',
  },
  ruby: {
    background: '#1A0B0E',
    surface: '#2D1418',
    primary: '#E11D48',
    text: '#FFF1F2',
    textMuted: '#FDA4AF',
    border: '#9F1239',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    headerText: '#FFFFFF',
    highlightText: '#FB7185',
  },
  forest: {
    background: '#064E3B',
    surface: '#022C22',
    primary: '#10B981',
    text: '#ECFDF5',
    textMuted: '#6EE7B7',
    border: '#059669',
    danger: '#EF4444',
    success: '#34D399',
    warning: '#F59E0B',
    headerText: '#022C22',
    highlightText: '#34D399',
  },
  titanium: {
    background: '#111827',
    surface: '#1F2937',
    primary: '#F59E0B',
    text: '#F9FAFB',
    textMuted: '#D1D5DB',
    border: '#374151',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    headerText: '#111827',
    highlightText: '#FBBF24',
  },
  terracotta: {
    background: '#FFF7ED',
    surface: '#FFEDD5',
    primary: '#C2410C',
    text: '#431407',
    textMuted: '#7C2D12',
    border: '#FDBA74',
    danger: '#DC2626',
    success: '#059669',
    warning: '#D97706',
    headerText: '#FFFFFF',
    highlightText: '#EA580C',
  },
};

export const THEME_ORDER: ThemeType[] = [
  'classic',
  'neon',
  'minimal',
  'industrial',
  'ocean',
  'midnight',
  'ruby',
  'forest',
  'titanium',
  'terracotta',
];

// Global font scale interceptor so StyleSheet.create and Text/TextInput respect fontScale across all screens
let currentGlobalFontScale = 1.0;

try {
  const originalStyleSheetCreate = StyleSheet.create.bind(StyleSheet);
  if (!(StyleSheet as any).__fontScalePatched) {
    (StyleSheet as any).__fontScalePatched = true;
    StyleSheet.create = function <T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
      styles: T & StyleSheet.NamedStyles<any>
    ): T {
      if (currentGlobalFontScale === 1.0 || !styles || typeof styles !== 'object') {
        return originalStyleSheetCreate(styles);
      }
      const scaledStyles: any = {};
      for (const key of Object.keys(styles)) {
        const rule = (styles as any)[key];
        if (rule && typeof rule === 'object' && typeof rule.fontSize === 'number') {
          scaledStyles[key] = {
            ...rule,
            fontSize: Math.round(rule.fontSize * currentGlobalFontScale * 10) / 10,
          };
        } else {
          scaledStyles[key] = rule;
        }
      }
      return originalStyleSheetCreate(scaledStyles);
    };
  }
} catch {}

function patchComponentFontScale(Comp: any) {
  try {
    if (!Comp || Comp.__fontScalePatched) return;
    if (typeof Comp.render === 'function') {
      const origRender = Comp.render;
      Comp.__fontScalePatched = true;
      Comp.render = function (props: any, ref: any) {
        if (currentGlobalFontScale !== 1.0 && props && props.style) {
          const flat = StyleSheet.flatten(props.style);
          if (flat && typeof flat.fontSize === 'number') {
            const isDirectObject =
              !Array.isArray(props.style) &&
              typeof props.style === 'object' &&
              typeof props.style.fontSize === 'number';
            const hasInlineArrayFontSize =
              Array.isArray(props.style) &&
              props.style.some(
                (s: any) => s && typeof s === 'object' && typeof s.fontSize === 'number'
              );
            if (isDirectObject || hasInlineArrayFontSize) {
              const nextProps = {
                ...props,
                style: [
                  props.style,
                  { fontSize: Math.round(flat.fontSize * currentGlobalFontScale * 10) / 10 },
                ],
              };
              return origRender.call(this, nextProps, ref);
            }
          }
        }
        return origRender.call(this, props, ref);
      };
    }
  } catch {}
}

patchComponentFontScale(Text);
patchComponentFontScale(TextInput);

// Polyfill de Alert.alert para Web / iOS PWA (donde react-native-web tiene Alert.alert vacío)
interface WebAlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: Array<{
    text?: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

let globalShowWebAlert: ((state: WebAlertState) => void) | null = null;
let globalShowExportModal: ((dataUri: string, title: string) => void) | null = null;

if (Platform.OS === 'web' && !(Alert as any).__webAlertPatched) {
  (Alert as any).__webAlertPatched = true;
  Alert.alert = (
    title: string,
    message?: string,
    buttons?: Array<{
      text?: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>
  ) => {
    if (globalShowWebAlert) {
      globalShowWebAlert({
        visible: true,
        title: title || 'Aviso',
        message,
        buttons:
          buttons && buttons.length > 0
            ? buttons
            : [{ text: 'Aceptar', style: 'default' }],
      });
    } else if (typeof window !== 'undefined') {
      const fullText = message ? `${title}\n\n${message}` : title;
      if (buttons && buttons.length > 1) {
        const confirmed = window.confirm(fullText);
        if (confirmed) {
          const actionBtn =
            buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];
          actionBtn?.onPress?.();
        } else {
          const cancelBtn = buttons.find((b) => b.style === 'cancel');
          cancelBtn?.onPress?.();
        }
      } else {
        window.alert(fullText);
        buttons?.[0]?.onPress?.();
      }
    }
  };
}

function dataUriToFileSync(dataUri: string, fileName: string): File {
  const parts = dataUri.split(',');
  const base64Data = parts.length > 1 ? parts[1] : parts[0];
  const byteString = atob(base64Data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], fileName, { type: 'image/png' });
}

export interface ReportCanvasPayload {
  type: 'OTP' | 'TREAL' | 'ROL' | 'INCIDENCIAS';
  title: string;
  baseName?: string;
  rolName?: string;
  tablerista?: string;
  fechaStr?: string;
  baseColor?: string;
  obsGeneral?: string;
  isIndios?: boolean;
  isLagos?: boolean;
  unidadesMap?: { [ecoNum: string]: number };
  rows?: any[];
  incidencias?: Array<{
    hora: string;
    eco: string;
    tipo: string;
    descripcion: string;
  }>;
}

export function renderReportCanvasDataUri(payload: ReportCanvasPayload): string {
  if (typeof document === 'undefined') return '';
  const scale = 1.6;
  const logicalWidth = 960;
  const padding = 24;
  const rows = payload.rows || [];
  const incidencias = payload.incidencias || [];
  const baseColor = payload.baseColor || '#00502A';

  let rowHeight = 36;
  let numRowsPerCol = 1;
  if (payload.type === 'INCIDENCIAS') {
    rowHeight = 42;
    numRowsPerCol = Math.max(1, incidencias.length);
  } else if (payload.type === 'ROL') {
    rowHeight = 36;
    numRowsPerCol = Math.max(1, Math.min(25, rows.length), rows.length - 25);
  } else {
    rowHeight = 40;
    numRowsPerCol = Math.max(1, Math.ceil(rows.length / 2));
  }

  const headerHeight = payload.obsGeneral ? 165 : 130;
  const tableHeaderHeight = 36;
  const footerHeight = 40;
  const logicalHeight =
    padding * 2 +
    headerHeight +
    tableHeaderHeight +
    numRowsPerCol * rowHeight +
    footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(logicalWidth * scale);
  canvas.height = Math.round(logicalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(scale, scale);

  // Fondo blanco puro
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Barra superior de color de base
  ctx.fillStyle = payload.type === 'ROL' ? '#0033A0' : baseColor;
  ctx.fillRect(padding, padding, logicalWidth - padding * 2, 6);

  // Encabezado
  const contentWidth = logicalWidth - padding * 2;
  let cursorY = padding + 22;

  ctx.textAlign = 'center';
  if (payload.type === 'ROL') {
    ctx.fillStyle = '#0033A0';
    ctx.font = '900 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(payload.title || 'ROL DE DESPEGUE', logicalWidth / 2, cursorY + 12);
    cursorY += 32;

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `PLANTILLA: ${(payload.baseName || 'ENTRE SEMANA').toUpperCase()}`,
      logicalWidth / 2,
      cursorY + 8
    );
    cursorY += 26;
  } else {
    const mainTitle = payload.title || 'REPORTE OPERATIVO';
    const badgeText = (payload.baseName || '').toUpperCase();
    ctx.font = '900 20px system-ui, -apple-system, sans-serif';
    const titleW = ctx.measureText(mainTitle).width;
    ctx.font = '900 20px system-ui, -apple-system, sans-serif';
    const badgeW = badgeText ? ctx.measureText(badgeText).width + 36 : 0;
    const totalHeaderW = titleW + (badgeW ? badgeW + 16 : 0);
    const startX = (logicalWidth - totalHeaderW) / 2;

    ctx.textAlign = 'left';
    ctx.fillStyle = payload.type === 'TREAL' ? '#DC2626' : '#475569';
    ctx.font = '900 20px system-ui, -apple-system, sans-serif';
    ctx.fillText(mainTitle, startX, cursorY + 14);

    if (badgeText) {
      const bx = startX + titleW + 16;
      const by = cursorY - 6;
      const bh = 30;
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(bx, by, badgeW, bh, 15);
      } else {
        ctx.rect(bx, by, badgeW, bh);
      }
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.font = '900 17px system-ui, -apple-system, sans-serif';
      ctx.fillText(badgeText, bx + badgeW / 2, by + 21);
    }
    cursorY += 34;

    if (payload.rolName) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Rol: ${payload.rolName}`, logicalWidth / 2, cursorY + 6);
      cursorY += 22;
    } else {
      cursorY += 10;
    }
  }

  // Sub-encabezado: Tablerista y Fecha
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, cursorY);
  ctx.lineTo(logicalWidth - padding, cursorY);
  ctx.stroke();
  cursorY += 20;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `Sistema Saturno V | Tablerista: ${payload.tablerista || 'Emiliano'}`,
    padding,
    cursorY
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = payload.type === 'ROL' ? '#0033A0' : baseColor;
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `Fecha: ${payload.fechaStr || new Date().toLocaleDateString('es-MX')}`,
    logicalWidth - padding,
    cursorY
  );
  cursorY += 16;

  if (payload.obsGeneral) {
    ctx.fillStyle = '#FEF3C7';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1;
    ctx.fillRect(padding, cursorY, contentWidth, 28);
    ctx.strokeRect(padding, cursorY, contentWidth, 28);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#92400E';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `Observaciones: ${payload.obsGeneral.slice(0, 110)}`,
      padding + 10,
      cursorY + 18
    );
    cursorY += 36;
  }

  // Renderizado según tipo de tabla
  if (payload.type === 'INCIDENCIAS') {
    // Encabezado de tabla Incidencias
    ctx.fillStyle = '#88D8C0';
    ctx.fillRect(padding, cursorY, contentWidth, tableHeaderHeight);
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HORA', padding + contentWidth * 0.08, cursorY + 23);
    ctx.fillText('ECO', padding + contentWidth * 0.22, cursorY + 23);
    ctx.textAlign = 'left';
    ctx.fillText('TIPO DE INCIDENCIA', padding + contentWidth * 0.32, cursorY + 23);
    ctx.fillText('DESCRIPCIÓN', padding + contentWidth * 0.56, cursorY + 23);
    cursorY += tableHeaderHeight;

    if (incidencias.length === 0) {
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.font = 'italic 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        'Sin incidencias reportadas en este día.',
        logicalWidth / 2,
        cursorY + 26
      );
    } else {
      incidencias.forEach((inc, idx) => {
        const y = cursorY + idx * rowHeight;
        if (idx % 2 === 1) {
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(padding, y, contentWidth, rowHeight);
        }
        ctx.strokeStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.moveTo(padding, y + rowHeight);
        ctx.lineTo(padding + contentWidth, y + rowHeight);
        ctx.stroke();

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(inc.hora || '--:--', padding + contentWidth * 0.08, y + 25);
        ctx.font = '900 14px system-ui, -apple-system, sans-serif';
        ctx.fillText(inc.eco || '-', padding + contentWidth * 0.22, y + 25);
        ctx.textAlign = 'left';
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
        ctx.fillText((inc.tipo || '').slice(0, 26), padding + contentWidth * 0.32, y + 25);
        ctx.font = '13px system-ui, -apple-system, sans-serif';
        ctx.fillText(
          (inc.descripcion || '---').slice(0, 58),
          padding + contentWidth * 0.56,
          y + 25
        );
      });
    }
    return canvas.toDataURL('image/png', 1.0);
  }

  // Dos columnas para OTP, TREAL y ROL
  const colGap = 28;
  const colWidth = (contentWidth - colGap) / 2;
  const leftRows =
    payload.type === 'ROL'
      ? rows.slice(0, 25)
      : rows.slice(0, Math.ceil(rows.length / 2));
  const rightRows =
    payload.type === 'ROL'
      ? rows.slice(25)
      : rows.slice(Math.ceil(rows.length / 2));

  const drawColumn = (colRows: any[], startX: number) => {
    let y = cursorY;

    if (payload.type === 'ROL') {
      ctx.fillStyle = '#88D8C0';
      ctx.fillRect(startX, y, colWidth, tableHeaderHeight);
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NO.', startX + colWidth * 0.1, y + 23);
      ctx.fillText('FREC.', startX + colWidth * 0.3, y + 23);
      ctx.fillText('HORARIO', startX + colWidth * 0.58, y + 23);
      ctx.fillText('ECO', startX + colWidth * 0.85, y + 23);
      y += tableHeaderHeight;

      colRows.forEach((row) => {
        if (row.highlightColor) {
          ctx.fillStyle = row.highlightColor + '55';
          ctx.fillRect(startX, y, colWidth, rowHeight);
        }
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, y + rowHeight);
        ctx.lineTo(startX + colWidth, y + rowHeight);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 14px system-ui, -apple-system, sans-serif';
        ctx.fillText(String(row.no || ''), startX + colWidth * 0.1, y + 23);

        ctx.fillStyle = '#000080';
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.fillText(String(row.frec || ''), startX + colWidth * 0.3, y + 23);
        ctx.font = '900 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(String(row.horario || ''), startX + colWidth * 0.58, y + 23);

        ctx.fillStyle = '#0F172A';
        ctx.font = '900 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(String(row.eco || '-'), startX + colWidth * 0.85, y + 23);
        y += rowHeight;
      });
      return;
    }

    // OTP o TREAL
    const isIndios = !!payload.isIndios;
    const isLagos = !!payload.isLagos;
    const showRuta = !isIndios;
    const showPax = isIndios || isLagos;

    // Definir posiciones X proporcionales dentro de colWidth
    const cols: Array<{ key: string; label: string; w: number }> = [
      { key: 'no', label: 'NO.', w: 0.09 },
      { key: 'frec', label: 'FREC', w: 0.11 },
      { key: 'hora', label: 'HORA', w: 0.16 },
      { key: 'eco', label: 'ECO', w: 0.16 },
    ];
    if (showRuta) cols.push({ key: 'ruta', label: 'RUTA', w: 0.12 });
    if (showPax) cols.push({ key: 'pax', label: 'PAX', w: 0.11 });
    const usedW = cols.reduce((acc, c) => acc + c.w, 0);
    cols.push({ key: 'obs', label: 'OBS', w: Math.max(0.2, 1 - usedW) });

    // Header de columna
    ctx.fillStyle = baseColor;
    ctx.fillRect(startX, y, colWidth, tableHeaderHeight);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';

    let cx = startX;
    const colCenters: Record<string, { center: number; left: number; width: number }> = {};
    cols.forEach((c) => {
      const cw = colWidth * c.w;
      colCenters[c.key] = { center: cx + cw / 2, left: cx, width: cw };
      ctx.fillText(c.label, cx + cw / 2, y + 22);
      cx += cw;
    });
    y += tableHeaderHeight;

    const uMap = payload.unidadesMap || {};

    colRows.forEach((row) => {
      ctx.save();
      if (row.isGhost) {
        ctx.globalAlpha = 0.38;
      }

      if (row.highlightColor) {
        ctx.fillStyle =
          payload.type === 'OTP' ? `${row.highlightColor}60` : row.highlightColor;
        ctx.fillRect(startX, y, colWidth, rowHeight);
      }

      // Borde inferior
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, y + rowHeight);
      ctx.lineTo(startX + colWidth, y + rowHeight);
      ctx.stroke();

      // Si es registro manual, borde rojo punteado
      if (row.es_manual) {
        ctx.save();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(startX + 1, y + 1, colWidth - 2, rowHeight - 2);
        ctx.restore();
      }

      const textY = y + 23;
      const ecoClean = String(row.eco || '').replace(/[^0-9]/g, '');
      const unitCap = ecoClean ? uMap[ecoClean] || 0 : 0;
      const hasWrittenPax =
        !row.isGhost &&
        row.pax !== undefined &&
        row.pax !== null &&
        String(row.pax).trim() !== '';
      const paxNum = hasWrittenPax
        ? parseInt(String(row.pax).replace(/[^0-9]/g, ''), 10)
        : NaN;

      // NO. con indicador de capacidad si tiene PAX
      const noCol = colCenters.no;
      if (hasWrittenPax && !isNaN(paxNum) && unitCap > 0) {
        const boxW = 26;
        const boxH = 22;
        const bx = noCol.center - boxW / 2;
        const by = y + (rowHeight - boxH) / 2;
        ctx.fillStyle = '#000000';
        ctx.fillRect(bx, by, boxW, boxH);

        let ratio = 0.25;
        let fillCol = '#EF4444';
        if (paxNum >= unitCap) {
          ratio = 1;
          fillCol = '#10B981';
        } else if (paxNum >= unitCap * 0.75) {
          ratio = 0.75;
          fillCol = '#F97316';
        } else if (paxNum >= unitCap * 0.5) {
          ratio = 0.5;
          fillCol = '#F59E0B';
        }
        const fh = boxH * ratio;
        ctx.fillStyle = fillCol;
        ctx.fillRect(bx, by + (boxH - fh), boxW, fh);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(row.no || ''), noCol.center, y + 24);
      } else {
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(row.no || ''), noCol.center, textY);
      }

      // FREC
      ctx.fillStyle = row.highlightColor ? '#0F172A' : baseColor;
      ctx.font = '900 12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(row.frec || ''), colCenters.frec.center, textY);

      // HORA
      ctx.fillStyle = row.highlightColor ? '#0F172A' : baseColor;
      ctx.font = '900 12px system-ui, -apple-system, sans-serif';
      ctx.fillText(String(row.horario || ''), colCenters.hora.center, textY);

      // ECO
      ctx.fillStyle = '#0F172A';
      ctx.font = '900 12px system-ui, -apple-system, sans-serif';
      const ecoTxt = row.isGhost ? '-' : row.eco || '-';
      ctx.fillText(String(ecoTxt), colCenters.eco.center, textY);

      // RUTA
      if (showRuta && colCenters.ruta) {
        const rutaStr = String(row.ruta || '-');
        ctx.fillStyle =
          rutaStr === 'MEX' ? '#008000' : rutaStr === 'REY' ? '#D22B2B' : '#4B0082';
        ctx.font = '900 11px system-ui, -apple-system, sans-serif';
        ctx.fillText(rutaStr, colCenters.ruta.center, textY);
      }

      // PAX
      if (showPax && colCenters.pax) {
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 12px system-ui, -apple-system, sans-serif';
        const paxTxt = row.isGhost ? '-' : row.pax || '-';
        ctx.fillText(String(paxTxt), colCenters.pax.center, textY);
      }

      // OBS + barra de progreso de pasajeros
      const obsCol = colCenters.obs;
      const obsStr = String(row.observaciones || '').trim();
      const showBar = showPax && hasWrittenPax && !isNaN(paxNum) && unitCap > 0;

      if (obsStr) {
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          obsStr.slice(0, 24),
          obsCol.center,
          showBar ? y + 14 : textY
        );
      }

      if (showBar) {
        const progress = Math.min(100, Math.round((paxNum / unitCap) * 100));
        const extra = paxNum > unitCap ? paxNum - unitCap : 0;
        const barY = obsStr ? y + 28 : y + 23;
        const labelY = barY - 3;

        ctx.fillStyle = '#475569';
        ctx.font = '900 8px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${paxNum} de ${unitCap}${extra > 0 ? ` (+${extra})` : ''}`,
          obsCol.center,
          labelY
        );

        const barW = obsCol.width * 0.82;
        const barX = obsCol.center - barW / 2;
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(barX, barY, barW, 4);
        ctx.fillStyle = progress >= 100 ? '#10B981' : '#3B82F6';
        ctx.fillRect(barX, barY, (barW * progress) / 100, 4);
      }

      ctx.restore();
      y += rowHeight;
    });
  };

  drawColumn(leftRows, padding);
  if (rightRows.length > 0) {
    drawColumn(rightRows, padding + colWidth + colGap);
  }

  return canvas.toDataURL('image/png', 1.0);
}

// Helper universal para compartir / exportar imagen de reporte a WhatsApp en Android, iOS y PWA Web
export async function shareCapturedReportImage(
  rawUri: string,
  dialogTitle: string = 'Compartir Reporte J2',
  webPayload?: ReportCanvasPayload
) {
  if (Platform.OS !== 'web') {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(rawUri, {
        mimeType: 'image/png',
        dialogTitle,
        UTI: 'public.png',
      });
    } else {
      Alert.alert('Aviso', 'La función de compartir no está disponible en este dispositivo.');
    }
    return;
  }

  // En Web / iOS PWA: generar directamente con Canvas 2D si hay payload o asegurar prefijo data:image/png;base64,
  let dataUri = rawUri;
  if (webPayload) {
    const rendered = renderReportCanvasDataUri(webPayload);
    if (rendered && rendered.startsWith('data:image')) {
      dataUri = rendered;
    }
  }
  if (dataUri && !dataUri.startsWith('data:image')) {
    dataUri = `data:image/png;base64,${dataUri}`;
  }

  if (globalShowExportModal && dataUri) {
    globalShowExportModal(dataUri, dialogTitle);
  }

  // Intentar abrir la hoja nativa de compartir de iOS Safari en el mismo gesto del usuario
  if (dataUri && typeof window !== 'undefined') {
    try {
      const file = dataUriToFileSync(dataUri, `reporte-j2-${Date.now()}.png`);
      const nav: any = window.navigator;
      if (nav && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: dialogTitle,
        });
      }
    } catch {
      // El modal de previsualización ya está abierto en pantalla como respaldo inmediato
    }
  }
}

interface ThemeContextProps {
  themeName: ThemeType;
  theme: ThemeColors;
  cycleTheme: () => void;
  setThemeByName: (name: ThemeType) => void;
  fontScale: number;
  setFontScale: (scale: number) => void;
  scaleFont: (baseSize: number) => number;
  otpNotifConfig: OtpNotifConfig;
  updateOtpNotifConfig: (partial: Partial<OtpNotifConfig>) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  themeName: 'classic',
  theme: { ...themes.classic, fontScale: 1.0 },
  cycleTheme: () => {},
  setThemeByName: () => {},
  fontScale: 1.0,
  setFontScale: () => {},
  scaleFont: (s: number) => s,
  otpNotifConfig: DEFAULT_OTP_NOTIF_CONFIG,
  updateOtpNotifConfig: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeName, setThemeName] = useState<ThemeType>('classic');
  const [fontScale, setFontScaleState] = useState<number>(1.0);
  const [otpNotifConfig, setOtpNotifConfig] = useState<OtpNotifConfig>(DEFAULT_OTP_NOTIF_CONFIG);

  const [webAlert, setWebAlert] = useState<WebAlertState>({
    visible: false,
    title: '',
  });
  const [exportPreviewUri, setExportPreviewUri] = useState<string | null>(null);
  const [exportPreviewTitle, setExportPreviewTitle] = useState<string>('Compartir Reporte');
  const [sharingWebFile, setSharingWebFile] = useState<boolean>(false);

  useEffect(() => {
    globalShowWebAlert = (state) => setWebAlert(state);
    globalShowExportModal = (dataUri, title) => {
      setExportPreviewTitle(title);
      setExportPreviewUri(dataUri);
    };
    return () => {
      globalShowWebAlert = null;
      globalShowExportModal = null;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('apolo11_theme').then((storedTheme) => {
      if (storedTheme && THEME_ORDER.includes(storedTheme as ThemeType)) {
        setThemeName(storedTheme as ThemeType);
      }
    });
    AsyncStorage.getItem('apolo11_font_scale').then((storedScale) => {
      if (storedScale) {
        const parsed = parseFloat(storedScale);
        if (!isNaN(parsed) && parsed >= 0.75 && parsed <= 1.6) {
          currentGlobalFontScale = parsed;
          setFontScaleState(parsed);
        }
      }
    });
    AsyncStorage.getItem('apolo11_otp_notif_config').then((storedNotif) => {
      if (storedNotif) {
        try {
          const parsed = JSON.parse(storedNotif);
          setOtpNotifConfig((prev) => ({ ...prev, ...parsed }));
        } catch (e) {
          // ignore invalid json
        }
      }
    });
  }, []);

  const cycleTheme = () => {
    setThemeName((prev) => {
      const nextIndex = (THEME_ORDER.indexOf(prev) + 1) % THEME_ORDER.length;
      const newTheme = THEME_ORDER[nextIndex];
      AsyncStorage.setItem('apolo11_theme', newTheme);
      return newTheme;
    });
  };

  const setThemeByName = (name: ThemeType) => {
    if (THEME_ORDER.includes(name)) {
      setThemeName(name);
      AsyncStorage.setItem('apolo11_theme', name);
    }
  };

  const setFontScale = (scale: number) => {
    const clamped = Math.max(0.8, Math.min(1.5, Math.round(scale * 100) / 100));
    currentGlobalFontScale = clamped;
    setFontScaleState(clamped);
    AsyncStorage.setItem('apolo11_font_scale', String(clamped));
  };

  const scaleFont = (baseSize: number) => {
    return Math.round(baseSize * fontScale * 10) / 10;
  };

  const updateOtpNotifConfig = (partial: Partial<OtpNotifConfig>) => {
    setOtpNotifConfig((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem('apolo11_otp_notif_config', JSON.stringify(next));
      return next;
    });
  };

  const activeTheme = React.useMemo(
    () => ({
      ...themes[themeName],
      fontScale,
    }),
    [themeName, fontScale]
  );

  const handleWebNativeShare = async () => {
    if (!exportPreviewUri || typeof window === 'undefined') return;
    setSharingWebFile(true);
    try {
      const fileName = `reporte-j2-${Date.now()}.png`;
      const file = dataUriToFileSync(exportPreviewUri, fileName);

      const nav: any = window.navigator;
      if (nav && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: exportPreviewTitle,
        });
      } else {
        // Fallback: descarga directa del archivo PNG
        const link = document.createElement('a');
        link.href = exportPreviewUri;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      // Si el usuario canceló la hoja de compartir de iOS (AbortError), no es error
      if (err?.name !== 'AbortError') {
        try {
          const link = document.createElement('a');
          link.href = exportPreviewUri;
          link.download = `reporte-j2-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch {}
      }
    } finally {
      setSharingWebFile(false);
    }
  };

  const handleWebDownloadImage = () => {
    if (!exportPreviewUri || typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.href = exportPreviewUri;
    link.download = `reporte-j2-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeName,
        theme: activeTheme,
        cycleTheme,
        setThemeByName,
        fontScale,
        setFontScale,
        scaleFont,
        otpNotifConfig,
        updateOtpNotifConfig,
      }}
    >
      {children}

      {/* Modal Global de Confirmación para iOS Web / PWA */}
      {webAlert.visible && (
        <Modal
          visible={webAlert.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setWebAlert({ ...webAlert, visible: false })}
        >
          <View style={modalStyles.overlay}>
            <View
              style={[
                modalStyles.alertBox,
                {
                  backgroundColor: activeTheme.surface,
                  borderColor: activeTheme.border,
                },
              ]}
            >
              <Text style={[modalStyles.alertTitle, { color: activeTheme.text }]}>
                {webAlert.title}
              </Text>
              {webAlert.message ? (
                <Text
                  style={[
                    modalStyles.alertMessage,
                    { color: activeTheme.textMuted },
                  ]}
                >
                  {webAlert.message}
                </Text>
              ) : null}

              <View style={modalStyles.buttonsRow}>
                {(webAlert.buttons || []).map((btn, idx) => {
                  const isDestructive = btn.style === 'destructive';
                  const isCancel = btn.style === 'cancel';
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.75}
                      style={[
                        modalStyles.alertBtn,
                        isCancel
                          ? {
                              backgroundColor: activeTheme.background,
                              borderWidth: 1,
                              borderColor: activeTheme.border,
                            }
                          : isDestructive
                          ? { backgroundColor: '#EF4444' }
                          : { backgroundColor: activeTheme.primary },
                      ]}
                      onPress={() => {
                        setWebAlert({ ...webAlert, visible: false });
                        setTimeout(() => {
                          btn.onPress?.();
                        }, 50);
                      }}
                    >
                      <Text
                        style={[
                          modalStyles.alertBtnText,
                          isCancel
                            ? { color: activeTheme.text }
                            : isDestructive
                            ? { color: '#FFFFFF' }
                            : { color: activeTheme.headerText },
                        ]}
                      >
                        {btn.text || 'Aceptar'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal Global de Exportación de Imagen para WhatsApp en iOS / Web */}
      {exportPreviewUri && (
        <Modal
          visible={!!exportPreviewUri}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setExportPreviewUri(null)}
        >
          <View style={modalStyles.exportOverlay}>
            <View style={modalStyles.exportCard}>
              <View style={modalStyles.exportHeader}>
                <Text style={modalStyles.exportTitle}>{exportPreviewTitle}</Text>
                <TouchableOpacity
                  onPress={() => setExportPreviewUri(null)}
                  style={modalStyles.closeBtn}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16 }}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={modalStyles.exportHint}>
                Toca «Compartir a WhatsApp» o mantén presionada la imagen para guardarla o enviarla:
              </Text>

              <ScrollView
                style={{ flex: 1, width: '100%' }}
                contentContainerStyle={{ alignItems: 'center', paddingVertical: 8 }}
              >
                <Image
                  source={{ uri: exportPreviewUri }}
                  style={{ width: '100%', height: 420, resizeMode: 'contain' }}
                />
              </ScrollView>

              <View style={modalStyles.exportActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={[modalStyles.exportActionBtn, { backgroundColor: '#10B981', flex: 1.4 }]}
                  onPress={handleWebNativeShare}
                  disabled={sharingWebFile}
                >
                  {sharingWebFile ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={modalStyles.exportActionText}>
                      📤 Compartir a WhatsApp
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.75}
                  style={[modalStyles.exportActionBtn, { backgroundColor: '#3B82F6', flex: 1 }]}
                  onPress={handleWebDownloadImage}
                >
                  <Text style={modalStyles.exportActionText}>⬇️ Guardar PNG</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ThemeContext.Provider>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  alertBtn: {
    flex: 1,
    minWidth: 110,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBtnText: {
    fontSize: 14,
    fontWeight: '900',
  },
  exportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  exportCard: {
    width: '100%',
    maxWidth: 540,
    height: '86%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exportTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '900',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportHint: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 8,
  },
  exportActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  exportActionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
