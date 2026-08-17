// scratch/test_travels_filtering.mjs
import assert from 'node:assert';

// Mock travels dataset
const mockTravels = [
  {
    id: 'TRV_001',
    date: '2026-08-10',
    status: 'ACTIVE',
    description: 'Viaje Azul Frigorífico',
    tropa: '5012',
    truck: { name: 'Scania R450', licensePlate: 'AE 123 CD', driver: { name: 'Carlos Chofer' } },
    buy: {
      agent: { name: 'Pedro Gómez', percent: 2.5 },
      agentCommissionAmount: 250000,
      totalOperation: 10000000,
      totalOperationWithCommission: 10250000,
      totalQuantity: 35,
      totalKgClean: 14000,
      totalKgFaena: 8120,
      generalYield: 8120 / 14000,
      categories: ['NOVILLO', 'VAQUILLONA'],
      listOfProducers: [
        {
          producer: { name: 'Estancia La Linda', cuit: '30-11223344-5', cbu: '0170099900001234567890' },
          origin: 'Azul',
          neto: 6000000,
          iva: 630000,
          totalAPagar: 6630000,
          listOfProducts: [{ name: 'NOVILLO', quantity: 20, kgClean: 8000, price: 750, roughing: 3 }]
        },
        {
          producer: { name: 'Cabaña San José', cuit: '30-99887766-1', cbu: '0170099900009876543210' },
          origin: 'Olavarría',
          neto: 4000000,
          iva: 420000,
          totalAPagar: 4420000,
          listOfProducts: [{ name: 'VAQUILLONA', quantity: 15, kgClean: 6000, price: 666.67, roughing: 3 }]
        }
      ]
    }
  },
  {
    id: 'TRV_002',
    date: '2026-08-12',
    status: 'COMPLETED',
    description: 'Hacienda Tandil',
    tropa: '5015',
    truck: { name: 'Volvo FH500', licensePlate: 'AF 456 GH', driver: { name: 'Roberto Log' } },
    buy: {
      agent: { name: 'María Consignataria', percent: 3.0 },
      agentCommissionAmount: 360000,
      totalOperation: 12000000,
      totalOperationWithCommission: 12360000,
      totalQuantity: 40,
      totalKgClean: 16000,
      totalKgFaena: 9280,
      generalYield: 9280 / 16000,
      categories: ['VACA'],
      listOfProducers: [
        {
          producer: { name: 'Agropecuaria del Sur', cuit: '33-55667788-9', cbu: '0170011100005555555555' },
          origin: 'Tandil',
          neto: 12000000,
          iva: 1260000,
          totalAPagar: 13260000,
          listOfProducts: [{ name: 'VACA', quantity: 40, kgClean: 16000, price: 750, roughing: 4 }]
        }
      ]
    }
  }
];

// Test 1: Extraction of unique agents and producers
const agentsMap = new Map();
const producersMap = new Map();
mockTravels.forEach(t => {
  const agentName = (t.buy?.agent?.name || '').trim();
  if (agentName) agentsMap.set(agentName, (agentsMap.get(agentName) || 0) + 1);
  (t.buy?.listOfProducers || []).forEach(p => {
    const pName = (p.producer?.name || p.name || '').trim();
    const pCuit = String(p.producer?.cuit || p.cuit || '').trim();
    if (pName) producersMap.set(pName, { name: pName, cuit: pCuit });
  });
});

const uniqueAgents = Array.from(agentsMap.keys()).sort((a, b) => a.localeCompare(b));
const uniqueProducers = Array.from(producersMap.values()).sort((a, b) => a.name.localeCompare(b.name));

assert.deepStrictEqual(uniqueAgents, ['María Consignataria', 'Pedro Gómez']);
assert.strictEqual(uniqueProducers.length, 3);
console.log('✅ Test 1: Unique entities extraction passed.');

// Test 2: Filter by Agent
const agentFilter = 'Pedro Gómez';
const filteredByAgent = mockTravels.filter(t => (t.buy?.agent?.name || '').trim().toLowerCase() === agentFilter.toLowerCase());
assert.strictEqual(filteredByAgent.length, 1);
assert.strictEqual(filteredByAgent[0].id, 'TRV_001');
console.log('✅ Test 2: Filter by Agent passed.');

