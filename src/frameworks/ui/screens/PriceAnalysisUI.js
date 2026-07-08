/**
 * @file PriceAnalysisUI.js
 * @description Highly polished, modern screen for average price analysis.
 * Incorporates Clean Architecture by keeping logic separated, ES6+ modules,
 * full JSDoc documentation, sutil animations, and perfect theme adaptability.
 */

import { el } from '../../../utils/dom.js';

/**
 * @typedef {Object} Client
 * @property {string} id - The client's unique identifier.
 * @property {string} name - The client's name.
 */

/**
 * @typedef {Object} PriceAnalysisParams
 * @property {string} startDate - Start date of the analysis range (YYYY-MM-DD).
 * @property {string} endDate - End date of the analysis range (YYYY-MM-DD).
 * @property {number} expectedPrice - The target average price per Kg expected by the user.
 * @property {number} totalSales - Total sales recorded in external system.
 */

/**
 * @typedef {Object} PriceAnalysisResults
 * @property {string} startDate - Start date of the analysis range.
 * @property {string} endDate - End date of the analysis range.
 * @property {number} expectedPrice - Expected average price per Kg.
 * @property {number} totalSales - Total external sales amount.
 * @property {number} totalKg - Sum of kilograms dispatched in the range.
 * @property {number} totalPayments - Sum of payments/receipts in the range.
 * @property {number} actualPrice - The actual average price achieved (totalSales / totalKg).
 * @property {string} clientId - Associated client ID.
 * @property {string} clientName - Associated client Name.
 * @property {number|string} [createdAt] - Date timestamp when the analysis was saved.
 */

/**
 * @typedef {Object} PriceAnalysisOptions
 * @property {Client} client - The selected client data.
 * @property {Array<Object>} [faenas] - List of dispatch records (faenas) in the range.
 * @property {Array<Object>} [payments] - List of payments received in the range.
 * @property {Array<PriceAnalysisResults>} [history] - Saved history records of previous analyses.
 * @property {PriceAnalysisParams} [analysis] - Current analysis configuration/parameters.
 * @property {PriceAnalysisResults|null} [results] - Result details if an analysis has been executed.
 * @property {function(PriceAnalysisParams): void} onRunAnalysis - Action triggered when calculating the analysis.
 * @property {function(PriceAnalysisResults): void} onSaveAnalysis - Action triggered when saving the analysis.
 * @property {function(): void} onBack - Action triggered when navigating back to client dashboard.
 * @property {function(PriceAnalysisResults): void} onSelectHistory - Action triggered when a history card is clicked.
 */

/**
 * Renders the Price Analysis interface.
 * Strictly decoupled from business logic and database access.
 *
 * @param {HTMLElement} container - Target DOM node to render the view.
 * @param {PriceAnalysisOptions} options - Configuration options, initial state, and delegates.
 */
