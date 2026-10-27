/**
 * @file SecurityConfigApi.js
 * @description API para la gestión de configuración de seguridad del sistema y contraseña maestra (PIN).
 * @module adapters/api/SecurityConfigApi
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { _getCached, _setCached, _invalidateCached, TTL_5MIN } from './common.js';

const CACHE_KEY = 'system_config:security';

/**
 * Obtiene la contraseña maestra (PIN) configurada en Firestore.
 * @param {Object} db - Instancia de Firestore.
 * @returns {Promise<string>} Contraseña maestra o fallback por defecto ("180283").
 */
export async function fetchMasterPin(db) {
  const cached = _getCached(CACHE_KEY);
  if (cached && cached.masterPin) return cached.masterPin;

  try {
    const docRef = doc(db, 'system_config', 'security');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const pin = (data && data.masterPin) ? String(data.masterPin).trim() : '180283';
      _setCached(CACHE_KEY, { masterPin: pin }, TTL_5MIN);
      return pin;
    }
  } catch (e) {
    console.warn('Error fetching master pin from Firestore:', e);
  }

  return '180283';
}

/**
 * Actualiza la contraseña maestra (PIN) en Firestore.
 * @param {Object} db - Instancia de Firestore.
 * @param {string} newPin - Nuevo PIN maestro (mínimo 4 caracteres).
 * @param {string} userEmail - Email o identificador del usuario que realiza el cambio.
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function updateMasterPin(db, newPin, userEmail = '') {
  const trimmed = String(newPin || '').trim();
  if (!trimmed || trimmed.length < 4) {
    throw new Error('La contraseña maestra debe tener al menos 4 caracteres.');
  }

  const docRef = doc(db, 'system_config', 'security');
  const payload = {
    masterPin: trimmed,
    updatedAt: Date.now(),
    updatedBy: userEmail || 'ADMIN'
  };

  await setDoc(docRef, payload, { merge: true });
  _invalidateCached(CACHE_KEY);
  return { success: true };
}
