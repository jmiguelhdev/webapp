import { el } from '../../utils/dom.js';
import { renderTimeFilterUI } from '../components/Filters.js';
import { MarketService } from '../../api/MarketService.js';
import Chart from 'chart.js/auto';

// Scoped chart instances for this module
let chartInstances = {};

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

export function renderDashboard(container, options) {
  const { 
    data = [], categories = [], selectedCategories = [], includeCommission = false, 
    onCategoryToggle, onCommissionToggle,
    categoryStats,
    stockItems = [], historyItems = [], clients = [], dashHistoryFilters = {},
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
    const stockTotals = stockItems.reduce((acc, item) => {
      acc.kg += item.kg || 0;
      acc.count += 1;
      const cat = item.standardizedCategory || 'OTRO';
      if (!acc.byCategory[cat]) acc.byCategory[cat] = { kg: 0, count: 0 };
      acc.byCategory[cat].kg += item.kg || 0;
      acc.byCategory[cat].count += 1;
      return acc;
    }, { kg: 0, count: 0, byCategory: {} });

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
      
      // Dynamic Real Cost and Margin Cards when ONE category is selected
      if (selectedCategories.length === 1) {
        const cat = selectedCategories[0];
        const sellPriceRef = parseFloat(categoryPrices[cat]) || 0;
        
        // --- REAL COST LOGIC (Refined Simulator Logic) ---
        // 1. Costo Vivo = (Compra + Flete + Comisión) / KgLimpio
        const totalBaseCost = includeCommission ? (categoryStats.avgPriceWithCommission * categoryStats.totalKg) : (categoryStats.avgPrice * categoryStats.totalKg);
        const totalFreight = categoryStats.totalFreight || 0;
        const totalKg = categoryStats.totalKg || 1;
        const costoVivo = (totalBaseCost + totalFreight) / totalKg;

        // 2. Costo Gancho = Costo Vivo / Rendimiento
        const yieldVal = categoryStats.avgYield || 0.58; // fallback to 58% if no yield data
        const costoGancho = yieldVal > 0 ? (costoVivo / yieldVal) : 0;

        // 3. Costo Final (with IIBB) = Costo Gancho / (1 - IIBB_Rate)
        const iibbRate = 0.017; // 1.7% from Simulator
        const realCostGancho = costoGancho / (1 - iibbRate);

        statsGrid.appendChild(renderStatCard('Costo Real en Gancho', `$${realCostGancho.toFixed(2)}`, '🏗️', `Rend: ${(yieldVal * 100).toFixed(1)}% | Incl. Flete, Comis. e IIBB`));

        if (sellPriceRef > 0) {
          const margin = sellPriceRef - realCostGancho;
          const marginPct = (margin / (realCostGancho || 1)) * 100;
          const marginColor = margin >= 0 ? '#10b981' : '#ef4444';

          statsGrid.appendChild(renderStatCard(`Venta Config [${cat}]`, `$${sellPriceRef.toFixed(2)}`, '🏷️'));

          const diffCard = renderStatCard('Utilidad $/Kg (Real)', `${margin >= 0 ? '+' : ''}$${margin.toFixed(2)}`, '⚖️');
          diffCard.querySelector('h3').style.color = marginColor;
          statsGrid.appendChild(diffCard);

          const pctCard = renderStatCard('Rendimiento Final', `${marginPct >= 0 ? '+' : ''}${marginPct.toFixed(2)}%`, '📊');
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

      // Market comparison (MAG)
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

    if (data.length === 0 && stockItems.length === 0) {
      const emptyMsg = el('div', { classes: ['alert', 'info'], text: 'No hay datos suficientes.' });
      wrapper.appendChild(emptyMsg);
      container.appendChild(wrapper);
      return;
    }

    // --- 5. CHARTS & RANKINGS ---
    const trendsMap = {};
    const catDistributionMap = {};
    const entityMap = {};
    data.forEach(t => {
      const date = t.date || 'Sin Fecha';
      if (!trendsMap[date]) trendsMap[date] = { totalPrice: 0, totalYield: 0, count: 0 };
      const buy = t.buy || {};
      const price = includeCommission ? (buy.avgPriceWithCommission || 0) : (buy.avgPrice || 0);
      const yieldVal = (buy.generalYield || 0) * 100;
      trendsMap[date].totalPrice += price; trendsMap[date].totalYield += yieldVal; trendsMap[date].count++;

      (buy.categories || []).forEach(cat => { 
        if (!catDistributionMap[cat]) catDistributionMap[cat] = { kg: 0, buyPriceSum: 0, count: 0 }; 
        const kgShare = (buy.totalKgClean || 0) / (buy.categories.length || 1);
        catDistributionMap[cat].kg += kgShare;
        catDistributionMap[cat].buyPriceSum += price;
        catDistributionMap[cat].count++;
      });
      
      const agentName = buy.agent?.name;
      if (agentName) {
        if (!entityMap[agentName]) entityMap[agentName] = { totalPrice: 0, totalYield: 0, yields: [], count: 0, totalKg: 0, type: 'AGENT', minYield: 999, maxYield: 0 };
        entityMap[agentName].totalPrice += price; entityMap[agentName].totalYield += yieldVal; entityMap[agentName].totalKg += (buy.totalKgClean || 0); entityMap[agentName].count++;
        entityMap[agentName].minYield = Math.min(entityMap[agentName].minYield, yieldVal); entityMap[agentName].maxYield = Math.max(entityMap[agentName].maxYield, yieldVal);
      }
      (buy.listOfProducers || []).forEach(p => {
        const pName = p.producer?.name;
        if (pName) {
          if (!entityMap[pName]) entityMap[pName] = { totalPrice: 0, totalYield: 0, yields: [], count: 0, totalKg: 0, type: 'PRODUCER', minYield: 999, maxYield: 0 };
          entityMap[pName].totalPrice += price; entityMap[pName].totalYield += yieldVal; entityMap[pName].totalKg += (p.totalKgClean || 0); entityMap[pName].count++;
          entityMap[pName].minYield = Math.min(entityMap[pName].minYield, yieldVal); entityMap[pName].maxYield = Math.max(entityMap[pName].maxYield, yieldVal);
        }
      });
    });

    const sortedDates = Object.keys(trendsMap).sort((a,b) => new Date(a) - new Date(b));
    const chartGrid = el('div', { classes: ['chart-grid'] });
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>📈 Tendencias de Precio y Rendimiento</h3><div class="canvas-holder"><canvas id="trendChart"></canvas></div>' }));
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>🍰 Mix de Categorías Compradas (Kilos)</h3><div class="canvas-holder"><canvas id="categoryChart"></canvas></div>' }));
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>🔝 Top 5 Productores (Kilos)</h3><div class="canvas-holder"><canvas id="topProducersChart"></canvas></div>' }));
    chartGrid.appendChild(el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>🤝 Top 5 Comisionistas (Kilos)</h3><div class="canvas-holder"><canvas id="topAgentsChart"></canvas></div>' }));
    wrapper.appendChild(chartGrid);

    const renderRankingTable = (typeFilter, title) => {
      const list = Object.keys(entityMap).filter(e => entityMap[e].type === typeFilter).map(e => ({ name: e, avg: entityMap[e].totalYield / entityMap[e].count, min: entityMap[e].minYield, max: entityMap[e].maxYield, count: entityMap[e].count })).sort((a,b) => b.avg - a.avg);
      if (list.length === 0) return '';
      return `<div class="ranking-card glass-card" style="padding: 1.5rem;"><h3 style="margin-top: 0; margin-bottom: 1rem;">🏆 ${title}</h3><div class="table-responsive"><table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;"><thead><tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); text-align: left;"><th style="padding: 0.5rem;">Nombre</th><th style="padding: 0.5rem; text-align: center;">Viajes</th><th style="padding: 0.5rem; text-align: right; color: var(--danger);">Mín (%)</th><th style="padding: 0.5rem; text-align: right; color: var(--success);">Máx (%)</th><th style="padding: 0.5rem; text-align: right; font-weight: 700;">Prom (%)</th></tr></thead><tbody>
          ${list.map(r => `<tr style="border-bottom: 1px solid var(--border);"><td style="padding: 0.5rem; font-weight: 500;">${r.name}</td><td style="padding: 0.5rem; text-align: center; color: var(--text-muted);">${r.count}</td><td style="padding: 0.5rem; text-align: right; color: rgba(239, 68, 68, 0.8);">${r.min.toFixed(2)}%</td><td style="padding: 0.5rem; text-align: right; color: rgba(16, 185, 129, 0.8);">${r.max.toFixed(2)}%</td><td style="padding: 0.5rem; text-align: right; font-weight: 700; color: var(--text-main);">${r.avg.toFixed(2)}%</td></tr>`).join('')}
        </tbody></table></div></div>`;
    };
    wrapper.appendChild(el('div', { style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;', html: renderRankingTable('AGENT', 'Ranking de Comisionistas') + renderRankingTable('PRODUCER', 'Ranking de Productores') }));

    container.appendChild(wrapper);

    // 6. Init Charts with a safer delay
    setTimeout(() => {
      const isDark = document.body.classList.contains('dark');
      const textColor = isDark ? '#ffffff' : '#71717a';
      const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      const palette = ['#841d1d', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
      
      const initChart = (id, config) => { 
        try { 
          const canvas = document.getElementById(id); 
          if (!canvas) return null; 
          if (chartInstances[id]) chartInstances[id].destroy();
          chartInstances[id] = new Chart(canvas, config);
          return chartInstances[id];
        } catch (err) { console.error(`Error chart ${id}:`, err); return null; } 
      };
      
      initChart('trendChart', { type: 'line', data: { labels: sortedDates, datasets: [{ label: 'Precio Promedio ($)', data: sortedDates.map(d => trendsMap[d].totalPrice / trendsMap[d].count), borderColor: isDark ? '#ffffff' : '#841d1d', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(132, 29, 29, 0.1)', yAxisID: 'y', tension: 0.3, fill: true }, { label: 'Rendimiento (%)', data: sortedDates.map(d => trendsMap[d].totalYield / trendsMap[d].count), borderColor: '#10b981', yAxisID: 'y1', tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: textColor } } }, scales: { x: { ticks: { color: textColor }, grid: { color: borderColor } }, y: { type: 'linear', display: true, position: 'left', ticks: { color: textColor, callback: (v) => '$' + v }, grid: { color: borderColor } }, y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: textColor, callback: (v) => v + '%' } } } } });
      
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
          responsive: true, maintainAspectRatio: false, 
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
