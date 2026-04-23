import { el } from '../../utils/dom.js';

export function renderClientAccounts(options) {
  const { clients, selectedClient, transactions, onSelectClient, onAddPayment, onBack, onAnalyzePrice } = options;
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
      <div style="display: flex; gap: 0.5rem;">
        <button id="analyze-price-btn" class="icon-btn" title="Análisis de Precio Promedio" style="background: var(--glass); padding: 0.75rem; border: 1px solid var(--border); width: auto; height: auto; display: flex; align-items: center; gap: 0.5rem; color: var(--primary);">
          <span style="font-size: 1.25rem;">📊</span>
          <span style="font-size: 0.9rem; font-weight: 600;">Análisis</span>
        </button>
        <button id="print-account-btn" class="icon-btn" title="Imprimir Detalle de Cuenta" style="background: var(--glass); padding: 0.75rem; border: 1px solid var(--border); width: auto; height: auto;">
          <span style="font-size: 1.2rem;">🖨️</span>
        </button>
      </div>
    `;
    wrapper.appendChild(header);

    header.querySelector('#analyze-price-btn').onclick = onAnalyzePrice;

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

    // Form to add Generic Sale (DEBT)
    const saleCard = el('div', { classes: ['glass-card'], style: 'margin-bottom: 2rem; border-left: 4px solid #ef4444;' });
    saleCard.innerHTML = `
      <h3 style="margin-bottom: 1rem; color: #ef4444;">🛒 Registrar Venta (Genérica)</h3>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
        <div class="form-group" style="flex: 1; min-width: 120px; margin: 0;"><label>Monto ($)</label><input type="number" id="sale-amount" class="form-input" placeholder="0.00"></div>
        <div class="form-group" style="flex: 2; min-width: 200px; margin: 0;"><label>Descripción / Concepto</label><input type="text" id="sale-desc" class="form-input" placeholder="Ej: Venta de productos, Flete..."></div>
        <button id="sale-btn" class="btn-primary" style="background: #ef4444; margin: 0;">Registrar Venta</button>
      </div>
    `;
    wrapper.appendChild(saleCard);

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

    saleCard.querySelector('#sale-btn').onclick = () => {
      const amt = document.getElementById('sale-amount').value;
      const desc = document.getElementById('sale-desc').value || 'Venta Genérica';
      if (amt && options.onAddSale) options.onAddSale(amt, desc);
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

function renderTransactionDetailModal(tx) {
  const overlay = el('div', { classes: ['modal-overlay'], style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem;' });
  const modal = el('div', { classes: ['modal', 'glass-card'], style: 'max-width: 500px; width: 100%; padding: 2rem;' });
  
  const header = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;' });
  header.innerHTML = `
    <h3 style="margin: 0; color: var(--primary);">Detalle de Movimiento</h3>
    <button class="close-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer;">&times;</button>
  `;
  
  const txDate = new Date(tx.date || tx.createdAt).toLocaleDateString('es-AR');
  const txDesc = tx.description || (tx.type === 'DEBT' ? 'Despacho' : 'Pago');
  
  const infoSection = el('div', { style: 'margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;' });
  infoSection.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
      <span style="color: var(--text-muted);">Fecha:</span>
      <span style="font-weight: 500;">${txDate}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: var(--text-muted);">Concepto:</span>
      <span style="font-weight: 500; text-align: right;">${txDesc}</span>
    </div>
  `;
  
  const content = el('div');
  
  let rowsHtml = '';
  let totalWeight = 0;
  let totalPrice = 0;
  let waText = `*Detalle de Movimiento*\nFecha: ${txDate}\nConcepto: ${txDesc}\n\n`;
  
  if (tx.breakout && tx.breakout.length > 0) {
    waText += `*Detalle:*\n`;
    const tbodyHtml = tx.breakout.map(item => {
      const weight = Number(item.weight) || 0;
      const total = Number(item.total) || 0;
      totalWeight += weight;
      totalPrice += total;
      
      waText += `• G#${item.garron}: ${weight}kg @ $${item.price} = $${total.toLocaleString('es-AR')}\n`;
      
      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 0.5rem;">#${item.garron}</td>
          <td style="padding: 0.5rem; text-align: right;">${weight}</td>
          <td style="padding: 0.5rem; text-align: right;">$${item.price}</td>
          <td style="padding: 0.5rem; text-align: right; color: #ef4444; font-weight: 500;">$${total.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
    
    waText += `\n*TOTAL:* ${totalWeight.toFixed(1)}kg - $${totalPrice.toLocaleString('es-AR')}`;

    rowsHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted);">
            <th style="padding: 0.5rem;">Garrón</th>
            <th style="padding: 0.5rem; text-align: right;">Peso (kg)</th>
            <th style="padding: 0.5rem; text-align: right;">Precio/kg</th>
            <th style="padding: 0.5rem; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${tbodyHtml}
        </tbody>
        <tfoot>
          <tr style="border-top: 2px solid var(--border); font-weight: bold;">
            <td style="padding: 0.5rem;">TOTAL</td>
            <td style="padding: 0.5rem; text-align: right;">${totalWeight.toFixed(1)} kg</td>
            <td style="padding: 0.5rem;"></td>
            <td style="padding: 0.5rem; text-align: right; color: #ef4444;">$${totalPrice.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    `;
  } else {
    waText += `Monto: $${(tx.amount || 0).toLocaleString('es-AR')}`;
    rowsHtml = '<p style="color: var(--text-muted);">No hay detalles desglosados para este movimiento.</p>';
  }
  
  content.innerHTML = rowsHtml;
  
  const footer = el('div', { style: 'display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;' });
  footer.innerHTML = `
    <button class="btn-outline print-btn" style="display: flex; align-items: center; gap: 0.5rem;">
      🖨️ Imprimir
    </button>
    <button class="btn-outline wa-btn" style="display: flex; align-items: center; gap: 0.5rem; color: #25D366; border-color: rgba(37,211,102,0.3);">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
      WhatsApp
    </button>
    <button class="btn-primary close-modal-btn" style="padding: 0.5rem 1.5rem;">Cerrar</button>
  `;
  
  modal.appendChild(header);
  modal.appendChild(infoSection);
  modal.appendChild(content);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  const close = () => document.body.removeChild(overlay);
  header.querySelector('.close-btn').onclick = close;
  footer.querySelector('.close-modal-btn').onclick = close;
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  
  footer.querySelector('.wa-btn').onclick = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
  };
  
  footer.querySelector('.print-btn').onclick = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    let printRows = '';
    if (tx.breakout && tx.breakout.length > 0) {
      printRows = tx.breakout.map(item => `
        <tr>
          <td>#${item.garron}</td>
          <td style="text-align:right;">${item.weight}kg</td>
          <td style="text-align:right;">$${item.price}</td>
          <td style="text-align:right;">$${Number(item.total).toLocaleString()}</td>
        </tr>
      `).join('');
      printRows += `
        <tr style="font-weight:bold; border-top:1px solid #000;">
          <td>TOTAL</td>
          <td style="text-align:right;">${totalWeight.toFixed(1)}kg</td>
          <td></td>
          <td style="text-align:right;">$${totalPrice.toLocaleString()}</td>
        </tr>
      `;
    }
    
    printWindow.document.write(`
      <html>
      <head>
        <title>Detalle de Movimiento</title>
        <style>
          body { font-family: monospace; padding: 20px; color: #000; font-size: 14px; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .info { margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 4px 0; border-bottom: 1px dotted #ccc; }
          @media print { @page { margin: 0; } body { padding: 10px; } }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <h2>DETALLE DE MOVIMIENTO</h2>
        </div>
        <div class="info">
          <div><strong>Fecha:</strong> ${txDate}</div>
          <div><strong>Concepto:</strong> ${txDesc}</div>
        </div>
        ${tx.breakout && tx.breakout.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th style="text-align:left;">Garrón</th>
                <th style="text-align:right;">Peso</th>
                <th style="text-align:right;">$/kg</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${printRows}
            </tbody>
          </table>
        ` : `<p>Monto: $${(tx.amount || 0).toLocaleString()}</p>`}
      </body>
      </html>
    `);
    printWindow.document.close();
  };
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
        <button type="submit" class="btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 8px; border: none; background: var(--primary); color: var(--on-primary); cursor: pointer;">Imprimir</button>
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
