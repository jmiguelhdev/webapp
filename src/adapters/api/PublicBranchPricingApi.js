/**
 * @file PublicBranchPricingApi.js
 * @description Proveedor de servicios y consultas para listas de precios de sucursales fijas,
 * gestión de visibilidad y carnicería móvil especial ("Frigorífico Pampa en tu Barrio")
 * con cronograma de paradas, horas y direcciones configurables.
 * Incluye hook preparado para la futura colección de despliegues móviles de la app fábrica.
 * @module adapters/api/PublicBranchPricingApi
 */
import { collection, doc, getDocs, getDoc, setDoc, query, where } from 'firebase/firestore';
import { _getCached, _setCached, _invalidateCached, TTL_5MIN, parseFirestoreDoc } from './common.js';

const CACHE_KEY = 'branch_pricing_data:all';

/**
 * Hook configurable para la futura colección de puntos de venta móviles de la app fábrica.
 * Al desplegarse la nueva colección en Firebase, la API la detectará y consumirá automáticamente.
 */
export const FUTURE_APP_FABRICA_MOBILE_COLLECTION = 'mobile_points_of_sale';

export const MOBILE_BRANCH_ID = 'pampa_movil';

export const DEFAULT_MOBILE_BRANCH = {
  id: MOBILE_BRANCH_ID,
  name: 'Frigorífico Pampa en tu Barrio',
  isMobile: true,
  isPublished: true,
  phone: '+54 9 381 555-1234',
  hours: 'Consultar cronograma de paradas',
  address: 'Puntos itinerantes en barrios y plazas de la provincia',
  priceListId: 'PL_MOVIL',
  priceListName: 'Frigorífico Pampa en tu Barrio',
  schedule: [
    {
      id: 'stop_1',
      date: '2026-10-31',
      dateDisplay: 'Sábado 31 de Octubre',
      time: '08:30 a 13:30 hs',
      location: 'Plaza Marcos Paz — Yerba Buena',
      reference: 'Frente al mástil principal',
      status: 'PROXIMO'
    },
    {
      id: 'stop_2',
      date: '2026-11-04',
      dateDisplay: 'Miércoles 4 de Noviembre',
      time: '09:00 a 14:00 hs',
      location: 'Plaza Central — Villa Carmela',
      reference: 'Sobre calle Mitre al 500',
      status: 'PROXIMO'
    }
  ],
  items: []
};

/**
 * Normaliza cadenas de texto para comparaciones seguras de nombres de sucursales.
 */
function normalizeName(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Filtra las paradas de la carnicería móvil para no mostrar fechas que ya pasaron.
 * Mantiene paradas de hoy o futuras para una visualización limpia.
 * @param {Array<Object>} schedule
 * @returns {Array<Object>}
 */
export function filterUpcomingStops(schedule) {
  if (!Array.isArray(schedule)) return [];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return schedule.filter(stop => {
    if (!stop.date) return true;
    return stop.date >= todayStr;
  });
}

/**
 * Sincroniza el snapshot compilado de sucursales, visibilidades y precios con el servidor Express local.
 * Persiste los datos en memoria RAM y disco (data/public_pricing_cache.json).
 * @param {Array<Object>} branchesList
 */
export async function syncServerPricingCache(branchesList) {
  if (!Array.isArray(branchesList) || branchesList.length === 0) return;
  try {
    const res = await fetch('/api/public-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branches: branchesList })
    });
    const json = await res.json();
    if (json && json.success) {
      console.log(`[Cache Precios] Servidor Express sincronizado con ${branchesList.length} sucursales.`);
    }
  } catch (err) {
    console.warn('[Cache Precios] No se pudo enviar snapshot al servidor Express local:', err.message);
  }
}

/**
 * Obtiene todas las sucursales con sus precios, visibilidad y cronograma móvil.
 * Estrategia de Cero Lecturas Firebase:
 * 1. Consulta el endpoint local rápido /api/public-pricing (< 10ms).
 * 2. Si no está disponible o falla, consulta Firestore como respaldo (fallback transparente).
 * @param {Object} db - Instancia de Firestore.
 * @param {boolean} [forceFirestore=false]
 * @returns {Promise<Array<Object>>}
 */
