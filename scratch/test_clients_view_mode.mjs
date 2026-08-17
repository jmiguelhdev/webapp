// scratch/test_clients_view_mode.mjs
import assert from 'node:assert';
import { ClientAccount } from '../src/domain/entities/ClientAccount.js';

const mockClient = {
  id: 'CLI_001',
  name: 'Carnicería El Buen Corte',
  cuit: '30-12345678-9',
  address: 'Av. San Martín 1234',
  phone: '11-4455-6677'
};

const mockTxs = [
  {
    id: 'TX_001',
    clientId: 'CLI_001',
    type: 'DEBT',
    amount: 1500000,
    date: '2026-08-10',
    description: 'Despacho Facturado N° SALE_101'
  },
  {
    id: 'TX_002',
    clientId: 'CLI_001',
    type: 'PAYMENT',
    amount: 500000,
    date: '2026-08-14',
    description: 'Cobro transferencia bancaria'
  }
];

const account = new ClientAccount(mockClient, mockTxs);
assert.strictEqual(account.getBalance(), 1000000, 'Balance must be 1,000,000');
assert.strictEqual(account.getDebtTotal(), 1500000, 'Debt total must be 1,500,000');
assert.strictEqual(account.getPaymentsTotal(), 500000, 'Payments total must be 500,000');

const lastMov = account.getLastMovement();
assert.ok(lastMov, 'Last movement must exist');
assert.strictEqual(lastMov.type, 'PAYMENT');
assert.strictEqual(lastMov.amount, 500000);

console.log('✅ Client Account Domain logic & last movement extraction verified.');
console.log('🎉 ALL CLIENT VIEW MODE TESTS PASSED!');
