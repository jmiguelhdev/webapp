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
import { ModalSheet } from '../components/TerminalUI';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top Action Bar */}
      <div className="t-row-between" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="t-segmented" style={{ flex: 1, minWidth: 260 }}>
          <button
            type="button"
            className={`t-seg-item ${subTab === 'TRUCKS' ? 'active' : ''}`}
            onClick={() => {
              TerminalHaptics.selection();
              setSubTab('TRUCKS');
            }}
          >
            Camiones ({store.trucks.length})
          </button>
          <button
            type="button"
            className={`t-seg-item ${subTab === 'DRIVERS' ? 'active' : ''}`}
            onClick={() => {
              TerminalHaptics.selection();
              setSubTab('DRIVERS');
            }}
          >
            Choferes ({store.drivers.length})
          </button>
          <button
            type="button"
            className={`t-seg-item ${subTab === 'TRAILERS' ? 'active' : ''}`}
            onClick={() => {
              TerminalHaptics.selection();
              setSubTab('TRAILERS');
            }}
          >
            Jaulas ({store.trailers.length})
          </button>
        </div>
        <button
          type="button"
          className="t-btn t-btn-filled t-btn-sm"
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => {
            TerminalHaptics.click();
            if (subTab === 'TRUCKS') setTruckModal('NEW');
            else if (subTab === 'DRIVERS') setDriverModal('NEW');
            else setTrailerModal('NEW');
          }}
        >
          <span>
            + {subTab === 'TRUCKS' ? 'Nuevo Camión' : subTab === 'DRIVERS' ? 'Nuevo Chofer' : 'Nueva Jaula'}
          </span>
        </button>
      </div>

      {/* Fuel Telemetry Panel (Visible on Trucks Tab) */}
      {subTab === 'TRUCKS' && (
        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="t-row-between">
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
              Telemetría de Combustible (km/l)
            </span>
            <span
              className="t-badge tabular-nums"
              style={{
                background: avgEfficiency >= 2.4 ? 'var(--t-emerald-bg)' : 'var(--t-amber-bg)',
                color: avgEfficiency >= 2.4 ? 'var(--t-emerald-text)' : 'var(--t-amber-text)',
                borderColor: avgEfficiency >= 2.4 ? 'var(--t-emerald-border)' : 'var(--t-amber-border)',
              }}
            >
              Promedio: {Formatters.decimal(avgEfficiency, 2)} km/l
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
                  {w === '30D' ? '30 días' : w === 'YEAR' ? 'Este año' : 'Histórico'}
                </button>
              ))}
            </div>
          </div>

          {telemetryPoints.length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--t-text-muted)', textAlign: 'center', padding: '12px 0' }}>
              Sin registros suficientes de surtidor en el período seleccionado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {telemetryPoints.slice(-8).map((pt) => {
                const pct = Math.min(100, Math.max(10, (pt.kmPerLiter / 4.5) * 100));
                const barColor =
                  pt.anomaly === 'LOW'
                    ? 'var(--t-rose-text)'
                    : pt.anomaly === 'HIGH'
                    ? 'var(--t-amber-text)'
                    : 'var(--t-emerald-text)';
                return (
                  <div key={pt.id} style={{ fontSize: '0.76rem' }}>
                    <div className="t-row-between" style={{ marginBottom: 4 }}>
                      <span style={{ color: 'var(--t-text-secondary)' }}>
                        {Formatters.displayDate(pt.date)} • {pt.truckName}
                      </span>
                      <strong className="tabular-nums" style={{ color: barColor, fontWeight: 600 }}>
                        {Formatters.decimal(pt.kmPerLiter, 2)} km/l
                        {pt.anomaly !== 'NONE' ? ` (${pt.anomaly})` : ''}
                      </strong>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3 }} />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {store.trucks.map((truck) => {
            const expiring = hasTruckExpiringDocuments(truck, 15);
            return (
              <div key={truck.id} className="t-card">
                <div className="t-row-between" style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--t-text-primary)' }}>
                      {truck.name}
                    </span>
                    {truck.licensePlate && (
                      <span className="t-badge tabular-nums" style={{ fontSize: '0.72rem' }}>
                        {truck.licensePlate.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {expiring && (
                    <span
                      className="t-badge tabular-nums"
                      style={{
                        background: 'var(--t-rose-bg)',
                        color: 'var(--t-rose-text)',
                        borderColor: 'var(--t-rose-border)',
                      }}
                    >
                      Doc por vencer
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--t-text-secondary)', marginTop: 2 }}>
                  <span>Chofer: {truck.driver?.name || 'Sin asignar'}</span>
                  <span style={{ margin: '0 6px', color: 'var(--t-text-muted)' }}>•</span>
                  <span>
                    Jaula: {truck.trailer?.name || 'Sin asignar'} ({truck.trailer?.type === 'DOUBLE' ? 'Doble' : 'Simple'})
                  </span>
                </div>

                <div
                  className="tabular-nums"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--t-text-muted)',
                    marginTop: 6,
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>VTV: {truck.vtvExpiration ? Formatters.displayDate(truck.vtvExpiration) : '-'}</span>
                  <span>Seguro: {truck.insuranceExpiration ? Formatters.displayDate(truck.insuranceExpiration) : '-'}</span>
                  <span>Promedio: {Formatters.decimal(truck.averageEfficiency, 2)} km/l</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid var(--t-border-subtle)',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className="t-btn t-btn-sm"
                    onClick={() => setTruckModal(truck)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-muted"
                    onClick={() =>
                      WhatsAppShareHelper.openWhatsApp(WhatsAppShareHelper.formatTruckDataMessage(truck))
                    }
                  >
                    Ficha WhatsApp
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-muted"
                    onClick={() => {
                      exportTruckSheetPdf(truck);
                      onToast('Ficha PDF generada.');
                    }}
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-red"
                    style={{ marginLeft: 'auto' }}
                    onClick={async () => {
                      if (window.confirm(`¿Eliminar camión ${truck.name}?`)) {
                        await persistence.deleteTruck(truck.id);
                        onToast('Camión eliminado.');
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drivers List */}
      {subTab === 'DRIVERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {store.drivers.map((drv) => (
            <div key={drv.id} className="t-card">
              <div className="t-row-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--t-text-primary)' }}>
                    {drv.name}
                  </div>
                  <div
                    className="tabular-nums"
                    style={{ fontSize: '0.78rem', color: 'var(--t-text-secondary)', marginTop: 4 }}
                  >
                    DNI: {drv.dni ? Formatters.dni(drv.dni) : '-'}
                    <span style={{ margin: '0 6px', color: 'var(--t-text-muted)' }}>•</span>
                    Licencia/Tel: {drv.license || '-'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="t-btn t-btn-sm"
                    onClick={() => setDriverModal(drv)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-red"
                    onClick={async () => {
                      if (window.confirm(`¿Eliminar chofer ${drv.name}?`)) {
                        await persistence.deleteDriver(drv.id);
                        onToast('Chofer eliminado.');
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trailers List */}
      {subTab === 'TRAILERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {store.trailers.map((trl) => {
            const exp = isTrailerExpiring(trl, 15);
            return (
              <div key={trl.id} className="t-card">
                <div className="t-row-between">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--t-text-primary)' }}>
                        {trl.name}
                      </span>
                      {trl.licensePlate && (
                        <span className="t-badge tabular-nums" style={{ fontSize: '0.72rem' }}>
                          {trl.licensePlate.toUpperCase()}
                        </span>
                      )}
                      <span
                        className="t-badge"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--t-text-secondary)',
                          fontSize: '0.7rem',
                        }}
                      >
                        {trl.type === 'DOUBLE' ? 'Doble' : 'Simple'}
                      </span>
                    </div>

                    <div
                      className="tabular-nums"
                      style={{ fontSize: '0.75rem', color: 'var(--t-text-muted)', marginTop: 5 }}
                    >
                      VTV: {trl.vtvExpiration ? Formatters.displayDate(trl.vtvExpiration) : '-'}
                      <span style={{ margin: '0 6px' }}>•</span>
                      SENASA: {trl.senasaExpiration ? Formatters.displayDate(trl.senasaExpiration) : '-'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {exp && (
                      <span
                        className="t-badge tabular-nums"
                        style={{
                          background: 'var(--t-rose-bg)',
                          color: 'var(--t-rose-text)',
                          borderColor: 'var(--t-rose-border)',
                        }}
                      >
                        Vence pronto
                      </span>
                    )}
                    <button
                      type="button"
                      className="t-btn t-btn-sm"
                      onClick={() => setTrailerModal(trl)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="t-btn t-btn-sm t-btn-red"
                      onClick={async () => {
                        if (window.confirm(`¿Eliminar jaula ${trl.name}?`)) {
                          await persistence.deleteTrailer(trl.id);
                          onToast('Jaula eliminada.');
                        }
                      }}
                    >
                      Eliminar
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
          onSaved={() => onToast('Camión guardado con éxito.')}
        />
      )}

      {/* Driver Modal */}
      {driverModal !== null && (
        <DriverFormModal
          initial={driverModal === 'NEW' ? null : driverModal}
          onClose={() => setDriverModal(null)}
          onSaved={() => onToast('Chofer guardado con éxito.')}
        />
      )}

      {/* Trailer Modal */}
      {trailerModal !== null && (
        <TrailerFormModal
          initial={trailerModal === 'NEW' ? null : trailerModal}
          onClose={() => setTrailerModal(null)}
          onSaved={() => onToast('Jaula guardada con éxito.')}
        />
      )}
    </div>
  );
};

// =============================================================================
// Sub-Modals for Truck, Driver, Trailer (Clean Geometry & Minimal Noise)
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
      title={initial ? 'Editar Camión' : 'Nuevo Camión'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="t-btn t-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="truck-form" className="t-btn t-btn-filled">
            Guardar Cambios
          </button>
        </>
      }
    >
      <form id="truck-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="t-field">
          <label className="t-label">Nombre / Modelo del Camión</label>
          <input
            type="text"
            className="t-input"
            required
            placeholder="Ej: Axor 1933"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="kpi-grid-2">
          <div className="t-field">
            <label className="t-label">Patente</label>
            <input
              type="text"
              className="t-input tabular-nums"
              placeholder="Ej: AB 123 CD"
              value={form.licensePlate}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="t-field">
            <label className="t-label">Rendimiento Promedio (km/l)</label>
            <input
              type="number"
              step="0.05"
              inputMode="decimal"
              className="t-input tabular-nums"
              placeholder="Ej: 2.85"
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
              className="t-input tabular-nums"
              value={form.vtvExpiration}
              onChange={(e) => setForm({ ...form, vtvExpiration: e.target.value })}
            />
          </div>
          <div className="t-field">
            <label className="t-label">Vencimiento Seguro</label>
            <input
              type="date"
              className="t-input tabular-nums"
              value={form.insuranceExpiration}
              onChange={(e) => setForm({ ...form, insuranceExpiration: e.target.value })}
            />
          </div>
        </div>

        <div className="t-field">
          <label className="t-label">Chofer Asignado Habitual</label>
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

        <label className="t-row-between" style={{ fontSize: '0.8rem', color: 'var(--t-text-secondary)', cursor: 'pointer', padding: '6px 0' }}>
          <span>Camión de tercero (el flete se liquida a tercero/chofer)</span>
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
      title={initial ? 'Editar Chofer' : 'Nuevo Chofer'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="t-btn t-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="driver-form" className="t-btn t-btn-filled">
            Guardar
          </button>
        </>
      }
    >
      <form id="driver-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="t-field">
          <label className="t-label">Nombre Completo</label>
          <input
            type="text"
            className="t-input"
            required
            placeholder="Ej: Juan Pérez"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="t-field">
          <label className="t-label">DNI</label>
          <input
            type="text"
            inputMode="numeric"
            className="t-input tabular-nums"
            placeholder="Ej: 32.456.789"
            value={form.dni}
            onChange={(e) => setForm({ ...form, dni: e.target.value })}
          />
        </div>
        <div className="t-field">
          <label className="t-label">Teléfono / Número de Licencia</label>
          <input
            type="text"
            inputMode="tel"
            className="t-input tabular-nums"
            placeholder="Ej: 381 456 7890"
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
      title={initial ? 'Editar Jaula / Acoplado' : 'Nueva Jaula / Acoplado'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="t-btn t-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="trailer-form" className="t-btn t-btn-filled">
            Guardar
          </button>
        </>
      }
    >
      <form id="trailer-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="t-field">
          <label className="t-label">Nombre o Identificador</label>
          <input
            type="text"
            className="t-input"
            required
            placeholder="Ej: Jaula Doble #2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="kpi-grid-2">
          <div className="t-field">
            <label className="t-label">Patente</label>
            <input
              type="text"
              className="t-input tabular-nums"
              placeholder="Ej: AD 450 BB"
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
              <option value="SIMPLE">Simple (1 piso)</option>
              <option value="DOUBLE">Doble (2 pisos)</option>
            </select>
          </div>
        </div>
        <div className="kpi-grid-2">
          <div className="t-field">
            <label className="t-label">Vencimiento VTV</label>
            <input
              type="date"
              className="t-input tabular-nums"
              value={form.vtvExpiration}
              onChange={(e) => setForm({ ...form, vtvExpiration: e.target.value })}
            />
          </div>
          <div className="t-field">
            <label className="t-label">Vencimiento SENASA</label>
            <input
              type="date"
              className="t-input tabular-nums"
              value={form.senasaExpiration}
              onChange={(e) => setForm({ ...form, senasaExpiration: e.target.value })}
            />
          </div>
        </div>
      </form>
    </ModalSheet>
  );
};
