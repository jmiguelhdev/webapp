/**
 * AccountingUI.js
 * Capa de presentación (Screen) para el módulo de Contabilidad.
 *
 * Responsabilidades:
 *  - Renderizar la pantalla principal: header, filtros, tarjetas de estadísticas y tabla.
 *  - Delegar la lógica de modales a AccountingModals.js.
 *  - Delegar la generación de recibos a AccountingReceipts.js.
 *
 * Se mantiene estrictamente dentro de la capa UI según rules.md.
 */
import { el } from '../../../frameworks/utils/dom.js';
import { renderDateModal, showAuxiliaryCalculator } from '../components/Modals.js';
import { showEntryModal, showSalaryPaymentModal, showArcaImportModal, showIssuedArcaModal } from '../components/AccountingModals.js';
import { printReceipt, printSalaryReceipt } from '../reports/AccountingReceipts.js';
import { formatCurrency, formatDate, formatTime } from '../../../frameworks/utils/formatters.js';
import { buildExtractionsTab } from '../components/CashExtractionUI.js';
import { renderExtractionControlScreen, renderExtractionDetailScreen } from '../components/CashExtractionModals.js';
import { renderSalaryPaymentScreen } from '../components/SalaryPaymentUI.js';

// ---------------------------------------------------------------------------
// Función principal de renderizado
// ---------------------------------------------------------------------------

export function renderAccounting(container, options) {
  const {
    entries,
    filteredEntries,
    extractions = [],
    selectedExtraction = null,
    extractionScreenMode = null,
    isSalaryPaymentActive = false,
    salaryPaymentPayload = null,
    clients,
    producers,
    establishments = [],
    pagination,
    filters,
    activeTab = 'journal',
    userRole = 'VISOR',
    onTabChange,
    onOpenControlScreen,
    onOpenDetailScreen,
    onCloseExtractionScreen,
    onOpenSalaryPaymentScreen,
    onCloseSalaryPaymentScreen,
    onFilterChange,
    onSave,
    onSaveExtractionEntry,
    onDelete,
    onRefresh,
    onExport,
    title = 'Caja General'
  } = options;

  container.innerHTML = '';

  // Render Sub-Screens for Extractions if active
  if (selectedExtraction && extractionScreenMode === 'control') {
    renderExtractionControlScreen(container, {
      extraction: selectedExtraction,
      userRole,
      onSave: onSaveExtractionEntry,
      onBack: onCloseExtractionScreen
    });
    return;
  }

  if (selectedExtraction && extractionScreenMode === 'detail') {
    renderExtractionDetailScreen(container, {
      extraction: selectedExtraction,
      onBack: onCloseExtractionScreen
    });
    return;
  }

  // Render Sub-Screen for Salary Payment if active
  if (isSalaryPaymentActive) {
    renderSalaryPaymentScreen(container, {
      establishments,
      initialData: salaryPaymentPayload,
      boxTitle: title,
      onSave: (data) => {
        onSave(data);
        if (typeof onCloseSalaryPaymentScreen === 'function') onCloseSalaryPaymentScreen();
      },
      onBack: onCloseSalaryPaymentScreen
    });
    return;
  }

  const {
    onFetchArcaPipeline,
    onSaveArcaEntries,
    onFetchIssuedArcaPipeline,
    onLinkIssuedInvoiceToClient
  } = options;

  const pendingExtractionsCount = extractions.filter(e => e.status !== 'ACCEPTED').length;

  container.appendChild(buildHeader({ title, filteredEntries, entries, clients, producers, establishments, onSave, onExport, onOpenSalaryPaymentScreen, onFetchArcaPipeline, onSaveArcaEntries, onFetchIssuedArcaPipeline, onLinkIssuedInvoiceToClient, onBack: options.onBack }));



  // Render Tabs ONLY for Caja General
  if (title === 'Caja General') {
    container.appendChild(buildTabsBar({ activeTab, pendingCount: pendingExtractionsCount, onTabChange }));
  }

  if (title === 'Caja General' && activeTab === 'extractions') {
    container.appendChild(buildExtractionsTab({
      extractions,
      userRole,
      onSaveEntry: onSaveExtractionEntry,
      onOpenControlScreen,
      onOpenDetailScreen
    }));
  } else {
    container.appendChild(buildFiltersBar({ filters, onFilterChange }));
    container.appendChild(buildStatsGrid(filteredEntries || entries));
    container.appendChild(buildTable(entries, { clients, producers, onSave, onDelete, title }));

    if (pagination && pagination.totalPages > 1) {
      container.appendChild(buildPagination(entries, pagination));
    }
  }
}


