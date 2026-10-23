import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Vibration,
  Modal,
  AppState,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { useTheme } from '../theme/ThemeContext';

import { requireOptionalNativeModule } from 'expo-modules-core';

let ExpoAudio: any = null;
let FileSystem: any = null;
let Notifications: any = null;

if (Platform.OS !== 'web') {
  try {
    if (requireOptionalNativeModule('ExpoAudio')) {
      ExpoAudio = require('expo-audio');
    }
  } catch {}
  try {
    FileSystem = require('expo-file-system/legacy');
  } catch {
    try {
      FileSystem = require('expo-file-system');
    } catch {}
  }
  try {
    if (requireOptionalNativeModule('ExpoNotificationPermissionsModule')) {
      Notifications = require('expo-notifications');
    }
  } catch {}
}

let bundledChimeAsset: any = null;
try {
  bundledChimeAsset = require('../../assets/dispatch-chime.wav');
} catch {}

const ANDROID_CHANNEL_ID = 'otp-salidas-max-v3';

export interface UserOtpTableOption {
  id: string;
  fecha: string;
  creadoPorUser: string;
  baseName: string;
  tipoRol: string;
  createdAtLabel: string;
  unitCount: number;
  firstHorario: string;
  lastHorario: string;
  rows: any[];
}

export interface UpcomingOtpDeparture {
  key: string;
  rolId: string;
  baseName: string;
  tipoRol: string;
  eco: string;
  horario: string;
  ruta: string;
  minutesRemaining: number;
  alertsSent: number;
  maxAlerts: number;
  dismissed: boolean;
}

export interface ActiveOtpAlert {
  key: string;
  rolId: string;
  baseName: string;
  eco: string;
  horario: string;
  ruta: string;
  minutesRemaining: number;
  alertIndex: number;
  totalAlerts: number;
  isTest?: boolean;
}

interface OtpMonitorContextProps {
  currentUser: string;
  userOtpTables: UserOtpTableOption[];
  activeUserTable: UserOtpTableOption | null;
  requiresTableSelection: boolean;
  selectUserOtpTable: (rolId: string) => void;
  upcomingDepartures: UpcomingOtpDeparture[];
  activeAlert: ActiveOtpAlert | null;
  lastScanTime: string;
  isTestingSequence: boolean;
  testSequenceProgress: string;
  refreshOtpSchedule: () => Promise<void>;
  dismissAlert: (key: string) => void;
  triggerSingleSoundTest: (volumePercent?: number) => void;
  triggerTestNotificationSequence: () => void;
  stopTestSequence: () => void;
}

const OtpMonitorContext = createContext<OtpMonitorContextProps>({
  currentUser: '',
  userOtpTables: [],
  activeUserTable: null,
  requiresTableSelection: false,
  selectUserOtpTable: () => {},
  upcomingDepartures: [],
  activeAlert: null,
  lastScanTime: '--:--',
  isTestingSequence: false,
  testSequenceProgress: '',
  refreshOtpSchedule: async () => {},
  dismissAlert: () => {},
  triggerSingleSoundTest: () => {},
  triggerTestNotificationSequence: () => {},
  stopTestSequence: () => {},
});

export const useOtpNotificationMonitor = () => useContext(OtpMonitorContext);

// Genera WAV PCM 16-bit en base64 con amplitud escalada al volumen indicado (0 - 100%)
function createChimeWavBase64(volumePercent: number): string {
  const sampleRate = 22050;
  const durationSec = 1.25;
  const numSamples = Math.floor(sampleRate * durationSec);
  const gain = Math.max(0.02, Math.min(1, volumePercent / 100));

  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  const notes = [
    { start: 0.0, end: 0.17, freq: 880.0 },
    { start: 0.18, end: 0.35, freq: 1174.66 },
    { start: 0.36, end: 0.58, freq: 1318.51 },
    { start: 0.65, end: 0.82, freq: 880.0 },
    { start: 0.83, end: 1.0, freq: 1174.66 },
    { start: 1.01, end: 1.24, freq: 1567.98 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (const n of notes) {
      if (t >= n.start && t <= n.end) {
        const localT = t - n.start;
        const dur = n.end - n.start;
        const attack = Math.min(1, localT / 0.012);
        const decay = Math.max(0, 1 - (localT / dur) * 0.5);
        const env = attack * decay;
        const wave =
          Math.sin(2 * Math.PI * n.freq * localT) * 0.72 +
          Math.sin(2 * Math.PI * n.freq * 2 * localT) * 0.2 +
          Math.sin(2 * Math.PI * n.freq * 3 * localT) * 0.08;
        sample = Math.max(-1, Math.min(1, wave * env * gain));
        break;
      }
    }
    view.setInt16(44 + i * 2, Math.round(sample * 32767), true);
  }

  const bytes = new Uint8Array(buffer);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    base64 += chars[b1 >> 2];
    base64 += chars[((b1 & 3) << 4) | (b2 >> 4)];
    base64 += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    base64 += i + 2 < bytes.length ? chars[b3 & 63] : '=';
  }

  return base64;
}

