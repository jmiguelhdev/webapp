/**
 * @file DailyCashClosingsUI.js
 * @description Pantalla de Cierres de Caja Diarios por Sucursal (`daily_cash_closings`).
 * Implementa la sección "1. COMPARACIÓN GLOBAL: VENTAS SISTEMA VS. DECLARADO POR CAJEROS (CONSOLIDADO)"
 * idéntica al reporte Excel de escritorio (evitando falsos desvíos por errores de medio de pago o rendiciones cruzadas entre PC 1 y PC 2),
 * detección automática de múltiples PCs por carnicería (incluso cuando sourceDeviceId viene vacío en Firestore como en 'pampa roca'),
 * carga a petición (lazy-loading) de subcolecciones para ahorrar lecturas de Firestore y exportación a Excel (.xlsx).
 * @module frameworks/ui/screens/DailyCashClosingsUI
 */
import { DailyCashClosingRepository } from '../../../adapters/repositories/DailyCashClosingRepository.js';
import { DailyCashClosingAggregator } from '../../services/DailyCashClosingAggregator.js';
import { DailyClosingExcelExporter } from '../../services/DailyClosingExcelExporter.js';
import { parseCashExtractionBreakdown } from '../../../adapters/api/CashExtractionApi.js';
import { ToastService } from '../components/ToastService.js';

export class DailyCashClosingsUI {
  constructor(containerId = 'content') {
    this.container = document.getElementById(containerId);
    this.repository = new DailyCashClosingRepository();

    /** @type {Array<Object>} Documentos raíz crudos de Firestore */
    this.rawClosings = [];
    /** @type {Array<Object>} Lista consolidada por Día + Sucursal */
    this.consolidatedDays = [];
    /** @type {Array<string>} Nombres de carnicerías disponibles */
    this.butcheriesList = [];

    // Por defecto: últimos 30 días
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    this.filters = {
      butcheryName: 'ALL',
      terminalId: 'ALL',
      closingType: 'ALL', // 'ALL' | 'PARCIAL' | 'GENERAL'
      dateFrom: DailyCashClosingAggregator.toArgentinaDateString(thirtyDaysAgo.getTime()),
      dateTo: DailyCashClosingAggregator.toArgentinaDateString(today.getTime()),
      cutSearch: ''
    };

    // Estado del cierre diario actualmente expandido en detalle
    this.selectedDayId = null;
    this.selectedDetailTerminal = 'ALL'; // 'ALL' o deviceId puntual ('PC 1', 'PC 2', etc.) dentro del detalle
    this.activeDetailTab = 'resumen'; // 'resumen' | 'cortes' | 'retiros' | 'materia_cta' | 'pos_arca'

    // Datos cargados a petición para el cierre expandido
    this.loadedDetailData = {
      loading: false,
      cuts: null,
      extractions: null,
      rawMaterials: null,
      accountSales: null,
      collections: null,
      fiscalPosGroups: null
    };
  }

  /**
   * Punto de entrada principal para renderizar la vista.
   */
  async render() {
    if (Array.isArray(this.rawClosings) && this.rawClosings.length > 0) {
      this.processAndRender();
    } else {
      this.renderSkeleton();
    }

    try {
      const { startMs, endMs } = this._getDateRangeEpochMs(this.filters.dateFrom, this.filters.dateTo);

      const [closings, establishments] = await Promise.all([
        this.repository.getClosings(startMs, endMs, 'ALL'),
        this.repository.getEstablishmentsNames()
      ]);

      this.rawClosings = closings;

      // Combinar nombres de carnicerías de los cierres + establecimientos registrados
      const branchSet = new Set(establishments);
      closings.forEach(c => {
        if (c.butcheryName) branchSet.add(String(c.butcheryName).trim());
      });
      this.butcheriesList = Array.from(branchSet).filter(Boolean).sort();

      this.processAndRender();
    } catch (error) {
      console.error('[DailyCashClosingsUI] Error cargando cierres de caja:', error);
      if (this.container) {
        this.container.innerHTML = `
          <div class="card" style="padding: 2rem; text-align: center; color: var(--danger);">
            <h2>❌ Error al cargar Cierres de Caja</h2>
            <p>${error.message || 'No se pudieron recuperar los cierres diarios de Firestore.'}</p>
            <button class="btn btn-primary" id="retry-closings-btn">Reintentar</button>
          </div>
        `;
        const retryBtn = document.getElementById('retry-closings-btn');
        if (retryBtn) retryBtn.addEventListener('click', () => this.render());
      }
    }
  }

