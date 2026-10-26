/**
 * @file DailyCashClosingAggregator.js
 * @description Motor de consolidación para cierres de caja diarios ('daily_cash_closings').
 * Soporta múltiples computadoras/terminales (PCs) por carnicería (incluso cuando sourceDeviceId viene vacío en Firestore),
 * desempaquetado y deduplicación de turnos embebidos en dailyConsolidated.shiftsSummary,
 * cálculo de "1. COMPARACIÓN GLOBAL: VENTAS SISTEMA VS. DECLARADO POR CAJEROS (CONSOLIDADO)" (idéntico a DesktopExcelExporter.kt),
 * deduplicación de materia prima y agregación bajo demanda de cortes y puntos de venta.
 * @module frameworks/services/DailyCashClosingAggregator
 */

export class DailyCashClosingAggregator {
  /**
   * Convierte un timestamp epoch (ms) a cadena 'YYYY-MM-DD' en zona horaria Argentina.
   * @param {number} epochMs
   * @returns {string} Fecha en formato YYYY-MM-DD
   */
  static toArgentinaDateString(epochMs) {
    if (!epochMs) return 'Sin-Fecha';
    const d = new Date(Number(epochMs));
    const parts = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(d);

    const year = parts.find(p => p.type === 'year')?.value || '2026';
    const month = parts.find(p => p.type === 'month')?.value || '01';
    const day = parts.find(p => p.type === 'day')?.value || '01';
    return `${year}-${month}-${day}`;
  }

