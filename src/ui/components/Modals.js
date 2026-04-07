import { el } from '../../utils/dom.js';

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
