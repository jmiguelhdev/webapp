/**
 * @file FuelEfficiencyUI.js
 * @description Pantalla premium para el control y análisis del rendimiento de combustible por camión.
 * Visualiza la eficiencia histórica en kilómetros por litro (Km/L) mediante gráficos y métricas consolidadas.
 * @module ui/screens/FuelEfficiencyUI
 * @author Antigravity
 */

import Chart from 'chart.js/auto';
import { el } from '../../utils/dom.js';
import { GetFuelEfficiencyReport } from '../../domain/usecases/GetFuelEfficiencyReport.js';

/**
 * Instancia activa del gráfico de rendimiento.
 * Se guarda de forma local para destruirla limpiamente antes de volver a dibujar.
 * @type {Chart|null}
 */
let fuelChartInstance = null;

/**
 * Renderiza una tarjeta de métrica KPI premium.
 * @param {string} label - Etiqueta de la tarjeta.
 * @param {string} value - Valor principal a mostrar.
 * @param {string} icon - Emoji o ícono.
 * @param {string} [bgStyle=''] - Estilo CSS adicional para el fondo.
 * @returns {string} Fragmento de código HTML de la tarjeta.
 */
function renderKpiCard(label, value, icon, bgStyle = '') {
  return `
    <div class="stat-card" style="background: ${bgStyle || 'rgba(255,255,255,0.03)'}; border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
      <div class="stat-icon" style="font-size: 2rem; opacity: 0.85;">${icon}</div>
      <div class="stat-info">
        <p style="margin: 0; color: var(--text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${label}</p>
        <h3 style="margin: 0.25rem 0 0 0; font-size: 1.5rem; font-weight: 700;">${value}</h3>
      </div>
    </div>
  `;
}

/**
 * Renderiza la pantalla de control de eficiencia de combustible.
 * @param {Object} presenter - Presentador de logística.
 * @param {Array<Object>} travels - Listado de viajes del sistema.
 * @param {Array<Object>} trucks - Listado de camiones registrados.
 */
