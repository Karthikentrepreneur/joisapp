
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Student, Staff, Invoice, LeaveRequest, Notice, ChatMessage, Certificate, AttendanceRecord, AttendanceLog } from '../types';

/**
 * PersistenceService handles all database interactions via Supabase.
 */

const SUPABASE_URL = 'https://ymjtfkwmjdfprzajsplz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_SL4Pogy6l_bHxW4Aiu0FVg__YeJwVh1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DB_KEY = 'EDUNEXUS_DATABASE';

interface DatabaseSchema {
  students: Student[];
  staff: Staff[];
  invoices: Invoice[];
  leaveRequests: LeaveRequest[];
  notices: Notice[];
  chats: ChatMessage[];
  certificates: Certificate[];
  attendanceRecords: AttendanceRecord[];
  attendanceLogs: AttendanceLog[];
}

// Helper to convert camelCase string (collection) to snake_case string (table)
const toSnakeTable = (str: string) => str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

/**
 * Recursive helper to convert camelCase object to snake_case for Postgres
 */
const toSnakeCase = (obj: any): any => {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  
  const snakeObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    let value = obj[key];
    
    // Convert empty strings to null for DB consistency
    if (value === "") value = null;
    
    // Recurse into objects (but not null/dates)
    if (value !== null && typeof value === 'object') {
      value = toSnakeCase(value);
    }
    snakeObj[snakeKey] = value;
  }
  return snakeObj;
};

/**
 * Recursive helper to convert snake_case Postgres record to camelCase for TypeScript
 */
const toCamelCase = (obj: any): any => {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  
  const camelObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
    let value = obj[key];
    
    // Recurse into nested objects (JSONB fields)
    if (value !== null && typeof value === 'object') {
      value = toCamelCase(value);
    }
    camelObj[camelKey] = value;
  }
  return camelObj;
};

class PersistenceService {
  private getLocalDB(): DatabaseSchema {
    try {
      const data = localStorage.getItem(DB_KEY);
      if (!data) return { 
        students: [], staff: [], invoices: [], leaveRequests: [], 
        notices: [], chats: [], certificates: [], attendanceRecords: [], attendanceLogs: [] 
      };
      return JSON.parse(data);
    } catch (e) {
      console.warn("Could not read from local storage", e);
      return { 
        students: [], staff: [], invoices: [], leaveRequests: [], 
        notices: [], chats: [], certificates: [], attendanceRecords: [], attendanceLogs: [] 
      };
    }
  }

  private saveLocalDB(db: DatabaseSchema) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.warn("Local storage quota exceeded. Purging local cache.");
        try {
          localStorage.removeItem(DB_KEY);
        } catch (inner) {}
      } else {
        console.error("Local storage error:", e);
      }
    }
  }

  /**
   * Uploads a file to Supabase Storage and returns the public URL
   */
  async uploadFile(bucket: string, path: string, file: Blob | File): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true, contentType: 'image/jpeg' });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  async getAll<K extends keyof DatabaseSchema>(collection: K): Promise<DatabaseSchema[K]> {
    const table = toSnakeTable(collection);
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      const parsedData = data.map(toCamelCase);
      
      const dbLocal = this.getLocalDB();
      dbLocal[collection] = parsedData as any;
      this.saveLocalDB(dbLocal);

      return parsedData as any;
    } catch (error: any) {
      console.warn(`Supabase fetch failed for table [${table}], using local fallback.`, error.message || error);
      return this.getLocalDB()[collection];
    }
  }

  async create<K extends keyof DatabaseSchema>(collection: K, item: any): Promise<void> {
    const table = toSnakeTable(collection);
    
    const dbLocal = this.getLocalDB();
    (dbLocal[collection] as any[]).push(item);
    this.saveLocalDB(dbLocal);

    try {
      const payload = toSnakeCase(item);
      const { error } = await supabase.from(table).insert(payload);
      if (error) throw error;
    } catch (error: any) {
      console.error(`Supabase create error [${table}]:`, error.message || JSON.stringify(error));
      throw new Error(`Cloud Sync Failed: ${error.message || 'Unknown database error'}`);
    }
  }

  async update<K extends keyof DatabaseSchema>(collection: K, id: string, updates: any): Promise<void> {
    const table = toSnakeTable(collection);
    const dbLocal = this.getLocalDB();
    const index = (dbLocal[collection] as any[]).findIndex((item: any) => item.id === id);
    if (index !== -1) {
      dbLocal[collection][index] = { ...dbLocal[collection][index], ...updates };
      this.saveLocalDB(dbLocal);
    }

    try {
      const payload = toSnakeCase(updates);
      const { error } = await supabase.from(table).update(payload).eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      console.error(`Supabase update error [${table}]:`, error.message || JSON.stringify(error));
    }
  }

  async delete<K extends keyof DatabaseSchema>(collection: K, id: string): Promise<void> {
    const table = toSnakeTable(collection);
    const dbLocal = this.getLocalDB();
    dbLocal[collection] = (dbLocal[collection] as any[]).filter((item: any) => item.id !== id);
    this.saveLocalDB(dbLocal);

    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    } catch (error: any) {
      console.error(`Supabase delete error [${table}]:`, error.message || JSON.stringify(error));
    }
  }

  subscribe<K extends keyof DatabaseSchema>(
    collection: K, 
    onInsert?: (payload: any) => void,
    onUpdate?: (payload: any) => void,
    onDelete?: (payload: any) => void
  ): RealtimeChannel {
    const table = toSnakeTable(collection);
    const channel = supabase.channel(`public:${table}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: table }, payload => {
        onInsert?.(toCamelCase(payload.new));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: table }, payload => {
        onUpdate?.(toCamelCase(payload.new));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: table }, payload => {
        onDelete?.(toCamelCase(payload.old));
      })
      .subscribe();

    return channel;
  }

  isConnected(): boolean {
    return !!supabase;
  }
}

export const db = new PersistenceService();