function buildTabsBar({ activeTab, pendingCount, onTabChange }) {
  const tabsBar = el('div', {
    style: 'display: flex; gap: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem; padding-bottom: 0.25rem;'
  });

  const tabJournal = el('button', {
    classes: activeTab === 'journal' ? ['btn-tab', 'active'] : ['btn-tab'],
    style: `background: transparent; border: none; font-size: 0.95rem; font-weight: 700; padding: 0.6rem 1rem; border-bottom: 3px solid ${activeTab === 'journal' ? 'var(--primary)' : 'transparent'}; color: ${activeTab === 'journal' ? 'var(--primary)' : 'var(--text-muted)'}; cursor: pointer; border-radius: 6px; transition: all 0.2s;`,
    html: '<span>📖 Libro Diario / Movimientos</span>'
  });
  tabJournal.onclick = () => {
    if (typeof onTabChange === 'function') onTabChange('journal');
  };

  const pendingBadge = pendingCount > 0 
    ? `<span style="background: #ef4444; color: #ffffff; padding: 0.15rem 0.55rem; border-radius: 12px; font-size: 0.75rem; font-weight: 800; margin-left: 0.5rem; box-shadow: 0 2px 8px rgba(239,68,68,0.4);">${pendingCount}</span>`
    : `<span style="background: rgba(255,255,255,0.08); color: var(--text-muted); padding: 0.15rem 0.55rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">0</span>`;

  const tabExtractions = el('button', {
    classes: activeTab === 'extractions' ? ['btn-tab', 'active'] : ['btn-tab'],
    style: `background: transparent; border: none; font-size: 0.95rem; font-weight: 700; padding: 0.6rem 1rem; border-bottom: 3px solid ${activeTab === 'extractions' ? '#10b981' : 'transparent'}; color: ${activeTab === 'extractions' ? '#10b981' : 'var(--text-muted)'}; cursor: pointer; border-radius: 6px; transition: all 0.2s; display: flex; align-items: center;`,
    html: `<span>📥 Extracciones por Recibir</span> ${pendingBadge}`
  });

  tabExtractions.onclick = () => {
    if (typeof onTabChange === 'function') onTabChange('extractions');
  };

  tabsBar.appendChild(tabJournal);
  tabsBar.appendChild(tabExtractions);

  return tabsBar;
}


// ---------------------------------------------------------------------------
// Bloques de construcción de la pantalla
// ---------------------------------------------------------------------------