// Test 3: Filter by Producer (Name & CUIT)
const prodFilterName = 'Cabaña San José';
const filteredByProdName = mockTravels.filter(t => (t.buy?.listOfProducers || []).some(p => (p.producer?.name || '').toLowerCase() === prodFilterName.toLowerCase()));
assert.strictEqual(filteredByProdName.length, 1);
assert.strictEqual(filteredByProdName[0].id, 'TRV_001');

const prodFilterCuit = '33-55667788-9';
const targetProdDigits = prodFilterCuit.replace(/\D/g, '');
const filteredByProdCuit = mockTravels.filter(t => (t.buy?.listOfProducers || []).some(p => {
  const pCuit = String(p.producer?.cuit || '').replace(/\D/g, '');
  return pCuit.includes(targetProdDigits);
}));
assert.strictEqual(filteredByProdCuit.length, 1);
assert.strictEqual(filteredByProdCuit[0].id, 'TRV_002');
console.log('✅ Test 3: Filter by Producer (Name and CUIT) passed.');

// Test 4: Universal Search by Tropa, Plate, Driver, Origin
function searchTravels(query) {
  const q = query.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');
  return mockTravels.filter(t => {
    const travelId = String(t.id).toLowerCase();
    if (travelId.includes(q)) return true;
    const truckName = (t.truck?.name || '').toLowerCase();
    const plate = (t.truck?.licensePlate || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    const driverName = (t.truck?.driver?.name || '').toLowerCase();
    const agentName = (t.buy?.agent?.name || '').toLowerCase();
    const tropa = String(t.tropa || '').toLowerCase();
    const producersMatch = (t.buy?.listOfProducers || []).some(p => {
      const pName = (p.producer?.name || '').toLowerCase();
      const pCuit = String(p.producer?.cuit || '').toLowerCase();
      const pOrigin = (p.origin || '').toLowerCase();
      return pName.includes(q) || pCuit.includes(q) || (qDigits.length > 3 && pCuit.replace(/\D/g, '').includes(qDigits)) || pOrigin.includes(q);
    });
    return truckName.includes(q) || plate.includes(q) || desc.includes(q) || 
           driverName.includes(q) || agentName.includes(q) || tropa.includes(q) || producersMatch;
  });
}

assert.strictEqual(searchTravels('5012').length, 1);
assert.strictEqual(searchTravels('Scania').length, 1);
assert.strictEqual(searchTravels('AE 123').length, 1);
assert.strictEqual(searchTravels('Carlos Chofer').length, 1);
assert.strictEqual(searchTravels('Tandil').length, 1);
console.log('✅ Test 4: Universal search passed.');

// Test 5: Summary KPIs calculation
const totalHeads = mockTravels.reduce((sum, t) => sum + (t.buy?.totalQuantity || 0), 0);
const totalKgClean = mockTravels.reduce((sum, t) => sum + (t.buy?.totalKgClean || 0), 0);
const totalKgFaena = mockTravels.reduce((sum, t) => sum + (t.buy?.totalKgFaena || 0), 0);
const totalOperation = mockTravels.reduce((sum, t) => sum + (t.buy?.totalOperation || 0), 0);
const totalOperationWithComm = mockTravels.reduce((sum, t) => sum + (t.buy?.totalOperationWithCommission || 0), 0);
const avgYield = totalKgClean > 0 ? (totalKgFaena / totalKgClean) : 0;

assert.strictEqual(totalHeads, 75);
assert.strictEqual(totalKgClean, 30000);
assert.strictEqual(totalKgFaena, 17400);
assert.strictEqual(totalOperation, 22000000);
assert.strictEqual(totalOperationWithComm, 22610000);
assert.strictEqual((avgYield * 100).toFixed(2), '58.00');
console.log('✅ Test 5: Summary KPIs calculation passed.');

console.log('\n🎉 ALL TRAVELS FILTERING AND SEARCH TESTS PASSED SUCCESSFULLY!');
