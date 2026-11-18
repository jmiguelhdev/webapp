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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Expiring Docs Banner */}
      <DocumentAlertBanner alerts={alerts} onNavigateFleet={() => onNavigateTab('fleet')} />

      {/* Search & New Button */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="t-search-wrap" style={{ flex: 1 }}>
          <span className="t-search-prefix">&gt;</span>
          <input
            type="text"
            className="t-input t-search-input"
            placeholder="grep / buscar viaje, chofer, productor..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              type="button"
              className="t-search-clear"
              onClick={() => setSearchText('')}
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          className="t-btn t-btn-filled"
          onClick={() => {
            TerminalHaptics.click();
            setEditingTravel('NEW');
          }}
        >
          + NUEVO
        </button>
      </div>

      {/* Filter Segmented Control */}
      <div className="t-segmented">
        {(
          [
            ['ALL', '[TODOS]'],
            ['ACTIVE', '[ACTIVOS]'],
            ['DRAFT', '[BORRADORES]'],
            ['FLETE', '[SOLO FLETE]'],
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

      {/* KPIs */}
      <div className="kpi-grid-3">
        <MetricCard title="Viajes" value={String(filteredTravels.length)} tint="var(--t-cyan)" />
        <MetricCard
          title="Kms Totales"
          value={`${Formatters.decimal(totalKms, 0)} km`}
          tint="var(--t-purple)"
        />
        <MetricCard
          title="Ganancia Neta"
          value={Formatters.currency(totalProfit)}
          tint={totalProfit >= 0 ? 'var(--t-green)' : 'var(--t-red)'}
        />
      </div>

      {/* Travel List */}
      {filteredTravels.length === 0 ? (
        <div className="t-card" style={{ textAlign: 'center', padding: '28px 16px' }}>
          <div className="mono" style={{ color: 'var(--t-cyan)', fontWeight: 800, fontSize: '0.95rem' }}>
            {searchText ? 'RESULTADO: 0' : 'SIN REGISTROS'}
          </div>
          <div className="mono" style={{ color: 'var(--t-text-secondary)', fontSize: '0.78rem', marginTop: 6 }}>
            {searchText
              ? `> Sin coincidencias para '${searchText}'`
              : '> No hay viajes en esta sección. Pulsa [+ NUEVO] para iniciar.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredTravels.map((travel) => {
            const profit = getTravelProfit(travel, store.config);
            const flete = getFleteCost(travel, store.config);
            const heads = getBuyTotalQuantity(travel.buy);
            const buyTotal = getBuyTotalOperation(travel.buy);
            const faena = getActualKgFaena(travel);

            return (
              <div
                key={travel.id}
                className="t-card t-card-clickable"
                onClick={() => {
                  TerminalHaptics.click();
                  setDetailTravelId(travel.id);
                }}
              >
                <div className="t-row-between" style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <StatusBadge status={travel.status} />
                    {travel.isDirty && (
                      <span className="t-badge" style={{ color: 'var(--t-amber)' }}>
                        [PENDIENTE SYNC]
                      </span>
                    )}
                  </div>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--t-text-secondary)' }}>
                    {Formatters.displayDate(travel.date)}
                  </span>
                </div>

                <div className="t-row-between" style={{ alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      className="mono"
                      style={{
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        color: 'var(--t-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getTravelDisplayTitle(travel)}
                    </div>
                    <div
                      className="mono"
                      style={{ fontSize: '0.73rem', color: 'var(--t-text-secondary)', marginTop: 2 }}
                    >
                      {getSubtitleDetail(travel) || 'Sin unidad asignada'}
                    </div>
                    {!travel.isOnlyFreight && heads > 0 && (
                      <div
                        className="mono"
                        style={{ fontSize: '0.71rem', color: 'var(--t-cyan)', marginTop: 4 }}
                      >
                        🐂 {getProducerNamesDisplay(travel)} • {heads} cab
                        {faena > 0 ? ` • Faena: ${Formatters.weight(faena)}` : ''}
                        {buyTotal > 0 ? ` • Op: ${Formatters.currencyCompact(buyTotal)}` : ''}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="mono" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--t-cyan)' }}>
                      {Formatters.currency(flete)}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: profit >= 0 ? 'var(--t-green)' : 'var(--t-red)',
                        marginTop: 2,
                      }}
                    >
                      Neto: {Formatters.currency(profit)}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: '1px solid var(--t-border)',
                    flexWrap: 'wrap',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="t-btn t-btn-amber t-btn-sm"
                    onClick={() => {
                      TerminalHaptics.click();
                      setEditingTravel(travel);
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-purple t-btn-sm"
                    onClick={() => void handleDuplicate(travel)}
                  >
                    📋 Duplicar
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-green t-btn-sm"
                    onClick={() => {
                      TerminalHaptics.click();
                      const txt = WhatsAppShareHelper.formatTravelLiquidationMessage(travel, store.config);
                      WhatsAppShareHelper.openWhatsApp(txt);
                    }}
                  >
                    📲 WA
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm"
                    onClick={() => {
                      TerminalHaptics.click();
                      exportTravelPdf(travel, store.config);
                      onToast('PDF generado.');
                    }}
                  >
                    📄 PDF
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
