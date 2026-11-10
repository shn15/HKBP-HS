// Client-side Database & Firestore real-time synchronization service
// Uses per-key documents in `kv_store/{key}` with automatic chunking (`kv_store_chunks`)
// and backward compatibility with legacy `kv_store/all_data`.

import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { firestoreDb, firebaseConfig, OperationType, handleFirestoreError } from './firebase';

const KV_COLLECTION = 'kv_store';
const CHUNK_COLLECTION = 'kv_store_chunks';
const LEGACY_DOC_ID = 'all_data';
const MAX_CHUNK_CHARS = 700000;

const FIRESTORE_DOC_REST_URL = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${KV_COLLECTION}/${LEGACY_DOC_ID}?key=${firebaseConfig.apiKey}`;
const FIRESTORE_RUN_QUERY_URL = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents:runQuery?key=${firebaseConfig.apiKey}`;

function safeParseJsonOrString(rawValue: string): any {
  try {
    if (rawValue.startsWith('{') || rawValue.startsWith('[')) {
      return JSON.parse(rawValue);
    }
    return rawValue;
  } catch {
    return rawValue;
  }
}

function parseFirestoreDoc(docJson: any): Record<string, any> {
  if (!docJson || !docJson.fields) return {};
  const data: Record<string, any> = {};
  for (const [key, valueObj] of Object.entries(docJson.fields)) {
    const rawValue = (valueObj as any)?.stringValue;
    if (rawValue !== undefined && rawValue !== null) {
      data[key] = safeParseJsonOrString(rawValue);
    }
  }
  return data;
}

// Track active local writes so real-time snapshots don't overwrite optimistic local UI before server ack
const pendingWriteUntil: Record<string, number> = {};
const localClientTimestamps: Record<string, number> = {};

// Cache assembled chunked docs by `${key}:${marker}` to avoid re-fetching unchanged large PDFs/images on unrelated updates
const chunkedValueCache = new Map<string, { marker: string; value: any }>();

export function getLocalClientTimestamp(key: string): number {
  return localClientTimestamps[key] || 0;
}

export function isLocallyPendingWrite(key: string): boolean {
  const until = pendingWriteUntil[key] || 0;
  return Date.now() < until;
}

function normalizeKeyAndValue(key: string, value: any): { targetKey: string; targetValue: any } {
  if (key === 'hkbp_buku_nyanyian_db' && Array.isArray(value)) {
    const customOnly = value.filter((s: any) => s && s.isCustom);
    return { targetKey: 'hkbp_custom_songs', targetValue: customOnly };
  }
  return { targetKey: key, targetValue: value };
}

function serializeValue(value: any): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

async function fetchChunkedValue(key: string, chunkCount: number, marker: string): Promise<any> {
  const cached = chunkedValueCache.get(key);
  if (cached && cached.marker === marker) {
    return cached.value;
  }

  const indices = Array.from({ length: chunkCount }, (_, i) => i);
  const chunkDocs = await Promise.all(
    indices.map((i) => getDocFromServer(doc(firestoreDb, CHUNK_COLLECTION, `${key}__chunk_${i}`)))
  );

  let combined = '';
  for (const cDoc of chunkDocs) {
    if (!cDoc.exists()) {
      throw new Error(`Missing chunk for ${key}`);
    }
    const cData = cDoc.data();
    combined += String(cData?.chunk || '');
  }

  const parsed = safeParseJsonOrString(combined);
  chunkedValueCache.set(key, { marker, value: parsed });
  return parsed;
}

