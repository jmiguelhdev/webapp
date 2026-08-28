/**
 * ChecksModals.js
 * Modales del módulo de Cheques:
 *  - showOperationModal: formulario individual (compra/edición).
 *  - showBatchBuyModal:  compra masiva de lote.
 *  - showBatchSellModal: venta masiva de selección.
 */
import { el } from '../../../frameworks/utils/dom.js';
import { formatCurrency, formatDateLocal } from '../../../frameworks/utils/formatters.js';
import { Check } from '../../../domain/entities/Check.js';
import { printSaleOperationReport, generateSaleOperationExcel, printBuyOperationReport, generateBuyOperationExcel } from '../reports/ReportService.js';
import { copyToClipboardAndOpenBcra } from './CheckComponents.js';

function getSelectStyle(accentColor) {
  const isDark = document.body.classList.contains('dark');
  const bg = isDark ? '#1e1e1e' : '#ffffff';
  const fg = isDark ? '#ffffff' : '#1a1a1a';
  return `border: 1.5px solid ${accentColor}; background-color: ${bg}; color: ${fg}; border-radius: 10px; color-scheme: ${isDark ? 'dark' : 'light'};`;
}

export function showOperationModal(existingOp, contacts, buyContacts, onSave) {
  const isEditing = !!existingOp;
  const modal = el('div', { 
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: clamp(0.5rem, 3vw, 2rem); overflow-y: auto;'
  });

  const content = el('div', { 
    classes: ['glass-card'],
    style: 'width: 100%; max-width: 1100px; margin: auto; padding: 0; display: flex; flex-direction: column; max-height: calc(100vh - 3rem); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.7);'
  });

  content.innerHTML = `
    <div style="flex-shrink: 0; background: var(--card-bg); border-bottom: 1px solid var(--border); padding: 1.25rem 2rem; display: flex; align-items: center; justify-content: space-between; border-radius: 20px 20px 0 0; z-index: 10;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <h2 style="margin: 0; font-size: clamp(1.1rem, 3vw, 1.4rem); font-weight: 700;">${isEditing ? '✏️ Editar' : '💸 Nueva'} Operación de Cheque</h2>
        ${isEditing ? `
          <button type="button" id="btn-modal-check-history" title="Ver Historial de Movimientos del Cheque" style="padding: 0.35rem 0.75rem; border-radius: 8px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.35); color: #818cf8; font-size: 0.8rem; font-weight: 750; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; transition: all 0.2s;">
            🕒 Historial
          </button>
        ` : ''}
      </div>
      <button type="button" class="btn-close-modal" style="background: rgba(255,255,255,0.08); border: 1px solid var(--border); color: var(--text-main); width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s;">✕</button>
    </div>

    <div class="modal-scrollable-body" style="padding: clamp(1rem, 3vw, 2rem); overflow-y: auto; flex: 1; overscroll-behavior: contain;">
    <form id="check-form">

      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1.25rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); font-weight: 600;">📄 Datos del Cheque</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem 1.5rem;">
          <div class="form-group" style="margin:0;">
            <label>Banco</label>
            <input type="text" name="bank" value="${existingOp?.bank || ''}" required placeholder="Ej: Banco Nación">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Número de Cheque</label>
            <input type="text" name="checkNumber" value="${existingOp?.checkNumber || ''}" required placeholder="12345678">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Valor Nominal ($)</label>
            <input type="number" step="0.01" name="nominalValue" value="${existingOp?.nominalValue || ''}" required placeholder="0.00">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Clearing (Días)</label>
            <input type="number" name="clearing" value="${existingOp?.clearing || 0}" required>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Fecha Emisión</label>
            <input type="date" name="issueDate" value="${existingOp?.issueDate || ''}">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Fecha Recepción</label>
            <input type="date" name="receptionDate" value="${existingOp?.receptionDate || new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Fecha de Pago</label>
            <input type="date" name="dueDate" value="${existingOp?.dueDate || ''}" required>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Tipo de Cheque</label>
            <select name="isECheck" style="width:100%;height:38px;padding:0 0.75rem;border-radius:8px;background:rgba(0,0,0,0.2);border:1px solid var(--border);color:var(--text-main);font-family:inherit;outline:none;font-weight:600;">
              <option value="false" ${existingOp?.isECheck ? '' : 'selected'}>Físico (Papel)</option>
              <option value="true" ${existingOp?.isECheck ? 'selected' : ''}>E-Cheque (Electrónico)</option>
            </select>
          </div>
        </div>
      </div>

      <div style="background: rgba(99,102,241,0.04); border: 1px solid rgba(99,102,241,0.25); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1.25rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--primary); font-weight: 600;">👤 Datos del Librador</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem 1.5rem;">
          <div class="form-group" style="margin:0;">
            <label>Nombre / Razón Social</label>
            <input type="text" name="issuerName" value="${existingOp?.issuerName || ''}" placeholder="Nombre del librador">
          </div>
          <div class="form-group" style="margin:0;">
            <label>CUIT Librador</label>
            <div style="display: flex; gap: 0.5rem;">
              <input type="text" name="issuerCuit" id="issuer-cuit" value="${existingOp?.issuerCuit || ''}" placeholder="20-XXXXXXXX-X" style="flex: 1;">
              <button type="button" id="btn-bcra" title="Consultar Situación Crediticia en BCRA" style="padding: 0 1rem; border-radius: 8px; background: #2563eb; color: white; border: none; cursor: pointer; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; white-space: nowrap;">
                🔍 BCRA
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style="background: rgba(99,102,241,0.06); border: 1px solid var(--primary); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1.25rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--primary); font-weight: 600;">📥 Compra (Origen)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem 1.5rem; align-items: end;">
          <div class="form-group" style="margin:0;">
            <label>Operador / Vendedor</label>
            <input type="text" id="buyside-contact-input" list="buyside-contacts-datalist" required placeholder="🔎 Buscar Operador..." autocomplete="off" value="${existingOp?.buySide?.contactId ? (buyContacts.find(c => c.id === existingOp.buySide.contactId)?.name || existingOp.buySide.contactId) : ''}">
            <datalist id="buyside-contacts-datalist">
              ${buyContacts.map(c => `<option value="${c.name}"></option>`).join('')}
            </datalist>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Pesificación (%)</label>
            <input type="number" step="0.01" name="buySide_pesificacionRate" value="${existingOp?.buySide?.pesificacionRate !== undefined && existingOp?.buySide?.pesificacionRate !== null ? existingOp.buySide.pesificacionRate : ''}" required>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Interés Mensual (%)</label>
            <input type="number" step="0.01" name="buySide_monthlyInterest" value="${existingOp?.buySide?.monthlyInterest !== undefined && existingOp?.buySide?.monthlyInterest !== null ? existingOp.buySide.monthlyInterest : ''}" required>
          </div>
          
          <div style="grid-column: 1 / -1; margin-top: 0.5rem; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.4); border-radius: 10px; padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 700; color: var(--text-main); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Neto a Pagar</span>
            <div style="text-align: right;">
              <strong id="single-net-amount" style="font-size: 1.5rem; color: var(--primary); font-weight: 800;">$0,00</strong>
              <div id="single-net-days" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem; font-weight: 600;">0 días</div>
            </div>
          </div>
        </div>
      </div>

      ${isEditing && existingOp?.sellSide ? `
      <div style="background: rgba(16,185,129,0.04); border: 1px solid rgba(16,185,129,0.3); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1.25rem; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--success); font-weight: 600;">📤 Venta (Destino)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem 1.5rem; align-items: end;">
          <div class="form-group" style="margin:0;">
            <label>Estado de la Operación</label>
            <select name="sellSide_status" id="edit-sellside-status" style="width:100%;height:38px;padding:0 0.75rem;border-radius:8px;background:rgba(0,0,0,0.2);border:1px solid var(--border);color:var(--text-main);font-family:inherit;outline:none;">
              <option value="PENDING" ${existingOp.sellSide.status === 'PENDING' ? 'selected' : ''}>En Cartera</option>
              <option value="SOLD" ${existingOp.sellSide.status === 'SOLD' ? 'selected' : ''}>Vendido</option>
              <option value="RETURNED" ${existingOp.sellSide.status === 'RETURNED' ? 'selected' : ''}>Devuelto</option>
              <option value="BACK" ${existingOp.sellSide.status === 'BACK' ? 'selected' : ''}>Volvió</option>
              <option value="REJECTED" ${existingOp.sellSide.status === 'REJECTED' ? 'selected' : ''}>Rechazado</option>
            </select>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Comprador / Destinatario</label>
            <input type="text" id="sellside-contact-input" list="sellside-contacts-datalist" placeholder="🔎 Buscar contacto..." autocomplete="off" value="${existingOp.sellSide.contactId ? (contacts.find(c => c.id === existingOp.sellSide.contactId)?.name || existingOp.sellSide.contactId) : ''}">
            <datalist id="sellside-contacts-datalist">
              ${contacts.map(c => `<option value="${c.name}"></option>`).join('')}
            </datalist>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Pesificación Venta (%)</label>
            <input type="number" step="0.01" name="sellSide_pesificacionRate" value="${existingOp.sellSide.pesificacionRate !== undefined && existingOp.sellSide.pesificacionRate !== null ? existingOp.sellSide.pesificacionRate : ''}" placeholder="0.00">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Interés Mensual Venta (%)</label>
            <input type="number" step="0.01" name="sellSide_monthlyInterest" value="${existingOp.sellSide.monthlyInterest !== undefined && existingOp.sellSide.monthlyInterest !== null ? existingOp.sellSide.monthlyInterest : ''}" placeholder="0.00">
          </div>
          <div class="form-group" id="edit-backreason-group" style="margin:0; grid-column: 1 / -1; display:${existingOp.sellSide.status === 'BACK' ? 'block' : 'none'};">
            <label>⚠️ Motivo de Retorno</label>
            <textarea name="sellSide_backReason" rows="2" style="resize:vertical;" placeholder="Motivo...">${existingOp.sellSide.backReason || ''}</textarea>
          </div>
          
          <div style="grid-column: 1 / -1; margin-top: 0.5rem; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); border-radius: 10px; padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 700; color: var(--text-main); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Neto Cobrado / Venta</span>
            <div style="text-align: right;">
              <strong id="single-sell-net-amount" style="font-size: 1.5rem; color: #10b981; font-weight: 800;">$0,00</strong>
              <div id="single-sell-net-days" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem; font-weight: 600;">0 días</div>
            </div>
          </div>
        </div>
      </div>` : ''}

      <div class="form-group">
        <label>Notas / Observaciones</label>
        <textarea name="notes" rows="2" placeholder="Observaciones adicionales..." style="resize: vertical;">${existingOp?.notes || ''}</textarea>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap;">
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button type="button" id="single-print-pdf-btn" style="padding: 0.75rem 1.25rem; border-radius: 12px; background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.35); color: #818cf8; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: all 0.2s;">🖨️ Imprimir PDF</button>
          <button type="button" id="single-print-thermal-btn" style="padding: 0.75rem 1.25rem; border-radius: 12px; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.35); color: #60a5fa; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: all 0.2s;">🧾 Térmico</button>
        </div>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.06); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer; min-width: 120px;">Cancelar</button>
          <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; font-size: 1rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(99,102,241,0.4); letter-spacing: 0.03em; min-width: 180px;">Guardar Operación</button>
        </div>
      </div>

    </form>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const modalHistoryBtn = content.querySelector('#btn-modal-check-history');
  if (modalHistoryBtn && existingOp) {
    modalHistoryBtn.onclick = () => {
      showCheckMovementsModal(existingOp, contacts);
    };
  }

  content.querySelector('#btn-bcra').onclick = () => {
    const cuitInput = content.querySelector('#issuer-cuit');
    copyToClipboardAndOpenBcra(cuitInput.value);
  };

  // Show/hide back-reason field when editing sell side status
  const editStatusSel = content.querySelector('#edit-sellside-status');
  const editBackReasonGrp = content.querySelector('#edit-backreason-group');
  if (editStatusSel && editBackReasonGrp) {
    editStatusSel.addEventListener('change', () => {
      editBackReasonGrp.style.display = editStatusSel.value === 'BACK' ? 'block' : 'none';
    });
  }

  const form = content.querySelector('#check-form');
  
  const updateSingleNetPreview = () => {
    const nv = parseFloat(form.querySelector('[name="nominalValue"]').value) || 0;
    const p = parseFloat(form.querySelector('[name="buySide_pesificacionRate"]').value) || 0;
    const ir = parseFloat(form.querySelector('[name="buySide_monthlyInterest"]').value) || 0;
    const cl = parseInt(form.querySelector('[name="clearing"]').value) || 0;
    const recDate = form.querySelector('[name="receptionDate"]').value;
    const dueDate = form.querySelector('[name="dueDate"]').value;

    const singleSellNetAmt = content.querySelector('#single-sell-net-amount');
    const singleSellNetDays = content.querySelector('#single-sell-net-days');

    if (!recDate || !dueDate || nv === 0) {
      content.querySelector('#single-net-amount').textContent = '$0,00';
      content.querySelector('#single-net-days').textContent = '0 días';
      if (singleSellNetAmt && singleSellNetDays) {
        singleSellNetAmt.textContent = '$0,00';
        singleSellNetDays.textContent = '0 días';
      }
      return;
    }
    
    const rec = new Date(recDate + 'T00:00:00');
    const due = new Date(dueDate + 'T00:00:00');
    const days = Math.max(0, Math.ceil((due - rec) / 86400000) + cl);
    
    const pesifAmt = nv * (p / 100);
    const intAmt = nv * (ir / 100 / 30) * days;
    const net = nv - pesifAmt - intAmt;
    
    content.querySelector('#single-net-amount').textContent = formatCurrency(net);
    content.querySelector('#single-net-days').textContent = `${days} días`;

    if (singleSellNetAmt && singleSellNetDays) {
      const spEl = form.querySelector('[name="sellSide_pesificacionRate"]');
      const sirEl = form.querySelector('[name="sellSide_monthlyInterest"]');
      const sp = spEl ? (parseFloat(spEl.value) || 0) : 0;
      const sir = sirEl ? (parseFloat(sirEl.value) || 0) : 0;

      const sellPesifAmt = nv * (sp / 100);
      const sellIntAmt = nv * (sir / 100 / 30) * days;
      const sellNet = nv - sellPesifAmt - sellIntAmt;

      singleSellNetAmt.textContent = formatCurrency(sellNet);
      singleSellNetDays.textContent = `${days} días`;
    }
  };

  form.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateSingleNetPreview));
  form.querySelectorAll('select').forEach(sel => sel.addEventListener('change', updateSingleNetPreview));
  updateSingleNetPreview();

  const getSingleOperationForPrint = () => {
    const formData = new FormData(form);
    const buySideNameInput = content.querySelector('#buyside-contact-input').value.trim();
    const matchedBuySide = buyContacts.find(c => c.name.toLowerCase().trim() === buySideNameInput.toLowerCase());
    const buySideContactId = matchedBuySide ? matchedBuySide.id : buySideNameInput;

    const opData = {
      id: existingOp?.id || '',
      bank: formData.get('bank'),
      checkNumber: formData.get('checkNumber'),
      nominalValue: formData.get('nominalValue'),
      clearing: formData.get('clearing'),
      issueDate: formData.get('issueDate'),
      receptionDate: formData.get('receptionDate'),
      dueDate: formData.get('dueDate'),
      issuerName: formData.get('issuerName'),
      issuerCuit: formData.get('issuerCuit'),
      notes: formData.get('notes'),
      isECheck: formData.get('isECheck') === 'true',
      buySide: {
        contactId: buySideContactId,
        pesificacionRate: formData.get('buySide_pesificacionRate'),
        monthlyInterest: formData.get('buySide_monthlyInterest'),
        operationId: existingOp?.buySide?.operationId || ''
      }
    };
    const chk = new Check(opData);
    chk.calculate();
    return { chk, sellerName: buySideNameInput || 'Vendedor', recDate: opData.receptionDate };
  };

  const singlePrintPdfBtn = content.querySelector('#single-print-pdf-btn');
  if (singlePrintPdfBtn) {
    singlePrintPdfBtn.onclick = () => {
      const { chk, sellerName, recDate } = getSingleOperationForPrint();
      if (!chk.nominalValue || !chk.dueDate) {
        alert('Complete al menos el valor nominal y la fecha de pago para generar el comprobante.');
        return;
      }
      printBuyOperationReport(chk.buySide?.operationId || 'PROFORMA', sellerName, recDate, [chk], contacts, 'standard');
    };
  }

  const singlePrintThermalBtn = content.querySelector('#single-print-thermal-btn');
  if (singlePrintThermalBtn) {
    singlePrintThermalBtn.onclick = () => {
      const { chk, sellerName, recDate } = getSingleOperationForPrint();
      if (!chk.nominalValue || !chk.dueDate) {
        alert('Complete al menos el valor nominal y la fecha de pago para generar el comprobante térmico.');
        return;
      }
      printBuyOperationReport(chk.buySide?.operationId || 'PROFORMA', sellerName, recDate, [chk], contacts, 'thermal');
    };
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const buySideNameInput = content.querySelector('#buyside-contact-input').value.trim();
    const matchedBuySide = buyContacts.find(c => c.name.toLowerCase().trim() === buySideNameInput.toLowerCase());
    const buySideContactId = matchedBuySide ? matchedBuySide.id : buySideNameInput;

    const data = {
      id: existingOp?.id,
      bank: formData.get('bank'),
      checkNumber: formData.get('checkNumber'),
      nominalValue: formData.get('nominalValue'),
      clearing: formData.get('clearing'),
      issueDate: formData.get('issueDate'),
      receptionDate: formData.get('receptionDate'),
      dueDate: formData.get('dueDate'),
      issuerName: formData.get('issuerName'),
      issuerCuit: formData.get('issuerCuit'),
      notes: formData.get('notes'),
      isECheck: formData.get('isECheck') === 'true',
      buySide: {
        contactId: buySideContactId,
        pesificacionRate: formData.get('buySide_pesificacionRate'),
        monthlyInterest: formData.get('buySide_monthlyInterest')
      },
      sellSide: (() => {
        if (isEditing && existingOp?.sellSide) {
          // Preserve existing sellSide but allow status change from the edit form
          const statusEl = content.querySelector('#edit-sellside-status');
          const sellContactInput = content.querySelector('#sellside-contact-input');
          const sellPesif = formData.get('sellSide_pesificacionRate');
          const sellInterest = formData.get('sellSide_monthlyInterest');
          const sellBackReason = formData.get('sellSide_backReason');
          const newStatus = statusEl ? statusEl.value : existingOp.sellSide.status;
          const sellContactName = sellContactInput ? sellContactInput.value.trim() : '';
          const matchedSellContact = contacts.find(c => c.name.toLowerCase().trim() === sellContactName.toLowerCase());
          const sellContactId = matchedSellContact ? matchedSellContact.id : (sellContactName || existingOp.sellSide.contactId);
          return {
            ...existingOp.sellSide,
            status: newStatus,
            contactId: sellContactId || existingOp.sellSide.contactId,
            pesificacionRate: sellPesif !== null && sellPesif !== '' ? sellPesif : existingOp.sellSide.pesificacionRate,
            monthlyInterest: sellInterest !== null && sellInterest !== '' ? sellInterest : existingOp.sellSide.monthlyInterest,
            backReason: sellBackReason !== null ? sellBackReason : (existingOp.sellSide.backReason || '')
          };
        }
        return existingOp?.sellSide || {
          status: 'PENDING',
          contactId: null,
          pesificacionRate: '',
          monthlyInterest: '',
          backReason: ''
        };
      })(),
      movements: (() => {
        const chkInstance = existingOp instanceof Check ? existingOp : new Check(existingOp || {});
        let currentMovements = chkInstance.movements ? [...chkInstance.movements] : [];
        if (isEditing && currentMovements.length === 0) {
          currentMovements = chkInstance.getFullTimeline(contacts).map(m => ({
            id: m.id,
            type: m.type,
            title: m.title,
            description: m.description,
            details: m.details,
            date: m.date,
            createdAt: m.date
          }));
        }

        if (isEditing) {
          const prevStatus = existingOp?.sellSide?.status || 'PENDING';
          const statusEl = content.querySelector('#edit-sellside-status');
          const newStatus = statusEl ? statusEl.value : prevStatus;
          const sellContactInput = content.querySelector('#sellside-contact-input');
          const sellContactName = sellContactInput ? sellContactInput.value.trim() : '';
          const sellBackReason = formData.get('sellSide_backReason') || '';

          const statusLabels = {
            PENDING: 'En Cartera',
            SOLD: 'Vendido',
            RETURNED: 'Devuelto',
            BACK: 'Volvió',
            REJECTED: 'Rechazado'
          };

          if (prevStatus !== newStatus) {
            currentMovements.push({
              id: 'MOV-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase(),
              type: newStatus === 'REJECTED' ? 'REJECTED' : (newStatus === 'SOLD' ? 'SELL' : (newStatus === 'BACK' || newStatus === 'RETURNED' ? 'RETURNED' : 'STATUS_CHANGE')),
              title: newStatus === 'REJECTED' 
                ? '🔴 Cheque Marcado como Rechazado' 
                : (newStatus === 'SOLD' 
                  ? '🔵 Cheque Marcado como Vendido' 
                  : (newStatus === 'BACK' || newStatus === 'RETURNED'
                    ? '🔄 Cheque Retornado a Cartera'
                    : `✏️ Cambio de Estado: ${statusLabels[newStatus] || newStatus}`)),
              description: `El estado del cheque fue modificado de <strong>"${statusLabels[prevStatus] || prevStatus}"</strong> a <strong>"${statusLabels[newStatus] || newStatus}"</strong>.${sellBackReason ? ` Motivo: ${sellBackReason}` : ''}`,
              details: {
                prevStatus,
                newStatus,
                buyer: sellContactName || (existingOp?.sellSide?.contactId ? (contacts.find(c => c.id === existingOp.sellSide.contactId)?.name || existingOp.sellSide.contactId) : ''),
                backReason: sellBackReason,
                notes: formData.get('notes') || ''
              },
              date: Date.now(),
              createdAt: Date.now()
            });
          } else {
            currentMovements.push({
              id: 'MOV-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase(),
              type: 'EDIT',
              title: '✏️ Datos de Cheque Editados',
              description: `Se actualizaron los datos de la operación.${formData.get('notes') ? ` Notas: ${formData.get('notes')}` : ''}`,
              details: {
                nominalValue: parseFloat(formData.get('nominalValue')),
                dueDate: formData.get('dueDate'),
                issuerName: formData.get('issuerName')
              },
              date: Date.now(),
              createdAt: Date.now()
            });
          }
        }
        return currentMovements;
      })()
    };
    onSave(data);
    modal.remove();
  };

  const closeModal = () => modal.remove();
  content.querySelector('.btn-cancel').onclick = closeModal;
  content.querySelector('.btn-close-modal').onclick = closeModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}
export function showBatchBuyModal(buyContacts, onBatchBuy) {
  const today = new Date().toISOString().split('T')[0];

  const modal = el('div', {
    classes: ['modal-overlay'],
    style: 'position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;z-index:2000;padding:clamp(0.5rem,3vw,2rem);overflow-y:auto;'
  });

  const content = el('div', {
    classes: ['glass-card'],
    style: 'width:100%;max-width:1400px;margin:auto;padding:0;display:flex;flex-direction:column;max-height:calc(100vh - 3rem);border-radius:20px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.7);'
  });

  content.innerHTML = `
    <div style="flex-shrink:0;background:var(--card-bg);border-bottom:1px solid var(--border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;border-radius:20px 20px 0 0;z-index:10;">
      <h2 style="margin:0;font-size:clamp(1.1rem,3vw,1.35rem);font-weight:700;">📥 Compra Masiva de Cheques</h2>
      <button type="button" class="btn-close-modal" style="background:rgba(255,255,255,0.08);border:1px solid var(--border);color:var(--text-main);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>
    <div class="modal-scrollable-body" style="padding:clamp(1rem,3vw,1.75rem);overflow-y:auto;flex:1;overscroll-behavior:contain;">

      <div style="background:rgba(99,102,241,0.06);border:2px solid var(--primary);border-radius:14px;padding:1.25rem 1.5rem;margin-bottom:1.5rem;">
        <h3 style="margin:0 0 1rem;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--primary);font-weight:600;">🔗 Datos Comunes del Lote</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
          <div class="form-group" style="margin:0;">
            <label>Vendedor (Origen)</label>
            <input type="text" id="batch-seller-input" list="batch-contacts-dl" placeholder="🔎 Buscar..." autocomplete="off">
            <datalist id="batch-contacts-dl">
              ${buyContacts.map(c => `<option value="${c.name}"></option>`).join('')}
            </datalist>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Pesificación Compra (%)</label>
            <input type="number" step="0.01" id="batch-buy-pesif" placeholder="0.00">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Interés Mensual Compra (%)</label>
            <input type="number" step="0.01" id="batch-buy-interest" placeholder="0.00">
          </div>
          <div class="form-group" style="margin:0;">
            <label>F. Recepción</label>
            <input type="date" id="batch-reception-date" value="${today}">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Clearing (Días)</label>
            <input type="number" id="batch-clearing" value="0">
          </div>
          <div class="form-group" style="margin:0; grid-column: 1 / -1; margin-top: 0.5rem;">
            <label>Notas / Observaciones</label>
            <textarea id="batch-notes" rows="2" placeholder="Observaciones adicionales (se aplicará a todos los cheques del lote)..." style="resize: vertical;"></textarea>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
        <h3 style="margin:0;font-size:0.9rem;font-weight:700;">📄 Cheques del Lote</h3>
        <button type="button" id="batch-add-row" style="padding:0.55rem 1.4rem;border-radius:10px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;cursor:pointer;font-weight:700;font-size:0.875rem;box-shadow:0 3px 10px rgba(99,102,241,0.4);letter-spacing:0.02em;transition:opacity 0.2s;">+ Agregar cheque</button>
      </div>
      <div id="batch-rows-container" style="display:flex;flex-direction:column;gap:0.75rem;max-height:380px;overflow-y:auto;padding-right:4px;"></div>

      <div id="batch-summary" style="margin-top: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(99,102,241,0.12)); border: 2px solid rgba(99,102,241,0.4); border-radius: 16px; display: flex; gap: 2rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 2.5rem;">
          <div><span style="color:var(--text-muted);font-size:0.85rem;font-weight:700;text-transform:uppercase;">Cant. Cheques</span><br><strong id="sum-count" style="font-size:1.4rem;">0</strong></div>
          <div><span style="color:var(--text-muted);font-size:0.85rem;font-weight:700;text-transform:uppercase;">Nominal Total</span><br><strong id="sum-nominal" style="font-size:1.4rem;">$0,00</strong></div>
        </div>
        <div style="text-align: right; background: rgba(0,0,0,0.15); padding: 1rem 1.5rem; border-radius: 12px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
          <span style="color:var(--text-muted);font-size:0.9rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Neto a Pagar (Total)</span><br>
          <strong id="sum-net" style="color:var(--primary);font-size:2.2rem;font-weight:800;text-shadow:0 2px 10px rgba(99,102,241,0.2);line-height:1.2;">$0,00</strong>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1.5rem;flex-wrap:wrap;gap:1rem;">
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" id="batch-print-pdf-btn" style="padding:0.85rem 1.35rem;border-radius:12px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.35);color:#818cf8;font-size:0.88rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.4rem;transition:all 0.2s;">🖨️ Imprimir PDF</button>
          <button type="button" id="batch-print-thermal-btn" style="padding:0.85rem 1.35rem;border-radius:12px;background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.35);color:#60a5fa;font-size:0.88rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.4rem;transition:all 0.2s;">🧾 Térmico</button>
          <button type="button" id="batch-excel-btn" style="padding:0.85rem 1.35rem;border-radius:12px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);color:#34d399;font-size:0.88rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.4rem;transition:all 0.2s;">📥 Excel</button>
        </div>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;">
          <button type="button" class="btn-cancel" style="padding:0.85rem 2rem;border-radius:12px;background:rgba(255,255,255,0.06);color:var(--text-main);font-size:1rem;font-weight:600;border:1px solid var(--outline);cursor:pointer;">Cancelar</button>
          <button type="button" id="batch-save-btn" style="padding:0.85rem 2.5rem;border-radius:12px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-size:1rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 15px rgba(99,102,241,0.4);">Guardar Lote</button>
        </div>
      </div>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const rowsContainer = content.querySelector('#batch-rows-container');

  function calcRowNet(nomVal, pesif, interest, receptionDate, dueDate, clearing) {
    const nv = parseFloat(nomVal) || 0;
    const p = parseFloat(pesif) || 0;
    const ir = parseFloat(interest) || 0;
    const cl = parseInt(clearing) || 0;
    if (!receptionDate || !dueDate || nv === 0) return null;
    const rec = new Date(receptionDate + 'T00:00:00');
    const due = new Date(dueDate + 'T00:00:00');
    const days = Math.max(0, Math.ceil((due - rec) / 86400000) + cl);
    const pesifAmt = nv * (p / 100);
    const intAmt = nv * (ir / 100 / 30) * days;
    return { net: nv - pesifAmt - intAmt, days, nv };
  }

  function updateSummary() {
    const rows = rowsContainer.querySelectorAll('.batch-check-row');
    const pesif = content.querySelector('#batch-buy-pesif').value;
    const interest = content.querySelector('#batch-buy-interest').value;
    const recDate = content.querySelector('#batch-reception-date').value;
    const clearing = content.querySelector('#batch-clearing').value;
    let totalNominal = 0;
    let totalNet = 0;
    let validCount = 0;
    rows.forEach(row => {
      const nv = row.querySelector('.row-nominal').value;
      const dd = row.querySelector('.row-duedate').value;
      const calc = calcRowNet(nv, pesif, interest, recDate, dd, clearing);
      if (calc) {
        totalNominal += calc.nv;
        totalNet += calc.net;
        validCount++;
        const netEl = row.querySelector('.row-net-preview');
        if (netEl) netEl.textContent = `Neto: ${formatCurrency(calc.net)} (${calc.days}d)`;
      }
    });
    content.querySelector('#sum-count').textContent = rows.length;
    content.querySelector('#sum-nominal').textContent = formatCurrency(totalNominal);
    content.querySelector('#sum-net').textContent = formatCurrency(totalNet);
  }

  function addRow() {
    const row = el('div', {
      classes: ['batch-check-row'],
      style: 'background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:0.85rem 1rem;display:flex;flex-direction:column;gap:0.65rem;'
    });
    row.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:0.75rem;align-items:end;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">Banco</label>
          <input type="text" class="row-bank" placeholder="Ej: BNA" style="font-size:0.9rem;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;"># Cheque</label>
          <input type="text" class="row-number" placeholder="12345678" style="font-size:0.9rem;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">Nominal ($)</label>
          <input type="number" step="0.01" class="row-nominal" placeholder="0.00" style="font-size:0.9rem;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">F. Pago</label>
          <input type="date" class="row-duedate" style="font-size:0.9rem;">
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem;">
          <button type="button" class="row-remove-btn" style="background:rgba(239,68,68,0.15);border:1px solid var(--danger);color:var(--danger);border-radius:6px;padding:0.3rem 0.6rem;cursor:pointer;font-size:0.8rem;font-weight:700;">✕</button>
          <span class="row-net-preview" style="font-size:0.85rem;font-weight:700;color:var(--primary);background:rgba(99,102,241,0.15);padding:0.4rem 0.8rem;border-radius:6px;border:1px solid rgba(99,102,241,0.3);white-space:nowrap;display:inline-block;min-width:120px;text-align:center;">Neto: $0,00</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1.2fr 1.2fr 0.8fr;gap:0.75rem;align-items:end;padding-top:0.15rem;border-top:1px solid rgba(255,255,255,0.06);">
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">👤 Librador</label>
          <input type="text" class="row-issuer-name" placeholder="Nombre del librador" style="font-size:0.9rem;">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">CUIT Librador</label>
          <div style="display:flex;gap:0.4rem;">
            <input type="text" class="row-issuer-cuit" placeholder="20-XXXXXXXX-X" style="font-size:0.9rem;flex:1;">
            <button type="button" class="row-bcra-btn" title="Consultar Central de Deudores BCRA" style="padding:0 0.8rem;border-radius:8px;background:#2563eb;color:white;border:none;cursor:pointer;font-size:0.75rem;font-weight:700;white-space:nowrap;flex-shrink:0;">🔍 BCRA</button>
          </div>
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.78rem;">Tipo</label>
          <select class="row-isecheck" style="width:100%;height:38px;padding:0 0.5rem;border-radius:8px;background:rgba(0,0,0,0.2);border:1px solid var(--border);color:var(--text-main);font-family:inherit;outline:none;font-size:0.85rem;font-weight:600;">
            <option value="false">Físico</option>
            <option value="true">E-Cheque</option>
          </select>
        </div>
      </div>
    `;
    row.querySelector('.row-remove-btn').onclick = () => { row.remove(); updateSummary(); };
    row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateSummary));
    row.querySelector('.row-bcra-btn').onclick = () => {
      const cuitVal = row.querySelector('.row-issuer-cuit').value;
      copyToClipboardAndOpenBcra(cuitVal);
    };
    rowsContainer.appendChild(row);
    updateSummary();
  }

  addRow(); addRow(); addRow();

  content.querySelector('#batch-add-row').onclick = addRow;

  content.querySelectorAll('#batch-buy-pesif, #batch-buy-interest, #batch-reception-date, #batch-clearing')
    .forEach(inp => inp.addEventListener('input', updateSummary));

  const extractBatchOperations = () => {
    const sellerName = content.querySelector('#batch-seller-input').value.trim();
    const matchedSeller = buyContacts.find(c => c.name.toLowerCase() === sellerName.toLowerCase());
    const sellerId = matchedSeller ? matchedSeller.id : (sellerName || null);
    const pesif = content.querySelector('#batch-buy-pesif').value;
    const interest = content.querySelector('#batch-buy-interest').value;
    const recDate = content.querySelector('#batch-reception-date').value;
    const clearing = content.querySelector('#batch-clearing').value;
    const batchNotes = content.querySelector('#batch-notes').value.trim();

    const rows = rowsContainer.querySelectorAll('.batch-check-row');
    const ops = [];
    rows.forEach(row => {
      const bank = row.querySelector('.row-bank').value.trim();
      const num = row.querySelector('.row-number').value.trim();
      const nv = row.querySelector('.row-nominal').value;
      const dueDate = row.querySelector('.row-duedate').value;
      const issuerName = row.querySelector('.row-issuer-name').value.trim();
      const issuerCuit = row.querySelector('.row-issuer-cuit').value.trim();
      const isECheck = row.querySelector('.row-isecheck').value === 'true';
      if (!nv || !dueDate) return; // skip empty rows
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
    return { ops, sellerName, recDate };
  };

  content.querySelector('#batch-print-pdf-btn').onclick = () => {
    const { ops, sellerName, recDate } = extractBatchOperations();
    if (ops.length === 0) {
      alert('Agregue al menos un cheque con valor nominal y fecha de pago para imprimir.');
      return;
    }
    printBuyOperationReport('PROFORMA', sellerName || 'PROFORMA', recDate, ops, buyContacts, 'standard');
  };

  content.querySelector('#batch-print-thermal-btn').onclick = () => {
    const { ops, sellerName, recDate } = extractBatchOperations();
    if (ops.length === 0) {
      alert('Agregue al menos un cheque con valor nominal y fecha de pago para imprimir ticket térmico.');
      return;
    }
    printBuyOperationReport('PROFORMA', sellerName || 'PROFORMA', recDate, ops, buyContacts, 'thermal');
  };

  content.querySelector('#batch-excel-btn').onclick = () => {
    const { ops, sellerName, recDate } = extractBatchOperations();
    if (ops.length === 0) {
      alert('Agregue al menos un cheque con valor nominal y fecha de pago para exportar a Excel.');
      return;
    }
    generateBuyOperationExcel('PROFORMA', sellerName || 'PROFORMA', recDate, ops, buyContacts);
  };

  content.querySelector('#batch-save-btn').onclick = () => {
    const { ops } = extractBatchOperations();
    if (ops.length === 0) { alert('Agregue al menos un cheque con valor nominal y fecha de pago.'); return; }
    onBatchBuy(ops);
    modal.remove();
  };

  const closeModal = () => modal.remove();
  content.querySelector('.btn-cancel').onclick = closeModal;
  content.querySelector('.btn-close-modal').onclick = closeModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}
// ─────────────────────────────────────────────────────────────────
// VENTA MASIVA
// ─────────────────────────────────────────────────────────────────
export function showBatchSellModal(contacts, selectedChecks, onBatchSell, onDone, isNominalOnly = false) {
  const modal = el('div', {
    classes: ['modal-overlay'],
    style: 'position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;z-index:2000;padding:clamp(0.5rem,3vw,2rem);overflow-y:auto;'
  });

  const content = el('div', {
    classes: ['glass-card'],
    style: 'width:100%;max-width:1150px;margin:auto;padding:0;overflow:hidden;border-radius:20px;display:flex;flex-direction:column;max-height:calc(100vh - 3rem);box-shadow:0 25px 60px rgba(0,0,0,0.7);'
  });

  content.innerHTML = `
    <div style="background:var(--card-bg);border-bottom:1px solid var(--border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;border-radius:20px 20px 0 0;flex-shrink:0;z-index:10;">
      <h2 style="margin:0;font-size:1.2rem;font-weight:700;">📤 Venta de ${selectedChecks.length} Cheque${selectedChecks.length > 1 ? 's' : ''}</h2>
      <button type="button" class="btn-close-modal" style="background:rgba(255,255,255,0.08);border:1px solid var(--border);color:var(--text-main);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>
    <div class="modal-scrollable-body" style="padding:1.5rem 2rem;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:1.25rem;overscroll-behavior:contain;">
      <p style="margin:0;color:var(--text-muted);font-size:0.9rem;">Los datos de venta se aplicarán a los <strong>${selectedChecks.length}</strong> cheque(s) seleccionados.</p>

      <!-- Resumen de Cheques Seleccionados -->
      <div>
        <h3 style="margin:0 0 0.5rem;font-size:0.9rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">📋 Detalle Completo de la Selección</h3>
        <div style="max-height:260px;overflow-y:auto;border:1px solid var(--border);border-radius:12px;background:rgba(0,0,0,0.15);scrollbar-width:thin;">
          <table style="width:100%;border-collapse:collapse;font-size:0.82rem;text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid var(--border);background:rgba(255,255,255,0.03);color:var(--text-muted);font-weight:700;text-transform:uppercase;font-size:0.72rem;letter-spacing:0.5px;">
                <th style="padding:0.6rem 0.85rem;">Banco / Nº</th>
                <th style="padding:0.6rem 0.85rem;">Librador / CUIT</th>
                <th style="padding:0.6rem 0.85rem;">Fechas / Días</th>
                <th style="padding:0.6rem 0.85rem;text-align:right;">Nominal</th>
                ${!isNominalOnly ? `
                <th style="padding:0.6rem 0.85rem;text-align:right;color:#fbbf24;">Neto Compra</th>
                <th style="padding:0.6rem 0.85rem;text-align:right;color:#60a5fa;">Neto Venta</th>
                <th style="padding:0.6rem 0.85rem;text-align:right;color:#34d399;">Ganancia</th>
                ` : ''}
              </tr>
            </thead>
            <tbody id="bsell-checks-tbody"></tbody>
            <tfoot>
              <tr style="border-top:1px solid var(--border);font-weight:800;background:rgba(255,255,255,0.03);font-size:0.85rem;color:#ffffff;">
                <td colspan="3" style="padding:0.65rem 0.85rem;text-transform:uppercase;">TOTALES</td>
                <td id="bsell-total-nominal" style="padding:0.65rem 0.85rem;text-align:right;font-family:monospace;color:#ffffff;">$0.00</td>
                ${!isNominalOnly ? `
                <td id="bsell-total-buy-net" style="padding:0.65rem 0.85rem;text-align:right;font-family:monospace;color:#fbbf24;">$0.00</td>
                <td id="bsell-total-net" style="padding:0.65rem 0.85rem;text-align:right;font-family:monospace;color:#60a5fa;">$0.00</td>
                <td id="bsell-total-profit" style="padding:0.65rem 0.85rem;text-align:right;font-family:monospace;color:#34d399;">$0.00</td>
                ` : ''}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr;gap:1.25rem;">
        <div class="form-group" style="margin:0;">
          <label>Comprador / Destinatario</label>
          <input type="text" id="bsell-buyer-input" list="bsell-contacts-dl" placeholder="🔎 Buscar..." autocomplete="off">
          <datalist id="bsell-contacts-dl">
            ${contacts.map(c => `<option value="${c.name}"></option>`).join('')}
          </datalist>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
          <div class="form-group" style="margin:0;">
            <label>Pesificación (%)</label>
            <input type="number" step="0.01" id="bsell-pesif" placeholder="0.00">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Interés Mensual (%)</label>
            <input type="number" step="0.01" id="bsell-interest" placeholder="0.00">
          </div>
        </div>
        <div class="form-group" style="margin:0;">
          <label>Estado</label>
          <select id="bsell-status" style="${getSelectStyle('var(--success)','#10b981')} padding:0.55rem 0.75rem;">
            <option value="SOLD">Vendido</option>
            <option value="PENDING">En Cartera</option>
            <option value="RETURNED">Devuelto</option>
            <option value="BACK">Volvió</option>
            <option value="REJECTED">Rechazado</option>
          </select>
        </div>
        <div class="form-group" id="bsell-backreason-group" style="margin:0;display:none;">
          <label>⚠️ Motivo de Retorno</label>
          <textarea id="bsell-backreason" rows="2" style="resize:vertical;" placeholder="Motivo..."></textarea>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1.25rem;flex-wrap:wrap;gap:1rem;flex-shrink:0;">
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" id="bsell-print-btn" style="padding:0.75rem 1.25rem;border-radius:12px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.35);color:#818cf8;font-size:0.85rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.4rem;transition:all 0.2s;">🖨️ Imprimir</button>
          <button type="button" id="bsell-excel-btn" style="padding:0.75rem 1.25rem;border-radius:12px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);color:#34d399;font-size:0.85rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.4rem;transition:all 0.2s;">📥 Excel</button>
        </div>
        <div style="display:flex;gap:0.75rem;">
          <button type="button" class="btn-cancel" style="padding:0.75rem 1.75rem;border-radius:12px;background:rgba(255,255,255,0.06);color:var(--text-main);font-size:0.88rem;font-weight:600;border:1px solid var(--outline);cursor:pointer;transition:all 0.2s;">Cancelar</button>
          <button type="button" id="bsell-save-btn" style="padding:0.75rem 2.25rem;border-radius:12px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:0.88rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.4);transition:all 0.2s;">Aplicar Venta</button>
        </div>
      </div>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const statusSel = content.querySelector('#bsell-status');
  const backReasonGrp = content.querySelector('#bsell-backreason-group');
  statusSel.addEventListener('change', () => {
    backReasonGrp.style.display = statusSel.value === 'BACK' ? 'block' : 'none';
  });

  let projectedChecks = [];

  const updateCalculations = () => {
    const pesifRate = parseFloat(content.querySelector('#bsell-pesif').value) || 0;
    const intRate = parseFloat(content.querySelector('#bsell-interest').value) || 0;

    let sumNominal = 0;
    let sumBuyNet = 0;
    let sumNet = 0;
    let sumProfit = 0;

    const tbody = content.querySelector('#bsell-checks-tbody');
    tbody.innerHTML = '';

    projectedChecks = selectedChecks.map(c => {
      const op = new Check(JSON.parse(JSON.stringify(c)));
      if (!op.sellSide) op.sellSide = {};
      op.sellSide.status = 'SOLD';
      op.sellSide.pesificacionRate = pesifRate;
      op.sellSide.monthlyInterest = intRate;
      op.calculate();

      sumNominal += op.nominalValue;
      sumBuyNet += op.buySide?.netAmount || 0;
      sumNet += op.sellSide.netAmount;
      sumProfit += op.profit;

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
      tr.innerHTML = `
        <td style="padding:0.55rem 0.85rem;">
          <div style="font-weight:700;color:#ffffff;">${op.bank || '-'}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">Nº ${op.checkNumber || '-'}</div>
        </td>
        <td style="padding:0.55rem 0.85rem;">
          <div style="font-weight:600;color:#ffffff;">${op.issuerName || '-'}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;">CUIT ${op.issuerCuit || '-'}</div>
        </td>
        <td style="padding:0.55rem 0.85rem;">
          <div style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">Rec: ${formatDateLocal(op.receptionDate)}</div>
          <div style="font-weight:700;color:#ffffff;font-size:0.85rem;">Venc: ${formatDateLocal(op.dueDate)}</div>
          <div style="font-size:10px;color:var(--text-muted);font-weight:600;">${op.days || 0}d (Clear: ${op.clearing || 0}d)</div>
        </td>
        <td style="padding:0.55rem 0.85rem;text-align:right;font-family:monospace;font-weight:700;color:#ffffff;">${formatCurrency(op.nominalValue)}</td>
        ${!isNominalOnly ? `
        <td style="padding:0.55rem 0.85rem;text-align:right;font-family:monospace;color:#fbbf24;font-weight:700;">${formatCurrency(op.buySide?.netAmount || 0)}</td>
        <td style="padding:0.55rem 0.85rem;text-align:right;font-family:monospace;color:#60a5fa;font-weight:700;">${formatCurrency(op.sellSide.netAmount)}</td>
        <td style="padding:0.55rem 0.85rem;text-align:right;font-family:monospace;color:#34d399;font-weight:700;">+${formatCurrency(op.profit)}</td>
        ` : ''}
      `;
      tbody.appendChild(tr);

      return op;
    });

    content.querySelector('#bsell-total-nominal').textContent = formatCurrency(sumNominal);
    if (!isNominalOnly) {
      content.querySelector('#bsell-total-buy-net').textContent = formatCurrency(sumBuyNet);
      content.querySelector('#bsell-total-net').textContent = formatCurrency(sumNet);
      content.querySelector('#bsell-total-profit').textContent = formatCurrency(sumProfit);
    }
  };

  content.querySelector('#bsell-pesif').addEventListener('input', updateCalculations);
  content.querySelector('#bsell-interest').addEventListener('input', updateCalculations);
  updateCalculations();

  // Button transitions and event attachments
  content.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.03)';
      btn.style.filter = 'brightness(1.15)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.filter = 'none';
    });
  });

  content.querySelector('#bsell-print-btn').onclick = () => {
    const buyerName = content.querySelector('#bsell-buyer-input').value.trim() || 'PROFORMA';
    printSaleOperationReport('PROFORMA', buyerName, new Date().toISOString(), projectedChecks, contacts);
  };

  content.querySelector('#bsell-excel-btn').onclick = () => {
    const buyerName = content.querySelector('#bsell-buyer-input').value.trim() || 'PROFORMA';
    generateSaleOperationExcel('PROFORMA', buyerName, new Date().toISOString(), projectedChecks, contacts);
  };

  content.querySelector('#bsell-save-btn').onclick = () => {
    const buyerName = content.querySelector('#bsell-buyer-input').value.trim();
    const matched = contacts.find(c => c.name.toLowerCase() === buyerName.toLowerCase());
    const buyerId = matched ? matched.id : (buyerName || null);
    const sellData = {
      status: statusSel.value,
      contactId: buyerId,
      pesificacionRate: content.querySelector('#bsell-pesif').value,
      monthlyInterest: content.querySelector('#bsell-interest').value,
      backReason: content.querySelector('#bsell-backreason').value || ''
    };
    // Pass mapped Check IDs
    const checkIds = selectedChecks.map(c => c.id);
    onBatchSell(sellData, checkIds);
    if (onDone) onDone();
    modal.remove();
  };

  const closeModal = () => modal.remove();
  content.querySelector('.btn-cancel').onclick = closeModal;
  content.querySelector('.btn-close-modal').onclick = closeModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

