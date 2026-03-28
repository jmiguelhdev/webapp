import { CostSimulator } from './domain/entities/CostSimulator.js';
import Chart from 'chart.js/auto';
import { jsPDF } from 'jspdf';
import { MarketService } from './api/MarketService.js';

// Global to manage chart instances
let chartInstances = {};

/** Utility to create an element with optional classes and text */
function el(tag, { classes = [], text = '', html = '', attrs = {} } = {}) {
  const element = document.createElement(tag);
  if (classes.length) element.classList.add(...classes);
  if (text) element.textContent = text;
  if (html) element.innerHTML = html;
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  return element;
}

function renderStatCard(label, value, icon) {
  return el('div', { 
    classes: ['stat-card'], 
    html: `<div class="stat-icon">${icon}</div><div class="stat-info"><p>${label}</p><h3>${value}</h3></div>` 
  });
}

/** 
 * Render Travels with Filtering, Sorting, and Pagination.
 * Purely presentational component.
 */
export function renderTravels(container, options) {
  const { 
    data, totalItems, currentPage, itemsPerPage, 
    currentFilter, currentSort, 
    onFilter, onSort, onPage,
    categories = [], selectedCategory, includeCommission, 
    onCategoryChange, onCommissionToggle,
    categoryStats = { avgPrice: 0, totalKg: 0, travelCount: 0 }
  } = options;

  container.innerHTML = '';

  // Category Statistics Area
  const statsArea = el('div', { classes: ['category-stats-container'] });
  
  const selectorRow = el('div', { classes: ['selector-row'] });
  const catLabel = el('span', { text: 'Categorías:', classes: ['selector-label'] });
  const chipsContainer = el('div', { classes: ['category-chips-container'] });
  
  categories.forEach(cat => {
    const isTodos = cat === 'TODOS';
    const isSelected = isTodos 
      ? options.selectedCategories.length === 0 
      : options.selectedCategories.includes(cat);
      
    const chip = el('button', { 
      classes: ['category-chip', isSelected ? 'active' : 'inactive'], 
      text: cat 
    });
    chip.onclick = () => options.onCategoryToggle(cat);
    chipsContainer.appendChild(chip);
  });
  
  const commToggle = el('label', { classes: ['comm-toggle'], html: `
    <input type="checkbox" ${includeCommission ? 'checked' : ''}>
    <span>Con Comisión</span>
  ` });
  commToggle.querySelector('input').onchange = (e) => onCommissionToggle(e.target.checked);
  
  selectorRow.appendChild(catLabel);
  selectorRow.appendChild(chipsContainer);
  selectorRow.appendChild(commToggle);
  statsArea.appendChild(selectorRow);
  
  if (options.selectedCategories.length > 0 || true) { // Always show stats area but filter shows totals if empty
    const labelSuffix = options.selectedCategories.length === 0 ? 'Totales' : options.selectedCategories.join(', ');
    const statsGrid = el('div', { classes: ['stats-grid'] });
    
    // Average Price Base
    statsGrid.appendChild(renderStatCard(
      `Precio Prom. [${labelSuffix}]`, 
      `$${categoryStats.avgPrice.toFixed(2)}`, 
      '💰'
    ));

    // Average Price with Commission (Always show as it's requested)
    statsGrid.appendChild(renderStatCard(
      `Precio c/Comis.`, 
      `$${categoryStats.avgPriceWithCommission.toFixed(2)}`, 
      '💸'
    ));

    statsGrid.appendChild(renderStatCard(
      'Kg Totales (Finalizados)', 
      `${categoryStats.totalKg.toLocaleString()} kg`, 
      '⚖️'
    ));
    
    // Factura/Op Metric (Mini badge or card)
    const facturaEmoji = categoryStats.hasFacturaWarning ? '⚠️' : '✅';
    statsGrid.appendChild(renderStatCard(
      'Factura / Operación', 
      `${(categoryStats.facturaOverOp * 100).toFixed(1)}% ${facturaEmoji}`, 
      '📄'
    ));

    statsGrid.appendChild(renderStatCard(
      'Viajes Incluidos', 
      `${categoryStats.travelCount}`, 
      '🚛'
    ));

    // Media Res Average Weight
    statsGrid.appendChild(renderStatCard(
      'Peso Media Res (Prom.)', 
      `${categoryStats.avgKgMediaRes.toFixed(2)} kg`, 
      '🥩'
    ));

    // Total Heads
    statsGrid.appendChild(renderStatCard(
      'Cabezas Totales', 
      `${categoryStats.totalQuantity}`, 
      '🐂'
    ));

    // MAG Comparison (Market Intelligence)
    const selectedCat = options.selectedCategories.length === 1 ? options.selectedCategories[0] : null;
    if (selectedCat && selectedCat !== 'TODOS') {
      MarketService.getReferencePrices().then(prices => {
        const ref = prices[selectedCat];
        if (ref) {
          const gap = MarketService.calculateGap(categoryStats.avgPrice, ref);
          const gapColor = gap > 0 ? '#ef4444' : '#10b981'; // Red if higher, Green if lower
          const sign = gap > 0 ? '+' : '';
          const gapEl = el('div', { 
            classes: ['stat-card', 'market-gap'], 
            html: `<div class="stat-icon">📈</div><div class="stat-info"><p>Vs Mercado (MAG)</p><h3 style="color: ${gapColor}">${sign}${gap.toFixed(1)}%</h3></div>` 
          });
          const refEl = el('div', { 
            classes: ['stat-card', 'market-ref'], 
            html: `
              <div class="stat-icon" title="Fuente: Mercado Agroganadero (MAG) - mercadoagroganadero.com.ar">🏷️</div>
              <div class="stat-info">
                <p>Precio MAG <a href="https://www.mercadoagroganadero.com.ar" target="_blank" title="Fuente: Mercado Agroganadero (MAG)" style="text-decoration:none; filter:grayscale(1); opacity:0.6; font-size:0.9em;">ℹ️</a></p>
                <h3>$${ref.toLocaleString()}</h3>
              </div>`
          });
          statsGrid.appendChild(gapEl);
          statsGrid.appendChild(refEl);
        }
      });
    }

    statsArea.appendChild(statsGrid);
  }
  
  container.appendChild(statsArea);
  
  // Toolbar (Filters & Sort)
  const toolbar = el('div', { classes: ['toolbar'] });
  
  const filterGroup = el('div', { classes: ['filter-group'] });
  ['TODOS', 'ACTIVO', 'BORRADOR'].forEach(f => {
    const btn = el('button', { 
      classes: ['filter-btn', currentFilter === f ? 'active' : 'none'], 
      text: f 
    });
    btn.onclick = () => onFilter(f);
    filterGroup.appendChild(btn);
  });
  
  const sortBtn = el('button', { 
    classes: ['sort-toggle'], 
    html: `📅 Fecha ${currentSort === 'DESC' ? '▼' : '▲'}` 
  });
  sortBtn.onclick = () => onSort(currentSort === 'DESC' ? 'ASC' : 'DESC');
  
  toolbar.appendChild(filterGroup);
  toolbar.appendChild(sortBtn);
  container.appendChild(toolbar);

  // Card List
  const list = el('div', { classes: ['card-list'] });
  data.forEach(travel => {
    const buy = travel.buy || {};
    const agentName = buy.agent?.name;
    const card = el('div', { classes: ['card', 'travel-card-full'] });
    
    const commission = buy.agentCommissionAmount || 0;
    const totalOp = buy.totalOperation || 0;
    const totalOpWithComm = buy.totalOperationWithCommission || 0;
    const yieldValue = buy.generalYield || 0;
    
    card.innerHTML = `
      <div class="card-header">
        <div class="header-main">
          <h3>${travel.truck?.name || 'Viaje #' + travel.id}</h3>
          <span class="card-subtitle">${travel.date || ''} - ${travel.description || ''}</span>
        </div>
        <div class="header-status">
          ${agentName ? `<span class="agent-badge">👤 ${agentName}</span>` : ''}
          <span class="status-badge ${travel.status?.toLowerCase() || 'borrador'}">${travel.status === 'DRAFT' ? 'BORRADOR' : (travel.status || 'BORRADOR')}</span>
        </div>
      </div>
    `;

    // Categories list from the buy entity
    const buyCategories = buy.categories || [];
    const buyCategoryDisplay = buyCategories.join(', ') || 'N/A';
    
    const cardBody = el('div', { classes: ['card-body'] });
    cardBody.innerHTML = `
      <div class="grid-2-cols">
        <div class="metrics-column">
          <h4>Economía</h4>
          <div class="detail-row"><span>Operación Total:</span> <strong>$${totalOp.toLocaleString()}</strong></div>
          <div class="detail-row"><span>Comisión Agente:</span> <strong>$${commission.toLocaleString()}</strong></div>
          <div class="detail-row highlight"><span>Total con Comis.:</span> <strong>$${totalOpWithComm.toLocaleString()}</strong></div>
          <div class="detail-row"><span>Precio Prom.:</span> <strong>$${buy.avgPrice?.toFixed(2) || '0.00'}</strong></div>
          <div class="detail-row"><span>Precio Prom. (c/Comis):</span> <strong>$${buy.avgPriceWithCommission?.toFixed(2) || '0.00'}</strong></div>
        </div>
        <div class="metrics-column">
          <h4>Rendimiento</h4>
          <div class="detail-row"><span>Categoría(s):</span> <strong>${buyCategoryDisplay}</strong></div>
          <div class="detail-row"><span>Cantidad:</span> <strong>${buy.totalQuantity || 0} unid.</strong></div>
          <div class="detail-row"><span>Kg Limpios:</span> <strong>${(buy.totalKgClean || 0).toLocaleString()} kg</strong></div>
          <div class="detail-row highlight"><span>Rendimiento Gral.:</span> <strong>${(yieldValue * 100).toFixed(2)}%</strong></div>
        </div>
      </div>
      <hr>
    `;

    const producersList = el('div', { classes: ['producers-list'] });
    (buy.listOfProducers || []).forEach(p => {
      const pItem = el('div', { classes: ['producer-item'] });
      const iva = p.totalIva || 0;
      const ganancias = p.totalGanancias || 0;
      const producerName = p.producer?.name || 'Productor';
      const cuit = p.producer?.cuit || '';
      const cbu = p.producer?.cbu || '';
      pItem.innerHTML = `
        <div class="producer-header">
          <strong>👤 ${producerName}</strong>
          <span>${p.origin || ''}</span>
        </div>
        <div class="producer-info">
          ${cuit ? `<span class="info-badge">CUIT: ${cuit}</span>` : ''}
          ${cbu ? `<span class="info-badge">CBU: ${cbu}</span>` : ''}
        </div>
        <div class="producer-taxes">
          ${iva > 0 ? `<span class="tax-badge tax-iva">IVA: $${iva.toLocaleString()}</span>` : ''}
          ${ganancias > 0 ? `<span class="tax-badge tax-ganancias">Gan: $${ganancias.toLocaleString()}</span>` : ''}
        </div>
      `;
      const pMiniList = el('div', { classes: ['product-mini-list'] });
      (p.listOfProducts || []).forEach(pr => {
        const row = el('div', { classes: ['product-mini-row'], html: `
          <span>${pr.name}: ${pr.quantity}x</span>
          <span>
            ${pr.kgClean.toLocaleString()} kg | 
            <b>Total Factura: $${pr.billFactura.toLocaleString()}</b>
          </span>
        ` });
        pMiniList.appendChild(row);
      });
      pItem.appendChild(pMiniList);
      producersList.appendChild(pItem);
    });

    cardBody.appendChild(producersList);
    card.appendChild(cardBody);
    list.appendChild(card);
  });
  container.appendChild(list);

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages > 1) {
    const pagin = el('div', { classes: ['pagination'] });
    
    const prevBtn = el('button', { classes: ['page-btn'], text: 'Anterior', attrs: currentPage === 1 ? { disabled: '' } : {} });
    prevBtn.onclick = () => onPage(currentPage - 1);
    
    const nextBtn = el('button', { classes: ['page-btn'], text: 'Siguiente', attrs: currentPage === totalPages ? { disabled: '' } : {} });
    nextBtn.onclick = () => onPage(currentPage + 1);
    
    const info = el('span', { classes: ['page-info'], text: `Página ${currentPage} de ${totalPages}` });
    
    pagin.appendChild(prevBtn);
    pagin.appendChild(info);
    pagin.appendChild(nextBtn);
    container.appendChild(pagin);
  }
}

