import { collection, getDocs, getDoc, doc, setDoc } from 'firebase/firestore';
import { logger } from '../utils/logger.js';

export async function fetchUserRole(db, user) {
  if (!user || !user.uid) return 'VISOR';
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
    return updates.role || data.role || 'VISOR';
  }
  
  const role = user.uid === 'iqy12KgqiDU0Z1QwwbqRSqvSpCM2' ? 'ADMIN' : 'VISOR';
  logger.info(`Setting default role ${role} for user ${user.uid}`);
  await setDoc(docRef, { role, email: user.email || '', createdAt: Date.now() });
  return role;
}

export async function fetchAllUsersRoles(db) {
  const snapshot = await getDocs(collection(db, 'user_metadata'));
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
}

export async function saveUserRole(db, uid, role) {
  const docRef = doc(db, 'user_metadata', uid);
  await setDoc(docRef, { role, updatedAt: Date.now() }, { merge: true });
}
