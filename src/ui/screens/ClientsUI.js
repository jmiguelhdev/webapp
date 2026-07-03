/**
 * @file ClientsUI.js
 * @description Capa de presentación (Screen) para el módulo de cuentas corrientes y saldos de clientes/operadores.
 * Se encarga del renderizado de la interfaz en el DOM, del manejo de modales interactivos de edición/creación
 * y de derivar las acciones del usuario (guardar, pagar, imprimir, compartir) hacia el presentador y
 * la entidad de dominio ClientAccount.
 * Cumple estrictamente con Clean Architecture al delegar toda la lógica matemática de saldo,
 * cálculo por rango de fechas y generación de reportes al modelo de dominio.
 */

import { el } from '../../utils/dom.js';

/**
 * Renderiza la pantalla principal del módulo de cuentas corrientes (clientes y operadores).
 * 
 * Gestiona dos estados principales: la lista general segmentada por pestañas de clientes y
 * de operadores, y la vista detallada de una cuenta seleccionada que expone el historial de
 * movimientos, tarjetas estadísticas y herramientas de registro de pagos y ventas genéricas.
 *
 * @param {Object} options - Parámetros y callbacks inyectados por el presentador.
 * @param {Array<Object>} options.clients - Catálogo de clientes de la base de datos.
 * @param {Array<Object>} options.operators - Catálogo de operadores de la base de datos.
 * @param {Object|null} options.selectedClient - Cliente u operador seleccionado para ver el detalle.
 * @param {string} options.selectedType - El tipo del sujeto seleccionado ('CLIENT' o 'OPERATOR').
 * @param {string} options.activeTab - Identificador de la pestaña de visualización activa ('CLIENTS' o 'OPERATORS').
 * @param {Array<Object>} options.transactions - Movimientos de cuenta de la entidad seleccionada.
 * @param {Object|null} options.accountSummary - Resumen consolidado del balance y la entidad de dominio.
 * @param {Function} options.onSelectClient - Callback disparado al hacer clic sobre una tarjeta de la lista.
 * @param {Function} options.onAddPayment - Callback para registrar un pago recibido.
 * @param {Function} options.onAddSale - Callback para registrar una venta/deuda genérica.
 * @param {Function} options.onBack - Callback de retorno a la lista de cuentas o análisis.
 * @param {Function} options.onAnalyzePrice - Callback para abrir la herramienta de análisis de precios promedio.
 * @param {Function} options.onTabChange - Callback para alternar entre las pestañas de la lista.
 * @param {Function} options.onSaveClient - Callback para añadir o actualizar la información del cliente.
 * @param {Function} options.onBackToDashboard - Callback para regresar al panel principal de la aplicación.
 */