/**
 * Muestra el modal con la línea de tiempo del historial de movimientos del cheque.
 * @param {Check|Object} check - Entidad o datos del cheque.
 * @param {Array<Object>} contacts - Catálogo de contactos para resolver nombres.
 */
export function showCheckMovementsModal(check, contacts = []) {
  const chk = check instanceof Check ? check : new Check(check || {});
  chk.calculate();
  const timeline = chk.getFullTimeline(contacts);

  const overlay = el('div', { 
    classes: ['modal-overlay', 'fade-in'], 
    style: 'position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.82); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: clamp(0.5rem, 3vw, 2rem); overflow-y: auto;' 
  });

  const modal = el('div', { 
    classes: ['glass-card'], 
    style: 'background: var(--modal-bg, #16171d); max-width: 620px; width: 100%; max-height: calc(100vh - 3rem); overflow-y: auto; display: flex; flex-direction: column; padding: 0; position: relative; border: 1px solid var(--border); border-radius: 20px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7); margin: auto; overscroll-behavior: contain;' 
  });

  const statusChipHtml = (() => {
    const status = chk.sellSide?.status || 'PENDING';
    if (status === 'SOLD') return '<span style="font-size:0.75rem;font-weight:800;padding:0.2rem 0.6rem;border-radius:6px;background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3);">VENDIDO</span>';
    if (status === 'REJECTED') return '<span style="font-size:0.75rem;font-weight:800;padding:0.2rem 0.6rem;border-radius:6px;background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);">RECHAZADO</span>';
    if (status === 'BACK') return '<span style="font-size:0.75rem;font-weight:800;padding:0.2rem 0.6rem;border-radius:6px;background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);">VOLVIÓ</span>';
    if (status === 'RETURNED') return '<span style="font-size:0.75rem;font-weight:800;padding:0.2rem 0.6rem;border-radius:6px;background:rgba(139,92,246,0.15);color:#a78bfa;border:1px solid rgba(139,92,246,0.3);">DEVUELTO</span>';
    return '<span style="font-size:0.75rem;font-weight:800;padding:0.2rem 0.6rem;border-radius:6px;background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3);">EN CARTERA</span>';
  })();

  modal.innerHTML = `
    <div style="flex-shrink: 0; background: var(--card-bg); border-bottom: 1px solid var(--border); padding: 1.25rem 1.75rem; display: flex; align-items: center; justify-content: space-between; border-radius: 20px 20px 0 0; z-index: 10;">
      <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
        <span style="font-size: 1.3rem;">🕒</span>
        <div>
          <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main);">
            Historial de Movimientos
          </h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-top: 0.15rem;">
            Nº ${chk.checkNumber || 'S/N'} • ${chk.bank || 'Sin banco'}
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        ${statusChipHtml}
        <button type="button" id="hist-close-x-btn" style="background: rgba(255,255,255,0.08); border: 1px solid var(--border); color: var(--text-main); width: 34px; height: 34px; border-radius: 50%; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center;">✕</button>
      </div>
    </div>

    <div style="padding: 1.5rem 1.75rem; overflow-y: auto; flex: 1;">
      <!-- Resumen del Cheque -->
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.85rem;">
        <div>
          <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Valor Nominal</div>
          <div style="font-size: 1.1rem; font-weight: 800; font-family: monospace; color: #ffffff; margin-top: 0.15rem;">${formatCurrency(chk.nominalValue)}</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">F. Pago / Cobro</div>
          <div style="font-size: 0.92rem; font-weight: 700; color: var(--primary); margin-top: 0.15rem;">📅 ${formatDateLocal(chk.dueDate)}</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Librador</div>
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-top: 0.15rem;">${chk.issuerName || '-'}</div>
          ${chk.issuerCuit ? `<div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">CUIT: ${chk.issuerCuit}</div>` : ''}
        </div>
      </div>

      <!-- Línea de Tiempo -->
      <h4 style="margin: 0 0 1rem; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 700;">
        📜 Secuencia Cronológica (${timeline.length} evento${timeline.length > 1 ? 's' : ''})
      </h4>

      <div class="timeline-container" style="position: relative; padding-left: 26px; border-left: 2px solid rgba(255,255,255,0.1); margin-left: 10px; display: flex; flex-direction: column; gap: 1.5rem;">
        ${timeline.map((e, index) => {
          const typeColors = {
            BUY: '#10b981',
            SELL: '#3b82f6',
            REJECTED: '#ef4444',
            RETURNED: '#8b5cf6',
            CONFIRMATION_VOLVIO: '#14b8a6',
            CONFIRMATION_COMPANY: '#6366f1',
            CONFIRMATION_SELLER: '#a855f7',
            UNDO_SALE: '#f43f5e',
            STATUS_CHANGE: '#f59e0b',
            EDIT: '#06b6d4'
          };
          const dotColor = typeColors[e.type] || 'var(--primary)';
          const isLast = index === timeline.length - 1;

          return `
            <div class="timeline-item" style="position: relative;">
              <div style="position: absolute; left: -33px; top: 3px; width: 14px; height: 14px; border-radius: 50%; background: ${dotColor}; border: 3px solid var(--modal-bg, #16171d); box-shadow: 0 0 8px ${dotColor}88;"></div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">🕒 ${e.dateStr}</span>
                ${isLast ? '<span style="font-size: 0.65rem; font-weight: 800; background: rgba(99,102,241,0.2); color: #818cf8; border: 1px solid rgba(99,102,241,0.4); padding: 0.1rem 0.4rem; border-radius: 4px; text-transform: uppercase;">Actual</span>' : ''}
              </div>
              <div style="font-weight: 750; font-size: 0.95rem; color: var(--text-main); margin-bottom: 0.25rem;">
                ${e.title}
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.45;">
                ${e.description}
              </div>
              ${e.details ? `
                <div style="margin-top: 0.5rem; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.78rem; display: flex; flex-wrap: wrap; gap: 0.5rem 1rem;">
                  ${e.details.seller ? `<div><strong style="color:var(--text-muted);">Vendedor:</strong> <span style="color:#ffffff;">${e.details.seller}</span></div>` : ''}
                  ${e.details.buyer ? `<div><strong style="color:var(--text-muted);">Comprador:</strong> <span style="color:#ffffff;">${e.details.buyer}</span></div>` : ''}
                  ${e.details.netAmount !== undefined ? `<div><strong style="color:var(--text-muted);">Neto:</strong> <span style="color:#10b981; font-family:monospace; font-weight:700;">${formatCurrency(e.details.netAmount)}</span></div>` : ''}
                  ${e.details.pesificacionRate ? `<div><strong style="color:var(--text-muted);">Pesif:</strong> <span style="color:#ffffff;">${e.details.pesificacionRate}%</span></div>` : ''}
                  ${e.details.monthlyInterest ? `<div><strong style="color:var(--text-muted);">Int. Mensual:</strong> <span style="color:#ffffff;">${e.details.monthlyInterest}%</span></div>` : ''}
                  ${e.details.operationId && e.details.operationId !== 'S/N' ? `<div><strong style="color:var(--text-muted);">Op ID:</strong> <span style="color:#818cf8; font-family:monospace;">${e.details.operationId}</span></div>` : ''}
                  ${e.details.reason ? `<div style="width:100%;"><strong style="color:#f87171;">Motivo:</strong> <span style="color:#f87171;">${e.details.reason}</span></div>` : ''}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div style="flex-shrink: 0; background: var(--card-bg); border-top: 1px solid var(--border); padding: 1rem 1.75rem; display: flex; justify-content: flex-end; border-radius: 0 0 20px 20px;">
      <button type="button" id="hist-close-footer-btn" class="btn-secondary" style="padding: 0.6rem 1.5rem; border-radius: 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer;">
        Cerrar
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();
  modal.querySelector('#hist-close-x-btn').onclick = closeModal;
  modal.querySelector('#hist-close-footer-btn').onclick = closeModal;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
}

