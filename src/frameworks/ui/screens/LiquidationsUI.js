/**
 * @file LiquidationsUI.js
 * @description Pantalla para la liquidación semanal de choferes. Calcula honorarios por distancia recorrida
 * y consolida gastos a reembolsar en un reporte premium con impresión nativa limpia.
 * @module ui/screens/LiquidationsUI
 * @author Antigravity
 */

import { el } from '../../../utils/dom.js';
import { GetDriverLiquidation } from '../../../domain/usecases/GetDriverLiquidation.js';

/**
 * Renderiza la interfaz principal del módulo de liquidación de choferes.
 * @param {Object} presenter - Presentador de control.
 * @param {Array<Object>} travels - Todos los viajes activos en el sistema.
 * @param {Array<Object>} drivers - Lista de choferes registrados para los filtros.
 */
export function renderLiquidations(presenter, travels, drivers) {
  const container = document.getElementById('content');
  if (!container) return;
  
  // Cálculo inteligente de fechas para la semana actual (Domingo a Sábado)
  const curr = new Date();
  const firstDayOffset = curr.getDate() - curr.getDay();
  const lastDayOffset = firstDayOffset + 6; 
  
  const sunday = new Date(new Date(curr).setDate(firstDayOffset)).toISOString().split('T')[0];
  const saturday = new Date(new Date(curr).setDate(lastDayOffset)).toISOString().split('T')[0];

  const driversOpts = drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

  container.innerHTML = `
    <div class="dashboard-header" style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>Liquidación de Choferes</h2>
        <p style="color: var(--text-muted); margin: 0.25rem 0 0 0;">Liquidación semanal de honorarios y reembolsos de gastos de viaje.</p>
      </div>
      <button id="btn-print-liq" class="btn-secondary" style="display:none; padding: 0.85rem 1.75rem; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; height: 48px;">
        🖨️ Imprimir Liquidación
      </button>
    </div>

    <div class="glass-card" style="padding: 1.5rem; margin-bottom: 2rem; border-radius: 16px;">
      <form id="filter-form" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
        <div class="form-group" style="margin: 0; flex: 2; min-width: 220px;">
          <label style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main);">Seleccionar Chofer</label>
          <select id="f-driver" required style="width:100%; border-radius: 12px;">
            <option value="">-- Seleccionar Chofer --</option>
            ${driversOpts}
          </select>
        </div>
        <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
          <label style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main);">Desde (Domingo)</label>
          <input type="date" id="f-start" value="${sunday}" required style="width:100%; border-radius: 12px;">
        </div>
        <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
          <label style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main);">Hasta (Sábado)</label>
          <input type="date" id="f-end" value="${saturday}" required style="width:100%; border-radius: 12px;">
        </div>
        <button type="submit" class="btn-primary" style="padding: 0.85rem 2rem; border-radius: 12px; font-weight: 700; height: 48px;">
          🚀 Calcular
        </button>
      </form>
    </div>

    <div id="liquidation-results" style="animation: fadeIn 0.4s ease-out;">
      <div style="text-align: center; color: var(--text-muted); padding: 3rem; background: rgba(255,255,255,0.01); border-radius: 16px; border: 1px dashed var(--border);">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 1rem; opacity: 0.7;">📋</span>
        Seleccioná un chofer y presioná Calcular para ver el desglose semanal.
      </div>
    </div>
  `;

  document.getElementById('filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const driverId = document.getElementById('f-driver').value;
    const start = document.getElementById('f-start').value;
    const end = document.getElementById('f-end').value;

    // Instanciar y ejecutar el caso de uso del dominio de forma pura
    const useCase = new GetDriverLiquidation();
    const result = useCase.execute(travels, driverId, start, end);

    renderResults(result, driverId, drivers.find(d => String(d.id) === driverId));
  });

  /**
   * Renderiza el reporte de resultados consolidados en la pantalla.
   * @param {Object} liquidation - Datos procesados por el caso de uso.
   * @param {string} driverId - ID del chofer liquidado.
   * @param {Object} driver - Datos del chofer seleccionado.
   */
  function renderResults(liquidation, driverId, driver) {
    const resContainer = document.getElementById('liquidation-results');
    const printBtn = document.getElementById('btn-print-liq');

    if (liquidation.travels.length === 0) {
      printBtn.style.display = 'none';
      resContainer.innerHTML = `
        <div class="alert" style="background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; border-radius: 12px; padding: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.25rem;">⚠️</span>
          No se encontraron viajes activos/completados para el chofer seleccionado en el período indicado.
        </div>`;
      return;
    }

    printBtn.style.display = 'flex';

    const tableRows = liquidation.travels.map(t => {
      const expList = t.reimbursableExpenses
        .map(e => `<div style="font-size: 0.75rem; color: var(--text-muted); padding-top: 0.25rem;">• ${e.description}: <strong>$${e.amount.toLocaleString()}</strong></div>`)
        .join('');

      return `
        <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;">
          <td style="padding: 1rem; font-weight: 500;">${t.date}</td>
          <td style="padding: 1rem;">${t.description}</td>
          <td style="padding: 1rem; font-size: 0.85rem;"><span style="background: rgba(99,102,241,0.1); color: #818cf8; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600;">${t.trailerType}</span></td>
          <td style="padding: 1rem; font-weight: 600; color: var(--primary);">${t.distanceKm} km</td>
          <td style="padding: 1rem; font-weight: 700; color: var(--text-main);">$${t.travelCost.toLocaleString()}</td>
          <td style="padding: 1rem;">
            ${t.expTotal > 0 ? `<span style="font-weight: 700; color: var(--success);">$${t.expTotal.toLocaleString()}</span>${expList}` : '-'}
          </td>
        </tr>
      `;
    }).join('');

    resContainer.innerHTML = `
      <div class="glass-card" style="padding: 2rem; border-radius: 16px;" id="print-area">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.4rem;">Resumen de Liquidación: ${driver?.name}</h3>
            <p style="color: var(--text-muted); margin: 0.25rem 0 0 0; font-size: 0.9rem;">
              Periodo Liquidado: <strong>${document.getElementById('f-start').value}</strong> al <strong>${document.getElementById('f-end').value}</strong>
            </p>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 8px;">
            CUIT Chofer: ${driver?.dni || 'N/A'}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;">
          <div style="background: rgba(255,255,255,0.02); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Honorarios de Viajes</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--primary); margin-top: 0.25rem;">$${liquidation.totalDriverCost.toLocaleString()}</div>
          </div>
          <div style="background: rgba(255,255,255,0.02); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Reembolsos de Gastos</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--success); margin-top: 0.25rem;">$${liquidation.totalExpenses.toLocaleString()}</div>
          </div>
          <div style="background: var(--primary-container); color: var(--on-primary-container); border: 1px solid var(--border); padding: 1.25rem; border-radius: 12px;">
            <div style="font-size: 0.75rem; opacity: 0.85; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Total Neto a Liquidar</div>
            <div style="font-size: 1.8rem; font-weight: 800; margin-top: 0.25rem;">$${liquidation.grandTotal.toLocaleString()}</div>
          </div>
        </div>

        <h4 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">📋 Detalle de Viajes Realizados</h4>
        <div class="table-responsive" style="border-radius: 12px; overflow: hidden; border: 1px solid var(--border);">
          <table class="data-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: rgba(255,255,255,0.02); text-align: left; border-bottom: 1px solid var(--border);">
                <th style="padding: 1rem;">Fecha</th>
                <th style="padding: 1rem;">Descripción</th>
                <th style="padding: 1rem;">Jaula</th>
                <th style="padding: 1rem;">Distancia</th>
                <th style="padding: 1rem;">Honorarios</th>
                <th style="padding: 1rem;">Gastos Reembolsables</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Impresión premium e inocua mediante apertura de una nueva pestaña/ventana independiente
    printBtn.onclick = () => {
      const printContents = document.getElementById('print-area').innerHTML;
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Liquidación de Viajes - ${driver?.name}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 3rem; color: #1f2937; }
              h3 { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #111827; }
              p { color: #4b5563; font-size: 0.95rem; margin: 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 2rem; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
              th { background: #f3f4f6; color: #374151; font-weight: 700; text-align: left; padding: 1rem; border-bottom: 2px solid #e5e7eb; font-size: 0.85rem; text-transform: uppercase; }
              td { padding: 1rem; border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; color: #374151; }
              .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 1.5rem; margin-bottom: 2.5rem; }
              .card { border: 1px solid #e5e7eb; padding: 1.25rem; border-radius: 12px; background: #fafafa; }
              .card-title { font-size: 0.75rem; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
              .card-val { font-size: 1.6rem; font-weight: 800; color: #111827; margin-top: 0.25rem; }
              .card-primary { background: #1e1b4b; color: #ffffff; border: none; }
              .card-primary .card-title { color: rgba(255,255,255,0.85); }
              .card-primary .card-val { color: #ffffff; }
              .badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.8rem; }
              .print-header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 1.5rem; margin-bottom: 2.5rem; }
              .print-header h2 { margin: 0; font-size: 1.8rem; color: #111827; }
              .print-header p { font-size: 0.9rem; color: #6b7280; margin-top: 0.25rem; }
              .signature-section { display: flex; justify-content: space-between; margin-top: 4rem; padding-top: 3rem; }
              .sig-line { width: 220px; border-top: 1px solid #9ca3af; text-align: center; padding-top: 0.5rem; font-size: 0.85rem; color: #4b5563; }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h2>Liquidación de Viajes KMP</h2>
              <p>Comprobante oficial de honorarios y reembolsos de chofer</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
              <div>
                <h3>Resumen de Liquidación: ${driver?.name}</h3>
                <p>Periodo Liquidado: <strong>${document.getElementById('f-start').value}</strong> al <strong>${document.getElementById('f-end').value}</strong></p>
              </div>
              <div style="font-size: 0.85rem; color: #4b5563; background: #fafafa; border: 1px solid #e5e7eb; padding: 0.5rem 1rem; border-radius: 8px;">
                CUIT Chofer: ${driver?.dni || 'N/A'}
              </div>
            </div>

            <div class="summary-grid">
              <div class="card">
                <div class="card-title">Honorarios de Viajes</div>
                <div class="card-val">$${liquidation.totalDriverCost.toLocaleString()}</div>
              </div>
              <div class="card">
                <div class="card-title">Reembolsos de Gastos</div>
                <div class="card-val">$${liquidation.totalExpenses.toLocaleString()}</div>
              </div>
              <div class="card card-primary">
                <div class="card-title">Total Neto a Liquidar</div>
                <div class="card-val">$${liquidation.grandTotal.toLocaleString()}</div>
              </div>
            </div>

            <h4 style="margin-top: 0; margin-bottom: 0.5rem; font-size: 1.1rem; color: #111827;">Detalle de Viajes Realizados</h4>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Jaula</th>
                  <th>Distancia</th>
                  <th>Honorarios</th>
                  <th>Gastos Reembolsables</th>
                </tr>
              </thead>
              <tbody>
                ${liquidation.travels.map(t => {
                  const printExpList = t.reimbursableExpenses
                    .map(e => `<div style="font-size: 0.75rem; color: #4b5563; padding-top: 0.25rem;">• ${e.description}: <strong>$${e.amount.toLocaleString()}</strong></div>`)
                    .join('');

                  return `
                    <tr>
                      <td style="font-weight: 500;">${t.date}</td>
                      <td>${t.description}</td>
                      <td><span class="badge">${t.trailerType}</span></td>
                      <td style="font-weight: 600; color: #4f46e5;">${t.distanceKm} km</td>
                      <td style="font-weight: 700; color: #111827;">$${t.travelCost.toLocaleString()}</td>
                      <td>
                        ${t.expTotal > 0 ? `<span style="font-weight: 700; color: #16a34a;">$${t.expTotal.toLocaleString()}</span>${printExpList}` : '-'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="signature-section">
              <div class="sig-line">Firma del Chofer</div>
              <div class="sig-line">Autorizado por Administración</div>
            </div>

            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };
  }
}