function buildHeader({ title, filteredEntries, entries, clients, producers, establishments, onSave, onExport, onOpenSalaryPaymentScreen, onFetchArcaPipeline, onSaveArcaEntries, onFetchIssuedArcaPipeline, onLinkIssuedInvoiceToClient, onBack }) {
  const header = el('div', {
    classes: ['dashboard-header'],
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;'
  });


  // ---- Grupo título ----
  const titleGroup = el('div', { style: 'display: flex; align-items: center; gap: 1rem;' });
  const backBtn = el('button', {
    classes: ['back-btn-m3'],
    html: '<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>',
    attrs: { title: 'Volver al Dashboard' }
  });
  backBtn.onclick = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      window.dispatchEvent(new CustomEvent('nav:dashboard'));
    }
  };
  titleGroup.appendChild(backBtn);
  titleGroup.appendChild(el('h1', { text: title, style: 'margin:0;' }));
  header.appendChild(titleGroup);

  // ---- Grupo acciones ----
  const actionGroup = el('div', { style: 'display: flex; gap: 0.75rem; flex-wrap: wrap;' });

  const arcaBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem; color: #3b82f6; border-color: rgba(59,130,246,0.3); background: rgba(59,130,246,0.1);',
    html: '<span>🤖 Facturas Recibidas ARCA</span>'
  });
  arcaBtn.onclick = () => {
    renderDateModal({
      title: '🤖 Importar Facturas Recibidas ARCA',
      description: 'Selecciona el rango de fechas para consultar comprobantes recibidos de proveedores y su atribución contable.',
      submitText: 'Buscar Comprobantes',
      onSubmit: async (desde, hasta) => {
        if (typeof onFetchArcaPipeline === 'function') {
          const invoices = await onFetchArcaPipeline(desde, hasta);
          showArcaImportModal({
            invoices,
            onConfirm: (selected) => {
              if (typeof onSaveArcaEntries === 'function') {
                onSaveArcaEntries(selected);
              }
            }
          });
        } else {
          alert('Error: La integración con ARCA no está disponible.');
        }
      }
    });
  };

  const issuedArcaBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem; color: #10b981; border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.1);',
    html: '<span>📤 Ventas Emitidas ARCA</span>'
  });
  issuedArcaBtn.onclick = () => {
    renderDateModal({
      title: '📤 Consulta de Ventas / Comprobantes Emitidos ARCA',
      description: 'Selecciona el rango de fechas para consultar el reporte de ventas emitidas (sin alterar el saldo de caja).',
      submitText: 'Consultar Ventas',
      onSubmit: async (desde, hasta) => {
        if (typeof onFetchIssuedArcaPipeline === 'function') {
          const invoices = await onFetchIssuedArcaPipeline(desde, hasta);
          showIssuedArcaModal({
            invoices,
            clients,
            onLinkToClient: (data) => {
              if (typeof onLinkIssuedInvoiceToClient === 'function') {
                onLinkIssuedInvoiceToClient(data);
              }
            }
          });
        } else {
          alert('Error: La consulta de ventas emitidas ARCA no está disponible.');
        }
      }
    });
  };

  const exportBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem;',
    html: '<span>📥 Exportar</span>'
  });
  exportBtn.onclick = () => {
    if (typeof onExport === 'function') {
      renderDateModal({
        title: '📥 Exportar Movimientos',
        description: 'Selecciona el rango de fechas para exportar a Excel.',
        submitText: 'Exportar Excel',
        onSubmit: onExport
      });
    } else {
      alert('Error: La función de exportación no está disponible.');
    }
  };

  const zeroBtn = el('button', {
    classes: ['btn-outline'],
    style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem; color: var(--text-main); border-color: var(--border);',
    html: '<span>⚖️ Cerrar a Cero</span>'
  });
  zeroBtn.onclick = () => handleCloseToZero(filteredEntries || entries, onSave);

  const addBtn = el('button', {
    classes: ['btn-nueva-operacion'],
    style: 'margin: 0;',
    html: '<svg viewBox="0 0 24 24" width="18" height="18" style="fill:currentColor;flex-shrink:0;"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg> Nuevo Movimiento'
  });
  addBtn.onclick = () => showEntryModal(null, { clients, producers, onSave, title });

  const auxCalcBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem;',
    html: '<span>🧮 Calculadora Auxiliar</span>'
  });
  auxCalcBtn.onclick = () => showAuxiliaryCalculator(title);

  const paySalaryBtn = el('button', {
    classes: ['btn-secondary'],
    style: 'display: flex; align-items: center; gap: 0.5rem; border-radius: 12px; padding: 0.75rem 1rem; color: #8b5cf6; border-color: rgba(139,92,246,0.3); background: rgba(139,92,246,0.1);',
    html: '<span>👨‍💼 Pagar Sueldo</span>'
  });
  paySalaryBtn.onclick = () => {
    if (typeof onOpenSalaryPaymentScreen === 'function') {
      onOpenSalaryPaymentScreen();
    } else {
      showSalaryPaymentModal({ establishments, onSave, title });
    }
  };


  actionGroup.appendChild(zeroBtn);
  actionGroup.appendChild(auxCalcBtn);
  actionGroup.appendChild(paySalaryBtn);
  actionGroup.appendChild(arcaBtn);
  actionGroup.appendChild(issuedArcaBtn);
  actionGroup.appendChild(exportBtn);
  actionGroup.appendChild(addBtn);
  header.appendChild(actionGroup);

  return header;
}



