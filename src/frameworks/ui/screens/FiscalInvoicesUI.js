/**
 * @file FiscalInvoicesUI.js
 * @description Pantalla de consulta, filtrado multicriterio (Fiscal con CAE vs Ventas No Fiscales), filtro por Condición IVA y exportación.
 * @module frameworks/ui/screens/FiscalInvoicesUI
 */
import * as XLSX from 'xlsx';
import { FiscalInvoiceRepository } from '../../../adapters/repositories/FiscalInvoiceRepository.js';
import { 
  VOUCHER_TYPE_NAMES, 
  openFiscalInvoiceDetailModal, 
  openPrintTicketModal 
} from '../components/FiscalInvoiceModals.js';

export class FiscalInvoicesUI {
  constructor(containerId = 'content') {
    this.container = document.getElementById(containerId);
    this.repository = new FiscalInvoiceRepository();

    this.allInvoices = [];
    this.filteredInvoices = [];
    this.clientsList = [];

    // Estado inicial de filtros
    this.filters = {
      puntoVenta: 'ALL',
      dateFrom: '',
      dateTo: '',
      clientSearch: 'ALL',
      cbteTipo: 'ALL',
      fiscalCondition: 'ALL', // 'ALL', 'FISCAL', 'NO_FISCAL'
      ivaCondition: 'ALL',    // 'ALL', 'RI', 'CF', 'EX_MO'
      textSearch: ''
    };
  }

  /**
   * Inicializa y renderiza la pantalla de comprobantes.
   */
  async render() {
    this.renderSkeleton();

    try {
      const [invoices, clients] = await Promise.all([
        this.repository.getInvoices(),
        this.repository.getClients()
      ]);

      this.allInvoices = invoices;
      this.clientsList = clients;

      this.applyFiltersAndRender();
    } catch (error) {
      console.error('[FiscalInvoicesUI] Error al cargar comprobantes:', error);
      if (this.container) {
        this.container.innerHTML = `
          <div class="card" style="padding: 2rem; text-align: center; color: var(--danger);">
            <h2>❌ Error de Carga</h2>
            <p>${error.message || 'No se pudieron recuperar los comprobantes.'}</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Reintentar</button>
          </div>
        `;
      }
    }
  }

  renderSkeleton() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">📄 Comprobantes Fiscales ARCA & Ventas</h1>
          <p class="view-subtitle">Consulta, filtrado por punto de venta, condición fiscal (con CAE vs sin CAE), condición frente al IVA y clientes.</p>
        </div>
      </div>
      <div class="card" style="padding: 3rem; text-align: center;">
        <div class="spinner" style="margin: 0 auto 1rem auto;"></div>
        <div style="color: var(--text-muted);">Cargando comprobantes...</div>
      </div>
    `;
  }

  applyFiltersAndRender() {
    this.filteredInvoices = this.repository.filterInvoices(this.allInvoices, this.filters);
    const metrics = this.repository.calculateMetrics(this.filteredInvoices);

    this.renderFullLayout(metrics);
  }

  renderFullLayout(metrics) {
    if (!this.container) return;

    const ptoVentas = Array.from(new Set(
      this.allInvoices.map(i => String(i.puntoVenta || i.ptoVta || i.storeId || '')).filter(Boolean)
    )).sort();

    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);

    const html = `
      <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <h1 class="view-title" style="font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            📄 Comprobantes Fiscales ARCA & Ventas
          </h1>
          <p class="view-subtitle" style="color: var(--text-muted); margin-top: 0.25rem; font-size: 0.9rem;">
            Consulta integrada de Total Facturado con CAE, Ventas No Fiscales, Condición frente al IVA y Puntos de Venta.
          </p>
        </div>
        <div>
          <button id="export-excel-btn" class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
            📊 Exportar a Excel (.xlsx)
          </button>
        </div>
      </div>

