/**
 * @file EmployeeTimeLogUI.js
 * @description Pantalla dedicada a pantalla completa para el control de asistencia, fichadas, tarifas y liquidación de sueldos por empleado.
 * @module ui/components/EmployeeTimeLogUI
 */
import { el } from '../../../frameworks/utils/dom.js';
import { formatCurrency, formatDate, formatTime } from '../../../frameworks/utils/formatters.js';
import { calculatePayment } from '../../../adapters/api/TimeLogApi.js';

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Retorna si un timestamp en milisegundos pertenece a la semana actual (desde el sábado pasado a las 00:00).
 * @param {number} timestamp 
 * @returns {boolean}
 */
function isLogFromCurrentWeek(timestamp) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Lunes... 6 = Sábado
  
  // Calcular el sábado anterior
  const daysSincePrevSaturday = (dayOfWeek + 1) % 7; 
  const prevSaturday = new Date(now);
  prevSaturday.setDate(now.getDate() - daysSincePrevSaturday);
  prevSaturday.setHours(0, 0, 0, 0);

  return timestamp >= prevSaturday.getTime();
}

/**
 * Renderiza la pantalla dedicada de asistencia y liquidación de sueldo del empleado.
 * @param {HTMLElement} container - Contenedor del DOM.
 * @param {Object} options - Parámetros { establishment, employee, timeLogs, onSaveRates, onNavigateToSalaryPayment, onBack }
 */
