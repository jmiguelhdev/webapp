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
      <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
        <button id="back-clients" class="back-btn-m3" title="Volver">
          <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
        </button>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <h2 style="margin: 0; font-size: 1.5rem; letter-spacing: -0.02em;">${selectedClient.name}</h2>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 4px; font-size: 0.8rem; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; color: var(--text-muted);">
              <span>📍</span> ${selectedClient.address || 'Sin dirección'}
            </div>
            <div style="display: flex; align-items: center; gap: 4px; font-size: 0.8rem; background: rgba(99,102,241,0.1); padding: 2px 8px; border-radius: 4px; color: #818cf8; font-weight: 600;">
              <span>🆔</span> CUIT: ${selectedClient.cuit || 'N/A'}
            </div>
          </div>
        </div>
      </div>
      <button id="print-account-btn" class="icon-btn" title="Imprimir Detalle de Cuenta" style="background: var(--glass); padding: 0.75rem; border: 1px solid var(--border); width: auto; height: auto;">
        <span style="font-size: 1.2rem;">🖨️</span>
      </button>
    `;
    wrapper.appendChild(header);

    header.querySelector('#print-account-btn').onclick = () => showPrintOptionsModal(selectedClient, transactions);

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
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
        <div class="form-group" style="flex: 1; min-width: 120px; margin: 0;"><label>Monto ($)</label><input type="number" id="pay-amount" class="form-input" placeholder="0.00"></div>
        <div class="form-group" style="flex: 2; min-width: 200px; margin: 0;"><label>Descripción / Concepto</label><input type="text" id="pay-desc" class="form-input" placeholder="Ej: Pago efectivo, Transferencia..."></div>
        <div class="form-group" style="flex: 1; min-width: 150px; margin: 0;"><label>Recibido por / en</label><input type="text" id="pay-received" class="form-input" placeholder="Ej: Caja Central, Juan..."></div>
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
            const receivedInfo = t.receivedBy ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">📥 Recibido: ${t.receivedBy}</div>` : '';
            return `
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem;">${new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                <td style="padding: 1rem;">
                  <div style="font-weight: 500;">${t.description || (isDebt ? 'Despacho' : 'Pago')}</div>
                  ${receivedInfo}
                </td>
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
      const received = document.getElementById('pay-received').value;
      if (amt) onAddPayment(amt, desc, received);
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

function showPrintOptionsModal(client, transactions) {
  const overlay = el('div', { classes: ['modal-overlay'], style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;' });
  const modal = el('div', { classes: ['modal', 'glass-card'], style: 'max-width: 400px; padding: 2rem;' });
  
  const today = new Date().toISOString().split('T')[0];
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const fromDateVal = lastMonth.toISOString().split('T')[0];

  modal.innerHTML = `
    <h3 style="margin-bottom: 1.5rem;">🖨️ Opciones de Impresión</h3>
    <form id="print-form">
      <div class="form-group">
        <label>Desde</label>
        <input type="date" id="print-from" class="form-input" value="${fromDateVal}">
      </div>
      <div class="form-group">
        <label>Hasta</label>
        <input type="date" id="print-to" class="form-input" value="${today}">
      </div>
      <div class="form-group">
        <label>Formato de Impresión</label>
        <select id="print-format" class="form-input">
          <option value="standard">📄 A4 (Estándar)</option>
          <option value="thermal">🧾 Térmico (80mm)</option>
        </select>
      </div>
      <div style="display: flex; gap: 1rem; margin-top: 2rem;">
        <button type="button" class="btn-cancel" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: none; color: var(--text-main); cursor: pointer;">Cancelar</button>
        <button type="submit" class="btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: none; background: var(--primary); color: #fff; cursor: pointer;">Imprimir</button>
      </div>
    </form>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const form = modal.querySelector('#print-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const fromTime = new Date(modal.querySelector('#print-from').value + 'T00:00:00').getTime();
    const toTime = new Date(modal.querySelector('#print-to').value + 'T23:59:59').getTime();
    const format = modal.querySelector('#print-format').value;

    const filtered = transactions.filter(t => {
      const dTime = new Date(t.date || t.createdAt).getTime();
      return dTime >= fromTime && dTime <= toTime;
    }).sort((a,b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());

    const before = transactions.filter(t => new Date(t.date || t.createdAt).getTime() < fromTime);
    const saldoAnterior = before.reduce((sum, t) => {
      return sum + (t.type === 'DEBT' ? (t.amount || 0) : -(t.amount || 0));
    }, 0);

    printAccountStatement(client, filtered, saldoAnterior, { format, fromDate: new Date(fromTime), toDate: new Date(toTime) });
    overlay.remove();
  };

  modal.querySelector('.btn-cancel').onclick = () => overlay.remove();
}

