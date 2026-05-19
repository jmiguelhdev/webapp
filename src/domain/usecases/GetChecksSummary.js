// src/domain/usecases/GetChecksSummary.js
import { Check } from '../entities/Check.js';

export class GetChecksSummary {
  /**
   * Executes the orchestration of checks data, calculating stats and lists.
   * @param {Array<Object>} checksArray - Raw checks array.
   * @returns {Object} Calculated summary, portfolio/history checks, and statistics.
   */
  execute(checksArray) {
    // 1. Map all items to domain Check entities
    const domainChecks = checksArray.map(c => {
      const checkEntity = new Check(c);
      // Run calculations if not already performed or as double check
      checkEntity.calculate();
      return checkEntity;
    });

    // 2. Separate portfolio and history
    const portfolioChecks = domainChecks.filter(c => c.isPortfolio);
    const historyChecks = domainChecks.filter(c => c.isHistory);

    // 3. Aggregate totals over ALL domain checks or subset
    const totalProfit = domainChecks.reduce((sum, c) => sum + c.profit, 0);
    const totalInPortfolio = portfolioChecks.reduce((sum, c) => sum + c.nominalValue, 0);
    const totalPortfolioDiscount = portfolioChecks.reduce((sum, c) => sum + c.purchaseDiscount, 0);

    // 4. Filter upcoming/expiring checks (for warning banner)
    const expiringChecks = portfolioChecks.filter(c => {
      const alertState = c.getAlertState();
      return alertState.code === 'EXPIRING_URGENT';
    });

    return {
      domainChecks,
      portfolioChecks,
      historyChecks,
      totalProfit,
      totalInPortfolio,
      totalPortfolioDiscount,
      portfolioChecksCount: portfolioChecks.length,
      expiringChecks
    };
  }
}
