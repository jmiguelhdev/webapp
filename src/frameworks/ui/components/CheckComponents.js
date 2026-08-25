import { el } from '../../../frameworks/utils/dom.js';
import { formatCurrency, formatDateLocal, addDays, getSortDate, parseDateLocal } from '../../../frameworks/utils/formatters.js';
import { showOperationModal } from './ChecksModals.js';
import { printBuyOperationReport } from '../reports/ReportService.js';

export function renderPaginationControls(currentPage, totalPages, totalItems, onPageChange) {
  const pagContainer = el('div', { 
    style: 'display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1.25rem; background: rgba(255,255,255,0.01); border-radius: 14px; border: 1px solid var(--border); margin-bottom: 2rem; flex-wrap: wrap; gap: 0.75rem;'
  });

  const info = el('div', { 
    text: `Mostrando página ${currentPage} de ${totalPages} (${totalItems} registros)`,
    style: 'font-size: 0.82rem; color: var(--text-muted); font-weight: 550;'
  });
  pagContainer.appendChild(info);

  const btnGroup = el('div', { style: 'display: flex; gap: 0.5rem; align-items: center;' });
  
  const prevBtn = el('button', { 
    classes: ['btn-secondary'], 
    text: 'Anterior',
    style: 'padding: 0.4rem 0.85rem; font-size: 0.8rem; font-weight: 600; border-radius: 8px;'
  });
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => onPageChange(currentPage - 1);
  btnGroup.appendChild(prevBtn);

  const pageInfo = el('span', { 
    text: `Pág. ${currentPage} / ${totalPages}`,
    style: 'font-size: 0.82rem; font-weight: 700; margin: 0 0.5rem; color: var(--text-main);'
  });
  btnGroup.appendChild(pageInfo);

  const nextBtn = el('button', { 
    classes: ['btn-secondary'], 
    text: 'Siguiente',
    style: 'padding: 0.4rem 0.85rem; font-size: 0.8rem; font-weight: 600; border-radius: 8px;'
  });
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => onPageChange(currentPage + 1);
  btnGroup.appendChild(nextBtn);

  pagContainer.appendChild(btnGroup);
  return pagContainer;
}

/**
 * Determina y construye el marcado HTML correspondiente al indicador/badge de estado del cheque.
 *
 * @param {Check} op - La entidad de cheque de dominio a evaluar.
 * @returns {string} Código de marcado HTML que representa visualmente el estado del cheque.
 */
export function getCheckStatusBadge(op) {
  const alertState = op.getAlertState();
  let badgeHtml = '';
  
  if (alertState.status === 'SOLD') {
    badgeHtml += '<kmp-status-chip status="SOLD"></kmp-status-chip>';
  } else if (alertState.status === 'RETURNED') {
    badgeHtml += '<kmp-status-chip status="RETURNED"></kmp-status-chip>';
  } else if (alertState.status === 'REJECTED') {
    badgeHtml += '<kmp-status-chip status="REJECTED"></kmp-status-chip>';
  } else if (alertState.status === 'BACK') {
    badgeHtml += '<kmp-status-chip status="BACK" label="VOLVIÓ"></kmp-status-chip>';
  }
  
  if (alertState.code === 'EXPIRED') {
    badgeHtml += ' <kmp-status-chip status="REJECTED" label="⛔ VENCIDO"></kmp-status-chip>';
  } else if (alertState.code === 'EXPIRING_URGENT') {
    badgeHtml += ' <kmp-status-chip status="PENDING" label="⏳ PRÓXIMO VENC."></kmp-status-chip>';
  } else if (alertState.code === 'AVAILABLE') {
    badgeHtml += ' <kmp-status-chip status="COMPLETED" label="✅ DISPONIBLE"></kmp-status-chip>';
  } else if (alertState.code === 'UPCOMING_PAYMENT') {
    badgeHtml += ` <kmp-status-chip status="DRAFT" label="🔔 PAGO EN ${alertState.days}d"></kmp-status-chip>`;
  }

  return badgeHtml || '<kmp-status-chip status="PENDING" label="EN CARTERA"></kmp-status-chip>';
}

/**
 * Crea y dibuja en el DOM la tabla interactiva de visualización de cheques.
 *
 * @param {Array<Check>} checksList - Subconjunto paginado y ordenado de cheques a mostrar en la tabla.
 * @param {Array<Object>} contacts - Catálogo de contactos registrados para resolver nombres de origen/destino.
 * @param {Function} onSave - Callback para guardar cambios en la edición.
 * @param {Function} onDelete - Callback para procesar la baja/eliminación.
 * @param {string} [sortBy='receptionDate'] - Nombre de la propiedad utilizada para ordenar la lista.
 * @param {boolean} [sortAsc=false] - Indica si la ordenación debe ser ascendente o descendente.
 * @param {boolean} [selectable=false] - Habilita la selección múltiple por checkboxes para ventas masivas.
 * @param {Set<string>} [selectedIds=null] - Conjunto mutable de identificadores seleccionados de cheques.
 * @param {Function} [onSelectionChange=null] - Callback ejecutado al seleccionar o deseleccionar algún checkbox.
 * @returns {HTMLElement} El elemento contenedor div ('glass-card table-responsive') con la tabla renderizada.
 */
