// src/api/UserApi.js
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { _getCached, _setCached, _invalidateCached, TTL_10MIN } from './common.js';

/**
 * USER PERMISSIONS API (RBAC)
 */
export async function fetchUserRole(db, user) {
  if (!user || !user.uid) return 'VISOR';
  const meta = await fetchUserMetadata(db, user);
  return meta.role || 'VISOR';
}

/**
 * Fetch the complete user metadata (role, email, allowed views, etc.) from user_metadata.
 */
export async function fetchUserMetadata(db, user) {
  if (!user || !user.uid) return { role: 'VISOR', allowedViews: [] };
  const docRef = doc(db, 'user_metadata', user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    let updates = {};
    if (user.uid === 'iqy12KgqiDU0Z1QwwbqRSqvSpCM2' && data.role !== 'ADMIN') {
      updates.role = 'ADMIN';
    }
    if (!data.email && user.email) {
      updates.email = user.email;
    }
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = Date.now();
      await setDoc(docRef, updates, { merge: true });
    }
    return { ...data, ...updates };
  }

  const role = user.uid === 'iqy12KgqiDU0Z1QwwbqRSqvSpCM2' ? 'ADMIN' : 'VISOR';
  const defaultMeta = { role, email: user.email || '', allowedViews: [], createdAt: Date.now() };
  console.log(`Setting default metadata ${role} for user ${user.uid}`);
  await setDoc(docRef, defaultMeta);
  return defaultMeta;
}

export async function fetchAllUsersRoles(db) {
  const cacheKey = 'user_metadata:all';
  const cached = _getCached(cacheKey);
  if (cached) return cached;
  const snapshot = await getDocs(collection(db, 'user_metadata'));
  const result = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  _setCached(cacheKey, result, TTL_10MIN);
  return result;
}

export async function saveUserRole(db, uid, role, allowedViews = null) {
  const docRef = doc(db, 'user_metadata', uid);
  const updateData = { role, updatedAt: Date.now() };
  if (allowedViews !== null) {
    updateData.allowedViews = allowedViews;
  }
  await setDoc(docRef, updateData, { merge: true });
  _invalidateCached('user_metadata:all');
}

export async function deleteUserMetadata(db, uid) {
  const docRef = doc(db, 'user_metadata', uid);
  await deleteDoc(docRef);
  _invalidateCached('user_metadata:all');
}
