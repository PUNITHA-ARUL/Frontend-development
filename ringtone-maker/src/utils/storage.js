/**
 * Storage manager for Saved Ringtones.
 * Uses localStorage for metadata and IndexedDB for audio Blob persistence
 * (with fallback to base64 in localStorage).
 */

const STORAGE_KEY = 'ringtone_maker_saved_ringtones_v1';
const DB_NAME = 'RingtoneMakerDB';
const DB_STORE = 'audio_blobs';

function openDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function saveRingtoneToStorage(ringtone, audioBlob) {
  // Convert blob to base64 as fallback or for immediate portability
  let fallbackDataUrl = null;
  try {
    const db = await openDB();
    if (db) {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        store.put({ id: ringtone.id, blob: audioBlob });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } else {
      fallbackDataUrl = await blobToDataUrl(audioBlob);
    }
  } catch (err) {
    console.warn('IndexedDB write failed, falling back to dataUrl:', err);
    try {
      fallbackDataUrl = await blobToDataUrl(audioBlob);
    } catch (e) {
      console.error('DataUrl conversion failed:', e);
    }
  }

  // Save metadata to localStorage
  const ringtoneMeta = {
    ...ringtone,
    hasIndexedBlob: true,
    dataUrl: fallbackDataUrl, // populated only if IndexedDB unavailable
  };

  const existing = getSavedRingtonesMetadata();
  const updated = [ringtoneMeta, ...existing.filter((item) => item.id !== ringtone.id)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save to localStorage, attempting without dataUrl', err);
    delete ringtoneMeta.dataUrl;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([ringtoneMeta, ...existing.filter((item) => item.id !== ringtone.id)]));
  }

  return ringtoneMeta;
}

export function getSavedRingtonesMetadata() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading saved ringtones from localStorage:', err);
    return [];
  }
}

export async function getRingtoneAudioBlob(ringtoneId, fallbackDataUrl) {
  try {
    const db = await openDB();
    if (db) {
      const record = await new Promise((resolve) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const store = tx.objectStore(DB_STORE);
        const req = store.get(ringtoneId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (record && record.blob) {
        return record.blob;
      }
    }
  } catch (err) {
    console.warn('IndexedDB read error:', err);
  }

  // Fallback to dataUrl if available
  if (fallbackDataUrl) {
    try {
      const res = await fetch(fallbackDataUrl);
      return await res.blob();
    } catch (e) {
      console.error('Failed to convert fallback dataUrl to blob:', e);
    }
  }
  return null;
}

export async function deleteRingtoneFromStorage(ringtoneId) {
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).delete(ringtoneId);
    }
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }

  const existing = getSavedRingtonesMetadata();
  const updated = existing.filter((item) => item.id !== ringtoneId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
