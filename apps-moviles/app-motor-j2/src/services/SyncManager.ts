import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const SYNC_QUEUE_KEY = '@otp_sync_queue';
const SYNC_QUEUE_TREAL_KEY = '@treal_sync_queue';

interface QueuedUpdate {
  id: string;
  rows: any[];
  timestamp: number;
}

class SyncManagerClass {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private onSyncStatusChangeCallback: ((status: 'online' | 'offline' | 'syncing') => void) | null = null;

  constructor() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = !!state.isConnected && !!state.isInternetReachable;
      
      this.notifyStatus(this.isOnline ? 'online' : 'offline');

      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
    
    // Initial check
    NetInfo.fetch().then(state => {
      this.isOnline = !!state.isConnected && !!state.isInternetReachable;
      this.notifyStatus(this.isOnline ? 'online' : 'offline');
    });
  }

  public setOnSyncStatusChange(callback: (status: 'online' | 'offline' | 'syncing') => void) {
    this.onSyncStatusChangeCallback = callback;
    this.notifyStatus(this.isOnline ? 'online' : 'offline');
  }

  private notifyStatus(status: 'online' | 'offline' | 'syncing') {
    if (this.onSyncStatusChangeCallback) {
      this.onSyncStatusChangeCallback(status);
    }
  }

  public async getQueueStatus(): Promise<number> {
    try {
      const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: QueuedUpdate[] = queueStr ? JSON.parse(queueStr) : [];
      const queueTrealStr = await AsyncStorage.getItem(SYNC_QUEUE_TREAL_KEY);
      const queueTreal: QueuedUpdate[] = queueTrealStr ? JSON.parse(queueTrealStr) : [];
      return queue.length + queueTreal.length;
    } catch {
      return 0;
    }
  }

  public async queueOTPUpdate(otpId: string, rows: any[]): Promise<boolean> {
    return this.queueUpdate('roles_del_dia', SYNC_QUEUE_KEY, otpId, rows);
  }

  public async queueTREALUpdate(trealId: string, rows: any[]): Promise<boolean> {
    return this.queueUpdate('tablas_treal', SYNC_QUEUE_TREAL_KEY, trealId, rows);
  }

  private async queueUpdate(table: string, queueKey: string, id: string, rows: any[]): Promise<boolean> {
    if (this.isOnline) {
      try {
        const { error } = await supabase.from(table).update({ rows }).eq('id', id);
        if (error) throw error;
        return true; 
      } catch (e) {
        console.error('Error guardando en Supabase, guardando en local:', e);
        await this.saveToLocalQueue(queueKey, id, rows);
        return false; 
      }
    } else {
      await this.saveToLocalQueue(queueKey, id, rows);
      return false; 
    }
  }

  private async saveToLocalQueue(queueKey: string, id: string, rows: any[]) {
    try {
      const queueStr = await AsyncStorage.getItem(queueKey);
      let queue: QueuedUpdate[] = queueStr ? JSON.parse(queueStr) : [];

      const existingIndex = queue.findIndex(q => q.id === id);
      if (existingIndex >= 0) {
        queue[existingIndex].rows = rows;
        queue[existingIndex].timestamp = Date.now();
      } else {
        queue.push({ id, rows, timestamp: Date.now() });
      }

      await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
      this.notifyStatus('offline');
    } catch (e) {
      console.error('Error guardando en cola local:', e);
    }
  }

  public async processQueue() {
    if (this.syncInProgress || !this.isOnline) return;

    try {
      this.syncInProgress = true;
      this.notifyStatus('syncing');

      let failed = 0;
      failed += await this.processSpecificQueue('roles_del_dia', SYNC_QUEUE_KEY);
      failed += await this.processSpecificQueue('tablas_treal', SYNC_QUEUE_TREAL_KEY);

      this.syncInProgress = false;
      this.notifyStatus(failed > 0 ? 'offline' : 'online');

    } catch (e) {
      console.error('Error procesando colas:', e);
      this.syncInProgress = false;
      this.notifyStatus('offline');
    }
  }

  private async processSpecificQueue(table: string, queueKey: string): Promise<number> {
    const queueStr = await AsyncStorage.getItem(queueKey);
    if (!queueStr) return 0;

    let queue: QueuedUpdate[] = JSON.parse(queueStr);
    if (queue.length === 0) return 0;

    const failedQueue: QueuedUpdate[] = [];

    for (const item of queue) {
      try {
        const { error } = await supabase.from(table).update({ rows: item.rows }).eq('id', item.id);
        if (error) {
          console.error(`Sync error para ${table}`, item.id, error);
          failedQueue.push(item);
        }
      } catch (e) {
        failedQueue.push(item);
      }
    }

    await AsyncStorage.setItem(queueKey, JSON.stringify(failedQueue));
    return failedQueue.length;
  }
}

export const SyncManager = new SyncManagerClass();
