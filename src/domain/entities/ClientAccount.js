// src/domain/entities/ClientAccount.js

/**
 * Entidad de dominio que representa la cuenta corriente de un cliente u operador.
 * Centraliza toda la lógica financiera de saldos, deudas, pagos, detalles de transacciones
 * y formateo de texto para compartir información de manera pura y desacoplada de la UI.
 */
export class ClientAccount {
  /**
   * @param {Object} client - Metadatos del cliente (id, nombre, cuit, dirección, etc.).
   * @param {Array<Object>} transactions - Colección de transacciones asociadas a la cuenta.
   */
  constructor(client = {}, transactions = []) {
    this.client = client;
    this.transactions = transactions;
  }

  /**
   * Calcula el monto total acumulado de deudas (despachos/ventas).
   * 
   * @returns {number} La suma de todas las deudas registradas.
   */
  getDebtTotal() {
    return this.transactions
      .filter(t => t.type === 'DEBT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  /**
   * Calcula el monto total acumulado de pagos registrados.
   * 
   * @returns {number} La suma de todos los pagos registrados.
   */
  getPaymentsTotal() {
    return this.transactions
      .filter(t => t.type === 'PAYMENT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  /**
   * Calcula el saldo pendiente/balance actual de la cuenta.
   * Un saldo positivo indica deuda del cliente, un saldo negativo indica saldo a favor.
   * 
   * @returns {number} El balance neto actual.
   */
  getBalance() {
    return this.getDebtTotal() - this.getPaymentsTotal();
  }

  /**
   * Calcula el saldo anterior consolidado (balance forward) previo a una marca de tiempo específica.
   * Se utiliza para arrastrar saldos en resúmenes de cuenta por rango de fechas.
   * 
   * @param {number} fromTime - Marca de tiempo milisegundos límite (excluyente).
   * @returns {number} El balance acumulado histórico hasta antes de la fecha límite.
   */
  getBalanceForward(fromTime) {
    const beforeTxs = this.transactions.filter(t => new Date(t.date || t.createdAt).getTime() < fromTime);
    return beforeTxs.reduce((sum, t) => {
      return sum + (t.type === 'DEBT' ? (t.amount || 0) : -(t.amount || 0));
    }, 0);
  }

  /**
   * Filtra y ordena cronológicamente las transacciones dentro de un rango de tiempo.
   * 
   * @param {number} fromTime - Marca de tiempo milisegundos inicial.
   * @param {number} toTime - Marca de tiempo milisegundos final.
   * @returns {Array<Object>} Lista filtrada y ordenada de transacciones.
   */
  getTransactionsForRange(fromTime, toTime) {
    return this.transactions
      .filter(t => {
        const dTime = new Date(t.date || t.createdAt).getTime();
        return dTime >= fromTime && dTime <= toTime;
      })
      .sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());
  }

  /**
   * Agrupa y resume los pesos y montos de los ítems detallados (breakout) de una transacción de faena.
   * 
   * @param {Object} tx - Transacción con desglose de garrones.
   * @returns {Object} Peso total y precio total acumulado del desglose.
   * @property {number} totalWeight - Suma de kilos de los garrones desglosados.
   * @property {number} totalPrice - Suma total monetaria de los garrones desglosados.
   */
  getTransactionDetailSummary(tx) {
    let totalWeight = 0;
    let totalPrice = 0;
    if (tx.breakout && tx.breakout.length > 0) {
      tx.breakout.forEach(item => {
        totalWeight += Number(item.weight) || 0;
        totalPrice += Number(item.total) || 0;
      });
    }
    return { totalWeight, totalPrice };
  }

  /**
   * Construye el texto en formato Markdown para compartir el detalle del movimiento vía WhatsApp.
   * 
   * @param {Object} tx - Transacción de movimiento de cuenta.
   * @returns {string} Mensaje listo para enviar.
   */
  getWhatsAppText(tx) {
    const txDate = new Date(tx.date || tx.createdAt).toLocaleDateString('es-AR');
    const txDesc = tx.description || (tx.type === 'DEBT' ? 'Despacho' : 'Pago');
    let waText = `*Detalle de Movimiento*\nFecha: ${txDate}\nConcepto: ${txDesc}\n\n`;
    
    if (tx.breakout && tx.breakout.length > 0) {
      waText += `*Detalle:*\n`;
      let totalWeight = 0;
      let totalPrice = 0;
      tx.breakout.forEach(item => {
        const weight = Number(item.weight) || 0;
        const total = Number(item.total) || 0;
        totalWeight += weight;
        totalPrice += total;
        waText += `• G#${item.garron}: ${weight}kg @ $${item.price} = $${total.toLocaleString('es-AR')}\n`;
      });
      waText += `\n*TOTAL:* ${totalWeight.toFixed(1)}kg - $${totalPrice.toLocaleString('es-AR')}`;
    } else {
      waText += `Monto: $${(tx.amount || 0).toLocaleString('es-AR')}`;
    }
    return waText;
  }

  /**
   * Verifica si la cuenta corriente del cliente supera los límites financieros establecidos.
   * 
   * @returns {Object} Un objeto con el estado y motivo del bloqueo.
   * @property {boolean} isBlocked - Indica si la cuenta está suspendida para nuevas ventas.
   * @property {string} reason - Motivo descriptivo del bloqueo.
   */
  getBlockingStatus() {
    const balance = this.getBalance();

    // 1. Validar Límite de Crédito
    const creditLimit = parseFloat(this.client.creditLimit) || 0;
    if (creditLimit > 0 && balance > creditLimit) {
      return {
        isBlocked: true,
        reason: `Límite de crédito excedido: El saldo pendiente de $${balance.toLocaleString('es-AR')} supera el límite máximo de $${creditLimit.toLocaleString('es-AR')}.`
      };
    }

    // 2. Validar Plazo Límite de Pago a partir del último movimiento de tipo DEBT (deuda/compra)
    const paymentTermDays = parseInt(this.client.paymentTermDays) || 0;
    if (paymentTermDays > 0 && balance > 0) {
      // Buscar movimientos de tipo deuda ordenados de forma descendente (más recientes primero)
      const debts = this.transactions
        .filter(t => t.type === 'DEBT')
        .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

      if (debts.length > 0) {
        const lastDebt = debts[0];
        const lastDebtTime = new Date(lastDebt.date || lastDebt.createdAt).getTime();
        const daysSinceLastDebt = (Date.now() - lastDebtTime) / (1000 * 60 * 60 * 24);

        if (daysSinceLastDebt > paymentTermDays) {
          return {
            isBlocked: true,
            reason: `Plazo de pago vencido: Han transcurrido ${Math.floor(daysSinceLastDebt)} días desde su última compra (Garrón #${lastDebt.breakout?.[0]?.garron || ''}), superando el límite de ${paymentTermDays} días con saldo pendiente.`
          };
        }
      }
    }

    return { isBlocked: false, reason: '' };
  }
}
