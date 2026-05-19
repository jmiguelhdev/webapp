import { el } from '../../utils/dom.js';
import { renderTimeFilterUI } from '../components/Filters.js';

/**
 * @file TravelsUI.js
 * @description Renders the high-end dashboard screen for managing livestock logistics, travels,
 * producer liquidation settlements, and automatic PDF scanning.
 */

/**
 * Renders the Travels management dashboard with search, filter chips, segmented selectors, and pagination.
 * @param {HTMLElement} container - The DOM container to render into.
 * @param {Object} options - Config and functional event callbacks.
 */
export function renderTravels(container, options) {
  if (!container) return;

  const { 
    data = [], totalItems = 0, currentPage = 1, itemsPerPage = 10, 
    currentFilter, currentSort, 
    onFilter, onSort, onPage,
    categories = [], selectedCategories = [], includeCommission, 
    onCategoryToggle, onCommissionToggle
  } = options;
  
  // Retain cursor focus position for smooth real-time filter searches
  const activeId = document.activeElement ? document.activeElement.id : null;
  const selectionStart = document.activeElement ? document.activeElement.selectionStart : null;
  const selectionEnd = document.activeElement ? document.activeElement.selectionEnd : null;

  container.innerHTML = '';

  // Premium Header Card
  const mainHeader = el('div', { 
    classes: ['settings-header-container', 'glass-card'], 
    style: 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; padding: 1.5rem 2rem; border-radius: 20px;' 
  });
  mainHeader.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1.25rem;">
      <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard" style="border: 1px solid var(--border); background: var(--bg-main);">
        <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
      </button>
      <div>
        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-main);">🚛 Gestión de Viajes</h2>
        <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Monitorea remisiones, rendimiento de faena y liquidaciones de productores.</p>
      </div>
    </div>
    <button id="btn-add-travel" class="btn-primary" style="margin: 0; padding: 0.7rem 1.4rem; border-radius: 12px; font-weight: 600;">+ Nuevo Viaje</button>
  `;
  container.appendChild(mainHeader);
  mainHeader.querySelector('#back-to-dash').onclick = options.onBack;
  mainHeader.querySelector('#btn-add-travel').onclick = () => {
    if (options.onAddTravel) options.onAddTravel();
  };

  // Filters and Categories Glass Card
  const statsArea = el('div', { 
    classes: ['glass-card', 'settings-card'], 
    style: 'margin-bottom: 2rem; padding: 1.75rem 2rem; border-radius: 20px; display: flex; flex-direction: column; gap: 1.25rem;' 
  });
  
  // 1. Time Filters Sub-component
  const timeRow = renderTimeFilterUI(options);
  statsArea.appendChild(timeRow);
  
  // 2. Categories selection selector row
  const selectorRow = el('div', { 
    classes: ['selector-row'],
    style: 'display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; border-top: 1px solid var(--border); padding-top: 1.25rem; flex-wrap: wrap;' 
  });
  
  const chipsLeft = el('div', { 
    style: 'display: flex; align-items: center; gap: 1rem; flex: 1; flex-wrap: wrap;' 
  });
  chipsLeft.innerHTML = `<span style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Categorías:</span>`;
  
  const chipsContainer = el('div', { 
    classes: ['category-chips-container'],
    style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;'
  });
  
  categories.forEach(cat => {
    const isTodos = cat === 'TODOS';
    const isSelected = isTodos 
      ? selectedCategories.length === 0 
      : selectedCategories.includes(cat);
      
    const chip = el('button', { 
      classes: ['category-chip', isSelected ? 'active' : 'inactive'], 
      text: cat 
    });
    chip.onclick = () => onCategoryToggle(cat);
    chipsContainer.appendChild(chip);
  });
  chipsLeft.appendChild(chipsContainer);
  
  // Modern custom toggle for "Con Comisión"
  const commToggle = el('label', { 
    classes: ['comm-toggle'], 
    style: 'display: flex; align-items: center; gap: 0.75rem; cursor: pointer; background: rgba(255,255,255,0.02); padding: 0.6rem 1rem; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease;',
    html: `
      <span style="font-size: 0.82rem; font-weight: 600; color: var(--text-main);">Con Comisión</span>
      <label class="switch-container-m3" style="margin: 0;">
        <input type="checkbox" ${includeCommission ? 'checked' : ''}>
        <span class="switch-slider-m3"></span>
      </label>
    ` 
  });
  commToggle.querySelector('input').onchange = (e) => onCommissionToggle(e.target.checked);
  
  selectorRow.appendChild(chipsLeft);
  selectorRow.appendChild(commToggle);
  statsArea.appendChild(selectorRow);
  container.appendChild(statsArea);
  
  // Dashboard Toolbar Section
  const toolbar = el('div', { 
    classes: ['toolbar', 'glass-card'], 
    style: 'margin-bottom: 2rem; padding: 1.25rem 1.75rem; border-radius: 18px; display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;' 
  });
  
  // A. Segmented Controls Capsule for Status Filters
  const filterGroup = el('div', { 
    classes: ['segmented-control-container'],
    style: 'display: flex; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); padding: 4px; border-radius: 12px;' 
  });
  ['TODOS', 'ACTIVO', 'BORRADOR'].forEach(f => {
    const isActive = currentFilter === f;
    const btn = el('button', { 
      classes: ['filter-btn'], 
      text: f,
      style: `background: ${isActive ? 'var(--primary)' : 'transparent'}; color: ${isActive ? '#ffffff' : 'var(--text-muted)'}; border: none; padding: 0.5rem 1.15rem; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease;`
    });
    btn.onclick = () => onFilter(f);
    filterGroup.appendChild(btn);
  });
  
  // B. Interactive Search Box
  const searchInput = el('input', { 
    classes: ['form-input'], 
    attrs: { id: 'travel-search', type: 'text', placeholder: '🔍 Buscar productor, patente, chofer...', value: options.searchQuery || '' },
    style: 'flex: 1; min-width: 250px; padding: 0.65rem 1.25rem; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.85rem;'
  });
  searchInput.oninput = (e) => options.onSearch(e.target.value);

  // C. Modern Action File Pickers
  const pdfUploadContainer = el('div', { style: 'display: flex; align-items: center; gap: 0.65rem;' });
  
  const pdfInput = el('input', { attrs: { type: 'file', accept: '.pdf', id: 'pdf-faena-input' }, style: 'display: none;' });
  const uploadBtn = el('button', { 
    classes: ['btn-primary'], 
    text: '📄 Subir PDF', 
    style: 'margin: 0; white-space: nowrap; background: #2563eb; border: none; font-size: 0.82rem; padding: 0.65rem 1.15rem; border-radius: 10px; font-weight: 600;' 
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
    style: 'margin: 0; white-space: nowrap; background: #10b981; border: none; font-size: 0.82rem; padding: 0.65rem 1.15rem; border-radius: 10px; font-weight: 600;' 
  });
  scanBtn.onclick = () => scanInput.click();
  scanInput.onchange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      options.onScanDirectory(Array.from(e.target.files));
    }
    scanInput.value = '';
  };

  const sortBtn = el('button', { 
    classes: ['sort-toggle'], 
    style: 'background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border); color: var(--text-main); font-size: 0.82rem; padding: 0.65rem 1.15rem; border-radius: 10px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.35rem;',
    html: `📅 Fecha ${currentSort === 'DESC' ? '▼' : '▲'}` 
  });
  sortBtn.onclick = () => onSort(currentSort === 'DESC' ? 'ASC' : 'DESC');

  pdfUploadContainer.appendChild(pdfInput);
  pdfUploadContainer.appendChild(uploadBtn);
  pdfUploadContainer.appendChild(scanInput);
  pdfUploadContainer.appendChild(scanBtn);

  toolbar.appendChild(filterGroup);
  toolbar.appendChild(searchInput);
  toolbar.appendChild(pdfUploadContainer);
  toolbar.appendChild(sortBtn);
  container.appendChild(toolbar);

  // Cards List Container
  const list = el('div', { 
    classes: ['card-list'],
    style: 'display: flex; flex-direction: column; gap: 2rem; margin-bottom: 2rem;'
  });
  
  data.forEach(travel => {
    const buy = travel.buy || {};
    const agentName = buy.agent?.name;
    const card = el('div', { 
      classes: ['glass-card', 'settings-card'],
      style: 'padding: 2.25rem; border-radius: 24px; transition: all 0.25s ease;'
    });
    
    const commission = buy.agentCommissionAmount || 0;
    const totalOp = buy.totalOperation || 0;
    const totalOpWithComm = buy.totalOperationWithCommission || 0;
    const yieldValue = buy.generalYield || 0;
    
    const editSvg = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" /></svg>`;
    const delSvg = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" /></svg>`;

    card.innerHTML = `
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div class="header-main">
          <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">🚚 ${travel.truck?.name || 'Viaje #' + travel.id}</h3>
          <span class="card-subtitle" style="display: block; margin-top: 0.35rem; font-size: 0.82rem; color: var(--text-muted); font-weight: 500;">📅 ${travel.date || ''} &bull; 🏷️ ${travel.description || 'Sin descripción'}</span>
        </div>
        <div class="header-status" style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          ${agentName ? `<span class="agent-badge" style="background: rgba(255,255,255,0.04); color: var(--text-main); font-weight: 600; font-size: 0.75rem; padding: 0.3rem 0.75rem; border-radius: 8px; border: 1px solid var(--border);">👤 ${agentName}</span>` : ''}
          <span class="status-badge ${travel.status?.toLowerCase() || 'borrador'}" style="font-weight: 750; font-size: 0.7rem; padding: 0.35rem 0.8rem; border-radius: 8px; letter-spacing: 0.5px;">${travel.status === 'DRAFT' ? 'BORRADOR' : (travel.status || 'BORRADOR')}</span>
          <div class="travel-actions" style="display: flex; gap: 0.4rem;">
            <button class="btn-icon btn-edit-travel" data-id="${travel.id}" title="Editar Logística" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: #60a5fa; padding: 0.5rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">${editSvg}</button>
            <button class="btn-icon btn-delete-travel" data-id="${travel.id}" title="Eliminar Viaje" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: #f87171; padding: 0.5rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">${delSvg}</button>
          </div>
        </div>
      </div>
    `;

    const buyCategories = buy.categories || [];
    const buyCategoryDisplay = buyCategories.join(', ') || 'N/A';
    
    const cardBody = el('div', { classes: ['card-body'] });
    cardBody.innerHTML = `
      <div class="grid-2-cols" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.75rem; margin-bottom: 1.5rem;">
        
        <!-- Column 1: Economy Subcard -->
        <div class="metrics-column" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 1.25rem; border-radius: 16px;">
          <h4 style="margin: 0 0 1rem 0; font-size: 0.9rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">💰 Economía</h4>
          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            <div class="detail-row"><span>Operación Total:</span> <strong>$${totalOp.toLocaleString()}</strong></div>
            <div class="detail-row"><span>Comisión Agente:</span> <strong>$${commission.toLocaleString()}</strong></div>
            <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.25rem;">
              <span style="font-weight: 700; color: var(--text-main);">Total c/ Comisión:</span>
              <strong style="color: #60a5fa;">$${totalOpWithComm.toLocaleString()}</strong>
            </div>
            
            <div class="detail-row" style="margin-top: 0.5rem; border-top: 1px dashed var(--border); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Achique Total (Viaje):</span>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">$</span>
                <input type="number" class="compact-input" value="${buy.reduce || 0}" 
                  style="width: 100px; padding: 4px 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-hover); color: var(--text-main); text-align: right; font-weight: 600;"
                  onchange="this.dataset.id='${travel.id}'; window._ui_onReduceUpdate && window._ui_onReduceUpdate('${travel.id}', this.value)">
              </div>
            </div>
          </div>
        </div>
        
        <!-- Column 2: Yield Subcard -->
        <div class="metrics-column" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 1.25rem; border-radius: 16px;">
          <h4 style="margin: 0 0 1rem 0; font-size: 0.9rem; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;">📈 Rendimiento</h4>
          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            <div class="detail-row"><span>Categoría(s):</span> <strong>${buyCategoryDisplay}</strong></div>
            <div class="detail-row"><span>Cantidad:</span> <strong>${buy.totalQuantity || 0} cabezas</strong></div>
            <div class="detail-row"><span>Kg Limpios:</span> <strong>${(buy.totalKgClean || 0).toLocaleString()} kg</strong></div>
            <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.25rem;">
              <span style="font-weight: 700; color: var(--text-main);">Rendimiento Gral:</span>
              <strong style="color: #34d399;">${(yieldValue * 100).toFixed(2)}%</strong>
            </div>
          </div>
        </div>
      </div>
      
      <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 0.5px;">👤 Productores Asociados:</div>
    `;

    // Internal Global Reducer callback
    window._ui_onReduceUpdate = (id, val) => {
      if (options.onReduceUpdate) options.onReduceUpdate(id, parseFloat(val));
    };

    // Render associated producers micro-cards list
    const producersList = el('div', { 
      classes: ['producers-list'],
      style: 'display: flex; flex-direction: column; gap: 0.95rem;' 
    });
    
    (buy.listOfProducers || []).forEach(p => {
      const pItem = el('div', { 
        classes: ['producer-sub-card'],
        style: 'background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;' 
      });
      const iva = p.iva || 0;
      const ganancias = p.retencionGanancias || 0;
      const producerName = p.producer?.name || 'Productor';
      const cuit = p.producer?.cuit || '';
      const cbu = p.producer?.cbu || '';
      const totalAPagar = p.totalAPagar || 0;
      
      const pHeader = el('div', { 
        classes: ['producer-header'], 
        style: 'display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.65rem;' 
      });
      pHeader.innerHTML = `
        <div style="flex: 1;">
          <strong style="font-size: 0.95rem; color: var(--text-main);">👤 ${producerName}</strong>
          <span style="margin-left: 0.5rem; font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">📍 ${p.origin || 'N/A'}</span>
        </div>
      `;
      
      const liqBtn = el('button', { 
        classes: ['btn-action'], 
        text: '📊 Liquidar',
        style: 'background: var(--primary); color: #ffffff; border: none; border-radius: 8px; padding: 0.35rem 0.85rem; font-size: 0.72rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: all 0.2s ease;'
      });
      liqBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (options.onProducerSettlement) options.onProducerSettlement(travel, p);
      };
      pHeader.appendChild(liqBtn);
      pItem.appendChild(pHeader);

      // CUIT / CBU metadata pills
      const pInfo = el('div', { 
        classes: ['producer-info'],
        style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' 
      });
      pInfo.innerHTML = `
        ${cuit ? `<span class="info-badge" style="background: rgba(255,255,255,0.03); color: var(--text-muted); font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--border);">CUIT: ${cuit}</span>` : ''}
        ${cbu ? `<span class="info-badge" style="background: rgba(255,255,255,0.03); color: var(--text-muted); font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--border);">CBU: ${cbu}</span>` : ''}
      `;
      pItem.appendChild(pInfo);

      // Tax Ledger badges
      const pTaxes = el('div', { 
        classes: ['producer-taxes'], 
        style: 'display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;' 
      });
      pTaxes.innerHTML = `
        ${iva > 0 ? `<span class="tax-badge tax-iva" style="background: rgba(37, 99, 235, 0.08); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.2); font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px;">IVA: $${iva.toLocaleString()}</span>` : ''}
        ${ganancias > 0 ? `<span class="tax-badge tax-ganancias" style="background: rgba(245, 158, 11, 0.08); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px;">Ret. Gan.: $${ganancias.toLocaleString()}</span>` : ''}
        <span class="tax-badge" style="margin-left: auto; background: rgba(16, 185, 129, 0.08); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); font-weight: 800; font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: 6px;">Neto Pago: $${totalAPagar.toLocaleString()}</span>
      `;
      pItem.appendChild(pTaxes);

      // Product item lists details
      const pMiniList = el('div', { 
        classes: ['product-mini-list'],
        style: 'display: flex; flex-direction: column; gap: 0.35rem; background: rgba(0,0,0,0.12); padding: 0.65rem 0.95rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.02);' 
      });
      (p.listOfProducts || []).forEach(pr => {
        const row = el('div', { 
          classes: ['product-mini-row'],
          style: 'display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-muted);',
          html: `
            <span>🥩 <strong>${pr.name}</strong> &bull; ${pr.quantity} cabezas</span>
            <span>
              ${pr.kgClean.toFixed(0).toLocaleString()} kg limpio (${pr.roughing}% desb.) | 
              <strong style="color: var(--text-main); font-family: monospace;">$${pr.price.toLocaleString()}</strong>
            </span>
          ` 
        });
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

  // Pagination buttons
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages > 1) {
    const pagin = el('div', { 
      classes: ['pagination'],
      style: 'display: flex; align-items: center; justify-content: center; gap: 1.25rem; margin: 2rem 0;' 
    });
    
    const prevBtn = el('button', { 
      classes: ['page-btn'], 
      text: 'Anterior', 
      attrs: currentPage === 1 ? { disabled: '' } : {},
      style: `background: rgba(255,255,255,0.03); color: ${currentPage === 1 ? 'var(--text-muted)' : 'var(--text-main)'}; border: 1px solid var(--border); padding: 0.6rem 1.25rem; border-radius: 12px; font-weight: 600; font-size: 0.82rem; cursor: pointer;`
    });
    prevBtn.onclick = () => onPage(currentPage - 1);
    
    const nextBtn = el('button', { 
      classes: ['page-btn'], 
      text: 'Siguiente', 
      attrs: currentPage === totalPages ? { disabled: '' } : {},
      style: `background: rgba(255,255,255,0.03); color: ${currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-main)'}; border: 1px solid var(--border); padding: 0.6rem 1.25rem; border-radius: 12px; font-weight: 600; font-size: 0.82rem; cursor: pointer;`
    });
    nextBtn.onclick = () => onPage(currentPage + 1);
    
    const info = el('span', { 
      classes: ['page-info'], 
      text: `Página ${currentPage} de ${totalPages}`,
      style: 'font-weight: 700; font-size: 0.85rem; color: var(--text-muted);' 
    });
    
    pagin.appendChild(prevBtn);
    pagin.appendChild(info);
    pagin.appendChild(nextBtn);
    container.appendChild(pagin);
  }

  // Refocus state element
  if (activeId) {
    const elToFocus = document.getElementById(activeId);
    if (elToFocus) {
      elToFocus.focus();
      if (selectionStart !== null && selectionEnd !== null && (elToFocus.type === 'text' || elToFocus.type === 'search')) {
        elToFocus.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }

  // Attach event click triggers to travels cards
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
      if (confirm('¿Deseas eliminar este viaje y toda su información logística asociada?') && options.onDeleteTravel) {
        options.onDeleteTravel(id);
      }
    };
  });
}