export async function fetchBranchPricingData(db, forceFirestore = false) {
  // 1. Memoria de navegador
  if (!forceFirestore) {
    const cached = _getCached(CACHE_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    // 2. Caché del servidor Express (Zero Firebase Reads)
    try {
      const response = await fetch('/api/public-pricing');
      if (response.ok) {
        const json = await response.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          _setCached(CACHE_KEY, json.data, TTL_5MIN);
          return json.data;
        }
      }
    } catch (e) {
      // Continuar al respaldo con Firestore
    }
  }

  // 3. Consulta a Firestore
  try {
    // 3.1 Sucursales fijas (establishments)
    const estabSnap = await getDocs(collection(db, 'establishments'));
    const establishments = estabSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 3.2 Listas de precios (price_lists)
    const priceListsSnap = await getDocs(collection(db, 'price_lists'));
    const priceLists = priceListsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 3.3 Catálogo de productos de master_data
    const prodQuery = query(collection(db, 'master_data'), where('type', '==', 'PRODUCT'));
    const prodSnap = await getDocs(prodQuery);
    const productsMap = new Map();

    prodSnap.docs.forEach(docSnap => {
      const parsed = parseFirestoreDoc(docSnap);
      if (parsed) {
        const id = String(parsed.id || docSnap.id).replace('PRODUCT_', '');
        const name = parsed.name || 'Corte Vacuno';
        productsMap.set(id, {
          id,
          name: name.toUpperCase(),
          sku: parsed.sku || '',
          plu: parsed.plu || '',
          basePrice: Number(parsed.price || 0)
        });
      }
    });

    // 3.4 Visibilidades guardadas en Firestore (system_config/branch_visibility)
    let visibilityMap = {};
    try {
      const visDoc = await getDoc(doc(db, 'system_config', 'branch_visibility'));
      if (visDoc.exists()) {
        visibilityMap = visDoc.data() || {};
      }
    } catch (e) {
      console.warn("No se pudo cargar branch_visibility:", e.message);
    }

    // 3.5 Mapear sucursales fijas
    const physicalBranches = establishments.map(est => {
      const estNameNorm = normalizeName(est.name);
      
      let matchedList = null;
      if (est.priceListId) {
        matchedList = priceLists.find(pl => pl.id === est.priceListId);
      }
      if (!matchedList) {
        matchedList = priceLists.find(pl => normalizeName(pl.name) === estNameNorm);
      }
      if (!matchedList) {
        matchedList = priceLists.find(pl => {
          const plNorm = normalizeName(pl.name);
          return plNorm.includes(estNameNorm) || estNameNorm.includes(plNorm);
        });
      }

      const rawPrices = (matchedList && matchedList.prices) ? matchedList.prices : {};
      const hiddenProducts = Array.isArray(matchedList?.hiddenProducts) ? matchedList.hiddenProducts : [];

      const items = [];

      Object.entries(rawPrices).forEach(([prodId, priceVal]) => {
        const numPrice = Number(priceVal || 0);
        if (numPrice > 0) {
          const prodInfo = productsMap.get(String(prodId)) || {
            id: prodId,
            name: `PRODUCTO ${prodId}`,
            sku: '',
            plu: '',
            basePrice: numPrice
          };

          const isHidden = hiddenProducts.includes(String(prodId));

          items.push({
            productId: String(prodId),
            name: prodInfo.name,
            plu: prodInfo.plu,
            sku: prodInfo.sku,
            price: numPrice,
            visible: !isHidden
          });
        }
      });

      items.sort((a, b) => a.name.localeCompare(b.name));

      let hoursDisplay = '';
      if (est.scheduleStartTime || est.scheduleEndTime) {
        hoursDisplay = `${est.scheduleStartTime || '08:00'} a ${est.scheduleEndTime || '21:00'} hs`;
      }

      const isPublished = visibilityMap[est.id] !== undefined ? Boolean(visibilityMap[est.id]) : true;

      return {
        id: est.id,
        name: est.name || 'Sucursal Frigorífico Pampa',
        address: est.address || 'Consultar dirección en planta',
        phone: est.phone || '',
        hours: hoursDisplay,
        isMobile: false,
        isPublished,
        priceListId: matchedList ? matchedList.id : (est.priceListId || null),
        priceListName: matchedList ? matchedList.name : '',
        updatedAt: matchedList?.updatedAt || est.updatedAt || null,
        items
      };
    });

    // 3.6 Cargar o resolver la Sucursal Especial Móvil ("Frigorífico Pampa en tu Barrio")
    let mobileBranch = {
      ...DEFAULT_MOBILE_BRANCH,
      schedule: DEFAULT_MOBILE_BRANCH.schedule.map(s => ({ ...s })),
      items: []
    };

    // Intentar leer de la futura colección de la app fábrica (Hook preparado)
    try {
      const futureCollSnap = await getDocs(collection(db, FUTURE_APP_FABRICA_MOBILE_COLLECTION));
      if (!futureCollSnap.empty) {
        const points = futureCollSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log(`[App Fábrica Hook] Puntos de venta móviles detectados en ${FUTURE_APP_FABRICA_MOBILE_COLLECTION}:`, points.length);
        if (points.length > 0) {
          mobileBranch.schedule = points.map(p => ({
            id: p.id,
            date: p.date || p.fecha || '',
            dateDisplay: p.dateDisplay || p.fechaDisplay || p.date || '',
            time: p.time || p.horario || '09:00 a 14:00 hs',
            location: p.location || p.direccion || p.punto || '',
            reference: p.reference || p.referencia || '',
            status: p.status || 'PROXIMO'
          }));
        }
      }
    } catch (e) {
      // La colección aún no existe en Firebase; se usará la configuración local/system_config
    }

    // Leer configuración personalizada de la carnicería móvil de system_config/mobile_branch
    try {
      const mobDoc = await getDoc(doc(db, 'system_config', 'mobile_branch'));
      if (mobDoc.exists()) {
        const data = mobDoc.data() || {};
        mobileBranch = {
          ...mobileBranch,
          ...data,
          schedule: Array.isArray(data.schedule) ? data.schedule : mobileBranch.schedule
        };
      }
    } catch (e) {
      console.warn("No se pudo cargar system_config/mobile_branch:", e.message);
    }

    // Resolver precios de la carnicería móvil
    let mobPriceList = priceLists.find(pl => pl.id === mobileBranch.priceListId) ||
                       priceLists.find(pl => normalizeName(pl.name).includes('barrio') || normalizeName(pl.name).includes('movil'));

    // Si no tiene lista propia, usar la de la primera sucursal como base de cortes
    if (!mobPriceList && priceLists.length > 0) {
      mobPriceList = priceLists[0];
    }

    if (mobPriceList && Array.isArray(mobileBranch.items) && mobileBranch.items.length === 0) {
      const rawPrices = mobPriceList.prices || {};
      const hiddenProducts = Array.isArray(mobPriceList.hiddenProducts) ? mobPriceList.hiddenProducts : [];
      const mobItems = [];

      Object.entries(rawPrices).forEach(([prodId, priceVal]) => {
        const numPrice = Number(priceVal || 0);
        if (numPrice > 0) {
          const prodInfo = productsMap.get(String(prodId)) || {
            id: prodId,
            name: `PRODUCTO ${prodId}`,
            sku: '',
            plu: '',
            basePrice: numPrice
          };

          mobItems.push({
            productId: String(prodId),
            name: prodInfo.name,
            plu: prodInfo.plu,
            sku: prodInfo.sku,
            price: numPrice,
            visible: !hiddenProducts.includes(String(prodId))
          });
        }
      });
      mobItems.sort((a, b) => a.name.localeCompare(b.name));
      mobileBranch.items = mobItems;
    }

    // Visibilidad de la carnicería móvil
    if (visibilityMap[MOBILE_BRANCH_ID] !== undefined) {
      mobileBranch.isPublished = Boolean(visibilityMap[MOBILE_BRANCH_ID]);
    }

    const allBranches = [...physicalBranches, mobileBranch];

    _setCached(CACHE_KEY, allBranches, TTL_5MIN);

    // Sincronizar automáticamente con Express server
    syncServerPricingCache(allBranches);

    return allBranches;
  } catch (err) {
    console.error('Error al consultar datos de precios de sucursales en Firestore:', err);
    return [];
  }
}

