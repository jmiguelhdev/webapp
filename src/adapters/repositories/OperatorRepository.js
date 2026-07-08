// src/adapters/repositories/OperatorRepository.js
import { db } from '../../firebase.js';
import * as operatorApi from '../api/OperatorApi.js';
import * as clientApi from '../api/ClientApi.js';

/**
 * Repositorio para la gestión de operadores de bolsa y transacciones financieras vinculadas.
 */
export class OperatorRepository {
  constructor() {}

  /**
   * Obtiene todos los operadores registrados.
   * @returns {Promise<Array<Object>>} Lista de operadores.
   */
  async getOperators() {
    return operatorApi.fetchOperators(db);
  }

  /**
   * Guarda o actualiza los datos de un operador.
   * @param {Object} operatorData - Atributos del operador.
   * @returns {Promise<void>}
   */
  async saveOperator(operatorData) {
    return operatorApi.saveOperator(db, operatorData);
  }

  /**
   * Obtiene las transacciones registradas de un operador.
   * @param {string} operatorId - ID del operador.
   * @returns {Promise<Array<Object>>} Lista de transacciones.
   */
  async getTransactions(operatorId) {
    return operatorApi.fetchOperatorTransactions(db, operatorId);
  }

  /**
   * Obtiene todas las transacciones globales de operadores.
   * @returns {Promise<Array<Object>>} Lista de transacciones de operadores.
   */
  async getAllTransactions() {
    return operatorApi.fetchAllOperatorTransactions(db);
  }

  /**
   * Registra una transacción en la cuenta de un operador.
   * @param {Object} transaction - Datos de la transacción.
   * @returns {Promise<void>}
   */
  async addTransaction(transaction) {
    return operatorApi.addOperatorTransaction(db, transaction);
  }

  /**
   * Sincroniza la compra o venta de cheques de la cuenta corriente de operadores.
   * @param {string} checkId - ID del cheque.
   * @param {string} side - Lado de la transacción ('BUY' o 'SELL').
   * @param {Object|null} transactionData - Datos de la transacción.
   * @returns {Promise<void>}
   */
  async syncCheckTransaction(checkId, side, transactionData) {
    return clientApi.syncTransactionByCheck(db, 'operator_transactions', checkId, side, transactionData);
  }
}
