import { el } from '../../utils/dom.js';
import { renderDateModal } from '../components/Modals.js';

function getSortDate(str) {
  if (!str) return 0;
  const parts = String(str).split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  const dt = new Date(str).getTime();
  return isNaN(dt) ? 0 : dt;
}

export function renderChecks(container, options) {
  const { checks, filteredChecks, filters, contacts, pagination, onFilterChange, onSave, onDelete, onRefresh, onExport, onPrint, onBatchBuy, onBatchSell, onPortfolioPageChange, onHistoryPageChange } = options;
  container.innerHTML = '';

  const header = el('div', { 
    classes: ['dashboard-header'],
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;'
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

  const actionGroup = el('div', { style: 'display: flex; gap: 0.75rem; flex-wrap: wrap;' });

  const exportBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem;',
    html: '<span>📥 Exportar</span>'
  });
  exportBtn.onclick = () => {
    if (typeof onExport === 'function') {
      renderDateModal({
        title: 'Exportar Reporte de Cheques',
        description: 'Selecciona el rango de fechas de recepción o pago a incluir en el Excel.',
        submitText: 'Descargar Excel',
        onSubmit: onExport
      });
    }
  };

  const batchBuyBtn = el('button', {
    style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border: none; cursor: pointer; font-weight: 600; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(99,102,241,0.35); transition: opacity 0.2s;',
    html: '<svg viewBox="0 0 24 24" width="16" height="16" style="fill:currentColor;flex-shrink:0;"><path d="M17,12H14V8H10V12H7L12,17L17,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg> Compra Masiva'
  });
  batchBuyBtn.onclick = () => showBatchBuyModal(options.buyContacts, onBatchBuy);

  const addBtn = el('button', { 
    classes: ['btn-nueva-operacion'],
    style: 'margin: 0;',
    html: '<svg viewBox="0 0 24 24" width="18" height="18" style="fill:currentColor;flex-shrink:0;"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg> Nueva Operación'
  });
  addBtn.onclick = () => showOperationModal(null, contacts, options.buyContacts, onSave);
  
  actionGroup.appendChild(exportBtn);
  actionGroup.appendChild(batchBuyBtn);
  actionGroup.appendChild(addBtn);
  header.appendChild(actionGroup);

  container.appendChild(header);

  // Realized profit: only SOLD checks have profit > 0
  const totalProfit = checks.reduce((sum, c) => sum + (c.profit || 0), 0);
  
  const isPortfolio = (c) => {
    const st = c.sellSide?.status;
    // RETURNED re-enters the portfolio so the check can be re-sold or tracked with its warning badge
    return !st || st === 'PENDING' || st === 'BACK' || st === 'RETURNED';
  };
  const isHistory = (c) => {
    const st = c.sellSide?.status;
    return st === 'SOLD' || st === 'REJECTED';
  };

  const portfolioChecks = checks.filter(isPortfolio);
  const totalInPortfolio = portfolioChecks.reduce((sum, c) => sum + (parseFloat(c.nominalValue) || 0), 0);

  // Unrealized gain = purchase discounts locked in but not yet sold
  const totalPortfolioDiscount = portfolioChecks.reduce((sum, c) => {
    const nominal = parseFloat(c.nominalValue) || 0;
    const netPaid = parseFloat(c.buySide?.netAmount);
    return sum + (isNaN(netPaid) ? 0 : nominal - netPaid);
  }, 0);

  const statsGrid = el('div', { 
    classes: ['stats-grid'],
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;'
  });

  statsGrid.appendChild(createStatCard('Ganancia Vendida', formatCurrency(totalProfit), 'var(--success)'));
  statsGrid.appendChild(createStatCard('Desc. en Cartera', formatCurrency(totalPortfolioDiscount), 'var(--success)'));
  statsGrid.appendChild(createStatCard('Capital en Cartera', formatCurrency(totalInPortfolio), 'var(--primary)'));
  statsGrid.appendChild(createStatCard('Cheques en Cartera', portfolioChecks.length, 'var(--primary)'));

  container.appendChild(statsGrid);

  // ── Warning banner: checks PRÓXIMO A VENCER ──
  const today0 = new Date(); today0.setHours(0,0,0,0);
  const parseDL = (str) => {
    if (!str) return null;
    const p = String(str).split('T')[0].split('-');
    return p.length === 3 ? new Date(Number(p[0]), Number(p[1])-1, Number(p[2])) : null;
  };
  const expiringChecks = portfolioChecks.filter(c => {
    const pay = parseDL(c.dueDate); if (!pay) return false;
    const exp = new Date(pay); exp.setDate(pay.getDate() + 30);
    const dPay = Math.ceil((pay - today0) / 86400000);
    const dExp = Math.ceil((exp - today0) / 86400000);
    return dPay <= 0 && dExp >= 0 && dExp <= 10;
  });

  if (expiringChecks.length > 0) {
    const banner = el('div', {
      style: 'position:relative; margin-bottom:1.25rem; padding:1rem 3rem 1rem 1.25rem; background:rgba(239,68,68,0.1); border:1.5px solid rgba(239,68,68,0.5); border-radius:14px; display:flex; align-items:flex-start; gap:0.75rem;'
    });

    const icon = el('span', { text: '⚠️', style: 'font-size:1.3rem; flex-shrink:0; margin-top:0.05rem;' });

    const textBlock = el('div', { style: 'flex:1;' });
    textBlock.appendChild(el('div', {
      html: `<strong style="color:#ef4444;">Tenés ${expiringChecks.length} cheque${expiringChecks.length > 1 ? 's' : ''} que está${expiringChecks.length > 1 ? 'n' : ''} por vencer.</strong>`,
      style: 'margin-bottom:0.3rem;'
    }));
    textBlock.appendChild(el('div', {
      text: 'Por decisión del Banco Central, podés hacer ese tipo de operaciones hasta 30 días después de su fecha de pago.',
      style: 'font-size:0.875rem; color:#ef4444; opacity:0.9; line-height:1.45;'
    }));

    const closeBtn = el('button', {
      attrs: { type: 'button', title: 'Cerrar aviso' },
      style: 'position:absolute; top:0.75rem; right:0.9rem; background:none; border:none; cursor:pointer; font-size:1.1rem; color:#ef4444; opacity:0.7; line-height:1;',
      text: '✕'
    });
    closeBtn.onclick = () => banner.remove();

    banner.appendChild(icon);
    banner.appendChild(textBlock);
    banner.appendChild(closeBtn);
    container.appendChild(banner);
  }

  // Apply filters before splitting sections to compute counts
  const currentList = filteredChecks || checks;
  const currentHistory = currentList.filter(isHistory);
  const currentPortfolio = currentList.filter(isPortfolio);

  // Filters Bar
  const filtersBar = el('div', { 
    classes: ['glass-card'], 
    style: 'margin-bottom: 2rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;' 
  });

  const filtersGrid = el('div', {
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; align-items: end;'
  });

  const searchGroup = el('div', { classes: ['form-group'], style: 'margin-bottom:0;' });
  searchGroup.appendChild(el('label', { text: '🔍 Banco · Nº Cheque · Librador · CUIT · Vendedor / Comprador' }));

  // Build suggestion list from all checks + contacts
  const suggestionSet = new Set();
  checks.forEach(c => {
    if (c.bank) suggestionSet.add(c.bank);
    if (c.checkNumber) suggestionSet.add(String(c.checkNumber));
    if (c.issuerName) suggestionSet.add(c.issuerName);
    if (c.issuerCuit) suggestionSet.add(String(c.issuerCuit));
  });
  contacts.forEach(c => { if (c.name) suggestionSet.add(c.name); });

  const searchDatalist = el('datalist', { attrs: { id: 'checks-search-dl' } });
  suggestionSet.forEach(val => {
    const opt = document.createElement('option');
    opt.value = val;
    searchDatalist.appendChild(opt);
  });

  const searchInput = el('input', {
    attrs: { type: 'text', list: 'checks-search-dl', placeholder: 'Escribí banco, número, librador, contacto...', value: filters?.searchTerm || '', autocomplete: 'off' },
    style: 'width: 100%;'
  });
  let _searchDebounce = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(() => onFilterChange({ searchTerm: e.target.value }), 500);
  });
  searchGroup.appendChild(searchDatalist);
  searchGroup.appendChild(searchInput);


  // ── Date field helper ──
  function makeDateField(labelText, isoValue) {
    const group = el('div', { classes: ['form-group'], style: 'margin-bottom:0;' });
    group.appendChild(el('label', { text: labelText }));

    const wrapper = el('div', { style: 'display:flex; gap:0.4rem; align-items:center;' });

    const dateInput = el('input', {
      attrs: { type: 'date', value: isoValue || '' },
      style: 'flex:1; min-width:0;'
    });

    const calBtn = el('button', {
      attrs: { type: 'button', title: 'Abrir calendario' },
      style: 'flex-shrink:0; padding:0 0.6rem; height:38px; border-radius:8px; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.4); color:var(--primary); cursor:pointer; font-size:1rem; display:flex; align-items:center;',
      text: '📅'
    });
    calBtn.onclick = () => { if (dateInput.showPicker) dateInput.showPicker(); else dateInput.click(); };

    wrapper.appendChild(dateInput);
    wrapper.appendChild(calBtn);
    group.appendChild(wrapper);
    return { group, input: dateInput };
  }

  const dateTypeGroup = el('div', { classes: ['form-group'], style: 'margin-bottom:0;' });
  dateTypeGroup.appendChild(el('label', { text: 'Tipo de Fecha' }));
  const dateTypeSelect = el('select', { style: 'width: 100%; height: 38px; padding: 0 0.5rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main); outline: none; font-family: inherit;' });
  dateTypeSelect.innerHTML = `
    <option value="DUE" ${filters?.dateFilterType === 'DUE' ? 'selected' : ''}>Fecha de Pago</option>
    <option value="RECEPTION" ${filters?.dateFilterType === 'RECEPTION' ? 'selected' : ''}>Fecha de Recepción</option>
  `;
  dateTypeGroup.appendChild(dateTypeSelect);

  const startField = makeDateField('Desde', filters?.startDate || '');
  const endField   = makeDateField('Hasta',  filters?.endDate  || '');

  const applyBtnGroup = el('div', { style: 'display: flex; gap: 0.5rem; align-items: flex-end; padding-bottom: 2px;' });
  
  const applyBtn = el('button', {
    style: 'height: 38px; border-radius: 8px; padding: 0 1.25rem; font-weight: 600; display: flex; align-items: center; justify-content: center; background: var(--primary); color: var(--on-primary); border: none; flex-shrink: 0; cursor: pointer; transition: var(--transition);',
    text: 'Aplicar'
  });
  applyBtn.onclick = () => {
    onFilterChange({ 
      startDate: startField.input.value || '', 
      endDate: endField.input.value || '',
      dateFilterType: dateTypeSelect.value
    });
  };

  const clearBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'height: 38px; border-radius: 8px; padding: 0 0.75rem; font-weight: 600; display: flex; align-items: center; justify-content: center;',
    attrs: { title: 'Limpiar fechas' },
    text: '✕'
  });
  clearBtn.onclick = () => {
    onFilterChange({ startDate: '', endDate: '' });
  };

  applyBtnGroup.appendChild(applyBtn);
  applyBtnGroup.appendChild(clearBtn);

  filtersGrid.appendChild(searchGroup);
  filtersGrid.appendChild(dateTypeGroup);
  filtersGrid.appendChild(startField.group);
  filtersGrid.appendChild(endField.group);
  filtersGrid.appendChild(applyBtnGroup);
  filtersBar.appendChild(filtersGrid);

  const filterCountBar = el('div', {
    style: 'padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between;'
  });
  
  const isFiltered = filters?.searchTerm || filters?.startDate || filters?.endDate;
  const filterLabel = isFiltered ? 'Resultados de los filtros aplicados' : 'Total sin filtros adicionales';
  
  const totalPortfolioFiltered = currentPortfolio.reduce((acc, c) => acc + (parseFloat(c.nominalValue) || 0), 0);
  const totalHistoryFiltered = currentHistory.reduce((acc, c) => acc + (parseFloat(c.nominalValue) || 0), 0);
  
  filterCountBar.innerHTML = `
    <span style="font-size: 0.9rem; color: var(--text-muted);">
      ${filterLabel}: <strong style="color: var(--primary);">${currentPortfolio.length}</strong> cheques en cartera (${formatCurrency(totalPortfolioFiltered)}) y <strong style="color: var(--success);">${currentHistory.length}</strong> operaciones históricas (${formatCurrency(totalHistoryFiltered)})
    </span>
  `;

  filtersBar.appendChild(filterCountBar);
  container.appendChild(filtersBar);

  const portfolioHeader = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;' });
  portfolioHeader.appendChild(el('h2', { text: `📂 Cheques en Cartera (${currentPortfolio.length})`, style: 'margin:0; font-size: 1.25rem;' }));
  
  const portfolioActions = el('div', { style: 'display: flex; gap: 0.5rem; align-items: center;' });
  
  const isAsc = filters?.sortPortfolioAsc !== false; // default true
  const sortBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.9rem;',
    html: `<span>${isAsc ? '⬆️ Más próximos' : '⬇️ Más lejanos'}</span>`
  });
  sortBtn.onclick = () => onFilterChange({ sortPortfolioAsc: !isAsc });
  
  const printPortfolioBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.9rem;',
    html: '<span>🖨️ Imprimir</span>'
  });
  printPortfolioBtn.onclick = () => {
    if (typeof onPrint === 'function') onPrint(sortedPortfolio);
  };
  
  portfolioActions.appendChild(sortBtn);
  portfolioActions.appendChild(printPortfolioBtn);
  portfolioHeader.appendChild(portfolioActions);

  container.appendChild(portfolioHeader);

  // Batch-sell selection bar (injected after table renders)
  const batchSellBar = el('div', {
    style: 'display: none; align-items: center; gap: 1rem; margin-bottom: 0.75rem; padding: 0.75rem 1.25rem; background: rgba(16,185,129,0.1); border: 1px solid var(--success); border-radius: 12px; flex-wrap: wrap;'
  });
  const batchSellLabel = el('span', { text: '0 cheques seleccionados', style: 'font-weight: 600; flex: 1; color: var(--success);' });
  const batchSellBtn = el('button', {
    classes: ['btn-nueva-operacion'],
    style: 'margin: 0; background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16,185,129,0.35);',
    html: '📤 Vender Selección'
  });
  const clearSelBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'border-radius: 8px; padding: 0.5rem 1rem;',
    text: 'Limpiar selección'
  });
  batchSellBar.appendChild(batchSellLabel);
  batchSellBar.appendChild(clearSelBtn);
  batchSellBar.appendChild(batchSellBtn);
  container.appendChild(batchSellBar);

  let selectedIds = new Set();

  const updateBatchBar = () => {
    if (selectedIds.size > 0) {
      batchSellBar.style.display = 'flex';
      let totalNominal = 0;
      currentPortfolio.forEach(c => {
        if (selectedIds.has(c.id)) {
          totalNominal += parseFloat(c.nominalValue) || 0;
        }
      });
      batchSellLabel.textContent = `${selectedIds.size} cheque${selectedIds.size > 1 ? 's' : ''} seleccionado${selectedIds.size > 1 ? 's' : ''} (${formatCurrency(totalNominal)})`;
    } else {
      batchSellBar.style.display = 'none';
    }
  };

  clearSelBtn.onclick = () => {
    selectedIds.clear();
    container.querySelectorAll('.portfolio-check-cb').forEach(cb => { cb.checked = false; });
    updateBatchBar();
  };

  batchSellBtn.onclick = () => {
    if (selectedIds.size === 0) return;
    showBatchSellModal(contacts, Array.from(selectedIds), onBatchSell, () => {
      selectedIds.clear();
      updateBatchBar();
    });
  };

  // Sort portfolio BEFORE pagination
  const sortedPortfolio = [...currentPortfolio].sort((a,b) => {
    const tA = getSortDate(a.dueDate);
    const tB = getSortDate(b.dueDate);
    return isAsc ? tA - tB : tB - tA;
  });

  const portTotal = sortedPortfolio.length;
  const portTotalPages = Math.ceil(portTotal / (pagination?.itemsPerPage || 15));
  let portCurrentPage = pagination?.portfolioPage || 1;
  if (portCurrentPage > portTotalPages && portTotalPages > 0) portCurrentPage = portTotalPages;
  const portStart = (portCurrentPage - 1) * (pagination?.itemsPerPage || 15);
  const portPaginated = sortedPortfolio.slice(portStart, portStart + (pagination?.itemsPerPage || 15));

  const portfolioTable = renderCheckTable(portPaginated, contacts, onSave, onDelete, 'dueDate', isAsc, true, selectedIds, updateBatchBar);
  container.appendChild(portfolioTable);
  
  if (portTotalPages > 1) {
    container.appendChild(renderPaginationControls(portCurrentPage, portTotalPages, portTotal, onPortfolioPageChange));
  }

  // Section 2: OPERACIONES REALIZADAS
  const historyHeader = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-top: 3rem; margin-bottom: 1rem;' });
  historyHeader.appendChild(el('h2', { text: `📜 Operaciones Realizadas (${currentHistory.length})`, style: 'margin:0; font-size: 1.25rem;' }));
  const printHistoryBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.9rem;',
    html: '<span>🖨️ Imprimir</span>'
  });
  printHistoryBtn.onclick = () => {
    if (typeof onPrint === 'function') onPrint(sortedHistory);
  };
  historyHeader.appendChild(printHistoryBtn);
  container.appendChild(historyHeader);
  // Sort history BEFORE pagination
  const sortedHistory = [...currentHistory].sort((a,b) => {
    const tA = getSortDate(a.dueDate);
    const tB = getSortDate(b.dueDate);
    return tB - tA; // history defaults to descending
  });

  const histTotal = sortedHistory.length;
  const histTotalPages = Math.ceil(histTotal / (pagination?.itemsPerPage || 15));
  let histCurrentPage = pagination?.historyPage || 1;
  if (histCurrentPage > histTotalPages && histTotalPages > 0) histCurrentPage = histTotalPages;
  const histStart = (histCurrentPage - 1) * (pagination?.itemsPerPage || 15);
  const histPaginated = sortedHistory.slice(histStart, histStart + (pagination?.itemsPerPage || 15));

  container.appendChild(renderCheckTable(histPaginated, contacts, onSave, onDelete, 'dueDate', false));
  if (histTotalPages > 1) {
    container.appendChild(renderPaginationControls(histCurrentPage, histTotalPages, histTotal, onHistoryPageChange));
  }
}