let audioModeConfigured = false;
const cachedWavUriByVol: Record<number, string> = {};

async function ensureNativeAudioConfigured() {
  if (Platform.OS === 'web' || !ExpoAudio?.setAudioModeAsync) return;
  if (audioModeConfigured) return;
  try {
    await ExpoAudio.setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'mixWithOthers',
      interruptionModeAndroid: 'duckOthers',
    });
    audioModeConfigured = true;
  } catch {}
}

async function getOrWriteNativeWavUri(volBucket: number): Promise<string | null> {
  if (cachedWavUriByVol[volBucket]) {
    return cachedWavUriByVol[volBucket];
  }
  if (!FileSystem?.cacheDirectory || !FileSystem?.writeAsStringAsync) {
    return null;
  }
  try {
    const fileUri = `${FileSystem.cacheDirectory}otp_dispatch_chime_v2_${volBucket}.wav`;
    const b64 = createChimeWavBase64(volBucket);
    await FileSystem.writeAsStringAsync(fileUri, b64, {
      encoding: FileSystem.EncodingType?.Base64 || 'base64',
    });
    cachedWavUriByVol[volBucket] = fileUri;
    return fileUri;
  } catch {
    return null;
  }
}

export async function playDispatchChime(volumePercent: number) {
  const clampedVol = Math.max(0, Math.min(100, Math.round(volumePercent)));

  // 1. Vibración háptica en dispositivos móviles proporcional al volumen configurado
  if (Platform.OS !== 'web' && clampedVol > 0) {
    try {
      const pulseMs = Math.max(150, Math.round((clampedVol / 100) * 500));
      Vibration.vibrate([0, pulseMs, 120, pulseMs]);
    } catch {}
  }

  if (clampedVol <= 0) return;

  // 2. Reproducción nativa en Android / iOS (Expo Go y APK) mediante expo-audio
  if (Platform.OS !== 'web' && ExpoAudio?.createAudioPlayer) {
    try {
      await ensureNativeAudioConfigured();
      const volBucket = Math.max(5, Math.round(clampedVol / 5) * 5);
      const localWavUri = await getOrWriteNativeWavUri(volBucket);
      const source = localWavUri ? { uri: localWavUri } : bundledChimeAsset;
      if (source) {
        const player = ExpoAudio.createAudioPlayer(source, {
          keepAudioSessionActive: true,
        });
        if (player) {
          player.volume = Math.max(0.05, Math.min(1.0, clampedVol / 100));
          player.play();
          setTimeout(() => {
            try {
              player.remove?.();
            } catch {}
          }, 2400);
          return;
        }
      }
    } catch (e) {
      // Fallback al asset directo si falló el archivo temporal
      try {
        if (bundledChimeAsset) {
          const player = ExpoAudio.createAudioPlayer(bundledChimeAsset, {
            keepAudioSessionActive: true,
          });
          player.volume = Math.max(0.05, Math.min(1.0, clampedVol / 100));
          player.play();
          setTimeout(() => {
            try {
              player.remove?.();
            } catch {}
          }, 2400);
          return;
        }
      } catch {}
    }
  }

  // 3. En Web / PWA (iOS Safari, Android Chrome, Desktop): Web Audio API + HTML5 Audio fallback
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const gainVal = (clampedVol / 100) * 0.9;
        const notes = [
          { freq: 880, start: 0, dur: 0.18 },
          { freq: 1174.66, start: 0.19, dur: 0.18 },
          { freq: 1318.51, start: 0.38, dur: 0.24 },
          { freq: 880, start: 0.68, dur: 0.18 },
          { freq: 1174.66, start: 0.87, dur: 0.18 },
          { freq: 1567.98, start: 1.06, dur: 0.26 },
        ];
        notes.forEach((n) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.start);
          gain.gain.setValueAtTime(0.001, ctx.currentTime + n.start);
          gain.gain.exponentialRampToValueAtTime(
            Math.max(0.01, gainVal),
            ctx.currentTime + n.start + 0.02
          );
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + n.start + n.dur
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + n.start);
          osc.stop(ctx.currentTime + n.start + n.dur + 0.02);
        });
        setTimeout(() => {
          try {
            ctx.close();
          } catch {}
        }, 1600);
        return;
      }
    } catch {}

    try {
      const AudioCtor = (window as any).Audio;
      if (AudioCtor) {
        const wavUri = `data:audio/wav;base64,${createChimeWavBase64(clampedVol)}`;
        const audio = new AudioCtor(wavUri);
        audio.volume = clampedVol / 100;
        audio.play().catch(() => {});
      }
    } catch {}
  }
}