export function renderFuelEfficiency(presenter, travels, trucks) {
  const container = document.getElementById('content');
  if (!container) return;

  const trucksOpts = trucks.map(t => `<option value="${t.id}">${t.name} (${t.licensePlate})</option>`).join('');

  container.innerHTML = `
    <div class="dashboard-header" style="margin-bottom: 2rem;">
      <h2>Control de Rendimiento de Combustible</h2>
      <p style="color: var(--text-muted); margin: 0.25rem 0 0 0;">Análisis del consumo en surtidor y detección de anomalías de consumo.</p>
    </div>

    <div class="glass-card" style="padding: 1.5rem; margin-bottom: 2rem; border-radius: 16px;">
      <form id="fuel-filter-form" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
        <div class="form-group" style="margin: 0; flex: 1; min-width: 250px;">
          <label style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main);">Camión de la Flota</label>
          <select id="f-truck" required style="width: 100%; border-radius: 12px;">
            <option value="">-- Seleccionar Camión --</option>
            ${trucksOpts}
          </select>
        </div>
        <button type="submit" class="btn-primary" style="padding: 0.85rem 2rem; border-radius: 12px; font-weight: 700; height: 48px; display: flex; align-items: center; gap: 0.5rem;">
          🔍 Analizar Eficiencia
        </button>
      </form>
    </div>

    <div id="fuel-results" style="display: none; animation: fadeIn 0.4s ease-out;">
      <!-- KPI GRID -->
      <div id="fuel-kpis-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;"></div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem; align-items: start;" class="responsive-grid-1">
        <!-- CHART -->
        <div class="glass-card" style="padding: 1.5rem; border-radius: 16px; min-height: 320px;">
          <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">📈 Historial de Consumo <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">(Km/L)</span></h3>
          <div style="position: relative; height: 260px;">
            <canvas id="fuelChart"></canvas>
          </div>
        </div>

        <!-- SIMULATION OR INSIGHTS -->
        <div class="glass-card" style="padding: 1.5rem; border-radius: 16px; height: 100%; min-height: 320px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h3 style="margin-top: 0; margin-bottom: 1.25rem; font-size: 1.1rem; color: var(--text-main);">💡 Insights de Flota</h3>
            <div id="fuel-insights-content" style="font-size: 0.9rem; line-height: 1.5; color: var(--text-muted);">
              <!-- Contenido dinámico -->
            </div>
          </div>
          <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 1rem; margin-top: 1rem; display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.5rem;">🔋</span>
            <div style="font-size: 0.8rem; color: var(--success); font-weight: 500;">El mantenimiento preventivo periódico de inyectores puede ahorrar hasta un 8% de gasoil.</div>
          </div>
        </div>
      </div>

      <!-- DETAILS TABLE -->
      <div class="glass-card" style="padding: 1.5rem; border-radius: 16px; overflow: hidden;">
        <h3 style="margin-top: 0; margin-bottom: 1.25rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">📋 Registro Detallado de Cargas</h3>
        <div class="table-responsive">
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: rgba(255,255,255,0.02); text-align: left; border-bottom: 1px solid var(--border);">
                <th style="padding: 1rem;">Fecha</th>
                <th style="padding: 1rem;">Viaje / Destino</th>
                <th style="padding: 1rem; text-align: right;">Km Surtidor</th>
                <th style="padding: 1rem; text-align: right;">Litros Cargados</th>
                <th style="padding: 1rem; text-align: right;">Km Recorridos</th>
                <th style="padding: 1rem; text-align: right;">Rendimiento</th>
                <th style="padding: 1rem; text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody id="fuel-table-body">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('fuel-filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const truckId = document.getElementById('f-truck').value;
    
    // Ejecutar el caso de uso del dominio de forma pura
    const reportUseCase = new GetFuelEfficiencyReport();
    const report = reportUseCase.execute(travels, truckId);

    const tableBody = document.getElementById('fuel-table-body');
    tableBody.innerHTML = '';

    const alertsCount = report.records.filter(r => r.status === 'LOW' || r.status === 'ANOMALY').length;
    const totalKmTracked = report.records.reduce((sum, r) => sum + r.kmDiff, 0);
    const totalLitersTracked = report.records.reduce((sum, r) => sum + r.litersOnPump, 0);

    // Pintar KPIs con diseño premium
    const kpisGrid = document.getElementById('fuel-kpis-grid');
    kpisGrid.innerHTML = `
      ${renderKpiCard('Eficiencia Promedio', `${report.averageEfficiency.toFixed(2)} Km/L`, '⛽', 'rgba(16, 185, 129, 0.04)')}
      ${renderKpiCard('Kms Totales Controlados', `${totalKmTracked.toLocaleString()} km`, '🛣️')}
      ${renderKpiCard('Combustible Cargado', `${totalLitersTracked.toLocaleString()} L`, '🛢️')}
      ${renderKpiCard('Alertas de Consumo / Datos', `${alertsCount}`, '⚠️', alertsCount > 0 ? 'rgba(239, 68, 68, 0.04)' : '')}
    `;

    // Pintar Tabla con badges de colores premium
    if (report.records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted);">No hay registros de combustible para este camión.</td></tr>`;
    } else {
      report.records.forEach(r => {
        const efficiencyStr = r.efficiency > 0 ? `${r.efficiency.toFixed(2)} Km/L` : '-';
        let statusHtml = '-';
        let effColor = 'var(--text-main)';

        if (r.efficiency > 0) {
          if (r.status === 'NORMAL') {
            statusHtml = `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem;">Normal</span>`;
          } else if (r.status === 'LOW') {
            statusHtml = `<span class="badge" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem; cursor: help;" title="${r.alertMessage}">Consumo Alto</span>`;
            effColor = '#f59e0b';
          } else if (r.status === 'ANOMALY') {
            statusHtml = `<span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.25rem 0.75rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem; cursor: help;" title="${r.alertMessage}">Registro / Cálculo</span>`;
            effColor = '#ef4444';
          }
        }

        tableBody.innerHTML += `
          <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;">
            <td style="padding: 1rem; font-weight: 500;">${r.date}</td>
            <td style="padding: 1rem; color: var(--text-muted); font-size: 0.85rem;">${r.description}</td>
            <td style="padding: 1rem; text-align: right; font-weight: 600;">${r.kmOnPump.toLocaleString()}</td>
            <td style="padding: 1rem; text-align: right; color: var(--text-muted);">${r.litersOnPump.toLocaleString()} L</td>
            <td style="padding: 1rem; text-align: right; color: var(--primary); font-weight: 600;">${r.kmDiff > 0 ? `${r.kmDiff.toLocaleString()} km` : '-'}</td>
            <td style="padding: 1rem; text-align: right; font-weight: 700; color: ${effColor};">${efficiencyStr}</td>
            <td style="padding: 1rem; text-align: center;">${statusHtml}</td>
          </tr>
        `;
      });
    }

    // Pintar Insights
    const insightsContent = document.getElementById('fuel-insights-content');
    if (report.records.length <= 1) {
      insightsContent.innerHTML = `<p>Se requieren al menos dos registros con carga de combustible completa para calcular estadísticas e insights predictivos.</p>`;
    } else {
      let insightText = '';
      if (report.averageEfficiency >= 2.5 && report.averageEfficiency <= 3.5) {
        insightText = `<p>🟢 El rendimiento promedio de <strong>${report.averageEfficiency} Km/L</strong> está dentro del rango óptimo y normal establecido de <strong>2.5 a 3.5 Km/L</strong>.</p>`;
      } else if (report.averageEfficiency < 2.5) {
        insightText = `<p>🟡 El rendimiento promedio general de <strong>${report.averageEfficiency} Km/L</strong> se encuentra por debajo de la media normal. Se sugiere auditoría de inyectores o control de peso de carga.</p>`;
      } else {
        insightText = `<p>🔴 Alerta de inconsistencia: El promedio calculado de <strong>${report.averageEfficiency} Km/L</strong> está por encima del rango normal. Esto sugiere un registro erróneo o falta de una carga previa en el historial.</p>`;
      }

      if (alertsCount > 0) {
        insightText += `<p>⚠️ Se detectaron <strong>${alertsCount}</strong> cargas fuera del rango normal (2.5 - 3.5 Km/L), marcadas como consumo elevado o registros/cálculos anómalos.</p>`;
      } else {
        insightText += `<p>✅ Historial de rendimiento sumamente estable y 100% dentro del rango normal.</p>`;
      }
      insightsContent.innerHTML = insightText;
    }

    document.getElementById('fuel-results').style.display = 'block';

    // Renderizado del Gráfico con paleta premium a juego con el tema oscuro
    const canvas = document.getElementById('fuelChart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (fuelChartInstance) fuelChartInstance.destroy();

      const isDark = document.body.classList.contains('dark');
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
      const labelColor = isDark ? '#ffffff' : '#71717a';

      // Filtrar colores por punto de gráfico (solo normales se grafican)
      const pointColors = report.records
        .filter(r => r.hasReference && r.status === 'NORMAL')
        .map(() => '#10b981');

      fuelChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: report.labels,
          datasets: [
            {
              label: 'Rendimiento (Km/L)',
              data: report.efficiencyData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.04)',
              borderWidth: 3,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: pointColors,
              pointBorderColor: isDark ? '#18181b' : '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7
            },
            {
              label: 'Límite Mín (2.5)',
              data: Array(report.labels.length).fill(2.5),
              borderColor: 'rgba(245, 158, 11, 0.5)',
              borderWidth: 1.5,
              borderDash: [6, 4],
              fill: false,
              pointRadius: 0,
              pointHoverRadius: 0
            },
            {
              label: 'Límite Máx (3.5)',
              data: Array(report.labels.length).fill(3.5),
              borderColor: 'rgba(239, 68, 68, 0.5)',
              borderWidth: 1.5,
              borderDash: [6, 4],
              fill: false,
              pointRadius: 0,
              pointHoverRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: { color: labelColor, font: { size: 10 } }
            },
            title: {
              display: true,
              text: `Rendimiento Histórico vs Umbrales Normativos (2.5 - 3.5 Km/L)`,
              color: labelColor,
              font: { size: 13, weight: 'bold' }
            }
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: { color: labelColor, font: { size: 10 } }
            },
            y: {
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: { color: labelColor, font: { size: 10 } }
            }
          }
        }
      });
    }
  });
}
