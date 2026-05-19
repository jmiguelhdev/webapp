import { PriceReference } from './PriceReference.js';

console.log('🧪 Running PriceReference Domain Entity Tests...');

// Test case 1: Standard populated prices
const prices1 = {
  'NOVILLO': 2300,
  'VAQUILLONA': 2250,
  'VACA': 1800,
  'TORO': 1900
};

const ref1 = new PriceReference(prices1);
console.assert(ref1.mestizoPrice === 2300, 'Test 1: Mestizo should be max price (2300)');
console.assert(ref1.overoPrice === 2250, 'Test 1: Overo should be max price below Mestizo (2250)');
console.assert(ref1.vacaPrice === 1800, 'Test 1: Vaca should be 1800');
console.assert(ref1.toroPrice === 1900, 'Test 1: Toro should be 1900');

// Test case 2: Empty/missing values
const prices2 = {};
const ref2 = new PriceReference(prices2);
console.assert(ref2.mestizoPrice === 0, 'Test 2: Mestizo should be 0 on empty');
console.assert(ref2.overoPrice === 0, 'Test 2: Overo should be 0 on empty');
console.assert(ref2.vacaPrice === 0, 'Test 2: Vaca should be 0');
console.assert(ref2.toroPrice === 0, 'Test 2: Toro should be 0');

// Test case 3: Single price (overo fallback)
const prices3 = {
  'MESTIZO': 3000
};
const ref3 = new PriceReference(prices3);
console.assert(ref3.mestizoPrice === 3000, 'Test 3: Mestizo should be 3000');
console.assert(ref3.overoPrice === 3000 * 0.95, 'Test 3: Overo should fall back to 95% of Mestizo (2850)');

// Test case 4: Non-numeric strings
const prices4 = {
  'NOVILLO': '2500.50',
  'VAQUILLONA': 'badval',
  'VACA': '1750.25'
};
const ref4 = new PriceReference(prices4);
console.assert(ref4.mestizoPrice === 2500.50, 'Test 4: Mestizo should parse string to float (2500.50)');
console.assert(ref4.vacaPrice === 1750.25, 'Test 4: Vaca should parse string to float (1750.25)');

console.log('✅ All PriceReference tests passed successfully!');
