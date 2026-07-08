import { el } from '../../../frameworks/utils/dom.js';
import { CostSimulator } from '../../../domain/entities/CostSimulator.js';

/**
 * @file SimulatorUI.js
 * @description Renders a high-fidelity, premium interactive dashboard for livestock hook cost simulations.
 * Displays input controls on the left side and advanced scorecard intermediate receipts on the right.
 */

/**
 * Renders the cost simulator screen into the given container.
 * @param {HTMLElement} container - The DOM container to render into.
 * @param {Object} options - Config and navigation options.
 * @param {function} options.onBack - Callback to return to the dashboard.
 */
export function renderSimulator(container, options) {
  if (!container) return;

  container.innerHTML = '';
  
  const wrapper = el('div', { 
    classes: ['simulator-wrapper', 'fade-in'], 
    style: 'width: 100%; max-width: 100%; margin: 0; padding: 0 0 2rem 0;' 
  });
  
  // High-End Header Bar
  const header = el('div', { 
    classes: ['settings-header-container', 'glass-card'], 
    style: 'grid-column: 1 / -1; margin-bottom: 1.5rem; padding: 1.5rem 2rem; display: flex; align-items: center; gap: 1.25rem; border-radius: 20px;' 
  });
  header.innerHTML = `
    <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard" style="border: 1px solid var(--border); background: var(--bg-main);">
      <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <div>
      <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-main);">🧮 Simulador de Costo Gancho</h2>
      <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Estima de forma precisa costos de hacienda, fletes e impuestos aplicados a la carne.</p>
    </div>
  `;
  wrapper.appendChild(header);
  header.querySelector('#back-to-dash').onclick = options.onBack;

  // Left Panel: Dynamic Input Fields Form
  const form = el('div', { 
    classes: ['glass-card', 'settings-card'], 
    style: 'padding: 2rem; border-radius: 20px; display: flex; flex-direction: column; gap: 1.5rem;' 
  });
  form.innerHTML = `
    <div style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 0.25rem;">
      <h3 style="margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">⚙️ Parámetros de Operación</h3>
      <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.78rem;">Modifica los valores para recalcular al instante los costos ganchos.</p>
    </div>

    <!-- 1. Rendimiento Slider -->
    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Rendimiento Estimado (%)</label>
        <span class="badge-accent" id="rend-val-badge" style="background: var(--primary-container); color: var(--on-primary-container); font-weight: 700; font-size: 0.8rem; padding: 0.25rem 0.6rem; border-radius: 8px;">58.5%</span>
      </div>
      <input type="range" id="sim-rend" min="45" max="65" step="0.1" value="58.5" class="slider-m3" style="width: 100%;">
    </div>

    <!-- 2. Precio Vivo Input -->
    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
      <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Precio Vivo ($/kg en pie)</label>
      <div style="position: relative; display: flex; align-items: center;">
        <span style="position: absolute; left: 0.85rem; color: var(--text-muted); font-size: 0.9rem; font-weight: 500;">$</span>
        <input type="number" id="sim-precio" value="5050" step="10" class="form-input" style="padding-left: 1.75rem; width: 100%;" placeholder="Ej: 5050">
      </div>
    </div>

    <!-- 3. Distancia Input -->
    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
      <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Distancia al Establecimiento (km)</label>
      <div style="position: relative; display: flex; align-items: center;">
        <input type="number" id="sim-dist" value="400" step="5" class="form-input" style="width: 100%; padding-right: 2.5rem;" placeholder="Ej: 400">
        <span style="position: absolute; right: 0.85rem; color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">KM</span>
      </div>
    </div>

    <!-- 4. IIBB Slider -->
    <div class="form-group" style="display: flex; flex-direction: column; gap: 0.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Porcentaje IIBB (%)</label>
        <span class="badge-accent" id="iibb-val-badge" style="background: rgba(255, 255, 255, 0.08); color: var(--text-main); font-weight: 600; font-size: 0.8rem; padding: 0.25rem 0.6rem; border-radius: 8px;">1.7%</span>
      </div>
      <input type="range" id="sim-iibb" min="0" max="5" step="0.1" value="1.7" class="slider-m3" style="width: 100%;">
    </div>

    <!-- 5. Jaula Toggle Switch -->
    <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.02); padding: 0.95rem 1.25rem; border-radius: 14px; border: 1px solid var(--border); margin-top: 0.5rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.5rem;" id="jaula-icon">🚛</span>
        <div>
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin: 0; display: block;">Modo de Carga</label>
          <span style="font-size: 0.72rem; color: var(--text-muted);" id="jaula-desc">Jaula Doble estándar</span>
        </div>
      </div>
      <label class="switch-container-m3">
        <input type="checkbox" id="sim-doble" checked>
        <span class="switch-slider-m3"></span>
      </label>
    </div>
  `;

  // Right Panel: Financial Placard Results
  const results = el('div', { 
    classes: ['glass-card', 'settings-card', 'simulator-results-panel'], 
    style: 'padding: 2rem; border-radius: 20px; display: flex; flex-direction: column; gap: 1.25rem;' 
  });
  results.id = 'sim-results';

  wrapper.appendChild(form);
  wrapper.appendChild(results);
  
  // Important: Append everything to view container
  container.appendChild(wrapper);

  /**
   * Performs the mathematical calculations and updates the visual scorecard panel in real time.
   */
  const update = () => {
    const config = {
      rendimiento: parseFloat(document.getElementById('sim-rend').value) || 0,
      precioVivo: parseFloat(document.getElementById('sim-precio').value) || 0,
      distancia: parseFloat(document.getElementById('sim-dist').value) || 0,
      porcentajeIIBB: parseFloat(document.getElementById('sim-iibb').value) || 0,
      jaulaDobleOrSimple: document.getElementById('sim-doble').checked,
      settings: options.settings
    };

    // Update form labels
    const rendBadge = form.querySelector('#rend-val-badge');
    if (rendBadge) rendBadge.textContent = `${config.rendimiento.toFixed(1)}%`;
    const iibbBadge = form.querySelector('#iibb-val-badge');
    if (iibbBadge) iibbBadge.textContent = `${config.porcentajeIIBB.toFixed(1)}%`;
    
    const jaulaIcon = form.querySelector('#jaula-icon');
    const jaulaDesc = form.querySelector('#jaula-desc');
    if (config.jaulaDobleOrSimple) {
      if (jaulaIcon) jaulaIcon.textContent = '🚛';
      if (jaulaDesc) jaulaDesc.textContent = 'Jaula Doble estándar';
    } else {
      if (jaulaIcon) jaulaIcon.textContent = '🚚';
      if (jaulaDesc) jaulaDesc.textContent = 'Jaula Simple estándar';
    }

    const sim = new CostSimulator(config);

    // Render beautiful results placard
    results.innerHTML = `
      <div style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 0.5rem;">
        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">📊 Ficha de Resultados</h3>
        <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.78rem;">Cálculos automáticos computados según parámetros e impuestos.</p>
      </div>

      <div class="scorecard-list" style="display: flex; flex-direction: column; gap: 0.85rem;">
        <div class="score-row-item">
          <span class="score-label">Kg Venta Proyectados:</span>
          <strong class="score-value">${sim.kgFaena.toFixed(0)} kg</strong>
        </div>
        <div class="score-row-item">
          <span class="score-label">Costo Hacienda Carne:</span>
          <strong class="score-value">$${sim.costoInicialPorKgCarne.toFixed(2)}</strong>
        </div>
        <div class="score-row-item">
          <span class="score-label">Costo Flete por Kg:</span>
          <strong class="score-value">$${sim.costoFletePorKgCarne.toFixed(2)}</strong>
        </div>
        <div class="score-row-item">
          <span class="score-label">Costo Impuesto IIBB:</span>
          <strong class="score-value">$${sim.costoIIBB.toFixed(2)}</strong>
        </div>
        
        <hr style="border: none; border-top: 1px dashed var(--border); margin: 0.5rem 0;">
        
        <!-- Large Final Results Display -->
        <div class="score-row-item highlight-cost" style="background: rgba(143, 0, 20, 0.05); border: 1.5px solid rgba(143, 0, 20, 0.15); padding: 0.9rem 1.25rem; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;">
          <span style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">Costo Gancho Final:</span>
          <strong style="font-size: 1.35rem; font-weight: 850; color: #ffffff; text-shadow: 0 0 10px rgba(255,255,255,0.15);">$${sim.costoFinal.toFixed(2)} <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">/kg</span></strong>
        </div>

        <div class="score-row-item highlight-invoice" style="background: rgba(59, 130, 246, 0.05); border: 1.5px solid rgba(59, 130, 246, 0.15); padding: 0.9rem 1.25rem; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; margin-top: 0.25rem;">
          <span style="font-weight: 700; color: #60a5fa; font-size: 0.95rem;">Facturación Sugerida:</span>
          <strong style="font-size: 1.35rem; font-weight: 850; color: #ffffff; text-shadow: 0 0 10px rgba(96,165,250,0.15);">$${sim.facturaVentaPorKgCarne.toFixed(2)} <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">/kg</span></strong>
        </div>

        <div class="score-row-item highlight-net" style="background: rgba(16, 185, 129, 0.05); border: 1.5px solid rgba(16, 185, 129, 0.15); padding: 0.9rem 1.25rem; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease; margin-top: 0.25rem;">
          <span style="font-weight: 700; color: #34d399; font-size: 0.95rem;">Utilidad Total Neta:</span>
          <strong style="font-size: 1.35rem; font-weight: 850; color: #ffffff; text-shadow: 0 0 10px rgba(52,211,153,0.15);">$${sim.utilidadTotalEstimada.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
        </div>
      </div>
    `;
  };

  // Add listeners to elements inside form
  form.addEventListener('input', update);
  
  // Set initial trigger calculations
  update();
}
