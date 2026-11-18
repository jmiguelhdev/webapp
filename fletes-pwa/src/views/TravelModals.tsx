import React, { useMemo, useState } from 'react';
import {
  AppConfig,
  EXPENSE_CATEGORIES,
  Expense,
  Producer,
  Product,
  Travel,
  TravelStatus,
  createExpense,
  createProducer,
  createProduct,
  createTravel,
  getActualKgFaena,
  getBuyTotalKgClean,
  getBuyTotalOperation,
  getBuyTotalQuantity,
  getCategoryColor,
  getDistanceKm,
  getDriverCost,
  getEffectiveYield,
  getFinalCostPerKg,
  getFleteCalculationDetail,
  getFleteCost,
  getFuelCost,
  getGastosDelViaje,
  getInitialCostPerKg,
  getProducerTotalKgClean,
  getProducerTotalQuantity,
  getProductCommissionAmount,
  getProductFactura,
  getProductKgClean,
  getProductOperation,
  getProductYield,
  getTransportCostPerKg,
  getTravelDisplayTitle,
  getTravelProfit,
  hasBuyFacturaWarning,
  resolveProductCategory,
} from '../domain/models';
import { TravelCalculator, TruckEfficiencyCalculator, getFuelAnomalyDisplayName } from '../domain/engine';
import { StoreSnapshot, persistence } from '../services/persistence';
import {
  WhatsAppShareHelper,
  exportProducerLiquidationPdf,
  exportTravelPdf,
} from '../services/exporters';
import { Formatters, TerminalHaptics } from '../utils/formatters';
import {
  MetricCard,
  ModalSheet,
  OdometerScanModal,
  SearchablePicker,
  StatusBadge,
} from '../components/TerminalUI';

// =============================================================================
// 1. Travel Detail Modal
// =============================================================================

