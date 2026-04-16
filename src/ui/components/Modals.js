import { el } from '../../utils/dom.js';
import { printAuxiliaryCalcReport } from '../reports/ReportService.js';

const DENOMINATIONS = [20000, 10000, 2000, 1000, 500, 200, 100];

/** Render Export Modal */
export function renderExportModal({ onExport, onExcelExport }) {
  const overlay = el('div', { classes: ['modal-overlay'] });
  const modal = el('div', { classes: ['modal'] });
  
  modal.innerHTML = `
    <h2>📄 Exportar Reporte PDF</h2>
    <p style="color: var(--text-muted); margin-bottom: 2rem;">Selecciona el rango de viajes para incluir en el reporte.</p>
    
    <div class="form-group">
      <label>Criterio de Selección</label>
      <select id="export-type" class="form-input" style="width: 100%; border: 1px solid var(--border); padding: 0.75rem; border-radius: 12px; background: var(--bg-main); color: var(--text-main); margin-bottom: 1rem;">
        <option value="count">Últimos N Viajes</option>
        <option value="range">Rango de Fechas</option>
      </select>
    </div>

    <div id="export-count-section">
      <div class="form-group"><label>Cantidad de Viajes</label><input type="number" id="export-count" value="10" min="1" style="width: 100%;"></div>
    </div>

    <div id="export-range-section" style="display: none;">
      <div class="form-group"><label>Desde</label><input type="date" id="export-start" style="width: 100%;"></div>
      <div class="form-group"><label>Hasta</label><input type="date" id="export-end" style="width: 100%;"></div>
    </div>

    <div class="modal-actions">
      <button class="btn-outline" id="modal-cancel">Cancelar</button>
      <button class="btn-primary" id="modal-export" style="margin-top: 0; flex: 1; background: #841d1d;">PDF</button>
      <button class="btn-primary" id="modal-excel" style="margin-top: 0; flex: 1; background: #10b981;">Excel</button>
    </div>
  `;

  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const typeSelect = modal.querySelector('#export-type');
  const countSec = modal.querySelector('#export-count-section');
  const rangeSec = modal.querySelector('#export-range-section');

  typeSelect.onchange = (e) => {
    countSec.style.display = e.target.value === 'count' ? 'block' : 'none';
    rangeSec.style.display = e.target.value === 'range' ? 'block' : 'none';
  };

  modal.querySelector('#modal-cancel').onclick = () => overlay.remove();
  modal.querySelector('#modal-export').onclick = () => {
    const type = typeSelect.value;
    let value = type === 'count' 
      ? modal.querySelector('#export-count').value 
      : { start: modal.querySelector('#export-start').value, end: modal.querySelector('#export-end').value };
    
    onExport({ type, value });
    overlay.remove();
  };

  modal.querySelector('#modal-excel').onclick = () => {
    const type = typeSelect.value;
    let value = type === 'count' 
      ? modal.querySelector('#export-count').value 
      : { start: modal.querySelector('#export-start').value, end: modal.querySelector('#export-end').value };
    
    onExcelExport({ type, value });
    overlay.remove();
  };
}

/** Render Scan Results Modal */
export function renderScanResultsModal({ newCount, existCount, errorCount, errorMessages }) {
  const overlay = el('div', { classes: ['modal-overlay'] });
  const modal = el('div', { classes: ['modal'], style: 'max-width: 600px; max-height: 80vh; overflow-y: auto;' });
  
  const hasErrors = errorMessages.length > 0;
  
  let html = `
    <h2 style="margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
      📂 Resultados del Escaneo
    </h2>
    <div style="background: var(--bg-hover); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
      <div style="color: #10b981; margin-bottom: 0.5rem; font-weight: 500;">✅ ${newCount} PDFs nuevos procesados exitosamente</div>
      <div style="color: #60a5fa; margin-bottom: 0.5rem; font-weight: 500;">⏭️ ${existCount} PDFs ya existían (omitidos)</div>
      <div style="color: #ef4444; font-weight: 500;">❌ ${errorCount} errores encontrados</div>
    </div>
  `;

  if (hasErrors) {
    const errorText = errorMessages.join('\n\n');
    html += `
      <h3 style="margin-bottom: 0.5rem; color: var(--text-main); font-size: 1rem;">Detalle de Errores:</h3>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.5rem;">
        Puedes seleccionar y copiar el texto a continuación si necesitas analizar los errores.
      </p>
      <textarea readonly style="
        width: 100%; 
        height: 150px; 
        background: var(--bg-main); 
        color: #ef4444; 
        border: 1px solid var(--border); 
        border-radius: 8px; 
        padding: 0.75rem; 
        font-family: monospace; 
        font-size: 0.85rem;
        resize: vertical;
      ">${errorText}</textarea>
    `;
  }

  html += `
    <div class="modal-actions" style="margin-top: 1.5rem;">
      <button class="btn-primary" id="modal-close" style="width: 100%;">Aceptar</button>
    </div>
  `;

  modal.innerHTML = html;

  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector('#modal-close').onclick = () => overlay.remove();
}

