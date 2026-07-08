import { renderSettlementModal } from '../components/SettlementModal.js';
import { showTravelModal } from '../components/TravelModal.js';
import { el } from '../../../frameworks/utils/dom.js';
import { renderTimeFilterUI } from '../components/Filters.js';
import { Buy } from '../../../domain/entities/Buy.js';
import { renderDateModal } from '../components/Modals.js';


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

  let list;
  const oldList = container.querySelector('.card-list');
  const isFirstRender = !oldList;

  if (isFirstRender) {
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
          <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-main);"></h2>
          <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;"></p>
        </div>
      </div>
      <button id="btn-add-travel" class="btn-primary" style="margin: 0; padding: 0.7rem 1.4rem; border-radius: 12px; font-weight: 600;">+ Nuevo Viaje</button>
    `;
    // Force direct text assignment to respect security guidelines
    mainHeader.querySelector('h2').textContent = '🚛 Gestión de Viajes';
    mainHeader.querySelector('p').textContent = 'Monitorea remisiones, rendimiento de faena y liquidaciones de productores.';
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
        style: `background: ${isActive ? 'var(--primary)' : 'transparent'}; color: ${isActive ? 'var(--on-primary)' : 'var(--text-muted)'}; border: none; padding: 0.5rem 1.15rem; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease;`
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
    list = el('div', { 
      classes: ['card-list'],
      style: 'display: flex; flex-direction: column; gap: 2rem; margin-bottom: 2rem;'
    });
    container.appendChild(list);
  } else {
    list = oldList;
    list.innerHTML = '';

    // Update active toolbar controls values statefully
    container.querySelectorAll('.filter-btn').forEach(btn => {
      const f = btn.textContent;
      const isActive = currentFilter === f;
      btn.style.background = isActive ? 'var(--primary)' : 'transparent';
      btn.style.color = isActive ? 'var(--on-primary)' : 'var(--text-muted)';
    });

    const sortBtn = container.querySelector('.sort-toggle');
    if (sortBtn) {
      sortBtn.innerHTML = `📅 Fecha ${currentSort === 'DESC' ? '▼' : '▲'}`;
    }

    container.querySelectorAll('.category-chip').forEach(chip => {
      const cat = chip.textContent;
      const isTodos = cat === 'TODOS';
      const isSelected = isTodos 
        ? selectedCategories.length === 0 
        : selectedCategories.includes(cat);
      chip.className = `category-chip ${isSelected ? 'active' : 'inactive'}`;
    });

    const commInput = container.querySelector('.comm-toggle input');
    if (commInput) commInput.checked = includeCommission;

    const oldPagin = container.querySelector('.pagination');
    if (oldPagin) oldPagin.remove();
  }

  // Cards render loops
  data.forEach(travel => {
    const buy = travel.buy || {};
    const agentName = buy.agent?.name;
    const card = el('div', { 
      classes: ['glass-card', 'settings-card'],
      style: 'padding: 2.25rem; border-radius: 24px; transition: all 0.25s cubic-bezier(0.2, 0, 0.2, 1); border: 1px solid var(--border); background: rgba(255,255,255,0.015); box-shadow: var(--elevation-1);'
    });

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
      card.style.borderColor = 'var(--primary)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'var(--elevation-1)';
      card.style.borderColor = 'var(--border)';
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
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; flex-wrap: wrap;">
            <span style="font-size: 1.05rem; font-weight: 750; color: #60a5fa; display: flex; align-items: center; gap: 0.35rem;">📅 ${travel.date || ''}</span>
            <span style="color: var(--text-muted); font-size: 0.85rem;">&bull;</span>
            <span class="card-subtitle" style="font-size: 0.85rem; color: var(--text-muted); font-weight: 550; display: flex; align-items: center; gap: 0.35rem;">🏷️ ${travel.description || 'Sin descripción'}</span>
          </div>
        </div>
        <div class="header-status" style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          ${agentName ? `<span class="agent-badge" style="background: rgba(255,255,255,0.04); color: var(--text-main); font-weight: 600; font-size: 0.75rem; padding: 0.3rem 0.75rem; border-radius: 8px; border: 1px solid var(--border);">👤 ${agentName}</span>` : ''}
          <kmp-status-chip status="${travel.status || 'DRAFT'}"></kmp-status-chip>
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
        <div class="metrics-column" style="background: rgba(255,255,255,0.012); border: 1px solid var(--border); padding: 1.5rem; border-radius: 20px; transition: all 0.2s;">
          <h4 style="margin: 0 0 1rem 0; font-size: 0.9rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">💰 Economía</h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Operación Total:</span> <strong style="color:var(--text-main); font-family:monospace;">$${totalOp.toLocaleString()}</strong></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Comisión Agente:</span> <strong style="color:var(--text-main); font-family:monospace;">$${commission.toLocaleString()}</strong></div>
            <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.65rem; margin-top: 0.35rem; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight: 700; color: var(--text-main); font-size:0.88rem;">Total c/ Comisión:</span>
              <strong style="color: #60a5fa; font-size:1.1rem; font-family:monospace; font-weight:800; text-shadow:0 0 8px rgba(96,165,250,0.15);">$${totalOpWithComm.toLocaleString()}</strong>
            </div>
            
            <div class="detail-row" style="margin-top: 0.65rem; border-top: 1px dashed var(--border); padding-top: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform:uppercase; letter-spacing:0.3px;">Achique Total (Viaje):</span>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">$</span>
                <input type="number" class="compact-input" value="${buy.reduce || 0}" 
                  style="width: 110px; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); text-align: right; font-weight: 750; font-family:monospace; outline:none; transition:all 0.2s;"
                  onfocus="this.style.borderColor='var(--primary)'"
                  onblur="this.style.borderColor='var(--border)'"
                  onchange="this.dataset.id='${travel.id}'; window._ui_onReduceUpdate && window._ui_onReduceUpdate('${travel.id}', this.value)">
              </div>
            </div>
          </div>
        </div>
        
        <!-- Column 2: Yield Subcard -->
        <div class="metrics-column" style="background: rgba(255,255,255,0.012); border: 1px solid var(--border); padding: 1.5rem; border-radius: 20px; transition: all 0.2s;">
          <h4 style="margin: 0 0 1rem 0; font-size: 0.9rem; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;">📈 Rendimiento</h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Categoría(s):</span> <span style="background:rgba(255,255,255,0.04); color:var(--text-main); font-weight:700; padding:0.15rem 0.45rem; border-radius:6px; font-size:0.75rem; text-transform:uppercase; border:1px solid rgba(255,255,255,0.06);">${buyCategoryDisplay}</span></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Cantidad:</span> <strong style="color:var(--text-main);">${buy.totalQuantity || 0} cabezas</strong></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Kg Limpios:</span> <strong style="color:var(--text-main); font-family:monospace;">${(buy.totalKgClean || 0).toLocaleString()} kg</strong></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Kg Faena:</span> <strong style="color:var(--text-main); font-family:monospace;">${(buy.totalKgFaena || 0).toLocaleString()} kg</strong></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Promedio por Cabeza:</span> <strong style="color:var(--text-main); font-family:monospace;" title="kg limpio / cantidad cabezas">${(buy.totalQuantity > 0 ? (buy.totalKgClean / buy.totalQuantity) : 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} kg/cab</strong></div>
            <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.65rem; margin-top: 0.35rem; display:flex; justify-content:space-between; align-items:center;">
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 700; color: var(--text-main); font-size:0.88rem;">Rendimiento Gral:</span>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500;">(kg faena / kg limpios)</span>
              </div>
              <span style="background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.25); font-weight: 800; font-size: 0.95rem; padding: 0.2rem 0.6rem; border-radius: 6px; font-family:monospace;">${(yieldValue * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style="font-size: 0.85rem; font-weight: 750; color: var(--text-muted); text-transform: uppercase; margin: 1.5rem 0 1rem 0; letter-spacing: 0.8px; display: flex; align-items: center; gap: 0.4rem;">👥 Productores Asociados</div>
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
        style: 'background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-left: 4px solid var(--primary); border-radius: 16px; padding: 1.35rem; display: flex; flex-direction: column; gap: 0.85rem; transition: all 0.2s;' 
      });
      const iva = p.iva || 0;
      const ganancias = p.retencionGanancias || 0;
      const producerName = p.producer?.name || 'Productor';
      const cuit = p.producer?.cuit || '';
      const cbu = p.producer?.cbu || '';
      const totalAPagar = p.totalAPagar || 0;
      
      const pHeader = el('div', { 
        classes: ['producer-header'], 
        style: 'display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 0.75rem;' 
      });
      pHeader.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <strong style="font-size: 1rem; color: #ffffff; letter-spacing:0.2px;">👤 ${producerName}</strong>
          ${p.origin ? `<span style="background:rgba(255,255,255,0.03); color:var(--text-muted); font-size:0.7rem; font-weight:700; padding:0.15rem 0.45rem; border-radius:6px; border:1px solid rgba(255,255,255,0.05); text-transform:uppercase;">📍 ${p.origin}</span>` : ''}
        </div>
      `;
      
      const liqBtn = el('button', { 
        classes: ['btn-action'], 
        text: '📊 Liquidar',
        style: 'background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; border: none; border-radius: 8px; padding: 0.45rem 1rem; font-size: 0.75rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; box-shadow: 0 2px 8px rgba(37,99,235,0.25); transition: all 0.2s;'
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
        style: 'display: flex; gap: 0.65rem; flex-wrap: wrap; margin-top: -0.25rem;' 
      });
      pInfo.innerHTML = `
        ${cuit ? `<span class="info-badge" style="background: rgba(255,255,255,0.015); color: var(--text-muted); font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--border); letter-spacing:0.3px;"><strong style="opacity:0.8;">CUIT:</strong> ${cuit}</span>` : ''}
        ${cbu ? `<span class="info-badge" style="background: rgba(255,255,255,0.015); color: var(--text-muted); font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--border); letter-spacing:0.3px;"><strong style="opacity:0.8;">CBU:</strong> ${cbu}</span>` : ''}
      `;
      pItem.appendChild(pInfo);

      // Tax Ledger badges
      const pTaxes = el('div', { 
        classes: ['producer-taxes'], 
        style: 'display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;' 
      });
      pTaxes.innerHTML = `
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
          <span class="tax-badge" style="background: rgba(255, 255, 255, 0.03); color: var(--text-main); border: 1px solid var(--border); font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; letter-spacing:0.2px;">NETO: $${(p.neto || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          ${iva > 0 ? `<span class="tax-badge tax-iva" style="background: rgba(37, 99, 235, 0.08); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.2); font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; letter-spacing:0.2px;">IVA: $${iva.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>` : ''}
          ${ganancias > 0 ? `<span class="tax-badge tax-ganancias" style="background: rgba(245, 158, 11, 0.08); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; letter-spacing:0.2px;">RET. GAN.: $${ganancias.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>` : ''}
        </div>
        <div style="margin-left: auto; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
          <span style="font-size:0.72rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.3px;">FACTURA (Neto + IVA):</span>
          <span class="tax-badge" style="background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); font-weight: 850; font-size: 0.85rem; padding: 0.3rem 0.85rem; border-radius: 8px; font-family:monospace; text-shadow:0 0 6px rgba(52,211,153,0.15);">$${(p.totalFactura || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
      `;
      pItem.appendChild(pTaxes);

      // Compact micro-table of livestock products
      const pMiniList = el('div', { 
        classes: ['product-mini-list'],
        style: 'background: rgba(0,0,0,0.15); border-radius: 12px; border: 1px solid rgba(255,255,255,0.02); overflow: hidden; margin-top: 0.25rem;' 
      });
      
      const pTable = el('table', {
        style: 'width: 100%; border-collapse: collapse; font-size: 0.76rem; text-align: left;'
      });
      pTable.innerHTML = `
        <thead>
          <tr style="border-bottom: 1.5px solid rgba(255,255,255,0.04); background: rgba(255,255,255,0.01); color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 0.55rem 0.85rem;">Detalle Producto</th>
            <th style="padding: 0.55rem 0.85rem; text-align: center; width: 80px;">Cabezas</th>
            <th style="padding: 0.55rem 0.85rem; text-align: right;">Kilos Limpios</th>
            <th style="padding: 0.55rem 0.85rem; text-align: center; width: 100px;">% Desbaste</th>
            <th style="padding: 0.55rem 0.85rem; text-align: right; width: 120px;">Precio Vivo</th>
          </tr>
        </thead>
        <tbody>
          ${(p.listOfProducts || []).map(pr => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.02); color: var(--text-main); font-weight: 600;">
              <td style="padding: 0.5rem 0.85rem; font-weight: 700; color: #ffffff;">🥩 ${pr.name}</td>
              <td style="padding: 0.5rem 0.85rem; text-align: center; color: var(--text-muted);">${pr.quantity} uds</td>
              <td style="padding: 0.5rem 0.85rem; text-align: right; font-family: monospace;">${pr.kgClean.toFixed(0).toLocaleString()} kg</td>
              <td style="padding: 0.5rem 0.85rem; text-align: center; color: var(--text-muted);">${pr.roughing}%</td>
              <td style="padding: 0.5rem 0.85rem; text-align: right; font-family: monospace; color: var(--text-main); font-weight: 750;">$${pr.price.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      `;
      pMiniList.appendChild(pTable);
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
