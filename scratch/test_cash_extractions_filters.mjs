// scratch/test_cash_extractions_filters.mjs
import assert from 'node:assert';

// Mock test data for extractions
const mockExtractions = [
  {
    id: 'EXT_001',
    butcheryName: 'Carnicería Centro',
    amount: 150000,
    status: 'PENDING',
    timestamp: new Date('2026-08-10T14:30:00Z').getTime(),
    description: 'Retiro parcial mediodía'
  },
  {
    id: 'EXT_002',
    butcheryName: 'Carnicería Norte',
    amount: 220000,
    status: 'ACCEPTED',
    timestamp: new Date('2026-08-12T19:00:00Z').getTime(),
    description: 'Cierre de turno tarde'
  },
  {
    id: 'EXT_003',
    butcheryName: 'Carnicería Sur',
    amount: 80000,
    status: 'PENDING',
    timestamp: new Date('2026-08-15T11:00:00Z').getTime(),
    description: 'Retiro fondo de caja'
  },
  {
    id: 'EXT_004',
    butcheryName: 'Carnicería Centro',
    amount: 300000,
    status: 'ACCEPTED',
    timestamp: new Date('2026-08-16T20:00:00Z').getTime(),
    description: 'Cierre de caja fin de semana'
  }
];

function extractIsoDate(ext) {
  const raw = ext.timestamp || ext.createdAt || ext.date || ext.updatedAt;
  if (!raw) return '';
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.substring(0, 10);
  }
  let dateObj = null;
  if (typeof raw?.toDate === 'function') {
    dateObj = raw.toDate();
  } else if (raw?.seconds) {
    dateObj = new Date(raw.seconds * 1000);
  } else if (typeof raw === 'number' || typeof raw === 'string') {
    dateObj = new Date(raw);
  }
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function filterExtractions(extractions, { search = '', status = 'ALL', selectedButcheries = [], startDate = '', endDate = '' }) {
  const term = search.trim().toLowerCase();

  return extractions.filter(e => {
    // 1. Status Filter
    const isStatusMatch = status === 'ALL' || 
                         (status === 'PENDING' && e.status !== 'ACCEPTED') || 
                         (status === 'ACCEPTED' && e.status === 'ACCEPTED');
    if (!isStatusMatch) return false;

    // 2. Butchery Filter (Multi-select)
    const butchery = (e.butcheryName || 'Sucursal').trim();
    if (selectedButcheries.length > 0 && !selectedButcheries.includes(butchery)) {
      return false;
    }

    // 3. Date Range Filter
    const isoDate = extractIsoDate(e);
    if (startDate && isoDate && isoDate < startDate) return false;
    if (endDate && isoDate && isoDate > endDate) return false;

    // 4. Text Search
    if (term) {
      const bLower = butchery.toLowerCase();
      const desc = (e.description || '').toLowerCase();
      const amountStr = String(e.amount || '');
      if (!bLower.includes(term) && !desc.includes(term) && !amountStr.includes(term)) {
        return false;
      }
    }

    return true;
  });
}

// Test 1: All items filter
const all = filterExtractions(mockExtractions, { status: 'ALL' });
assert.strictEqual(all.length, 4, 'Should return all 4 extractions');

// Test 2: Multi-select butchery chips
const multiButchery = filterExtractions(mockExtractions, { selectedButcheries: ['Carnicería Centro', 'Carnicería Sur'] });
assert.strictEqual(multiButchery.length, 3, 'Should return 3 extractions for Centro and Sur');

// Test 3: Date range filter
const dateRange = filterExtractions(mockExtractions, { startDate: '2026-08-11', endDate: '2026-08-15' });
assert.strictEqual(dateRange.length, 2, 'Should return EXT_002 and EXT_003');

// Test 4: Combined multi-chip, status, and date range
const combined = filterExtractions(mockExtractions, { 
  selectedButcheries: ['Carnicería Centro'], 
  status: 'ACCEPTED',
  startDate: '2026-08-15'
});
assert.strictEqual(combined.length, 1, 'Should return only EXT_004');
assert.strictEqual(combined[0].id, 'EXT_004');

console.log('✅ Test 1: All items filtering verified.');
console.log('✅ Test 2: Multi-selection butchery chips verified.');
console.log('✅ Test 3: Date range filtering verified.');
console.log('✅ Test 4: Combined multi-criteria filtering verified.');
console.log('🎉 ALL CASH EXTRACTION FILTER TESTS PASSED!');
