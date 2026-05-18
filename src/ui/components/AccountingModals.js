/**
 * AccountingModals.js
 * Módulo que encapsula todos los modales interactivos del módulo de Contabilidad:
 *  - showEntryModal: formulario de nuevo/editar movimiento contable.
 *  - showSalaryPaymentModal: formulario de pago de haberes a empleados.
 *  - showBillCalculator: calculadora de recuento físico de billetes (breakdown).
 */
import { el } from '../../utils/dom.js';
import { formatCurrency } from '../../utils/formatters.js';

/** Denominaciones de billetes disponibles para el recuento. */
const DENOMINATIONS = [20000, 10000, 2000, 1000, 500, 200, 100];

// ---------------------------------------------------------------------------
// Helper: DiffContainer
// ---------------------------------------------------------------------------

/**
 * Construye el updater de diferencia entre monto esperado y contado.
 * Reutilizado por showEntryModal y showSalaryPaymentModal.
 */
function buildDiffUpdater(expectedInput, countedInput, diffContainer) {
  return () => {
    const exp = parseFloat(expectedInput.value);
    const count = parseFloat(countedInput.value);
    if (!isNaN(exp) && !isNaN(count)) {
      const diff = count - exp;
      diffContainer.style.display = 'block';
      if (diff === 0) {
        diffContainer.style.background = 'rgba(255,255,255,0.05)';
        diffContainer.style.borderColor = 'var(--border)';
        diffContainer.style.color = 'var(--text-main)';
        diffContainer.textContent = 'Diferencias cuadradas (Monto y Caja son iguales)';
      } else if (diff > 0) {
        diffContainer.style.background = 'rgba(16,185,129,0.1)';
        diffContainer.style.borderColor = 'rgba(16,185,129,0.3)';
        diffContainer.style.color = '#10b981';
        diffContainer.textContent = `Sobra en Caja: ${formatCurrency(diff)}`;
      } else {
        diffContainer.style.background = 'rgba(239,68,68,0.1)';
        diffContainer.style.borderColor = 'rgba(239,68,68,0.3)';
        diffContainer.style.color = '#ef4444';
        diffContainer.textContent = `Falta en Caja: ${formatCurrency(Math.abs(diff))}`;
      }
    } else {
      diffContainer.style.display = 'none';
    }
  };
}

// ---------------------------------------------------------------------------
// showEntryModal
// ---------------------------------------------------------------------------

/**
 * Muestra el modal de creación o edición de un movimiento contable.
 * @param {object|null} existingEntry - Entrada existente para edición, o null para nueva.
 * @param {{ clients, producers, onSave, title }} deps
 */
