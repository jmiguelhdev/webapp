/**
 * @file ChecksUI.js
 * @description Capa de presentación (Screen) para el módulo de Cheques.
 * Se encarga únicamente del renderizado de la interfaz en el DOM y de delegar
 * los eventos e interacciones del usuario hacia el presentador y los componentes de modales.
 * Cumple con Clean Architecture y SOLID al no contener lógica de cálculo financiero.
 */

import { el } from '../../utils/dom.js';
import { renderDateModal } from '../components/Modals.js';
import { showOperationModal, showBatchBuyModal, showBatchSellModal } from '../components/ChecksModals.js';
import { formatCurrency, formatDateLocal, addDays, getSortDate, parseDateLocal } from '../../utils/formatters.js';

/**
 * Renderiza la interfaz principal del módulo de gestión de cheques.
 * 
 * Orquesta la inserción en el DOM del encabezado, las tarjetas estadísticas generales,
 * el banner de advertencia sobre cheques próximos a vencer, la barra de filtros y
 * las tablas de cheques en cartera y el historial de operaciones.
 *
 * @param {HTMLElement} container - El elemento contenedor del DOM donde se dibujará la interfaz.
 * @param {Object} options - Parámetros y callbacks provistos por el presentador.
 * @param {Array<Check>} options.checks - Lista de todas las entidades de cheque cargadas.
 * @param {Array<Check>} options.filteredChecks - Lista filtrada de entidades de cheque a mostrar.
 * @param {Object} options.globalSummary - Resumen de estadísticas financieras globales de la aplicación.
 * @param {Object} options.filteredSummary - Resumen de estadísticas financieras para el subconjunto filtrado.
 * @param {Object} options.filters - Estado actual de los filtros activos (búsqueda, fechas).
 * @param {Array<Object>} options.contacts - Colección de contactos/clientes del sistema.
 * @param {Object} options.pagination - Objeto de control de paginación para cartera e historial.
 * @param {Function} options.onFilterChange - Callback disparado al actualizar algún filtro.
 * @param {Function} options.onSave - Callback para guardar una operación nueva o editada.
 * @param {Function} options.onDelete - Callback para eliminar un cheque.
 * @param {Function} options.onPrint - Callback para imprimir un listado de cheques.
 * @param {Function} options.onExport - Callback para exportar los cheques a formato Excel.
 * @param {Function} options.onBatchBuy - Callback para procesar compras masivas de cheques.
 * @param {Function} options.onBatchSell - Callback para procesar ventas masivas de cheques.
 * @param {Function} options.onPortfolioPageChange - Callback al cambiar la página de cheques en cartera.
 * @param {Function} options.onHistoryPageChange - Callback al cambiar la página del historial.
 */
