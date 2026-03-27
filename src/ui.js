// webApp/src/ui.js
import { BuyLogic, TravelLogic, CostSimulator } from './calculations.js';

/** Utility to create an element with optional classes and text */
function el(tag, { classes = [], text = '', html = '', attrs = {} } = {}) {
  const element = document.createElement(tag);
  if (classes.length) element.classList.add(...classes);
  if (text) element.textContent = text;
  if (html) element.innerHTML = html;
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  return element;
}

/** Render Dashboard (Simplified to show global travel stats) */
export function renderDashboard(travels, container) {
  const section = el('section', { classes: ['dashboard'] });
  const stats = el('div', { classes: ['stats-grid'] });
  
  let totalProfit = 0;
  let totalKm = 0;
  travels.forEach(t => {
    totalProfit += TravelLogic.travelProfit(t);
    totalKm += TravelLogic.distanceKm(t);
  });
  
  stats.appendChild(renderStatCard('Total Profit', `$${totalProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}`, '📈'));
  stats.appendChild(renderStatCard('Total Distance', `${totalKm.toLocaleString()} km`, '🛣️'));
  
  section.appendChild(stats);
  section.appendChild(el('h2', { text: 'Travel History', classes: ['section-title'] }));
  renderTravels(travels, section);
  
  container.appendChild(section);
}

function renderStatCard(label, value, icon) {
  return el('div', { 
    classes: ['stat-card'], 
    html: `<div class="stat-icon">${icon}</div><div class="stat-info"><p>${label}</p><h3>${value}</h3></div>` 
  });
}

