import {
  Bytes,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { firestoreDb, firebaseStorage, firebaseConfig } from './firebase';
import { TentangGerejaItem, TentangMediaItem } from '../types';

export const MAX_MEDIA_SIZE_MB = 100;
export const MAX_MEDIA_SIZE_BYTES = MAX_MEDIA_SIZE_MB * 1024 * 1024;

export const FIRESTORE_MEDIA_PREFIX = 'firestore-media://';
const MEDIA_META_COLLECTION = 'tentang_media';
const MEDIA_CHUNK_COLLECTION = 'tentang_media_chunks';
// 768 KB binary (~1.02 MB base64 JSON payload, stored as 768 KB native bytes in Firestore < 1 MiB limit)
const BINARY_CHUNK_SIZE = 768 * 1024;

const IDB_DB_NAME = 'hkbp_tentang_media_cache_v1';
const IDB_STORE_NAME = 'media_blobs';

const objectUrlCache = new Map<string, string>();
const pendingResolutions = new Map<string, Promise<string>>();

// Remember when Firebase Storage is unavailable/unconfigured in this session to avoid repeated handshake stalls
let storageUnavailableForSession = false;

export class UploadCancelledError extends Error {
  constructor(message = 'Proses unggah dibatalkan.') {
    super(message);
    this.name = 'UploadCancelledError';
  }
}

export function isUploadCancelledError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof UploadCancelledError) return true;
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('cancel');
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isFirestoreMediaUrl(url?: string): boolean {
  return Boolean(url && url.startsWith(FIRESTORE_MEDIA_PREFIX));
}

export function extractFirestoreMediaId(url: string): string {
  return url.slice(FIRESTORE_MEDIA_PREFIX.length);
}

/**
 * Returns unified media list for a TentangGerejaItem, seamlessly supporting
 * both legacy single `gambar` fields and multi-photo/video `mediaList`.
 */