/** Render Cost Simulator */
export function renderSimulator(container) {
  const wrapper = el('div', { classes: ['simulator-wrapper'] });
  const form = el('div', { classes: ['simulator-form', 'glass-card'] });
  form.innerHTML = `
    <h2>Simulador Costo Gancho</h2>
    <div class="form-group"><label>Rendimiento (%)</label><input type="number" id="sim-rend" value="58.5" step="0.1"></div>
    <div class="form-group"><label>Precio Vivo ($/kg)</label><input type="number" id="sim-precio" value="5050" step="10"></div>
    <div class="form-group"><label>Distancia (km)</label><input type="number" id="sim-dist" value="400" step="5"></div>
    <div class="form-group"><label>IIBB (%)</label><input type="number" id="sim-iibb" value="1.7" step="0.1"></div>
    <div class="form-group checkbox"><label>Jaula Doble</label><input type="checkbox" id="sim-doble" checked></div>
  `;
  
  const results = el('div', { classes: ['simulator-results', 'glass-card'] });
  results.id = 'sim-results';
  
  wrapper.appendChild(form);
  wrapper.appendChild(results);
  container.appendChild(wrapper);
  
  const update = () => {
    const config = {
      rendimiento: parseFloat(document.getElementById('sim-rend').value),
      precioVivo: parseFloat(document.getElementById('sim-precio').value),
      distancia: parseFloat(document.getElementById('sim-dist').value),
      porcentajeIIBB: parseFloat(document.getElementById('sim-iibb').value),
      jaulaDobleOrSimple: document.getElementById('sim-doble').checked
    };
    const sim = new CostSimulator(config);
    results.innerHTML = `
      <div class="res-item"><span>Kg Faena:</span> <strong>${sim.kgFaena.toFixed(0)} kg</strong></div>
      <div class="res-item"><span>Costo Hacienda:</span> <strong>$${sim.costoInicialPorKgCarne.toFixed(2)}</strong></div>
      <div class="res-item"><span>Costo Flete:</span> <strong>$${sim.costoFletePorKgCarne.toFixed(2)}</strong></div>
      <div class="res-item"><span>Costo IIBB:</span> <strong>$${sim.costoIIBB.toFixed(2)}</strong></div>
      <hr>
      <div class="res-item highlight"><span>Costo Final:</span> <strong>$${sim.costoFinal.toFixed(2)} /kg</strong></div>
      <div class="res-item active"><span>Factura Venta:</span> <strong>$${sim.facturaVentaPorKgCarne.toFixed(2)} /kg</strong></div>
      <div class="res-item utility"><span>Utilidad Total:</span> <strong>$${sim.utilidadTotalEstimada.toLocaleString()}</strong></div>
    `;
  };
    form.addEventListener('input', update);
    update();
}