export const TravelDetailModal: React.FC<{
  travelId: number;
  store: StoreSnapshot;
  onClose: () => void;
  onEdit: (travel: Travel) => void;
  onDeleted: () => void;
  onToast: (msg: string) => void;
}> = ({ travelId, store, onClose, onEdit, onDeleted, onToast }) => {
  const travel = store.travels.find((t) => t.id === travelId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const effResult = useMemo(() => {
    if (!travel) return null;
    const prev = TruckEfficiencyCalculator.findPreviousKmOnPump(travel, store.travels);
    return TruckEfficiencyCalculator.calculateSingleEfficiency(
      travel.id,
      travel.kmOnPump,
      prev,
      travel.litersOnPump
    );
  }, [travel, store.travels]);

  if (!travel) {
    return (
      <ModalSheet title="// DETALLE DE VIAJE" onClose={onClose}>
        <div className="t-card mono" style={{ color: 'var(--t-amber)' }}>
          Viaje #{travelId} no encontrado.
        </div>
      </ModalSheet>
    );
  }

  const dist = getDistanceKm(travel);
  const flete = getFleteCost(travel, store.config);
  const driverCost = getDriverCost(travel);
  const fuelCost = getFuelCost(travel);
  const gastos = getGastosDelViaje(travel);
  const profit = getTravelProfit(travel, store.config);
  const actualFaena = getActualKgFaena(travel);

  return (
    <ModalSheet
      title={`// ${getTravelDisplayTitle(travel)}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="t-btn t-btn-green t-btn-sm"
            onClick={() => {
              TerminalHaptics.click();
              const msg = WhatsAppShareHelper.formatTravelLiquidationMessage(travel, store.config);
              WhatsAppShareHelper.openWhatsApp(msg);
            }}
          >
            📲 WhatsApp
          </button>
          <button
            type="button"
            className="t-btn t-btn-sm"
            onClick={() => {
              TerminalHaptics.click();
              exportTravelPdf(travel, store.config);
              onToast('PDF del viaje generado.');
            }}
          >
            📄 PDF
          </button>
          <button
            type="button"
            className="t-btn t-btn-amber t-btn-sm"
            onClick={() => {
              TerminalHaptics.click();
              onEdit(travel);
            }}
          >
            ✏️ Editar
          </button>
          {!confirmDelete ? (
            <button
              type="button"
              className="t-btn t-btn-red t-btn-sm"
              onClick={() => {
                TerminalHaptics.warning();
                setConfirmDelete(true);
              }}
            >
              🗑️ Eliminar
            </button>
          ) : (
            <button
              type="button"
              className="t-btn t-btn-red t-btn-filled t-btn-sm"
              onClick={async () => {
                TerminalHaptics.heavy();
                await persistence.deleteTravel(travel.id);
                onToast('Viaje eliminado.');
                onDeleted();
                onClose();
              }}
            >
              Confirmar Borrado
            </button>
          )}
        </>
      }
    >
      {/* Header Metadata */}
      <div className="t-card">
        <div className="t-row-between" style={{ marginBottom: 8 }}>
          <StatusBadge status={travel.status} />
          <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--t-text-secondary)' }}>
            {Formatters.displayDate(travel.date)} • ID #{travel.id}
          </span>
        </div>

        <div className="mono" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--t-text-primary)' }}>
          🚚 {travel.truck?.name || 'Sin Camión'} ({travel.truck?.licensePlate || '-'})
        </div>
        <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--t-text-secondary)', marginTop: 3 }}>
          👤 Chofer: {travel.truck?.driver?.name || 'Sin asignar'} • Jaula:{' '}
          {travel.truck?.trailer?.name || '-'} ({travel.truck?.trailer?.type === 'DOUBLE' ? 'Doble' : 'Simple'})
        </div>
      </div>

      {/* Logistics KPIs */}
      <div className="kpi-grid-3">
        <MetricCard title="Distancia" value={`${Formatters.decimal(dist, 0)} km`} tint="var(--t-purple)" />
        <MetricCard title="Flete" value={Formatters.currency(flete)} tint="var(--t-cyan)" />
        <MetricCard
          title="Ganancia Neta"
          value={Formatters.currency(profit)}
          tint={profit >= 0 ? 'var(--t-green)' : 'var(--t-red)'}
        />
      </div>

      {/* Logistics Breakdown */}
      <div className="t-card">
        <div className="t-section-label">// DESGLOSE LOGÍSTICO Y COMBUSTIBLE</div>
        <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem' }}>
          <div className="t-row-between">
            <span style={{ color: 'var(--t-text-secondary)' }}>Odómetro (Orig → Dest):</span>
            <span>
              {Formatters.decimal(travel.kmOnOrigin, 0)} → {Formatters.decimal(travel.kmOnDestination, 0)} km
            </span>
          </div>
          <div className="t-row-between">
            <span style={{ color: 'var(--t-text-secondary)' }}>Cálculo Flete:</span>
            <span style={{ color: 'var(--t-cyan)' }}>{getFleteCalculationDetail(travel, store.config)}</span>
          </div>
          <div className="t-row-between">
            <span style={{ color: 'var(--t-text-secondary)' }}>Pago Chofer:</span>
            <span style={{ color: 'var(--t-amber)' }}>{Formatters.currency(driverCost)}</span>
          </div>
          <div className="t-row-between">
            <span style={{ color: 'var(--t-text-secondary)' }}>Combustible Est.:</span>
            <span style={{ color: 'var(--t-orange)' }}>{Formatters.currency(fuelCost)}</span>
          </div>
          <div className="t-row-between">
            <span style={{ color: 'var(--t-text-secondary)' }}>Gastos Operativos:</span>
            <span style={{ color: 'var(--t-red)' }}>{Formatters.currency(gastos)}</span>
          </div>
          {travel.kmOnPump > 0 && (
            <div className="t-row-between">
              <span style={{ color: 'var(--t-text-secondary)' }}>Surtidor / Consumo:</span>
              <span>
                {Formatters.decimal(travel.kmOnPump, 0)} km • {Formatters.decimal(travel.litersOnPump, 1)} l
                {effResult && effResult.efficiency > 0 && (
                  <strong
                    style={{
                      marginLeft: 6,
                      color: effResult.anomalyType === 'NONE' ? 'var(--t-green)' : 'var(--t-amber)',
                    }}
                  >
                    ({Formatters.decimal(effResult.efficiency, 2)} km/l{' '}
                    {effResult.anomalyType !== 'NONE'
                      ? `— ${getFuelAnomalyDisplayName(effResult.anomalyType)}`
                      : ''}
                    )
                  </strong>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expenses List */}
      {(travel.expenses || []).length > 0 && (
        <div className="t-card">
          <div className="t-section-label">// GASTOS REGISTRADOS ({travel.expenses.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {travel.expenses.map((exp) => (
              <div key={exp.id} className="t-row-between mono" style={{ fontSize: '0.76rem' }}>
                <div>
                  <span style={{ color: 'var(--t-cyan)' }}>[{exp.category}]</span>{' '}
                  <span>{exp.description || 'Sin detalle'}</span>
                  {exp.isReimbursable && (
                    <span style={{ color: 'var(--t-green)', marginLeft: 6 }}>(Reemb.)</span>
                  )}
                </div>
                <strong style={{ color: 'var(--t-amber)' }}>{Formatters.currency(exp.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hacienda & Producers */}
      {!travel.isOnlyFreight && (
        <div className="t-card">
          <div className="t-section-label">
            <span>// HACIENDA Y LIQUIDACIÓN</span>
            {hasBuyFacturaWarning(travel.buy) && (
              <span style={{ color: 'var(--t-amber)', fontSize: '0.68rem' }}>
                ⚠️ Revisar % Factura/Op
              </span>
            )}
          </div>

          <div className="kpi-grid-3" style={{ marginBottom: 10 }}>
            <MetricCard title="Cabezas" value={String(getBuyTotalQuantity(travel.buy))} tint="var(--t-cyan)" />
            <MetricCard
              title="Kg Limpios"
              value={Formatters.weight(getBuyTotalKgClean(travel.buy))}
              tint="var(--t-purple)"
            />
            <MetricCard
              title="Total Operación"
              value={Formatters.currency(getBuyTotalOperation(travel.buy))}
              tint="var(--t-green)"
            />
          </div>

          {actualFaena > 0 && (
            <div className="kpi-grid-3" style={{ marginBottom: 10 }}>
              <MetricCard
                title="Kg Faena"
                value={Formatters.weight(actualFaena)}
                subtitle={`Rdo: ${Formatters.decimal(getEffectiveYield(travel) * 100, 2)}%`}
                tint="var(--t-amber)"
              />
              <MetricCard
                title="Costo Gancho Inic."
                value={`${Formatters.currency(getInitialCostPerKg(travel))}/kg`}
                subtitle={`+Flete ${Formatters.currency(getTransportCostPerKg(travel, store.config))}`}
                tint="var(--t-cyan)"
              />
              <MetricCard
                title="Costo Gancho Final"
                value={`${Formatters.currency(getFinalCostPerKg(travel, store.config))}/kg`}
                tint="var(--t-green)"
              />
            </div>
          )}

          {travel.buy?.agent && (
            <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--t-purple)', marginBottom: 8 }}>
              🤝 Comisionista: {travel.buy.agent.name} ({Formatters.decimal(travel.buy.agent.percent, 1)}%)
            </div>
          )}

          {(travel.buy?.listOfProducers || []).length === 0 ? (
            <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--t-text-muted)' }}>
              &gt; Sin productores cargados en este viaje.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {travel.buy.listOfProducers.map((prod) => {
                const prodTotalFact = (prod.listOfProducts || []).reduce(
                  (acc, p) => acc + getProductFactura(p),
                  0
                );
                return (
                  <div key={prod.id} className="t-card-elevated">
                    <div className="t-row-between" style={{ marginBottom: 6 }}>
                      <div>
                        <div className="mono" style={{ fontWeight: 800, fontSize: '0.84rem' }}>
                          {prod.name}
                        </div>
                        <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--t-text-secondary)' }}>
                          {prod.cuit ? `CUIT: ${Formatters.cuit(prod.cuit)} • ` : ''}
                          {getProducerTotalQuantity(prod)} cab •{' '}
                          {Formatters.decimal(getProducerTotalKgClean(prod), 0)} kg limpios
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          type="button"
                          className="t-btn t-btn-green t-btn-sm"
                          title="Enviar liquidación por WhatsApp"
                          onClick={() => {
                            const txt = WhatsAppShareHelper.formatProducerPurchaseMessage(travel, prod);
                            WhatsAppShareHelper.openWhatsApp(txt, prod.phone);
                          }}
                        >
                          📲
                        </button>
                        <button
                          type="button"
                          className="t-btn t-btn-sm"
                          title="Descargar Liquidación PDF"
                          onClick={() => exportProducerLiquidationPdf(travel, prod)}
                        >
                          📄
                        </button>
                      </div>
                    </div>

                    {(prod.listOfProducts || []).map((p) => {
                      const cat = resolveProductCategory(p.name);
                      const catColor = getCategoryColor(cat);
                      return (
                        <div
                          key={p.id}
                          style={{
                            borderTop: '1px solid var(--t-border)',
                            paddingTop: 6,
                            marginTop: 6,
                            fontSize: '0.74rem',
                          }}
                          className="mono"
                        >
                          <div className="t-row-between">
                            <span>
                              <strong style={{ color: catColor }}>[{cat}]</strong> {p.name || cat} —{' '}
                              {p.quantity} cab
                            </span>
                            <strong style={{ color: 'var(--t-green)' }}>
                              {Formatters.currency(getProductFactura(p))}
                            </strong>
                          </div>
                          <div style={{ color: 'var(--t-text-secondary)', marginTop: 2 }}>
                            Bruto: {Formatters.decimal(p.kg, 0)} kg (-{p.roughing}%) → Limpio:{' '}
                            {Formatters.decimal(getProductKgClean(p), 0)} kg × {Formatters.currency(p.price)}
                          </div>
                          <div style={{ color: 'var(--t-text-muted)', marginTop: 2 }}>
                            Neto: {Formatters.currency(p.taxes.bill.neto)} • IVA ({p.isIvaManual ? 'Manual' : 'Auto'}
                            ): {Formatters.currency(p.taxes.bill.iva)} • Gan:{' '}
                            {Formatters.currency(p.taxes.bill.ganancias)}
                            {p.reduce > 0 && ` • Achique: -${Formatters.currency(p.reduce)}`}
                            {p.kgFaena > 0 &&
                              ` • Faena: ${Formatters.decimal(p.kgFaena, 0)} kg (${Formatters.decimal(
                                getProductYield(p) * 100,
                                1
                              )}%)`}
                          </div>
                        </div>
                      );
                    })}

                    <div
                      className="t-row-between mono"
                      style={{
                        borderTop: '1px solid var(--t-border)',
                        marginTop: 8,
                        paddingTop: 6,
                        fontSize: '0.78rem',
                      }}
                    >
                      <span style={{ color: 'var(--t-text-secondary)' }}>TOTAL FACTURA PRODUCTOR</span>
                      <strong style={{ color: 'var(--t-cyan)' }}>{Formatters.currency(prodTotalFact)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </ModalSheet>
  );
};

// =============================================================================
// 2. Travel Form Modal (Create / Edit Travel)
// =============================================================================

export const TravelFormModal: React.FC<{
  travelToEdit?: Travel | null;
  store: StoreSnapshot;
  onClose: () => void;
  onSaved: (travel: Travel) => void;
}> = ({ travelToEdit, store, onClose, onSaved }) => {
  const [form, setForm] = useState<Travel>(() => {
    if (travelToEdit) {
      return JSON.parse(JSON.stringify(travelToEdit)) as Travel;
    }
    return createTravel(store.config);
  });

  const [ocrTarget, setOcrTarget] = useState<'origin' | 'destination' | 'pump' | null>(null);
  const [saving, setSaving] = useState(false);

  const recalculateBuy = (nextTravel: Travel, cfg: AppConfig = store.config): Travel => {
    const calculatedBuy = TravelCalculator.applyFullCalculation(nextTravel.buy, cfg);
    return { ...nextTravel, buy: calculatedBuy };
  };

  const handleSelectTruck = (truckId: number | null) => {
    if (!truckId) return;
    const tr = store.trucks.find((x) => x.id === truckId);
    if (!tr) return;
    setForm((prev) => ({
      ...prev,
      truck: tr,
      buy: { ...prev.buy, truckId: tr.id },
    }));
  };

  const handleSelectAgent = (agentId: number | null) => {
    const ag = agentId ? store.agents.find((a) => a.id === agentId) || null : null;
    setForm((prev) =>
      recalculateBuy({
        ...prev,
        buy: { ...prev.buy, agent: ag },
      })
    );
  };

  const handleAddProducerFromCatalog = (producerId: number | null) => {
    if (!producerId) return;
    const catProd = store.producers.find((p) => p.id === producerId);
    if (!catProd) return;
    if (form.buy.listOfProducers.some((p) => p.id === catProd.id)) return;
    const newProd: Producer = {
      ...catProd,
      listOfProducts: [createProduct({ name: 'NOVILLO' })],
    };
    setForm((prev) =>
      recalculateBuy({
        ...prev,
        buy: {
          ...prev.buy,
          listOfProducers: [...prev.buy.listOfProducers, newProd],
        },
      })
    );
  };

  const handleAddQuickProducer = () => {
    const name = window.prompt('Nombre / Razón social del productor:');
    if (!name || !name.trim()) return;
    const newProd = createProducer({
      name: name.trim(),
      listOfProducts: [createProduct({ name: 'NOVILLO' })],
    });
    setForm((prev) =>
      recalculateBuy({
        ...prev,
        buy: {
          ...prev.buy,
          listOfProducers: [...prev.buy.listOfProducers, newProd],
        },
      })
    );
  };

  const updateProduct = (producerId: number, productId: number, patch: Partial<Product>) => {
    setForm((prev) =>
      recalculateBuy({
        ...prev,
        buy: {
          ...prev.buy,
          listOfProducers: prev.buy.listOfProducers.map((prod) =>
            prod.id !== producerId
              ? prod
              : {
                  ...prod,
                  listOfProducts: prod.listOfProducts.map((p) =>
                    p.id !== productId ? p : { ...p, ...patch }
                  ),
                }
          ),
        },
      })
    );
  };

  const addProductToProducer = (producerId: number) => {
    setForm((prev) =>
      recalculateBuy({
        ...prev,
        buy: {
          ...prev.buy,
          listOfProducers: prev.buy.listOfProducers.map((prod) =>
            prod.id !== producerId
              ? prod
              : {
                  ...prod,
                  listOfProducts: [...prod.listOfProducts, createProduct({ name: 'NOVILLO' })],
                }
          ),
        },
      })
    );
  };

  const removeProductFromProducer = (producerId: number, productId: number) => {
    setForm((prev) =>
      recalculateBuy({
        ...prev,
        buy: {
          ...prev.buy,
          listOfProducers: prev.buy.listOfProducers.map((prod) =>
            prod.id !== producerId
              ? prod
              : {
                  ...prod,
                  listOfProducts: prod.listOfProducts.filter((p) => p.id !== productId),
                }
          ),
        },
      })
    );
  };

  const removeProducer = (producerId: number) => {
    setForm((prev) =>
      recalculateBuy({
        ...prev,
        buy: {
          ...prev.buy,
          listOfProducers: prev.buy.listOfProducers.filter((p) => p.id !== producerId),
        },
      })
    );
  };

  const addExpense = () => {
    setForm((prev) => ({
      ...prev,
      expenses: [
        ...prev.expenses,
        createExpense({ travelId: prev.id, date: prev.date }),
      ],
    }));
  };

  const updateExpense = (id: number, patch: Partial<Expense>) => {
    setForm((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const removeExpense = (id: number) => {
    setForm((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const normalizedStatus: TravelStatus = form.isOnlyFreight ? 'FLETE' : form.status;
      const saved = await persistence.saveTravel({
        ...form,
        status: normalizedStatus,
      });
      TerminalHaptics.success();
      onSaved(saved);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const dist = getDistanceKm(form);
  const flete = getFleteCost(form, store.config);
  const profit = getTravelProfit(form, store.config);

  return (
    <ModalSheet
      title={travelToEdit ? `// EDITAR VIAJE #${travelToEdit.id}` : '// NUEVO VIAJE'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="t-btn t-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="travel-form"
            className="t-btn t-btn-green t-btn-filled"
            disabled={saving}
          >
            {saving ? 'Guardando...' : '💾 Guardar Viaje'}
          </button>
        </>
      }
    >
      <form id="travel-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Live Preview KPIs */}
        <div className="kpi-grid-3">
          <MetricCard title="Distancia" value={`${Formatters.decimal(dist, 0)} km`} tint="var(--t-purple)" />
          <MetricCard title="Flete" value={Formatters.currency(flete)} tint="var(--t-cyan)" />
          <MetricCard
            title="Ganancia"
            value={Formatters.currency(profit)}
            tint={profit >= 0 ? 'var(--t-green)' : 'var(--t-red)'}
          />
        </div>

        {/* Basic Info */}
        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="t-section-label">// DATOS GENERALES</div>

          <div className="kpi-grid-2">
            <div className="t-field">
              <label className="t-label">Fecha</label>
              <input
                type="date"
                className="t-input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div className="t-field">
              <label className="t-label">Estado</label>
              <select
                className="t-select"
                value={form.status}
                onChange={(e) => {
                  const nextStatus = e.target.value as TravelStatus;
                  setForm({
                    ...form,
                    status: nextStatus,
                    isOnlyFreight: nextStatus === 'FLETE' ? true : form.isOnlyFreight,
                  });
                }}
              >
                <option value="DRAFT">Borrador</option>
                <option value="ACTIVE">Activo / Hacienda</option>
                <option value="FLETE">Solo Flete</option>
              </select>
            </div>
          </div>

          <div className="t-field">
            <label className="t-label">Descripción / Destino</label>
            <input
              type="text"
              className="t-input"
              placeholder="Ej: Azul -> Frigorífico Pampa"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <label className="t-row-between mono" style={{ fontSize: '0.78rem', cursor: 'pointer' }}>
            <span>Modo Solo Flete (sin compra de hacienda)</span>
            <input
              type="checkbox"
              checked={form.isOnlyFreight}
              onChange={(e) =>
                setForm({
                  ...form,
                  isOnlyFreight: e.target.checked,
                  status: e.target.checked ? 'FLETE' : form.status === 'FLETE' ? 'ACTIVE' : form.status,
                })
              }
            />
          </label>

          <SearchablePicker
            label="Camión Asignado"
            items={store.trucks}
            selectedId={form.truck?.id || null}
            onSelect={handleSelectTruck}
            getTitle={(t) => (t.licensePlate ? `${t.name} (${t.licensePlate})` : t.name)}
            getSubtitle={(t) =>
              `Chofer: ${t.driver?.name || '-'} • Jaula: ${t.trailer?.name || '-'} (${
                t.trailer?.type === 'DOUBLE' ? 'Doble' : 'Simple'
              })`
            }
            getSearchTerms={(t) => [t.name, t.licensePlate, t.driver?.name || '']}
          />
        </div>

        {/* Odometers & OCR */}
        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="t-section-label">// ODÓMETRO Y COMBUSTIBLE (CON OCR)</div>

          <div className="kpi-grid-2">
            <div className="t-field">
              <div className="t-label">
                <span>Km Origen</span>
                <button
                  type="button"
                  className="t-btn t-btn-sm"
                  style={{ minHeight: 24, padding: '2px 7px', fontSize: '0.66rem' }}
                  onClick={() => setOcrTarget('origin')}
                >
                  📷 OCR
                </button>
              </div>
              <input
                type="number"
                step="any"
                className="t-input"
                value={form.kmOnOrigin || ''}
                onChange={(e) => setForm({ ...form, kmOnOrigin: Number(e.target.value) || 0 })}
              />
            </div>

            <div className="t-field">
              <div className="t-label">
                <span>Km Destino</span>
                <button
                  type="button"
                  className="t-btn t-btn-sm"
                  style={{ minHeight: 24, padding: '2px 7px', fontSize: '0.66rem' }}
                  onClick={() => setOcrTarget('destination')}
                >
                  📷 OCR
                </button>
              </div>
              <input
                type="number"
                step="any"
                className="t-input"
                value={form.kmOnDestination || ''}
                onChange={(e) => setForm({ ...form, kmOnDestination: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="kpi-grid-2">
            <div className="t-field">
              <div className="t-label">
                <span>Km Surtidor</span>
                <button
                  type="button"
                  className="t-btn t-btn-sm"
                  style={{ minHeight: 24, padding: '2px 7px', fontSize: '0.66rem' }}
                  onClick={() => setOcrTarget('pump')}
                >
                  📷 OCR
                </button>
              </div>
              <input
                type="number"
                step="any"
                className="t-input"
                value={form.kmOnPump || ''}
                onChange={(e) => setForm({ ...form, kmOnPump: Number(e.target.value) || 0 })}
              />
            </div>

            <div className="t-field">
              <label className="t-label">Litros Cargados</label>
              <input
                type="number"
                step="any"
                className="t-input"
                value={form.litersOnPump || ''}
                onChange={(e) => setForm({ ...form, litersOnPump: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="kpi-grid-3">
            <div className="t-field">
              <label className="t-label">Tarifa Flete $/km</label>
              <input
                type="number"
                step="any"
                className="t-input"
                value={form.pricePerKm || ''}
                onChange={(e) => setForm({ ...form, pricePerKm: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="t-field">
              <label className="t-label">
                Chofer $/km ({form.truck?.trailer?.type === 'DOUBLE' ? 'Doble' : 'Simple'})
              </label>
              <input
                type="number"
                step="any"
                className="t-input"
                value={
                  form.truck?.trailer?.type === 'DOUBLE'
                    ? form.driverPricePerKmDouble || ''
                    : form.driverPricePerKmSimple || ''
                }
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  if (form.truck?.trailer?.type === 'DOUBLE') {
                    setForm({ ...form, driverPricePerKmDouble: val });
                  } else {
                    setForm({ ...form, driverPricePerKmSimple: val });
                  }
                }}
              />
            </div>
            <div className="t-field">
              <label className="t-label">Gasoil $/l</label>
              <input
                type="number"
                step="any"
                className="t-input"
                value={form.fuelPrice || ''}
                onChange={(e) => setForm({ ...form, fuelPrice: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="t-section-label">
            <span>// GASTOS DEL VIAJE ({form.expenses.length})</span>
            <button type="button" className="t-btn t-btn-sm" onClick={addExpense}>
              + Gasto
            </button>
          </div>
          {form.expenses.map((exp) => (
            <div key={exp.id} className="t-card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="kpi-grid-2">
                <select
                  className="t-select"
                  value={exp.category}
                  onChange={(e) => updateExpense(exp.id, { category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="any"
                  className="t-input"
                  placeholder="Monto $"
                  value={exp.amount || ''}
                  onChange={(e) => updateExpense(exp.id, { amount: Number(e.target.value) || 0 })}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  className="t-input"
                  placeholder="Descripción"
                  value={exp.description}
                  onChange={(e) => updateExpense(exp.id, { description: e.target.value })}
                />
                <label className="mono" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', display: 'flex', gap: 4 }}>
                  <input
                    type="checkbox"
                    checked={exp.isReimbursable}
                    onChange={(e) => updateExpense(exp.id, { isReimbursable: e.target.checked })}
                  />
                  Reemb.
                </label>
                <button
                  type="button"
                  className="t-btn t-btn-red t-btn-sm"
                  onClick={() => removeExpense(exp.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cattle Buy Section */}
        {!form.isOnlyFreight && (
          <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="t-section-label">
              <span>// COMPRA DE HACIENDA</span>
              <span style={{ color: 'var(--t-green)' }}>
                Op: {Formatters.currency(getBuyTotalOperation(form.buy))}
              </span>
            </div>

            <SearchablePicker
              label="Comisionista / Consignatario"
              items={store.agents}
              selectedId={form.buy.agent?.id || null}
              onSelect={handleSelectAgent}
              getTitle={(a) => `${a.name} (${Formatters.decimal(a.percent, 1)}%)`}
              getSubtitle={(a) => a.phone || ''}
              getSearchTerms={(a) => [a.name, a.phone]}
              allowClear
              emptyLabel="Sin Comisionista (Directo)"
            />

            <div className="kpi-grid-2">
              <div className="t-field">
                <label className="t-label">Achique Global ($)</label>
                <input
                  type="number"
                  step="any"
                  className="t-input"
                  value={form.buy.totalReduce || ''}
                  onChange={(e) =>
                    setForm((prev) =>
                      recalculateBuy({
                        ...prev,
                        buy: { ...prev.buy, totalReduce: Number(e.target.value) || 0 },
                      })
                    )
                  }
                />
              </div>

              <div className="t-field">
                <div className="t-label">
                  <span>Kg Faena Total</span>
                  <button
                    type="button"
                    className="t-btn t-btn-sm"
                    style={{ minHeight: 24, padding: '2px 7px', fontSize: '0.66rem' }}
                    onClick={() => {
                      const amount = form.kgFaenaTotal || form.buy.kgFaenaGlobal;
                      if (amount > 0) {
                        setForm((prev) => ({
                          ...prev,
                          buy: TravelCalculator.distributeKgFaena(prev.buy, amount),
                        }));
                        TerminalHaptics.success();
                      }
                    }}
                  >
                    Prorratear
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  className="t-input"
                  value={form.kgFaenaTotal || form.buy.kgFaenaGlobal || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setForm((prev) => ({
                      ...prev,
                      kgFaenaTotal: val,
                      buy: { ...prev.buy, kgFaenaGlobal: val },
                    }));
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <SearchablePicker
                  label="Agregar Productor del Catálogo"
                  items={store.producers}
                  selectedId={null}
                  onSelect={handleAddProducerFromCatalog}
                  getTitle={(p) => p.name}
                  getSubtitle={(p) => (p.cuit ? `CUIT: ${Formatters.cuit(p.cuit)}` : '')}
                  getSearchTerms={(p) => [p.name, p.cuit, p.phone]}
                  placeholder="+ Elegir productor..."
                />
              </div>
              <button type="button" className="t-btn t-btn-sm" onClick={handleAddQuickProducer}>
                + Nuevo Rápido
              </button>
            </div>

            {/* Producers & Products */}
            {form.buy.listOfProducers.map((prod) => (
              <div key={prod.id} className="t-card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="t-row-between">
                  <strong className="mono" style={{ fontSize: '0.84rem', color: 'var(--t-cyan)' }}>
                    👤 {prod.name}
                  </strong>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="t-btn t-btn-green t-btn-sm"
                      onClick={() => addProductToProducer(prod.id)}
                    >
                      + Lote
                    </button>
                    <button
                      type="button"
                      className="t-btn t-btn-red t-btn-sm"
                      onClick={() => removeProducer(prod.id)}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {prod.listOfProducts.map((p) => (
                  <div
                    key={p.id}
                    className="t-card"
                    style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: 10 }}
                  >
                    <div className="t-row-between">
                      <input
                        type="text"
                        className="t-input"
                        placeholder="Categoría (Novillo, Vaca, Vaquillona...)"
                        value={p.name}
                        onChange={(e) => updateProduct(prod.id, p.id, { name: e.target.value })}
                      />
                      <button
                        type="button"
                        className="t-btn t-btn-red t-btn-sm"
                        style={{ marginLeft: 6 }}
                        onClick={() => removeProductFromProducer(prod.id, p.id)}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="kpi-grid-3">
                      <div className="t-field">
                        <label className="t-label">Cabezas</label>
                        <input
                          type="number"
                          className="t-input"
                          value={p.quantity || ''}
                          onChange={(e) =>
                            updateProduct(prod.id, p.id, { quantity: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="t-field">
                        <label className="t-label">Kg Brutos</label>
                        <input
                          type="number"
                          step="any"
                          className="t-input"
                          value={p.kg || ''}
                          onChange={(e) =>
                            updateProduct(prod.id, p.id, { kg: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="t-field">
                        <label className="t-label">Desbaste %</label>
                        <input
                          type="number"
                          step="any"
                          className="t-input"
                          value={p.roughing}
                          onChange={(e) =>
                            updateProduct(prod.id, p.id, { roughing: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>

                    <div className="kpi-grid-3">
                      <div className="t-field">
                        <label className="t-label">Precio $/kg</label>
                        <input
                          type="number"
                          step="any"
                          className="t-input"
                          value={p.price || ''}
                          onChange={(e) =>
                            updateProduct(prod.id, p.id, { price: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="t-field">
                        <label className="t-label">Kg Faena</label>
                        <input
                          type="number"
                          step="any"
                          className="t-input"
                          value={p.kgFaena || ''}
                          onChange={(e) =>
                            updateProduct(prod.id, p.id, {
                              kgFaena: Number(e.target.value) || 0,
                              isKgFaenaProrated: false,
                            })
                          }
                        />
                      </div>
                      <div className="t-field">
                        <label className="t-label">
                          <span>IVA</span>
                          <input
                            type="checkbox"
                            title="IVA Manual"
                            checked={p.isIvaManual}
                            onChange={(e) =>
                              updateProduct(prod.id, p.id, { isIvaManual: e.target.checked })
                            }
                          />
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="t-input"
                          disabled={!p.isIvaManual}
                          value={p.isIvaManual ? p.taxes.bill.iva || '' : Math.round(p.taxes.bill.iva * 100) / 100}
                          onChange={(e) =>
                            updateProduct(prod.id, p.id, {
                              taxes: {
                                ...p.taxes,
                                bill: { ...p.taxes.bill, iva: Number(e.target.value) || 0 },
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="t-row-between mono" style={{ fontSize: '0.7rem', color: 'var(--t-text-secondary)' }}>
                      <span>Limpio: {Formatters.decimal(getProductKgClean(p), 0)} kg</span>
                      <span>Neto: {Formatters.currency(p.taxes.bill.neto)}</span>
                      <strong style={{ color: 'var(--t-green)' }}>
                        Fact: {Formatters.currency(getProductFactura(p))}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </form>

      {ocrTarget && (
        <OdometerScanModal
          title={
            ocrTarget === 'origin'
              ? 'Odómetro Origen'
              : ocrTarget === 'destination'
              ? 'Odómetro Destino'
              : 'Odómetro Surtidor'
          }
          onClose={() => setOcrTarget(null)}
          onSelectValue={(val) => {
            if (ocrTarget === 'origin') setForm((prev) => ({ ...prev, kmOnOrigin: val }));
            else if (ocrTarget === 'destination')
              setForm((prev) => ({ ...prev, kmOnDestination: val }));
            else setForm((prev) => ({ ...prev, kmOnPump: val }));
          }}
        />
      )}
    </ModalSheet>
  );
};
