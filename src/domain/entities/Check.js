// src/domain/entities/Check.js
import { parseDateLocal } from '../../frameworks/utils/formatters.js';

export class Check {
  constructor(data = {}) {
    this.id = data.id || '';
    this.bank = data.bank || '';
    this.checkNumber = data.checkNumber || '';
    this.nominalValue = parseFloat(data.nominalValue) || 0;
    this.dueDate = data.dueDate || '';
    this.receptionDate = data.receptionDate || '';
    this.issueDate = data.issueDate || '';
    this.clearing = parseInt(data.clearing) || 0;
    this.notes = data.notes || '';
    this.issuerName = data.issuerName || '';
    this.issuerCuit = data.issuerCuit || '';
    this.isECheck = data.isECheck === true || data.isECheck === 'true';

    // Rejected state check tracking fields
    this.returned = data.returned || false;
    this.returnedAt = data.returnedAt || null;
    this.settledByCompany = data.settledByCompany || false;
    this.settledByCompanyAt = data.settledByCompanyAt || null;
    this.settledBySeller = data.settledBySeller || false;
    this.settledBySellerAt = data.settledBySellerAt || null;


    this.buySide = data.buySide ? {
      contactId: data.buySide.contactId || '',
      pesificacionRate: parseFloat(data.buySide.pesificacionRate) || 0,
      monthlyInterest: parseFloat(data.buySide.monthlyInterest) || 0,
      netAmount: parseFloat(data.buySide.netAmount) || 0,
      operationId: data.buySide.operationId || '',
      date: data.buySide.date || null
    } : null;

    this.sellSide = data.sellSide ? {
      contactId: data.sellSide.contactId || '',
      pesificacionRate: parseFloat(data.sellSide.pesificacionRate) || 0,
      monthlyInterest: parseFloat(data.sellSide.monthlyInterest) || 0,
      netAmount: parseFloat(data.sellSide.netAmount) || 0,
      status: data.sellSide.status || 'PENDING',
      backReason: data.sellSide.backReason || '',
      operationId: data.sellSide.operationId || '',
      date: data.sellSide.date || null
    } : null;

    this.profit = parseFloat(data.profit) || 0;
    this.days = parseInt(data.days) || 0;
    this.expireAt = data.expireAt || null;
  }

  /**
   * Performs core financial calculations for the check.
   */
  calculate() {
    const reception = new Date(this.receptionDate);
    const due = new Date(this.dueDate);

    // TTL: 3 years from reception date
    const expireAt = new Date(reception);
    expireAt.setFullYear(expireAt.getFullYear() + 3);
    this.expireAt = expireAt;

    // Calculate days: (Due - Reception) + Clearing
    const diffTime = due.getTime() - reception.getTime(); // chequear el caso de igual a cero
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Si la diferencia de días es 0 (o negativa), los días totales son 0 y el clearing no aplica.
    // Si es mayor a 0, se suman los días de diferencia + el clearing.
    this.days = diffDays <= 0 ? 0 : diffDays + this.clearing;

    // Buy side calculation
    if (this.buySide) {
      const pesificationAmount = this.nominalValue * (this.buySide.pesificacionRate / 100);
      const interestAmount = this.nominalValue * (this.buySide.monthlyInterest / 100 / 30) * this.days;
      this.buySide.netAmount = this.nominalValue - pesificationAmount - interestAmount;
    }

    // Sell side calculation
    if (this.sellSide && this.sellSide.status === 'SOLD') {
      const pesificationAmount = this.nominalValue * (this.sellSide.pesificacionRate / 100);
      const interestAmount = this.nominalValue * (this.sellSide.monthlyInterest / 100 / 30) * this.days;
      this.sellSide.netAmount = this.nominalValue - pesificationAmount - interestAmount;
      this.profit = this.sellSide.netAmount - (this.buySide ? this.buySide.netAmount : 0);
    } else {
      this.profit = 0;
    }
  }

  /**
   * Checks if this check is currently in the portfolio.
   */
  get isPortfolio() {
    const status = this.sellSide?.status;
    return !status || status === 'PENDING' || status === 'BACK' || status === 'RETURNED';
  }

  /**
   * Checks if this check represents a historical transaction.
   */
  get isHistory() {
    const status = this.sellSide?.status;
    return status === 'SOLD' || status === 'REJECTED';
  }

  /**
   * Calculates the purchase discount (unrealized profit in portfolio).
   */
  get purchaseDiscount() {
    if (!this.buySide || isNaN(this.buySide.netAmount)) return 0;
    return this.nominalValue - this.buySide.netAmount;
  }

  /**
   * Calculates the purchase discount as a percentage of nominal value.
   */
  get purchaseDiscountPercentage() {
    if (this.nominalValue === 0) return 0;
    return (this.purchaseDiscount / this.nominalValue) * 100;
  }

  /**
   * Calculates days to due date.
   */
  getDaysToPayDate(refDate = new Date()) {
    const today = new Date(refDate);
    today.setHours(0, 0, 0, 0);
    const payDate = parseDateLocal(this.dueDate);
    if (!payDate) return 0;
    return Math.ceil((payDate - today) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculates days to final expiry (due date + 30 days of grace).
   */
  getDaysToExpiry(refDate = new Date()) {
    const today = new Date(refDate);
    today.setHours(0, 0, 0, 0);
    const payDate = parseDateLocal(this.dueDate);
    if (!payDate) return 0;
    const expiryDate = new Date(payDate);
    expiryDate.setDate(payDate.getDate() + 30);
    return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  }

  /**
   * Evaluates date alerts and status to determine current alert state.
   */
  getAlertState(refDate = new Date()) {
    const status = this.sellSide?.status || 'PENDING';
    if (status !== 'PENDING' && status !== 'BACK') {
      return { status };
    }

    const diffToPayDate = this.getDaysToPayDate(refDate);
    const diffToExpiry = this.getDaysToExpiry(refDate);

    if (diffToExpiry < 0) {
      return { status, code: 'EXPIRED', label: '⛔ VENCIDO', colorClass: 'badge-danger' };
    } else if (diffToPayDate <= 0 && diffToExpiry <= 10) {
      return { status, code: 'EXPIRING_URGENT', label: '⏳ PRÓXIMO A VENCER', colorClass: 'badge-warning' };
    } else if (diffToPayDate <= 0) {
      return { status, code: 'AVAILABLE', label: '✅ DISPONIBLE', colorClass: 'badge-disponible' };
    } else if (diffToPayDate <= 10) {
      return { status, code: 'UPCOMING_PAYMENT', label: `🔔 PAGO EN ${diffToPayDate}d`, colorClass: 'badge-upcoming', days: diffToPayDate };
    }
    return { status, code: 'IN_PORTFOLIO', label: 'EN CARTERA', colorClass: 'badge-pending' };
  }
}
