/**
 * @file BatchBuyChecksUI.js
 * @description Pantalla dedicada a pantalla completa para la Compra Masiva de Cheques (Carga por Lote).
 * Maximiza el espacio visual para una carga cómoda y ordenada de cheques con cálculo dinámico
 * de tasas, deducciones por días de clearing y generación de reportes proforma.
 * @module ui/screens/BatchBuyChecksUI
 */

import { el } from '../../../frameworks/utils/dom.js';
import { formatCurrency, formatDateLocal } from '../../../frameworks/utils/formatters.js';
import { Check } from '../../../domain/entities/Check.js';
import { copyToClipboardAndOpenBcra } from '../components/CheckComponents.js';
import { printBuyOperationReport, generateBuyOperationExcel } from '../reports/ReportService.js';

// Lista de bancos frecuentes para autocompletado rápido
const COMMON_BANKS = [
  'Banco de la Nación Argentina (BNA)',
  'Banco Galicia',
  'Banco Santander',
  'Banco Macro',
  'BBVA',
  'Banco Provincia (BAPRO)',
  'Banco Ciudad',
  'Banco Credicoop',
  'Banco Patagonia',
  'Banco Hipotecario',
  'Banco Supervielle',
  'Banco Comafi',
  'Banco de Santa Fe',
  'Banco de Córdoba (BANCOR)',
  'ICBC',
  'Banco Industrial (BIND)',
  'Banco Columbia',
  'Banco de Entre Ríos',
  'Brubank'
];

/**
 * Renderiza la pantalla dedicada de Compra Masiva de Cheques.
 * @param {HTMLElement} container - Contenedor principal de la aplicación.
 * @param {Object} options - Parámetros y callbacks { buyContacts, onBatchBuy, onBack }.
 */