export function renderCheckTable(checksList, contacts, onSave, onDelete, sortBy = 'receptionDate', sortAsc = false, selectable = false, selectedIds = null, onSelectionChange = null, onlyNominal = false, buyContacts = [], onPrintBuy = null, groupByBuyOperation = true) {
  const tableWrapper = el('div', { 
    classes: ['glass-card', 'table-responsive'], 
    style: 'padding: 0; margin-bottom: 2rem; border-radius: 18px; overflow: hidden; border: 1px solid var(--border);' 
  });

  const table = el('table', { 
    classes: ['card-style-table'],
    style: 'width: 100%; min-width: 850px; font-size: 0.88rem;' 
  });
  
  const thead = el('thead', { html: `
    <tr style="background: rgba(255,255,255,0.03); border-bottom: 2px solid var(--border); text-align: left; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
      ${selectable ? '<th style="padding: 1rem; width: 40px; text-align: center;"><input type="checkbox" class="check-all-cb" style="width: 16px; height: 16px; cursor: pointer;" title="Seleccionar todos"></th>' : ''}
      <th style="padding: 1rem 1.25rem;">Banco / Emisor</th>
      <th style="padding: 1rem 1.25rem;">Cobro / Vencimiento</th>
      <th style="padding: 1rem 1.25rem; text-align: right;">Valor Nominal</th>
      <th style="padding: 1rem 1.25rem; text-align: left;">Flujo Origen/Destino</th>
      ${onlyNominal ? '' : `<th style="padding: 1rem 1.25rem; text-align: right;">${checksList.some(c => c.sellSide?.status === 'SOLD') ? 'Ganancia' : (selectable ? 'Desc. Compra' : 'Ganancia')}</th>`}
      <th style="padding: 1rem 1.25rem; text-align: right;">Acciones</th>
    </tr>
  `});
  table.appendChild(thead);

  const tbody = el('tbody');
  if (checksList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-weight: 600;">Sin registros en esta sección.</td></tr>';
  } else {
    // Sort all checks according to criteria
    const sorted = [...checksList].sort((a,b) => {
      const tA = getSortDate(a[sortBy]);
      const tB = getSortDate(b[sortBy]);
      return sortAsc ? tA - tB : tB - tA;
    });

    // Detect multi-check buy operations
    const buyOpCounts = new Map();
    if (groupByBuyOperation) {
      sorted.forEach(c => {
        const opId = c.buySide?.operationId;
        if (opId) {
          buyOpCounts.set(opId, (buyOpCounts.get(opId) || 0) + 1);
        }
      });
    }

    const structuredItems = [];
    const handledLots = new Set();

    sorted.forEach(c => {
      const opId = c.buySide?.operationId;
      if (groupByBuyOperation && opId && buyOpCounts.get(opId) > 1) {
        if (!handledLots.has(opId)) {
          handledLots.add(opId);
          const lotChecks = sorted.filter(chk => chk.buySide?.operationId === opId);
          structuredItems.push({ isLot: true, opId, checks: lotChecks });
        }
      } else {
        structuredItems.push({ isLot: false, check: c });
      }
    });

    window._checksCollapsedLots = window._checksCollapsedLots || new Set();

    structuredItems.forEach(item => {
      if (item.isLot) {
        // --- LOT HEADER ROW ---
        const opId = item.opId;
        const lotChecks = item.checks;
        const totalNominal = lotChecks.reduce((s, c) => s + (parseFloat(c.nominalValue) || 0), 0);
        const totalNet = lotChecks.reduce((s, c) => s + (parseFloat(c.buySide?.netAmount) || 0), 0);
        const totalDiscount = totalNominal - totalNet;
        const seller = contacts.find(c => c.id === lotChecks[0].buySide?.contactId)?.name || lotChecks[0].buySide?.contactId || 'Desconocido';
        const lotDate = lotChecks[0].buySide?.date || lotChecks[0].receptionDate;
        const isCollapsed = window._checksCollapsedLots.has(opId);
        const allLotSelected = selectable && selectedIds !== null && lotChecks.every(c => selectedIds.has(String(c.id)));

        const lotTr = el('tr', {
          classes: ['check-lot-header-row'],
          style: 'background: rgba(99, 102, 241, 0.08); border-top: 2px solid rgba(99, 102, 241, 0.3); border-bottom: 1px solid rgba(99, 102, 241, 0.2); box-shadow: var(--elevation-1); cursor: pointer;'
        });

        const cbLotCell = selectable ? `
          <td style="padding: 0.85rem 1rem; width: 40px; text-align: center; border-radius: 14px 0 0 14px;">
            <input type="checkbox" class="lot-check-cb" data-opid="${opId}" ${allLotSelected ? 'checked' : ''} style="width: 17px; height: 17px; cursor: pointer;" title="Seleccionar todos los cheques del lote">
          </td>` : '';

        lotTr.innerHTML = `
          ${cbLotCell}
          <td style="${selectable ? '' : 'border-radius: 14px 0 0 14px;'} padding: 0.85rem 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
              <button type="button" class="lot-toggle-btn" data-opid="${opId}" style="background: rgba(99,102,241,0.18); border: 1px solid rgba(99,102,241,0.4); color: #818cf8; border-radius: 6px; padding: 0.2rem 0.5rem; font-size: 0.78rem; cursor: pointer; font-weight: 800; transition: transform 0.2s;">
                ${isCollapsed ? '▶' : '▼'}
              </button>
              <div>
                <div style="font-size: 0.95rem; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 0.45rem;">
                  <span>📦 LOTE COMPRA</span>
                  <span style="font-size: 0.68rem; font-weight: 800; padding: 0.12rem 0.45rem; border-radius: 6px; background: rgba(99,102,241,0.22); color: #818cf8; border: 1px solid rgba(99,102,241,0.45); letter-spacing: 0.5px;">${lotChecks.length} CHEQUES</span>
                </div>
                <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace; margin-top: 0.15rem; font-weight: 600;">ID: ${opId}</div>
              </div>
            </div>
          </td>
          <td style="padding: 0.85rem 1.25rem;">
            <div style="font-weight: 750; color: #ffffff; display: flex; align-items: center; gap: 0.35rem; font-size: 0.88rem;">
              <span style="color: var(--primary);">📅</span> Compra: ${formatDateLocal(lotDate)}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; font-weight: 600;">${lotChecks.length} vencimientos incluidos</div>
          </td>
          <td style="font-weight: 900; text-align: right; font-family: monospace; font-size: 1.1rem; color: #ffffff; padding: 0.85rem 1.25rem;">
            ${formatCurrency(totalNominal)}
          </td>
          <td style="padding: 0.85rem 1.25rem;">
            <div style="font-size: 0.85rem; font-weight: 800; color: #60a5fa; display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 0.65rem; font-weight: 800; padding: 0.12rem 0.35rem; border-radius: 4px; background: rgba(59,130,246,0.18); color: #60a5fa; border: 1px solid rgba(59,130,246,0.35);">VENDEDOR</span>
              <span style="color: #ffffff; font-weight: 800;">${seller}</span>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem; font-weight: 600;">
              Neto Pagado: <strong style="color: #60a5fa; font-family: monospace;">${formatCurrency(totalNet)}</strong>
            </div>
          </td>
          ${onlyNominal ? '' : `
          <td style="font-weight: 800; text-align: right; font-family: monospace; font-size: 1rem; color: #10b981; padding: 0.85rem 1.25rem;">
            +${formatCurrency(totalDiscount)}
            <div style="font-size: 0.68rem; color: var(--text-muted); font-weight: 600;">Desc. total lote</div>
          </td>
          `}
          <td style="text-align: right; white-space: nowrap; border-radius: 0 14px 14px 0; padding: 0.85rem 1.25rem;">
            <div style="display: flex; gap: 0.45rem; justify-content: flex-end; align-items: center;">
              <button type="button" class="icon-btn print-lot-pdf-btn" data-opid="${opId}" title="Imprimir Liquidación de Compra A4 (PDF)" style="height: 30px; display: flex; align-items: center; gap: 0.25rem; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.35); color: #818cf8; border-radius: 8px; padding: 0 0.6rem; font-size: 0.74rem; font-weight: 800; cursor: pointer; transition: all 0.2s;">🖨️ PDF</button>
              <button type="button" class="icon-btn print-lot-thermal-btn" data-opid="${opId}" title="Imprimir Ticket Térmico de Compra" style="height: 30px; display: flex; align-items: center; gap: 0.25rem; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.35); color: #60a5fa; border-radius: 8px; padding: 0 0.6rem; font-size: 0.74rem; font-weight: 800; cursor: pointer; transition: all 0.2s;">🧾 Térmico</button>
            </div>
          </td>
        `;

        tbody.appendChild(lotTr);

        // --- LOT CHILD CHECKS ROWS ---
        lotChecks.forEach(op => {
          renderSingleCheckRow(op, true, opId, isCollapsed);
        });

      } else {
        // --- SINGLE CHECK ROW ---
        renderSingleCheckRow(item.check, false, null, false);
      }
    });

    function renderSingleCheckRow(op, isChild = false, parentOpId = null, isHidden = false) {
      const tr = el('tr', { 
        classes: [
          ...(op.isECheck ? ['check-card-row', 'echeck-row'] : ['check-card-row']),
          ...(isChild ? [`lot-child-${parentOpId}`, 'lot-child-row'] : [])
        ],
        style: `box-shadow: var(--elevation-1); ${isChild ? `display: ${isHidden ? 'none' : 'table-row'}; background: rgba(99, 102, 241, 0.025); border-left: 4px solid #6366f1;` : ''}`
      });
      
      const isSold = op.sellSide && op.sellSide.status === 'SOLD';
      const seller = contacts.find(c => c.id === op.buySide?.contactId)?.name || op.buySide?.contactId || 'Desconocido';
      const buyer = contacts.find(c => c.id === op.sellSide?.contactId)?.name || op.sellSide?.contactId || '-';

      const _daysToVenc = op.getDaysToExpiry();
      const _daysColor = _daysToVenc < 0 ? '#ef4444'
        : _daysToVenc <= 10 ? '#f97316'
        : 'var(--text-muted)';
      const _daysLabel = _daysToVenc < 0 ? `Vencido hace ${Math.abs(_daysToVenc)}d`
        : `${_daysToVenc}d restantes`;

      const cbCell = selectable ? `<td style="padding: 1rem; width: 40px; text-align: center; border-radius: ${isChild ? '0' : '14px 0 0 14px'};"><input type="checkbox" class="portfolio-check-cb" data-id="${op.id}" data-parent-opid="${parentOpId || ''}" style="width: 17px; height: 17px; cursor: pointer;"></td>` : '';
      
      const _badgeBg = _daysToVenc < 0 ? 'rgba(239, 68, 68, 0.15)'
        : _daysToVenc <= 10 ? 'rgba(249, 115, 22, 0.15)'
        : 'rgba(255, 255, 255, 0.05)';
      const _badgeBorder = _daysToVenc < 0 ? 'rgba(239, 68, 68, 0.3)'
        : _daysToVenc <= 10 ? 'rgba(249, 115, 22, 0.3)'
        : 'rgba(255, 255, 255, 0.1)';

      const _daysBadge = _daysLabel ? `
        <div style="display: inline-flex; align-items: center; margin-top: 0.45rem; padding: 0.2rem 0.55rem; border-radius: 6px; background: ${_badgeBg}; border: 1px solid ${_badgeBorder}; color: ${_daysColor}; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.2px;">
          ${_daysToVenc < 0 ? '⚠️' : '⏳'} ${_daysLabel.toUpperCase()}
        </div>` : '';

      tr.innerHTML = `
        ${cbCell}
        <td style="${selectable ? '' : (isChild ? '' : 'border-radius: 14px 0 0 14px;')} ${isChild ? 'padding-left: 1.75rem;' : ''}">
          <div style="font-size: 0.95rem; font-weight: 800; color: #ffffff; letter-spacing: 0.3px; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            ${isChild ? '<span style="color: #818cf8; font-size: 0.8rem;">↳</span>' : ''} Nº ${op.checkNumber || 'S/N'}
            ${op.isECheck ? `
              <span style="font-size: 0.65rem; font-weight: 800; padding: 0.12rem 0.4rem; border-radius: 4px; background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); letter-spacing: 0.5px;">E-CHEQ</span>
            ` : `
              <span style="font-size: 0.65rem; font-weight: 800; padding: 0.12rem 0.4rem; border-radius: 4px; background: rgba(251,191,36,0.1); color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); letter-spacing: 0.5px;">FÍSICO</span>
            `}
          </div>
          ${(op.issuerName || op.issuerCuit) ? `
            <div style="font-size: 0.82rem; color: var(--primary); font-weight: 700; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
              <span style="font-size: 0.85rem;">👤</span>
              <span>${op.issuerName || 'Sin nombre'}</span>
              ${op.issuerCuit ? `<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">(CUIT: ${op.issuerCuit})</span>` : ''}
            </div>
          ` : ''}
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.3rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.25rem;"><span style="font-size: 0.8rem;">🏛️</span> ${op.bank || 'SIN BANCO'}</div>
        </td>
        <td>
          <div style="font-weight: 750; color: #ffffff; display: flex; align-items: center; gap: 0.35rem; font-size: 0.9rem;">
            <span style="color: var(--primary);">📅</span> ${formatDateLocal(op.dueDate)}
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem; font-weight: 600;">Límite: ${formatDateLocal(addDays(op.dueDate, 30))}</div>
          ${_daysBadge}
        </td>
        <td style="font-weight: 900; text-align: right; font-family: monospace; font-size: 1.05rem; color: #ffffff; letter-spacing: 0.2px;">${formatCurrency(op.nominalValue)}</td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 0.35rem;">
            <div style="font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 0.65rem; font-weight: 800; padding: 0.12rem 0.35rem; border-radius: 4px; background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3);">VENDEDOR</span>
              <span style="color: var(--text-main); font-weight: 750;">${seller}</span>
            </div>
            <div style="font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 0.65rem; font-weight: 800; padding: 0.12rem 0.35rem; border-radius: 4px; background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.25);">A</span>
              <span style="color: var(--text-main); font-weight: 700;">${isSold ? buyer : '<span style="color:var(--text-muted);font-weight:600;font-style:italic;">(En Cartera)</span>'}</span>
            </div>
          </div>
          ${op.sellSide?.status === 'BACK' && op.sellSide?.backReason ? `<div style="font-size: 0.72rem; color: #f43f5e; margin-top: 0.45rem; font-weight: 600; font-style: italic;">📝 Motivo: ${op.sellSide.backReason}</div>` : ''}
          <div style="margin-top: 0.55rem; display: flex; align-items: center; gap: 0.35rem;">
            ${getCheckStatusBadge(op)}
          </div>
          
          ${op.sellSide?.status === 'REJECTED' ? `
            <div class="rejected-states-box" style="margin-top: 0.75rem; padding: 0.55rem; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 10px; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.78rem;">
              <label style="display: flex; align-items: center; gap: 0.45rem; cursor: pointer; color: var(--text-main); font-weight: 600; margin: 0; user-select: none;">
                <input type="checkbox" class="state-volvio" data-id="${op.id}" ${op.returned ? 'checked disabled' : ''} style="width: 14px; height: 14px; cursor: pointer;">
                🔄 ¿Volvió?
              </label>
              <label style="display: flex; align-items: center; gap: 0.45rem; cursor: pointer; color: var(--text-main); font-weight: 600; margin: 0; user-select: none;">
                <input type="checkbox" class="state-levantado-empresa" data-id="${op.id}" ${op.settledByCompany ? 'checked disabled' : ''} style="width: 14px; height: 14px; cursor: pointer;">
                🏢 Levantado por la empresa
              </label>
              <label style="display: flex; align-items: center; gap: 0.45rem; cursor: pointer; color: var(--text-main); font-weight: 600; margin: 0; user-select: none;">
                <input type="checkbox" class="state-levantado-vendedor" data-id="${op.id}" ${op.settledBySeller ? 'checked disabled' : ''} style="width: 14px; height: 14px; cursor: pointer;">
                👤 Levantado por vendedor (${seller})
              </label>
            </div>
          ` : ''}
        </td>
        ${onlyNominal ? '' : `
        <td style="font-weight: 800; text-align: right; font-family: monospace; font-size: 1rem;">
          ${(() => {
            if (isSold) {
              return `<span style="color: #10b981; text-shadow: 0 1px 4px rgba(16,185,129,0.15);">+${formatCurrency(op.profit)}</span>`;
            }
            if (op.purchaseDiscount > 0) {
              return `
                <span style="color: #10b981;">+${formatCurrency(op.purchaseDiscount)}</span>
                <div style="display: inline-block; font-size: 0.65rem; color: #fbbf24; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.2); padding: 0.1rem 0.35rem; border-radius: 4px; margin-top: 0.2rem; font-weight: 700; letter-spacing: 0.2px;">
                  ${op.purchaseDiscountPercentage.toFixed(2)}% DESC
                </div>`;
            }
            return '<span style="color: var(--text-muted); font-weight: 550;">-</span>';
          })()}
        </td>
        `}
        <td style="text-align: right; white-space: nowrap; border-radius: 0 14px 14px 0;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center;">
            <button class="icon-btn print-single-buy-pdf-btn" data-id="${op.id}" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); color: #818cf8; border-radius: 8px; cursor: pointer; transition: all 0.2s;" title="Imprimir Comprobante de Compra PDF">
              <span style="font-size: 0.8rem;">🖨️</span>
            </button>
            <button class="icon-btn print-single-buy-thermal-btn" data-id="${op.id}" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); color: #60a5fa; border-radius: 8px; cursor: pointer; transition: all 0.2s;" title="Imprimir Ticket Térmico">
              <span style="font-size: 0.8rem;">🧾</span>
            </button>
            <button class="icon-btn edit-btn" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s;" title="Editar Cheque">
              <span style="font-size: 0.8rem;">✏️</span>
            </button>
            ${(op.issuerCuit || op.issuerName) ? `<button class="icon-btn bcra-list-btn" title="${op.issuerCuit ? `Consultar BCRA: ${op.issuerCuit}` : 'Consultar BCRA'}" style="height: 30px; display: flex; align-items: center; gap: 0.25rem; background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.3); color: #60a5fa; border-radius: 8px; padding: 0 0.55rem; font-size: 0.72rem; font-weight: 800; cursor: pointer; transition: all 0.2s; letter-spacing: 0.2px;">🔍 BCRA</button>` : ''}
            <button class="icon-btn delete-btn" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.18); color: var(--danger); border-radius: 8px; cursor: pointer; transition: all 0.2s;" title="Eliminar Cheque">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="pointer-events: none; vertical-align: middle;"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg>
            </button>
          </div>
        </td>
      `;

      // Rejected state checkboxes change events logic setup
      const cbVolvio = tr.querySelector('.state-volvio');
      const cbEmpresa = tr.querySelector('.state-levantado-empresa');
      const cbVendedor = tr.querySelector('.state-levantado-vendedor');

      const handleStateCheck = (checkbox, stateKey, title, promptMsg) => {
        checkbox.addEventListener('change', (evt) => {
          if (checkbox.checked) {
            checkbox.checked = false; // Revert until confirmed
            showStateConfirmationModal({
              title,
              promptMsg,
              expectedValue: op.checkNumber,
              onConfirm: () => {
                op[stateKey] = true;
                op[`${stateKey}At`] = Date.now();
                onSave(op);
              }
            });
          }
        });
      };

      if (cbVolvio) handleStateCheck(cbVolvio, 'returned', '¿Volvió el Cheque?', `¿Tienes la Hoja del Cheque? Para continuar por favor ingresa el número del cheque:`);
      if (cbEmpresa) handleStateCheck(cbEmpresa, 'settledByCompany', 'Levantado por la Empresa', `¿El cheque fue levantado por la empresa? Para continuar por favor ingresa el número del cheque:`);
      if (cbVendedor) handleStateCheck(cbVendedor, 'settledBySeller', 'Levantado por Vendedor', `¿El cheque fue levantado por el vendedor (${seller})? Para continuar por favor ingresa el número del cheque:`);

      tr.addEventListener('click', (e) => {
        if (e.target.closest('.edit-btn')) { showOperationModal(op, contacts, buyContacts && buyContacts.length > 0 ? buyContacts : contacts, onSave); return; }
        if (e.target.closest('.delete-btn')) { onDelete(op.id); return; }
        if (e.target.closest('.bcra-list-btn')) {
          copyToClipboardAndOpenBcra(op.issuerCuit);
          return;
        }
        if (e.target.closest('.print-single-buy-pdf-btn')) {
          const sellerName = contacts.find(c => c.id === op.buySide?.contactId)?.name || op.buySide?.contactId || 'Desconocido';
          const dateStr = op.buySide?.date || op.receptionDate;
          printBuyOperationReport(op.buySide?.operationId || 'PROFORMA', sellerName, dateStr, [op], contacts, 'standard');
          return;
        }
        if (e.target.closest('.print-single-buy-thermal-btn')) {
          const sellerName = contacts.find(c => c.id === op.buySide?.contactId)?.name || op.buySide?.contactId || 'Desconocido';
          const dateStr = op.buySide?.date || op.receptionDate;
          printBuyOperationReport(op.buySide?.operationId || 'PROFORMA', sellerName, dateStr, [op], contacts, 'thermal');
          return;
        }
        if (e.target.closest('.portfolio-check-cb')) return; // handled by change
        if (e.target.closest('.state-volvio') || e.target.closest('.state-levantado-empresa') || e.target.closest('.state-levantado-vendedor')) return; // handled by change
      });

      // Add hover scales to tables action buttons
      tr.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.08)'; btn.style.filter = 'brightness(1.2)'; });
        btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; btn.style.filter = 'none'; });
      });

      if (selectable && selectedIds !== null) {
        const cb = tr.querySelector('.portfolio-check-cb');
        if (cb) {
          if (selectedIds.has(String(op.id))) cb.checked = true;
          cb.addEventListener('change', () => {
            if (cb.checked) selectedIds.add(String(op.id)); else selectedIds.delete(String(op.id));
            if (parentOpId) {
              const lotCb = tbody.querySelector(`.lot-check-cb[data-opid="${parentOpId}"]`);
              if (lotCb) {
                const childCbs = tbody.querySelectorAll(`.lot-child-${parentOpId} .portfolio-check-cb`);
                const allChecked = Array.from(childCbs).every(c => c.checked);
                lotCb.checked = allChecked;
              }
            }
            if (onSelectionChange) onSelectionChange();
          });
        }
      }

      if (op.notes && op.notes.trim()) {
        tr.title = `Observaciones: ${op.notes.trim()}`;
        const firstCell = tr.querySelector('td:nth-child(' + (selectable ? '2' : '1') + ')');
        if (firstCell) {
          const notesBadge = el('span', { 
            text: '📝', 
            style: 'display: inline-block; margin-left: 0.4rem; color: var(--primary); font-size: 0.78rem; cursor: help;',
            attrs: { title: `Observaciones: ${op.notes.trim()}` } 
          });
          firstCell.appendChild(notesBadge);
        }
      }
      
      tbody.appendChild(tr);
    }

    // Attach Lot Row event delegations
    tbody.addEventListener('click', (e) => {
      // Toggle Lot Accordion
      const toggleBtn = e.target.closest('.lot-toggle-btn');
      const lotHeaderRow = e.target.closest('.check-lot-header-row');
      if (toggleBtn || (lotHeaderRow && !e.target.closest('input') && !e.target.closest('button'))) {
        const opId = (toggleBtn || lotHeaderRow.querySelector('.lot-toggle-btn')).dataset.opid;
        const btn = lotHeaderRow ? lotHeaderRow.querySelector('.lot-toggle-btn') : toggleBtn;
        const childRows = tbody.querySelectorAll(`.lot-child-${opId}`);
        const isCollapsed = window._checksCollapsedLots.has(opId);

        if (isCollapsed) {
          window._checksCollapsedLots.delete(opId);
          childRows.forEach(r => r.style.display = 'table-row');
          if (btn) btn.textContent = '▼';
        } else {
          window._checksCollapsedLots.add(opId);
          childRows.forEach(r => r.style.display = 'none');
          if (btn) btn.textContent = '▶';
        }
        return;
      }

      // Print Lot PDF
      const lotPdfBtn = e.target.closest('.print-lot-pdf-btn');
      if (lotPdfBtn) {
        const opId = lotPdfBtn.dataset.opid;
        const lotChecks = sorted.filter(chk => chk.buySide?.operationId === opId);
        const sellerName = contacts.find(c => c.id === lotChecks[0]?.buySide?.contactId)?.name || lotChecks[0]?.buySide?.contactId || 'Desconocido';
        const dateStr = lotChecks[0]?.buySide?.date || lotChecks[0]?.receptionDate;
        printBuyOperationReport(opId, sellerName, dateStr, lotChecks, contacts, 'standard');
        return;
      }

      // Print Lot Thermal
      const lotThermalBtn = e.target.closest('.print-lot-thermal-btn');
      if (lotThermalBtn) {
        const opId = lotThermalBtn.dataset.opid;
        const lotChecks = sorted.filter(chk => chk.buySide?.operationId === opId);
        const sellerName = contacts.find(c => c.id === lotChecks[0]?.buySide?.contactId)?.name || lotChecks[0]?.buySide?.contactId || 'Desconocido';
        const dateStr = lotChecks[0]?.buySide?.date || lotChecks[0]?.receptionDate;
        printBuyOperationReport(opId, sellerName, dateStr, lotChecks, contacts, 'thermal');
        return;
      }
    });

    // Lot checkboxes handler
    tbody.querySelectorAll('.lot-check-cb').forEach(lotCb => {
      lotCb.addEventListener('change', () => {
        const opId = lotCb.dataset.opid;
        const childCbs = tbody.querySelectorAll(`.lot-child-${opId} .portfolio-check-cb`);
        childCbs.forEach(childCb => {
          childCb.checked = lotCb.checked;
          const id = String(childCb.dataset.id);
          if (lotCb.checked) selectedIds.add(id); else selectedIds.delete(id);
        });
        if (onSelectionChange) onSelectionChange();
      });
    });

    if (selectable) {
      const allCb = table.querySelector('.check-all-cb');
      if (allCb) {
        if (selectedIds !== null && checksList.length > 0) {
          const allSelected = checksList.every(c => selectedIds.has(String(c.id)));
          allCb.checked = allSelected;
        }
        allCb.addEventListener('change', () => {
          table.querySelectorAll('.portfolio-check-cb').forEach(cb => {
            cb.checked = allCb.checked;
            const id = String(cb.dataset.id);
            if (allCb.checked) selectedIds.add(id); else selectedIds.delete(id);
          });
          table.querySelectorAll('.lot-check-cb').forEach(cb => {
            cb.checked = allCb.checked;
          });
          if (onSelectionChange) onSelectionChange();
        });
      }
    }
  }
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  return tableWrapper;
}

