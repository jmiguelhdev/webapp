import { CostSimulator } from './domain/entities/CostSimulator.js';
import Chart from 'chart.js/auto';
import { jsPDF } from 'jspdf';
import { MarketService } from './api/MarketService.js';
import { SettingsService } from './services/SettingsService.js';
import * as XLSX from 'xlsx';

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

/** Utility to render common Time Filter UI */
function renderTimeFilterUI(options) {
  const timeRow = el('div', { classes: ['selector-row'], style: 'margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; justify-content: flex-start;' });
  const timeLabel = el('span', { text: 'Período:', classes: ['selector-label'] });
  
  const timeSelect = el('select', { 
    classes: ['form-input'],
    style: 'border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 8px; background: var(--bg-main); color: var(--text-main); font-size: 0.9rem; cursor: pointer;',
    html: `
      <option value="all" ${options.timeFilterType === 'all' ? 'selected' : ''}>Todos los Viajes</option>
      <option value="count" ${options.timeFilterType === 'count' ? 'selected' : ''}>Últimos N Viajes</option>
      <option value="range" ${options.timeFilterType === 'range' ? 'selected' : ''}>Rango de Fechas</option>
    `
  });
  
  const timeControlsArea = el('div', { style: 'display: flex; gap: 0.5rem; align-items: center;' });
  
  const updateTimeUI = () => {
    timeControlsArea.innerHTML = '';
    const t = timeSelect.value;
    if (t === 'count') {
      const input = el('input', { attrs: { type: 'number', min: '1', value: options.timeFilterType === 'count' ? options.timeFilterValue : 10 }, style: 'width: 80px; padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);' });
      const applyBtn = el('button', { classes: ['btn-primary'], text: 'Aplicar', style: 'padding: 0.4rem 0.8rem; margin: 0; font-size: 0.85rem;' });
      applyBtn.onclick = () => options.onTimeFilter('count', input.value);
      timeControlsArea.appendChild(input);
      timeControlsArea.appendChild(applyBtn);
    } else if (t === 'range') {
      const val = options.timeFilterType === 'range' && options.timeFilterValue ? options.timeFilterValue : {};
      const today = new Date().toISOString().split('T')[0];
      const startInput = el('input', { attrs: { type: 'date', value: val.start || today }, style: 'padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);' });
      const endInput = el('input', { attrs: { type: 'date', value: val.end || today }, style: 'padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);' });
      const applyBtn = el('button', { classes: ['btn-primary'], text: 'Aplicar', style: 'padding: 0.4rem 0.8rem; margin: 0; font-size: 0.85rem;' });
      applyBtn.onclick = () => options.onTimeFilter('range', { start: startInput.value, end: endInput.value });
      timeControlsArea.appendChild(startInput);
      timeControlsArea.appendChild(endInput);
      timeControlsArea.appendChild(applyBtn);
    }
  };
  
  timeSelect.onchange = (e) => {
    if (e.target.value === 'all') {
      options.onTimeFilter('all', null);
    } else {
      updateTimeUI();
    }
  };
  updateTimeUI();
  
  timeRow.appendChild(timeLabel);
  timeRow.appendChild(timeSelect);
  timeRow.appendChild(timeControlsArea);
  
  return timeRow;
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
  
  const timeRow = renderTimeFilterUI(options);
  statsArea.appendChild(timeRow);
  
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

    // Nuevo: Rendimiento Promedio
    statsGrid.appendChild(renderStatCard(
      'Rendimiento Promedio', 
      `${(categoryStats.avgYield * 100).toFixed(2)}%`, 
      '📈'
    ));

    // Nuevo: Máximo Rendimiento
    const maxYieldLabel = categoryStats.maxYield > 0 ? `${(categoryStats.maxYield * 100).toFixed(2)}%` : 'N/A';
    const maxYieldSub = categoryStats.maxYield > 0 ? `<div style="font-size:0.7em; color:var(--text-muted);">${categoryStats.maxYieldEntity}</div>` : '';
    const maxYieldEl = el('div', { 
      classes: ['stat-card'], 
      html: `<div class="stat-icon">👑</div><div class="stat-info"><p>Rendimiento Máximo</p><h3>${maxYieldLabel}</h3>${maxYieldSub}</div>` 
    });
    statsGrid.appendChild(maxYieldEl);

    // Nuevo: Kg Faenados + Importe
    const totalCostoFaenados = categoryStats.totalKgFaena > 0 
      ? categoryStats.totalKgFaena * categoryStats.avgPriceWithCommission
      : 0;

    const kgFaenadosEl = el('div', { 
      classes: ['stat-card'], 
      html: `<div class="stat-icon">🔪</div><div class="stat-info"><p>Kilos Faenados</p><h3>${(categoryStats.totalKgFaena || 0).toLocaleString()} kg</h3><div style="font-size:0.8em; color:var(--text-muted); margin-top: 2px;">Costo total: $${totalCostoFaenados.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>` 
    });
    statsGrid.appendChild(kgFaenadosEl);

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
  
  const searchInput = el('input', { 
    classes: ['form-input'], 
    attrs: { type: 'text', placeholder: 'Buscar por productor, patente, chofer...', value: options.searchQuery || '' },
    style: 'flex: 1; min-width: 250px; padding: 0.6rem 1rem; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);'
  });
  searchInput.oninput = (e) => options.onSearch(e.target.value);

  // PDF Upload Button (New)
  const pdfUploadContainer = el('div', { style: 'display: flex; align-items: center; gap: 0.5rem;' });
  
  const pdfInput = el('input', { attrs: { type: 'file', accept: '.pdf', id: 'pdf-faena-input' }, style: 'display: none;' });
  const uploadBtn = el('button', { 
    classes: ['btn-primary'], 
    text: '📄 Subir PDF', 
    style: 'margin: 0; white-space: nowrap; background: #2563eb; font-size: 0.85rem; padding: 0.6rem 1rem;' 
  });
  uploadBtn.onclick = () => pdfInput.click();
  pdfInput.onchange = (e) => {
    if (e.target.files && e.target.files[0]) {
      options.onPdfUpload(e.target.files[0]);
    }
  };
  
  const scanInput = el('input', { attrs: { type: 'file', webkitdirectory: '', directory: '', multiple: '' }, style: 'display: none;' });
  const scanBtn = el('button', { 
    classes: ['btn-primary'], 
    text: '📁 Escanear Carpeta', 
    title: 'Escanear una carpeta local en busca de PDFs no procesados',
    style: 'margin: 0; white-space: nowrap; background: #059669; font-size: 0.85rem; padding: 0.6rem 1rem;' 
  });
  scanBtn.onclick = () => scanInput.click();
  scanInput.onchange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      options.onScanDirectory(Array.from(e.target.files));
    }
    scanInput.value = ''; // Reset for next use
  };

  pdfUploadContainer.appendChild(pdfInput);
  pdfUploadContainer.appendChild(uploadBtn);
  pdfUploadContainer.appendChild(scanInput);
  pdfUploadContainer.appendChild(scanBtn);

  toolbar.appendChild(filterGroup);
  toolbar.appendChild(searchInput);
  toolbar.appendChild(pdfUploadContainer);
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
  
  const timeRow = renderTimeFilterUI(options);
  filtersArea.appendChild(timeRow);

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
export function renderExportModal({ onExport, onExcelExport }) {
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
      <button class="btn-primary" id="modal-export" style="margin-top: 0; flex: 1; background: #841d1d;">PDF</button>
      <button class="btn-primary" id="modal-excel" style="margin-top: 0; flex: 1; background: #10b981;">Excel</button>
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

  modal.querySelector('#modal-excel').onclick = () => {
    const type = typeSelect.value;
    let value = type === 'count' 
      ? modal.querySelector('#export-count').value 
      : { start: modal.querySelector('#export-start').value, end: modal.querySelector('#export-end').value };
    
    onExcelExport({ type, value });
    overlay.remove();
  };
}

