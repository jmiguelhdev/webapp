import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase.js';
import { localDb } from '../db/localDb.js';

let syncTimeout = null;
let isSyncing = false;

export const SyncService = {
  async getSyncLogs() {
    return localDb.sync_logs.orderBy('timestamp').reverse().limit(50).toArray();
  },

  async clearSyncLogs() {
    await localDb.sync_logs.clear();
  },

  async getLastSyncTime() {
    const lastLog = await localDb.sync_logs.where('status').equals('SUCCESS').reverse().sortBy('timestamp');
    return lastLog.length > 0 ? lastLog[0].timestamp : 0;
  },

  async syncAll(uid) {
    if (isSyncing) return;
    isSyncing = true;
    const startTime = Date.now();
    let recordsSyncedStr = '';
    let details = '';
    let extractionsCount = 0;

    try {
      const lastSync = await this.getLastSyncTime();
      console.log(`[SyncService] Iniciando sincronización. Último éxito: ${lastSync > 0 ? new Date(lastSync).toLocaleString() : 'Nunca'}`);

      // 1. Sincronizar Clientes
      const clientsColl = collection(db, 'clientes');
      let clientsQuery = query(clientsColl);
      if (lastSync > 0) {
        clientsQuery = query(clientsColl, where('updatedAt', '>', lastSync));
      }
      const clientsSnap = await getDocs(clientsQuery);
      const clients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (clients.length > 0) {
        await localDb.clientes.bulkPut(clients);
      }

      // 2. Sincronizar Travels
      const travelsColl = collection(db, 'travels');
      let travelsQuery = query(travelsColl);
      if (lastSync > 0) {
        travelsQuery = query(travelsColl, where('updatedAt', '>', lastSync));
      }
      const travelsSnap = await getDocs(travelsQuery);
      const travels = travelsSnap.docs.map(docSnap => {
        const dto = docSnap.data();
        const { data: rawData, updatedAt, createdAt, ...topLevelFields } = dto;
        let parsed = {};
        if (rawData && typeof rawData === 'string') {
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            console.warn(`[SyncService] Error al parsear JSON del viaje:`, e);
          }
        }
        return { 
          ...topLevelFields, 
          ...parsed, 
          id: docSnap.id, 
          updatedAt: updatedAt || Date.now() 
        };
      });
      if (travels.length > 0) {
        await localDb.travels.bulkPut(travels);
      }

      // 3. Sincronizar Faenas Detalle
      const faenasColl = collection(db, 'faenas_detalle');
      let faenasToPut = [];

      if (lastSync === 0) {
        // Carga inicial: faenas activas (AVAILABLE/DRAFT) + despachadas en los últimos 30 días
        const qActive = query(faenasColl, where('status', 'in', ['AVAILABLE', 'DRAFT']));
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const qDispatched = query(faenasColl, where('dispatchDate', '>=', thirtyDaysAgo));

        const [activeSnap, dispatchedSnap] = await Promise.all([
          getDocs(qActive),
          getDocs(qDispatched)
        ]);

        const active = activeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const dispatched = dispatchedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        faenasToPut = [...active, ...dispatched];
      } else {
        // Carga delta: cualquier faena modificada desde la última sincronización exitosa
        const qDelta = query(faenasColl, where('updatedAt', '>', lastSync));
        const deltaSnap = await getDocs(qDelta);
        faenasToPut = deltaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      if (faenasToPut.length > 0) {
        const items = faenasToPut.map(item => ({
          ...item,
          barcode: item.barcode || null,
          updatedAt: item.updatedAt || Date.now()
        }));
        await localDb.faenas_detalle.bulkPut(items);
      }

      // 4. Sincronizar Cash Extractions
      try {
        const extractionsColl = collection(db, 'cash_extractions');
        let extractionsQuery = query(extractionsColl);
        if (lastSync > 0) {
          extractionsQuery = query(extractionsColl, where('updatedAt', '>', lastSync));
        }
        const extractionsSnap = await getDocs(extractionsQuery);
        const extractionsToPut = extractionsSnap.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            status: data.status || 'PENDING',
            ...data
          };
        });
        if (extractionsToPut.length > 0) {
          await localDb.cash_extractions.bulkPut(extractionsToPut);
          extractionsCount = extractionsToPut.length;
        }
      } catch (errExt) {
        console.warn("[SyncService] Error en sync de cash_extractions:", errExt);
      }

      const duration = Date.now() - startTime;
      recordsSyncedStr = `Clientes: ${clients.length}, Viajes: ${travels.length}, Faenas: ${faenasToPut.length}`;
      details = `Sincronización delta completada exitosamente en ${duration}ms.`;


      // Registrar log de éxito
      await localDb.sync_logs.add({
        timestamp: Date.now(),
        status: 'SUCCESS',
        duration,
        recordsSynced: recordsSyncedStr,
        details
      });

      console.log(`[SyncService] Sincronización exitosa. ${recordsSyncedStr}`);
      
      const syncedCount = clients.length + travels.length + faenasToPut.length + extractionsCount;
      
      // Lanzar evento global para avisar a la UI que los datos cambiaron
      window.dispatchEvent(new CustomEvent('app:sync-completed', { 
        detail: { 
          stats: recordsSyncedStr,
          syncedCount
        } 
      }));

    } catch (error) {
      console.error('[SyncService] Error al sincronizar:', error);
      const duration = Date.now() - startTime;
      
      // Registrar log de error
      await localDb.sync_logs.add({
        timestamp: Date.now(),
        status: 'ERROR',
        duration,
        recordsSynced: 'Ninguno',
        details: `Error: ${error.message || error}`
      });
      
      window.dispatchEvent(new CustomEvent('app:sync-failed', { detail: { error: error.message } }));
    } finally {
      isSyncing = false;
    }
  },

  startAutoSync(uid) {
    if (syncTimeout) {
      clearInterval(syncTimeout);
    }

    // Ejecutar primera sincronización inmediatamente
    this.syncAll(uid);

    // Ejecutar cada 5 minutos (antes: 15s) — la caché TTL en api.js mantiene la UI reactiva
    syncTimeout = setInterval(() => {
      this.syncAll(uid);
    }, 5 * 60 * 1000);

    // Sincronizar al volver a enfocar la ventana
    const focusHandler = () => {
      console.log("[SyncService] Foco recuperado. Forzando sincronización delta...");
      this.syncAll(uid);
    };
    window.removeEventListener('focus', focusHandler);
    window.addEventListener('focus', focusHandler);
  },

  stopAutoSync() {
    if (syncTimeout) {
      clearInterval(syncTimeout);
      syncTimeout = null;
    }
  }
};
