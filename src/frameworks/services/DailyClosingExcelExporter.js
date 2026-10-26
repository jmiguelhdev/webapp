/**
 * @file DailyClosingExcelExporter.js
 * @description Generador de reportes Excel (.xlsx) para cierres de caja diarios consolidados y multi-PC.
 * Espeja la estructura de DesktopExcelExporter.kt comenzando con "1. COMPARACIÓN GLOBAL: VENTAS SISTEMA VS. DECLARADO POR CAJEROS (CONSOLIDADO)".
 * @module frameworks/services/DailyClosingExcelExporter
 */
import * as XLSX from 'xlsx';
import { parseCashExtractionBreakdown } from '../../adapters/api/CashExtractionApi.js';
import { DailyCashClosingAggregator } from './DailyCashClosingAggregator.js';

export class DailyClosingExcelExporter {
  /**
   * Genera y descarga el archivo Excel (.xlsx) del cierre de caja diario de una sucursal.
   *
   * @param {Object} branchDay - Objeto consolidado devuelto por DailyCashClosingAggregator.consolidateBranchDay
   * @param {Object} [details={}] - Subcolecciones opcionales ya cargadas o descargadas para el reporte:
   *   { cuts, extractions, accountSales, collections, rawMaterials }
   * @param {string} [selectedTerminal='ALL'] - Si el usuario filtró por una PC específica o 'ALL'.
   */
  static exportToExcel(branchDay, details = {}, selectedTerminal = 'ALL') {
    const wb = XLSX.utils.book_new();

    // Determinar si exportamos el consolidado total o solo una terminal seleccionada
    const targetData = selectedTerminal !== 'ALL'
      ? (branchDay.terminals.find(t => t.deviceId === selectedTerminal) || branchDay)
      : branchDay;

    const gc = targetData.globalComparison || DailyCashClosingAggregator.computeGlobalComparison(targetData);

    const scopeLabel = selectedTerminal !== 'ALL'
      ? `Terminal: ${selectedTerminal} (${targetData.sessionCount || 1} Turno/s)`
      : `Consolidado Sucursal (${branchDay.terminalCount} PCs / ${branchDay.sessionCount} Turnos)`;

    const totSales = Number(targetData.totalSalesAmount || 0);
    const pct = (v) => totSales > 0 ? `${((Number(v || 0) / totSales) * 100).toFixed(1)}%` : '0.0%';

    // =========================================================================
    // HOJA 1: 1. RESUMEN EJECUTIVO (ESPEJANDO DesktopExcelExporter.kt)
    // =========================================================================
    const resumenRows = [
      ['REPORTE EJECUTIVO Y AUDITORÍA DE CIERRE DE CAJA - FRIGORÍFICO PAMPA'],
      ['Sucursal / Carnicería:', branchDay.butcheryName],
      ['Fecha del Cierre:', branchDay.dateStr],
      ['Alcance del Reporte:', scopeLabel],
      ['Operadores / Cajeros:', (targetData.operators || branchDay.operators || []).join(', ') || 'S/D'],
      [],
      // SECCIÓN 1: COMPARACIÓN GLOBAL: VENTAS SISTEMA VS. DECLARADO POR CAJEROS (CONSOLIDADO)
      ['1. COMPARACIÓN GLOBAL: VENTAS SISTEMA VS. DECLARADO POR CAJEROS (CONSOLIDADO)'],
      ['CONCEPTO (TODOS LOS MEDIOS DE PAGO UNIFICADOS)', 'REGISTRADO SISTEMA ($)', 'DECLARADO CAJEROS ($)', 'OBSERVACIONES / FÓRMULA'],
      [
        '(+) Total Ventas Registradas por Sistema',
        Number(gc.systemTotalSales || 0),
        '',
        'Suma de ventas en Efectivo + Electrónico + Cheques + Cta. Cte. de todas las PCs'
      ],
      [
        '(-) Ventas a Cuenta Corriente (Saldo Impago)',
        -Number(gc.systemDebtSales || 0),
        '',
        'Ventas fiadas en el día que no generan ingreso físico ni electrónico en caja'
      ],
      [
        '(+) Cobranzas de Cta. Cte. Recibidas en Caja',
        Number(gc.systemAccountCollections || 0),
        '',
        'Pagos recibidos hoy en caja de deudas de clientes de días anteriores'
      ],
      [
        '(-) Gastos y Egresos Abonados desde Caja',
        -Number(gc.systemExpenses || 0),
        '',
        'Gastos pagados con efectivo de la caja que restan del monto a rendir'
      ],
      [
        '(=) TOTAL NETO SISTEMA A RENDIR (VENTAS COBRADAS NETAS)',
        Number(gc.totalNetoSistemaARendir || 0),
        '',
        'Total Ventas - Ventas Cta. Cte. + Cobranzas Cta. Cte. - Gastos'
      ],
      [
        '(+) Retiros de Efectivo (Entregas a Seguridad / Sobres)',
        '',
        Number(gc.declaredExtractions || 0),
        'Efectivo retirado en sobres durante los turnos'
      ],
      [
        '(-) Fondo Inicial de Cajas (Apertura)',
        '',
        -Number(gc.declaredInitialCash || 0),
        'Se descuenta el cambio inicial con el que abrieron las cajas'
      ],
      [
        '(+) Cambio Final en Cajas (Remanente en Gavetas)',
        '',
        Number(gc.declaredActualCash || 0),
        `Conteo físico de efectivo al cierre (Efectivo Neto = $${Number(gc.declaredNetCash || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })})`
      ],
      [
        '(+) Comprobantes Electrónicos Declarados (Tarjetas / QR / Transf.)',
        '',
        Number(gc.declaredElectronic || 0),
        'Suma de lotes de posnet, QR y transferencias declarados por los cajeros'
      ],
      [
        '(+) Cheques Físicos en Cartera Declarados',
        '',
        Number(gc.declaredCheck || 0),
        'Total en valores / cheques recibidos declarados por los cajeros'
      ],
      [
        '(=) TOTAL GENERAL DECLARADO POR CAJEROS',
        '',
        Number(gc.totalGeneralDeclaradoPorCajeros || 0),
        'Retiros - Fondo Inicial + Cambio Final + Electrónicos Declarados + Cheques Declarados'
      ],
      [
        'DIFERENCIA GLOBAL (DECLARADO CAJEROS - REGISTRADO SISTEMA)',
        Number(gc.totalNetoSistemaARendir || 0),
        Number(gc.totalGeneralDeclaradoPorCajeros || 0),
        `${gc.status}: $${Number(gc.globalDifference || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })} (Compensa cruces Efectivo/Digital y entre PC 1 / PC 2)`
      ],
      [],
      // SECCIÓN 2: RESUMEN GENERAL DE VENTAS POR MEDIO DE PAGO (INFORMATIVO SEGÚN SISTEMA)
      ['2. RESUMEN GENERAL DE VENTAS POR MEDIO DE PAGO (INFORMATIVO SEGÚN SISTEMA)', '% PART.', 'IMPORTE ($)', 'DETALLE'],
      ['Ventas en Efectivo (según Sistema)', pct(targetData.cashSalesAmount), Number(targetData.cashSalesAmount || 0), 'Registrado como efectivo por el operador'],
      ['Cobros Electrónicos (Tarjetas / QR / Transferencias)', pct(targetData.electronicSalesAmount), Number(targetData.electronicSalesAmount || 0), 'Registrado como medio digital por el operador'],
      ['Cobros con Cheque', pct(targetData.checkSalesAmount), Number(targetData.checkSalesAmount || 0), 'Registrado como cheque'],
      ['Ventas a Cuenta Corriente (Fiado / Saldo Impago)', pct(targetData.debtSalesAmount), Number(targetData.debtSalesAmount || 0), 'No ingresa a gaveta'],
      ['TOTAL VENTAS CONSOLIDADAS', '100.0%', Number(targetData.totalSalesAmount || 0), `${Number(targetData.totalWeightKg || 0).toFixed(2)} kg comercializados`],
      ['Cobranzas Cta. Cte. Recibidas (informativo)', '-', Number(targetData.accountCollectionsTotal || 0), 'Ingresos por cobro de deudas pasadas'],
      [],
      // SECCIÓN 3: ARQUEO Y CONCILIACIÓN CONSOLIDADA DE EFECTIVO (INFORMATIVO)
      ['3. ARQUEO Y CONCILIACIÓN CONSOLIDADA DE EFECTIVO (INFORMATIVO)', 'IMPORTE ($)'],
      ['(+) Fondo Inicial de Cajas (Apertura)', Number(targetData.initialCash || 0)],
      ['(+) Ventas en Efectivo', Number(targetData.cashSalesAmount || 0)],
      ['(+) Cobranzas de Cuenta Corriente en Caja', Number(targetData.accountCollectionsTotal || 0)],
      ['(-) Gastos / Egresos Pagados por Caja', -Number(targetData.totalExpenses || 0)],
      ['(-) Retiros de Efectivo (Entregas Parciales / Seguridad)', -Number(targetData.totalExtractions || 0)],
      ['(=) EFECTIVO ESPERADO EN CAJA AL CIERRE (SISTEMA)', Number(targetData.expectedCash || 0)],
      ['EFECTIVO REAL DECLARADO EN CAJA (CONTEO FÍSICO)', Number(targetData.actualCash || 0)],
      ['DIFERENCIA DE EFECTIVO (DECLARADO - ESPERADO)', Number(targetData.diffCash || 0)],
      [],
      // SECCIÓN 4: ARQUEO CONSOLIDADO DE COMPROBANTES ELECTRÓNICOS Y CHEQUES (INFORMATIVO)
      ['4. ARQUEO CONSOLIDADO DE COMPROBANTES ELECTRÓNICOS Y CHEQUES (INFORMATIVO)', 'ESPERADO SISTEMA ($)', 'DECLARADO CAJERO ($)', 'DIFERENCIA ($)'],
      ['Medios Electrónicos (Tarjetas / QR / Transferencias)', Number(targetData.expectedElectronic || 0), Number(targetData.actualElectronic || 0), Number(targetData.diffElectronic || 0)],
      ['Cheques en Cartera', Number(targetData.expectedCheck || 0), Number(targetData.actualCheck || 0), Number(targetData.diffCheck || 0)],
      [],
      // SECCIÓN 5: RENDIMIENTO CÁRNICO Y MATERIA PRIMA (NIVEL SUCURSAL)
      ['5. RENDIMIENTO CÁRNICO Y MATERIA PRIMA (NIVEL SUCURSAL)', 'VALOR'],
      ['Kilos Materia Prima Ingresada en el Día (kg)', Number(branchDay.rawMaterialTotalKg || 0)],
      ['Costo Total Materia Prima ($)', Number(branchDay.rawMaterialTotalCost || 0)],
      ['Costo Promedio Compra ($/kg)', Number(branchDay.rawMaterialAvgCostPerKg || 0)],
      ['Precio Promedio Venta ($/kg)', Number(branchDay.avgSalesPricePerKg || 0)],
      ['Rendimiento Cárnico (%)', `${Number(branchDay.meatYieldPercentage || 0).toFixed(2)}%`],
      ['Merma / Hueso / Descarte (kg)', Number(branchDay.weightDifferenceKg || 0)],
      ['Margen Bruto Operativo ($)', Number(branchDay.grossMarginAmount || 0)],
      ['Margen Bruto Porcentual (%)', `${Number(branchDay.grossMarginPercentage || 0).toFixed(2)}%`],
      [],
      ['6. OBSERVACIONES Y NOTAS DEL CIERRE'],
      [branchDay.notes || 'Sin observaciones registradas.']
    ];

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
    wsResumen['!cols'] = [{ wch: 56 }, { wch: 22 }, { wch: 22 }, { wch: 62 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, '1. Resumen Ejecutivo');

    // =========================================================================
    // HOJA 2: COMPARATIVO INDIVIDUAL POR CAJA / TURNO Y POR PC
    // =========================================================================
    const shifts = branchDay.shiftReports || [];
    if (shifts.length > 0) {
      const headers = [
        'CONCEPTO / INDICADOR',
        ...shifts.map((s, idx) => `Turno ${idx + 1}: ${s.deviceId} (${s.closingType})`),
        'TOTAL CONSOLIDADO'
      ];

      const shiftComparisonRows = [
        ['COMPARATIVO INDIVIDUAL POR CAJA / TURNO Y CONSOLIDADO DE SUCURSAL'],
        ['Sucursal:', branchDay.butcheryName, 'Fecha:', branchDay.dateStr, 'Terminales Detectadas:', `${branchDay.terminalCount} PC(s)`],
        [],
        headers,
        ['Terminal / PC Asignada', ...shifts.map(s => s.deviceId), `${branchDay.terminalCount} PC(s)`],
        ['ID Sesión', ...shifts.map(s => `#${s.shortId}`), `${shifts.length} sesiones`],
        ['Tipo de Cierre', ...shifts.map(s => s.closingType), 'CONSOLIDADO'],
        ['Operador / Cajero', ...shifts.map(s => s.operatorEmail || '-'), (branchDay.operators || []).join(', ')],
        [
          'Horario (Apertura - Cierre)',
          ...shifts.map(s => `${DailyCashClosingAggregator.toArgentinaTimeString(s.openedAt)} - ${DailyCashClosingAggregator.toArgentinaTimeString(s.closedAt)}`),
          '-'
        ],
        [],
        ['--- 1. COMPARACIÓN GLOBAL (SISTEMA VS DECLARADO) ---'],
        [
          '(+) Total Ventas Sistema ($)',
          ...shifts.map(s => Number(s.totalSalesAmount || 0)),
          Number(branchDay.totalSalesAmount || 0)
        ],
        [
          '(-) Ventas Cuenta Corriente ($)',
          ...shifts.map(s => -Number(s.debtSalesAmount || 0)),
          -Number(branchDay.debtSalesAmount || 0)
        ],
        [
          '(+) Cobranzas Cta. Cte. ($)',
          ...shifts.map(s => Number(s.accountCollectionsTotal || 0)),
          Number(branchDay.accountCollectionsTotal || 0)
        ],
        [
          '(-) Gastos de Caja ($)',
          ...shifts.map(s => -Number(s.totalExpenses || 0)),
          -Number(branchDay.totalExpenses || 0)
        ],
        [
          '(=) TOTAL NETO SISTEMA A RENDIR ($)',
          ...shifts.map(s => Number(s.globalComparison?.totalNetoSistemaARendir || 0)),
          Number(branchDay.globalComparison?.totalNetoSistemaARendir || 0)
        ],
        [
          '(+) Retiros a Seguridad / Sobres ($)',
          ...shifts.map(s => Number(s.totalExtractions || 0)),
          Number(branchDay.totalExtractions || 0)
        ],
        [
          '(-) Fondo Inicial Apertura ($)',
          ...shifts.map(s => -Number(s.initialCash || 0)),
          -Number(branchDay.initialCash || 0)
        ],
        [
          '(+) Cambio Final en Gaveta ($)',
          ...shifts.map(s => Number(s.actualCash || 0)),
          Number(branchDay.actualCash || 0)
        ],
        [
          '(+) Electrónicos Declarados ($)',
          ...shifts.map(s => Number(s.actualElectronic || 0)),
          Number(branchDay.actualElectronic || 0)
        ],
        [
          '(+) Cheques Declarados ($)',
          ...shifts.map(s => Number(s.actualCheck || 0)),
          Number(branchDay.actualCheck || 0)
        ],
        [
          '(=) TOTAL GENERAL DECLARADO POR CAJEROS ($)',
          ...shifts.map(s => Number(s.globalComparison?.totalGeneralDeclaradoPorCajeros || 0)),
          Number(branchDay.globalComparison?.totalGeneralDeclaradoPorCajeros || 0)
        ],
        [
          'DIFERENCIA GLOBAL (DECLARADO - SISTEMA) ($)',
          ...shifts.map(s => Number(s.globalComparison?.globalDifference || 0)),
          Number(branchDay.globalComparison?.globalDifference || 0)
        ],
        [],
        ['--- 2. DESGLOSE INFORMATIVO POR MEDIO DE PAGO ---'],
        ['Ventas en Efectivo ($)', ...shifts.map(s => Number(s.cashSalesAmount || 0)), Number(branchDay.cashSalesAmount || 0)],
        ['Ventas Electrónicas ($)', ...shifts.map(s => Number(s.electronicSalesAmount || 0)), Number(branchDay.electronicSalesAmount || 0)],
        ['Ventas con Cheques ($)', ...shifts.map(s => Number(s.checkSalesAmount || 0)), Number(branchDay.checkSalesAmount || 0)],
        ['Kilos Vendidos (kg)', ...shifts.map(s => Number(s.totalWeightKg || 0)), Number(branchDay.totalWeightKg || 0)],
        ['Diferencia Efectivo ($)', ...shifts.map(s => Number(s.diffCash || 0)), Number(branchDay.diffCash || 0)],
        ['Diferencia Electrónico ($)', ...shifts.map(s => Number(s.diffElectronic || 0)), Number(branchDay.diffElectronic || 0)]
      ];

      const wsShifts = XLSX.utils.aoa_to_sheet(shiftComparisonRows);
      wsShifts['!cols'] = [
        { wch: 44 },
        ...shifts.map(() => ({ wch: 24 })),
        { wch: 24 }
      ];
      XLSX.utils.book_append_sheet(wb, wsShifts, '2. Comparativo Caja-Turno');
    }

    // =========================================================================
    // HOJA 3: VENTAS POR CORTE CÁRNICO
    // =========================================================================
    const cuts = details.cuts || [];
    if (cuts.length > 0) {
      const cutRows = [
        ['DETALLE DE VENTAS POR CORTE CÁRNICO'],
        ['Sucursal:', branchDay.butcheryName, 'Fecha:', branchDay.dateStr, 'Alcance:', scopeLabel],
        [],
        ['PLU / ID', 'CORTE DE CARNE', 'KILOS VENDIDOS (kg)', 'TOTAL FACTURADO ($)', 'PRECIO PROMEDIO ($/kg)', '% PART. KILOS', '% PART. FACTURACIÓN'],
        ...cuts.map(c => [
          c.productId,
          c.productName,
          Number(c.weightKg || 0),
          Number(c.totalAmount || 0),
          Number(c.avgPricePerKg || 0),
          Number((c.shareKgPct || 0).toFixed(2)),
          Number((c.shareAmountPct || 0).toFixed(2))
        ])
      ];

      const wsCuts = XLSX.utils.aoa_to_sheet(cutRows);
      wsCuts['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsCuts, '3. Ventas por Corte');
    }

    // =========================================================================
    // HOJA 4: RETIROS DE EFECTIVO Y DESGLOSE DE BILLETES
    // =========================================================================
    const extractions = details.extractions || [];
    if (extractions.length > 0) {
      const extRows = [
        ['RETIROS DE EFECTIVO ENTREGADOS A SEGURIDAD Y DESGLOSE DE BILLETES'],
        ['Sucursal:', branchDay.butcheryName, 'Fecha:', branchDay.dateStr],
        [],
        ['HORA', 'TERMINAL / PC', 'DESCRIPCIÓN / GUARDIA', 'MONTO SOBRE ($)', 'DESGLOSE DE BILLETES (FAJOS Y SUELTOS)']
      ];

      extractions.forEach(ext => {
        const timeStr = ext.timestamp ? new Date(Number(ext.timestamp)).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const parsed = parseCashExtractionBreakdown(ext.billeteBreakdownJson);
        const breakdownText = parsed.items
          .filter(b => b.fajos > 0 || b.sueltos > 0)
          .map(b => `$${b.denominacion}: ${b.fajos} fajos + ${b.sueltos} sueltos ($${b.subtotal.toLocaleString('es-AR')})`)
          .join(' | ') || 'Sin desglose de billetes';

        extRows.push([
          timeStr,
          ext._sourceDeviceId || 'PC 1',
          ext.description || 'Retiro a seguridad',
          Number(ext.amount || 0),
          breakdownText
        ]);
      });

      const wsExt = XLSX.utils.aoa_to_sheet(extRows);
      wsExt['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 34 }, { wch: 18 }, { wch: 65 }];
      XLSX.utils.book_append_sheet(wb, wsExt, '4. Retiros y Billetes');
    }

    // =========================================================================
    // HOJA 5: MATERIA PRIMA Y CUENTAS CORRIENTES (SI DISPONIBLES)
    // =========================================================================
    const rawMaterials = details.rawMaterials || [];
    const accountSales = details.accountSales || [];
    if (rawMaterials.length > 0 || accountSales.length > 0) {
      const extraRows = [
        ['LOTES DE MATERIA PRIMA RECIBIDOS EN EL DÍA (DEDUPLICADOS)'],
        ['LOTE ID', 'TROPA N°', 'PROVEEDOR', 'PRODUCTO', 'KILOS (kg)', 'COSTO ($/kg)', 'COSTO TOTAL ($)']
      ];

      rawMaterials.forEach(rm => {
        extraRows.push([
          rm.batchId || rm.id,
          rm.tropaNumber || '-',
          rm.providerName || '-',
          rm.rawMaterialProductName || '-',
          Number(rm.weightKg || 0),
          Number(rm.costPerKg || 0),
          Number(rm.totalCost || 0)
        ]);
      });

      extraRows.push([]);
      extraRows.push(['VENTAS FIADAS A CUENTA CORRIENTE EN EL TURNO']);
      extraRows.push(['TERMINAL', 'CLIENTE', 'PRODUCTO / CORTE', 'KILOS (kg)', 'PRECIO ($/kg)', 'SUBTOTAL ($)', 'SALDO IMPAGO ($)']);

      accountSales.forEach(as => {
        extraRows.push([
          as._sourceDeviceId || 'PC 1',
          as.customerName || as.customerId || '-',
          as.productName || '-',
          Number(as.weightKg || 0),
          Number(as.pricePerKg || 0),
          Number(as.subtotal || 0),
          Number(as.unpaidDebt || 0)
        ]);
      });

      const wsExtra = XLSX.utils.aoa_to_sheet(extraRows);
      wsExtra['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 28 }, { wch: 24 }, { wch: 15 }, { wch: 16 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsExtra, '5. MateriaPrima_CtaCte');
    }

    const safeBranch = String(branchDay.butcheryName || 'Sucursal').replace(/[^a-zA-Z0-9_-]/g, '_');
    const pcSuffix = selectedTerminal !== 'ALL' ? `_${selectedTerminal.replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
    const fileName = `Cierre_Caja_${safeBranch}_${branchDay.dateStr}${pcSuffix}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }
}
