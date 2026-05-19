/**
 * @file DashboardUI.js
 * @description Panel visual de control gerencial para el análisis de tendencias, rendimientos de faena, stock en cámaras y simulación de costos reales en gancho.
 * @module ui/screens/DashboardUI
 * @author Antigravity
 */

import { el } from '../../utils/dom.js';
import { renderTimeFilterUI } from '../components/Filters.js';
import { MarketService } from '../../api/MarketService.js';
import Chart from 'chart.js/auto';

/**
 * Instancias de gráficos activos cargados por Chart.js.
 * Se conservan en el ámbito local del módulo para destruirlas y recrearlas limpiamente al cambiar de filtros.
 * @type {Object<string, Chart>}
 */
let chartInstances = {};

/**
 * Genera una tarjeta de KPI estadístico estandarizada.
 * @param {string} label - Título o etiqueta descriptiva de la tarjeta.
 * @param {string|number} value - Valor numérico o textual principal a resaltar.
 * @param {string} icon - Emoji o ícono representativo.
 * @param {string} [subtext=''] - Texto secundario aclaratorio.
 * @returns {HTMLElement} Elemento DOM que contiene la tarjeta renderizada.
 */
function renderStatCard(label, value, icon, subtext = '') {
  return el('div', { 
    classes: ['stat-card'], 
    html: `
      <div class="stat-icon">${icon}</div>
      <div class="stat-info">
        <p>${label}</p>
        <h3>${value}</h3>
        ${subtext ? `<div style="font-size:0.75em; color:var(--text-muted); margin-top:4px;">${subtext}</div>` : ''}
      </div>` 
  });
}

/**
 * Renderiza el dashboard interactivo de analítica gerencial en el contenedor DOM especificado.
 * @param {HTMLElement} container - Contenedor raíz donde se inyectará la vista.
 * @param {Object} options - Parámetros de configuración, datos filtrados y handlers de eventos.
 * @param {Array<Object>} [options.data=[]] - Viajes completados que alimentan la analítica.
 * @param {Array<string>} [options.categories=[]] - Lista completa de categorías disponibles para el filtro.
 * @param {Array<string>} [options.selectedCategories=[]] - Categorías actualmente seleccionadas.
 * @param {boolean} [options.includeCommission=false] - Flag para incluir comisiones en los cálculos de precios promedios.
 * @param {Function} options.onCategoryToggle - Callback invocado al alternar el filtro de una categoría.
 * @param {Function} options.onCommissionToggle - Callback invocado al alternar la comisión.
 * @param {Object} options.categoryStats - Resumen de métricas y analíticas devuelto por el caso de uso del dominio.
 * @param {Object} options.stockTotals - Resumen consolidado del stock actual de medias reses (kilos, cantidad global y por categoría).
 * @param {Array<Object>} [options.historyItems=[]] - Elementos de despacho del día.
 * @param {Array<Object>} [options.clients=[]] - Listado de clientes cargados.
 * @param {Object} [options.dashHistoryFilters={}] - Filtros activos del acordeón de despachos históricos.
 * @param {Function} options.onDashHistoryFilter - Callback invocado al actualizar un filtro de despachos históricos.
 * @param {Object} [options.categoryPrices={}] - Referencia de precios de venta configurados por categoría.
 */