      <!-- Tarjetas de Métricas KPI Mejoradas -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        
        <!-- KPI 1: Total Facturado (Con CAE) -->
        <div class="card" style="padding: 1.25rem; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 14px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #4ade80; text-transform: uppercase;">🟢 Total Facturado (Con CAE)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #4ade80; margin-top: 0.3rem;">${formatCurrency(metrics.totalFacturadoFiscal)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
            Neto: ${formatCurrency(metrics.totalNetoFiscal)} | IVA: ${formatCurrency(metrics.totalIvaFiscal)} (${metrics.countFiscales} cbtes)
          </div>
        </div>

        <!-- KPI 2: Ventas No Fiscales (Sin CAE) -->
        <div class="card" style="padding: 1.25rem; background: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 14px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #facc15; text-transform: uppercase;">🟡 Ventas No Fiscales (Sin CAE)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #facc15; margin-top: 0.3rem;">${formatCurrency(metrics.totalVentasNoFiscales)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
            Acumulado de despachos internos (${metrics.countNoFiscales} registros)
          </div>
        </div>

        <!-- KPI 3: Total Notas de Crédito -->
        <div class="card" style="padding: 1.25rem; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 14px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #f87171; text-transform: uppercase;">🔻 Total Notas de Crédito</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #f87171; margin-top: 0.3rem;">${formatCurrency(metrics.totalNC)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">Reducciones de saldo</div>
        </div>

        <!-- KPI 4: Total Notas de Débito -->
        <div class="card" style="padding: 1.25rem; background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 14px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #c084fc; text-transform: uppercase;">🔺 Total Notas de Débito</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #c084fc; margin-top: 0.3rem;">${formatCurrency(metrics.totalND)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">Recargos / Aumentos</div>
        </div>
      </div>

      <!-- Panel de Filtros Multidimensionales -->
      <div class="card" style="padding: 1.25rem; margin-bottom: 1.5rem; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border); border-radius: 14px;">
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🔍 Filtros de Búsqueda, Condición Fiscal e IVA</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; align-items: end;">
          
          <!-- 1. Condición Fiscal (Con CAE vs Sin CAE) -->
          <div>
            <label style="font-size: 0.75rem; color: #60a5fa; font-weight: 700; display: block; margin-bottom: 0.3rem;">🏷️ Condición Fiscal</label>
            <select id="filter-fiscal-condition" class="form-control" style="width: 100%; border-color: rgba(96, 165, 250, 0.4);">
              <option value="ALL" ${this.filters.fiscalCondition === 'ALL' ? 'selected' : ''}>📋 Todos (Fiscal / No Fiscal)</option>
              <option value="FISCAL" ${this.filters.fiscalCondition === 'FISCAL' ? 'selected' : ''}>🟢 Solo Fiscales (Con CAE)</option>
              <option value="NO_FISCAL" ${this.filters.fiscalCondition === 'NO_FISCAL' ? 'selected' : ''}>🟡 Solo No Fiscales (Sin CAE)</option>
            </select>
          </div>

          <!-- 2. NUEVO: Condición frente al IVA del Receptor -->
          <div>
            <label style="font-size: 0.75rem; color: #a855f7; font-weight: 700; display: block; margin-bottom: 0.3rem;">🏛️ Condición Frente al IVA</label>
            <select id="filter-iva-condition" class="form-control" style="width: 100%; border-color: rgba(168, 85, 247, 0.4);">
              <option value="ALL" ${this.filters.ivaCondition === 'ALL' ? 'selected' : ''}>🌐 Todas las Condiciones</option>
              <option value="RI" ${this.filters.ivaCondition === 'RI' ? 'selected' : ''}>🏢 Resp. Inscripto (Facturas A)</option>
              <option value="CF" ${this.filters.ivaCondition === 'CF' ? 'selected' : ''}>👤 Consumidor Final (Facturas B)</option>
              <option value="EX_MO" ${this.filters.ivaCondition === 'EX_MO' ? 'selected' : ''}>🏛️ Monotributo / Exento (Facturas C)</option>
            </select>
          </div>