/** Render Travels with exhaustive details requested by the user */
export function renderTravels(data, container) {
  const list = el('div', { classes: ['card-list'] });
  data.forEach(travel => {
    const buy = travel.buy || {};
    const profit = TravelLogic.travelProfit(travel);
    const card = el('div', { classes: ['card', 'travel-card-full'] });
    
    const commission = BuyLogic.agentCommissionAmount(buy);
    const totalOp = BuyLogic.totalOperation(buy);
    const totalOpWithComm = BuyLogic.totalOperationWithCommission(buy);
    const yieldValue = BuyLogic.generalYield(buy);
    
    card.innerHTML = `
      <div class="card-header">
        <div class="header-main">
          <h3>${travel.truck?.name || 'Travel #' + travel.id}</h3>
          <span class="card-subtitle">${travel.date || ''} - ${travel.description || ''}</span>
        </div>
        <span class="status-badge ${travel.status?.toLowerCase() || 'draft'}">${travel.status || 'DRAFT'}</span>
      </div>
      
      <div class="card-body">
        <div class="grid-2-cols">
          <div class="metrics-column">
            <h4>Economics</h4>
            <div class="detail-row"><span>Total Operation:</span> <strong>$${totalOp.toLocaleString()}</strong></div>
            <div class="detail-row"><span>Agent Commission:</span> <strong>$${commission.toLocaleString()}</strong></div>
            <div class="detail-row highlight"><span>Total with Comm:</span> <strong>$${totalOpWithComm.toLocaleString()}</strong></div>
            <div class="detail-row"><span>Avg Price:</span> <strong>$${BuyLogic.avgPrice(buy).toFixed(2)}</strong></div>
            <div class="detail-row"><span>Avg Price (w/Comm):</span> <strong>$${BuyLogic.avgPriceWithCommission(buy).toFixed(2)}</strong></div>
            <div class="detail-row"><span>Bill/Operation %:</span> <strong>${(BuyLogic.facturaOverOperationPercent(buy) * 100).toFixed(2)}%</strong></div>
          </div>
          
          <div class="metrics-column">
            <h4>Inventory & Yield</h4>
            <div class="detail-row"><span>Total Quality:</span> <strong>${BuyLogic.totalQuality(buy)} units</strong></div>
            <div class="detail-row"><span>Total Kg Clean:</span> <strong>${BuyLogic.totalKgClean(buy).toLocaleString()} kg</strong></div>
            <div class="detail-row"><span>Total Kg Faena:</span> <strong>${BuyLogic.totalKgFaena(buy).toLocaleString()} kg</strong></div>
            <div class="detail-row highlight"><span>General Yield:</span> <strong>${(yieldValue * 100).toFixed(2)}%</strong></div>
            <div class="detail-row"><span>Travel Profit:</span> <strong class="${profit >= 0 ? 'text-success' : 'text-danger'}">$${profit.toLocaleString()}</strong></div>
          </div>
        </div>

        <hr>
        <h4>Producers</h4>
        <div class="producers-list">
          ${(buy.listOfProducers || []).map(p => `
            <div class="producer-item">
              <div class="producer-header">
                <strong>${p.name}</strong>
                <span>CUIT: ${p.cuit || 'N/A'} | CBU: ${p.cbu || 'N/A'}</span>
              </div>
              <div class="product-mini-list">
                ${(p.listOfProducts || []).map(pr => {
                  const bill = pr.taxes?.bill || { neto: 0, iva: 0, ganancias: 0 };
                  const factura = (bill.neto || 0) + (bill.iva || 0);
                  return `
                    <div class="product-mini-row">
                      <span>${pr.quantity}x ${pr.name}</span>
                      <span>Neto: $${(bill.neto || 0).toLocaleString()} | IVA: $${(bill.iva || 0).toLocaleString()} | Gans: $${(bill.ganancias || 0).toLocaleString()} | <b>Total: $${factura.toLocaleString()}</b></span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    list.appendChild(card);
  });
  container.appendChild(list);
}

/** Render Cost Simulator */
export function renderSimulator(container) {
  const wrapper = el('div', { classes: ['simulator-wrapper'] });
  const form = el('div', { classes: ['simulator-form', 'glass-card'] });
  form.innerHTML = `
    <h2>Costo Gancho Simulator</h2>
    <div class="form-group"><label>Rendimiento (%)</label><input type="number" id="sim-rend" value="58.5" step="0.1"></div>
    <div class="form-group"><label>Precio Vivo ($/kg)</label><input type="number" id="sim-precio" value="5050" step="10"></div>
    <div class="form-group"><label>Distancia (km)</label><input type="number" id="sim-dist" value="400" step="5"></div>
    <div class="form-group"><label>IIBB (%)</label><input type="number" id="sim-iibb" value="1.7" step="0.1"></div>
    <div class="form-group checkbox"><label>Jaula Doble</label><input type="checkbox" id="sim-doble" checked></div>
  `;
  
  const results = el('div', { classes: ['simulator-results', 'glass-card'] });
  results.id = 'sim-results';
  
  wrapper.appendChild(form);
  wrapper.appendChild(results);
  container.appendChild(wrapper);
  
  const update = () => {
    const config = {
      rendimiento: parseFloat(document.getElementById('sim-rend').value),
      precioVivo: parseFloat(document.getElementById('sim-precio').value),
      distancia: parseFloat(document.getElementById('sim-dist').value),
      porcentajeIIBB: parseFloat(document.getElementById('sim-iibb').value),
      jaulaDobleOrSimple: document.getElementById('sim-doble').checked
    };
    const sim = new CostSimulator(config);
    results.innerHTML = `
      <div class="res-item"><span>Kg Faena:</span> <strong>${sim.kgFaena.toFixed(0)} kg</strong></div>
      <div class="res-item"><span>Costo Hacienda:</span> <strong>$${sim.costoInicialPorKgCarne.toFixed(2)}</strong></div>
      <div class="res-item"><span>Costo Flete:</span> <strong>$${sim.costoFletePorKgCarne.toFixed(2)}</strong></div>
      <hr>
      <div class="res-item highlight"><span>Costo Final:</span> <strong>$${sim.costoFinal.toFixed(2)} /kg</strong></div>
      <div class="res-item active"><span>Factura Venta:</span> <strong>$${sim.facturaVentaPorKgCarne.toFixed(2)} /kg</strong></div>
      <div class="res-item utility"><span>Utilidad Total:</span> <strong>$${sim.utilidadTotalEstimada.toLocaleString()}</strong></div>
    `;
  };
  form.addEventListener('input', update);
  update();
}