/**
 * Guarda o actualiza los precios y cortes visibles para una sucursal en Firestore
 * y renueva inmediatamente la caché del servidor Express.
 * @param {Object} db - Instancia de Firestore.
 * @param {string} priceListId - ID del documento en price_lists.
 * @param {Object.<string, number>} pricesMap - Mapa de { productId: precio }.
 * @param {Array<string>} hiddenProductIds - Lista de IDs de productos excluidos del público/PDF.
 * @param {string} userEmail - Email del usuario que ejecuta la acción.
 * @returns {Promise<{success: boolean}>}
 */
export async function saveBranchPrices(db, priceListId, pricesMap, hiddenProductIds = [], userEmail = '') {
  if (!priceListId) throw new Error('ID de lista de precios requerido.');

  const docRef = doc(db, 'price_lists', priceListId);
  const payload = {
    prices: pricesMap,
    hiddenProducts: hiddenProductIds,
    updatedAt: Date.now(),
    updatedBy: userEmail || 'ADMIN'
  };

  await setDoc(docRef, payload, { merge: true });
  _invalidateCached(CACHE_KEY);

  try {
    const updatedBranches = await fetchBranchPricingData(db, true);
    await syncServerPricingCache(updatedBranches);
  } catch (e) {
    console.warn('[Cache Precios] Error propagando snapshot al servidor:', e);
  }

  return { success: true };
}

