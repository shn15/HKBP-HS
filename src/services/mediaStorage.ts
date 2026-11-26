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
import { firestoreDb, firebaseStorage } from './firebase';
import { TentangGerejaItem, TentangMediaItem } from '../types';

export const MAX_MEDIA_SIZE_MB = 100;
export const MAX_MEDIA_SIZE_BYTES = MAX_MEDIA_SIZE_MB * 1024 * 1024;

export const FIRESTORE_MEDIA_PREFIX = 'firestore-media://';
const MEDIA_META_COLLECTION = 'tentang_media';
const MEDIA_CHUNK_COLLECTION = 'tentang_media_chunks';
const BINARY_CHUNK_SIZE = 512 * 1024; // 512 KB binary per Firestore document (< 1 MB limit)

const IDB_DB_NAME = 'hkbp_tentang_media_cache_v1';
const IDB_STORE_NAME = 'media_blobs';

const objectUrlCache = new Map<string, string>();
const pendingResolutions = new Map<string, Promise<string>>();

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
  onProgress?: (pct: number) => void
): Promise<string> {
  if (!firebaseStorage) {
    throw new Error('Firebase Storage is not initialized');
  }

  // Fail fast so unprovisioned/locked Storage buckets fall back seamlessly to Firestore chunks
  firebaseStorage.maxUploadRetryTime = 5000;
  firebaseStorage.maxOperationRetryTime = 6000;

  const safeName = (file.name || 'media').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageRef = ref(firebaseStorage, `tentang_gereja/${mediaType}/${mediaId}_${safeName}`);

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    let lastBytesTransferred = 0;

    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
    });

    const stallTimer = window.setTimeout(() => {
      if (!settled && lastBytesTransferred === 0) {
        settled = true;
        try {
          task.cancel();
        } catch {
          // ignore
        }
        reject(new Error('Firebase Storage handshake timeout'));
      }
    }, 6000);

    task.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.bytesTransferred > 0) {
          lastBytesTransferred = snapshot.bytesTransferred;
          window.clearTimeout(stallTimer);
        }
        if (snapshot.totalBytes > 0 && onProgress) {
          const pct = Math.min(99, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          onProgress(pct);
        }
      },
      (err) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(stallTimer);
        reject(err);
      },
      async () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(stallTimer);
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          onProgress?.(100);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

async function uploadToFirestoreChunks(
  file: File,
  mediaId: string,
  mediaType: 'image' | 'video',
  onProgress?: (pct: number) => void
): Promise<string> {
  const totalBytes = file.size;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / BINARY_CHUNK_SIZE));
  let completedChunks = 0;

  onProgress?.(5);

  // Upload chunks with bounded concurrency (3) to avoid memory spikes for up to 100 MB files
  const CONCURRENCY = 3;
  let nextIdx = 0;

  const uploadWorker = async () => {
    while (nextIdx < totalChunks) {
      const idx = nextIdx++;
      const start = idx * BINARY_CHUNK_SIZE;
      const end = Math.min(totalBytes, start + BINARY_CHUNK_SIZE);
      const buffer = await file.slice(start, end).arrayBuffer();
      const uint8 = new Uint8Array(buffer);

      await setDoc(doc(firestoreDb, MEDIA_CHUNK_COLLECTION, `${mediaId}__chunk_${idx}`), {
        mediaId,
        index: idx,
        data: Bytes.fromUint8Array(uint8),
        createdAt: serverTimestamp(),
      });

      completedChunks++;
      const pct = Math.min(95, 5 + Math.round((completedChunks / totalChunks) * 90));
      onProgress?.(pct);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, totalChunks) }, () => uploadWorker())
  );

  await setDoc(doc(firestoreDb, MEDIA_META_COLLECTION, mediaId), {
    mediaId,
    type: mediaType,
    fileName: file.name || `${mediaType}-${mediaId}`,
    fileSize: totalBytes,
    mimeType: file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
    chunkCount: totalChunks,
    createdAt: serverTimestamp(),
  });

  onProgress?.(100);
  return `${FIRESTORE_MEDIA_PREFIX}${mediaId}`;
}

/**
 * Validates (max 100 MB) and uploads a photo or video for Tentang Gereja.
 * Immediately caches the Blob in IndexedDB + memory ObjectURL cache so playback/preview is instant.
 */
export async function uploadTentangMedia(
  file: File,
  mediaType: 'image' | 'video',
  onProgress?: (pct: number) => void
): Promise<TentangMediaItem> {
  if (file.size > MAX_MEDIA_SIZE_BYTES) {
    throw new Error(`Ukuran berkas terlalu besar! Maksimal ukuran adalah ${MAX_MEDIA_SIZE_MB} MB.`);
  }

  const mediaId = `tmedia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const mimeType = file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');

  // Cache locally in memory and IndexedDB right away
  const localObjectUrl = URL.createObjectURL(file);
  objectUrlCache.set(mediaId, localObjectUrl);
  await saveBlobToIdb(mediaId, file);

  let finalUrl = '';
  try {
    finalUrl = await tryUploadToFirebaseStorage(file, mediaId, mediaType, onProgress);
  } catch (storageErr) {
    console.info('Firebase Storage unavailable, using Firestore chunked media storage:', storageErr);
    finalUrl = await uploadToFirestoreChunks(file, mediaId, mediaType, onProgress);
  }

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
    const BATCH_SIZE = 6;
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
        } else {
          throw new Error(`Format potongan media ${idx} tidak dikenali.`);
        }
      });
    }

    const blob = new Blob(parts, { type: meta.mimeType || 'application/octet-stream' });
    await saveBlobToIdb(mediaId, blob);

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
