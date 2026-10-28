/**
 * @file SecurityConfigApi.js
 * @description API para la gestión de configuración de seguridad del sistema, contraseña maestra (PIN)
 * y credenciales de acceso previo (Gatekeeper institucional - Paso 1).
 * @module adapters/api/SecurityConfigApi
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { _getCached, _setCached, _invalidateCached, TTL_5MIN } from './common.js';

const CACHE_KEY = 'system_config:security';

export const DEFAULT_SECURITY_CONFIG = {
  masterPin: '180283',
  gatekeeperUser: 'pampa',
  gatekeeperPass: 'pampa2026'
};

/**
 * Obtiene la configuración completa de seguridad desde Firestore (o fallback).
 * @param {Object} db - Instancia de Firestore.
 * @returns {Promise<{masterPin: string, gatekeeperUser: string, gatekeeperPass: string}>}
 */
export async function fetchSecurityConfig(db) {
  const cached = _getCached(CACHE_KEY);
  if (cached && cached.masterPin && cached.gatekeeperUser) {
    return cached;
  }

  try {
    const docRef = doc(db, 'system_config', 'security');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() || {};
      const config = {
        masterPin: String(data.masterPin || DEFAULT_SECURITY_CONFIG.masterPin).trim(),
        gatekeeperUser: String(data.gatekeeperUser || DEFAULT_SECURITY_CONFIG.gatekeeperUser).trim(),
        gatekeeperPass: String(data.gatekeeperPass || DEFAULT_SECURITY_CONFIG.gatekeeperPass).trim()
      };
      _setCached(CACHE_KEY, config, TTL_5MIN);
      return config;
    }
  } catch (e) {
    console.warn('Advertencia al consultar system_config/security en Firestore:', e?.message || e);
  }

  return { ...DEFAULT_SECURITY_CONFIG };
}

/**
 * Obtiene la contraseña maestra (PIN) configurada en Firestore.
 * @param {Object} db - Instancia de Firestore.
 * @returns {Promise<string>} Contraseña maestra o fallback por defecto ("180283").
 */
export async function fetchMasterPin(db) {
  const cfg = await fetchSecurityConfig(db);
  return cfg.masterPin;
}

/**
 * Actualiza la contraseña maestra (PIN) en Firestore.
 * @param {Object} db - Instancia de Firestore.
 * @param {string} newPin - Nuevo PIN maestro (mínimo 4 caracteres).
 * @param {string} userEmail - Email o identificador del usuario que realiza el cambio.
 * @returns {Promise<{success: boolean}>}
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

/**
 * Actualiza las credenciales de acceso institucional (Gatekeeper - Paso 1) en Firestore.
 * @param {Object} db - Instancia de Firestore.
 * @param {string} username - Nuevo usuario.
 * @param {string} password - Nueva contraseña.
 * @param {string} userEmail - Email del administrador que realiza el cambio.
 * @returns {Promise<{success: boolean}>}
 */
export async function updateGatekeeperCredentials(db, username, password, userEmail = '') {
  const u = String(username || '').trim();
  const p = String(password || '').trim();

  if (!u || u.length < 3) {
    throw new Error('El usuario de acceso debe tener al menos 3 caracteres.');
  }
  if (!p || p.length < 4) {
    throw new Error('La contraseña de acceso debe tener al menos 4 caracteres.');
  }

  const docRef = doc(db, 'system_config', 'security');
  const payload = {
    gatekeeperUser: u,
    gatekeeperPass: p,
    updatedAt: Date.now(),
    updatedBy: userEmail || 'ADMIN'
  };

  await setDoc(docRef, payload, { merge: true });
  _invalidateCached(CACHE_KEY);
  return { success: true };
}

/**
 * Verifica si las credenciales ingresadas coinciden con el Gatekeeper institucional.
 * @param {Object} db - Instancia de Firestore.
 * @param {string} inputUser - Usuario ingresado.
 * @param {string} inputPass - Contraseña ingresada.
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function verifyGatekeeperCredentials(db, inputUser, inputPass) {
  const u = String(inputUser || '').trim().toLowerCase();
  const p = String(inputPass || '').trim();

  if (!u || !p) {
    return { success: false, message: 'Ingrese usuario y contraseña.' };
  }

  try {
    const config = await fetchSecurityConfig(db);
    const validUser = String(config.gatekeeperUser || DEFAULT_SECURITY_CONFIG.gatekeeperUser).trim().toLowerCase();
    const validPass = String(config.gatekeeperPass || DEFAULT_SECURITY_CONFIG.gatekeeperPass).trim();

    if (u === validUser && p === validPass) {
      return { success: true };
    }

    // Permitir además como alternativa el PIN maestro como contraseña de respaldo
    if ((u === 'admin' || u === validUser) && p === String(config.masterPin).trim()) {
      return { success: true };
    }

    return { success: false, message: 'Usuario o contraseña corporativos incorrectos.' };
  } catch (err) {
    console.error('Error al verificar credenciales gatekeeper:', err);
    // Fallback de emergencia local si hay desconexión o bloqueo de reglas
    if (
      (u === DEFAULT_SECURITY_CONFIG.gatekeeperUser && p === DEFAULT_SECURITY_CONFIG.gatekeeperPass) ||
      (u === 'admin' && p === DEFAULT_SECURITY_CONFIG.masterPin)
    ) {
      return { success: true };
    }
    return { success: false, message: 'No se pudo verificar la credencial. Intente nuevamente.' };
  }
}
