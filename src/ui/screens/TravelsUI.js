import { el } from '../../utils/dom.js';
import { MarketService } from '../../api/MarketService.js';
import { renderTimeFilterUI } from '../components/Filters.js';

function renderStatCard(label, value, icon) {
  return el('div', { 
    classes: ['stat-card'], 
    html: `<div class="stat-icon">${icon}</div><div class="stat-info"><p>${label}</p><h3>${value}</h3></div>` 
  });
}


/** 
 * Render Travels with Filtering, Sorting, and Pagination.
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
  
  const activeId = document.activeElement ? document.activeElement.id : null;
  const selectionStart = document.activeElement ? document.activeElement.selectionStart : null;
  const selectionEnd = document.activeElement ? document.activeElement.selectionEnd : null;

  container.innerHTML = '';

  const mainHeader = el('div', { classes: ['dashboard-header'], style: 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;' });
  mainHeader.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard">
        <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
      </button>
      <h2 style="margin: 0;">🚛 Gestión de Viajes</h2>
    </div>
    <button id="btn-add-travel" class="btn-primary" style="margin:0;">+ Nuevo Viaje</button>
  `;
  container.appendChild(mainHeader);
  mainHeader.querySelector('#back-to-dash').onclick = options.onBack;
  mainHeader.querySelector('#btn-add-travel').onclick = () => {
    if (options.onAddTravel) options.onAddTravel();
  };

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
  
  if (options.selectedCategories.length > 0 || true) {
    const labelSuffix = options.selectedCategories.length === 0 ? 'Totales' : options.selectedCategories.join(', ');
    const statsGrid = el('div', { classes: ['stats-grid'] });
    
    statsGrid.appendChild(renderStatCard(
      `Precio Prom. [${labelSuffix}]`, 
      `$${categoryStats.avgPrice.toFixed(2)}`, 
      '💰'
    ));

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

    statsGrid.appendChild(renderStatCard(
      'Peso Media Res (Prom.)', 
      `${categoryStats.avgKgMediaRes.toFixed(2)} kg`, 
      '🥩'
    ));

    statsGrid.appendChild(renderStatCard(
      'Cabezas Totales', 
      `${categoryStats.totalQuantity}`, 
      '🐂'
    ));

    statsGrid.appendChild(renderStatCard(
      'Rendimiento Promedio', 
      `${(categoryStats.avgYield * 100).toFixed(2)}%`, 
      '📈'
    ));

    const maxYieldLabel = categoryStats.maxYield > 0 ? `${(categoryStats.maxYield * 100).toFixed(2)}%` : 'N/A';
    const maxYieldSub = categoryStats.maxYield > 0 ? `<div style="font-size:0.7em; color:var(--text-muted);">${categoryStats.maxYieldEntity}</div>` : '';
    const maxYieldEl = el('div', { 
      classes: ['stat-card'], 
      html: `<div class="stat-icon">👑</div><div class="stat-info"><p>Rendimiento Máximo</p><h3>${maxYieldLabel}</h3>${maxYieldSub}</div>` 
    });
    statsGrid.appendChild(maxYieldEl);

    const totalCostoFaenados = categoryStats.totalKgFaena > 0 
      ? categoryStats.totalKgFaena * categoryStats.avgPriceWithCommission
      : 0;

    const kgFaenadosEl = el('div', { 
      classes: ['stat-card'], 
      html: `<div class="stat-icon">🔪</div><div class="stat-info"><p>Kilos Faenados</p><h3>${(categoryStats.totalKgFaena || 0).toLocaleString()} kg</h3><div style="font-size:0.8em; color:var(--text-muted); margin-top: 2px;">Costo total: $${totalCostoFaenados.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>` 
    });
    statsGrid.appendChild(kgFaenadosEl);

    const selectedCat = options.selectedCategories.length === 1 ? options.selectedCategories[0] : null;
    if (selectedCat && selectedCat !== 'TODOS') {
      MarketService.getReferencePrices().then(prices => {
        const ref = prices[selectedCat];
        if (ref) {
          const gap = MarketService.calculateGap(categoryStats.avgPrice, ref);
          const gapColor = gap > 0 ? '#ef4444' : '#10b981';
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
                <p>Precio MAG (+IVA) <a href="https://www.mercadoagroganadero.com.ar" target="_blank" title="Fuente: Mercado Agroganadero (MAG)" style="text-decoration:none; filter:grayscale(1); opacity:0.6; font-size:0.9em;">ℹ️</a></p>
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
    attrs: { id: 'travel-search', type: 'text', placeholder: 'Buscar por productor, patente, chofer...', value: options.searchQuery || '' },
    style: 'flex: 1; min-width: 250px; padding: 0.6rem 1rem; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);'
  });
  searchInput.oninput = (e) => options.onSearch(e.target.value);

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
    scanInput.value = '';
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

  const list = el('div', { classes: ['card-list'] });
  data.forEach(travel => {
    const buy = travel.buy || {};
    const agentName = buy.agent?.name;
    const card = el('div', { classes: ['card', 'travel-card-full'] });
    
    const commission = buy.agentCommissionAmount || 0;
    const totalOp = buy.totalOperation || 0;
    const totalOpWithComm = buy.totalOperationWithCommission || 0;
    const yieldValue = buy.generalYield || 0;
    
    const editSvg = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" /></svg>`;
    const delSvg = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" /></svg>`;

    card.innerHTML = `
      <div class="card-header">
        <div class="header-main">
          <h3>${travel.truck?.name || 'Viaje #' + travel.id}</h3>
          <span class="card-subtitle">${travel.date || ''} - ${travel.description || ''}</span>
        </div>
        <div class="header-status" style="display:flex; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          ${agentName ? `<span class="agent-badge">👤 ${agentName}</span>` : ''}
          <span class="status-badge ${travel.status?.toLowerCase() || 'borrador'}">${travel.status === 'DRAFT' ? 'BORRADOR' : (travel.status || 'BORRADOR')}</span>
          <div class="travel-actions" style="display:flex; gap:0.5rem;">
            <button class="btn-icon btn-edit-travel" data-id="${travel.id}" title="Editar Logística" style="background:var(--surface); border:1px solid var(--border); color:var(--primary); padding:0.5rem; border-radius:8px; cursor:pointer;">${editSvg}</button>
            <button class="btn-icon btn-delete-travel" data-id="${travel.id}" title="Eliminar Viaje" style="background:var(--surface); border:1px solid var(--border); color:var(--danger); padding:0.5rem; border-radius:8px; cursor:pointer;">${delSvg}</button>
          </div>
        </div>
      </div>
    `;

    // Wait until card is appended to add event listeners later. 
    // We'll attach listeners at the container level.

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
          <div class="detail-row" style="margin-top: 0.5rem; border-top: 1px dashed var(--border); padding-top: 0.5rem;">
            <span>Achique Total (Viaje):</span>
            <div style="display: flex; gap: 0.3rem; align-items: center;">
              <span style="font-size: 0.8rem; opacity: 0.7;">$</span>
              <input type="number" class="compact-input" value="${buy.reduce || 0}" 
                style="width: 100px; padding: 2px 5px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-hover); color: var(--text-main);"
                onchange="this.dataset.id='${travel.id}'; window._ui_onReduceUpdate && window._ui_onReduceUpdate('${travel.id}', this.value)">
            </div>
          </div>
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

    window._ui_onReduceUpdate = (id, val) => {
      if (options.onReduceUpdate) options.onReduceUpdate(id, parseFloat(val));
    };

    const producersList = el('div', { classes: ['producers-list'] });
    (buy.listOfProducers || []).forEach(p => {
      const pItem = el('div', { classes: ['producer-item'] });
      const iva = p.iva || 0;
      const ganancias = p.retencionGanancias || 0;
      const producerName = p.producer?.name || 'Productor';
      const cuit = p.producer?.cuit || '';
      const cbu = p.producer?.cbu || '';
      const totalAPagar = p.totalAPagar || 0;
      
      const pHeader = el('div', { classes: ['producer-header'], style: 'display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-bottom: 0.5rem;' });
      pHeader.innerHTML = `
        <div style="flex: 1;">
          <strong>👤 ${producerName}</strong>
          <span style="margin-left: 0.5rem; font-size: 0.85em; opacity: 0.8;">${p.origin || ''}</span>
        </div>
      `;
      
      const liqBtn = el('button', { 
        classes: ['btn-action'], 
        text: '📊 Liq.',
        style: 'background: #841d1d; color: white; border: none; border-radius: 8px; padding: 3px 10px; font-size: 0.72rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0;'
      });
      liqBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (options.onProducerSettlement) options.onProducerSettlement(travel, p);
      };
      pHeader.appendChild(liqBtn);
      pItem.appendChild(pHeader);

      const pInfo = el('div', { classes: ['producer-info'] });
      pInfo.innerHTML = `
        ${cuit ? `<span class="info-badge">CUIT: ${cuit}</span>` : ''}
        ${cbu ? `<span class="info-badge">CBU: ${cbu}</span>` : ''}
      `;
      pItem.appendChild(pInfo);

      const pTaxes = el('div', { classes: ['producer-taxes'], style: 'display: flex; gap: 0.5rem; margin-top: 0.2rem;' });
      pTaxes.innerHTML = `
        ${iva > 0 ? `<span class="tax-badge tax-iva">IVA: $${iva.toLocaleString()}</span>` : ''}
        ${ganancias > 0 ? `<span class="tax-badge tax-ganancias">Ret. Gan: $${ganancias.toLocaleString()}</span>` : ''}
        <span class="tax-badge" style="background: var(--accent-subtle); color: var(--accent-main); font-weight: bold;">Pago: $${totalAPagar.toLocaleString()}</span>
      `;
      pItem.appendChild(pTaxes);

      const pMiniList = el('div', { classes: ['product-mini-list'] });
      (p.listOfProducts || []).forEach(pr => {
        const row = el('div', { classes: ['product-mini-row'], html: `
          <span>${pr.name}: ${pr.quantity}x</span>
          <span>
            ${pr.kgClean.toFixed(0).toLocaleString()} kg limpio (${pr.roughing}%) | 
            <b>$${pr.price.toLocaleString()}</b>
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

  if (activeId) {
    const elToFocus = document.getElementById(activeId);
    if (elToFocus) {
      elToFocus.focus();
      if (selectionStart !== null && selectionEnd !== null && (elToFocus.type === 'text' || elToFocus.type === 'search')) {
        elToFocus.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }

  // Attach event listeners for travel cards
  container.querySelectorAll('.btn-edit-travel').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      const travel = data.find(t => String(t.id) === String(id));
      if (travel && options.onEditTravel) {
        options.onEditTravel(travel);
      }
    };
  });

  container.querySelectorAll('.btn-delete-travel').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('¿Eliminar este viaje?') && options.onDeleteTravel) {
        options.onDeleteTravel(id);
      }
    };
  });
}

/** Render Settlement Modal */
export function renderSettlementModal(travel, producer, options) {
  const overlay = el('div', { classes: ['modal-overlay'] });
  const modal = el('div', { classes: ['modal'], style: 'max-width: 800px; width: 95%; max-height: 90vh; overflow-y: auto;' });
  
  const updateContent = () => {
    const buy = travel.buy;
    modal.innerHTML = '';
    
    const title = el('h2', { text: 'Detalle de Liquidación' });
    const subtitle = el('p', { 
      classes: ['card-subtitle'], 
      html: `Productor: <strong>${producer.producer.name}</strong> | Viaje: <strong>${travel.truck?.name || 'ID: ' + travel.id}</strong>`,
      style: 'margin-bottom: 1.5rem;'
    });
    
    modal.appendChild(title);
    modal.appendChild(subtitle);
    
    const tableContainer = el('div', { classes: ['table-responsive'] });
    const table = el('table', { 
      style: 'width: 100%; min-width: 600px; border-collapse: collapse; font-size: 0.9rem;',
      html: `
        <thead>
          <tr style="border-bottom: 2px solid var(--border); text-align: left;">
            <th style="padding: 0.5rem;">Producto</th>
            <th style="padding: 0.5rem;">Cant.</th>
            <th style="padding: 0.5rem;">Kg Sucio</th>
            <th style="padding: 0.5rem;">% Desv.</th>
            <th style="padding: 0.5rem;">Kg Limpio</th>
            <th style="padding: 0.5rem;">Precio</th>
            <th style="padding: 0.5rem;">Operación</th>
            <th style="padding: 0.5rem;">Comis.</th>
          </tr>
        </thead>
        <tbody>
          ${producer.listOfProducts.map((pr, idx) => `
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 0.5rem;">${pr.name}</td>
              <td style="padding: 0.5rem;">${pr.quantity}</td>
              <td style="padding: 0.5rem;">${pr.kg.toLocaleString()}</td>
              <td style="padding: 0.5rem;">
                <input type="number" step="0.1" value="${pr.roughing}" 
                  class="compact-input product-roughing" data-idx="${idx}"
                  style="width: 60px; padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-hover); color: var(--text-main);">
              </td>
              <td style="padding: 0.5rem;">${pr.kgClean.toFixed(0).toLocaleString()}</td>
              <td style="padding: 0.5rem;">
                <input type="number" step="1" value="${pr.price}" 
                  class="compact-input product-price" data-idx="${idx}"
                  style="width: 80px; padding: 2px 4px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-hover); color: var(--text-main);">
              </td>
              <td style="padding: 0.5rem;">$${pr.operation.toLocaleString()}</td>
              <td style="padding: 0.5rem;">$${pr.commission.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      `
    });
    tableContainer.appendChild(table);
    modal.appendChild(tableContainer);
    
    // IVA MANUAL TOGGLE & INPUT
    const ivaManualArea = el('div', { 
      style: 'margin-bottom: 1.5rem; padding: 1rem; border: 1px solid var(--accent-subtle); border-radius: 12px; background: rgba(132, 29, 29, 0.05); display: flex; align-items: center; gap: 2rem;' 
    });
    
    const isManual = producer.manualIva !== null && producer.manualIva !== undefined;
    const toggleLabel = el('label', { 
      style: 'display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500;',
      html: `<input type="checkbox" id="toggle-manual-iva" ${isManual ? 'checked' : ''}> Usar IVA Manual` 
    });
    
    const manualIvaInput = el('input', { 
      attrs: { type: 'number', step: '1', value: isManual ? producer.manualIva : '', placeholder: 'Monto IVA', id: 'manual-iva-input' },
      style: `padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); visibility: ${isManual ? 'visible' : 'hidden'};`
    });
    
    ivaManualArea.appendChild(toggleLabel);
    ivaManualArea.appendChild(manualIvaInput);
    modal.appendChild(ivaManualArea);

    // RATIO DISPLAY
    const ratio = producer.facturaOverOpRatio;
    const ratioColor = ratio < 0.4 ? '#ef4444' : (ratio > 1.0 ? '#f59e0b' : '#10b981');
    const ratioMsg = ratio < 0.4 ? '⚠️ Ratio Factura/Operación muy bajo (< 40%)' : (ratio > 1.0 ? '⚠️ Ratio Factura/Operación superior al 100%' : '✅ Ratio Factura/Operación dentro del rango normal');

    const ratioArea = el('div', { 
      style: `margin-bottom: 1rem; padding: 0.75rem 1rem; border-radius: 8px; background: ${ratioColor}15; border: 1px solid ${ratioColor}40; display: flex; align-items: center; gap: 0.75rem;` 
    });
    ratioArea.innerHTML = `<span style="font-size: 1.2rem;">${ratio < 0.4 || ratio > 1.0 ? '🚩' : '🛡️'}</span>
      <div style="flex: 1;">
        <div style="font-weight: 600; color: ${ratioColor};">Ratio Factura/Op: ${(ratio * 100).toFixed(1)}%</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${ratioMsg}</div>
      </div>`;
    modal.appendChild(ratioArea);
    
    // Summary Cards / Desglose
    const summaryGrid = el('div', { 
      classes: ['grid-2-cols'], 
      style: 'background: var(--bg-hover); padding: 1rem; border-radius: 12px; gap: 2rem;' 
    });
    
    const leftCol = el('div');
    leftCol.innerHTML = `
      <div class="detail-row"><span>Total Operación:</span> <strong>$${producer.totalOperation.toLocaleString()}</strong></div>
      <div class="detail-row"><span>Total Comisión (${producer.buy?.agent?.percent || 0}%):</span> <strong>$${producer.totalCommission.toLocaleString()}</strong></div>
      <div class="detail-row highlight"><span>Op + Comisión:</span> <strong>$${producer.totalOpPlusComm.toLocaleString()}</strong></div>
    `;
    
    const rightCol = el('div');
    rightCol.innerHTML = `
      <div class="detail-row"><span>Achique Total Viaje:</span> <strong>$${buy.reduce.toLocaleString()}</strong></div>
      <div class="detail-row"><span>Achique Prorrateado (${producer.totalQuantity}/${buy.totalQuantity}):</span> <strong style="color: #ef4444;">- $${producer.achiqueProrrateado.toLocaleString()}</strong></div>
      <div class="detail-row highlight"><span>Base Factura:</span> <strong>$${producer.totalFactura.toLocaleString()}</strong></div>
    `;
    
    summaryGrid.appendChild(leftCol);
    summaryGrid.appendChild(rightCol);
    modal.appendChild(summaryGrid);
    
    const taxesArea = el('div', { style: 'margin-top: 1rem; padding: 1rem; border-top: 1px solid var(--border);' });
    taxesArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
        <span>Neto (1/1.105):</span> <strong>$${producer.neto.toLocaleString()}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
        <span>IVA (10.5%):</span> <strong>$${producer.iva.toLocaleString()}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
        <span>Retención Ganancias (2% Neto):</span> <strong style="color: #ef4444;">- $${producer.retencionGanancias.toLocaleString()}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 1.2rem; border-top: 2px solid var(--accent-main); padding-top: 1rem;">
        <strong>TOTAL A PAGAR:</strong> <strong style="color: var(--accent-main);">$${producer.totalAPagar.toLocaleString()}</strong>
      </div>
    `;
    modal.appendChild(taxesArea);
    
    const actions = el('div', { classes: ['modal-actions'], style: 'margin-top: 2rem;' });
    const cancelBtn = el('button', { classes: ['btn-outline'], text: 'Cerrar' });
    const saveBtn = el('button', { classes: ['btn-primary'], text: '💾 Guardar Cambios', style: 'flex: 1; background: #059669;' });
    
    cancelBtn.onclick = () => overlay.remove();
    saveBtn.onclick = () => {
      const productUpdates = [];
      modal.querySelectorAll('.product-roughing').forEach(input => {
        const idx = parseInt(input.dataset.idx);
        const priceInput = modal.querySelector(`.product-price[data-idx="${idx}"]`);
        productUpdates.push({
          index: idx,
          roughing: parseFloat(input.value),
          price: parseFloat(priceInput.value)
        });
      });
      
      const manualIvaValue = toggleLabel.querySelector('input').checked ? parseFloat(manualIvaInput.value) : null;
      
      if (options.onUpdateSettlement) {
        options.onUpdateSettlement(travel.id, String(producer.producer.cuit || ''), productUpdates, manualIvaValue);
      }
      overlay.remove();
    };
    
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    modal.appendChild(actions);
    
    // UI Event Handlers
    toggleLabel.querySelector('input').onchange = (e) => {
      manualIvaInput.style.visibility = e.target.checked ? 'visible' : 'hidden';
      if (!e.target.checked) {
        producer.manualIva = null;
        updateContent();
      }
    };
    
    manualIvaInput.oninput = (e) => {
      producer.manualIva = parseFloat(e.target.value) || 0;
      updateContent();
      const newInp = modal.querySelector('#manual-iva-input');
      newInp.focus();
      const val = newInp.value;
      newInp.value = '';
      newInp.value = val;
    };
    
    modal.querySelectorAll('.product-roughing, .product-price').forEach(input => {
      input.oninput = (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const rough = modal.querySelector(`.product-roughing[data-idx="${idx}"]`).value;
        const price = modal.querySelector(`.product-price[data-idx="${idx}"]`).value;
        producer.listOfProducts[idx].roughing = parseFloat(rough) || 0;
        producer.listOfProducts[idx].price = parseFloat(price) || 0;
        
        updateContent();
        
        const className = e.target.classList.contains('product-roughing') ? '.product-roughing' : '.product-price';
        const newInp = modal.querySelector(`${className}[data-idx="${idx}"]`);
        newInp.focus();
        const val = newInp.value;
        newInp.value = '';
        newInp.value = val;
      };
    });
  };
  
  updateContent();
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

export function showTravelModal(travel, options) {
  const container = document.getElementById('travel-modal-container') || (() => {
    const div = el('div', { attrs: { id: 'travel-modal-container' } });
    document.body.appendChild(div);
    return div;
  })();
  
  const isEdit = !!travel;
  const trucks = options.trucks || [];

  // Local state for expenses since it's an array
  let expArray = travel?.expenses ? (Array.isArray(travel.expenses) ? travel.expenses : Object.values(travel.expenses)) : [];
  let localExpenses = [...expArray];

  const renderModal = () => {
    const trucksOpts = trucks.map(t => `<option value="${t.id}" ${travel?.truck?.id == t.id ? 'selected' : ''}>${t.name}</option>`).join('');
    
    // Calc helpers based on current values
    let kmO = Number(travel?.kmOnOrigin || 0);
    let kmD = Number(travel?.kmOnDestination || 0);
    let dist = Math.max(0, kmD - kmO);

    container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal active" id="travel-modal" style="max-width: 600px; padding: 0;">
          
          <div style="padding: 1.5rem 1.5rem 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--surface);">
            <h3 style="margin: 0; color: var(--primary); font-size: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
              <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" /></svg>
              ${isEdit ? 'Editar Logística de Viaje' : 'Nuevo Viaje'}
            </h3>
          </div>

          <form id="travel-form" style="padding: 1.5rem;">
            
            <div class="responsive-grid-2" style="margin-bottom: 1rem;">
              <div class="form-group" style="margin: 0;">
                <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">📅 Fecha</label>
                <input type="date" id="t-date" value="${travel?.date || new Date().toISOString().split('T')[0]}" required style="padding: 0.5rem; border-radius: 8px;">
              </div>
              <div class="form-group" style="margin: 0;">
                <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">📌 Estado</label>
                <select id="t-status" style="padding: 0.5rem; border-radius: 8px;">
                  <option value="DRAFT" ${travel?.status === 'DRAFT' ? 'selected' : ''}>Borrador</option>
                  <option value="ACTIVE" ${travel?.status === 'ACTIVE' || !travel ? 'selected' : ''}>Activo</option>
                  <option value="COMPLETED" ${travel?.status === 'COMPLETED' ? 'selected' : ''}>Completado</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
              <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">📝 Descripción / Observaciones</label>
              <input type="text" id="t-desc" value="${travel?.description || ''}" placeholder="Ej. Viaje a Liniers..." style="padding: 0.5rem; border-radius: 8px;">
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">🚛 Camión Asignado</label>
              <select id="t-truck" required style="padding: 0.5rem; border-radius: 8px;"><option value="">-- Seleccionar --</option>${trucksOpts}</select>
            </div>

            <!-- Secciones -->
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
              <h4 style="margin: 0 0 1rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-main);">
                🛣️ Odómetro
              </h4>
              <div class="responsive-grid-2">
                <div class="form-group" style="margin: 0;">
                  <label style="font-size: 0.8rem; color: var(--text-muted);">Km Origen</label>
                  <input type="number" id="t-km-o" step="0.1" value="${kmO}" required style="padding: 0.5rem; border-radius: 8px;">
                </div>
                <div class="form-group" style="margin: 0;">
                  <label style="font-size: 0.8rem; color: var(--text-muted);">Km Destino</label>
                  <input type="number" id="t-km-d" step="0.1" value="${kmD}" required style="padding: 0.5rem; border-radius: 8px;">
                </div>
              </div>
              <div style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-container); border-radius: 8px; color: var(--on-primary-container); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.85rem; font-weight: 500;">Distancia Calculada</span>
                <strong id="t-dist" style="font-size: 1.1rem;">${dist} km</strong>
              </div>
            </div>

            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
              <h4 style="margin: 0 0 1rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-main);">
                ⛽ Combustible
              </h4>
              <div class="responsive-grid-2">
                <div class="form-group" style="margin: 0;">
                  <label style="font-size: 0.8rem; color: var(--text-muted);">Km en Surtidor</label>
                  <input type="number" id="t-km-p" step="0.1" value="${travel?.kmOnPump || 0}" style="padding: 0.5rem; border-radius: 8px;">
                </div>
                <div class="form-group" style="margin: 0;">
                  <label style="font-size: 0.8rem; color: var(--text-muted);">Litros Cargados</label>
                  <input type="number" id="t-liters" step="0.1" value="${travel?.litersOnPump || 0}" style="padding: 0.5rem; border-radius: 8px;">
                </div>
              </div>
            </div>

            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem;">
              <h4 style="margin: 0 0 1rem 0; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-main);">
                💸 Gastos Adicionales
              </h4>
              
              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">
                ${localExpenses.map((e, index) => `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--bg-hover); border-radius: 8px; border: 1px solid var(--border);">
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-size: 0.9rem; font-weight: 500;">${e.description}</span>
                      <span style="font-size: 0.75rem; color: ${e.isReimbursable ? 'var(--primary)' : 'var(--text-muted)'};">${e.isReimbursable ? '♻️ A Devolver' : '❌ No Devolver'}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                      <strong style="font-size: 1rem;">$${e.amount}</strong>
                      <button type="button" class="btn-icon btn-delete-exp" data-idx="${index}" style="color: var(--danger); padding: 0.25rem;">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                      </button>
                    </div>
                  </div>
                `).join('')}
                ${localExpenses.length === 0 ? `<div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">No hay gastos registrados</div>` : ''}
              </div>

              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; background: var(--bg-main); padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border);">
                <input type="text" id="e-desc" placeholder="Descripción" style="flex: 2; padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); font-size: 0.85rem; background: var(--surface);">
                <input type="number" id="e-amount" placeholder="$ Monto" style="flex: 1; padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); font-size: 0.85rem; background: var(--surface);">
                <label style="display:flex; align-items:center; gap:0.25rem; font-size: 0.8rem; cursor: pointer; color: var(--text-muted);">
                  <input type="checkbox" id="e-reimb" checked> ♻️ Reemb.
                </label>
                <button type="button" id="btn-add-exp" class="btn-secondary" style="padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.85rem;">+</button>
              </div>
            </div>

            <div class="modal-actions" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem;">
              <button type="button" class="btn-secondary" id="btn-cancel-tmodal" style="padding: 0.65rem 1.5rem; border-radius: 100px; border: 1px solid var(--outline); background: transparent; cursor: pointer;">Cancelar</button>
              <button type="submit" class="btn-primary" style="padding: 0.65rem 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" /></svg>
                Guardar Viaje
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('btn-cancel-tmodal').addEventListener('click', () => {
      container.innerHTML = '';
      if (options.onCancel) options.onCancel();
    });
    
    // Auto-update distance calculation visual
    const updateDist = () => {
      const o = Number(document.getElementById('t-km-o').value || 0);
      const d = Number(document.getElementById('t-km-d').value || 0);
      document.getElementById('t-dist').textContent = Math.max(0, d - o) + ' km';
    };
    document.getElementById('t-km-o').addEventListener('input', updateDist);
    document.getElementById('t-km-d').addEventListener('input', updateDist);

    // Add Expense
    document.getElementById('btn-add-exp').addEventListener('click', () => {
      const desc = document.getElementById('e-desc').value;
      const amt = Number(document.getElementById('e-amount').value);
      const isR = document.getElementById('e-reimb').checked;
      if (desc && amt > 0) {
        localExpenses.push({
          id: Date.now(),
          travelId: travel?.id || 0,
          description: desc,
          amount: amt,
          category: 'OTROS',
          date: document.getElementById('t-date').value,
          isReimbursable: isR
        });
        updateFormValuesToTemp();
        renderModal();
      }
    });

    // Delete Expense
    document.querySelectorAll('.btn-delete-exp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.dataset.idx;
        localExpenses.splice(idx, 1);
        updateFormValuesToTemp();
        renderModal();
      });
    });

    document.getElementById('travel-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const selectedTruckId = document.getElementById('t-truck').value;
      const selectedTruck = trucks.find(t => String(t.id) === selectedTruckId);

      const payload = {
        id: travel ? travel.id : Date.now(),
        date: document.getElementById('t-date').value,
        status: document.getElementById('t-status').value,
        description: document.getElementById('t-desc').value,
        truck: selectedTruck || null,
        kmOnOrigin: Number(document.getElementById('t-km-o').value),
        kmOnDestination: Number(document.getElementById('t-km-d').value),
        kmOnPump: Number(document.getElementById('t-km-p').value),
        litersOnPump: Number(document.getElementById('t-liters').value),
        expenses: localExpenses,
        driverPricePerKmSimple: travel?.driverPricePerKmSimple || 0,
        driverPricePerKmDouble: travel?.driverPricePerKmDouble || 0,
        fuelPrice: travel?.fuelPrice || 0,
        pricePerKm: travel?.pricePerKm || 0,
        buy: travel?.buy || null, // preserve commercial data
        kgFaenaTotal: travel?.kgFaenaTotal || 0,
        updatedAt: Date.now()
      };

      container.innerHTML = '';
      if (options.onSaveTravel) {
        options.onSaveTravel(payload);
      }
    });
  };

  const updateFormValuesToTemp = () => {
    if(!travel) travel = {};
    travel.date = document.getElementById('t-date')?.value || travel.date;
    travel.status = document.getElementById('t-status')?.value || travel.status;
    travel.description = document.getElementById('t-desc')?.value || travel.description;
    const tId = document.getElementById('t-truck')?.value;
    travel.truck = trucks.find(t => String(t.id) === tId) || travel.truck;
    travel.kmOnOrigin = document.getElementById('t-km-o')?.value || travel.kmOnOrigin;
    travel.kmOnDestination = document.getElementById('t-km-d')?.value || travel.kmOnDestination;
    travel.kmOnPump = document.getElementById('t-km-p')?.value || travel.kmOnPump;
    travel.litersOnPump = document.getElementById('t-liters')?.value || travel.litersOnPump;
  };

  renderModal();
}