  renderSkeleton() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">🏪 Cierres de Caja Diarios por Sucursal (Multi-PC)</h1>
          <p class="view-subtitle">Consolidando terminales por carnicería y arqueos diarios desde Cloud Firestore...</p>
        </div>
      </div>
      <div class="card" style="padding: 3rem; text-align: center;">
        <div class="spinner" style="margin: 0 auto 1rem auto;"></div>
        <div style="color: var(--text-muted);">Consultando documentos raíz de cierres diarios (lectura optimizada)...</div>
      </div>
    `;
  }

  /**
   * Filtra los documentos raíz según los controles activos y ejecuta la consolidación Multi-PC por Día y Sucursal.
   */
  processAndRender() {
    const filteredRaw = this.rawClosings.filter(doc => {
      if (this.filters.butcheryName !== 'ALL') {
        const bName = String(doc.butcheryName || '').trim().toLowerCase();
        if (bName !== this.filters.butcheryName.toLowerCase()) return false;
      }
      if (this.filters.closingType !== 'ALL') {
        const cType = String(doc.closingType || 'GENERAL').toUpperCase();
        if (cType !== this.filters.closingType) return false;
      }
      return true;
    });

    // Primero consolidamos por día y sucursal para que assignSessionsToTerminals reconstruya PC 1, PC 2, etc.
    let allDays = DailyCashClosingAggregator.groupByDayAndButchery(filteredRaw);

    // Si el usuario filtró en la barra superior por una PC específica (ej. 'PC 1' o 'PC 2'), filtrar días que tengan esa PC
    if (this.filters.terminalId !== 'ALL') {
      allDays = allDays.filter(day => day.terminals.some(t => t.deviceId === this.filters.terminalId));
      this.selectedDetailTerminal = this.filters.terminalId;
    }

    this.consolidatedDays = allDays;

    // Si no hay un día seleccionado o ya no está en la lista filtrada, seleccionar el primero disponible
    if (this.consolidatedDays.length > 0) {
      const stillExists = this.consolidatedDays.some(d => d.id === this.selectedDayId);
      if (!stillExists) {
        this.selectedDayId = this.consolidatedDays[0].id;
        this.selectedDetailTerminal = this.filters.terminalId !== 'ALL' ? this.filters.terminalId : 'ALL';
        this.activeDetailTab = 'resumen';
        this._resetLoadedDetailData();
      }
    } else {
      this.selectedDayId = null;
      this._resetLoadedDetailData();
    }

    this.renderFullLayout();
  }

  _resetLoadedDetailData() {
    this.loadedDetailData = {
      loading: false,
      cuts: null,
      extractions: null,
      rawMaterials: null,
      accountSales: null,
      collections: null,
      fiscalPosGroups: null
    };
  }

  _getDateRangeEpochMs(dateFromStr, dateToStr) {
    let startMs = 0;
    let endMs = Date.now() + 86400000;

    if (dateFromStr) {
      startMs = new Date(`${dateFromStr}T00:00:00-03:00`).getTime();
    }
    if (dateToStr) {
      endMs = new Date(`${dateToStr}T23:59:59.999-03:00`).getTime();
    }
    return { startMs, endMs };
  }

  _formatCurrency(val) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(val || 0));
  }

  _formatSignedCurrency(val) {
    const n = Number(val || 0);
    const formatted = this._formatCurrency(Math.abs(n));
    if (Math.abs(n) < 0.005) return this._formatCurrency(0);
    return n > 0 ? `+${formatted}` : `-${formatted}`;
  }

  _formatWeight(kg) {
    return `${Number(kg || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
  }

  renderFullLayout() {
    if (!this.container) return;

    // Extraer lista de terminales reconstruidas disponibles (PC 1, PC 2, etc.)
    const terminalSet = new Set();
    this.consolidatedDays.forEach(d => {
      (d.terminals || []).forEach(t => terminalSet.add(t.deviceId));
    });
    const availableTerminals = Array.from(terminalSet).sort();

    // Calcular KPIs globales del conjunto filtrado usando la Comparación Global Unificada
    const globalMetrics = this.consolidatedDays.reduce((acc, day) => {
      const gc = day.globalComparison || {};
      acc.totalSales += Number(day.totalSalesAmount || 0);
      acc.totalKg += Number(day.totalWeightKg || 0);
      acc.totalNetoSistema += Number(gc.totalNetoSistemaARendir || 0);
      acc.totalDeclaradoCajeros += Number(gc.totalGeneralDeclaradoPorCajeros || 0);
      acc.totalGlobalDiff += Number(gc.globalDifference || 0);
      acc.totalExtractions += Number(day.totalExtractions || 0);
      acc.totalGrossMargin += Number(day.grossMarginAmount || 0);
      acc.totalRawKg += Number(day.rawMaterialTotalKg || 0);
      return acc;
    }, {
      totalSales: 0,
      totalKg: 0,
      totalNetoSistema: 0,
      totalDeclaradoCajeros: 0,
      totalGlobalDiff: 0,
      totalExtractions: 0,
      totalGrossMargin: 0,
      totalRawKg: 0
    });

    const selectedDay = this.consolidatedDays.find(d => d.id === this.selectedDayId) || null;

    const diffColor = Math.abs(globalMetrics.totalGlobalDiff) < 1
      ? '#4ade80'
      : (globalMetrics.totalGlobalDiff > 0 ? '#60a5fa' : '#f87171');
    const diffBg = Math.abs(globalMetrics.totalGlobalDiff) < 1
      ? 'rgba(34, 197, 94, 0.08)'
      : (globalMetrics.totalGlobalDiff > 0 ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.08)');
    const diffBorder = Math.abs(globalMetrics.totalGlobalDiff) < 1
      ? 'rgba(34, 197, 94, 0.25)'
      : (globalMetrics.totalGlobalDiff > 0 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(239, 68, 68, 0.25)');

    const html = `
      <!-- Encabezado Principal -->
      <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
        <div>
          <h1 class="view-title" style="font-size: 1.7rem; font-weight: 800; color: var(--text-primary); margin: 0;">
            🏪 Cierres de Caja Diarios por Sucursal
          </h1>
          <p class="view-subtitle" style="color: var(--text-muted); margin-top: 0.25rem; font-size: 0.88rem;">
            Consolidación automática Multi-PC por carnicería, Comparación Global (Sistema vs. Declarado por Cajeros) y exportación a Excel.
          </p>
        </div>
        <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
          <button id="btn-quick-today" class="btn btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.75rem;">📅 Hoy</button>
          <button id="btn-quick-yesterday" class="btn btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.75rem;">⏮️ Ayer</button>
          <button id="btn-quick-7days" class="btn btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.75rem;">📆 7 Días</button>
          <button id="btn-quick-month" class="btn btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.75rem;">🗓️ Este Mes</button>
          <button id="btn-refresh-closings" class="btn btn-primary" style="font-size: 0.82rem; padding: 0.45rem 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
            🔄 Actualizar
          </button>
        </div>
      </div>

      <!-- Barra de Filtros Colapsable -->
      <div class="collapsible-panel ${this._filtersCollapsed ? 'is-collapsed' : ''}" id="closings-filter-panel" style="margin-bottom: 1.25rem; border-radius: 14px;">
        <div class="collapsible-header" id="toggle-closings-filters" title="Clic para mostrar/ocultar filtros">
          <div class="collapsible-title" style="font-size: 0.85rem;">
            <span>🎛️ Filtros de Sucursal, Terminal y Período</span>
            <span style="font-size: 0.72rem; font-weight: 600; color: var(--text-muted); margin-left: 0.4rem;">
              (${this.filters.butcheryName === 'ALL' ? 'Todas las sucursales' : this.filters.butcheryName} • ${this.filters.dateFrom} → ${this.filters.dateTo})
            </span>
          </div>
          <span class="collapsible-chevron">▾</span>
        </div>
        <div class="collapsible-body-wrapper">
          <div class="collapsible-body-inner">
            <div style="padding: 1.15rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 0.9rem; align-items: end;">
              
              <!-- 1. Carnicería / Sucursal -->
              <div>
                <label style="font-size: 0.74rem; color: #3b82f6; font-weight: 700; display: block; margin-bottom: 0.3rem;">🏪 Sucursal / Carnicería</label>
                <select id="filter-butchery" class="form-control" style="width: 100%; border-color: rgba(59, 130, 246, 0.4);">
                  <option value="ALL" ${this.filters.butcheryName === 'ALL' ? 'selected' : ''}>🌐 Todas las Sucursales</option>
                  ${this.butcheriesList.map(b => `<option value="${b}" ${this.filters.butcheryName === b ? 'selected' : ''}>🥩 ${b}</option>`).join('')}
                </select>
              </div>

              <!-- 2. Terminal / PC de Caja -->
              <div>
                <label style="font-size: 0.74rem; color: #9333ea; font-weight: 700; display: block; margin-bottom: 0.3rem;">🖥️ Terminal / PC</label>
                <select id="filter-terminal" class="form-control" style="width: 100%; border-color: rgba(147, 51, 234, 0.4);">
                  <option value="ALL" ${this.filters.terminalId === 'ALL' ? 'selected' : ''}>🖥️ Todas las PCs (Consolidado)</option>
                  ${availableTerminals.map(t => `<option value="${t}" ${this.filters.terminalId === t ? 'selected' : ''}>💻 ${t}</option>`).join('')}
                </select>
              </div>

              <!-- 3. Tipo de Turno -->
              <div>
                <label style="font-size: 0.74rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.3rem;">⏱️ Turno</label>
                <select id="filter-closing-type" class="form-control" style="width: 100%;">
                  <option value="ALL" ${this.filters.closingType === 'ALL' ? 'selected' : ''}>📋 Jornada Completa (Todos)</option>
                  <option value="PARCIAL" ${this.filters.closingType === 'PARCIAL' ? 'selected' : ''}>🌅 Turno Mañana (PARCIAL)</option>
                  <option value="GENERAL" ${this.filters.closingType === 'GENERAL' ? 'selected' : ''}>🌙 Turno Tarde / Cierre (GENERAL)</option>
                </select>
              </div>

              <!-- 4. Fecha Desde -->
              <div>
                <label style="font-size: 0.74rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.3rem;">📅 Fecha Desde</label>
                <input type="date" id="filter-date-from" class="form-control" value="${this.filters.dateFrom}" style="width: 100%;" />
              </div>

              <!-- 5. Fecha Hasta -->
              <div>
                <label style="font-size: 0.74rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.3rem;">📅 Fecha Hasta</label>
                <input type="date" id="filter-date-to" class="form-control" value="${this.filters.dateTo}" style="width: 100%;" />
              </div>

              <!-- 6. Botón Consultar Rango -->
              <div>
                <button id="btn-query-dates" class="btn btn-primary" style="width: 100%; font-weight: 700; padding: 0.55rem;">
                  🔍 Filtrar Período
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tarjetas Ejecutivas KPI (Basadas en Comparación Global Consolidada) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(225px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        
        <div class="card" style="padding: 1.15rem; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 14px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #4ade80; text-transform: uppercase;">💰 Total Neto Sistema a Rendir</div>
          <div style="font-size: 1.45rem; font-weight: 800; color: #4ade80; margin-top: 0.25rem;">${this._formatCurrency(globalMetrics.totalNetoSistema)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
            📦 Ventas brutas: ${this._formatCurrency(globalMetrics.totalSales)} (${this._formatWeight(globalMetrics.totalKg)})
          </div>
        </div>

        <div class="card" style="padding: 1.15rem; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 14px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #60a5fa; text-transform: uppercase;">🧾 Total Declarado por Cajeros</div>
          <div style="font-size: 1.45rem; font-weight: 800; color: #60a5fa; margin-top: 0.25rem;">${this._formatCurrency(globalMetrics.totalDeclaradoCajeros)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
            🔒 Retiros efectivo: ${this._formatCurrency(globalMetrics.totalExtractions)} + Posnet/Cheques
          </div>
        </div>

        <div class="card" style="padding: 1.15rem; background: ${diffBg}; border: 1px solid ${diffBorder}; border-radius: 14px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: ${diffColor}; text-transform: uppercase;">⚖️ Diferencia Global (Declarado - Sistema)</div>
          <div style="font-size: 1.45rem; font-weight: 800; color: ${diffColor}; margin-top: 0.25rem;">
            ${this._formatSignedCurrency(globalMetrics.totalGlobalDiff)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${Math.abs(globalMetrics.totalGlobalDiff) < 1 ? '✓ Cajas cuadradas (unificando PCs y medios)' : (globalMetrics.totalGlobalDiff > 0 ? 'Sobrante global consolidado' : 'Faltante global consolidado')}
          </div>
        </div>

        <div class="card" style="padding: 1.15rem; background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 14px;">
          <div style="font-size: 0.72rem; font-weight: 700; color: #c084fc; text-transform: uppercase;">🥩 Margen Bruto Operativo</div>
          <div style="font-size: 1.45rem; font-weight: 800; color: #c084fc; margin-top: 0.25rem;">${this._formatCurrency(globalMetrics.totalGrossMargin)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
            🐂 Materia Prima: ${this._formatWeight(globalMetrics.totalRawKg)}
          </div>
        </div>
      </div>

      <!-- Layout Maestro-Detalle: Lista de Días/Sucursales y Panel de Inspección Profunda -->
      <div style="display: grid; grid-template-columns: minmax(325px, 385px) 1fr; gap: 1.25rem; align-items: start;">
        
        <!-- Columna Izquierda: Lista de Cierres Diarios Agrupados por Fecha y Carnicería -->
        <div class="card" style="padding: 1rem; border-radius: 14px; border: 1px solid var(--border); max-height: 820px; overflow-y: auto;">
          <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
            <span>📋 Jornadas por Carnicería (${this.consolidatedDays.length})</span>
            <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">Clic para auditar</span>
          </div>
          ${this.renderConsolidatedDaysList()}
        </div>

        <!-- Columna Derecha: Panel Detallado del Cierre Diario Seleccionado -->
        <div id="closing-detail-panel">
          ${selectedDay ? this.renderSelectedDayDetail(selectedDay) : `
            <div class="card" style="padding: 3rem; text-align: center; color: var(--text-muted); border-radius: 14px;">
              Selecciona un cierre diario de la lista izquierda para inspeccionar su Comparación Global, terminales y cortes.
            </div>
          `}
        </div>

      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * Renderiza la lista lateral de cierres agrupados por Día y Carnicería.
   */
  renderConsolidatedDaysList() {
    if (this.consolidatedDays.length === 0) {
      return `
        <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          No se encontraron cierres de caja para los filtros seleccionados.
        </div>
      `;
    }

    return this.consolidatedDays.map(day => {
      const isSelected = day.id === this.selectedDayId;
      const globalDiff = Number(day.globalComparison?.globalDifference || 0);
      const hasShortage = globalDiff < -1;
      const hasSurplus = globalDiff > 1;

      const diffBadge = hasShortage
        ? `<span style="padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.68rem; font-weight: 700; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);">🔴 Dif Global: ${this._formatCurrency(globalDiff)}</span>`
        : (hasSurplus
          ? `<span style="padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.68rem; font-weight: 700; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);">🔵 +${this._formatCurrency(globalDiff)}</span>`
          : `<span style="padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.68rem; font-weight: 700; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3);">🟢 Caja Exacta</span>`);

      const multiPcBadge = day.terminalCount > 1
        ? `<span style="padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.68rem; font-weight: 700; background: rgba(168, 85, 247, 0.18); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.35);">🖥️ ${day.terminalCount} PCs (${day.sessionCount} cierres)</span>`
        : `<span style="padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.68rem; font-weight: 600; background: rgba(255, 255, 255, 0.05); color: var(--text-muted);">💻 1 PC (${day.sessionCount} cierre${day.sessionCount > 1 ? 's' : ''})</span>`;

      return `
        <div class="day-closing-item" data-id="${day.id}" style="
          padding: 0.9rem;
          margin-bottom: 0.65rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.18s ease;
          background: ${isSelected ? 'rgba(59, 130, 246, 0.14)' : 'rgba(30, 41, 59, 0.45)'};
          border: 1px solid ${isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)'};
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span style="font-weight: 800; font-size: 0.92rem; color: var(--text-primary);">🥩 ${day.butcheryName}</span>
            <span style="font-family: monospace; font-size: 0.78rem; font-weight: 700; color: #93c5fd;">📅 ${day.dateStr}</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
            <div>
              <div style="font-size: 1.05rem; font-weight: 800; color: #4ade80;">${this._formatCurrency(day.totalSalesAmount)}</div>
              <div style="font-size: 0.73rem; color: var(--text-muted);">${this._formatWeight(day.totalWeightKg)} vendidos</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.71rem; color: var(--text-muted);">Declarado Cajeros:</div>
              <div style="font-size: 0.82rem; font-weight: 700; color: #60a5fa;">${this._formatCurrency(day.globalComparison?.totalGeneralDeclaradoPorCajeros || 0)}</div>
            </div>
          </div>

          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              ${multiPcBadge}
              ${diffBadge}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Renderiza el panel derecho con el detalle completo del Día + Sucursal seleccionado,
   * permitiendo conmutar entre el Consolidado de todas las PCs o una PC individual,
   * y navegar por las pestañas bajo demanda.
   */
  renderSelectedDayDetail(day) {
    const activeData = this.selectedDetailTerminal === 'ALL'
      ? day
      : (day.terminals.find(t => t.deviceId === this.selectedDetailTerminal) || day);

    const isConsolidated = this.selectedDetailTerminal === 'ALL';

    return `
      <div class="card" style="padding: 1.35rem; border-radius: 14px; border: 1px solid var(--border);">
        
        <!-- Cabecera del Cierre Seleccionado + Botón Excel -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 1.1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
              <h2 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: var(--text-primary);">
                🏪 ${day.butcheryName} — <span style="color: #60a5fa; font-family: monospace;">${day.dateStr}</span>
              </h2>
              <span style="padding: 0.25rem 0.65rem; border-radius: 99px; font-size: 0.74rem; font-weight: 700; background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3);">
                🖥️ ${day.terminalCount} PC(s) detectada(s) / ${day.sessionCount} Reporte(s) en Firestore
              </span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">
              👤 Operadores del día: <strong>${(day.operators || []).join(', ') || 'No especificado'}</strong>
            </div>
          </div>

          <div style="display: flex; gap: 0.6rem;">
            <button id="btn-export-day-excel" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.45rem; font-weight: 700; background: #16a34a; border-color: #15803d;">
              📥 Exportar Cierre a Excel (.xlsx)
            </button>
          </div>
        </div>

        <!-- Selector de Terminal / PC Física (Multi-PC Switcher) -->
        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
            🖥️ Seleccionar Alcance (Consolidado del Local vs. Terminal Individual):
          </div>
          <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
            <button class="btn-select-detail-pc" data-pc="ALL" style="
              padding: 0.55rem 0.9rem;
              border-radius: 10px;
              cursor: pointer;
              font-size: 0.8rem;
              font-weight: 700;
              border: 1px solid ${isConsolidated ? '#3b82f6' : 'var(--border)'};
              background: ${isConsolidated ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)'};
              color: ${isConsolidated ? '#60a5fa' : 'var(--text-primary)'};
            ">
              🌐 Consolidado Sucursal (${day.terminalCount} PCs / ${day.sessionCount} turnos) — Ventas: ${this._formatCurrency(day.totalSalesAmount)}
            </button>

            ${day.terminals.map(t => {
              const isPcActive = this.selectedDetailTerminal === t.deviceId;
              const tGlobDiff = Number(t.globalComparison?.globalDifference || 0);
              const pcDiffColor = Math.abs(tGlobDiff) < 1 ? '#4ade80' : (tGlobDiff < 0 ? '#f87171' : '#60a5fa');
              return `
                <button class="btn-select-detail-pc" data-pc="${t.deviceId}" style="
                  padding: 0.55rem 0.9rem;
                  border-radius: 10px;
                  cursor: pointer;
                  font-size: 0.8rem;
                  font-weight: 700;
                  border: 1px solid ${isPcActive ? '#a855f7' : 'var(--border)'};
                  background: ${isPcActive ? 'rgba(168, 85, 247, 0.2)' : 'rgba(30, 41, 59, 0.5)'};
                  color: ${isPcActive ? '#e9d5ff' : 'var(--text-primary)'};
                ">
                  💻 ${t.deviceId} (${t.sessionCount} cierre${t.sessionCount > 1 ? 's' : ''}) — Ventas: ${this._formatCurrency(t.totalSalesAmount)}
                  <span style="margin-left: 0.35rem; color: ${pcDiffColor}; font-size: 0.72rem;">
                    [Declarado: ${this._formatCurrency(t.globalComparison?.totalGeneralDeclaradoPorCajeros || 0)}]
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Barra de Pestañas (Carga a Petición para Subcolecciones) -->
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; border-bottom: 1px solid var(--border); padding-bottom: 0.65rem; margin-bottom: 1.2rem;">
          ${this._renderTabButton('resumen', '📊 Hoja 1 y 2: Comparación Global y Multi-PC')}
          ${this._renderTabButton('cortes', '🥩 Hoja 3: Ventas por Corte (A Petición)')}
          ${this._renderTabButton('retiros', '🔒 Hoja 4: Sobres de Retiro y Billetes (A Petición)')}
          ${this._renderTabButton('materia_cta', '🐂 Hoja 5: Materia Prima y Cta. Cte. (A Petición)')}
          ${this._renderTabButton('pos_arca', '🏛️ Puntos de Venta Fiscal ARCA (A Petición)')}
        </div>

        <!-- Contenido Dinámico de la Pestaña Activa -->
        <div id="detail-tab-body">
          ${this.renderActiveTabContent(day, activeData)}
        </div>

      </div>
    `;
  }

  _renderTabButton(tabId, label) {
    const isActive = this.activeDetailTab === tabId;
    return `
      <button class="btn-closing-tab" data-tab="${tabId}" style="
        padding: 0.5rem 0.9rem;
        border-radius: 9px;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 700;
        transition: all 0.15s;
        border: 1px solid ${isActive ? 'rgba(59, 130, 246, 0.5)' : 'transparent'};
        background: ${isActive ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)'};
        color: ${isActive ? '#60a5fa' : 'var(--text-muted)'};
      ">
        ${label}
      </button>
    `;
  }

  /**
   * Renderiza el contenido interno según la pestaña activa.
   */
  renderActiveTabContent(day, activeData) {
    if (this.loadedDetailData.loading) {
      return `
        <div style="padding: 2.5rem; text-align: center;">
          <div class="spinner" style="margin: 0 auto 0.8rem auto;"></div>
          <div style="color: var(--text-muted); font-size: 0.85rem;">
            Descargando subcolección bajo demanda desde Cloud Firestore...
          </div>
        </div>
      `;
    }

    switch (this.activeDetailTab) {
      case 'resumen':
        return this.renderTabResumen(day, activeData);
      case 'cortes':
        return this.renderTabCortes(day, activeData);
      case 'retiros':
        return this.renderTabRetiros(day, activeData);
      case 'materia_cta':
        return this.renderTabMateriaPrimaYCtaCte(day, activeData);
      case 'pos_arca':
        return this.renderTabPuntoVentaArca(day);
      default:
        return this.renderTabResumen(day, activeData);
    }
  }

  /**
   * PESTAÑA 1: Espeja exactamente las Hojas 1 y 2 de DesktopExcelExporter.kt:
   * - 1. COMPARACIÓN GLOBAL: VENTAS SISTEMA VS. DECLARADO POR CAJEROS (CONSOLIDADO)
   * - 2. RESUMEN GENERAL DE VENTAS POR MEDIO DE PAGO (INFORMATIVO SEGÚN SISTEMA)
   * - 3 y 4. ARQUEO DE EFECTIVO Y ELECTRÓNICOS (INFORMATIVO)
   * - 5. COMPARATIVO INDIVIDUAL POR TERMINAL (PC) Y POR CADA TURNO/CIERRE SUBIDO
   */
  renderTabResumen(day, activeData) {
    const gc = activeData.globalComparison || DailyCashClosingAggregator.computeGlobalComparison(activeData);
    const scopeName = this.selectedDetailTerminal === 'ALL'
      ? `CONSOLIDADO SUCURSAL (${day.terminalCount} PCs / ${day.sessionCount} Turnos)`
      : `${this.selectedDetailTerminal} (${activeData.sessionCount || 1} Turno/s)`;

    const formatDiff = (diff) => {
      const val = Number(diff || 0);
      if (Math.abs(val) < 1) return `<span style="color: #4ade80; font-weight: 700;">$ 0,00 (OK)</span>`;
      if (val > 0) return `<span style="color: #60a5fa; font-weight: 800;">+${this._formatCurrency(val)} (Sobrante)</span>`;
      return `<span style="color: #f87171; font-weight: 800;">${this._formatCurrency(val)} (Faltante)</span>`;
    };

    const globalDiffVal = Number(gc.globalDifference || 0);
    const isExact = Math.abs(globalDiffVal) < 1;
    const isSurplus = globalDiffVal >= 1;
    const globalBannerBg = isExact
      ? 'rgba(34, 197, 94, 0.14)'
      : (isSurplus ? 'rgba(59, 130, 246, 0.14)' : 'rgba(239, 68, 68, 0.14)');
    const globalBannerBorder = isExact
      ? 'rgba(34, 197, 94, 0.4)'
      : (isSurplus ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)');
    const globalBannerColor = isExact ? '#4ade80' : (isSurplus ? '#60a5fa' : '#f87171');

    const totSales = Number(activeData.totalSalesAmount || 0);
    const pct = (v) => totSales > 0 ? `${((Number(v || 0) / totSales) * 100).toFixed(1)}%` : '0.0%';

    return `
      <!-- =================================================================== -->
      <!-- BLOQUE 1: COMPARACIÓN GLOBAL: VENTAS SISTEMA VS. DECLARADO POR CAJEROS -->
      <!-- =================================================================== -->
      <div style="background: rgba(15, 23, 42, 0.72); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 14px; padding: 1.2rem; margin-bottom: 1.4rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.85rem;">
          <div>
            <h3 style="margin: 0; font-size: 1rem; font-weight: 800; color: #93c5fd; letter-spacing: 0.01em;">
              ⚖️ 1. COMPARACIÓN GLOBAL: VENTAS SISTEMA VS. DECLARADO POR CAJEROS (${scopeName})
            </h3>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.77rem; color: var(--text-muted);">
              Unifica todos los medios de pago cobrados y todas las terminales del local. Compensa automáticamente cuando un operador registra Efectivo por Digital (o viceversa) o cuando la PC 2 rinde su recaudación en la PC 1.
            </p>
          </div>
          <span style="padding: 0.3rem 0.75rem; border-radius: 8px; font-size: 0.76rem; font-weight: 800; background: ${globalBannerBg}; color: ${globalBannerColor}; border: 1px solid ${globalBannerBorder};">
            ${gc.status}: ${this._formatSignedCurrency(globalDiffVal)}
          </span>
        </div>

        <!-- Dos columnas lado a lado: Lado Sistema vs Lado Declarado por Cajeros -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          
          <!-- COLUMNA IZQUIERDA: LADO REGISTRADO POR SISTEMA ($) -->
          <div style="background: rgba(30, 41, 59, 0.55); border: 1px solid var(--border); border-radius: 10px; padding: 0.95rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 0.76rem; font-weight: 800; color: #60a5fa; text-transform: uppercase; border-bottom: 1px solid var(--border); padding-bottom: 0.45rem; margin-bottom: 0.65rem;">
                🖥️ REGISTRADO POR SISTEMA ($)
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.82rem;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-primary);">(+) Total Ventas Registradas por Sistema:</span>
                  <span style="font-weight: 700;">${this._formatCurrency(gc.systemTotalSales)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">(-) Ventas a Cuenta Corriente (Saldo Impago):</span>
                  <span style="font-weight: 700; color: #facc15;">-${this._formatCurrency(gc.systemDebtSales)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">(+) Cobranzas de Cta. Cte. Recibidas en Caja:</span>
                  <span style="font-weight: 700; color: #4ade80;">+${this._formatCurrency(gc.systemAccountCollections)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">(-) Gastos y Egresos Abonados desde Caja:</span>
                  <span style="font-weight: 700; color: #f87171;">-${this._formatCurrency(gc.systemExpenses)}</span>
                </div>
              </div>
            </div>

            <div style="margin-top: 0.85rem; padding-top: 0.65rem; border-top: 2px solid rgba(96, 165, 250, 0.35); display: flex; justify-content: space-between; align-items: baseline;">
              <div>
                <div style="font-size: 0.8rem; font-weight: 800; color: #93c5fd;">(=) TOTAL NETO SISTEMA A RENDIR</div>
                <div style="font-size: 0.69rem; color: var(--text-muted);">Ventas - Cta. Cte. + Cobranzas - Gastos</div>
              </div>
              <div style="font-size: 1.15rem; font-weight: 900; color: #93c5fd;">
                ${this._formatCurrency(gc.totalNetoSistemaARendir)}
              </div>
            </div>
          </div>

          <!-- COLUMNA DERECHA: LADO DECLARADO POR CAJEROS ($) -->
          <div style="background: rgba(30, 41, 59, 0.55); border: 1px solid var(--border); border-radius: 10px; padding: 0.95rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 0.76rem; font-weight: 800; color: #4ade80; text-transform: uppercase; border-bottom: 1px solid var(--border); padding-bottom: 0.45rem; margin-bottom: 0.65rem;">
                🧾 DECLARADO POR CAJEROS ($)
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.45rem; font-size: 0.82rem;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-primary);">(+) Retiros de Efectivo (Sobres a Seguridad):</span>
                  <span style="font-weight: 700;">+${this._formatCurrency(gc.declaredExtractions)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">(-) Fondo Inicial de Cajas (Apertura):</span>
                  <span style="font-weight: 700; color: #f87171;">-${this._formatCurrency(gc.declaredInitialCash)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">(+) Cambio Final en Cajas (Remanente):</span>
                  <span style="font-weight: 700;">+${this._formatCurrency(gc.declaredActualCash)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.74rem; color: #a7f3d0; background: rgba(16, 185, 129, 0.08); padding: 0.2rem 0.45rem; border-radius: 5px;">
                  <span>↳ Subtotal Efectivo Neto Declarado:</span>
                  <span style="font-weight: 700;">${this._formatCurrency(gc.declaredNetCash)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-primary);">(+) Comprobantes Electrónicos Declarados (Posnet/QR):</span>
                  <span style="font-weight: 700; color: #60a5fa;">+${this._formatCurrency(gc.declaredElectronic)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">(+) Cheques Físicos en Cartera Declarados:</span>
                  <span style="font-weight: 700;">+${this._formatCurrency(gc.declaredCheck)}</span>
                </div>
              </div>
            </div>

            <div style="margin-top: 0.85rem; padding-top: 0.65rem; border-top: 2px solid rgba(74, 222, 128, 0.35); display: flex; justify-content: space-between; align-items: baseline;">
              <div>
                <div style="font-size: 0.8rem; font-weight: 800; color: #4ade80;">(=) TOTAL GENERAL DECLARADO POR CAJEROS</div>
                <div style="font-size: 0.69rem; color: var(--text-muted);">Efectivo Neto + Electrónicos + Cheques</div>
              </div>
              <div style="font-size: 1.15rem; font-weight: 900; color: #4ade80;">
                ${this._formatCurrency(gc.totalGeneralDeclaradoPorCajeros)}
              </div>
            </div>
          </div>

        </div>

        <!-- Barra de Resultado Final: DIFERENCIA GLOBAL (DECLARADO CAJEROS - REGISTRADO SISTEMA) -->
        <div style="padding: 0.85rem 1.1rem; border-radius: 10px; background: ${globalBannerBg}; border: 1px solid ${globalBannerBorder}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <div style="font-size: 0.88rem; font-weight: 900; color: var(--text-primary);">
              DIFERENCIA GLOBAL (DECLARADO CAJEROS - REGISTRADO SISTEMA)
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              ${this._formatCurrency(gc.totalGeneralDeclaradoPorCajeros)} (Declarado) − ${this._formatCurrency(gc.totalNetoSistemaARendir)} (Neto Sistema)
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 1.35rem; font-weight: 900; color: ${globalBannerColor};">
              ${this._formatSignedCurrency(globalDiffVal)}
            </span>
            <span style="margin-left: 0.5rem; font-size: 0.78rem; font-weight: 800; color: ${globalBannerColor};">
              (${gc.status})
            </span>
          </div>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- BLOQUE 2: COMPARATIVO INDIVIDUAL POR TERMINAL (PC) Y POR TURNO      -->
      <!-- =================================================================== -->
      <div style="background: rgba(15, 23, 42, 0.55); border: 1px solid var(--border); border-radius: 12px; padding: 1.1rem; margin-bottom: 1.4rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem;">
          <div>
            <h3 style="margin: 0; font-size: 0.92rem; font-weight: 800; color: var(--text-primary);">
              🖥️ 2. COMPARATIVO INDIVIDUAL POR COMPUTADORA (PC) Y POR TURNO (${day.terminalCount} PCs • ${day.sessionCount} Cierres en ${day.butcheryName})
            </h3>
            <p style="margin: 0.2rem 0 0 0; font-size: 0.75rem; color: var(--text-muted);">
              Muestra cada reporte subido desde las terminales del local y la columna final <strong>TOTAL CONSOLIDADO</strong> (igual que la Hoja 2 del Excel).
            </p>
          </div>
        </div>

        <!-- 2.A: Resumen agrupado por PC Física (PC 1, PC 2...) -->
        <div style="overflow-x: auto; margin-bottom: 1rem;">
          <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="background: rgba(30, 41, 59, 0.75); color: var(--text-muted); text-align: left; border-bottom: 1px solid var(--border);">
                <th style="padding: 0.6rem;">Terminal / PC</th>
                <th style="padding: 0.6rem;">Turnos / Horario</th>
                <th style="padding: 0.6rem;">Operador(es)</th>
                <th style="padding: 0.6rem; text-align: right;">Ventas Sistema ($)</th>
                <th style="padding: 0.6rem; text-align: right;">Gastos / Cta.Cte.</th>
                <th style="padding: 0.6rem; text-align: right; color: #93c5fd;">(=) Neto Sistema</th>
                <th style="padding: 0.6rem; text-align: right;">Retiros Efectivo</th>
                <th style="padding: 0.6rem; text-align: right;">Posnet Declarado</th>
                <th style="padding: 0.6rem; text-align: right; color: #4ade80;">(=) Total Declarado</th>
                <th style="padding: 0.6rem; text-align: right;">Dif. Global</th>
              </tr>
            </thead>
            <tbody>
              ${day.terminals.map(t => {
                const openTime = DailyCashClosingAggregator.toArgentinaTimeString(t.firstOpenedAt);
                const closeTime = DailyCashClosingAggregator.toArgentinaTimeString(t.lastClosedAt);
                const tgc = t.globalComparison || {};
                return `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 0.65rem; font-weight: 800; color: #c084fc; font-family: monospace;">💻 ${t.deviceId}</td>
                    <td style="padding: 0.65rem; color: var(--text-muted);">${t.sessionCount} cierre(s) (${openTime} - ${closeTime})</td>
                    <td style="padding: 0.65rem;">${(t.operators || []).join(', ') || '-'}</td>
                    <td style="padding: 0.65rem; text-align: right; font-weight: 700;">${this._formatCurrency(t.totalSalesAmount)}</td>
                    <td style="padding: 0.65rem; text-align: right; color: var(--text-muted);">-${this._formatCurrency(t.totalExpenses + t.debtSalesAmount - t.accountCollectionsTotal)}</td>
                    <td style="padding: 0.65rem; text-align: right; font-weight: 800; color: #93c5fd;">${this._formatCurrency(tgc.totalNetoSistemaARendir)}</td>
                    <td style="padding: 0.65rem; text-align: right;">${this._formatCurrency(t.totalExtractions)}</td>
                    <td style="padding: 0.65rem; text-align: right;">${this._formatCurrency(t.actualElectronic)}</td>
                    <td style="padding: 0.65rem; text-align: right; font-weight: 800; color: #4ade80;">${this._formatCurrency(tgc.totalGeneralDeclaradoPorCajeros)}</td>
                    <td style="padding: 0.65rem; text-align: right;">${formatDiff(tgc.globalDifference)}</td>
                  </tr>
                `;
              }).join('')}
              <!-- Fila Total Consolidado de todas las PCs -->
              <tr style="background: rgba(59, 130, 246, 0.12); font-weight: 800; border-top: 2px solid rgba(59, 130, 246, 0.4);">
                <td style="padding: 0.7rem; color: #60a5fa;">🌐 TOTAL CONSOLIDADO (${day.terminalCount} PCs)</td>
                <td style="padding: 0.7rem;">${day.sessionCount} cierre(s)</td>
                <td style="padding: 0.7rem;">${(day.operators || []).join(', ') || '-'}</td>
                <td style="padding: 0.7rem; text-align: right;">${this._formatCurrency(day.totalSalesAmount)}</td>
                <td style="padding: 0.7rem; text-align: right;">-${this._formatCurrency(day.totalExpenses + day.debtSalesAmount - day.accountCollectionsTotal)}</td>
                <td style="padding: 0.7rem; text-align: right; color: #93c5fd;">${this._formatCurrency(day.globalComparison?.totalNetoSistemaARendir)}</td>
                <td style="padding: 0.7rem; text-align: right;">${this._formatCurrency(day.totalExtractions)}</td>
                <td style="padding: 0.7rem; text-align: right;">${this._formatCurrency(day.actualElectronic)}</td>
                <td style="padding: 0.7rem; text-align: right; color: #4ade80;">${this._formatCurrency(day.globalComparison?.totalGeneralDeclaradoPorCajeros)}</td>
                <td style="padding: 0.7rem; text-align: right;">${formatDiff(day.globalComparison?.globalDifference)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 2.B: Matriz columna por columna de cada turno/cierre individual subido (Hoja 2 del Excel) -->
        ${(day.shiftReports && day.shiftReports.length > 1) ? `
          <details style="margin-top: 0.6rem;">
            <summary style="cursor: pointer; font-size: 0.8rem; font-weight: 700; color: #93c5fd; padding: 0.4rem 0;">
              📋 Ver matriz detallada columna por columna de los ${day.shiftReports.length} cierres/turnos individuales subidos a Firestore
            </summary>
            <div style="overflow-x: auto; margin-top: 0.65rem;">
              <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.77rem;">
                <thead>
                  <tr style="background: rgba(30, 41, 59, 0.85); color: var(--text-muted); border-bottom: 1px solid var(--border);">
                    <th style="padding: 0.55rem; text-align: left;">Concepto</th>
                    ${day.shiftReports.map((sr, i) => `
                      <th style="padding: 0.55rem; text-align: right; color: #e9d5ff;">
                        Turno ${i + 1}: ${sr.deviceId}<br/>
                        <span style="font-size: 0.68rem; color: var(--text-muted);">${sr.closingType} • #${sr.shortId} (${sr.operatorEmail})</span>
                      </th>
                    `).join('')}
                    <th style="padding: 0.55rem; text-align: right; color: #60a5fa; background: rgba(59, 130, 246, 0.1);">TOTAL CONSOLIDADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 0.5rem;">Horario Apertura - Cierre</td>
                    ${day.shiftReports.map(sr => `<td style="padding: 0.5rem; text-align: right; color: var(--text-muted);">${DailyCashClosingAggregator.toArgentinaTimeString(sr.openedAt)} - ${DailyCashClosingAggregator.toArgentinaTimeString(sr.closedAt)}</td>`).join('')}
                    <td style="padding: 0.5rem; text-align: right; background: rgba(59, 130, 246, 0.05);">Jornada</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 0.5rem; font-weight: 700;">(+) Total Ventas Sistema</td>
                    ${day.shiftReports.map(sr => `<td style="padding: 0.5rem; text-align: right; font-weight: 700;">${this._formatCurrency(sr.totalSalesAmount)}</td>`).join('')}
                    <td style="padding: 0.5rem; text-align: right; font-weight: 800; background: rgba(59, 130, 246, 0.05);">${this._formatCurrency(day.totalSalesAmount)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 0.5rem;">(-) Gastos y Cta. Cte. Neta</td>
                    ${day.shiftReports.map(sr => `<td style="padding: 0.5rem; text-align: right;">-${this._formatCurrency(sr.totalExpenses + sr.debtSalesAmount - sr.accountCollectionsTotal)}</td>`).join('')}
                    <td style="padding: 0.5rem; text-align: right; background: rgba(59, 130, 246, 0.05);">-${this._formatCurrency(day.totalExpenses + day.debtSalesAmount - day.accountCollectionsTotal)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(59, 130, 246, 0.06); font-weight: 800; color: #93c5fd;">
                    <td style="padding: 0.55rem;">(=) TOTAL NETO SISTEMA A RENDIR</td>
                    ${day.shiftReports.map(sr => `<td style="padding: 0.55rem; text-align: right;">${this._formatCurrency(sr.globalComparison?.totalNetoSistemaARendir)}</td>`).join('')}
                    <td style="padding: 0.55rem; text-align: right;">${this._formatCurrency(day.globalComparison?.totalNetoSistemaARendir)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 0.5rem;">(+) Retiros de Efectivo (Sobres)</td>
                    ${day.shiftReports.map(sr => `<td style="padding: 0.5rem; text-align: right;">${this._formatCurrency(sr.totalExtractions)}</td>`).join('')}
                    <td style="padding: 0.5rem; text-align: right; background: rgba(59, 130, 246, 0.05);">${this._formatCurrency(day.totalExtractions)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 0.5rem;">(-) Fondo Inicial / (+) Cambio Final</td>
                    ${day.shiftReports.map(sr => `<td style="padding: 0.5rem; text-align: right;">-${this._formatCurrency(sr.initialCash)} / +${this._formatCurrency(sr.actualCash)}</td>`).join('')}
                    <td style="padding: 0.5rem; text-align: right; background: rgba(59, 130, 246, 0.05);">-${this._formatCurrency(day.initialCash)} / +${this._formatCurrency(day.actualCash)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 0.5rem;">(+) Electrónicos y Cheques Declarados</td>
                    ${day.shiftReports.map(sr => `<td style="padding: 0.5rem; text-align: right;">${this._formatCurrency(sr.actualElectronic + sr.actualCheck)}</td>`).join('')}
                    <td style="padding: 0.5rem; text-align: right; background: rgba(59, 130, 246, 0.05);">${this._formatCurrency(day.actualElectronic + day.actualCheck)}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(34, 197, 94, 0.06); font-weight: 800; color: #4ade80;">
                    <td style="padding: 0.55rem;">(=) TOTAL DECLARADO POR CAJEROS</td>
                    ${day.shiftReports.map(sr => `<td style="padding: 0.55rem; text-align: right;">${this._formatCurrency(sr.globalComparison?.totalGeneralDeclaradoPorCajeros)}</td>`).join('')}
                    <td style="padding: 0.55rem; text-align: right;">${this._formatCurrency(day.globalComparison?.totalGeneralDeclaradoPorCajeros)}</td>
                  </tr>
                  <tr style="font-weight: 800;">
                    <td style="padding: 0.55rem;">DIFERENCIA GLOBAL (DECLARADO - SISTEMA)</td>
                    ${day.shiftReports.map(sr => `<td style="padding: 0.55rem; text-align: right;">${formatDiff(sr.globalComparison?.globalDifference)}</td>`).join('')}
                    <td style="padding: 0.55rem; text-align: right; background: rgba(59, 130, 246, 0.1);">${formatDiff(day.globalComparison?.globalDifference)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        ` : ''}
      </div>

      <!-- =================================================================== -->
      <!-- BLOQUES 3 Y 4: DESGLOSE INFORMATIVO POR MEDIO DE PAGO Y ARQUEO      -->
      <!-- =================================================================== -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.2rem; margin-bottom: 1.4rem;">
        
        <!-- 3. Resumen General de Ventas por Medio de Pago (Informativo según Sistema) -->
        <div style="background: rgba(15, 23, 42, 0.55); border: 1px solid var(--border); border-radius: 12px; padding: 1rem;">
          <h3 style="margin: 0 0 0.3rem 0; font-size: 0.88rem; font-weight: 800; color: var(--text-primary);">
            💳 3. Ventas por Medio de Pago (Informativo según Sistema)
          </h3>
          <p style="margin: 0 0 0.65rem 0; font-size: 0.72rem; color: var(--text-muted);">
            Desglose según cómo fue fichada la venta en caja (sujeto a cruces operativos entre efectivo y posnet).
          </p>
          <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.81rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); text-align: left;">
                <th style="padding: 0.45rem;">Medio Registrado</th>
                <th style="padding: 0.45rem; text-align: right;">% Part.</th>
                <th style="padding: 0.45rem; text-align: right;">Monto Sistema ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 0.55rem 0.45rem;">💵 Ventas en Efectivo</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right; color: var(--text-muted);">${pct(activeData.cashSalesAmount)}</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right; font-weight: 700;">${this._formatCurrency(activeData.cashSalesAmount)}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 0.55rem 0.45rem;">💳 Cobros Electrónicos (Tarj./QR/Transf.)</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right; color: var(--text-muted);">${pct(activeData.electronicSalesAmount)}</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right; font-weight: 700;">${this._formatCurrency(activeData.electronicSalesAmount)}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 0.55rem 0.45rem;">🏦 Cobros con Cheque</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right; color: var(--text-muted);">${pct(activeData.checkSalesAmount)}</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right; font-weight: 700;">${this._formatCurrency(activeData.checkSalesAmount)}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 0.55rem 0.45rem; color: #facc15;">📓 Ventas a Cuenta Corriente (Fiado)</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right; color: var(--text-muted);">${pct(activeData.debtSalesAmount)}</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right; font-weight: 700; color: #facc15;">${this._formatCurrency(activeData.debtSalesAmount)}</td>
              </tr>
              <tr style="background: rgba(34, 197, 94, 0.08); font-weight: 800;">
                <td style="padding: 0.6rem 0.45rem; color: #4ade80;">TOTAL VENTAS CONSOLIDADAS</td>
                <td style="padding: 0.6rem 0.45rem; text-align: right; color: #4ade80;">100.0%</td>
                <td style="padding: 0.6rem 0.45rem; text-align: right; color: #4ade80;">${this._formatCurrency(activeData.totalSalesAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 4. Arqueo Individual por Medio (Informativo) -->
        <div style="background: rgba(15, 23, 42, 0.55); border: 1px solid var(--border); border-radius: 12px; padding: 1rem;">
          <h3 style="margin: 0 0 0.3rem 0; font-size: 0.88rem; font-weight: 800; color: var(--text-primary);">
            🧮 4. Arqueo por Medio de Valor (Informativo)
          </h3>
          <p style="margin: 0 0 0.65rem 0; font-size: 0.72rem; color: var(--text-muted);">
            Las diferencias individuales entre Efectivo y Electrónico suelen compensarse en la Comparación Global (Sección 1).
          </p>
          <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.81rem;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); text-align: left;">
                <th style="padding: 0.45rem;">Rubro</th>
                <th style="padding: 0.45rem; text-align: right;">Esperado ($)</th>
                <th style="padding: 0.45rem; text-align: right;">Declarado ($)</th>
                <th style="padding: 0.45rem; text-align: right;">Dif. Rubro</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 0.55rem 0.45rem; font-weight: 700;">💵 Efectivo en Gaveta</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right;">${this._formatCurrency(activeData.expectedCash)}</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right; font-weight: 700;">${this._formatCurrency(activeData.actualCash)}</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right;">${formatDiff(activeData.diffCash)}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 0.55rem 0.45rem; font-weight: 700;">💳 Lotes Electrónicos</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right;">${this._formatCurrency(activeData.expectedElectronic)}</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right; font-weight: 700;">${this._formatCurrency(activeData.actualElectronic)}</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right;">${formatDiff(activeData.diffElectronic)}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 0.55rem 0.45rem; font-weight: 700;">🏦 Cheques</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right;">${this._formatCurrency(activeData.expectedCheck)}</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right; font-weight: 700;">${this._formatCurrency(activeData.actualCheck)}</td>
                <td style="padding: 0.55rem 0.45rem; text-align: right;">${formatDiff(activeData.diffCheck)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 5. Rendimiento Cárnico y Notas del Cierre -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.9rem; margin-bottom: 1rem;">
        <div style="padding: 0.9rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border);">
          <div style="font-size: 0.72rem; color: var(--text-muted);">🐂 Materia Prima Ingresada Hoy</div>
          <div style="font-size: 1.15rem; font-weight: 800; margin-top: 0.2rem;">${this._formatWeight(day.rawMaterialTotalKg)}</div>
          <div style="font-size: 0.74rem; color: var(--text-muted);">Costo: ${this._formatCurrency(day.rawMaterialTotalCost)}</div>
        </div>
        <div style="padding: 0.9rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border);">
          <div style="font-size: 0.72rem; color: var(--text-muted);">📈 Rendimiento Cárnico del Día</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #60a5fa; margin-top: 0.2rem;">${Number(day.meatYieldPercentage || 0).toFixed(2)} %</div>
          <div style="font-size: 0.74rem; color: var(--text-muted);">Balance masa: ${this._formatWeight(day.weightDifferenceKg)}</div>
        </div>
        <div style="padding: 0.9rem; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid var(--border);">
          <div style="font-size: 0.72rem; color: var(--text-muted);">🏷️ Precio Promedio de Venta</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #4ade80; margin-top: 0.2rem;">${this._formatCurrency(activeData.totalWeightKg > 0 ? activeData.totalSalesAmount / activeData.totalWeightKg : 0)} / kg</div>
          <div style="font-size: 0.74rem; color: var(--text-muted);">Margen Bruto: ${Number(day.grossMarginPercentage || 0).toFixed(1)}%</div>
        </div>
      </div>

      ${day.notes ? `
        <div style="padding: 0.85rem 1rem; border-radius: 10px; background: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.25); font-size: 0.82rem; color: #fef08a;">
          <strong>📝 Notas de Operadores:</strong> ${day.notes}
        </div>
      ` : ''}
    `;
  }

  /**
   * PESTAÑA 2: Ventas por Corte Cárnico (Cargada a petición desde subcolección 'sales_by_cut').
   */
  renderTabCortes(day, activeData) {
    const allCuts = this.loadedDetailData.cuts || [];
    const filteredByPc = this.selectedDetailTerminal === 'ALL'
      ? allCuts
      : allCuts.filter(c => c._sourceDeviceId === this.selectedDetailTerminal);

    const aggregatedCuts = DailyCashClosingAggregator.aggregateSalesByCut(filteredByPc);
    const search = (this.filters.cutSearch || '').trim().toLowerCase();
    const visibleCuts = search
      ? aggregatedCuts.filter(c => c.productName.toLowerCase().includes(search) || String(c.productId).toLowerCase().includes(search))
      : aggregatedCuts;

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.8rem; margin-bottom: 1rem;">
        <div>
          <h3 style="margin: 0; font-size: 0.95rem; font-weight: 800;">
            🥩 Planilla de Ventas por Corte Cárnico (${visibleCuts.length} cortes)
          </h3>
          <p style="margin: 0.2rem 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
            Subcolección <code>sales_by_cut</code> consultada bajo demanda y consolidada entre las terminales seleccionadas.
          </p>
        </div>
        <div style="min-width: 240px;">
          <input type="text" id="input-search-cut" class="form-control" placeholder="🔍 Buscar corte o PLU..." value="${this.filters.cutSearch}" style="width: 100%;" />
        </div>
      </div>

      ${visibleCuts.length === 0 ? `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
          No hay cortes registrados para este filtro.
        </div>
      ` : `
        <div style="overflow-x: auto;">
          <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
            <thead>
              <tr style="background: rgba(30, 41, 59, 0.75); color: var(--text-muted); text-align: left; border-bottom: 1px solid var(--border);">
                <th style="padding: 0.65rem;">PLU / ID</th>
                <th style="padding: 0.65rem;">Corte de Carne</th>
                <th style="padding: 0.65rem; text-align: right;">Kilos Vendidos</th>
                <th style="padding: 0.65rem; text-align: right;">Total Facturado ($)</th>
                <th style="padding: 0.65rem; text-align: right;">Precio Prom. ($/kg)</th>
                <th style="padding: 0.65rem; text-align: right;">% Part. Kg</th>
                <th style="padding: 0.65rem;">Desglose por PC</th>
              </tr>
            </thead>
            <tbody>
              ${visibleCuts.map(c => {
                const pcBreakdown = Object.entries(c.byTerminal || {})
                  .map(([pc, kg]) => `<span style="display:inline-block; padding:0.1rem 0.4rem; border-radius:4px; background:rgba(168, 85, 247, 0.14); color:#e9d5ff; font-size:0.7rem; margin-right:0.3rem;">${pc}: ${Number(kg).toFixed(2)}kg</span>`)
                  .join('');

                return `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 0.65rem; font-family: monospace; color: var(--text-muted);">#${c.productId}</td>
                    <td style="padding: 0.65rem; font-weight: 700; color: var(--text-primary);">${c.productName}</td>
                    <td style="padding: 0.65rem; text-align: right; font-weight: 700;">${this._formatWeight(c.weightKg)}</td>
                    <td style="padding: 0.65rem; text-align: right; font-weight: 800; color: #4ade80;">${this._formatCurrency(c.totalAmount)}</td>
                    <td style="padding: 0.65rem; text-align: right;">${this._formatCurrency(c.avgPricePerKg)}</td>
                    <td style="padding: 0.65rem; text-align: right; color: #60a5fa; font-weight: 600;">${c.shareKgPct.toFixed(1)}%</td>
                    <td style="padding: 0.65rem;">${pcBreakdown}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  }

  /**
   * PESTAÑA 3: Retiros de Efectivo a Seguridad y Desglose de Billetes (Cargada a petición).
   */
  renderTabRetiros(day, activeData) {
    const allExt = this.loadedDetailData.extractions || [];
    const filteredExt = this.selectedDetailTerminal === 'ALL'
      ? allExt
      : allExt.filter(e => e._sourceDeviceId === this.selectedDetailTerminal);

    if (filteredExt.length === 0) {
      return `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
          No se registraron retiros de efectivo a seguridad en las sesiones seleccionadas.
        </div>
      `;
    }

    return `
      <h3 style="margin: 0 0 0.85rem 0; font-size: 0.95rem; font-weight: 800;">
        🔒 Retiros de Efectivo a Seguridad y Arqueo de Billetes (${filteredExt.length} sobres)
      </h3>
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        ${filteredExt.map(ext => {
          const parsed = parseCashExtractionBreakdown(ext.billeteBreakdownJson);
          const timeStr = DailyCashClosingAggregator.toArgentinaTimeString(ext.timestamp);
          const activeBills = parsed.items.filter(b => b.fajos > 0 || b.sueltos > 0);

          return `
            <div style="padding: 1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.55); border: 1px solid var(--border);">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.6rem;">
                <div>
                  <span style="padding: 0.2rem 0.5rem; border-radius: 6px; background: rgba(168, 85, 247, 0.15); color: #c084fc; font-family: monospace; font-size: 0.75rem; font-weight: 700;">
                    💻 ${ext._sourceDeviceId || 'PC 1'}
                  </span>
                  <strong style="margin-left: 0.5rem; font-size: 0.9rem;">${ext.description || 'Entrega de efectivo a seguridad'}</strong>
                  <span style="margin-left: 0.5rem; font-size: 0.76rem; color: var(--text-muted);">🕒 ${timeStr} hs</span>
                </div>
                <div style="font-size: 1.15rem; font-weight: 800; color: #4ade80;">
                  ${this._formatCurrency(ext.amount)}
                </div>
              </div>

              ${activeBills.length > 0 ? `
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                  ${activeBills.map(b => `
                    <div style="padding: 0.4rem 0.65rem; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); font-size: 0.76rem;">
                      <strong style="color: #93c5fd;">$${Number(b.denominacion).toLocaleString('es-AR')}:</strong>
                      ${b.fajos > 0 ? `${b.fajos} fajo(s)` : ''}
                      ${b.fajos > 0 && b.sueltos > 0 ? ' + ' : ''}
                      ${b.sueltos > 0 ? `${b.sueltos} suelto(s)` : ''}
                      <span style="color: var(--text-muted);">(${this._formatCurrency(b.subtotal)})</span>
                    </div>
                  `).join('')}
                </div>
              ` : `<div style="font-size: 0.75rem; color: var(--text-muted);">Sin desglose de denominaciones registrado.</div>`}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * PESTAÑA 4: Lotes de Materia Prima (Deduplicados por batchId) y Cuentas Corrientes (Fiados / Cobranzas).
   */
  renderTabMateriaPrimaYCtaCte(day, activeData) {
    const uniqueBatches = DailyCashClosingAggregator.deduplicateRawMaterialBatches(this.loadedDetailData.rawMaterials || []);
    const allAccountSales = this.loadedDetailData.accountSales || [];
    const allCollections = this.loadedDetailData.collections || [];

    const accountSales = this.selectedDetailTerminal === 'ALL'
      ? allAccountSales
      : allAccountSales.filter(a => a._sourceDeviceId === this.selectedDetailTerminal);

    const collections = this.selectedDetailTerminal === 'ALL'
      ? allCollections
      : allCollections.filter(c => c._sourceDeviceId === this.selectedDetailTerminal);

    return `
      <!-- Lotes de Materia Prima -->
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 0.6rem 0; font-size: 0.95rem; font-weight: 800;">
          🐂 Lotes y Tropas de Materia Prima Ingresadas en el Día (${uniqueBatches.length} lotes únicos deduplicados)
        </h3>
        ${uniqueBatches.length === 0 ? `
          <div style="padding: 1.2rem; background: rgba(255,255,255,0.02); border-radius: 10px; color: var(--text-muted); font-size: 0.82rem;">
            No se registraron lotes en la subcolección <code>raw_materials</code> para esta fecha.
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
              <thead>
                <tr style="background: rgba(30, 41, 59, 0.75); color: var(--text-muted); text-align: left; border-bottom: 1px solid var(--border);">
                  <th style="padding: 0.55rem;">Lote ID</th>
                  <th style="padding: 0.55rem;">Tropa / Garrón</th>
                  <th style="padding: 0.55rem;">Proveedor</th>
                  <th style="padding: 0.55rem;">Producto</th>
                  <th style="padding: 0.55rem; text-align: right;">Peso Inicial</th>
                  <th style="padding: 0.55rem; text-align: right;">Costo / kg</th>
                  <th style="padding: 0.55rem; text-align: right;">Costo Total</th>
                </tr>
              </thead>
              <tbody>
                ${uniqueBatches.map(b => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 0.55rem; font-family: monospace;">#${b.batchId || b.id}</td>
                    <td style="padding: 0.55rem; font-weight: 700;">${b.tropaNumber || '-'} ${b.barcode ? `(${b.barcode})` : ''}</td>
                    <td style="padding: 0.55rem;">${b.providerName || '-'}</td>
                    <td style="padding: 0.55rem;">${b.rawMaterialProductName || '-'}</td>
                    <td style="padding: 0.55rem; text-align: right; font-weight: 700;">${this._formatWeight(b.weightKg)}</td>
                    <td style="padding: 0.55rem; text-align: right;">${this._formatCurrency(b.costPerKg)}</td>
                    <td style="padding: 0.55rem; text-align: right; font-weight: 800; color: #f87171;">${this._formatCurrency(b.totalCost)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Ventas a Cuenta Corriente (Fiados) -->
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 0.6rem 0; font-size: 0.95rem; font-weight: 800;">
          💳 Ventas Fiadas a Cuenta Corriente en el Turno (${accountSales.length} ítems)
        </h3>
        ${accountSales.length === 0 ? `
          <div style="padding: 1.2rem; background: rgba(255,255,255,0.02); border-radius: 10px; color: var(--text-muted); font-size: 0.82rem;">
            Sin ventas a cuenta corriente impagas en este cierre.
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
              <thead>
                <tr style="background: rgba(30, 41, 59, 0.75); color: var(--text-muted); text-align: left; border-bottom: 1px solid var(--border);">
                  <th style="padding: 0.55rem;">Terminal</th>
                  <th style="padding: 0.55rem;">Cliente</th>
                  <th style="padding: 0.55rem;">Corte</th>
                  <th style="padding: 0.55rem; text-align: right;">Kilos</th>
                  <th style="padding: 0.55rem; text-align: right;">Subtotal</th>
                  <th style="padding: 0.55rem; text-align: right;">Deuda Impaga</th>
                </tr>
              </thead>
              <tbody>
                ${accountSales.map(as => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 0.55rem; font-family: monospace; color: #c084fc;">${as._sourceDeviceId}</td>
                    <td style="padding: 0.55rem; font-weight: 700;">${as.customerName || as.customerId}</td>
                    <td style="padding: 0.55rem;">${as.productName}</td>
                    <td style="padding: 0.55rem; text-align: right;">${this._formatWeight(as.weightKg)}</td>
                    <td style="padding: 0.55rem; text-align: right;">${this._formatCurrency(as.subtotal)}</td>
                    <td style="padding: 0.55rem; text-align: right; font-weight: 800; color: #facc15;">${this._formatCurrency(as.unpaidDebt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Cobranzas Recibidas -->
      <div>
        <h3 style="margin: 0 0 0.6rem 0; font-size: 0.95rem; font-weight: 800;">
          📥 Cobranzas de Cuentas Corrientes Recibidas en Caja (${collections.length})
        </h3>
        ${collections.length === 0 ? `
          <div style="padding: 1.2rem; background: rgba(255,255,255,0.02); border-radius: 10px; color: var(--text-muted); font-size: 0.82rem;">
            No se registraron cobranzas de saldos anteriores en este turno.
          </div>
        ` : `
          <div style="overflow-x: auto;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
              <thead>
                <tr style="background: rgba(30, 41, 59, 0.75); color: var(--text-muted); text-align: left; border-bottom: 1px solid var(--border);">
                  <th style="padding: 0.55rem;">Terminal</th>
                  <th style="padding: 0.55rem;">Cliente</th>
                  <th style="padding: 0.55rem;">Descripción</th>
                  <th style="padding: 0.55rem;">Recibido Por</th>
                  <th style="padding: 0.55rem; text-align: right;">Monto Cobrado</th>
                </tr>
              </thead>
              <tbody>
                ${collections.map(col => `
                  <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <td style="padding: 0.55rem; font-family: monospace; color: #c084fc;">${col._sourceDeviceId}</td>
                    <td style="padding: 0.55rem; font-weight: 700;">${col.customerName || col.customerId}</td>
                    <td style="padding: 0.55rem;">${col.description || '-'}</td>
                    <td style="padding: 0.55rem;">${col.receivedBy || '-'}</td>
                    <td style="padding: 0.55rem; text-align: right; font-weight: 800; color: #4ade80;">${this._formatCurrency(col.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  }

  /**
   * PESTAÑA 5: Desglose Fiscal ARCA por Punto de Venta (Cargado estrictamente a petición).
   */
  renderTabPuntoVentaArca(day) {
    const posGroups = this.loadedDetailData.fiscalPosGroups || [];

    return `
      <div style="margin-bottom: 1rem;">
        <h3 style="margin: 0; font-size: 0.95rem; font-weight: 800;">
          🏛️ Facturación Electrónica ARCA por Punto de Venta (${day.dateStr})
        </h3>
        <p style="margin: 0.2rem 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
          Cada PC de la carnicería emite con su propio Punto de Venta configurado. Datos consultados bajo demanda para ahorrar lecturas de Firestore.
        </p>
      </div>

      ${posGroups.length === 0 ? `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 10px;">
          No se encontraron comprobantes fiscales con CAE para la fecha <strong>${day.dateStr}</strong> en esta sucursal.
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
          ${posGroups.map(g => `
            <div style="padding: 1.1rem; border-radius: 12px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(59, 130, 246, 0.3);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-family: monospace; font-size: 0.95rem; font-weight: 800; color: #60a5fa;">
                  🏢 Punto de Venta ${g.puntoVenta}
                </span>
                <span style="padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; background: rgba(34, 197, 94, 0.15); color: #4ade80;">
                  ${g.count} cbte(s) con CAE
                </span>
              </div>
              <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.35rem;">
                ${this._formatCurrency(g.totalFacturado)}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                Neto Gravado: ${this._formatCurrency(g.totalNeto)} | IVA: ${this._formatCurrency(g.totalIva)}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  /**
   * Carga bajo demanda los datos de la pestaña seleccionada sólo cuando el usuario la abre.
   */
  async loadTabOnDemand(tabId) {
    this.activeDetailTab = tabId;
    const selectedDay = this.consolidatedDays.find(d => d.id === this.selectedDayId);
    if (!selectedDay) return;

    if (tabId === 'resumen') {
      this._refreshDetailPanelOnly(selectedDay);
      return;
    }

    this.loadedDetailData.loading = true;
    this._refreshDetailPanelOnly(selectedDay);

    try {
      if (tabId === 'cortes' && this.loadedDetailData.cuts === null) {
        this.loadedDetailData.cuts = await this.repository.getSubcollectionOnDemand(selectedDay.sessions, 'sales_by_cut');
      } else if (tabId === 'retiros' && this.loadedDetailData.extractions === null) {
        this.loadedDetailData.extractions = await this.repository.getSubcollectionOnDemand(selectedDay.sessions, 'extractions');
      } else if (tabId === 'materia_cta' && this.loadedDetailData.rawMaterials === null) {
        const [rawMats, accSales, colls] = await Promise.all([
          this.repository.getSubcollectionOnDemand(selectedDay.sessions, 'raw_materials'),
          this.repository.getSubcollectionOnDemand(selectedDay.sessions, 'account_sales'),
          this.repository.getSubcollectionOnDemand(selectedDay.sessions, 'collections')
        ]);
        this.loadedDetailData.rawMaterials = rawMats;
        this.loadedDetailData.accountSales = accSales;
        this.loadedDetailData.collections = colls;
      } else if (tabId === 'pos_arca' && this.loadedDetailData.fiscalPosGroups === null) {
        const { startMs, endMs } = this._getDateRangeEpochMs(selectedDay.dateStr, selectedDay.dateStr);
        const vouchers = await this.repository.getFiscalVouchersByPosOnDemand(startMs, endMs, selectedDay.butcheryName);
        this.loadedDetailData.fiscalPosGroups = DailyCashClosingAggregator.groupFiscalVouchersByPuntoVenta(vouchers);
      }
    } catch (err) {
      console.error(`[DailyCashClosingsUI] Error en carga bajo demanda (${tabId}):`, err);
    } finally {
      this.loadedDetailData.loading = false;
      this._refreshDetailPanelOnly(selectedDay);
    }
  }

  _refreshDetailPanelOnly(selectedDay) {
    const panel = document.getElementById('closing-detail-panel');
    if (panel && selectedDay) {
      panel.innerHTML = this.renderSelectedDayDetail(selectedDay);
      this._attachDetailPanelListeners();
    }
  }

  attachEventListeners() {
    const toggleFiltersHeader = document.getElementById('toggle-closings-filters');
    const filterPanel = document.getElementById('closings-filter-panel');
    if (toggleFiltersHeader && filterPanel) {
      toggleFiltersHeader.addEventListener('click', () => {
        this._filtersCollapsed = !this._filtersCollapsed;
        filterPanel.classList.toggle('is-collapsed', this._filtersCollapsed);
      });
    }

    const branchSelect = document.getElementById('filter-butchery');
    const terminalSelect = document.getElementById('filter-terminal');
    const typeSelect = document.getElementById('filter-closing-type');
    const dateFromInput = document.getElementById('filter-date-from');
    const dateToInput = document.getElementById('filter-date-to');
    const btnQueryDates = document.getElementById('btn-query-dates');
    const btnRefresh = document.getElementById('btn-refresh-closings');

    if (branchSelect) {
      branchSelect.addEventListener('change', () => {
        this.filters.butcheryName = branchSelect.value;
        this.filters.terminalId = 'ALL';
        this.processAndRender();
      });
    }

    if (terminalSelect) {
      terminalSelect.addEventListener('change', () => {
        this.filters.terminalId = terminalSelect.value;
        this.processAndRender();
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        this.filters.closingType = typeSelect.value;
        this.processAndRender();
      });
    }

    if (btnQueryDates) {
      btnQueryDates.addEventListener('click', () => {
        if (dateFromInput) this.filters.dateFrom = dateFromInput.value;
        if (dateToInput) this.filters.dateTo = dateToInput.value;
        this.render();
      });
    }

    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        this.repository.clearCache();
        this.render();
      });
    }

    const setQuickDates = (daysOffsetStart, daysOffsetEnd = 0) => {
      const now = new Date();
      const start = new Date(now.getTime() - daysOffsetStart * 86400000);
      const end = new Date(now.getTime() - daysOffsetEnd * 86400000);
      this.filters.dateFrom = DailyCashClosingAggregator.toArgentinaDateString(start.getTime());
      this.filters.dateTo = DailyCashClosingAggregator.toArgentinaDateString(end.getTime());
      this.render();
    };

    const btnToday = document.getElementById('btn-quick-today');
    const btnYesterday = document.getElementById('btn-quick-yesterday');
    const btn7Days = document.getElementById('btn-quick-7days');
    const btnMonth = document.getElementById('btn-quick-month');

    if (btnToday) btnToday.addEventListener('click', () => setQuickDates(0, 0));
    if (btnYesterday) btnYesterday.addEventListener('click', () => setQuickDates(1, 1));
    if (btn7Days) btn7Days.addEventListener('click', () => setQuickDates(7, 0));
    if (btnMonth) {
      btnMonth.addEventListener('click', () => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        this.filters.dateFrom = DailyCashClosingAggregator.toArgentinaDateString(firstDayOfMonth.getTime());
        this.filters.dateTo = DailyCashClosingAggregator.toArgentinaDateString(now.getTime());
        this.render();
      });
    }

    this.container.querySelectorAll('.day-closing-item').forEach(card => {
      card.addEventListener('click', () => {
        const dayId = card.dataset.id;
        if (dayId && dayId !== this.selectedDayId) {
          this.selectedDayId = dayId;
          this.selectedDetailTerminal = 'ALL';
          this.activeDetailTab = 'resumen';
          this._resetLoadedDetailData();
          this.renderFullLayout();
        }
      });
    });

    this._attachDetailPanelListeners();
  }

  _attachDetailPanelListeners() {
    this.container.querySelectorAll('.btn-select-detail-pc').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedDetailTerminal = btn.dataset.pc || 'ALL';
        const selectedDay = this.consolidatedDays.find(d => d.id === this.selectedDayId);
        if (selectedDay) this._refreshDetailPanelOnly(selectedDay);
      });
    });

    this.container.querySelectorAll('.btn-closing-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        if (tabId) this.loadTabOnDemand(tabId);
      });
    });

    const cutSearchInput = document.getElementById('input-search-cut');
    if (cutSearchInput) {
      cutSearchInput.addEventListener('input', (e) => {
        this.filters.cutSearch = e.target.value;
        const selectedDay = this.consolidatedDays.find(d => d.id === this.selectedDayId);
        if (selectedDay) {
          this._refreshDetailPanelOnly(selectedDay);
          const restoredInput = document.getElementById('input-search-cut');
          if (restoredInput) {
            restoredInput.focus();
            restoredInput.setSelectionRange(restoredInput.value.length, restoredInput.value.length);
          }
        }
      });
    }

    const btnExportExcel = document.getElementById('btn-export-day-excel');
    if (btnExportExcel) {
      btnExportExcel.addEventListener('click', async () => {
        const selectedDay = this.consolidatedDays.find(d => d.id === this.selectedDayId);
        if (!selectedDay) return;

        const originalText = btnExportExcel.innerHTML;
        btnExportExcel.innerHTML = '⏳ Generando Excel...';
        btnExportExcel.disabled = true;

        try {
          const [rawCuts, extractions, rawMats, accSales] = await Promise.all([
            this.repository.getSubcollectionOnDemand(selectedDay.sessions, 'sales_by_cut'),
            this.repository.getSubcollectionOnDemand(selectedDay.sessions, 'extractions'),
            this.repository.getSubcollectionOnDemand(selectedDay.sessions, 'raw_materials'),
            this.repository.getSubcollectionOnDemand(selectedDay.sessions, 'account_sales')
          ]);

          const filteredRawCuts = this.selectedDetailTerminal === 'ALL'
            ? rawCuts
            : rawCuts.filter(c => c._sourceDeviceId === this.selectedDetailTerminal);

          const aggregatedCuts = DailyCashClosingAggregator.aggregateSalesByCut(filteredRawCuts);
          const uniqueRawMats = DailyCashClosingAggregator.deduplicateRawMaterialBatches(rawMats);

          DailyClosingExcelExporter.exportToExcel(
            selectedDay,
            {
              cuts: aggregatedCuts,
              extractions,
              rawMaterials: uniqueRawMats,
              accountSales: accSales
            },
            this.selectedDetailTerminal
          );
          ToastService.success('Reporte Excel generado y descargado exitosamente.');
        } catch (err) {
          console.error('[DailyCashClosingsUI] Error exportando a Excel:', err);
          ToastService.error('Ocurrió un error al generar el archivo Excel.');
        } finally {
          btnExportExcel.innerHTML = originalText;
          btnExportExcel.disabled = false;
        }
      });
    }
  }
}