/**
 * Guarda la configuración de la carnicería móvil ("Frigorífico Pampa en tu Barrio")
 * incluyendo su nombre, estado de publicación, itinerario de paradas y precios.
 * @param {Object} db
 * @param {Object} mobileData
 * @param {string} userEmail
 * @returns {Promise<{success: boolean}>}
 */
export async function saveMobileBranchData(db, mobileData, userEmail = '') {
  if (!mobileData) throw new Error('Datos de sucursal móvil requeridos.');

  const docRef = doc(db, 'system_config', 'mobile_branch');
  const payload = {
    id: MOBILE_BRANCH_ID,
    name: String(mobileData.name || DEFAULT_MOBILE_BRANCH.name).trim(),
    isMobile: true,
    isPublished: mobileData.isPublished !== false,
    phone: String(mobileData.phone || '').trim(),
    schedule: Array.isArray(mobileData.schedule) ? mobileData.schedule : [],
    priceListId: mobileData.priceListId || 'PL_MOVIL',
    updatedAt: Date.now(),
    updatedBy: userEmail || 'ADMIN'
  };

  await setDoc(docRef, payload, { merge: true });

  // Guardar también en branch_visibility (sin disparar sync intermedio)
  await saveBranchVisibility(db, MOBILE_BRANCH_ID, mobileData.isPublished !== false, userEmail, true);

  // Si tiene precios modificados, guardarlos en price_lists
  if (mobileData.priceListId && mobileData.items && mobileData.items.length > 0) {
    const pricesMap = {};
    const hiddenIds = [];
    mobileData.items.forEach(i => {
      pricesMap[i.productId] = Number(i.price || 0);
      if (!i.visible) hiddenIds.push(i.productId);
    });
    const plRef = doc(db, 'price_lists', mobileData.priceListId);
    await setDoc(plRef, {
      name: payload.name,
      prices: pricesMap,
      hiddenProducts: hiddenIds,
      updatedAt: Date.now(),
      updatedBy: userEmail || 'ADMIN'
    }, { merge: true });
  }

  _invalidateCached(CACHE_KEY);

  // Re-calcular y sincronizar caché una única vez al finalizar
  try {
    const updatedBranches = await fetchBranchPricingData(db, true);
    await syncServerPricingCache(updatedBranches);
  } catch (e) {
    console.warn('[Cache Precios] Error propagando snapshot móvil al servidor:', e);
  }

  return { success: true };
}

/**
 * Guarda la visibilidad pública de una sucursal (para mostrar/ocultar en la portada).
 * @param {Object} db
 * @param {string} branchId
 * @param {boolean} isPublished
 * @param {string} userEmail
 * @param {boolean} [skipSync=false]
 * @returns {Promise<{success: boolean}>}
 */
export async function saveBranchVisibility(db, branchId, isPublished, userEmail = '', skipSync = false) {
  if (!branchId) return;

  const docRef = doc(db, 'system_config', 'branch_visibility');
  await setDoc(docRef, {
    [branchId]: Boolean(isPublished),
    updatedAt: Date.now(),
    updatedBy: userEmail || 'ADMIN'
  }, { merge: true });

  _invalidateCached(CACHE_KEY);

  // Actualizar caché de servidor si no fue omitido por una operación compuesta
  if (!skipSync) {
    try {
      const updatedBranches = await fetchBranchPricingData(db, true);
      await syncServerPricingCache(updatedBranches);
    } catch (e) {
      // Silencioso
    }
  }

  return { success: true };
}