/** 
 * Render Business Intelligence Dashboard
 * Historical Trends + Producer/Agent Comparison
 */
export function renderDashboard(container, options) {
  const { 
    data, categories, selectedCategories, includeCommission, 
    onCategoryToggle, onCommissionToggle 
  } = options;

  container.innerHTML = '';
  const wrapper = el('div', { classes: ['dashboard-wrapper'] });

  // 0. Header & Filters
  const header = el('div', { classes: ['dashboard-header', 'glass-card'] });
  header.innerHTML = `<h2>📊 Dashboard de Inteligencia</h2><p>Análisis de rendimiento y tendencias de precios.</p>`;
  
  const filtersArea = el('div', { classes: ['dashboard-filters', 'glass-card'] });
  const chipsContainer = el('div', { classes: ['category-chips-container'] });
  categories.forEach(cat => {
    const isTodos = cat === 'TODOS';
    const isSelected = isTodos ? selectedCategories.length === 0 : selectedCategories.includes(cat);
    const chip = el('button', { classes: ['category-chip', isSelected ? 'active' : 'inactive'], text: cat });
    chip.onclick = () => onCategoryToggle(cat);
    chipsContainer.appendChild(chip);
  });
  filtersArea.appendChild(chipsContainer);
  
  wrapper.appendChild(header);
  wrapper.appendChild(filtersArea);

  if (data.length === 0) {
    const emptyMsg = el('div', { classes: ['alert', 'info'], text: 'No hay datos suficientes para generar el dashboard.' });
    emptyMsg.style.marginTop = '2rem';
    wrapper.appendChild(emptyMsg);
    container.appendChild(wrapper);
    return;
  }

  // 1. Data Aggregation for Charts
  
  // A. Trends Aggregation (By Date)
  const trendsMap = {};
  data.forEach(t => {
    const date = t.date || 'Sin Fecha';
    if (!trendsMap[date]) trendsMap[date] = { totalPrice: 0, totalYield: 0, count: 0 };
    const buy = t.buy || {};
    const price = includeCommission ? (buy.avgPriceWithCommission || 0) : (buy.avgPrice || 0);
    const yieldVal = (buy.generalYield || 0) * 100;
    
    trendsMap[date].totalPrice += price;
    trendsMap[date].totalYield += yieldVal;
    trendsMap[date].count++;
  });
  const sortedDates = Object.keys(trendsMap).sort((a,b) => new Date(a) - new Date(b));
  
  // B. Comparison Aggregation (By Producer & Agent)
  const entityMap = {};
  data.forEach(t => {
    const buy = t.buy || {};
    const price = includeCommission ? (buy.avgPriceWithCommission || 0) : (buy.avgPrice || 0);
    const yieldVal = (buy.generalYield || 0) * 100;
    
    // Add Agent (Commission Agent)
    const agentName = buy.agent?.name;
    if (agentName) {
      if (!entityMap[agentName]) entityMap[agentName] = { totalPrice: 0, totalYield: 0, count: 0, type: 'AGENT' };
      entityMap[agentName].totalPrice += price;
      entityMap[agentName].totalYield += yieldVal;
      entityMap[agentName].count++;
    }
    
    // Add Producers
    (buy.listOfProducers || []).forEach(p => {
      const pName = p.producer?.name;
      if (pName) {
        if (!entityMap[pName]) entityMap[pName] = { totalPrice: 0, totalYield: 0, count: 0, type: 'PRODUCER' };
        entityMap[pName].totalPrice += price;
        entityMap[pName].totalYield += yieldVal;
        entityMap[pName].count++;
      }
    });
  });
  const entities = Object.keys(entityMap).sort();

  // 2. Chart Layout
  const chartGrid = el('div', { classes: ['chart-grid'] });
  
  const trendBox = el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>📈 Tendencias de Precio y Rendimiento</h3><div class="canvas-holder"><canvas id="trendChart"></canvas></div>' });
  const compareBox = el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>👥 Comparativa Productores / Comisionistas</h3><div class="canvas-holder"><canvas id="compareChart"></canvas></div>' });
  
  chartGrid.appendChild(trendBox);
  chartGrid.appendChild(compareBox);
  wrapper.appendChild(chartGrid);
  container.appendChild(wrapper);

  // 3. Render Charts with Chart.js
  
  // Clear previous instances
  if (chartInstances.trends) { chartInstances.trends.destroy(); chartInstances.trends = null; }
  if (chartInstances.compare) { chartInstances.compare.destroy(); chartInstances.compare = null; }

  const isDark = document.body.classList.contains('dark');
  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const borderColor = isDark ? 'rgba(132, 29, 29, 0.2)' : 'rgba(132, 29, 29, 0.1)';

  // Render Trend Chart
  chartInstances.trends = new Chart(document.getElementById('trendChart'), {
    type: 'line',
    data: {
      labels: sortedDates,
      datasets: [
        {
          label: 'Precio Promedio ($)',
          data: sortedDates.map(d => trendsMap[d].totalPrice / trendsMap[d].count),
          borderColor: '#841d1d',
          backgroundColor: 'rgba(132, 29, 29, 0.1)',
          yAxisID: 'y',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Rendimiento (%)',
          data: sortedDates.map(d => trendsMap[d].totalYield / trendsMap[d].count),
          borderColor: '#10b981',
          yAxisID: 'y1',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: borderColor } },
        y: { type: 'linear', display: true, position: 'left', ticks: { color: textColor, callback: (v) => '$' + v }, grid: { color: borderColor } },
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: textColor, callback: (v) => v + '%' } }
      }
    }
  });

  // Render Comparison Chart
  chartInstances.compare = new Chart(document.getElementById('compareChart'), {
    type: 'bar',
    data: {
      labels: entities,
      datasets: [
        {
          label: 'Precio Prom. ($)',
          data: entities.map(e => entityMap[e].totalPrice / entityMap[e].count),
          backgroundColor: entities.map(e => entityMap[e].type === 'AGENT' ? '#841d1d' : '#a1a1aa'),
          yAxisID: 'y'
        },
        {
          label: 'Rendimiento (%)',
          data: entities.map(e => entityMap[e].totalYield / entityMap[e].count),
          backgroundColor: '#10b981',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { labels: { color: textColor } },
        tooltip: { callbacks: { title: (items) => `${items[0].label} (${entityMap[items[0].label].type === 'AGENT' ? 'Comisionista' : 'Productor'})` } }
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: borderColor } },
        y: { type: 'linear', display: true, position: 'left', ticks: { color: textColor, callback: (v) => '$' + v }, grid: { color: borderColor } },
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: textColor, callback: (v) => v + '%' } }
      }
    }
  });
}

