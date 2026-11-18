import React, { useMemo, useState } from 'react';
import {
  Agent,
  AgentPayment,
  AppConfig,
  Producer,
  createAgent,
  createProducer,
  generateNumericId,
  getBuyAgentCommissionAmount,
  getFleteCost,
  getTravelDisplayTitle,
} from '../domain/models';
import { StoreSnapshot, persistence } from '../services/persistence';
import { WhatsAppShareHelper } from '../services/exporters';
import { CBUHelper } from '../utils/cbuHelper';
import { Formatters, TerminalHaptics } from '../utils/formatters';
import { MetricCard, ModalSheet } from '../components/TerminalUI';

type ConfigSection = 'MAIN' | 'PRODUCERS' | 'AGENTS' | 'FISCAL';

export const ConfigView: React.FC<{
  store: StoreSnapshot;
  onToast: (msg: string) => void;
}> = ({ store, onToast }) => {
  const [section, setSection] = useState<ConfigSection>('MAIN');
  const [soundHaptics, setSoundHaptics] = useState<boolean>(
    () => localStorage.getItem('iosfletes_sound_haptics') === 'true'
  );

  // Producers state
  const [producerModal, setProducerModal] = useState<Producer | null | 'NEW'>(null);
  const [producerSearch, setProducerSearch] = useState('');

  // Agents state
  const [agentModal, setAgentModal] = useState<Agent | null | 'NEW'>(null);
  const [agentAccount, setAgentAccount] = useState<Agent | null>(null);

  // Fiscal Config state
  const [fiscalDraft, setFiscalDraft] = useState<AppConfig>(store.config);

  const handleOpenFiscal = () => {
    setFiscalDraft({ ...store.config });
    setSection('FISCAL');
  };

  const handleExportJson = () => {
    const json = persistence.exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IosFletes_Backup_${Formatters.isoDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Copia de respaldo JSON exportada.');
  };

  const handleImportJson = async (file?: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const res = await persistence.importBackupJson(text);
      TerminalHaptics.success();
      onToast(`Backup restaurado correctamente (${res.travelsCount} viajes).`);
    } catch {
      TerminalHaptics.error();
      onToast('El archivo JSON no tiene un formato válido.');
    }
  };

  // --- SUB-SCREEN: PRODUCERS ---
  if (section === 'PRODUCERS') {
    const filteredProducers = store.producers.filter((p) => {
      const q = producerSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.cuit.toLowerCase().includes(q) ||
        p.cbu.toLowerCase().includes(q)
      );
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="t-row-between">
          <button type="button" className="t-btn t-btn-muted t-btn-sm" onClick={() => setSection('MAIN')}>
            ← Volver a Ajustes
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--t-text-primary)' }}>
            Productores de Ganado ({store.producers.length})
          </span>
          <button
            type="button"
            className="t-btn t-btn-filled t-btn-sm"
            onClick={() => setProducerModal('NEW')}
          >
            + Nuevo Productor
          </button>
        </div>

        <div className="t-search-wrap">
          <span className="t-search-icon">🔍</span>
          <input
            type="text"
            className="t-input t-search-input"
            placeholder="Buscar por nombre, CUIT o CBU..."
            value={producerSearch}
            onChange={(e) => setProducerSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredProducers.map((prod) => {
            const cbuInfo = CBUHelper.decode(prod.cbu);
            return (
              <div key={prod.id} className="t-card">
                <div className="t-row-between">
                  <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--t-text-primary)' }}>
                    {prod.name}
                  </span>
                  {cbuInfo.isValidLength && (
                    <span
                      className="t-badge tabular-nums"
                      style={{
                        background: 'var(--t-emerald-bg)',
                        color: 'var(--t-emerald-text)',
                        borderColor: 'var(--t-emerald-border)',
                      }}
                    >
                      {cbuInfo.bankName}
                    </span>
                  )}
                </div>
                <div className="tabular-nums" style={{ fontSize: '0.78rem', color: 'var(--t-text-secondary)', marginTop: 4 }}>
                  CUIT: {prod.cuit ? Formatters.cuit(prod.cuit) : 'Sin CUIT'}
                  <span style={{ margin: '0 6px', color: 'var(--t-text-muted)' }}>•</span>
                  Tel: {prod.phone || '-'}
                </div>
                {prod.cbu && (
                  <div className="tabular-nums" style={{ fontSize: '0.74rem', color: 'var(--t-text-muted)', marginTop: 2 }}>
                    CBU: {CBUHelper.formattedCBU(prod.cbu)}
                    {cbuInfo.accountNumber ? ` • Cuenta: ${CBUHelper.accountDisplay(cbuInfo)}` : ''}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: '1px solid var(--t-border-subtle)',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className="t-btn t-btn-sm"
                    onClick={() => setProducerModal(prod)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-muted"
                    onClick={() =>
                      WhatsAppShareHelper.openWhatsApp(
                        WhatsAppShareHelper.formatProducerPaymentDataMessage(prod)
                      )
                    }
                  >
                    Ficha Bancaria WhatsApp
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-red"
                    style={{ marginLeft: 'auto' }}
                    onClick={async () => {
                      if (window.confirm(`¿Eliminar productor ${prod.name}?`)) {
                        await persistence.deleteProducer(prod.id);
                        onToast('Productor eliminado.');
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

        {producerModal !== null && (
          <ProducerFormModal
            initial={producerModal === 'NEW' ? null : producerModal}
            onClose={() => setProducerModal(null)}
            onSaved={() => onToast('Productor guardado con éxito.')}
          />
        )}
      </div>
    );
  }

  // --- SUB-SCREEN: AGENTS ---
  if (section === 'AGENTS') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="t-row-between">
          <button type="button" className="t-btn t-btn-muted t-btn-sm" onClick={() => setSection('MAIN')}>
            ← Volver a Ajustes
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--t-text-primary)' }}>
            Comisionistas Intermediarios ({store.agents.length})
          </span>
          <button
            type="button"
            className="t-btn t-btn-filled t-btn-sm"
            onClick={() => setAgentModal('NEW')}
          >
            + Nuevo Comisionista
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {store.agents.map((ag) => (
            <div key={ag.id} className="t-card">
              <div className="t-row-between">
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--t-text-primary)' }}>
                    {ag.name}
                  </div>
                  <div className="tabular-nums" style={{ fontSize: '0.78rem', color: 'var(--t-text-secondary)', marginTop: 3 }}>
                    Comisión: {Formatters.decimal(ag.percent, 1)}%
                    <span style={{ margin: '0 6px', color: 'var(--t-text-muted)' }}>•</span>
                    Tel: {ag.phone || '-'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-muted"
                    onClick={() => setAgentAccount(ag)}
                  >
                    Cuenta Corriente
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm"
                    onClick={() => setAgentModal(ag)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="t-btn t-btn-sm t-btn-red"
                    onClick={async () => {
                      if (window.confirm(`¿Eliminar comisionista ${ag.name}?`)) {
                        await persistence.deleteAgent(ag.id);
                        onToast('Comisionista eliminado.');
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

        {agentModal !== null && (
          <AgentFormModal
            initial={agentModal === 'NEW' ? null : agentModal}
            onClose={() => setAgentModal(null)}
            onSaved={() => onToast('Comisionista guardado con éxito.')}
          />
        )}

        {agentAccount && (
          <AgentCurrentAccountModal
            agent={agentAccount}
            store={store}
            onClose={() => setAgentAccount(null)}
            onToast={onToast}
          />
        )}
      </div>
    );
  }

  // --- SUB-SCREEN: FISCAL PARAMETERS ---
  if (section === 'FISCAL') {
    const handleSaveFiscal = async (e: React.FormEvent) => {
      e.preventDefault();
      await persistence.saveConfig(fiscalDraft);
      TerminalHaptics.success();
      onToast('Parámetros fiscales y tarifas actualizados.');
      setSection('MAIN');
    };

    return (
      <form onSubmit={handleSaveFiscal} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="t-row-between">
          <button type="button" className="t-btn t-btn-muted t-btn-sm" onClick={() => setSection('MAIN')}>
            ← Volver a Ajustes
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--t-text-primary)' }}>
            Tarifas e Impuestos Base
          </span>
          <button type="submit" className="t-btn t-btn-filled t-btn-sm">
            Guardar Cambios
          </button>
        </div>

        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
            Alícuotas Impositivas (ARCA / AFIP)
          </span>
          <div className="kpi-grid-2">
            <div className="t-field">
              <label className="t-label">IVA Hacienda (%)</label>
              <input
                type="number"
                step="0.1"
                className="t-input tabular-nums"
                value={fiscalDraft.ivaRate}
                onChange={(e) => setFiscalDraft({ ...fiscalDraft, ivaRate: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="t-field">
              <label className="t-label">Retención Ganancias (%)</label>
              <input
                type="number"
                step="0.1"
                className="t-input tabular-nums"
                value={fiscalDraft.gananciasRate}
                onChange={(e) =>
                  setFiscalDraft({ ...fiscalDraft, gananciasRate: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="t-field">
              <label className="t-label">Mínimo No Imponible Ganancias ($)</label>
              <input
                type="number"
                step="any"
                className="t-input tabular-nums"
                value={fiscalDraft.gananciasMinThreshold}
                onChange={(e) =>
                  setFiscalDraft({
                    ...fiscalDraft,
                    gananciasMinThreshold: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="t-field">
              <label className="t-label">Alícuota IIBB Predeterminada (%)</label>
              <input
                type="number"
                step="0.1"
                className="t-input tabular-nums"
                value={fiscalDraft.defaultPorcentajeIIBB}
                onChange={(e) =>
                  setFiscalDraft({
                    ...fiscalDraft,
                    defaultPorcentajeIIBB: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
            Tarifas de Fletes y Combustible
          </span>
          <div className="kpi-grid-2">
            <div className="t-field">
              <label className="t-label">Precio Gasoil ($/litro)</label>
              <input
                type="number"
                step="any"
                className="t-input tabular-nums"
                value={fiscalDraft.fuelPrice}
                onChange={(e) => setFiscalDraft({ ...fiscalDraft, fuelPrice: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="t-field">
              <label className="t-label">Flete Base ($/km)</label>
              <input
                type="number"
                step="any"
                className="t-input tabular-nums"
                value={fiscalDraft.defaultFreightPricePerKm}
                onChange={(e) =>
                  setFiscalDraft({
                    ...fiscalDraft,
                    defaultFreightPricePerKm: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="t-field">
              <label className="t-label">Chofer Jaula Simple ($/km)</label>
              <input
                type="number"
                step="any"
                className="t-input tabular-nums"
                value={fiscalDraft.defaultDriverPricePerKmSimple}
                onChange={(e) =>
                  setFiscalDraft({
                    ...fiscalDraft,
                    defaultDriverPricePerKmSimple: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="t-field">
              <label className="t-label">Chofer Jaula Doble ($/km)</label>
              <input
                type="number"
                step="any"
                className="t-input tabular-nums"
                value={fiscalDraft.defaultDriverPricePerKmDouble}
                onChange={(e) =>
                  setFiscalDraft({
                    ...fiscalDraft,
                    defaultDriverPricePerKmDouble: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="t-field">
              <label className="t-label">Solo Flete Simple ($/km)</label>
              <input
                type="number"
                step="any"
                className="t-input tabular-nums"
                value={fiscalDraft.freightPriceSimple}
                onChange={(e) =>
                  setFiscalDraft({
                    ...fiscalDraft,
                    freightPriceSimple: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="t-field">
              <label className="t-label">Arranque Simple (&lt;300km)</label>
              <input
                type="number"
                step="any"
                className="t-input tabular-nums"
                value={fiscalDraft.freightStartFeeSimple}
                onChange={(e) =>
                  setFiscalDraft({
                    ...fiscalDraft,
                    freightStartFeeSimple: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="t-field">
              <label className="t-label">Solo Flete Doble ($/km)</label>
              <input
                type="number"
                step="any"
                className="t-input tabular-nums"
                value={fiscalDraft.freightPriceDouble}
                onChange={(e) =>
                  setFiscalDraft({
                    ...fiscalDraft,
                    freightPriceDouble: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="t-field">
              <label className="t-label">Arranque Doble (&lt;300km)</label>
              <input
                type="number"
                step="any"
                className="t-input tabular-nums"
                value={fiscalDraft.freightStartFeeDouble}
                onChange={(e) =>
                  setFiscalDraft({
                    ...fiscalDraft,
                    freightStartFeeDouble: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="t-field">
              <label className="t-label">Simulador Flete Simple ($/km)</label>
              <input
                type="number"
                step="any"
                className="t-input tabular-nums"
                value={fiscalDraft.simulationFreightPriceSimple}
                onChange={(e) =>
                  setFiscalDraft({
                    ...fiscalDraft,
                    simulationFreightPriceSimple: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="t-field">
              <label className="t-label">Simulador Flete Doble ($/km)</label>
              <input
                type="number"
                step="any"
                className="t-input tabular-nums"
                value={fiscalDraft.simulationFreightPriceDouble}
                onChange={(e) =>
                  setFiscalDraft({
                    ...fiscalDraft,
                    simulationFreightPriceDouble: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </div>
      </form>
    );
  }

  // --- MAIN CONFIG MENU ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Portal Navigation Card */}
      <div className="t-card">
        <div className="t-row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--t-text-primary)' }}>
              Plataforma Central Frigorífico Pampa
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--t-text-muted)', marginTop: 2 }}>
              Sesión unificada y sincronizada bajo frigorificopampa.tech
            </div>
          </div>
          <a href="/" className="t-btn t-btn-sm t-btn-muted">
            Ir al Panel Principal
          </a>
        </div>
      </div>

      {/* Firebase Auth Account */}
      <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
          Cuenta de Usuario & Sincronización
        </span>
        {store.user ? (
          <>
            <div className="t-row-between">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--t-text-primary)' }}>
                  {store.user.displayName || store.user.email}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--t-text-muted)', marginTop: 2 }}>
                  {store.user.email}
                </div>
              </div>
              <span
                className="t-badge"
                style={{
                  background: 'var(--t-emerald-bg)',
                  color: 'var(--t-emerald-text)',
                  borderColor: 'var(--t-emerald-border)',
                }}
              >
                Sesión Activa ✓
              </span>
            </div>
            <button
              type="button"
              className="t-btn t-btn-red t-btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={async () => {
                await persistence.signOutUser();
                onToast('Sesión cerrada.');
              }}
            >
              Cerrar Sesión
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.8rem', color: 'var(--t-text-secondary)', lineHeight: 1.5 }}>
              Sin sesión activa. Iniciá sesión con tu cuenta de Google para habilitar la descarga y actualización de viajes de toda la empresa.
            </div>
            <button
              type="button"
              className="t-btn t-btn-filled"
              style={{ alignSelf: 'flex-start' }}
              onClick={async () => {
                try {
                  await persistence.signInWithGoogle();
                  onToast('Sesión iniciada con Google.');
                } catch (err) {
                  onToast(err instanceof Error ? err.message : 'Error al iniciar sesión');
                }
              }}
            >
              Iniciar Sesión con Google
            </button>
          </>
        )}
      </div>

      {/* Cloud Sync Status */}
      <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
          Sincronización Cloud Firestore
        </span>
        <div className="t-row-between" style={{ fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--t-text-secondary)' }}>
            Estado: <strong style={{ color: 'var(--t-text-primary)' }}>{store.syncStatus.toUpperCase()}</strong>
          </span>
          <span className="tabular-nums" style={{ color: 'var(--t-text-muted)' }}>
            {store.lastSyncTime ? `Último sync: ${Formatters.date(new Date(store.lastSyncTime))}` : 'Sin sincronización reciente'}
          </span>
        </div>

        <label className="t-row-between" style={{ fontSize: '0.8rem', color: 'var(--t-text-secondary)', cursor: 'pointer', padding: '4px 0' }}>
          <span>Modo Empresa Compartida (sincronizar viajes de toda la flota)</span>
          <input
            type="checkbox"
            checked={store.sharedCompanyMode}
            onChange={(e) => persistence.setSharedCompanyMode(e.target.checked)}
          />
        </label>

        {store.lastSyncError && (
          <div
            style={{
              fontSize: '0.76rem',
              color: 'var(--t-amber-text)',
              border: '1px solid var(--t-amber-border)',
              borderRadius: 8,
              padding: '8px 12px',
              background: 'var(--t-amber-bg)',
            }}
          >
            ⚠️ {store.lastSyncError}
          </div>
        )}

        <button
          type="button"
          className="t-btn t-btn-filled"
          style={{ alignSelf: 'flex-start' }}
          disabled={store.isSyncing}
          onClick={async () => {
            TerminalHaptics.click();
            const res = await persistence.syncAll({ forceFullSync: true, bypassCooldown: true });
            if (res.ok) {
              TerminalHaptics.success();
              onToast(
                `Sincronizado: ${res.travelsCount} viajes, ${res.trucksCount} camiones, ${res.producersCount} productores.`
              );
            } else {
              TerminalHaptics.error();
              onToast(res.error || 'Error al sincronizar con Firestore.');
            }
          }}
        >
          {store.isSyncing ? 'Sincronizando...' : 'Sincronizar con Firestore Ahora'}
        </button>
      </div>

      {/* Master Data Catalogs */}
      <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
          Catálogos Maestros y Parámetros
        </span>

        <button
          type="button"
          className="t-card t-card-clickable t-row-between"
          style={{ padding: '12px 14px' }}
          onClick={() => setSection('PRODUCERS')}
        >
          <div style={{ fontWeight: 500, fontSize: '0.86rem' }}>
            Productores de Ganado
          </div>
          <span className="t-badge tabular-nums" style={{ fontSize: '0.72rem' }}>
            {store.producers.length} registrados →
          </span>
        </button>

        <button
          type="button"
          className="t-card t-card-clickable t-row-between"
          style={{ padding: '12px 14px' }}
          onClick={() => setSection('AGENTS')}
        >
          <div style={{ fontWeight: 500, fontSize: '0.86rem' }}>
            Comisionistas Intermediarios
          </div>
          <span className="t-badge tabular-nums" style={{ fontSize: '0.72rem' }}>
            {store.agents.length} registrados →
          </span>
        </button>

        <button
          type="button"
          className="t-card t-card-clickable t-row-between"
          style={{ padding: '12px 14px' }}
          onClick={handleOpenFiscal}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 500, fontSize: '0.86rem' }}>
              Tarifas e Impuestos Base
            </div>
            <div className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--t-text-muted)', marginTop: 2 }}>
              IVA {Formatters.decimal(store.config.ivaRate, 1)}% • Ganancias{' '}
              {Formatters.decimal(store.config.gananciasRate, 1)}% • Gasoil{' '}
              {Formatters.currency(store.config.fuelPrice)}/l
            </div>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--t-text-secondary)', fontWeight: 500 }}>
            Configurar →
          </span>
        </button>
      </div>

      {/* Respaldo y Preferencias */}
      <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
          Respaldo y Base de Datos Local
        </span>

        <label className="t-row-between" style={{ fontSize: '0.8rem', color: 'var(--t-text-secondary)', cursor: 'pointer', padding: '2px 0' }}>
          <span>Respuesta sonora háptica en iPhone</span>
          <input
            type="checkbox"
            checked={soundHaptics}
            onChange={(e) => {
              setSoundHaptics(e.target.checked);
              localStorage.setItem('iosfletes_sound_haptics', e.target.checked ? 'true' : 'false');
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="t-btn t-btn-sm t-btn-muted" style={{ flex: 1 }} onClick={handleExportJson}>
            Exportar Respaldo (.json)
          </button>
          <label className="t-btn t-btn-sm t-btn-muted" style={{ flex: 1 }}>
            <span>Importar Respaldo (.json)</span>
            <input
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(e) => void handleImportJson(e.target.files?.[0])}
            />
          </label>
        </div>

        <button
          type="button"
          className="t-btn t-btn-red t-btn-sm"
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
          onClick={async () => {
            if (
              window.confirm(
                '¿Limpiar la base local IndexedDB para hacer una resincronización limpia desde Firestore?'
              )
            ) {
              await persistence.clearAllLocalData();
              onToast('Base local restablecida.');
            }
          }}
        >
          Limpiar Datos Locales
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// Sub-Modals: Producer, Agent, Agent Current Account
// =============================================================================

const ProducerFormModal: React.FC<{
  initial: Producer | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, onClose, onSaved }) => {
  const [form, setForm] = useState<Producer>(() => (initial ? { ...initial } : createProducer()));
  const cbuInfo = CBUHelper.decode(form.cbu);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistence.saveProducer(form);
    TerminalHaptics.success();
    onSaved();
    onClose();
  };

  return (
    <ModalSheet
      title={initial ? 'Editar Productor' : 'Nuevo Productor'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="t-btn t-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="producer-form" className="t-btn t-btn-filled">
            Guardar
          </button>
        </>
      }
    >
      <form id="producer-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="t-field">
          <label className="t-label">Nombre / Razón Social</label>
          <input
            type="text"
            className="t-input"
            required
            placeholder="Ej: Cabaña Los Robles"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="kpi-grid-2">
          <div className="t-field">
            <label className="t-label">
              <span>CUIT</span>
              {form.cuit && (
                <span style={{ color: CBUHelper.isValidCUIT(form.cuit) ? 'var(--t-emerald-text)' : 'var(--t-amber-text)' }}>
                  {CBUHelper.isValidCUIT(form.cuit) ? '11 dígitos OK' : 'Incompleto'}
                </span>
              )}
            </label>
            <input
              type="text"
              className="t-input tabular-nums"
              placeholder="30-70894561-4"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
            />
          </div>
          <div className="t-field">
            <label className="t-label">Teléfono / WhatsApp</label>
            <input
              type="text"
              className="t-input tabular-nums"
              placeholder="Ej: 381 456 7890"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>
        <div className="t-field">
          <label className="t-label">
            <span>CBU / CVU (22 dígitos)</span>
            {form.cbu && (
              <span style={{ color: cbuInfo.isValidLength ? 'var(--t-emerald-text)' : 'var(--t-amber-text)' }}>
                {cbuInfo.bankName}
              </span>
            )}
          </label>
          <input
            type="text"
            className="t-input tabular-nums"
            maxLength={26}
            placeholder="0000000000000000000000"
            value={form.cbu}
            onChange={(e) => setForm({ ...form, cbu: e.target.value })}
          />
          {cbuInfo.isValidLength && (
            <div className="tabular-nums" style={{ fontSize: '0.74rem', color: 'var(--t-text-muted)', marginTop: 2 }}>
              {cbuInfo.isCVU ? 'Billetera Virtual CVU' : `Sucursal: ${cbuInfo.branchCode}`} • Cuenta: {CBUHelper.accountDisplay(cbuInfo)}
            </div>
          )}
        </div>
      </form>
    </ModalSheet>
  );
};

const AgentFormModal: React.FC<{
  initial: Agent | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, onClose, onSaved }) => {
  const [form, setForm] = useState<Agent>(() => (initial ? { ...initial } : createAgent()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistence.saveAgent(form);
    TerminalHaptics.success();
    onSaved();
    onClose();
  };

  return (
    <ModalSheet
      title={initial ? 'Editar Comisionista' : 'Nuevo Comisionista'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="t-btn t-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="agent-form" className="t-btn t-btn-filled">
            Guardar
          </button>
        </>
      }
    >
      <form id="agent-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="t-field">
          <label className="t-label">Nombre del Comisionista</label>
          <input
            type="text"
            className="t-input"
            required
            placeholder="Ej: Consignataria Pampeana"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="kpi-grid-2">
          <div className="t-field">
            <label className="t-label">Porcentaje Comisión (%)</label>
            <input
              type="number"
              step="0.1"
              className="t-input tabular-nums"
              placeholder="Ej: 1.5"
              value={form.percent}
              onChange={(e) => setForm({ ...form, percent: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="t-field">
            <label className="t-label">Teléfono de Contacto</label>
            <input
              type="text"
              className="t-input tabular-nums"
              placeholder="Ej: 381 456 7890"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>
      </form>
    </ModalSheet>
  );
};

const AgentCurrentAccountModal: React.FC<{
  agent: Agent;
  store: StoreSnapshot;
  onClose: () => void;
  onToast: (msg: string) => void;
}> = ({ agent, store, onClose, onToast }) => {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(() => Formatters.isoDate(new Date()));

  const transactions = useMemo(() => {
    const items: Array<{
      id: number;
      date: string;
      title: string;
      subtitle: string;
      amount: number;
      isCharge: boolean;
      paymentId?: number;
    }> = [];

    for (const tr of store.travels) {
      if (tr.buy?.agent?.id !== agent.id) continue;
      const comm = getBuyAgentCommissionAmount(tr.buy);
      const val = comm > 0 ? comm : getFleteCost(tr, store.config);
      items.push({
        id: tr.id,
        date: tr.date,
        title: getTravelDisplayTitle(tr),
        subtitle: `Comisión ${Formatters.decimal(agent.percent, 1)}%`,
        amount: val,
        isCharge: true,
      });
    }

    for (const pay of store.agentPayments) {
      if (pay.agentId !== agent.id) continue;
      items.push({
        id: pay.id,
        date: pay.date,
        title: pay.description || 'Abono / Pago',
        subtitle: 'Pago registrado',
        amount: pay.amount,
        isCharge: false,
        paymentId: pay.id,
      });
    }

    return items.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [agent, store.travels, store.agentPayments, store.config]);

  const totalCharges = transactions.filter((t) => t.isCharge).reduce((a, t) => a + t.amount, 0);
  const totalPayments = transactions.filter((t) => !t.isCharge).reduce((a, t) => a + t.amount, 0);
  const balance = totalCharges - totalPayments;

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) return;
    const pay: AgentPayment = {
      id: generateNumericId(),
      agentId: agent.id,
      amount: num,
      date,
      description: desc.trim() || 'Pago / Transferencia',
      updatedAt: Date.now(),
    };
    await persistence.saveAgentPayment(pay);
    setAmount('');
    setDesc('');
    TerminalHaptics.success();
    onToast('Pago registrado en cuenta corriente.');
  };

  return (
    <ModalSheet title={`Cuenta Corriente: ${agent.name}`} onClose={onClose}>
      <div className="kpi-grid-3">
        <MetricCard title="Comisiones Acumuladas" value={Formatters.currency(totalCharges)} />
        <MetricCard title="Pagos Registrados" value={Formatters.currency(totalPayments)} />
        <MetricCard
          title="Saldo Pendiente"
          value={Formatters.currency(balance)}
          tint={balance > 0 ? 'var(--t-amber-text)' : 'var(--t-emerald-text)'}
        />
      </div>

      <form onSubmit={handleAddPayment} className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--t-text-primary)' }}>
          Registrar Nuevo Pago / Abono
        </span>
        <div className="kpi-grid-2">
          <input
            type="number"
            step="any"
            className="t-input tabular-nums"
            placeholder="Importe $"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input
            type="date"
            className="t-input tabular-nums"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="t-input"
            placeholder="Concepto (Transferencia bancaria, cheque, etc.)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <button type="submit" className="t-btn t-btn-filled" style={{ whiteSpace: 'nowrap' }}>
            + Registrar
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {transactions.map((tx) => (
          <div key={`${tx.isCharge ? 'c' : 'p'}_${tx.id}`} className="t-card t-row-between">
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--t-text-primary)' }}>
                {tx.title}
              </div>
              <div className="tabular-nums" style={{ fontSize: '0.74rem', color: 'var(--t-text-muted)', marginTop: 2 }}>
                {Formatters.displayDate(tx.date)} • {tx.subtitle}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <strong
                className="tabular-nums"
                style={{
                  color: tx.isCharge ? 'var(--t-text-primary)' : 'var(--t-emerald-text)',
                  fontSize: '0.9rem',
                }}
              >
                {tx.isCharge ? '+' : '-'}
                {Formatters.currency(tx.amount)}
              </strong>
              {tx.paymentId && (
                <button
                  type="button"
                  className="t-btn t-btn-sm t-btn-red"
                  style={{ minHeight: 28, padding: '2px 8px' }}
                  onClick={() => void persistence.deleteAgentPayment(tx.paymentId!)}
                  aria-label="Eliminar pago"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ModalSheet>
  );
};
