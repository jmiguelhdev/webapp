// src/ui/screens/AccountingUI.js
import { el } from '../../utils/dom.js';

const DENOMINATIONS = [20000, 10000, 2000, 1000, 500, 200, 100];

export function renderAccounting(container, { entries, filteredEntries, clients, producers, pagination, filters, onFilterChange, onSave, onDelete, onRefresh }) {
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
    classes: ['btn-nueva-operacion'],
    html: '<svg viewBox="0 0 24 24" width="18" height="18" style="fill:currentColor;flex-shrink:0;"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg> Nuevo Movimiento'
  });
  addBtn.onclick = () => showEntryModal(null, { clients, producers, onSave });
  header.appendChild(addBtn);

  container.appendChild(header);

  // Filters Bar
  const filtersBar = el('div', { 
    classes: ['glass-card'], 
    style: 'margin-bottom: 2rem; padding: 1.25rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; align-items: end;' 
  });

  const searchGroup = el('div', { classes: ['form-group'], style: 'margin-bottom:0;' });
  searchGroup.appendChild(el('label', { text: '🔍 Buscar (Monto, Desc, Vínculo)' }));
  const searchInput = el('input', { 
    attrs: { type: 'text', placeholder: 'Filtrar movimientos...', value: filters.searchTerm || '' },
    style: 'width: 100%;'
  });
  searchInput.oninput = (e) => onFilterChange({ searchTerm: e.target.value });
  searchGroup.appendChild(searchInput);

  const dateStartGroup = el('div', { classes: ['form-group'], style: 'margin-bottom:0;' });
  dateStartGroup.appendChild(el('label', { text: 'Desde' }));
  const startInput = el('input', { 
    attrs: { type: 'date', value: filters.startDate || '' },
    style: 'width: 100%;'
  });
  startInput.onchange = (e) => onFilterChange({ startDate: e.target.value });
  dateStartGroup.appendChild(startInput);

  const dateEndGroup = el('div', { classes: ['form-group'], style: 'margin-bottom:0;' });
  dateEndGroup.appendChild(el('label', { text: 'Hasta' }));
  const endInput = el('input', { 
    attrs: { type: 'date', value: filters.endDate || '' },
    style: 'width: 100%;'
  });
  endInput.onchange = (e) => onFilterChange({ endDate: e.target.value });
  dateEndGroup.appendChild(endInput);

  const clearBtnGroup = el('div', { style: 'display: flex; gap: 0.5rem;' });
  const clearBtn = el('button', { 
    classes: ['btn-secondary'], 
    text: 'Limpiar Filtros',
    style: 'width: 100%; height: 42px; border-radius: 8px;'
  });
  clearBtn.onclick = () => {
    searchInput.value = '';
    startInput.value = '';
    endInput.value = '';
    onFilterChange({ searchTerm: '', startDate: null, endDate: null });
  };
  clearBtnGroup.appendChild(clearBtn);

  filtersBar.appendChild(searchGroup);
  filtersBar.appendChild(dateStartGroup);
  filtersBar.appendChild(dateEndGroup);
  filtersBar.appendChild(clearBtnGroup);
  container.appendChild(filtersBar);

  // Stats (using filteredEntries if provided)
  const statsEntries = filteredEntries || entries;
  const totalIn = statsEntries.filter(e => e.type === 'IN').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalOut = statsEntries.filter(e => e.type === 'OUT').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const balance = totalIn - totalOut;

  const statsGrid = el('div', { 
    classes: ['stats-grid'],
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;'
  });

  statsGrid.appendChild(createStatCard('Saldo Selección', formatCurrency(balance), balance >= 0 ? 'var(--success)' : 'var(--danger)'));
  statsGrid.appendChild(createStatCard('Total Ingresos', formatCurrency(totalIn), 'var(--success)'));
  statsGrid.appendChild(createStatCard('Total Egresos', formatCurrency(totalOut), 'var(--danger)'));

  container.appendChild(statsGrid);

  // Table
  const tableWrapper = el('div', { classes: ['glass-card'], style: 'padding: 0; overflow: hidden; margin-bottom: 1.5rem;' });
  const table = el('table', { style: 'width: 100%; border-collapse: collapse;' });
  
  const thead = el('thead', { html: `
    <tr style="background: rgba(255,255,255,0.05); text-align: left;">
      <th style="padding: 1rem;">Fecha / Hora</th>
      <th style="padding: 1rem;">Descripción</th>
      <th style="padding: 1rem;">Vínculo (Cliente/Prod)</th>
      <th style="padding: 1rem; text-align: right;">Monto</th>
      <th style="padding: 1rem; text-align: right;">Diferencia Caja</th>
      <th style="padding: 1rem; text-align: right;">Acciones</th>
    </tr>
  `});
  table.appendChild(thead);

  const tbody = el('tbody');
  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding: 3rem; text-align: center; color: var(--text-muted);">
      <div style="font-size: 1.25rem; margin-bottom: 0.5rem;">No hay movimientos</div>
      <div style="font-size: 0.9rem;">Pruebe ajustando los filtros o agregue uno nuevo.</div>
    </td></tr>`;
  } else {
    entries.forEach(entry => {
      const tr = el('tr', { style: 'border-top: 1px solid var(--border); transition: background 0.2s;' });
      
      const entityName = entry.clientName || entry.producerName || '-';
      const isIncome = entry.type === 'IN';
      
      let diffHtml = '<span style="color: var(--text-muted);">-</span>';
      if (entry.countedAmount !== undefined && entry.countedAmount !== null) {
        const diff = entry.countedAmount - entry.amount;
        if (Math.abs(diff) < 0.01) diffHtml = `<span style="color: var(--text-main); font-weight: 600;">OK</span>`;
        else if (diff > 0) diffHtml = `<span style="color: #10b981; font-weight: 600;">Sobra ${formatCurrency(diff)}</span>`;
        else diffHtml = `<span style="color: #ef4444; font-weight: 600;">Falta ${formatCurrency(Math.abs(diff))}</span>`;
      }
      
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
          ${diffHtml}
        </td>
        <td style="padding: 1rem; text-align: right; white-space: nowrap;">
          <button class="icon-btn edit-btn" title="Editar">✏️</button>
          <button class="icon-btn delete-btn" style="color: var(--danger);" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="pointer-events:none;"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg>
          </button>
        </td>
      `;
      
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.edit-btn')) showEntryModal(entry, { clients, producers, onSave });
        if (e.target.closest('.delete-btn')) onDelete(entry.id);
      });
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  container.appendChild(tableWrapper);

  // Pagination Controls
  if (pagination && pagination.totalPages > 1) {
    const pagContainer = el('div', { 
      style: 'display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--border);'
    });

    const info = el('div', { 
      text: `Mostrando ${entries.length} de ${pagination.totalItems} movimientos`,
      style: 'font-size: 0.85rem; color: var(--text-muted);'
    });
    pagContainer.appendChild(info);

    const btnGroup = el('div', { style: 'display: flex; gap: 0.5rem; align-items: center;' });
    
    const prevBtn = el('button', { 
      classes: ['btn-secondary'], 
      text: 'Anterior',
      attrs: { disabled: pagination.currentPage === 1 },
      style: 'padding: 0.5rem 1rem; font-size: 0.85rem;'
    });
    prevBtn.onclick = () => pagination.onPageChange(pagination.currentPage - 1);
    btnGroup.appendChild(prevBtn);

    const pageInfo = el('span', { 
      text: `Página ${pagination.currentPage} de ${pagination.totalPages}`,
      style: 'font-size: 0.85rem; font-weight: 600; margin: 0 1rem;'
    });
    btnGroup.appendChild(pageInfo);

    const nextBtn = el('button', { 
      classes: ['btn-secondary'], 
      text: 'Siguiente',
      attrs: { disabled: pagination.currentPage === pagination.totalPages },
      style: 'padding: 0.5rem 1rem; font-size: 0.85rem;'
    });
    nextBtn.onclick = () => pagination.onPageChange(pagination.currentPage + 1);
    btnGroup.appendChild(nextBtn);

    pagContainer.appendChild(btnGroup);
    container.appendChild(pagContainer);
  }
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
    <h2 style="margin-top: 0; margin-bottom: 2rem;">${existingEntry ? 'Editar Movimiento' : 'Nuevo Movimiento de Caja'}</h2>
    
    <form id="accounting-form">
      <div style="margin-bottom: 1.5rem; display: flex; gap: 2rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="type" value="IN" ${!existingEntry || existingEntry.type === 'IN' ? 'checked' : ''}> <span style="color: var(--success); font-weight: 600;">Ingreso (+)</span>
        </label>
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="radio" name="type" value="OUT" ${existingEntry && existingEntry.type === 'OUT' ? 'checked' : ''}> <span style="color: var(--danger); font-weight: 600;">Egreso (-)</span>
        </label>
      </div>

      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Descripción / Concepto</label>
        <input type="text" name="description" required placeholder="Ej: Pago de flete, Cobro venta meat..." value="${existingEntry?.description || ''}">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
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

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1rem;">
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

      <div id="diff-container" style="display: none; margin-bottom: 1.5rem; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; text-align: center; font-size: 1.1rem; border: 1px solid transparent;"></div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; align-items: center;">
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

  const updateDiff = () => {
    const exp = parseFloat(expectedAmountInput.value);
    const count = parseFloat(countedAmountInput.value);
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

  expectedAmountInput.addEventListener('input', updateDiff);
  countedAmountInput.addEventListener('input', updateDiff);
  if (existingEntry) updateDiff();

  content.querySelector('#open-calc-btn').onclick = () => showBillCalculator(
    parseFloat(expectedAmountInput.value) || 0,
    (total) => {
      countedAmountInput.value = total;
      updateDiff();
    }
  );

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    
    const clientNameInput = form.querySelector('#client-input').value.trim();
    const producerNameInput = form.querySelector('#producer-input').value.trim();
    
    const matchedClient = clients.find(c => c.name === clientNameInput);
    const matchedProducer = producers.find(p => p.name === producerNameInput);
    
    const countedVal = formData.get('countedAmount');
    
    const data = {
      id: existingEntry ? existingEntry.id : undefined,
      type: formData.get('type'),
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      countedAmount: countedVal ? parseFloat(countedVal) : null,
      clientId: matchedClient ? matchedClient.id : null,
      clientName: matchedClient ? matchedClient.name : (clientNameInput || null),
      producerCuit: matchedProducer ? matchedProducer.cuit : null,
      producerName: matchedProducer ? matchedProducer.name : (producerNameInput || null)
    };
    onSave(data);
    modal.remove();
  };

  content.querySelector('.btn-cancel').onclick = () => modal.remove();
}