export function renderDashboard(container, options) {
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

    // --- 0. HEADER ---
    const header = el('div', { classes: ['dashboard-header', 'glass-card'] });
    header.innerHTML = `<h2>📊 Dashboard de Inteligencia</h2><p>Análisis de rendimiento y tendencias de precios.</p>`;
    wrapper.appendChild(header);

    // --- 1. STOCK ACTUAL SECTION ---
    const stockSection = el('div', { classes: ['glass-card'], style: 'margin-bottom: 2rem; padding: 1.5rem;' });
    stockSection.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
        <span style="font-size: 1.5rem;">🥩</span>
        <h3 style="margin: 0;">Stock Actual de Medias Reses</h3>
      </div>
      <div class="stock-chips-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;">
        <div class="stock-category-card" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 1rem;">
          <div style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">TOTAL COLGADO</div>
          <div style="font-size: 1.2rem; font-weight: 700; margin: 0.25rem 0;">${stockTotals.kg.toLocaleString(undefined, {maximumFractionDigits: 1})} kg</div>
          <div style="color: var(--text-muted); font-size: 0.75rem;">Peso acumulado</div>
        </div>
        <div class="stock-category-card" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 1rem;">
          <div style="color: var(--success); font-size: 0.8rem; font-weight: 600;">TOTAL PIEZAS</div>
          <div style="font-size: 1.2rem; font-weight: 700; margin: 0.25rem 0;">${stockTotals.count}</div>
          <div style="color: var(--success); font-size: 0.75rem;">Medias reses</div>
        </div>
        ${Object.entries(stockTotals.byCategory).map(([cat, val]) => `
          <div class="stock-category-card" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 1rem;">
            <div style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">${cat}</div>
            <div style="font-size: 1.2rem; font-weight: 700; margin: 0.25rem 0;">${val.kg.toLocaleString(undefined, {maximumFractionDigits: 1})} kg</div>
            <div style="color: var(--primary); font-size: 0.75rem;">${val.count} piezas</div>
          </div>
        `).join('')}
      </div>
    `;
    wrapper.appendChild(stockSection);

    // --- 2. FILTERS CONTAINER ---
    const filtersArea = el('div', { classes: ['dashboard-filters', 'glass-card'], style: 'margin-bottom: 2rem;' });
    const timeRow = renderTimeFilterUI(options);
    filtersArea.appendChild(timeRow);

    const chipsRow = el('div', { classes: ['selector-row'] });
    const catLabel = el('span', { text: 'Categorías:', classes: ['selector-label'] });
    const chipsContainer = el('div', { classes: ['category-chips-container'] });
    categories.forEach(cat => {
      const isTodos = cat === 'TODOS';
      const isSelected = isTodos ? selectedCategories.length === 0 : selectedCategories.includes(cat);
      const chip = el('button', { classes: ['category-chip', isSelected ? 'active' : 'inactive'], text: cat });
      chip.onclick = () => onCategoryToggle && onCategoryToggle(cat);
      chipsContainer.appendChild(chip);
    });

    const commToggle = el('label', { classes: ['comm-toggle'], html: `
      <input type="checkbox" ${includeCommission ? 'checked' : ''}>
      <span>Con Comisión</span>
    ` });
    const commInput = commToggle.querySelector('input');
    if (commInput) {
      commInput.onchange = (e) => onCommissionToggle && onCommissionToggle(e.target.checked);
    }

    chipsRow.appendChild(catLabel);
    chipsRow.appendChild(chipsContainer);
    chipsRow.appendChild(commToggle);
    filtersArea.appendChild(chipsRow);
    wrapper.appendChild(filtersArea);

    // --- 3. KPI STAT CARDS ---
    if (categoryStats) {
      const labelSuffix = selectedCategories.length === 0 ? 'Totales' : selectedCategories.join(', ');
      const statsGrid = el('div', { classes: ['stats-grid'], style: 'margin-bottom: 2rem;' });

      statsGrid.appendChild(renderStatCard(`Compra Prom. [${labelSuffix}]`, `$${(categoryStats.avgPrice || 0).toFixed(2)}`, '💰'));
      statsGrid.appendChild(renderStatCard('Compra c/Comis.', `$${(categoryStats.avgPriceWithCommission || 0).toFixed(2)}`, '💸'));
      
      // Simulación del Costo Real en Gancho con IIBB, Flete y Comisión
      if (selectedCategories.length === 1) {
        const cat = selectedCategories[0];
        const { realCostGancho, sellPriceRef, margin, marginPct, yieldVal } = categoryStats;

        statsGrid.appendChild(renderStatCard('Costo Real en Gancho', `$${(realCostGancho || 0).toFixed(2)}`, '🏗️', `Rend: ${((yieldVal || 0) * 100).toFixed(1)}% | Incl. Flete, Comis. e IIBB`));

        if (sellPriceRef > 0) {
          const marginColor = margin >= 0 ? '#10b981' : '#ef4444';

          statsGrid.appendChild(renderStatCard(`Venta Config [${cat}]`, `$${(sellPriceRef || 0).toFixed(2)}`, '🏷️'));

          const diffCard = renderStatCard('Utilidad $/Kg (Real)', `${margin >= 0 ? '+' : ''}$${(margin || 0).toFixed(2)}`, '⚖️');
          diffCard.querySelector('h3').style.color = marginColor;
          statsGrid.appendChild(diffCard);

          const pctCard = renderStatCard('Rendimiento Final', `${marginPct >= 0 ? '+' : ''}${(marginPct || 0).toFixed(2)}%`, '📊');
          pctCard.querySelector('h3').style.color = marginColor;
          statsGrid.appendChild(pctCard);
        }
      }

      statsGrid.appendChild(renderStatCard('Viajes Incluidos', `${categoryStats.travelCount || 0}`, '🚛'));
      statsGrid.appendChild(renderStatCard('Peso Media Res (Prom.)', `${(categoryStats.avgKgMediaRes || 0).toFixed(2)} kg`, '🥩'));
      statsGrid.appendChild(renderStatCard('Cabezas Totales', `${categoryStats.totalQuantity || 0}`, '🐂'));
      statsGrid.appendChild(renderStatCard('Rendimiento Promedio', `${((categoryStats.avgYield || 0) * 100).toFixed(2)}%`, '📈'));
      
      const maxYieldLabel = categoryStats.maxYield > 0 ? `${(categoryStats.maxYield * 100).toFixed(2)}%` : 'N/A';
      statsGrid.appendChild(renderStatCard('Rendimiento Máximo', maxYieldLabel, '👑', categoryStats.maxYieldEntity || ''));

      const totalCostoFaenados = (categoryStats.totalKgFaena || 0) * (categoryStats.avgPriceWithCommission || 0);
      statsGrid.appendChild(renderStatCard('Kilos Faenados', `${(categoryStats.totalKgFaena || 0).toLocaleString()} kg`, '🔪', `Costo: $${totalCostoFaenados.toLocaleString(undefined, { maximumFractionDigits: 0 })}`));

      // Comparación con mercado de referencia MAG (Mercado Agroganadero)
      const selectedCat = selectedCategories.length === 1 ? selectedCategories[0] : null;
      if (selectedCat && selectedCat !== 'TODOS') {
        MarketService.getReferencePrices().then(prices => {
          const ref = prices[selectedCat];
          if (ref) {
            const gap = MarketService.calculateGap(categoryStats.avgPrice, ref);
            const gapColor = gap > 0 ? '#ef4444' : '#10b981';
            const sign = gap > 0 ? '+' : '';
            const gapCard = renderStatCard('Vs Mercado (MAG)', `${sign}${gap.toFixed(1)}%`, '📈');
            gapCard.querySelector('h3').style.color = gapColor;
            statsGrid.appendChild(gapCard);
            statsGrid.appendChild(renderStatCard('Precio MAG (+IVA)', `$${ref.toLocaleString()}`, '🏷️', 'Fuente: MAG'));
          }
        });
      }
      wrapper.appendChild(statsGrid);
    }

    // --- 4. SALIDAS / DESPACHOS SECTION ---
    const dispatchSection = el('div', { classes: ['glass-card'], style: 'margin-bottom: 2rem; padding: 0;' });
    const dispatchHeader = el('div', { 
      style: 'padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.2s;',
      classes: ['dispatch-accordion-header']
    });
    dispatchHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.5rem;">🚚</span>
        <h3 style="margin: 0;">Salidas y Despachos del Día</h3>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span id="dispatch-count-badge" style="background: rgba(132, 29, 29, 0.1); color: var(--primary); padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">...</span>
        <span class="accordion-arrow" style="transition: transform 0.3s;">▼</span>
      </div>
    `;
    const dispatchContent = el('div', { style: 'display: none; padding: 1.5rem; background: rgba(0,0,0,0.05);', classes: ['dispatch-accordion-content'] });
    dispatchHeader.onclick = () => {
      const isVisible = dispatchContent.style.display === 'block';
      dispatchContent.style.display = isVisible ? 'none' : 'block';
      dispatchHeader.querySelector('.accordion-arrow').style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
    };

    const dFilters = el('div', { style: 'display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: flex-end;' });
    const dateFilter = el('div', { style: 'flex: 1; min-width: 150px;' });
    dateFilter.innerHTML = `<label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">Fecha</label>
      <input type="date" class="form-input" style="width:100%" value="${dashHistoryFilters.date || ''}">`;
    dateFilter.querySelector('input').onchange = (e) => onDashHistoryFilter('date', e.target.value);
    
    const destFilter = el('div', { style: 'flex: 2; min-width: 200px;' });
    destFilter.innerHTML = `<label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">Filtrar por Destino</label>
      <select class="form-input" style="width:100%">
        <option value="">Todos los destinos</option>
        ${clients.map(c => `<option value="${c.name}" ${dashHistoryFilters.destination === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>`;
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
      dispatchContent.appendChild(el('div', { style: 'padding: 2rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed var(--border);', text: 'No se encontraron despachos.' }));
    } else {
      const listTable = el('div', { classes: ['table-responsive'], style: 'background: rgba(255,255,255,0.02); border-radius: 12px;' });
      const table = el('table', { style: 'width: 100%; border-collapse: collapse; font-size: 0.9rem;' });
      table.innerHTML = `<thead><tr style="border-bottom: 1px solid var(--border); text-align: left; color: var(--text-muted);"><th style="padding: 1rem;">Garrón</th><th style="padding: 1rem;">Categoría</th><th style="padding: 1rem;">Kilos</th><th style="padding: 1rem;">Destino</th><th style="padding: 1rem;">Hora</th></tr></thead><tbody>
          ${filteredHistory.map(item => `<tr style="border-bottom: 1px solid var(--border);"><td style="padding: 1rem; font-weight: 600;">#${item.garron}</td><td style="padding: 1rem;">${item.standardizedCategory || item.category}</td><td style="padding: 1rem; color: #10b981; font-weight: 700;">${(item.kg || 0).toFixed(1)} kg</td><td style="padding: 1rem; color: var(--primary); font-weight: 500;">${item.destination || 'N/A'}</td><td style="padding: 1rem; color: var(--text-muted); font-size: 0.8rem;">${new Date(item.dispatchDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td></tr>`).join('')}
        </tbody>`;
      listTable.appendChild(table);
      dispatchContent.appendChild(listTable);

      const destSummary = filteredHistory.reduce((acc, i) => {
        const d = i.destination || 'Otro';
        if (!acc[d]) acc[d] = { count: 0, kg: 0 };
        acc[d].count++; acc[d].kg += i.kg || 0;
        return acc;
      }, {});
      
      const summaryRow = el('div', { style: 'margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;' });
      Object.entries(destSummary).forEach(([dest, val]) => {
        const card = el('div', { style: 'background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 0.75rem 1rem; flex: 1; min-width: 150px;' });
        card.innerHTML = `<div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">${dest}</div><div style="font-weight: 700; font-size: 1.1rem; color: #10b981;">${val.kg.toLocaleString(undefined, {maximumFractionDigits: 0})} kg</div><div style="font-size: 0.75rem; color: var(--text-muted);">${val.count} piezas</div>`;
        summaryRow.appendChild(card);
      });
      dispatchContent.appendChild(summaryRow);
    }
    dispatchSection.appendChild(dispatchHeader);
    dispatchSection.appendChild(dispatchContent);
    wrapper.appendChild(dispatchSection);

    if (data.length === 0 && stockTotals.kg === 0) {
      const emptyMsg = el('div', { classes: ['alert', 'info'], text: 'No hay datos suficientes.' });
      wrapper.appendChild(emptyMsg);
      container.appendChild(wrapper);
      return;
    }

    // --- 5. CHARTS & RANKINGS ---
    const { trendsMap = {}, catDistributionMap = {}, entityMap = {} } = categoryStats || {};

    const sortedDates = Object.keys(trendsMap).sort((a,b) => new Date(a) - new Date(b));
    const chartGrid = el('div', { classes: ['chart-grid'] });
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>📈 Tendencias de Precio y Rendimiento</h3><div class="canvas-holder"><canvas id="trendChart"></canvas></div>' }));
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>🍰 Mix de Categorías Compradas (Kilos)</h3><div class="canvas-holder"><canvas id="categoryChart"></canvas></div>' }));
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>🔝 Top 5 Productores (Kilos)</h3><div class="canvas-holder"><canvas id="topProducersChart"></canvas></div>' }));
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>🤝 Top 5 Comisionistas (Kilos)</h3><div class="canvas-holder"><canvas id="topAgentsChart"></canvas></div>' }));
    wrapper.appendChild(chartGrid);

    /**
     * Helper para renderizar las tablas de rankings de Productores y Comisionistas.
     * @param {string} typeFilter - 'AGENT' o 'PRODUCER'.
     * @param {string} title - Título de la tabla.
     * @returns {string} Fragmento HTML correspondiente al card de ranking.
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
        <div class="ranking-card glass-card" style="padding: 1.5rem;">
          <h3 style="margin-top: 0; margin-bottom: 1rem;">🏆 ${title}</h3>
          <div class="table-responsive">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); text-align: left;">
                  <th style="padding: 0.5rem;">Nombre</th>
                  <th style="padding: 0.5rem; text-align: center;">Viajes</th>
                  <th style="padding: 0.5rem; text-align: right; color: var(--danger);">Mín (%)</th>
                  <th style="padding: 0.5rem; text-align: right; color: var(--success);">Máx (%)</th>
                  <th style="padding: 0.5rem; text-align: right; font-weight: 700;">Prom (%)</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(r => `
                  <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 0.5rem; font-weight: 500;">${r.name}</td>
                    <td style="padding: 0.5rem; text-align: center; color: var(--text-muted);">${r.count}</td>
                    <td style="padding: 0.5rem; text-align: right; color: rgba(239, 68, 68, 0.8);">${r.min.toFixed(2)}%</td>
                    <td style="padding: 0.5rem; text-align: right; color: rgba(16, 185, 129, 0.8);">${r.max.toFixed(2)}%</td>
                    <td style="padding: 0.5rem; text-align: right; font-weight: 700; color: var(--text-main);">${r.avg.toFixed(2)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    };

    wrapper.appendChild(el('div', { 
      style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;', 
      html: renderRankingTable('AGENT', 'Ranking de Comisionistas') + renderRankingTable('PRODUCER', 'Ranking de Productores') 
    }));

    container.appendChild(wrapper);

    // 6. Inicialización de los gráficos de Chart.js con un retraso seguro
    setTimeout(() => {
      const isDark = document.body.classList.contains('dark');
      const textColor = isDark ? '#ffffff' : '#71717a';
      const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      const palette = ['#841d1d', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
      
      /**
       * Inicializa de forma segura un gráfico y destruye su instancia previa si existe.
       * @param {string} id - ID del canvas en el DOM.
       * @param {Object} config - Configuración completa para Chart.js.
       * @returns {Chart|null} Instancia del gráfico creado.
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
      
      // Gráfico 1: Tendencias de Precio y Rendimiento
      initChart('trendChart', { 
        type: 'line', 
        data: { 
          labels: sortedDates, 
          datasets: [
            { 
              label: 'Precio Promedio ($)', 
              data: sortedDates.map(d => trendsMap[d].totalPrice / trendsMap[d].count), 
              borderColor: isDark ? '#ffffff' : '#841d1d', 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(132, 29, 29, 0.1)', 
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
            legend: { labels: { color: textColor } } 
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
      
      // Gráfico 2: Doughnut de Mix de Categorías Compradas
      const catLabels = Object.keys(catDistributionMap);
      initChart('categoryChart', { 
        type: 'doughnut', 
        data: { 
          labels: catLabels, 
          datasets: [{ 
            data: catLabels.map(l => catDistributionMap[l].kg), 
            backgroundColor: palette, 
            borderColor: isDark ? '#18181b' : '#ffffff', 
            borderWidth: 2 
          }] 
        }, 
        options: { 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { 
            legend: { position: 'right', labels: { color: textColor, font: { size: 10 } } },
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

      // Gráficos 3 y 4: Top 5 Productores y Top 5 Comisionistas
      const topP = Object.keys(entityMap).filter(n => entityMap[n].type === 'PRODUCER').sort((a,b) => entityMap[b].totalKg - entityMap[a].totalKg).slice(0, 5);
      initChart('topProducersChart', { type: 'bar', data: { labels: topP, datasets: [{ label: 'Kg Totales', data: topP.map(n => entityMap[n].totalKg), backgroundColor: '#3b82f6', borderRadius: 6 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor, font: { size: 10 } } } } } });
      
      const topA = Object.keys(entityMap).filter(n => entityMap[n].type === 'AGENT').sort((a,b) => entityMap[b].totalKg - entityMap[a].totalKg).slice(0, 5);
      initChart('topAgentsChart', { type: 'bar', data: { labels: topA, datasets: [{ label: 'Kg Totales', data: topA.map(n => entityMap[n].totalKg), backgroundColor: '#8b5cf6', borderRadius: 6 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor, font: { size: 10 } } } } } });
    }, 150);
  } catch (error) {
    console.error("Dashboard Render Error:", error);
    container.innerHTML = `<div class="alert error">Error al cargar Dashboard: ${error.message}</div>`;
  }
}