          <!-- 3. Punto de Venta Emisor -->
          <div>
            <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.3rem;">Punto de Venta</label>
            <select id="filter-pto-vta" class="form-control" style="width: 100%;">
              <option value="ALL">🏢 Todos los Puntos</option>
              ${ptoVentas.map(pto => `<option value="${pto}" ${this.filters.puntoVenta === pto ? 'selected' : ''}>Pto Vta ${String(pto).padStart(5, '0')}</option>`).join('')}
            </select>
          </div>

          <!-- 4. Rango Fecha Desde -->
          <div>
            <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.3rem;">Fecha Desde</label>
            <input type="date" id="filter-date-from" class="form-control" value="${this.filters.dateFrom}" style="width: 100%;" />
          </div>

          <!-- 5. Rango Fecha Hasta -->
          <div>
            <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.3rem;">Fecha Hasta</label>
            <input type="date" id="filter-date-to" class="form-control" value="${this.filters.dateTo}" style="width: 100%;" />
          </div>

          <!-- 6. Tipo Comprobante -->
          <div>
            <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.3rem;">Tipo Comprobante</label>
            <select id="filter-cbte-tipo" class="form-control" style="width: 100%;">
              <option value="ALL" ${this.filters.cbteTipo === 'ALL' ? 'selected' : ''}>📑 Todos los Tipos</option>
              <option value="FACTURAS" ${this.filters.cbteTipo === 'FACTURAS' ? 'selected' : ''}>🧾 Solo Facturas (A, B, C, M)</option>
              <option value="NC" ${this.filters.cbteTipo === 'NC' ? 'selected' : ''}>🔻 Solo Notas de Crédito</option>
              <option value="ND" ${this.filters.cbteTipo === 'ND' ? 'selected' : ''}>🔺 Solo Notas de Débito</option>
              <option value="1" ${this.filters.cbteTipo === '1' ? 'selected' : ''}>Factura A (1)</option>
              <option value="6" ${this.filters.cbteTipo === '6' ? 'selected' : ''}>Factura B (6)</option>
              <option value="11" ${this.filters.cbteTipo === '11' ? 'selected' : ''}>Factura C (11)</option>
            </select>
          </div>

          <!-- 7. Cliente / Receptor -->
          <div>
            <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.3rem;">Cliente / Receptor</label>
            <input type="text" id="filter-client" class="form-control" placeholder="Buscar CUIT / Nombre..." value="${this.filters.clientSearch === 'ALL' ? '' : this.filters.clientSearch}" style="width: 100%;" />
          </div>

          <!-- 8. Texto Libre -->
          <div>
            <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.3rem;">Búsqueda N° / CAE</label>
            <input type="text" id="filter-text" class="form-control" placeholder="00001-00000176, CAE..." value="${this.filters.textSearch}" style="width: 100%;" />
          </div>
        </div>
      </div>

