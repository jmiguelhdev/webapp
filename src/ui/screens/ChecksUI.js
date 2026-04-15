// src/ui/screens/ChecksUI.js
import { el } from '../../utils/dom.js';

export function renderChecks(container, { checks, contacts, onSave, onDelete, onRefresh }) {
  container.innerHTML = '';

  const header = el('div', { 
    classes: ['dashboard-header'],
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;'
  });

  const titleGroup = el('div', { style: 'display: flex; align-items: center; gap: 1rem;' });
  const backBtn = el('button', { 
    classes: ['back-btn-m3'],
    html: '<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>',
    attrs: { title: 'Volver al Dashboard' }
  });
  backBtn.onclick = () => window.dispatchEvent(new CustomEvent('nav:dashboard'));
  
  titleGroup.appendChild(backBtn);
  titleGroup.appendChild(el('h1', { text: 'Gestión de Cheques', style: 'margin:0;' }));
  header.appendChild(titleGroup);

  const addBtn = el('button', { 
    classes: ['btn-nueva-operacion'],
    html: '<svg viewBox="0 0 24 24" width="18" height="18" style="fill:currentColor;flex-shrink:0;"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg> Nueva Operación'
  });
  addBtn.onclick = () => showOperationModal(null, contacts, onSave);
  header.appendChild(addBtn);

  container.appendChild(header);

  // Summary Cards
  const totalProfit = checks.reduce((sum, c) => sum + (c.profit || 0), 0);
  
  const isPortfolio = (c) => {
    const st = c.sellSide?.status;
    return !st || st === 'PENDING' || st === 'BACK';
  };
  const isHistory = (c) => {
    const st = c.sellSide?.status;
    return st === 'SOLD' || st === 'RETURNED' || st === 'REJECTED';
  };

  const portfolioChecks = checks.filter(isPortfolio);
  const totalInPortfolio = portfolioChecks.reduce((sum, c) => sum + (parseFloat(c.nominalValue) || 0), 0);

  const statsGrid = el('div', { 
    classes: ['stats-grid'],
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;'
  });

  statsGrid.appendChild(createStatCard('Ganancia Total Realizada', formatCurrency(totalProfit), 'var(--success)'));
  statsGrid.appendChild(createStatCard('Capital en Cartera', formatCurrency(totalInPortfolio), 'var(--primary)'));
  statsGrid.appendChild(createStatCard('Cheques en Cartera', portfolioChecks.length, 'var(--primary)'));

  container.appendChild(statsGrid);

  // Section 1: CHEQUES EN CARTERA
  container.appendChild(el('h2', { text: '📂 Cheques en Cartera', style: 'margin-bottom: 1rem; font-size: 1.25rem;' }));
  container.appendChild(renderCheckTable(portfolioChecks, contacts, onSave, onDelete));

  // Section 2: OPERACIONES REALIZADAS
  const historyChecks = checks.filter(isHistory);
  container.appendChild(el('h2', { text: '📜 Operaciones Realizadas', style: 'margin-top: 3rem; margin-bottom: 1rem; font-size: 1.25rem;' }));
  container.appendChild(renderCheckTable(historyChecks, contacts, onSave, onDelete));
}

function getCheckStatusBadge(op) {
  const status = op.sellSide?.status || 'PENDING';
  let badgeHtml = '';
  
  if (status === 'SOLD') badgeHtml += '<span class="status-badge badge-success">VENDIDO</span>';
  else if (status === 'RETURNED') badgeHtml += '<span class="status-badge badge-warning">DEVUELTO</span>';
  else if (status === 'REJECTED') badgeHtml += '<span class="status-badge badge-danger">RECHAZADO</span>';
  else if (status === 'BACK') badgeHtml += '<span class="status-badge badge-back">VOLVIÓ - Contactar Vendedor</span>';
  
  // Evaluate date alerts if it's in portfolio
  if (status === 'PENDING' || status === 'BACK') {
    const today = new Date();
    today.setHours(0,0,0,0);
    const payDate = new Date(op.dueDate); // dueDate field stores payment date
    payDate.setHours(0,0,0,0);
    const expiryDate = new Date(payDate);
    expiryDate.setDate(payDate.getDate() + 30);

    const diffToPayDate = Math.ceil((payDate - today) / (1000 * 60 * 60 * 24));
    const diffToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (diffToExpiry < 0) {
      // pasaron los 30 días desde la fecha de pago
      badgeHtml += ' <span class="status-badge badge-danger">VENCIDO</span>';
    } else if (diffToPayDate <= 0 && diffToExpiry <= 7) {
      // fecha de pago ya pasó y faltan 7 días o menos para el vencimiento
      badgeHtml += ' <span class="status-badge badge-warning">PRÓXIMO A VENCER</span>';
    } else if (diffToPayDate <= 0) {
      // fecha de pago ya pasó, disponible para cobrar
      badgeHtml += ' <span class="status-badge badge-disponible">DISPONIBLE</span>';
    }
  }

  return badgeHtml || '<span class="status-badge badge-pending">EN CARTERA</span>';
}

