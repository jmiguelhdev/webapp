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

  const mainHeader = el('div', { classes: ['dashboard-header'], style: 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;' });
  mainHeader.innerHTML = `
    <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard">
      <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <h2 style="margin: 0;">🚛 Gestión de Viajes</h2>
  `;
  container.appendChild(mainHeader);
  mainHeader.querySelector('#back-to-dash').onclick = options.onBack;

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
    
    const tableContainer = el('div', { style: 'overflow-x: auto; margin-bottom: 1.5rem;' });
    const table = el('table', { 
      style: 'width: 100%; border-collapse: collapse; font-size: 0.9rem;',
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
