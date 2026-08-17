/**
 * @file DashboardUI.js
 * @description Modern glassmorphic analytics control center featuring real-time stock boards,
 * KPI metric grids, and dynamic, highly-responsive charts.
 * @module ui/screens/DashboardUI
 * @author Antigravity
 */

import { el } from '../../../frameworks/utils/dom.js';
import { renderTimeFilterUI } from '../components/Filters.js';
import { MarketService } from '../../../adapters/api/MarketService.js';
import { exportTravelBreakdownExcel } from '../reports/ReportService.js';
import Chart from 'chart.js/auto';

/**
 * Active chart instances registered on the window.
 * Preserved locally to destroy/re-instantiate cleanly during filter shifts.
 * @type {Object<string, Chart>}
 */
let chartInstances = {};

/**
 * Renders a standardized, high-fidelity analytics scorecard with custom metric indicators.
 * @param {string} label - The metric title descriptor.
 * @param {string|number} value - The primary metric numerical value.
 * @param {string} icon - The card visual emoji.
 * @param {string} [subtext=''] - Optional lower label caption.
 * @returns {HTMLElement} The constructed glass card node.
 */
function renderStatCard(label, value, icon, subtext = '') {
  return el('div', { 
    classes: ['stat-card', 'glass-card', 'settings-card'], 
    style: 'padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; border-radius: 18px; transition: all 0.22s ease;'
  });
}

/**
 * Refactors and renders the premium dashboard analytics panel inside the given DOM root.
 * @param {HTMLElement} container - Root DOM layout container.
 * @param {Object} options - State model config options and event action hooks.
 */
