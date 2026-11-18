import React, { useMemo, useState } from 'react';
import {
  Driver,
  Trailer,
  TrailerType,
  Truck,
  createDriver,
  createTrailer,
  createTruck,
  getDistanceKm,
  hasTruckExpiringDocuments,
  isTrailerExpiring,
} from '../domain/models';
import { TruckEfficiencyCalculator } from '../domain/engine';
import { StoreSnapshot, persistence } from '../services/persistence';
import { WhatsAppShareHelper, exportTruckSheetPdf } from '../services/exporters';
import { Formatters, TerminalHaptics } from '../utils/formatters';
import { MetricCard, ModalSheet } from '../components/TerminalUI';

type FleetTab = 'TRUCKS' | 'DRIVERS' | 'TRAILERS';
type TelemetryWindow = '30D' | 'YEAR' | 'ALL';

export const FleetView: React.FC<{
  store: StoreSnapshot;
  onToast: (msg: string) => void;
}> = ({ store, onToast }) => {
  const [subTab, setSubTab] = useState<FleetTab>('TRUCKS');
  const [selectedTruckFilterId, setSelectedTruckFilterId] = useState<number | 'ALL'>('ALL');
  const [telemetryWindow, setTelemetryWindow] = useState<TelemetryWindow>('30D');

  const [truckModal, setTruckModal] = useState<Truck | null | 'NEW'>(null);
  const [driverModal, setDriverModal] = useState<Driver | null | 'NEW'>(null);
  const [trailerModal, setTrailerModal] = useState<Trailer | null | 'NEW'>(null);

  const fleetEfficiencies = useMemo(
    () => TruckEfficiencyCalculator.calculateFleetEfficiencies(store.travels),
    [store.travels]
  );

  const telemetryPoints = useMemo(() => {
    const now = new Date();
    const minDate =
      telemetryWindow === '30D'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
        : telemetryWindow === 'YEAR'
        ? new Date(now.getFullYear(), 0, 1)
        : null;

    const sorted = [...store.travels].sort((a, b) => (a.date < b.date ? -1 : 1));
    const pts: Array<{
      id: number;
      date: string;
      kmPerLiter: number;
      truckName: string;
      anomaly: string;
    }> = [];

    for (const tr of sorted) {
      if (minDate) {
        const dt = Formatters.parseDate(tr.date);
        if (!dt || dt < minDate) continue;
      }
      if (selectedTruckFilterId !== 'ALL' && tr.truck?.id !== selectedTruckFilterId) continue;

      const res = fleetEfficiencies.get(tr.id);
      let eff = res?.efficiency || 0;
      if (eff <= 0 && tr.litersOnPump > 0 && getDistanceKm(tr) > 0) {
        eff = getDistanceKm(tr) / tr.litersOnPump;
      }
      if (eff <= 0) continue;

      pts.push({
        id: tr.id,
        date: tr.date,
        kmPerLiter: eff,
        truckName: tr.truck?.name || 'Camión',
        anomaly: res?.anomalyType || 'NONE',
      });
    }
    return pts;
  }, [store.travels, fleetEfficiencies, telemetryWindow, selectedTruckFilterId]);

  const avgEfficiency = useMemo(() => {
    if (telemetryPoints.length === 0) return 0;
    return telemetryPoints.reduce((acc, p) => acc + p.kmPerLiter, 0) / telemetryPoints.length;
  }, [telemetryPoints]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Top Action Bar */}
      <div className="t-row-between" style={{ flexWrap: 'wrap' }}>
        <div className="t-segmented" style={{ flex: 1 }}>
          <button
            type="button"
            className={`t-seg-item ${subTab === 'TRUCKS' ? 'active' : ''}`}
            onClick={() => {
              TerminalHaptics.selection();
              setSubTab('TRUCKS');
            }}
          >
            [CAMIONES: {store.trucks.length}]
          </button>
          <button
            type="button"
            className={`t-seg-item ${subTab === 'DRIVERS' ? 'active' : ''}`}
            onClick={() => {
              TerminalHaptics.selection();
              setSubTab('DRIVERS');
            }}
          >
            [CHOFERES: {store.drivers.length}]
          </button>
          <button
            type="button"
            className={`t-seg-item ${subTab === 'TRAILERS' ? 'active' : ''}`}
            onClick={() => {
              TerminalHaptics.selection();
              setSubTab('TRAILERS');
            }}
          >
            [JAULAS: {store.trailers.length}]
          </button>
        </div>
        <button
          type="button"
          className="t-btn t-btn-filled t-btn-sm"
          onClick={() => {
            TerminalHaptics.click();
            if (subTab === 'TRUCKS') setTruckModal('NEW');
            else if (subTab === 'DRIVERS') setDriverModal('NEW');
            else setTrailerModal('NEW');
          }}
        >
          + NUEVO
        </button>
      </div>

      {/* Fuel Telemetry Panel (Visible on Trucks Tab) */}
      {subTab === 'TRUCKS' && (
        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="t-section-label">
            <span>// TELEMETRÍA COMBUSTIBLE (KM/L)</span>
            <span style={{ color: avgEfficiency >= 2.4 ? 'var(--t-green)' : 'var(--t-amber)' }}>
              Prom: {Formatters.decimal(avgEfficiency, 2)} km/l
            </span>
          </div>

          <div className="kpi-grid-2">
            <select
              className="t-select"
              value={selectedTruckFilterId}
              onChange={(e) =>
                setSelectedTruckFilterId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
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
              {(['30D', 'YEAR', 'ALL'] as TelemetryWindow[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`t-seg-item ${telemetryWindow === w ? 'active' : ''}`}
                  onClick={() => setTelemetryWindow(w)}
                >
                  {w === '30D' ? '30D' : w === 'YEAR' ? 'AÑO' : 'TODO'}
                </button>
              ))}
            </div>
          </div>

          {telemetryPoints.length === 0 ? (
            <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--t-text-muted)' }}>
              &gt; Sin registros suficientes de surtidor en el período seleccionado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {telemetryPoints.slice(-8).map((pt) => {
                const pct = Math.min(100, Math.max(10, (pt.kmPerLiter / 4.5) * 100));
                const barColor =
                  pt.anomaly === 'LOW'
                    ? 'var(--t-red)'
                    : pt.anomaly === 'HIGH'
                    ? 'var(--t-amber)'
                    : 'var(--t-green)';
                return (
                  <div key={pt.id} className="mono" style={{ fontSize: '0.7rem' }}>
                    <div className="t-row-between" style={{ marginBottom: 2 }}>
                      <span style={{ color: 'var(--t-text-secondary)' }}>
                        {Formatters.displayDate(pt.date)} • {pt.truckName}
                      </span>
                      <strong style={{ color: barColor }}>
                        {Formatters.decimal(pt.kmPerLiter, 2)} km/l
                        {pt.anomaly !== 'NONE' ? ` (${pt.anomaly})` : ''}
                      </strong>
                    </div>
                    <div style={{ height: 6, background: '#05080b', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Trucks List */}
      {subTab === 'TRUCKS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {store.trucks.map((truck) => {
            const expiring = hasTruckExpiringDocuments(truck, 15);
            return (
              <div key={truck.id} className="t-card">
                <div className="t-row-between" style={{ marginBottom: 4 }}>
                  <strong className="mono" style={{ fontSize: '0.92rem', color: 'var(--t-cyan)' }}>
                    🚚 {truck.name} {truck.licensePlate ? `(${truck.licensePlate.toUpperCase()})` : ''}
                  </strong>
                  {expiring && (
                    <span className="t-badge" style={{ color: 'var(--t-red)' }}>
                      [VENCIMIENTO]
                    </span>
                  )}
                </div>
                <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--t-text-secondary)' }}>
                  👤 Chofer: {truck.driver?.name || 'Sin asignar'} • 📦 Jaula: {truck.trailer?.name || 'Sin asignar'}{' '}
                  ({truck.trailer?.type === 'DOUBLE' ? 'Doble' : 'Simple'})
                </div>
                <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--t-text-muted)', marginTop: 3 }}>
                  VTV: {truck.vtvExpiration ? Formatters.displayDate(truck.vtvExpiration) : '-'} • Seguro:{' '}
                  {truck.insuranceExpiration ? Formatters.displayDate(truck.insuranceExpiration) : '-'} • Prom:{' '}
                  {Formatters.decimal(truck.averageEfficiency, 2)} km/l
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="t-btn t-btn-amber t-btn-sm"
                    onClick={() => setTruckModal(truck)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-green t-btn-sm"
                    onClick={() =>
                      WhatsAppShareHelper.openWhatsApp(WhatsAppShareHelper.formatTruckDataMessage(truck))
                    }
                  >
                    📲 Ficha WA
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm"
                    onClick={() => {
                      exportTruckSheetPdf(truck);
                      onToast('Ficha PDF generada.');
                    }}
                  >
                    📄 Ficha PDF
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-red t-btn-sm"
                    onClick={async () => {
                      if (window.confirm(`¿Eliminar camión ${truck.name}?`)) {
                        await persistence.deleteTruck(truck.id);
                        onToast('Camión eliminado.');
                      }
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drivers List */}
      {subTab === 'DRIVERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {store.drivers.map((drv) => (
            <div key={drv.id} className="t-card">
              <div className="t-row-between">
                <div>
                  <div className="mono" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--t-text-primary)' }}>
                    👤 {drv.name}
                  </div>
                  <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--t-text-secondary)', marginTop: 2 }}>
                    DNI: {drv.dni ? Formatters.dni(drv.dni) : '-'} • Tel/Lic: {drv.license || '-'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="t-btn t-btn-amber t-btn-sm"
                    onClick={() => setDriverModal(drv)}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-red t-btn-sm"
                    onClick={async () => {
                      if (window.confirm(`¿Eliminar chofer ${drv.name}?`)) {
                        await persistence.deleteDriver(drv.id);
                        onToast('Chofer eliminado.');
                      }
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trailers List */}
      {subTab === 'TRAILERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {store.trailers.map((trl) => {
            const exp = isTrailerExpiring(trl, 15);
            return (
              <div key={trl.id} className="t-card">
                <div className="t-row-between">
                  <div>
                    <div className="mono" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--t-purple)' }}>
                      📦 {trl.name} {trl.licensePlate ? `(${trl.licensePlate.toUpperCase()})` : ''}
                    </div>
                    <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--t-text-secondary)', marginTop: 2 }}>
                      Tipo: {trl.type === 'DOUBLE' ? 'DOBLE' : 'SIMPLE'} • VTV:{' '}
                      {trl.vtvExpiration ? Formatters.displayDate(trl.vtvExpiration) : '-'} • SENASA:{' '}
                      {trl.senasaExpiration ? Formatters.displayDate(trl.senasaExpiration) : '-'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {exp && (
                      <span className="t-badge" style={{ color: 'var(--t-red)' }}>
                        [VENCE]
                      </span>
                    )}
                    <button
                      type="button"
                      className="t-btn t-btn-amber t-btn-sm"
                      onClick={() => setTrailerModal(trl)}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="t-btn t-btn-red t-btn-sm"
                      onClick={async () => {
                        if (window.confirm(`¿Eliminar jaula ${trl.name}?`)) {
                          await persistence.deleteTrailer(trl.id);
                          onToast('Jaula eliminada.');
                        }
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Truck Modal */}
      {truckModal !== null && (
        <TruckFormModal
          initial={truckModal === 'NEW' ? null : truckModal}
          drivers={store.drivers}
          trailers={store.trailers}
          onClose={() => setTruckModal(null)}
          onSaved={() => onToast('Camión guardado.')}
        />
      )}

      {/* Driver Modal */}
      {driverModal !== null && (
        <DriverFormModal
          initial={driverModal === 'NEW' ? null : driverModal}
          onClose={() => setDriverModal(null)}
          onSaved={() => onToast('Chofer guardado.')}
        />
      )}

      {/* Trailer Modal */}
      {trailerModal !== null && (
        <TrailerFormModal
          initial={trailerModal === 'NEW' ? null : trailerModal}
          onClose={() => setTrailerModal(null)}
          onSaved={() => onToast('Jaula guardada.')}
        />
      )}
    </div>
  );
};

// =============================================================================
// Sub-Modals for Truck, Driver, Trailer
// =============================================================================

const TruckFormModal: React.FC<{
  initial: Truck | null;
  drivers: Driver[];
  trailers: Trailer[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, drivers, trailers, onClose, onSaved }) => {
  const [form, setForm] = useState<Truck>(() =>
    initial ? { ...initial } : createTruck({ averageEfficiency: 2.85 })
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistence.saveTruck(form);
    TerminalHaptics.success();
    onSaved();
    onClose();
  };

  return (
    <ModalSheet
      title={initial ? '// EDITAR CAMIÓN' : '// NUEVO CAMIÓN'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="t-btn t-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="truck-form" className="t-btn t-btn-green t-btn-filled">
            Guardar
          </button>
        </>
      }
    >
      <form id="truck-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="t-field">
          <label className="t-label">Nombre / Modelo</label>
          <input
            type="text"
            className="t-input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="kpi-grid-2">
          <div className="t-field">
            <label className="t-label">Patente</label>
            <input
              type="text"
              className="t-input"
              value={form.licensePlate}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="t-field">
            <label className="t-label">Rendimiento Prom. (km/l)</label>
            <input
              type="number"
              step="0.05"
              className="t-input"
              value={form.averageEfficiency || ''}
              onChange={(e) => setForm({ ...form, averageEfficiency: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div className="kpi-grid-2">
          <div className="t-field">
            <label className="t-label">Vencimiento VTV</label>
            <input
              type="date"
              className="t-input"
              value={form.vtvExpiration}
              onChange={(e) => setForm({ ...form, vtvExpiration: e.target.value })}
            />
          </div>
          <div className="t-field">
            <label className="t-label">Vencimiento Seguro</label>
            <input
              type="date"
              className="t-input"
              value={form.insuranceExpiration}
              onChange={(e) => setForm({ ...form, insuranceExpiration: e.target.value })}
            />
          </div>
        </div>

        <div className="t-field">
          <label className="t-label">Chofer Asignado</label>
          <select
            className="t-select"
            value={form.driver?.id || 0}
            onChange={(e) => {
              const id = Number(e.target.value);
              const found = drivers.find((d) => d.id === id);
              setForm({
                ...form,
                driver: found || createDriver({ id: 0, name: 'Sin Chofer Asignado' }),
              });
            }}
          >
            <option value={0}>Sin Chofer Asignado</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="t-field">
          <label className="t-label">Jaula / Acoplado Asignado</label>
          <select
            className="t-select"
            value={form.trailer?.id || 0}
            onChange={(e) => {
              const id = Number(e.target.value);
              const found = trailers.find((t) => t.id === id);
              setForm({
                ...form,
                trailer: found || createTrailer({ id: 0, name: 'Sin Jaula Asignada', type: 'SIMPLE' }),
              });
            }}
          >
            <option value={0}>Sin Jaula Asignada</option>
            {trailers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.type === 'DOUBLE' ? 'Doble' : 'Simple'})
              </option>
            ))}
          </select>
        </div>

        <label className="t-row-between mono" style={{ fontSize: '0.78rem', cursor: 'pointer' }}>
          <span>Es camión de tercero (Flete se paga al chofer/tercero)</span>
          <input
            type="checkbox"
            checked={form.isFreightPaid}
            onChange={(e) => setForm({ ...form, isFreightPaid: e.target.checked })}
          />
        </label>
      </form>
    </ModalSheet>
  );
};

const DriverFormModal: React.FC<{
  initial: Driver | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, onClose, onSaved }) => {
  const [form, setForm] = useState<Driver>(() => (initial ? { ...initial } : createDriver()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistence.saveDriver(form);
    TerminalHaptics.success();
    onSaved();
    onClose();
  };

  return (
    <ModalSheet
      title={initial ? '// EDITAR CHOFER' : '// NUEVO CHOFER'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="t-btn t-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="driver-form" className="t-btn t-btn-green t-btn-filled">
            Guardar
          </button>
        </>
      }
    >
      <form id="driver-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="t-field">
          <label className="t-label">Nombre Completo</label>
          <input
            type="text"
            className="t-input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="t-field">
          <label className="t-label">DNI</label>
          <input
            type="text"
            className="t-input"
            value={form.dni}
            onChange={(e) => setForm({ ...form, dni: e.target.value })}
          />
        </div>
        <div className="t-field">
          <label className="t-label">Teléfono / Licencia</label>
          <input
            type="text"
            className="t-input"
            value={form.license}
            onChange={(e) => setForm({ ...form, license: e.target.value })}
          />
        </div>
      </form>
    </ModalSheet>
  );
};

const TrailerFormModal: React.FC<{
  initial: Trailer | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, onClose, onSaved }) => {
  const [form, setForm] = useState<Trailer>(() => (initial ? { ...initial } : createTrailer()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistence.saveTrailer(form);
    TerminalHaptics.success();
    onSaved();
    onClose();
  };

  return (
    <ModalSheet
      title={initial ? '// EDITAR JAULA' : '// NUEVA JAULA'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="t-btn t-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="trailer-form" className="t-btn t-btn-green t-btn-filled">
            Guardar
          </button>
        </>
      }
    >
      <form id="trailer-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="t-field">
          <label className="t-label">Nombre / Identificador</label>
          <input
            type="text"
            className="t-input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="kpi-grid-2">
          <div className="t-field">
            <label className="t-label">Patente</label>
            <input
              type="text"
              className="t-input"
              value={form.licensePlate}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="t-field">
            <label className="t-label">Tipo de Jaula</label>
            <select
              className="t-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as TrailerType })}
            >
              <option value="SIMPLE">Simple</option>
              <option value="DOUBLE">Doble</option>
            </select>
          </div>
        </div>
        <div className="kpi-grid-2">
          <div className="t-field">
            <label className="t-label">Vencimiento VTV</label>
            <input
              type="date"
              className="t-input"
              value={form.vtvExpiration}
              onChange={(e) => setForm({ ...form, vtvExpiration: e.target.value })}
            />
          </div>
          <div className="t-field">
            <label className="t-label">Vencimiento SENASA</label>
            <input
              type="date"
              className="t-input"
              value={form.senasaExpiration}
              onChange={(e) => setForm({ ...form, senasaExpiration: e.target.value })}
            />
          </div>
        </div>
      </form>
    </ModalSheet>
  );
};
