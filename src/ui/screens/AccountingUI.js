// src/ui/screens/AccountingUI.js
import { el } from '../../utils/dom.js';

const DENOMINATIONS = [20000, 10000, 2000, 1000, 500, 200, 100];

export function renderAccounting(container, { entries, clients, producers, onSave, onDelete, onRefresh }) {
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
  titleGroup.appendChild(el('h1', { text: 'Control de Caja y Contabilidad', style: 'margin:0;' }));
  header.appendChild(titleGroup);

  const addBtn = el('button', { 
    classes: ['btn-primary'],
    text: '+ Nuevo Movimiento',
    style: 'background: var(--primary); color: white; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600;'
  });
  addBtn.onclick = () => showEntryModal(null, { clients, producers, onSave });
  header.appendChild(addBtn);

  container.appendChild(header);

  // Stats
  const totalIn = entries.filter(e => e.type === 'IN').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalOut = entries.filter(e => e.type === 'OUT').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const balance = totalIn - totalOut;

  const statsGrid = el('div', { 
    classes: ['stats-grid'],
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;'
  });

  statsGrid.appendChild(createStatCard('Saldo Actual', formatCurrency(balance), balance >= 0 ? 'var(--success)' : 'var(--danger)'));
  statsGrid.appendChild(createStatCard('Total Ingresos', formatCurrency(totalIn), 'var(--success)'));
  statsGrid.appendChild(createStatCard('Total Egresos', formatCurrency(totalOut), 'var(--danger)'));

  container.appendChild(statsGrid);

  // Table
  const tableWrapper = el('div', { classes: ['glass-card'], style: 'padding: 0; overflow: hidden;' });
  const table = el('table', { style: 'width: 100%; border-collapse: collapse;' });
  
  const thead = el('thead', { html: `
    <tr style="background: rgba(255,255,255,0.05); text-align: left;">
      <th style="padding: 1rem;">Fecha / Hora</th>
      <th style="padding: 1rem;">Descripción</th>
      <th style="padding: 1rem;">Vínculo (Cliente/Prod)</th>
      <th style="padding: 1rem; text-align: right;">Monto</th>
      <th style="padding: 1rem; text-align: right;">Acciones</th>
    </tr>
  `});
  table.appendChild(thead);

  const tbody = el('tbody');
  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="padding: 2rem; text-align: center; color: var(--text-muted);">No hay movimientos registrados</td></tr>';
  } else {
    entries.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)).forEach(entry => {
      const tr = el('tr', { style: 'border-top: 1px solid var(--border); transition: background 0.2s;' });
      
      const entityName = entry.clientName || entry.producerName || '-';
      const isIncome = entry.type === 'IN';
      
      tr.innerHTML = `
        <td style="padding: 1rem;">
          <div style="font-weight: 500;">${formatDate(entry.createdAt)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${formatTime(entry.createdAt)}</div>
        </td>
        <td style="padding: 1rem;">
          <div style="font-weight: 600;">${entry.description || 'Sin descripción'}</div>
        </td>
        <td style="padding: 1rem;">
          <span style="font-size: 0.85rem; color: var(--text-muted);">${entityName}</span>
        </td>
        <td style="padding: 1rem; text-align: right; font-weight: 700; color: ${isIncome ? 'var(--success)' : 'var(--danger)'};">
          ${isIncome ? '+' : '-'} ${formatCurrency(entry.amount)}
        </td>
        <td style="padding: 1rem; text-align: right;">
          <button class="icon-btn delete-btn" style="color: var(--danger)" title="Eliminar">🗑️</button>
        </td>
      `;
      
      tr.querySelector('.delete-btn').onclick = () => onDelete(entry.id);
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  container.appendChild(tableWrapper);
}

function createStatCard(label, value, color) {
  const card = el('div', { 
    classes: ['glass-card'], 
    style: `padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; border-left: 4px solid ${color};` 
  });
  card.appendChild(el('div', { text: label, style: 'font-size: 0.85rem; color: var(--text-muted); font-weight: 500;' }));
  card.appendChild(el('div', { text: value, style: `font-size: 1.5rem; font-weight: 700; color: ${color};` }));
  return card;
}

function showEntryModal(existingEntry, { clients, producers, onSave }) {
  const modal = el('div', { 
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;'
  });

  const content = el('div', { 
    classes: ['glass-card'],
    style: 'width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; padding: 2rem;'
  });

  content.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 2rem;">Nuevo Movimiento de Caja</h2>
    
    <form id="accounting-form">
      <div style="margin-bottom: 1.5rem; display: flex; gap: 2rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="type" value="IN" checked> <span style="color: var(--success); font-weight: 600;">Ingreso (+)</span>
        </label>
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="type" value="OUT"> <span style="color: var(--danger); font-weight: 600;">Egreso (-)</span>
        </label>
      </div>

      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Descripción / Concepto</label>
        <input type="text" name="description" required placeholder="Ej: Pago de flete, Cobro venta meat...">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
        <div class="form-group">
          <label>Cliente (Opcional)</label>
          <select name="clientId">
            <option value="">-- Ninguno --</option>
            ${clients.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Productor (Opcional)</label>
          <select name="producerCuit">
            <option value="">-- Ninguno --</option>
            ${producers.map(p => `<option value="${p.cuit}" data-name="${p.name}">${p.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 2rem;">
        <label>Monto Total ($)</label>
        <div style="display: flex; gap: 0.5rem;">
          <input type="number" step="0.01" name="amount" id="total-amount-input" required placeholder="0.00" style="flex: 1; font-size: 1.25rem; font-weight: 700;">
          <button type="button" id="open-calc-btn" class="btn-secondary" style="white-space: nowrap; padding: 0 1rem; border-radius: 8px;">🧮 Calculadora</button>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem;">
        <button type="button" class="btn-cancel" style="padding: 0.75rem 1.5rem; border-radius: 12px; background: rgba(255,255,255,0.05);">Cancelar</button>
        <button type="submit" class="btn-primary" style="padding: 0.75rem 2rem; border-radius: 12px; background: var(--primary); color: white; font-weight: 600;">Guardar</button>
      </div>
    </form>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const form = content.querySelector('#accounting-form');
  const amountInput = content.querySelector('#total-amount-input');

  content.querySelector('#open-calc-btn').onclick = () => showBillCalculator((total) => {
    amountInput.value = total;
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const clientSelect = form.querySelector('select[name="clientId"]');
    const producerSelect = form.querySelector('select[name="producerCuit"]');
    
    const data = {
      type: formData.get('type'),
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      clientId: formData.get('clientId') || null,
      clientName: clientSelect.options[clientSelect.selectedIndex]?.dataset.name || null,
      producerCuit: formData.get('producerCuit') || null,
      producerName: producerSelect.options[producerSelect.selectedIndex]?.dataset.name || null
    };
    onSave(data);
    modal.remove();
  };

  content.querySelector('.btn-cancel').onclick = () => modal.remove();
}

function showBillCalculator(onApply) {
  const modal = el('div', { 
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;'
  });

  const content = el('div', { 
    classes: ['glass-card'],
    style: 'width: 100%; max-width: 450px; padding: 2rem;'
  });

  content.innerHTML = `
    <h3 style="margin-top:0; margin-bottom: 1.5rem;">🔢 Recuento de Billetes</h3>
    <div id="calc-rows" style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;">
      ${DENOMINATIONS.map(d => `
        <div style="display: grid; grid-template-columns: 80px 20px 100px 30px 1fr; align-items: center; gap: 0.5rem;">
          <div style="font-weight: 700; color: var(--text-muted);">$ ${d.toLocaleString()}</div>
          <div style="text-align: center;">×</div>
          <input type="number" class="bill-qty" data-denom="${d}" placeholder="Cant." style="padding: 0.4rem; border-radius: 8px;">
          <div style="text-align: center;">=</div>
          <div class="row-total" style="text-align: right; font-weight: 600; font-family: monospace;">$ 0</div>
        </div>
      `).join('')}
    </div>
    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: 500;">Total General:</span>
      <span id="calc-grand-total" style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">$ 0</span>
    </div>
    <div style="display: flex; gap: 1rem;">
      <button id="calc-cancel" class="btn-cancel" style="flex: 1; padding: 0.75rem; border-radius: 12px;">Cerrar</button>
      <button id="calc-apply" class="btn-primary" style="flex: 2; padding: 0.75rem; border-radius: 12px; background: var(--primary); color: white; font-weight: 600;">Usar Total</button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const rows = content.querySelectorAll('.bill-qty');
  const grandTotalEl = content.querySelector('#calc-grand-total');

  const updateGrandTotal = () => {
    let grand = 0;
    rows.forEach(input => {
      const q = parseInt(input.value) || 0;
      const d = parseInt(input.dataset.denom);
      const rowTotal = q * d;
      grand += rowTotal;
      input.parentElement.querySelector('.row-total').textContent = `$ ${rowTotal.toLocaleString()}`;
    });
    grandTotalEl.textContent = `$ ${grand.toLocaleString()}`;
    return grand;
  };

  rows.forEach(input => input.oninput = updateGrandTotal);

  content.querySelector('#calc-cancel').onclick = () => modal.remove();
  content.querySelector('#calc-apply').onclick = () => {
    onApply(updateGrandTotal());
    modal.remove();
  };
}

function formatCurrency(val) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
}

function formatDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('es-AR');
}

function formatTime(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