async function buildMergedDbFromSnapshot(snapshot: QuerySnapshot<DocumentData>): Promise<Record<string, any>> {
  const merged: Record<string, any> = {};
  const legacyTimestamps: Record<string, number> = {};
  const perKeyDocs: Array<{ id: string; data: DocumentData }> = [];

  snapshot.docs.forEach((d) => {
    if (d.id === LEGACY_DOC_ID) {
      const raw = d.data();
      for (const [k, v] of Object.entries(raw)) {
        if (k.startsWith('updated_at_')) {
          const baseKey = k.slice('updated_at_'.length);
          legacyTimestamps[baseKey] = Number(v) || 0;
          merged[k] = v;
        } else if (typeof v === 'string') {
          merged[k] = safeParseJsonOrString(v);
        } else if (v !== undefined && v !== null) {
          merged[k] = v;
        }
      }
    } else if (d.id !== 'test_doc') {
      perKeyDocs.push({ id: d.id, data: d.data() });
    }
  });

  await Promise.all(
    perKeyDocs.map(async ({ id, data }) => {
      try {
        const docServerTs =
          typeof data.updatedAt?.toMillis === 'function'
            ? data.updatedAt.toMillis()
            : Number(data.clientTs || 0);
        const legacyTs = legacyTimestamps[id] || 0;

        // Only skip per-key doc if legacy all_data explicitly has a strictly newer timestamp written recently
        if (legacyTs > docServerTs + 60000 && merged[id] !== undefined) {
          return;
        }

        if (data.isChunked && Number(data.chunkCount) > 0) {
          const marker = `${docServerTs}_${data.clientTs || ''}_${data.chunkCount}`;
          const val = await fetchChunkedValue(id, Number(data.chunkCount), marker);
          merged[id] = val;
          merged[`updated_at_${id}`] = docServerTs || Date.now();
        } else if (typeof data.valueStr === 'string') {
          merged[id] = safeParseJsonOrString(data.valueStr);
          merged[`updated_at_${id}`] = docServerTs || Date.now();
        } else if (data.value !== undefined) {
          merged[id] = data.value;
          merged[`updated_at_${id}`] = docServerTs || Date.now();
        }
      } catch (err) {
        console.warn(`Failed to decode kv_store/${id}:`, err);
      }
    })
  );

  return merged;
}

/**
 * Fetch database records directly from Firestore SDK (bypassing cache),
 * with fallback to Firestore REST API and Express `/api/db`.
 */