export function renderDashboard(container, options) {
  if (!container) return;

  const { 
    data = [], categories = [], selectedCategories = [], includeCommission = false, 
    onCategoryToggle, onCommissionToggle,
    categoryStats,
    stockTotals = { kg: 0, count: 0, byCategory: {} },
    historyItems = [], clients = [], dashHistoryFilters = {},
    onDashHistoryFilter,
    categoryPrices = {}
  } = options;

  try {
    container.innerHTML = '';
    const wrapper = el('div', { classes: ['dashboard-wrapper'] });

    // --- 0. Title Card Panel ---
    const header = el('div', { 
      classes: ['dashboard-header', 'glass-card'], 
      style: 'margin-bottom: 2rem; padding: 1.75rem 2rem; border-radius: 20px;' 
    });
    header.innerHTML = `
      <h2 style="margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--text-main);">📊 Dashboard de Inteligencia</h2>
      <p style="margin: 0.35rem 0 0 0; color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">Análisis gerencial y control en tiempo real de tendencias, rendimientos y stock.</p>
    `;
    wrapper.appendChild(header);

    // --- 1. Stock Status Grid Card ---
    const stockSection = el('div', { 
      classes: ['glass-card'], 
      style: 'margin-bottom: 2rem; padding: 1.75rem 2rem; border-radius: 22px;' 
    });
    
    const stockTitle = el('div', { 
      style: 'display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;' 
    });
    stockTitle.innerHTML = `
      <span style="font-size: 1.4rem;">🥩</span>
      <h3 style="margin: 0; font-size: 1.15rem; font-weight: 750; color: var(--text-main);">Stock Actual de Medias Reses</h3>
    `;
    stockSection.appendChild(stockTitle);

    const stockChipsGrid = el('div', { 
      classes: ['stock-chips-grid'],
      style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.15rem;' 
    });

    // Total kilograms hang card
    const totalHangCard = el('div', { 
      classes: ['stock-category-card', 'glass-card'],
      style: 'padding: 1.15rem 1.25rem; border-radius: 16px; border-left: 4px solid var(--primary);'
    });
    totalHangCard.innerHTML = `
      <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL COLGADO</div>
      <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin: 0.35rem 0;">${stockTotals.kg.toLocaleString(undefined, {maximumFractionDigits: 1})} kg</div>
      <div style="color: var(--text-muted); font-size: 0.7rem; font-weight: 500;">Peso total en cámaras</div>
    `;
    stockChipsGrid.appendChild(totalHangCard);

    // Total pieces card
    const totalPiecesCard = el('div', { 
      classes: ['stock-category-card', 'glass-card'],
      style: 'padding: 1.15rem 1.25rem; border-radius: 16px; border-left: 4px solid #10b981;'
    });
    totalPiecesCard.innerHTML = `
      <div style="color: #34d399; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL PIEZAS</div>
      <div style="font-size: 1.35rem; font-weight: 800; color: #34d399; margin: 0.35rem 0;">${stockTotals.count}</div>
      <div style="color: var(--text-muted); font-size: 0.7rem; font-weight: 500;">Medias reses colgadas</div>
    `;
    stockChipsGrid.appendChild(totalPiecesCard);

    // Category elements iteration
    Object.entries(stockTotals.byCategory).forEach(([cat, val]) => {
      const catCard = el('div', { 
        classes: ['stock-category-card', 'glass-card'],
        style: 'padding: 1.15rem 1.25rem; border-radius: 16px;'
      });
      catCard.innerHTML = `
        <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 750; text-transform: uppercase; letter-spacing: 0.5px;">${cat}</div>
        <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin: 0.35rem 0;">${val.kg.toLocaleString(undefined, {maximumFractionDigits: 1})} kg</div>
        <div style="color: var(--primary); font-size: 0.72rem; font-weight: 600;">${val.count} piezas colgadas</div>
      `;
      stockChipsGrid.appendChild(catCard);
    });

    stockSection.appendChild(stockChipsGrid);
    wrapper.appendChild(stockSection);

    // --- 2. Interactive Filter Board (Multi-Select Support) ---
    const filtersArea = el('div', { 
      classes: ['dashboard-filters', 'glass-card'], 
      style: 'margin-bottom: 2rem; padding: 1.5rem 2rem; border-radius: 22px; display: flex; flex-direction: column; gap: 1.25rem; position: relative;' 
    });

    const activeAgentsList = Array.isArray(options.selectedAgents) ? options.selectedAgents : (options.selectedAgent ? [options.selectedAgent] : []);
    const activeProdsList = Array.isArray(options.selectedProducers) ? options.selectedProducers : (options.selectedProducer ? [options.selectedProducer] : []);
    
    // Fila A: Búsqueda Universal + Multi-select Comisionistas + Multi-select Productores
    const rowTop = el('div', { 
      style: 'display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; position: relative;' 
    });
    
    rowTop.innerHTML = `
      <!-- Input de búsqueda universal -->
      <div style="
        flex: 1.5; 
        min-width: 250px;
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
          id="dash-search-input" 
          placeholder="Buscar por productor, CUIT, comisionista, chofer, patente..." 
          autocomplete="off"
          value="${options.searchQuery || ''}"
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
        <button id="clear-dash-search-btn" title="Limpiar búsqueda" style="
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.05rem;
          display: ${options.searchQuery ? 'block' : 'none'};
          padding: 0.15rem;
          line-height: 1;
        ">✕</button>
      </div>

      <!-- Multi-Select Comisionistas -->
      <div style="position: relative; flex: 1; min-width: 210px;" id="dash-agent-multi-container">
        <button type="button" id="dash-agents-btn" style="
          width: 100%;
          background: var(--bg-main);
          color: ${activeAgentsList.length > 0 ? '#818cf8' : 'var(--text-main)'};
          border: 1px solid ${activeAgentsList.length > 0 ? '#6366f1' : 'var(--border)'};
          padding: 0.65rem 0.85rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        ">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            👤 ${activeAgentsList.length === 0 ? 'Todos los Comisionistas' : `${activeAgentsList.length} comisionista(s)`}
          </span>
          <span style="font-size: 0.75rem; opacity: 0.7;">▼</span>
        </button>

        <div id="dash-agents-dropdown" style="
          display: none;
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          min-width: 260px;
          background: #1e1e24;
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.5);
          z-index: 100;
          padding: 0.75rem;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.4rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Seleccionar Comisionistas</span>
            <button type="button" id="dash-agents-select-all" style="background: transparent; border: none; color: #818cf8; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
              ${activeAgentsList.length > 0 ? 'Limpiar' : 'Todos'}
            </button>
          </div>
          <div style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.35rem;" class="custom-scrollbar">
            ${(options.agents || []).map(ag => {
              const isChecked = activeAgentsList.includes(ag);
              return `
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--text-main); cursor: pointer; padding: 0.3rem 0.4rem; border-radius: 6px; transition: background 0.15s;" onmouseenter="this.style.background='rgba(255,255,255,0.05)'" onmouseleave="this.style.background='transparent'">
                  <input type="checkbox" class="dash-agent-cb" value="${ag}" ${isChecked ? 'checked' : ''} style="accent-color: #6366f1; cursor: pointer;">
                  <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">👤 ${ag}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Multi-Select Productores -->
      <div style="position: relative; flex: 1.2; min-width: 230px;" id="dash-producer-multi-container">
        <button type="button" id="dash-producers-btn" style="
          width: 100%;
          background: var(--bg-main);
          color: ${activeProdsList.length > 0 ? '#34d399' : 'var(--text-main)'};
          border: 1px solid ${activeProdsList.length > 0 ? '#10b981' : 'var(--border)'};
          padding: 0.65rem 0.85rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          outline: none;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        ">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            🏭 ${activeProdsList.length === 0 ? 'Todos los Productores' : `${activeProdsList.length} productor(es)`}
          </span>
          <span style="font-size: 0.75rem; opacity: 0.7;">▼</span>
        </button>

        <div id="dash-producers-dropdown" style="
          display: none;
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 100%;
          min-width: 280px;
          background: #1e1e24;
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.5);
          z-index: 100;
          padding: 0.75rem;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.4rem;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Seleccionar Productores</span>
            <button type="button" id="dash-producers-select-all" style="background: transparent; border: none; color: #34d399; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
              ${activeProdsList.length > 0 ? 'Limpiar' : 'Todos'}
            </button>
          </div>
          <div style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.35rem;" class="custom-scrollbar">
            ${(options.producers || []).map(pr => {
              const isChecked = activeProdsList.includes(pr.name) || activeProdsList.includes(pr.cuit);
              return `
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--text-main); cursor: pointer; padding: 0.3rem 0.4rem; border-radius: 6px; transition: background 0.15s;" onmouseenter="this.style.background='rgba(255,255,255,0.05)'" onmouseleave="this.style.background='transparent'">
                  <input type="checkbox" class="dash-producer-cb" value="${pr.name}" ${isChecked ? 'checked' : ''} style="accent-color: #10b981; cursor: pointer;">
                  <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span>🏭 ${pr.name}</span>
                    ${pr.cuit ? `<span style="font-size: 0.72rem; color: var(--text-muted); margin-left: 0.3rem;">(${pr.cuit})</span>` : ''}
                  </div>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
    filtersArea.appendChild(rowTop);

    // Toggle Dropdown logic
    const agentsBtn = rowTop.querySelector('#dash-agents-btn');
    const agentsDropdown = rowTop.querySelector('#dash-agents-dropdown');
    const producersBtn = rowTop.querySelector('#dash-producers-btn');
    const producersDropdown = rowTop.querySelector('#dash-producers-dropdown');

    agentsBtn.onclick = (e) => {
      e.stopPropagation();
      const isVisible = agentsDropdown.style.display === 'block';
      agentsDropdown.style.display = isVisible ? 'none' : 'block';
      producersDropdown.style.display = 'none';
    };

    producersBtn.onclick = (e) => {
      e.stopPropagation();
      const isVisible = producersDropdown.style.display === 'block';
      producersDropdown.style.display = isVisible ? 'none' : 'block';
      agentsDropdown.style.display = 'none';
    };

    document.addEventListener('click', (e) => {
      if (!rowTop.contains(e.target)) {
        if (agentsDropdown) agentsDropdown.style.display = 'none';
        if (producersDropdown) producersDropdown.style.display = 'none';
      }
    });

    // Checkboxes event handlers
    rowTop.querySelectorAll('.dash-agent-cb').forEach(cb => {
      cb.onchange = () => {
        if (options.onAgentToggle) {
          options.onAgentToggle(cb.value);
        }
      };
    });

    const agentsSelectAll = rowTop.querySelector('#dash-agents-select-all');
    if (agentsSelectAll) {
      agentsSelectAll.onclick = () => {
        if (options.onAgentsChange) {
          options.onAgentsChange(activeAgentsList.length > 0 ? [] : (options.agents || []));
        }
      };
    }

    rowTop.querySelectorAll('.dash-producer-cb').forEach(cb => {
      cb.onchange = () => {
        if (options.onProducerToggle) {
          options.onProducerToggle(cb.value);
        }
      };
    });

    const producersSelectAll = rowTop.querySelector('#dash-producers-select-all');
    if (producersSelectAll) {
      producersSelectAll.onclick = () => {
        if (options.onProducersChange) {
          options.onProducersChange(activeProdsList.length > 0 ? [] : (options.producers || []).map(p => p.name));
        }
      };
    }

    // Universal Search
    const searchInput = rowTop.querySelector('#dash-search-input');
    const clearSearchBtn = rowTop.querySelector('#clear-dash-search-btn');
    searchInput.oninput = (e) => {
      const val = e.target.value;
      clearSearchBtn.style.display = val.length > 0 ? 'block' : 'none';
      if (options.onSearch) options.onSearch(val);
    };

    clearSearchBtn.onclick = () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
      if (options.onSearch) options.onSearch('');
    };

    // Fila B: Filtros Temporales + Chips de Categorías + Switch Comisión
    const rowMid = el('div', { 
      style: 'display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1.15rem;' 
    });

    const timeRow = renderTimeFilterUI(options);
    rowMid.appendChild(timeRow);

    const chipsRow = el('div', { 
      classes: ['selector-row'],
      style: 'display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 1rem; flex-wrap: wrap;' 
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
      const isSelected = isTodos ? selectedCategories.length === 0 : selectedCategories.includes(cat);
      const chip = el('button', { 
        classes: ['category-chip', isSelected ? 'active' : 'inactive'], 
        text: cat 
      });
      chip.onclick = () => onCategoryToggle && onCategoryToggle(cat);
      chipsContainer.appendChild(chip);
    });
    chipsLeft.appendChild(chipsContainer);

    // Dynamic "Con Comisión" Toggle Selector
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
    const commInput = commToggle.querySelector('input');
    if (commInput) {
      commInput.onchange = (e) => onCommissionToggle && onCommissionToggle(e.target.checked);
    }

    chipsRow.appendChild(chipsLeft);
    chipsRow.appendChild(commToggle);
    rowMid.appendChild(chipsRow);
    filtersArea.appendChild(rowMid);

    // Fila C: Barra de Filtros Activos
    const activePills = [];
    activeAgentsList.forEach(ag => {
      activePills.push({ label: `👤 Comisionista: ${ag}`, onRemove: () => options.onAgentToggle && options.onAgentToggle(ag) });
    });
    activeProdsList.forEach(pr => {
      activePills.push({ label: `🏭 Productor: ${pr}`, onRemove: () => options.onProducerToggle && options.onProducerToggle(pr) });
    });
    if (options.searchQuery) {
      activePills.push({ label: `🔍 "${options.searchQuery}"`, onRemove: () => options.onSearch && options.onSearch('') });
    }
    selectedCategories.forEach(cat => {
      activePills.push({ label: `🏷️ ${cat}`, onRemove: () => onCategoryToggle && onCategoryToggle(cat) });
    });

    if (activePills.length > 0) {
      const activeBar = el('div', { 
        style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem;' 
      });
      activeBar.innerHTML = `
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Filtros activos:</span>
          ${activePills.map((p, idx) => `
            <button class="active-dash-filter-pill" data-idx="${idx}" style="
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
          <button id="btn-clear-dash-filters" class="btn-outline" style="padding: 0.25rem 0.65rem; font-size: 0.75rem; border-radius: 8px; margin-left: 0.5rem;">
            🔄 Limpiar Todos
          </button>
        </div>
        <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">
          ${data.length} viajes considerados
        </div>
      `;
      filtersArea.appendChild(activeBar);

      activeBar.querySelectorAll('.active-dash-filter-pill').forEach(pill => {
        const idx = parseInt(pill.dataset.idx, 10);
        pill.onclick = () => {
          if (activePills[idx] && activePills[idx].onRemove) activePills[idx].onRemove();
        };
      });

      const clearAllBtn = activeBar.querySelector('#btn-clear-dash-filters');
      if (clearAllBtn) {
        clearAllBtn.onclick = () => {
          if (options.onAgentsChange) options.onAgentsChange([]);
          if (options.onProducersChange) options.onProducersChange([]);
          if (options.onSearch) options.onSearch('');
          if (onCategoryToggle) onCategoryToggle('TODOS');
        };
      }
    }

    wrapper.appendChild(filtersArea);

    // --- 3. Dynamic Analytics KPIs Grids ---
    if (categoryStats) {
      const labelSuffix = selectedCategories.length === 0 ? 'Totales' : selectedCategories.join(', ');
      const statsGrid = el('div', { 
        classes: ['stats-grid'], 
        style: 'margin-bottom: 2rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem;' 
      });

      // 1. Avg Price Card
      const avgPriceCard = el('kmp-metric-card', {
        attrs: {
          title: `Compra Promedio`,
          value: `$${(categoryStats.avgPrice || 0).toFixed(2)}`,
          icon: '💰',
          subtitle: `Filtro: [${labelSuffix}]`
        }
      });
      statsGrid.appendChild(avgPriceCard);

      // 2. Comm Price Card
      const commPriceCard = el('kmp-metric-card', {
        attrs: {
          title: `Compra con Comis.`,
          value: `$${(categoryStats.avgPriceWithCommission || 0).toFixed(2)}`,
          icon: '💸',
          subtitle: `Precio c/ comisiones`
        }
      });
      statsGrid.appendChild(commPriceCard);
      
      // Hook simulator cost metrics (Available when exactly 1 category is selected)
      if (selectedCategories.length === 1) {
        const cat = selectedCategories[0];
        const { realCostGancho, sellPriceRef, margin, marginPct, yieldVal } = categoryStats;

        const hasRealCost = (realCostGancho || 0) > 0 && (yieldVal || 0) > 0;
        const realCostCard = el('kmp-metric-card', {
          attrs: {
            title: `Costo Real Gancho`,
            value: hasRealCost ? `$${(realCostGancho || 0).toFixed(2)}` : 'Pendiente (Sin Faena)',
            icon: '🏗️',
            subtitle: hasRealCost ? `Rend: ${((yieldVal || 0) * 100).toFixed(1)}% | Incl. Flete, Comis. e IIBB` : 'Pendiente de carga de faena'
          }
        });
        statsGrid.appendChild(realCostCard);

        if (sellPriceRef > 0) {
          const sellRefCard = el('kmp-metric-card', {
            attrs: {
              title: `Venta Config [${cat}]`,
              value: `$${(sellPriceRef || 0).toFixed(2)}`,
              icon: '🏷️'
            }
          });
          statsGrid.appendChild(sellRefCard);

          if (hasRealCost) {
            const marginValueStr = `${margin >= 0 ? '+' : ''}$${(margin || 0).toFixed(2)}`;
            const diffCard = el('kmp-metric-card', {
              attrs: {
                title: `Utilidad $/Kg`,
                value: marginValueStr,
                icon: '⚖️',
                'value-color': margin >= 0 ? '#34d399' : '#f87171',
                subtitle: 'Margen de spread neto'
              }
            });
            statsGrid.appendChild(diffCard);

            const pctCard = el('kmp-metric-card', {
              attrs: {
                title: `Rentabilidad Final`,
                value: `${marginPct >= 0 ? '+' : ''}${(marginPct || 0).toFixed(2)}%`,
                icon: '📊',
                'value-color': marginPct >= 0 ? '#34d399' : '#f87171',
                subtitle: 'Retorno sobre costo real'
              }
            });
            statsGrid.appendChild(pctCard);
          }
        }
      }

      // 3. Travels Card
      const travelsCard = el('kmp-metric-card', {
        attrs: {
          title: `Viajes Filtrados`,
          value: `${categoryStats.travelCount || 0} viajes`,
          icon: '🚛',
          subtitle: 'Historial cargado'
        }
      });
      statsGrid.appendChild(travelsCard);

      // 4. Weight Card
      const weightCard = el('kmp-metric-card', {
        attrs: {
          title: `Peso Media Res (Prom.)`,
          value: `${(categoryStats.avgKgMediaRes || 0).toFixed(2)} kg`,
          icon: '🥩',
          subtitle: 'Peso promedio de reses'
        }
      });
      statsGrid.appendChild(weightCard);

      // 5. Heads Card
      const headsCard = el('kmp-metric-card', {
        attrs: {
          title: `Cabezas Faenadas`,
          value: `${(categoryStats.totalQuantity || 0).toLocaleString()} cabezas`,
          icon: '🐂',
          subtitle: 'Volumen total'
        }
      });
      statsGrid.appendChild(headsCard);

      // 6. Yield Card
      const yieldCard = el('kmp-metric-card', {
        attrs: {
          title: `Rendimiento Promedio`,
          value: `${((categoryStats.avgYield || 0) * 100).toFixed(2)}%`,
          icon: '📈',
          'value-color': '#34d399',
          subtitle: 'Porcentaje promedio de rinde'
        }
      });
      statsGrid.appendChild(yieldCard);
      
      // 7. Max Yield Card
      const maxYieldLabel = categoryStats.maxYield > 0 ? `${(categoryStats.maxYield * 100).toFixed(2)}%` : 'N/A';
      const maxYCard = el('kmp-metric-card', {
        attrs: {
          title: `Rendimiento Máximo`,
          value: maxYieldLabel,
          icon: '👑',
          'value-color': '#fbbf24',
          subtitle: categoryStats.maxYieldEntity || 'N/A'
        },
        style: categoryStats.maxYieldTravelId ? 'cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;' : ''
      });
      if (categoryStats.maxYieldTravelId) {
        maxYCard.title = "Ver viaje correspondiente";
        maxYCard.addEventListener('click', () => {
          if (options && typeof options.onShowTravelDetail === 'function') {
            options.onShowTravelDetail(categoryStats.maxYieldTravelId);
          }
        });
        maxYCard.addEventListener('mouseenter', () => {
          maxYCard.style.transform = 'scale(1.03)';
          maxYCard.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
        });
        maxYCard.addEventListener('mouseleave', () => {
          maxYCard.style.transform = 'scale(1)';
          maxYCard.style.boxShadow = 'none';
        });
      }
      statsGrid.appendChild(maxYCard);

      // 8. Total Kg Card
      const totalCostoFaenados = (categoryStats.totalKgFaena || 0) * (categoryStats.avgPriceWithCommission || 0);
      const totalKgCard = el('kmp-metric-card', {
        attrs: {
          title: `Kilos Faenados`,
          value: `${(categoryStats.totalKgFaena || 0).toLocaleString()} kg`,
          icon: '🔪',
          subtitle: `Costo: $${totalCostoFaenados.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        }
      });
      statsGrid.appendChild(totalKgCard);

      // MAG Reference market indices
      const selectedCat = selectedCategories.length === 1 ? selectedCategories[0] : null;
      if (selectedCat && selectedCat !== 'TODOS') {
        MarketService.getReferencePrices().then(prices => {
          const ref = prices[selectedCat];
          if (ref) {
            const gap = MarketService.calculateGap(categoryStats.avgPrice, ref);
            const gapCard = el('kmp-metric-card', {
              attrs: {
                title: `Vs Mercado (MAG)`,
                value: `${gap > 0 ? '+' : ''}${gap.toFixed(1)}%`,
                icon: '📈',
                'value-color': gap > 0 ? '#f87171' : '#34d399',
                subtitle: gap > 0 ? 'Por encima de ref MAG' : 'Precio de oportunidad'
              }
            });
            statsGrid.appendChild(gapCard);

            const magRefCard = el('kmp-metric-card', {
              attrs: {
                title: `Precio Ref MAG`,
                value: `$${ref.toLocaleString()}`,
                icon: '🏛️',
                subtitle: 'Índice de referencia MAG'
              }
            });
            statsGrid.appendChild(magRefCard);
          }
        });
      }
      wrapper.appendChild(statsGrid);
    }

    // --- 3.5 SECCIÓN: ANÁLISIS RESUMEN DE RENDIMIENTO DE FAENA POR CATEGORÍA ---
    const yieldAnalysisSection = el('div', { 
      classes: ['glass-card'], 
      style: 'margin-bottom: 2.25rem; padding: 1.75rem 2rem; border-radius: 22px; border: 1px solid var(--border); border-left: 6px solid #10b981; background: var(--card-bg);' 
    });

    const categoryBreakdown = categoryStats.categoryBreakdown || [];
    const totalBreakdownClean = categoryBreakdown.reduce((sum, item) => sum + item.kgClean, 0);
    const totalBreakdownFaena = categoryBreakdown.reduce((sum, item) => sum + item.kgFaena, 0);
    const totalBreakdownHeads = categoryBreakdown.reduce((sum, item) => sum + item.heads, 0);
    const totalBreakdownOp = categoryBreakdown.reduce((sum, item) => sum + (includeCommission ? (item.avgPriceWithCommission * item.kgClean) : (item.avgPrice * item.kgClean)), 0);
    const globalYieldPct = totalBreakdownClean > 0 ? (totalBreakdownFaena / totalBreakdownClean) * 100 : 0;
    const globalAvgPrice = totalBreakdownClean > 0 ? totalBreakdownOp / totalBreakdownClean : 0;
    const globalCostoGancho = globalYieldPct > 0 ? (globalAvgPrice / (globalYieldPct / 100)) : 0;
    const globalRealCost = globalCostoGancho > 0 ? (globalCostoGancho / (1 - 0.017)) : 0;

    yieldAnalysisSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span style="font-size: 1.5rem;">🥩</span>
            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.01em;">
              Análisis Resumen de Rendimiento de Faena por Categoría
            </h3>
          </div>
          <p style="margin: 0.35rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">
            Rendimiento porcentual, volumen de cabezas, kilos limpios vs faena, precios de compra y costo real en gancho.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); padding: 0.4rem 0.85rem; border-radius: 10px; font-weight: 800; font-size: 0.85rem;">
            Rend. Global: ${globalYieldPct.toFixed(2)}%
          </span>
          <span style="background: rgba(99, 102, 241, 0.12); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.25); padding: 0.4rem 0.85rem; border-radius: 10px; font-weight: 800; font-size: 0.85rem;">
            Costo Real: ${globalRealCost > 0 ? `$${globalRealCost.toFixed(2)}` : 'Pendiente'}
          </span>
        </div>
      </div>
    `;

    if (categoryBreakdown.length === 0) {
      const emptyYield = el('div', { 
        style: 'padding: 2.5rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.01); border-radius: 14px; border: 1px dashed var(--border); font-size: 0.88rem; font-weight: 600;',
        text: 'No hay datos de categorías o faena registrados en el período o filtros seleccionados.'
      });
      yieldAnalysisSection.appendChild(emptyYield);
    } else {
      const tableWrapper = el('div', { 
        classes: ['table-responsive'], 
        style: 'background: rgba(0,0,0,0.15); border-radius: 16px; border: 1px solid var(--border); overflow-x: auto;' 
      });

      const yieldTable = el('table', { 
        style: 'width: 100%; border-collapse: collapse; font-size: 0.84rem; min-width: 900px;' 
      });

      yieldTable.innerHTML = `
        <thead>
          <tr style="border-bottom: 2px solid var(--border); background: rgba(255,255,255,0.02); color: var(--text-muted); font-weight: 750; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.75rem;">
            <th style="padding: 0.95rem 1.15rem; text-align: left;">Categoría</th>
            <th style="padding: 0.95rem 1.15rem; text-align: center; width: 90px;">Cabezas</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right;">Kilos Limpios (Vivo)</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right;">Kilos Faena (Gancho)</th>
            <th style="padding: 0.95rem 1.15rem; text-align: center; width: 140px;">Rendimiento (%)</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right;">Precio Compra Vivo</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right; color: var(--text-muted);">Costo Gancho</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right; color: #60a5fa;">Costo Real Gancho</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right;">Ref. Venta</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right;">Margen</th>
          </tr>
        </thead>
        <tbody style="font-weight: 600; color: var(--text-main);">
          ${categoryBreakdown.map(item => {
            const yPct = item.yieldPct || 0;
            let yieldBadgeColor = '#34d399';
            let yieldBadgeBg = 'rgba(16, 185, 129, 0.12)';
            let yieldBorder = 'rgba(16, 185, 129, 0.25)';
            if (yPct === 0) {
              yieldBadgeColor = 'var(--text-muted)';
              yieldBadgeBg = 'rgba(255, 255, 255, 0.05)';
              yieldBorder = 'var(--border)';
            } else if (yPct < 55) {
              yieldBadgeColor = '#f87171';
              yieldBadgeBg = 'rgba(239, 68, 68, 0.12)';
              yieldBorder = 'rgba(239, 68, 68, 0.25)';
            } else if (yPct < 57.5) {
              yieldBadgeColor = '#fbbf24';
              yieldBadgeBg = 'rgba(245, 158, 11, 0.12)';
              yieldBorder = 'rgba(245, 158, 11, 0.25)';
            }

            const hasRef = item.sellPriceRef > 0;
            const hasCost = item.realCostGancho > 0;
            const hasMargin = hasRef && hasCost;
            const isProfit = item.margin >= 0;

            return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
                <td style="padding: 0.9rem 1.15rem; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 0.45rem;">
                  <span style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.78rem;">
                    🥩 ${item.category}
                  </span>
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: center; color: var(--text-main); font-weight: 700;">
                  ${item.heads} cab.
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace;">
                  ${item.kgClean.toLocaleString(undefined, {maximumFractionDigits: 0})} kg
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace; color: #60a5fa;">
                  ${item.kgFaena.toLocaleString(undefined, {maximumFractionDigits: 0})} kg
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: center;">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem;">
                    <span style="background: ${yieldBadgeBg}; color: ${yieldBadgeColor}; border: 1px solid ${yieldBorder}; font-weight: 800; font-size: 0.85rem; padding: 0.2rem 0.65rem; border-radius: 6px; font-family: monospace;">
                      ${yPct.toFixed(2)}%
                    </span>
                    <div style="width: 80px; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden;">
                      <div style="width: ${Math.min(100, Math.max(0, (yPct / 65) * 100))}%; height: 100%; background: ${yieldBadgeColor};"></div>
                    </div>
                  </div>
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace; font-weight: 750;">
                  $${(includeCommission ? item.avgPriceWithCommission : item.avgPrice).toFixed(2)}
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace; color: var(--text-muted);">
                  ${item.costoGancho > 0 ? `$${item.costoGancho.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace; font-weight: 800; color: #60a5fa;">
                  ${item.realCostGancho > 0 ? `$${item.realCostGancho.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace;">
                  ${hasRef ? `$${item.sellPriceRef.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace;">
                  ${hasMargin ? `
                    <span style="color: ${isProfit ? '#34d399' : '#f87171'}; font-weight: 800;">
                      ${isProfit ? '+' : ''}$${item.margin.toFixed(2)} <span style="font-size:0.72rem;">(${item.marginPct.toFixed(1)}%)</span>
                    </span>
                  ` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
        <tfoot style="background: rgba(255,255,255,0.03); border-top: 2px solid var(--border); font-weight: 800; color: var(--text-main);">
          <tr>
            <td style="padding: 0.95rem 1.15rem; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.78rem;">
              TOTAL CONSOLIDADO
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: center; color: #34d399;">
              ${totalBreakdownHeads} cab.
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace;">
              ${totalBreakdownClean.toLocaleString(undefined, {maximumFractionDigits: 0})} kg
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; color: #60a5fa;">
              ${totalBreakdownFaena.toLocaleString(undefined, {maximumFractionDigits: 0})} kg
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: center;">
              <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 850; font-size: 0.9rem; padding: 0.25rem 0.75rem; border-radius: 8px; font-family: monospace;">
                ${globalYieldPct.toFixed(2)}%
              </span>
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace;">
              $${globalAvgPrice.toFixed(2)}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; color: var(--text-muted);">
              ${globalCostoGancho > 0 ? `$${globalCostoGancho.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; color: #60a5fa;">
              ${globalRealCost > 0 ? `$${globalRealCost.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
            </td>
            <td colspan="2" style="padding: 0.95rem 1.15rem; text-align: center; color: var(--text-muted); font-size: 0.75rem;">
              Promedios ponderados por volumen
            </td>
          </tr>
        </tfoot>
      </table>
      `;
      tableWrapper.appendChild(yieldTable);
      yieldAnalysisSection.appendChild(tableWrapper);
    }

    wrapper.appendChild(yieldAnalysisSection);

    // --- 3.65 SECCIÓN: TABLA COMPARATIVA BIDIRECCIONAL: COMISIONISTAS VS PRODUCTORES ---
    const comparisonSection = el('div', { 
      classes: ['glass-card'], 
      style: 'margin-bottom: 2.25rem; padding: 1.75rem 2rem; border-radius: 22px; border: 1px solid var(--border); border-left: 6px solid #8b5cf6; background: var(--card-bg);' 
    });

    const comparisons = (categoryStats && categoryStats.comparisons) ? categoryStats.comparisons : { agents: [], producers: [], crossMatrix: { agents: [], producers: [], cells: {} } };
    const compAgents = comparisons.agents || [];
    const compProducers = comparisons.producers || [];
    const crossMatrix = comparisons.crossMatrix || { agents: [], producers: [], cells: {} };

    comparisonSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span style="font-size: 1.5rem;">⚖️</span>
            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.01em;">
              Tabla Comparativa de Comisionistas y Productores
            </h3>
          </div>
          <p style="margin: 0.35rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">
            Análisis cruzado bidireccional de rendimiento porcentual de faena, volumen de cabezas y costo gancho entre intermediarios y productores.
          </p>
        </div>
        
        <!-- Segmented Tab Switcher -->
        <div class="comparison-tabs-container" style="
          display: flex; 
          background: rgba(0,0,0,0.3); 
          padding: 0.25rem; 
          border-radius: 12px; 
          border: 1px solid var(--border);
          gap: 0.25rem;
        ">
          <button type="button" id="tab-comp-agents" class="comp-tab-btn active" style="
            background: #8b5cf6;
            color: #ffffff;
            border: none;
            padding: 0.45rem 0.9rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          ">
            👤 Por Comisionistas (${compAgents.length})
          </button>
          <button type="button" id="tab-comp-producers" class="comp-tab-btn" style="
            background: transparent;
            color: var(--text-muted);
            border: none;
            padding: 0.45rem 0.9rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          ">
            🏭 Por Productores (${compProducers.length})
          </button>
          <button type="button" id="tab-comp-matrix" class="comp-tab-btn" style="
            background: transparent;
            color: var(--text-muted);
            border: none;
            padding: 0.45rem 0.9rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          ">
            🔀 Matriz Cruzada
          </button>
        </div>
      </div>
      
      <!-- Content Container for Views -->
      <div id="comp-views-wrapper"></div>
    `;

    const viewsWrapper = comparisonSection.querySelector('#comp-views-wrapper');
    const tabAgentsBtn = comparisonSection.querySelector('#tab-comp-agents');
    const tabProducersBtn = comparisonSection.querySelector('#tab-comp-producers');
    const tabMatrixBtn = comparisonSection.querySelector('#tab-comp-matrix');

    function getYieldBadge(yPct) {
      if (yPct === 0) {
        return `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.2rem;">
            <span style="background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border); font-weight: 700; font-size: 0.82rem; padding: 0.2rem 0.6rem; border-radius: 6px; font-family: monospace;">
              0.00%
            </span>
          </div>
        `;
      }
      let color = '#34d399';
      let bg = 'rgba(16, 185, 129, 0.12)';
      let border = 'rgba(16, 185, 129, 0.25)';
      if (yPct < 55) {
        color = '#f87171';
        bg = 'rgba(239, 68, 68, 0.12)';
        border = 'rgba(239, 68, 68, 0.25)';
      } else if (yPct < 57.5) {
        color = '#fbbf24';
        bg = 'rgba(245, 158, 11, 0.12)';
        border = 'rgba(245, 158, 11, 0.25)';
      }
      return `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.2rem;">
          <span style="background: ${bg}; color: ${color}; border: 1px solid ${border}; font-weight: 800; font-size: 0.84rem; padding: 0.2rem 0.6rem; border-radius: 6px; font-family: monospace;">
            ${yPct.toFixed(2)}%
          </span>
          <div style="width: 70px; height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden;">
            <div style="width: ${Math.min(100, Math.max(0, (yPct / 65) * 100))}%; height: 100%; background: ${color};"></div>
          </div>
        </div>
      `;
    }

    function renderAgentsComparisonView() {
      if (compAgents.length === 0) {
        viewsWrapper.innerHTML = `
          <div style="padding: 2.5rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.01); border-radius: 14px; border: 1px dashed var(--border); font-size: 0.88rem; font-weight: 600;">
            No hay datos de comisionistas para los filtros aplicados.
          </div>
        `;
        return;
      }

      let html = `
        <div class="table-responsive" style="background: rgba(0,0,0,0.15); border-radius: 16px; border: 1px solid var(--border); overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.83rem; min-width: 1100px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border); background: rgba(255,255,255,0.02); color: var(--text-muted); font-weight: 750; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.74rem;">
                <th style="padding: 0.95rem 1.15rem; text-align: left;">Comisionista</th>
                <th style="padding: 0.95rem 1.15rem; text-align: center; width: 75px;">Viajes</th>
                <th style="padding: 0.95rem 1.15rem; text-align: left;">Productores Aportados</th>
                <th style="padding: 0.95rem 1.15rem; text-align: center; width: 85px;">Cabezas</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Kilos Limpios</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Kilos Faena</th>
                <th style="padding: 0.95rem 1.15rem; text-align: center; width: 130px;">Rendimiento (%)</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Precio Vivo</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right; color: var(--text-muted);">Costo Gancho</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right; color: #60a5fa;">Costo Real</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Ref. Venta</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Margen</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Total Operación</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right; color: #fbbf24;">Comisiones</th>
              </tr>
            </thead>
            <tbody style="font-weight: 600; color: var(--text-main);">
      `;

      compAgents.forEach((a) => {
        const prodBadges = a.producers.map(p => {
          const hasMargin = p.sellPriceRef > 0 && p.realCostGancho > 0;
          const pMarginStr = hasMargin ? ` | ${p.margin >= 0 ? '+' : ''}$${p.margin.toFixed(1)}` : '';
          return `
            <span style="background: rgba(139, 92, 246, 0.1); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.25); padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.72rem; display: inline-block; margin: 0.1rem 0;">
              🏭 ${p.name} (${p.heads} cab. - ${p.yieldPct.toFixed(1)}%${pMarginStr})
            </span>
          `;
        }).join(' ');

        const hasRef = a.sellPriceRef > 0;
        const hasCost = a.realCostGancho > 0;
        const hasMargin = hasRef && hasCost;
        const isProfit = a.margin >= 0;

        html += `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
            <td style="padding: 0.95rem 1.15rem;">
              <div style="font-weight: 800; color: #ffffff; font-size: 0.88rem;">
                👤 ${a.name}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                ${a.percent ? `Comisión pactada: ${a.percent}%` : 'Sin comisión fija'}
              </div>
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: center; font-weight: 700; color: #818cf8;">
              ${a.travelCount}
            </td>
            <td style="padding: 0.95rem 1.15rem; max-width: 250px;">
              ${prodBadges || '<span style="color:var(--text-muted);">-</span>'}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: center; font-weight: 700;">
              ${a.heads} cab.
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace;">
              ${a.kgClean.toLocaleString(undefined, {maximumFractionDigits: 0})} kg
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; color: #60a5fa;">
              ${a.kgFaena.toLocaleString(undefined, {maximumFractionDigits: 0})} kg
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: center;">
              ${getYieldBadge(a.yieldPct)}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; font-weight: 750;">
              $${(includeCommission ? a.avgPriceWithCommission : a.avgPrice).toFixed(2)}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; color: var(--text-muted);">
              ${a.costoGancho > 0 ? `$${a.costoGancho.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; font-weight: 800; color: #60a5fa;">
              ${a.realCostGancho > 0 ? `$${a.realCostGancho.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace;">
              ${hasRef ? `$${a.sellPriceRef.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace;">
              ${hasMargin ? `
                <span style="color: ${isProfit ? '#34d399' : '#f87171'}; font-weight: 800;">
                  ${isProfit ? '+' : ''}$${a.margin.toFixed(2)} <span style="font-size:0.72rem;">(${a.marginPct.toFixed(1)}%)</span>
                </span>
              ` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; font-weight: 800; color: #34d399;">
              $${a.totalOp.toLocaleString(undefined, {maximumFractionDigits: 0})}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; font-weight: 800; color: #fbbf24;">
              $${a.totalCommission.toLocaleString(undefined, {maximumFractionDigits: 0})}
            </td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
      viewsWrapper.innerHTML = html;
    }

    function renderProducersComparisonView() {
      if (compProducers.length === 0) {
        viewsWrapper.innerHTML = `
          <div style="padding: 2.5rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.01); border-radius: 14px; border: 1px dashed var(--border); font-size: 0.88rem; font-weight: 600;">
            No hay datos de productores para los filtros aplicados.
          </div>
        `;
        return;
      }

      let html = `
        <div class="table-responsive" style="background: rgba(0,0,0,0.15); border-radius: 16px; border: 1px solid var(--border); overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.83rem; min-width: 1100px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border); background: rgba(255,255,255,0.02); color: var(--text-muted); font-weight: 750; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.74rem;">
                <th style="padding: 0.95rem 1.15rem; text-align: left;">Productor</th>
                <th style="padding: 0.95rem 1.15rem; text-align: center; width: 75px;">Viajes</th>
                <th style="padding: 0.95rem 1.15rem; text-align: left;">Comisionistas Intermediarios</th>
                <th style="padding: 0.95rem 1.15rem; text-align: center; width: 85px;">Cabezas</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Kilos Limpios</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Kilos Faena</th>
                <th style="padding: 0.95rem 1.15rem; text-align: center; width: 130px;">Rendimiento (%)</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Precio Vivo</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right; color: var(--text-muted);">Costo Gancho</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right; color: #60a5fa;">Costo Real</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Ref. Venta</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Margen</th>
                <th style="padding: 0.95rem 1.15rem; text-align: right;">Total Operado</th>
              </tr>
            </thead>
            <tbody style="font-weight: 600; color: var(--text-main);">
      `;

      compProducers.forEach((p) => {
        const agentBadges = p.agents.map(a => {
          const hasMargin = a.sellPriceRef > 0 && a.realCostGancho > 0;
          const aMarginStr = hasMargin ? ` | ${a.margin >= 0 ? '+' : ''}$${a.margin.toFixed(1)}` : '';
          return `
            <span style="background: rgba(99, 102, 241, 0.1); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.25); padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.72rem; display: inline-block; margin: 0.1rem 0;">
              👤 ${a.name} (${a.heads} cab. - ${a.yieldPct.toFixed(1)}%${aMarginStr})
            </span>
          `;
        }).join(' ');

        const hasRef = p.sellPriceRef > 0;
        const hasCost = p.realCostGancho > 0;
        const hasMargin = hasRef && hasCost;
        const isProfit = p.margin >= 0;

        html += `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
            <td style="padding: 0.95rem 1.15rem;">
              <div style="font-weight: 800; color: #ffffff; font-size: 0.88rem;">
                🏭 ${p.name}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; display: flex; gap: 0.4rem; flex-wrap: wrap;">
                ${p.cuit ? `<span>CUIT: ${p.cuit}</span>` : ''}
                ${p.origin ? `<span style="color:#60a5fa;">📍 ${p.origin}</span>` : ''}
              </div>
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: center; font-weight: 700; color: #10b981;">
              ${p.travelCount}
            </td>
            <td style="padding: 0.95rem 1.15rem; max-width: 280px;">
              ${agentBadges || '<span style="color:var(--text-muted);">-</span>'}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: center; font-weight: 700;">
              ${p.heads} cab.
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace;">
              ${p.kgClean.toLocaleString(undefined, {maximumFractionDigits: 0})} kg
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; color: #60a5fa;">
              ${p.kgFaena.toLocaleString(undefined, {maximumFractionDigits: 0})} kg
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: center;">
              ${getYieldBadge(p.yieldPct)}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; font-weight: 750;">
              $${(includeCommission ? p.avgPriceWithCommission : p.avgPrice).toFixed(2)}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; color: var(--text-muted);">
              ${p.costoGancho > 0 ? `$${p.costoGancho.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; font-weight: 800; color: #60a5fa;">
              ${p.realCostGancho > 0 ? `$${p.realCostGancho.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace;">
              ${hasRef ? `$${p.sellPriceRef.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace;">
              ${hasMargin ? `
                <span style="color: ${isProfit ? '#34d399' : '#f87171'}; font-weight: 800;">
                  ${isProfit ? '+' : ''}$${p.margin.toFixed(2)} <span style="font-size:0.72rem;">(${p.marginPct.toFixed(1)}%)</span>
                </span>
              ` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
            </td>
            <td style="padding: 0.95rem 1.15rem; text-align: right; font-family: monospace; font-weight: 800; color: #34d399;">
              $${p.totalOp.toLocaleString(undefined, {maximumFractionDigits: 0})}
            </td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
      viewsWrapper.innerHTML = html;
    }

    function renderMatrixComparisonView() {
      if (crossMatrix.agents.length === 0 || crossMatrix.producers.length === 0) {
        viewsWrapper.innerHTML = `
          <div style="padding: 2.5rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.01); border-radius: 14px; border: 1px dashed var(--border); font-size: 0.88rem; font-weight: 600;">
            No hay suficientes combinaciones de comisionistas y productores para generar la matriz cruzada.
          </div>
        `;
        return;
      }

      let html = `
        <div class="table-responsive" style="background: rgba(0,0,0,0.15); border-radius: 16px; border: 1px solid var(--border); overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; min-width: 800px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border); background: rgba(255,255,255,0.02); color: var(--text-muted); font-weight: 750; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.74rem;">
                <th style="padding: 0.95rem 1.15rem; text-align: left; position: sticky; left: 0; background: #1e1e24; z-index: 2;">
                  Comisionista ╲ Productor
                </th>
                ${crossMatrix.producers.map(prod => `
                  <th style="padding: 0.95rem 1.15rem; text-align: center; min-width: 160px;">
                    🏭 ${prod}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody style="font-weight: 600; color: var(--text-main);">
      `;

      crossMatrix.agents.forEach(ag => {
        html += `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
            <td style="padding: 0.95rem 1.15rem; font-weight: 800; color: #ffffff; position: sticky; left: 0; background: #1e1e24; z-index: 1;">
              👤 ${ag}
            </td>
            ${crossMatrix.producers.map(prod => {
              const cell = crossMatrix.cells[`${ag}:::${prod}`];
              if (!cell) {
                return `<td style="padding: 0.95rem 1.15rem; text-align: center; color: var(--text-muted); font-size: 0.75rem;">-</td>`;
              }
              const yPct = cell.yieldPct;
              let yColor = '#34d399';
              if (yPct === 0) yColor = 'var(--text-muted)';
              else if (yPct < 55) yColor = '#f87171';
              else if (yPct < 57.5) yColor = '#fbbf24';

              const hasCost = cell.realCostGancho > 0;
              const hasRef = cell.sellPriceRef > 0;
              const hasMargin = hasCost && hasRef;
              const isProfit = cell.margin >= 0;

              return `
                <td style="padding: 0.85rem 1rem; text-align: center;">
                  <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 10px; padding: 0.5rem 0.65rem; display: flex; flex-direction: column; gap: 0.25rem; align-items: center;">
                    <span style="font-weight: 850; font-size: 0.88rem; color: ${yColor}; font-family: monospace;">
                      ${yPct.toFixed(2)}%
                    </span>
                    <div style="font-size: 0.75rem; font-family: monospace; color: var(--text-main); font-weight: 700;">
                      $${(includeCommission ? cell.avgPriceWithCommission : cell.avgPrice).toFixed(2)} / kg
                    </div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">
                      ${cell.heads} cab. (${cell.travelCount} v.)
                    </div>
                    ${hasMargin ? `
                      <div style="font-size: 0.72rem; font-family: monospace; color: ${isProfit ? '#34d399' : '#f87171'}; font-weight: 750; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 0.2rem; width: 100%;">
                        Ref: $${cell.sellPriceRef.toFixed(1)} (${isProfit ? '+' : ''}$${cell.margin.toFixed(1)})
                      </div>
                    ` : ''}
                  </div>
                </td>
              `;
            }).join('')}
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
      viewsWrapper.innerHTML = html;
    }

    // Tab Switcher Click Handlers
    tabAgentsBtn.onclick = () => {
      tabAgentsBtn.style.background = '#8b5cf6';
      tabAgentsBtn.style.color = '#ffffff';
      tabProducersBtn.style.background = 'transparent';
      tabProducersBtn.style.color = 'var(--text-muted)';
      tabMatrixBtn.style.background = 'transparent';
      tabMatrixBtn.style.color = 'var(--text-muted)';
      renderAgentsComparisonView();
    };

    tabProducersBtn.onclick = () => {
      tabProducersBtn.style.background = '#10b981';
      tabProducersBtn.style.color = '#ffffff';
      tabAgentsBtn.style.background = 'transparent';
      tabAgentsBtn.style.color = 'var(--text-muted)';
      tabMatrixBtn.style.background = 'transparent';
      tabMatrixBtn.style.color = 'var(--text-muted)';
      renderProducersComparisonView();
    };

    tabMatrixBtn.onclick = () => {
      tabMatrixBtn.style.background = '#6366f1';
      tabMatrixBtn.style.color = '#ffffff';
      tabAgentsBtn.style.background = 'transparent';
      tabAgentsBtn.style.color = 'var(--text-muted)';
      tabProducersBtn.style.background = 'transparent';
      tabProducersBtn.style.color = 'var(--text-muted)';
      renderMatrixComparisonView();
    };

    // Initial render: Agents View
    renderAgentsComparisonView();

    wrapper.appendChild(comparisonSection);

    // --- 3.75 SECCIÓN: DESGLOSE DETALLADO VIAJE POR VIAJE ---
    const travelBreakdownSection = el('div', { 
      classes: ['glass-card'], 
      style: 'margin-bottom: 2.25rem; padding: 1.75rem 2rem; border-radius: 22px; border: 1px solid var(--border); border-left: 6px solid #3b82f6; background: var(--card-bg);' 
    });

    const isFilteredByEntity = Boolean(activeAgentsList.length > 0 || activeProdsList.length > 0);
    const filterContextTitle = activeAgentsList.length > 0 
      ? `Comisionistas: ${activeAgentsList.join(', ')}` 
      : (activeProdsList.length > 0 ? `Productores: ${activeProdsList.join(', ')}` : 'Selección Activa');

    travelBreakdownSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span style="font-size: 1.5rem;">🚛</span>
            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.01em;">
              Desglose Detallado Viaje por Viaje (${filterContextTitle})
            </h3>
          </div>
          <p style="margin: 0.35rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">
            Rendimiento porcentual, volumen de cabezas, kilos faena, precio de referencia de venta y márgenes específicos de cada viaje individual.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="background: rgba(59, 130, 246, 0.12); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.25); padding: 0.45rem 0.85rem; border-radius: 10px; font-weight: 800; font-size: 0.85rem;">
            ${data.length} ${data.length === 1 ? 'Viaje' : 'Viajes'}
          </span>
          <button id="btn-export-travels-excel" type="button" style="
            display: flex; 
            align-items: center; 
            gap: 0.45rem; 
            padding: 0.45rem 1rem; 
            border-radius: 10px; 
            font-size: 0.82rem; 
            font-weight: 700; 
            cursor: pointer; 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            border: none; 
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
            transition: all 0.2s ease;
          " onmouseenter="this.style.opacity='0.9'; this.style.transform='translateY(-1px)';" onmouseleave="this.style.opacity='1'; this.style.transform='translateY(0)';">
            <span>📥 Exportar a Excel</span>
          </button>
        </div>
      </div>
    `;

    // Hook Excel Export button
    const exportExcelBtn = travelBreakdownSection.querySelector('#btn-export-travels-excel');
    if (exportExcelBtn) {
      exportExcelBtn.onclick = () => {
        exportTravelBreakdownExcel(data, categoryPrices, options);
      };
    }

    if (data.length === 0) {
      const emptyTravels = el('div', { 
        style: 'padding: 2.5rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.01); border-radius: 14px; border: 1px dashed var(--border); font-size: 0.88rem; font-weight: 600;',
        text: 'No se encontraron viajes asociados para los filtros de comisionista, productor o período seleccionados.'
      });
      travelBreakdownSection.appendChild(emptyTravels);
    } else {
      const travelTableWrapper = el('div', { 
        classes: ['table-responsive'], 
        style: 'background: rgba(0,0,0,0.15); border-radius: 16px; border: 1px solid var(--border); overflow-x: auto;' 
      });

      const travelTable = el('table', { 
        style: 'width: 100%; border-collapse: collapse; font-size: 0.83rem; min-width: 1100px;' 
      });

      travelTable.innerHTML = `
        <thead>
          <tr style="border-bottom: 2px solid var(--border); background: rgba(255,255,255,0.02); color: var(--text-muted); font-weight: 750; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.74rem;">
            <th style="padding: 0.95rem 1.15rem; text-align: left;">Fecha & Transporte</th>
            <th style="padding: 0.95rem 1.15rem; text-align: left;">Comisionista</th>
            <th style="padding: 0.95rem 1.15rem; text-align: left;">Productores Asociados</th>
            <th style="padding: 0.95rem 1.15rem; text-align: center; width: 85px;">Cabezas</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right;">Kilos Limpios</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right;">Kilos Faena</th>
            <th style="padding: 0.95rem 1.15rem; text-align: center; width: 130px;">Rendimiento (%)</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right;">Precio Vivo</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right; color: var(--text-muted);">Costo Gancho</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right; color: #60a5fa;">Costo Real</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right;">Ref. Venta</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right;">Margen</th>
            <th style="padding: 0.95rem 1.15rem; text-align: right;">Total Operación</th>
            <th style="padding: 0.95rem 1.15rem; text-align: center; width: 85px;">Acción</th>
          </tr>
        </thead>
        <tbody style="font-weight: 600; color: var(--text-main);">
          ${data.map(t => {
            const buy = t.buy || {};
            const yieldPct = (buy.generalYield || 0) * 100;
            const price = includeCommission ? (buy.avgPriceWithCommission || 0) : (buy.avgPrice || 0);
            const yieldRatio = yieldPct > 0 ? (yieldPct / 100) : 0;
            const costoGancho = yieldRatio > 0 ? (price / yieldRatio) : 0;
            const realCostGancho = costoGancho > 0 ? (costoGancho / (1 - 0.017)) : 0;
            const totalOpVal = includeCommission ? (buy.totalOperationWithCommission || 0) : (buy.totalOperation || 0);

            // Compute weighted sell reference price for this individual travel
            let travelSellRef = 0;
            let travelCleanKg = 0;
            (buy.listOfProducers || []).forEach(p => {
              (p.listOfProducts || []).forEach(pr => {
                const cat = pr.standardizedCategory || pr.name;
                const ref = parseFloat(categoryPrices[cat]) || 0;
                const kg = pr.kgClean || 0;
                if (ref > 0 && kg > 0) {
                  travelSellRef += ref * kg;
                  travelCleanKg += kg;
                }
              });
            });
            const tSellRef = travelCleanKg > 0 ? travelSellRef / travelCleanKg : 0;
            const hasCost = realCostGancho > 0;
            const hasRef = tSellRef > 0;
            const hasMargin = hasCost && hasRef;
            const tMargin = hasMargin ? (tSellRef - realCostGancho) : 0;
            const tMarginPct = hasMargin ? (tMargin / realCostGancho) * 100 : 0;
            const isProfit = tMargin >= 0;

            let yieldBadgeColor = '#34d399';
            let yieldBadgeBg = 'rgba(16, 185, 129, 0.12)';
            let yieldBorder = 'rgba(16, 185, 129, 0.25)';
            if (yieldPct === 0 || (buy.totalKgFaena || 0) === 0) {
              yieldBadgeColor = 'var(--text-muted)';
              yieldBadgeBg = 'rgba(255, 255, 255, 0.05)';
              yieldBorder = 'var(--border)';
            } else if (yieldPct < 55) {
              yieldBadgeColor = '#f87171';
              yieldBadgeBg = 'rgba(239, 68, 68, 0.12)';
              yieldBorder = 'rgba(239, 68, 68, 0.25)';
            } else if (yieldPct < 57.5) {
              yieldBadgeColor = '#fbbf24';
              yieldBadgeBg = 'rgba(245, 158, 11, 0.12)';
              yieldBorder = 'rgba(245, 158, 11, 0.25)';
            }

            const producerNames = (buy.listOfProducers || []).map(p => {
              const pName = p.producer?.name || p.name || 'Productor';
              const pOrigin = p.origin ? ` (${p.origin})` : '';
              return `${pName}${pOrigin}`;
            }).join(', ') || 'Sin productores';

            const agentStr = buy.agent?.name ? `👤 ${buy.agent.name} ${buy.agent.percent ? `(${buy.agent.percent}%)` : ''}` : '-';

            return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
                <td style="padding: 0.9rem 1.15rem;">
                  <div style="font-weight: 800; color: #60a5fa; font-size: 0.86rem; display: flex; align-items: center; gap: 0.35rem;">
                    📅 ${t.date || 'Sin fecha'}
                  </div>
                  <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 0.2rem; display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
                    <span>🚚 ${t.truck?.name || 'Camión'}</span>
                    ${t.truck?.licensePlate ? `<span style="font-family:monospace; background:rgba(255,255,255,0.05); padding:0.1rem 0.35rem; border-radius:4px;">${t.truck.licensePlate}</span>` : ''}
                    ${t.tropa ? `<span style="color:#818cf8;">#${t.tropa}</span>` : ''}
                  </div>
                </td>
                <td style="padding: 0.9rem 1.15rem; color: var(--text-main); font-size: 0.8rem;">
                  ${agentStr}
                </td>
                <td style="padding: 0.9rem 1.15rem; color: var(--text-muted); font-size: 0.8rem; max-width: 220px; word-break: break-word;">
                  ${producerNames}
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: center; font-weight: 700; color: var(--text-main);">
                  ${buy.totalQuantity || 0} cab.
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace;">
                  ${(buy.totalKgClean || 0).toLocaleString(undefined, {maximumFractionDigits: 0})} kg
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace; color: #60a5fa;">
                  ${(buy.totalKgFaena || 0).toLocaleString(undefined, {maximumFractionDigits: 0})} kg
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: center;">
                  <span style="background: ${yieldBadgeBg}; color: ${yieldBadgeColor}; border: 1px solid ${yieldBorder}; font-weight: 800; font-size: 0.85rem; padding: 0.25rem 0.65rem; border-radius: 6px; font-family: monospace;">
                    ${yieldPct.toFixed(2)}%
                  </span>
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace; font-weight: 750;">
                  $${price.toFixed(2)}
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace; color: var(--text-muted);">
                  ${hasCost ? `$${costoGancho.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace; font-weight: 800; color: #60a5fa;">
                  ${hasCost ? `$${realCostGancho.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace;">
                  ${hasRef ? `$${tSellRef.toFixed(2)}` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace;">
                  ${hasMargin ? `
                    <span style="color: ${isProfit ? '#34d399' : '#f87171'}; font-weight: 800;">
                      ${isProfit ? '+' : ''}$${tMargin.toFixed(2)} <span style="font-size:0.72rem;">(${tMarginPct.toFixed(1)}%)</span>
                    </span>
                  ` : '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: right; font-family: monospace; font-weight: 800; color: #34d399;">
                  $${totalOpVal.toLocaleString(undefined, {maximumFractionDigits: 0})}
                </td>
                <td style="padding: 0.9rem 1.15rem; text-align: center;">
                  <button class="btn-action btn-view-travel-dash" data-id="${t.id}" style="
                    background: rgba(37, 99, 235, 0.15); 
                    color: #60a5fa; 
                    border: 1px solid rgba(37, 99, 235, 0.3); 
                    border-radius: 8px; 
                    padding: 0.35rem 0.75rem; 
                    font-size: 0.75rem; 
                    font-weight: 700; 
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s;
                  " onmouseenter="this.style.background='#2563eb'; this.style.color='#ffffff';" onmouseleave="this.style.background='rgba(37, 99, 235, 0.15)'; this.style.color='#60a5fa';">
                    🔍 Ver
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      `;
      travelTableWrapper.appendChild(travelTable);
      travelBreakdownSection.appendChild(travelTableWrapper);

      travelTableWrapper.querySelectorAll('.btn-view-travel-dash').forEach(btn => {
        btn.onclick = (e) => {
          const tid = e.currentTarget.dataset.id;
          if (tid && options.onShowTravelDetail) {
            options.onShowTravelDetail(tid);
          }
        };
      });
    }

    wrapper.appendChild(travelBreakdownSection);

    // --- 4. Dispatch history Accordion Sheet ---
    const dispatchSection = el('div', { 
      classes: ['glass-card'], 
      style: 'margin-bottom: 2rem; padding: 0; overflow: hidden; border-radius: 20px;' 
    });
    
    const dispatchHeader = el('div', { 
      style: 'padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.25s ease;',
      classes: ['dispatch-accordion-header']
    });
    dispatchHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.85rem;">
        <span style="font-size: 1.4rem;">🚚</span>
        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 750; color: var(--text-main);">Salidas y Despachos de Hacienda</h3>
      </div>
      <div style="display: flex; align-items: center; gap: 1.25rem;">
        <span id="dispatch-count-badge" style="background: rgba(132, 29, 29, 0.08); color: var(--primary); border: 1px solid rgba(132, 29, 29, 0.2); padding: 0.35rem 0.85rem; border-radius: 10px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.5px;">...</span>
        <span class="accordion-arrow" style="transition: transform 0.3s ease; color: var(--text-muted); font-size: 0.95rem;">▼</span>
      </div>
    `;
    
    const dispatchContent = el('div', { 
      style: 'display: none; padding: 2rem; background: rgba(0,0,0,0.08); border-top: 1px solid var(--border);', 
      classes: ['dispatch-accordion-content'] 
    });
    
    dispatchHeader.onclick = () => {
      const isVisible = dispatchContent.style.display === 'block';
      dispatchContent.style.display = isVisible ? 'none' : 'block';
      dispatchHeader.querySelector('.accordion-arrow').style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
    };

    // Filters for accordion
    const dFilters = el('div', { 
      style: 'display: flex; gap: 1.25rem; margin-bottom: 1.75rem; flex-wrap: wrap; align-items: flex-end;' 
    });
    
    const dateFilter = el('div', { style: 'flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 0.4rem;' });
    dateFilter.innerHTML = `
      <label style="font-size: 0.78rem; font-weight: 650; color: var(--text-muted); text-transform: uppercase;">📅 Fecha Despacho</label>
      <input type="date" class="form-input" style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600;" value="${dashHistoryFilters.date || ''}">
    `;
    dateFilter.querySelector('input').onchange = (e) => onDashHistoryFilter('date', e.target.value);
    
    const destFilter = el('div', { style: 'flex: 2; min-width: 240px; display: flex; flex-direction: column; gap: 0.4rem;' });
    destFilter.innerHTML = `
      <label style="font-size: 0.78rem; font-weight: 650; color: var(--text-muted); text-transform: uppercase;">🏢 Cliente Destinatario</label>
      <select class="form-input" style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600;">
        <option value="">Todos los destinos</option>
        ${clients.map(c => `<option value="${c.name}" ${dashHistoryFilters.destination === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
    `;
    destFilter.querySelector('select').onchange = (e) => onDashHistoryFilter('destination', e.target.value);
    
    dFilters.appendChild(dateFilter);
    dFilters.appendChild(destFilter);
    dispatchContent.appendChild(dFilters);

    const filteredHistory = historyItems.filter(item => {
      if (!item.dispatchDate) return false;
      const dateStr = new Date(item.dispatchDate).toISOString().split('T')[0];
      const dateMatch = !dashHistoryFilters.date || dateStr === dashHistoryFilters.date;
      const destMatch = !dashHistoryFilters.destination || (item.destination || '').includes(dashHistoryFilters.destination);
      return dateMatch && destMatch;
    });
    dispatchHeader.querySelector('#dispatch-count-badge').textContent = `${filteredHistory.length} piezas`;

    if (filteredHistory.length === 0) {
      dispatchContent.appendChild(el('div', { 
        style: 'padding: 2.5rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.01); border-radius: 14px; border: 1px dashed var(--border); font-size: 0.82rem; font-weight: 600;', 
        text: 'No se encontraron despachos registrados para esta fecha o destino.' 
      }));
    } else {
      const listTable = el('div', { 
        classes: ['table-responsive'], 
        style: 'background: rgba(0,0,0,0.12); border-radius: 16px; border: 1px solid var(--border); overflow-x: auto; margin-bottom: 1.5rem;' 
      });
      const table = el('table', { style: 'width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 500px;' });
      table.innerHTML = `
        <thead>
          <tr style="border-bottom: 2px solid var(--border); text-align: left; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 0.85rem 1.15rem;">Garrón #</th>
            <th style="padding: 0.85rem 1.15rem;">Categoría</th>
            <th style="padding: 0.85rem 1.15rem; text-align: right;">Kilos Despachados</th>
            <th style="padding: 0.85rem 1.15rem; text-align: left;">Destino</th>
            <th style="padding: 0.85rem 1.15rem; text-align: center;">Hora Despacho</th>
          </tr>
        </thead>
        <tbody style="font-weight: 600; color: var(--text-main);">
          ${filteredHistory.map(item => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
              <td style="padding: 0.85rem 1.15rem; font-weight: 750; color: #ffffff;">#${item.garron}</td>
              <td style="padding: 0.85rem 1.15rem; color: var(--text-muted);">${item.standardizedCategory || item.category}</td>
              <td style="padding: 0.85rem 1.15rem; text-align: right; color: #34d399; font-weight: 750; font-family: monospace;">${(item.kg || 0).toFixed(1)} kg</td>
              <td style="padding: 0.85rem 1.15rem; color: var(--primary); font-weight: 700;">${item.destination || 'N/A'}</td>
              <td style="padding: 0.85rem 1.15rem; text-align: center; color: var(--text-muted); font-size: 0.78rem;">${new Date(item.dispatchDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hs</td>
            </tr>`).join('')}
        </tbody>
      `;
      listTable.appendChild(table);
      dispatchContent.appendChild(listTable);

      const destSummary = filteredHistory.reduce((acc, i) => {
        const d = i.destination || 'Otro';
        if (!acc[d]) acc[d] = { count: 0, kg: 0 };
        acc[d].count++; acc[d].kg += i.kg || 0;
        return acc;
      }, {});
      
      const summaryRow = el('div', { style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;' });
      Object.entries(destSummary).forEach(([dest, val]) => {
        const card = el('div', { 
          classes: ['glass-card'],
          style: 'border-left: 3px solid #10b981; padding: 0.95rem 1.15rem; border-radius: 12px; background: rgba(16, 185, 129, 0.03);' 
        });
        card.innerHTML = `
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 750; text-transform: uppercase; letter-spacing: 0.5px;">${dest}</div>
          <div style="font-weight: 800; font-size: 1.25rem; color: #34d399; margin: 0.25rem 0; font-family: monospace;">${val.kg.toLocaleString(undefined, {maximumFractionDigits: 0})} kg</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">${val.count} piezas despachadas</div>
        `;
        summaryRow.appendChild(card);
      });
      dispatchContent.appendChild(summaryRow);
    }
    dispatchSection.appendChild(dispatchHeader);
    dispatchSection.appendChild(dispatchContent);
    wrapper.appendChild(dispatchSection);

    if (data.length === 0 && stockTotals.kg === 0) {
      const emptyMsg = el('div', { classes: ['alert', 'info'], text: 'No hay datos operacionales suficientes para desplegar el análisis gráfico.' });
      wrapper.appendChild(emptyMsg);
      container.appendChild(wrapper);
      return;
    }

    // --- 5. Structured Analytics Charts Grid ---
    const { trendsMap = {}, catDistributionMap = {}, entityMap = {} } = categoryStats || {};

    const sortedDates = Object.keys(trendsMap).sort((a,b) => new Date(a) - new Date(b));
    const chartGrid = el('div', { 
      classes: ['chart-grid'],
      style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 2rem; margin-bottom: 2rem;' 
    });
    
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], style: 'padding: 1.5rem; border-radius: 20px;', html: '<h3 style="margin: 0 0 1.25rem 0; font-size: 1.05rem; font-weight: 750;">📈 Tendencias de Precio y Rendimiento</h3><div class="canvas-holder" style="height: 300px; position: relative;"><canvas id="trendChart"></canvas></div>' }));
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], style: 'padding: 1.5rem; border-radius: 20px;', html: '<h3 style="margin: 0 0 1.25rem 0; font-size: 1.05rem; font-weight: 750;">🍰 Mix de Categorías Compradas (Kilos)</h3><div class="canvas-holder" style="height: 300px; position: relative;"><canvas id="categoryChart"></canvas></div>' }));
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], style: 'padding: 1.5rem; border-radius: 20px;', html: '<h3 style="margin: 0 0 1.25rem 0; font-size: 1.05rem; font-weight: 750;">🔝 Top 5 Productores (Kilos)</h3><div class="canvas-holder" style="height: 300px; position: relative;"><canvas id="topProducersChart"></canvas></div>' }));
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], style: 'padding: 1.5rem; border-radius: 20px;', html: '<h3 style="margin: 0 0 1.25rem 0; font-size: 1.05rem; font-weight: 750;">🤝 Top 5 Comisionistas (Kilos)</h3><div class="canvas-holder" style="height: 300px; position: relative;"><canvas id="topAgentsChart"></canvas></div>' }));
    wrapper.appendChild(chartGrid);

    /**
     * Internal helper to render the Producer / Agent ranking grid tables
     * @param {string} typeFilter - 'AGENT' or 'PRODUCER'.
     * @param {string} title - The ranking card title.
     * @returns {string} The constructed layout fragment.
     */
    const renderRankingTable = (typeFilter, title) => {
      const list = Object.keys(entityMap)
        .filter(e => entityMap[e].type === typeFilter)
        .map(e => ({ 
          name: e, 
          avg: entityMap[e].totalYield / entityMap[e].count, 
          min: entityMap[e].minYield, 
          max: entityMap[e].maxYield, 
          count: entityMap[e].count 
        }))
        .sort((a,b) => b.avg - a.avg);
      
      if (list.length === 0) return '';
      return `
        <div class="ranking-card glass-card" style="padding: 1.75rem 2rem; border-radius: 22px;">
          <h3 style="margin-top: 0; margin-bottom: 1.25rem; font-size: 1.1rem; font-weight: 750; color: var(--text-main);">🏆 ${title}</h3>
          <div class="table-responsive" style="background: rgba(0,0,0,0.12); border: 1px solid var(--border); border-radius: 16px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
              <thead>
                <tr style="border-bottom: 2px solid var(--border); color: var(--text-muted); text-align: left; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                  <th style="padding: 0.85rem 1rem;">Nombre</th>
                  <th style="padding: 0.85rem 1rem; text-align: center;">Viajes</th>
                  <th style="padding: 0.85rem 1rem; text-align: right; color: #f87171;">Mín</th>
                  <th style="padding: 0.85rem 1rem; text-align: right; color: #34d399;">Máx</th>
                  <th style="padding: 0.85rem 1rem; text-align: right; font-weight: 800;">Promedio</th>
                </tr>
              </thead>
              <tbody style="font-weight: 650; color: var(--text-main);">
                ${list.map(r => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);" class="ranking-row-hover">
                    <td style="padding: 0.85rem 1rem; font-weight: 700; color: #ffffff;">${r.name}</td>
                    <td style="padding: 0.85rem 1rem; text-align: center; color: var(--text-muted);">${r.count}</td>
                    <td style="padding: 0.85rem 1rem; text-align: right; color: rgba(248, 113, 113, 0.8); font-family: monospace;">${r.min.toFixed(2)}%</td>
                    <td style="padding: 0.85rem 1rem; text-align: right; color: rgba(52, 211, 153, 0.8); font-family: monospace;">${r.max.toFixed(2)}%</td>
                    <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 800; color: #34d399; font-family: monospace;">${r.avg.toFixed(2)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    };

    wrapper.appendChild(el('div', { 
      style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 2rem; margin-top: 1.5rem;', 
      html: renderRankingTable('AGENT', 'Ranking de Comisionistas') + renderRankingTable('PRODUCER', 'Ranking de Productores') 
    }));

    container.appendChild(wrapper);

    // --- 6. ChartJS elements rendering ---
    setTimeout(() => {
      const isDark = document.body.classList.contains('dark') || true; // Force dark-themed colors
      const textColor = isDark ? '#a1a1aa' : '#71717a';
      const borderColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)';
      const palette = ['#841d1d', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
      
      /**
       * Safe Chart.js loader. Destroys pre-existing bindings first.
       * @param {string} id - The Canvas identifier.
       * @param {Object} config - Config parameters structure.
       * @returns {Chart|null} The initialized instance.
       */
      const initChart = (id, config) => { 
        try { 
          const canvas = document.getElementById(id); 
          if (!canvas) return null; 
          if (chartInstances[id]) chartInstances[id].destroy();
          chartInstances[id] = new Chart(canvas, config);
          return chartInstances[id];
        } catch (err) { console.error(`Error chart ${id}:`, err); return null; } 
      };
      
      // Chart 1: Trends
      initChart('trendChart', { 
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
          plugins: { 
            legend: { labels: { color: textColor, font: { weight: '600' } } } 
          }, 
          scales: { 
            x: { ticks: { color: textColor }, grid: { color: borderColor } }, 
            y: { 
              type: 'linear', 
              display: true, 
              position: 'left', 
              ticks: { color: textColor, callback: (v) => '$' + v }, 
              grid: { color: borderColor } 
            }, 
            y1: { 
              type: 'linear', 
              display: true, 
              position: 'right', 
              grid: { drawOnChartArea: false }, 
              ticks: { color: textColor, callback: (v) => v + '%' } 
            } 
          } 
        } 
      });
      
      // Chart 2: Category Mix Doughnut
      const catLabels = Object.keys(catDistributionMap);
      initChart('categoryChart', { 
        type: 'doughnut', 
        data: { 
          labels: catLabels, 
          datasets: [{ 
            data: catLabels.map(l => catDistributionMap[l].kg), 
            backgroundColor: palette, 
            borderColor: '#18181b', 
            borderWidth: 2 
          }] 
        }, 
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { 
            legend: { position: 'right', labels: { color: textColor, font: { size: 10, weight: '600' } } },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const val = catDistributionMap[label];
                  if (!val) return label;
                  const avgBuy = val.buyPriceSum / val.count;
                  const sellPriceRef = parseFloat(categoryPrices[label]) || 0;
                  return [
                    `${label}: ${val.kg.toLocaleString(undefined, {maximumFractionDigits:0})} kg`,
                    `Compra Prom: $${avgBuy.toFixed(2)}`,
                    `Venta (Config): $${sellPriceRef.toFixed(2)}`
                  ];
                }
              }
            }
          } 
        } 
      });

      // Chart 3 & 4: Rankings top 5
      const topP = Object.keys(entityMap).filter(n => entityMap[n].type === 'PRODUCER').sort((a,b) => entityMap[b].totalKg - entityMap[a].totalKg).slice(0, 5);
      initChart('topProducersChart', { type: 'bar', data: { labels: topP, datasets: [{ label: 'Kg Totales', data: topP.map(n => entityMap[n].totalKg), backgroundColor: '#3b82f6', borderRadius: 6 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor, font: { size: 10, weight: '600' } } } } } });
      
      const topA = Object.keys(entityMap).filter(n => entityMap[n].type === 'AGENT').sort((a,b) => entityMap[b].totalKg - entityMap[a].totalKg).slice(0, 5);
      initChart('topAgentsChart', { type: 'bar', data: { labels: topA, datasets: [{ label: 'Kg Totales', data: topA.map(n => entityMap[n].totalKg), backgroundColor: '#8b5cf6', borderRadius: 6 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor, font: { size: 10, weight: '600' } } } } } });
    }, 150);
  } catch (error) {
    console.error("Dashboard Render Error:", error);
    container.innerHTML = `<div class="alert error" style="padding: 1.5rem; border-radius: 12px; font-weight:600;">Error al cargar Dashboard: ${error.message}</div>`;
  }
}