export function renderChecks(container, options) {
  const { checks, filteredChecks, globalSummary, filteredSummary, filters, contacts, pagination, onFilterChange, onSave, onDelete, onRefresh, onExport, onPrint, onBatchBuy, onBatchSell, onPortfolioPageChange, onHistoryPageChange } = options;
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

  const { totalProfit, totalPortfolioDiscount, totalInPortfolio, portfolioChecksCount, expiringChecks } = globalSummary;

  const statsGrid = el('div', { 
    classes: ['stats-grid'],
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;'
  });

  statsGrid.appendChild(createStatCard('Ganancia Vendida', formatCurrency(totalProfit), 'var(--success)'));
  statsGrid.appendChild(createStatCard('Desc. en Cartera', formatCurrency(totalPortfolioDiscount), 'var(--success)'));
  statsGrid.appendChild(createStatCard('Capital en Cartera', formatCurrency(totalInPortfolio), 'var(--primary)'));
  statsGrid.appendChild(createStatCard('Cheques en Cartera', portfolioChecksCount, 'var(--primary)'));

  container.appendChild(statsGrid);

  // ── Warning banner: checks PRÓXIMO A VENCER ──
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

  // Split sections using precalculated lists from filteredSummary
  const currentPortfolio = filteredSummary.portfolioChecks;
  const currentHistory = filteredSummary.historyChecks;

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


  /**
   * Helper interno para generar de manera estandarizada y accesible campos de entrada de fecha.
   *
   * @param {string} labelText - Etiqueta descriptiva para el campo de fecha.
   * @param {string} isoValue - Valor ISO inicial de la fecha ('YYYY-MM-DD').
   * @returns {Object} Objeto con las referencias generadas al contenedor y al input.
   * @property {HTMLElement} group - El elemento contenedor del formulario del campo de fecha.
   * @property {HTMLInputElement} input - El elemento de entrada de tipo date nativo.
   */
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
  
  const totalPortfolioFiltered = filteredSummary.totalInPortfolio;
  const totalHistoryFiltered = currentHistory.reduce((acc, c) => acc + c.nominalValue, 0);
  
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

/**
 * Crea y retorna el componente visual de controles de paginación para las tablas.
 *
 * @param {number} currentPage - Índice de la página que se encuentra activa (1-indexed).
 * @param {number} totalPages - Cantidad total de páginas disponibles basadas en los límites.
 * @param {number} totalItems - Cantidad total de registros/cheques disponibles para paginar.
 * @param {Function} onPageChange - Callback disparado al presionar las acciones de navegación de página.
 * @returns {HTMLElement} El elemento contenedor HTML de los controles de paginación.
 */
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

/**
 * Determina y construye el marcado HTML correspondiente al indicador/badge de estado del cheque.
 * 
 * Consume el estado de alertas de la entidad de dominio `Check` para visualizar
 * los estados `VENDIDO`, `DEVUELTO`, `RECHAZADO`, `VOLVIÓ`, `VENCIDO`, `PRÓXIMO A VENCER`,
 * `DISPONIBLE`, `PAGO EN Xd` y `EN CARTERA` sin realizar ningún tipo de cálculo local.
 *
 * @param {Check} op - La entidad de cheque de dominio a evaluar.
 * @returns {string} Código de marcado HTML que representa visualmente el estado del cheque.
 */
function getCheckStatusBadge(op) {
  const alertState = op.getAlertState();
  let badgeHtml = '';
  
  if (alertState.status === 'SOLD') badgeHtml += '<span class="status-badge badge-success">VENDIDO</span>';
  else if (alertState.status === 'RETURNED') badgeHtml += '<span class="status-badge badge-warning">DEVUELTO</span>';
  else if (alertState.status === 'REJECTED') badgeHtml += '<span class="status-badge badge-danger">RECHAZADO</span>';
  else if (alertState.status === 'BACK') badgeHtml += '<span class="status-badge badge-back">VOLVIÓ - Contactar Vendedor</span>';
  
  if (alertState.code === 'EXPIRED') {
    badgeHtml += ' <span class="status-badge badge-danger">⛔ VENCIDO</span>';
  } else if (alertState.code === 'EXPIRING_URGENT') {
    badgeHtml += ' <span class="status-badge" style="background:rgba(249,115,22,0.18);color:#f97316;border:1px solid rgba(249,115,22,0.4);font-weight:700;">⏳ PRÓXIMO A VENCER</span>';
  } else if (alertState.code === 'AVAILABLE') {
    badgeHtml += ' <span class="status-badge badge-disponible">✅ DISPONIBLE</span>';
  } else if (alertState.code === 'UPCOMING_PAYMENT') {
    badgeHtml += ` <span class="status-badge" style="background:rgba(234,179,8,0.15);color:#eab308;border:1px solid rgba(234,179,8,0.35);">🔔 PAGO EN ${alertState.days}d</span>`;
  }

  return badgeHtml || '<span class="status-badge badge-pending">EN CARTERA</span>';
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

      // Días de gracia restantes calculados según circular del BCRA, delegados a la entidad del dominio
      // para evitar discrepancias por desfases de la zona horaria en el lado del cliente.
      const _daysToVenc = op.getDaysToExpiry();
      const _daysColor = _daysToVenc < 0 ? 'var(--danger)'
        : _daysToVenc <= 10 ? '#f97316'
        : 'var(--text-muted)';
      const _daysLabel = _daysToVenc < 0 ? `Venc. hace ${Math.abs(_daysToVenc)}d`
        : `${_daysToVenc}d al vencimiento`;

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
          ${_daysLabel ? `<div style="font-size: 0.75rem; color: ${_daysColor}; font-weight: 600;">${_daysLabel}</div>` : ''}
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
              return `<span style="color:var(--success);">${formatCurrency(op.profit)}</span>`;
            }
            if (op.purchaseDiscount > 0) {
              return `<span style="color:var(--success);">${formatCurrency(op.purchaseDiscount)}</span><div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.1rem;">${op.purchaseDiscountPercentage.toFixed(2)}% desc.</div>`;
            }
            return '<span style="color:var(--text-muted);">-</span>';
          })()}
        </td>
        <td style="padding: 1rem; text-align: right; white-space: nowrap;">
          <button class="icon-btn edit-btn" title="Editar">✏️</button>
          ${op.issuerCuit ? `<button class="icon-btn bcra-list-btn" title="Consultar BCRA: ${op.issuerCuit}" style="background:rgba(37,99,235,0.15);border:1px solid rgba(37,99,235,0.4);color:#3b82f6;border-radius:7px;padding:0.35rem 0.55rem;font-size:0.75rem;font-weight:700;cursor:pointer;margin-left:0.25rem;">🔍 BCRA</button>` : ''}
          <button class="icon-btn delete-btn" style="color: var(--danger);" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="pointer-events:none;"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg>
          </button>
        </td>
      `;
      
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.edit-btn')) { showOperationModal(op, contacts, contacts, onSave); return; }
        if (e.target.closest('.delete-btn')) { onDelete(op.id); return; }
        if (e.target.closest('.bcra-list-btn')) {
          const cuit = (op.issuerCuit || '').replace(/\D/g, '');
          if (!cuit || cuit.length < 11) { alert('CUIT no válido para consultar.'); return; }
          navigator.clipboard.writeText(cuit).then(() => {
            alert(`CUIT ${cuit} copiado al portapapeles.\n\nSe abrirá la web del BCRA. Pegá el CUIT allí para consultar.`);
            window.open('https://www.bcra.gob.ar/situacion-crediticia/', '_blank');
          }).catch(() => window.open('https://www.bcra.gob.ar/situacion-crediticia/', '_blank'));
          return;
        }
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

/**
 * Helper utilitario para crear tarjetas visuales de métricas financieras.
 *
 * @param {string} label - Título o etiqueta descriptiva del indicador financiero.
 * @param {string|number} value - Valor monetario o numérico formateado de la métrica.
 * @param {string} color - Código de color o variable CSS para el borde indicativo de la tarjeta.
 * @returns {HTMLElement} El contenedor div ('glass-card') de la tarjeta estadística.
 */
function createStatCard(label, value, color) {
  const card = el('div', { 
    classes: ['glass-card'], 
    style: `padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; border-left: 4px solid ${color};` 
  });
  card.appendChild(el('div', { text: label, style: 'font-size: 0.85rem; color: var(--text-muted); font-weight: 500;' }));
  card.appendChild(el('div', { text: value, style: 'font-size: 1.5rem; font-weight: 700;' }));
  return card;
}