function showBillCalculator(expectedAmount, onApply) {
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
    <div id="calc-rows" style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;">
      <div style="display: grid; grid-template-columns: 80px 20px 90px 20px 90px 30px 1fr; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
        <div>Valor</div>
        <div></div>
        <div style="text-align: center;">Fajos (100u)</div>
        <div></div>
        <div style="text-align: center;">Sueltos</div>
        <div></div>
        <div style="text-align: right;">Subtotal</div>
      </div>
      ${DENOMINATIONS.map(d => `
        <div class="denom-row" style="display: grid; grid-template-columns: 80px 20px 90px 20px 90px 30px 1fr; align-items: center; gap: 0.5rem;">
          <div style="font-weight: 700; color: var(--text-main);">$ ${d.toLocaleString()}</div>
          <div style="text-align: center;">×</div>
          <input type="number" class="bill-batch" data-denom="${d}" placeholder="0" style="padding: 0.5rem; border-radius: 8px; text-align: right; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);">
          <div style="text-align: center;">+</div>
          <input type="number" class="bill-qty" data-denom="${d}" placeholder="0" style="padding: 0.5rem; border-radius: 8px; text-align: right; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);">
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
  const allInputs = content.querySelectorAll('.bill-batch, .bill-qty');

  const updateGrandTotal = () => {
    let grand = 0;
    rowElements.forEach(row => {
      const batchInput = row.querySelector('.bill-batch');
      const qtyInput = row.querySelector('.bill-qty');
      const d = parseInt(batchInput.dataset.denom);
      
      const batches = parseInt(batchInput.value) || 0;
      const qtys = parseInt(qtyInput.value) || 0;
      
      const rowTotal = (batches * 100 + qtys) * d;
      grand += rowTotal;
      row.querySelector('.row-total').textContent = `$ ${rowTotal.toLocaleString()}`;
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
    return grand;
  };

  allInputs.forEach(input => input.addEventListener('input', updateGrandTotal));

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