export function showEntryModal(existingEntry, { clients, producers, onSave, title = 'Contabilidad' }) {
  let currentBillCounts = existingEntry?.billCounts || null;

  const modal = el('div', {
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;'
  });

  const content = el('div', {
    classes: ['glass-card'],
    style: 'width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 2rem;'
  });

  content.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 2rem;">${existingEntry ? 'Editar' : 'Nuevo'} Movimiento de ${title}</h2>
    
    <form id="accounting-form">
      <div style="margin-bottom: 1.5rem; display: flex; gap: 1.5rem; flex-wrap: wrap;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="type" value="IN" ${!existingEntry || existingEntry.type === 'IN' ? 'checked' : ''}> <span style="color: var(--success); font-weight: 600;">Ingreso (+)</span>
        </label>
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="type" value="OUT" ${existingEntry && existingEntry.type === 'OUT' ? 'checked' : ''}> <span style="color: var(--danger); font-weight: 600;">Egreso (-)</span>
        </label>
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="type" value="WITHDRAWAL" ${existingEntry && existingEntry.type === 'WITHDRAWAL' ? 'checked' : ''}> <span style="color: #8b5cf6; font-weight: 600;">Retiro / Ajuste (-)</span>
        </label>
      </div>

      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Descripción / Concepto</label>
        <input type="text" name="description" required placeholder="Ej: Pago de flete, Cobro venta meat..." value="${existingEntry?.description || ''}">
      </div>

      <div class="responsive-grid-2" style="margin-bottom: 1.5rem;">
        <div class="form-group">
          <label>Cliente (Opcional)</label>
          <input type="text" id="client-input" list="clients-datalist" placeholder="🔎 Buscar cliente..." autocomplete="off" value="${existingEntry?.clientName || ''}">
          <datalist id="clients-datalist">
            ${clients.map(c => `<option value="${c.name}"></option>`).join('')}
          </datalist>
        </div>
        <div class="form-group">
          <label>Productor (Opcional)</label>
          <input type="text" id="producer-input" list="producers-datalist" placeholder="🔎 Buscar productor..." autocomplete="off" value="${existingEntry?.producerName || ''}">
          <datalist id="producers-datalist">
            ${producers.map(p => `<option value="${p.name}"></option>`).join('')}
          </datalist>
        </div>
      </div>

      <div class="responsive-grid-2" style="margin-bottom: 1rem;">
        <div class="form-group">
          <label>Monto Esperado ($)</label>
          <input type="number" step="0.01" name="amount" id="expected-amount-input" required placeholder="0.00" style="font-size: 1.25rem; font-weight: 700;" value="${existingEntry?.amount || ''}">
        </div>
        <div class="form-group">
          <label>Monto Contado (Físico) ($)</label>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem;">
            <input type="number" step="0.01" name="countedAmount" id="counted-amount-input" placeholder="Opcional" style="width: 100%; font-size: 1.25rem; font-weight: 700;" value="${existingEntry?.countedAmount !== undefined ? existingEntry.countedAmount : ''}">
            <button type="button" id="open-calc-btn" class="btn-secondary" style="white-space: nowrap; padding: 0 1rem; border-radius: 8px;">🧮 Calc.</button>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem;">
          <input type="checkbox" id="save-breakdown-chk" ${existingEntry?.billCounts ? 'checked' : ''}> 
          <span>Guardar detalle de billetes ( breakdown )</span>
        </label>
      </div>

      <div id="diff-container" style="display: none; margin-bottom: 1.5rem; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; text-align: center; font-size: 1.1rem; border: 1px solid transparent;"></div>

      <div style="display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 1rem; margin-top: 2rem; align-items: center;">
        <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cancelar</button>
        <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; font-size: 1rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(99,102,241,0.4); letter-spacing: 0.03em;">Guardar</button>
      </div>
    </form>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const form = content.querySelector('#accounting-form');
  const expectedAmountInput = content.querySelector('#expected-amount-input');
  const countedAmountInput = content.querySelector('#counted-amount-input');
  const diffContainer = content.querySelector('#diff-container');
  const saveBreakdownChk = content.querySelector('#save-breakdown-chk');

  const updateDiff = buildDiffUpdater(expectedAmountInput, countedAmountInput, diffContainer);

  expectedAmountInput.addEventListener('input', updateDiff);
  countedAmountInput.addEventListener('input', updateDiff);
  if (existingEntry) updateDiff();

  content.querySelector('#open-calc-btn').onclick = () => showBillCalculator(
    parseFloat(expectedAmountInput.value) || 0,
    (result) => {
      countedAmountInput.value = result.grand;
      currentBillCounts = result.breakdown;
      saveBreakdownChk.checked = true;
      updateDiff();
    }
  );

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const clientNameInput = form.querySelector('#client-input').value.trim().toLowerCase();
    const producerNameInput = form.querySelector('#producer-input').value.trim().toLowerCase();

    const matchedClient = clients.find(c => c.name.toLowerCase().trim() === clientNameInput);
    const matchedProducer = producers.find(p => p.name.toLowerCase().trim() === producerNameInput);

    const countedVal = formData.get('countedAmount');

    const data = {
      id: existingEntry ? existingEntry.id : undefined,
      type: formData.get('type'),
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      countedAmount: countedVal ? parseFloat(countedVal) : null,
      billCounts: saveBreakdownChk.checked ? currentBillCounts : null,
      clientId: matchedClient ? matchedClient.id : null,
      clientName: matchedClient ? matchedClient.name : (clientNameInput || null),
      clientCuit: matchedClient ? (matchedClient.cuit || null) : null,
      producerCuit: matchedProducer ? matchedProducer.cuit : null,
      producerName: matchedProducer ? matchedProducer.name : (producerNameInput || null)
    };
    onSave(data);
    modal.remove();
  };

  content.querySelector('.btn-cancel').onclick = () => modal.remove();
}

// ---------------------------------------------------------------------------
// showSalaryPaymentModal
// ---------------------------------------------------------------------------

/**
 * Muestra el modal de pago de haberes a empleados de un establecimiento.
 * @param {{ establishments, onSave, title }} deps
 */