function handleCloseToZero(statsEntries, onSave) {
  const currentIn  = statsEntries.filter(e => e.type === 'IN').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const currentOut = statsEntries.filter(e => e.type === 'OUT').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const currentWith= statsEntries.filter(e => e.type === 'WITHDRAWAL').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const currentBal = currentIn - currentOut - currentWith;

  if (currentBal === 0) {
    alert('La caja ya se encuentra en saldo cero.');
    return;
  }
  if (confirm(`¿Estás seguro de cerrar la caja a cero?\nSe insertará un Retiro automático por $ ${currentBal.toLocaleString()} para saldar la caja.`)) {
    onSave({
      type: 'WITHDRAWAL',
      amount: currentBal,
      description: 'Cierre de Caja a Cero / Retiro Automático',
      date: Date.now()
    });
  }
}

function buildFiltersBar({ filters, onFilterChange }) {
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

  return filtersBar;
}

function buildStatsGrid(statsEntries) {
  const totalIn   = statsEntries.filter(e => e.type === 'IN').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalOut  = statsEntries.filter(e => e.type === 'OUT').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalWith = statsEntries.filter(e => e.type === 'WITHDRAWAL').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const balance   = totalIn - totalOut - totalWith;

  const statsGrid = el('div', {
    classes: ['stats-grid'],
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;'
  });

  statsGrid.appendChild(createStatCard('Saldo Selección', formatCurrency(balance), balance >= 0 ? 'var(--success)' : 'var(--danger)'));
  statsGrid.appendChild(createStatCard('Total Ingresos',   formatCurrency(totalIn),   'var(--success)'));
  statsGrid.appendChild(createStatCard('Total Egresos',    formatCurrency(totalOut),  'var(--danger)'));
  statsGrid.appendChild(createStatCard('Retiros / Ajustes',formatCurrency(totalWith), '#8b5cf6'));

  return statsGrid;
}

function buildTable(entries, { clients, producers, onSave, onDelete, title }) {
  const tableWrapper = el('div', { classes: ['glass-card', 'table-responsive'], style: 'padding: 0; margin-bottom: 1.5rem;' });
  const table = el('table', { style: 'width: 100%; min-width: 800px; border-collapse: collapse;' });

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
    entries.forEach(entry => tbody.appendChild(buildTableRow(entry, { clients, producers, onSave, onDelete, title })));
  }

  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  return tableWrapper;
}