export async function fetchDbFromServer(): Promise<Record<string, any> | null> {
  // 1. Primary: Official Firebase Firestore SDK (getDocsFromServer guarantees fresh cross-device state)
  try {
    const snap = await getDocsFromServer(collection(firestoreDb, KV_COLLECTION));
    const merged = await buildMergedDbFromSnapshot(snap);
    if (Object.keys(merged).length > 0) {
      return merged;
    }
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.LIST, KV_COLLECTION);
    }
    console.warn('Firestore SDK fetch failed, trying REST / backend fallback:', err);
  }

  // 2. Fallback: Express backend `/api/db` (when running in AI Studio / local Node server)
  const cacheBuster = `_t=${Date.now()}`;
  try {
    const res = await fetch(`/api/db?${cacheBuster}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        return data;
      }
    }
  } catch {
    // Ignore when Express server is not running (e.g. Vercel static host)
  }

  // 3. Fallback: Firestore REST API (runQuery)
  try {
    const queryRes = await fetch(`${FIRESTORE_RUN_QUERY_URL}&${cacheBuster}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: KV_COLLECTION }],
        },
      }),
    });
    if (queryRes.ok) {
      const rows = await queryRes.json();
      const docs = Array.isArray(rows) ? rows.map((r: any) => r?.document).filter(Boolean) : [];
      if (docs.length > 0) {
        const merged: Record<string, any> = {};
        const legacyDoc = docs.find((d: any) => d.name?.endsWith(`/${LEGACY_DOC_ID}`));
        if (legacyDoc) {
          Object.assign(merged, parseFirestoreDoc(legacyDoc));
        }
        for (const d of docs) {
          const docId = String(d.name || '').split('/').pop() || '';
          if (!docId || docId === LEGACY_DOC_ID || docId === 'test_doc') continue;
          const fields = d.fields || {};
          const valueStr = fields.valueStr?.stringValue;
          if (typeof valueStr === 'string' && !fields.isChunked?.booleanValue) {
            merged[docId] = safeParseJsonOrString(valueStr);
          }
        }
        if (Object.keys(merged).length > 0) {
          return merged;
        }
      }
    }

    const res = await fetch(`${FIRESTORE_DOC_REST_URL}&${cacheBuster}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
    if (res.status === 200) {
      const docJson = await res.json();
      return parseFirestoreDoc(docJson);
    }
  } catch (err) {
    console.warn('Firestore REST API direct query failed:', err);
  }

  return null;
}

/**
 * Subscribe to real-time Firestore changes across all devices.
 * Returns an unsubscribe function.
 */
export function subscribeToDb(onUpdate: (db: Record<string, any>) => void): () => void {
  let active = true;

  const unsubscribe = onSnapshot(
    collection(firestoreDb, KV_COLLECTION),
    (snapshot) => {
      // Ignore purely local unconfirmed snapshots while writes are still pending
      if (snapshot.metadata.hasPendingWrites) {
        return;
      }
      buildMergedDbFromSnapshot(snapshot)
        .then((merged) => {
          if (active && Object.keys(merged).length > 0) {
            onUpdate(merged);
          }
        })
        .catch((err) => {
          console.warn('Failed to process Firestore snapshot:', err);
        });
    },
    (error) => {
      console.warn('Firestore onSnapshot error:', error);
    }
  );

  return () => {
    active = false;
    unsubscribe();
  };
}

/**
 * Save single key-value pair to localStorage, Firestore (`kv_store/{key}` with auto-chunking),
 * and optionally Express `/api/db` in local dev.
 */
export async function saveDbKey(key: string, value: any): Promise<boolean> {
  const timestamp = Date.now();
  localClientTimestamps[key] = timestamp;
  pendingWriteUntil[key] = timestamp + 8000;

  // Update localStorage immediately for responsive client state
  try {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, String(value));
    }
    localStorage.setItem(`updated_at_${key}`, String(timestamp));
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }

  const { targetKey, targetValue } = normalizeKeyAndValue(key, value);
  if (targetKey !== key) {
    pendingWriteUntil[targetKey] = timestamp + 8000;
  }

  let firestoreOk = false;
  try {
    const serialized = serializeValue(targetValue);
    if (serialized.length <= MAX_CHUNK_CHARS) {
      await setDoc(doc(firestoreDb, KV_COLLECTION, targetKey), {
        valueStr: serialized,
        isChunked: false,
        chunkCount: 0,
        clientTs: timestamp,
        updatedAt: serverTimestamp(),
      });
    } else {
      const chunks: string[] = [];
      for (let i = 0; i < serialized.length; i += MAX_CHUNK_CHARS) {
        chunks.push(serialized.slice(i, i + MAX_CHUNK_CHARS));
      }
      await Promise.all(
        chunks.map((chunk, idx) =>
          setDoc(doc(firestoreDb, CHUNK_COLLECTION, `${targetKey}__chunk_${idx}`), {
            key: targetKey,
            index: idx,
            chunk,
            clientTs: timestamp,
            updatedAt: serverTimestamp(),
          })
        )
      );
      await setDoc(doc(firestoreDb, KV_COLLECTION, targetKey), {
        valueStr: '',
        isChunked: true,
        chunkCount: chunks.length,
        clientTs: timestamp,
        updatedAt: serverTimestamp(),
      });
    }
    firestoreOk = true;
    // Allow incoming snapshots again shortly after Firestore confirms the write
    pendingWriteUntil[key] = Date.now() + 1200;
    if (targetKey !== key) {
      pendingWriteUntil[targetKey] = Date.now() + 1200;
    }
  } catch (err: any) {
    console.error(`Firestore saveDbKey failed for '${targetKey}':`, err);
    if (err?.code === 'permission-denied') {
      handleFirestoreError(err, OperationType.WRITE, `${KV_COLLECTION}/${targetKey}`);
    }
  }

  // Also sync with Express backend when running locally/AI Studio (never blocks Firestore)
  fetch('/api/db', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  }).catch(() => {});

  return firestoreOk;
}

/**
 * Save batch updates to database.
 */
export async function saveDbBatch(batchData: Record<string, any>): Promise<boolean> {
  const entries = Object.entries(batchData);
  const results = await Promise.all(entries.map(([k, v]) => saveDbKey(k, v)));
  return results.every(Boolean);
}
