/**
 * CashExtractionUI.js
 * Componente UI para renderizar la pestaña "Extracciones por Recibir" en la Caja General.
 */
import { el } from '../../../frameworks/utils/dom.js';
import { formatCurrency, formatDate, formatTime } from '../../../frameworks/utils/formatters.js';

export function buildExtractionsTab({ extractions = [], userRole = 'VISOR', onSaveEntry, onOpenControlScreen, onOpenDetailScreen }) {

  const container = el('div', { classes: ['extractions-tab-container'] });


  // Stats Grid
  const pendingExtractions = extractions.filter(e => e.status !== 'ACCEPTED');
  const acceptedExtractions = extractions.filter(e => e.status === 'ACCEPTED');

  const totalPendingAmount = pendingExtractions.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalAcceptedAmount = acceptedExtractions.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const statsGrid = el('div', {
    classes: ['stats-grid'],
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;'
  });

  statsGrid.appendChild(createStatCard('Extracciones Pendientes', `${pendingExtractions.length} retiros`, '#3b82f6'));
  statsGrid.appendChild(createStatCard('Monto Pendiente de Ingreso', formatCurrency(totalPendingAmount), 'var(--warning)'));
  statsGrid.appendChild(createStatCard('Extracciones Ingresadas', `${acceptedExtractions.length} retiros`, 'var(--success)'));
  statsGrid.appendChild(createStatCard('Total Ingresado', formatCurrency(totalAcceptedAmount), 'var(--success)'));

  container.appendChild(statsGrid);

  // Filter Bar
  let currentSearch = '';
  let currentStatus = 'ALL';

  const filterCard = el('div', {
    classes: ['glass-card'],
    style: 'margin-bottom: 1.5rem; padding: 1rem 1.25rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between;'
  });

  const searchInput = el('input', {
    attrs: { type: 'text', placeholder: '🔍 Buscar por carnicería, precinto u observaciones...' },
    style: 'flex: 1; min-width: 250px; padding: 0.6rem 1rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);'
  });

  const statusSelect = el('select', {
    style: 'padding: 0.6rem 1rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); font-weight: 600;'
  });
  statusSelect.innerHTML = `
    <option value="ALL">Todos los estados</option>
    <option value="PENDING" selected>⏳ Pendientes de Ingreso</option>
    <option value="ACCEPTED">✅ Ingresados</option>
  `;

  filterCard.appendChild(searchInput);
  filterCard.appendChild(statusSelect);
  container.appendChild(filterCard);

  // Table Wrapper
  const tableWrapper = el('div', { classes: ['glass-card', 'table-responsive'], style: 'padding: 0;' });
  container.appendChild(tableWrapper);

  const renderTableContent = () => {
    const term = currentSearch.toLowerCase();
    const filtered = extractions.filter(e => {
      const isStatusMatch = currentStatus === 'ALL' || 
                           (currentStatus === 'PENDING' && e.status !== 'ACCEPTED') || 
                           (currentStatus === 'ACCEPTED' && e.status === 'ACCEPTED');
      
      const butchery = (e.butcheryName || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();
      const isSearchMatch = !term || butchery.includes(term) || desc.includes(term);

      return isStatusMatch && isSearchMatch;
    });

    tableWrapper.innerHTML = '';
    const table = el('table', { style: 'width: 100%; min-width: 800px; border-collapse: collapse;' });

    const thead = el('thead', { html: `
      <tr style="background: rgba(255,255,255,0.05); text-align: left;">
        <th style="padding: 1rem;">Fecha / Hora</th>
        <th style="padding: 1rem;">Carnicería / Sucursal</th>
        <th style="padding: 1rem;">Detalle / Precinto</th>
        <th style="padding: 1rem; text-align: right;">Monto Extraído</th>
        <th style="padding: 1rem; text-align: center;">Estado</th>
        <th style="padding: 1rem; text-align: right;">Acciones</th>
      </tr>
    `});
    table.appendChild(thead);

    const tbody = el('tbody');
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding: 3rem; text-align: center; color: var(--text-muted);">
        <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">No se encontraron extracciones</div>
        <div style="font-size: 0.85rem;">Pruebe cambiando los criterios de búsqueda o filtro.</div>
      </td></tr>`;
    } else {
      filtered.forEach(ext => {
        const isPending = ext.status !== 'ACCEPTED';
        const formattedDate = formatDate(ext.timestamp || ext.createdAt || Date.now());
        const formattedTime = formatTime(ext.timestamp || ext.createdAt || Date.now());

        const tr = el('tr', { style: 'border-top: 1px solid var(--border); transition: background 0.2s;' });
        
        tr.innerHTML = `
          <td style="padding: 1rem;">
            <div style="font-weight: 600;">${formattedDate}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${formattedTime}</div>
          </td>
          <td style="padding: 1rem;">
            <div style="font-weight: 700; color: var(--text-main);">${ext.butcheryName || 'Sucursal'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Sesión: ${ext.cashSessionId || '-'}</div>
          </td>
          <td style="padding: 1rem;">
            <div style="font-size: 0.9rem;">${ext.description || 'Sin observaciones'}</div>
          </td>
          <td style="padding: 1rem; text-align: right; font-weight: 800; color: var(--success); font-size: 1.05rem;">
            ${formatCurrency(ext.amount)}
          </td>
          <td style="padding: 1rem; text-align: center;">
            ${isPending 
              ? `<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; white-space: nowrap;">⏳ Pendiente</span>`
              : `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; white-space: nowrap;">✅ Ingresado</span>`
            }
          </td>
          <td style="padding: 1rem; text-align: right; white-space: nowrap;">
            ${isPending
              ? userRole === 'ADMIN'
                ? `<button class="btn-primary process-btn" style="padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; background: linear-gradient(135deg, #10b981, #059669);">📥 Controlar y Dar Ingreso</button>`
                : `<span title="Requiere perfil Administrador para procesar" style="font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid var(--border);">🔒 Solo Admin</span>`
              : `<button class="btn-secondary detail-btn" style="padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.85rem;">🔍 Ver Billetes</button>`
            }
          </td>
        `;

        tr.addEventListener('click', (e) => {
          if (e.target.closest('.process-btn')) {
            if (typeof onOpenControlScreen === 'function') {
              onOpenControlScreen(ext);
            }
          }
          if (e.target.closest('.detail-btn')) {
            if (typeof onOpenDetailScreen === 'function') {
              onOpenDetailScreen(ext);
            }
          }
        });


        tbody.appendChild(tr);
      });
    }

    table.appendChild(tbody);
    tableWrapper.appendChild(table);
  };

  searchInput.oninput = (e) => {
    currentSearch = e.target.value;
    renderTableContent();
  };

  statusSelect.onchange = (e) => {
    currentStatus = e.target.value;
    renderTableContent();
  };

  renderTableContent();
  return container;
}

function createStatCard(label, value, color) {
  const card = el('div', {
    classes: ['glass-card'],
    style: `padding: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem; border-left: 4px solid ${color};`
  });
  card.appendChild(el('div', { text: label, style: 'font-size: 0.8rem; color: var(--text-muted); font-weight: 600;' }));
  card.appendChild(el('div', { text: value, style: `font-size: 1.35rem; font-weight: 800; color: ${color};` }));
  return card;
}
