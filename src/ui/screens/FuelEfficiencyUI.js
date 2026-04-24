// src/ui/screens/FuelEfficiencyUI.js
import Chart from 'chart.js/auto';

export function renderFuelEfficiency(presenter, travels, trucks) {
  const container = document.getElementById('content');

  const trucksOpts = trucks.map(t => `<option value="${t.id}">${t.name} (${t.licensePlate})</option>`).join('');

  container.innerHTML = `
    <div class="dashboard-header">
      <h2>Control de Rendimiento de Combustible</h2>
    </div>

    <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
      <form id="fuel-filter-form" style="display: flex; gap: 1rem; align-items: flex-end;">
        <div class="form-group" style="margin: 0; flex: 1;">
          <label>Camión</label>
          <select id="f-truck" required>
            <option value="">-- Seleccionar Camión --</option>
            ${trucksOpts}
          </select>
        </div>
        <button type="submit" class="btn-primary" style="padding: 0.75rem 1.5rem;">Analizar</button>
      </form>
    </div>

    <div id="fuel-results" style="display: none;">
      <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
        <canvas id="fuelChart" height="100"></canvas>
      </div>

      <div class="glass-card" style="padding: 1.5rem; overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Viaje / Destino</th>
              <th>Km Surtidor</th>
              <th>Litros Cargados</th>
              <th>Km Recorridos (Carga a Carga)</th>
              <th>Rendimiento (Km/L)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody id="fuel-table-body">
          </tbody>
        </table>
      </div>
    </div>
  `;

  let fuelChartInstance = null;

  document.getElementById('fuel-filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const truckId = document.getElementById('f-truck').value;
    
    // Filter travels that have fuel data for this truck
    const truckTravels = travels.filter(t => 
      t.truck && String(t.truck.id) === truckId && t.status !== 'DRAFT' && t.litersOnPump > 0
    );

    // Sort by kmOnPump ascending to compute efficiency properly
    truckTravels.sort((a, b) => a.kmOnPump - b.kmOnPump);

    const tableBody = document.getElementById('fuel-table-body');
    tableBody.innerHTML = '';

    const labels = [];
    const efficiencyData = [];
    let avgSum = 0;
    let count = 0;

    for (let i = 0; i < truckTravels.length; i++) {
      const current = truckTravels[i];
      const prev = i > 0 ? truckTravels[i - 1] : null;
      
      let kmDiff = 0;
      let efficiency = 0;

      if (prev) {
        kmDiff = current.kmOnPump - prev.kmOnPump;
        if (kmDiff > 0 && current.litersOnPump > 0) {
          efficiency = kmDiff / current.litersOnPump;
        }
      }

      // We only plot efficiency if we have a previous reference
      if (prev && efficiency > 0) {
        labels.push(current.date);
        efficiencyData.push(efficiency.toFixed(2));
        avgSum += efficiency;
        count++;
      }

      const efficiencyStr = efficiency > 0 ? efficiency.toFixed(2) : '-';
      const statusHtml = efficiency > 0 && efficiency < 2.0 
        ? `<span class="badge status-draft" style="background:#fef2f2; color:#ef4444;">Bajo</span>`
        : `<span class="badge status-completed">Normal</span>`;

      tableBody.innerHTML += `
        <tr>
          <td>${current.date}</td>
          <td>${current.description || '-'}</td>
          <td>${current.kmOnPump.toLocaleString()}</td>
          <td>${current.litersOnPump.toLocaleString()} L</td>
          <td>${kmDiff > 0 ? kmDiff.toLocaleString() : '-'}</td>
          <td>${efficiencyStr}</td>
          <td>${efficiency > 0 ? statusHtml : '-'}</td>
        </tr>
      `;
    }

    if (truckTravels.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No hay registros de combustible para este camión.</td></tr>`;
    }

    document.getElementById('fuel-results').style.display = 'block';

    // Plot
    const ctx = document.getElementById('fuelChart').getContext('2d');
    if (fuelChartInstance) fuelChartInstance.destroy();

    const avg = count > 0 ? (avgSum / count).toFixed(2) : 0;

    fuelChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Rendimiento (Km/L)',
          data: efficiencyData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `Rendimiento Promedio Histórico: ${avg} Km/L`
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  });
}
