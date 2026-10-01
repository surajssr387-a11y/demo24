// Native Browser IndexedDB Media Storage for direct Device Photo & Video uploads
// Works on all phones (iOS Safari, Android Chrome), tablets, and desktop browsers without size limits

const DB_NAME = 'RamysStudioMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

interface StoredMediaRecord {
  id: string; // unique key, e.g. "reel-hiphop-video", "reel-hiphop-thumb", "hero-video"
  name: string;
  type: string;
  size: number;
  blob: Blob;
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}

// In-memory cache of created object URLs so we don't recreate excessively
const objectUrlCache = new Map<string, string>();

/**
 * Format bytes into human readable string (KB / MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Store a File or Blob directly from any device into IndexedDB
 */
export async function saveDeviceMediaFile(
  key: string,
  file: File | Blob,
  fallbackName?: string
): Promise<{ url: string; name: string; sizeFormatted: string; size: number }> {
  try {
    const db = await getDb();
    const fileName = (file as File).name || fallbackName || `device-upload-${Date.now()}`;
    const fileType = file.type || 'application/octet-stream';
    const fileSize = file.size;

    const record: StoredMediaRecord = {
      id: key,
      name: fileName,
      type: fileType,
      size: fileSize,
      blob: file,
      updatedAt: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(record);

      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });

    // Revoke previous URL if cached
    if (objectUrlCache.has(key)) {
      try {
        URL.revokeObjectURL(objectUrlCache.get(key)!);
      } catch {
        // Ignore
      }
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlCache.set(key, objectUrl);

    // Save a reference in localStorage so components know this key has device media
    try {
      localStorage.setItem(`device_media_${key}`, JSON.stringify({
        key,
        name: fileName,
        sizeFormatted: formatBytes(fileSize),
        type: fileType,
        updatedAt: Date.now(),
      }));
    } catch {
      // LocalStorage quota might be tight, but IndexedDB has the actual file
    }

    return {
      url: objectUrl,
      name: fileName,
      sizeFormatted: formatBytes(fileSize),
      size: fileSize,
    };
  } catch (err) {
    console.error('Failed to save media blob to IndexedDB:', err);
    // Fallback: create temporary object URL
    const objectUrl = URL.createObjectURL(file);
    return {
      url: objectUrl,
      name: (file as File).name || 'Upload',
      sizeFormatted: formatBytes(file.size),
      size: file.size,
    };
  }
}

/**
 * Retrieve a stored device media file from IndexedDB as a playable/displayable URL
 */
export async function getDeviceMediaUrl(key: string): Promise<string | null> {
  if (objectUrlCache.has(key)) {
    return objectUrlCache.get(key)!;
  }

  try {
    const db = await getDb();
    const record = await new Promise<StoredMediaRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(key);

      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    });

    if (record && record.blob) {
      const objectUrl = URL.createObjectURL(record.blob);
      objectUrlCache.set(key, objectUrl);
      return objectUrl;
    }
  } catch (err) {
    console.warn(`Could not load media for key ${key}:`, err);
  }

  return null;
}

export async function getDeviceMediaBlob(key: string): Promise<Blob | null> {
  try {
    const db = await getDb();
    const record = await new Promise<StoredMediaRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(key);

      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    });

    return record && record.blob ? record.blob : null;
  } catch (err) {
    console.warn(`Could not get media blob for key ${key}:`, err);
    return null;
  }
}

/**
 * Check if a URL is a special device-stored key or blob
 */
export function isDeviceMediaKey(url?: string | null): boolean {
  return typeof url === 'string' && url.startsWith('device-idb:');
}

/**
 * Convert standard device-idb key to URL or return original url
 */
export async function resolvePlayableUrl(urlOrKey?: string | null): Promise<string> {
  if (!urlOrKey) return '';
  if (isDeviceMediaKey(urlOrKey)) {
    const key = urlOrKey.replace('device-idb:', '');
    const resolved = await getDeviceMediaUrl(key);
    if (resolved) return resolved;
  }
  return urlOrKey;
}

/**
 * Delete a stored device file
 */
export async function deleteDeviceMedia(key: string): Promise<void> {
  try {
    const db = await getDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delReq = store.delete(key);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
    });

    if (objectUrlCache.has(key)) {
      try {
        URL.revokeObjectURL(objectUrlCache.get(key)!);
      } catch {
        // Ignore
      }
      objectUrlCache.delete(key);
    }
    localStorage.removeItem(`device_media_${key}`);
  } catch (err) {
    console.error(`Failed to delete media ${key}:`, err);
  }
}