  /**
   * Formatea hora 'HH:mm' en zona horaria Argentina.
   * @param {number} epochMs
   * @returns {string}
   */
  static toArgentinaTimeString(epochMs) {
    if (!epochMs) return '--:--';
    return new Date(Number(epochMs)).toLocaleTimeString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Calcula el bloque "1. COMPARACIÓN GLOBAL: VENTAS SISTEMA VS. DECLARADO POR CAJEROS (CONSOLIDADO)"
   * exactamente con las mismas fórmulas de DesktopExcelExporter.kt (líneas 2515-2612).
   * Compensa automáticamente errores de imputación entre Efectivo y Digital y rendiciones cruzadas entre PC 1 y PC 2.
   *
   * @param {Object} totals - Sumatorias de ventas, gastos, cobranzas y arqueos declarados.
   * @returns {Object} Objeto con el desglose Lado Sistema, Lado Declarado y Diferencia Global Unificada.
   */
  static computeGlobalComparison(totals) {
    const systemTotalSales = Number(totals.totalSalesAmount || 0);
    const systemDebtSales = Number(totals.debtSalesAmount || 0);
    const systemAccountCollections = Number(totals.accountCollectionsTotal || 0);
    const systemExpenses = Number(totals.totalExpenses || 0);

    // (=) TOTAL NETO SISTEMA A RENDIR (VENTAS COBRADAS NETAS)
    const totalNetoSistemaARendir =
      systemTotalSales - systemDebtSales + systemAccountCollections - systemExpenses;

    const declaredExtractions = Number(totals.totalExtractions || 0);
    const declaredInitialCash = Number(totals.sumInitialCash ?? totals.initialCash ?? 0);
    const declaredActualCash = Number(totals.sumActualCash ?? totals.actualCash ?? 0);
    const declaredNetCash = declaredExtractions - declaredInitialCash + declaredActualCash;
    const declaredElectronic = Number(totals.actualElectronic || 0);
    const declaredCheck = Number(totals.actualCheck || 0);

    // (=) TOTAL GENERAL DECLARADO POR CAJEROS
    const totalGeneralDeclaradoPorCajeros =
      declaredExtractions - declaredInitialCash + declaredActualCash + declaredElectronic + declaredCheck;

    // DIFERENCIA GLOBAL (DECLARADO CAJEROS - REGISTRADO SISTEMA)
    const globalDifference = totalGeneralDeclaradoPorCajeros - totalNetoSistemaARendir;

    let status = 'CAJA EXACTA';
    if (globalDifference > 0.99) {
      status = 'SOBRANTE GLOBAL';
    } else if (globalDifference < -0.99) {
      status = 'FALTANTE GLOBAL';
    }

    return {
      // Lado Registrado por Sistema ($)
      systemTotalSales,
      systemDebtSales,
      systemAccountCollections,
      systemExpenses,
      totalNetoSistemaARendir,

      // Lado Declarado por Cajeros ($)
      declaredExtractions,
      declaredInitialCash,
      declaredActualCash,
      declaredNetCash,
      declaredElectronic,
      declaredCheck,
      totalGeneralDeclaradoPorCajeros,

      // Diferencia Global Unificada
      globalDifference,
      status
    };
  }

  /**
   * Extrae y deduplica todas las sesiones de un día y sucursal, incluyendo tanto los documentos raíz
   * de 'daily_cash_closings' como cualquier turno previo del mismo día embebido en 'dailyConsolidated.shiftsSummary'.
   *
   * @param {string} dateStr - 'YYYY-MM-DD'
   * @param {string} butcheryName - Nombre de la carnicería
   * @param {Array<Object>} rootSessions - Documentos raíz de ese día y sucursal
   * @returns {Array<Object>} Lista de sesiones únicas del día
   */
  static extractUniqueDaySessions(dateStr, butcheryName, rootSessions) {
    const byId = new Map();

    // 1. Primero registrar todos los documentos raíz (tienen prioridad porque contienen todos los campos y subcolecciones)
    rootSessions.forEach(doc => {
      const id = String(doc.closingId || doc.sessionId || doc.id || '').trim();
      if (!id) return;
      byId.set(id, {
        ...doc,
        closingId: id,
        _isRootDoc: true
      });
    });

    // 2. Inspeccionar dailyConsolidated.shiftsSummary por si hay turnos del mismo día que no se subieron como doc raíz separado
    rootSessions.forEach(doc => {
      const shiftsSummary = doc.dailyConsolidated?.shiftsSummary;
      if (!Array.isArray(shiftsSummary)) return;

      shiftsSummary.forEach(shift => {
        const sId = String(shift.sessionId || shift.closingId || '').trim();
        if (!sId || byId.has(sId)) return;

        const shiftTs = Number(shift.closedAt || shift.openedAt || 0);
        const shiftDate = DailyCashClosingAggregator.toArgentinaDateString(shiftTs);
        if (shiftDate !== dateStr) return;

        byId.set(sId, {
          closingId: sId,
          sessionId: sId,
          butcheryName: doc.butcheryName || butcheryName,
          sourceDeviceId: shift.sourceDeviceId || doc.sourceDeviceId || '',
          closingType: shift.closingType || 'PARCIAL',
          openedAt: Number(shift.openedAt || 0),
          closedAt: Number(shift.closedAt || 0),
          operatorEmail: shift.operatorEmail || doc.operatorEmail || '',
          initialCash: Number(shift.initialCash || 0),
          cashSalesAmount: Number(shift.cashSalesAmount || 0),
          electronicSalesAmount: Number(shift.electronicSalesAmount || 0),
          checkSalesAmount: Number(shift.checkSalesAmount || 0),
          debtSalesAmount: Number(shift.debtSalesAmount || 0),
          totalSalesAmount: Number(shift.totalSalesAmount || 0),
          totalWeightKg: Number(shift.totalWeightKg || 0),
          totalExpenses: Number(shift.totalExpenses || 0),
          totalExtractions: Number(shift.totalExtractions || 0),
          accountCollectionsTotal: Number(shift.accountCollectionsTotal || 0),
          expectedCash: Number(shift.expectedCash || 0),
          actualCash: Number(shift.actualCash ?? 0),
          diffCash: Number(shift.diffCash || 0),
          expectedElectronic: Number(shift.expectedElectronic || 0),
          actualElectronic: Number(shift.actualElectronic ?? 0),
          diffElectronic: Number(shift.diffElectronic || 0),
          expectedCheck: Number(shift.expectedCheck || 0),
          actualCheck: Number(shift.actualCheck ?? 0),
          diffCheck: Number(shift.diffCheck || 0),
          expectedDebt: Number(shift.expectedDebt || shift.debtSalesAmount || 0),
          notes: shift.notes || '',
          _isRootDoc: false
        });
      });
    });

    return Array.from(byId.values());
  }

  /**
   * Asigna cada sesión del día a su computadora/terminal física (`PC 1`, `PC 2`, etc.).
   * Resuelve el caso real de sucursales como 'pampa roca' donde las 2 PCs suben `sourceDeviceId: ""` (vacío):
   * - Si las sesiones tienen horarios superpuestos (ej. 2 turnos mañana abiertos a las 08:14 en simultáneo),
   *   se asignan a distintas PCs (`PC 1`, `PC 2`).
   * - Si una sesión abre después de que otra cerró (ej. turno tarde tras turno mañana en la misma máquina),
   *   se encadena en la misma pista de PC priorizando coincidencia de arrastre de caja (`initialCash === prev.actualCash`)
   *   y cercanía temporal entre el cierre del turno anterior y la apertura del nuevo.
   *
   * @param {Array<Object>} uniqueSessions - Sesiones únicas del día y sucursal.
   * @returns {Map<string, Array<Object>>} Mapa de `deviceId -> Array<session>`
   */
  static assignSessionsToTerminals(uniqueSessions) {
    const sorted = [...uniqueSessions].sort((a, b) => {
      const openDiff = Number(a.openedAt || 0) - Number(b.openedAt || 0);
      if (openDiff !== 0) return openDiff;
      return Number(a.closedAt || 0) - Number(b.closedAt || 0);
    });

    const explicitMap = new Map();
    const unnamedSessions = [];

    sorted.forEach(s => {
      const rawDev = String(s.sourceDeviceId || '').trim();
      if (rawDev) {
        if (!explicitMap.has(rawDev)) explicitMap.set(rawDev, []);
        explicitMap.get(rawDev).push(s);
      } else {
        unnamedSessions.push(s);
      }
    });

    // Reconstruir pistas de PC para las sesiones con sourceDeviceId vacío
    const tracks = []; // [{ sessions: [], lastSession: Object }]
    const TOLERANCE_MS = 5 * 60 * 1000; // 5 minutos de tolerancia para encadenar turno mañana -> tarde

    unnamedSessions.forEach(session => {
      const sOpen = Number(session.openedAt || 0);
      const sInit = Number(session.initialCash || 0);

      // Buscar pistas cuyo último turno ya haya cerrado antes (o casi al mismo instante) de que abra esta sesión
      const candidateTracks = tracks.filter(t => {
        const lastClose = Number(t.lastSession.closedAt || 0);
        if (!sOpen || !lastClose) return false;
        return sOpen >= (lastClose - TOLERANCE_MS);
      });

      if (candidateTracks.length > 0) {
        // Priorizar la pista donde el cambio final del turno anterior coincide con el fondo inicial del nuevo turno
        // y donde el cierre anterior esté más cercano a la nueva apertura
        candidateTracks.sort((tA, tB) => {
          const prevActualA = Number(tA.lastSession.actualCash ?? -1);
          const prevActualB = Number(tB.lastSession.actualCash ?? -1);
          const matchCashA = Math.abs(prevActualA - sInit) < 1 ? 0 : 1;
          const matchCashB = Math.abs(prevActualB - sInit) < 1 ? 0 : 1;
          if (matchCashA !== matchCashB) return matchCashA - matchCashB;

          const gapA = Math.abs(sOpen - Number(tA.lastSession.closedAt || 0));
          const gapB = Math.abs(sOpen - Number(tB.lastSession.closedAt || 0));
          return gapA - gapB;
        });

        const chosenTrack = candidateTracks[0];
        chosenTrack.sessions.push(session);
        chosenTrack.lastSession = session;
      } else {
        // Se solapa en horario con todas las pistas activas -> Es otra PC física trabajando en paralelo
        tracks.push({
          sessions: [session],
          lastSession: session
        });
      }
    });

    // Ordenar pistas reconstruidas: PC 1 será la caja principal (mayor efectivo rendido o mayor facturación)
    tracks.sort((a, b) => {
      const renderedA = a.sessions.reduce((acc, s) => acc + Number(s.totalExtractions || 0) + Number(s.actualCash || 0) + Number(s.actualElectronic || 0), 0);
      const renderedB = b.sessions.reduce((acc, s) => acc + Number(s.totalExtractions || 0) + Number(s.actualCash || 0) + Number(s.actualElectronic || 0), 0);
      if (Math.abs(renderedB - renderedA) > 1) return renderedB - renderedA;

      const salesA = a.sessions.reduce((acc, s) => acc + Number(s.totalSalesAmount || 0), 0);
      const salesB = b.sessions.reduce((acc, s) => acc + Number(s.totalSalesAmount || 0), 0);
      return salesB - salesA;
    });

    const finalTerminalsMap = new Map();

    // 1. Agregar terminales con nombre explícito
    explicitMap.forEach((list, devId) => {
      finalTerminalsMap.set(devId, list);
    });

    // 2. Agregar terminales reconstruidas (PC 1, PC 2, ...)
    tracks.forEach((track, idx) => {
      const pcLabel = `PC ${idx + 1}`;
      finalTerminalsMap.set(pcLabel, track.sessions);
    });

    return finalTerminalsMap;
  }

  /**
   * Agrupa una lista de documentos raíz de 'daily_cash_closings' por Día Calendario y por Carnicería (butcheryName),
   * consolidando todas las PCs y todos los turnos que operaron en cada sucursal.
   *
   * @param {Array<Object>} rawClosings - Documentos raíz descargados de Firestore.
   * @returns {Array<Object>} Lista de cierres diarios consolidados por sucursal, ordenados del más reciente al más antiguo.
   */
  static groupByDayAndButchery(rawClosings) {
    if (!Array.isArray(rawClosings) || rawClosings.length === 0) return [];

    const dayBranchMap = new Map();

    rawClosings.forEach(doc => {
      const ts = Number(doc.closedAt || doc.openedAt || 0);
      const dateStr = DailyCashClosingAggregator.toArgentinaDateString(ts);
      const butcheryName = String(doc.butcheryName || 'Sucursal Principal').trim();
      const key = `${dateStr}__${butcheryName.toLowerCase()}`;

      if (!dayBranchMap.has(key)) {
        dayBranchMap.set(key, {
          dateStr,
          butcheryName,
          sessions: []
        });
      }
      dayBranchMap.get(key).sessions.push(doc);
    });

    const consolidatedList = [];

    dayBranchMap.forEach(group => {
      const consolidated = DailyCashClosingAggregator.consolidateBranchDay(
        group.dateStr,
        group.butcheryName,
        group.sessions
      );
      consolidatedList.push(consolidated);
    });

    return consolidatedList.sort((a, b) => {
      const cmpDate = b.dateStr.localeCompare(a.dateStr);
      if (cmpDate !== 0) return cmpDate;
      return a.butcheryName.localeCompare(b.butcheryName);
    });
  }

  /**
   * Consolida todas las sesiones y PCs de una sucursal en un día específico.
   *
   * @param {string} dateStr - 'YYYY-MM-DD'
   * @param {string} butcheryName - Nombre de la carnicería
   * @param {Array<Object>} rawSessions - Documentos de cierre de ese día y sucursal
   * @returns {Object} Objeto con el resumen consolidado de la sucursal, `globalComparison`, `terminals` (por PC) y `shiftReports` (por cada reporte/turno).
   */
  static consolidateBranchDay(dateStr, butcheryName, rawSessions) {
    // 1. Extraer y deduplicar todas las sesiones del día (incluyendo shiftsSummary si aplica)
    const uniqueSessions = DailyCashClosingAggregator.extractUniqueDaySessions(dateStr, butcheryName, rawSessions);

    // 2. Asignar sesiones a sus terminales físicas (PC 1, PC 2, etc.)
    const terminalsMap = DailyCashClosingAggregator.assignSessionsToTerminals(uniqueSessions);

    const terminals = [];
    const shiftReports = [];

    // Acumuladores globales del día (idénticos a DesktopExcelExporter.kt líneas 2443-2466)
    let branchOpeningInitialCash = 0; // Suma del fondo inicial del 1er turno de cada PC
    let branchClosingFinalCash = 0;   // Suma del efectivo final del último turno de cada PC
    let branchSumInitialCash = 0;     // totInitial = shifts.sumOf { it.initialCash }
    let branchSumActualCash = 0;      // totActualCash = shifts.sumOf { it.actualCash }
    let branchExpectedCash = 0;
    let branchDiffCash = 0;

    let branchExpectedElectronic = 0;
    let branchActualElectronic = 0;
    let branchDiffElectronic = 0;

    let branchExpectedCheck = 0;
    let branchActualCheck = 0;
    let branchDiffCheck = 0;

    let branchCashSales = 0;
    let branchElectronicSales = 0;
    let branchCheckSales = 0;
    let branchDebtSales = 0;
    let branchTotalSales = 0;
    let branchTotalWeightKg = 0;

    let branchTotalExpenses = 0;
    let branchTotalExtractions = 0;
    let branchAccountCollections = 0;

    const allOperators = new Set();
    const notesList = [];

    // Deduplicación de materia prima a nivel raíz por rawMaterialProductId
    const rawMaterialByTypeMap = new Map();
    let maxRawMaterialKg = 0;
    let maxRawMaterialCost = 0;

    terminalsMap.forEach((pcSessions, deviceId) => {
      // Ordenar turnos de esta PC cronológicamente por apertura
      pcSessions.sort((a, b) => Number(a.openedAt || 0) - Number(b.openedAt || 0));

      const firstShift = pcSessions[0];
      const lastShift = pcSessions[pcSessions.length - 1];

      const pcOpeningInitialCash = Number(firstShift.initialCash || 0);
      const pcClosingFinalCash = Number(lastShift.actualCash ?? 0);

      let pcSumInitialCash = 0;
      let pcSumActualCash = 0;
      let pcCashSales = 0;
      let pcElectronicSales = 0;
      let pcCheckSales = 0;
      let pcDebtSales = 0;
      let pcTotalSales = 0;
      let pcTotalWeightKg = 0;
      let pcExpenses = 0;
      let pcExtractions = 0;
      let pcCollections = 0;

      let pcExpectedCashSum = 0;
      let pcDiffCash = 0;

      let pcExpectedElectronic = 0;
      let pcActualElectronic = 0;
      let pcDiffElectronic = 0;

      let pcExpectedCheck = 0;
      let pcActualCheck = 0;
      let pcDiffCheck = 0;

      const pcOperators = new Set();

      pcSessions.forEach((s, shiftIdx) => {
        // Etiquetar la sesión con la PC reconstruida para que las subcolecciones y tablas la identifiquen
        s._assignedTerminalId = deviceId;

        const shortId = String(s.closingId || '').slice(-6) || `${shiftIdx + 1}`;
        const cType = String(s.closingType || 'GENERAL').toUpperCase();
        const opName = s.operatorEmail || 's/op';
        s._shiftLabel = `${deviceId} • ${cType} (#${shortId})`;

        const sCashSales = s.cashSalesAmount !== undefined
          ? Number(s.cashSalesAmount)
          : Math.max(0, Number(s.expectedCash || 0) - Number(s.initialCash || 0) + Number(s.totalExpenses || 0) + Number(s.totalExtractions || 0));

        const sElecSales = Number(s.electronicSalesAmount ?? s.expectedElectronic ?? 0);
        const sCheckSales = Number(s.checkSalesAmount ?? s.expectedCheck ?? 0);
        const sDebtSales = Number(s.debtSalesAmount ?? s.expectedDebt ?? 0);
        const sTotalSales = Number(s.totalSalesAmount || 0);
        const sWeightKg = Number(s.totalWeightKg || 0);
        const sInitialCash = Number(s.initialCash || 0);
        const sActualCash = Number(s.actualCash ?? 0);
        const sExpectedCash = Number(s.expectedCash || 0);
        const sDiffCash = Number(s.diffCash || 0);
        const sExpenses = Number(s.totalExpenses || 0);
        const sExtractions = Number(s.totalExtractions || 0);
        const sCollections = Number(s.accountCollectionsTotal || 0);
        const sExpectedElec = Number(s.expectedElectronic || 0);
        const sActualElec = Number(s.actualElectronic ?? 0);
        const sDiffElec = Number(s.diffElectronic || 0);
        const sExpectedCheck = Number(s.expectedCheck || 0);
        const sActualCheck = Number(s.actualCheck ?? 0);
        const sDiffCheck = Number(s.diffCheck || 0);

        pcSumInitialCash += sInitialCash;
        pcSumActualCash += sActualCash;
        pcCashSales += sCashSales;
        pcElectronicSales += sElecSales;
        pcCheckSales += sCheckSales;
        pcDebtSales += sDebtSales;
        pcTotalSales += sTotalSales;
        pcTotalWeightKg += sWeightKg;
        pcExpenses += sExpenses;
        pcExtractions += sExtractions;
        pcCollections += sCollections;

        pcExpectedCashSum += sExpectedCash;
        pcDiffCash += sDiffCash;

        pcExpectedElectronic += sExpectedElec;
        pcActualElectronic += sActualElec;
        pcDiffElectronic += sDiffElec;

        pcExpectedCheck += sExpectedCheck;
        pcActualCheck += sActualCheck;
        pcDiffCheck += sDiffCheck;

        if (s.operatorEmail) {
          pcOperators.add(s.operatorEmail);
          allOperators.add(s.operatorEmail);
        }
        if (s.notes && String(s.notes).trim()) {
          notesList.push(`[${deviceId} - ${cType}]: ${String(s.notes).trim()}`);
        }

        // Materia prima del día reportada en raíz (evitar duplicar si 2 PCs reportan la misma base de lotes del local)
        const sRawKg = Number(s.rawMaterialTotalKg || 0);
        const sRawCost = Number(s.rawMaterialTotalCost || 0);
        if (sRawKg > maxRawMaterialKg) {
          maxRawMaterialKg = sRawKg;
          maxRawMaterialCost = sRawCost;
        }
        if (Array.isArray(s.rawMaterialByType)) {
          s.rawMaterialByType.forEach(rm => {
            const rmId = rm.rawMaterialProductId || rm.rawMaterialProductName;
            const existing = rawMaterialByTypeMap.get(rmId);
            if (!existing || Number(rm.weightKg || 0) > Number(existing.weightKg || 0)) {
              rawMaterialByTypeMap.set(rmId, rm);
            }
          });
        }

        // Crear reporte individual de este turno/cierre (para la tabla Comparativo por Caja / Turno igual al Excel)
        const shiftGlobalComp = DailyCashClosingAggregator.computeGlobalComparison({
          totalSalesAmount: sTotalSales,
          debtSalesAmount: sDebtSales,
          accountCollectionsTotal: sCollections,
          totalExpenses: sExpenses,
          totalExtractions: sExtractions,
          sumInitialCash: sInitialCash,
          sumActualCash: sActualCash,
          actualElectronic: sActualElec,
          actualCheck: sActualCheck
        });

        shiftReports.push({
          closingId: s.closingId,
          shortId,
          deviceId,
          closingType: cType,
          operatorEmail: opName,
          openedAt: Number(s.openedAt || 0),
          closedAt: Number(s.closedAt || 0),
          initialCash: sInitialCash,
          actualCash: sActualCash,
          finalActualCash: sActualCash,
          expectedCash: sExpectedCash,
          diffCash: sDiffCash,
          expectedElectronic: sExpectedElec,
          actualElectronic: sActualElec,
          diffElectronic: sDiffElec,
          expectedCheck: sExpectedCheck,
          actualCheck: sActualCheck,
          diffCheck: sDiffCheck,
          cashSalesAmount: sCashSales,
          electronicSalesAmount: sElecSales,
          checkSalesAmount: sCheckSales,
          debtSalesAmount: sDebtSales,
          totalSalesAmount: sTotalSales,
          totalWeightKg: sWeightKg,
          totalExpenses: sExpenses,
          totalExtractions: sExtractions,
          accountCollectionsTotal: sCollections,
          globalComparison: shiftGlobalComp
        });
      });

      const pcCashToJustify = pcSumInitialCash + pcCashSales + pcCollections - pcExpenses;
      const pcCashRendered = pcExtractions + pcSumActualCash;

      const pcGlobalComparison = DailyCashClosingAggregator.computeGlobalComparison({
        totalSalesAmount: pcTotalSales,
        debtSalesAmount: pcDebtSales,
        accountCollectionsTotal: pcCollections,
        totalExpenses: pcExpenses,
        totalExtractions: pcExtractions,
        sumInitialCash: pcSumInitialCash,
        sumActualCash: pcSumActualCash,
        actualElectronic: pcActualElectronic,
        actualCheck: pcActualCheck
      });

      const terminalSummary = {
        deviceId,
        sessionCount: pcSessions.length,
        sessions: pcSessions,
        operators: Array.from(pcOperators),
        firstOpenedAt: Number(firstShift.openedAt || 0),
        lastClosedAt: Number(lastShift.closedAt || 0),
        openingInitialCash: pcOpeningInitialCash,
        closingFinalCash: pcClosingFinalCash,
        initialCash: pcSumInitialCash,
        finalActualCash: pcClosingFinalCash,
        sumActualCash: pcSumActualCash,
        expectedCash: pcExpectedCashSum,
        actualCash: pcSumActualCash,
        diffCash: pcDiffCash,
        expectedElectronic: pcExpectedElectronic,
        actualElectronic: pcActualElectronic,
        diffElectronic: pcDiffElectronic,
        expectedCheck: pcExpectedCheck,
        actualCheck: pcActualCheck,
        diffCheck: pcDiffCheck,
        cashSalesAmount: pcCashSales,
        electronicSalesAmount: pcElectronicSales,
        checkSalesAmount: pcCheckSales,
        debtSalesAmount: pcDebtSales,
        totalSalesAmount: pcTotalSales,
        totalWeightKg: pcTotalWeightKg,
        totalExpenses: pcExpenses,
        totalExtractions: pcExtractions,
        accountCollectionsTotal: pcCollections,
        totalCashToJustify: pcCashToJustify,
        totalCashRendered: pcCashRendered,
        globalComparison: pcGlobalComparison
      };

      terminals.push(terminalSummary);

      // Sumar al consolidado general de la sucursal
      branchOpeningInitialCash += pcOpeningInitialCash;
      branchClosingFinalCash += pcClosingFinalCash;
      branchSumInitialCash += pcSumInitialCash;
      branchSumActualCash += pcSumActualCash;
      branchExpectedCash += pcExpectedCashSum;
      branchDiffCash += pcDiffCash;

      branchExpectedElectronic += pcExpectedElectronic;
      branchActualElectronic += pcActualElectronic;
      branchDiffElectronic += pcDiffElectronic;

      branchExpectedCheck += pcExpectedCheck;
      branchActualCheck += pcActualCheck;
      branchDiffCheck += pcDiffCheck;

      branchCashSales += pcCashSales;
      branchElectronicSales += pcElectronicSales;
      branchCheckSales += pcCheckSales;
      branchDebtSales += pcDebtSales;
      branchTotalSales += pcTotalSales;
      branchTotalWeightKg += pcTotalWeightKg;

      branchTotalExpenses += pcExpenses;
      branchTotalExtractions += pcExtractions;
      branchAccountCollections += pcCollections;
    });

    // Ordenar reportes de turnos cronológicamente por apertura
    shiftReports.sort((a, b) => a.openedAt - b.openedAt);
    shiftReports.forEach((sr, idx) => {
      sr.shiftNumber = idx + 1;
      sr.columnTitle = `Caja/Turno ${idx + 1} (${sr.deviceId} • ${sr.closingType})`;
    });

    // Recalcular indicadores cárnicos consolidados de toda la sucursal
    const rawMaterialByType = Array.from(rawMaterialByTypeMap.values());
    const rawMaterialTotalKg = rawMaterialByType.length > 0
      ? rawMaterialByType.reduce((acc, r) => acc + Number(r.weightKg || 0), 0)
      : maxRawMaterialKg;
    const rawMaterialTotalCost = rawMaterialByType.length > 0
      ? rawMaterialByType.reduce((acc, r) => acc + Number(r.totalCost || 0), 0)
      : maxRawMaterialCost;

    const rawMaterialAvgCostPerKg = rawMaterialTotalKg > 0 ? rawMaterialTotalCost / rawMaterialTotalKg : 0;
    const meatYieldPercentage = rawMaterialTotalKg > 0 ? (branchTotalWeightKg / rawMaterialTotalKg) * 100 : 0;
    const grossMarginAmount = branchTotalSales - rawMaterialTotalCost;
    const grossMarginPercentage = branchTotalSales > 0 ? (grossMarginAmount / branchTotalSales) * 100 : 0;
    const weightDifferenceKg = rawMaterialTotalKg - branchTotalWeightKg;
    const avgSalesPricePerKg = branchTotalWeightKg > 0 ? branchTotalSales / branchTotalWeightKg : 0;

    const totalCashToJustify = branchSumInitialCash + branchCashSales + branchAccountCollections - branchTotalExpenses;
    const totalCashRendered = branchTotalExtractions + branchSumActualCash;

    // 1. COMPARACIÓN GLOBAL: VENTAS SISTEMA VS. DECLARADO POR CAJEROS (CONSOLIDADO)
    const globalComparison = DailyCashClosingAggregator.computeGlobalComparison({
      totalSalesAmount: branchTotalSales,
      debtSalesAmount: branchDebtSales,
      accountCollectionsTotal: branchAccountCollections,
      totalExpenses: branchTotalExpenses,
      totalExtractions: branchTotalExtractions,
      sumInitialCash: branchSumInitialCash,
      sumActualCash: branchSumActualCash,
      actualElectronic: branchActualElectronic,
      actualCheck: branchActualCheck
    });

    return {
      id: `${dateStr}__${butcheryName}`,
      dateStr,
      butcheryName,
      terminalCount: terminals.length,
      sessionCount: uniqueSessions.length,
      terminals,
      shiftReports,
      sessions: uniqueSessions,
      operators: Array.from(allOperators),
      notes: notesList.join(' | '),

      // Bloque 1 Principal: Comparación Global (Sistema vs Declarado por Cajeros)
      globalComparison,

      // Arqueo y Valores Consolidados
      openingInitialCash: branchOpeningInitialCash,
      closingFinalCash: branchClosingFinalCash,
      initialCash: branchSumInitialCash,
      finalActualCash: branchClosingFinalCash,
      sumActualCash: branchSumActualCash,
      expectedCash: branchExpectedCash,
      actualCash: branchSumActualCash,
      diffCash: branchDiffCash,

      expectedElectronic: branchExpectedElectronic,
      actualElectronic: branchActualElectronic,
      diffElectronic: branchDiffElectronic,

      expectedCheck: branchExpectedCheck,
      actualCheck: branchActualCheck,
      diffCheck: branchDiffCheck,

      cashSalesAmount: branchCashSales,
      electronicSalesAmount: branchElectronicSales,
      checkSalesAmount: branchCheckSales,
      debtSalesAmount: branchDebtSales,
      totalSalesAmount: branchTotalSales,
      totalWeightKg: branchTotalWeightKg,

      totalExpenses: branchTotalExpenses,
      totalExtractions: branchTotalExtractions,
      accountCollectionsTotal: branchAccountCollections,

      totalCashToJustify,
      totalCashRendered,

      // Indicadores de Materia Prima y Rendimiento
      rawMaterialTotalKg,
      rawMaterialTotalCost,
      rawMaterialAvgCostPerKg,
      meatYieldPercentage,
      grossMarginAmount,
      grossMarginPercentage,
      weightDifferenceKg,
      avgSalesPricePerKg,
      rawMaterialByType
    };
  }

  /**
   * Agrupa y suma los cortes vendidos ('sales_by_cut') provenientes de una o varias PCs/sesiones.
   *
   * @param {Array<Object>} rawCutDocs - Documentos de la subcolección sales_by_cut.
   * @returns {Array<Object>} Cortes unificados ordenados por mayor facturación o kilos.
   */
  static aggregateSalesByCut(rawCutDocs) {
    if (!Array.isArray(rawCutDocs) || rawCutDocs.length === 0) return [];

    const cutMap = new Map();
    let grandTotalKg = 0;
    let grandTotalAmount = 0;

    rawCutDocs.forEach(item => {
      const prodId = String(item.productId || item.id || 'S/D');
      const prodName = item.productName || `Corte #${prodId}`;
      const kg = Number(item.weightKg || 0);
      const amount = Number(item.totalAmount || 0);
      const pcId = item._sourceDeviceId || 'PC 1';

      grandTotalKg += kg;
      grandTotalAmount += amount;

      if (!cutMap.has(prodId)) {
        cutMap.set(prodId, {
          productId: prodId,
          productName: prodName,
          weightKg: 0,
          totalAmount: 0,
          avgPricePerKg: 0,
          shareKgPct: 0,
          shareAmountPct: 0,
          byTerminal: {}
        });
      }

      const entry = cutMap.get(prodId);
      entry.weightKg += kg;
      entry.totalAmount += amount;
      entry.byTerminal[pcId] = (entry.byTerminal[pcId] || 0) + kg;
    });

    const result = Array.from(cutMap.values()).map(c => ({
      ...c,
      avgPricePerKg: c.weightKg > 0 ? c.totalAmount / c.weightKg : 0,
      shareKgPct: grandTotalKg > 0 ? (c.weightKg / grandTotalKg) * 100 : 0,
      shareAmountPct: grandTotalAmount > 0 ? (c.totalAmount / grandTotalAmount) * 100 : 0
    }));

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Deduplica lotes de materia prima ('raw_materials') por batchId cuando se cargan de múltiples PCs.
   *
   * @param {Array<Object>} rawBatchDocs - Documentos de la subcolección raw_materials.
   * @returns {Array<Object>} Lotes únicos ordenados por fecha/tropa.
   */
  static deduplicateRawMaterialBatches(rawBatchDocs) {
    if (!Array.isArray(rawBatchDocs) || rawBatchDocs.length === 0) return [];

    const uniqueMap = new Map();
    rawBatchDocs.forEach(batch => {
      const batchKey = String(batch.batchId || batch.id || `${batch.tropaNumber}_${batch.barcode}_${batch.weightKg}`);
      if (!uniqueMap.has(batchKey)) {
        uniqueMap.set(batchKey, batch);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => Number(b.date || 0) - Number(a.date || 0));
  }

  /**
   * Agrupa comprobantes fiscales ARCA por Punto de Venta (puntoVenta) cuando se solicitan bajo demanda.
   *
   * @param {Array<Object>} vouchers - Comprobantes de fiscal_invoices.
   * @returns {Array<Object>} Resumen agrupado por Punto de Venta.
   */
  static groupFiscalVouchersByPuntoVenta(vouchers) {
    if (!Array.isArray(vouchers) || vouchers.length === 0) return [];

    const posMap = new Map();

    vouchers.forEach(v => {
      const ptoVta = String(v.puntoVenta || v.ptoVta || 1).padStart(5, '0');
      if (!posMap.has(ptoVta)) {
        posMap.set(ptoVta, {
          puntoVenta: ptoVta,
          count: 0,
          totalFacturado: 0,
          totalNeto: 0,
          totalIva: 0,
          vouchers: []
        });
      }

      const group = posMap.get(ptoVta);
      const tipo = Number(v.tipoComprobante || v.cbteTipo || 6);
      const isCreditNote = [3, 8, 13, 53].includes(tipo);
      const sign = isCreditNote ? -1 : 1;

      group.count += 1;
      group.totalFacturado += sign * Number(v.importeTotal || v.total || 0);
      group.totalNeto += sign * Number(v.importeNetoGravado || 0);
      group.totalIva += sign * Number(v.importeIva || 0);
      group.vouchers.push(v);
    });

    return Array.from(posMap.values()).sort((a, b) => a.puntoVenta.localeCompare(b.puntoVenta));
  }
}
