import { el } from '../../../frameworks/utils/dom.js';
import { Buy } from '../../../domain/entities/Buy.js';
import { renderDateModal } from './Modals.js';

export function showTravelModal(travel, options) {
  const container = document.getElementById('travel-modal-container') || (() => {
    const div = el('div', { attrs: { id: 'travel-modal-container' } });
    document.body.appendChild(div);
    return div;
  })();
  
  const isEdit = !!travel;
  const trucks = options.trucks || [];
  const producers = options.producers || [];
  const agents = options.agents || [];

  // Active Tab index
  let activeTab = 0;

  // Form State
  let date = travel?.date || new Date().toISOString().split('T')[0];
  let rawStatus = travel?.status || 'DRAFT';
  let status = String(rawStatus).toUpperCase();
  if (status === 'BORRADOR') status = 'DRAFT';
  if (status === 'ACTIVO') status = 'ACTIVE';
  if (status === 'FINALIZADO') status = 'COMPLETED';

  let description = travel?.description || '';
  let selectedTruckId = travel?.truck?.id || '';
  let kmOnOrigin = Number(travel?.kmOnOrigin || 0);
  let kmOnDestination = Number(travel?.kmOnDestination || 0);
  let kmOnPump = Number(travel?.kmOnPump || 0);
  let litersOnPump = Number(travel?.litersOnPump || 0);
  let tropa = travel?.tropa || '';

  // Expenses State
  let expArray = travel?.expenses ? (Array.isArray(travel.expenses) ? travel.expenses : Object.values(travel.expenses)) : [];
  let localExpenses = [...expArray];

  // Buy Commercial State
  let localBuy;
  if (travel?.buy) {
    localBuy = {
      id: travel.buy.id || '',
      agent: travel.buy.agent ? { id: travel.buy.agent.id || '', name: travel.buy.agent.name || '', percent: Number(travel.buy.agent.percent) || 0 } : { name: '', percent: 0 },
      reduce: travel.buy.reduce || 0,
      totalReduce: travel.buy.totalReduce || travel.buy.reduce || 0,
      listOfProducers: (travel.buy.listOfProducers || []).map(p => ({
        producer: p.producer ? { id: p.producer.id || '', name: p.producer.name || '', cuit: p.producer.cuit || '', cbu: p.producer.cbu || '' } : { name: '', cuit: '', cbu: '' },
        origin: p.origin || '',
        manualIva: p.manualIva !== undefined ? p.manualIva : null,
        listOfProducts: (p.listOfProducts || []).map(pr => ({
          name: pr.name || '',
          kg: Number(pr.kg || 0),
          roughing: Number(pr.roughing || 0),
          price: Number(pr.price || 0),
          quantity: Number(pr.quantity || 0),
          kgFaena: Number(pr.kgFaena || 0),
          taxes: pr.taxes || { bill: { neto: 0, iva: 0, ganancias: 0 } }
        }))
      }))
    };
  } else {
    localBuy = {
      agent: { name: '', percent: 0 },
      reduce: 0,
      totalReduce: 0,
      listOfProducers: []
    };
  }
  localBuy.reduce = localBuy.totalReduce || localBuy.reduce || 0;
  localBuy.totalReduce = localBuy.reduce;


  const renderModal = () => {
    // Generate simulated/computed entities
    const currentTruck = trucks.find(t => String(t.id) === String(selectedTruckId));
    
    // We instantiate Buy class to get premium reactive calculations!
    const computedBuy = new Buy({
      agent: localBuy.agent,
      totalReduce: localBuy.totalReduce,
      reduce: localBuy.totalReduce,
      listOfProducers: localBuy.listOfProducers
    });

    const isDouble = currentTruck?.trailer?.type === 'DOUBLE';
    const dist = Math.max(0, kmOnDestination - kmOnOrigin);
    
    // Sim cost factors matching Android app properties
    const driverRate = isDouble
      ? (travel?.driverPricePerKmDouble || 45) // fallback default driver price
      : (travel?.driverPricePerKmSimple || 30);
    const driverCost = dist * driverRate;
    
    const fuelPrice = travel?.fuelPrice || 1100; // default fuel price
    const fuelCost = litersOnPump * fuelPrice;
    
    const freightRate = isDouble
      ? (travel?.simulationFreightPriceDouble || 900)
      : (travel?.simulationFreightPriceSimple || 650);
    const simulatedFreight = dist * freightRate;

    // Viaticos total
    const totalExpenses = localExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const trucksOpts = trucks.map(t => `<option value="${t.id}" ${String(selectedTruckId) === String(t.id) ? 'selected' : ''}>${t.name}</option>`).join('');
    const agentsOpts = `<option value="">-- Sin Agente / Comisión --</option>` + agents.map(a => `<option value="${a.id}" ${String(localBuy.agent?.id || localBuy.agent?.name) === String(a.id || a.name) ? 'selected' : ''}>${a.name} (${a.percent}%)</option>`).join('');
    const producersOpts = `<option value="" disabled selected>-- Agregar Productor --</option>` + producers.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    container.innerHTML = `
      <div class="modal-overlay" style="position: fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1.5rem; overflow-y: auto;">
        <div class="glass-card fade-in" id="travel-modal" style="max-width: 900px; width: 100%; max-height: calc(100vh - 3rem); overflow-y: auto; border-radius: 24px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 0; display: flex; flex-direction: column; margin: auto; box-sizing: border-box;">
          
          <!-- Header Bar -->
          <div style="padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.01); border-top-left-radius: 24px; border-top-right-radius: 24px;">
            <h3 style="margin: 0; color: var(--primary); font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 0.65rem;">
              <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" /></svg>
              ${isEdit ? 'Editar Viaje Operacional' : 'Nuevo Viaje Operacional'}
            </h3>
            <kmp-status-chip status="${status}"></kmp-status-chip>
          </div>

          <!-- Modern Compose-like Tab Bar -->
          <div style="display: flex; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.01); user-select: none;">
            <button type="button" class="tab-item-m3 ${activeTab === 0 ? 'active' : ''}" data-tab="0" style="flex: 1; padding: 1.15rem 1rem; font-weight: 700; font-size: 0.85rem; border: none; background: transparent; color: ${activeTab === 0 ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${activeTab === 0 ? '3px solid var(--primary)' : '3px solid transparent'}; cursor: pointer; transition: all 0.2s ease;">
              🚚 Logística
            </button>
            <button type="button" class="tab-item-m3 ${activeTab === 1 ? 'active' : ''}" data-tab="1" style="flex: 1; padding: 1.15rem 1rem; font-weight: 700; font-size: 0.85rem; border: none; background: transparent; color: ${activeTab === 1 ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${activeTab === 1 ? '3px solid var(--primary)' : '3px solid transparent'}; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
              🥩 Cargas (${computedBuy.listOfProducers.length})
            </button>
            <button type="button" class="tab-item-m3 ${activeTab === 2 ? 'active' : ''}" data-tab="2" style="flex: 1; padding: 1.15rem 1rem; font-weight: 700; font-size: 0.85rem; border: none; background: transparent; color: ${activeTab === 2 ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${activeTab === 2 ? '3px solid var(--primary)' : '3px solid transparent'}; cursor: pointer; transition: all 0.2s ease;">
              💸 Finanzas y Gastos
            </button>
            <button type="button" class="tab-item-m3 ${activeTab === 3 ? 'active' : ''}" data-tab="3" style="flex: 1; padding: 1.15rem 1rem; font-weight: 700; font-size: 0.85rem; border: none; background: transparent; color: ${activeTab === 3 ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: ${activeTab === 3 ? '3px solid var(--primary)' : '3px solid transparent'}; cursor: pointer; transition: all 0.2s ease;">
              📈 Rentabilidad
            </button>
          </div>

          <!-- Main Scrollable Content Panel -->
          <div id="tab-content-panel" style="padding: 2rem; overflow-y: auto; flex: 1; min-height: 400px; max-height: 60vh;">
            <!-- Tab contents will render dynamically here -->
          </div>

          <!-- Sticky Modal Footer Actions -->
          <div style="padding: 1.25rem 2rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem; background: rgba(255,255,255,0.01); border-bottom-left-radius: 24px; border-bottom-right-radius: 24px;">
            <button type="button" class="btn-outline" id="btn-cancel-tmodal" style="padding: 0.65rem 1.5rem; border-radius: 12px; font-weight: 600; cursor: pointer; margin: 0;">Cancelar</button>
            <button type="button" class="btn-primary" id="btn-save-tmodal" style="padding: 0.65rem 1.75rem; display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; font-weight: 750; margin: 0;">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" /></svg>
              Guardar Viaje
            </button>
          </div>

        </div>
      </div>
    `;

    // Render exact active tab layout
    const panel = container.querySelector('#tab-content-panel');
    if (activeTab === 0) {
      panel.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">📅 Fecha de Viaje</label>
              <div style="display: flex; gap: 0.4rem; align-items: center; width: 100%;">
                <input type="text" id="t-date" value="${date}" readonly style="flex: 1; padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; font-size: 0.85rem; cursor: pointer;">
                <button type="button" id="btn-t-date-picker" title="Seleccionar Fecha" style="padding: 0 0.85rem; height: 38px; border-radius: 10px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.35); color: var(--primary); cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; margin: 0;">📅</button>
              </div>
            </div>
            <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">📌 Estado</label>
              <select id="t-status" style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; font-size: 0.85rem;">
                <option value="DRAFT" ${status === 'DRAFT' ? 'selected' : ''}>Borrador</option>
                <option value="ACTIVE" ${status === 'ACTIVE' ? 'selected' : ''}>Activo</option>
                <option value="COMPLETED" ${status === 'COMPLETED' ? 'selected' : ''}>Completado</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">📝 Descripción / Destino</label>
            <input type="text" id="t-desc" value="${description}" placeholder="Ej. Remisión Vacunos Liniers..." style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.85rem;">
          </div>

          <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">🚛 Camión Asignado</label>
              <select id="t-truck" required style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; font-size: 0.85rem; width: 100%;">
                <option value="">-- Seleccionar Camión --</option>
                ${trucksOpts}
              </select>
            </div>
            <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
              <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">🔢 Número de Tropa / Remito</label>
              <input type="text" id="t-tropa" value="${tropa}" placeholder="Ej. Tropa 4028..." style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.85rem; width: 100%;">
            </div>
          </div>

          <!-- Odómetro panel card -->
          <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem;">
            <h4 style="margin: 0 0 1.25rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
              🛣️ Odómetro de Ruta
            </h4>
            <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Km Salida (Origen)</label>
                <input type="number" id="t-km-o" step="0.1" value="${kmOnOrigin}" required style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
              </div>
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Km Retorno (Destino)</label>
                <input type="number" id="t-km-d" step="0.1" value="${kmOnDestination}" required style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
              </div>
            </div>
            <div style="margin-top: 1.25rem; padding: 0.75rem 1.25rem; background: var(--primary-container); border-radius: 12px; color: var(--on-primary-container); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 600;">Distancia Total Calculada:</span>
              <strong style="font-size: 1.2rem; font-weight: 850;">${dist} km</strong>
            </div>
          </div>

          <!-- Combustible panel card -->
          <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem;">
            <h4 style="margin: 0 0 1.25rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
              ⛽ Consumo de Combustible
            </h4>
            <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Odo. en Surtidor (Km)</label>
                <input type="number" id="t-km-p" step="0.1" value="${kmOnPump}" style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
              </div>
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Litros Abastecidos</label>
                <input type="number" id="t-liters" step="0.1" value="${litersOnPump}" style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
              </div>
            </div>
          </div>

        </div>
      `;

      // Setup Tab 0 listeners
      const tDate = panel.querySelector('#t-date');
      const btnDatePicker = panel.querySelector('#btn-t-date-picker');
      const tStatus = panel.querySelector('#t-status');
      const tDesc = panel.querySelector('#t-desc');
      const tTruck = panel.querySelector('#t-truck');
      const tTropa = panel.querySelector('#t-tropa');
      const tKmO = panel.querySelector('#t-km-o');
      const tKmD = panel.querySelector('#t-km-d');
      const tKmP = panel.querySelector('#t-km-p');
      const tLiters = panel.querySelector('#t-liters');

      const openDatePicker = () => {
        renderDateModal({
          title: '📅 Seleccionar Fecha de Viaje',
          description: 'Selecciona la fecha para este viaje operativo.',
          submitText: 'Aceptar',
          single: true,
          value: date,
          onSubmit: (selectedDate) => {
            date = selectedDate;
            tDate.value = date;
          }
        });
      };

      tDate.onclick = openDatePicker;
      btnDatePicker.onclick = openDatePicker;

      btnDatePicker.addEventListener('mouseenter', () => {
        btnDatePicker.style.transform = 'scale(1.05)';
        btnDatePicker.style.background = 'rgba(99,102,241,0.25)';
      });
      btnDatePicker.addEventListener('mouseleave', () => {
        btnDatePicker.style.transform = 'scale(1)';
        btnDatePicker.style.background = 'rgba(99,102,241,0.15)';
      });
      tStatus.onchange = (e) => { 
        status = e.target.value; 
        const chip = container.querySelector('kmp-status-chip');
        if (chip) chip.setAttribute('status', status);
      };
      tDesc.oninput = (e) => { description = e.target.value; };
      tTruck.onchange = (e) => { selectedTruckId = e.target.value; };
      if (tTropa) {
        tTropa.oninput = (e) => { tropa = e.target.value; };
      }
      tKmO.oninput = (e) => { 
        kmOnOrigin = Number(e.target.value); 
        panel.querySelector('strong').textContent = Math.max(0, kmOnDestination - kmOnOrigin) + ' km';
      };
      tKmD.oninput = (e) => { 
        kmOnDestination = Number(e.target.value); 
        panel.querySelector('strong').textContent = Math.max(0, kmOnDestination - kmOnOrigin) + ' km';
      };
      tKmP.oninput = (e) => { kmOnPump = Number(e.target.value); };
      tLiters.oninput = (e) => { litersOnPump = Number(e.target.value); };

    } else if (activeTab === 1) {
      panel.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; flex-wrap: wrap;">
            <div>
              <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: #ffffff;">🥩 Productores y Cargas</h4>
              <p style="margin: 0.15rem 0 0 0; color: var(--text-muted); font-size: 0.78rem;">Asocia múltiples productores al viaje y detalla sus lotes comerciales.</p>
            </div>
            
            <div style="display: flex; align-items: center; gap: 0.5rem; min-width: 250px;">
              <select id="select-add-producer" class="form-input" style="padding: 0.55rem; font-size: 0.8rem; font-weight: 600; border-radius: 10px; flex: 1; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);">
                ${producersOpts}
              </select>
            </div>
          </div>

          <div id="assoc-producers-container" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Render list of associated producers -->
            ${computedBuy.listOfProducers.map((prod, pIdx) => {
              const name = prod.producer.name;
              const cuit = prod.producer.cuit;
              const cbu = prod.producer.cbu;
              const isManual = prod.manualIva !== null;

              return `
                <div class="producer-form-card" data-idx="${pIdx}" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 20px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
                  
                  <!-- Producer Card Header -->
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.75rem; gap: 1rem; flex-wrap: wrap;">
                    <div>
                      <h5 style="margin:0; font-size: 1rem; font-weight: 750; color: var(--primary);">👤 ${name}</h5>
                      <span style="font-size:0.75rem; color: var(--text-muted); font-weight: 600;">CUIT: ${cuit} &bull; CBU: ${cbu}</span>
                    </div>
                    <button type="button" class="btn-remove-producer btn-icon" data-idx="${pIdx}" style="padding: 0.4rem 0.8rem; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; border-radius: 8px; font-weight: 700; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; margin: 0;">
                      <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                      Quitar Productor
                    </button>
                  </div>

                  <!-- Origin & Manual IVA Row -->
                  <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.25rem; align-items: center;">
                    <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                      <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">📍 Localidad de Origen</label>
                      <input type="text" class="producer-origin" data-idx="${pIdx}" value="${prod.origin || ''}" placeholder="Ej. Liniers, San Justo..." style="padding: 0.5rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.82rem;">
                    </div>
                    
                    <div style="background: rgba(0,0,0,0.12); padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem;">
                      <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; cursor: pointer; font-weight: 600; color: #ffffff; margin: 0; user-select: none;">
                        <input type="checkbox" class="toggle-p-manual-iva" data-idx="${pIdx}" ${isManual ? 'checked' : ''}>
                        IVA Manual
                      </label>
                      <input type="number" class="p-manual-iva-val" data-idx="${pIdx}" value="${isManual ? prod.manualIva : ''}" placeholder="IVA $" style="width: 100px; padding: 0.4rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right; visibility: ${isManual ? 'visible' : 'hidden'};">
                    </div>
                  </div>

                  <!-- Products (Cattle Lots) Sub-table -->
                  <div style="background: rgba(0,0,0,0.12); padding: 1rem; border-radius: 16px; border: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                      <strong style="font-size: 0.82rem; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">🥩 Lotes de Hacienda</strong>
                      <button type="button" class="btn-add-lot" data-idx="${pIdx}" style="padding: 0.35rem 0.75rem; font-size: 0.72rem; font-weight: 700; background: var(--primary); color: var(--on-primary); border: none; border-radius: 6px; cursor: pointer; margin: 0;">
                        + Agregar Lote
                      </button>
                    </div>

                    <div style="overflow-x: auto;">
                      <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; min-width: 600px;">
                        <thead>
                          <tr style="border-bottom: 1.5px solid var(--border); color: var(--text-muted); text-align: left; font-weight: 700; font-size: 0.75rem;">
                            <th style="padding: 0.5rem 0.25rem;">Categoría</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: center; width: 70px;">Cant.</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: right; width: 90px;">Kg Vivo</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: center; width: 75px;">Desb. %</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: right; width: 90px;">Kg Limpio</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: right; width: 100px;">$ / Kg</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: right; width: 100px;">Operación</th>
                            <th style="padding: 0.5rem 0.25rem; text-align: center; width: 40px;"></th>
                          </tr>
                        </thead>
                        <tbody>
                          ${prod.listOfProducts.map((lot, lIdx) => `
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                              <td style="padding: 0.5rem 0.25rem;">
                                <input type="text" class="lot-name" data-pidx="${pIdx}" data-lidx="${lIdx}" value="${lot.name}" placeholder="Novillo..." required style="width: 100%; padding: 0.35rem 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600;">
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: center;">
                                <input type="number" class="lot-quantity" data-pidx="${pIdx}" data-lidx="${lIdx}" value="${lot.quantity}" min="1" required style="width: 60px; padding: 0.35rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; text-align: center;">
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: right;">
                                <input type="number" class="lot-kg" data-pidx="${pIdx}" data-lidx="${lIdx}" value="${lot.kg}" min="1" required style="width: 80px; padding: 0.35rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: center;">
                                <input type="number" step="0.1" class="lot-roughing" data-pidx="${pIdx}" data-lidx="${lIdx}" value="${lot.roughing}" style="width: 65px; padding: 0.35rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; text-align: center;">
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: right; font-family: monospace; color: #34d399; font-weight: 700;">
                                ${lot.kgClean.toFixed(0).toLocaleString()} kg
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: right;">
                                <input type="number" step="0.01" class="lot-price" data-pidx="${pIdx}" data-lidx="${lIdx}" value="${lot.price}" min="0" required style="width: 90px; padding: 0.35rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 750; text-align: right;">
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: right; font-family: monospace; color: #ffffff; font-weight: 700;">
                                $${lot.operation.toLocaleString()}
                              </td>
                              <td style="padding: 0.5rem 0.25rem; text-align: center;">
                                <button type="button" class="btn-delete-lot btn-icon" data-pidx="${pIdx}" data-lidx="${lIdx}" style="color: #f87171; background: transparent; border: none; cursor: pointer; padding: 0.25rem;">
                                  <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                                </button>
                              </td>
                            </tr>
                          `).join('')}
                          ${prod.listOfProducts.length === 0 ? `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 1rem 0;">No hay lotes de hacienda cargados para este productor.</td></tr>` : ''}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <!-- Producer Total Mini-Dashboard Info -->
                  <div style="display: flex; gap: 1rem; justify-content: flex-end; align-items: center; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 0.75rem;">
                    <span>Total Cabezas: <strong style="color: #ffffff;">${prod.totalQuantity}</strong></span>
                    <span>Total Kg Limpio: <strong style="color: #ffffff;">${prod.totalKgClean.toFixed(0).toLocaleString()} kg</strong></span>
                    <span>Liquidación Bruta: <strong style="color: #34d399;">$${prod.totalOperation.toLocaleString()}</strong></span>
                  </div>

                </div>
              `;
            }).join('')}
            ${computedBuy.listOfProducers.length === 0 ? `
              <div style="text-align: center; padding: 3rem 1.5rem; border: 1.5px dashed var(--border); border-radius: 20px; color: var(--text-muted);">
                <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">🥩</span>
                <strong style="font-size: 0.95rem; color: #ffffff; display: block; margin-bottom: 0.25rem;">Sin Productores Asociados</strong>
                <span>Selecciona un productor de la lista superior para comenzar a armar el viaje.</span>
              </div>
            ` : ''}
          </div>

        </div>
      `;

      // Setup Tab 1 event binds
      panel.querySelector('#select-add-producer').onchange = (e) => {
        const id = e.target.value;
        const p = producers.find(prod => String(prod.id) === String(id));
        if (p) {
          localBuy.listOfProducers.push({
            producer: { id: p.id, name: p.name, cuit: p.cuit, cbu: p.cbu },
            origin: '',
            manualIva: null,
            listOfProducts: []
          });
          renderModal();
        }
      };

      panel.querySelectorAll('.btn-remove-producer').forEach(btn => {
        btn.onclick = (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          localBuy.listOfProducers.splice(idx, 1);
          renderModal();
        };
      });

      panel.querySelectorAll('.producer-origin').forEach(input => {
        input.oninput = (e) => {
          const idx = parseInt(e.target.dataset.idx);
          localBuy.listOfProducers[idx].origin = e.target.value;
        };
      });

      panel.querySelectorAll('.toggle-p-manual-iva').forEach(chk => {
        chk.onchange = (e) => {
          const idx = parseInt(e.target.dataset.idx);
          const valInp = panel.querySelector(`.p-manual-iva-val[data-idx="${idx}"]`);
          if (e.target.checked) {
            localBuy.listOfProducers[idx].manualIva = 0;
            valInp.style.visibility = 'visible';
            valInp.value = '0';
          } else {
            localBuy.listOfProducers[idx].manualIva = null;
            valInp.style.visibility = 'hidden';
            valInp.value = '';
          }
          renderModal();
        };
      });

      panel.querySelectorAll('.p-manual-iva-val').forEach(input => {
        input.oninput = (e) => {
          const idx = parseInt(e.target.dataset.idx);
          localBuy.listOfProducers[idx].manualIva = Number(e.target.value) || 0;
        };
        input.onblur = () => {
          renderModal();
        };
      });

      panel.querySelectorAll('.btn-add-lot').forEach(btn => {
        btn.onclick = (e) => {
          const pIdx = parseInt(e.target.dataset.idx);
          localBuy.listOfProducers[pIdx].listOfProducts.push({
            name: 'Novillo',
            quantity: 1,
            kg: 400,
            roughing: 8,
            price: 2200,
            kgFaena: 0
          });
          renderModal();
        };
      });

      panel.querySelectorAll('.btn-delete-lot').forEach(btn => {
        btn.onclick = (e) => {
          const pIdx = parseInt(e.currentTarget.dataset.pidx);
          const lIdx = parseInt(e.currentTarget.dataset.lidx);
          localBuy.listOfProducers[pIdx].listOfProducts.splice(lIdx, 1);
          renderModal();
        };
      });

      panel.querySelectorAll('.lot-name').forEach(input => {
        input.oninput = (e) => {
          const pIdx = parseInt(e.target.dataset.pidx);
          const lIdx = parseInt(e.target.dataset.lidx);
          localBuy.listOfProducers[pIdx].listOfProducts[lIdx].name = e.target.value;
        };
      });

      panel.querySelectorAll('.lot-quantity').forEach(input => {
        input.oninput = (e) => {
          const pIdx = parseInt(e.target.dataset.pidx);
          const lIdx = parseInt(e.target.dataset.lidx);
          localBuy.listOfProducers[pIdx].listOfProducts[lIdx].quantity = Number(e.target.value) || 0;
        };
        input.onblur = () => renderModal();
      });

      panel.querySelectorAll('.lot-kg').forEach(input => {
        input.oninput = (e) => {
          const pIdx = parseInt(e.target.dataset.pidx);
          const lIdx = parseInt(e.target.dataset.lidx);
          localBuy.listOfProducers[pIdx].listOfProducts[lIdx].kg = Number(e.target.value) || 0;
        };
        input.onblur = () => renderModal();
      });

      panel.querySelectorAll('.lot-roughing').forEach(input => {
        input.oninput = (e) => {
          const pIdx = parseInt(e.target.dataset.pidx);
          const lIdx = parseInt(e.target.dataset.lidx);
          localBuy.listOfProducers[pIdx].listOfProducts[lIdx].roughing = Number(e.target.value) || 0;
        };
        input.onblur = () => renderModal();
      });

      panel.querySelectorAll('.lot-price').forEach(input => {
        input.oninput = (e) => {
          const pIdx = parseInt(e.target.dataset.pidx);
          const lIdx = parseInt(e.target.dataset.lidx);
          localBuy.listOfProducers[pIdx].listOfProducts[lIdx].price = Number(e.target.value) || 0;
        };
        input.onblur = () => renderModal();
      });

    } else if (activeTab === 2) {
      panel.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Agente y Achique Global Panel -->
          <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
            <h4 style="margin: 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px;">
              👤 Intermediación y Descuento
            </h4>

            <div class="responsive-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Agente (Comisionista)</label>
                <select id="t-agent" style="padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 600; font-size: 0.85rem;">
                  ${agentsOpts}
                </select>
              </div>

              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Descuento Global / Achique Total ($)</label>
                <input type="number" id="t-reduce" value="${localBuy.totalReduce}" style="padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 750; text-align: right;">
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; font-size: 0.85rem; font-weight: 700;">
              <span style="color: var(--text-muted);">Comisión Agente Consolidada:</span>
              <strong style="color: var(--primary); font-size: 1.05rem;">$${computedBuy.agentCommissionAmount.toLocaleString()}</strong>
            </div>
          </div>

          <!-- Gastos Adicionales panel card -->
          <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem;">
            <h4 style="margin: 0 0 1.25rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.4rem;">
              💸 Gastos Varios y Viáticos del Chofer
            </h4>
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem; max-height: 180px; overflow-y: auto; padding-right: 0.25rem;">
              ${localExpenses.map((e, index) => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--border);">
                  <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                    <span style="font-size: 0.85rem; font-weight: 700; color: #ffffff;">${e.description}</span>
                    <span style="font-size: 0.7rem; font-weight: 600; color: ${e.isReimbursable ? '#34d399' : 'var(--text-muted)'};">${e.isReimbursable ? '♻️ A Reembolsar' : '❌ No Reembolsable'}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <strong style="font-size: 0.95rem; font-family: monospace; color: var(--text-main);">$${e.amount.toLocaleString()}</strong>
                    <button type="button" class="btn-delete-exp btn-icon" data-idx="${index}" style="color: #f87171; background: transparent; border: none; cursor: pointer; padding: 0.25rem; display: flex; align-items: center; justify-content: center; margin: 0;">
                      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                    </button>
                  </div>
                </div>
              `).join('')}
              ${localExpenses.length === 0 ? `<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem; border: 1px dashed var(--border); border-radius: 12px;">Sin viáticos o gastos adicionales registrados en este viaje.</div>` : ''}
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; background: rgba(0,0,0,0.12); padding: 0.75rem; border-radius: 14px; border: 1px solid var(--border);">
              <input type="text" id="e-desc" placeholder="Descripción Gasto" style="flex: 2.2; padding: 0.5rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); font-size: 0.82rem; background: var(--bg-main); color: var(--text-main); font-weight: 600;">
              <input type="number" id="e-amount" placeholder="Monto ($)" style="flex: 1.1; padding: 0.5rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); font-size: 0.82rem; background: var(--bg-main); color: var(--text-main); font-weight: 700; text-align: right;">
              
              <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; cursor: pointer; color: var(--text-muted); font-weight: 700; padding: 0.25rem 0.5rem; user-select: none;">
                <input type="checkbox" id="e-reimb" checked style="cursor: pointer;"> Reemb.
              </label>
              
              <button type="button" id="btn-add-exp" style="padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 800; background: var(--primary); color: var(--on-primary); border: none; cursor: pointer; transition: all 0.2s ease; margin: 0;">+</button>
            </div>
          </div>

        </div>
      `;

      // Setup Tab 2 event binds
      panel.querySelector('#t-agent').onchange = (e) => {
        const id = e.target.value;
        const a = agents.find(ag => String(ag.id) === String(id));
        if (a) {
          localBuy.agent = { id: a.id, name: a.name, percent: a.percent };
        } else {
          localBuy.agent = { name: '', percent: 0 };
        }
        renderModal();
      };

      panel.querySelector('#t-reduce').oninput = (e) => {
        localBuy.totalReduce = Number(e.target.value) || 0;
        localBuy.reduce = localBuy.totalReduce;
      };
      panel.querySelector('#t-reduce').onblur = () => {
        renderModal();
      };

      panel.querySelector('#btn-add-exp').onclick = () => {
        const desc = panel.querySelector('#e-desc').value;
        const amt = Number(panel.querySelector('#e-amount').value);
        const isR = panel.querySelector('#e-reimb').checked;
        if (desc && amt > 0) {
          localExpenses.push({
            id: Date.now(),
            travelId: travel?.id || 0,
            description: desc,
            amount: amt,
            category: 'OTROS',
            date: date,
            isReimbursable: isR
          });
          renderModal();
        }
      };

      panel.querySelectorAll('.btn-delete-exp').forEach(btn => {
        btn.onclick = (e) => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          localExpenses.splice(idx, 1);
          renderModal();
        };
      });

    } else if (activeTab === 3) {
      // Pestaña 3: Resumen de Rentabilidad Dashboard!
      const totalOperation = computedBuy.totalOperation;
      const totalOpWithComm = computedBuy.totalOperationWithCommission;
      const cleanKg = computedBuy.totalKgClean;
      const netCostPerKg = cleanKg > 0 ? (totalOpWithComm / cleanKg) : 0;
      
      const generalYield = computedBuy.generalYield * 100;
      
      // Calculate net earnings
      const netEarnings = totalOperation - driverCost - fuelCost - totalExpenses;
      const marginPercent = totalOperation > 0 ? (netEarnings / totalOperation) * 100 : 0;

      const efficiency = litersOnPump > 0 && dist > 0 ? (dist / litersOnPump).toFixed(2) : 'N/A';

      panel.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.75rem;">
          
          <!-- Profitability Banner -->
          <div style="background: ${netEarnings >= 0 ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)'}; border: 1.5px solid ${netEarnings >= 0 ? '#10b981' : '#ef4444'}; border-radius: 20px; padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">Retorno Neto Estimado (Margen Operativo)</span>
              <h3 style="margin: 0.25rem 0 0 0; font-size: 1.85rem; font-weight: 900; color: ${netEarnings >= 0 ? '#34d399' : '#f87171'};">$${netEarnings.toLocaleString()}</h3>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">Margen de Ganancia</span>
              <h4 style="margin: 0.25rem 0 0 0; font-size: 1.4rem; font-weight: 850; color: ${netEarnings >= 0 ? '#34d399' : '#f87171'};">${marginPercent.toFixed(1)}%</h4>
            </div>
          </div>

          <!-- Metrics Grid Dashboard -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
            
            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem;">🛣️ Distancia de Ruta</span>
              <strong style="font-size: 1.35rem; color: #ffffff; font-weight: 850;">${dist} km</strong>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem;">Patente: ${currentTruck?.licensePlate || 'N/A'}</div>
            </div>

            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem;">⛽ Eficiencia de Consumo</span>
              <strong style="font-size: 1.35rem; color: #3b82f6; font-weight: 850;">${efficiency} ${efficiency !== 'N/A' ? 'km/l' : ''}</strong>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem;">Litros: ${litersOnPump} L</div>
            </div>

            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem;">📈 Rendimiento de Faena</span>
              <strong style="font-size: 1.35rem; color: #10b981; font-weight: 850;">${generalYield.toFixed(2)}%</strong>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem;">(kg faena / kg limpios)</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem;">Prom. Cabeza: ${(computedBuy.totalQuantity > 0 ? (computedBuy.totalKgClean / computedBuy.totalQuantity) : 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} kg/cab</div>
            </div>

            <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.5rem;">💵 Costo Neto / Kg Limpio</span>
              <strong style="font-size: 1.35rem; color: #fbbf24; font-weight: 850;">$${netCostPerKg.toFixed(2)}</strong>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; margin-top: 0.25rem;">Total c/ Com: $${totalOpWithComm.toLocaleString()}</div>
            </div>

          </div>

          <!-- Detailed Ledger Subcard -->
          <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: 18px; padding: 1.5rem;">
            <h4 style="margin: 0 0 1rem 0; font-size: 0.85rem; font-weight: 700; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">📋 Desglose de Gastos & Flete</h4>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="color: var(--text-muted);">Flete Simulado Estimado (Ruta):</span>
                <strong style="color: #ffffff;">$${simulatedFreight.toLocaleString()}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="color: var(--text-muted);">Costo Total Chofer:</span>
                <strong style="color: #f87171;">- $${driverCost.toLocaleString()}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="color: var(--text-muted);">Costo de Combustible (${litersOnPump} L):</span>
                <strong style="color: #f87171;">- $${fuelCost.toLocaleString()}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span style="color: var(--text-muted);">Gastos Varios & Viáticos del Viaje:</span>
                <strong style="color: #f87171;">- $${totalExpenses.toLocaleString()}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 1.1rem; border-top: 1.5px solid var(--border); padding-top: 1rem; margin-top: 0.5rem; font-weight: 800; color: #ffffff;">
                <span>Total de Costos Operativos del Viaje:</span>
                <span style="color: #f87171;">$${(driverCost + fuelCost + totalExpenses).toLocaleString()}</span>
              </div>

            </div>
          </div>

        </div>
      `;
    }

    // Set active class click listeners to Tab bar
    container.querySelectorAll('.tab-item-m3').forEach(btn => {
      btn.onclick = (e) => {
        activeTab = parseInt(e.target.dataset.tab);
        renderModal();
      };
    });

    // Save and Cancel buttons Setup
    container.querySelector('#btn-cancel-tmodal').onclick = () => {
      container.innerHTML = '';
      if (options.onCancel) options.onCancel();
    };

    container.querySelector('#btn-save-tmodal').onclick = (e) => {
      e.preventDefault();
      
      const selectedTruck = trucks.find(t => String(t.id) === String(selectedTruckId));

      const payload = {
        id: travel ? travel.id : Date.now(),
        date: date,
        status: status,
        description: description,
        tropa: tropa,
        truck: selectedTruck || null,
        kmOnOrigin: kmOnOrigin,
        kmOnDestination: kmOnDestination,
        kmOnPump: kmOnPump,
        litersOnPump: litersOnPump,
        expenses: localExpenses,
        driverPricePerKmSimple: travel?.driverPricePerKmSimple || 0,
        driverPricePerKmDouble: travel?.driverPricePerKmDouble || 0,
        fuelPrice: travel?.fuelPrice || 0,
        pricePerKm: travel?.pricePerKm || 0,
        buy: {
          id: localBuy.id || '',
          agent: localBuy.agent,
          reduce: localBuy.totalReduce,
          totalReduce: localBuy.totalReduce,
          listOfProducers: localBuy.listOfProducers
        },
        kgFaenaTotal: travel?.kgFaenaTotal || 0,
        updatedAt: Date.now()
      };

      container.innerHTML = '';
      if (options.onSaveTravel) {
        options.onSaveTravel(payload);
      }
    };
  };

  renderModal();
}
