import { el } from '../../utils/dom.js';
import { renderTimeFilterUI } from '../components/Filters.js';
import Chart from 'chart.js/auto';

// Scoped chart instances for this module
let chartInstances = {};

export function renderDashboard(container, options) {
  const { 
    data, categories, selectedCategories, includeCommission, 
    onCategoryToggle, onCommissionToggle 
  } = options;

  container.innerHTML = '';
  const wrapper = el('div', { classes: ['dashboard-wrapper'] });

  // 0. Header & Filters
  const header = el('div', { classes: ['dashboard-header', 'glass-card'] });
  header.innerHTML = `<h2>📊 Dashboard de Inteligencia</h2><p>Análisis de rendimiento y tendencias de precios.</p>`;
  
  const filtersArea = el('div', { classes: ['dashboard-filters', 'glass-card'] });
  
  const timeRow = renderTimeFilterUI(options);
  filtersArea.appendChild(timeRow);

  const chipsContainer = el('div', { classes: ['category-chips-container'] });
  categories.forEach(cat => {
    const isTodos = cat === 'TODOS';
    const isSelected = isTodos ? selectedCategories.length === 0 : selectedCategories.includes(cat);
    const chip = el('button', { classes: ['category-chip', isSelected ? 'active' : 'inactive'], text: cat });
    chip.onclick = () => onCategoryToggle(cat);
    chipsContainer.appendChild(chip);
  });
  filtersArea.appendChild(chipsContainer);
  
  wrapper.appendChild(header);
  wrapper.appendChild(filtersArea);

  if (data.length === 0) {
    const emptyMsg = el('div', { classes: ['alert', 'info'], text: 'No hay datos suficientes para generar el dashboard.' });
    emptyMsg.style.marginTop = '2rem';
    wrapper.appendChild(emptyMsg);
    container.appendChild(wrapper);
    return;
  }

  // 1. Data Aggregation for Charts
  const trendsMap = {};
  data.forEach(t => {
    const date = t.date || 'Sin Fecha';
    if (!trendsMap[date]) trendsMap[date] = { totalPrice: 0, totalYield: 0, count: 0 };
    const buy = t.buy || {};
    const price = includeCommission ? (buy.avgPriceWithCommission || 0) : (buy.avgPrice || 0);
    const yieldVal = (buy.generalYield || 0) * 100;
    
    trendsMap[date].totalPrice += price;
    trendsMap[date].totalYield += yieldVal;
    trendsMap[date].count++;
  });
  const sortedDates = Object.keys(trendsMap).sort((a,b) => new Date(a) - new Date(b));
  
  const entityMap = {};
  data.forEach(t => {
    const buy = t.buy || {};
    const price = includeCommission ? (buy.avgPriceWithCommission || 0) : (buy.avgPrice || 0);
    const yieldVal = (buy.generalYield || 0) * 100;
    
    const agentName = buy.agent?.name;
    if (agentName) {
      if (!entityMap[agentName]) entityMap[agentName] = { totalPrice: 0, totalYield: 0, yields: [], count: 0, type: 'AGENT' };
      entityMap[agentName].totalPrice += price;
      entityMap[agentName].totalYield += yieldVal;
      entityMap[agentName].yields.push(yieldVal);
      entityMap[agentName].count++;
    }
    
    (buy.listOfProducers || []).forEach(p => {
      const pName = p.producer?.name;
      if (pName) {
        if (!entityMap[pName]) entityMap[pName] = { totalPrice: 0, totalYield: 0, yields: [], count: 0, type: 'PRODUCER' };
        entityMap[pName].totalPrice += price;
        entityMap[pName].totalYield += yieldVal;
        entityMap[pName].yields.push(yieldVal);
        entityMap[pName].count++;
      }
    });
  });
  const entities = Object.keys(entityMap).sort();

  // 2. Chart Layout
  const chartGrid = el('div', { classes: ['chart-grid'] });
  const trendBox = el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>📈 Tendencias de Precio y Rendimiento</h3><div class="canvas-holder"><canvas id="trendChart"></canvas></div>' });
  const compareBox = el('div', { classes: ['chart-container', 'glass-card'], html: '<h3>👥 Comparativa Productores / Comisionistas</h3><div class="canvas-holder"><canvas id="compareChart"></canvas></div>' });
  
  chartGrid.appendChild(trendBox);
  chartGrid.appendChild(compareBox);
  wrapper.appendChild(chartGrid);

  // 2.5 Rankings De Rendimientos
  const renderRankingTable = (typeFilter, title) => {
    const list = Object.keys(entityMap)
      .filter(e => entityMap[e].type === typeFilter)
      .map(e => {
        const item = entityMap[e];
        const avg = item.totalYield / item.count;
        const max = Math.max(...item.yields);
        const min = Math.min(...item.yields);
        return { name: e, avg, max, min, count: item.count };
      })
      .sort((a,b) => b.avg - a.avg);

    if (list.length === 0) return '';

    return `
      <div class="ranking-card glass-card" style="padding: 1.5rem;">
        <h3 style="margin-top: 0; margin-bottom: 1rem;">🏆 ${title}</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border); text-align: left; color: var(--text-muted);">
                <th style="padding: 0.75rem 0.5rem;">Nombre</th>
                <th style="padding: 0.75rem 0.5rem; text-align: center;">Viajes</th>
                <th style="padding: 0.75rem 0.5rem; text-align: right; color: var(--success);">Max (%)</th>
                <th style="padding: 0.75rem 0.5rem; text-align: right; color: var(--danger);">Min (%)</th>
                <th style="padding: 0.75rem 0.5rem; text-align: right; font-weight: 700; color: var(--text-main);">Promedio (%)</th>
              </tr>
            </thead>
            <tbody>
              ${list.map((r, i) => `
                <tr style="border-bottom: 1px solid var(--border); background: ${i === 0 ? 'rgba(16, 185, 129, 0.05)' : 'transparent'};">
                  <td style="padding: 0.75rem 0.5rem; font-weight: ${i === 0 ? '700' : '500'}; color: var(--text-main);">
                    ${i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}${r.name}
                  </td>
                  <td style="padding: 0.75rem 0.5rem; text-align: center; color: var(--text-muted);">${r.count}</td>
                  <td style="padding: 0.75rem 0.5rem; text-align: right; color: var(--success);">${r.max.toFixed(2)}%</td>
                  <td style="padding: 0.75rem 0.5rem; text-align: right; color: var(--danger);">${r.min.toFixed(2)}%</td>
                  <td style="padding: 0.75rem 0.5rem; text-align: right; font-weight: 700; color: var(--text-main);">${r.avg.toFixed(2)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  const rankingsHolder = el('div', { 
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;',
    html: renderRankingTable('AGENT', 'Ranking de Comisionistas') + renderRankingTable('PRODUCER', 'Ranking de Productores')
  });

  wrapper.appendChild(rankingsHolder);
  container.appendChild(wrapper);

  // 3. Render Charts with Chart.js
  if (chartInstances.trends) { chartInstances.trends.destroy(); chartInstances.trends = null; }
  if (chartInstances.compare) { chartInstances.compare.destroy(); chartInstances.compare = null; }

  const isDark = document.body.classList.contains('dark');
  const textColor = isDark ? '#ffffff' : '#71717a';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const primaryAccent = isDark ? '#e0e0e0' : '#841d1d'; // Keep maroon in light mode if needed, but silver in dark
  const silverAccent = '#a1a1aa';

  chartInstances.trends = new Chart(document.getElementById('trendChart'), {
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
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: borderColor } },
        y: { type: 'linear', display: true, position: 'left', ticks: { color: textColor, callback: (v) => '$' + v }, grid: { color: borderColor } },
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: textColor, callback: (v) => v + '%' } }
      }
    }
  });

  chartInstances.compare = new Chart(document.getElementById('compareChart'), {
    type: 'bar',
    data: {
      labels: entities,
      datasets: [
        {
          label: 'Precio Prom. ($)',
          data: entities.map(e => entityMap[e].totalPrice / entityMap[e].count),
          backgroundColor: entities.map(e => entityMap[e].type === 'AGENT' ? (isDark ? '#e0e0e0' : '#841d1d') : silverAccent),
          yAxisID: 'y'
        },
        {
          label: 'Rendimiento (%)',
          data: entities.map(e => entityMap[e].totalYield / entityMap[e].count),
          backgroundColor: '#10b981',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { labels: { color: textColor } },
        tooltip: { callbacks: { title: (items) => `${items[0].label} (${entityMap[items[0].label].type === 'AGENT' ? 'Comisionista' : 'Productor'})` } }
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: borderColor } },
        y: { type: 'linear', display: true, position: 'left', ticks: { color: textColor, callback: (v) => '$' + v }, grid: { color: borderColor } },
        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: textColor, callback: (v) => v + '%' } }
      }
    }
  });
}
