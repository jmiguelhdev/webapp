/**
 * @file TimeLogApi.js
 * @description API para la gestión de fichadas de personal (employee_time_logs) y cálculo de liquidaciones.
 * @module adapters/api/TimeLogApi
 */
import { collection, getDocs, doc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { localDb } from '../../frameworks/db/localDb.js';

/**
 * Calcula el monto a abonar por un turno individual según las reglas técnicas de asistencia.
 * @param {Object} log - Registro de fichada.
 * @param {Object} employee - Datos del empleado.
 * @returns {{ workedHours: number, totalPayment: number, isOvertime: boolean }}
 */
export function calculatePayment(log, employee = {}) {
  if (!log.checkOutTime) {
    return { workedHours: 0, totalPayment: 0, isOvertime: false };
  }

  const durationMs = log.checkOutTime - log.checkInTime;
  const workedHours = Math.max(0, durationMs / (1000 * 3600));

  const applyHourlyRate = log.hourlyRate !== undefined && log.hourlyRate !== null ? log.hourlyRate : (employee.hourlyRate || 0);

  if (employee.paymentType === 'FIXED_DAILY') {
    const checkInDate = new Date(log.checkInTime);
    const hourStr = String(checkInDate.getHours()).padStart(2, '0');
    const minStr = String(checkInDate.getMinutes()).padStart(2, '0');
    const checkInTimeStr = `${hourStr}:${minStr}`;

    const departureLimit = employee.fixedDailyDepartureTime || '17:00';
    const isOvertime = checkInTimeStr >= departureLimit;

    const rawPayment = isOvertime 
      ? workedHours * applyHourlyRate 
      : (employee.dailyFixedRate || 0);

    const totalPayment = Math.round(rawPayment * 100) / 100;
    return { workedHours, totalPayment, isOvertime };
  } else {
    const totalPayment = Math.round((workedHours * applyHourlyRate) * 100) / 100;
    return { 
      workedHours, 
      totalPayment, 
      isOvertime: false 
    };
  }

}

/**
 * Obtiene los registros de fichadas de un empleado desde Firestore e IndexedDB.
 * @param {Object} db - Instancia de Firestore.
 * @param {string} establishmentId - ID de la sucursal.
 * @param {string} employeeId - ID del empleado.
 * @returns {Promise<Array<Object>>} Lista de fichadas.
 */
export async function fetchEmployeeTimeLogs(db, establishmentId, employeeId) {
  // Real Local-First: read directly from local IndexedDB (synced in background by SyncService)
  return getLocalEmployeeTimeLogs(establishmentId, employeeId);
}

/**
 * Consulta las fichadas almacenadas en IndexedDB local.
 * @param {string} establishmentId 
 * @param {string} employeeId 
 * @returns {Promise<Array<Object>>}
 */
export async function getLocalEmployeeTimeLogs(establishmentId, employeeId) {
  try {
    const logs = await localDb.employee_time_logs
      .where('establishmentId').equals(establishmentId)
      .and(item => item.employeeId === employeeId)
      .toArray();
    return logs.map(item => ({ ...item, status: item.status || 'UNPAID' }))
      .sort((a, b) => (b.checkInTime || 0) - (a.checkInTime || 0));
  } catch (e) {
    console.error("Error leyendo localDb.employee_time_logs:", e);
    return [];
  }
}

/**
 * Marca múltiples registros de fichadas como pagados.
 * @param {Object} db - Instancia de Firestore.
 * @param {Array<string>} logIds - Lista de IDs de fichadas.
 * @param {string} salaryPaymentEntryId - ID del movimiento contable de sueldo.
 * @returns {Promise<void>}
 */
export async function markTimeLogsAsPaid(db, logIds, salaryPaymentEntryId) {
  if (!logIds || logIds.length === 0) return;

  const paidAt = Date.now();
  const updatePayload = {
    status: 'PAID',
    paidAt,
    salaryPaymentEntryId,
    updatedAt: paidAt
  };

  // 1. Actualización por lotes en Firestore
  if (db) {
    try {
      const batch = writeBatch(db);
      logIds.forEach(id => {
        const ref = doc(db, 'employee_time_logs', id);
        batch.update(ref, updatePayload);
      });
      await batch.commit();
    } catch (fsErr) {
      console.warn("[TimeLogApi] Error actualizando Firestore para logs pagados:", fsErr);
    }
  }

  // 2. Actualizar IndexedDB local
  try {
    for (const id of logIds) {
      const item = await localDb.employee_time_logs.get(id);
      if (item) {
        await localDb.employee_time_logs.put({ ...item, ...updatePayload });
      } else {
        await localDb.employee_time_logs.put({ id, ...updatePayload });
      }
    }
  } catch (e) {
    console.warn("Error actualizando IndexedDB para time logs:", e);
  }
}


/**
 * Actualiza las tarifas y modalidad de pago del empleado en Firestore y local.
 * @param {Object} db - Instancia de Firestore.
 * @param {string} establishmentId - ID de la sucursal.
 * @param {string} employeeId - ID del empleado.
 * @param {Object} rateData - Datos de tarifas { hourlyRate, paymentType, dailyFixedRate, fixedDailyDepartureTime }.
 * @returns {Promise<void>}
 */
export async function updateEmployeeRates(db, establishmentId, employeeId, rateData) {
  const empRef = doc(db, 'establishments', establishmentId, 'employees', employeeId);
  await updateDoc(empRef, {
    ...rateData,
    updatedAt: Date.now()
  });
}