function buildTableRow(entry, { clients, producers, onSave, onDelete, title }) {
  const tr = el('tr', { style: 'border-top: 1px solid var(--border); transition: background 0.2s;' });

  const entityName  = entry.clientName || entry.producerName || '-';
  const isIncome    = entry.type === 'IN';
  const isWith      = entry.type === 'WITHDRAWAL';
  const amountColor = isIncome ? 'var(--success)' : isWith ? '#8b5cf6' : 'var(--danger)';
  const amountSign  = isIncome ? '+' : '-';

  let diffHtml = '<span style="color: var(--text-muted);">-</span>';
  if (entry.countedAmount !== undefined && entry.countedAmount !== null) {
    const diff = entry.countedAmount - entry.amount;
    if (Math.abs(diff) < 0.01) diffHtml = `<span style="color: var(--text-main); font-weight: 600;">OK</span>`;
    else if (diff > 0)          diffHtml = `<span style="color: #10b981; font-weight: 600;">Sobra ${formatCurrency(diff)}</span>`;
    else                        diffHtml = `<span style="color: #ef4444; font-weight: 600;">Falta ${formatCurrency(Math.abs(diff))}</span>`;
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
    <td style="padding: 1rem; text-align: right; font-weight: 700; color: ${amountColor};">
      ${amountSign} ${formatCurrency(entry.amount)}
    </td>
    <td style="padding: 1rem; text-align: right;">${diffHtml}</td>
    <td style="padding: 1rem; text-align: right; white-space: nowrap; display: flex; gap: 0.5rem; justify-content: flex-end;">
      <button class="icon-btn print-btn" title="Imprimir A4">📄</button>
      <button class="icon-btn thermal-btn" title="Imprimir Térmico">🧾</button>
      <button class="icon-btn edit-btn" title="Editar">✏️</button>
      <button class="icon-btn delete-btn" style="color: var(--danger);" title="Eliminar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="pointer-events:none;"><path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/></svg>
      </button>
    </td>
  `;

  tr.addEventListener('click', (e) => {
    if (e.target.closest('.print-btn')) {
      if (entry.isSalary) printSalaryReceipt(entry, 'standard', title);
      else printReceipt(entry, 'standard');
    }
    if (e.target.closest('.thermal-btn')) {
      if (entry.isSalary) printSalaryReceipt(entry, 'thermal', title);
      else printReceipt(entry, 'thermal');
    }
    if (e.target.closest('.edit-btn')) {
      if (entry.isSalary) alert('Para editar un pago de sueldo, elimínelo y vuelva a crearlo.');
      else showEntryModal(entry, { clients, producers, onSave, title });
    }
    if (e.target.closest('.delete-btn')) onDelete(entry.id);
  });

  return tr;
}

function buildPagination(entries, pagination) {
  const pagContainer = el('div', {
    style: 'display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--border);'
  });

  pagContainer.appendChild(el('div', {
    text: `Mostrando ${entries.length} de ${pagination.totalItems} movimientos`,
    style: 'font-size: 0.85rem; color: var(--text-muted);'
  }));

  const btnGroup = el('div', { style: 'display: flex; gap: 0.5rem; align-items: center;' });

  const prevBtn = el('button', {
    classes: ['btn-secondary'],
    text: 'Anterior',
    style: 'padding: 0.5rem 1rem; font-size: 0.85rem;'
  });
  prevBtn.disabled = pagination.currentPage === 1;
  prevBtn.onclick = () => pagination.onPageChange(pagination.currentPage - 1);
  btnGroup.appendChild(prevBtn);

  btnGroup.appendChild(el('span', {
    text: `Página ${pagination.currentPage} de ${pagination.totalPages}`,
    style: 'font-size: 0.85rem; font-weight: 600; margin: 0 1rem;'
  }));

  const nextBtn = el('button', {
    classes: ['btn-secondary'],
    text: 'Siguiente',
    style: 'padding: 0.5rem 1rem; font-size: 0.85rem;'
  });
  nextBtn.disabled = pagination.currentPage === pagination.totalPages;
  nextBtn.onclick = () => pagination.onPageChange(pagination.currentPage + 1);
  btnGroup.appendChild(nextBtn);

  pagContainer.appendChild(btnGroup);
  return pagContainer;
}

// ---------------------------------------------------------------------------
// Componente auxiliar
// ---------------------------------------------------------------------------

function createStatCard(label, value, color) {
  const card = el('div', {
    classes: ['glass-card'],
    style: `padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; border-left: 4px solid ${color};`
  });
  card.appendChild(el('div', { text: label, style: 'font-size: 0.85rem; color: var(--text-muted); font-weight: 500;' }));
  card.appendChild(el('div', { text: value, style: `font-size: 1.5rem; font-weight: 700; color: ${color};` }));
  return card;
}