/**
 * Helper utilitario para crear tarjetas visuales de métricas financieras.
 *
 * @param {string} label - Título o etiqueta descriptiva del indicador financiero.
 * @param {string|number} value - Valor monetario o numérico formateado de la métrica.
 * @param {string} color - Código de color o variable CSS para el borde indicativo de la tarjeta.
 * @param {string} emoji - Emojis visual representativo.
 * @returns {HTMLElement} El contenedor div ('glass-card') de la tarjeta estadística.
 */
export function createStatCard(label, value, color, emoji) {
  return el('kmp-metric-card', {
    attrs: {
      title: label,
      value: value,
      icon: emoji,
      subtitle: 'Indicador de cartera'
    }
  });
}

/**
 * Muestra un diálogo elegante con efecto Glassmorphism solicitando la confirmación
 * mediante el ingreso exacto del número del cheque correspondiente.
 */
export function showStateConfirmationModal({ title, promptMsg, expectedValue, onConfirm }) {
  const overlay = el('div', {
    classes: ['modal-overlay', 'fade-in'],
    style: 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1.5rem; overflow-y: auto;'
  });
  
  const modal = el('div', {
    classes: ['glass-card'],
    style: 'max-width: 480px; width: 100%; max-height: calc(100vh - 3rem); overflow-y: auto; padding: 2rem; border-radius: 20px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 1.25rem; margin: auto; box-sizing: border-box;'
  });
  
  modal.innerHTML = `
    <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 0.5rem;">
      ⚠️ Confirmar Cambio de Estado
    </h3>
    <div style="font-size: 0.88rem; color: var(--text-main); font-weight: 550; line-height: 1.5;">
      ${promptMsg}
    </div>
    
    <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.78rem; color: #f87171; font-weight: 600;">
      <strong>⚠️ Importante:</strong> Una vez confirmado este estado, no podrá ser desmarcado ni editado.
    </div>
    
    <div class="form-group" style="margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
      <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Número de Cheque</label>
      <input type="text" id="confirm-check-num-input" placeholder="Ingresa el número de cheque..." style="width: 100%; padding: 0.6rem 0.95rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: 700; font-size: 1rem; text-align: center; letter-spacing: 1px;">
      <div id="confirm-error-msg" style="color: #ef4444; font-size: 0.75rem; font-weight: 600; display: none; margin-top: 0.2rem;">El número ingresado no coincide.</div>
    </div>
    
    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 0.5rem;">
      <button type="button" class="btn-outline" id="btn-cancel-confirm" style="padding: 0.55rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.82rem; cursor: pointer; margin: 0;">Cancelar</button>
      <button type="button" class="btn-primary" id="btn-submit-confirm" style="padding: 0.55rem 1.5rem; border-radius: 10px; font-weight: 750; font-size: 0.82rem; background: var(--primary); border: none; color: var(--on-primary); cursor: pointer; margin: 0;">Confirmar</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  const input = modal.querySelector('#confirm-check-num-input');
  const errorMsg = modal.querySelector('#confirm-error-msg');
  const cancelBtn = modal.querySelector('#btn-cancel-confirm');
  const submitBtn = modal.querySelector('#btn-submit-confirm');
  
  input.focus();
  
  cancelBtn.onclick = () => overlay.remove();
  
  const handleConfirm = () => {
    const entered = input.value.trim();
    if (entered === String(expectedValue).trim()) {
      overlay.remove();
      onConfirm();
    } else {
      errorMsg.style.display = 'block';
      input.style.borderColor = '#ef4444';
      input.focus();
    }
  };
  
  submitBtn.onclick = handleConfirm;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };
}

/**
 * Copia de forma automática el CUIT al portapapeles del usuario, muestra una notificación
 * de confirmación y abre la Central de Deudores del Banco Central (BCRA).
 * @param {string} cuitRaw - El CUIT ingresado o registrado del librador.
 */
export function copyToClipboardAndOpenBcra(cuitRaw) {
  const cuit = String(cuitRaw || '').replace(/\D/g, '');
  if (!cuit || cuit.length < 11) {
    alert('Por favor ingrese un CUIT válido (11 dígitos).');
    return;
  }

  // 1. Intentar copiar con el API moderno y fallback sincrónico
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(cuit).catch(() => {});
  }
  try {
    const tempInput = document.createElement('textarea');
    tempInput.value = cuit;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
  } catch (e) {}

  // 2. Abrir BCRA de forma sincrónica para evitar bloqueo por el navegador
  window.open('https://www.bcra.gob.ar/situacion-crediticia/', '_blank');

  // 3. Notificar explícitamente al usuario que el CUIT fue copiado
  alert(`CUIT ${cuit} copiado al portapapeles.\n\nSe abrió la Central de Deudores del BCRA. Pegá el CUIT allí para consultar.`);
}


