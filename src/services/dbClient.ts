// Client-side Database & Firestore synchronization service
// Enables full data persistence on AI Studio, Vercel, Netlify, and static deployments.

import firebaseConfigFile from '../../firebase-applet-config.json';

export interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
}

const config: FirebaseAppletConfig = firebaseConfigFile as FirebaseAppletConfig;

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/kv_store/all_data?key=${config.apiKey}`;

function parseFirestoreDoc(doc: any): any {
  if (!doc || !doc.fields) return {};
  const data: any = {};
  for (const [key, valueObj] of Object.entries(doc.fields)) {
    const rawValue = (valueObj as any)?.stringValue;
    if (rawValue) {
      try {
        if (rawValue.startsWith('{') || rawValue.startsWith('[')) {
          data[key] = JSON.parse(rawValue);
        } else {
          data[key] = rawValue;
        }
      } catch {
        data[key] = rawValue;
      }
    }
  }
  return data;
}

function serializeFields(data: any): any {
  const fields: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      // Don't send giant static song database in single kv_store document (>1MB limit)
      if (key === 'hkbp_buku_nyanyian_db' && Array.isArray(value)) {
        const customOnly = value.filter((s: any) => s && s.isCustom);
        if (customOnly.length > 0) {
          fields['hkbp_custom_songs'] = { stringValue: JSON.stringify(customOnly) };
        }
        continue;
      }

      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      // Safety check: Firestore single document field max size limit
      if (stringValue.length < 800000) {
        fields[key] = { stringValue };
      } else {
        console.warn(`Skipping key '${key}' in single Firestore document payload as string length (${stringValue.length}) exceeds safety limit.`);
      }
    }
  }
  return fields;
}

/**
 * Fetch database records from either Express backend or direct Firestore REST API.
 * This guarantees loading data on Vercel even when server.ts is not running.
 */
export async function fetchDbFromServer(): Promise<any> {
  // 1. Try Express backend endpoint
  try {
    const res = await fetch('/api/db');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        return data;
      }
    }
  } catch (err) {
    console.warn('API /api/db unreachable, falling back to direct Firestore REST API:', err);
  }

  // 2. Direct Firestore REST API (works on Vercel, Netlify, and client-side)
  try {
    const res = await fetch(FIRESTORE_URL);
    if (res.status === 200) {
      const doc = await res.json();
      const parsed = parseFirestoreDoc(doc);
      console.log('Successfully fetched database directly from Firestore REST API.');
      return parsed;
    }
  } catch (err) {
    console.warn('Firestore REST API direct query failed:', err);
  }

  return null;
}

/**
 * Save single key-value pair to database.
 * Updates localStorage first, then tries backend /api/db, with seamless fallback to Firestore REST API for Vercel.
 */
export async function saveDbKey(key: string, value: any): Promise<boolean> {
  // Always update localStorage first for instantaneous client state
  try {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, String(value));
    }
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }

  // 1. Try Express backend
  let savedToBackend = false;
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      savedToBackend = true;
      return true;
    }
  } catch (err) {
    // Expected on Vercel / static deployments
    console.info('Backend /api/db unavailable. Proceeding with direct Firestore synchronization.');
  }

  // 2. Direct Firestore fallback (essential for Vercel deployment)
  if (!savedToBackend) {
    try {
      let currentData: any = {};
      const getRes = await fetch(FIRESTORE_URL);
      if (getRes.status === 200) {
        const doc = await getRes.json();
        currentData = parseFirestoreDoc(doc);
      }
      currentData[key] = value;

      const fields = serializeFields(currentData);
      const patchRes = await fetch(FIRESTORE_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      if (patchRes.ok) {
        console.log(`Saved ${key} directly to Firestore on Vercel.`);
        return true;
      }
    } catch (err) {
      console.error('Direct Firestore save failed:', err);
    }
  }

  return true; // Still returns true because localStorage is preserved
}

/**
 * Save batch updates to database.
 */
export async function saveDbBatch(batchData: Record<string, any>): Promise<boolean> {
  // Update localStorage
  try {
    for (const [k, v] of Object.entries(batchData)) {
      if (typeof v === 'object') {
        localStorage.setItem(k, JSON.stringify(v));
      } else {
        localStorage.setItem(k, String(v));
      }
    }
  } catch (e) {
    console.error('LocalStorage batch write failed:', e);
  }

  // 1. Try Express backend
  let savedToBackend = false;
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: batchData })
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      savedToBackend = true;
      return true;
    }
  } catch (err) {
    console.info('Backend /api/db unavailable for batch. Proceeding with direct Firestore.');
  }

  // 2. Direct Firestore fallback
  if (!savedToBackend) {
    try {
      let currentData: any = {};
      const getRes = await fetch(FIRESTORE_URL);
      if (getRes.status === 200) {
        const doc = await getRes.json();
        currentData = parseFirestoreDoc(doc);
      }
      Object.assign(currentData, batchData);

      const fields = serializeFields(currentData);
      const patchRes = await fetch(FIRESTORE_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });
      if (patchRes.ok) {
        return true;
      }
    } catch (err) {
      console.error('Direct Firestore batch save failed:', err);
    }
  }

  return true;
}
