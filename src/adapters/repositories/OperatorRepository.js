// src/adapters/repositories/OperatorRepository.js
import { db } from '../../firebase.js';
import * as api from '../../api.js';

export class OperatorRepository {
  constructor() {}

  async getOperators() {
    return api.fetchOperators(db);
  }

  async saveOperator(operatorData) {
    return api.saveOperator(db, operatorData);
  }

  async getTransactions(operatorId) {
    return api.fetchOperatorTransactions(db, operatorId);
  }

  async getAllTransactions() {
    return api.fetchAllOperatorTransactions(db);
  }

  async addTransaction(transaction) {
    return api.addOperatorTransaction(db, transaction);
  }

  async syncCheckTransaction(checkId, side, transactionData) {
    return api.syncTransactionByCheck(db, 'operator_transactions', checkId, side, transactionData);
  }
}