function renderPaginationControls(currentPage, totalPages, totalItems, onPageChange) {
  const pagContainer = el('div', { 
    style: 'display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--border); margin-bottom: 2rem;'
  });

  const info = el('div', { 
    text: `Mostrando página ${currentPage} de ${totalPages} (${totalItems} registros)`,
    style: 'font-size: 0.85rem; color: var(--text-muted);'
  });
  pagContainer.appendChild(info);

  const btnGroup = el('div', { style: 'display: flex; gap: 0.5rem; align-items: center;' });
  
  const prevBtn = el('button', { 
    classes: ['btn-secondary'], 
    text: 'Anterior',
    style: 'padding: 0.5rem 1rem; font-size: 0.85rem;'
  });
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => onPageChange(currentPage - 1);
  btnGroup.appendChild(prevBtn);

  const pageInfo = el('span', { 
    text: `Pág. ${currentPage} / ${totalPages}`,
    style: 'font-size: 0.85rem; font-weight: 600; margin: 0 1rem;'
  });
  btnGroup.appendChild(pageInfo);

  const nextBtn = el('button', { 
    classes: ['btn-secondary'], 
    text: 'Siguiente',
    style: 'padding: 0.5rem 1rem; font-size: 0.85rem;'
  });
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => onPageChange(currentPage + 1);
  btnGroup.appendChild(nextBtn);

  pagContainer.appendChild(btnGroup);
  return pagContainer;
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
    // Use local-date parsing (YYYY-MM-DD → local midnight) to avoid UTC day-shift.
    // new Date("YYYY-MM-DD") is UTC midnight which in UTC-3 is 21:00 the day before,
    // causing setHours(0,0,0,0) to land on the wrong calendar day.
    const today = new Date();
    today.setHours(0,0,0,0);

    const parseDateLocal = (str) => {
      if (!str) return null;
      const parts = String(str).split('T')[0].split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        return new Date(y, m - 1, d); // local midnight, no timezone shift
      }
      const dt = new Date(str);
      dt.setHours(0,0,0,0);
      return dt;
    };

    const payDate = parseDateLocal(op.dueDate);
    const expiryDate = new Date(payDate);
    expiryDate.setDate(payDate.getDate() + 30);

    const diffToPayDate = Math.ceil((payDate - today) / (1000 * 60 * 60 * 24));
    const diffToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (diffToExpiry < 0) {
      // Pasaron los 30 días de gracia → cheque vencido, no cobrable
      badgeHtml += ' <span class="status-badge badge-danger">⛔ VENCIDO</span>';
    } else if (diffToPayDate <= 0 && diffToExpiry <= 10) {
      // Quedan 10 días o menos para el vencimiento → urgente
      badgeHtml += ' <span class="status-badge" style="background:rgba(249,115,22,0.18);color:#f97316;border:1px solid rgba(249,115,22,0.4);font-weight:700;">⏳ PRÓXIMO A VENCER</span>';
    } else if (diffToPayDate <= 0) {
      // Fecha de pago pasó, aún dentro del período de gracia → disponible para cobrar
      badgeHtml += ' <span class="status-badge badge-disponible">✅ DISPONIBLE</span>';
    } else if (diffToPayDate <= 10) {
      // Fecha de pago en los próximos 10 días → avisar que se acerca
      badgeHtml += ` <span class="status-badge" style="background:rgba(234,179,8,0.15);color:#eab308;border:1px solid rgba(234,179,8,0.35);">🔔 PAGO EN ${diffToPayDate}d</span>`;
    }
  }

  return badgeHtml || '<span class="status-badge badge-pending">EN CARTERA</span>';
}