function printAccountStatement(client, txs, saldoAnterior, options) {
  const { format, fromDate, toDate } = options;
  const isThermal = format === 'thermal';
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  
  const fromStr = fromDate.toLocaleDateString('es-AR');
  const toStr = toDate.toLocaleDateString('es-AR');
  const nowStr = new Date().toLocaleString('es-AR');

  let currentBalance = saldoAnterior;
  
  const rowsHtml = txs.map(t => {
    const isDebt = t.type === 'DEBT';
    const amount = t.amount || 0;
    currentBalance += isDebt ? amount : -amount;
    
    let detailHtml = '';
    if (t.breakout && t.breakout.length > 0) {
      detailHtml = `
        <div class="breakout-rows">
          ${t.breakout.map(i => `• G#${i.garron}: ${i.weight}kg @ $${i.price} = $${i.total.toLocaleString()}`).join('<br>')}
        </div>
      `;
    }

    return `
      <tr class="tx-row">
        <td>${new Date(t.date || t.createdAt).toLocaleDateString('es-AR')}</td>
        <td>
          <div style="font-weight: 600;">${t.description || (isDebt ? 'Despacho' : 'Pago')}</div>
          ${detailHtml}
        </td>
        <td class="amount ${isDebt ? 'debe' : ''}">${isDebt ? amount.toLocaleString() : '-'}</td>
        <td class="amount ${!isDebt ? 'haber' : ''}">${!isDebt ? amount.toLocaleString() : '-'}</td>
        <td class="amount balance">${currentBalance.toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Estado de Cuenta - ${client.name}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: ${isThermal ? '10px' : '40px'}; color: #111; line-height: 1.4; margin: 0; background: #fff; }
        .receipt-card { max-width: ${isThermal ? '300px' : '800px'}; margin: 0 auto; border: ${isThermal ? 'none' : '1px solid #eee'}; padding: ${isThermal ? '0' : '30px'}; border-radius: 8px; }
        .header { display: flex; flex-direction: ${isThermal ? 'column' : 'row'}; justify-content: space-between; align-items: ${isThermal ? 'center' : 'flex-start'}; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { width: ${isThermal ? '80px' : '120px'}; height: auto; object-fit: contain; }
        .company-name { font-size: ${isThermal ? '18px' : '24px'}; font-weight: 800; margin: 5px 0; }
        .client-info { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .table { width: 100%; border-collapse: collapse; font-size: ${isThermal ? '11px' : '13px'}; }
        .table th { background: #f4f4f4; padding: 10px 5px; text-align: left; border-bottom: 2px solid #ddd; }
        .table td { padding: 8px 5px; border-bottom: 1px solid #eee; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; }
        .debe { color: #d32f2f; }
        .haber { color: #2e7d32; }
        .balance { font-weight: bold; }
        .breakout-rows { font-size: 0.85em; color: #555; margin-top: 4px; border-left: 2px solid #ddd; padding-left: 8px; line-height: 1.2; }
        .summary-box { margin-top: 30px; border-top: 2px solid #000; padding-top: 15px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 600; }
        .disclaimer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px dotted #ccc; padding-top: 15px; }
        @media print { body { padding: 0; } .receipt-card { border: none; max-width: 100%; } }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="receipt-card">
        <div class="header">
          <div style="display:flex; flex-direction:column; align-items:${isThermal ? 'center' : 'flex-start'};">
            <img src="/logo.jpg" class="logo">
            <div class="company-name">FRIGORÍFICO PAMPA</div>
          </div>
          <div style="text-align: ${isThermal ? 'center' : 'right'}; margin-top: ${isThermal ? '10px' : '0'};">
            <div style="font-weight: bold; font-size: 1.1em;">ESTADO DE CUENTA</div>
            <div style="font-size: 0.9em;">Periodo: ${fromStr} al ${toStr}</div>
            <div style="font-size: 0.8em; color: #666;">Emisión: ${nowStr}</div>
          </div>
        </div>

        <div class="client-info">
          <div style="font-weight: 800; font-size: 1.2em;">${client.name}</div>
          <div style="font-size: 0.9em;">${client.address || ''}</div>
          <div style="font-size: 0.9em;">CUIT: ${client.cuit || 'N/A'}</div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th style="text-align:right;">Debe</th>
              <th style="text-align:right;">Haber</th>
              <th style="text-align:right;">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #fcfcfc; font-style: italic;">
              <td>${fromStr}</td>
              <td>SALDO ANTERIOR (Balance forward)</td>
              <td style="text-align:right;">${saldoAnterior > 0 ? saldoAnterior.toLocaleString() : '-'}</td>
              <td style="text-align:right;">${saldoAnterior < 0 ? Math.abs(saldoAnterior).toLocaleString() : '-'}</td>
              <td style="text-align:right; font-weight:bold;">${saldoAnterior.toLocaleString()}</td>
            </tr>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-row">
            <span>Saldo Final</span>
            <span style="font-size: 1.3em; color: ${currentBalance > 0 ? '#d32f2f' : '#2e7d32'}">$${currentBalance.toLocaleString()}</span>
          </div>
        </div>

        <div class="disclaimer">
          ⚠️ DOCUMENTO DE CONTROL INTERNO - NO VÁLIDO COMO FACTURA<br>
          FRIGORÍFICO PAMPA - GRACIAS POR SU CONFIANZA
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