/** Render Scan Results Modal */
export function renderScanResultsModal({ newCount, existCount, errorCount, errorMessages }) {
  const overlay = el('div', { classes: ['modal-overlay'] });
  const modal = el('div', { classes: ['modal'], style: 'max-width: 600px; max-height: 80vh; overflow-y: auto;' });
  
  const hasErrors = errorMessages.length > 0;
  
  let html = `
    <h2 style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
      📂 Resultados del Escaneo
    </h2>
    <div style="background: var(--bg-hover); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
      <div style="color: #10b981; margin-bottom: 0.5rem; font-weight: 500;">✅ ${newCount} PDFs nuevos procesados exitosamente</div>
      <div style="color: #60a5fa; margin-bottom: 0.5rem; font-weight: 500;">⏭️ ${existCount} PDFs ya existían (omitidos)</div>
      <div style="color: #ef4444; font-weight: 500;">❌ ${errorCount} errores encontrados</div>
    </div>
  `;

  if (hasErrors) {
    // Generate a simple list for text copying
    const errorText = errorMessages.map(msg => msg).join('\n\n');
    html += `
      <h3 style="margin-bottom: 0.5rem; color: var(--text-main); font-size: 1rem;">Detalle de Errores:</h3>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem;">
        Puedes seleccionar y copiar el texto a continuación si necesitas analizar los errores.
      </p>
      <textarea readonly style="
        width: 100%; 
        height: 150px; 
        background: var(--bg-main); 
        color: #ef4444; 
        border: 1px solid var(--border); 
        border-radius: 8px; 
        padding: 0.75rem; 
        font-family: monospace; 
        font-size: 0.85rem;
        resize: vertical;
      ">${errorText}</textarea>
    `;
  }

  html += `
    <div class="modal-actions" style="margin-top: 1.5rem;">
      <button class="btn-primary" id="modal-close" style="width: 100%;">Aceptar</button>
    </div>
  `;

  modal.innerHTML = html;

  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector('#modal-close').onclick = () => overlay.remove();
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

/**
 * Generate Excel (XLSX) Accounting Report using flattened producer data
 */
export async function generateExcelReport(travels) {
  const rows = [];
  
  travels.forEach(t => {
    const buy = t.buy || {};
    const truckName = t.truck?.name || 'N/A';
    const plate = t.truck?.licensePlate || 'N/A';
    const driver = t.driver?.name || 'N/A';
    const agent = buy.agent?.name || 'N/A';
    
    (buy.listOfProducers || []).forEach(p => {
      const producerName = p.producer?.name || 'N/A';
      const producerCuit = p.producer?.cuit || 'N/A';
      
      // Categorías del productor
      const pCategories = (p.listOfProducts || []).map(pr => pr.name).join(', ');
      
      rows.push({
        'Fecha': t.date || '',
        'ID Viaje': t.id,
        'Camión': truckName,
        'Patente': plate,
        'Chofer': driver,
        'Comisionista': agent,
        'Productor': producerName,
        'CUIT Productor': producerCuit,
        'Categorías': pCategories,
        'Cabezas': p.totalQuantity || 0,
        'Kg Limpios': p.totalKgClean || 0,
        'Precio Promedio': p.avgPrice?.toFixed(2) || '0.00',
        'Neto ($)': p.totalOperation || 0,
        'IVA ($)': p.totalIva || 0,
        'Ganancias ($)': p.totalGanancias || 0,
        'Total Factura ($)': p.totalBillFactura || 0
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Contable");
  
  // Auto-width columns
  const wscols = Object.keys(rows[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Reporte_Contable_KMP_${Date.now()}.xlsx`);
}

/** Render Settings Panel */
export function renderSettings(container, options) {
  const currentSettings = SettingsService.loadSettings();
  
  const wrapper = el('div', { classes: ['simulator-wrapper'] }); // Reusing layout for settings form
  const form = el('div', { classes: ['simulator-form', 'glass-card'], style: 'grid-column: 1 / -1; max-width: 600px; margin: 0 auto;' });
  
  form.innerHTML = `
    <h2 style="color: var(--primary); margin-bottom: 1.5rem;">⚙️ Configuración Logística</h2>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">Ajustá los valores predeterminados para las simulaciones y simulador de costos. Estos cambios solo afectan a tu navegador local.</p>
    
    <div class="form-group">
      <label>Margen Operativo (%)</label>
      <input type="number" id="set-margen" value="${((currentSettings.margenGanancia - 1) * 100).toFixed(0)}" step="1">
    </div>
    
    <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; font-size: 1.1rem;">🚛 Jaula Doble</h3>
    <div class="grid-2-cols" style="gap: 1rem; margin-bottom: 0;">
      <div class="form-group"><label>Kg Capacidad</label><input type="number" id="set-jdd-kg" value="${currentSettings.pesoJaulaDoble}" step="100"></div>
      <div class="form-group"><label>Precio Flete ($/km)</label><input type="number" id="set-jdd-km" value="${currentSettings.precioKmDouble}" step="50"></div>
    </div>

    <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; font-size: 1.1rem;">🚚 Jaula Simple</h3>
    <div class="grid-2-cols" style="gap: 1rem; margin-bottom: 0;">
      <div class="form-group"><label>Kg Capacidad</label><input type="number" id="set-js-kg" value="${currentSettings.pesoJaulaSimple}" step="100"></div>
      <div class="form-group"><label>Precio Flete ($/km)</label><input type="number" id="set-js-km" value="${currentSettings.precioKmSimple}" step="50"></div>
    </div>
    
    <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
    
    <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">💸 Precios por Categoría ($/kg)</h3>
    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">Precios sugeridos para el despacho de carne a clientes.</p>
    <div id="category-prices-grid" class="grid-2-cols" style="gap: 1.5rem; margin-bottom: 2rem;">
      <div class="loading">Cargando precios...</div>
    </div>

    <div style="display: flex; gap: 1rem;">
      <button class="btn-primary" id="save-settings">Guardar Cambios</button>
      <button class="btn-outline" id="reset-settings">Restaurar Valores por Defecto</button>
    </div>
    <div id="settings-msg" style="margin-top: 1rem; color: var(--success); font-weight: 500; display: none;">¡Configuración guardada exitosamente!</div>

    <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
    
    <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">👥 Gestión de Clientes</h3>
    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">Crea o modifica información de facturación de los clientes.</p>
    
    <div class="glass-card" style="margin-bottom: 2rem; border-left: 4px solid var(--primary);">
      <h4 style="margin-bottom: 1rem;" id="client-form-title">Añadir Nuevo Cliente</h4>
      <input type="hidden" id="client-id" value="">
      <div class="grid-2-cols" style="gap: 1rem; margin-bottom: 0;">
        <div class="form-group" style="margin: 0;"><label>Razón Social / Nombre *</label><input type="text" id="client-name" class="form-input"></div>
        <div class="form-group" style="margin: 0;"><label>CUIT</label><input type="text" id="client-cuit" class="form-input"></div>
        <div class="form-group" style="margin: 0;"><label>Dirección</label><input type="text" id="client-address" class="form-input"></div>
        <div class="form-group" style="margin: 0;"><label>Teléfono</label><input type="text" id="client-phone" class="form-input"></div>
        <div class="form-group" style="margin: 0;"><label>CBU</label><input type="text" id="client-cbu" class="form-input"></div>
        <div class="form-group" style="margin: 0;"><label>Nº Cuenta</label><input type="text" id="client-account" class="form-input"></div>
      </div>
      <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
        <button class="btn-primary" id="save-client-btn" style="margin: 0;">Guardar Cliente</button>
        <button class="btn-outline" id="clear-client-btn" style="margin: 0;">Limpiar Campos</button>
      </div>
    </div>

    <div id="settings-clients-list" class="card-list" style="margin-bottom: 2rem;"></div>
  `;
  
  wrapper.appendChild(form);
  container.appendChild(wrapper);

  const priceGrid = document.getElementById('category-prices-grid');
  const categories = ['NOVILLO', 'VACA', 'VAQUILLONA', 'TORO', 'OTRO'];
  
  const renderPriceInputs = (prices = {}) => {
    priceGrid.innerHTML = '';
    categories.forEach(cat => {
      const fg = el('div', { classes: ['form-group'], style: 'margin: 0;' });
      fg.innerHTML = `<label>${cat}</label><input type="number" class="cat-price-input" data-cat="${cat}" value="${prices[cat] || ''}" placeholder="Ej: 5000">`;
      priceGrid.appendChild(fg);
    });
  };

  if (options && options.categoryPrices) {
    renderPriceInputs(options.categoryPrices);
  } else {
    renderPriceInputs({});
  }

  const renderClientsList = (clientsList = []) => {
    const listEl = document.getElementById('settings-clients-list');
    listEl.innerHTML = '';
    clientsList.forEach(c => {
      const card = el('div', { classes: ['card', 'glass-card'], style: 'padding: 1rem; display: flex; justify-content: space-between; align-items: center;' });
      card.innerHTML = `
        <div>
          <h4 style="margin: 0 0 0.3rem 0;">${c.name}</h4>
          <span style="font-size: 0.8rem; color: var(--text-muted);">CUIT: ${c.cuit || '-'} | Tel: ${c.phone || '-'}</span>
        </div>
        <button class="btn-outline edit-client-btn" data-id="${c.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Editar</button>
      `;
      listEl.appendChild(card);
    });

    listEl.querySelectorAll('.edit-client-btn').forEach(btn => {
      btn.onclick = () => {
        const c = clientsList.find(x => x.id === btn.dataset.id);
        if (c) {
          document.getElementById('client-id').value = c.id || '';
          document.getElementById('client-name').value = c.name || '';
          document.getElementById('client-cuit').value = c.cuit || '';
          document.getElementById('client-address').value = c.address || '';
          document.getElementById('client-phone').value = c.phone || '';
          document.getElementById('client-cbu').value = c.cbu || '';
          document.getElementById('client-account').value = c.account || '';
          document.getElementById('client-form-title').textContent = 'Editar Cliente: ' + c.name;
          document.getElementById('client-name').focus();
          window.scrollTo({ top: document.getElementById('client-form-title').offsetTop - 20, behavior: 'smooth' });
        }
      };
    });
  };

  if (options && options.clients) {
    renderClientsList(options.clients);
  }

  const msgBox = document.getElementById('settings-msg');
  const showMsg = (text, isError = false) => {
    msgBox.textContent = text;
    msgBox.style.color = isError ? 'var(--danger)' : 'var(--success)';
    msgBox.style.display = 'block';
    setTimeout(() => { msgBox.style.display = 'none'; }, 3000);
  };

  document.getElementById('save-settings').onclick = async () => {
    const newSettings = {
      margenGanancia: 1 + (parseFloat(document.getElementById('set-margen').value) / 100),
      pesoJaulaDoble: parseFloat(document.getElementById('set-jdd-kg').value),
      precioKmDouble: parseFloat(document.getElementById('set-jdd-km').value),
      pesoJaulaSimple: parseFloat(document.getElementById('set-js-kg').value),
      precioKmSimple: parseFloat(document.getElementById('set-js-km').value),
    };
    
    const prices = {};
    document.querySelectorAll('.cat-price-input').forEach(input => {
      prices[input.dataset.cat] = parseFloat(input.value) || 0;
    });

    if (SettingsService.saveSettings(newSettings)) {
      if (options && options.onSavePrices) {
        await options.onSavePrices(prices);
      }
      showMsg('¡Configuración de precios y general guardada exitosamente!');
    } else {
      showMsg('Hubo un error al guardar general.', true);
    }
  };

  document.getElementById('reset-settings').onclick = () => {
    const defaults = SettingsService.getDefaults();
    document.getElementById('set-margen').value = ((defaults.margenGanancia - 1) * 100).toFixed(0);
    document.getElementById('set-jdd-kg').value = defaults.pesoJaulaDoble;
    document.getElementById('set-jdd-km').value = defaults.precioKmDouble;
    document.getElementById('set-js-kg').value = defaults.pesoJaulaSimple;
    document.getElementById('set-js-km').value = defaults.precioKmSimple;
    
    SettingsService.saveSettings(defaults);
    showMsg('¡Restaurado a los valores originales!');
  };

  const clearClientForm = () => {
    document.getElementById('client-id').value = '';
    document.getElementById('client-name').value = '';
    document.getElementById('client-cuit').value = '';
    document.getElementById('client-address').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('client-cbu').value = '';
    document.getElementById('client-account').value = '';
    document.getElementById('client-form-title').textContent = 'Añadir Nuevo Cliente';
  };

  document.getElementById('clear-client-btn').onclick = clearClientForm;

  document.getElementById('save-client-btn').onclick = async () => {
    const name = document.getElementById('client-name').value.trim();
    if (!name) return alert('El nombre o razón social es obligatorio');
    
    const clientData = {
      id: document.getElementById('client-id').value || null,
      name,
      cuit: document.getElementById('client-cuit').value,
      address: document.getElementById('client-address').value,
      phone: document.getElementById('client-phone').value,
      cbu: document.getElementById('client-cbu').value,
      account: document.getElementById('client-account').value,
    };
    if (!clientData.id) delete clientData.id;

    document.getElementById('save-client-btn').textContent = 'Guardando...';
    document.getElementById('save-client-btn').disabled = true;

    if (options && options.onSaveClient) {
       await options.onSaveClient(clientData);
       showMsg('Cliente guardado exitosamente.');
       clearClientForm();
       if (options.onReloadClients) {
         options.onReloadClients();
       }
    } else {
      document.getElementById('save-client-btn').textContent = 'Guardar Cliente';
      document.getElementById('save-client-btn').disabled = false;
    }
  };
}

/** 
 * Render Faena Consumption Module 
 */
export function renderFaenaConsumption(container, options) {
  const { 
    state, 
    stockItems, 
    historyItems,
    onTabSwitch,
    onToggleSelection,
    onSelectAll,
    onClearSelection,
    onDestinationInput,
    onDispatch,
    onFilterChange,
    onToggleSort,
    onStockSearch,
    onCategoryChange
  } = options;

  // Capture current focus info to restore it after re-render
  const activeId = document.activeElement ? document.activeElement.id : null;
  const selectionStart = document.activeElement ? document.activeElement.selectionStart : null;
  const selectionEnd = document.activeElement ? document.activeElement.selectionEnd : null;

  container.innerHTML = '';
  const wrapper = el('div', { classes: ['dashboard', 'fade-in'] });

  // 1. Header & Tabs
  const header = el('div', { classes: ['dashboard-header'] });
  header.innerHTML = `<h2>🥩 Módulo Faena</h2>`;
  
  const tabs = el('div', { classes: ['dashboard-filters'] });
  const btnStock = el('button', { classes: [state.activeTab === 'STOCK' ? 'btn-primary' : 'btn-outline'], text: 'Inventario Disponible' });
  const btnHistory = el('button', { classes: [state.activeTab === 'HISTORY' ? 'btn-primary' : 'btn-outline'], text: 'Historial de Despachos' });
  
  btnStock.onclick = () => onTabSwitch('STOCK');
  btnHistory.onclick = () => onTabSwitch('HISTORY');

  tabs.appendChild(btnStock);
  tabs.appendChild(btnHistory);
  header.appendChild(tabs);
  wrapper.appendChild(header);

  // Global Category Chips
  const categoryFilters = el('div', { classes: ['dashboard-filters'], style: 'margin-bottom: 2rem; justify-content: flex-start; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem;' });
  const categories = ['ALL', 'NOVILLO', 'VACA', 'VAQUILLONA', 'TORO', 'OTRO'];
  const catNames = { 'ALL': 'Todas', 'NOVILLO': 'Novillo', 'VACA': 'Vaca', 'VAQUILLONA': 'Vaquillona', 'TORO': 'Toro', 'OTRO': 'Otro' };
  
  categories.forEach(cat => {
    const isCatActive = state.categoryFilter === cat;
    const catBtn = el('button', { 
      classes: ['filter-chip'], 
      text: catNames[cat],
      style: `
        padding: 0.4rem 1rem; 
        border-radius: 20px; 
        font-size: 0.85rem; 
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid ${isCatActive ? 'var(--primary)' : 'var(--border)'};
        background: ${isCatActive ? 'var(--primary)' : 'transparent'};
        color: ${isCatActive ? '#ffffff' : 'var(--text-main)'};
      `
    });
    catBtn.onclick = () => onCategoryChange(cat);
    categoryFilters.appendChild(catBtn);
  });
  
  wrapper.appendChild(categoryFilters);

  if (state.activeTab === 'STOCK') {
    // --- STOCK VIEW ---

    // Stats Grid
    const totals = stockItems.reduce((acc, item) => {
      acc.kg += item.kg || 0;
      acc.count += 1;
      const cat = item.standardizedCategory || 'OTRO';
      if (!acc.byCategory[cat]) acc.byCategory[cat] = { kg: 0, count: 0 };
      acc.byCategory[cat].kg += item.kg || 0;
      acc.byCategory[cat].count += 1;
      return acc;
    }, { kg: 0, count: 0, byCategory: {} });

    const statsGrid = el('div', { classes: ['stats-grid'] });
    const addStat = (title, val, subtitle) => {
      statsGrid.appendChild(el('div', { classes: ['stat-card', 'glass-card'], html: `<h3>${title}</h3><div class="stat-value">${val}</div><div class="stat-subtitle">${subtitle}</div>` }));
    };

    addStat('Total Reses', totals.count, `${totals.kg.toFixed(1)} kg Colgados`);
    Object.keys(totals.byCategory).forEach(cat => {
      addStat(`Stock ${cat}`, totals.byCategory[cat].count, `${totals.byCategory[cat].kg.toFixed(1)} kg`);
    });
    wrapper.appendChild(statsGrid);

    // Dispatch Panel (If items selected)
    if (state.selectedIds.size > 0) {
      const selectedItems = stockItems.filter(i => state.selectedIds.has(i.id));
      const selKg = selectedItems.reduce((s, i) => s + (i.kg || 0), 0);
      const estPrice = parseFloat(state.priceInput) || 0;
      const totalEst = selKg * estPrice;

      const panel = el('div', { classes: ['glass-card'], style: 'margin-bottom: 2rem; border-left: 4px solid #ef4444; background: var(--bg-hover); padding: 1.5rem;' });
      panel.innerHTML = `
        <h3 style="margin-bottom: 1.5rem; color: #ef4444; display: flex; align-items: center; justify-content: space-between;">
          <span>📦 Preparando Despacho: ${selectedItems.length} piezas (${selKg.toFixed(1)} kg)</span>
          <button id="clear-sel-btn" class="btn-outline" style="font-size: 0.8rem; padding: 0.2rem 0.6rem;">Limpiar Selección</button>
        </h3>
        
        <div class="grid-2-cols" style="gap: 1rem; align-items: flex-end; margin-bottom: 1rem;">
          <div class="form-group" style="margin: 0; position: relative;">
            <label>Destino / Cliente</label>
            <input type="text" id="dispatch-dest" class="form-input" list="clients-list" style="width: 100%;" placeholder="Ej: Carnicería Centro" value="${state.destinationInput}">
            <datalist id="clients-list">
              ${(options.clients || []).map(c => `<option value="${c.name}">`).join('')}
            </datalist>
          </div>
          <div class="form-group" style="margin: 0;">
            <label>Precio por Kg ($/kg)</label>
            <input type="number" id="dispatch-price" class="form-input" style="width: 100%;" placeholder="0.00" value="${state.priceInput}">
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border);">
          <div style="font-size: 1.1rem; font-weight: 600;">
            Total Estimado: <span style="color: #10b981;">$${totalEst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <button id="dispatch-btn" class="btn-primary" style="background: #ef4444; margin: 0; width: auto; min-width: 151px;">🚚 Confirmar Salida</button>
        </div>
      `;
      wrapper.appendChild(panel);

      panel.querySelector('#dispatch-dest').addEventListener('input', (e) => onDestinationInput(e.target.value));
      panel.querySelector('#dispatch-price').addEventListener('input', (e) => onPriceInput(e.target.value));
      panel.querySelector('#clear-sel-btn').onclick = () => onClearSelection();
      panel.querySelector('#dispatch-btn').onclick = () => onDispatch();
    }

    // List Container
    const listCard = el('div', { classes: ['glass-card'], style: 'flex: 1;' });
    
    // Header row of list
    const listHeader = el('div', { style: 'display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap;' });
    
    const stockSearchInput = el('input', { 
        classes: ['form-input'], 
        style: 'flex: 1; max-width: 300px; padding: 0.5rem; font-size: 0.9rem;',
        attrs: { id: 'stock-search', type: 'text', placeholder: '🔎 Buscar Tropa, Garron, Kg...', value: state.stockSearch }
    });
    stockSearchInput.addEventListener('input', (e) => onStockSearch(e.target.value));

    listHeader.innerHTML = `<h3 style="margin: 0; min-width: 200px;">Medias Reses en Cámara</h3>`;
    listHeader.appendChild(stockSearchInput);
    listHeader.appendChild(el('div', { style: 'flex-grow: 1;' }));
    
    const selectAllBtn = el('button', { classes: ['btn-outline'], text: 'Seleccionar Todas', style: 'font-size: 0.8rem;' });
    selectAllBtn.onclick = () => onSelectAll(stockItems.map(i => i.id));
    listHeader.appendChild(selectAllBtn);
    listCard.appendChild(listHeader);

    // Table
    const tableWrap = el('div', { style: 'overflow-x: auto;' });
    const table = document.createElement('table');
    table.className = 'faena-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.textAlign = 'left';
    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted);">
          <th style="padding: 1rem; width: 50px;">Sel</th>
          <th id="sort-garron-stock" style="padding: 1rem; cursor: pointer; user-select: none;" title="Ordenar por Número de Garron">
            Nº Garron ${state.sortOrder === 'asc' ? '▲' : '▼'}
          </th>
          <th style="padding: 1rem;">Mitad (Mz)</th>
          <th style="padding: 1rem;">Categoría</th>
          <th style="padding: 1rem;">Kilos</th>
          <th style="padding: 1rem;">Ingreso</th>
        </tr>
      </thead>
      <tbody id="stock-tbody"></tbody>
    `;

    table.querySelector('#sort-garron-stock').onclick = () => onToggleSort();

    const tbody = table.querySelector('#stock-tbody');
    if (stockItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-muted);">No hay stock disponible. Carga reportes de faena desde la pestaña Viajes.</td></tr>`;
    } else {
      stockItems.forEach(item => {
        const isSel = state.selectedIds.has(item.id);
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border)';
        tr.style.background = isSel ? 'rgba(239, 68, 68, 0.1)' : 'transparent';
        tr.style.cursor = 'pointer';
        
        tr.innerHTML = `
          <td style="padding: 1rem;"><input type="checkbox" ${isSel ? 'checked' : ''} style="transform: scale(1.2); cursor: pointer; pointer-events: none;"></td>
          <td style="padding: 1rem; font-weight: 500;">#${item.garron}</td>
          <td style="padding: 1rem;">Mitad ${item.half || '1'}</td>
          <td style="padding: 1rem;">${item.standardizedCategory || item.category}</td>
          <td style="padding: 1rem; font-weight: bold; color: #10b981;">${item.kg.toFixed(1)} kg</td>
          <td style="padding: 1rem; font-size: 0.85rem; color: var(--text-muted);">${item.pdfDate} (Tr. ${item.tropa})</td>
        `;
        
        tr.onclick = (e) => {
          if (e.target.tagName !== 'INPUT') {
            onToggleSelection(item.id);
          } else {
            e.preventDefault();
            onToggleSelection(item.id);
          }
        };
        tbody.appendChild(tr);
      });
    }

    tableWrap.appendChild(table);
    listCard.appendChild(tableWrap);
    wrapper.appendChild(listCard);

  } else {
    // --- HISTORY VIEW ---
    const filterPanel = el('div', { classes: ['glass-card'], style: 'margin-bottom: 1.5rem; display: flex; gap: 1rem;' });
    filterPanel.innerHTML = `
      <div class="form-group" style="flex: 1; margin: 0;">
        <label>Búsqueda General</label>
        <input type="text" id="hist-search" class="form-input" placeholder="Tropa, Garron, Kg..." value="${state.historyFilters.search || ''}">
      </div>
      <div class="form-group" style="flex: 1.5; margin: 0;">
        <label>Destino / Cliente</label>
        <input type="text" id="hist-dest" class="form-input" placeholder="Buscar carnicería..." value="${state.historyFilters.destination}">
      </div>
      <div class="form-group" style="flex: 1; margin: 0;">
        <label>Fecha de Salida</label>
        <input type="date" id="hist-date" class="form-input" value="${state.historyFilters.date}">
      </div>
    `;
    wrapper.appendChild(filterPanel);

    filterPanel.querySelector('#hist-search').addEventListener('input', (e) => onFilterChange('search', e.target.value));
    filterPanel.querySelector('#hist-dest').addEventListener('input', (e) => onFilterChange('destination', e.target.value));
    filterPanel.querySelector('#hist-date').addEventListener('change', (e) => onFilterChange('date', e.target.value));

    const histCard = el('div', { classes: ['glass-card'] });
    histCard.innerHTML = `<h3 style="margin-bottom: 1rem;">Historial Integrado</h3>`;
    
    const tableWrap = el('div', { style: 'overflow-x: auto;' });
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.textAlign = 'left';
    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted);">
          <th style="padding: 1rem;">Fecha Salida</th>
          <th style="padding: 1rem;">Destino / Cliente</th>
          <th id="sort-garron-hist" style="padding: 1rem; cursor: pointer; user-select: none;">
            Nº Garron ${state.sortOrder === 'asc' ? '▲' : '▼'}
          </th>
          <th style="padding: 1rem;">Mitad (Mz)</th>
          <th style="padding: 1rem;">Categoría</th>
          <th style="padding: 1rem;">Kilos</th>
        </tr>
      </thead>
      <tbody>
        ${historyItems.length === 0 ? `<tr><td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-muted);">No se encontraron salidas.</td></tr>` : 
          historyItems.map(h => `
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 1rem;">${h.dispatchDate ? new Date(h.dispatchDate).toLocaleDateString() : 'N/A'}</td>
              <td style="padding: 1rem; font-weight: 500; color: #ef4444;">${h.destination || 'Sin Destino'}</td>
              <td style="padding: 1rem;">#${h.garron}</td>
              <td style="padding: 1rem;">Mitad ${h.half || '1'}</td>
              <td style="padding: 1rem;">${h.standardizedCategory || h.category}</td>
              <td style="padding: 1rem;">${h.kg ? h.kg.toFixed(1) : 0} kg</td>
            </tr>
          `).join('')
        }
      </tbody>
    `;
    tableWrap.appendChild(table);
    
    table.querySelector('#sort-garron-hist').onclick = () => onToggleSort();

    histCard.appendChild(tableWrap);
    wrapper.appendChild(histCard);
  }

  container.appendChild(wrapper);

  // Restore focus and cursor position
  if (activeId) {
    const elToFocus = document.getElementById(activeId);
    if (elToFocus) {
      elToFocus.focus();
      if (selectionStart !== null && selectionEnd !== null && (elToFocus.type === 'text' || elToFocus.type === 'search')) {
        elToFocus.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }
}

/** 
 * Render Client Accounts System
 */
export function renderClientAccounts(options) {
  const { clients, selectedClient, transactions, onSelectClient, onAddPayment, onBack } = options;
  const container = document.getElementById('content');
  container.innerHTML = '';
  const wrapper = el('div', { classes: ['dashboard', 'fade-in'] });

  if (selectedClient) {
    // --- DETAILS VIEW ---
    const header = el('div', { classes: ['dashboard-header'] });
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button id="back-clients" class="btn-outline" style="padding: 0.5rem;">⬅️ Volver</button>
        <h2 style="margin: 0;">👤 ${selectedClient.name}</h2>
      </div>
    `;
    wrapper.appendChild(header);

    const statsGrid = el('div', { classes: ['stats-grid'], style: 'margin-bottom: 2rem;' });
    const addStat = (title, val, color) => {
      statsGrid.appendChild(el('div', { classes: ['stat-card', 'glass-card'], html: `<h3>${title}</h3><div class="stat-value" style="color: ${color};">${val}</div>` }));
    };

    const debt = transactions.filter(t => t.type === 'DEBT').reduce((sum, t) => sum + (t.amount || 0), 0);
    const payments = transactions.filter(t => t.type === 'PAYMENT').reduce((sum, t) => sum + (t.amount || 0), 0);
    const balance = debt - payments;

    addStat('Deuda Total', `$${debt.toLocaleString()}`, 'var(--text-main)');
    addStat('Pagos Totales', `$${payments.toLocaleString()}`, '#10b981');
    addStat('Saldo Pendiente', `$${balance.toLocaleString()}`, balance > 0 ? '#ef4444' : '#10b981');
    wrapper.appendChild(statsGrid);

    // Form to add payment
    const paymentCard = el('div', { classes: ['glass-card'], style: 'margin-bottom: 2rem; border-left: 4px solid #10b981;' });
    paymentCard.innerHTML = `
      <h3 style="margin-bottom: 1rem; color: #10b981;">➕ Registrar Pago</h3>
      <div style="display: flex; gap: 1rem; align-items: flex-end;">
        <div class="form-group" style="flex: 1; margin: 0;"><label>Monto ($)</label><input type="number" id="pay-amount" class="form-input" placeholder="0.00"></div>
        <div class="form-group" style="flex: 2; margin: 0;"><label>Descripción / Concepto</label><input type="text" id="pay-desc" class="form-input" placeholder="Ej: Pago efectivo, Transferencia..."></div>
        <button id="pay-btn" class="btn-primary" style="background: #10b981; margin: 0;">Registrar</button>
      </div>
    `;
    wrapper.appendChild(paymentCard);

    // Transactions Table
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
            return `
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem;">${new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                <td style="padding: 1rem;">${t.description || (isDebt ? 'Despacho' : 'Pago')}</td>
                <td style="padding: 1rem; color: #ef4444; font-weight: 500;">${isDebt ? '$' + t.amount.toLocaleString() : '-'}</td>
                <td style="padding: 1rem; color: #10b981; font-weight: 500;">${!isDebt ? '$' + t.amount.toLocaleString() : '-'}</td>
                <td style="padding: 1rem;">
                  ${t.breakout ? `<button class="btn-outline view-detail-btn" data-id="${t.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Ver Detalle</button>` : ''}
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
      if (amt) onAddPayment(amt, desc);
    };

    // Detail Logic
    wrapper.querySelectorAll('.view-detail-btn').forEach(btn => {
      btn.onclick = () => {
        const tx = transactions.find(t => t.id === btn.dataset.id);
        if (tx && tx.breakout) {
          renderTransactionDetailModal(tx);
        }
      };
    });

  } else {
    // --- LIST VIEW ---
    const header = el('div', { classes: ['dashboard-header'] });
    header.innerHTML = `<h2>👥 Cuentas de Clientes</h2><p>Administración de saldos y cobranzas.</p>`;
    wrapper.appendChild(header);

    const clientGrid = el('div', { classes: ['card-list'] });
    if (clients.length === 0) {
      const emptyMsg = el('div', { classes: ['glass-card'], style: 'padding: 3rem; text-align: center; grid-column: 1 / -1;' });
      emptyMsg.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
        <h3>No hay clientes registrados</h3>
        <p style="color: var(--text-muted);">Puedes agregar clientes desde la configuración del sistema.</p>
        <button id="go-to-settings" class="btn-primary" style="margin-top: 1.5rem;">Ir a Configuración</button>
      `;
      emptyMsg.querySelector('#go-to-settings').onclick = () => {
        // Trigger a click on the settings menu item
        const settingsLi = document.querySelector('li[data-view="settings"]');
        if (settingsLi) settingsLi.click();
      };
      clientGrid.appendChild(emptyMsg);
    } else {
      clients.forEach(c => {
      const card = el('div', { classes: ['card', 'glass-card'], style: 'cursor: pointer; transition: transform 0.2s;' });
      const balanceColor = (c.balance || 0) > 0 ? '#ef4444' : '#10b981';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="margin: 0 0 0.5rem 0;">${c.name}</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">${c.address || 'Sin dirección'}</p>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">CUIT: ${c.cuit || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.2rem;">Saldo</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: ${balanceColor};">$${(c.balance || 0).toLocaleString()}</div>
          </div>
        </div>
      `;
      card.onclick = () => onSelectClient(c);
      clientGrid.appendChild(card);
      });
    }
    wrapper.appendChild(clientGrid);
  }

  container.appendChild(wrapper);
}

function renderTransactionDetailModal(transaction) {
  const overlay = el('div', { classes: ['modal-overlay'] });
  const modal = el('div', { classes: ['modal'], style: 'max-width: 500px;' });
  
  const breakoutHtml = transaction.breakout.map(item => `
    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border); font-size: 0.9rem;">
      <span>Garron #${item.garron} (${item.weight} kg)</span>
      <span>$${item.price}/kg = <b>$${item.total.toLocaleString()}</b></span>
    </div>
  `).join('');

  modal.innerHTML = `
    <h2 style="margin-bottom: 1rem;">Detalle de Despacho</h2>
    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${transaction.description}</p>
    <div style="background: var(--bg-hover); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
      ${breakoutHtml}
      <div style="display: flex; justify-content: space-between; padding-top: 1rem; margin-top: 0.5rem; border-top: 2px solid var(--border); font-weight: bold; font-size: 1.1rem;">
        <span>Total Operación</span>
        <span style="color: #10b981;">$${transaction.amount.toLocaleString()}</span>
      </div>
    </div>
    <button class="btn-primary" style="width: 100%; border:0;" id="close-detail">Cerrar</button>
  `;

  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  modal.querySelector('#close-detail').onclick = () => overlay.remove();
}

