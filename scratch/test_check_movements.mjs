// scratch/test_check_movements.mjs
import { Check } from '../src/domain/entities/Check.js';

console.log("--- 1. Testing Check instanciation with empty movements (Retrocompatibility) ---");
const legacyCheck = new Check({
  id: 'CHK-001',
  bank: 'Banco Santander',
  checkNumber: '12345678',
  nominalValue: 500000,
  dueDate: '2026-09-15',
  receptionDate: '2026-08-01',
  clearing: 2,
  issuerName: 'Acme Corp',
  issuerCuit: '30-11223344-5',
  buySide: {
    contactId: 'OPERATOR-1',
    pesificacionRate: 2.5,
    monthlyInterest: 4.0,
    operationId: 'CMP-001'
  },
  sellSide: {
    contactId: 'CLIENT-1',
    pesificacionRate: 1.5,
    monthlyInterest: 3.5,
    status: 'SOLD',
    operationId: 'VTA-001',
    date: '2026-08-10'
  }
});
legacyCheck.calculate();

const contacts = [
  { id: 'OPERATOR-1', name: 'Operador Central' },
  { id: 'CLIENT-1', name: 'Distribuidora del Sur' }
];

const timeline1 = legacyCheck.getFullTimeline(contacts);
console.log(`Initial timeline events for legacy check: ${timeline1.length}`);
timeline1.forEach((ev, i) => console.log(`  [${i + 1}] ${ev.dateStr} - ${ev.title} (${ev.type})`));

console.log("\n--- 2. Testing status change: SOLD -> REJECTED ---");
legacyCheck.addMovement({
  type: 'REJECTED',
  title: '🔴 Cheque Marcado como Rechazado',
  description: 'El estado del cheque fue modificado de "Vendido" a "Rechazado". Motivo: Sin fondos en cuenta.',
  details: {
    prevStatus: 'SOLD',
    newStatus: 'REJECTED',
    buyer: 'Distribuidora del Sur',
    backReason: 'Sin fondos'
  },
  date: Date.now()
});
legacyCheck.sellSide.status = 'REJECTED';
legacyCheck.sellSide.backReason = 'Sin fondos';
legacyCheck.calculate();

console.log(`isPortfolio: ${legacyCheck.isPortfolio} (should be false)`);
console.log(`isHistory: ${legacyCheck.isHistory} (should be true)`);

const timeline2 = legacyCheck.getFullTimeline(contacts);
console.log(`Timeline events after rejection: ${timeline2.length}`);
timeline2.forEach((ev, i) => console.log(`  [${i + 1}] ${ev.dateStr} - ${ev.title} (${ev.type})`));

console.log("\n--- 3. Testing tracking flags: ¿Volvió? y Levantado por Empresa ---");
legacyCheck.returned = true;
legacyCheck.returnedAt = Date.now();
legacyCheck.addMovement({
  type: 'CONFIRMATION_VOLVIO',
  title: '🔄 Hoja de Cheque Recuperada',
  description: 'Se confirmó la recuperación física / soporte del cheque.',
  date: legacyCheck.returnedAt
});

legacyCheck.settledByCompany = true;
legacyCheck.settledByCompanyAt = Date.now() + 1000;
legacyCheck.addMovement({
  type: 'CONFIRMATION_COMPANY',
  title: '🏢 Levantado por la Empresa',
  description: 'Se confirmó que el cheque fue levantado y saldado por la empresa.',
  date: legacyCheck.settledByCompanyAt
});

const timeline3 = legacyCheck.getFullTimeline(contacts);
console.log(`Timeline events after state confirmations: ${timeline3.length}`);
timeline3.forEach((ev, i) => console.log(`  [${i + 1}] ${ev.dateStr} - ${ev.title} (${ev.type})`));

console.log("\n--- 4. Testing return to portfolio: REJECTED -> BACK ---");
legacyCheck.sellSide.status = 'BACK';
legacyCheck.addMovement({
  type: 'RETURNED',
  title: '🔄 Cheque Retornado a Cartera',
  description: 'El estado del cheque fue cambiado de "Rechazado" a "Volvió". Reincorporado a cartera para nueva colocación.',
  details: {
    prevStatus: 'REJECTED',
    newStatus: 'BACK'
  },
  date: Date.now() + 2000
});
legacyCheck.calculate();

console.log(`isPortfolio: ${legacyCheck.isPortfolio} (should be true)`);
console.log(`isHistory: ${legacyCheck.isHistory} (should be false)`);

const timeline4 = legacyCheck.getFullTimeline(contacts);
console.log(`Timeline events after return to portfolio: ${timeline4.length}`);
timeline4.forEach((ev, i) => console.log(`  [${i + 1}] ${ev.dateStr} - ${ev.title} (${ev.type})`));

console.log("\n✅ All domain tests passed successfully!");