async function ensureOsNotificationsInitialized(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const Notif = (window as any).Notification;
      if (Notif.permission === 'granted') return true;
      if (Notif.permission !== 'denied') {
        const perm = await Notif.requestPermission().catch(() => 'denied');
        return perm === 'granted';
      }
    }
    return false;
  }

  if (!Notifications) return false;

  try {
    if (Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          priority: Notifications.AndroidNotificationPriority?.MAX ?? 'max',
        }),
      });
    }

    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Alertas de Salida OTP',
        description: 'Notificaciones de salida de unidades programadas en Proyección OTP',
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 400, 150, 400],
        enableVibrate: true,
        enableLights: true,
        lightColor: '#F59E0B',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1,
        bypassDnd: true,
        sound: 'default',
      });
    }

    if (Notifications.getPermissionsAsync && Notifications.requestPermissionsAsync) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }
      return finalStatus === 'granted';
    }
  } catch {}
  return false;
}

async function sendImmediateOsNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  playSound: boolean = true
) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const Notif = (window as any).Notification;
      if (Notif.permission === 'granted') {
        new Notif(title, { body, icon: '/apple-touch-icon.png' });
      } else if (Notif.permission !== 'denied') {
        Notif.requestPermission().then((perm: string) => {
          if (perm === 'granted') {
            new Notif(title, { body, icon: '/apple-touch-icon.png' });
          }
        });
      }
    } catch {}
    return;
  }

  if (!Notifications?.scheduleNotificationAsync) return;

  try {
    await ensureOsNotificationsInitialized();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: playSound ? 'default' : false,
        vibrate: [0, 400, 150, 400],
        priority: Notifications.AndroidNotificationPriority?.MAX ?? 'max',
        data: data || {},
      },
      trigger:
        Platform.OS === 'android'
          ? ({ channelId: ANDROID_CHANNEL_ID } as any)
          : null,
    });
  } catch {}
}

