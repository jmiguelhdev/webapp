// src/ui/components/SettlementModal.js
import { el } from '../../../frameworks/utils/dom.js';

/**
 * Renders the detailed settlement modal containing the interactive roughing table, manual tax inputs, and ratios.
 * @param {Object} travel - Parent travel logistics data.
 * @param {Object} producer - Targeted producer parameters.
 * @param {Object} options - Events configuration actions.
 */
export function renderSettlementModal(travel, producer, options) {
  // Sophisticated glass backdrop blur overlay
  const overlay = el('div', { 
    classes: ['modal-overlay', 'fade-in'],
    style: 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1.5rem; overflow-y: auto;' 
  });
  
  const modal = el('div', { 
    classes: ['glass-card'], 
    style: 'max-width: 850px; width: 100%; max-height: calc(100vh - 3rem); overflow-y: auto; padding: 2.25rem; border-radius: 24px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.5); margin: auto; box-sizing: border-box;' 
  });
  
  const updateContent = () => {
    const buy = travel.buy;
    modal.innerHTML = '';
    
    const title = el('h2', { 
      text: 'Detalle de Liquidación',
      style: 'margin: 0; font-size: 1.35rem; font-weight: 800; color: var(--text-main);' 
    });
    const subtitle = el('p', { 
      classes: ['card-subtitle'], 
      html: `Productor: <strong style="color: var(--text-main);">${producer.producer.name}</strong> | Viaje: <strong style="color: var(--text-main);">${travel.truck?.name || 'ID: ' + travel.id}</strong>`,
      style: 'margin: 0.35rem 0 1.75rem 0; font-size: 0.85rem; color: var(--text-muted);'
    });
    
    modal.appendChild(title);
    modal.appendChild(subtitle);
    
    // Structured Interactive Table
    const tableContainer = el('div', { 
      classes: ['table-responsive'],
      style: 'margin-bottom: 1.5rem; overflow-x: auto; background: rgba(0,0,0,0.12); padding: 0.75rem; border-radius: 16px; border: 1px solid var(--border);' 
    });
    const table = el('table', { 
      style: 'width: 100%; min-width: 650px; border-collapse: collapse; font-size: 0.82rem;',
      html: `
        <thead>
          <tr style="border-bottom: 2px solid var(--border); text-align: left; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 0.75rem;">Producto</th>
            <th style="padding: 0.75rem; text-align: center;">Cant.</th>
            <th style="padding: 0.75rem; text-align: right;">Kg Sucio</th>
            <th style="padding: 0.75rem; text-align: center;">% Desv. (Desb.)</th>
            <th style="padding: 0.75rem; text-align: right;">Kg Limpio</th>
            <th style="padding: 0.75rem; text-align: right;">Precio Vivo ($)</th>
            <th style="padding: 0.75rem; text-align: right;">Operación</th>
            <th style="padding: 0.75rem; text-align: right;">Comisión</th>
          </tr>
        </thead>
        <tbody style="font-weight: 600;">
          ${producer.listOfProducts.map((pr, idx) => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); color: var(--text-main);">
              <td style="padding: 0.75rem; font-weight: 700; color: #ffffff;">${pr.name}</td>
              <td style="padding: 0.75rem; text-align: center; color: var(--text-muted);">${pr.quantity}</td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace;">${pr.kg.toLocaleString()}</td>
              <td style="padding: 0.75rem; text-align: center;">
                <input type="number" step="0.1" value="${pr.roughing}" 
                  class="compact-input product-roughing" data-idx="${idx}"
                  style="width: 70px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); text-align: center; font-weight: 700;">
              </td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace; color: #34d399;">${pr.kgClean.toFixed(0).toLocaleString()}</td>
              <td style="padding: 0.75rem; text-align: right;">
                <input type="number" step="1" value="${pr.price}" 
                  class="compact-input product-price" data-idx="${idx}"
                  style="width: 85px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); text-align: right; font-weight: 750;">
              </td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace;">$${pr.operation.toLocaleString()}</td>
              <td style="padding: 0.75rem; text-align: right; font-family: monospace; color: var(--primary);">$${pr.commission.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      `
    });
    tableContainer.appendChild(table);
    modal.appendChild(tableContainer);
    
    // Manual IVA input switch
    const ivaManualArea = el('div', { 
      style: 'margin-bottom: 1.5rem; padding: 1.15rem 1.5rem; border: 1px solid var(--border); border-radius: 16px; background: rgba(255, 255, 255, 0.01); display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;' 
    });
    
    const isManual = producer.manualIva !== null && producer.manualIva !== undefined;
    const toggleLabel = el('label', { 
      style: 'display: flex; align-items: center; gap: 0.75rem; cursor: pointer; font-weight: 600; color: var(--text-main); margin: 0;',
      html: `
        <span style="font-size: 0.85rem;">🛠️ Usar Cálculo de IVA Manual</span>
        <label class="switch-container-m3" style="margin: 0;">
          <input type="checkbox" id="toggle-manual-iva" ${isManual ? 'checked' : ''}>
          <span class="switch-slider-m3"></span>
        </label>
      ` 
    });
    
    const manualIvaInput = el('input', { 
      attrs: { type: 'number', step: '1', value: isManual ? producer.manualIva : '', placeholder: 'Monto IVA ($)', id: 'manual-iva-input' },
      style: `padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; width: 150px; text-align: right; visibility: ${isManual ? 'visible' : 'hidden'};`
    });
    
    ivaManualArea.appendChild(toggleLabel);
    ivaManualArea.appendChild(manualIvaInput);
    modal.appendChild(ivaManualArea);
 
    // Validation ratio indicator area
    const ratio = producer.facturaOverOpRatio;
    const ratioColor = ratio < 0.4 ? '#f87171' : (ratio > 1.0 ? '#fbbf24' : '#34d399');
    const ratioMsg = ratio < 0.4 ? '⚠️ Ratio Factura/Operación muy bajo (< 40%)' : (ratio > 1.0 ? '⚠️ Ratio Factura/Operación superior al 100%' : '🛡️ Ratio Factura/Operación dentro del rango normal');
 
    const ratioArea = el('div', { 
      style: `margin-bottom: 1.5rem; padding: 0.95rem 1.25rem; border-radius: 14px; background: ${ratioColor}0d; border: 1.5px solid ${ratioColor}25; display: flex; align-items: center; gap: 0.95rem;` 
    });
    ratioArea.innerHTML = `<span style="font-size: 1.4rem;">${ratio < 0.4 || ratio > 1.0 ? '🚩' : '🛡️'}</span>
      <div style="flex: 1;">
        <div style="font-weight: 700; color: ${ratioColor}; font-size: 0.88rem;">Ratio Factura / Operación: ${(ratio * 100).toFixed(1)}%</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-top: 0.15rem;">${ratioMsg}</div>
      </div>`;
    modal.appendChild(ratioArea);
    
    // Financial Breakdown Ledger Summary Cards
    const summaryGrid = el('div', { 
      classes: ['grid-2-cols'], 
      style: 'background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); padding: 1.25rem 1.5rem; border-radius: 16px; gap: 2rem; display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 1.5rem;' 
    });
    
    const leftCol = el('div', { style: 'display: flex; flex-direction: column; gap: 0.65rem;' });
    leftCol.innerHTML = `
      <div class="detail-row"><span>Total Operación:</span> <strong>$${producer.totalOperation.toLocaleString()}</strong></div>
      <div class="detail-row"><span>Total Comisión (${producer.buy?.agent?.percent || 0}%):</span> <strong>$${producer.totalCommission.toLocaleString()}</strong></div>
      <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.25rem;"><span style="color: var(--text-main); font-weight: 700;">Op + Comisión:</span> <strong style="color: #60a5fa;">$${producer.totalOpPlusComm.toLocaleString()}</strong></div>
    `;
    
    const rightCol = el('div', { style: 'display: flex; flex-direction: column; gap: 0.65rem;' });
    rightCol.innerHTML = `
      <div class="detail-row"><span>Achique Total Viaje:</span> <strong>$${buy.reduce.toLocaleString()}</strong></div>
      <div class="detail-row"><span>Achique Prorrateado:</span> <strong style="color: #f87171;">- $${producer.achiqueProrrateado.toLocaleString()}</strong></div>
      <div class="detail-row highlight" style="border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.25rem;"><span style="color: var(--text-main); font-weight: 700;">Base Factura:</span> <strong>$${producer.totalFactura.toLocaleString()}</strong></div>
    `;
    
    summaryGrid.appendChild(leftCol);
    summaryGrid.appendChild(rightCol);
    modal.appendChild(summaryGrid);
    
    // Taxes ledgers
    const taxesArea = el('div', { 
      style: 'padding: 1.25rem; border-top: 1px dashed var(--border); border-bottom: 1px dashed var(--border); margin-bottom: 1.75rem; display: flex; flex-direction: column; gap: 0.65rem;' 
    });
    taxesArea.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--text-muted); font-weight: 500;">Neto:</span> <strong style="font-family: monospace; color: var(--text-main); font-size: 0.9rem;">$${producer.neto.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--text-muted); font-weight: 500;">IVA Consolidado (10.5%):</span> <strong style="font-family: monospace; color: var(--text-main); font-size: 0.9rem;">$${producer.iva.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.82rem;">
        <span style="color: var(--text-muted); font-weight: 500;">Retención Ganancias (2% Neto) [Separada]:</span> <strong style="font-family: monospace; color: #f87171; font-size: 0.9rem;">- $${producer.retencionGanancias.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 1.15rem; border-top: 1.5px solid var(--primary); padding-top: 1rem; margin-top: 0.5rem; align-items: center;">
        <strong style="color: #ffffff; font-weight: 800;">FACTURA (Neto + IVA):</strong> 
        <strong style="color: #34d399; font-size: 1.35rem; font-weight: 850; text-shadow: 0 0 10px rgba(52,211,153,0.15);">$${producer.totalFactura.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.95rem; padding-top: 0.5rem; align-items: center;">
        <span style="color: var(--text-muted); font-weight: 700;">TOTAL NETO A PAGAR (Factura - Retención):</span> 
        <strong style="color: #fbbf24; font-size: 1.15rem; font-weight: 800;">$${producer.totalAPagar.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
      </div>
    `;
    modal.appendChild(taxesArea);
    
    // Modal buttons actions
    const actions = el('div', { 
      classes: ['modal-actions'], 
      style: 'display: flex; gap: 1rem; justify-content: flex-end;' 
    });
    const cancelBtn = el('button', { 
      classes: ['btn-outline'], 
      text: 'Cerrar',
      style: 'padding: 0.65rem 1.5rem; border-radius: 12px; font-weight: 600;'
    });
    const saveBtn = el('button', { 
      classes: ['btn-primary'], 
      text: '💾 Guardar Liquidación', 
      style: 'background: #10b981; border: none; padding: 0.65rem 1.75rem; border-radius: 12px; font-weight: 700; color: #ffffff;' 
    });
    
    cancelBtn.onclick = () => overlay.remove();
    saveBtn.onclick = () => {
      const productUpdates = [];
      modal.querySelectorAll('.product-roughing').forEach(input => {
        const idx = parseInt(input.dataset.idx);
        const priceInput = modal.querySelector(`.product-price[data-idx="${idx}"]`);
        productUpdates.push({
          index: idx,
          roughing: parseFloat(input.value),
          price: parseFloat(priceInput.value)
        });
      });
      
      const manualIvaValue = toggleLabel.querySelector('input').checked ? parseFloat(manualIvaInput.value) : null;
      
      if (options.onUpdateSettlement) {
        options.onUpdateSettlement(travel.id, String(producer.producer.cuit || ''), productUpdates, manualIvaValue);
      }
      overlay.remove();
    };
    
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    modal.appendChild(actions);
    
    // Handle manual tax toggle changes
    toggleLabel.querySelector('input').onchange = (e) => {
      manualIvaInput.style.visibility = e.target.checked ? 'visible' : 'hidden';
      if (!e.target.checked) {
        producer.manualIva = null;
        updateContent();
      }
    };
    
    manualIvaInput.oninput = (e) => {
      producer.manualIva = parseFloat(e.target.value) || 0;
      updateContent();
      const newInp = modal.querySelector('#manual-iva-input');
      newInp.focus();
      const val = newInp.value;
      newInp.value = '';
      newInp.value = val;
    };
    
    // Live update interactive calculation binds
    modal.querySelectorAll('.product-roughing, .product-price').forEach(input => {
      input.oninput = (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const rough = modal.querySelector(`.product-roughing[data-idx="${idx}"]`).value;
        const price = modal.querySelector(`.product-price[data-idx="${idx}"]`).value;
        producer.listOfProducts[idx].roughing = parseFloat(rough) || 0;
        producer.listOfProducts[idx].price = parseFloat(price) || 0;
        
        updateContent();
        
        const className = e.target.classList.contains('product-roughing') ? '.product-roughing' : '.product-price';
        const newInp = modal.querySelector(`${className}[data-idx="${idx}"]`);
        newInp.focus();
        const val = newInp.value;
        newInp.value = '';
        newInp.value = val;
      };
    });
  };
  
  updateContent();
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
