/**
 * @file DashboardUI.js
 * @description Modern glassmorphic analytics control center featuring real-time stock boards,
 * KPI metric grids, and dynamic, highly-responsive charts.
 * @module ui/screens/DashboardUI
 * @author Antigravity
 */

import { el } from '../../utils/dom.js';
import { renderTimeFilterUI } from '../components/Filters.js';
import { MarketService } from '../../api/MarketService.js';
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

    // --- 2. Interactive Filter Board ---
    const filtersArea = el('div', { 
      classes: ['dashboard-filters', 'glass-card'], 
      style: 'margin-bottom: 2rem; padding: 1.5rem 2rem; border-radius: 22px; display: flex; flex-direction: column; gap: 1.25rem;' 
    });
    
    // A. Filters Sub-component
    const timeRow = renderTimeFilterUI(options);
    filtersArea.appendChild(timeRow);

    // B. Category chip layout filters
    const chipsRow = el('div', { 
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
    filtersArea.appendChild(chipsRow);
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

        const realCostCard = el('kmp-metric-card', {
          attrs: {
            title: `Costo Real Gancho`,
            value: `$${(realCostGancho || 0).toFixed(2)}`,
            icon: '🏗️',
            subtitle: `Rend: ${((yieldVal || 0) * 100).toFixed(1)}% | Incl. Flete, Comis. e IIBB`
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

      // 3. Travels Card
      const travelsCard = el('kmp-metric-card', {
        attrs: {
          title: `Viajes Completados`,
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
          value: `${categoryStats.totalQuantity || 0} cabezas`,
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
          if (window.travelPresenter) {
            window.travelPresenter.showTravelDetail(categoryStats.maxYieldTravelId);
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
