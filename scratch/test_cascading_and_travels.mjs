// scratch/test_cascading_and_travels.mjs
import assert from 'node:assert';

const mockAllTravels = [
  {
    id: 'TRV_001',
    date: '2026-08-10',
    buy: {
      agent: { name: 'Pedro Gómez', percent: 2.0 },
      listOfProducers: [
        { producer: { name: 'Estancia La Linda', cuit: '30-11223344-5' }, origin: 'Azul' }
      ]
    }
  },
  {
    id: 'TRV_002',
    date: '2026-08-12',
    buy: {
      agent: { name: 'María Consignataria', percent: 3.0 },
      listOfProducers: [
        { producer: { name: 'Cabaña San José', cuit: '30-99887766-1' }, origin: 'Olavarría' }
      ]
    }
  },
  {
    id: 'TRV_003',
    date: '2026-08-15',
    buy: {
      agent: { name: 'Pedro Gómez', percent: 2.0 },
      listOfProducers: [
        { producer: { name: 'El Trébol Ganadera', cuit: '30-55443322-1' }, origin: 'Tandil' }
      ]
    }
  }
];

function getProducersForAgent(allTravels, selectedAgent) {
  const producersMap = new Map();
  allTravels.forEach(t => {
    const agentName = (t.buy?.agent?.name || '').trim();
    const matchesSelectedAgent = !selectedAgent || selectedAgent === 'ALL' || 
      agentName.toLowerCase() === selectedAgent.trim().toLowerCase();

    if (matchesSelectedAgent) {
      (t.buy?.listOfProducers || []).forEach(p => {
        const pName = (p.producer?.name || p.name || '').trim();
        const pCuit = String(p.producer?.cuit || p.cuit || '').trim();
        if (pName) {
          producersMap.set(pName, { name: pName, cuit: pCuit });
        }
      });
    }
  });
  return Array.from(producersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function validateAndResetProducer(allTravels, selectedAgent, selectedProducer) {
  if (selectedAgent && selectedProducer) {
    const targetAgent = selectedAgent.trim().toLowerCase();
    const targetProd = selectedProducer.trim().toLowerCase();
    const isValid = allTravels.some(t => {
      const agName = (t.buy?.agent?.name || '').trim().toLowerCase();
      if (agName !== targetAgent) return false;
      return (t.buy?.listOfProducers || []).some(p => {
        const pName = (p.producer?.name || p.name || '').trim().toLowerCase();
        const pCuit = String(p.producer?.cuit || p.cuit || '').trim().toLowerCase();
        return pName === targetProd || pCuit === targetProd;
      });
    });
    if (!isValid) return '';
  }
  return selectedProducer;
}

// Test 1: All producers when no agent selected
const allProds = getProducersForAgent(mockAllTravels, '');
assert.strictEqual(allProds.length, 3, 'Should have 3 unique producers when no agent is selected');
console.log('✅ Test 1: Full producer list when no agent selected ->', allProds.map(p => p.name));

// Test 2: Producers for Pedro Gómez
const pedroProds = getProducersForAgent(mockAllTravels, 'Pedro Gómez');
assert.strictEqual(pedroProds.length, 2, 'Pedro Gómez should have 2 producers');
assert.deepStrictEqual(pedroProds.map(p => p.name), ['El Trébol Ganadera', 'Estancia La Linda']);
console.log('✅ Test 2: Cascading producer list for Pedro Gómez ->', pedroProds.map(p => p.name));

// Test 3: Producers for María Consignataria
const mariaProds = getProducersForAgent(mockAllTravels, 'María Consignataria');
assert.strictEqual(mariaProds.length, 1);
assert.strictEqual(mariaProds[0].name, 'Cabaña San José');
console.log('✅ Test 3: Cascading producer list for María Consignataria ->', mariaProds.map(p => p.name));

// Test 4: Producer reset when changing agent
let currentProducer = 'Cabaña San José'; // Belongs to María
let resetProducer = validateAndResetProducer(mockAllTravels, 'Pedro Gómez', currentProducer);
assert.strictEqual(resetProducer, '', 'Producer must reset when switching to an agent that does not have that producer');
console.log('✅ Test 4: Selected producer successfully reset when changing to incompatible agent');

let validProducer = validateAndResetProducer(mockAllTravels, 'Pedro Gómez', 'Estancia La Linda');
assert.strictEqual(validProducer, 'Estancia La Linda', 'Producer should be retained if compatible');
console.log('✅ Test 5: Compatible producer retained');

console.log('\n🎉 ALL CASCADING & TRAVEL BREAKDOWN LOGIC TESTS PASSED!');