export function getTentangMediaList(item: TentangGerejaItem): TentangMediaItem[] {
  if (Array.isArray(item.mediaList) && item.mediaList.length > 0) {
    return item.mediaList.filter((m) => m && m.url);
  }
  if (item.gambar) {
    return [
      {
        id: `${item.id}-legacy`,
        type: 'image',
        url: item.gambar,
        judul: item.judulGambar || '',
        keterangan: item.keteranganGambar || '',
      },
    ];
  }
  return [];
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getFirestoreRestDocUrl(collectionName: string, docId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/${collectionName}/${encodeURIComponent(docId)}?key=${firebaseConfig.apiKey}`;
}

function openMediaIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveBlobToIdb(mediaId: string, blob: Blob): Promise<void> {
  try {
    const db = await openMediaIdb();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      store.put(blob, mediaId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    // Ignore IndexedDB quota or private-mode errors
  }
}

async function getBlobFromIdb(mediaId: string): Promise<Blob | null> {
  try {
    const db = await openMediaIdb();
    if (!db) return null;
    const result = await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(mediaId);
      req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
      req.onerror = () => resolve(null);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}

async function deleteBlobFromIdb(mediaId: string): Promise<void> {
  try {
    const db = await openMediaIdb();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).delete(mediaId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    // Ignore
  }
}

async function tryUploadToFirebaseStorage(
  file: File,
  mediaId: string,
  mediaType: 'image' | 'video',
  onProgress?: (pct: number) => void,
  signal?: AbortSignal
): Promise<string> {
  if (signal?.aborted) {
    throw new UploadCancelledError();
  }
  if (!firebaseStorage || storageUnavailableForSession) {
    throw new Error('Firebase Storage is unavailable');
  }

  firebaseStorage.maxUploadRetryTime = 2500;
  firebaseStorage.maxOperationRetryTime = 3000;

  const safeName = (file.name || 'media').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageRef = ref(firebaseStorage, `tentang_gereja/${mediaType}/${mediaId}_${safeName}`);

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    let lastBytesTransferred = 0;

    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
    });

    const cleanup = () => {
      window.clearTimeout(stallTimer);
      signal?.removeEventListener('abort', handleAbort);
    };

    const handleAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        task.cancel();
      } catch {
        // ignore
      }
      reject(new UploadCancelledError());
    };

    signal?.addEventListener('abort', handleAbort, { once: true });

    // Detect unconfigured/CORS-blocked Firebase Storage within 2s so fallback starts fast
    const stallTimer = window.setTimeout(() => {
      if (!settled && lastBytesTransferred === 0) {
        settled = true;
        storageUnavailableForSession = true;
        cleanup();
        try {
          task.cancel();
        } catch {
          // ignore
        }
        reject(new Error('Firebase Storage handshake timeout'));
      }
    }, 2000);

    task.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.bytesTransferred > 0) {
          lastBytesTransferred = snapshot.bytesTransferred;
          window.clearTimeout(stallTimer);
        }
        if (snapshot.totalBytes > 0 && onProgress) {
          const pct = Math.min(99, Math.max(1, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)));
          onProgress(pct);
        }
      },
      (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (signal?.aborted || err?.code === 'storage/canceled') {
          reject(new UploadCancelledError());
          return;
        }
        storageUnavailableForSession = true;
        reject(err);
      },
      async () => {
        if (settled) return;
        settled = true;
        cleanup();
        if (signal?.aborted) {
          reject(new UploadCancelledError());
          return;
        }
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          onProgress?.(100);
          resolve(url);
        } catch (err) {
          storageUnavailableForSession = true;
          reject(err);
        }
      }
    );
  });
}

async function cleanupPartialChunks(mediaId: string, chunkIndices: number[]) {
  if (chunkIndices.length === 0) return;
  try {
    await Promise.all(
      chunkIndices.map((idx) =>
        deleteDoc(doc(firestoreDb, MEDIA_CHUNK_COLLECTION, `${mediaId}__chunk_${idx}`)).catch(() => {})
      )
    );
  } catch {
    // Non-fatal cleanup error
  }
}

async function uploadChunkViaRestOrSdk(
  mediaId: string,
  idx: number,
  uint8: Uint8Array,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) throw new UploadCancelledError();

  const url = getFirestoreRestDocUrl(MEDIA_CHUNK_COLLECTION, `${mediaId}__chunk_${idx}`);
  const base64 = uint8ToBase64(uint8);

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        fields: {
          mediaId: { stringValue: mediaId },
          index: { integerValue: String(idx) },
          data: { bytesValue: base64 },
        },
      }),
    });
    if (res.ok) return;
    if (signal?.aborted) throw new UploadCancelledError();
  } catch (err: any) {
    if (signal?.aborted || isUploadCancelledError(err)) {
      throw new UploadCancelledError();
    }
    // Fallback to SDK if REST PATCH encountered transient issue
  }

  if (signal?.aborted) throw new UploadCancelledError();

  await setDoc(doc(firestoreDb, MEDIA_CHUNK_COLLECTION, `${mediaId}__chunk_${idx}`), {
    mediaId,
    index: idx,
    data: Bytes.fromUint8Array(uint8),
    createdAt: serverTimestamp(),
  });
}

async function uploadToFirestoreChunks(
  file: File,
  mediaId: string,
  mediaType: 'image' | 'video',
  onProgress?: (pct: number) => void,
  signal?: AbortSignal
): Promise<string> {
  if (signal?.aborted) throw new UploadCancelledError();

  const totalBytes = file.size;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / BINARY_CHUNK_SIZE));
  let completedChunks = 0;
  const uploadedIndices: number[] = [];

  onProgress?.(2);

  // 6 concurrent HTTP/2 REST uploads significantly accelerate large video/photo uploads while bounding RAM
  const CONCURRENCY = 6;
  let nextIdx = 0;

  const uploadWorker = async () => {
    while (nextIdx < totalChunks) {
      if (signal?.aborted) {
        throw new UploadCancelledError();
      }
      const idx = nextIdx++;
      const start = idx * BINARY_CHUNK_SIZE;
      const end = Math.min(totalBytes, start + BINARY_CHUNK_SIZE);
      const buffer = await file.slice(start, end).arrayBuffer();
      if (signal?.aborted) {
        throw new UploadCancelledError();
      }
      const uint8 = new Uint8Array(buffer);

      await uploadChunkViaRestOrSdk(mediaId, idx, uint8, signal);
      uploadedIndices.push(idx);

      completedChunks++;
      const pct = Math.min(96, 2 + Math.round((completedChunks / totalChunks) * 94));
      onProgress?.(pct);
    }
  };

  try {
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, totalChunks) }, () => uploadWorker())
    );

    if (signal?.aborted) {
      throw new UploadCancelledError();
    }

    const mimeType = file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
    const metaUrl = getFirestoreRestDocUrl(MEDIA_META_COLLECTION, mediaId);
    const metaRes = await fetch(metaUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        fields: {
          mediaId: { stringValue: mediaId },
          type: { stringValue: mediaType },
          fileName: { stringValue: file.name || `${mediaType}-${mediaId}` },
          fileSize: { integerValue: String(totalBytes) },
          mimeType: { stringValue: mimeType },
          chunkCount: { integerValue: String(totalChunks) },
        },
      }),
    });

    if (!metaRes.ok) {
      if (signal?.aborted) throw new UploadCancelledError();
      await setDoc(doc(firestoreDb, MEDIA_META_COLLECTION, mediaId), {
        mediaId,
        type: mediaType,
        fileName: file.name || `${mediaType}-${mediaId}`,
        fileSize: totalBytes,
        mimeType,
        chunkCount: totalChunks,
        createdAt: serverTimestamp(),
      });
    }

    onProgress?.(100);
    return `${FIRESTORE_MEDIA_PREFIX}${mediaId}`;
  } catch (err) {
    if (signal?.aborted || isUploadCancelledError(err)) {
      cleanupPartialChunks(mediaId, uploadedIndices).catch(() => {});
      throw new UploadCancelledError();
    }
    cleanupPartialChunks(mediaId, uploadedIndices).catch(() => {});
    throw err;
  }
}

/**
 * Validates (max 100 MB) and uploads a photo or video for Tentang Gereja.
 * Supports AbortSignal cancellation and non-blocking IndexedDB caching.
 */
export async function uploadTentangMedia(
  file: File,
  mediaType: 'image' | 'video',
  onProgress?: (pct: number) => void,
  signal?: AbortSignal
): Promise<TentangMediaItem> {
  if (signal?.aborted) {
    throw new UploadCancelledError();
  }
  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    throw new Error(`Ukuran berkas terlalu besar! Maksimal ukuran adalah ${MAX_MEDIA_SIZE_MB} MB.`);
  }

  const mediaId = `tmedia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const mimeType = file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');

  onProgress?.(1);

  let finalUrl = '';
  try {
    finalUrl = await tryUploadToFirebaseStorage(file, mediaId, mediaType, onProgress, signal);
  } catch (storageErr) {
    if (signal?.aborted || isUploadCancelledError(storageErr)) {
      throw new UploadCancelledError();
    }
    console.info('Firebase Storage unavailable, using parallel Firestore chunked media storage:', storageErr);
    finalUrl = await uploadToFirestoreChunks(file, mediaId, mediaType, onProgress, signal);
  }

  // Cache locally in memory & IndexedDB after upload succeeds so upload itself is never delayed
  const localObjectUrl = URL.createObjectURL(file);
  objectUrlCache.set(mediaId, localObjectUrl);
  saveBlobToIdb(mediaId, file).catch(() => {});

  return {
    id: mediaId,
    type: mediaType,
    url: finalUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType,
    judul: '',
    keterangan: '',
  };
}

/**
 * Resolves any TentangMediaItem URL (including `firestore-media://` references)
 * into a browser-renderable URL (`https://`, `data:`, or cached `blob:` ObjectURL).
 */
export async function resolveTentangMediaUrl(url: string): Promise<string> {
  if (!url || !isFirestoreMediaUrl(url)) {
    return url;
  }

  const mediaId = extractFirestoreMediaId(url);
  const cached = objectUrlCache.get(mediaId);
  if (cached) {
    return cached;
  }

  const inflight = pendingResolutions.get(mediaId);
  if (inflight) {
    return inflight;
  }

  const task = (async () => {
    // 1. Check IndexedDB first
    const idbBlob = await getBlobFromIdb(mediaId);
    if (idbBlob) {
      const objUrl = URL.createObjectURL(idbBlob);
      objectUrlCache.set(mediaId, objUrl);
      return objUrl;
    }

    // 2. Fetch metadata + binary chunks from Firestore
    const metaSnap = await getDoc(doc(firestoreDb, MEDIA_META_COLLECTION, mediaId));
    if (!metaSnap.exists()) {
      throw new Error('Berkas media tidak ditemukan di server.');
    }

    const meta = metaSnap.data() as {
      chunkCount?: number;
      mimeType?: string;
    };
    const chunkCount = Number(meta.chunkCount || 0);
    if (chunkCount <= 0) {
      throw new Error('Metadata berkas media tidak valid.');
    }

    const parts: BlobPart[] = new Array(chunkCount);
    const BATCH_SIZE = 8;
    for (let start = 0; start < chunkCount; start += BATCH_SIZE) {
      const end = Math.min(chunkCount, start + BATCH_SIZE);
      const batchSnaps = await Promise.all(
        Array.from({ length: end - start }, (_, offset) => {
          const idx = start + offset;
          return getDoc(doc(firestoreDb, MEDIA_CHUNK_COLLECTION, `${mediaId}__chunk_${idx}`));
        })
      );
      batchSnaps.forEach((cSnap, offset) => {
        const idx = start + offset;
        if (!cSnap.exists()) {
          throw new Error(`Potongan media ${idx} hilang.`);
        }
        const rawData = cSnap.data()?.data;
        if (rawData && typeof rawData.toUint8Array === 'function') {
          const u8 = rawData.toUint8Array() as Uint8Array;
          parts[idx] = new Uint8Array(u8);
        } else if (rawData instanceof Uint8Array) {
          parts[idx] = new Uint8Array(rawData);
        } else if (typeof rawData === 'string') {
          parts[idx] = new Uint8Array(base64ToUint8(rawData));
        } else {
          throw new Error(`Format potongan media ${idx} tidak dikenali.`);
        }
      });
    }

    const blob = new Blob(parts, { type: meta.mimeType || 'application/octet-stream' });
    saveBlobToIdb(mediaId, blob).catch(() => {});

    const objUrl = URL.createObjectURL(blob);
    objectUrlCache.set(mediaId, objUrl);
    return objUrl;
  })();

  pendingResolutions.set(mediaId, task);
  try {
    return await task;
  } finally {
    pendingResolutions.delete(mediaId);
  }
}

/**
 * Cleans up Firestore media metadata/chunks and IndexedDB cache for deleted `firestore-media://` items.
 */
export async function deleteFirestoreMediaByUrl(url?: string): Promise<void> {
  if (!url || !isFirestoreMediaUrl(url)) return;
  const mediaId = extractFirestoreMediaId(url);

  const cached = objectUrlCache.get(mediaId);
  if (cached) {
    try {
      URL.revokeObjectURL(cached);
    } catch {
      // ignore
    }
    objectUrlCache.delete(mediaId);
  }
  await deleteBlobFromIdb(mediaId);

  try {
    const metaRef = doc(firestoreDb, MEDIA_META_COLLECTION, mediaId);
    const metaSnap = await getDoc(metaRef);
    const chunkCount = metaSnap.exists() ? Number(metaSnap.data()?.chunkCount || 0) : 0;
    if (chunkCount > 0) {
      await Promise.all(
        Array.from({ length: chunkCount }, (_, i) =>
          deleteDoc(doc(firestoreDb, MEDIA_CHUNK_COLLECTION, `${mediaId}__chunk_${i}`)).catch(() => {})
        )
      );
    }
    await deleteDoc(metaRef).catch(() => {});
  } catch {
    // Non-fatal cleanup error
  }
}
