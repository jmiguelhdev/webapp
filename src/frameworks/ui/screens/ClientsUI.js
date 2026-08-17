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
            
            // Detect if description corresponds to a sale or credit note from other apps
            const conceptText = t.description || '';
            const isRetail = conceptText.includes("Venta Mostrador");
            const isWholesale = conceptText.includes("Despacho Facturado");
            const isCreditNote = conceptText.includes("Nota de Crédito") || conceptText.includes("Nota de Credito");
            let saleId = null;
            if (isRetail || isWholesale || isCreditNote) {
              const match = conceptText.match(/N°\s*([a-zA-Z0-9_-]+)/);
              if (match && match[1]) {
                const rawNum = match[1].trim();
                const cleanNum = rawNum.replace(/^(SALE_|RETAIL_|NC_|CREDIT_)/i, '');
                if (isRetail) saleId = `RETAIL_${cleanNum}`;
                else if (isCreditNote) saleId = `NC_${cleanNum}`;
                else saleId = `SALE_${cleanNum}`;
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
    const listData = isOperatorsTab ? (operators || []) : (clients || []);

    // KPIs consolidados para la pestaña activa
    const totalAccounts = listData.length;
    const totalDebt = listData.reduce((sum, c) => sum + ((c.balance || 0) > 0 ? (c.balance || 0) : 0), 0);
    const countWithDebt = listData.filter(c => (c.balance || 0) > 0).length;
    const countSettled = listData.filter(c => (c.balance || 0) <= 0).length;
    const countRecentMovements = listData.filter(c => c.lastMovementDate != null).length;
    const countBlocked = listData.filter(c => c.isBlocked).length;

    // Header principal
    const header = el('div', { classes: ['dashboard-header'], style: 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;' });
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard">
          <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
        </button>
        <div>
          <h2 style="margin: 0; font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em;">👥 Cuentas y Saldos</h2>
          <p style="margin: 0.2rem 0 0 0; color: var(--text-muted); font-size: 0.9rem;">Control de estados de cuenta, saldos pendientes y actividad comercial reciente.</p>
        </div>
      </div>
      <button id="new-client-btn" class="btn-primary" style="margin: 0; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
        <span>➕</span> Nuevo ${isOperatorsTab ? 'Operador' : 'Cliente'}
      </button>
    `;
    wrapper.appendChild(header);

    // Navegación de pestañas (Tabs)
    const tabsContainer = el('div', { style: 'display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; overflow-x: auto;' });
    tabsContainer.innerHTML = `
      <button id="tab-clients" style="background: none; border: none; font-size: 1.05rem; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; color: ${!isOperatorsTab ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${!isOperatorsTab ? '3px solid var(--primary)' : '3px solid transparent'}; transition: all 0.2s; white-space: nowrap;">
        🏢 Clientes y Deudores (${(clients || []).length})
      </button>
      <button id="tab-operators" style="background: none; border: none; font-size: 1.05rem; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; color: ${isOperatorsTab ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${isOperatorsTab ? '3px solid var(--primary)' : '3px solid transparent'}; transition: all 0.2s; white-space: nowrap;">
        💼 Operadores de Cheques (${(operators || []).length})
      </button>
    `;
    wrapper.appendChild(tabsContainer);

    header.querySelector('#back-to-dash').onclick = options.onBackToDashboard;
    header.querySelector('#new-client-btn').onclick = () => showClientModal(null, onSaveClient, isOperatorsTab ? 'OPERATOR' : 'CLIENT');
    tabsContainer.querySelector('#tab-clients').onclick = () => onTabChange('CLIENTS');
    tabsContainer.querySelector('#tab-operators').onclick = () => onTabChange('OPERATORS');

    // Tarjetas de Métricas Rápidas (KPIs)
    const kpiGrid = el('div', { 
      classes: ['stats-grid'], 
      style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;' 
    });
    
    kpiGrid.innerHTML = `
      <div class="stat-card glass-card" style="padding: 1.15rem; border-radius: 14px; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 1.75rem; background: rgba(99,102,241,0.1); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #818cf8;">👥</div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Total Registrados</div>
          <div style="font-size: 1.35rem; font-weight: 700; color: var(--text-main);">${totalAccounts}</div>
        </div>
      </div>
      <div class="stat-card glass-card" style="padding: 1.15rem; border-radius: 14px; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 1.75rem; background: rgba(239,68,68,0.1); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #ef4444;">💸</div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Saldo Deudor Total</div>
          <div style="font-size: 1.35rem; font-weight: 700; color: #ef4444;">$${totalDebt.toLocaleString('es-AR')}</div>
        </div>
      </div>
      <div class="stat-card glass-card" style="padding: 1.15rem; border-radius: 14px; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 1.75rem; background: rgba(245,158,11,0.1); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #f59e0b;">⏳</div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Cuentas con Deuda</div>
          <div style="font-size: 1.35rem; font-weight: 700; color: ${countWithDebt > 0 ? '#ef4444' : 'var(--text-main)'};">${countWithDebt}</div>
        </div>
      </div>
      <div class="stat-card glass-card" style="padding: 1.15rem; border-radius: 14px; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 1.75rem; background: rgba(16,185,129,0.1); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #10b981;">⚡</div>
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Con Actividad</div>
          <div style="font-size: 1.35rem; font-weight: 700; color: #10b981;">${countRecentMovements}</div>
        </div>
      </div>
    `;
    wrapper.appendChild(kpiGrid);

    // Contenedor interactivo de Búsqueda y Filtros
    const controlsContainer = el('div', { 
      classes: ['glass-card'], 
      style: 'padding: 1.25rem; border-radius: 16px; margin-bottom: 1.75rem; border: 1px solid var(--border); background: var(--card-bg); box-shadow: var(--elevation-1);' 
    });

    controlsContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- Barra de búsqueda principal -->
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <div style="
            flex: 1; 
            min-width: 260px;
            display: flex; 
            align-items: center; 
            gap: 0.75rem; 
            background: var(--bg-main); 
            border: 1px solid var(--border); 
            border-radius: 12px; 
            padding: 0.65rem 1rem;
            transition: border-color 0.2s, box-shadow 0.2s;
          " class="search-input-box">
            <span style="font-size: 1.2rem; color: var(--primary); user-select: none;">🔍</span>
            <input 
              type="text" 
              id="client-search-input" 
              placeholder="Buscar por Nombre, CUIT o Dirección..." 
              autocomplete="off"
              style="
                flex: 1;
                border: none;
                background: transparent;
                color: var(--text-main);
                font-size: 0.95rem;
                outline: none;
                font-family: inherit;
              "
            />
            <button id="clear-search-btn" title="Limpiar búsqueda" style="
              background: transparent;
              border: none;
              color: var(--text-muted);
              cursor: pointer;
              font-size: 1.1rem;
              display: none;
              padding: 0.15rem;
              line-height: 1;
            ">✕</button>
          </div>

          <!-- Selector de Ordenamiento -->
          <div style="display: flex; align-items: center; gap: 0.5rem; white-space: nowrap;">
            <label style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">Ordenar:</label>
            <select id="sort-select" style="
              background: var(--bg-main);
              color: var(--text-main);
              border: 1px solid var(--border);
              padding: 0.65rem 1rem;
              border-radius: 12px;
              font-size: 0.85rem;
              font-weight: 600;
              outline: none;
              cursor: pointer;
            ">
              <option value="RECENT">🕒 Más Recientes Primero</option>
              <option value="DEBT_DESC">💰 Mayor Saldo Deudor</option>
              <option value="NAME_ASC">🔤 Nombre (A - Z)</option>
              <option value="OLDEST_MOV">⏳ Movimientos Más Antiguos</option>
            </select>
          </div>

          <!-- Selector de Disposición: Cuadrícula vs Filas -->
          <div style="display: flex; align-items: center; gap: 0.5rem; white-space: nowrap;">
            <label style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">Vista:</label>
            <div id="layout-toggle-group" style="
              display: inline-flex; 
              background: rgba(0,0,0,0.25); 
              padding: 0.2rem; 
              border-radius: 12px; 
              border: 1px solid var(--border);
              gap: 0.2rem;
            ">
              <button type="button" id="btn-layout-grid" class="layout-toggle-btn" title="Mostrar en cuadrícula de tarjetas" style="
                background: var(--primary);
                color: #ffffff;
                border: none;
                padding: 0.45rem 0.85rem;
                border-radius: 8px;
                font-size: 0.82rem;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.4rem;
                transition: all 0.2s;
              ">
                <span>🔲</span>
                <span>Tarjetas</span>
              </button>
              <button type="button" id="btn-layout-rows" class="layout-toggle-btn" title="Mostrar en lista por filas" style="
                background: transparent;
                color: var(--text-muted);
                border: none;
                padding: 0.45rem 0.85rem;
                border-radius: 8px;
                font-size: 0.82rem;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.4rem;
                transition: all 0.2s;
              ">
                <span>☰</span>
                <span>Por Filas</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Chips de Filtro Rápido -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem;">
          <div id="filter-chips-group" style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
            <button class="filter-chip active" data-filter="ALL" style="
              padding: 0.45rem 0.9rem;
              border-radius: 20px;
              font-size: 0.82rem;
              font-weight: 600;
              cursor: pointer;
              border: 1px solid var(--primary);
              background: var(--primary-container);
              color: var(--on-primary-container);
              transition: all 0.2s;
            ">Todos (${totalAccounts})</button>

            <button class="filter-chip" data-filter="RECENT" style="
              padding: 0.45rem 0.9rem;
              border-radius: 20px;
              font-size: 0.82rem;
              font-weight: 600;
              cursor: pointer;
              border: 1px solid var(--border);
              background: rgba(255,255,255,0.04);
              color: var(--text-muted);
              transition: all 0.2s;
            ">🔥 Con Movimientos Recientes (${countRecentMovements})</button>

            <button class="filter-chip" data-filter="DEBT" style="
              padding: 0.45rem 0.9rem;
              border-radius: 20px;
              font-size: 0.82rem;
              font-weight: 600;
              cursor: pointer;
              border: 1px solid var(--border);
              background: rgba(255,255,255,0.04);
              color: var(--text-muted);
              transition: all 0.2s;
            ">⚠️ Con Deuda (${countWithDebt})</button>

            <button class="filter-chip" data-filter="SETTLED" style="
              padding: 0.45rem 0.9rem;
              border-radius: 20px;
              font-size: 0.82rem;
              font-weight: 600;
              cursor: pointer;
              border: 1px solid var(--border);
              background: rgba(255,255,255,0.04);
              color: var(--text-muted);
              transition: all 0.2s;
            ">✅ Al Día (${countSettled})</button>

            ${countBlocked > 0 ? `
              <button class="filter-chip" data-filter="BLOCKED" style="
                padding: 0.45rem 0.9rem;
                border-radius: 20px;
                font-size: 0.82rem;
                font-weight: 600;
                cursor: pointer;
                border: 1px solid rgba(239,68,68,0.4);
                background: rgba(239,68,68,0.1);
                color: #fca5a5;
                transition: all 0.2s;
              ">🚫 Suspendidos (${countBlocked})</button>
            ` : ''}
          </div>

          <div id="search-counter" style="font-size: 0.82rem; color: var(--text-muted); font-weight: 500;">
            Mostrando ${totalAccounts} de ${totalAccounts} cuentas
          </div>
        </div>
      </div>
    `;
    wrapper.appendChild(controlsContainer);

    // Contenedor de Tarjetas / Filas
    const gridContainer = el('div', { 
      id: 'clients-cards-grid', 
      style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;' 
    });
    wrapper.appendChild(gridContainer);

    // Estado local para búsqueda, filtros y modo de disposición
    let currentQuery = '';
    let currentFilter = 'ALL';
    let currentSort = 'RECENT';
    let currentLayout = 'GRID';
    try {
      currentLayout = localStorage.getItem('kmp_clients_layout_mode') || 'GRID';
    } catch (_) {
      currentLayout = 'GRID';
    }

    /**
     * Formatea marcas de tiempo en formato amigable y relativo
     */
    function formatRelativeDate(timestamp) {
      if (!timestamp) return null;
      const dateObj = new Date(timestamp);
      if (isNaN(dateObj.getTime())) return null;

      const now = new Date();
      const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const d2 = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));

      const dateStr = dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      let relative = '';
      if (diffDays <= 0) relative = 'Hoy';
      else if (diffDays === 1) relative = 'Ayer';
      else if (diffDays < 30) relative = `hace ${diffDays} días`;
      else if (diffDays < 365) {
        const m = Math.floor(diffDays / 30);
        relative = `hace ${m} ${m === 1 ? 'mes' : 'meses'}`;
      } else {
        const y = Math.floor(diffDays / 365);
        relative = `hace ${y} ${y === 1 ? 'año' : 'años'}`;
      }

      return { dateStr, relative, label: `${dateStr} (${relative})` };
    }

    /**
     * Filtra y ordena la lista de cuentas según los criterios actuales
     */
    function filterAndSortData() {
      const q = currentQuery.trim().toLowerCase();
      const qDigits = q.replace(/[^0-9]/g, '');

      let result = listData.filter(item => {
        // Búsqueda por texto (Nombre, CUIT, Dirección, Teléfono)
        if (q) {
          const name = (item.name || '').toLowerCase();
          const cuit = (item.cuit || '').toLowerCase();
          const cuitDigits = cuit.replace(/[^0-9]/g, '');
          const address = (item.address || '').toLowerCase();
          const phone = (item.phone || '').toLowerCase();

          const matchesName = name.includes(q);
          const matchesCuit = cuit.includes(q) || (qDigits && cuitDigits.includes(qDigits));
          const matchesAddress = address.includes(q);
          const matchesPhone = phone.includes(q);

          if (!matchesName && !matchesCuit && !matchesAddress && !matchesPhone) {
            return false;
          }
        }

        // Filtro por Estado
        const balance = item.balance || 0;
        if (currentFilter === 'RECENT') {
          return item.lastMovementDate != null;
        } else if (currentFilter === 'DEBT') {
          return balance > 0;
        } else if (currentFilter === 'SETTLED') {
          return balance <= 0;
        } else if (currentFilter === 'BLOCKED') {
          return !!item.isBlocked;
        }

        return true;
      });

      // Ordenamiento
      result.sort((a, b) => {
        if (currentSort === 'RECENT') {
          const timeA = a.lastMovementDate ? new Date(a.lastMovementDate).getTime() : 0;
          const timeB = b.lastMovementDate ? new Date(b.lastMovementDate).getTime() : 0;
          if (timeB !== timeA) return timeB - timeA; // Más reciente primero
          return (a.name || '').localeCompare(b.name || '');
        } else if (currentSort === 'OLDEST_MOV') {
          const timeA = a.lastMovementDate ? new Date(a.lastMovementDate).getTime() : Infinity;
          const timeB = b.lastMovementDate ? new Date(b.lastMovementDate).getTime() : Infinity;
          if (timeA !== timeB) return timeA - timeB;
          return (a.name || '').localeCompare(b.name || '');
        } else if (currentSort === 'DEBT_DESC') {
          const balA = a.balance || 0;
          const balB = b.balance || 0;
          if (balB !== balA) return balB - balA;
          return (a.name || '').localeCompare(b.name || '');
        } else if (currentSort === 'NAME_ASC') {
          return (a.name || '').localeCompare(b.name || '');
        }
        return 0;
      });

      return result;
    }

    /**
     * Renderiza las tarjetas o filas de clientes en el DOM
     */
    function renderCards() {
      const filtered = filterAndSortData();
      gridContainer.innerHTML = '';

      // Configurar layout del contenedor
      if (currentLayout === 'ROWS') {
        gridContainer.style.display = 'flex';
        gridContainer.style.flexDirection = 'column';
        gridContainer.style.gap = '0.75rem';
      } else {
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(330px, 1fr))';
        gridContainer.style.gap = '1.25rem';
      }

      // Actualizar contador
      const counterEl = controlsContainer.querySelector('#search-counter');
      if (counterEl) {
        counterEl.textContent = `Mostrando ${filtered.length} de ${totalAccounts} ${isOperatorsTab ? 'operadores' : 'clientes'}`;
      }

      if (filtered.length === 0) {
        const isSearchingOrFiltering = currentQuery.trim().length > 0 || currentFilter !== 'ALL';
        const emptyCard = el('div', { 
          classes: ['glass-card'], 
          style: 'grid-column: 1 / -1; padding: 3.5rem 2rem; text-align: center; border-radius: 16px; border: 1px dashed var(--border);' 
        });

        if (isSearchingOrFiltering) {
          emptyCard.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.7;">🔍</div>
            <h3 style="margin: 0 0 0.5rem 0; color: var(--text-main);">No se encontraron coincidencias</h3>
            <p style="color: var(--text-muted); margin: 0 0 1.5rem 0; font-size: 0.9rem;">
              No hay ${isOperatorsTab ? 'operadores' : 'clientes'} que coincidan con "${currentQuery}" o el filtro seleccionado.
            </p>
            <button id="btn-reset-filters" class="btn-outline" style="padding: 0.6rem 1.5rem; border-radius: 10px;">
              🔄 Restablecer Filtros
            </button>
          `;
          gridContainer.appendChild(emptyCard);
          emptyCard.querySelector('#btn-reset-filters').onclick = () => {
            currentQuery = '';
            currentFilter = 'ALL';
            const searchInput = controlsContainer.querySelector('#client-search-input');
            const clearBtn = controlsContainer.querySelector('#clear-search-btn');
            if (searchInput) searchInput.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
            updateChipStyles();
            renderCards();
          };
        } else {
          emptyCard.innerHTML = `
            <div style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.7;">👥</div>
            <h3 style="margin: 0 0 0.5rem 0; color: var(--text-main);">Sin registros</h3>
            <p style="color: var(--text-muted); margin: 0 0 1.5rem 0; font-size: 0.9rem;">
              Aún no hay ${isOperatorsTab ? 'operadores' : 'clientes'} cargados en el sistema.
            </p>
            <button id="btn-create-first" class="btn-primary" style="padding: 0.65rem 1.75rem; border-radius: 12px;">
              ➕ Registrar Primer ${isOperatorsTab ? 'Operador' : 'Cliente'}
            </button>
          `;
          gridContainer.appendChild(emptyCard);
          emptyCard.querySelector('#btn-create-first').onclick = () => {
            showClientModal(null, onSaveClient, isOperatorsTab ? 'OPERATOR' : 'CLIENT');
          };
        }
        return;
      }

      filtered.forEach(c => {
        const balanceVal = c.balance || 0;
        const balanceColor = balanceVal > 0 ? '#ef4444' : (balanceVal < 0 ? '#3b82f6' : '#10b981');
        const balanceText = balanceVal > 0 
          ? `$${balanceVal.toLocaleString('es-AR')}` 
          : (balanceVal < 0 ? `-$${Math.abs(balanceVal).toLocaleString('es-AR')} (A favor)` : '$0 (Al día)');
        
        const isBlocked = c.isBlocked;
        const initial = (c.name || '?').trim().charAt(0).toUpperCase();

        // Formato del último movimiento
        const relMov = formatRelativeDate(c.lastMovementDate);
        const isDebt = c.lastMovementType === 'DEBT';
        const movIcon = isDebt ? '📤' : '📥';
        const movColor = isDebt ? '#f87171' : '#34d399';
        const movLabel = isDebt ? 'Despacho/Venta' : 'Cobro/Pago';
        const movAmount = c.lastMovementAmount ? `$${Number(c.lastMovementAmount).toLocaleString('es-AR')}` : '';
        const movDesc = c.lastMovementDescription ? ` • "${c.lastMovementDescription.substring(0, 30)}${c.lastMovementDescription.length > 30 ? '...' : ''}"` : '';

        // Estado Badge
        let statusBadgeHtml = '';
        if (isBlocked) {
          statusBadgeHtml = `<span style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.4); padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;" title="${c.blockingReason || ''}">⚠️ Suspendido</span>`;
        } else if (balanceVal > 0) {
          statusBadgeHtml = `<span style="background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.25); padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600;">🔴 Con Deuda</span>`;
        } else {
          statusBadgeHtml = `<span style="background: rgba(16,185,129,0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.25); padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600;">🟢 Al Día</span>`;
        }

        if (currentLayout === 'ROWS') {
          // --- RENDER MODO FILA (ROW VIEW) ---
          let movRowHtml = '';
          if (relMov) {
            movRowHtml = `
              <div style="
                background: rgba(255,255,255,0.03); 
                border: 1px solid var(--border); 
                border-radius: 10px; 
                padding: 0.5rem 0.85rem;
                font-size: 0.8rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.6rem;
              ">
                <div style="display: flex; align-items: center; gap: 0.4rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <span>${movIcon}</span>
                  <span style="font-weight: 600; color: var(--text-main);">${movLabel}</span>
                  <span style="color: var(--text-muted); font-size: 0.75rem;">${movDesc}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.45rem; flex-shrink: 0;">
                  ${movAmount ? `<span style="font-weight: 750; color: ${movColor}; font-family: monospace;">${movAmount}</span>` : ''}
                  <span style="color: #818cf8; font-size: 0.74rem; font-weight: 600; background: rgba(99,102,241,0.1); padding: 0.15rem 0.45rem; border-radius: 6px;">🕒 ${relMov.relative || relMov.dateStr}</span>
                </div>
              </div>
            `;
          } else {
            movRowHtml = `
              <div style="
                background: rgba(255,255,255,0.02); 
                border: 1px dashed var(--border); 
                border-radius: 10px; 
                padding: 0.5rem 0.85rem;
                font-size: 0.78rem;
                color: var(--text-muted);
                display: flex;
                align-items: center;
                gap: 0.4rem;
              ">
                <span>⚪</span>
                <span>Sin movimientos registrados</span>
              </div>
            `;
          }

          const rowCard = el('div', { 
            classes: ['card', 'glass-card', 'client-row-item'], 
            style: `
              cursor: pointer; 
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
              border-radius: 14px; 
              padding: 0.95rem 1.35rem; 
              border: 1px solid var(--border); 
              background: var(--card-bg);
              box-shadow: var(--elevation-1);
              position: relative;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 1.25rem;
              flex-wrap: wrap;
              ${c.isBlocked ? 'border-left: 5px solid #ef4444;' : ((c.balance || 0) > 0 ? 'border-left: 5px solid #f59e0b;' : 'border-left: 5px solid #10b981;')}
            ` 
          });

          rowCard.onmouseenter = () => {
            rowCard.style.transform = 'translateX(4px)';
            rowCard.style.boxShadow = 'var(--elevation-2)';
            rowCard.style.borderColor = 'var(--primary)';
            rowCard.style.background = 'rgba(255,255,255,0.025)';
          };
          rowCard.onmouseleave = () => {
            rowCard.style.transform = 'none';
            rowCard.style.boxShadow = 'var(--elevation-1)';
            rowCard.style.borderColor = 'var(--border)';
            rowCard.style.background = 'var(--card-bg)';
          };

          rowCard.innerHTML = `
            <!-- Columna 1: Avatar + Datos Principales -->
            <div style="display: flex; align-items: center; gap: 0.85rem; flex: 2; min-width: 250px;">
              <div style="
                width: 42px; 
                height: 42px; 
                border-radius: 12px; 
                background: linear-gradient(135deg, rgba(143, 0, 20, 0.8), rgba(99, 102, 241, 0.7)); 
                color: #ffffff; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-weight: 700; 
                font-size: 1.15rem;
                flex-shrink: 0;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
              ">
                ${initial}
              </div>
              <div style="min-width: 0;">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                  <h3 style="margin: 0; font-size: 1.05rem; font-weight: 750; color: var(--text-main); line-height: 1.25;">
                    ${c.name}
                  </h3>
                  ${statusBadgeHtml}
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.25rem; font-size: 0.8rem; color: var(--text-muted); flex-wrap: wrap;">
                  <span>🆔 CUIT: <strong style="color:var(--text-main); font-weight:600;">${c.cuit || 'Sin CUIT'}</strong></span>
                  ${c.address ? `<span>📍 ${c.address}</span>` : ''}
                  ${c.phone ? `<span>📞 ${c.phone}</span>` : ''}
                </div>
              </div>
            </div>

            <!-- Columna 2: Último Movimiento -->
            <div style="flex: 2; min-width: 240px;">
              ${movRowHtml}
            </div>

            <!-- Columna 3: Saldo y Botones de Acción -->
            <div style="display: flex; align-items: center; gap: 1.25rem; justify-content: flex-end; flex: 1.5; min-width: 220px;">
              <div style="text-align: right;">
                <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Saldo Cuenta</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: ${balanceColor}; letter-spacing: -0.02em; font-family: monospace;">
                  ${balanceText}
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <button class="btn-outline edit-client-btn" title="Editar Cliente" style="padding: 0.4rem 0.7rem; font-size: 0.8rem; border-radius: 8px;">
                  ✏️
                </button>
                <button class="btn-primary view-account-btn" style="padding: 0.45rem 1rem; font-size: 0.82rem; border-radius: 10px; font-weight: 600; white-space: nowrap;">
                  Ver Cuenta →
                </button>
              </div>
            </div>
          `;

          // Eventos
          rowCard.querySelector('.edit-client-btn').onclick = (e) => {
            e.stopPropagation();
            showClientModal(c, onSaveClient, isOperatorsTab ? 'OPERATOR' : 'CLIENT');
          };

          rowCard.querySelector('.view-account-btn').onclick = (e) => {
            e.stopPropagation();
            onSelectClient(c, isOperatorsTab ? 'OPERATOR' : 'CLIENT');
          };

          rowCard.onclick = () => onSelectClient(c, isOperatorsTab ? 'OPERATOR' : 'CLIENT');

          gridContainer.appendChild(rowCard);

        } else {
          // --- RENDER MODO TARJETA (GRID CARD VIEW) ---
          let movHtml = '';
          if (relMov) {
            movHtml = `
              <div style="
                background: rgba(255,255,255,0.03); 
                border: 1px solid var(--border); 
                border-radius: 10px; 
                padding: 0.65rem 0.85rem;
                font-size: 0.82rem;
              ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                  <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Último Movimiento</span>
                  <span style="color: #818cf8; font-weight: 600; font-size: 0.78rem;">🕒 ${relMov.label}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; color: var(--text-main);">
                  <div style="display: flex; align-items: center; gap: 0.35rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span>${movIcon}</span>
                    <span style="font-weight: 500;">${movLabel}</span>
                    <span style="color: var(--text-muted); font-size: 0.75rem;">${movDesc}</span>
                  </div>
                  ${movAmount ? `<span style="font-weight: 700; color: ${movColor}; white-space: nowrap;">${movAmount}</span>` : ''}
                </div>
              </div>
            `;
          } else {
            movHtml = `
              <div style="
                background: rgba(255,255,255,0.02); 
                border: 1px dashed var(--border); 
                border-radius: 10px; 
                padding: 0.55rem 0.85rem;
                font-size: 0.8rem;
                color: var(--text-muted);
                display: flex;
                align-items: center;
                gap: 0.5rem;
              ">
                <span>⚪</span>
                <span>Sin movimientos registrados</span>
              </div>
            `;
          }

          const card = el('div', { 
            classes: ['card', 'glass-card'], 
            style: `
              cursor: pointer; 
              transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); 
              border-radius: 16px; 
              padding: 1.35rem; 
              border: 1px solid var(--border); 
              background: var(--card-bg);
              box-shadow: var(--elevation-1);
              position: relative;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              gap: 1rem;
              ${c.isBlocked ? 'border-left: 5px solid #ef4444;' : ((c.balance || 0) > 0 ? 'border-left: 5px solid #f59e0b;' : 'border-left: 5px solid #10b981;')}
            ` 
          });

          card.onmouseenter = () => {
            card.style.transform = 'translateY(-3px)';
            card.style.boxShadow = 'var(--elevation-2)';
            card.style.borderColor = 'var(--primary)';
          };
          card.onmouseleave = () => {
            card.style.transform = 'none';
            card.style.boxShadow = 'var(--elevation-1)';
            card.style.borderColor = 'var(--border)';
          };

          card.innerHTML = `
            <div>
              <!-- Header de Tarjeta -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.85rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div style="
                    width: 42px; 
                    height: 42px; 
                    border-radius: 12px; 
                    background: linear-gradient(135deg, rgba(143, 0, 20, 0.8), rgba(99, 102, 241, 0.7)); 
                    color: #ffffff; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-weight: 700; 
                    font-size: 1.15rem;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    flex-shrink: 0;
                  ">
                    ${initial}
                  </div>
                  <div>
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-main); line-height: 1.25;">
                      ${c.name}
                    </h3>
                    <div style="margin-top: 3px;">
                      ${statusBadgeHtml}
                    </div>
                  </div>
                </div>
                <button class="btn-outline edit-client-btn" title="Editar Cliente" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; border-radius: 8px; flex-shrink: 0;">
                  ✏️ Editar
                </button>
              </div>

              <!-- Datos Secundarios -->
              <div style="display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.85rem; font-size: 0.85rem; color: var(--text-muted);">
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <span style="opacity: 0.7;">🆔</span>
                  <span style="font-weight: 600; color: var(--text-main);">CUIT: ${c.cuit || 'Sin CUIT'}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.4rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <span style="opacity: 0.7;">📍</span>
                  <span>${c.address || 'Sin dirección registrada'}</span>
                </div>
                ${c.phone ? `
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <span style="opacity: 0.7;">📞</span>
                    <span>${c.phone}</span>
                  </div>
                ` : ''}
              </div>

              <!-- Sección de Último Movimiento -->
              ${movHtml}
            </div>

            <!-- Footer con Saldo y Acción Principal -->
            <div style="
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-top: 1px solid var(--border); 
              padding-top: 0.85rem; 
              margin-top: 0.25rem;
            ">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Saldo Cuenta</div>
                <div style="font-size: 1.35rem; font-weight: 800; color: ${balanceColor}; letter-spacing: -0.02em;">
                  ${balanceText}
                </div>
              </div>
              <button class="btn-primary view-account-btn" style="padding: 0.55rem 1.15rem; font-size: 0.85rem; border-radius: 10px; font-weight: 600;">
                Ver Cuenta →
              </button>
            </div>
          `;

          // Eventos
          card.querySelector('.edit-client-btn').onclick = (e) => {
            e.stopPropagation();
            showClientModal(c, onSaveClient, isOperatorsTab ? 'OPERATOR' : 'CLIENT');
          };

          card.querySelector('.view-account-btn').onclick = (e) => {
            e.stopPropagation();
            onSelectClient(c, isOperatorsTab ? 'OPERATOR' : 'CLIENT');
          };

          card.onclick = () => onSelectClient(c, isOperatorsTab ? 'OPERATOR' : 'CLIENT');

          gridContainer.appendChild(card);
        }
      });
    }

    /**
     * Actualiza el estilo activo de los chips de filtro
     */
    function updateChipStyles() {
      controlsContainer.querySelectorAll('.filter-chip').forEach(btn => {
        const f = btn.dataset.filter;
        if (f === currentFilter) {
          btn.style.background = 'var(--primary-container)';
          btn.style.color = 'var(--on-primary-container)';
          btn.style.borderColor = 'var(--primary)';
        } else {
          btn.style.background = 'rgba(255,255,255,0.04)';
          btn.style.color = 'var(--text-muted)';
          btn.style.borderColor = 'var(--border)';
        }
      });
    }

    /**
     * Actualiza el estilo activo del conmutador de disposición (Cuadrícula / Filas)
     */
    function updateLayoutToggleStyles() {
      const btnGrid = controlsContainer.querySelector('#btn-layout-grid');
      const btnRows = controlsContainer.querySelector('#btn-layout-rows');
      if (btnGrid && btnRows) {
        if (currentLayout === 'GRID') {
          btnGrid.style.background = 'var(--primary)';
          btnGrid.style.color = '#ffffff';
          btnRows.style.background = 'transparent';
          btnRows.style.color = 'var(--text-muted)';
        } else {
          btnRows.style.background = 'var(--primary)';
          btnRows.style.color = '#ffffff';
          btnGrid.style.background = 'transparent';
          btnGrid.style.color = 'var(--text-muted)';
        }
      }
    }

    // Configuración de Event Listeners de Búsqueda, Filtros y Layout
    const searchInput = controlsContainer.querySelector('#client-search-input');
    const clearBtn = controlsContainer.querySelector('#clear-search-btn');
    const sortSelect = controlsContainer.querySelector('#sort-select');
    const btnLayoutGrid = controlsContainer.querySelector('#btn-layout-grid');
    const btnLayoutRows = controlsContainer.querySelector('#btn-layout-rows');

    if (btnLayoutGrid) {
      btnLayoutGrid.onclick = () => {
        currentLayout = 'GRID';
        try { localStorage.setItem('kmp_clients_layout_mode', 'GRID'); } catch (_) {}
        updateLayoutToggleStyles();
        renderCards();
      };
    }

    if (btnLayoutRows) {
      btnLayoutRows.onclick = () => {
        currentLayout = 'ROWS';
        try { localStorage.setItem('kmp_clients_layout_mode', 'ROWS'); } catch (_) {}
        updateLayoutToggleStyles();
        renderCards();
      };
    }

    searchInput.oninput = (e) => {
      currentQuery = e.target.value;
      if (currentQuery.length > 0) {
        clearBtn.style.display = 'block';
      } else {
        clearBtn.style.display = 'none';
      }
      renderCards();
    };

    clearBtn.onclick = () => {
      searchInput.value = '';
      currentQuery = '';
      clearBtn.style.display = 'none';
      searchInput.focus();
      renderCards();
    };

    sortSelect.onchange = (e) => {
      currentSort = e.target.value;
      renderCards();
    };

    controlsContainer.querySelectorAll('.filter-chip').forEach(btn => {
      btn.onclick = () => {
        currentFilter = btn.dataset.filter;
        // Si el usuario hace click en el chip de Movimientos Recientes, sincronizar también el sort
        if (currentFilter === 'RECENT') {
          currentSort = 'RECENT';
          if (sortSelect) sortSelect.value = 'RECENT';
        }
        updateChipStyles();
        renderCards();
      };
    });

    // Render inicial
    updateLayoutToggleStyles();
    renderCards();
  }

  container.appendChild(wrapper);
}