function renderCheckTable(checksList, contacts, onSave, onDelete, sortBy = 'receptionDate', sortAsc = false, selectable = false, selectedIds = null, onSelectionChange = null) {
  const tableWrapper = el('div', { classes: ['glass-card', 'table-responsive'], style: 'padding: 0; margin-bottom: 2rem;' });
  const table = el('table', { style: 'width: 100%; min-width: 800px; border-collapse: collapse;' });
  
  const thead = el('thead', { html: `
    <tr style="background: rgba(255,255,255,0.05); text-align: left;">
      ${selectable ? '<th style="padding: 1rem; width: 40px;"><input type="checkbox" id="check-all-cb" title="Seleccionar todos"></th>' : ''}
      <th style="padding: 1rem;">Banco / #</th>
      <th style="padding: 1rem;">F. Pago / Vencimiento</th>
      <th style="padding: 1rem;">Valor Nominal</th>
      <th style="padding: 1rem;">Origen / Destino</th>
      <th style="padding: 1rem;">${selectable ? 'Desc. Compra' : 'Ganancia'}</th>
      <th style="padding: 1rem; text-align: right;">Acciones</th>
    </tr>
  `});
  table.appendChild(thead);

  const tbody = el('tbody');
  if (checksList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-muted);">Sin registros en esta sección</td></tr>';
  } else {
    checksList.sort((a,b) => {
      const tA = getSortDate(a[sortBy]);
      const tB = getSortDate(b[sortBy]);
      return sortAsc ? tA - tB : tB - tA;
    }).forEach(op => {
      const tr = el('tr', { style: 'border-top: 1px solid var(--border); transition: background 0.2s;' });
      
      const isSold = op.sellSide && op.sellSide.status === 'SOLD';
      const seller = contacts.find(c => c.id === op.buySide?.contactId)?.name || op.buySide?.contactId || 'Desconocido';
      const buyer = contacts.find(c => c.id === op.sellSide?.contactId)?.name || op.sellSide?.contactId || '-';

      const cbCell = selectable ? `<td style="padding: 1rem; width: 40px;"><input type="checkbox" class="portfolio-check-cb" data-id="${op.id}" style="width:18px;height:18px;cursor:pointer;"></td>` : '';
      
      tr.innerHTML = `
        ${cbCell}
        <td style="padding: 1rem;">
          <div style="font-weight: 600;">${op.bank || 'S/B'}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">#${op.checkNumber || 'S/N'}</div>
          ${op.issuerName ? `<div style="font-size: 0.75rem; color: var(--primary); margin-top: 0.25rem;">👤 ${op.issuerName}</div>` : ''}
        </td>
        <td style="padding: 1rem;">
          <div style="font-weight: 500; color: var(--primary);">💳 ${formatDateLocal(op.dueDate)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Venc: ${formatDateLocal(addDays(op.dueDate, 30))}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${op.days} días</div>
        </td>
        <td style="padding: 1rem; font-weight: 600;">${formatCurrency(op.nominalValue)}</td>
        <td style="padding: 1rem;">
          <div style="font-size: 0.85rem;"><span style="color: var(--primary); font-weight: 600;">De:</span> ${seller}</div>
          <div style="font-size: 0.85rem;"><span style="color: var(--success); font-weight: 600;">A:</span> ${isSold ? buyer : '(Sin Venta Activa)'}</div>
          ${op.sellSide?.status === 'BACK' && op.sellSide?.backReason ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; font-style: italic;">📝 ${op.sellSide.backReason}</div>` : ''}
          <div style="margin-top: 0.5rem;">${getCheckStatusBadge(op)}</div>
        </td>
        <td style="padding: 1rem; font-weight: 600;">
          ${(() => {
            if (isSold) {
              // Realized profit on sold check
              return `<span style="color:var(--success);">${formatCurrency(op.profit)}</span>`;
            }
            const nominal = parseFloat(op.nominalValue) || 0;
            const netPaid  = parseFloat(op.buySide?.netAmount);
            if (!isNaN(netPaid) && nominal > 0) {
              const disc = nominal - netPaid;
              const pct  = ((disc / nominal) * 100).toFixed(2);
              return `<span style="color:var(--success);">${formatCurrency(disc)}</span><div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.1rem;">${pct}% desc.</div>`;
            }
            return '<span style="color:var(--text-muted);">-</span>';
          })()}
        </td>
        <td style="padding: 1rem; text-align: right; white-space: nowrap;">
          <button class="icon-btn edit-btn" title="Editar">✏️</button>
          <button class="icon-btn delete-btn" style="color: var(--danger);" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="pointer-events:none;"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg>
          </button>
        </td>
      `;
      
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.edit-btn')) { showOperationModal(op, contacts, contacts, onSave); return; }
        if (e.target.closest('.delete-btn')) { onDelete(op.id); return; }
        if (e.target.closest('.portfolio-check-cb')) return; // handled by change
      });

      if (selectable && selectedIds !== null) {
        const cb = tr.querySelector('.portfolio-check-cb');
        if (cb) {
          if (selectedIds.has(op.id)) cb.checked = true;
          cb.addEventListener('change', () => {
            if (cb.checked) selectedIds.add(op.id); else selectedIds.delete(op.id);
            if (onSelectionChange) onSelectionChange();
          });
        }
      }

      if (op.notes && op.notes.trim()) {
        tr.title = `Observaciones: ${op.notes.trim()}`;
        const firstCell = tr.querySelector('td:nth-child(' + (selectable ? '2' : '1') + ')');
        if (firstCell) {
          firstCell.innerHTML += `<div style="display:inline-block; margin-left:0.5rem; color:var(--primary); font-size:0.8rem;" title="Tiene observaciones">📝</div>`;
        }
      }
      
      tbody.appendChild(tr);
    });

    if (selectable) {
      const allCb = table.querySelector('#check-all-cb');
      if (allCb) {
        allCb.addEventListener('change', () => {
          table.querySelectorAll('.portfolio-check-cb').forEach(cb => {
            cb.checked = allCb.checked;
            const id = cb.dataset.id;
            if (allCb.checked) selectedIds.add(id); else selectedIds.delete(id);
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

function createStatCard(label, value, color) {
  const card = el('div', { 
    classes: ['glass-card'], 
    style: `padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; border-left: 4px solid ${color};` 
  });
  card.appendChild(el('div', { text: label, style: 'font-size: 0.85rem; color: var(--text-muted); font-weight: 500;' }));
  card.appendChild(el('div', { text: value, style: 'font-size: 1.5rem; font-weight: 700;' }));
  return card;
}

function getSelectStyle(accentColor, bgHex) {
  const isDark = document.body.classList.contains('dark');
  const bg = isDark ? '#1e1e1e' : '#ffffff';
  const fg = isDark ? '#ffffff' : '#1a1a1a';
  return `border: 1.5px solid ${accentColor}; background-color: ${bg}; color: ${fg}; border-radius: 10px; color-scheme: ${isDark ? 'dark' : 'light'};`;
}

function showOperationModal(existingOp, contacts, buyContacts, onSave) {
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
      buySide: {
        contactId: buySideContactId,
        pesificacionRate: formData.get('buySide_pesificacionRate'),
        monthlyInterest: formData.get('buySide_monthlyInterest')
      },
      sellSide: existingOp?.sellSide || {
        status: 'PENDING',
        contactId: null,
        pesificacionRate: '',
        monthlyInterest: '',
        backReason: ''
      }
    };
    onSave(data);
    modal.remove();
  };

  const closeModal = () => modal.remove();
  content.querySelector('.btn-cancel').onclick = closeModal;
  content.querySelector('.btn-close-modal').onclick = closeModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}


function formatCurrency(val) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-AR');
}

function formatDateLocal(dateStr) {
  if (!dateStr) return '-';
  if (dateStr instanceof Date) return dateStr.toLocaleDateString('es-AR');
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-AR');
  }
  return new Date(dateStr).toLocaleDateString('es-AR');
}

function addDays(dateStr, days) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('T')[0].split('-');
  let d;
  if (parts.length === 3) {
    const [y, m, day] = parts.map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(dateStr);
  }
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function showBatchBuyModal(buyContacts, onBatchBuy) {
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
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;align-items:end;padding-top:0.15rem;border-top:1px solid rgba(255,255,255,0.06);">
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
function showBatchSellModal(contacts, checkIds, onBatchSell, onDone) {
  const modal = el('div', {
    classes: ['modal-overlay'],
    style: 'position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;z-index:2000;padding:clamp(0.5rem,3vw,2rem);'
  });

  const content = el('div', {
    classes: ['glass-card'],
    style: 'width:100%;max-width:700px;padding:0;overflow:hidden;border-radius:20px;'
  });

  content.innerHTML = `
    <div style="background:var(--card-bg);border-bottom:1px solid var(--border);padding:1.25rem 2rem;display:flex;align-items:center;justify-content:space-between;border-radius:20px 20px 0 0;">
      <h2 style="margin:0;font-size:1.2rem;font-weight:700;">📤 Venta de ${checkIds.length} Cheque${checkIds.length > 1 ? 's' : ''}</h2>
      <button type="button" class="btn-close-modal" style="background:rgba(255,255,255,0.08);border:1px solid var(--border);color:var(--text-main);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>
    <div style="padding:1.5rem 2rem;">
      <p style="margin:0 0 1.25rem;color:var(--text-muted);font-size:0.9rem;">Los datos de venta se aplicarán a los <strong>${checkIds.length}</strong> cheque(s) seleccionados.</p>

      <div style="display:grid;grid-template-columns:1fr;gap:1rem;">
        <div class="form-group" style="margin:0;">
          <label>Comprador / Destinatario</label>
          <input type="text" id="bsell-buyer-input" list="bsell-contacts-dl" placeholder="🔎 Buscar..." autocomplete="off">
          <datalist id="bsell-contacts-dl">
            ${contacts.map(c => `<option value="${c.name}"></option>`).join('')}
          </datalist>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
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

      <div style="display:flex;justify-content:flex-end;gap:1rem;margin-top:1.75rem;flex-wrap:wrap;">
        <button type="button" class="btn-cancel" style="padding:0.85rem 2rem;border-radius:12px;background:rgba(255,255,255,0.06);color:var(--text-main);font-size:1rem;font-weight:600;border:1px solid var(--outline);cursor:pointer;">Cancelar</button>
        <button type="button" id="bsell-save-btn" style="padding:0.85rem 2.5rem;border-radius:12px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:1rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 15px rgba(16,185,129,0.4);">Aplicar Venta</button>
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
    onBatchSell(sellData, checkIds);
    if (onDone) onDone();
    modal.remove();
  };

  const closeModal = () => modal.remove();
  content.querySelector('.btn-cancel').onclick = closeModal;
  content.querySelector('.btn-close-modal').onclick = closeModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}
