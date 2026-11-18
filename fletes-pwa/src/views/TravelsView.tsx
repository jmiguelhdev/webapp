import React, { useMemo, useState } from 'react';
import {
  Travel,
  generateNumericId,
  getActualKgFaena,
  getBuyTotalOperation,
  getBuyTotalQuantity,
  getDistanceKm,
  getExpiringDocumentsAlertList,
  getFleteCost,
  getProducerNamesDisplay,
  getSubtitleDetail,
  getTravelDisplayTitle,
  getTravelProfit,
} from '../domain/models';
import { StoreSnapshot, persistence } from '../services/persistence';
import { WhatsAppShareHelper, exportTravelPdf } from '../services/exporters';
import { Formatters, TerminalHaptics } from '../utils/formatters';
import {
  DocumentAlertBanner,
  MetricCard,
  StatusBadge,
} from '../components/TerminalUI';
import { TravelDetailModal, TravelFormModal } from './TravelModals';

type TravelFilter = 'ALL' | 'ACTIVE' | 'DRAFT' | 'FLETE';

export const TravelsView: React.FC<{
  store: StoreSnapshot;
  onNavigateTab: (tab: 'travels' | 'fleet' | 'reports' | 'config') => void;
  onToast: (msg: string) => void;
}> = ({ store, onNavigateTab, onToast }) => {
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState<TravelFilter>('ALL');
  const [detailTravelId, setDetailTravelId] = useState<number | null>(null);
  const [editingTravel, setEditingTravel] = useState<Travel | null | 'NEW'>(null);

  const alerts = useMemo(
    () => getExpiringDocumentsAlertList(store.trucks, store.trailers, 15),
    [store.trucks, store.trailers]
  );

  const filteredTravels = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return store.travels.filter((travel) => {
      if (filter === 'ACTIVE' && travel.status !== 'ACTIVE') return false;
      if (filter === 'DRAFT' && travel.status !== 'DRAFT') return false;
      if (filter === 'FLETE' && !travel.isOnlyFreight && travel.status !== 'FLETE') return false;

      if (!q) return true;
      return (
        (travel.description || '').toLowerCase().includes(q) ||
        (travel.truck?.name || '').toLowerCase().includes(q) ||
        (travel.truck?.driver?.name || '').toLowerCase().includes(q) ||
        String(travel.id).includes(q) ||
        (travel.buy?.listOfProducers || []).some((p) => (p.name || '').toLowerCase().includes(q)) ||
        (travel.buy?.agent?.name || '').toLowerCase().includes(q)
      );
    });
  }, [store.travels, filter, searchText]);

  const totalKms = useMemo(
    () => filteredTravels.reduce((acc, t) => acc + getDistanceKm(t), 0),
    [filteredTravels]
  );

  const totalProfit = useMemo(
    () => filteredTravels.reduce((acc, t) => acc + getTravelProfit(t, store.config), 0),
    [filteredTravels, store.config]
  );

  const handleDuplicate = async (travel: Travel) => {
    TerminalHaptics.click();
    const copy: Travel = {
      ...(JSON.parse(JSON.stringify(travel)) as Travel),
      id: generateNumericId(),
      rawDocId: undefined,
      status: 'DRAFT',
      date: Formatters.isoDate(new Date()),
      kmOnOrigin: travel.kmOnDestination > 0 ? travel.kmOnDestination : travel.kmOnOrigin,
      kmOnDestination: 0,
      expenses: [],
      updatedAt: Date.now(),
      isDirty: true,
    };
    await persistence.saveTravel(copy);
    TerminalHaptics.success();
    onToast('Viaje duplicado como Borrador.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Expiring Docs Alert Banner */}
      <DocumentAlertBanner alerts={alerts} onNavigateFleet={() => onNavigateTab('fleet')} />

      {/* Search & New Action */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div className="t-search-wrap" style={{ flex: 1 }}>
          <span className="t-search-icon">🔍</span>
          <input
            type="text"
            className="t-input t-search-input"
            placeholder="Buscar por chofer, camión, productor, destino..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              type="button"
              className="t-search-clear"
              onClick={() => setSearchText('')}
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          className="t-btn t-btn-filled"
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => {
            TerminalHaptics.click();
            setEditingTravel('NEW');
          }}
        >
          <span>+ Nuevo Viaje</span>
        </button>
      </div>

      {/* Filter Segmented Control */}
      <div className="t-segmented">
        {(
          [
            ['ALL', 'Todos'],
            ['ACTIVE', 'Activos'],
            ['DRAFT', 'Borradores'],
            ['FLETE', 'Solo Flete'],
          ] as Array<[TravelFilter, string]>
        ).map(([val, label]) => (
          <button
            key={val}
            type="button"
            className={`t-seg-item ${filter === val ? 'active' : ''}`}
            onClick={() => {
              TerminalHaptics.selection();
              setFilter(val);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* High Density KPIs with Tabular Nums */}
      <div className="kpi-grid-3">
        <MetricCard title="Viajes Registrados" value={String(filteredTravels.length)} />
        <MetricCard
          title="Distancia Total"
          value={`${Formatters.decimal(totalKms, 0)} km`}
        />
        <MetricCard
          title="Ganancia Estimada"
          value={Formatters.currency(totalProfit)}
          tint={totalProfit >= 0 ? 'var(--t-emerald-text)' : 'var(--t-rose-text)'}
        />
      </div>

      {/* Travel List */}
      {filteredTravels.length === 0 ? (
        <div className="t-card" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.96rem', color: 'var(--t-text-primary)' }}>
            {searchText ? 'Sin resultados para la búsqueda' : 'No hay viajes en esta sección'}
          </div>
          <div style={{ color: 'var(--t-text-muted)', fontSize: '0.8rem', marginTop: 6 }}>
            {searchText
              ? `No se encontraron coincidencias para "${searchText}".`
              : 'Podés iniciar un nuevo registro presionando "+ Nuevo Viaje".'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTravels.map((travel) => {
            const profit = getTravelProfit(travel, store.config);
            const flete = getFleteCost(travel, store.config);
            const heads = getBuyTotalQuantity(travel.buy);
            const buyTotal = getBuyTotalOperation(travel.buy);
            const faena = getActualKgFaena(travel);
            const distance = getDistanceKm(travel);

            return (
              <div
                key={travel.id}
                className="t-card t-card-clickable"
                onClick={() => {
                  TerminalHaptics.click();
                  setDetailTravelId(travel.id);
                }}
              >
                {/* Header row: Status + Date */}
                <div className="t-row-between" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <StatusBadge status={travel.status} />
                    {travel.isDirty && (
                      <span
                        className="t-badge tabular-nums"
                        style={{
                          background: 'var(--t-amber-bg)',
                          color: 'var(--t-amber-text)',
                          borderColor: 'var(--t-amber-border)',
                        }}
                      >
                        Pendiente Sync
                      </span>
                    )}
                  </div>
                  <span
                    className="tabular-nums"
                    style={{ fontSize: '0.75rem', color: 'var(--t-text-muted)', fontWeight: 500 }}
                  >
                    {Formatters.displayDate(travel.date)}
                  </span>
                </div>

                {/* Title and Detail */}
                <div className="t-row-between" style={{ alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: 'var(--t-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        letterSpacing: '-0.015em',
                      }}
                    >
                      {getTravelDisplayTitle(travel)}
                    </div>
                    <div
                      style={{ fontSize: '0.78rem', color: 'var(--t-text-secondary)', marginTop: 3 }}
                    >
                      {getSubtitleDetail(travel) || 'Sin unidad asignada'}
                    </div>

                    {!travel.isOnlyFreight && heads > 0 && (
                      <div
                        className="tabular-nums"
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--t-text-secondary)',
                          marginTop: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ color: 'var(--t-text-primary)', fontWeight: 500 }}>
                          🐂 {getProducerNamesDisplay(travel)}
                        </span>
                        <span>•</span>
                        <span>{heads} cabezas</span>
                        {faena > 0 && (
                          <>
                            <span>•</span>
                            <span>Faena: {Formatters.weight(faena)}</span>
                          </>
                        )}
                        {buyTotal > 0 && (
                          <>
                            <span>•</span>
                            <span>Op: {Formatters.currencyCompact(buyTotal)}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Operational & Financial Summary */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      className="tabular-nums"
                      style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--t-text-primary)' }}
                    >
                      {Formatters.currency(flete)}
                    </div>
                    <div
                      className="tabular-nums"
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 500,
                        color: profit >= 0 ? 'var(--t-emerald-text)' : 'var(--t-rose-text)',
                        marginTop: 2,
                      }}
                    >
                      {profit >= 0 ? '+' : ''}{Formatters.currency(profit)} neto
                    </div>
                    {distance > 0 && (
                      <div
                        className="tabular-nums"
                        style={{ fontSize: '0.7rem', color: 'var(--t-text-muted)', marginTop: 2 }}
                      >
                        {Formatters.decimal(distance, 0)} km
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Minimalist Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid var(--t-border-subtle)',
                    flexWrap: 'wrap',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="t-btn t-btn-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                    onClick={() => {
                      TerminalHaptics.click();
                      setEditingTravel(travel);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-muted"
                    onClick={() => void handleDuplicate(travel)}
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-muted"
                    onClick={() => {
                      TerminalHaptics.click();
                      const txt = WhatsAppShareHelper.formatTravelLiquidationMessage(travel, store.config);
                      WhatsAppShareHelper.openWhatsApp(txt);
                    }}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-muted"
                    onClick={() => {
                      TerminalHaptics.click();
                      exportTravelPdf(travel, store.config);
                      onToast('Comprobante PDF generado.');
                    }}
                  >
                    PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailTravelId !== null && (
        <TravelDetailModal
          travelId={detailTravelId}
          store={store}
          onClose={() => setDetailTravelId(null)}
          onEdit={(tr) => {
            setDetailTravelId(null);
            setEditingTravel(tr);
          }}
          onDeleted={() => setDetailTravelId(null)}
          onToast={onToast}
        />
      )}

      {editingTravel !== null && (
        <TravelFormModal
          travelToEdit={editingTravel === 'NEW' ? null : editingTravel}
          store={store}
          onClose={() => setEditingTravel(null)}
          onSaved={() => onToast('Viaje guardado y sincronizado.')}
        />
      )}
    </div>
  );
};
