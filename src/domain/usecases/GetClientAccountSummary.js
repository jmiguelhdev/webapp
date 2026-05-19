// src/domain/usecases/GetClientAccountSummary.js

import { ClientAccount } from '../entities/ClientAccount.js';

/**
 * Caso de uso para obtener el resumen financiero consolidado de la cuenta corriente de un cliente u operador.
 * Orquesta la transformación de los datos crudos en la entidad de negocio ClientAccount.
 */
export class GetClientAccountSummary {
  /**
   * Ejecuta el caso de uso y consolida los cálculos del cliente.
   * 
   * @param {Object} data - Datos necesarios para el caso de uso.
   * @param {Object} data.client - El cliente u operador seleccionado.
   * @param {Array<Object>} data.transactions - Lista completa de transacciones del cliente.
   * @returns {Object} El resumen de cuenta corriente formateado para el presentador y la UI.
   * @property {ClientAccount} account - La instancia de la entidad de dominio ClientAccount.
   * @property {number} debtTotal - Monto total acumulado de deudas (DEBT).
   * @property {number} paymentsTotal - Monto total acumulado de pagos (PAYMENT).
   * @property {number} balance - Saldo corriente final pendiente de la cuenta.
   */
  execute({ client, transactions }) {
    const account = new ClientAccount(client, transactions);

    return {
      account,
      debtTotal: account.getDebtTotal(),
      paymentsTotal: account.getPaymentsTotal(),
      balance: account.getBalance()
    };
  }
}