/**
 * Renders the detailed settlement modal containing the interactive roughing table, manual tax inputs, and ratios.
 * @param {Object} travel - Parent travel logistics data.
 * @param {Object} producer - Targeted producer parameters.
 * @param {Object} options - Events configuration actions.
 */
export function renderSettlementModal(travel, producer, options) {
  // Sophisticated glass backdrop blur overlay
  const overlay = el('div', { 
    classes: ['modal-overlay', 'fade-in'],
    style: 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem;' 
  });
  
  const modal = el('div', { 
    classes: ['glass-card'], 
    style: 'max-width: 850px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2.25rem; border-radius: 24px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.5);' 
  });
  
  const updateContent = () => {
    const buy = travel.buy;
    modal.innerHTML = '';
    
    const title = el('h2', { 
      text: 'Detalle de Liquidación',
      style: 'margin: 0; font-size: 1.35rem; font-weight: 800; color: var(--text-main);' 
    });
    const subtitle = el('p', { 
      classes: ['card-subtitle'], 
      html: `Productor: <strong style="color: var(--text-main);">${producer.producer.name}</strong> | Viaje: <strong style="color: var(--text-main);">${travel.truck?.name || 'ID: ' + travel.id}</strong>`,
      style: 'margin: 0.35rem 0 1.75rem 0; font-size: 0.85rem; color: var(--text-muted);'
    });
    
    modal.appendChild(title);
    modal.appendChild(subtitle);
    
    // Structured Interactive Table
    const tableContainer = el('div', { 
      classes: ['table-responsive'],
      style: 'margin-bottom: 1.5rem; overflow-x: auto; background: rgba(0,0,0,0.12); padding: 0.75rem; border-radius: 16px; border: 1px solid var(--border);' 
    });
    const table = el('table', { 
      style: 'width: 100%; min-width: 650px; border-collapse: collapse; font-size: 0.82rem;',
      html: `
        <thead>
          <tr style="border-bottom: 2px solid var(--border); text-align: left; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 0.75rem;">Producto</th>
            <th style="padding: 0.75rem; text-align: center;">Cant.</th>
            <th style="padding: 0.75rem; text-align: right;">Kg Sucio</th>
            <th style="padding: 0.75rem; text-align: center;">% Desv. (Desb.)</th>
            <th style="padding: 0.75rem; text-align: right;">Kg Limpio</th>
            <th style="padding: 0.75rem; text-align: right;">Precio Vivo ($)</th>
            <th style="padding: 0.75rem; text-align: right;">Operación</th>
            <th style="padding: 0.75rem; text-align: right;">Comisión</th>
          </tr>
        </thead>
        <tbody style="font-weight: 600;">
          ${producer.listOfProducts.map((pr, idx) => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); color: var(--text-main);">
              <td style="padding: 0.75rem; font-weight: 700; color: #ffffff;">${pr.name}</td>
              <td style="padding: 0.75rem; text-align: center; color: var(--text-muted);">${pr.quantity}</td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace;">${pr.kg.toLocaleString()}</td>
              <td style="padding: 0.75rem; text-align: center;">
                <input type="number" step="0.1" value="${pr.roughing}" 
                  class="compact-input product-roughing" data-idx="${idx}"
                  style="width: 70px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); text-align: center; font-weight: 700;">
              </td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace; color: #34d399;">${pr.kgClean.toFixed(0).toLocaleString()}</td>
              <td style="padding: 0.75rem; text-align: right;">
                <input type="number" step="1" value="${pr.price}" 
                  class="compact-input product-price" data-idx="${idx}"
                  style="width: 85px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); text-align: right; font-weight: 750;">
              </td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace;">$${pr.operation.toLocaleString()}</td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace; color: var(--primary);">$${pr.commission.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      `
    });
    tableContainer.appendChild(table);
    modal.appendChild(tableContainer);
    
    // Manual IVA input switch
    const ivaManualArea = el('div', { 
      style: 'margin-bottom: 1.5rem; padding: 1.15rem 1.5rem; border: 1px solid var(--border); border-radius: 16px; background: rgba(255, 255, 255, 0.01); display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;' 
    });
    
    const isManual = producer.manualIva !== null && producer.manualIva !== undefined;
    const toggleLabel = el('label', { 
      style: 'display: flex; align-items: center; gap: 0.75rem; cursor: pointer; font-weight: 600; color: var(--text-main); margin: 0;',
      html: `
        <span style="font-size: 0.85rem;">🛠️ Usar Cálculo de IVA Manual</span>
        <label class="switch-container-m3" style="margin: 0;">
          <input type="checkbox" id="toggle-manual-iva" ${isManual ? 'checked' : ''}>
          <span class="switch-slider-m3"></span>
        </label>
      ` 
    });
    
    const manualIvaInput = el('input', { 
      attrs: { type: 'number', step: '1', value: isManual ? producer.manualIva : '', placeholder: 'Monto IVA ($)', id: 'manual-iva-input' },
      style: `padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; width: 150px; text-align: right; visibility: ${isManual ? 'visible' : 'hidden'};`
    });
    
    ivaManualArea.appendChild(toggleLabel);
    ivaManualArea.appendChild(manualIvaInput);
    modal.appendChild(ivaManualArea);
 
    // Validation ratio indicator area
    const ratio = producer.facturaOverOpRatio;
    const ratioColor = ratio < 0.4 ? '#f87171' : (ratio > 1.0 ? '#fbbf24' : '#34d399');
    const ratioMsg = ratio < 0.4 ? '⚠️ Ratio Factura/Operación muy bajo (< 40%)' : (ratio > 1.0 ? '⚠️ Ratio Factura/Operación superior al 100%' : '🛡️ Ratio Factura/Operación dentro del rango normal');
 
    const ratioArea = el('div', { 
      style: `margin-bottom: 1.5rem; padding: 0.95rem 1.25rem; border-radius: 14px; background: ${ratioColor}0d; border: 1.5px solid ${ratioColor}25; display: flex; align-items: center; gap: 0.95rem;` 
    });
    ratioArea.innerHTML = `<span style="font-size: 1.4rem;">${ratio < 0.4 || ratio > 1.0 ? '🚩' : '🛡️'}</span>
      <div style="flex: 1;">
        <div style="font-weight: 700; color: ${ratioColor}; font-size: 0.88rem;">Ratio Factura / Operación: ${(ratio * 100).toFixed(1)}%</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-top: 0.15rem;">${ratioMsg}</div>
      </div>`;
    modal.appendChild(ratioArea);
    
    // Financial Breakdown Ledger Summary Cards
    const summaryGrid = el('div', { 
      classes: ['grid-2-cols'], 
      style: 'background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); padding: 1.25rem 1.5rem; border-radius: 16px; gap: 2rem; display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 1.5rem;' 
    });
    
    const leftCol = el('div', { style: 'display: flex; flex-direction: column; gap: 0.65rem;' });
    leftCol.innerHTML = `
      <div class="detail-row"><span>Total Operación:</span> <strong>$${producer.totalOperation.toLocaleString()}</strong></div>
      <div class="detail-row"><span>Total Comisión (${producer.buy?.agent?.percent || 0}%):</span> <strong>$${producer.totalCommission.toLocaleString()}</strong></div>
      <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.25rem;"><span style="color: var(--text-main); font-weight: 700;">Op + Comisión:</span> <strong style="color: #60a5fa;">$${producer.totalOpPlusComm.toLocaleString()}</strong></div>
    `;
    
    const rightCol = el('div', { style: 'display: flex; flex-direction: column; gap: 0.65rem;' });
    rightCol.innerHTML = `
      <div class="detail-row"><span>Achique Total Viaje:</span> <strong>$${buy.reduce.toLocaleString()}</strong></div>
      <div class="detail-row"><span>Achique Prorrateado:</span> <strong style="color: #f87171;">- $${producer.achiqueProrrateado.toLocaleString()}</strong></div>
      <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.25rem;"><span style="color: var(--text-main); font-weight: 700;">Base Factura:</span> <strong>$${producer.totalFactura.toLocaleString()}</strong></div>
    `;
    
    summaryGrid.appendChild(leftCol);
    summaryGrid.appendChild(rightCol);
    modal.appendChild(summaryGrid);
    
    // Taxes ledgers
    const taxesArea = el('div', { 
      style: 'padding: 1.25rem; border-top: 1px dashed var(--border); border-bottom: 1px dashed var(--border); margin-bottom: 1.75rem; display: flex; flex-direction: column; gap: 0.65rem;' 
    });
    taxesArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--text-muted); font-weight: 500;">Neto Imponible (1 / 1.105):</span> <strong style="font-family: monospace; color: var(--text-main); font-size: 0.9rem;">$${producer.neto.toLocaleString()}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--text-muted); font-weight: 500;">IVA Consolidado (10.5%):</span> <strong style="font-family: monospace; color: var(--text-main); font-size: 0.9rem;">$${producer.iva.toLocaleString()}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--text-muted); font-weight: 500;">Retención Ganancias (2% Neto):</span> <strong style="font-family: monospace; color: #f87171; font-size: 0.9rem;">- $${producer.retencionGanancias.toLocaleString()}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 1.15rem; border-top: 1.5px solid var(--primary); padding-top: 1rem; margin-top: 0.5rem; align-items: center;">
        <strong style="color: #ffffff; font-weight: 800;">TOTAL NETO A PAGAR:</strong> 
        <strong style="color: #34d399; font-size: 1.35rem; font-weight: 850; text-shadow: 0 0 10px rgba(52,211,153,0.15);">$${producer.totalAPagar.toLocaleString()}</strong>
      </div>
    `;
    modal.appendChild(taxesArea);
    
    // Modal buttons actions
    const actions = el('div', { 
      classes: ['modal-actions'], 
      style: 'display: flex; gap: 1rem; justify-content: flex-end;' 
    });
    const cancelBtn = el('button', { 
      classes: ['btn-outline'], 
      text: 'Cerrar',
      style: 'padding: 0.65rem 1.5rem; border-radius: 12px; font-weight: 600;'
    });
    const saveBtn = el('button', { 
      classes: ['btn-primary'], 
      text: '💾 Guardar Liquidación', 
      style: 'background: #10b981; border: none; padding: 0.65rem 1.75rem; border-radius: 12px; font-weight: 700; color: #ffffff;' 
    });
    
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
    
    // Handle manual tax toggle changes
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
    
    // Live update interactive calculation binds
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

/**
 * Displays the new travel creation or logistical editing modal sheet.
 * @param {Object|null} travel - Existing travel parameters to edit, or null to create new.
 * @param {Object} options - Navigation and storage event actions.
 */
export function showTravelModal(travel, options) {
  const container = document.getElementById('travel-modal-container') || (() => {
    const div = el('div', { attrs: { id: 'travel-modal-container' } });
    document.body.appendChild(div);
    return div;
  })();
  
  const isEdit = !!travel;
  const trucks = options.trucks || [];

  // Retain local expense listings copy
  let expArray = travel?.expenses ? (Array.isArray(travel.expenses) ? travel.expenses : Object.values(travel.expenses)) : [];
  let localExpenses = [...expArray];

  const renderModal = () => {
    const trucksOpts = trucks.map(t => `<option value="${t.id}" ${travel?.truck?.id == t.id ? 'selected' : ''}>${t.name}</option>`).join('');
    
    let kmO = Number(travel?.kmOnOrigin || 0);
    let kmD = Number(travel?.kmOnDestination || 0);
    let dist = Math.max(0, kmD - kmO);

    container.innerHTML = `
      <div class="modal-overlay" style="position: fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1.5rem;">
        <div class="glass-card fade-in" id="travel-modal" style="max-width: 620px; width: 100%; max-height: 90vh; overflow-y: auto; border-radius: 24px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0;">
          
          <!-- Header Bar -->
          <div style="padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01);">
            <h3 style="margin: 0; color: var(--primary); font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; gap: 0.65rem;">
              <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" /></svg>
              ${isEdit ? 'Editar Logística de Viaje' : 'Nuevo Viaje Operacional'}
            </h3>
          </div>

          <form id="travel-form" style="padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem;">
            
            <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">📅 Fecha de Viaje</label>
                <input type="date" id="t-date" value="${travel?.date || new Date().toISOString().split('T')[0]}" required style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; font-size: 0.85rem;">
              </div>
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">📌 Estado</label>
                <select id="t-status" style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; font-size: 0.85rem;">
                  <option value="DRAFT" ${travel?.status === 'DRAFT' ? 'selected' : ''}>Borrador</option>
                  <option value="ACTIVE" ${travel?.status === 'ACTIVE' || !travel ? 'selected' : ''}>Activo</option>
                  <option value="COMPLETED" ${travel?.status === 'COMPLETED' ? 'selected' : ''}>Completado</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">📝 Descripción / Destino</label>
              <input type="text" id="t-desc" value="${travel?.description || ''}" placeholder="Ej. Remisión Vacunos Liniers..." style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.85rem;">
            </div>

            <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">🚛 Camión Asignado</label>
              <select id="t-truck" required style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; font-size: 0.85rem;">
                <option value="">-- Seleccionar Camión --</option>
                ${trucksOpts}
              </select>
            </div>

            <!-- Odómetro panel card -->
            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
              <h4 style="margin: 0 0 1rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
                🛣️ Odómetro de Ruta
              </h4>
              <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
                <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                  <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Km Salida (Origen)</label>
                  <input type="number" id="t-km-o" step="0.1" value="${kmO}" required style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
                </div>
                <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                  <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Km Retorno (Destino)</label>
                  <input type="number" id="t-km-d" step="0.1" value="${kmD}" required style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
                </div>
              </div>
              <div style="margin-top: 1rem; padding: 0.65rem 1rem; background: var(--primary-container); border-radius: 10px; color: var(--on-primary-container); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.8rem; font-weight: 600;">Distancia Total:</span>
                <strong id="t-dist" style="font-size: 1.15rem; font-weight: 850;">${dist} km</strong>
              </div>
            </div>

            <!-- Combustible panel card -->
            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
              <h4 style="margin: 0 0 1rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
                ⛽ Consumo de Combustible
              </h4>
              <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
                <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                  <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Odo. en Surtidor (Km)</label>
                  <input type="number" id="t-km-p" step="0.1" value="${travel?.kmOnPump || 0}" style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
                </div>
                <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                  <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Litros Abastecidos</label>
                  <input type="number" id="t-liters" step="0.1" value="${travel?.litersOnPump || 0}" style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
                </div>
              </div>
            </div>

            <!-- Gastos Adicionales panel card -->
            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
              <h4 style="margin: 0 0 1rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
                💸 Gastos Varios y Viáticos
              </h4>
              
              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; max-height: 140px; overflow-y: auto; padding-right: 0.25rem;">
                ${localExpenses.map((e, index) => `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.85rem; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px solid var(--border);">
                    <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                      <span style="font-size: 0.82rem; font-weight: 700; color: #ffffff;">${e.description}</span>
                      <span style="font-size: 0.68rem; font-weight: 600; color: ${e.isReimbursable ? '#34d399' : 'var(--text-muted)'};">${e.isReimbursable ? '♻️ A Reembolsar' : '❌ No Reembolsable'}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.85rem;">
                      <strong style="font-size: 0.9rem; font-family: monospace; color: var(--text-main);">$${e.amount}</strong>
                      <button type="button" class="btn-icon btn-delete-exp" data-idx="${index}" style="color: #f87171; background: transparent; border: none; cursor: pointer; padding: 0.25rem; display: flex; align-items: center; justify-content: center;">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                      </button>
                    </div>
                  </div>
                `).join('')}
                ${localExpenses.length === 0 ? `<div style="font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 0.75rem; border: 1px dashed var(--border); border-radius: 10px;">Sin gastos registrados en el viaje</div>` : ''}
              </div>
 
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; background: rgba(0,0,0,0.12); padding: 0.65rem; border-radius: 12px; border: 1px solid var(--border);">
                <input type="text" id="e-desc" placeholder="Descripción Gasto" style="flex: 2.2; padding: 0.45rem 0.75rem; border-radius: 8px; border: 1px solid var(--border); font-size: 0.8rem; background: var(--bg-main); color: var(--text-main); font-weight: 600;">
                <input type="number" id="e-amount" placeholder="Monto ($)" style="flex: 1.1; padding: 0.45rem 0.75rem; border-radius: 8px; border: 1px solid var(--border); font-size: 0.8rem; background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
                
                <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; cursor: pointer; color: var(--text-muted); font-weight: 700; padding: 0.25rem 0.5rem; user-select: none;">
                  <input type="checkbox" id="e-reimb" checked style="cursor: pointer;"> Reemb.
                </label>
                
                <button type="button" id="btn-add-exp" class="btn-secondary" style="padding: 0.45rem 0.85rem; border-radius: 8px; font-size: 0.85rem; font-weight: 800; background: var(--primary); color: #ffffff; border: none; cursor: pointer; transition: all 0.2s ease;">+</button>
              </div>
            </div>

            <!-- Footer actions buttons -->
            <div class="modal-actions" style="margin-top: 0.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem;">
              <button type="button" class="btn-outline" id="btn-cancel-tmodal" style="padding: 0.65rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer;">Cancelar</button>
              <button type="submit" class="btn-primary" style="padding: 0.65rem 1.75rem; display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; font-weight: 750;">
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
    
    // Auto-calculates odometer values in real-time
    const updateDist = () => {
      const o = Number(document.getElementById('t-km-o').value || 0);
      const d = Number(document.getElementById('t-km-d').value || 0);
      document.getElementById('t-dist').textContent = Math.max(0, d - o) + ' km';
    };
    document.getElementById('t-km-o').addEventListener('input', updateDist);
    document.getElementById('t-km-d').addEventListener('input', updateDist);

    // Save temporary state during array updates
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

    // Add dynamic expense
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

    // Delete dynamic expense
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

  renderModal();
}