export function renderBatchBuyScreen(container, { buyContacts = [], onBatchBuy, onBack }) {
  container.innerHTML = '';

  const today = new Date().toISOString().split('T')[0];

  const wrapper = el('div', {
    classes: ['batch-buy-screen-wrapper', 'fade-in'],
    style: 'width: 100%; max-width: 1600px; margin: 0 auto; padding-bottom: 5rem;'
  });

  // ---- 1. ENCABEZADO SUPERIOR ----
  const header = el('div', {
    classes: ['dashboard-header', 'glass-card'],
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 1.25rem 2rem; border-radius: 20px; gap: 1rem; flex-wrap: wrap;'
  });

  const titleGroup = el('div', { style: 'display: flex; align-items: center; gap: 1.25rem;' });
  const backBtn = el('button', {
    classes: ['back-btn-m3'],
    html: '<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>',
    attrs: { title: 'Volver a Gestión de Cheques' }
  });

  const handleBack = () => {
    const hasData = checkIfHasUnsavedData();
    if (hasData) {
      if (!confirm('¿Desea salir de la Compra Masiva? Los datos no guardados del lote se perderán.')) {
        return;
      }
    }
    if (typeof onBack === 'function') onBack();
  };

  backBtn.onclick = handleBack;
  titleGroup.appendChild(backBtn);

  const textInfo = el('div', { style: 'display: flex; flex-direction: column;' });
  textInfo.appendChild(el('h1', {
    html: '📥 Compra Masiva de Cheques <span style="font-size: 0.85rem; font-weight: 600; color: #818cf8; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.35); padding: 0.25rem 0.75rem; border-radius: 20px; vertical-align: middle; margin-left: 0.5rem;">Carga por Lote</span>',
    style: 'margin: 0; font-size: 1.45rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center;'
  }));
  textInfo.appendChild(el('p', {
    text: 'Carga de lote de cheques con cálculo automático de tasas, deducciones y validación financiera en tiempo real.',
    style: 'margin: 0.25rem 0 0 0; font-size: 0.82rem; color: var(--text-muted); font-weight: 500;'
  }));
  titleGroup.appendChild(textInfo);
  header.appendChild(titleGroup);

  // Acciones rápidas en el encabezado
  const topActionGroup = el('div', { style: 'display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap;' });

  const addRowBtn = el('button', {
    classes: ['btn-primary'],
    style: 'display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.25rem; font-size: 0.88rem; font-weight: 700; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: 0 4px 12px rgba(99,102,241,0.35);',
    html: '<svg viewBox="0 0 24 24" width="16" height="16" style="fill:currentColor;"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg> + Agregar Cheque'
  });

  const add5RowsBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1rem; font-size: 0.85rem; font-weight: 600; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12);',
    html: '<span>+ 5 Filas</span>'
  });

  const cleanEmptyBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1rem; font-size: 0.85rem; font-weight: 600; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); color: var(--text-muted);',
    html: '<span>🧹 Limpiar vacíos</span>',
    attrs: { title: 'Eliminar filas incompletas sin valores' }
  });

  topActionGroup.appendChild(cleanEmptyBtn);
  topActionGroup.appendChild(add5RowsBtn);
  topActionGroup.appendChild(addRowBtn);
  header.appendChild(topActionGroup);

  wrapper.appendChild(header);

  // Datalists compartidos en pantalla
  const datalistContainer = el('div');
  datalistContainer.innerHTML = `
    <datalist id="batch-screen-contacts-dl">
      ${buyContacts.map(c => `<option value="${c.name || ''}">${c.cuit ? `CUIT: ${c.cuit}` : ''}</option>`).join('')}
    </datalist>
    <datalist id="batch-screen-banks-dl">
      ${COMMON_BANKS.map(b => `<option value="${b}"></option>`).join('')}
    </datalist>
  `;
  wrapper.appendChild(datalistContainer);

  // ---- 2. PARÁMETROS COMUNES DEL LOTE ----
  const commonParamsCard = el('div', {
    classes: ['glass-card'],
    style: 'margin-bottom: 1.5rem; padding: 1.5rem 2rem; border-radius: 20px; border: 1.5px solid rgba(99, 102, 241, 0.35); background: linear-gradient(145deg, rgba(99, 102, 241, 0.05) 0%, rgba(15, 23, 42, 0.6) 100%);'
  });

  commonParamsCard.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem;">
      <h3 style="margin: 0; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.06em; color: #818cf8; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
        🔗 Datos Comunes del Lote
      </h3>
      <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">Los valores ingresados aquí se aplican a todos los cheques del lote</span>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem;">
      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem; display: block;">Vendedor (Origen) *</label>
        <div style="position: relative;">
          <input type="text" id="batch-screen-seller" list="batch-screen-contacts-dl" placeholder="🔎 Buscar operador / cliente..." autocomplete="off" style="width: 100%; padding: 0.75rem 1rem; border-radius: 10px; background: rgba(0,0,0,0.25); border: 1px solid var(--border); color: var(--text-main); font-size: 0.92rem; font-weight: 600;">
        </div>
      </div>

      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem; display: block;">Pesificación Compra (%)</label>
        <input type="number" step="0.01" id="batch-screen-pesif" placeholder="0.00" style="width: 100%; padding: 0.75rem 1rem; border-radius: 10px; background: rgba(0,0,0,0.25); border: 1px solid var(--border); color: var(--text-main); font-size: 0.92rem; font-weight: 600;">
      </div>

      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem; display: block;">Interés Mensual Compra (%)</label>
        <input type="number" step="0.01" id="batch-screen-interest" placeholder="0.00" style="width: 100%; padding: 0.75rem 1rem; border-radius: 10px; background: rgba(0,0,0,0.25); border: 1px solid var(--border); color: var(--text-main); font-size: 0.92rem; font-weight: 600;">
      </div>

      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem; display: block;">Fecha de Recepción</label>
        <input type="date" id="batch-screen-recdate" value="${today}" style="width: 100%; padding: 0.75rem 1rem; border-radius: 10px; background: rgba(0,0,0,0.25); border: 1px solid var(--border); color: var(--text-main); font-size: 0.92rem; font-weight: 600;">
      </div>

      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem; display: block;">Clearing (Días adicionales)</label>
        <input type="number" id="batch-screen-clearing" value="0" min="0" style="width: 100%; padding: 0.75rem 1rem; border-radius: 10px; background: rgba(0,0,0,0.25); border: 1px solid var(--border); color: var(--text-main); font-size: 0.92rem; font-weight: 600;">
      </div>

      <div class="form-group" style="margin: 0; grid-column: 1 / -1;">
        <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem; display: block;">Notas / Observaciones del Lote</label>
        <textarea id="batch-screen-notes" rows="2" placeholder="Observaciones generales adicionales que se registrarán en todas las operaciones del lote..." style="width: 100%; padding: 0.65rem 1rem; border-radius: 10px; background: rgba(0,0,0,0.25); border: 1px solid var(--border); color: var(--text-main); font-size: 0.88rem; resize: vertical;"></textarea>
      </div>
    </div>
  `;
  wrapper.appendChild(commonParamsCard);

  // ---- 3. LISTADO / GRILLA DE CHEQUES DEL LOTE ----
  const checksSectionHeader = el('div', {
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 0 0.5rem; flex-wrap: wrap; gap: 0.5rem;'
  });

  checksSectionHeader.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main);">
        📄 Detalle de Cheques a Ingresar
      </h2>
      <span id="batch-screen-counter-badge" style="font-size: 0.8rem; font-weight: 700; background: rgba(255,255,255,0.08); border: 1px solid var(--border); padding: 0.2rem 0.6rem; border-radius: 12px; color: var(--text-muted);">
        0 cheques
      </span>
    </div>
  `;
  wrapper.appendChild(checksSectionHeader);

  const rowsContainer = el('div', {
    attrs: { id: 'batch-screen-rows' },
    style: 'display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;'
  });
  wrapper.appendChild(rowsContainer);

  // ---- 4. DOCK / BARRA DE RESUMEN Y ACCIONES ----
  const summaryDock = el('div', {
    classes: ['glass-card'],
    style: 'position: sticky; bottom: 1.5rem; z-index: 100; margin-top: 2rem; padding: 1.25rem 2rem; border-radius: 20px; border: 2px solid rgba(99, 102, 241, 0.4); background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(16px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center; justify-content: space-between;'
  });

  summaryDock.innerHTML = `
    <div style="display: flex; gap: 2rem; flex-wrap: wrap; align-items: center;">
      <div>
        <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: block;">Cheques Válidos</span>
        <strong id="dock-sum-count" style="font-size: 1.35rem; color: var(--text-main); font-weight: 800;">0</strong>
      </div>
      <div>
        <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: block;">Nominal Total</span>
        <strong id="dock-sum-nominal" style="font-size: 1.35rem; color: var(--text-main); font-weight: 800;">$0,00</strong>
      </div>
      <div>
        <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: block;">Total Descuento</span>
        <strong id="dock-sum-discount" style="font-size: 1.35rem; color: #f87171; font-weight: 800;">$0,00</strong>
      </div>
      <div>
        <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: block;">Plazo Promedio</span>
        <strong id="dock-sum-avgdays" style="font-size: 1.35rem; color: #fbbf24; font-weight: 800;">0 d</strong>
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
      <div style="text-align: right; background: rgba(0,0,0,0.3); padding: 0.65rem 1.5rem; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06);">
        <span style="color: #818cf8; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; display: block;">Neto a Pagar (Total)</span>
        <strong id="dock-sum-net" style="color: #818cf8; font-size: 2rem; font-weight: 800; text-shadow: 0 2px 10px rgba(99,102,241,0.3); line-height: 1.1;">$0,00</strong>
      </div>

      <div style="display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap;">
        <button type="button" id="batch-screen-pdf-btn" style="padding: 0.75rem 1.1rem; border-radius: 12px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.4); color: #818cf8; font-size: 0.88rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: all 0.2s;" title="Imprimir Reporte PDF Proforma">
          🖨️ PDF
        </button>
        <button type="button" id="batch-screen-thermal-btn" style="padding: 0.75rem 1.1rem; border-radius: 12px; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.4); color: #60a5fa; font-size: 0.88rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: all 0.2s;" title="Imprimir Ticket Térmico">
          🧾 Térmico
        </button>
        <button type="button" id="batch-screen-excel-btn" style="padding: 0.75rem 1.1rem; border-radius: 12px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #34d399; font-size: 0.88rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: all 0.2s;" title="Exportar Planilla Excel">
          📥 Excel
        </button>
        <button type="button" id="batch-screen-cancel-btn" style="padding: 0.75rem 1.4rem; border-radius: 12px; background: rgba(255,255,255,0.06); color: var(--text-main); font-size: 0.92rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">
          Cancelar
        </button>
        <button type="button" id="batch-screen-save-btn" style="padding: 0.75rem 2rem; border-radius: 12px; background: linear-gradient(135deg,#6366f1,#4f46e5); color: #fff; font-size: 0.95rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(99,102,241,0.45); transition: transform 0.15s, box-shadow 0.15s;">
          💾 Guardar Lote
        </button>
      </div>
    </div>
  `;
  wrapper.appendChild(summaryDock);
  container.appendChild(wrapper);

  // ---- CÁLCULOS Y LOGICA FINANCIERA ----
  function calcRowNet(nomVal, pesif, interest, receptionDate, dueDate, clearing) {
    const nv = parseFloat(nomVal) || 0;
    const p = parseFloat(pesif) || 0;
    const ir = parseFloat(interest) || 0;
    const cl = parseInt(clearing) || 0;
    if (!receptionDate || !dueDate || nv <= 0) return null;
    const rec = new Date(receptionDate + 'T00:00:00');
    const due = new Date(dueDate + 'T00:00:00');
    const diffTime = due.getTime() - rec.getTime();
    const diffDays = Math.ceil(diffTime / 86400000);
    const days = diffDays <= 0 ? 0 : diffDays + cl;
    const pesifAmt = nv * (p / 100);
    const intAmt = nv * (ir / 100 / 30) * days;
    const discount = pesifAmt + intAmt;
    const net = Math.max(0, nv - discount);
    return { net, days, nv, discount, pesifAmt, intAmt };
  }

  function updateSummary() {
    const rows = rowsContainer.querySelectorAll('.batch-check-row-card');
    const pesif = wrapper.querySelector('#batch-screen-pesif').value;
    const interest = wrapper.querySelector('#batch-screen-interest').value;
    const recDate = wrapper.querySelector('#batch-screen-recdate').value;
    const clearing = wrapper.querySelector('#batch-screen-clearing').value;

    let totalNominal = 0;
    let totalDiscount = 0;
    let totalNet = 0;
    let validCount = 0;
    let weightedDaysSum = 0;

    rows.forEach((row, idx) => {
      // Actualizar número visible
      const badge = row.querySelector('.row-index-badge');
      if (badge) badge.textContent = `#${idx + 1}`;

      const nv = row.querySelector('.row-nominal').value;
      const dd = row.querySelector('.row-duedate').value;
      const calc = calcRowNet(nv, pesif, interest, recDate, dd, clearing);

      const netBadge = row.querySelector('.row-net-badge');
      const daysBadge = row.querySelector('.row-days-badge');
      const discountBadge = row.querySelector('.row-discount-badge');

      if (calc) {
        totalNominal += calc.nv;
        totalDiscount += calc.discount;
        totalNet += calc.net;
        validCount++;
        weightedDaysSum += calc.days * calc.nv;

        if (netBadge) netBadge.innerHTML = `<span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;display:block;">Neto Individual</span><strong>${formatCurrency(calc.net)}</strong>`;
        if (daysBadge) daysBadge.innerHTML = `<span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;display:block;">Plazo</span><strong>${calc.days} días</strong>`;
        if (discountBadge) discountBadge.innerHTML = `<span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;display:block;">Deducción</span><strong>-${formatCurrency(calc.discount)}</strong>`;
        row.classList.remove('row-incomplete');
        row.classList.add('row-valid');
      } else {
        if (netBadge) netBadge.innerHTML = `<span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;display:block;">Neto Individual</span><span style="color:var(--text-muted);">$0,00</span>`;
        if (daysBadge) daysBadge.innerHTML = `<span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;display:block;">Plazo</span><span style="color:var(--text-muted);">-</span>`;
        if (discountBadge) discountBadge.innerHTML = `<span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;display:block;">Deducción</span><span style="color:var(--text-muted);">$0,00</span>`;
        row.classList.remove('row-valid');
        if (nv || dd) row.classList.add('row-incomplete');
        else row.classList.remove('row-incomplete');
      }
    });

    const avgDays = totalNominal > 0 ? Math.round(weightedDaysSum / totalNominal) : 0;

    wrapper.querySelector('#batch-screen-counter-badge').textContent = `${rows.length} cheque${rows.length === 1 ? '' : 's'} (${validCount} válido${validCount === 1 ? '' : 's'})`;
    wrapper.querySelector('#dock-sum-count').textContent = `${validCount} / ${rows.length}`;
    wrapper.querySelector('#dock-sum-nominal').textContent = formatCurrency(totalNominal);
    wrapper.querySelector('#dock-sum-discount').textContent = formatCurrency(totalDiscount);
    wrapper.querySelector('#dock-sum-avgdays').textContent = `${avgDays} d`;
    wrapper.querySelector('#dock-sum-net').textContent = formatCurrency(totalNet);
  }

  function addRow(initialValues = {}) {
    const row = el('div', {
      classes: ['batch-check-row-card', 'glass-card'],
      style: 'padding: 1.25rem 1.5rem; border-radius: 16px; border: 1px solid var(--border); background: rgba(255,255,255,0.02); display: flex; flex-direction: column; gap: 1rem; transition: border-color 0.2s, box-shadow 0.2s;'
    });

    row.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.65rem;">
        <div style="display: flex; align-items: center; gap: 0.65rem;">
          <span class="row-index-badge" style="font-size: 0.82rem; font-weight: 800; background: rgba(99, 102, 241, 0.18); border: 1px solid rgba(99, 102, 241, 0.35); color: #818cf8; padding: 0.2rem 0.65rem; border-radius: 8px;">#</span>
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">Datos del Cheque</span>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button type="button" class="row-duplicate-btn" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px; padding: 0.3rem 0.65rem; cursor: pointer; font-size: 0.78rem; font-weight: 600; display: flex; align-items: center; gap: 0.3rem;" title="Duplicar datos bancarios y librador en una nueva fila">
            📋 Duplicar
          </button>
          <button type="button" class="row-remove-btn" style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #f87171; border-radius: 8px; padding: 0.3rem 0.65rem; cursor: pointer; font-size: 0.78rem; font-weight: 700;" title="Eliminar fila">
            ✕ Quitar
          </button>
        </div>
      </div>

      <!-- Primera Fila: Banco, Número, Nominal, Vencimiento, Cálculos -->
      <div style="display: grid; grid-template-columns: minmax(180px, 1.2fr) minmax(140px, 1fr) minmax(150px, 1.1fr) minmax(160px, 1.1fr) minmax(280px, 1.6fr); gap: 1rem; align-items: end;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:0.3rem;">🏦 Banco *</label>
          <input type="text" class="row-bank" list="batch-screen-banks-dl" placeholder="Ej: BNA, Galicia..." value="${initialValues.bank || ''}" style="width:100%; padding:0.65rem 0.85rem; border-radius:8px; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); font-size:0.88rem; font-weight:600;">
        </div>

        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:0.3rem;"># N° de Cheque</label>
          <input type="text" class="row-number" placeholder="12345678" value="${initialValues.checkNumber || ''}" style="width:100%; padding:0.65rem 0.85rem; border-radius:8px; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); font-size:0.88rem; font-weight:600;">
        </div>

        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:0.3rem;">Nominal ($) *</label>
          <input type="number" step="0.01" class="row-nominal" placeholder="0.00" value="${initialValues.nominalValue || ''}" style="width:100%; padding:0.65rem 0.85rem; border-radius:8px; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); font-size:0.92rem; font-weight:700;">
        </div>

        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:0.3rem;">F. Pago (Venc.) *</label>
          <input type="date" class="row-duedate" value="${initialValues.dueDate || ''}" style="width:100%; padding:0.65rem 0.85rem; border-radius:8px; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); font-size:0.88rem; font-weight:600;">
        </div>

        <!-- Indicadores de cálculo en tiempo real -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 0.5rem; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.06); padding: 0.5rem 0.75rem; border-radius: 10px; height: 42px; align-items: center;">
          <div class="row-days-badge" style="font-size: 0.82rem; text-align: center;">
            <span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;display:block;">Plazo</span>-
          </div>
          <div class="row-discount-badge" style="font-size: 0.82rem; text-align: center; color: #f87171;">
            <span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;display:block;">Deducción</span>$0,00
          </div>
          <div class="row-net-badge" style="font-size: 0.88rem; text-align: right; color: #818cf8; font-weight: 800;">
            <span style="font-size:0.72rem;color:var(--text-muted);font-weight:600;display:block;">Neto Individual</span>$0,00
          </div>
        </div>
      </div>

      <!-- Segunda Fila: Librador, CUIT Librador, Botón BCRA, Tipo de Cheque -->
      <div style="display: grid; grid-template-columns: minmax(220px, 1.5fr) minmax(200px, 1.2fr) minmax(140px, 0.8fr); gap: 1rem; align-items: end; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.04);">
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:0.3rem;">👤 Librador (Razón Social o Nombre)</label>
          <input type="text" class="row-issuer-name" placeholder="Ej: Agropecuaria SRL / Juan Pérez" value="${initialValues.issuerName || ''}" style="width:100%; padding:0.65rem 0.85rem; border-radius:8px; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); font-size:0.88rem; font-weight:600;">
        </div>

        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:0.3rem;">🆔 CUIT Librador</label>
          <div style="display:flex; gap:0.4rem;">
            <input type="text" class="row-issuer-cuit" placeholder="20-XXXXXXXX-X" value="${initialValues.issuerCuit || ''}" style="flex:1; padding:0.65rem 0.85rem; border-radius:8px; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); font-size:0.88rem; font-weight:600;">
            <button type="button" class="row-bcra-btn" title="Consultar Central de Deudores BCRA y copiar CUIT" style="padding:0 0.9rem; border-radius:8px; background:#2563eb; color:white; border:none; cursor:pointer; font-size:0.78rem; font-weight:700; white-space:nowrap; display:flex; align-items:center; gap:0.25rem;">
              🔍 BCRA
            </button>
          </div>
        </div>

        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:0.3rem;">📄 Tipo de Cheque</label>
          <select class="row-isecheck" style="width:100%; height:40px; padding:0 0.75rem; border-radius:8px; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); font-family:inherit; outline:none; font-size:0.88rem; font-weight:600;">
            <option value="false" ${initialValues.isECheck ? '' : 'selected'}>Físico</option>
            <option value="true" ${initialValues.isECheck ? 'selected' : ''}>E-Cheque</option>
          </select>
        </div>
      </div>
    `;

    // Eventos de la fila
    row.querySelector('.row-remove-btn').onclick = () => {
      row.remove();
      updateSummary();
    };

    row.querySelector('.row-duplicate-btn').onclick = () => {
      const bank = row.querySelector('.row-bank').value;
      const issuerName = row.querySelector('.row-issuer-name').value;
      const issuerCuit = row.querySelector('.row-issuer-cuit').value;
      const isECheck = row.querySelector('.row-isecheck').value === 'true';
      addRow({ bank, issuerName, issuerCuit, isECheck });
    };

    row.querySelectorAll('input, select').forEach(inp => inp.addEventListener('input', updateSummary));

    row.querySelector('.row-bcra-btn').onclick = () => {
      const cuitVal = row.querySelector('.row-issuer-cuit').value;
      copyToClipboardAndOpenBcra(cuitVal);
    };

    rowsContainer.appendChild(row);
    updateSummary();
  }

  function checkIfHasUnsavedData() {
    const seller = wrapper.querySelector('#batch-screen-seller').value.trim();
    if (seller) return true;
    const rows = rowsContainer.querySelectorAll('.batch-check-row-card');
    for (const r of rows) {
      const nv = r.querySelector('.row-nominal').value;
      const bank = r.querySelector('.row-bank').value.trim();
      const num = r.querySelector('.row-number').value.trim();
      if (nv || bank || num) return true;
    }
    return false;
  }

  function extractBatchOperations() {
    const sellerName = wrapper.querySelector('#batch-screen-seller').value.trim();
    const matchedSeller = buyContacts.find(c => (c.name || '').toLowerCase() === sellerName.toLowerCase());
    const sellerId = matchedSeller ? (matchedSeller.id || matchedSeller.name) : (sellerName || null);
    const pesif = wrapper.querySelector('#batch-screen-pesif').value;
    const interest = wrapper.querySelector('#batch-screen-interest').value;
    const recDate = wrapper.querySelector('#batch-screen-recdate').value;
    const clearing = wrapper.querySelector('#batch-screen-clearing').value;
    const batchNotes = wrapper.querySelector('#batch-screen-notes').value.trim();

    const rows = rowsContainer.querySelectorAll('.batch-check-row-card');
    const ops = [];
    rows.forEach(row => {
      const bank = row.querySelector('.row-bank').value.trim();
      const num = row.querySelector('.row-number').value.trim();
      const nv = row.querySelector('.row-nominal').value;
      const dueDate = row.querySelector('.row-duedate').value;
      const issuerName = row.querySelector('.row-issuer-name').value.trim();
      const issuerCuit = row.querySelector('.row-issuer-cuit').value.trim();
      const isECheck = row.querySelector('.row-isecheck').value === 'true';

      if (!nv || !dueDate) return; // Omitir filas sin nominal o vencimiento

      const chk = new Check({
        bank,
        checkNumber: num,
        nominalValue: nv,
        dueDate,
        receptionDate: recDate || today,
        clearing: clearing || 0,
        issueDate: '',
        issuerName,
        issuerCuit,
        notes: batchNotes,
        isECheck,
        buySide: { contactId: sellerId, pesificacionRate: pesif, monthlyInterest: interest },
        sellSide: { status: 'PENDING', contactId: null, pesificacionRate: '', monthlyInterest: '', backReason: '' }
      });
      chk.calculate();
      ops.push(chk);
    });

    return { ops, sellerName, recDate, sellerId };
  }

  // Eventos de botones de cabecera
  addRowBtn.onclick = () => addRow();
  add5RowsBtn.onclick = () => {
    for (let i = 0; i < 5; i++) addRow();
  };
  cleanEmptyBtn.onclick = () => {
    const rows = rowsContainer.querySelectorAll('.batch-check-row-card');
    let removed = 0;
    rows.forEach(row => {
      const nv = row.querySelector('.row-nominal').value;
      const dd = row.querySelector('.row-duedate').value;
      const bank = row.querySelector('.row-bank').value.trim();
      const num = row.querySelector('.row-number').value.trim();
      if (!nv && !dd && !bank && !num) {
        row.remove();
        removed++;
      }
    });
    if (rowsContainer.children.length === 0) {
      addRow();
    }
    updateSummary();
  };

  // Eventos de parámetros comunes
  wrapper.querySelectorAll('#batch-screen-pesif, #batch-screen-interest, #batch-screen-recdate, #batch-screen-clearing')
    .forEach(inp => inp.addEventListener('input', updateSummary));

  // Eventos de botones del Dock inferior
  wrapper.querySelector('#batch-screen-pdf-btn').onclick = () => {
    const { ops, sellerName, recDate } = extractBatchOperations();
    if (ops.length === 0) {
      alert('⚠️ Agregue al menos un cheque con importe nominal y fecha de pago para generar el reporte PDF.');
      return;
    }
    printBuyOperationReport('PROFORMA', sellerName || 'PROFORMA', recDate, ops, buyContacts, 'standard');
  };

  wrapper.querySelector('#batch-screen-thermal-btn').onclick = () => {
    const { ops, sellerName, recDate } = extractBatchOperations();
    if (ops.length === 0) {
      alert('⚠️ Agregue al menos un cheque con importe nominal y fecha de pago para generar el ticket térmico.');
      return;
    }
    printBuyOperationReport('PROFORMA', sellerName || 'PROFORMA', recDate, ops, buyContacts, 'thermal');
  };

  wrapper.querySelector('#batch-screen-excel-btn').onclick = () => {
    const { ops, sellerName, recDate } = extractBatchOperations();
    if (ops.length === 0) {
      alert('⚠️ Agregue al menos un cheque con importe nominal y fecha de pago para exportar a Excel.');
      return;
    }
    generateBuyOperationExcel('PROFORMA', sellerName || 'PROFORMA', recDate, ops, buyContacts);
  };

  wrapper.querySelector('#batch-screen-cancel-btn').onclick = handleBack;

  wrapper.querySelector('#batch-screen-save-btn').onclick = () => {
    const { ops, sellerName } = extractBatchOperations();
    if (ops.length === 0) {
      alert('⚠️ Debe ingresar al menos un cheque con Importe Nominal y Fecha de Pago válidos.');
      return;
    }
    if (!sellerName) {
      if (!confirm('No ha seleccionado un Vendedor (Origen). ¿Desea guardar el lote de todos modos?')) {
        wrapper.querySelector('#batch-screen-seller').focus();
        return;
      }
    }

    if (typeof onBatchBuy === 'function') {
      onBatchBuy(ops);
    }
  };

  // Inicializar con 4 filas por defecto
  addRow();
  addRow();
  addRow();
  addRow();
}
