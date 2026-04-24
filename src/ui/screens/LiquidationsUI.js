// src/ui/screens/LiquidationsUI.js

export function renderLiquidations(presenter, travels, drivers) {
  const container = document.getElementById('content');
  
  // Helper to get current week's Sunday and Saturday
  const curr = new Date();
  const first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
  const last = first + 6; 
  
  const sunday = new Date(curr.setDate(first)).toISOString().split('T')[0];
  const saturday = new Date(curr.setDate(last)).toISOString().split('T')[0];

  const driversOpts = drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

  container.innerHTML = `
    <div class="dashboard-header">
      <h2>Liquidación de Choferes</h2>
      <button id="btn-print-liq" class="btn-secondary" style="display:none;">🖨️ Imprimir</button>
    </div>

    <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
      <form id="filter-form" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
        <div class="form-group" style="margin: 0; flex: 1; min-width: 200px;">
          <label>Chofer</label>
          <select id="f-driver" required>
            <option value="">-- Seleccionar Chofer --</option>
            ${driversOpts}
          </select>
        </div>
        <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
          <label>Desde (Domingo)</label>
          <input type="date" id="f-start" value="${sunday}" required>
        </div>
        <div class="form-group" style="margin: 0; flex: 1; min-width: 150px;">
          <label>Hasta (Sábado)</label>
          <input type="date" id="f-end" value="${saturday}" required>
        </div>
        <button type="submit" class="btn-primary" style="padding: 0.75rem 1.5rem;">Calcular</button>
      </form>
    </div>

    <div id="liquidation-results">
      <!-- Results rendered here -->
      <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
        Selecciona un chofer y presiona Calcular para ver la liquidación.
      </div>
    </div>
  `;

  document.getElementById('filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const driverId = document.getElementById('f-driver').value;
    const start = document.getElementById('f-start').value;
    const end = document.getElementById('f-end').value;

    const filteredTravels = travels.filter(t => {
      if (!t.truck || !t.truck.driver || String(t.truck.driver.id) !== driverId) return false;
      if (t.status === 'DRAFT') return false; // Ignore drafts
      return t.date >= start && t.date <= end;
    });

    renderResults(filteredTravels, driverId, drivers.find(d => String(d.id) === driverId));
  });

  function renderResults(filteredTravels, driverId, driver) {
    const resContainer = document.getElementById('liquidation-results');
    document.getElementById('btn-print-liq').style.display = 'block';

    if (filteredTravels.length === 0) {
      resContainer.innerHTML = `<div class="alert">No se encontraron viajes activos/completados para el chofer seleccionado en estas fechas.</div>`;
      return;
    }

    let totalDriverCost = 0;
    let totalExpenses = 0;

    const tableRows = filteredTravels.map(t => {
      const travelCost = t.driverCost || 0;
      totalDriverCost += travelCost;

      const reimbursableExpenses = (t.expenses || []).filter(e => e.isReimbursable);
      const expTotal = reimbursableExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      totalExpenses += expTotal;

      const expList = reimbursableExpenses.map(e => `<div><small>${e.description}: $${e.amount}</small></div>`).join('');

      return `
        <tr>
          <td>${t.date}</td>
          <td>${t.description || '-'}</td>
          <td>${t.truck?.trailer?.type || '-'}</td>
          <td>${t.distanceKm} km</td>
          <td>$${travelCost.toLocaleString()}</td>
          <td>${expTotal > 0 ? `$${expTotal.toLocaleString()} ${expList}` : '-'}</td>
        </tr>
      `;
    }).join('');

    const grandTotal = totalDriverCost + totalExpenses;

    resContainer.innerHTML = `
      <div class="glass-card" style="padding: 1.5rem;" id="print-area">
        <h3 style="margin-top:0;">Resumen Semanal: ${driver?.name}</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
          Periodo: ${document.getElementById('f-start').value} al ${document.getElementById('f-end').value}
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div style="background: var(--surface); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
            <div style="font-size: 0.85em; color: var(--text-muted); text-transform: uppercase;">Viajes</div>
            <div style="font-size: 1.5em; font-weight: 600; color: var(--primary);">$${totalDriverCost.toLocaleString()}</div>
          </div>
          <div style="background: var(--surface); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
            <div style="font-size: 0.85em; color: var(--text-muted); text-transform: uppercase;">Reembolsos</div>
            <div style="font-size: 1.5em; font-weight: 600; color: var(--warning);">$${totalExpenses.toLocaleString()}</div>
          </div>
          <div style="background: var(--primary); padding: 1rem; border-radius: 8px; color: white;">
            <div style="font-size: 0.85em; opacity: 0.9; text-transform: uppercase;">Total a Pagar</div>
            <div style="font-size: 1.5em; font-weight: 600;">$${grandTotal.toLocaleString()}</div>
          </div>
        </div>

        <h4>Detalle de Viajes</h4>
        <table class="data-table" style="margin-top: 1rem;">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Jaula</th>
              <th>Distancia</th>
              <th>Honorarios</th>
              <th>Gastos a Devolver</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-print-liq').onclick = () => {
      const originalContents = document.body.innerHTML;
      const printContents = document.getElementById('print-area').innerHTML;
      document.body.innerHTML = `
        <div style="padding: 2rem; font-family: sans-serif; color: black; background: white;">
          <h2 style="text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 1rem;">Liquidación de Viajes KMP</h2>
          ${printContents}
        </div>
      `;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Reload to restore events
    };
  }
}
