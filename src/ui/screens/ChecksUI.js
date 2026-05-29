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
 * @param {Function} options.onUndoSale - Callback para revertir una venta de cheque.
 */
export function renderChecks(container, options) {
  const { 
    checks = [], filteredChecks = [], globalSummary = {}, filteredSummary = {}, 
    filters = {}, contacts = [], pagination = {}, 
    onFilterChange, onSave, onDelete, onRefresh, onExport, onPrint, onBatchBuy, onBatchSell, 
    onPortfolioPageChange, onHistoryPageChange, onUndoSale
  } = options;

  container._options = options;

  // Retain cursor focus position for smooth real-time filter searches
  const activeId = document.activeElement ? document.activeElement.id : null;
  const selectionStart = document.activeElement ? document.activeElement.selectionStart : null;
  const selectionEnd = document.activeElement ? document.activeElement.selectionEnd : null;

  const isFirstRender = !container.querySelector('#portfolio-table-wrapper');

  if (isFirstRender) {
    container.innerHTML = '';

    // --- 0. HEADER PANEL ---
    const header = el('div', { 
      classes: ['dashboard-header', 'glass-card'],
      style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 1.5rem 2rem; border-radius: 20px; gap: 1rem; flex-wrap: wrap;'
    });

    const titleGroup = el('div', { style: 'display: flex; align-items: center; gap: 1rem;' });
    const backBtn = el('button', { 
      classes: ['back-btn-m3'],
      html: '<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>',
      attrs: { title: 'Volver al Dashboard' }
    });
    backBtn.onclick = () => window.dispatchEvent(new CustomEvent('nav:dashboard'));
    
    titleGroup.appendChild(backBtn);
    
    const textInfo = el('div', { style: 'display: flex; flex-direction: column;' });
    textInfo.appendChild(el('h1', { text: 'Gestión de Cheques', style: 'margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--text-main);' }));
    textInfo.appendChild(el('p', { text: 'Control de cartera, negociación de tasas y registro de operaciones.', style: 'margin: 0.25rem 0 0 0; font-size: 0.82rem; color: var(--text-muted); font-weight: 500;' }));
    titleGroup.appendChild(textInfo);
    header.appendChild(titleGroup);

    const actionGroup = el('div', { style: 'display: flex; gap: 0.75rem; flex-wrap: wrap;' });

    const exportBtn = el('button', {
      classes: ['btn-secondary'],
      style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.65rem 1.15rem; font-size: 0.88rem; font-weight: 600;',
      html: '<span>📥 Exportar Excel</span>'
    });
    exportBtn.onclick = () => {
      if (container._options && typeof container._options.onExport === 'function') {
        renderDateModal({
          title: 'Exportar Reporte de Cheques',
          description: 'Selecciona el rango de fechas de recepción o pago a incluir en el Excel.',
          submitText: 'Descargar Excel',
          onSubmit: container._options.onExport
        });
      }
    };

    const batchBuyBtn = el('button', {
      style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.65rem 1.15rem; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.35); color: #818cf8; cursor: pointer; font-weight: 600; font-size: 0.88rem; transition: all 0.2s ease;',
      html: '<svg viewBox="0 0 24 24" width="16" height="16" style="fill:currentColor;flex-shrink:0;"><path d="M17,12H14V8H10V12H7L12,17L17,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg> Compra Masiva'
    });
    batchBuyBtn.onclick = () => {
      if (container._options) {
        showBatchBuyModal(container._options.buyContacts, container._options.onBatchBuy);
      }
    };
    batchBuyBtn.addEventListener('mouseenter', () => {
      batchBuyBtn.style.background = 'rgba(99, 102, 241, 0.2)';
      batchBuyBtn.style.borderColor = 'rgba(99, 102, 241, 0.5)';
    });
    batchBuyBtn.addEventListener('mouseleave', () => {
      batchBuyBtn.style.background = 'rgba(99, 102, 241, 0.12)';
      batchBuyBtn.style.borderColor = 'rgba(99, 102, 241, 0.35)';
    });

    const addBtn = el('button', { 
      classes: ['btn-nueva-operacion'],
      style: 'margin: 0; padding: 0.65rem 1.15rem; font-size: 0.88rem; display: flex; align-items: center; gap: 0.5rem;',
      html: '<svg viewBox="0 0 24 24" width="16" height="16" style="fill:currentColor;flex-shrink:0;"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg> Nueva Operación'
    });
    addBtn.onclick = () => {
      if (container._options) {
        showOperationModal(null, container._options.contacts, container._options.buyContacts, container._options.onSave);
      }
    };
    
    actionGroup.appendChild(exportBtn);
    actionGroup.appendChild(batchBuyBtn);
    actionGroup.appendChild(addBtn);
    header.appendChild(actionGroup);
    container.appendChild(header);

    // --- 1. KPI STATISTICS BOARD ---
    const statsGrid = el('div', { 
      classes: ['stats-grid'],
      attrs: { id: 'checks-stats-grid' },
      style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;'
    });
    statsGrid.appendChild(createStatCard('Ganancia Vendida', '...', '#10b981', '📈'));
    statsGrid.appendChild(createStatCard('Desc. en Cartera', '...', '#fbbf24', '📉'));
    statsGrid.appendChild(createStatCard('Capital en Cartera', '...', '#3b82f6', '💰'));
    statsGrid.appendChild(createStatCard('Cheques en Cartera', '... uds.', 'var(--primary)', '📂'));
    container.appendChild(statsGrid);

    // --- 2. EXPIRING ALERT WARNING BANNER WRAPPER ---
    const expiringAlertWrapper = el('div', { attrs: { id: 'expiring-alert-wrapper' } });
    container.appendChild(expiringAlertWrapper);

    // --- 3. SEARCH & DATE FILTER BAR ---
    const filtersBar = el('div', { 
      classes: ['glass-card'], 
      style: 'margin-bottom: 2rem; padding: 1.5rem; border-radius: 20px; display: flex; flex-direction: column; gap: 1.25rem;' 
    });

    const filtersGrid = el('div', {
      style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; align-items: end;'
    });

    const searchGroup = el('div', { classes: ['form-group'], style: 'margin-bottom: 0;' });
    searchGroup.appendChild(el('label', { 
      text: '🔍 Buscar Banco, Número, Librador o Contacto',
      style: 'font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem; display: block;'
    }));

    const searchDatalist = el('datalist', { attrs: { id: 'checks-search-dl' } });
    searchGroup.appendChild(searchDatalist);

    const searchInput = el('input', {
      attrs: { 
        id: 'checks-search-input',
        type: 'text', 
        list: 'checks-search-dl', 
        placeholder: 'Escribí banco, número, librador, contacto...', 
        value: filters?.searchTerm || '', 
        autocomplete: 'off' 
      },
      style: 'width: 100%; padding: 0.55rem 0.85rem; border-radius: 10px; border: 1px solid var(--border); background: rgba(0,0,0,0.15); color: var(--text-main); font-weight: 600;'
    });
    
    let _searchDebounce = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(_searchDebounce);
      _searchDebounce = setTimeout(() => {
        if (container._options && typeof container._options.onFilterChange === 'function') {
          container._options.onFilterChange({ searchTerm: e.target.value });
        }
      }, 400);
    });
    searchGroup.appendChild(searchInput);

    function makeDateField(labelText, isoValue, inputId) {
      const group = el('div', { classes: ['form-group'], style: 'margin-bottom: 0;' });
      group.appendChild(el('label', { 
        text: labelText,
        style: 'font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem; display: block;'
      }));

      const wrapper = el('div', { style: 'display: flex; gap: 0.4rem; align-items: center;' });

      const dateInput = el('input', {
        attrs: { id: inputId, type: 'date', value: isoValue || '' },
        style: 'flex: 1; min-width: 0; padding: 0.55rem 0.85rem; border-radius: 10px; border: 1px solid var(--border); background: rgba(0,0,0,0.15); color: var(--text-main); font-weight: 600;'
      });

      const calBtn = el('button', {
        attrs: { type: 'button', title: 'Abrir calendario' },
        style: 'flex-shrink: 0; padding: 0 0.75rem; height: 38px; border-radius: 10px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.35); color: var(--primary); cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; transition: all 0.2s ease;',
        text: '📅'
      });
      calBtn.onclick = () => { if (dateInput.showPicker) dateInput.showPicker(); else dateInput.click(); };
      calBtn.addEventListener('mouseenter', () => { calBtn.style.transform = 'scale(1.05)'; calBtn.style.background = 'rgba(99,102,241,0.25)'; });
      calBtn.addEventListener('mouseleave', () => { calBtn.style.transform = 'scale(1)'; calBtn.style.background = 'rgba(99,102,241,0.15)'; });

      wrapper.appendChild(dateInput);
      wrapper.appendChild(calBtn);
      group.appendChild(wrapper);
      return { group, input: dateInput };
    }

    const dateTypeGroup = el('div', { classes: ['form-group'], style: 'margin-bottom: 0;' });
    dateTypeGroup.appendChild(el('label', { 
      text: 'Tipo de Fecha',
      style: 'font-size: 0.76rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem; display: block;'
    }));
    const dateTypeSelect = el('select', { 
      attrs: { id: 'checks-date-type' },
      style: 'width: 100%; height: 38px; padding: 0 0.85rem; border-radius: 10px; background: rgba(0,0,0,0.15); border: 1px solid var(--border); color: var(--text-main); outline: none; font-family: inherit; font-weight: 600;' 
    });
    dateTypeSelect.innerHTML = `
      <option value="DUE" ${filters?.dateFilterType === 'DUE' ? 'selected' : ''}>Fecha de Pago</option>
      <option value="RECEPTION" ${filters?.dateFilterType === 'RECEPTION' ? 'selected' : ''}>Fecha de Recepción</option>
    `;
    dateTypeGroup.appendChild(dateTypeSelect);

    const startField = makeDateField('Desde', filters?.startDate || '', 'checks-start-date');
    const endField   = makeDateField('Hasta',  filters?.endDate  || '', 'checks-end-date');

    const applyBtnGroup = el('div', { style: 'display: flex; gap: 0.5rem; align-items: flex-end; padding-bottom: 2px;' });
    
    const applyBtn = el('button', {
      style: 'height: 38px; border-radius: 10px; padding: 0 1.25rem; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; background: var(--primary); color: var(--on-primary); border: none; flex-shrink: 0; cursor: pointer; transition: all 0.2s ease;',
      text: 'Aplicar'
    });
    applyBtn.onclick = () => {
      if (container._options && typeof container._options.onFilterChange === 'function') {
        container._options.onFilterChange({ 
          startDate: startField.input.value || '', 
          endDate: endField.input.value || '',
          dateFilterType: dateTypeSelect.value
        });
      }
    };
    applyBtn.addEventListener('mouseenter', () => { applyBtn.style.filter = 'brightness(1.15)'; });
    applyBtn.addEventListener('mouseleave', () => { applyBtn.style.filter = 'none'; });

    const clearBtn = el('button', {
      classes: ['btn-secondary'],
      style: 'height: 38px; border-radius: 10px; padding: 0 0.85rem; font-weight: 700; display: flex; align-items: center; justify-content: center;',
      attrs: { title: 'Limpiar fechas' },
      text: '✕'
    });
    clearBtn.onclick = () => {
      if (container._options && typeof container._options.onFilterChange === 'function') {
        container._options.onFilterChange({ startDate: '', endDate: '' });
      }
    };

    applyBtnGroup.appendChild(applyBtn);
    applyBtnGroup.appendChild(clearBtn);

    const nominalToggleGroup = el('div', { 
      classes: ['form-group'], 
      style: 'margin-bottom: 0; display: flex; align-items: center; gap: 0.6rem; height: 38px; cursor: pointer; user-select: none;' 
    });
    const nominalCb = el('input', {
      attrs: { type: 'checkbox', id: 'filter-only-nominal' },
      style: 'width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary);'
    });
    const nominalLabel = el('label', {
      attrs: { for: 'filter-only-nominal' },
      text: '🔍 Solo Total Nominal',
      style: 'font-size: 0.8rem; font-weight: 700; color: var(--text-muted); cursor: pointer; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;'
    });
    
    nominalToggleGroup.appendChild(nominalCb);
    nominalToggleGroup.appendChild(nominalLabel);

    nominalCb.addEventListener('change', () => {
      if (container._options && typeof container._options.onFilterChange === 'function') {
        container._options.onFilterChange({ onlyNominal: nominalCb.checked });
      }
    });

    filtersGrid.appendChild(searchGroup);
    filtersGrid.appendChild(dateTypeGroup);
    filtersGrid.appendChild(startField.group);
    filtersGrid.appendChild(endField.group);
    filtersGrid.appendChild(nominalToggleGroup);
    filtersGrid.appendChild(applyBtnGroup);
    filtersBar.appendChild(filtersGrid);

    const filterCountBarWrapper = el('div', {
      attrs: { id: 'filter-count-bar-wrapper' },
      style: 'padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between;'
    });
    filtersBar.appendChild(filterCountBarWrapper);
    container.appendChild(filtersBar);

    // --- 4. PORTFOLIO CARTERA HEADER ---
    const portfolioHeader = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.15rem; flex-wrap: wrap; gap: 1rem;' });
    
    const portTitleNode = el('div', { style: 'display: flex; align-items: center; gap: 0.65rem;' });
    portTitleNode.innerHTML = `
      <span style="font-size: 1.2rem;">📂</span>
      <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Cheques en Cartera</h2>
    `;
    portfolioHeader.appendChild(portTitleNode);
    
    const portfolioActions = el('div', { style: 'display: flex; gap: 0.5rem; align-items: center;' });
    
    const sortBtn = el('button', {
      attrs: { id: 'portfolio-sort-btn' },
      classes: ['btn-secondary'],
      style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600;',
      html: `<span>⬆️ Más próximos</span>`
    });
    sortBtn.onclick = () => {
      if (container._options && typeof container._options.onFilterChange === 'function') {
        const currentIsAsc = container._options.filters?.sortPortfolioAsc !== false;
        container._options.onFilterChange({ sortPortfolioAsc: !currentIsAsc });
      }
    };
    
    const printPortfolioBtn = el('button', {
      classes: ['btn-secondary'],
      style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600;',
      html: '<span>🖨️ Imprimir</span>'
    });
    printPortfolioBtn.onclick = () => {
      if (container._options && typeof container._options.onPrint === 'function') {
        const sortedP = container._sortedPortfolioCached || [];
        container._options.onPrint(sortedP);
      }
    };
    
    portfolioActions.appendChild(sortBtn);
    portfolioActions.appendChild(printPortfolioBtn);
    portfolioHeader.appendChild(portfolioActions);
    container.appendChild(portfolioHeader);

    // --- 5. BATCH-SELL OVERLAY FLOATING BAR ---
    const batchSellBar = el('div', {
      attrs: { id: 'batch-sell-bar-wrapper' },
      classes: ['glass-card'],
      style: 'display: none; align-items: center; gap: 1.25rem; margin-bottom: 1.25rem; padding: 0.95rem 1.5rem; background: rgba(16, 185, 129, 0.05); border: 1.5px solid rgba(16, 185, 129, 0.4); border-radius: 16px; flex-wrap: wrap; animation: slideIn 0.2s ease;'
    });
    const batchSellLabel = el('span', { text: '0 cheques seleccionados', style: 'font-weight: 750; font-size: 0.88rem; flex: 1; color: #34d399;' });
    
    const clearSelBtn = el('button', {
      classes: ['btn-secondary'],
      style: 'border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 700;',
      text: 'Limpiar selección'
    });

    const printSelBtn = el('button', {
      classes: ['btn-secondary'],
      style: 'border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 700; display: flex; align-items: center; gap: 0.3rem;',
      html: '🖨️ Imprimir Selección'
    });
    
    const batchSellBtn = el('button', {
      classes: ['btn-nueva-operacion'],
      style: 'margin: 0; padding: 0.5rem 1.25rem; font-size: 0.82rem; font-weight: 700; background: linear-gradient(135deg, #10b981, #059669); border: none; box-shadow: 0 4px 12px rgba(16,185,129,0.3); display: flex; align-items: center; gap: 0.4rem;',
      html: '📤 Vender Selección'
    });
    
    batchSellBar.appendChild(batchSellLabel);
    batchSellBar.appendChild(clearSelBtn);
    batchSellBar.appendChild(printSelBtn);
    batchSellBar.appendChild(batchSellBtn);
    container.appendChild(batchSellBar);

    printSelBtn.onclick = () => {
      const selectedIds = container._selectedChecksIds;
      if (!selectedIds || selectedIds.size === 0) return;
      if (container._options && typeof container._options.onPrint === 'function') {
        const allChecks = container._options.checks || [];
        const selectedChecks = Array.from(selectedIds).map(id => allChecks.find(c => String(c.id) === String(id))).filter(Boolean);
        container._options.onPrint(selectedChecks, 'Reporte de Cheques Seleccionados');
      }
    };

    clearSelBtn.onclick = () => {
      const selectedIds = container._selectedChecksIds;
      if (selectedIds) selectedIds.clear();
      container.querySelectorAll('.portfolio-check-cb').forEach(cb => { cb.checked = false; });
      const allCb = container.querySelector('#check-all-cb');
      if (allCb) allCb.checked = false;
      if (container._updateBatchBarFn) container._updateBatchBarFn();
    };

    batchSellBtn.onclick = () => {
      const selectedIds = container._selectedChecksIds;
      if (!selectedIds || selectedIds.size === 0) return;
      if (container._options) {
        const allChecks = container._options.checks || [];
        const selectedChecks = Array.from(selectedIds).map(id => allChecks.find(c => String(c.id) === String(id))).filter(Boolean);
        showBatchSellModal(container._options.contacts, selectedChecks, container._options.onBatchSell, () => {
          selectedIds.clear();
          if (container._updateBatchBarFn) container._updateBatchBarFn();
        }, container._options.filters?.onlyNominal);
      }
    };

    // --- 6. PORTFOLIO WRAPPERS ---
    const portfolioTableWrapper = el('div', { attrs: { id: 'portfolio-table-wrapper' } });
    const portfolioPaginationWrapper = el('div', { attrs: { id: 'portfolio-pagination-wrapper' } });
    container.appendChild(portfolioTableWrapper);
    container.appendChild(portfolioPaginationWrapper);

    // --- 7. HISTORY HEADER ---
    const historyHeader = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-top: 3rem; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 1rem;' });
    
    const histTitleNode = el('div', { style: 'display: flex; align-items: center; gap: 0.65rem;' });
    histTitleNode.innerHTML = `
      <span style="font-size: 1.2rem;">📜</span>
      <h2 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Operaciones Realizadas</h2>
    `;
    historyHeader.appendChild(histTitleNode);

    const printHistoryBtn = el('button', {
      attrs: { id: 'history-print-btn' },
      classes: ['btn-secondary'],
      style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 600;',
      html: '<span>🖨️ Imprimir</span>'
    });
    printHistoryBtn.onclick = () => {
      if (container._options && typeof container._options.onPrint === 'function') {
        const sortedH = container._sortedHistoryCached || [];
        container._options.onPrint(sortedH);
      }
    };
    historyHeader.appendChild(printHistoryBtn);
    container.appendChild(historyHeader);

    const selectorsRow = el('div', {
      style: 'display: flex; gap: 1rem; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 1.5rem;'
    });

    const tabContainer = el('div', {
      style: 'display: flex; gap: 0.5rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 0.25rem; border-radius: 12px; width: fit-content;'
    });
    
    const listTabBtn = el('button', {
      attrs: { id: 'history-tab-list' },
      style: 'padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;',
      text: '📋 Listado General'
    });
    
    const groupedTabBtn = el('button', {
      attrs: { id: 'history-tab-grouped' },
      style: 'padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;',
      text: '📦 Agrupado por Operación'
    });
    
    tabContainer.appendChild(listTabBtn);
    tabContainer.appendChild(groupedTabBtn);
    selectorsRow.appendChild(tabContainer);

    const statusFilterContainer = el('div', {
      style: 'display: flex; gap: 0.5rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 0.25rem; border-radius: 12px; width: fit-content;'
    });
    
    const allStatusBtn = el('button', {
      attrs: { id: 'history-status-all' },
      style: 'padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;',
      text: 'Todos'
    });
    allStatusBtn.onclick = () => {
      if (container._options && typeof container._options.onFilterChange === 'function') {
        container._options.onFilterChange({ historyStatusFilter: 'ALL' });
      }
    };
    
    const soldStatusBtn = el('button', {
      attrs: { id: 'history-status-sold' },
      style: 'padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;',
      text: 'Vendidos'
    });
    soldStatusBtn.onclick = () => {
      if (container._options && typeof container._options.onFilterChange === 'function') {
        container._options.onFilterChange({ historyStatusFilter: 'SOLD' });
      }
    };
    
    const rejectedStatusBtn = el('button', {
      attrs: { id: 'history-status-rejected' },
      style: 'padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s;',
      text: 'Rechazados'
    });
    rejectedStatusBtn.onclick = () => {
      if (container._options && typeof container._options.onFilterChange === 'function') {
        container._options.onFilterChange({ historyStatusFilter: 'REJECTED' });
      }
    };

    statusFilterContainer.appendChild(allStatusBtn);
    statusFilterContainer.appendChild(soldStatusBtn);
    statusFilterContainer.appendChild(rejectedStatusBtn);
    selectorsRow.appendChild(statusFilterContainer);
    container.appendChild(selectorsRow);

    listTabBtn.onclick = () => {
      localStorage.setItem('checks_history_tab', 'list');
      if (container._options && typeof container._options.onFilterChange === 'function') {
        container._options.onFilterChange({});
      }
    };
    
    groupedTabBtn.onclick = () => {
      localStorage.setItem('checks_history_tab', 'grouped');
      if (container._options && typeof container._options.onFilterChange === 'function') {
        container._options.onFilterChange({});
      }
    };

    // --- 8. HISTORY WRAPPERS ---
    const historyTableWrapper = el('div', { attrs: { id: 'history-table-wrapper' } });
    const historyPaginationWrapper = el('div', { attrs: { id: 'history-pagination-wrapper' } });
    const historyGroupedWrapper = el('div', { attrs: { id: 'history-grouped-wrapper' } });
    container.appendChild(historyTableWrapper);
    container.appendChild(historyPaginationWrapper);
    container.appendChild(historyGroupedWrapper);
  }

  // --- PERSISTENT SELECTION ---
  const selectedIds = container._selectedChecksIds || (container._selectedChecksIds = new Set());
  
  // Clean up selectedIds to only include checks that actually exist in the global list
  const validIds = new Set(checks.map(c => String(c.id)));
  for (const id of selectedIds) {
    if (!validIds.has(id)) {
      selectedIds.delete(id);
    }
  }

  const batchSellBar = container.querySelector('#batch-sell-bar-wrapper');
  const batchSellLabel = batchSellBar?.querySelector('span');

  const updateBatchBar = () => {
    if (!batchSellBar) return;
    if (selectedIds.size > 0) {
      batchSellBar.style.display = 'flex';
      let totalNominal = 0;
      const currentPortfolio = filteredSummary.portfolioChecks || [];
      currentPortfolio.forEach(c => {
        if (selectedIds.has(String(c.id))) {
          totalNominal += parseFloat(c.nominalValue) || 0;
        }
      });
      if (batchSellLabel) {
        batchSellLabel.textContent = `${selectedIds.size} cheque${selectedIds.size > 1 ? 's' : ''} seleccionado${selectedIds.size > 1 ? 's' : ''} (${formatCurrency(totalNominal)})`;
      }
    } else {
      batchSellBar.style.display = 'none';
    }
  };
  container._updateBatchBarFn = updateBatchBar;

  // --- DYNAMIC CONTENT RENDERING (for First Render or Updates) ---

  // Update Datalist Suggestions
  const searchDatalist = container.querySelector('#checks-search-dl');
  if (searchDatalist) {
    searchDatalist.innerHTML = '';
    const suggestionSet = new Set();
    checks.forEach(c => {
      if (c.bank) suggestionSet.add(c.bank);
      if (c.checkNumber) suggestionSet.add(String(c.checkNumber));
      if (c.issuerName) suggestionSet.add(c.issuerName);
      if (c.issuerCuit) suggestionSet.add(String(c.issuerCuit));
    });
    contacts.forEach(c => { if (c.name) suggestionSet.add(c.name); });
    suggestionSet.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      searchDatalist.appendChild(opt);
    });
  }

  // Update stats cards in stats grid
  const statsGrid = container.querySelector('#checks-stats-grid');
  const { totalProfit = 0, totalPortfolioDiscount = 0, totalInPortfolio = 0, portfolioChecksCount = 0, expiringChecks = [] } = globalSummary;
  if (statsGrid) {
    const cards = statsGrid.querySelectorAll('kmp-metric-card');
    if (cards.length >= 4) {
      if (filters?.onlyNominal) {
        cards[0].setAttribute('value', '🔒 Oculto');
        cards[1].setAttribute('value', '🔒 Oculto');
      } else {
        cards[0].setAttribute('value', formatCurrency(totalProfit));
        cards[1].setAttribute('value', formatCurrency(totalPortfolioDiscount));
      }
      cards[2].setAttribute('value', formatCurrency(totalInPortfolio));
      cards[3].setAttribute('value', `${portfolioChecksCount} uds.`);
    }
  }

  // Update Expiring Alert Banner
  const expiringAlertWrapper = container.querySelector('#expiring-alert-wrapper');
  if (expiringAlertWrapper) {
    expiringAlertWrapper.innerHTML = '';
    if (expiringChecks && expiringChecks.length > 0) {
      const banner = el('div', {
        classes: ['glass-card'],
        style: 'position: relative; margin-bottom: 2rem; padding: 1.25rem 3.5rem 1.25rem 1.5rem; background: rgba(239, 68, 68, 0.05); border: 1.5px solid rgba(239, 68, 68, 0.35); border-radius: 16px; display: flex; align-items: flex-start; gap: 0.85rem; animation: slideIn 0.3s ease;'
      });

      const icon = el('span', { text: '⚠️', style: 'font-size: 1.35rem; flex-shrink: 0;' });

      const textBlock = el('div', { style: 'flex: 1;' });
      textBlock.appendChild(el('div', {
        html: `<strong style="color: #ef4444; font-size: 0.92rem;">Tenés ${expiringChecks.length} cheque${expiringChecks.length > 1 ? 's' : ''} que está${expiringChecks.length > 1 ? 'n' : ''} por vencer.</strong>`,
        style: 'margin-bottom: 0.25rem;'
      }));
      textBlock.appendChild(el('div', {
        text: 'Por disposición del Banco Central (BCRA), podés depositar o negociar estos cheques hasta un máximo de 30 días posteriores a su fecha de pago establecida.',
        style: 'font-size: 0.82rem; color: #f87171; opacity: 0.95; line-height: 1.5; font-weight: 550;'
      }));

      const closeBtn = el('button', {
        attrs: { type: 'button', title: 'Cerrar aviso' },
        style: 'position: absolute; top: 0.85rem; right: 1rem; background: none; border: none; cursor: pointer; font-size: 1.05rem; color: #ef4444; opacity: 0.75; transition: opacity 0.2s;',
        text: '✕'
      });
      closeBtn.onclick = () => banner.remove();
      closeBtn.addEventListener('mouseenter', () => { closeBtn.style.opacity = '1'; });
      closeBtn.addEventListener('mouseleave', () => { closeBtn.style.opacity = '0.75'; });

      banner.appendChild(icon);
      banner.appendChild(textBlock);
      banner.appendChild(closeBtn);
      expiringAlertWrapper.appendChild(banner);
    }
  }

  // Update input values safely if not currently focused
  const searchInput = container.querySelector('#checks-search-input');
  if (searchInput && document.activeElement !== searchInput) {
    searchInput.value = filters?.searchTerm || '';
  }
  const startInput = container.querySelector('#checks-start-date');
  const endInput = container.querySelector('#checks-end-date');
  const typeSelect = container.querySelector('#checks-date-type');
  if (startInput && document.activeElement !== startInput) startInput.value = filters?.startDate || '';
  if (endInput && document.activeElement !== endInput) endInput.value = filters?.endDate || '';
  if (typeSelect && document.activeElement !== typeSelect) typeSelect.value = filters?.dateFilterType || 'DUE';

  const nominalCb = container.querySelector('#filter-only-nominal');
  if (nominalCb) {
    nominalCb.checked = !!filters?.onlyNominal;
  }

  // Split precalculated datasets
  const currentPortfolio = filteredSummary.portfolioChecks || [];
  let currentHistory = filteredSummary.historyChecks || [];

  // Filter history by SOLD / REJECTED status
  const historyStatus = filters?.historyStatusFilter || 'ALL';
  if (historyStatus === 'SOLD') {
    currentHistory = currentHistory.filter(c => c.sellSide?.status === 'SOLD');
  } else if (historyStatus === 'REJECTED') {
    currentHistory = currentHistory.filter(c => c.sellSide?.status === 'REJECTED');
  }

  // Update Filter count bar
  const filterCountBarWrapper = container.querySelector('#filter-count-bar-wrapper');
  if (filterCountBarWrapper) {
    const isFiltered = filters?.searchTerm || filters?.startDate || filters?.endDate;
    const filterLabel = isFiltered ? 'Resultados de los filtros aplicados' : 'Total sin filtros adicionales';
    const totalPortfolioFiltered = filteredSummary.totalInPortfolio || 0;
    const totalHistoryFiltered = currentHistory.reduce((acc, c) => acc + (parseFloat(c.nominalValue) || 0), 0);
    
    filterCountBarWrapper.innerHTML = `
      <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 550;">
        ${filterLabel}: <strong style="color: var(--primary); font-family: monospace;">${currentPortfolio.length}</strong> cheques en cartera (${formatCurrency(totalPortfolioFiltered)}) y <strong style="color: #34d399; font-family: monospace;">${currentHistory.length}</strong> operaciones históricas (${formatCurrency(totalHistoryFiltered)})
      </span>
    `;
  }

  // Cartera Sorting State
  const isAsc = filters?.sortPortfolioAsc !== false; // default true
  const sortBtn = container.querySelector('#portfolio-sort-btn');
  if (sortBtn) {
    sortBtn.innerHTML = `<span>${isAsc ? '⬆️ Más próximos' : '⬇️ Más lejanos'}</span>`;
  }

  // Sort portfolio BEFORE pagination boundaries
  const sortedPortfolio = [...currentPortfolio].sort((a,b) => {
    const tA = getSortDate(a.dueDate);
    const tB = getSortDate(b.dueDate);
    return isAsc ? tA - tB : tB - tA;
  });
  container._sortedPortfolioCached = sortedPortfolio;

  // Render Portfolio Table
  const portfolioTableWrapper = container.querySelector('#portfolio-table-wrapper');
  const portfolioPaginationWrapper = container.querySelector('#portfolio-pagination-wrapper');

  if (portfolioTableWrapper) {
    portfolioTableWrapper.innerHTML = '';
    const portTotal = sortedPortfolio.length;
    const portTotalPages = Math.ceil(portTotal / (pagination?.itemsPerPage || 15));
    let portCurrentPage = pagination?.portfolioPage || 1;
    if (portCurrentPage > portTotalPages && portTotalPages > 0) portCurrentPage = portTotalPages;
    const portStart = (portCurrentPage - 1) * (pagination?.itemsPerPage || 15);
    const portPaginated = sortedPortfolio.slice(portStart, portStart + (pagination?.itemsPerPage || 15));

    const portfolioTable = renderCheckTable(portPaginated, contacts, onSave, onDelete, 'dueDate', isAsc, true, selectedIds, updateBatchBar, filters?.onlyNominal);
    portfolioTableWrapper.appendChild(portfolioTable);
    
    if (portfolioPaginationWrapper) {
      portfolioPaginationWrapper.innerHTML = '';
      if (portTotalPages > 1) {
        portfolioPaginationWrapper.appendChild(renderPaginationControls(portCurrentPage, portTotalPages, portTotal, onPortfolioPageChange));
      }
    }
  }

  // Render History Operations logs
  const activeTab = localStorage.getItem('checks_history_tab') || 'list';

  // Toggle History print button visibility
  const historyPrintBtn = container.querySelector('#history-print-btn');
  if (historyPrintBtn) {
    historyPrintBtn.style.display = activeTab === 'list' ? 'block' : 'none';
  }

  // Update tabs styles
  const listTabBtn = container.querySelector('#history-tab-list');
  const groupedTabBtn = container.querySelector('#history-tab-grouped');
  if (listTabBtn && groupedTabBtn) {
    listTabBtn.style.cssText = `padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${activeTab === 'list' ? 'background: var(--primary); color: var(--on-primary);' : 'background: transparent; color: var(--text-muted);' }`;
    groupedTabBtn.style.cssText = `padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${activeTab === 'grouped' ? 'background: var(--primary); color: var(--on-primary);' : 'background: transparent; color: var(--text-muted);' }`;
  }

  // Update history status filters styles
  const allStatusBtn = container.querySelector('#history-status-all');
  const soldStatusBtn = container.querySelector('#history-status-sold');
  const rejectedStatusBtn = container.querySelector('#history-status-rejected');
  const currentStatusFilter = filters?.historyStatusFilter || 'ALL';
  if (allStatusBtn && soldStatusBtn && rejectedStatusBtn) {
    allStatusBtn.style.cssText = `padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${currentStatusFilter === 'ALL' ? 'background: var(--primary); color: var(--on-primary);' : 'background: transparent; color: var(--text-muted);' }`;
    soldStatusBtn.style.cssText = `padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${currentStatusFilter === 'SOLD' ? 'background: rgba(16, 185, 129, 0.15); color: #34d399;' : 'background: transparent; color: var(--text-muted);' }`;
    rejectedStatusBtn.style.cssText = `padding: 0.5rem 1.25rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${currentStatusFilter === 'REJECTED' ? 'background: rgba(239, 68, 68, 0.15); color: #f87171;' : 'background: transparent; color: var(--text-muted);' }`;
  }

  // Sort history BEFORE pagination
  const sortedHistory = [...currentHistory].sort((a,b) => {
    const tA = getSortDate(a.dueDate);
    const tB = getSortDate(b.dueDate);
    return tB - tA; // history defaults to descending
  });
  container._sortedHistoryCached = sortedHistory;

  const historyTableWrapper = container.querySelector('#history-table-wrapper');
  const historyPaginationWrapper = container.querySelector('#history-pagination-wrapper');
  const historyGroupedWrapper = container.querySelector('#history-grouped-wrapper');

  if (activeTab === 'list') {
    if (historyGroupedWrapper) historyGroupedWrapper.style.display = 'none';
    if (historyTableWrapper) {
      historyTableWrapper.style.display = 'block';
      historyTableWrapper.innerHTML = '';
      const histTotal = sortedHistory.length;
      const histTotalPages = Math.ceil(histTotal / (pagination?.itemsPerPage || 15));
      let histCurrentPage = pagination?.historyPage || 1;
      if (histCurrentPage > histTotalPages && histTotalPages > 0) histCurrentPage = histTotalPages;
      const histStart = (histCurrentPage - 1) * (pagination?.itemsPerPage || 15);
      const histPaginated = sortedHistory.slice(histStart, histStart + (pagination?.itemsPerPage || 15));

      const historyTable = renderCheckTable(histPaginated, contacts, onSave, onDelete, 'dueDate', false, false, null, null, filters?.onlyNominal);
      historyTableWrapper.appendChild(historyTable);

      if (historyPaginationWrapper) {
        historyPaginationWrapper.style.display = 'block';
        historyPaginationWrapper.innerHTML = '';
        if (histTotalPages > 1) {
          historyPaginationWrapper.appendChild(renderPaginationControls(histCurrentPage, histTotalPages, histTotal, onHistoryPageChange));
        }
      }
    }
  } else {
    // Grouped Mode
    if (historyTableWrapper) historyTableWrapper.style.display = 'none';
    if (historyPaginationWrapper) historyPaginationWrapper.style.display = 'none';
    if (historyGroupedWrapper) {
      historyGroupedWrapper.style.display = 'block';
      historyGroupedWrapper.innerHTML = '';

      const groupedType = localStorage.getItem('checks_grouped_type') || 'sell';

      const typeContainer = el('div', {
        style: 'display: flex; gap: 0.5rem; margin-bottom: 1.5rem;'
      });
      const sellTypeBtn = el('button', {
        style: `padding: 0.45rem 1.15rem; border-radius: 20px; border: 1px solid ${groupedType === 'sell' ? 'rgba(16,185,129,0.35)' : 'var(--border)'}; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${groupedType === 'sell' ? 'background: rgba(16,185,129,0.15); color: #34d399;' : 'background: transparent; color: var(--text-muted);'}`,
        text: '📤 Ventas Realizadas'
      });
      const buyTypeBtn = el('button', {
        style: `padding: 0.45rem 1.15rem; border-radius: 20px; border: 1px solid ${groupedType === 'buy' ? 'rgba(59,130,246,0.35)' : 'var(--border)'}; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${groupedType === 'buy' ? 'background: rgba(59,130,246,0.15); color: #60a5fa;' : 'background: transparent; color: var(--text-muted);'}`,
        text: '📥 Compras Realizadas'
      });
      
      typeContainer.appendChild(sellTypeBtn);
      typeContainer.appendChild(buyTypeBtn);
      historyGroupedWrapper.appendChild(typeContainer);
      
      sellTypeBtn.onclick = () => {
        localStorage.setItem('checks_grouped_type', 'sell');
        if (container._options && typeof container._options.onFilterChange === 'function') {
          container._options.onFilterChange({});
        }
      };
      buyTypeBtn.onclick = () => {
        localStorage.setItem('checks_grouped_type', 'buy');
        if (container._options && typeof container._options.onFilterChange === 'function') {
          container._options.onFilterChange({});
        }
      };

      const groupedListContainer = el('div', {
        style: 'display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2rem;'
      });

      if (groupedType === 'sell') {
        const sellGroups = {};
        sortedHistory.forEach(c => {
          if (c.sellSide?.status === 'SOLD') {
            const opId = c.sellSide?.operationId || `IND-${c.id}`;
            if (!sellGroups[opId]) {
              sellGroups[opId] = {
                id: opId,
                isGrouped: !!c.sellSide?.operationId,
                contactId: c.sellSide?.contactId,
                contactName: contacts.find(con => con.id === c.sellSide?.contactId)?.name || c.sellSide?.contactId || 'Desconocido',
                date: c.sellSide?.date || c.dueDate || '',
                checks: [],
                totalNominal: 0,
                totalNet: 0,
                totalProfit: 0
              };
            }
            sellGroups[opId].checks.push(c);
            sellGroups[opId].totalNominal += c.nominalValue;
            sellGroups[opId].totalNet += c.sellSide.netAmount;
            sellGroups[opId].totalProfit += c.profit;
          }
        });

        const operationList = Object.values(sellGroups);
        operationList.sort((a,b) => {
          const dA = a.date ? new Date(a.date).getTime() : 0;
          const dB = b.date ? new Date(b.date).getTime() : 0;
          return dB - dA;
        });

        if (operationList.length === 0) {
          groupedListContainer.innerHTML = `<div class="glass-card" style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-weight: 600;">No se encontraron operaciones de venta en esta sección.</div>`;
        } else {
          operationList.forEach(op => {
            const card = el('div', {
              classes: ['glass-card'],
              style: 'padding: 1.25rem 1.5rem; border-radius: 16px; border: 1px solid var(--border); background: rgba(255,255,255,0.015); display: flex; flex-direction: column; gap: 1rem; transition: all 0.2s ease;'
            });
            card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; });
            card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; });

            const opDateStr = op.date ? new Date(op.date).toLocaleDateString('es-AR') : '-';
            
            const headerRow = el('div', {
              style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;'
            });
            headerRow.innerHTML = `
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="padding: 0.25rem 0.65rem; border-radius: 8px; background: rgba(16,185,129,0.12); color: #34d399; font-size: 0.72rem; font-weight: 800; text-transform: uppercase;">Venta</span>
                <strong style="font-family: monospace; font-size: 0.95rem; color: #ffffff;">${op.id}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">📅 ${opDateStr}</span>
              </div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">
                👤 <span style="color: var(--text-main);">${op.contactName}</span>
              </div>
            `;

            const kpisRow = el('div', {
              style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; background: rgba(0,0,0,0.15); border-radius: 12px; padding: 0.85rem 1.25rem; border: 1px solid rgba(255,255,255,0.02);'
            });
            kpisRow.innerHTML = `
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Total Nominal</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #ffffff; margin-top: 0.15rem;">${formatCurrency(op.totalNominal)}</div>
              </div>
              ${!filters?.onlyNominal ? `
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Neto Cobrado</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #60a5fa; margin-top: 0.15rem;">${formatCurrency(op.totalNet)}</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Ganancia Total</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #34d399; margin-top: 0.15rem;">+${formatCurrency(op.totalProfit)}</div>
              </div>
              ` : ''}
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Cheques</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-top: 0.15rem;">${op.checks.length} uds.</div>
              </div>
            `;

            const expContainer = el('div', {
              style: 'display: none; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: rgba(0,0,0,0.15); margin-top: 0.5rem;'
            });
            const expTable = el('table', {
              style: 'width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;'
            });
            expTable.innerHTML = `
              <thead>
                <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 700; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px;">
                  <th style="padding: 0.5rem 0.75rem;">Banco</th>
                  <th style="padding: 0.5rem 0.75rem;">Nº Cheque</th>
                  <th style="padding: 0.5rem 0.75rem;">Vencimiento</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: right;">Nominal</th>
                  ${!filters?.onlyNominal ? `
                  <th style="padding: 0.5rem 0.75rem; text-align: right;">Neto Venta</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: right;">Ganancia</th>
                  ` : ''}
                </tr>
              </thead>
              <tbody>
                ${op.checks.map(c => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.02);">
                    <td style="padding: 0.5rem 0.75rem; font-weight: 700; color: #ffffff;">${c.bank || '-'}</td>
                    <td style="padding: 0.5rem 0.75rem; color: var(--text-muted); font-weight: 600;">${c.checkNumber || '-'}</td>
                    <td style="padding: 0.5rem 0.75rem; font-weight: 600;">${formatDateLocal(c.dueDate)} <span style="font-size:10px; color:var(--text-muted);">(${c.days}d)</span></td>
                    <td style="padding: 0.5rem 0.75rem; text-align: right; font-family: monospace; font-weight: 700; color: #ffffff;">${formatCurrency(c.nominalValue)}</td>
                    ${!filters?.onlyNominal ? `
                    <td style="padding: 0.5rem 0.75rem; text-align: right; font-family: monospace; color: #60a5fa; font-weight: 700;">${formatCurrency(c.sellSide?.netAmount)}</td>
                    <td style="padding: 0.5rem 0.75rem; text-align: right; font-family: monospace; color: #34d399; font-weight: 700;">+${formatCurrency(c.profit)}</td>
                    ` : ''}
                  </tr>
                `).join('')}
              </tbody>
            `;
            expContainer.appendChild(expTable);

            const actionsRow = el('div', {
              style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;'
            });

            const toggleListBtn = el('button', {
              classes: ['btn-secondary'],
              style: 'padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; display: flex; align-items: center; gap: 0.3rem;',
              text: `👁️ Ver Detalles (${op.checks.length})`
            });
            toggleListBtn.onclick = () => {
              const isHidden = expContainer.style.display === 'none';
              expContainer.style.display = isHidden ? 'block' : 'none';
              toggleListBtn.textContent = isHidden ? `🙈 Ocultar Detalles` : `👁️ Ver Detalles (${op.checks.length})`;
            };
            actionsRow.appendChild(toggleListBtn);

            const opActions = el('div', { style: 'display: flex; gap: 0.4rem;' });

            const printBtn = el('button', {
              style: 'padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.35); color: #818cf8; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; transition: all 0.2s;',
              html: '🖨️ Imprimir'
            });
            printBtn.onclick = () => {
              printSaleOperationReport(op.id, op.contactName, op.date, op.checks, contacts);
            };

            const excelBtn = el('button', {
              style: 'padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.35); color: #34d399; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; transition: all 0.2s;',
              html: '📥 Excel'
            });
            excelBtn.onclick = () => {
              generateSaleOperationExcel(op.id, op.contactName, op.date, op.checks, contacts);
            };

            const undoBtn = el('button', {
              style: 'padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: var(--danger); cursor: pointer; display: flex; align-items: center; gap: 0.25rem; transition: all 0.2s;',
              html: '↩️ Deshacer Venta'
            });
            undoBtn.onclick = () => {
              if (container._options && typeof container._options.onUndoSale === 'function') {
                container._options.onUndoSale(op.id);
              }
            };

            opActions.appendChild(printBtn);
            opActions.appendChild(excelBtn);
            opActions.appendChild(undoBtn);
            actionsRow.appendChild(opActions);

            [printBtn, excelBtn, undoBtn].forEach(btn => {
              btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.05)'; btn.style.filter = 'brightness(1.2)'; });
              btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; btn.style.filter = 'none'; });
            });

            card.appendChild(headerRow);
            card.appendChild(kpisRow);
            card.appendChild(expContainer);
            card.appendChild(actionsRow);
            groupedListContainer.appendChild(card);
          });
        }
      } else {
        // Buy Groups
        const buyGroups = {};
        filteredChecks.forEach(c => {
          if (c.buySide?.operationId) {
            const opId = c.buySide.operationId;
            if (!buyGroups[opId]) {
              buyGroups[opId] = {
                id: opId,
                contactId: c.buySide?.contactId,
                contactName: contacts.find(con => con.id === c.buySide?.contactId)?.name || c.buySide?.contactId || 'Desconocido',
                date: c.buySide?.date || c.receptionDate || '',
                checks: [],
                totalNominal: 0,
                totalNet: 0,
                totalDiscount: 0
              };
            }
            buyGroups[opId].checks.push(c);
            buyGroups[opId].totalNominal += c.nominalValue;
            buyGroups[opId].totalNet += c.buySide.netAmount;
            buyGroups[opId].totalDiscount += c.purchaseDiscount;
          }
        });

        const operationList = Object.values(buyGroups);
        operationList.sort((a,b) => {
          const dA = a.date ? new Date(a.date).getTime() : 0;
          const dB = b.date ? new Date(b.date).getTime() : 0;
          return dB - dA;
        });

        if (operationList.length === 0) {
          groupedListContainer.innerHTML = `<div class="glass-card" style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-weight: 600;">No se encontraron operaciones de compra en esta sección.</div>`;
        } else {
          operationList.forEach(op => {
            const card = el('div', {
              classes: ['glass-card'],
              style: 'padding: 1.25rem 1.5rem; border-radius: 16px; border: 1px solid var(--border); background: rgba(255,255,255,0.015); display: flex; flex-direction: column; gap: 1rem; transition: all 0.2s ease;'
            });
            card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; });
            card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = 'none'; });

            const opDateStr = op.date ? new Date(op.date).toLocaleDateString('es-AR') : '-';
            
            const headerRow = el('div', {
              style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;'
            });
            headerRow.innerHTML = `
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="padding: 0.25rem 0.65rem; border-radius: 8px; background: rgba(59,130,246,0.12); color: #60a5fa; font-size: 0.72rem; font-weight: 800; text-transform: uppercase;">Compra</span>
                <strong style="font-family: monospace; font-size: 0.95rem; color: #ffffff;">${op.id}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">📅 ${opDateStr}</span>
              </div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">
                👤 <span style="color: var(--text-main);">${op.contactName}</span>
              </div>
            `;

            const kpisRow = el('div', {
              style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; background: rgba(0,0,0,0.15); border-radius: 12px; padding: 0.85rem 1.25rem; border: 1px solid rgba(255,255,255,0.02);'
            });
            kpisRow.innerHTML = `
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Total Nominal</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #ffffff; margin-top: 0.15rem;">${formatCurrency(op.totalNominal)}</div>
              </div>
              ${!filters?.onlyNominal ? `
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Neto Pagado</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #60a5fa; margin-top: 0.15rem;">${formatCurrency(op.totalNet)}</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Desc. Compra</div>
                <div style="font-size: 1.05rem; font-weight: 800; font-family: monospace; color: #34d399; margin-top: 0.15rem;">+${formatCurrency(op.totalDiscount)}</div>
              </div>
              ` : ''}
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Cheques</div>
                <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-top: 0.15rem;">${op.checks.length} uds.</div>
              </div>
            `;

            const expContainer = el('div', {
              style: 'display: none; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: rgba(0,0,0,0.15); margin-top: 0.5rem;'
            });
            const expTable = el('table', {
              style: 'width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;'
            });
            expTable.innerHTML = `
              <thead>
                <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border); color: var(--text-muted); font-weight: 700; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px;">
                  <th style="padding: 0.5rem 0.75rem;">Banco</th>
                  <th style="padding: 0.5rem 0.75rem;">Nº Cheque</th>
                  <th style="padding: 0.5rem 0.75rem;">Vencimiento</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: right;">Nominal</th>
                  ${!filters?.onlyNominal ? `
                  <th style="padding: 0.5rem 0.75rem; text-align: right;">Neto Compra</th>
                  <th style="padding: 0.5rem 0.75rem; text-align: right;">Descuento</th>
                  ` : ''}
                </tr>
              </thead>
              <tbody>
                ${op.checks.map(c => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.02);">
                    <td style="padding: 0.5rem 0.75rem; font-weight: 700; color: #ffffff;">${c.bank || '-'}</td>
                    <td style="padding: 0.5rem 0.75rem; color: var(--text-muted); font-weight: 600;">${c.checkNumber || '-'}</td>
                    <td style="padding: 0.5rem 0.75rem; font-weight: 600;">${formatDateLocal(c.dueDate)} <span style="font-size:10px; color:var(--text-muted);">(${c.days}d)</span></td>
                    <td style="padding: 0.5rem 0.75rem; text-align: right; font-family: monospace; font-weight: 700; color: #ffffff;">${formatCurrency(c.nominalValue)}</td>
                    ${!filters?.onlyNominal ? `
                    <td style="padding: 0.5rem 0.75rem; text-align: right; font-family: monospace; color: #60a5fa; font-weight: 700;">${formatCurrency(c.buySide?.netAmount)}</td>
                    <td style="padding: 0.5rem 0.75rem; text-align: right; font-family: monospace; color: #34d399; font-weight: 700;">+${formatCurrency(c.purchaseDiscount)}</td>
                    ` : ''}
                  </tr>
                `).join('')}
              </tbody>
            `;
            expContainer.appendChild(expTable);

            const actionsRow = el('div', {
              style: 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;'
            });

            const toggleListBtn = el('button', {
              classes: ['btn-secondary'],
              style: 'padding: 0.4rem 0.85rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; display: flex; align-items: center; gap: 0.3rem;',
              text: `👁️ Ver Detalles (${op.checks.length})`
            });
            toggleListBtn.onclick = () => {
              const isHidden = expContainer.style.display === 'none';
              expContainer.style.display = isHidden ? 'block' : 'none';
              toggleListBtn.textContent = isHidden ? `🙈 Ocultar Detalles` : `👁️ Ver Detalles (${op.checks.length})`;
            };
            actionsRow.appendChild(toggleListBtn);

            card.appendChild(headerRow);
            card.appendChild(kpisRow);
            card.appendChild(expContainer);
            card.appendChild(actionsRow);
            groupedListContainer.appendChild(card);
          });
        }
      }
      historyGroupedWrapper.appendChild(groupedListContainer);
    }
  }

  // --- RESTORE FOCUS & SELECTION RANGE ---
  if (activeId) {
    const elToFocus = document.getElementById(activeId);
    if (elToFocus) {
      elToFocus.focus();
      if (selectionStart !== null && selectionEnd !== null && (elToFocus.type === 'text' || elToFocus.type === 'search')) {
        elToFocus.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }

  // Initial call to update the batch bar state
  updateBatchBar();
}

/**
 * @param {number} currentPage - Índice de la página que se encuentra activa (1-indexed).
 * @param {number} totalPages - Cantidad total de páginas disponibles basadas en los límites.
 * @param {number} totalItems - Cantidad total de registros/cheques disponibles para paginar.
 * @param {Function} onPageChange - Callback disparado al presionar las acciones de navegación de página.
 * @returns {HTMLElement} El elemento contenedor HTML de los controles de paginación.
 */
function renderPaginationControls(currentPage, totalPages, totalItems, onPageChange) {
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
function getCheckStatusBadge(op) {
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
function renderCheckTable(checksList, contacts, onSave, onDelete, sortBy = 'receptionDate', sortAsc = false, selectable = false, selectedIds = null, onSelectionChange = null, onlyNominal = false) {
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
      ${selectable ? '<th style="padding: 1rem; width: 40px; text-align: center;"><input type="checkbox" id="check-all-cb" style="width: 16px; height: 16px; cursor: pointer;" title="Seleccionar todos"></th>' : ''}
      <th style="padding: 1rem 1.25rem;">Banco / Emisor</th>
      <th style="padding: 1rem 1.25rem;">Cobro / Vencimiento</th>
      <th style="padding: 1rem 1.25rem; text-align: right;">Valor Nominal</th>
      <th style="padding: 1rem 1.25rem; text-align: left;">Flujo Origen/Destino</th>
      ${onlyNominal ? '' : `<th style="padding: 1rem 1.25rem; text-align: right;">${selectable ? 'Desc. Compra' : 'Ganancia'}</th>`}
      <th style="padding: 1rem 1.25rem; text-align: right;">Acciones</th>
    </tr>
  `});
  table.appendChild(thead);

  const tbody = el('tbody');
  if (checksList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding: 2.5rem; text-align: center; color: var(--text-muted); font-weight: 600;">Sin registros en esta sección.</td></tr>';
  } else {
    checksList.sort((a,b) => {
      const tA = getSortDate(a[sortBy]);
      const tB = getSortDate(b[sortBy]);
      return sortAsc ? tA - tB : tB - tA;
    }).forEach(op => {
      const tr = el('tr', { 
        classes: ['check-card-row'],
        style: 'box-shadow: var(--elevation-1);' 
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

      const cbCell = selectable ? `<td style="padding: 1rem; width: 40px; text-align: center; border-radius: 14px 0 0 14px;"><input type="checkbox" class="portfolio-check-cb" data-id="${op.id}" style="width: 17px; height: 17px; cursor: pointer;"></td>` : '';
      
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
        <td style="${selectable ? '' : 'border-radius: 14px 0 0 14px;'}">
          <div style="font-size: 0.95rem; font-weight: 800; color: #ffffff; letter-spacing: 0.3px;">Nº ${op.checkNumber || 'S/N'}</div>
          ${op.issuerName ? `<div style="font-size: 0.82rem; color: var(--primary); font-weight: 700; margin-top: 0.25rem; display: flex; align-items: center; gap: 0.3rem;"><span style="font-size: 0.85rem;">👤</span> ${op.issuerName}</div>` : ''}
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
              <span style="font-size: 0.65rem; font-weight: 800; padding: 0.12rem 0.35rem; border-radius: 4px; background: rgba(143,0,20,0.12); color: var(--primary); border: 1px solid rgba(143,0,20,0.25);">DE</span>
              <span style="color: var(--text-main); font-weight: 700;">${seller}</span>
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
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
            <button class="icon-btn edit-btn" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s;" title="Editar Cheque">
              <span style="font-size: 0.85rem;">✏️</span>
            </button>
            ${op.issuerCuit ? `<button class="icon-btn bcra-list-btn" title="Consultar BCRA: ${op.issuerCuit}" style="height: 32px; display: flex; align-items: center; gap: 0.25rem; background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.3); color: #60a5fa; border-radius: 8px; padding: 0 0.65rem; font-size: 0.72rem; font-weight: 800; cursor: pointer; transition: all 0.2s; letter-spacing: 0.2px;">🔍 BCRA</button>` : ''}
            <button class="icon-btn delete-btn" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.18); color: var(--danger); border-radius: 8px; cursor: pointer; transition: all 0.2s;" title="Eliminar Cheque">
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
        if (e.target.closest('.edit-btn')) { showOperationModal(op, contacts, contacts, onSave); return; }
        if (e.target.closest('.delete-btn')) { onDelete(op.id); return; }
        if (e.target.closest('.bcra-list-btn')) {
          const cuit = (op.issuerCuit || '').replace(/\D/g, '');
          if (!cuit || cuit.length < 11) { alert('CUIT no válido para consultar.'); return; }
          navigator.clipboard.writeText(cuit).then(() => {
            alert(`CUIT ${cuit} copiado al portapapeles.\n\nSe abrirá la web de consulta crediticia del BCRA. Pegá el CUIT allí para consultar.`);
            window.open('https://www.bcra.gob.ar/situacion-crediticia/', '_blank');
          }).catch(() => window.open('https://www.bcra.gob.ar/situacion-crediticia/', '_blank'));
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
    });

    if (selectable) {
      const allCb = table.querySelector('#check-all-cb');
      if (allCb) {
        allCb.addEventListener('change', () => {
          table.querySelectorAll('.portfolio-check-cb').forEach(cb => {
            cb.checked = allCb.checked;
            const id = String(cb.dataset.id);
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
 * @param {string} emoji - Emojis visual representativo.
 * @returns {HTMLElement} El contenedor div ('glass-card') de la tarjeta estadística.
 */
function createStatCard(label, value, color, emoji) {
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
function showStateConfirmationModal({ title, promptMsg, expectedValue, onConfirm }) {
  const overlay = el('div', {
    classes: ['modal-overlay', 'fade-in'],
    style: 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1.5rem;'
  });
  
  const modal = el('div', {
    classes: ['glass-card'],
    style: 'max-width: 480px; width: 100%; padding: 2rem; border-radius: 20px; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 1.25rem;'
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