export function showSalaryPaymentModal({ establishments, onSave, title }) {
  let currentBillCounts = null;

  const modal = el('div', {
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;'
  });

  const content = el('div', {
    classes: ['glass-card'],
    style: 'width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 2rem;'
  });

  content.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 2rem;">Pago de Sueldos - ${title}</h2>
    
    <form id="salary-form">
      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Sucursal / Establecimiento</label>
        <select id="est-select" required style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);">
          <option value="">Seleccione una sucursal...</option>
          ${establishments.map(est => `<option value="${est.id}">${est.name}</option>`).join('')}
        </select>
      </div>

      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Empleado</label>
        <select id="emp-select" required disabled style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);">
          <option value="">Primero seleccione sucursal...</option>
        </select>
      </div>

      <div class="responsive-grid-2" style="margin-bottom: 1rem;">
        <div class="form-group">
          <label>Monto a Pagar ($)</label>
          <input type="number" step="0.01" name="amount" id="expected-amount-input" required placeholder="0.00" style="font-size: 1.25rem; font-weight: 700;">
        </div>
        <div class="form-group">
          <label>Detalle de Billetes (Opcional)</label>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem;">
            <input type="number" step="0.01" name="countedAmount" id="counted-amount-input" placeholder="Monto Físico" style="width: 100%; font-size: 1.25rem; font-weight: 700;">
            <button type="button" id="open-calc-btn" class="btn-secondary" style="white-space: nowrap; padding: 0 1rem; border-radius: 8px;">🧮 Calc.</button>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem;">
          <input type="checkbox" id="save-breakdown-chk"> 
          <span>Guardar detalle de billetes ( breakdown )</span>
        </label>
      </div>

      <div id="diff-container" style="display: none; margin-bottom: 1.5rem; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; text-align: center; font-size: 1.1rem; border: 1px solid transparent;"></div>

      <div style="display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 1rem; margin-top: 2rem; align-items: center;">
        <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cancelar</button>
        <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 1rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.4); letter-spacing: 0.03em;">Registrar Pago</button>
      </div>
    </form>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const form = content.querySelector('#salary-form');
  const estSelect = content.querySelector('#est-select');
  const empSelect = content.querySelector('#emp-select');
  const expectedAmountInput = content.querySelector('#expected-amount-input');
  const countedAmountInput = content.querySelector('#counted-amount-input');
  const diffContainer = content.querySelector('#diff-container');
  const saveBreakdownChk = content.querySelector('#save-breakdown-chk');

  estSelect.addEventListener('change', () => {
    const selectedEstId = estSelect.value;
    empSelect.innerHTML = '<option value="">Seleccione un empleado...</option>';
    if (selectedEstId) {
      const est = establishments.find(e => e.id === selectedEstId);
      if (est && est.employees && est.employees.length > 0) {
        est.employees.forEach(emp => {
          empSelect.innerHTML += `<option value="${emp.id}" data-name="${emp.name}" data-dni="${emp.dni || ''}" data-position="${emp.position || ''}">${emp.name} ${emp.position ? `(${emp.position})` : ''}</option>`;
        });
        empSelect.disabled = false;
      } else {
        empSelect.innerHTML = '<option value="">No hay empleados en esta sucursal</option>';
        empSelect.disabled = true;
      }
    } else {
      empSelect.disabled = true;
    }
  });

  const updateDiff = buildDiffUpdater(expectedAmountInput, countedAmountInput, diffContainer);
  expectedAmountInput.addEventListener('input', updateDiff);
  countedAmountInput.addEventListener('input', updateDiff);

  content.querySelector('#open-calc-btn').onclick = () => showBillCalculator(
    parseFloat(expectedAmountInput.value) || 0,
    (result) => {
      countedAmountInput.value = result.grand;
      currentBillCounts = result.breakdown;
      saveBreakdownChk.checked = true;
      updateDiff();
    }
  );

  form.onsubmit = (e) => {
    e.preventDefault();

    const selectedEmpOption = empSelect.selectedOptions[0];
    const employeeName = selectedEmpOption.dataset.name;
    const employeeDni = selectedEmpOption.dataset.dni;
    const employeePosition = selectedEmpOption.dataset.position;

    const countedVal = countedAmountInput.value;

    const data = {
      type: 'OUT',
      description: `Pago Sueldo: ${employeeName}`,
      amount: parseFloat(expectedAmountInput.value),
      countedAmount: countedVal ? parseFloat(countedVal) : null,
      billCounts: saveBreakdownChk.checked ? currentBillCounts : null,
      isSalary: true,
      establishmentId: estSelect.value,
      employeeId: empSelect.value,
      employeeName: employeeName,
      employeeDni: employeeDni,
      employeePosition: employeePosition
    };

    onSave(data);
    modal.remove();
  };

  content.querySelector('.btn-cancel').onclick = () => modal.remove();
}

