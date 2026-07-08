// src/api/common.js
import { collection, getDocs } from 'firebase/firestore';

export const _ttlCache = new Map();
export const TTL_5MIN  = 5 * 60 * 1000;
export const TTL_10MIN = 10 * 60 * 1000;

export function _getCached(key) {
  const entry = _ttlCache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  _ttlCache.delete(key); // expired
  return null;
}

export function _setCached(key, data, ttlMs = TTL_5MIN) {
  _ttlCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function _invalidateCached(...keys) {
  keys.forEach(k => _ttlCache.delete(k));
}

/**
 * Parses a Firestore document. If the document has a 'data' field containing a
 * JSON string (domain object), it merges it with top-level fields.
 */
export function parseFirestoreDoc(docSnap) {
  if (!docSnap.exists()) return null;
  const dto = docSnap.data();
  try {
    const { data: rawData, updatedAt, createdAt, ...topLevelFields } = dto;
    if (rawData && typeof rawData === 'string') {
      const parsed = JSON.parse(rawData);
      return { ...topLevelFields, ...parsed, firebaseId: docSnap.id };
    }
    return { id: docSnap.id, ...dto };
  } catch (e) {
    console.warn(`Error parsing data for doc ${docSnap.id}:`, e);
    return { id: docSnap.id, ...dto };
  }
}

/** Helper to fetch and parse a root collection */
export async function fetchAndParseRootCollection(db, uid, collName) {
  if (!uid) throw new Error("UID is required to fetch data");
  const collRef = collection(db, collName);
  const snapshot = await getDocs(collRef);
  
  return snapshot.docs.map(docSnap => parseFirestoreDoc(docSnap)).filter(Boolean);
}
