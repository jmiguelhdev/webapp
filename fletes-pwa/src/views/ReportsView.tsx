import React, { useMemo, useState } from 'react';
import {
  getActualKgFaena,
  getDistanceKm,
  getDriverCost,
  getFleteCost,
  getFuelCost,
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
    const totalFuel = filtered.reduce((a, t) => a + getFuelCost(t), 0);
    const totalDriver = filtered.reduce((a, t) => a + getDriverCost(t), 0);
    const totalExpenses = filtered.reduce((a, t) => a + getGastosDelViaje(t), 0);
    const netProfit = filtered.reduce((a, t) => a + getTravelProfit(t, store.config), 0);

    // Group by month/label for chart
    const bucketMap = new Map<string, { label: string; revenue: number; costs: number; net: number }>();
    const sortedAsc = [...filtered].sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const t of sortedAsc) {
      const label = (t.date || '').slice(0, 7) || 'S/F';
      const rev = getFleteCost(t, store.config);
      const costs = getFuelCost(t) + getDriverCost(t) + getGastosDelViaje(t);
      const net = rev - costs;
      const cur = bucketMap.get(label) || { label, revenue: 0, costs: 0, net: 0 };
      cur.revenue += rev;
      cur.costs += costs;
      cur.net += net;
      bucketMap.set(label, cur);
    }

    return {
      count: filtered.length,
      totalBilled,
      totalFuel,
      totalDriver,
      totalExpenses,
      netProfit,
      points: Array.from(bucketMap.values()).slice(-6),
    };
  }, [store.travels, store.config, selectedTruckId, periodFilter]);

  // --- Cost Simulator Computed (1:1 with ReportsDashboardView.swift) ---
  const simResult = useMemo(() => {
    const precioKm = simIsDouble
      ? store.config.simulationFreightPriceDouble
      : store.config.simulationFreightPriceSimple;
    const pesoEstimado = simIsDouble ? 21500 : 15500;
    const fleteTotal = simDistancia * precioKm;
    const fletePorKg = pesoEstimado > 0 ? fleteTotal / pesoEstimado : 0;

    const kgCarnePorKgVivo = simRendimiento / 100.0;
    const costoHaciendaPorKgCarne = kgCarnePorKgVivo > 0 ? simPrecioVivo / kgCarnePorKgVivo : 0;
    const costoFletePorKgCarne = kgCarnePorKgVivo > 0 ? fletePorKg / kgCarnePorKgVivo : 0;

    const baseBruta = costoHaciendaPorKgCarne + costoFletePorKgCarne;
    const margenMult = 1.0 + simMargen / 100.0;
    const tasaImpuestos = margenMult * (simIIBB / 100.0);
    const divisor = 1.0 - tasaImpuestos;
    const costoGanchoFinal = divisor > 0 ? baseBruta / divisor : baseBruta;
    const facturacionSugerida = costoGanchoFinal * margenMult;
    const utilidadPorKg = facturacionSugerida - costoGanchoFinal;

    return {
      fleteTotal,
      costoHaciendaPorKgCarne,
      costoFletePorKgCarne,
      costoGanchoFinal,
      facturacionSugerida,
      utilidadPorKg,
      pesoEstimado,
    };
  }, [simRendimiento, simPrecioVivo, simDistancia, simIIBB, simMargen, simIsDouble, store.config]);

  // --- Logistics Summary Computed ---
  const logisticsSummary = useMemo(() => {
    const sDate = Formatters.parseDate(logStartStr) || new Date(0);
    const eDate = Formatters.parseDate(logEndStr) || new Date();
    eDate.setHours(23, 59, 59, 999);

    const filtered = store.travels.filter((t) => {
      const dt = Formatters.parseDate(t.date);
      if (!dt || dt < sDate || dt > eDate) return false;
      if (logProducerId && !(t.buy?.listOfProducers || []).some((p) => p.id === logProducerId)) {
        return false;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Sub-navigation + Excel Export */}
      <div className="t-row-between" style={{ gap: 6, flexWrap: 'wrap' }}>
        <div className="t-segmented" style={{ flex: 1 }}>
          {(
            [
              ['DRIVER', '[CHOFER]'],
              ['TRUCK', '[CAMIÓN]'],
              ['SIMULATOR', '[SIMULADOR]'],
              ['LOGISTICS', '[LOGÍSTICA]'],
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
          className="t-btn t-btn-green t-btn-sm"
          onClick={() => {
            TerminalHaptics.click();
            exportFullWorkbookXlsx(store.travels, store.config);
            onToast('Excel multi-hoja (.xlsx) descargado.');
          }}
        >
          📊 Excel
        </button>
      </div>

      {/* 1. DRIVER SETTLEMENT */}
      {subTab === 'DRIVER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="t-section-label">// PARÁMETROS DE LIQUIDACIÓN</div>
            <SearchablePicker
              label="Chofer"
              items={store.drivers}
              selectedId={activeDriver?.id || null}
              onSelect={(id) => id && setSelectedDriverId(id)}
              getTitle={(d) => d.name}
              getSubtitle={(d) => (d.dni ? `DNI: ${Formatters.dni(d.dni)}` : '')}
              getSearchTerms={(d) => [d.name, d.dni, d.license]}
            />
            <div className="kpi-grid-2">
              <div className="t-field">
                <label className="t-label">Desde</label>
                <input
                  type="date"
                  className="t-input"
                  value={driverStartStr}
                  onChange={(e) => setDriverStartStr(e.target.value)}
                />
              </div>
              <div className="t-field">
                <label className="t-label">Hasta</label>
                <input
                  type="date"
                  className="t-input"
                  value={driverEndStr}
                  onChange={(e) => setDriverEndStr(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="kpi-grid-2">
            <MetricCard title="Viajes Computados" value={String(driverTravels.length)} tint="var(--t-cyan)" />
            <MetricCard
              title="Kms Recorridos"
              value={`${Formatters.decimal(driverTotals.kms, 0)} km`}
              tint="var(--t-purple)"
            />
            <MetricCard title="Monto Viajes" value={Formatters.currency(driverTotals.earnings)} tint="var(--t-green)" />
            <MetricCard title="Reembolso Gastos" value={Formatters.currency(driverTotals.reimb)} tint="var(--t-orange)" />
          </div>

          {driverTotals.thirdParty > 0 && (
            <MetricCard
              title="Fletes de Terceros"
              value={Formatters.currency(driverTotals.thirdParty)}
              tint="var(--t-blue)"
            />
          )}

          <MetricCard
            title="TOTAL NETO A PAGAR"
            value={Formatters.currency(driverTotals.total)}
            tint="var(--t-cyan)"
          />

          {activeDriver && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="t-btn t-btn-green t-btn-filled"
                style={{ flex: 1 }}
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
                📲 Enviar por WhatsApp
              </button>
              <button
                type="button"
                className="t-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  const s = Formatters.parseDate(driverStartStr) || new Date();
                  const e = Formatters.parseDate(driverEndStr) || new Date();
                  exportDriverSettlementPdf(activeDriver, driverTravels, s, e, store.config);
                  onToast('Liquidación PDF generada.');
                }}
              >
                📄 Descargar PDF
              </button>
            </div>
          )}

          {driverTravels.length > 0 && (
            <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="t-section-label">// VIAJES INCLUIDOS ({driverTravels.length})</div>
              {driverTravels.map((t) => (
                <div key={t.id} className="t-row-between mono" style={{ fontSize: '0.75rem' }}>
                  <span>
                    {Formatters.displayDate(t.date)} • {getTravelDisplayTitle(t)} (
                    {Formatters.decimal(getDistanceKm(t), 0)} km)
                  </span>
                  <strong style={{ color: 'var(--t-green)' }}>
                    {Formatters.currency(getDriverCost(t))}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. TRUCK FINANCES */}
      {subTab === 'TRUCK' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="t-section-label">// ANÁLISIS FINANCIERO POR CAMIÓN</div>
            <select
              className="t-select"
              value={selectedTruckId}
              onChange={(e) =>
                setSelectedTruckId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
            >
              <option value="ALL">Toda la Flota</option>
              {store.trucks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.licensePlate})
                </option>
              ))}
            </select>

            <div className="t-segmented">
              {(
                [
                  ['MONTH', '[30 DÍAS]'],
                  ['QUARTER', '[TRIMESTRE]'],
                  ['YEAR', '[AÑO]'],
                  ['ALL', '[TODO]'],
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
            title="FLETE TOTAL FACTURADO"
            value={Formatters.currency(truckFinances.totalBilled)}
            subtitle={`${truckFinances.count} viajes en período`}
            tint="var(--t-cyan)"
          />

          <div className="kpi-grid-2">
            <MetricCard title="Combustible Total" value={Formatters.currency(truckFinances.totalFuel)} tint="var(--t-amber)" />
            <MetricCard title="Chofer Liquidado" value={Formatters.currency(truckFinances.totalDriver)} tint="var(--t-purple)" />
            <MetricCard title="Gastos Operativos" value={Formatters.currency(truckFinances.totalExpenses)} tint="var(--t-red)" />
            <MetricCard
              title="UTILIDAD NETA"
              value={Formatters.currency(truckFinances.netProfit)}
              tint={truckFinances.netProfit >= 0 ? 'var(--t-green)' : 'var(--t-red)'}
            />
          </div>

          {truckFinances.points.length > 0 && (
            <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="t-section-label">// EVOLUCIÓN FINANCIERA (FACTURADO vs COSTOS)</div>
              {truckFinances.points.map((pt) => (
                <div key={pt.label} className="mono" style={{ fontSize: '0.72rem' }}>
                  <div className="t-row-between" style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>{pt.label}</span>
                    <span>
                      <span style={{ color: 'var(--t-cyan)' }}>{Formatters.currencyCompact(pt.revenue)}</span>
                      {' / '}
                      <span style={{ color: 'var(--t-amber)' }}>{Formatters.currencyCompact(pt.costs)}</span>
                      {' → '}
                      <strong style={{ color: pt.net >= 0 ? 'var(--t-green)' : 'var(--t-red)' }}>
                        {Formatters.currencyCompact(pt.net)}
                      </strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ height: 6, background: '#05080b', borderRadius: 3 }}>
                      <div
                        style={{
                          width: `${(pt.revenue / maxChartValue) * 100}%`,
                          height: '100%',
                          background: 'var(--t-cyan)',
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <div style={{ height: 6, background: '#05080b', borderRadius: 3 }}>
                      <div
                        style={{
                          width: `${(pt.costs / maxChartValue) * 100}%`,
                          height: '100%',
                          background: 'var(--t-amber)',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="t-section-label">// PARÁMETROS DE SIMULACIÓN GANCHO</div>

            <div className="t-field">
              <div className="t-label">
                <span>Rendimiento Proyectado</span>
                <strong style={{ color: 'var(--t-purple)' }}>{Formatters.decimal(simRendimiento, 1)}%</strong>
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
              <div className="t-label">
                <span>Margen Operativo</span>
                <strong style={{ color: 'var(--t-green)' }}>{Formatters.decimal(simMargen, 0)}%</strong>
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
              <div className="t-label">
                <span>Alícuota IIBB</span>
                <strong style={{ color: 'var(--t-amber)' }}>{Formatters.decimal(simIIBB, 2)}%</strong>
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
                  className="t-input"
                  value={simPrecioVivo || ''}
                  onChange={(e) => setSimPrecioVivo(Number(e.target.value) || 0)}
                />
              </div>
              <div className="t-field">
                <label className="t-label">Distancia Flete (km)</label>
                <input
                  type="number"
                  step="any"
                  className="t-input"
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
                JAULA SIMPLE (15.500 kg)
              </button>
              <button
                type="button"
                className={`t-seg-item ${simIsDouble ? 'active' : ''}`}
                onClick={() => setSimIsDouble(true)}
              >
                JAULA DOBLE (21.500 kg)
              </button>
            </div>
          </div>

          <div className="kpi-grid-2">
            <MetricCard
              title="Hacienda al Gancho"
              value={`${Formatters.currency(simResult.costoHaciendaPorKgCarne)}/kg`}
              tint="var(--t-purple)"
            />
            <MetricCard
              title="Flete al Gancho"
              value={`${Formatters.currency(simResult.costoFletePorKgCarne)}/kg`}
              subtitle={`Total Flete: ${Formatters.currency(simResult.fleteTotal)}`}
              tint="var(--t-amber)"
            />
            <MetricCard
              title="COSTO GANCHO FINAL"
              value={`${Formatters.currency(simResult.costoGanchoFinal)}/kg`}
              tint="var(--t-cyan)"
            />
            <MetricCard
              title="VENTA SUGERIDA"
              value={`${Formatters.currency(simResult.facturacionSugerida)}/kg`}
              subtitle={`Margen: +${Formatters.currency(simResult.utilidadPorKg)}/kg`}
              tint="var(--t-green)"
            />
          </div>
        </div>
      )}

      {/* 4. LOGISTICS SUMMARY */}
      {subTab === 'LOGISTICS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="t-section-label">// RESUMEN LOGÍSTICO CONSOLIDADO</div>
            <div className="kpi-grid-2">
              <div className="t-field">
                <label className="t-label">Desde</label>
                <input
                  type="date"
                  className="t-input"
                  value={logStartStr}
                  onChange={(e) => setLogStartStr(e.target.value)}
                />
              </div>
              <div className="t-field">
                <label className="t-label">Hasta</label>
                <input
                  type="date"
                  className="t-input"
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
              label="Camión"
              items={store.trucks}
              selectedId={logTruckId}
              onSelect={setLogTruckId}
              getTitle={(t) => `${t.name} (${t.licensePlate})`}
              getSearchTerms={(t) => [t.name, t.licensePlate, t.driver?.name || '']}
              allowClear
              emptyLabel="Toda la Flota"
            />
          </div>

          <div className="kpi-grid-2">
            <MetricCard title="Viajes Filtrados" value={String(logisticsSummary.filtered.length)} tint="var(--t-cyan)" />
            <MetricCard title="Cabezas Totales" value={String(logisticsSummary.totalAnimals)} tint="var(--t-purple)" />
            <MetricCard title="Kg Brutos Vivos" value={Formatters.weight(logisticsSummary.totalKgGross)} tint="var(--t-amber)" />
            <MetricCard
              title="Kg Faena Gancho"
              value={Formatters.weight(logisticsSummary.totalKgFaena)}
              subtitle={`Rdo Prom: ${Formatters.decimal(logisticsSummary.avgYield, 2)}%`}
              tint="var(--t-green)"
            />
            <MetricCard title="Flete Total" value={Formatters.currency(logisticsSummary.totalFreight)} tint="var(--t-cyan)" />
            <MetricCard
              title="Flete / Kg Carne"
              value={`${Formatters.currency(logisticsSummary.freightPerKgMeat)}/kg`}
              tint="var(--t-orange)"
            />
          </div>

          <button
            type="button"
            className="t-btn t-btn-green t-btn-filled"
            onClick={() => {
              exportFullWorkbookXlsx(logisticsSummary.filtered, store.config);
              onToast('Excel filtrado exportado.');
            }}
          >
            📊 Exportar Selección a Excel (.xlsx)
          </button>
        </div>
      )}
    </div>
  );
};