/** Render Export Modal */
export function renderExportModal({ onExport }) {
  const overlay = el('div', { classes: ['modal-overlay'] });
  const modal = el('div', { classes: ['modal'] });
  
  modal.innerHTML = `
    <h2>📄 Exportar Reporte PDF</h2>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">Selecciona el rango de viajes para incluir en el reporte.</p>
    
    <div class="form-group">
      <label>Criterio de Selección</label>
      <select id="export-type" class="form-input" style="width: 100%; border: 1px solid var(--border); padding: 0.75rem; border-radius: 12px; background: var(--bg-main); color: var(--text-main); margin-bottom: 1rem;">
        <option value="count">Últimos N Viajes</option>
        <option value="range">Rango de Fechas</option>
      </select>
    </div>

    <div id="export-count-section">
      <div class="form-group"><label>Cantidad de Viajes</label><input type="number" id="export-count" value="10" min="1" style="width: 100%;"></div>
    </div>

    <div id="export-range-section" style="display: none;">
      <div class="form-group"><label>Desde</label><input type="date" id="export-start" style="width: 100%;"></div>
      <div class="form-group"><label>Hasta</label><input type="date" id="export-end" style="width: 100%;"></div>
    </div>

    <div class="modal-actions">
      <button class="btn-outline" id="modal-cancel">Cancelar</button>
      <button class="btn-primary" id="modal-export" style="margin-top: 0; flex: 1;">Generar PDF</button>
    </div>
  `;

  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const typeSelect = modal.querySelector('#export-type');
  const countSec = modal.querySelector('#export-count-section');
  const rangeSec = modal.querySelector('#export-range-section');

  typeSelect.onchange = (e) => {
    countSec.style.display = e.target.value === 'count' ? 'block' : 'none';
    rangeSec.style.display = e.target.value === 'range' ? 'block' : 'none';
  };

  modal.querySelector('#modal-cancel').onclick = () => overlay.remove();
  modal.querySelector('#modal-export').onclick = () => {
    const type = typeSelect.value;
    let value = type === 'count' 
      ? modal.querySelector('#export-count').value 
      : { start: modal.querySelector('#export-start').value, end: modal.querySelector('#export-end').value };
    
    onExport({ type, value });
    overlay.remove();
  };
}

