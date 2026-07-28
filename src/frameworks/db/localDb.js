import Dexie from 'dexie';

export const localDb = new Dexie('KmpTravelLocalDb');

// Configuración de tablas e índices para consultas eficientes en IndexedDB
localDb.version(1).stores({
  travels: 'id, status, updatedAt',
  faenas_detalle: 'id, status, tropa, garron, destination, dispatchDate, barcode, updatedAt',
  clientes: 'id, name, updatedAt',
  sync_logs: '++id, timestamp, status'
});

localDb.version(2).stores({
  travels: 'id, status, updatedAt',
  faenas_detalle: 'id, status, tropa, garron, destination, dispatchDate, barcode, updatedAt',
  clientes: 'id, name, updatedAt',
  sync_logs: '++id, timestamp, status',
  cash_extractions: 'id, cashSessionId, butcheryName, status, timestamp, updatedAt'
});