export function renderPriceAnalysis(container, options) {
  const { 
    client, 
    faenas = [], 
    payments = [], 
    history = [],
    analysis = { startDate: '', endDate: '', expectedPrice: 0, totalSales: 0 },
    results = null,
    onRunAnalysis,
    onSaveAnalysis,
    onBack,
    onSelectHistory
  } = options;

  container.innerHTML = '';

  // Inject component-specific styles to keep the component self-contained and visually premium
  const styleTag = el('style', {
    text: `
      .table-row-hover:hover {
        background-color: var(--glass) !important;
      }
      .history-item-card {
        border-left: 4px solid var(--border);
        transition: var(--transition);
      }
      .history-item-card:hover {
        transform: translateY(-2px);
        border-color: var(--primary) !important;
        background-color: var(--glass) !important;
        box-shadow: var(--elevation-2);
      }
      .tab-active {
        border-bottom: 3px solid var(--primary) !important;
        color: var(--text-main) !important;
      }
      .tab-inactive {
        border-bottom: 3px solid transparent !important;
        color: var(--text-muted) !important;
      }
      .premium-input {
        transition: var(--transition);
      }
      .premium-input:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-container);
      }
      .action-btn-hover {
        transition: var(--transition);
      }
      .action-btn-hover:hover {
        opacity: 0.95;
        transform: translateY(-1px);
        box-shadow: var(--elevation-2);
      }
      .action-btn-hover:active {
        transform: translateY(0);
      }
    `
  });
  container.appendChild(styleTag);

  // 1. HEADER SECTION
  const header = el('div', { 
    classes: ['dashboard-header'],
    style: 'display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; padding: 1rem; background: var(--glass); border-radius: 16px; border: 1px solid var(--border);'
  });

  header.innerHTML = `
    <button id="back-analysis" class="back-btn-m3" title="Volver al Panel" style="margin: 0;">
      <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <div style="flex: 1;">
      <h2 style="margin: 0; font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
        <span>📈</span> Análisis de Precio Promedio
      </h2>
      <p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 0.9rem;">
        Cliente: <strong style="color: var(--text-main); font-weight: 600;">${client.name}</strong>
      </p>
    </div>
  `;
  container.appendChild(header);
  header.querySelector('#back-analysis').onclick = onBack;

  // 2. MAIN LAYOUT GRID
  const mainGrid = el('div', { 
    classes: ['grid-2-cols'],
    style: 'align-items: start; gap: 2rem;' 
  });

  // LEFT COLUMN: PARAMETERS FORM & CALCULATED RESULTS
  const leftCol = el('div', { style: 'display: flex; flex-direction: column; gap: 2rem;' });

  // 2A. ANALYSIS PARAMETERS FORM CARD
  const formCard = el('div', { 
    classes: ['glass-card'], 
    style: 'padding: 2rem; border-radius: 16px; display: flex; flex-direction: column; gap: 1.5rem;' 
  });
  
  formCard.innerHTML = `
    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
      <span>🔍</span> Parámetros del Análisis
    </h3>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
      <div class="form-group" style="margin: 0;">
        <label style="font-weight: 500; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
          <span>📅</span> Desde (Despacho)
        </label>
        <input type="date" id="analysis-start" class="form-input premium-input" style="width: 100%; margin-top: 0.35rem; border-radius: 8px;" value="${analysis.startDate || ''}">
      </div>
      
      <div class="form-group" style="margin: 0;">
        <label style="font-weight: 500; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
          <span>📅</span> Hasta (Despacho)
        </label>
        <input type="date" id="analysis-end" class="form-input premium-input" style="width: 100%; margin-top: 0.35rem; border-radius: 8px;" value="${analysis.endDate || ''}">
      </div>
      
      <div class="form-group" style="margin: 0;">
        <label style="font-weight: 500; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
          <span>💰</span> Precio Kg Esperado
        </label>
        <input type="number" step="0.01" id="analysis-expected" class="form-input premium-input" style="width: 100%; margin-top: 0.35rem; border-radius: 8px;" value="${analysis.expectedPrice || ''}" placeholder="0.00">
      </div>
      
      <div class="form-group" style="margin: 0;">
        <label style="font-weight: 500; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
          <span>🛍️</span> Venta Total (Sistema Ext.)
        </label>
        <input type="number" step="0.01" id="analysis-sales" class="form-input premium-input" style="width: 100%; margin-top: 0.35rem; border-radius: 8px;" value="${analysis.totalSales || ''}" placeholder="0.00">
      </div>
    </div>

    <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
      <button id="run-analysis-btn" class="btn-primary action-btn-hover" style="flex: 1; margin: 0; padding: 0.85rem 1.5rem; border-radius: 100px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: var(--primary); font-weight: 600; border: none; cursor: pointer;">
        🚀 Calcular Análisis
      </button>
    </div>
  `;
  leftCol.appendChild(formCard);

  formCard.querySelector('#run-analysis-btn').onclick = () => {
    const startDate = document.getElementById('analysis-start').value;
    const endDate = document.getElementById('analysis-end').value;
    const expectedPrice = parseFloat(document.getElementById('analysis-expected').value) || 0;
    const totalSales = parseFloat(document.getElementById('analysis-sales').value) || 0;
    onRunAnalysis({ startDate, endDate, expectedPrice, totalSales });
  };

  // 2B. CALCULATED RESULTS AREA
  if (results) {
    const resultsArea = el('div', { style: 'display: flex; flex-direction: column; gap: 2rem;' });
    
    // Dynamic color coding based on threshold conditions using standard theme variables
    const diffPrice = results.actualPrice - results.expectedPrice;
    const diffColor = diffPrice >= 0 ? 'var(--success)' : 'var(--danger)';
    const missingPayment = results.totalSales - results.totalPayments;
    const missingColor = missingPayment <= 0 ? 'var(--success)' : 'var(--danger)';

    // Stat Cards Metrics Summary Row
    const statsGrid = el('div', { 
      classes: ['stats-grid'],
      style: 'margin-bottom: 0; gap: 1rem;'
    });

    statsGrid.appendChild(renderStatCard('Kg Despachados', `${(results.totalKg || 0).toLocaleString()} kg`, '⚖️', 'var(--text-main)'));
    statsGrid.appendChild(renderStatCard('Precio Real $/Kg', `$${(results.actualPrice || 0).toFixed(2)}`, '💰', 'var(--primary)'));
    statsGrid.appendChild(renderStatCard('Vs. Esperado', `${diffPrice >= 0 ? '+' : ''}${diffPrice.toFixed(2)}`, '📊', diffColor));
    statsGrid.appendChild(renderStatCard('Cobros Registrados', `$${(results.totalPayments || 0).toLocaleString()}`, '📥', 'var(--success)'));
    statsGrid.appendChild(renderStatCard('Faltante de Cobro', `$${(missingPayment || 0).toLocaleString()}`, '🚩', missingColor));

    resultsArea.appendChild(statsGrid);

    // Save Action Row
    const saveRow = el('div', { style: 'display: flex; justify-content: flex-end;' });
    const saveBtn = el('button', { 
      classes: ['btn-primary', 'action-btn-hover'], 
      style: 'background: var(--success); color: var(--on-primary); margin: 0; padding: 0.75rem 1.5rem; border-radius: 100px; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; border: none; cursor: pointer;'
    });
    saveBtn.innerHTML = `<span>💾</span> Guardar este Análisis`;
    saveBtn.onclick = () => onSaveAnalysis(results);
    saveRow.appendChild(saveBtn);
    resultsArea.appendChild(saveRow);

    // Details breakdown card (Tabs + Tables)
    const detailsCard = el('div', { 
      classes: ['glass-card'], 
      style: 'padding: 2rem; border-radius: 16px; display: flex; flex-direction: column; gap: 1.5rem;' 
    });
    
    detailsCard.innerHTML = `
      <div style="display: flex; gap: 1.5rem; border-bottom: 1px solid var(--border); overflow-x: auto;">
        <h3 style="margin: 0; padding-bottom: 0.75rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; white-space: nowrap; transition: var(--transition);" id="tab-faenas" class="tab-active">
          <span>🥩</span> Desglose de Despachos
        </h3>
        <h3 style="margin: 0; padding-bottom: 0.75rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; white-space: nowrap; transition: var(--transition);" id="tab-payments" class="tab-inactive">
          <span>💸</span> Pagos Recibidos
        </h3>
      </div>
      <div id="table-container"></div>
    `;

    /**
     * Helper to render either the Faenas or Payments details table.
     * 
     * @param {'faenas'|'payments'} type - Which table data to render.
     */
    const renderTable = (type) => {
      const container = detailsCard.querySelector('#table-container');
      container.innerHTML = '';
      const table = el('table', { style: 'width: 100%; border-collapse: collapse; font-size: 0.9rem;' });
      
      if (type === 'faenas') {
        table.innerHTML = `
          <thead>
            <tr style="text-align: left; border-bottom: 2px solid var(--border);">
              <th style="padding: 1rem 0.75rem; color: var(--text-muted); font-weight: 600;">Fecha</th>
              <th style="padding: 1rem 0.75rem; color: var(--text-muted); font-weight: 600;">ID/Garrón</th>
              <th style="padding: 1rem 0.75rem; color: var(--text-muted); font-weight: 600;">Categoría</th>
              <th style="padding: 1rem 0.75rem; text-align: right; color: var(--text-muted); font-weight: 600;">Peso</th>
            </tr>
          </thead>
          <tbody>
            ${faenas.length === 0 ? `
              <tr>
                <td colspan="4" style="padding: 3rem 1rem; text-align: center; color: var(--text-muted);">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;">🥩</div>
                  No hay despachos registrados en el rango de fechas seleccionado.
                </td>
              </tr>
            ` : 
              faenas.map(f => `
                <tr style="border-bottom: 1px solid var(--border); transition: var(--transition);" class="table-row-hover">
                  <td style="padding: 1rem 0.75rem; color: var(--text-main);">${new Date(f.dispatchDate).toLocaleDateString()}</td>
                  <td style="padding: 1rem 0.75rem; font-family: monospace; font-weight: 500; color: var(--text-main);">#${f.garron || (f.id ? f.id.substring(0,6) : 'N/A')}</td>
                  <td style="padding: 1rem 0.75rem;"><span class="agent-badge" style="background: var(--glass); border: 1px solid var(--border); padding: 0.25rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; color: var(--text-muted);">${f.category || 'N/A'}</span></td>
                  <td style="padding: 1rem 0.75rem; text-align: right; font-weight: 700; color: var(--text-main);">${(f.kg || 0).toLocaleString()} kg</td>
                </tr>
              `).join('')
            }
          </tbody>
        `;
      } else {
        table.innerHTML = `
          <thead>
            <tr style="text-align: left; border-bottom: 2px solid var(--border);">
              <th style="padding: 1rem 0.75rem; color: var(--text-muted); font-weight: 600;">Fecha</th>
              <th style="padding: 1rem 0.75rem; color: var(--text-muted); font-weight: 600;">Concepto</th>
              <th style="padding: 1rem 0.75rem; text-align: right; color: var(--text-muted); font-weight: 600;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${payments.length === 0 ? `
              <tr>
                <td colspan="3" style="padding: 3rem 1rem; text-align: center; color: var(--text-muted);">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;">💸</div>
                  No hay cobros registrados en el rango de fechas seleccionado.
                </td>
              </tr>
            ` : 
              payments.map(p => `
                <tr style="border-bottom: 1px solid var(--border); transition: var(--transition);" class="table-row-hover">
                  <td style="padding: 1rem 0.75rem; color: var(--text-main);">${new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                  <td style="padding: 1rem 0.75rem; color: var(--text-main); font-weight: 500;">${p.description || 'Cobro'}</td>
                  <td style="padding: 1rem 0.75rem; text-align: right; font-weight: 700; color: var(--success);">$${(p.amount || 0).toLocaleString()}</td>
                </tr>
              `).join('')
            }
          </tbody>
        `;
      }
      
      const tableWrap = el('div', { classes: ['table-responsive'] });
      tableWrap.appendChild(table);
      container.appendChild(tableWrap);
    };

    // Initial render defaults to dispatches (faenas)
    renderTable('faenas');
    leftCol.appendChild(resultsArea);
    resultsArea.appendChild(detailsCard);

    // Tab switching handlers with elegant state classes
    detailsCard.querySelectorAll('h3').forEach(h => {
      h.onclick = () => {
        detailsCard.querySelectorAll('h3').forEach(x => {
          x.classList.remove('tab-active');
          x.classList.add('tab-inactive');
        });
        h.classList.remove('tab-inactive');
        h.classList.add('tab-active');
        renderTable(h.id === 'tab-payments' ? 'payments' : 'faenas');
      };
    });
  } else {
    // Elegant Empty/Instructions state when no analysis results are available
    const emptyResults = el('div', { 
      classes: ['glass-card'], 
      style: 'padding: 4rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; border: 1px dashed var(--outline); background: rgba(var(--card-bg), 0.3); border-radius: 16px;' 
    });
    
    emptyResults.innerHTML = `
      <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--primary-container); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; color: var(--primary); margin-bottom: 0.5rem; box-shadow: var(--elevation-1);">
        📊
      </div>
      <h4 style="margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--text-main);">Listo para el Análisis</h4>
      <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 340px; line-height: 1.6; margin: 0;">
        Establece el rango de fechas y parámetros arriba para contrastar los kilogramos despachados frente a cobros reales y tus estimaciones de ventas esperadas.
      </p>
      <div style="display: flex; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap; justify-content: center;">
        <div style="font-size: 0.8rem; background: var(--glass); padding: 0.5rem 1rem; border-radius: 20px; display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--border); color: var(--text-muted); font-weight: 500;">
          <span>1️⃣</span> Rango de fechas
        </div>
        <div style="font-size: 0.8rem; background: var(--glass); padding: 0.5rem 1rem; border-radius: 20px; display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--border); color: var(--text-muted); font-weight: 500;">
          <span>2️⃣</span> Precios y Venta
        </div>
        <div style="font-size: 0.8rem; background: var(--glass); padding: 0.5rem 1rem; border-radius: 20px; display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--border); color: var(--text-muted); font-weight: 500;">
          <span>3️⃣</span> Resultados al instante
        </div>
      </div>
    `;
    leftCol.appendChild(emptyResults);
  }

  mainGrid.appendChild(leftCol);

  // RIGHT COLUMN: HISTORICAL SAVED ANALYSIS LIST
  const rightCol = el('div', { style: 'display: flex; flex-direction: column; gap: 1.5rem;' });
  
  const historyCard = el('div', { 
    classes: ['glass-card'], 
    style: 'padding: 2rem; height: 100%; display: flex; flex-direction: column; gap: 1.5rem;' 
  });
  
  historyCard.innerHTML = `
    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
      <span>📜</span> Historial de Análisis
    </h3>
    <div id="history-list" style="display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; max-height: 70vh; padding-right: 0.25rem;"></div>
  `;

  const historyList = historyCard.querySelector('#history-list');
  if (history.length === 0) {
    historyList.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.8rem; opacity: 0.4;">📭</span>
        <span>No hay análisis guardados previamente para este cliente.</span>
      </div>
    `;
  } else {
    history.forEach(item => {
      // Dynamic border coloring based on whether the results were favorable
      const borderLeftColor = item.actualPrice >= item.expectedPrice ? 'var(--success)' : 'var(--danger)';
      
      const hItem = el('div', { 
        classes: ['card', 'history-item-card'],
        style: `padding: 1.25rem; cursor: pointer; border: 1px solid var(--border); border-left: 4px solid ${borderLeftColor}; border-radius: 12px; background: var(--card-bg);` 
      });
      
      hItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <span style="color: var(--primary); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem;">
            📅 ${item.startDate} / ${item.endDate}
          </span>
          <small style="opacity: 0.6; font-size: 0.75rem; color: var(--text-muted);">${new Date(item.createdAt).toLocaleDateString()}</small>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
          <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">
            $${item.actualPrice?.toFixed(2)} 
            <span style="font-weight: 500; font-size: 0.75rem; color: var(--text-muted);">/kg real</span>
          </div>
          <div style="font-size: 0.85rem; font-weight: 700; color: ${borderLeftColor}; background: var(--glass); padding: 0.25rem 0.6rem; border-radius: 8px; display: flex; align-items: center; gap: 0.25rem; border: 1px solid var(--border);">
            ${item.actualPrice >= item.expectedPrice ? '▲' : '▼'} ${(Math.abs(item.actualPrice - item.expectedPrice)).toFixed(2)}
          </div>
        </div>
      `;
      hItem.onclick = () => onSelectHistory(item);
      historyList.appendChild(hItem);
    });
  }

  rightCol.appendChild(historyCard);
  mainGrid.appendChild(rightCol);
  container.appendChild(mainGrid);
}

/**
 * Generates a premium visual metric/stat card widget.
 * 
 * @param {string} label - The descriptive title of the metric.
 * @param {string} val - The formatted metric value to show.
 * @param {string} icon - Emoji or short icon representation.
 * @param {string} color - Semantic CSS variable value (e.g. 'var(--success)') for accent border/text.
 * @returns {HTMLElement} - The rendered card DOM element.
 */
function renderStatCard(label, val, icon, color) {
  const card = el('div', { 
    classes: ['stat-card', 'glass-card'], 
    style: `border-left: 4px solid ${color}; padding: 1.25rem; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between; transition: var(--transition);` 
  });
  
  card.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; width: 100%;">
      <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${label}</span>
      <span style="font-size: 1.1rem; background: var(--glass); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--border);">${icon}</span>
    </div>
    <div style="font-size: 1.35rem; font-weight: 800; color: ${color}; word-break: break-all; margin-top: 0.25rem;">${val}</div>
  `;
  
  return card;
}
