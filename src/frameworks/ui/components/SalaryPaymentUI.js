/**
 * @file SalaryPaymentUI.js
 * @description Pantalla dedicada a pantalla completa para el registro y pago de sueldos en Caja General.
 * Reemplaza el modal flotante por una interfaz limpia con autocompletado y soporte responsive.
 * @module ui/components/SalaryPaymentUI
 */
import { el } from '../../../frameworks/utils/dom.js';
import { formatCurrency } from '../../../frameworks/utils/formatters.js';
import { showBillCalculator } from './AccountingModals.js';

/**
 * Renderiza la pantalla dedicada de Pago de Sueldos.
 * @param {HTMLElement} container - Contenedor principal del DOM.
 * @param {Object} options - Parámetros { establishments, initialData, onSave, onBack }
 */
export function renderSalaryPaymentScreen(container, { establishments = [], initialData = null, onSave, onBack }) {
  container.innerHTML = '';

  let currentBillCounts = null;
  let selectedLogIds = initialData?.selectedLogIds || [];

  const wrapper = el('div', {
    classes: ['salary-screen-wrapper', 'fade-in'],
    style: 'width: 100%; padding-bottom: 3rem;'
  });

  // ---- Header con botón Volver ----
  const header = el('div', {
    classes: ['dashboard-header'],
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;'
  });

  const titleGroup = el('div', { style: 'display: flex; align-items: center; gap: 1rem;' });
  const backBtn = el('button', {
    classes: ['back-btn-m3'],
    html: '<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>',
    attrs: { title: 'Volver a Caja General' }
  });
  backBtn.onclick = () => {
    if (typeof onBack === 'function') onBack();
  };

  titleGroup.appendChild(backBtn);
  titleGroup.appendChild(el('div', {
    html: `<h1 style="margin:0; font-size: 1.5rem;">💳 Registro y Pago de Haberes / Sueldo</h1>
           <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">Caja General • Salida de Efectivo para Pago de Personal</div>`
  }));
  header.appendChild(titleGroup);

  const statusBadge = el('div', {
    html: `<span style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 700; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem;">🔴 Egreso de Caja General</span>`
  });
  header.appendChild(statusBadge);

  wrapper.appendChild(header);

  // ---- Formulario Principal en Card ----
  const card = el('div', {
    classes: ['glass-card'],
    style: 'padding: 2rem; max-width: 900px; margin: 0 auto;'
  });

  const initialFormattedVal = initialData?.totalAmount !== undefined && initialData?.totalAmount !== null 
    ? (Math.round(parseFloat(initialData.totalAmount) * 100) / 100).toFixed(2) 
    : '';

  card.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 1.5rem; font-size: 1.15rem; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
      ✍️ Datos del Pago de Sueldo
    </h3>

    <form id="salary-screen-form">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="form-group">
          <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Sucursal / Establecimiento</label>
          <select id="est-select" required style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-size: 1rem; font-weight: 600;">
            <option value="">Seleccione una sucursal...</option>
            ${establishments.map(est => `<option value="${est.id}">${est.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Empleado</label>
          <select id="emp-select" required disabled style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-size: 1rem; font-weight: 600;">
            <option value="">Primero seleccione sucursal...</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="font-weight: 600; margin: 0;">Monto a Pagar ($)</label>
            <select id="round-amount-select" style="font-size: 0.78rem; padding: 0.2rem 0.5rem; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: #60a5fa; font-weight: 600;">
              <option value="exact">Exacto (2 decimales)</option>
              <option value="500">Múltiplo de $ 500</option>
              <option value="1000">Múltiplo de $ 1.000</option>
            </select>
          </div>
          <input type="number" step="0.01" name="amount" id="expected-amount-input" required placeholder="0.00" 
                 style="font-size: 1.3rem; font-weight: 800; width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--success);"
                 value="${initialFormattedVal}">
        </div>


        <div class="form-group">
          <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Recuento de Billetes Físicos ($)</label>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem;">
            <input type="number" step="0.01" name="countedAmount" id="counted-amount-input" placeholder="Opcional" 
                   style="font-size: 1.3rem; font-weight: 800; width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);">
            <button type="button" id="open-calc-btn" class="btn-secondary" style="white-space: nowrap; padding: 0 1.25rem; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;" title="Abrir calculadora de billetes">
              🧮 Calc.
            </button>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Concepto / Detalle en Libro Diario</label>
        <input type="text" name="description" id="description-input" required 
               style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);"
               value="${initialData?.periodSummary || 'Pago Sueldo: '}">
      </div>

      <div style="margin-bottom: 1.5rem;">
        <label style="display: inline-flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.9rem; user-select: none;">
          <input type="checkbox" id="save-breakdown-chk"> 
          <span>Adjuntar arqueo detallado de billetes al recibo de sueldo</span>
        </label>
      </div>

      <div id="diff-container" style="display: none; margin-bottom: 1.5rem; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; text-align: center; font-size: 1.05rem; border: 1px solid transparent;"></div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; align-items: center; border-top: 1px solid var(--border); padding-top: 1.5rem; flex-wrap: wrap;">
        <button type="button" class="btn-cancel cancel-btn" style="padding: 0.9rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">
          ← Volver sin registrar
        </button>
        <button type="submit" style="padding: 0.9rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 1.05rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.3); letter-spacing: 0.02em;">
          ✓ Confirmar y Registrar Pago de Sueldo
        </button>
      </div>
    </form>
  `;

  wrapper.appendChild(card);
  container.appendChild(wrapper);

  const form = wrapper.querySelector('#salary-screen-form');
  const estSelect = wrapper.querySelector('#est-select');
  const empSelect = wrapper.querySelector('#emp-select');
  const expectedAmountInput = wrapper.querySelector('#expected-amount-input');
  const roundAmountSelect = wrapper.querySelector('#round-amount-select');
  const countedAmountInput = wrapper.querySelector('#counted-amount-input');
  const descriptionInput = wrapper.querySelector('#description-input');
  const diffContainer = wrapper.querySelector('#diff-container');
  const saveBreakdownChk = wrapper.querySelector('#save-breakdown-chk');

  let rawBaseAmount = parseFloat(expectedAmountInput.value) || 0;

  expectedAmountInput.addEventListener('change', () => {
    rawBaseAmount = parseFloat(expectedAmountInput.value) || 0;
  });

  if (roundAmountSelect) {
    roundAmountSelect.addEventListener('change', () => {
      const mode = roundAmountSelect.value;
      let val = rawBaseAmount;
      if (mode === '500') {
        val = Math.round(val / 500) * 500;
      } else if (mode === '1000') {
        val = Math.round(val / 1000) * 1000;
      } else {
        val = Math.round(val * 100) / 100;
      }
      expectedAmountInput.value = val.toFixed(2);
      updateDiff();
    });
  }


  const populateEmployees = (estId, targetEmpId = null) => {
    empSelect.innerHTML = '<option value="">Seleccione un empleado...</option>';
    if (estId) {
      const est = establishments.find(e => e.id === estId);
      if (est && est.employees && est.employees.length > 0) {
        est.employees.forEach(emp => {
          const selectedAttr = targetEmpId && emp.id === targetEmpId ? 'selected' : '';
          empSelect.innerHTML += `<option value="${emp.id}" data-name="${emp.name}" data-dni="${emp.dni || ''}" data-position="${emp.position || ''}" ${selectedAttr}>${emp.name} ${emp.position ? `(${emp.position})` : ''}</option>`;
        });
        empSelect.disabled = false;
      } else {
        empSelect.innerHTML = '<option value="">No hay empleados en esta sucursal</option>';
        empSelect.disabled = true;
      }
    } else {
      empSelect.disabled = true;
    }
  };

  estSelect.addEventListener('change', () => {
    populateEmployees(estSelect.value);
  });

  empSelect.addEventListener('change', () => {
    const selectedEmpOption = empSelect.selectedOptions[0];
    if (selectedEmpOption && selectedEmpOption.dataset.name) {
      if (!descriptionInput.value || descriptionInput.value.startsWith('Pago Sueldo:')) {
        descriptionInput.value = `Pago Sueldo: ${selectedEmpOption.dataset.name}`;
      }
    }
  });

  // Precargar si venimos desde Sucursales con initialData
  if (initialData?.establishment?.id) {
    estSelect.value = initialData.establishment.id;
    populateEmployees(initialData.establishment.id, initialData.employee?.id);
  }

  const updateDiff = () => {
    const exp = parseFloat(expectedAmountInput.value);
    const count = parseFloat(countedAmountInput.value);
    if (!isNaN(exp) && !isNaN(count)) {
      const diff = count - exp;
      diffContainer.style.display = 'block';
      if (Math.abs(diff) < 0.01) {
        diffContainer.style.background = 'rgba(255,255,255,0.05)';
        diffContainer.style.borderColor = 'var(--border)';
        diffContainer.style.color = 'var(--text-main)';
        diffContainer.textContent = 'Diferencia en Caja: OK (Monto abonado y contado coinciden)';
      } else if (diff > 0) {
        diffContainer.style.background = 'rgba(16,185,129,0.1)';
        diffContainer.style.borderColor = 'rgba(16,185,129,0.3)';
        diffContainer.style.color = '#10b981';
        diffContainer.textContent = `Sobra en Arqueo: ${formatCurrency(diff)}`;
      } else {
        diffContainer.style.background = 'rgba(239,68,68,0.1)';
        diffContainer.style.borderColor = 'rgba(239,68,68,0.3)';
        diffContainer.style.color = '#ef4444';
        diffContainer.textContent = `Falta en Arqueo: ${formatCurrency(Math.abs(diff))}`;
      }
    } else {
      diffContainer.style.display = 'none';
    }
  };

  expectedAmountInput.addEventListener('input', updateDiff);
  countedAmountInput.addEventListener('input', updateDiff);
  updateDiff();

  wrapper.querySelector('#open-calc-btn').onclick = () => {
    showBillCalculator(
      parseFloat(expectedAmountInput.value) || 0,
      (result) => {
        countedAmountInput.value = result.grand;
        currentBillCounts = result.breakdown;
        saveBreakdownChk.checked = true;
        updateDiff();
      }
    );
  };

  form.onsubmit = (e) => {
    e.preventDefault();

    const selectedEmpOption = empSelect.selectedOptions[0];
    const employeeName = selectedEmpOption ? selectedEmpOption.dataset.name : '';
    const employeeDni = selectedEmpOption ? selectedEmpOption.dataset.dni : '';
    const employeePosition = selectedEmpOption ? selectedEmpOption.dataset.position : '';

    const countedVal = countedAmountInput.value;

    const data = {
      type: 'OUT',
      description: descriptionInput.value,
      amount: parseFloat(expectedAmountInput.value),
      countedAmount: countedVal ? parseFloat(countedVal) : null,
      billCounts: saveBreakdownChk.checked ? currentBillCounts : null,
      isSalary: true,
      establishmentId: estSelect.value,
      employeeId: empSelect.value,
      employeeName,
      employeeDni,
      employeePosition,
      selectedLogIds
    };

    onSave(data);
  };

  wrapper.querySelector('.cancel-btn').onclick = () => {
    if (typeof onBack === 'function') onBack();
  };
}
