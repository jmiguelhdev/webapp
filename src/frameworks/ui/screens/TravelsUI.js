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
    data = [], totalItems = 0, currentPage = 1, itemsPerPage = 5, 
    currentFilter = 'TODOS', currentSort = 'DESC', 
    onFilter, onSort, onPage,
    categories = [], selectedCategories = [], includeCommission = false, 
    onCategoryToggle, onCommissionToggle,
    agents = [], producers = [],
    selectedAgent = '', selectedProducer = '',
    onAgentChange, onProducerChange,
    summaryStats = {},
    searchQuery = '', onSearch
  } = options;
  
  // Preservar la posición del cursor en inputs de búsqueda para evitar pérdida de foco
  const activeId = document.activeElement ? document.activeElement.id : null;
  const selectionStart = document.activeElement ? document.activeElement.selectionStart : null;
  const selectionEnd = document.activeElement ? document.activeElement.selectionEnd : null;

  let list;
  const oldList = container.querySelector('.card-list');
  const isFirstRender = !oldList;

  if (isFirstRender) {
    container.innerHTML = '';

    // 1. Cabecera Principal con Acciones Rápidas
    const mainHeader = el('div', { 
      classes: ['dashboard-header', 'glass-card'], 
      style: 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding: 1.5rem 2rem; border-radius: 20px; flex-wrap: wrap; gap: 1rem;' 
    });
    mainHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1.25rem;">
        <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard" style="border: 1px solid var(--border); background: var(--bg-main);">
          <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
        </button>
        <div>
          <h2 style="margin: 0; font-size: 1.6rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.02em;">🚛 Gestión de Viajes y Hacienda</h2>
          <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.88rem;">Monitoreo logístico de tropas, análisis de rinde de faena y liquidaciones fiscales a productores.</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <input type="file" accept=".pdf" id="pdf-faena-input" style="display: none;">
        <button id="btn-upload-pdf" class="btn-primary" style="margin: 0; background: #2563eb; border: none; font-size: 0.85rem; padding: 0.7rem 1.25rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
          <span>📄</span> Subir PDF Faena
        </button>

        <input type="file" webkitdirectory="" directory="" multiple="" id="pdf-scan-input" style="display: none;">
        <button id="btn-scan-folder" class="btn-primary" title="Escanear una carpeta local en busca de PDFs" style="margin: 0; background: #10b981; border: none; font-size: 0.85rem; padding: 0.7rem 1.25rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
          <span>📁</span> Escanear Carpeta
        </button>

        <button id="btn-add-travel" class="btn-primary" style="margin: 0; padding: 0.7rem 1.5rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 4px 15px rgba(143,0,20,0.3);">
          <span>➕</span> Nuevo Viaje
        </button>
      </div>
    `;
    container.appendChild(mainHeader);

    mainHeader.querySelector('#back-to-dash').onclick = options.onBack;
    mainHeader.querySelector('#btn-add-travel').onclick = () => {
      if (options.onAddTravel) options.onAddTravel();
    };

    const pdfInput = mainHeader.querySelector('#pdf-faena-input');
    const pdfBtn = mainHeader.querySelector('#btn-upload-pdf');
    pdfBtn.onclick = () => pdfInput.click();
    pdfInput.onchange = (e) => {
      if (e.target.files && e.target.files[0] && options.onPdfUpload) {
        options.onPdfUpload(e.target.files[0]);
      }
    };

    const scanInput = mainHeader.querySelector('#pdf-scan-input');
    const scanBtn = mainHeader.querySelector('#btn-scan-folder');
    scanBtn.onclick = () => scanInput.click();
    scanInput.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0 && options.onScanDirectory) {
        options.onScanDirectory(Array.from(e.target.files));
      }
      scanInput.value = '';
    };

    // 2. Panel de KPIs Consolidados (Métricas en Tiempo Real)
    const kpiStrip = el('div', { 
      id: 'travels-kpi-strip',
      classes: ['stats-grid'], 
      style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;' 
    });
    container.appendChild(kpiStrip);

    // 3. Centro de Control de Búsqueda y Filtros
    const controlsCard = el('div', { 
      classes: ['glass-card'], 
      style: 'margin-bottom: 2rem; padding: 1.5rem 1.75rem; border-radius: 20px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1.25rem;' 
    });

    // Fila A: Búsqueda Universal + Selectores de Comisionista y Productor + Orden
    const rowTop = el('div', { 
      style: 'display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;' 
    });
    rowTop.innerHTML = `
      <!-- Input de búsqueda universal -->
      <div style="
        flex: 1.5; 
        min-width: 260px;
        display: flex; 
        align-items: center; 
        gap: 0.65rem; 
        background: var(--bg-main); 
        border: 1px solid var(--border); 
        border-radius: 12px; 
        padding: 0.65rem 1rem;
      " class="search-input-box">
        <span style="font-size: 1.15rem; color: var(--primary); user-select: none;">🔍</span>
        <input 
          type="text" 
          id="travel-search-input" 
          placeholder="Buscar por productor, CUIT, comisionista, chofer, patente, tropa..." 
          autocomplete="off"
          value="${searchQuery || ''}"
          style="
            flex: 1;
            border: none;
            background: transparent;
            color: var(--text-main);
            font-size: 0.88rem;
            outline: none;
            font-family: inherit;
          "
        />
        <button id="clear-travel-search-btn" title="Limpiar búsqueda" style="
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.05rem;
          display: ${searchQuery ? 'block' : 'none'};
          padding: 0.15rem;
          line-height: 1;
        ">✕</button>
      </div>

      <!-- Selector de Comisionista -->
      <div style="flex: 1; min-width: 200px; display: flex; align-items: center; gap: 0.4rem;">
        <select id="agent-filter-select" style="
          width: 100%;
          background: var(--bg-main);
          color: var(--text-main);
          border: 1px solid var(--border);
          padding: 0.65rem 0.85rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          outline: none;
          cursor: pointer;
        ">
          <option value="">👤 Todos los Comisionistas</option>
          ${agents.map(ag => `<option value="${ag}" ${selectedAgent === ag ? 'selected' : ''}>👤 ${ag}</option>`).join('')}
        </select>
      </div>

      <!-- Selector de Productor -->
      <div style="flex: 1; min-width: 200px; display: flex; align-items: center; gap: 0.4rem;">
        <select id="producer-filter-select" style="
          width: 100%;
          background: var(--bg-main);
          color: var(--text-main);
          border: 1px solid var(--border);
          padding: 0.65rem 0.85rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          outline: none;
          cursor: pointer;
        ">
          <option value="">🏭 Todos los Productores</option>
          ${producers.map(pr => `<option value="${pr.name}" ${selectedProducer === pr.name ? 'selected' : ''}>🏭 ${pr.name} ${pr.cuit ? `(${pr.cuit})` : ''}</option>`).join('')}
        </select>
      </div>

      <!-- Botón de Ordenamiento -->
      <button id="sort-travels-btn" class="sort-toggle" style="
        background: rgba(255, 255, 255, 0.04); 
        border: 1px solid var(--border); 
        color: var(--text-main); 
        font-size: 0.82rem; 
        padding: 0.65rem 1.15rem; 
        border-radius: 12px; 
        cursor: pointer; 
        font-weight: 600; 
        display: flex; 
        align-items: center; 
        gap: 0.4rem;
        white-space: nowrap;
      ">
        📅 Fecha ${currentSort === 'DESC' ? '▼' : '▲'}
      </button>
    `;
    controlsCard.appendChild(rowTop);

    // Eventos de la Fila A
    const searchInput = rowTop.querySelector('#travel-search-input');
    const clearSearchBtn = rowTop.querySelector('#clear-travel-search-btn');
    const agentSelect = rowTop.querySelector('#agent-filter-select');
    const producerSelect = rowTop.querySelector('#producer-filter-select');
    const sortBtn = rowTop.querySelector('#sort-travels-btn');

    searchInput.oninput = (e) => {
      const val = e.target.value;
      clearSearchBtn.style.display = val.length > 0 ? 'block' : 'none';
      if (onSearch) onSearch(val);
    };

    clearSearchBtn.onclick = () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
      if (onSearch) onSearch('');
    };

    agentSelect.onchange = (e) => {
      if (onAgentChange) onAgentChange(e.target.value);
    };

    producerSelect.onchange = (e) => {
      if (onProducerChange) onProducerChange(e.target.value);
    };

    sortBtn.onclick = () => {
      if (onSort) onSort(currentSort === 'DESC' ? 'ASC' : 'DESC');
    };

    // Fila B: Estado + Período Temporal + Categorías + Comisión
    const rowMid = el('div', { 
      style: 'display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1.15rem;' 
    });

    // Sub-fila: Estados y Filtros Temporales
    const statusAndTime = el('div', { 
      style: 'display: flex; align-items: center; justify-content: space-between; gap: 1.25rem; flex-wrap: wrap;' 
    });

    // Segmented control de Estados
    const filterGroup = el('div', { 
      classes: ['segmented-control-container'],
      style: 'display: flex; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); padding: 4px; border-radius: 12px;' 
    });
    ['TODOS', 'ACTIVO', 'FINALIZADO', 'BORRADOR'].forEach(f => {
      const isAct = currentFilter === f || (f === 'FINALIZADO' && currentFilter === 'COMPLETED');
      const btn = el('button', { 
        classes: ['filter-btn'], 
        text: f,
        style: `background: ${isAct ? 'var(--primary)' : 'transparent'}; color: ${isAct ? 'var(--on-primary)' : 'var(--text-muted)'}; border: none; padding: 0.45rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease;`
      });
      btn.onclick = () => {
        const mappedFilter = f === 'FINALIZADO' ? 'COMPLETED' : f;
        if (onFilter) onFilter(mappedFilter);
      };
      filterGroup.appendChild(btn);
    });
    statusAndTime.appendChild(filterGroup);

    // Filtro temporal
    const timeFilterArea = renderTimeFilterUI(options);
    timeFilterArea.style.margin = '0';
    statusAndTime.appendChild(timeFilterArea);

    rowMid.appendChild(statusAndTime);

    // Sub-fila: Chips de Categorías y Switch Con Comisión
    const catRow = el('div', { 
      style: 'display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 0.95rem; flex-wrap: wrap;' 
    });

    const catChipsLeft = el('div', { 
      style: 'display: flex; align-items: center; gap: 0.75rem; flex: 1; flex-wrap: wrap;' 
    });
    catChipsLeft.innerHTML = `<span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Categorías:</span>`;
    
    const catChipsContainer = el('div', { 
      classes: ['category-chips-container'],
      style: 'display: flex; gap: 0.45rem; flex-wrap: wrap;'
    });
    
    categories.forEach(cat => {
      const isTodos = cat === 'TODOS';
      const isSelected = isTodos 
        ? selectedCategories.length === 0 
        : selectedCategories.includes(cat);
        
      const chip = el('button', { 
        classes: ['category-chip', isSelected ? 'active' : 'inactive'], 
        text: cat,
        style: 'font-size: 0.75rem; padding: 0.35rem 0.8rem;'
      });
      chip.onclick = () => onCategoryToggle(cat);
      catChipsContainer.appendChild(chip);
    });
    catChipsLeft.appendChild(catChipsContainer);

    // Switch para "Con Comisión"
    const commToggle = el('label', { 
      classes: ['comm-toggle'], 
      style: 'display: flex; align-items: center; gap: 0.75rem; cursor: pointer; background: rgba(255,255,255,0.02); padding: 0.5rem 0.9rem; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s ease;',
      html: `
        <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">Con Comisión</span>
        <label class="switch-container-m3" style="margin: 0;">
          <input type="checkbox" ${includeCommission ? 'checked' : ''}>
          <span class="switch-slider-m3"></span>
        </label>
      ` 
    });
    commToggle.querySelector('input').onchange = (e) => onCommissionToggle(e.target.checked);

    catRow.appendChild(catChipsLeft);
    catRow.appendChild(commToggle);
    rowMid.appendChild(catRow);
    controlsCard.appendChild(rowMid);

    // Fila C: Barra de Filtros Activos (Pills) y Contador de Resultados
    const activeFiltersBar = el('div', { 
      id: 'travels-active-filters-bar',
      style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem;' 
    });
    controlsCard.appendChild(activeFiltersBar);

    container.appendChild(controlsCard);

    // 4. Contenedor de Lista de Tarjetas
    list = el('div', { 
      classes: ['card-list'],
      style: 'display: flex; flex-direction: column; gap: 1.75rem; margin-bottom: 2rem;'
    });
    container.appendChild(list);
  } else {
    list = oldList;
    list.innerHTML = '';

    // Sincronizar valores de inputs en re-render
    const searchInput = container.querySelector('#travel-search-input');
    if (searchInput && searchInput.value !== searchQuery) {
      searchInput.value = searchQuery || '';
    }

    const clearSearchBtn = container.querySelector('#clear-travel-search-btn');
    if (clearSearchBtn) {
      clearSearchBtn.style.display = (searchQuery && searchQuery.length > 0) ? 'block' : 'none';
    }

    const agentSelect = container.querySelector('#agent-filter-select');
    if (agentSelect) {
      agentSelect.innerHTML = `
        <option value="">👤 Todos los Comisionistas</option>
        ${agents.map(ag => `<option value="${ag}" ${selectedAgent === ag ? 'selected' : ''}>👤 ${ag}</option>`).join('')}
      `;
    }

    const producerSelect = container.querySelector('#producer-filter-select');
    if (producerSelect) {
      producerSelect.innerHTML = `
        <option value="">🏭 Todos los Productores</option>
        ${producers.map(pr => `<option value="${pr.name}" ${selectedProducer === pr.name ? 'selected' : ''}>🏭 ${pr.name} ${pr.cuit ? `(${pr.cuit})` : ''}</option>`).join('')}
      `;
    }

    const sortBtn = container.querySelector('#sort-travels-btn');
    if (sortBtn) {
      sortBtn.innerHTML = `📅 Fecha ${currentSort === 'DESC' ? '▼' : '▲'}`;
    }

    container.querySelectorAll('.filter-btn').forEach(btn => {
      const f = btn.textContent;
      const isAct = currentFilter === f || (f === 'FINALIZADO' && currentFilter === 'COMPLETED');
      btn.style.background = isAct ? 'var(--primary)' : 'transparent';
      btn.style.color = isAct ? 'var(--on-primary)' : 'var(--text-muted)';
    });

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

  // Actualizar Panel de KPIs
  const kpiStripEl = container.querySelector('#travels-kpi-strip');
  if (kpiStripEl) {
    const s = summaryStats || {};
    const totalTravels = s.totalTravels || totalItems || 0;
    const totalHeads = s.totalHeads || 0;
    const totalKgClean = s.totalKgClean || 0;
    const totalKgFaena = s.totalKgFaena || 0;
    const totalOp = (includeCommission ? s.totalOperationWithComm : s.totalOperation) || 0;
    const avgYieldPercent = ((s.avgYield || 0) * 100).toFixed(2);

    kpiStripEl.innerHTML = `
      <div class="stat-card glass-card" style="padding: 1.15rem; border-radius: 14px; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 1.75rem; background: rgba(99,102,241,0.1); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #818cf8;">🚚</div>
        <div>
          <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Viajes Filtrados</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">${totalTravels}</div>
        </div>
      </div>
      <div class="stat-card glass-card" style="padding: 1.15rem; border-radius: 14px; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 1.75rem; background: rgba(16,185,129,0.1); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #10b981;">🐂</div>
        <div>
          <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Cabezas Totales</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #10b981;">${totalHeads.toLocaleString()}</div>
        </div>
      </div>
      <div class="stat-card glass-card" style="padding: 1.15rem; border-radius: 14px; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 1.75rem; background: rgba(37,99,235,0.1); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #60a5fa;">⚖️</div>
        <div>
          <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Kilos Faena / Limpios</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); font-family: monospace;">
            ${(totalKgFaena || 0).toLocaleString()} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">/ ${(totalKgClean || 0).toLocaleString()} kg</span>
          </div>
        </div>
      </div>
      <div class="stat-card glass-card" style="padding: 1.15rem; border-radius: 14px; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 1.75rem; background: rgba(16,185,129,0.1); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #34d399;">📈</div>
        <div>
          <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Rendimiento Promedio</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #34d399; font-family: monospace;">${avgYieldPercent}%</div>
        </div>
      </div>
      <div class="stat-card glass-card" style="padding: 1.15rem; border-radius: 14px; border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem;">
        <div style="font-size: 1.75rem; background: rgba(245,158,11,0.1); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: #f59e0b;">💵</div>
        <div>
          <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Operación</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: #60a5fa; font-family: monospace;">$${(totalOp || 0).toLocaleString()}</div>
        </div>
      </div>
    `;
  }

  // Actualizar Barra de Filtros Activos
  const activeFiltersBarEl = container.querySelector('#travels-active-filters-bar');
  if (activeFiltersBarEl) {
    const activeAgentsList = Array.isArray(options.selectedAgents) ? options.selectedAgents : (selectedAgent ? [selectedAgent] : []);
    const activeProdsList = Array.isArray(options.selectedProducers) ? options.selectedProducers : (selectedProducer ? [selectedProducer] : []);

    const activePills = [];
    activeAgentsList.forEach(ag => {
      activePills.push({ type: 'agent', label: `👤 Comisionista: ${ag}`, onRemove: () => options.onAgentToggle ? options.onAgentToggle(ag) : (onAgentChange && onAgentChange('')) });
    });
    activeProdsList.forEach(pr => {
      activePills.push({ type: 'producer', label: `🏭 Productor: ${pr}`, onRemove: () => options.onProducerToggle ? options.onProducerToggle(pr) : (onProducerChange && onProducerChange('')) });
    });
    if (searchQuery) {
      activePills.push({ type: 'search', label: `🔍 "${searchQuery}"`, onRemove: () => onSearch && onSearch('') });
    }
    selectedCategories.forEach(cat => {
      activePills.push({ type: 'category', label: `🏷️ ${cat}`, onRemove: () => onCategoryToggle && onCategoryToggle(cat) });
    });
    if (currentFilter !== 'TODOS') {
      activePills.push({ type: 'status', label: `📌 Estado: ${currentFilter}`, onRemove: () => onFilter && onFilter('TODOS') });
    }

    const hasFilters = activePills.length > 0;
    activeFiltersBarEl.innerHTML = `
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
        ${hasFilters ? `<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Filtros activos:</span>` : ''}
        ${activePills.map((p, idx) => `
          <button class="active-filter-pill" data-idx="${idx}" style="
            background: rgba(99,102,241,0.1); 
            color: #818cf8; 
            border: 1px solid rgba(99,102,241,0.25); 
            padding: 0.25rem 0.65rem; 
            border-radius: 8px; 
            font-size: 0.78rem; 
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            cursor: pointer;
            transition: all 0.2s;
          ">
            <span>${p.label}</span>
            <span style="opacity: 0.7; font-weight: bold;">✕</span>
          </button>
        `).join('')}
        ${hasFilters ? `
          <button id="btn-clear-all-travel-filters" class="btn-outline" style="padding: 0.25rem 0.65rem; font-size: 0.75rem; border-radius: 8px; margin-left: 0.5rem;">
            🔄 Limpiar Todos
          </button>
        ` : ''}
      </div>
      <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">
        Mostrando ${data.length} de ${totalItems} viajes
      </div>
    `;

    activeFiltersBarEl.querySelectorAll('.active-filter-pill').forEach(pill => {
      const idx = parseInt(pill.dataset.idx, 10);
      pill.onclick = () => {
        if (activePills[idx] && activePills[idx].onRemove) {
          activePills[idx].onRemove();
        }
      };
    });

    const clearAllBtn = activeFiltersBarEl.querySelector('#btn-clear-all-travel-filters');
    if (clearAllBtn) {
      clearAllBtn.onclick = () => {
        if (options.onAgentsChange) options.onAgentsChange([]);
        else if (onAgentChange) onAgentChange('');
        if (options.onProducersChange) options.onProducersChange([]);
        else if (onProducerChange) onProducerChange('');
        if (onSearch) onSearch('');
        if (onCategoryToggle) onCategoryToggle('TODOS');
        if (onFilter) onFilter('TODOS');
      };
    }
  }

  // 5. Manejo de Estado Vacío
  if (data.length === 0) {
    const emptyCard = el('div', { 
      classes: ['glass-card'], 
      style: 'padding: 4rem 2rem; text-align: center; border-radius: 20px; border: 1px dashed var(--border);' 
    });

    const isSearching = searchQuery || selectedAgent || selectedProducer || selectedCategories.length > 0 || currentFilter !== 'TODOS';
    if (isSearching) {
      emptyCard.innerHTML = `
        <div style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.7;">🔍</div>
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; color: var(--text-main);">No se encontraron viajes coincidentes</h3>
        <p style="color: var(--text-muted); margin: 0 0 1.5rem 0; font-size: 0.9rem;">
          No hay remisiones ni operaciones que cumplan con los filtros de comisionista, productor o términos de búsqueda seleccionados.
        </p>
        <button id="btn-empty-reset" class="btn-primary" style="padding: 0.65rem 1.5rem; border-radius: 10px; font-weight: 600;">
          🔄 Restablecer Filtros
        </button>
      `;
      list.appendChild(emptyCard);
      emptyCard.querySelector('#btn-empty-reset').onclick = () => {
        if (onAgentChange) onAgentChange('');
        if (onProducerChange) onProducerChange('');
        if (onSearch) onSearch('');
        if (onCategoryToggle) onCategoryToggle('TODOS');
        if (onFilter) onFilter('TODOS');
      };
    } else {
      emptyCard.innerHTML = `
        <div style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.7;">🚛</div>
        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; color: var(--text-main);">Sin viajes registrados</h3>
        <p style="color: var(--text-muted); margin: 0 0 1.5rem 0; font-size: 0.9rem;">
          Comienza creando una nueva operación logística o importando un PDF de faena.
        </p>
        <button id="btn-empty-add" class="btn-primary" style="padding: 0.7rem 1.75rem; border-radius: 12px; font-weight: 700;">
          ➕ Registrar Primer Viaje
        </button>
      `;
      list.appendChild(emptyCard);
      emptyCard.querySelector('#btn-empty-add').onclick = () => {
        if (options.onAddTravel) options.onAddTravel();
      };
    }
  }

  // 6. Renderizado de Tarjetas de Viaje
  data.forEach(travel => {
    const buy = travel.buy || {};
    const agentName = buy.agent?.name;
    const agentPercent = buy.agent?.percent;
    const commission = buy.agentCommissionAmount || 0;
    const totalOp = buy.totalOperation || 0;
    const totalOpWithComm = buy.totalOperationWithCommission || 0;
    const yieldValue = buy.generalYield || 0;
    const status = String(travel.status || 'DRAFT').toUpperCase();

    // Color de acento según estado
    let borderAccent = '#f59e0b';
    if (status === 'ACTIVE' || status === 'ACTIVO') borderAccent = '#2563eb';
    else if (status === 'COMPLETED' || status === 'FINALIZADO') borderAccent = '#10b981';

    const card = el('div', { 
      classes: ['glass-card', 'settings-card'],
      style: `
        padding: 2rem; 
        border-radius: 22px; 
        transition: all 0.25s cubic-bezier(0.2, 0, 0.2, 1); 
        border: 1px solid var(--border); 
        border-left: 6px solid ${borderAccent}; 
        background: var(--card-bg); 
        box-shadow: var(--elevation-1);
      `
    });

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = 'var(--elevation-2)';
      card.style.borderColor = 'var(--primary)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'var(--elevation-1)';
      card.style.borderColor = 'var(--border)';
    });
    
    const editSvg = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" /></svg>`;
    const delSvg = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" /></svg>`;

    const truckName = travel.truck?.name || 'Camión no especificado';
    const plate = travel.truck?.licensePlate || '';
    const driverName = travel.truck?.driver?.name || travel.driver?.name || '';
    const tropaStr = travel.tropa || buy.tropa || '';

    card.innerHTML = `
      <!-- Encabezado de la Tarjeta -->
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div class="header-main">
          <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
            <h3 style="margin: 0; font-size: 1.3rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 0.4rem;">
              🚚 ${truckName}
            </h3>
            ${plate ? `<span style="background: rgba(255,255,255,0.06); color: var(--text-main); font-weight: 700; font-size: 0.78rem; padding: 0.2rem 0.55rem; border-radius: 6px; border: 1px solid var(--border); font-family: monospace;">${plate}</span>` : ''}
            ${tropaStr ? `<span style="background: rgba(99,102,241,0.12); color: #818cf8; font-weight: 700; font-size: 0.78rem; padding: 0.2rem 0.55rem; border-radius: 6px; border: 1px solid rgba(99,102,241,0.25);">🏷️ Tropa #${tropaStr}</span>` : ''}
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; flex-wrap: wrap;">
            <span style="font-size: 0.95rem; font-weight: 750; color: #60a5fa; display: flex; align-items: center; gap: 0.35rem;">
              📅 ${travel.date || 'Sin fecha'}
            </span>
            ${driverName ? `
              <span style="color: var(--text-muted); font-size: 0.85rem;">&bull;</span>
              <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">👨‍✈️ ${driverName}</span>
            ` : ''}
            ${travel.description ? `
              <span style="color: var(--text-muted); font-size: 0.85rem;">&bull;</span>
              <span class="card-subtitle" style="font-size: 0.85rem; color: var(--text-muted); font-weight: 550;">📝 ${travel.description}</span>
            ` : ''}
          </div>
        </div>

        <div class="header-status" style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          ${agentName ? `
            <div class="agent-badge" style="
              background: rgba(99,102,241,0.08); 
              color: var(--text-main); 
              font-weight: 600; 
              font-size: 0.8rem; 
              padding: 0.4rem 0.85rem; 
              border-radius: 10px; 
              border: 1px solid rgba(99,102,241,0.25);
              display: flex;
              align-items: center;
              gap: 0.4rem;
            ">
              <span style="color: #818cf8;">👤 Comisionista:</span>
              <strong>${agentName}</strong>
              ${agentPercent ? `<span style="font-size: 0.72rem; color: var(--text-muted);">(${agentPercent}%)</span>` : ''}
            </div>
          ` : ''}
          
          <kmp-status-chip status="${travel.status || 'DRAFT'}"></kmp-status-chip>
          
          <div class="travel-actions" style="display: flex; gap: 0.4rem;">
            <button class="btn-icon btn-edit-travel" data-id="${travel.id}" title="Editar Viaje" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: #60a5fa; padding: 0.5rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">${editSvg}</button>
            <button class="btn-icon btn-delete-travel" data-id="${travel.id}" title="Eliminar Viaje" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: #f87171; padding: 0.5rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">${delSvg}</button>
          </div>
        </div>
      </div>
    `;

    const buyCategories = buy.categories || [];
    const buyCategoryDisplay = buyCategories.join(', ') || 'N/A';
    
    const cardBody = el('div', { classes: ['card-body'] });
    cardBody.innerHTML = `
      <div class="grid-2-cols" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        
        <!-- Columna 1: Subpanel de Economía -->
        <div class="metrics-column" style="background: rgba(255,255,255,0.015); border: 1px solid var(--border); padding: 1.35rem; border-radius: 18px; transition: all 0.2s;">
          <h4 style="margin: 0 0 1rem 0; font-size: 0.88rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">💰 Economía de la Operación</h4>
          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Operación Total (Neto):</span> <strong style="color:var(--text-main); font-family:monospace;">$${totalOp.toLocaleString()}</strong></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Comisión Agente:</span> <strong style="color:#818cf8; font-family:monospace;">$${commission.toLocaleString()}</strong></div>
            <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.65rem; margin-top: 0.35rem; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight: 700; color: var(--text-main); font-size:0.88rem;">Total c/ Comisión:</span>
              <strong style="color: #60a5fa; font-size:1.15rem; font-family:monospace; font-weight:800; text-shadow:0 0 8px rgba(96,165,250,0.15);">$${totalOpWithComm.toLocaleString()}</strong>
            </div>
            
            <div class="detail-row" style="margin-top: 0.5rem; border-top: 1px dashed var(--border); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform:uppercase; letter-spacing:0.3px;">Achique Total:</span>
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
        
        <!-- Columna 2: Subpanel de Rendimiento -->
        <div class="metrics-column" style="background: rgba(255,255,255,0.015); border: 1px solid var(--border); padding: 1.35rem; border-radius: 18px; transition: all 0.2s;">
          <h4 style="margin: 0 0 1rem 0; font-size: 0.88rem; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;">📈 Rendimiento de Faena</h4>
          <div style="display: flex; flex-direction: column; gap: 0.65rem;">
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Categoría(s):</span> <span style="background:rgba(255,255,255,0.04); color:var(--text-main); font-weight:700; padding:0.15rem 0.45rem; border-radius:6px; font-size:0.75rem; text-transform:uppercase; border:1px solid rgba(255,255,255,0.06);">${buyCategoryDisplay}</span></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Cantidad:</span> <strong style="color:var(--text-main);">${buy.totalQuantity || 0} cabezas</strong></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Kg Limpios / Faena:</span> <strong style="color:var(--text-main); font-family:monospace;">${(buy.totalKgClean || 0).toLocaleString()} / ${(buy.totalKgFaena || 0).toLocaleString()} kg</strong></div>
            <div class="detail-row" style="display:flex; justify-content:space-between; font-size:0.85rem;"><span style="color:var(--text-muted); font-weight:550;">Promedio por Cabeza:</span> <strong style="color:var(--text-main); font-family:monospace;" title="kg limpio / cantidad cabezas">${(buy.totalQuantity > 0 ? (buy.totalKgClean / buy.totalQuantity) : 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} kg/cab</strong></div>
            <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.65rem; margin-top: 0.35rem; display:flex; justify-content:space-between; align-items:center;">
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 700; color: var(--text-main); font-size:0.88rem;">Rendimiento Gral:</span>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500;">(kg faena / kg limpios)</span>
              </div>
              <span style="background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.25); font-weight: 800; font-size: 1rem; padding: 0.25rem 0.75rem; border-radius: 8px; font-family:monospace;">${(yieldValue * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style="font-size: 0.85rem; font-weight: 750; color: var(--text-muted); text-transform: uppercase; margin: 1.5rem 0 1rem 0; letter-spacing: 0.8px; display: flex; align-items: center; gap: 0.4rem;">
        👥 Productores Asociados y Tropas
      </div>
    `;

    // Callback de actualización de achique global
    window._ui_onReduceUpdate = (id, val) => {
      if (options.onReduceUpdate) options.onReduceUpdate(id, parseFloat(val));
    };

    // Subtarjetas de Productores Asociados
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
      const producerName = p.producer?.name || p.name || 'Productor';
      const cuit = p.producer?.cuit || p.cuit || '';
      const cbu = p.producer?.cbu || p.cbu || '';
      const totalAPagar = p.totalAPagar || 0;
      
      const pHeader = el('div', { 
        classes: ['producer-header'], 
        style: 'display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;' 
      });
      pHeader.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <strong style="font-size: 1.05rem; color: #ffffff; letter-spacing:0.2px;">👤 ${producerName}</strong>
          ${p.origin ? `<span style="background:rgba(255,255,255,0.04); color:var(--text-muted); font-size:0.75rem; font-weight:700; padding:0.15rem 0.55rem; border-radius:6px; border:1px solid rgba(255,255,255,0.08); text-transform:uppercase;">📍 ${p.origin}</span>` : ''}
        </div>
      `;
      
      const liqBtn = el('button', { 
        classes: ['btn-action'], 
        text: '📊 Liquidar',
        style: 'background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; border: none; border-radius: 8px; padding: 0.45rem 1.15rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; box-shadow: 0 2px 8px rgba(37,99,235,0.25); transition: all 0.2s;'
      });
      liqBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (options.onProducerSettlement) options.onProducerSettlement(travel, p);
      };
      pHeader.appendChild(liqBtn);
      pItem.appendChild(pHeader);

      // Metadatos CUIT y CBU
      const pInfo = el('div', { 
        classes: ['producer-info'],
        style: 'display: flex; gap: 0.65rem; flex-wrap: wrap; margin-top: -0.25rem;' 
      });
      pInfo.innerHTML = `
        ${cuit ? `<span class="info-badge" style="background: rgba(255,255,255,0.02); color: var(--text-muted); font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--border); letter-spacing:0.3px;"><strong style="opacity:0.8;">CUIT:</strong> ${cuit}</span>` : ''}
        ${cbu ? `<span class="info-badge" style="background: rgba(255,255,255,0.02); color: var(--text-muted); font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--border); letter-spacing:0.3px;"><strong style="opacity:0.8;">CBU:</strong> ${cbu}</span>` : ''}
      `;
      pItem.appendChild(pInfo);

      // Desglose Impositivo y Total a Pagar
      const pTaxes = el('div', { 
        classes: ['producer-taxes'], 
        style: 'display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;' 
      });
      pTaxes.innerHTML = `
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
          <span class="tax-badge" style="background: rgba(255, 255, 255, 0.03); color: var(--text-main); border: 1px solid var(--border); font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px;">NETO: $${(p.neto || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          ${iva > 0 ? `<span class="tax-badge tax-iva" style="background: rgba(37, 99, 235, 0.08); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.2); font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px;">IVA: $${iva.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>` : ''}
          ${ganancias > 0 ? `<span class="tax-badge tax-ganancias" style="background: rgba(245, 158, 11, 0.08); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px;">RET. GAN.: $${ganancias.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>` : ''}
        </div>
        <div style="margin-left: auto; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
          <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.3px;">TOTAL A PAGAR:</span>
          <span class="tax-badge" style="background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); font-weight: 850; font-size: 0.95rem; padding: 0.3rem 0.85rem; border-radius: 8px; font-family:monospace;">$${(p.totalFactura || totalAPagar || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
      `;
      pItem.appendChild(pTaxes);

      // Tabla de ítems y productos
      const pMiniList = el('div', { 
        classes: ['product-mini-list'],
        style: 'background: rgba(0,0,0,0.15); border-radius: 12px; border: 1px solid rgba(255,255,255,0.02); overflow: hidden; margin-top: 0.25rem;' 
      });
      
      const pTable = el('table', {
        style: 'width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left;'
      });
      pTable.innerHTML = `
        <thead>
          <tr style="border-bottom: 1.5px solid rgba(255,255,255,0.04); background: rgba(255,255,255,0.01); color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 0.55rem 0.85rem;">Producto</th>
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
              <td style="padding: 0.5rem 0.85rem; text-align: right; font-family: monospace;">${(pr.kgClean || 0).toFixed(0).toLocaleString()} kg</td>
              <td style="padding: 0.5rem 0.85rem; text-align: center; color: var(--text-muted);">${pr.roughing}%</td>
              <td style="padding: 0.5rem 0.85rem; text-align: right; font-family: monospace; color: var(--text-main); font-weight: 750;">$${(pr.price || 0).toLocaleString()}</td>
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

  // 7. Paginación
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

  // 8. Re-establecer foco del cursor si el usuario estaba escribiendo
  if (activeId) {
    const elToFocus = document.getElementById(activeId);
    if (elToFocus) {
      elToFocus.focus();
      if (selectionStart !== null && selectionEnd !== null && (elToFocus.type === 'text' || elToFocus.type === 'search')) {
        elToFocus.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }

  // 9. Eventos de botones de edición y eliminación
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

