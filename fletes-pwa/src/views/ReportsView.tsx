import React, { useMemo, useState } from 'react';
import {
  getActualKgFaena,
  getDistanceKm,
  getDriverCost,
  getFleteCost,
  getGastosDelViaje,
  getReimbursableExpenses,
  getTravelDisplayTitle,
  getTravelProfit,
} from '../domain/models';
import { StoreSnapshot } from '../services/persistence';
import {
  WhatsAppShareHelper,
  exportDriverSettlementPdf,
  exportFullWorkbookXlsx,
} from '../services/exporters';
import { Formatters, TerminalHaptics } from '../utils/formatters';
import { MetricCard, SearchablePicker } from '../components/TerminalUI';

type ReportsSubTab = 'DRIVER' | 'TRUCK' | 'SIMULATOR' | 'LOGISTICS';
type FinancialPeriodFilter = 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL';

export const ReportsView: React.FC<{
  store: StoreSnapshot;
  onToast: (msg: string) => void;
}> = ({ store, onToast }) => {
  const [subTab, setSubTab] = useState<ReportsSubTab>('DRIVER');

  // 1. Driver Settlement State
  const [selectedDriverId, setSelectedDriverId] = useState<number>(
    () => store.drivers[0]?.id || 0
  );
  const [driverStartStr, setDriverStartStr] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return Formatters.isoDate(d);
  });
  const [driverEndStr, setDriverEndStr] = useState<string>(() => Formatters.isoDate(new Date()));

  // 2. Truck Finances State
  const [selectedTruckId, setSelectedTruckId] = useState<number | 'ALL'>('ALL');
  const [periodFilter, setPeriodFilter] = useState<FinancialPeriodFilter>('MONTH');

  // 3. Cost Simulator State
  const [simRendimiento, setSimRendimiento] = useState<number>(56.5);
  const [simPrecioVivo, setSimPrecioVivo] = useState<number>(2300);
  const [simDistancia, setSimDistancia] = useState<number>(350);
  const [simIIBB, setSimIIBB] = useState<number>(store.config.defaultPorcentajeIIBB || 1.7);
  const [simMargen, setSimMargen] = useState<number>(10);
  const [simIsDouble, setSimIsDouble] = useState<boolean>(true);

  // 4. Logistics Summary State
  const [logStartStr, setLogStartStr] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return Formatters.isoDate(d);
  });
  const [logEndStr, setLogEndStr] = useState<string>(() => Formatters.isoDate(new Date()));
  const [logProducerId, setLogProducerId] = useState<number | null>(null);
  const [logAgentId, setLogAgentId] = useState<number | null>(null);
  const [logTruckId, setLogTruckId] = useState<number | null>(null);

  // --- Driver Settlement Computed ---
  const activeDriver = useMemo(
    () => store.drivers.find((d) => d.id === selectedDriverId) || store.drivers[0] || null,
    [store.drivers, selectedDriverId]
  );

  const driverTravels = useMemo(() => {
    if (!activeDriver) return [];
    const sDate = Formatters.parseDate(driverStartStr) || new Date(0);
    const eDate = Formatters.parseDate(driverEndStr) || new Date();
    eDate.setHours(23, 59, 59, 999);

    return store.travels.filter((tr) => {
      const matchesDriver =
        tr.truck?.driver?.id === activeDriver.id || tr.truck?.driver?.name === activeDriver.name;
      if (!matchesDriver) return false;
      const d = Formatters.parseDate(tr.date);
      if (!d) return true;
      return d >= sDate && d <= eDate;
    });
  }, [activeDriver, store.travels, driverStartStr, driverEndStr]);

  const driverTotals = useMemo(() => {
    const kms = driverTravels.reduce((a, t) => a + getDistanceKm(t), 0);
    const earnings = driverTravels.reduce((a, t) => a + getDriverCost(t), 0);
    const reimb = driverTravels.reduce((a, t) => a + getReimbursableExpenses(t), 0);
    const thirdParty = driverTravels.reduce(
      (a, t) => a + (t.truck?.isFreightPaid ? getFleteCost(t, store.config) : 0),
      0
    );
    return {
      kms,
      earnings,
      reimb,
      thirdParty,
      total: earnings + reimb + thirdParty,
    };
  }, [driverTravels, store.config]);

  // --- Truck Finances Computed ---
  const truckFinances = useMemo(() => {
    const now = new Date();
    const minDate =
      periodFilter === 'MONTH'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
        : periodFilter === 'QUARTER'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)
        : periodFilter === 'YEAR'
        ? new Date(now.getFullYear(), 0, 1)
        : null;

    const filtered = store.travels.filter((tr) => {
      if (selectedTruckId !== 'ALL' && tr.truck?.id !== selectedTruckId) return false;
      if (minDate) {
        const dt = Formatters.parseDate(tr.date);
        if (!dt || dt < minDate) return false;
      }
      return true;
    });

    const totalBilled = filtered.reduce((a, t) => a + getFleteCost(t, store.config), 0);
    const totalFuel = filtered.reduce((a, t) => a + (t.litersOnPump || 0) * (t.fuelPrice || store.config.fuelPrice), 0);
    const totalDriver = filtered.reduce((a, t) => a + getDriverCost(t), 0);
    const totalExpenses = filtered.reduce((a, t) => a + getGastosDelViaje(t), 0);
    const totalCosts = totalFuel + totalDriver + totalExpenses;
    const netProfit = totalBilled - totalCosts;

    // Monthly breakdown points
    const monthlyMap = new Map<string, { revenue: number; costs: number; net: number }>();
    for (const tr of filtered) {
      const dt = Formatters.parseDate(tr.date) || new Date();
      const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const rev = getFleteCost(tr, store.config);
      const cst =
        (tr.litersOnPump || 0) * (tr.fuelPrice || store.config.fuelPrice) +
        getDriverCost(tr) +
        getGastosDelViaje(tr);
      const curr = monthlyMap.get(monthKey) || { revenue: 0, costs: 0, net: 0 };
      monthlyMap.set(monthKey, {
        revenue: curr.revenue + rev,
        costs: curr.costs + cst,
        net: curr.net + (rev - cst),
      });
    }

    const points = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ label: k, ...v }));

    return {
      count: filtered.length,
      totalBilled,
      totalFuel,
      totalDriver,
      totalExpenses,
      totalCosts,
      netProfit,
      points,
    };
  }, [store.travels, store.config, selectedTruckId, periodFilter]);

  // --- Cost Simulator Computed ---
  const simResult = useMemo(() => {
    const pesoVivo = simIsDouble ? 21500 : 15500;
    const kgCarne = (pesoVivo * simRendimiento) / 100;
    const costoHaciendaTotal = pesoVivo * simPrecioVivo;
    const costoHaciendaPorKgCarne = kgCarne > 0 ? costoHaciendaTotal / kgCarne : 0;

    const rateKm = simIsDouble
      ? store.config.simulationFreightPriceDouble || 3100
      : store.config.simulationFreightPriceSimple || 2600;
    const fleteTotal = simDistancia * rateKm;
    const costoFletePorKgCarne = kgCarne > 0 ? fleteTotal / kgCarne : 0;

    const costoBrutoPorKgCarne = costoHaciendaPorKgCarne + costoFletePorKgCarne;
    const factorIIBB = 1 + simIIBB / 100;
    const costoGanchoFinal = costoBrutoPorKgCarne * factorIIBB;

    const factorMargen = 1 + simMargen / 100;
    const facturacionSugerida = costoGanchoFinal * factorMargen;
    const utilidadPorKg = facturacionSugerida - costoGanchoFinal;

    return {
      kgCarne,
      fleteTotal,
      costoHaciendaPorKgCarne,
      costoFletePorKgCarne,
      costoGanchoFinal,
      facturacionSugerida,
      utilidadPorKg,
    };
  }, [simIsDouble, simRendimiento, simPrecioVivo, simDistancia, simIIBB, simMargen, store.config]);

  // --- Logistics Summary Computed ---
  const logisticsSummary = useMemo(() => {
    const sDate = Formatters.parseDate(logStartStr) || new Date(0);
    const eDate = Formatters.parseDate(logEndStr) || new Date();
    eDate.setHours(23, 59, 59, 999);

    const filtered = store.travels.filter((t) => {
      const dt = Formatters.parseDate(t.date);
      if (dt && (dt < sDate || dt > eDate)) return false;
      if (logProducerId) {
        const hasProd = (t.buy?.listOfProducers || []).some((p) => p.id === logProducerId);
        if (!hasProd) return false;
      }
      if (logAgentId && t.buy?.agent?.id !== logAgentId) return false;
      if (logTruckId && t.truck?.id !== logTruckId) return false;
      return true;
    });

    const totalAnimals = filtered.reduce(
      (sum, t) =>
        sum +
        (t.buy?.listOfProducers || []).reduce(
          (ps, p) => ps + (p.listOfProducts || []).reduce((ls, item) => ls + (item.quantity || 0), 0),
          0
        ),
      0
    );
    const totalKgGross = filtered.reduce(
      (sum, t) =>
        sum +
        (t.buy?.listOfProducers || []).reduce(
          (ps, p) => ps + (p.listOfProducts || []).reduce((ls, item) => ls + (item.kg || 0), 0),
          0
        ),
      0
    );
    const totalKgFaena = filtered.reduce((sum, t) => sum + getActualKgFaena(t), 0);
    const avgYield = totalKgGross > 0 ? (totalKgFaena / totalKgGross) * 100 : 0;
    const totalFreight = filtered.reduce((sum, t) => sum + getFleteCost(t, store.config), 0);
    const freightPerKgMeat = totalKgFaena > 0 ? totalFreight / totalKgFaena : 0;

    return {
      filtered,
      totalAnimals,
      totalKgGross,
      totalKgFaena,
      avgYield,
      totalFreight,
      freightPerKgMeat,
    };
  }, [store.travels, store.config, logStartStr, logEndStr, logProducerId, logAgentId, logTruckId]);

  const maxChartValue = Math.max(
    1,
    ...truckFinances.points.map((p) => Math.max(p.revenue, p.costs))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Sub-navigation + Excel Export */}
      <div className="t-row-between" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div className="t-segmented" style={{ flex: 1, minWidth: 280 }}>
          {(
            [
              ['DRIVER', 'Choferes'],
              ['TRUCK', 'Camiones'],
              ['SIMULATOR', 'Simulador'],
              ['LOGISTICS', 'Logística'],
            ] as Array<[ReportsSubTab, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`t-seg-item ${subTab === id ? 'active' : ''}`}
              onClick={() => {
                TerminalHaptics.selection();
                setSubTab(id);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="t-btn t-btn-sm t-btn-filled"
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => {
            TerminalHaptics.click();
            exportFullWorkbookXlsx(store.travels, store.config);
            onToast('Planilla Excel completa descargada.');
          }}
        >
          <span>Descargar Excel (.xlsx)</span>
        </button>
      </div>

      {/* 1. DRIVER SETTLEMENT */}
      {subTab === 'DRIVER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
              Parámetros de Liquidación de Chofer
            </span>
            <SearchablePicker
              label="Chofer a Liquidar"
              items={store.drivers}
              selectedId={activeDriver?.id || null}
              onSelect={(id) => id && setSelectedDriverId(id)}
              getTitle={(d) => d.name}
              getSubtitle={(d) => (d.dni ? `DNI: ${Formatters.dni(d.dni)}` : '')}
              getSearchTerms={(d) => [d.name, d.dni, d.license]}
            />
            <div className="kpi-grid-2">
              <div className="t-field">
                <label className="t-label">Fecha Desde</label>
                <input
                  type="date"
                  className="t-input tabular-nums"
                  value={driverStartStr}
                  onChange={(e) => setDriverStartStr(e.target.value)}
                />
              </div>
              <div className="t-field">
                <label className="t-label">Fecha Hasta</label>
                <input
                  type="date"
                  className="t-input tabular-nums"
                  value={driverEndStr}
                  onChange={(e) => setDriverEndStr(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="kpi-grid-2">
            <MetricCard title="Viajes Computados" value={String(driverTravels.length)} />
            <MetricCard
              title="Kilómetros Totales"
              value={`${Formatters.decimal(driverTotals.kms, 0)} km`}
            />
            <MetricCard title="Remuneración Viajes" value={Formatters.currency(driverTotals.earnings)} />
            <MetricCard title="Reintegro de Gastos" value={Formatters.currency(driverTotals.reimb)} />
          </div>

          {driverTotals.thirdParty > 0 && (
            <MetricCard
              title="Fletes a Terceros"
              value={Formatters.currency(driverTotals.thirdParty)}
            />
          )}

          <div
            className="t-card"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.15)',
              background: 'var(--t-surface-elevated)',
              padding: '16px',
            }}
          >
            <div className="t-row-between">
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--t-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Total Neto a Liquidar
                </div>
                <div
                  className="tabular-nums"
                  style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--t-text-primary)', marginTop: 2 }}
                >
                  {Formatters.currency(driverTotals.total)}
                </div>
              </div>
              {activeDriver && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-filled"
                    onClick={() => {
                      const s = Formatters.parseDate(driverStartStr) || new Date();
                      const e = Formatters.parseDate(driverEndStr) || new Date();
                      const msg = WhatsAppShareHelper.formatDriverWeeklyMessage(
                        activeDriver,
                        driverTravels,
                        s,
                        e,
                        store.config
                      );
                      WhatsAppShareHelper.openWhatsApp(msg);
                    }}
                  >
                    Enviar WhatsApp
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-muted"
                    onClick={() => {
                      const s = Formatters.parseDate(driverStartStr) || new Date();
                      const e = Formatters.parseDate(driverEndStr) || new Date();
                      exportDriverSettlementPdf(activeDriver, driverTravels, s, e, store.config);
                      onToast('Liquidación PDF generada.');
                    }}
                  >
                    Exportar PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {driverTravels.length > 0 && (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Viaje / Itinerario</th>
                    <th style={{ textAlign: 'right' }}>Distancia</th>
                    <th style={{ textAlign: 'right' }}>Monto Chofer</th>
                  </tr>
                </thead>
                <tbody>
                  {driverTravels.map((t) => (
                    <tr key={t.id}>
                      <td className="tabular-nums" style={{ color: 'var(--t-text-muted)', whiteSpace: 'nowrap' }}>
                        {Formatters.displayDate(t.date)}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {getTravelDisplayTitle(t)}
                      </td>
                      <td className="tabular-nums" style={{ textAlign: 'right', color: 'var(--t-text-secondary)' }}>
                        {Formatters.decimal(getDistanceKm(t), 0)} km
                      </td>
                      <td className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {Formatters.currency(getDriverCost(t))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. TRUCK FINANCES */}
      {subTab === 'TRUCK' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
              Análisis Económico por Unidad
            </span>
            <select
              className="t-select"
              value={selectedTruckId}
              onChange={(e) =>
                setSelectedTruckId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
            >
              <option value="ALL">Toda la Flota Consolidada</option>
              {store.trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.licensePlate})
                </option>
              ))}
            </select>

            <div className="t-segmented">
              {(
                [
                  ['MONTH', 'Últimos 30 días'],
                  ['QUARTER', 'Trimestre'],
                  ['YEAR', 'Año en curso'],
                  ['ALL', 'Histórico'],
                ] as Array<[FinancialPeriodFilter, string]>
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`t-seg-item ${periodFilter === val ? 'active' : ''}`}
                  onClick={() => setPeriodFilter(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <MetricCard
            title="Facturación Bruta de Fletes"
            value={Formatters.currency(truckFinances.totalBilled)}
            subtitle={`${truckFinances.count} viajes registrados en el período`}
          />

          <div className="kpi-grid-2">
            <MetricCard title="Gasto Combustible" value={Formatters.currency(truckFinances.totalFuel)} />
            <MetricCard title="Costo Choferes" value={Formatters.currency(truckFinances.totalDriver)} />
            <MetricCard title="Gastos Operativos" value={Formatters.currency(truckFinances.totalExpenses)} />
            <MetricCard
              title="Utilidad Neta Operativa"
              value={Formatters.currency(truckFinances.netProfit)}
              tint={truckFinances.netProfit >= 0 ? 'var(--t-emerald-text)' : 'var(--t-rose-text)'}
            />
          </div>

          {truckFinances.points.length > 0 && (
            <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
                Evolución Mensual (Facturado vs Costos Totales)
              </span>
              {truckFinances.points.map((pt) => (
                <div key={pt.label} style={{ fontSize: '0.78rem' }}>
                  <div className="t-row-between" style={{ marginBottom: 5 }}>
                    <span className="tabular-nums" style={{ fontWeight: 500 }}>{pt.label}</span>
                    <span className="tabular-nums">
                      <span style={{ color: 'var(--t-text-primary)' }}>{Formatters.currencyCompact(pt.revenue)}</span>
                      <span style={{ color: 'var(--t-text-muted)' }}> / </span>
                      <span style={{ color: 'var(--t-text-secondary)' }}>{Formatters.currencyCompact(pt.costs)}</span>
                      <span style={{ color: 'var(--t-text-muted)' }}> → </span>
                      <strong style={{ color: pt.net >= 0 ? 'var(--t-emerald-text)' : 'var(--t-rose-text)' }}>
                        {Formatters.currencyCompact(pt.net)}
                      </strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ height: 5, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 3 }}>
                      <div
                        style={{
                          width: `${(pt.revenue / maxChartValue) * 100}%`,
                          height: '100%',
                          background: 'var(--t-text-primary)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <div style={{ height: 5, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 3 }}>
                      <div
                        style={{
                          width: `${(pt.costs / maxChartValue) * 100}%`,
                          height: '100%',
                          background: 'rgba(255, 255, 255, 0.3)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. COST SIMULATOR */}
      {subTab === 'SIMULATOR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
              Simulador de Costo Gancho y Margen
            </span>

            <div className="t-field">
              <div className="t-row-between">
                <span className="t-label">Rendimiento Proyectado</span>
                <strong className="tabular-nums" style={{ color: 'var(--t-text-primary)', fontSize: '0.85rem' }}>
                  {Formatters.decimal(simRendimiento, 1)}%
                </strong>
              </div>
              <input
                type="range"
                className="t-range"
                min={45}
                max={65}
                step={0.5}
                value={simRendimiento}
                onChange={(e) => setSimRendimiento(Number(e.target.value))}
              />
            </div>

            <div className="t-field">
              <div className="t-row-between">
                <span className="t-label">Margen Operativo Deseado</span>
                <strong className="tabular-nums" style={{ color: 'var(--t-emerald-text)', fontSize: '0.85rem' }}>
                  {Formatters.decimal(simMargen, 0)}%
                </strong>
              </div>
              <input
                type="range"
                className="t-range"
                min={0}
                max={50}
                step={1}
                value={simMargen}
                onChange={(e) => setSimMargen(Number(e.target.value))}
              />
            </div>

            <div className="t-field">
              <div className="t-row-between">
                <span className="t-label">Alícuota IIBB</span>
                <strong className="tabular-nums" style={{ color: 'var(--t-text-secondary)', fontSize: '0.85rem' }}>
                  {Formatters.decimal(simIIBB, 2)}%
                </strong>
              </div>
              <input
                type="range"
                className="t-range"
                min={0}
                max={5}
                step={0.1}
                value={simIIBB}
                onChange={(e) => setSimIIBB(Number(e.target.value))}
              />
            </div>

            <div className="kpi-grid-2">
              <div className="t-field">
                <label className="t-label">Precio Vivo ($/kg)</label>
                <input
                  type="number"
                  step="any"
                  className="t-input tabular-nums"
                  value={simPrecioVivo || ''}
                  onChange={(e) => setSimPrecioVivo(Number(e.target.value) || 0)}
                />
              </div>
              <div className="t-field">
                <label className="t-label">Distancia Flete (km)</label>
                <input
                  type="number"
                  step="any"
                  className="t-input tabular-nums"
                  value={simDistancia || ''}
                  onChange={(e) => setSimDistancia(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="t-segmented">
              <button
                type="button"
                className={`t-seg-item ${!simIsDouble ? 'active' : ''}`}
                onClick={() => setSimIsDouble(false)}
              >
                Jaula Simple (15.500 kg)
              </button>
              <button
                type="button"
                className={`t-seg-item ${simIsDouble ? 'active' : ''}`}
                onClick={() => setSimIsDouble(true)}
              >
                Jaula Doble (21.500 kg)
              </button>
            </div>
          </div>

          <div className="kpi-grid-2">
            <MetricCard
              title="Hacienda al Gancho"
              value={`${Formatters.currency(simResult.costoHaciendaPorKgCarne)}/kg`}
            />
            <MetricCard
              title="Flete al Gancho"
              value={`${Formatters.currency(simResult.costoFletePorKgCarne)}/kg`}
              subtitle={`Flete Total: ${Formatters.currency(simResult.fleteTotal)}`}
            />
            <MetricCard
              title="Costo Gancho Final"
              value={`${Formatters.currency(simResult.costoGanchoFinal)}/kg`}
            />
            <MetricCard
              title="Venta Sugerida"
              value={`${Formatters.currency(simResult.facturacionSugerida)}/kg`}
              subtitle={`Margen: +${Formatters.currency(simResult.utilidadPorKg)}/kg`}
              tint="var(--t-emerald-text)"
            />
          </div>
        </div>
      )}

      {/* 4. LOGISTICS SUMMARY */}
      {subTab === 'LOGISTICS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
              Filtros de Auditoría Logística
            </span>
            <div className="kpi-grid-2">
              <div className="t-field">
                <label className="t-label">Fecha Desde</label>
                <input
                  type="date"
                  className="t-input tabular-nums"
                  value={logStartStr}
                  onChange={(e) => setLogStartStr(e.target.value)}
                />
              </div>
              <div className="t-field">
                <label className="t-label">Fecha Hasta</label>
                <input
                  type="date"
                  className="t-input tabular-nums"
                  value={logEndStr}
                  onChange={(e) => setLogEndStr(e.target.value)}
                />
              </div>
            </div>

            <SearchablePicker
              label="Productor"
              items={store.producers}
              selectedId={logProducerId}
              onSelect={setLogProducerId}
              getTitle={(p) => p.name}
              getSearchTerms={(p) => [p.name, p.cuit]}
              allowClear
              emptyLabel="Todos los Productores"
            />
            <SearchablePicker
              label="Comisionista"
              items={store.agents}
              selectedId={logAgentId}
              onSelect={setLogAgentId}
              getTitle={(a) => a.name}
              getSearchTerms={(a) => [a.name]}
              allowClear
              emptyLabel="Todos los Comisionistas"
            />
            <SearchablePicker
              label="Unidad de Transporte"
              items={store.trucks}
              selectedId={logTruckId}
              onSelect={setLogTruckId}
              getTitle={(t) => `${t.name} (${t.licensePlate})`}
              getSearchTerms={(t) => [t.name, t.licensePlate, t.driver?.name || '']}
              allowClear
              emptyLabel="Toda la Flota"
            />
          </div>

          <div className="kpi-grid-3">
            <MetricCard title="Viajes Filtrados" value={String(logisticsSummary.filtered.length)} />
            <MetricCard title="Cabezas Totales" value={String(logisticsSummary.totalAnimals)} />
            <MetricCard title="Kilos Brutos Vivos" value={Formatters.weight(logisticsSummary.totalKgGross)} />
            <MetricCard
              title="Kilos Faena Gancho"
              value={Formatters.weight(logisticsSummary.totalKgFaena)}
              subtitle={`Rendimiento: ${Formatters.decimal(logisticsSummary.avgYield, 2)}%`}
            />
            <MetricCard title="Flete Acumulado" value={Formatters.currency(logisticsSummary.totalFreight)} />
            <MetricCard
              title="Incidencia Flete / Kg"
              value={`${Formatters.currency(logisticsSummary.freightPerKgMeat)}/kg`}
            />
          </div>

          <button
            type="button"
            className="t-btn t-btn-filled"
            onClick={() => {
              exportFullWorkbookXlsx(logisticsSummary.filtered, store.config);
              onToast('Planilla Excel con filtro actual descargada.');
            }}
          >
            Exportar Auditoría a Excel (.xlsx)
          </button>
        </div>
      )}
    </div>
  );
};