      <!-- Tabla de Resultados -->
      <div class="card" style="padding: 0; overflow: hidden; border-radius: 14px; border: 1px solid var(--border);">
        <div style="overflow-x: auto;">
          <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead>
              <tr style="background: rgba(30, 41, 59, 0.8); color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; font-weight: 700; border-bottom: 1px solid var(--border);">
                <th style="padding: 0.85rem 1rem;">Fecha</th>
                <th style="padding: 0.85rem 1rem;">Pto Vta</th>
                <th style="padding: 0.85rem 1rem;">Tipo</th>
                <th style="padding: 0.85rem 1rem;">N° Comprobante</th>
                <th style="padding: 0.85rem 1rem;">Condición</th>
                <th style="padding: 0.85rem 1rem;">Receptor / Cliente</th>
                <th style="padding: 0.85rem 1rem; text-align: right;">Neto</th>
                <th style="padding: 0.85rem 1rem; text-align: right;">IVA</th>
                <th style="padding: 0.85rem 1rem; text-align: right;">Total</th>
                <th style="padding: 0.85rem 1rem; text-align: center;">CAE ARCA</th>
                <th style="padding: 0.85rem 1rem; text-align: center;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${this.renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  renderTableRows() {
    if (!this.filteredInvoices || this.filteredInvoices.length === 0) {
      return `
        <tr>
          <td colspan="11" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
            No se encontraron comprobantes que coincidan con los filtros aplicados.
          </td>
        </tr>
      `;
    }

    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);

    return this.filteredInvoices.map(inv => {
      const tipoCode = Number(inv.tipoComprobante || inv.cbteTipo || 0);
      const tipoName = VOUCHER_TYPE_NAMES[tipoCode] || `Tipo ${tipoCode}`;
      
      const ptoVtaPadded = String(inv.puntoVenta || inv.ptoVta || 1).padStart(5, '0');
      const fullCbteNumber = this.repository.formatFullVoucherNumber(inv);
      const isFiscal = this.repository.isInvoiceFiscal(inv);

      const dateFormatted = this.repository._parseInvoiceDate(inv);

      // Estilo por tipo comprobante
      let badgeStyle = 'background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);'; // Factura B
      if ([3, 8, 13, 53].includes(tipoCode)) {
        badgeStyle = 'background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3);'; // NC
      } else if ([2, 7, 12, 52].includes(tipoCode)) {
        badgeStyle = 'background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);'; // ND
      } else if (tipoCode === 1) {
        badgeStyle = 'background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3);'; // Factura A
      }

      // Badge Condición Fiscal
      const fiscalBadgeHtml = isFiscal
        ? `<span style="padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; background: rgba(34, 197, 94, 0.12); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.25);" title="Con CAE Asignado por ARCA">🟢 Fiscal</span>`
        : `<span style="padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; background: rgba(234, 179, 8, 0.12); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.25);" title="Sin CAE / Venta No Fiscal">🟡 No Fiscal</span>`;

      return `
        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.03); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
          <td style="padding: 0.85rem 1rem; color: var(--text-primary); font-weight: 500;">${dateFormatted}</td>
          <td style="padding: 0.85rem 1rem; color: var(--text-muted); font-family: monospace;">${ptoVtaPadded}</td>
          <td style="padding: 0.85rem 1rem;">
            <span style="display: inline-block; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; ${badgeStyle}">
              ${tipoName}
            </span>
          </td>
          <td style="padding: 0.85rem 1rem; font-family: monospace; font-weight: 700; color: var(--text-primary);">
            ${fullCbteNumber}
          </td>
          <td style="padding: 0.85rem 1rem;">
            ${fiscalBadgeHtml}
          </td>
          <td style="padding: 0.85rem 1rem;">
            <div style="font-weight: 600; color: var(--text-primary);">${inv.nombreReceptor || 'Consumidor Final'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${inv.nroDocReceptor ? `Doc: ${inv.nroDocReceptor}` : 'Sin Documento'}</div>
          </td>
          <td style="padding: 0.85rem 1rem; text-align: right; color: var(--text-muted);">${formatCurrency(inv.importeNetoGravado)}</td>
          <td style="padding: 0.85rem 1rem; text-align: right; color: var(--text-muted);">${formatCurrency(inv.importeIva)}</td>
          <td style="padding: 0.85rem 1rem; text-align: right; font-weight: 800; color: var(--text-primary);">
            ${formatCurrency(inv.importeTotal)}
          </td>
          <td style="padding: 0.85rem 1rem; text-align: center;">
            ${inv.cae ? `<span style="color: #4ade80; font-family: monospace; font-size: 0.8rem;" title="CAE: ${inv.cae}">✓ ${inv.cae.substring(0, 8)}...</span>` : `<span style="color: var(--text-muted); font-size: 0.75rem;">-</span>`}
          </td>
          <td style="padding: 0.85rem 1rem; text-align: center;">
            <div style="display: flex; justify-content: center; gap: 0.4rem;">
              <button class="btn btn-icon btn-view-detail" data-id="${inv.id}" title="Ver Detalle Completo" style="padding: 0.35rem 0.5rem; font-size: 0.8rem;">
                👁️
              </button>
              <button class="btn btn-icon btn-print-ticket" data-id="${inv.id}" title="Reimprimir Ticket" style="padding: 0.35rem 0.5rem; font-size: 0.8rem;">
                🖨️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  attachEventListeners() {
    const fiscalConditionSelect = document.getElementById('filter-fiscal-condition');
    const ivaConditionSelect = document.getElementById('filter-iva-condition');
    const ptoSelect = document.getElementById('filter-pto-vta');
    const dateFromInput = document.getElementById('filter-date-from');
    const dateToInput = document.getElementById('filter-date-to');
    const cbteTipoSelect = document.getElementById('filter-cbte-tipo');
    const clientInput = document.getElementById('filter-client');
    const textInput = document.getElementById('filter-text');

    const updateFilters = () => {
      this.filters.fiscalCondition = fiscalConditionSelect ? fiscalConditionSelect.value : 'ALL';
      this.filters.ivaCondition = ivaConditionSelect ? ivaConditionSelect.value : 'ALL';
      this.filters.puntoVenta = ptoSelect ? ptoSelect.value : 'ALL';
      this.filters.dateFrom = dateFromInput ? dateFromInput.value : '';
      this.filters.dateTo = dateToInput ? dateToInput.value : '';
      this.filters.cbteTipo = cbteTipoSelect ? cbteTipoSelect.value : 'ALL';
      this.filters.clientSearch = clientInput && clientInput.value.trim() !== '' ? clientInput.value.trim() : 'ALL';
      this.filters.textSearch = textInput ? textInput.value : '';

      this.applyFiltersAndRender();
    };

    if (fiscalConditionSelect) fiscalConditionSelect.addEventListener('change', updateFilters);
    if (ivaConditionSelect) ivaConditionSelect.addEventListener('change', updateFilters);
    if (ptoSelect) ptoSelect.addEventListener('change', updateFilters);
    if (dateFromInput) dateFromInput.addEventListener('change', updateFilters);
    if (dateToInput) dateToInput.addEventListener('change', updateFilters);
    if (cbteTipoSelect) cbteTipoSelect.addEventListener('change', updateFilters);
    if (clientInput) clientInput.addEventListener('input', updateFilters);
    if (textInput) textInput.addEventListener('input', updateFilters);

    const exportBtn = document.getElementById('export-excel-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportToExcel());
    }

    if (this.container) {
      this.container.querySelectorAll('.btn-view-detail').forEach(btn => {
        btn.addEventListener('click', () => {
          const invId = btn.getAttribute('data-id');
          const invoice = this.allInvoices.find(i => String(i.id) === String(invId));
          if (invoice) openFiscalInvoiceDetailModal(invoice);
        });
      });

      this.container.querySelectorAll('.btn-print-ticket').forEach(btn => {
        btn.addEventListener('click', () => {
          const invId = btn.getAttribute('data-id');
          const invoice = this.allInvoices.find(i => String(i.id) === String(invId));
          if (invoice) openPrintTicketModal(invoice);
        });
      });
    }
  }

  exportToExcel() {
    if (!this.filteredInvoices || this.filteredInvoices.length === 0) {
      alert('No hay comprobantes para exportar con los filtros actuales.');
      return;
    }

    const dataToExport = this.filteredInvoices.map(inv => ({
      'Fecha Emisión': this.repository._parseInvoiceDate(inv),
      'Punto de Venta': inv.puntoVenta || inv.ptoVta || 1,
      'Tipo Comprobante': VOUCHER_TYPE_NAMES[inv.tipoComprobante || inv.cbteTipo] || inv.tipoComprobante,
      'Número Comprobante': this.repository.formatFullVoucherNumber(inv),
      'Condición Fiscal': this.repository.isInvoiceFiscal(inv) ? 'Fiscal (Con CAE)' : 'No Fiscal (Sin CAE)',
      'Receptor': inv.nombreReceptor || 'Consumidor Final',
      'Doc / CUIT Receptor': inv.nroDocReceptor || 0,
      'Neto Gravado ($)': inv.importeNetoGravado || 0,
      'IVA ($)': inv.importeIva || 0,
      'Importe Total ($)': inv.importeTotal || 0,
      'CAE ARCA': inv.cae || 'N/A',
      'ID Venta': inv.saleId || inv.id || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comprobantes ARCA');

    const fileName = `Comprobantes_ARCA_${new Date().toISOString().substring(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}