export function renderEmployeeTimeLogScreen(container, { establishment, employee, timeLogs = [], onSaveRates, onNavigateToSalaryPayment, onBack }) {
  container.innerHTML = '';

  const wrapper = el('div', {
    classes: ['employee-timelog-wrapper', 'fade-in'],
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
    attrs: { title: `Volver a Personal de ${establishment.name}` }
  });
  backBtn.onclick = () => {
    if (typeof onBack === 'function') onBack();
  };

  titleGroup.appendChild(backBtn);
  titleGroup.appendChild(el('div', {
    html: `<h1 style="margin:0; font-size: 1.5rem;">⏱️ Asistencia y Liquidación: ${employee.name}</h1>
           <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">Sucursal: ${establishment.name} • DNI: ${employee.dni || '-'} • Puesto: ${employee.position || 'Operario'}</div>`
  }));
  header.appendChild(titleGroup);

  const typeLabel = employee.paymentType === 'FIXED_DAILY' ? `Jornada Fija (${formatCurrency(employee.dailyFixedRate || 0)})` : `Por Hora (${formatCurrency(employee.hourlyRate || 0)}/h)`;

  const typeBadge = el('div', {
    html: `<span style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); font-weight: 700; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem;">
             Esquema: ${typeLabel}
           </span>`
  });
  header.appendChild(typeBadge);
  wrapper.appendChild(header);

  // ---- Formulario Configuración de Tarifas (Inline) ----
  const ratesCard = el('div', {
    classes: ['glass-card'],
    style: 'padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;'
  });

  ratesCard.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.05rem; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
      ⚙️ Tarifas y Modalidad de Pago del Empleado
    </h3>
    
    <form id="rates-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: end;">
      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Modalidad de Pago</label>
        <select id="payment-type-select" name="paymentType" style="width: 100%; padding: 0.6rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-weight: 600;">
          <option value="HOURLY" ${employee.paymentType === 'HOURLY' ? 'selected' : ''}>Por Hora Trabajada</option>

          <option value="FIXED_DAILY" ${employee.paymentType === 'FIXED_DAILY' ? 'selected' : ''}>Jornada Fija por Día</option>
        </select>
      </div>

      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Tarifa por Hora ($/h)</label>
        <input type="number" step="0.01" name="hourlyRate" value="${employee.hourlyRate || ''}" placeholder="0.00" style="width: 100%; padding: 0.6rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-weight: 700;">
      </div>

      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Tarifa Jornada Fija ($/día)</label>
        <input type="number" step="0.01" name="dailyFixedRate" value="${employee.dailyFixedRate || ''}" placeholder="0.00" style="width: 100%; padding: 0.6rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-weight: 700;">
      </div>

      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Horario Salida Fija (HH:mm)</label>
        <input type="text" name="fixedDailyDepartureTime" value="${employee.fixedDailyDepartureTime || '17:00'}" placeholder="17:00" style="width: 100%; padding: 0.6rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-weight: 600;">
      </div>

      <div>
        <button type="submit" class="btn-primary" style="width: 100%; padding: 0.65rem; border-radius: 8px; font-weight: 700; background: linear-gradient(135deg, #6366f1, #4f46e5);">
          💾 Actualizar Tarifas
        </button>
      </div>
    </form>
  `;

  wrapper.appendChild(ratesCard);

  const ratesForm = ratesCard.querySelector('#rates-form');
  ratesForm.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(ratesForm);
    const updatedRates = {
      paymentType: formData.get('paymentType'),
      hourlyRate: parseFloat(formData.get('hourlyRate')) || 0,
      dailyFixedRate: parseFloat(formData.get('dailyFixedRate')) || 0,
      fixedDailyDepartureTime: formData.get('fixedDailyDepartureTime') || '17:00'
    };

    if (typeof onSaveRates === 'function') {
      await onSaveRates(updatedRates);
    }
  };

  // ---- Tarjetas de Resumen & Botón de Acción a Caja ----
  const summaryGrid = el('div', {
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;'
  });

  const hoursCard = el('div', { classes: ['glass-card'], style: 'padding: 1.25rem; border-left: 4px solid #3b82f6;' });
  hoursCard.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Horas Seleccionadas</div><div id="stat-hours" style="font-size: 1.5rem; font-weight: 800; color: #60a5fa;">0.0 hs</div>`;

  const daysCard = el('div', { classes: ['glass-card'], style: 'padding: 1.25rem; border-left: 4px solid #8b5cf6;' });
  daysCard.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Días Seleccionados</div><div id="stat-days" style="font-size: 1.5rem; font-weight: 800; color: #a78bfa;">0 días</div>`;

  const amountCard = el('div', { classes: ['glass-card'], style: 'padding: 1rem 1.25rem; border-left: 4px solid #10b981; display: flex; flex-direction: column; justify-content: space-between;' });
  amountCard.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Total a Liquidar</span>
      <select id="round-mode-select" style="font-size: 0.75rem; padding: 0.15rem 0.4rem; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: #60a5fa; font-weight: 600;">
        <option value="exact">Exacto (2 dec)</option>
        <option value="500">Múltiplo $ 500</option>
        <option value="1000">Múltiplo $ 1.000</option>
      </select>
    </div>
    <div id="stat-amount" style="font-size: 1.5rem; font-weight: 800; color: #10b981;">$ 0,00</div>
  `;


  const actionCard = el('div', { classes: ['glass-card'], style: 'padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: center;' });
  actionCard.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 0.4rem; width: 100%;">
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">
        <span>Caja de Destino:</span>
        <select id="target-caja-select" style="padding: 0.2rem 0.5rem; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: #60a5fa; font-weight: 700; font-size: 0.8rem;">
          <option value="accounting">🏛️ Caja General</option>
          <option value="frigorifico">🥩 Caja Frigorífico</option>
        </select>
      </div>
      <button type="button" id="pay-btn" class="btn-primary" style="width: 100%; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.9rem; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); border: none; box-shadow: 0 4px 15px rgba(16,185,129,0.3); cursor: pointer;">
        <span id="pay-btn-label">💳 Liquidar en Caja ($ 0,00)</span>
      </button>
    </div>
  `;
  const payBtn = actionCard.querySelector('#pay-btn');
  const targetCajaSelect = actionCard.querySelector('#target-caja-select');

  summaryGrid.appendChild(hoursCard);
  summaryGrid.appendChild(daysCard);
  summaryGrid.appendChild(amountCard);
  summaryGrid.appendChild(actionCard);


  wrapper.appendChild(summaryGrid);

  // ---- Tabla de Fichadas y Asistencia ----
  const tableCard = el('div', { classes: ['glass-card'], style: 'padding: 1.5rem;' });
  tableCard.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
      <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary);">📋 Desglose de Fichadas y Asistencia</h3>
      <div style="font-size: 0.8rem; color: var(--text-muted);">
        <span>💡 Semana actual pre-seleccionada • Semanas anteriores impagas desmarcadas</span>
      </div>
    </div>
  `;

  const tableWrapper = el('div', { style: 'background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; overflow-x: auto;' });
  const table = el('table', { style: 'width: 100%; border-collapse: collapse; font-size: 0.85rem; min-width: 750px;' });

  table.innerHTML = `
    <thead>
      <tr style="background: rgba(255,255,255,0.05); text-align: left; border-bottom: 1px solid var(--border);">
        <th style="padding: 0.75rem 1rem; text-align: center; width: 50px;">Cobrar</th>
        <th style="padding: 0.75rem 1rem;">Día y Fecha</th>
        <th style="padding: 0.75rem 1rem;">Horario (Entrada / Salida)</th>
        <th style="padding: 0.75rem 1rem; text-align: center;">Horas Trab.</th>
        <th style="padding: 0.75rem 1rem;">Modalidad / Categoría</th>
        <th style="padding: 0.75rem 1rem; text-align: right;">Subtotal ($)</th>
        <th style="padding: 0.75rem 1rem; text-align: center;">Estado</th>
      </tr>
    </thead>
  `;

  const tbody = el('tbody');

  if (timeLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding: 3rem; text-align: center; color: var(--text-muted);">
      <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Sin registros de fichadas</div>
      <div style="font-size: 0.85rem;">No se encontraron marcaciones registradas para este empleado.</div>
    </td></tr>`;
  } else {
    timeLogs.forEach(log => {
      const isPaid = log.status === 'PAID';
      const isCurrentWeek = isLogFromCurrentWeek(log.checkInTime);
      const { workedHours, totalPayment, isOvertime } = calculatePayment(log, employee);

      const tr = el('tr', { style: `border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s; ${isPaid ? 'background: rgba(16, 185, 129, 0.05);' : ''}` });
      
      const checkInDate = new Date(log.checkInTime);
      const dayName = DAYS_ES[checkInDate.getDay()];
      const formattedDateStr = `${dayName} ${formatDate(log.checkInTime)}`;
      const inTimeStr = formatTime(log.checkInTime);
      const outTimeStr = log.checkOutTime ? formatTime(log.checkOutTime) : 'Trabajando...';

      // Regla de negocio aprobada por usuario:
      // Si está impago y es de la semana actual (sábado pasado a viernes), checkbox checked = true.
      // Si está impago de semanas anteriores, checkbox checked = false.
      const defaultChecked = !isPaid && isCurrentWeek;

      const subtotalDisplay = isPaid 
        ? (log.totalPayment || totalPayment)
        : totalPayment;


      tr.innerHTML = `
        <td style="padding: 0.6rem 1rem; text-align: center;">
          <input type="checkbox" class="log-chk" data-id="${log.id}" data-date="${log.checkInTime}" data-hours="${workedHours}" data-payment="${subtotalDisplay}" 
                 ${isPaid ? 'disabled' : (defaultChecked ? 'checked' : '')}>
        </td>

        <td style="padding: 0.6rem 1rem; font-weight: 600;">
          ${formattedDateStr}
        </td>
        <td style="padding: 0.6rem 1rem; color: var(--text-main);">
          ${inTimeStr} → ${outTimeStr}
        </td>
        <td style="padding: 0.6rem 1rem; text-align: center; font-weight: 700; color: #60a5fa;">
          ${workedHours.toFixed(1)} hs
        </td>
        <td style="padding: 0.6rem 1rem;">
          ${isOvertime 
            ? `<span style="color: #f59e0b; font-weight: 700; font-size: 0.8rem;">⚡ Horas Extras</span>` 
            : `<span style="color: var(--text-muted); font-size: 0.8rem;">${employee.paymentType === 'FIXED_DAILY' ? 'Jornada Fija' : 'Por Hora'}</span>`}
        </td>
        <td style="padding: 0.6rem 1rem; text-align: right; font-weight: 700; color: #10b981; font-size: 0.95rem;">
          $ ${subtotalDisplay.toLocaleString()}
        </td>
        <td style="padding: 0.6rem 1rem; text-align: center;">
          ${isPaid 
            ? `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem;">✅ Pagado</span>`
            : `<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem;">⏳ Pendiente</span>`
          }
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  tableCard.appendChild(tableWrapper);
  wrapper.appendChild(tableCard);

  container.appendChild(wrapper);

  // Recálculo dinámico de sumatorias
  const statHoursEl = wrapper.querySelector('#stat-hours');
  const statDaysEl = wrapper.querySelector('#stat-days');
  const statAmountEl = wrapper.querySelector('#stat-amount');
  const payBtnLabel = wrapper.querySelector('#pay-btn-label');
  const roundModeSelect = wrapper.querySelector('#round-mode-select');

  const updateCalculations = () => {


    let totalHours = 0;
    let selectedDaysCount = 0;
    let rawTotal = 0;
    const selectedLogIds = [];
    const selectedTimestamps = [];

    wrapper.querySelectorAll('.log-chk:checked:not(:disabled)').forEach(chk => {
      selectedDaysCount++;
      totalHours += parseFloat(chk.dataset.hours) || 0;
      rawTotal += parseFloat(chk.dataset.payment) || 0;
      selectedLogIds.push(chk.dataset.id);
      if (chk.dataset.date) {
        selectedTimestamps.push(parseInt(chk.dataset.date));
      }
    });

    const mode = roundModeSelect ? roundModeSelect.value : 'exact';
    let totalAmount = rawTotal;
    if (mode === '500') {
      totalAmount = Math.round(rawTotal / 500) * 500;
    } else if (mode === '1000') {
      totalAmount = Math.round(rawTotal / 1000) * 1000;
    } else {
      totalAmount = Math.round(rawTotal * 100) / 100;
    }

    statHoursEl.textContent = `${totalHours.toFixed(1)} hs`;
    statDaysEl.textContent = `${selectedDaysCount} días`;
    statAmountEl.textContent = formatCurrency(totalAmount);
    payBtnLabel.textContent = `💳 Liquidar en Caja (${formatCurrency(totalAmount)})`;

    payBtn.disabled = selectedDaysCount === 0;
    payBtn.style.opacity = selectedDaysCount === 0 ? '0.5' : '1';
    payBtn.style.cursor = selectedDaysCount === 0 ? 'not-allowed' : 'pointer';

    return { selectedLogIds, selectedTimestamps, totalHours, selectedDaysCount, totalAmount };
  };

  if (roundModeSelect) {
    roundModeSelect.addEventListener('change', updateCalculations);
  }

  wrapper.querySelectorAll('.log-chk').forEach(chk => {
    chk.addEventListener('change', updateCalculations);
  });

  const currentSummary = updateCalculations();

  payBtn.onclick = () => {
    const summary = updateCalculations();
    if (summary.selectedDaysCount === 0) {
      alert("Por favor selecciona al menos un día de fichada impago para liquidar.");
      return;
    }

    const timestamps = summary.selectedTimestamps.sort((a, b) => a - b);
    let dateDetailStr = '';

    if (timestamps.length === 1) {
      const singleDate = new Date(timestamps[0]);
      const dayName = DAYS_ES[singleDate.getDay()];
      dateDetailStr = `${dayName} ${formatDate(timestamps[0])}`;
    } else if (timestamps.length > 1) {
      const minTs = timestamps[0];
      const maxTs = timestamps[timestamps.length - 1];
      const minDate = new Date(minTs);
      const maxDate = new Date(maxTs);
      const minDay = DAYS_ES[minDate.getDay()];
      const maxDay = DAYS_ES[maxDate.getDay()];
      dateDetailStr = `Del ${minDay} ${formatDate(minTs)} al ${maxDay} ${formatDate(maxTs)}`;
    }

    const periodSummary = `Pago Sueldo: ${employee.name} (${summary.selectedDaysCount} ${summary.selectedDaysCount === 1 ? 'día' : 'días'}, ${summary.totalHours.toFixed(1)} hs${dateDetailStr ? ` - ${dateDetailStr}` : ''})`;
    const targetCaja = targetCajaSelect.value || 'accounting';

    if (typeof onNavigateToSalaryPayment === 'function') {
      onNavigateToSalaryPayment({
        establishment,
        employee,
        selectedLogIds: summary.selectedLogIds,
        totalAmount: summary.totalAmount,
        periodSummary,
        targetCaja
      });
    }
  };
}