/** 
 * Generate Professional PDF Report 
 * Simple table-based report using jsPDF
 */
export async function generateTravelReport(travels) {
  const doc = new jsPDF();
  const primaryColor = [132, 29, 29]; // #841d1d
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('REPORTE DE VIAJES KMP', 15, 25);
  
  doc.setFontSize(10);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 150, 25);

  // Stats Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Resumen de Periodo', 15, 55);
  
  const totalKg = travels.reduce((sum, t) => sum + (t.buy?.totalKgClean || 0), 0);
  const totalOp = travels.reduce((sum, t) => sum + (t.buy?.totalOperation || 0), 0);
  const avgPrice = totalKg > 0 ? totalOp / totalKg : 0;

  doc.setFontSize(11);
  doc.text(`Total Viajes: ${travels.length}`, 15, 65);
  doc.text(`Kilos Totales: ${totalKg.toLocaleString()} kg`, 80, 65);
  doc.text(`Precio Promedio: $${avgPrice.toFixed(2)}`, 150, 65);

  // Table Body
  let y = 85;
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Detalle Viaje por Viaje', 15, y - 5);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  
  // Table Header row
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, 195, y);
  doc.text('ID / Camión', 15, y + 5);
  doc.text('Fecha', 60, y + 5);
  doc.text('Categorías', 90, y + 5);
  doc.text('Kg Limpios', 140, y + 5);
  doc.text('Precio Prom.', 170, y + 5);
  y += 10;
  doc.line(15, y, 195, y);
  y += 5;

  travels.forEach((t, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    
    const buy = t.buy || {};
    doc.setTextColor(0, 0, 0);
    doc.text(`${t.truck?.name || 'V' + t.id}`, 15, y);
    doc.text(`${t.date || ''}`, 60, y);
    doc.text(`${(buy.categories || []).join(', ').substring(0, 20)}`, 90, y);
    doc.text(`${(buy.totalKgClean || 0).toLocaleString()}`, 140, y);
    doc.text(`$${(buy.avgPrice || 0).toFixed(2)}`, 170, y);
    
    y += 8;
  });

  doc.save(`Reporte_Viajes_KMP_${Date.now()}.pdf`);
}
