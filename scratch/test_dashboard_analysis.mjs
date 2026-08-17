// scratch/test_dashboard_analysis.mjs
import assert from 'node:assert';
import { CalculateCategoryStats } from '../src/domain/usecases/CalculateCategoryStats.js';

const mockTravels = [
  {
    id: 'TRV_001',
    date: '2026-08-10',
    status: 'ACTIVE',
    truck: { name: 'Scania' },
    buy: {
      agent: { name: 'Pedro Gómez', percent: 2.0 },
      agentCommissionAmount: 200000,
      totalOperation: 10000000,
      totalOperationWithCommission: 10200000,
      totalQuantity: 50,
      totalKgClean: 20000,
      totalKgFaena: 11800,
      generalYield: 11800 / 20000,
      categories: ['NOVILLO', 'VAQUILLONA'],
      totalFreight: 500000,
      listOfProducers: [
        {
          producer: { name: 'Estancia La Linda', cuit: '30-11223344-5' },
          origin: 'Azul',
          listOfProducts: [
            {
              name: 'NOVILLO',
              standardizedCategory: 'NOVILLO',
              quantity: 30,
              kgClean: 12000,
              kgFaena: 7080, // 59.00%
              price: 500,
              operation: 6000000
            },
            {
              name: 'VAQUILLONA',
              standardizedCategory: 'VAQUILLONA',
              quantity: 20,
              kgClean: 8000,
              kgFaena: 4720, // 59.00%
              price: 500,
              operation: 4000000
            }
          ]
        }
      ]
    }
  },
  {
    id: 'TRV_002',
    date: '2026-08-12',
    status: 'COMPLETED',
    truck: { name: 'Volvo' },
    buy: {
      agent: { name: 'María Consignataria', percent: 3.0 },
      agentCommissionAmount: 180000,
      totalOperation: 6000000,
      totalOperationWithCommission: 6180000,
      totalQuantity: 25,
      totalKgClean: 10000,
      totalKgFaena: 5600, // 56.00%
      generalYield: 5600 / 10000,
      categories: ['VACA'],
      totalFreight: 250000,
      listOfProducers: [
        {
          producer: { name: 'Cabaña San José', cuit: '30-99887766-1' },
          origin: 'Olavarría',
          listOfProducts: [
            {
              name: 'VACA',
              standardizedCategory: 'VACA',
              quantity: 25,
              kgClean: 10000,
              kgFaena: 5600, // 56.00%
              price: 600,
              operation: 6000000
            }
          ]
        }
      ]
    }
  }
];

const categoryPrices = {
  'NOVILLO': 1050,
  'VAQUILLONA': 1020,
  'VACA': 1150
};

const useCase = new CalculateCategoryStats();

// Test 1: Calculate category breakdown for ALL categories
const statsAll = useCase.execute(mockTravels, 'TODOS', false, categoryPrices);

assert.ok(statsAll.categoryBreakdown, 'categoryBreakdown must be present');
assert.strictEqual(statsAll.categoryBreakdown.length, 3, 'Must have 3 categories');

const novillo = statsAll.categoryBreakdown.find(c => c.category === 'NOVILLO');
assert.ok(novillo, 'NOVILLO category must exist');
assert.strictEqual(novillo.heads, 30);
assert.strictEqual(novillo.kgClean, 12000);
assert.strictEqual(novillo.kgFaena, 7080);
assert.strictEqual(novillo.yieldPct.toFixed(2), '59.00');
assert.strictEqual(novillo.avgPrice, 500);
assert.strictEqual(novillo.sellPriceRef, 1050);
assert.ok(novillo.realCostGancho > 800, 'Real cost gancho must be properly calculated');
assert.ok(novillo.margin > 0, 'Margin must be positive when sellPrice > realCost');

console.log('✅ Test 1: Category breakdown calculation verified.');
console.log('   NOVILLO Yield:', novillo.yieldPct.toFixed(2) + '%', '| Cabezas:', novillo.heads, '| Costo Gancho:', '$' + novillo.costoGancho.toFixed(2), '| Real Cost:', '$' + novillo.realCostGancho.toFixed(2), '| Margin:', '$' + novillo.margin.toFixed(2));

const vaca = statsAll.categoryBreakdown.find(c => c.category === 'VACA');
assert.strictEqual(vaca.heads, 25);
assert.strictEqual(vaca.yieldPct.toFixed(2), '56.00');
console.log('   VACA Yield:', vaca.yieldPct.toFixed(2) + '%', '| Cabezas:', vaca.heads, '| Costo Gancho:', '$' + vaca.costoGancho.toFixed(2));

// Test 2: Calculate category stats with Commission included
const statsWithComm = useCase.execute(mockTravels, 'TODOS', true, categoryPrices);
const novilloComm = statsWithComm.categoryBreakdown.find(c => c.category === 'NOVILLO');
assert.strictEqual(novilloComm.avgPriceWithCommission, 510); // 500 * 1.02
assert.ok(novilloComm.costoGancho > novillo.costoGancho, 'Cost with commission must be higher than base cost');
console.log('✅ Test 2: Commission inclusion in breakdown costs verified.');

// Test 3: Filtered by specific category ('NOVILLO')
const statsNovilloOnly = useCase.execute(mockTravels, ['NOVILLO'], false, categoryPrices);
assert.strictEqual(statsNovilloOnly.categoryBreakdown.length, 1);
assert.strictEqual(statsNovilloOnly.categoryBreakdown[0].category, 'NOVILLO');
console.log('✅ Test 3: Specific category filtering verified.');

console.log('\n🎉 ALL DASHBOARD YIELD ANALYSIS TESTS PASSED SUCCESSFULLY!');
