/**
 * @file ClientsUI.js
 * @description Capa de presentación (Screen) para el módulo de cuentas corrientes y saldos de clientes/operadores.
 * Se encarga del renderizado de la interfaz en el DOM, del manejo de modales interactivos de edición/creación
 * y de derivar las acciones del usuario (guardar, pagar, imprimir, compartir) hacia el presentador y
 * la entidad de dominio ClientAccount.
 * Cumple estrictamente con Clean Architecture al delegar toda la lógica matemática de saldo,
 * cálculo por rango de fechas y generación de reportes al modelo de dominio.
 */

import { el } from '../../../frameworks/utils/dom.js';
import { renderTransactionDetailModal, showPrintOptionsModal, printAccountStatement, showClientModal, renderSaleDetailModal, printSaleTicket } from '../components/ClientModals.js';

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