export function renderClientAccounts(options) {
  const { clients, operators, selectedClient, selectedType, activeTab, transactions, accountSummary, onSelectClient, onAddPayment, onBack, onAnalyzePrice, onTabChange, onSaveClient } = options;
  const container = document.getElementById('content');
  container.innerHTML = '';
  const wrapper = el('div', { classes: ['dashboard', 'fade-in'] });

  if (selectedClient && accountSummary) {
    const { debtTotal, paymentsTotal, balance, account } = accountSummary;

    const header = el('div', { classes: ['dashboard-header'], style: 'display: flex; align-items: center; gap: 0.5rem;' });
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
        <button id="back-clients" class="back-btn-m3" title="Volver">
          <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
        </button>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <h2 style="margin: 0; font-size: 1.5rem; letter-spacing: -0.02em;">${selectedClient.name}</h2>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 4px; font-size: 0.8rem; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; color: var(--text-muted);">
              <span>📍</span> ${selectedClient.address || 'Sin dirección'}
            </div>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 0.8rem; background: rgba(99,102,241,0.1); padding: 2px 8px; border-radius: 4px; color: #818cf8; font-weight: 600;">
              <span>🆔</span> CUIT: ${selectedClient.cuit || 'N/A'}
            </div>
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button id="analyze-price-btn" class="icon-btn" title="Análisis de Precio Promedio" style="background: var(--glass); padding: 0.75rem; border: 1px solid var(--border); width: auto; height: auto; display: flex; align-items: center; gap: 0.5rem; color: var(--primary);">
          <span style="font-size: 1.25rem;">📊</span>
          <span style="font-size: 0.9rem; font-weight: 600;">Análisis</span>
        </button>
        <button id="print-account-btn" class="icon-btn" title="Imprimir Detalle de Cuenta" style="background: var(--glass); padding: 0.75rem; border: 1px solid var(--border); width: auto; height: auto;">
          <span style="font-size: 1.2rem;">🖨️</span>
        </button>
      </div>
    `;
    wrapper.appendChild(header);

    header.querySelector('#analyze-price-btn').onclick = onAnalyzePrice;
    header.querySelector('#print-account-btn').onclick = () => showPrintOptionsModal(selectedClient, transactions, account);

    // Verificar si la cuenta del cliente supera los límites
    const blockStatus = account.getBlockingStatus();
    if (blockStatus.isBlocked) {
      const alertCard = el('div', { 
        classes: ['glass-card'], 
        style: 'background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-left: 4px solid #ef4444; padding: 1rem 1.5rem; margin-bottom: 2rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; color: #fca5a5;'
      });
      alertCard.innerHTML = `
        <span style="font-size: 2rem;">⚠️</span>
        <div style="flex: 1;">
          <h4 style="margin: 0 0 0.25rem 0; color: #fca5a5; font-size: 1.05rem; font-weight: 700;">VENTAS Y DESPACHOS SUSPENDIDOS</h4>
          <p style="margin: 0; font-size: 0.9rem; line-height: 1.4; color: var(--text-muted);">${blockStatus.reason}</p>
        </div>
      `;
      wrapper.appendChild(alertCard);
    }

    const statsGrid = el('div', { classes: ['stats-grid'], style: 'margin-bottom: 2rem;' });
    const addStat = (title, val, color) => {
      statsGrid.appendChild(el('div', { classes: ['stat-card', 'glass-card'], html: `<h3>${title}</h3><div class="stat-value" style="color: ${color};">${val}</div>` }));
    };

    addStat('Deuda Total', `$${debtTotal.toLocaleString()}`, 'var(--text-main)');
    addStat('Pagos Totales', `$${paymentsTotal.toLocaleString()}`, '#10b981');
    addStat('Saldo Pendiente', `$${balance.toLocaleString()}`, balance > 0 ? '#ef4444' : '#10b981');
    wrapper.appendChild(statsGrid);

    const paymentCard = el('div', { classes: ['glass-card'], style: 'margin-bottom: 2rem; border-left: 4px solid #10b981;' });
    paymentCard.innerHTML = `
      <h3 style="margin-bottom: 1rem; color: #10b981;">➕ Registrar Pago</h3>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
        <div class="form-group" style="flex: 1; min-width: 120px; margin: 0;"><label>Monto ($)</label><input type="number" id="pay-amount" class="form-input" placeholder="0.00"></div>
        <div class="form-group" style="flex: 2; min-width: 200px; margin: 0;"><label>Descripción / Concepto</label><input type="text" id="pay-desc" class="form-input" placeholder="Ej: Pago efectivo, Transferencia..."></div>
        <div class="form-group" style="flex: 1; min-width: 150px; margin: 0;"><label>Recibido por / en</label><input type="text" id="pay-received" class="form-input" placeholder="Ej: Caja Central, Juan..."></div>
        <button id="pay-btn" class="btn-primary" style="background: #10b981; margin: 0;">Registrar</button>
      </div>
    `;
    wrapper.appendChild(paymentCard);

    const saleCard = el('div', { classes: ['glass-card'], style: 'margin-bottom: 2rem; border-left: 4px solid #ef4444;' });
    saleCard.innerHTML = `
      <h3 style="margin-bottom: 1rem; color: #ef4444;">🛒 Registrar Venta (Genérica)</h3>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
        <div class="form-group" style="flex: 1; min-width: 120px; margin: 0;"><label>Monto ($)</label><input type="number" id="sale-amount" class="form-input" placeholder="0.00"></div>
        <div class="form-group" style="flex: 2; min-width: 200px; margin: 0;"><label>Descripción / Concepto</label><input type="text" id="sale-desc" class="form-input" placeholder="Ej: Venta de productos, Flete..."></div>
        <button id="sale-btn" class="btn-primary" style="background: #ef4444; margin: 0;">Registrar Venta</button>
      </div>
    `;
    wrapper.appendChild(saleCard);

    const histCard = el('div', { classes: ['glass-card'] });
    histCard.innerHTML = `<h3 style="margin-bottom: 1rem;">Historial de Movimientos</h3>`;
    
    const tableWrap = el('div', { style: 'overflow-x: auto;' });
    const table = document.createElement('table');
    table.className = 'faena-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); text-align: left;">
          <th style="padding: 1rem;">Fecha</th>
          <th style="padding: 1rem;">Concepto</th>
          <th style="padding: 1rem;">Debe</th>
          <th style="padding: 1rem;">Haber</th>
          <th style="padding: 1rem;">Detalle</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.length === 0 ? '<tr><td colspan="5" style="padding: 2rem; text-align: center;">Sin movimientos.</td></tr>' : 
          transactions.map(t => {
            const isDebt = t.type === 'DEBT';
            const receivedInfo = t.receivedBy ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">📥 Recibido: ${t.receivedBy}</div>` : '';
            
            // Detect if description corresponds to a sale from other apps
            const conceptText = t.description || '';
            const isRetail = conceptText.includes("Venta Mostrador");
            const isWholesale = conceptText.includes("Despacho Facturado");
            let saleId = null;
            if (isRetail || isWholesale) {
              const match = conceptText.match(/N°\s*([a-zA-Z0-9_-]+)/);
              if (match && match[1]) {
                const num = match[1].trim();
                saleId = isRetail ? `RETAIL_${num}` : `SALE_${num}`;
              }
            }

            const conceptTextHtml = saleId 
              ? `<a href="#" class="sale-detail-link" data-sale-id="${saleId}" data-concept="${conceptText}" style="color: var(--primary); text-decoration: underline; font-weight: 500; cursor: pointer;">${conceptText}</a>`
              : `<div style="font-weight: 500;">${t.description || (isDebt ? 'Despacho' : 'Pago')}</div>`;

            return `
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem;">${new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                <td style="padding: 1rem;">
                  ${conceptTextHtml}
                  ${receivedInfo}
                </td>
                <td style="padding: 1rem; color: #ef4444; font-weight: 500;">${isDebt ? '$' + t.amount.toLocaleString() : '-'}</td>
                <td style="padding: 1rem; color: #10b981; font-weight: 500;">${!isDebt ? '$' + t.amount.toLocaleString() : '-'}</td>
                <td style="padding: 1rem;">
                  ${t.breakout ? `<button class="btn-outline view-detail-btn" data-id="${t.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Ver Detalle</button>` : ''}
                  ${saleId ? `<button class="btn-outline view-sale-detail-btn" data-sale-id="${saleId}" data-concept="${conceptText}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Ver Detalle</button>` : ''}
                </td>
              </tr>
            `;
          }).join('')
        }
      </tbody>
    `;
    tableWrap.appendChild(table);
    histCard.appendChild(tableWrap);
    wrapper.appendChild(histCard);

    header.querySelector('#back-clients').onclick = onBack;
    paymentCard.querySelector('#pay-btn').onclick = () => {
      const amt = document.getElementById('pay-amount').value;
      const desc = document.getElementById('pay-desc').value;
      const received = document.getElementById('pay-received').value;
      if (amt) onAddPayment(amt, desc, received);
    };

    saleCard.querySelector('#sale-btn').onclick = () => {
      const amt = document.getElementById('sale-amount').value;
      const desc = document.getElementById('sale-desc').value || 'Venta Genérica';
      if (amt && options.onAddSale) options.onAddSale(amt, desc);
    };

    wrapper.querySelectorAll('.view-detail-btn').forEach(btn => {
      btn.onclick = () => {
        const tx = transactions.find(t => t.id === btn.dataset.id);
        if (tx && tx.breakout) {
          renderTransactionDetailModal(tx, account);
        }
      };
    });

    wrapper.querySelectorAll('.view-sale-detail-btn, .sale-detail-link').forEach(elem => {
      elem.onclick = (e) => {
        e.preventDefault();
        if (options.onViewSaleDetail) {
          options.onViewSaleDetail(elem.dataset.saleId, elem.dataset.concept);
        }
      };
    });

  } else {
    const isOperatorsTab = activeTab === 'OPERATORS';
    
    const header = el('div', { classes: ['dashboard-header'], style: 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;' });
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard">
          <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
        </button>
        <div>
          <h2 style="margin: 0;">👥 Cuentas y Saldos</h2>
          <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Administración de cuentas corrientes.</p>
        </div>
      </div>
      <button id="new-client-btn" class="btn-primary" style="margin: 0; width: auto; padding: 0.6rem 1.5rem;">➕ Nuevo ${isOperatorsTab ? 'Operador' : 'Cliente'}</button>
    `;
    wrapper.appendChild(header);

    const tabsContainer = el('div', { style: 'display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;' });
    tabsContainer.innerHTML = `
      <button id="tab-clients" style="background: none; border: none; font-size: 1.1rem; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; color: ${!isOperatorsTab ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${!isOperatorsTab ? '3px solid var(--primary)' : '3px solid transparent'};">Clientes y Deudores</button>
      <button id="tab-operators" style="background: none; border: none; font-size: 1.1rem; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; color: ${isOperatorsTab ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${isOperatorsTab ? '3px solid var(--primary)' : '3px solid transparent'};">Operadores de Cheques</button>
    `;
    wrapper.appendChild(tabsContainer);

    header.querySelector('#back-to-dash').onclick = options.onBackToDashboard;
    header.querySelector('#new-client-btn').onclick = () => showClientModal(null, onSaveClient, isOperatorsTab ? 'OPERATOR' : 'CLIENT');
    tabsContainer.querySelector('#tab-clients').onclick = () => onTabChange('CLIENTS');
    tabsContainer.querySelector('#tab-operators').onclick = () => onTabChange('OPERATORS');

    const listData = isOperatorsTab ? (operators || []) : clients;

    const clientGrid = el('div', { classes: ['card-list'] });

    if (listData.length === 0) {
      const emptyMsg = el('div', { classes: ['glass-card'], style: 'padding: 3rem; text-align: center;' });
      emptyMsg.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">No hay ${isOperatorsTab ? 'operadores' : 'clientes'} registrados.</p>
      `;
      clientGrid.appendChild(emptyMsg);
    } else {
      listData.forEach(c => {
        const card = el('div', { classes: ['card', 'glass-card'], style: 'cursor: pointer; transition: transform 0.2s;' });
        const balanceColor = (c.balance || 0) > 0 ? '#ef4444' : '#10b981';
        const isBlocked = c.isBlocked;

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.35rem;">
                ${c.name}
                ${isBlocked ? `<span style="font-size: 0.95rem; color: #ef4444; cursor: help;" title="Ventas Suspendidas: ${c.blockingReason || ''}">⚠️</span>` : ''}
              </h3>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">${c.address || 'Sin dirección'}</p>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">CUIT: ${c.cuit || 'N/A'}</p>
              ${isBlocked ? `<p style="color: #fca5a5; font-size: 0.78rem; margin: 0.25rem 0 0 0; font-weight: 600;">🚫 Cuenta Suspendida</p>` : ''}
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.2rem;">Saldo</div>
              <div style="font-size: 1.25rem; font-weight: bold; color: ${balanceColor};">$${(c.balance || 0).toLocaleString()}</div>
              <button class="btn-outline edit-client-btn" style="margin-top: 0.5rem; padding: 0.2rem 0.5rem; font-size: 0.75rem;">Editar</button>
            </div>
          </div>
        `;
        
        card.querySelector('.edit-client-btn').onclick = (e) => {
          e.stopPropagation();
          showClientModal(c, onSaveClient, isOperatorsTab ? 'OPERATOR' : 'CLIENT');
        };

        card.onclick = () => onSelectClient(c, isOperatorsTab ? 'OPERATOR' : 'CLIENT');
        clientGrid.appendChild(card);
      });
    }

    wrapper.appendChild(clientGrid);
  }

  container.appendChild(wrapper);
}

/**
 * Crea y presenta en pantalla un modal flotante e interactivo con el desglose detallado
 * de una transacción de faena (movimiento de garrones).
 * 
 * Permite imprimir el comprobante detallado de manera individual o compartirlo de forma
 * directa a través de un enlace de WhatsApp con formato estructurado en Markdown.
 *
 * @param {Object} tx - Transacción del historial a detallar.
 * @param {ClientAccount} account - Instancia de la entidad de dominio para resolver detalles financieros y textos para compartir.
 */
function renderTransactionDetailModal(tx, account) {
  const overlay = el('div', { classes: ['modal-overlay'], style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;' });
  const modal = el('div', { classes: ['modal', 'glass-card'], style: 'max-width: 500px; width: 100%; padding: 2rem;' });
  
  const header = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;' });
  header.innerHTML = `
    <h3 style="margin: 0; color: var(--primary);">Detalle de Movimiento</h3>
    <button class="close-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer;">&times;</button>
  `;
  
  const txDate = new Date(tx.date || tx.createdAt).toLocaleDateString('es-AR');
  const txDesc = tx.description || (tx.type === 'DEBT' ? 'Despacho' : 'Pago');
  
  const infoSection = el('div', { style: 'margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;' });
  infoSection.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: var(--text-muted);">Fecha:</span>
      <span style="font-weight: 500;">${txDate}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: var(--text-muted);">Concepto:</span>
      <span style="font-weight: 500; text-align: right;">${txDesc}</span>
    </div>
  `;
  
  const content = el('div');
  
  let rowsHtml = '';
  const { totalWeight, totalPrice } = account.getTransactionDetailSummary(tx);
  const waText = account.getWhatsAppText(tx);
  
  if (tx.breakout && tx.breakout.length > 0) {
    const tbodyHtml = tx.breakout.map(item => {
      const weight = Number(item.weight) || 0;
      const total = Number(item.total) || 0;
      
      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 0.5rem;">#${item.garron}</td>
          <td style="padding: 0.5rem; text-align: right;">${weight}</td>
          <td style="padding: 0.5rem; text-align: right;">$${item.price}</td>
          <td style="padding: 0.5rem; text-align: right; color: #ef4444; font-weight: 500;">$${total.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
    
    rowsHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted);">
            <th style="padding: 0.5rem;">Garrón</th>
            <th style="padding: 0.5rem; text-align: right;">Peso (kg)</th>
            <th style="padding: 0.5rem; text-align: right;">Precio/kg</th>
            <th style="padding: 0.5rem; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${tbodyHtml}
        </tbody>
        <tfoot>
          <tr style="border-top: 2px solid var(--border); font-weight: bold;">
            <td style="padding: 0.5rem;">TOTAL</td>
            <td style="padding: 0.5rem; text-align: right;">${totalWeight.toFixed(1)} kg</td>
            <td style="padding: 0.5rem;"></td>
            <td style="padding: 0.5rem; text-align: right; color: #ef4444;">$${totalPrice.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    `;
  } else {
    rowsHtml = '<p style="color: var(--text-muted);">No hay detalles desglosados para este movimiento.</p>';
  }
  
  content.innerHTML = rowsHtml;
  
  const footer = el('div', { style: 'display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;' });
  footer.innerHTML = `
    <button class="btn-outline print-btn" style="display: flex; align-items: center; gap: 0.5rem;">
      🖨️ Imprimir
    </button>
    <button class="btn-outline wa-btn" style="display: flex; align-items: center; gap: 0.5rem; color: #25D366; border-color: rgba(37,211,102,0.3);">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
      WhatsApp
    </button>
    <button class="btn-primary close-modal-btn" style="padding: 0.5rem 1.5rem;">Cerrar</button>
  `;
  
  modal.appendChild(header);
  modal.appendChild(infoSection);
  modal.appendChild(content);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  const close = () => document.body.removeChild(overlay);
  header.querySelector('.close-btn').onclick = close;
  footer.querySelector('.close-modal-btn').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  
  footer.querySelector('.wa-btn').onclick = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
  };
  
  footer.querySelector('.print-btn').onclick = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    let printRows = '';
    if (tx.breakout && tx.breakout.length > 0) {
      printRows = tx.breakout.map(item => `
        <tr>
          <td>#${item.garron}</td>
          <td style="text-align:right;">${item.weight}kg</td>
          <td style="text-align:right;">$${item.price}</td>
          <td style="text-align:right;">$${Number(item.total).toLocaleString()}</td>
        </tr>
      `).join('');
      printRows += `
        <tr style="font-weight:bold; border-top:1px solid #000;">
          <td>TOTAL</td>
          <td style="text-align:right;">${totalWeight.toFixed(1)}kg</td>
          <td></td>
          <td style="text-align:right;">$${totalPrice.toLocaleString()}</td>
        </tr>
      `;
    }
    
    printWindow.document.write(`
      <html>
      <head>
        <title>Detalle de Movimiento</title>
        <style>
          body { font-family: monospace; padding: 20px; color: #000; font-size: 14px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .info { margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 4px 0; border-bottom: 1px dotted #ccc; }
          @media print { @page { margin: 0; } body { padding: 10px; } }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <h2>DETALLE DE MOVIMIENTO</h2>
        </div>
        <div class="info">
          <div><strong>Fecha:</strong> ${txDate}</div>
          <div><strong>Concepto:</strong> ${txDesc}</div>
        </div>
        ${tx.breakout && tx.breakout.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th style="text-align:left;">Garrón</th>
                <th style="text-align:right;">Peso</th>
                <th style="text-align:right;">$/kg</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${printRows}
            </tbody>
          </table>
        ` : `<p>Monto: $${(tx.amount || 0).toLocaleString()}</p>`}
      </body>
      </html>
    `);
    printWindow.document.close();
  };
}

/**
 * Muestra en pantalla el modal interactivo de selección de rango de fechas y formatos
 * de impresión (A4 o Ticket Térmico de 80mm) para emitir el resumen de cuenta.
 *
 * @param {Object} client - El cliente u operador del que se emitirá el reporte.
 * @param {Array<Object>} transactions - Historial completo de movimientos de cuenta.
 * @param {ClientAccount} account - Entidad de dominio para procesar filtrado temporal y saldos acumulados.
 */
function showPrintOptionsModal(client, transactions, account) {
  const overlay = el('div', { classes: ['modal-overlay'], style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;' });
  const modal = el('div', { classes: ['modal', 'glass-card'], style: 'max-width: 400px; padding: 2rem;' });
  
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const fromDateVal = lastMonth.toISOString().split('T')[0];

  modal.innerHTML = `
    <h3 style="margin-bottom: 1.5rem;">🖨️ Opciones de Impresión</h3>
    <form id="print-form">
      <div class="form-group">
        <label>Desde</label>
        <input type="date" id="print-from" class="form-input" value="${fromDateVal}">
      </div>
      <div class="form-group">
        <label>Hasta</label>
        <input type="date" id="print-to" class="form-input" value="${today}">
      </div>
      <div class="form-group">
        <label>Formato de Impresión</label>
        <select id="print-format" class="form-input">
          <option value="standard">📄 A4 (Estándar)</option>
          <option value="thermal">🧾 Térmico (80mm)</option>
        </select>
      </div>
      <div style="display: flex; gap: 1rem; margin-top: 2rem;">
        <button type="button" class="btn-cancel" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--text-main); cursor: pointer;">Cancelar</button>
        <button type="submit" class="btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: none; background: var(--primary); color: var(--on-primary); cursor: pointer;">Imprimir</button>
      </div>
    </form>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const form = modal.querySelector('#print-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const fromTime = new Date(modal.querySelector('#print-from').value + 'T00:00:00').getTime();
    const toTime = new Date(modal.querySelector('#print-to').value + 'T23:59:59').getTime();
    const format = modal.querySelector('#print-format').value;

    const filtered = account.getTransactionsForRange(fromTime, toTime);
    const saldoAnterior = account.getBalanceForward(fromTime);

    printAccountStatement(client, filtered, saldoAnterior, { format, fromDate: new Date(fromTime), toDate: new Date(toTime) });
    overlay.remove();
  };

  modal.querySelector('.btn-cancel').onclick = () => overlay.remove();
}

/**
 * Genera una ventana emergente de impresión optimizada para emitir estados de cuenta corrientes.
 * 
 * Admite formatos en hoja estándar A4 o ticket de impresora térmica de 80mm de ancho.
 * Computa el arrastre progresivo de saldos basándose en el saldo forward inicial.
 *
 * @param {Object} client - El cliente u operador titular de la cuenta.
 * @param {Array<Object>} txs - Colección de transacciones filtradas por rango temporal.
 * @param {number} saldoAnterior - Saldo neto de arrastre acumulado antes del período.
 * @param {Object} options - Parámetros de personalización.
 * @param {string} options.format - Formato físico del comprobante ('standard' o 'thermal').
 * @param {Date} options.fromDate - Fecha de inicio del intervalo del reporte.
 * @param {Date} options.toDate - Fecha de cierre del intervalo del reporte.
 */
function printAccountStatement(client, txs, saldoAnterior, options) {
  const { format, fromDate, toDate } = options;
  const isThermal = format === 'thermal';
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  
  const fromStr = fromDate.toLocaleDateString('es-AR');
  const toStr = toDate.toLocaleDateString('es-AR');
  const nowStr = new Date().toLocaleString('es-AR');

  let currentBalance = saldoAnterior;
  
  const rowsHtml = txs.map(t => {
    const isDebt = t.type === 'DEBT';
    const amount = t.amount || 0;
    currentBalance += isDebt ? amount : -amount;
    
    let detailHtml = '';
    if (t.breakout && t.breakout.length > 0) {
      detailHtml = `
        <div class="breakout-rows">
          ${t.breakout.map(i => `• G#${i.garron}: ${i.weight}kg @ $${i.price} = $${i.total.toLocaleString()}`).join('<br>')}
        </div>
      `;
    }

    return `
      <tr class="tx-row">
        <td>${new Date(t.date || t.createdAt).toLocaleDateString('es-AR')}</td>
        <td>
          <div style="font-weight: 600;">${t.description || (isDebt ? 'Despacho' : 'Pago')}</div>
          ${detailHtml}
        </td>
        <td class="amount ${isDebt ? 'debe' : ''}">${isDebt ? amount.toLocaleString() : '-'}</td>
        <td class="amount ${!isDebt ? 'haber' : ''}">${!isDebt ? amount.toLocaleString() : '-'}</td>
        <td class="amount balance">${currentBalance.toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Estado de Cuenta - ${client.name}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: ${isThermal ? '10px' : '40px'}; color: #111; line-height: 1.4; margin: 0; background: #fff; }
        .receipt-card { max-width: ${isThermal ? '300px' : '800px'}; margin: 0 auto; border: ${isThermal ? 'none' : '1px solid #eee'}; padding: ${isThermal ? '0' : '30px'}; border-radius: 8px; }
        .header { display: flex; flex-direction: ${isThermal ? 'column' : 'row'}; justify-content: space-between; align-items: ${isThermal ? 'center' : 'flex-start'}; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { width: ${isThermal ? '80px' : '120px'}; height: auto; object-fit: contain; }
        .company-name { font-size: ${isThermal ? '18px' : '24px'}; font-weight: 800; margin: 5px 0; }
        .client-info { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .table { width: 100%; border-collapse: collapse; font-size: ${isThermal ? '11px' : '13px'}; }
        .table th { background: #f4f4f4; padding: 10px 5px; text-align: left; border-bottom: 2px solid #ddd; }
        .table td { padding: 8px 5px; border-bottom: 1px solid #eee; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; }
        .debe { color: #d32f2f; }
        .haber { color: #2e7d32; }
        .balance { font-weight: bold; }
        .breakout-rows { font-size: 0.85em; color: #555; margin-top: 4px; border-left: 2px solid #ddd; padding-left: 8px; line-height: 1.2; }
        .summary-box { margin-top: 30px; border-top: 2px solid #000; padding-top: 15px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 600; }
        .disclaimer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px dotted #ccc; padding-top: 15px; }
        @media print { body { padding: 0; } .receipt-card { border: none; max-width: 100%; } }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="receipt-card">
        <div class="header">
          <div style="display:flex; flex-direction:column; align-items:${isThermal ? 'center' : 'flex-start'};">
            <img src="/logo.jpg" class="logo">
            <div class="company-name">FRIGORÍFICO PAMPA</div>
          </div>
          <div style="text-align: ${isThermal ? 'center' : 'right'}; margin-top: ${isThermal ? '10px' : '0'};">
            <div style="font-weight: bold; font-size: 1.1em;">ESTADO DE CUENTA</div>
            <div style="font-size: 0.9em;">Periodo: ${fromStr} al ${toStr}</div>
            <div style="font-size: 0.8em; color: #666;">Emisión: ${nowStr}</div>
          </div>
        </div>

        <div class="client-info">
          <div style="font-weight: 800; font-size: 1.2em;">${client.name}</div>
          <div style="font-size: 0.9em;">${client.address || ''}</div>
          <div style="font-size: 0.9em;">CUIT: ${client.cuit || 'N/A'}</div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th style="text-align:right;">Debe</th>
              <th style="text-align:right;">Haber</th>
              <th style="text-align:right;">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #fcfcfc; font-style: italic;">
              <td>${fromStr}</td>
              <td>SALDO ANTERIOR (Balance forward)</td>
              <td style="text-align:right;">${saldoAnterior > 0 ? saldoAnterior.toLocaleString() : '-'}</td>
              <td style="text-align:right;">${saldoAnterior < 0 ? Math.abs(saldoAnterior).toLocaleString() : '-'}</td>
              <td style="text-align:right; font-weight:bold;">${saldoAnterior.toLocaleString()}</td>
            </tr>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-row">
            <span>Saldo Final</span>
            <span style="font-size: 1.3em; color: ${currentBalance > 0 ? '#d32f2f' : '#2e7d32'}">$${currentBalance.toLocaleString()}</span>
          </div>
        </div>

        <div class="disclaimer">
          ⚠️ DOCUMENTO DE CONTROL INTERNO - NO VÁLIDO COMO FACTURA<br>
          FRIGORÍFICO PAMPA - GRACIAS POR SU CONFIANZA
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Muestra en pantalla el modal interactivo para la creación o edición de perfiles
 * de clientes u operadores de cheques de la aplicación.
 *
 * @param {Object|null} client - Perfil del cliente a editar, o null para crear uno nuevo.
 * @param {Function} onSave - Callback asíncrono para persistir los cambios del perfil en el repositorio.
 * @param {string} [type='CLIENT'] - Identificador del rol de la entidad ('CLIENT' o 'OPERATOR').
 */
function showClientModal(client, onSave, type = 'CLIENT') {
  const overlay = el('div', { classes: ['modal-overlay'], style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;' });
  const modal = el('div', { 
    classes: ['modal', 'glass-card'], 
    style: 'max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem; border-radius: 16px; box-sizing: border-box;' 
  });
  
  const isEdit = !!client;
  const typeLabel = type === 'OPERATOR' ? 'Operador' : 'Cliente';
  
  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h3 style="margin: 0; color: var(--primary);">${isEdit ? 'Editar ' + typeLabel : 'Añadir Nuevo ' + typeLabel}</h3>
      <button class="close-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer;">&times;</button>
    </div>
    <div class="form-group"><label>Nombre o Razón Social</label><input type="text" id="m-client-name" class="form-input" value="${client?.name || ''}"></div>
    <div class="form-group"><label>CUIT</label><input type="text" id="m-client-cuit" class="form-input" value="${client?.cuit || ''}"></div>
    <div class="form-group"><label>Dirección</label><input type="text" id="m-client-address" class="form-input" value="${client?.address || ''}"></div>
    <div class="form-group"><label>Teléfono</label><input type="text" id="m-client-phone" class="form-input" value="${client?.phone || ''}"></div>
    <div class="form-group"><label>CBU (Opcional)</label><input type="text" id="m-client-cbu" class="form-input" value="${client?.cbu || ''}"></div>
    <div class="form-group"><label>Cuenta Contable / Alias</label><input type="text" id="m-client-account" class="form-input" value="${client?.account || ''}"></div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; border-top: 1px dashed var(--border); padding-top: 1rem;">
      <div class="form-group" style="margin: 0;">
        <label>Límite de Crédito ($)</label>
        <input type="number" id="m-client-credit-limit" class="form-input" placeholder="Ej: 500000" min="0" value="${client?.creditLimit !== undefined && client?.creditLimit !== null ? client.creditLimit : ''}">
      </div>
      <div class="form-group" style="margin: 0;">
        <label>Plazo Límite Pago (Días)</label>
        <input type="number" id="m-client-payment-term" class="form-input" placeholder="Ej: 15" min="0" value="${client?.paymentTermDays !== undefined && client?.paymentTermDays !== null ? client.paymentTermDays : ''}">
      </div>
    </div>

    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
       <button class="btn-cancel btn-outline" style="flex: 1;">Cancelar</button>
       <button class="btn-save btn-primary" style="flex: 1; margin: 0; background: var(--primary);">Guardar</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('.close-btn').onclick = close;
  modal.querySelector('.btn-cancel').onclick = close;
  
  setTimeout(() => modal.querySelector('#m-client-name').focus(), 100);

  modal.querySelector('.btn-save').onclick = async () => {
    const name = modal.querySelector('#m-client-name').value.trim();
    if (!name) return alert('El nombre o razón social es obligatorio');
    
    const rawCredit = modal.querySelector('#m-client-credit-limit').value;
    const rawTerm = modal.querySelector('#m-client-payment-term').value;

    const clientData = {
      id: client?.id || null,
      name,
      cuit: modal.querySelector('#m-client-cuit').value,
      address: modal.querySelector('#m-client-address').value,
      phone: modal.querySelector('#m-client-phone').value,
      cbu: modal.querySelector('#m-client-cbu').value,
      account: modal.querySelector('#m-client-account').value,
      creditLimit: rawCredit !== '' ? parseFloat(rawCredit) : null,
      paymentTermDays: rawTerm !== '' ? parseInt(rawTerm) : null,
    };
    if (!clientData.id) delete clientData.id;

    const btn = modal.querySelector('.btn-save');
    btn.textContent = 'Guardando...';
    btn.disabled = true;

    if (onSave) {
      await onSave(clientData, type);
    }
    close();
  };
}

/**
 * Creates and displays a floating modal with detailed itemized sales info.
 *
 * @param {Object} sale - The sale document fetched from Firestore.
 * @param {Object} productsMap - Dictionary of products index by id.
 */
export function renderSaleDetailModal(sale, productsMap, concept) {
  const overlay = el('div', { classes: ['modal-overlay'], style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;' });
  const modal = el('div', { classes: ['modal', 'glass-card'], style: 'max-width: 550px; width: 100%; padding: 2rem; border-radius: 16px;' });
  
  const header = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;' });
  
  const isRetail = sale.id.startsWith("RETAIL_");
  const titleText = isRetail ? "Detalle de Venta Minorista" : "Detalle de Despacho Mayorista";
  const docNumber = sale.id.replace("RETAIL_", "").replace("SALE_", "");
  
  header.innerHTML = `
    <h3 style="margin: 0; color: var(--primary); font-size: 1.25rem;">${titleText}</h3>
    <button class="close-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer;">&times;</button>
  `;
  
  const saleDate = new Date(sale.date || sale.updatedAt).toLocaleDateString('es-AR');
  const saleTime = new Date(sale.date || sale.updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const customerName = sale.consumerName || "Consumidor Final";
  
  let branchName = null;
  if (concept) {
    const match = concept.match(/\[Carnicer[ií]a:\s*([^\]]+)\]/i);
    if (match && match[1]) {
      branchName = match[1].trim();
    }
  }

  const infoSection = el('div', { style: 'margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 8px; font-size: 0.9rem;' });
  infoSection.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: var(--text-muted);">Comprobante:</span>
      <span style="font-weight: 600;">N° ${docNumber}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: var(--text-muted);">Fecha:</span>
      <span style="font-weight: 500;">${saleDate} ${saleTime}</span>
    </div>
    ${branchName ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: var(--text-muted);">Origen / Sucursal:</span>
      <span style="font-weight: 600; color: #818cf8;">${branchName.toUpperCase()}</span>
    </div>
    ` : ''}
    <div style="display: flex; justify-content: space-between;">
      <span style="color: var(--text-muted);">Cliente:</span>
      <span style="font-weight: 600; text-align: right;">${customerName}</span>
    </div>
  `;
  
  const content = el('div');
  
  let rowsHtml = '';
  let totalWeight = 0;
  
  if (sale.items && sale.items.length > 0) {
    const tbodyHtml = sale.items.map(item => {
      const weight = Number(item.weight) || 0;
      const price = Number(item.pricePerKg) || 0;
      const subtotal = Number(item.subtotal) || 0;
      totalWeight += weight;
      
      const prodName = productsMap[item.productId]?.name || `Producto (PLU: ${productsMap[item.productId]?.plu || item.productId})`;
      
      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 0.75rem 0.5rem; font-weight: 500;">${prodName}</td>
          <td style="padding: 0.75rem 0.5rem; text-align: right;">${weight.toFixed(3)} kg</td>
          <td style="padding: 0.75rem 0.5rem; text-align: right;">$${price.toLocaleString()}</td>
          <td style="padding: 0.75rem 0.5rem; text-align: right; color: var(--primary); font-weight: 600;">$${subtotal.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
    
    rowsHtml = `
      <div style="max-height: 250px; overflow-y: auto; margin-bottom: 1.5rem; border: 1px solid var(--border); border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
          <thead>
            <tr style="background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border); color: var(--text-muted);">
              <th style="padding: 0.5rem;">Producto</th>
              <th style="padding: 0.5rem; text-align: right;">Peso</th>
              <th style="padding: 0.5rem; text-align: right;">Precio/kg</th>
              <th style="padding: 0.5rem; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${tbodyHtml}
          </tbody>
        </table>
      </div>
    `;
  } else {
    rowsHtml = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No hay detalles de ítems registrados para esta venta.</p>';
  }
  
  content.innerHTML = rowsHtml;
  
  const summarySection = el('div', { style: 'margin-bottom: 1.5rem; padding: 1rem; background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.15); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;' });
  summarySection.innerHTML = `
    <div>
      <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Peso Total</div>
      <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-main);">${totalWeight.toFixed(3)} kg</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Importe Total</div>
      <div style="font-size: 1.5rem; font-weight: 800; color: #ef4444;">$${(sale.totalAmount || 0).toLocaleString()}</div>
    </div>
  `;
  
  const footer = el('div', { style: 'display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;' });
  footer.innerHTML = `
    <button class="btn-outline print-btn" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 8px;">
      🖨️ Imprimir Ticket
    </button>
    <button class="btn-primary close-modal-btn" style="padding: 0.6rem 1.5rem; border-radius: 8px; margin: 0; background: var(--primary);">Cerrar</button>
  `;
  
  modal.appendChild(header);
  modal.appendChild(infoSection);
  modal.appendChild(content);
  modal.appendChild(summarySection);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  const close = () => document.body.removeChild(overlay);
  header.querySelector('.close-btn').onclick = close;
  footer.querySelector('.close-modal-btn').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  
  footer.querySelector('.print-btn').onclick = () => {
    printSaleTicket(sale, productsMap, branchName);
  };
}

/**
 * Opens a print dialog formatted as an internal thermal receipt for the sale.
 *
 * @param {Object} sale - The sale document.
 * @param {Object} productsMap - Dictionary of products index by id.
 * @param {string|null} branchName - Name of the butchery/branch if parsed.
 */
function printSaleTicket(sale, productsMap, branchName) {
  const printWindow = window.open('', '_blank', 'width=400,height=700');
  
  const isRetail = sale.id.startsWith("RETAIL_");
  const docTitle = isRetail ? "TICKET VENTA MINORISTA" : "REMITO DE DESPACHO";
  const docNumber = sale.id.replace("RETAIL_", "").replace("SALE_", "");
  
  const saleDate = new Date(sale.date || sale.updatedAt).toLocaleDateString('es-AR');
  const saleTime = new Date(sale.date || sale.updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const nowStr = new Date().toLocaleString('es-AR');
  
  const customerName = sale.consumerName || "Consumidor Final";
  
  let printRows = '';
  let totalWeight = 0;
  
  if (sale.items && sale.items.length > 0) {
    printRows = sale.items.map(item => {
      const weight = Number(item.weight) || 0;
      const price = Number(item.pricePerKg) || 0;
      const subtotal = Number(item.subtotal) || 0;
      totalWeight += weight;
      
      const prodName = productsMap[item.productId]?.name || `Producto (PLU: ${productsMap[item.productId]?.plu || item.productId})`;
      
      return `
        <tr>
          <td style="padding: 4px 0;">
            <div style="font-weight: bold;">${prodName.toUpperCase()}</div>
            <div style="font-size: 10px; color: #555;">${weight.toFixed(3)} kg x $${price.toLocaleString()}</div>
          </td>
          <td style="text-align: right; vertical-align: bottom; padding: 4px 0;">$${subtotal.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket Venta - ${sale.id}</title>
      <style>
        body { 
          font-family: 'Courier New', Courier, monospace; 
          padding: 10px; 
          color: #000; 
          font-size: 12px; 
          line-height: 1.3;
          margin: 0;
          background: #fff;
        }
        .header { 
          text-align: center; 
          border-bottom: 1px dashed #000; 
          padding-bottom: 10px; 
          margin-bottom: 10px; 
        }
        .company-name { 
          font-size: 16px; 
          font-weight: 800; 
          margin: 0 0 5px 0; 
        }
        .info { 
          margin-bottom: 10px; 
          font-size: 11px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 10px;
        }
        th, td { 
          border-bottom: 1px dotted #ccc; 
        }
        .totals {
          border-top: 1px dashed #000;
          padding-top: 8px;
          margin-top: 10px;
          font-size: 13px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .disclaimer { 
          margin-top: 25px; 
          text-align: center; 
          font-size: 9px; 
          color: #555; 
          border-top: 1px dashed #000; 
          padding-top: 10px; 
        }
        @media print { 
          @page { margin: 0; } 
          body { padding: 15px; } 
        }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="header">
        <div class="company-name">FRIGORÍFICO PAMPA</div>
        <div style="font-size: 11px;">Ruta Nac. 34 - Clucellas</div>
        <div style="font-weight: bold; margin-top: 5px; font-size: 13px;">${docTitle}</div>
      </div>
      
      <div class="info">
        <div class="info-row">
          <span>Nro. Comprobante:</span>
          <strong>${docNumber}</strong>
        </div>
        <div class="info-row">
          <span>Fecha:</span>
          <span>${saleDate} ${saleTime}</span>
        </div>
        ${branchName ? `
        <div class="info-row">
          <span>Origen / Sucursal:</span>
          <strong>${branchName.toUpperCase()}</strong>
        </div>
        ` : ''}
        <div class="info-row">
          <span>Cliente:</span>
          <strong>${customerName.toUpperCase()}</strong>
        </div>
        <div class="info-row">
          <span>Emisión:</span>
          <span>${nowStr}</span>
        </div>
      </div>
      
      <table>
        <tbody>
          ${printRows}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">
          <span>PESO TOTAL:</span>
          <strong>${totalWeight.toFixed(3)} kg</strong>
        </div>
        <div class="total-row" style="font-size: 15px; font-weight: bold;">
          <span>TOTAL COMPRA:</span>
          <span>$${(sale.totalAmount || 0).toLocaleString()}</span>
        </div>
      </div>
      
      <div class="disclaimer">
        *** DOCUMENTO DE USO INTERNO ***<br>
        NO VALIDO COMO FACTURA<br>
        ¡GRACIAS POR SU COMPRA!
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}
