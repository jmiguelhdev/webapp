// src/ui/screens/TravelManagementUI.js

export function renderTravelManagement(presenter, travels, dependencies = {}) {
  const container = document.getElementById('content');
  
  // Basic filtering by status could be added here
  const activeTravels = travels; // .filter(t => t.status === 'ACTIVE' || t.status === 'COMPLETED');

  container.innerHTML = `
    <div class="dashboard-header">
      <h2>Carga de Viajes (Logística)</h2>
      <button id="btn-add-travel" class="btn-primary">+ Nuevo Viaje</button>
    </div>
    <div class="glass-card" style="padding: 1.5rem; overflow-x: auto;">
      <table class="data-table" id="travels-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Camión</th>
            <th>Distancia</th>
            <th>Costo Chofer</th>
            <th>Gastos</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${activeTravels.map(t => `
            <tr>
              <td>${t.date}</td>
              <td>${t.description || '-'}</td>
              <td>${t.truck ? t.truck.name : '-'}</td>
              <td>${t.distanceKm} km</td>
              <td>$${(t.driverCost || 0).toLocaleString()}</td>
              <td>$${(t.expenses || []).reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()}</td>
              <td><span class="badge status-${t.status.toLowerCase()}">${t.status}</span></td>
              <td class="actions">
                <button class="btn-edit" data-id="${t.id}">✏️</button>
                <button class="btn-delete" data-id="${t.id}">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div id="travel-modal-container"></div>
  `;

  document.getElementById('btn-add-travel').addEventListener('click', () => {
    showTravelModal(presenter, null, dependencies);
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const travel = travels.find(t => String(t.id) === String(id));
      if (travel) showTravelModal(presenter, travel, dependencies);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('¿Eliminar este viaje?')) {
        presenter.deleteTravel(id);
      }
    });
  });
}

function showTravelModal(presenter, travel, dependencies) {
  const container = document.getElementById('travel-modal-container');
  const isEdit = !!travel;
  const trucks = dependencies.trucks || [];

  // Local state for expenses since it's an array
  let localExpenses = travel ? [...(travel.expenses || [])] : [];

  const renderModal = () => {
    const trucksOpts = trucks.map(t => `<option value="${t.id}" ${travel?.truck?.id == t.id ? 'selected' : ''}>${t.name}</option>`).join('');
    
    // Calc helpers based on current values
    let kmO = Number(travel?.kmOnOrigin || 0);
    let kmD = Number(travel?.kmOnDestination || 0);
    let dist = Math.max(0, kmD - kmO);

    container.innerHTML = `
      <div class="modal active" id="travel-modal">
        <div class="modal-content glass-card" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <h3>${isEdit ? 'Editar Viaje' : 'Nuevo Viaje'}</h3>
          <form id="travel-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label>Fecha</label>
                <input type="date" id="t-date" value="${travel?.date || new Date().toISOString().split('T')[0]}" required>
              </div>
              <div class="form-group">
                <label>Estado</label>
                <select id="t-status">
                  <option value="DRAFT" ${travel?.status === 'DRAFT' ? 'selected' : ''}>Borrador</option>
                  <option value="ACTIVE" ${travel?.status === 'ACTIVE' || !travel ? 'selected' : ''}>Activo</option>
                  <option value="COMPLETED" ${travel?.status === 'COMPLETED' ? 'selected' : ''}>Completado</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Descripción</label>
              <input type="text" id="t-desc" value="${travel?.description || ''}">
            </div>

            <div class="form-group">
              <label>Camión Asignado</label>
              <select id="t-truck" required><option value="">-- Seleccionar --</option>${trucksOpts}</select>
            </div>

            <fieldset style="border: 1px solid var(--border); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
              <legend>Odómetro</legend>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label>Km Origen</label>
                  <input type="number" id="t-km-o" step="0.1" value="${kmO}" required>
                </div>
                <div class="form-group">
                  <label>Km Destino</label>
                  <input type="number" id="t-km-d" step="0.1" value="${kmD}" required>
                </div>
              </div>
              <div style="margin-top: 0.5rem; font-size: 0.9em; color: var(--primary);">
                Distancia Calculada: <strong id="t-dist">${dist} km</strong>
              </div>
            </fieldset>

            <fieldset style="border: 1px solid var(--border); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
              <legend>Carga de Combustible</legend>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label>Km en Surtidor</label>
                  <input type="number" id="t-km-p" step="0.1" value="${travel?.kmOnPump || 0}">
                </div>
                <div class="form-group">
                  <label>Litros Cargados</label>
                  <input type="number" id="t-liters" step="0.1" value="${travel?.litersOnPump || 0}">
                </div>
              </div>
            </fieldset>

            <fieldset style="border: 1px solid var(--border); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
              <legend>Gastos Adicionales</legend>
              <table style="width: 100%; font-size: 0.9em; margin-bottom: 0.5rem;">
                ${localExpenses.map((e, index) => `
                  <tr>
                    <td>${e.description}</td>
                    <td>$${e.amount}</td>
                    <td>${e.isReimbursable ? '♻️ A Devolver' : ''}</td>
                    <td><button type="button" class="btn-delete-exp" data-idx="${index}">X</button></td>
                  </tr>
                `).join('')}
              </table>
              <div style="display: flex; gap: 0.5rem; align-items: flex-end;">
                <div class="form-group" style="flex: 2; margin: 0;"><input type="text" id="e-desc" placeholder="Descripción"></div>
                <div class="form-group" style="flex: 1; margin: 0;"><input type="number" id="e-amount" placeholder="Monto"></div>
                <label style="display:flex; align-items:center; gap:0.25rem;"><input type="checkbox" id="e-reimb" checked> Reembolsable</label>
                <button type="button" id="btn-add-exp" class="btn-secondary" style="padding: 0.5rem;">Añadir</button>
              </div>
            </fieldset>

            <div class="modal-actions" style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
              <button type="button" class="btn-secondary" id="btn-cancel-modal">Cancelar</button>
              <button type="submit" class="btn-primary">Guardar Viaje</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('btn-cancel-modal').addEventListener('click', () => { container.innerHTML = ''; });
    
    // Auto-update distance calculation visual
    const updateDist = () => {
      const o = Number(document.getElementById('t-km-o').value || 0);
      const d = Number(document.getElementById('t-km-d').value || 0);
      document.getElementById('t-dist').textContent = Math.max(0, d - o) + ' km';
    };
    document.getElementById('t-km-o').addEventListener('input', updateDist);
    document.getElementById('t-km-d').addEventListener('input', updateDist);

    // Add Expense
    document.getElementById('btn-add-exp').addEventListener('click', () => {
      const desc = document.getElementById('e-desc').value;
      const amt = Number(document.getElementById('e-amount').value);
      const isR = document.getElementById('e-reimb').checked;
      if (desc && amt > 0) {
        localExpenses.push({
          id: Date.now(),
          travelId: travel?.id || 0,
          description: desc,
          amount: amt,
          category: 'OTROS',
          date: document.getElementById('t-date').value,
          isReimbursable: isR
        });
        // Re-render modal to show new expense
        updateFormValuesToTemp();
        renderModal();
      }
    });

    // Delete Expense
    document.querySelectorAll('.btn-delete-exp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.dataset.idx;
        localExpenses.splice(idx, 1);
        updateFormValuesToTemp();
        renderModal();
      });
    });

    document.getElementById('travel-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const selectedTruckId = document.getElementById('t-truck').value;
      const selectedTruck = trucks.find(t => String(t.id) === selectedTruckId);

      const payload = {
        id: travel ? travel.id : Date.now(),
        date: document.getElementById('t-date').value,
        status: document.getElementById('t-status').value,
        description: document.getElementById('t-desc').value,
        truck: selectedTruck || null,
        kmOnOrigin: Number(document.getElementById('t-km-o').value),
        kmOnDestination: Number(document.getElementById('t-km-d').value),
        kmOnPump: Number(document.getElementById('t-km-p').value),
        litersOnPump: Number(document.getElementById('t-liters').value),
        expenses: localExpenses,
        // preserve original prices if editing, else they will be auto-filled by presenter
        driverPricePerKmSimple: travel?.driverPricePerKmSimple || 0,
        driverPricePerKmDouble: travel?.driverPricePerKmDouble || 0,
        fuelPrice: travel?.fuelPrice || 0,
        pricePerKm: travel?.pricePerKm || 0,
        buy: travel?.buy || null,
        kgFaenaTotal: travel?.kgFaenaTotal || 0,
        updatedAt: Date.now()
      };

      container.innerHTML = '';
      presenter.saveTravel(payload);
    });
  };

  // Helper to preserve user inputs during re-renders
  const updateFormValuesToTemp = () => {
    if(!travel) travel = {};
    travel.date = document.getElementById('t-date')?.value || travel.date;
    travel.status = document.getElementById('t-status')?.value || travel.status;
    travel.description = document.getElementById('t-desc')?.value || travel.description;
    const tId = document.getElementById('t-truck')?.value;
    travel.truck = trucks.find(t => String(t.id) === tId) || travel.truck;
    travel.kmOnOrigin = document.getElementById('t-km-o')?.value || travel.kmOnOrigin;
    travel.kmOnDestination = document.getElementById('t-km-d')?.value || travel.kmOnDestination;
    travel.kmOnPump = document.getElementById('t-km-p')?.value || travel.kmOnPump;
    travel.litersOnPump = document.getElementById('t-liters')?.value || travel.litersOnPump;
  };

  renderModal();
}