/** Render Date Range Modal (Reusable) */
export function renderDateModal(options) {
  const { title = 'Seleccionar Fechas', description = '', submitText = 'Aceptar', onSubmit } = options;
  const overlay = el('div', { classes: ['modal-overlay'], style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;' });
  const modal = el('div', { classes: ['modal', 'glass-card'], style: 'max-width: 400px; padding: 2rem;' });
  
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  const fromDateVal = firstDayOfMonth.toISOString().split('T')[0];

  modal.innerHTML = `
    <h3 style="margin-bottom: 1.5rem;">${title}</h3>
    <form id="date-modal-form">
      ${description ? `<p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">${description}</p>` : ''}
      <div class="form-group">
        <label>Desde</label>
        <input type="date" id="modal-from" class="form-input" value="${fromDateVal}" required>
      </div>
      <div class="form-group">
        <label>Hasta</label>
        <input type="date" id="modal-to" class="form-input" value="${today}" required>
      </div>
      <div style="display: flex; gap: 1rem; margin-top: 2rem;">
        <button type="button" class="btn-cancel" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--text-main); cursor: pointer;">Cancelar</button>
        <button type="submit" class="btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: none; background: var(--primary); color: #fff; font-weight: 600; cursor: pointer;">${submitText}</button>
      </div>
    </form>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const form = modal.querySelector('#date-modal-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const from = modal.querySelector('#modal-from').value;
    const to = modal.querySelector('#modal-to').value;
    if (onSubmit) onSubmit(from, to);
    overlay.remove();
  };

  modal.querySelector('.btn-cancel').onclick = () => overlay.remove();
}

/** Render Auxiliary Calculator Modal */
export function showAuxiliaryCalculator(moduleTitle = 'Caja General') {
  const overlay = el('div', { 
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;'
  });

  const content = el('div', { 
    classes: ['glass-card'],
    style: 'width: 100%; max-width: 650px; padding: 2rem;'
  });

  content.innerHTML = `
    <h3 style="margin-top:0; margin-bottom: 1.5rem;">🧮 Calculadora Auxiliar</h3>
    <div id="aux-calc-rows" style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;">
      <div style="display: grid; grid-template-columns: 80px 20px 80px 20px 80px 20px 80px 30px 1fr; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
        <div>Valor</div>
        <div></div>
        <div style="text-align: center;">Bloques <small>(1000u)</small></div>
        <div></div>
        <div style="text-align: center;">Fajos <small>(100u)</small></div>
        <div></div>
        <div style="text-align: center;">Sueltos <small>(1u)</small></div>
        <div></div>
        <div style="text-align: right;">Subtotal</div>
      </div>
      ${DENOMINATIONS.map(d => `
        <div class="denom-row" data-denom="${d}" style="display: grid; grid-template-columns: 80px 20px 80px 20px 80px 20px 80px 30px 1fr; align-items: center; gap: 0.5rem;">
          <div style="font-weight: 700; color: var(--text-main);">$ ${d.toLocaleString()}</div>
          <div style="text-align: center;">×</div>
          <input type="number" class="bill-block" data-denom="${d}" placeholder="0" min="0" style="padding: 0.5rem; border-radius: 8px; text-align: right; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);">
          <div style="text-align: center;">+</div>
          <input type="number" class="bill-batch" data-denom="${d}" placeholder="0" min="0" style="padding: 0.5rem; border-radius: 8px; text-align: right; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);">
          <div style="text-align: center;">+</div>
          <input type="number" class="bill-qty" data-denom="${d}" placeholder="0" min="0" style="padding: 0.5rem; border-radius: 8px; text-align: right; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);">
          <div style="text-align: center;">=</div>
          <div class="row-total" style="text-align: right; font-weight: 600; font-family: monospace; font-size: 1.1rem;">$ 0</div>
        </div>
      `).join('')}
    </div>
    <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: 500; font-size: 1.1rem;">Total Contado:</span>
      <span id="aux-grand-total" style="font-size: 1.8rem; font-weight: 800; color: var(--primary);">$ 0</span>
    </div>
    <div style="display: flex; gap: 1rem;">
      <button id="aux-calc-close" class="btn-cancel" style="flex: 1; padding: 0.85rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cerrar</button>
      <button id="aux-calc-clear" class="btn-secondary" style="flex: 1; padding: 0.85rem; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer;">🗑️ Limpiar</button>
      <button id="aux-calc-print" class="btn-primary" style="flex: 2; padding: 0.85rem; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer;">🖨️ Imprimir Recuento</button>
    </div>
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const rowElements = content.querySelectorAll('.denom-row');
  const grandTotalEl = content.querySelector('#aux-grand-total');
  const allInputs = content.querySelectorAll('.bill-block, .bill-batch, .bill-qty');

  const updateGrandTotal = () => {
    let grand = 0;
    const breakdown = {};
    rowElements.forEach(row => {
      const blockInput = row.querySelector('.bill-block');
      const batchInput = row.querySelector('.bill-batch');
      const qtyInput = row.querySelector('.bill-qty');
      const d = parseInt(blockInput.dataset.denom);
      
      const blocks = parseInt(blockInput.value) || 0;
      const batches = parseInt(batchInput.value) || 0;
      const qtys = parseInt(qtyInput.value) || 0;
      
      const rowTotal = ((blocks * 1000) + (batches * 100) + qtys) * d;
      grand += rowTotal;
      row.querySelector('.row-total').textContent = '$ ' + rowTotal.toLocaleString('es-AR');
      
      breakdown[d] = { blocks, batches, qtys, subtotal: rowTotal };
    });
    
    grandTotalEl.textContent = '$ ' + grand.toLocaleString('es-AR');
    return { grand, breakdown };
  };

  allInputs.forEach(input => input.addEventListener('input', updateGrandTotal));

  content.querySelector('#aux-calc-close').onclick = () => overlay.remove();
  
  content.querySelector('#aux-calc-clear').onclick = () => {
    allInputs.forEach(input => input.value = '');
    updateGrandTotal();
  };

  content.querySelector('#aux-calc-print').onclick = () => {
    const { grand, breakdown } = updateGrandTotal();
    if (grand === 0) {
      alert('La calculadora está en cero. Añade billetes primero.');
      return;
    }
    printAuxiliaryCalcReport(breakdown, grand, moduleTitle);
  };
}
