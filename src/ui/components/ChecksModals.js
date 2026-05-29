/**
 * ChecksModals.js
 * Modales del módulo de Cheques:
 *  - showOperationModal: formulario individual (compra/edición).
 *  - showBatchBuyModal:  compra masiva de lote.
 *  - showBatchSellModal: venta masiva de selección.
 */
import { el } from '../../utils/dom.js';
import { formatCurrency, formatDateLocal } from '../../utils/formatters.js';
import { Check } from '../../domain/entities/Check.js';
import { printSaleOperationReport, generateSaleOperationExcel } from '../reports/ReportService.js';

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
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: flex-start; justify-content: center; z-index: 2000; padding: clamp(0.5rem, 3vw, 2rem); overflow-y: auto;'
  });

  const content = el('div', { 
    classes: ['glass-card'],
    style: 'width: 100%; max-width: 1100px; margin: auto; padding: 0; overflow: hidden; border-radius: 20px;'
  });

  content.innerHTML = `
    <div style="position: sticky; top: 0; z-index: 10; background: var(--card-bg); border-bottom: 1px solid var(--border); padding: 1.25rem 2rem; display: flex; align-items: center; justify-content: space-between; border-radius: 20px 20px 0 0;">
      <h2 style="margin: 0; font-size: clamp(1.1rem, 3vw, 1.4rem); font-weight: 700;">${isEditing ? '✏️ Editar' : '💸 Nueva'} Operación de Cheque</h2>
      <button type="button" class="btn-close-modal" style="background: rgba(255,255,255,0.08); border: 1px solid var(--border); color: var(--text-main); width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s;">✕</button>
    </div>

    <div style="padding: clamp(1rem, 3vw, 2rem);">
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
            <input type="number" step="0.01" name="buySide_pesificacionRate" value="${existingOp?.buySide?.pesificacionRate || ''}" required>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Interés Mensual (%)</label>
            <input type="number" step="0.01" name="buySide_monthlyInterest" value="${existingOp?.buySide?.monthlyInterest || ''}" required>
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
            <input type="number" step="0.01" name="sellSide_pesificacionRate" value="${existingOp.sellSide.pesificacionRate || ''}" placeholder="0.00">
          </div>
          <div class="form-group" style="margin:0;">
            <label>Interés Mensual Venta (%)</label>
            <input type="number" step="0.01" name="sellSide_monthlyInterest" value="${existingOp.sellSide.monthlyInterest || ''}" placeholder="0.00">
          </div>
          <div class="form-group" id="edit-backreason-group" style="margin:0; grid-column: 1 / -1; display:${existingOp.sellSide.status === 'BACK' ? 'block' : 'none'};">
            <label>⚠️ Motivo de Retorno</label>
            <textarea name="sellSide_backReason" rows="2" style="resize:vertical;" placeholder="Motivo...">${existingOp.sellSide.backReason || ''}</textarea>
          </div>
        </div>
      </div>` : ''}

      <div class="form-group">
        <label>Notas / Observaciones</label>
        <textarea name="notes" rows="2" placeholder="Observaciones adicionales..." style="resize: vertical;">${existingOp?.notes || ''}</textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap;">
        <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.06); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer; min-width: 120px;">Cancelar</button>
        <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; font-size: 1rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(99,102,241,0.4); letter-spacing: 0.03em; min-width: 180px;">Guardar Operación</button>
      </div>

    </form>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  content.querySelector('#btn-bcra').onclick = () => {
    const cuitInput = content.querySelector('#issuer-cuit');
    const cuit = cuitInput.value.replace(/\D/g, '');
    if (!cuit || cuit.length < 11) {
      alert('Por favor ingrese un CUIT válido (11 dígitos).');
      return;
    }
    
    navigator.clipboard.writeText(cuit).then(() => {
      alert(`CUIT ${cuit} copiado al portapapeles.\n\nSe abrirá la web del BCRA. Pega el CUIT allí para consultar.`);
      window.open('https://www.bcra.gob.ar/situacion-crediticia/', '_blank');
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
      window.open('https://www.bcra.gob.ar/situacion-crediticia/', '_blank');
    });
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

    if (!recDate || !dueDate || nv === 0) {
      content.querySelector('#single-net-amount').textContent = '$0,00';
      content.querySelector('#single-net-days').textContent = '0 días';
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
  };

  form.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateSingleNetPreview));
  updateSingleNetPreview();

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
    style: 'position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:flex-start;justify-content:center;z-index:2000;padding:clamp(0.5rem,3vw,2rem);overflow-y:auto;'
  });

  const content = el('div', {
    classes: ['glass-card'],
    style: 'width:100%;max-width:1400px;margin:auto;padding:0;overflow:hidden;border-radius:20px;'
  });

  content.innerHTML = `
    <div style="position:sticky;top:0;z-index:10;background:var(--card-bg);border-bottom:1px solid var(--border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;border-radius:20px 20px 0 0;">
      <h2 style="margin:0;font-size:clamp(1.1rem,3vw,1.35rem);font-weight:700;">📥 Compra Masiva de Cheques</h2>
      <button type="button" class="btn-close-modal" style="background:rgba(255,255,255,0.08);border:1px solid var(--border);color:var(--text-main);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>
    <div style="padding:clamp(1rem,3vw,1.75rem);">

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

      <div style="display:flex;justify-content:flex-end;gap:1rem;margin-top:1.5rem;flex-wrap:wrap;">
        <button type="button" class="btn-cancel" style="padding:0.85rem 2rem;border-radius:12px;background:rgba(255,255,255,0.06);color:var(--text-main);font-size:1rem;font-weight:600;border:1px solid var(--outline);cursor:pointer;">Cancelar</button>
        <button type="button" id="batch-save-btn" style="padding:0.85rem 2.5rem;border-radius:12px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;font-size:1rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 15px rgba(99,102,241,0.4);">Guardar Lote</button>
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
      const cuit = row.querySelector('.row-issuer-cuit').value.replace(/\D/g, '');
      if (!cuit || cuit.length < 11) { alert('Por favor ingrese un CUIT válido (11 dígitos).'); return; }
      navigator.clipboard.writeText(cuit).then(() => {
        alert(`CUIT ${cuit} copiado al portapapeles.\n\nSe abrirá la web del BCRA. Pega el CUIT allí para consultar.`);
        window.open('https://www.bcra.gob.ar/situacion-crediticia/', '_blank');
      }).catch(() => window.open('https://www.bcra.gob.ar/situacion-crediticia/', '_blank'));
    };
    rowsContainer.appendChild(row);
    updateSummary();
  }

  addRow(); addRow(); addRow();

  content.querySelector('#batch-add-row').onclick = addRow;

  content.querySelectorAll('#batch-buy-pesif, #batch-buy-interest, #batch-reception-date, #batch-clearing')
    .forEach(inp => inp.addEventListener('input', updateSummary));

  content.querySelector('#batch-save-btn').onclick = () => {
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
      ops.push({
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
    });

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
    style: 'position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;z-index:2000;padding:clamp(0.5rem,3vw,2rem);'
  });

  const content = el('div', {
    classes: ['glass-card'],
    style: 'width:100%;max-width:1150px;padding:0;overflow:hidden;border-radius:20px;display:flex;flex-direction:column;max-height:90vh;'
  });

  content.innerHTML = `
    <div style="background:var(--card-bg);border-bottom:1px solid var(--border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;border-radius:20px 20px 0 0;flex-shrink:0;">
      <h2 style="margin:0;font-size:1.2rem;font-weight:700;">📤 Venta de ${selectedChecks.length} Cheque${selectedChecks.length > 1 ? 's' : ''}</h2>
      <button type="button" class="btn-close-modal" style="background:rgba(255,255,255,0.08);border:1px solid var(--border);color:var(--text-main);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>
    <div style="padding:1.5rem 2rem;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:1.25rem;">
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