const getLocalTodayStr = () => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {}
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function parseRoleToOption(rol: any): UserOtpTableOption {
  const parts = (rol.creado_por || '').split('|');
  const creadoPorUser = (parts[0] || '').replace(/^\[OTP\]\s*/i, '').trim();
  const baseName =
    parts.length > 1
      ? parts[1].trim()
      : rol.plantillas_predeterminadas?.name || 'Base General';
  const tipoRol =
    parts.length > 2
      ? parts[2].trim()
      : rol.plantillas_predeterminadas?.name || 'Rol del Día';

  let createdAtLabel = '';
  if (rol.created_at) {
    try {
      createdAtLabel = new Date(rol.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {}
  }

  const rows = Array.isArray(rol.rows) ? rol.rows : [];
  const validRows = rows.filter(
    (r: any) => r && String(r.eco || '').trim() && String(r.horario || '').includes(':')
  );
  const firstHorario = validRows.length > 0 ? String(validRows[0].horario) : '--:--';
  const lastHorario =
    validRows.length > 0 ? String(validRows[validRows.length - 1].horario) : '--:--';

  return {
    id: String(rol.id),
    fecha: String(rol.fecha || ''),
    creadoPorUser,
    baseName,
    tipoRol,
    createdAtLabel,
    unitCount: validRows.length,
    firstHorario,
    lastHorario,
    rows,
  };
}

export const OtpNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme, otpNotifConfig, updateOtpNotifConfig } = useTheme();
  const [currentUser, setCurrentUser] = useState<string>('');
  const [userOtpTables, setUserOtpTables] = useState<UserOtpTableOption[]>([]);
  const [activeUserTable, setActiveUserTable] = useState<UserOtpTableOption | null>(null);
  const [requiresTableSelection, setRequiresTableSelection] = useState<boolean>(false);
  const [selectionModalDismissedForKey, setSelectionModalDismissedForKey] = useState<string>('');

  const [upcomingDepartures, setUpcomingDepartures] = useState<UpcomingOtpDeparture[]>([]);
  const [activeAlert, setActiveAlert] = useState<ActiveOtpAlert | null>(null);
  const [lastScanTime, setLastScanTime] = useState<string>('--:--');
  const [isTestingSequence, setIsTestingSequence] = useState<boolean>(false);
  const [testSequenceProgress, setTestSequenceProgress] = useState<string>('');

  // Registro de notificaciones enviadas en primer plano: key -> { countFired, lastFiredAtMs, dismissed }
  const trackerRef = useRef<
    Record<string, { countFired: number; lastFiredAtMs: number; dismissed: boolean }>
  >({});
  const cachedAllTodayOtpRolesRef = useRef<any[]>([]);
  const testTimersRef = useRef<any[]>([]);
  const scheduledTestNotifIdsRef = useRef<string[]>([]);
  const scheduledOtpNotifIdsRef = useRef<string[]>([]);
  const lastScheduledSignatureRef = useRef<string>('');
  const lastChimePlayedAtMsRef = useRef<number>(0);

  const resolveLoggedUser = useCallback(async (): Promise<string> => {
    try {
      const storedName = await AsyncStorage.getItem('apolo11_user_name');
      if (storedName && storedName.trim() && storedName.trim().toLowerCase() !== 'tablerista') {
        const clean = storedName.trim();
        setCurrentUser(clean);
        return clean;
      }
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('username, nombre')
          .eq('id', data.user.id)
          .single();
        const resolved =
          prof?.username ||
          prof?.nombre ||
          (data.user.email ? data.user.email.split('@')[0] : '');
        if (resolved) {
          await AsyncStorage.setItem('apolo11_user_name', resolved);
          setCurrentUser(resolved);
          return resolved;
        }
      }
      if (storedName && storedName.trim()) {
        setCurrentUser(storedName.trim());
        return storedName.trim();
      }
    } catch {}
    return '';
  }, []);

  // Inicializar permisos y canal de notificaciones del sistema + audio nativo
  useEffect(() => {
    ensureOsNotificationsInitialized();
    ensureNativeAudioConfigured();
    getOrWriteNativeWavUri(85);

    let receivedSub: any = null;
    let responseSub: any = null;

    if (Platform.OS !== 'web' && Notifications) {
      try {
        if (Notifications.addNotificationReceivedListener) {
          receivedSub = Notifications.addNotificationReceivedListener(() => {
            const now = Date.now();
            if (now - lastChimePlayedAtMsRef.current > 1800) {
              lastChimePlayedAtMsRef.current = now;
              playDispatchChime(otpNotifConfig.volume);
            }
          });
        }
        if (Notifications.addNotificationResponseReceivedListener) {
          responseSub = Notifications.addNotificationResponseReceivedListener((response: any) => {
            const data = response?.notification?.request?.content?.data;
            if (data?.rolId) {
              router.push(`/editor-otp?rol_id=${data.rolId}&mode=edit` as any);
            }
          });
        }
      } catch {}
    }

    return () => {
      try {
        receivedSub?.remove?.();
        responseSub?.remove?.();
      } catch {}
    };
  }, [otpNotifConfig.volume]);

  // Pre-programar en el sistema operativo (Android AlarmManager / iOS UNUserNotificationCenter)
  // las próximas salidas de la tabla seleccionada del usuario para que suenen incluso con pantalla apagada o app minimizada
  const syncOsBackgroundSchedule = useCallback(
    async (targetTable: UserOtpTableOption | null) => {
      if (Platform.OS === 'web' || !Notifications?.scheduleNotificationAsync) return;

      const signature = targetTable
        ? `${targetTable.id}_${otpNotifConfig.enabled}_${otpNotifConfig.minutesBefore}_${otpNotifConfig.repeatCount}_${otpNotifConfig.repeatIntervalSeconds}_${otpNotifConfig.volume}_${JSON.stringify(
            targetTable.rows.map((r: any) => `${r.eco}:${r.horario}`)
          )}`
        : 'none';

      if (signature === lastScheduledSignatureRef.current) return;
      lastScheduledSignatureRef.current = signature;

      // Cancelar las notificaciones OTP programadas anteriormente
      const prevIds = [...scheduledOtpNotifIdsRef.current];
      scheduledOtpNotifIdsRef.current = [];
      for (const id of prevIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch {}
      }

      if (!targetTable || !otpNotifConfig.enabled) return;

      await ensureOsNotificationsInitialized();

      const now = new Date();
      const nowMs = now.getTime();
      const maxHorizonMs = nowMs + 2 * 3600 * 1000; // Próximas 2 horas
      const newIds: string[] = [];

      for (let idx = 0; idx < targetTable.rows.length; idx++) {
        const row: any = targetTable.rows[idx];
        const eco = String(row.eco || '').trim();
        const horario = String(row.horario || '').trim();
        if (!eco || !horario || !horario.includes(':') || horario === '--:--') continue;

        const [hStr, mStr] = horario.split(':');
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (isNaN(h) || isNaN(m)) continue;

        const key = `${targetTable.id}_${row.id || idx}_${eco}_${horario}`;
        if (trackerRef.current[key]?.dismissed) continue;

        const depDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          h,
          m,
          0,
          0
        );
        const depTimeMs = depDate.getTime();
        const firstAlertMs = depTimeMs - otpNotifConfig.minutesBefore * 60000;
        const intervalMs = Math.max(5, otpNotifConfig.repeatIntervalSeconds) * 1000;

        for (let rep = 1; rep <= otpNotifConfig.repeatCount; rep++) {
          const fireAtMs = firstAlertMs + (rep - 1) * intervalMs;
          if (fireAtMs <= nowMs + 2500 || fireAtMs > maxHorizonMs) continue;

          const minsAtFire = Math.max(0, Math.ceil((depTimeMs - fireAtMs) / 60000));
          const notifId = `otp_sched_${targetTable.id}_${row.id || idx}_${rep}`;
          const title =
            minsAtFire <= 0
              ? `🚍 ¡SALIDA AHORA! Unidad ECO ${eco}`
              : `🚍 Unidad ECO ${eco} sale en ${minsAtFire} min`;
          const body = `${targetTable.baseName} • Horario OTP: ${horario} (${row.ruta || 'MEX'}) • Aviso ${rep}/${otpNotifConfig.repeatCount}`;

          try {
            await Notifications.scheduleNotificationAsync({
              identifier: notifId,
              content: {
                title,
                body,
                sound: otpNotifConfig.volume > 0 ? 'default' : false,
                vibrate: [0, 400, 150, 400],
                priority: Notifications.AndroidNotificationPriority?.MAX ?? 'max',
                data: {
                  rolId: targetTable.id,
                  eco,
                  horario,
                  type: 'otp_departure',
                },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes?.DATE ?? 'date',
                date: new Date(fireAtMs),
                channelId: ANDROID_CHANNEL_ID,
              } as any,
            });
            newIds.push(notifId);
          } catch {}
        }
      }

      scheduledOtpNotifIdsRef.current = newIds;
    },
    [otpNotifConfig]
  );

  const selectUserOtpTable = useCallback(
    (rolId: string) => {
      updateOtpNotifConfig({ selectedOtpRolId: String(rolId) });
      setRequiresTableSelection(false);
    },
    [updateOtpNotifConfig]
  );

  const evaluateDepartures = useCallback(
    (allTodayRoles: any[], loggedUser: string) => {
      const now = new Date();
      const nowTotalMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      const nowMs = Date.now();
      setLastScanTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );

      const cleanUser = (loggedUser || '').trim().toLowerCase();
      const parsedOptions = allTodayRoles.map(parseRoleToOption);

      // Filtrar EXCLUSIVAMENTE las tablas creadas hoy por el usuario que inició sesión
      const matchingUserTables = cleanUser
        ? parsedOptions.filter(
            (opt) => opt.creadoPorUser.toLowerCase() === cleanUser
          )
        : [];

      setUserOtpTables(matchingUserTables);

      let chosenTable: UserOtpTableOption | null = null;
      if (matchingUserTables.length === 1) {
        chosenTable = matchingUserTables[0];
        setRequiresTableSelection(false);
      } else if (matchingUserTables.length >= 2) {
        const found = matchingUserTables.find(
          (t) => String(t.id) === String(otpNotifConfig.selectedOtpRolId || '')
        );
        if (found) {
          chosenTable = found;
          setRequiresTableSelection(false);
        } else {
          chosenTable = null;
          setRequiresTableSelection(true);
        }
      } else {
        chosenTable = null;
        setRequiresTableSelection(false);
      }

      setActiveUserTable(chosenTable);
      syncOsBackgroundSchedule(chosenTable);

      if (!chosenTable) {
        setUpcomingDepartures([]);
        return;
      }

      const upcoming: UpcomingOtpDeparture[] = [];
      let newestAlertToDisplay: ActiveOtpAlert | null = null;

      chosenTable.rows.forEach((row: any, idx: number) => {
        const eco = String(row.eco || '').trim();
        const horario = String(row.horario || '').trim();
        if (!eco || !horario || !horario.includes(':') || horario === '--:--') return;

        const [hStr, mStr] = horario.split(':');
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (isNaN(h) || isNaN(m)) return;

        const depTotalMins = h * 60 + m;
        const diffMins = depTotalMins - nowTotalMins;

        // Mostrar en lista de próximas salidas las que están entre -2 min y +90 min
        if (diffMins >= -2 && diffMins <= 90) {
          const key = `${chosenTable!.id}_${row.id || idx}_${eco}_${horario}`;
          if (!trackerRef.current[key]) {
            trackerRef.current[key] = {
              countFired: 0,
              lastFiredAtMs: 0,
              dismissed: false,
            };
          }
          const state = trackerRef.current[key];

          // Verificar si entra en la ventana de alerta configurada [0 .. minutesBefore]
          if (
            otpNotifConfig.enabled &&
            diffMins <= otpNotifConfig.minutesBefore &&
            diffMins >= -1 &&
            !state.dismissed &&
            state.countFired < otpNotifConfig.repeatCount
          ) {
            const intervalMs = Math.max(5, otpNotifConfig.repeatIntervalSeconds) * 1000;
            if (state.countFired === 0 || nowMs - state.lastFiredAtMs >= intervalMs) {
              state.countFired += 1;
              state.lastFiredAtMs = nowMs;

              const minsRounded = Math.max(0, Math.ceil(diffMins));
              newestAlertToDisplay = {
                key,
                rolId: chosenTable!.id,
                baseName: chosenTable!.baseName,
                eco,
                horario,
                ruta: row.ruta || 'MEX',
                minutesRemaining: minsRounded,
                alertIndex: state.countFired,
                totalAlerts: otpNotifConfig.repeatCount,
              };
            }
          }

          upcoming.push({
            key,
            rolId: chosenTable!.id,
            baseName: chosenTable!.baseName,
            tipoRol: chosenTable!.tipoRol,
            eco,
            horario,
            ruta: row.ruta || 'MEX',
            minutesRemaining: Math.round(diffMins),
            alertsSent: state.countFired,
            maxAlerts: otpNotifConfig.repeatCount,
            dismissed: state.dismissed,
          });
        }
      });

      upcoming.sort((a, b) => a.minutesRemaining - b.minutesRemaining);
      setUpcomingDepartures(upcoming.slice(0, 15));

      if (newestAlertToDisplay) {
        const alertObj: ActiveOtpAlert = newestAlertToDisplay;
        setActiveAlert(alertObj);
        lastChimePlayedAtMsRef.current = Date.now();
        playDispatchChime(otpNotifConfig.volume);
        const msgTitle =
          alertObj.minutesRemaining <= 0
            ? `🚍 ¡SALIDA AHORA! Unidad ECO ${alertObj.eco}`
            : `🚍 Unidad ECO ${alertObj.eco} sale en ${alertObj.minutesRemaining} min`;
        const msgBody = `${alertObj.baseName} • Horario OTP: ${alertObj.horario} (${alertObj.ruta}) • Aviso ${alertObj.alertIndex}/${alertObj.totalAlerts}`;
        sendImmediateOsNotification(
          msgTitle,
          msgBody,
          { rolId: alertObj.rolId, eco: alertObj.eco },
          otpNotifConfig.volume > 0
        );
      }
    },
    [otpNotifConfig, syncOsBackgroundSchedule]
  );

  const refreshOtpSchedule = useCallback(async () => {
    try {
      const user = await resolveLoggedUser();
      const todayStr = getLocalTodayStr();
      const { data, error } = await supabase
        .from('roles_del_dia')
        .select('id, fecha, created_at, creado_por, rows, plantillas_predeterminadas(name)')
        .eq('fecha', todayStr)
        .ilike('creado_por', '[OTP]%')
        .order('created_at', { ascending: false });

      if (!error && data) {
        cachedAllTodayOtpRolesRef.current = data;
        evaluateDepartures(data, user);
      }
    } catch {}
  }, [resolveLoggedUser, evaluateDepartures]);

  useEffect(() => {
    refreshOtpSchedule();
    const fetchInterval = setInterval(refreshOtpSchedule, 20000);
    const evalInterval = setInterval(async () => {
      const user =
        currentUser || (await AsyncStorage.getItem('apolo11_user_name')) || '';
      evaluateDepartures(cachedAllTodayOtpRolesRef.current, user);
    }, 5000);

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshOtpSchedule();
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      refreshOtpSchedule();
    });

    const channel = supabase
      .channel('public:roles_del_dia:otp_monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'roles_del_dia' },
        () => {
          refreshOtpSchedule();
        }
      )
      .subscribe();

    return () => {
      clearInterval(fetchInterval);
      clearInterval(evalInterval);
      appStateSub.remove();
      authListener?.subscription?.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [refreshOtpSchedule, evaluateDepartures, currentUser]);

  const dismissAlert = (key: string) => {
    if (trackerRef.current[key]) {
      trackerRef.current[key].dismissed = true;
    }
    setActiveAlert((prev) => (prev && prev.key === key ? null : prev));
    evaluateDepartures(cachedAllTodayOtpRolesRef.current, currentUser);
  };

  const triggerSingleSoundTest = (volumeOverride?: number) => {
    const vol = volumeOverride !== undefined ? volumeOverride : otpNotifConfig.volume;
    lastChimePlayedAtMsRef.current = Date.now();
    playDispatchChime(vol);
  };

  const stopTestSequence = useCallback(async () => {
    testTimersRef.current.forEach((t) => clearTimeout(t));
    testTimersRef.current = [];
    const pendingIds = [...scheduledTestNotifIdsRef.current];
    scheduledTestNotifIdsRef.current = [];
    if (Platform.OS !== 'web' && Notifications?.cancelScheduledNotificationAsync) {
      for (const id of pendingIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch {}
      }
    }
    setIsTestingSequence(false);
    setTestSequenceProgress('');
    setActiveAlert((prev) => (prev?.isTest ? null : prev));
  }, []);

  const triggerTestNotificationSequence = useCallback(async () => {
    await stopTestSequence();
    setIsTestingSequence(true);
    await ensureOsNotificationsInitialized();

    const total = Math.max(1, otpNotifConfig.repeatCount);
    const intervalSec = Math.max(3, otpNotifConfig.repeatIntervalSeconds);
    const sampleUnit = upcomingDepartures[0] || {
      rolId: activeUserTable?.id || '',
      baseName: activeUserTable?.baseName || 'Nuevos Paseos',
      eco: '1320',
      horario: new Date(Date.now() + otpNotifConfig.minutesBefore * 60000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      ruta: 'MEX',
      minutesRemaining: otpNotifConfig.minutesBefore,
    };

    // Pre-programar avisos 2..total en el sistema operativo para que suenen y aparezcan
    // en pantalla de bloqueo / barra de notificaciones incluso si el usuario minimiza la app o apaga la pantalla
    if (Platform.OS !== 'web' && Notifications?.scheduleNotificationAsync) {
      const scheduledIds: string[] = [];
      for (let i = 2; i <= total; i++) {
        const fireDate = new Date(Date.now() + (i - 1) * intervalSec * 1000);
        const testId = `otp_test_seq_${Date.now()}_${i}`;
        try {
          await Notifications.scheduleNotificationAsync({
            identifier: testId,
            content: {
              title: `🔔 [PRUEBA ${i}/${total}] Salida ECO ${sampleUnit.eco}`,
              body: `Sale en ${otpNotifConfig.minutesBefore} min (${sampleUnit.horario}) • ${sampleUnit.baseName}`,
              sound: otpNotifConfig.volume > 0 ? 'default' : false,
              vibrate: [0, 400, 150, 400],
              priority: Notifications.AndroidNotificationPriority?.MAX ?? 'max',
              data: { rolId: sampleUnit.rolId, isTest: true },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes?.DATE ?? 'date',
              date: fireDate,
              channelId: ANDROID_CHANNEL_ID,
            } as any,
          });
          scheduledIds.push(testId);
        } catch {}
      }
      scheduledTestNotifIdsRef.current = scheduledIds;
    }

    for (let i = 1; i <= total; i++) {
      const delayMs = (i - 1) * intervalSec * 1000;
      const timer = setTimeout(() => {
        setTestSequenceProgress(
          `Emitiendo aviso de prueba ${i} de ${total} (cada ${intervalSec}s • Vol ${otpNotifConfig.volume}%)`
        );
        const testAlert: ActiveOtpAlert = {
          key: `test_alert_${Date.now()}`,
          rolId: sampleUnit.rolId,
          baseName: sampleUnit.baseName,
          eco: sampleUnit.eco,
          horario: sampleUnit.horario,
          ruta: sampleUnit.ruta,
          minutesRemaining: otpNotifConfig.minutesBefore,
          alertIndex: i,
          totalAlerts: total,
          isTest: true,
        };
        setActiveAlert(testAlert);
        lastChimePlayedAtMsRef.current = Date.now();
        playDispatchChime(otpNotifConfig.volume);

        if (i === 1 || Platform.OS === 'web') {
          sendImmediateOsNotification(
            `🔔 [PRUEBA ${i}/${total}] Salida ECO ${sampleUnit.eco}`,
            `Sale en ${otpNotifConfig.minutesBefore} min (${sampleUnit.horario}) • ${sampleUnit.baseName}`,
            { rolId: sampleUnit.rolId, isTest: true },
            otpNotifConfig.volume > 0
          );
        }

        if (i === total) {
          const endTimer = setTimeout(() => {
            setIsTestingSequence(false);
            setTestSequenceProgress('Secuencia de prueba completada.');
          }, 3000);
          testTimersRef.current.push(endTimer);
        }
      }, delayMs);
      testTimersRef.current.push(timer);
    }
  }, [otpNotifConfig, upcomingDepartures, activeUserTable, stopTestSequence]);

  const multiTableKey = userOtpTables.map((t) => t.id).join(',');
  const showMultiTableModal =
    requiresTableSelection &&
    userOtpTables.length >= 2 &&
    selectionModalDismissedForKey !== multiTableKey;

  return (
    <OtpMonitorContext.Provider
      value={{
        currentUser,
        userOtpTables,
        activeUserTable,
        requiresTableSelection,
        selectUserOtpTable,
        upcomingDepartures,
        activeAlert,
        lastScanTime,
        isTestingSequence,
        testSequenceProgress,
        refreshOtpSchedule,
        dismissAlert,
        triggerSingleSoundTest,
        triggerTestNotificationSequence,
        stopTestSequence,
      }}
    >
      {children}

      {/* Modal automático cuando el usuario actual tiene 2 o más tablas OTP creadas hoy */}
      <Modal visible={showMultiTableModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.primary },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Feather name="bell" size={22} color={theme.primary} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Selecciona tu Tabla OTP para Notificaciones
              </Text>
            </View>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Tienes {userOtpTables.length} tablas de Proyección OTP creadas hoy con tu usuario (
              {currentUser}). Elige cuál tabla gestionará las salidas y alertas:
            </Text>

            <View style={{ gap: 10, marginVertical: 14 }}>
              {userOtpTables.map((tbl, idx) => (
                <TouchableOpacity
                  key={tbl.id}
                  style={[
                    styles.tableOptionBtn,
                    { backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                  onPress={() => selectUserOtpTable(tbl.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '900', fontSize: 14 }}>
                      Tabla #{idx + 1}: {tbl.baseName} • {tbl.tipoRol}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                      {tbl.unitCount} turnos ({tbl.firstHorario} - {tbl.lastHorario})
                      {tbl.createdAtLabel ? ` • Creada ${tbl.createdAtLabel}` : ''}
                    </Text>
                  </View>
                  <Feather name="check-circle" size={20} color={theme.primary} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{ alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 10 }}
              onPress={() => setSelectionModalDismissedForKey(multiTableKey)}
            >
              <Text style={{ color: theme.textMuted, fontWeight: '700', fontSize: 12 }}>
                Elegir más tarde en Ajustes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Banner Flotante Global de Alerta de Salida OTP */}
      {activeAlert && (
        <View style={styles.floatingBannerWrapper} pointerEvents="box-none">
          <View
            style={[
              styles.floatingBanner,
              {
                backgroundColor: '#0F172A',
                borderColor: activeAlert.minutesRemaining <= 1 ? '#EF4444' : '#F59E0B',
              },
            ]}
          >
            <View style={styles.bannerTopRow}>
              <View style={styles.badgeContainer}>
                <View
                  style={[
                    styles.pulseDot,
                    {
                      backgroundColor:
                        activeAlert.minutesRemaining <= 1 ? '#EF4444' : '#F59E0B',
                    },
                  ]}
                />
                <Text style={styles.bannerTag}>
                  {activeAlert.isTest ? 'SIMULACIÓN DE ALERTA OTP' : 'ALERTA DE SALIDA OTP'} • AVISO{' '}
                  {activeAlert.alertIndex}/{activeAlert.totalAlerts}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (activeAlert.isTest) {
                    stopTestSequence();
                  } else {
                    dismissAlert(activeAlert.key);
                  }
                }}
                style={styles.closeIconBtn}
              >
                <Feather name="x" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.bannerMainRow}>
              <View style={styles.ecoBadge}>
                <Text style={styles.ecoBadgeLabel}>ECO</Text>
                <Text style={styles.ecoBadgeNumber}>{activeAlert.eco}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>
                  {activeAlert.minutesRemaining <= 0
                    ? '¡Unidad en hora de salida!'
                    : `Sale en ${activeAlert.minutesRemaining} min (${activeAlert.horario})`}
                </Text>
                <Text style={styles.bannerSubtitle}>
                  Base: {activeAlert.baseName} • Ruta: {activeAlert.ruta}
                </Text>
              </View>
            </View>

            <View style={styles.bannerActionsRow}>
              <TouchableOpacity
                style={styles.btnSilence}
                onPress={() => {
                  if (activeAlert.isTest) {
                    stopTestSequence();
                  } else {
                    dismissAlert(activeAlert.key);
                  }
                }}
              >
                <Feather name="bell-off" size={14} color="#F8FAFC" />
                <Text style={styles.btnSilenceText}>
                  {activeAlert.isTest ? 'Detener Prueba' : 'Entendido / Silenciar'}
                </Text>
              </TouchableOpacity>

              {activeAlert.rolId ? (
                <TouchableOpacity
                  style={[styles.btnGoOtp, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    const targetRolId = activeAlert.rolId;
                    setActiveAlert(null);
                    router.push(`/editor-otp?rol_id=${targetRolId}&mode=edit` as any);
                  }}
                >
                  <Feather name="external-link" size={14} color={theme.headerText} />
                  <Text style={[styles.btnGoOtpText, { color: theme.headerText }]}>
                    Abrir Tabla OTP
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      )}
    </OtpMonitorContext.Provider>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 18,
    borderWidth: 2,
    padding: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  tableOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  floatingBannerWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 12,
    right: 12,
    zIndex: 99999,
    alignItems: 'center',
  },
  floatingBanner: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 16,
    borderWidth: 2,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 14,
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  bannerTag: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  closeIconBtn: {
    padding: 4,
  },
  bannerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  ecoBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 68,
  },
  ecoBadgeLabel: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '900',
  },
  ecoBadgeNumber: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  bannerSubtitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnSilence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnSilenceText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  btnGoOtp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnGoOtpText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
