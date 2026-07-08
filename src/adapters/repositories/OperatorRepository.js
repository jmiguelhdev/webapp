// src/adapters/repositories/OperatorRepository.js
import { db } from '../../firebase.js';
import * as operatorApi from '../../api/OperatorApi.js';
import * as clientApi from '../../api/ClientApi.js';

export class OperatorRepository {
  constructor() {}

  async getOperators() {
    return operatorApi.fetchOperators(db);
  }

  async saveOperator(operatorData) {
    return operatorApi.saveOperator(db, operatorData);
  }

  async getTransactions(operatorId) {
    return operatorApi.fetchOperatorTransactions(db, operatorId);
  }

  async getAllTransactions() {
    return operatorApi.fetchAllOperatorTransactions(db);
  }

  async addTransaction(transaction) {
    return operatorApi.addOperatorTransaction(db, transaction);
  }

  async syncCheckTransaction(checkId, side, transactionData) {
    return clientApi.syncTransactionByCheck(db, 'operator_transactions', checkId, side, transactionData);
  }
}
