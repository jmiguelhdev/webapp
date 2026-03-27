// webApp/src/ui.js
import { CostSimulator } from './domain/entities/CostSimulator.js';

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
      pItem.innerHTML = `
        <div class="producer-header">
          <strong>${p.producer?.name || 'Productor'}</strong>
          <span>${p.origin || ''}</span>
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
