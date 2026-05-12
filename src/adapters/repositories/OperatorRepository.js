// src/adapters/repositories/OperatorRepository.js
import { db } from '../../firebase.js';
import * as checksApi from '../../api/checksApi.js';

export class OperatorRepository {
  constructor() {}

  async getOperators() {
    return checksApi.fetchOperators(db);
  }

  async saveOperator(operatorData) {
    return checksApi.saveOperator(db, operatorData);
  }

  async getTransactions(operatorId) {
    return checksApi.fetchOperatorTransactions(db, operatorId);
  }

  async getAllTransactions() {
    return checksApi.fetchAllOperatorTransactions(db);
  }

  async addTransaction(transaction) {
    return checksApi.addOperatorTransaction(db, transaction);
  }

  async syncCheckTransaction(checkId, side, transactionData) {
    return checksApi.syncTransactionByCheck(db, 'operator_transactions', checkId, side, transactionData);
  }
}
