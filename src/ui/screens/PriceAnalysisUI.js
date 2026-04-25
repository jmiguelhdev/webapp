import { el } from '../../utils/dom.js';

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

  const header = el('div', { 
    classes: ['dashboard-header'],
    style: 'display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;'
  });

  header.innerHTML = `
    <button id="back-analysis" class="back-btn-m3" title="Volver">
      <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <div style="flex: 1;">
      <h2 style="margin: 0; font-size: 1.5rem;">📈 Análisis de Precio Promedio</h2>
      <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Cliente: <strong>${client.name}</strong></p>
    </div>
  `;
  container.appendChild(header);
  header.querySelector('#back-analysis').onclick = onBack;

  const mainGrid = el('div', { 
    classes: ['grid-2-cols'],
    style: 'align-items: start;' 
  });

  // LEFT COLUMN: FORM AND RESULTS
  const leftCol = el('div', { style: 'display: flex; flex-direction: column; gap: 2rem;' });

  // 1. ANALYSIS FORM
  const formCard = el('div', { classes: ['glass-card'], style: 'padding: 1.5rem;' });
  formCard.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 1.25rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
      <span>🔍</span> Parámetros de Análisis
    </h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: flex-end;">
      <div class="form-group" style="margin:0;">
        <label>Desde (Despacho)</label>
        <input type="date" id="analysis-start" class="form-input" value="${analysis.startDate || ''}">
      </div>
      <div class="form-group" style="margin:0;">
        <label>Hasta (Despacho)</label>
        <input type="date" id="analysis-end" class="form-input" value="${analysis.endDate || ''}">
      </div>
      <div class="form-group" style="margin:0;">
        <label>Precio por Kg Esperado ($)</label>
        <input type="number" step="0.01" id="analysis-expected" class="form-input" value="${analysis.expectedPrice || ''}" placeholder="0.00">
      </div>
      <div class="form-group" style="margin:0;">
        <label>Venta Total (Sistema Externo) ($)</label>
        <input type="number" step="0.01" id="analysis-sales" class="form-input" value="${analysis.totalSales || ''}" placeholder="0.00">
      </div>
      <div style="grid-column: 1 / -1; display: flex; gap: 1rem; margin-top: 0.5rem;">
        <button id="run-analysis-btn" class="btn-primary" style="flex: 1; margin: 0; background: var(--primary);">🚀 Calcular Análisis</button>
      </div>
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

  // 2. RESULTS SUMMARY
  if (results) {
    const resultsArea = el('div', { style: 'display: flex; flex-direction: column; gap: 2rem;' });
    
    // Summary Cards
    const statsGrid = el('div', { 
      classes: ['stats-grid'],
      style: 'margin-bottom: 0;'
    });

    const diffPrice = results.actualPrice - results.expectedPrice;
    const diffColor = diffPrice >= 0 ? '#10b981' : '#ef4444';
    const missingPayment = results.totalSales - results.totalPayments;
    const missingColor = missingPayment <= 0 ? '#10b981' : '#ef4444';

    statsGrid.appendChild(renderStatCard('Kg Despachados', `${(results.totalKg || 0).toLocaleString()} kg`, '⚖️', 'var(--text-main)'));
    statsGrid.appendChild(renderStatCard('Precio Real $/Kg', `$${(results.actualPrice || 0).toFixed(2)}`, '💰', 'var(--primary)'));
    statsGrid.appendChild(renderStatCard('Vs. Esperado', `${diffPrice >= 0 ? '+' : ''}${diffPrice.toFixed(2)}`, '📊', diffColor));
    statsGrid.appendChild(renderStatCard('Cobros Registrados', `$${(results.totalPayments || 0).toLocaleString()}`, '📥', '#8b5cf6'));
    statsGrid.appendChild(renderStatCard('Faltante de Cobro', `$${(missingPayment || 0).toLocaleString()}`, '🚩', missingColor));

    resultsArea.appendChild(statsGrid);

    // Save Action
    const saveRow = el('div', { style: 'display: flex; justify-content: flex-end;' });
    const saveBtn = el('button', { 
      classes: ['btn-primary'], 
      text: '💾 Guardar este Análisis',
      style: 'background: #059669; margin: 0;'
    });
    saveBtn.onclick = () => onSaveAnalysis(results);
    saveRow.appendChild(saveBtn);
    resultsArea.appendChild(saveRow);

    // Details Tabs/Tables
    const detailsCard = el('div', { classes: ['glass-card'], style: 'padding: 1.5rem;' });
    detailsCard.innerHTML = `
      <div style="display: flex; gap: 2rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem;">
        <h3 style="margin: 0; padding-bottom: 0.75rem; border-bottom: 2px solid var(--primary); font-size: 1rem; color: var(--text-main);">🥩 Desglose de Despachos</h3>
        <h3 style="margin: 0; padding-bottom: 0.75rem; font-size: 1rem; color: var(--text-muted); cursor: pointer;" id="tab-payments">💸 Pagos Recibidos</h3>
      </div>
      <div id="table-container"></div>
    `;

    const renderTable = (type) => {
      const container = detailsCard.querySelector('#table-container');
      container.innerHTML = '';
      const table = el('table', { style: 'width: 100%; border-collapse: collapse; font-size: 0.9rem;' });
      
      if (type === 'faenas') {
        table.innerHTML = `
          <thead>
            <tr style="text-align: left; opacity: 0.7; border-bottom: 1px solid var(--border);">
              <th style="padding: 0.75rem;">Fecha</th>
              <th style="padding: 0.75rem;">ID/Garrón</th>
              <th style="padding: 0.75rem;">Categoría</th>
              <th style="padding: 0.75rem; text-align: right;">Peso</th>
            </tr>
          </thead>
          <tbody>
            ${faenas.length === 0 ? '<tr><td colspan="4" style="padding: 2rem; text-align: center;">No hay despachos en este rango.</td></tr>' : 
              faenas.map(f => `
                <tr style="border-bottom: 1px solid var(--border);">
                  <td style="padding: 0.75rem;">${new Date(f.dispatchDate).toLocaleDateString()}</td>
                  <td style="padding: 0.75rem;">#${f.garron || (f.id ? f.id.substring(0,6) : 'N/A')}</td>
                  <td style="padding: 0.75rem;"><span class="agent-badge" style="background: var(--bg-hover);">${f.category || 'N/A'}</span></td>
                  <td style="padding: 0.75rem; text-align: right; font-weight: 600;">${(f.kg || 0).toLocaleString()} kg</td>
                </tr>
              `).join('')
            }
          </tbody>
        `;
      } else {
        table.innerHTML = `
          <thead>
            <tr style="text-align: left; opacity: 0.7; border-bottom: 1px solid var(--border);">
              <th style="padding: 0.75rem;">Fecha</th>
              <th style="padding: 0.75rem;">Concepto</th>
              <th style="padding: 0.75rem; text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${payments.length === 0 ? '<tr><td colspan="3" style="padding: 2rem; text-align: center;">No hay cobros en este rango.</td></tr>' : 
              payments.map(p => `
                <tr style="border-bottom: 1px solid var(--border);">
                  <td style="padding: 0.75rem;">${new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                  <td style="padding: 0.75rem;">${p.description || 'Cobro'}</td>
                  <td style="padding: 0.75rem; text-align: right; font-weight: 600; color: #10b981;">$${(p.amount || 0).toLocaleString()}</td>
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

    renderTable('faenas');
    leftCol.appendChild(resultsArea);
    resultsArea.appendChild(detailsCard);

    // Tab switching
    detailsCard.querySelectorAll('h3').forEach(h => {
      h.onclick = () => {
        detailsCard.querySelectorAll('h3').forEach(x => {
          x.style.borderBottom = 'none';
          x.style.color = 'var(--text-muted)';
        });
        h.style.borderBottom = '2px solid var(--primary)';
        h.style.color = 'var(--text-main)';
        renderTable(h.id === 'tab-payments' ? 'payments' : 'faenas');
      };
    });
  } else {
    // Empty state for results
    const emptyResults = el('div', { 
      classes: ['glass-card'], 
      style: 'padding: 4rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem;' 
    });
    emptyResults.innerHTML = `
      <div style="font-size: 3rem; opacity: 0.2;">📊</div>
      <p style="color: var(--text-muted);">Configura el rango de fechas y parámetros para ver los resultados del análisis.</p>
    `;
    leftCol.appendChild(emptyResults);
  }

  mainGrid.appendChild(leftCol);

  // RIGHT COLUMN: HISTORY
  const rightCol = el('div', { style: 'display: flex; flex-direction: column; gap: 1.5rem;' });
  
  const historyCard = el('div', { classes: ['glass-card'], style: 'padding: 1.5rem; height: 100%;' });
  historyCard.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 1.25rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
      <span>📜</span> Historial de Análisis
    </h3>
    <div id="history-list" style="display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; max-height: 70vh;"></div>
  `;

  const historyList = historyCard.querySelector('#history-list');
  if (history.length === 0) {
    historyList.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 2rem;">No hay análisis guardados para este cliente.</p>`;
  } else {
    history.forEach(item => {
      const hItem = el('div', { 
        classes: ['card'],
        style: 'padding: 0.75rem; cursor: pointer; border: 1px solid var(--border); transition: all 0.2s; border-radius: 10px;' 
      });
      hItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <small style="color: var(--primary); font-weight: bold;">${item.startDate} - ${item.endDate}</small>
          <small style="opacity: 0.6;">${new Date(item.createdAt).toLocaleDateString()}</small>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <div style="font-size: 0.9rem; font-weight: 700;">$${item.actualPrice?.toFixed(2)} <span style="font-weight: normal; font-size: 0.8rem; opacity: 0.7;">$/kg</span></div>
          <div style="font-size: 0.8rem; color: ${item.actualPrice >= item.expectedPrice ? '#10b981' : '#ef4444'};">
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

function renderStatCard(label, val, icon, color) {
  const card = el('div', { 
    classes: ['stat-card', 'glass-card'], 
    style: `border-left: 4px solid ${color}; padding: 1rem;` 
  });
  card.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
      <span style="font-size: 1.2rem;">${icon}</span>
      <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${label}</span>
    </div>
    <div style="font-size: 1.25rem; font-weight: 800; color: ${color};">${val}</div>
  `;
  return card;
}