function renderCheckTable(checksList, contacts, onSave, onDelete) {
  const tableWrapper = el('div', { classes: ['glass-card'], style: 'padding: 0; overflow: hidden; margin-bottom: 2rem;' });
  const table = el('table', { style: 'width: 100%; border-collapse: collapse;' });
  
  const thead = el('thead', { html: `
    <tr style="background: rgba(255,255,255,0.05); text-align: left;">
      <th style="padding: 1rem;">Banco / #</th>
      <th style="padding: 1rem;">F. Pago / Vencimiento</th>
      <th style="padding: 1rem;">Valor Nominal</th>
      <th style="padding: 1rem;">Origen / Destino</th>
      <th style="padding: 1rem;">Ganancia</th>
      <th style="padding: 1rem; text-align: right;">Acciones</th>
    </tr>
  `});
  table.appendChild(thead);

  const tbody = el('tbody');
  if (checksList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-muted);">Sin registros en esta sección</td></tr>';
  } else {
    checksList.sort((a,b) => new Date(b.receptionDate) - new Date(a.receptionDate)).forEach(op => {
      const tr = el('tr', { style: 'border-top: 1px solid var(--border); transition: background 0.2s;' });
      
      const isSold = op.sellSide && op.sellSide.status === 'SOLD';
      const seller = contacts.find(c => c.id === op.buySide?.contactId)?.name || 'Desconocido';
      const buyer = contacts.find(c => c.id === op.sellSide?.contactId)?.name || '-';
      
      tr.innerHTML = `
        <td style="padding: 1rem;">
          <div style="font-weight: 600;">${op.bank || 'S/B'}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">#${op.checkNumber || 'S/N'}</div>
        </td>
        <td style="padding: 1rem;">
          <div style="font-weight: 500;">${formatDate(op.dueDate)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Venc: ${formatDate(addDays(op.dueDate, 30))}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${op.days} días</div>
        </td>
        <td style="padding: 1rem; font-weight: 600;">${formatCurrency(op.nominalValue)}</td>
        <td style="padding: 1rem;">
          <div style="font-size: 0.85rem;"><span style="color: var(--primary); font-weight: 600;">De:</span> ${seller}</div>
          <div style="font-size: 0.85rem;"><span style="color: var(--success); font-weight: 600;">A:</span> ${isSold ? buyer : '(Sin Venta Activa)'}</div>
          ${op.sellSide?.status === 'BACK' && op.sellSide?.backReason ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; font-style: italic;">📝 ${op.sellSide.backReason}</div>` : ''}
          <div style="margin-top: 0.5rem;">${getCheckStatusBadge(op)}</div>
        </td>
        <td style="padding: 1rem; color: var(--success); font-weight: 600;">${isSold ? formatCurrency(op.profit) : '-'}</td>
        <td style="padding: 1rem; text-align: right; white-space: nowrap;">
          <button class="icon-btn edit-btn" title="Editar">✏️</button>
          <button class="icon-btn delete-btn" style="color: var(--danger);" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="pointer-events:none;"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg>
          </button>
        </td>
      `;
      
      // Use closest() so SVG child clicks don't break wiring
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.edit-btn')) showOperationModal(op, contacts, onSave);
        if (e.target.closest('.delete-btn')) onDelete(op.id);
      });
      
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  return tableWrapper;
}

function createStatCard(label, value, color) {
  const card = el('div', { 
    classes: ['glass-card'], 
    style: `padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; border-left: 4px solid ${color};` 
  });
  card.appendChild(el('div', { text: label, style: 'font-size: 0.85rem; color: var(--text-muted); font-weight: 500;' }));
  card.appendChild(el('div', { text: value, style: 'font-size: 1.5rem; font-weight: 700;' }));
  return card;
}

function showOperationModal(existingOp, contacts, onSave) {
  const isEditing = !!existingOp;
  const modal = el('div', { 
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;'
  });

  const content = el('div', { 
    classes: ['glass-card'],
    style: 'width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; padding: 2rem;'
  });

  content.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 2rem;">${isEditing ? 'Editar' : 'Nueva'} Operación de Cheque</h2>
    
    <form id="check-form">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="form-group">
          <label>Banco</label>
          <input type="text" name="bank" value="${existingOp?.bank || ''}" required placeholder="Ej: Banco Nación">
        </div>
        <div class="form-group">
          <label>Número de Cheque</label>
          <input type="text" name="checkNumber" value="${existingOp?.checkNumber || ''}" required placeholder="12345678">
        </div>
        <div class="form-group">
          <label>Valor Nominal ($)</label>
          <input type="number" step="0.01" name="nominalValue" value="${existingOp?.nominalValue || ''}" required placeholder="0.00">
        </div>
        <div class="form-group">
          <label>Clearing (Días)</label>
          <input type="number" name="clearing" value="${existingOp?.clearing || 0}" required>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="form-group">
          <label>Fecha Recepción</label>
          <input type="date" name="receptionDate" value="${existingOp?.receptionDate || new Date().toISOString().split('T')[0]}" required>
        </div>
        <div class="form-group">
          <label>Fecha de Pago</label>
          <input type="date" name="dueDate" value="${existingOp?.dueDate || ''}" required>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <!-- BUY SIDE -->
        <div style="padding: 1.5rem; border: 1px solid var(--border); border-radius: 16px; background: rgba(255,255,255,0.02);">
          <h3 style="margin-top:0; color: var(--primary);">📥 Compra (Origen)</h3>
          <div class="form-group">
            <label>Vendedor</label>
            <select name="buySide_contactId" required>
              <option value="">Seleccionar Vendedor</option>
              ${contacts.map(c => `<option value="${c.id}" ${existingOp?.buySide?.contactId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Pesificación (%)</label>
            <input type="number" step="0.01" name="buySide_pesificacionRate" value="${existingOp?.buySide?.pesificacionRate || ''}" required>
          </div>
          <div class="form-group">
            <label>Interés Mensual (%)</label>
            <input type="number" step="0.01" name="buySide_monthlyInterest" value="${existingOp?.buySide?.monthlyInterest || ''}" required>
          </div>
        </div>

        <!-- SELL SIDE -->
        <div style="padding: 1.5rem; border: 1px solid var(--border); border-radius: 16px; background: rgba(255,255,255,0.02);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin: 0; color: var(--success);">📤 Venta (Destino / Estado)</h3>
            <div class="form-group" style="margin: 0; min-width: 150px;">
              <select name="sellSide_status" style="padding: 0.5rem; border-radius: 8px;">
                <option value="PENDING" ${!existingOp?.sellSide || existingOp?.sellSide?.status === 'PENDING' ? 'selected' : ''}>En Cartera</option>
                <option value="SOLD" ${existingOp?.sellSide?.status === 'SOLD' ? 'selected' : ''}>Vendido</option>
                <option value="RETURNED" ${existingOp?.sellSide?.status === 'RETURNED' ? 'selected' : ''}>Devuelto</option>
                <option value="BACK" ${existingOp?.sellSide?.status === 'BACK' ? 'selected' : ''}>Volvió</option>
                <option value="REJECTED" ${existingOp?.sellSide?.status === 'REJECTED' ? 'selected' : ''}>Rechazado</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Comprador / Destinatario</label>
            <select name="sellSide_contactId">
              <option value="">Seleccionar Comprador</option>
              ${contacts.map(c => `<option value="${c.id}" ${existingOp?.sellSide?.contactId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Pesificación (%)</label>
            <input type="number" step="0.01" name="sellSide_pesificacionRate" value="${existingOp?.sellSide?.pesificacionRate || ''}">
          </div>
          <div class="form-group">
            <label>Interés Mensual (%)</label>
            <input type="number" step="0.01" name="sellSide_monthlyInterest" value="${existingOp?.sellSide?.monthlyInterest || ''}">
          </div>
          <div class="form-group" id="back-reason-group" style="display: ${existingOp?.sellSide?.status === 'BACK' ? 'flex' : 'none'};">
            <label>⚠️ Motivo de Retorno (Volvió)</label>
            <textarea name="sellSide_backReason" rows="2" placeholder="Ej: El cliente no tenía fondos suficientes..." style="resize: vertical;">${existingOp?.sellSide?.backReason || ''}</textarea>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; align-items: center;">
        <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cancelar</button>
        <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; font-size: 1rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(99,102,241,0.4); letter-spacing: 0.03em;">Guardar Operación</button>
      </div>
    </form>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const form = content.querySelector('#check-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {
      id: existingOp?.id,
      bank: formData.get('bank'),
      checkNumber: formData.get('checkNumber'),
      nominalValue: formData.get('nominalValue'),
      clearing: formData.get('clearing'),
      receptionDate: formData.get('receptionDate'),
      dueDate: formData.get('dueDate'),
      buySide: {
        contactId: formData.get('buySide_contactId'),
        pesificacionRate: formData.get('buySide_pesificacionRate'),
        monthlyInterest: formData.get('buySide_monthlyInterest')
      },
      sellSide: {
        status: formData.get('sellSide_status') || 'PENDING',
        contactId: formData.get('sellSide_contactId'),
        pesificacionRate: formData.get('sellSide_pesificacionRate'),
        monthlyInterest: formData.get('sellSide_monthlyInterest'),
        backReason: formData.get('sellSide_backReason') || ''
      }
    };
    onSave(data);
    modal.remove();
  };

  content.querySelector('.btn-cancel').onclick = () => modal.remove();

  // Show/hide backReason field dynamically
  const statusSelect = content.querySelector('[name="sellSide_status"]');
  const backReasonGroup = content.querySelector('#back-reason-group');
  statusSelect.addEventListener('change', () => {
    backReasonGroup.style.display = statusSelect.value === 'BACK' ? 'flex' : 'none';
  });
}


function formatCurrency(val) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-AR');
}

function addDays(dateStr, days) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
