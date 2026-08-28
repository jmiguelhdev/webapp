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
    this.issuerName = data.issuerName || data.issuer || data.librador || data.issuer_name || data.nombreLibrador || '';
    this.issuerCuit = data.issuerCuit || data.cuit || data.cuitLibrador || data.issuer_cuit || data.cuit_librador || '';
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

    // Movement history log
    this.movements = Array.isArray(data.movements) ? [...data.movements] : [];
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

  /**
   * Agrega un nuevo movimiento al historial cronológico del cheque.
   * @param {Object} movement - Datos del evento { type, title, description, details, date, extra }
   */
  addMovement(movement = {}) {
    const now = Date.now();
    const event = {
      id: movement.id || 'MOV-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase(),
      type: movement.type || 'GENERAL',
      title: movement.title || 'Movimiento',
      description: movement.description || '',
      details: movement.details || null,
      date: movement.date ? (typeof movement.date === 'string' && !isNaN(Date.parse(movement.date)) ? new Date(movement.date).getTime() : Number(movement.date)) : now,
      createdAt: now
    };
    if (!this.movements) this.movements = [];
    this.movements.push(event);
    return event;
  }

  /**
   * Reconstruye o retorna la línea de tiempo completa del cheque.
   * Si no hay movimientos guardados (retrocompatibilidad), infiere la secuencia de eventos.
   * @param {Array<Object>} contacts - Catálogo de contactos para resolver nombres.
   * @returns {Array<Object>} Lista cronológica de eventos de la línea de tiempo.
   */
  getFullTimeline(contacts = []) {
    const events = [];
    const getContactName = (id) => {
      if (!id) return 'Desconocido';
      const c = contacts.find(con => con.id === id || con.name === id);
      return c ? c.name : id;
    };

    const hasBuyEvent = (this.movements || []).some(m => m.type === 'BUY' || (m.title && m.title.includes('Compra')));
    const hasSellEvent = (this.movements || []).some(m => m.type === 'SELL' || (m.title && m.title.includes('Venta')));

    const receptionTime = this.receptionDate ? new Date(this.receptionDate + 'T00:00:00').getTime() : Date.now();

    // 1. Siempre asegurar que exista el evento de Compra / Ingreso inicial
    if (!hasBuyEvent && this.buySide) {
      const sellerName = getContactName(this.buySide?.contactId);
      events.push({
        id: 'INIT-BUY',
        type: 'BUY',
        title: '🟢 Ingreso / Compra en Cartera',
        description: `Ingresó a cartera desde <strong>${sellerName}</strong> por valor nominal de $${this.nominalValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}.`,
        details: {
          seller: sellerName,
          nominalValue: this.nominalValue,
          netAmount: this.buySide?.netAmount || 0,
          pesificacionRate: this.buySide?.pesificacionRate || 0,
          monthlyInterest: this.buySide?.monthlyInterest || 0,
          operationId: this.buySide?.operationId || 'S/N'
        },
        date: receptionTime,
        dateStr: this.receptionDate ? new Date(this.receptionDate + 'T12:00:00').toLocaleDateString('es-AR') : 'N/A'
      });
    }

    // 2. Si existió venta previa y no está registrada en movements, asegurar evento de venta inicial
    if (!hasSellEvent && this.sellSide && (this.sellSide.status === 'SOLD' || this.sellSide.status === 'REJECTED' || this.sellSide.contactId || this.sellSide.operationId)) {
      const buyerName = getContactName(this.sellSide.contactId);
      const sellTime = this.sellSide.date ? new Date(this.sellSide.date).getTime() : receptionTime + 1000;
      events.push({
        id: 'INIT-SELL',
        type: 'SELL',
        title: '🔵 Venta / Salida de Cheque',
        description: `Vendido a <strong>${buyerName}</strong> por neto de $${(this.sellSide.netAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}.`,
        details: {
          buyer: buyerName,
          netAmount: this.sellSide.netAmount || 0,
          pesificacionRate: this.sellSide.pesificacionRate || 0,
          monthlyInterest: this.sellSide.monthlyInterest || 0,
          operationId: this.sellSide.operationId || 'S/N'
        },
        date: sellTime,
        dateStr: this.sellSide.date ? new Date(this.sellSide.date).toLocaleString('es-AR') : 'N/A'
      });
    }

    if (this.movements && this.movements.length > 0) {
      this.movements.forEach(m => {
        events.push({
          id: m.id,
          type: m.type || 'GENERAL',
          title: m.title || 'Movimiento',
          description: m.description || '',
          details: m.details || null,
          date: m.date || m.createdAt || 0,
          dateStr: m.date ? new Date(m.date).toLocaleString('es-AR') : 'N/A'
        });
      });
    } else {
      // 3. Evento de Rechazo / Retorno si es cheque legado sin movements
      if (this.sellSide?.status === 'REJECTED') {
        const buyerName = getContactName(this.sellSide.contactId);
        events.push({
          id: 'INIT-REJECTED',
          type: 'REJECTED',
          title: '🔴 Cheque Rechazado',
          description: `El cheque entregado a <strong>${buyerName}</strong> fue marcado como Rechazado.`,
          details: {
            reason: this.sellSide?.backReason || this.notes || 'Sin motivo especificado'
          },
          date: (this.sellSide?.date ? new Date(this.sellSide.date).getTime() : receptionTime) + 2000,
          dateStr: 'Registrado'
        });
      } else if (this.sellSide?.status === 'BACK' || this.sellSide?.status === 'RETURNED') {
        events.push({
          id: 'INIT-BACK',
          type: 'RETURNED',
          title: '🔄 Cheque Retornado a Cartera',
          description: `El cheque volvió a cartera.${this.sellSide?.backReason ? ` Motivo: ${this.sellSide.backReason}` : ''}`,
          date: (this.sellSide?.date ? new Date(this.sellSide.date).getTime() : receptionTime) + 2000,
          dateStr: 'Registrado'
        });
      }

      // 4. Estados de Seguimiento de Rechazo para cheque legado
      if (this.returned) {
        events.push({
          id: 'INIT-VOLVIO',
          type: 'CONFIRMATION_VOLVIO',
          title: '🔄 Hoja de Cheque Recuperada',
          description: 'Se confirmó que la hoja física o soporte del cheque volvió.',
          date: this.returnedAt || Date.now(),
          dateStr: this.returnedAt ? new Date(this.returnedAt).toLocaleString('es-AR') : 'N/A'
        });
      }
      if (this.settledByCompany) {
        events.push({
          id: 'INIT-SETTLED-COMPANY',
          type: 'CONFIRMATION_COMPANY',
          title: '🏢 Levantado por la Empresa',
          description: 'El cheque fue levantado / saldado por la empresa.',
          date: this.settledByCompanyAt || Date.now(),
          dateStr: this.settledByCompanyAt ? new Date(this.settledByCompanyAt).toLocaleString('es-AR') : 'N/A'
        });
      }
      if (this.settledBySeller) {
        const sellerName = getContactName(this.buySide?.contactId);
        events.push({
          id: 'INIT-SETTLED-SELLER',
          type: 'CONFIRMATION_SELLER',
          title: `👤 Levantado por Vendedor (${sellerName})`,
          description: `El cheque fue levantado / saldado por el vendedor original (${sellerName}).`,
          date: this.settledBySellerAt || Date.now(),
          dateStr: this.settledBySellerAt ? new Date(this.settledBySellerAt).toLocaleString('es-AR') : 'N/A'
        });
      }
    }

    events.sort((a, b) => (a.date || 0) - (b.date || 0));
    return events;
  }
}