// ---------------------------------------------------------------------------
// showBillCalculator
// ---------------------------------------------------------------------------

/**
 * Muestra la calculadora de recuento físico de billetes.
 * @param {number} expectedAmount - Monto esperado para calcular la diferencia.
 * @param {function} onApply - Callback que recibe { grand, breakdown }.
 */
export function showBillCalculator(expectedAmount, onApply) {
  const modal = el('div', {
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;'
  });

  const content = el('div', {
    classes: ['glass-card'],
    style: 'width: 100%; max-width: 600px; padding: 2rem;'
  });

  content.innerHTML = `
    <h3 style="margin-top:0; margin-bottom: 1.5rem;">🔢 Recuento de Billetes</h3>
    <div class="table-responsive">
      <div id="calc-rows" style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; min-width: 600px;">
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
    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <span style="font-weight: 500; font-size: 0.9rem; color: var(--text-muted);">Monto Esperado:</span>
        <span style="font-weight: 600;">${expectedAmount > 0 ? formatCurrency(expectedAmount) : 'No especificado'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 500;">Total Contado:</span>
        <span id="calc-grand-total" style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">$ 0</span>
      </div>
      <div id="calc-diff-container" style="display: none; justify-content: space-between; align-items: center; padding-top: 0.75rem; margin-top: 0.75rem; border-top: 1px dashed rgba(255,255,255,0.1);">
         <span style="font-weight: 500; font-size: 0.9rem;">Diferencia:</span>
         <span id="calc-diff-val" style="font-weight: 700; font-size: 1.1rem;"></span>
      </div>
    </div>
    <div style="display: flex; gap: 1rem;">
      <button id="calc-cancel" class="btn-cancel" style="flex: 1; padding: 0.85rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cerrar</button>
      <button id="calc-apply" style="flex: 2; padding: 0.85rem; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 1rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.4); letter-spacing: 0.03em;">Usar Total ✓</button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const rowElements = content.querySelectorAll('.denom-row');
  const grandTotalEl = content.querySelector('#calc-grand-total');
  const allInputs = content.querySelectorAll('.bill-block, .bill-batch, .bill-qty');

  const updateGrandTotal = () => {
    let grand = 0;
    const breakdown = {};
    rowElements.forEach(row => {
      const blockInput = row.querySelector('.bill-block');
      const batchInput = row.querySelector('.bill-batch');
      const qtyInput = row.querySelector('.bill-qty');
      const d = parseInt(batchInput.dataset.denom);

      const blocks = parseInt(blockInput.value) || 0;
      const batches = parseInt(batchInput.value) || 0;
      const qtys = parseInt(qtyInput.value) || 0;

      const rowTotal = (blocks * 1000 + batches * 100 + qtys) * d;
      grand += rowTotal;
      row.querySelector('.row-total').textContent = `$ ${rowTotal.toLocaleString()}`;

      if (blocks > 0 || batches > 0 || qtys > 0) {
        breakdown[d] = { blocks, batches, qtys, subtotal: rowTotal };
      }
    });
    grandTotalEl.textContent = `$ ${grand.toLocaleString()}`;

    if (expectedAmount > 0) {
      const diffContainer = content.querySelector('#calc-diff-container');
      const diffVal = content.querySelector('#calc-diff-val');
      diffContainer.style.display = 'flex';
      const diff = grand - expectedAmount;
      if (diff === 0) {
        diffVal.textContent = 'OK';
        diffVal.style.color = 'var(--text-main)';
      } else if (diff > 0) {
        diffVal.textContent = `Sobra ${formatCurrency(diff)}`;
        diffVal.style.color = '#10b981';
      } else {
        diffVal.textContent = `Falta ${formatCurrency(Math.abs(diff))}`;
        diffVal.style.color = '#ef4444';
      }
    }
    return { grand, breakdown };
  };

  allInputs.forEach(input => input.addEventListener('input', updateGrandTotal));

  content.querySelector('#calc-cancel').onclick = () => modal.remove();
  content.querySelector('#calc-apply').onclick = () => {
    const result = updateGrandTotal();
    onApply(result);
    modal.remove();
  };
}
