// scratch/test_multi_select_and_comparisons.mjs
import assert from 'node:assert';
import { CalculateCategoryStats } from '../src/domain/usecases/CalculateCategoryStats.js';
import { exportTravelBreakdownExcel } from '../src/frameworks/ui/reports/ReportService.js';

const mockTravels = [
  {
    id: 'TRV_001',
    date: '2026-08-10',
    status: 'ACTIVE',
    buy: {
      agent: { name: 'Pedro Gómez', percent: 2.0 },
      agentCommissionAmount: 200000,
      totalOperation: 10000000,
      totalOperationWithCommission: 10200000,
      totalQuantity: 50,
      totalKgClean: 20000,
      totalKgFaena: 11800,
      generalYield: 11800 / 20000,
      categories: ['NOVILLO'],
      listOfProducers: [
        {
          producer: { name: 'Estancia La Linda', cuit: '30-11223344-5' },
          origin: 'Azul',
          listOfProducts: [
            {
              name: 'NOVILLO',
              standardizedCategory: 'NOVILLO',
              quantity: 50,
              kgClean: 20000,
              kgFaena: 11800, // 59.00%
              price: 500,
              operation: 10000000
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
  },
  {
    id: 'TRV_003',
    date: '2026-08-15',
    status: 'COMPLETED',
    buy: {
      agent: { name: 'Pedro Gómez', percent: 2.0 },
      agentCommissionAmount: 150000,
      totalOperation: 7500000,
      totalOperationWithCommission: 7650000,
      totalQuantity: 35,
      totalKgClean: 15000,
      totalKgFaena: 8700, // 58.00%
      generalYield: 8700 / 15000,
      categories: ['VAQUILLONA'],
      listOfProducers: [
        {
          producer: { name: 'El Trébol Ganadera', cuit: '30-55443322-1' },
          origin: 'Tandil',
          listOfProducts: [
            {
              name: 'VAQUILLONA',
              standardizedCategory: 'VAQUILLONA',
              quantity: 35,
              kgClean: 15000,
              kgFaena: 8700,
              price: 500,
              operation: 7500000
            }
          ]
        }
      ]
    }
  }
];

const categoryPrices = {
  NOVILLO: 1000,
  VACA: 1100,
  VAQUILLONA: 950
};

const useCase = new CalculateCategoryStats();
const stats = useCase.execute(mockTravels, 'TODOS', true, categoryPrices);

// Test 1: Agent Comparisons Structure & Sell Price Ref / Margins
assert.ok(stats.comparisons, 'comparisons must exist');
assert.strictEqual(stats.comparisons.agents.length, 2, 'Must have 2 unique agents');

const pedro = stats.comparisons.agents.find(a => a.name === 'Pedro Gómez');
assert.ok(pedro, 'Pedro Gómez must exist in agent comparisons');
assert.strictEqual(pedro.travelCount, 2);
assert.strictEqual(pedro.heads, 85); // 50 + 35
assert.strictEqual(pedro.kgClean, 35000);
assert.strictEqual(pedro.kgFaena, 20500); // 11800 + 8700
assert.strictEqual(pedro.yieldPct.toFixed(2), '58.57');
// Weighted Sell Ref for Pedro: (1000 * 20000 + 950 * 15000) / 35000 = (20000000 + 14250000) / 35000 = 34250000 / 35000 = 978.5714
assert.strictEqual(pedro.sellPriceRef.toFixed(2), '978.57');
assert.ok(pedro.margin > 0, 'Pedro must have positive margin');
assert.strictEqual(pedro.producers.length, 2, 'Pedro Gómez worked with 2 producers');
assert.strictEqual(pedro.producers[0].sellPriceRef.toFixed(2), '1000.00');
console.log(`✅ Test 1: Agent comparisons with sell ref ($${pedro.sellPriceRef.toFixed(2)}) & margin ($${pedro.margin.toFixed(2)}) verified.`);

// Test 2: Producer Comparisons Structure & Sell Price Ref / Margins
assert.strictEqual(stats.comparisons.producers.length, 3, 'Must have 3 unique producers');
const sanJose = stats.comparisons.producers.find(p => p.name === 'Cabaña San José');
assert.ok(sanJose, 'Cabaña San José must exist');
assert.strictEqual(sanJose.heads, 25);
assert.strictEqual(sanJose.yieldPct.toFixed(2), '56.00');
assert.strictEqual(sanJose.sellPriceRef.toFixed(2), '1100.00');
assert.ok(sanJose.margin !== 0, 'Margin must be computed');
assert.strictEqual(sanJose.agents.length, 1);
assert.strictEqual(sanJose.agents[0].name, 'María Consignataria');
console.log(`✅ Test 2: Producer comparisons with sell ref ($${sanJose.sellPriceRef.toFixed(2)}) & margin ($${sanJose.margin.toFixed(2)}) verified.`);

// Test 3: Cross Matrix Structure
assert.strictEqual(stats.comparisons.crossMatrix.agents.length, 2);
assert.strictEqual(stats.comparisons.crossMatrix.producers.length, 3);
const cellPedroLinda = stats.comparisons.crossMatrix.cells['Pedro Gómez:::Estancia La Linda'];
assert.ok(cellPedroLinda, 'Cross cell Pedro Gómez:::Estancia La Linda must exist');
assert.strictEqual(cellPedroLinda.heads, 50);
assert.strictEqual(cellPedroLinda.yieldPct.toFixed(2), '59.00');
assert.strictEqual(cellPedroLinda.sellPriceRef.toFixed(2), '1000.00');
console.log(`✅ Test 3: Cross matrix intersection with sell ref ($${cellPedroLinda.sellPriceRef.toFixed(2)}) verified.`);

// Test 4: Export to Excel Function Exists and is callable
assert.strictEqual(typeof exportTravelBreakdownExcel, 'function', 'exportTravelBreakdownExcel must be exported');
console.log('✅ Test 4: exportTravelBreakdownExcel function available.');

// Test 5: Unslaughtered / Zero Yield handling
const pendingTravel = [
  {
    id: 'TRV_PENDING',
    date: '2026-08-14',
    status: 'ACTIVE',
    buy: {
      agent: { name: 'Comisionista X', percent: 2.0 },
      totalOperation: 5000000,
      totalOperationWithCommission: 5100000,
      totalQuantity: 30,
      totalKgClean: 10000,
      totalKgFaena: 0,
      generalYield: 0,
      categories: ['NOVILLO'],
      listOfProducers: [
        {
          producer: { name: 'Campo Nuevo', cuit: '30-11111111-1' },
          origin: 'Mercedes',
          listOfProducts: [
            {
              name: 'NOVILLO',
              standardizedCategory: 'NOVILLO',
              quantity: 30,
              kgClean: 10000,
              kgFaena: 0,
              price: 500,
              operation: 5000000
            }
          ]
        }
      ]
    }
  }
];

const pendingStats = useCase.execute(pendingTravel, 'NOVILLO', true, categoryPrices);
assert.strictEqual(pendingStats.realCostGancho, 0, 'realCostGancho must be 0 when yield is 0');
assert.strictEqual(pendingStats.margin, 0, 'margin must be 0 when yield is 0');
assert.strictEqual(pendingStats.categoryBreakdown[0].costoGancho, 0);
assert.strictEqual(pendingStats.categoryBreakdown[0].realCostGancho, 0);
assert.strictEqual(pendingStats.comparisons.agents[0].costoGancho, 0);
assert.strictEqual(pendingStats.comparisons.agents[0].realCostGancho, 0);
assert.strictEqual(pendingStats.comparisons.producers[0].costoGancho, 0);
assert.strictEqual(pendingStats.comparisons.producers[0].realCostGancho, 0);
console.log('✅ Test 5: Zero yield / unslaughtered travels correctly produce 0 for hook costs and margins.');

console.log('\n🎉 ALL SELL REF PRICE, MARGINS, ZERO YIELD, AND EXCEL EXPORT TESTS PASSED!');

