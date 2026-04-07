import { el } from '../../utils/dom.js';

export function renderClientAccounts(options) {
  const { clients, selectedClient, transactions, onSelectClient, onAddPayment, onBack } = options;
  const container = document.getElementById('content');
  container.innerHTML = '';
  const wrapper = el('div', { classes: ['dashboard', 'fade-in'] });

  if (selectedClient) {
    // --- DETAILS VIEW ---
    const header = el('div', { classes: ['dashboard-header'], style: 'display: flex; align-items: center; gap: 0.5rem;' });
    header.innerHTML = `
      <button id="back-clients" class="back-btn-m3" title="Volver">
        <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
      </button>
      <div>
        <h2 style="margin: 0;">${selectedClient.name}</h2>
        <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 1rem; margin-top: 2px;">
          <span>📍 ${selectedClient.address || 'Sin dirección'}</span>
          <span>🆔 CUIT: ${selectedClient.cuit || 'N/A'}</span>
        </div>
      </div>
    `;
    wrapper.appendChild(header);

    const statsGrid = el('div', { classes: ['stats-grid'], style: 'margin-bottom: 2rem;' });
    const addStat = (title, val, color) => {
      statsGrid.appendChild(el('div', { classes: ['stat-card', 'glass-card'], html: `<h3>${title}</h3><div class="stat-value" style="color: ${color};">${val}</div>` }));
    };

    const debt = transactions.filter(t => t.type === 'DEBT').reduce((sum, t) => sum + (t.amount || 0), 0);
    const payments = transactions.filter(t => t.type === 'PAYMENT').reduce((sum, t) => sum + (t.amount || 0), 0);
    const balance = debt - payments;

    addStat('Deuda Total', `$${debt.toLocaleString()}`, 'var(--text-main)');
    addStat('Pagos Totales', `$${payments.toLocaleString()}`, '#10b981');
    addStat('Saldo Pendiente', `$${balance.toLocaleString()}`, balance > 0 ? '#ef4444' : '#10b981');
    wrapper.appendChild(statsGrid);

    // Form to add payment
    const paymentCard = el('div', { classes: ['glass-card'], style: 'margin-bottom: 2rem; border-left: 4px solid #10b981;' });
    paymentCard.innerHTML = `
      <h3 style="margin-bottom: 1rem; color: #10b981;">➕ Registrar Pago</h3>
      <div style="display: flex; gap: 1rem; align-items: flex-end;">
        <div class="form-group" style="flex: 1; margin: 0;"><label>Monto ($)</label><input type="number" id="pay-amount" class="form-input" placeholder="0.00"></div>
        <div class="form-group" style="flex: 2; margin: 0;"><label>Descripción / Concepto</label><input type="text" id="pay-desc" class="form-input" placeholder="Ej: Pago efectivo, Transferencia..."></div>
        <button id="pay-btn" class="btn-primary" style="background: #10b981; margin: 0;">Registrar</button>
      </div>
    `;
    wrapper.appendChild(paymentCard);

    // Transactions Table
    const histCard = el('div', { classes: ['glass-card'] });
    histCard.innerHTML = `<h3 style="margin-bottom: 1rem;">Historial de Movimientos</h3>`;
    
    const tableWrap = el('div', { style: 'overflow-x: auto;' });
    const table = document.createElement('table');
    table.className = 'faena-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); text-align: left;">
          <th style="padding: 1rem;">Fecha</th>
          <th style="padding: 1rem;">Concepto</th>
          <th style="padding: 1rem;">Debe</th>
          <th style="padding: 1rem;">Haber</th>
          <th style="padding: 1rem;">Detalle</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.length === 0 ? '<tr><td colspan="5" style="padding: 2rem; text-align: center;">Sin movimientos.</td></tr>' : 
          transactions.map(t => {
            const isDebt = t.type === 'DEBT';
            return `
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem;">${new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                <td style="padding: 1rem;">${t.description || (isDebt ? 'Despacho' : 'Pago')}</td>
                <td style="padding: 1rem; color: #ef4444; font-weight: 500;">${isDebt ? '$' + t.amount.toLocaleString() : '-'}</td>
                <td style="padding: 1rem; color: #10b981; font-weight: 500;">${!isDebt ? '$' + t.amount.toLocaleString() : '-'}</td>
                <td style="padding: 1rem;">
                  ${t.breakout ? `<button class="btn-outline view-detail-btn" data-id="${t.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Ver Detalle</button>` : ''}
                </td>
              </tr>
            `;
          }).join('')
        }
      </tbody>
    `;
    tableWrap.appendChild(table);
    histCard.appendChild(tableWrap);
    wrapper.appendChild(histCard);

    header.querySelector('#back-clients').onclick = onBack;
    paymentCard.querySelector('#pay-btn').onclick = () => {
      const amt = document.getElementById('pay-amount').value;
      const desc = document.getElementById('pay-desc').value;
      if (amt) onAddPayment(amt, desc);
    };

    wrapper.querySelectorAll('.view-detail-btn').forEach(btn => {
      btn.onclick = () => {
        const tx = transactions.find(t => t.id === btn.dataset.id);
        if (tx && tx.breakout) {
          renderTransactionDetailModal(tx);
        }
      };
    });

  } else {
    // --- LIST VIEW ---
    const header = el('div', { classes: ['dashboard-header'], style: 'display: flex; align-items: center; gap: 0.5rem;' });
    header.innerHTML = `
      <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard">
        <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
      </button>
      <div>
        <h2 style="margin: 0;">👥 Cuentas de Clientes</h2>
        <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Administración de saldos y cobranzas.</p>
      </div>
    `;
    wrapper.appendChild(header);
    header.querySelector('#back-to-dash').onclick = options.onBackToDashboard;

    const clientGrid = el('div', { classes: ['card-list'] });
    if (clients.length === 0) {
      const emptyMsg = el('div', { classes: ['glass-card'], style: 'padding: 3rem; text-align: center; grid-column: 1 / -1;' });
      emptyMsg.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
        <h3>No hay clientes registrados</h3>
        <p style="color: var(--text-muted);">Puedes agregar clientes desde la configuración del sistema.</p>
        <button id="go-to-settings" class="btn-primary" style="margin-top: 1.5rem;">Ir a Configuración</button>
      `;
      emptyMsg.querySelector('#go-to-settings').onclick = () => {
        const settingsLi = document.querySelector('li[data-view="settings"]');
        if (settingsLi) settingsLi.click();
      };
      clientGrid.appendChild(emptyMsg);
    } else {
      clients.forEach(c => {
      const card = el('div', { classes: ['card', 'glass-card'], style: 'cursor: pointer; transition: transform 0.2s;' });
      const balanceColor = (c.balance || 0) > 0 ? '#ef4444' : '#10b981';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="margin: 0 0 0.5rem 0;">${c.name}</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">${c.address || 'Sin dirección'}</p>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">CUIT: ${c.cuit || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.2rem;">Saldo</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: ${balanceColor};">$${(c.balance || 0).toLocaleString()}</div>
          </div>
        </div>
      `;
      card.onclick = () => onSelectClient(c);
      clientGrid.appendChild(card);
      });
    }
    wrapper.appendChild(clientGrid);
  }

  container.appendChild(wrapper);
}

function renderTransactionDetailModal(transaction) {
  const overlay = el('div', { classes: ['modal-overlay'] });
  const modal = el('div', { classes: ['modal'], style: 'max-width: 500px;' });
  
  const breakoutHtml = transaction.breakout.map(item => `
    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border); font-size: 0.9rem;">
      <span>Garron #${item.garron} (${item.weight} kg)</span>
      <span>$${item.price}/kg = <b>$${item.total.toLocaleString()}</b></span>
    </div>
  `).join('');

  modal.innerHTML = `
    <h2 style="margin-bottom: 1rem;">Detalle de Despacho</h2>
    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${transaction.description}</p>
    <div style="background: var(--bg-hover); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
      ${breakoutHtml}
      <div style="display: flex; justify-content: space-between; padding-top: 1rem; margin-top: 0.5rem; border-top: 2px solid var(--border); font-weight: bold; font-size: 1.1rem;">
        <span>Total Operación</span>
        <span style="color: #10b981;">$${transaction.amount.toLocaleString()}</span>
      </div>
    </div>
    <button class="btn-primary" style="width: 100%; border:0;" id="close-detail">Cerrar</button>
  `;

  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  modal.querySelector('#close-detail').onclick = () => overlay.remove();
}
