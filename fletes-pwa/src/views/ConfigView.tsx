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
    onToast('Respaldo JSON exportado.');
  };

  const handleImportJson = async (file?: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const res = await persistence.importBackupJson(text);
      TerminalHaptics.success();
      onToast(`Backup importado (${res.travelsCount} viajes).`);
    } catch {
      TerminalHaptics.error();
      onToast('Archivo JSON inválido.');
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="t-row-between">
          <button type="button" className="t-btn t-btn-muted t-btn-sm" onClick={() => setSection('MAIN')}>
            ← Ajustes
          </button>
          <span className="mono" style={{ fontWeight: 800, color: 'var(--t-cyan)' }}>
            PRODUCTORES ({store.producers.length})
          </span>
          <button
            type="button"
            className="t-btn t-btn-filled t-btn-sm"
            onClick={() => setProducerModal('NEW')}
          >
            + Nuevo
          </button>
        </div>

        <div className="t-search-wrap">
          <span className="t-search-prefix">&gt;</span>
          <input
            type="text"
            className="t-input t-search-input"
            placeholder="Buscar por nombre, CUIT o CBU..."
            value={producerSearch}
            onChange={(e) => setProducerSearch(e.target.value)}
          />
        </div>

        {filteredProducers.map((prod) => {
          const cbuInfo = CBUHelper.decode(prod.cbu);
          return (
            <div key={prod.id} className="t-card">
              <div className="t-row-between">
                <strong className="mono" style={{ fontSize: '0.9rem', color: 'var(--t-cyan)' }}>
                  {prod.name}
                </strong>
                {cbuInfo.isValidLength && (
                  <span className="t-badge" style={{ color: 'var(--t-green)' }}>
                    {cbuInfo.bankName}
                  </span>
                )}
              </div>
              <div className="mono" style={{ fontSize: '0.73rem', color: 'var(--t-text-secondary)', marginTop: 4 }}>
                CUIT: {prod.cuit ? Formatters.cuit(prod.cuit) : 'Sin CUIT'} • Tel: {prod.phone || '-'}
              </div>
              {prod.cbu && (
                <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--t-text-muted)', marginTop: 2 }}>
                  CBU: {CBUHelper.formattedCBU(prod.cbu)}
                  {cbuInfo.accountNumber ? ` • Cta: ${CBUHelper.accountDisplay(cbuInfo)}` : ''}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="t-btn t-btn-amber t-btn-sm"
                  onClick={() => setProducerModal(prod)}
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  className="t-btn t-btn-green t-btn-sm"
                  onClick={() =>
                    WhatsAppShareHelper.openWhatsApp(
                      WhatsAppShareHelper.formatProducerPaymentDataMessage(prod)
                    )
                  }
                >
                  📲 Ficha Bancaria
                </button>
                <button
                  type="button"
                  className="t-btn t-btn-red t-btn-sm"
                  onClick={async () => {
                    if (window.confirm(`¿Eliminar productor ${prod.name}?`)) {
                      await persistence.deleteProducer(prod.id);
                      onToast('Productor eliminado.');
                    }
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}

        {producerModal !== null && (
          <ProducerFormModal
            initial={producerModal === 'NEW' ? null : producerModal}
            onClose={() => setProducerModal(null)}
            onSaved={() => onToast('Productor guardado.')}
          />
        )}
      </div>
    );
  }

  // --- SUB-SCREEN: AGENTS ---
  if (section === 'AGENTS') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="t-row-between">
          <button type="button" className="t-btn t-btn-muted t-btn-sm" onClick={() => setSection('MAIN')}>
            ← Ajustes
          </button>
          <span className="mono" style={{ fontWeight: 800, color: 'var(--t-cyan)' }}>
            COMISIONISTAS ({store.agents.length})
          </span>
          <button
            type="button"
            className="t-btn t-btn-filled t-btn-sm"
            onClick={() => setAgentModal('NEW')}
          >
            + Nuevo
          </button>
        </div>

        {store.agents.map((ag) => (
          <div key={ag.id} className="t-card">
            <div className="t-row-between">
              <div>
                <strong className="mono" style={{ fontSize: '0.9rem', color: 'var(--t-purple)' }}>
                  🤝 {ag.name}
                </strong>
                <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--t-text-secondary)', marginTop: 2 }}>
                  Comisión: {Formatters.decimal(ag.percent, 1)}% • Tel: {ag.phone || '-'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="t-btn t-btn-sm"
                  onClick={() => setAgentAccount(ag)}
                >
                  📒 Cta Cte
                </button>
                <button
                  type="button"
                  className="t-btn t-btn-amber t-btn-sm"
                  onClick={() => setAgentModal(ag)}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="t-btn t-btn-red t-btn-sm"
                  onClick={async () => {
                    if (window.confirm(`¿Eliminar comisionista ${ag.name}?`)) {
                      await persistence.deleteAgent(ag.id);
                      onToast('Comisionista eliminado.');
                    }
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {agentModal !== null && (
          <AgentFormModal
            initial={agentModal === 'NEW' ? null : agentModal}
            onClose={() => setAgentModal(null)}
            onSaved={() => onToast('Comisionista guardado.')}
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
      onToast('Parámetros fiscales actualizados.');
      setSection('MAIN');
    };

    return (
      <form onSubmit={handleSaveFiscal} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="t-row-between">
          <button type="button" className="t-btn t-btn-muted t-btn-sm" onClick={() => setSection('MAIN')}>
            ← Ajustes
          </button>
          <span className="mono" style={{ fontWeight: 800, color: 'var(--t-cyan)' }}>
            TARIFAS E IMPUESTOS BASE
          </span>
          <button type="submit" className="t-btn t-btn-green t-btn-filled t-btn-sm">
            Guardar
          </button>
        </div>

        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="t-section-label">// IMPUESTOS AFIP / ARBA</div>
          <div className="kpi-grid-2">
            <div className="t-field">
              <label className="t-label">IVA (%)</label>
              <input
                type="number"
                step="0.1"
                className="t-input"
                value={fiscalDraft.ivaRate}
                onChange={(e) => setFiscalDraft({ ...fiscalDraft, ivaRate: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="t-field">
              <label className="t-label">Ganancias (%)</label>
              <input
                type="number"
                step="0.1"
                className="t-input"
                value={fiscalDraft.gananciasRate}
                onChange={(e) =>
                  setFiscalDraft({ ...fiscalDraft, gananciasRate: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="t-field">
              <label className="t-label">Mínimo No Imponible ($)</label>
              <input
                type="number"
                step="any"
                className="t-input"
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
              <label className="t-label">IIBB Default (%)</label>
              <input
                type="number"
                step="0.1"
                className="t-input"
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

        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="t-section-label">// TARIFAS LOGÍSTICAS Y GASOIL</div>
          <div className="kpi-grid-2">
            <div className="t-field">
              <label className="t-label">Gasoil ($/litro)</label>
              <input
                type="number"
                step="any"
                className="t-input"
                value={fiscalDraft.fuelPrice}
                onChange={(e) => setFiscalDraft({ ...fiscalDraft, fuelPrice: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="t-field">
              <label className="t-label">Flete Base ($/km)</label>
              <input
                type="number"
                step="any"
                className="t-input"
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
                className="t-input"
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
                className="t-input"
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
                className="t-input"
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
                className="t-input"
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
                className="t-input"
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
                className="t-input"
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
                className="t-input"
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
                className="t-input"
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
      <div className="t-card" style={{ borderColor: 'rgba(0, 229, 255, 0.35)' }}>
        <div className="t-section-label">// ECOSISTEMA FRIGORÍFICO PAMPA</div>
        <div className="t-row-between" style={{ gap: 8, flexWrap: 'wrap' }}>
          <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--t-text-secondary)' }}>
            Misma sesión y datos compartidos bajo frigorificopampa.tech
          </div>
          <a href="/" className="t-btn t-btn-sm">
            🏢 Ir a Panel Frigorífico Pampa (/)
          </a>
        </div>
      </div>

      {/* Firebase Auth Account */}
      <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="t-section-label">// CUENTA DE USUARIO & AUTENTICACIÓN</div>
        {store.user ? (
          <>
            <div className="t-row-between">
              <div>
                <div className="mono" style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                  &gt; {store.user.displayName || store.user.email}
                </div>
                <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--t-text-secondary)' }}>
                  // {store.user.email}
                </div>
              </div>
              <span className="t-badge" style={{ color: 'var(--t-green)' }}>
                [ACTIVO]
              </span>
            </div>
            <button
              type="button"
              className="t-btn t-btn-red t-btn-sm"
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
            <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--t-text-secondary)' }}>
              [SIN SESIÓN ACTIVA] — Iniciá sesión con Google para sincronizar con Firestore.
            </div>
            <button
              type="button"
              className="t-btn t-btn-filled"
              onClick={async () => {
                try {
                  await persistence.signInWithGoogle();
                  onToast('Sesión iniciada.');
                } catch (err) {
                  onToast(err instanceof Error ? err.message : 'Error al iniciar sesión');
                }
              }}
            >
              INICIAR SESIÓN CON GOOGLE
            </button>
          </>
        )}
      </div>

      {/* Cloud Sync */}
      <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="t-section-label">// SINCRONIZACIÓN EN LA NUBE (FIRESTORE)</div>
        <div className="t-row-between mono" style={{ fontSize: '0.78rem' }}>
          <span>Estado: {store.syncStatus.toUpperCase()}</span>
          <span style={{ color: 'var(--t-text-secondary)' }}>
            {store.lastSyncTime ? Formatters.date(new Date(store.lastSyncTime)) : 'Sin sync reciente'}
          </span>
        </div>

        <label className="t-row-between mono" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>
          <span>Modo Empresa Compartida (sincronizar todos los viajes)</span>
          <input
            type="checkbox"
            checked={store.sharedCompanyMode}
            onChange={(e) => persistence.setSharedCompanyMode(e.target.checked)}
          />
        </label>

        {store.lastSyncError && (
          <div
            className="mono"
            style={{
              fontSize: '0.72rem',
              color: 'var(--t-amber)',
              border: '1px solid var(--t-amber)',
              borderRadius: 4,
              padding: '6px 8px',
              background: 'rgba(255, 179, 0, 0.08)',
            }}
          >
            ⚠️ {store.lastSyncError}
          </div>
        )}

        <button
          type="button"
          className="t-btn"
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
          {store.isSyncing ? 'Sincronizando...' : '🔄 Sincronizar con Firestore Ahora'}
        </button>
      </div>

      {/* Master Data Catalogs */}
      <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="t-section-label">// DATOS MAESTROS Y PARÁMETROS</div>

        <button
          type="button"
          className="t-card-elevated t-card-clickable t-row-between"
          onClick={() => setSection('PRODUCERS')}
        >
          <span className="mono" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
            🏛️ Productores de Ganado
          </span>
          <span className="t-badge" style={{ color: 'var(--t-cyan)' }}>
            [{store.producers.length}] →
          </span>
        </button>

        <button
          type="button"
          className="t-card-elevated t-card-clickable t-row-between"
          onClick={() => setSection('AGENTS')}
        >
          <span className="mono" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
            🤝 Comisionistas Intermediarios
          </span>
          <span className="t-badge" style={{ color: 'var(--t-cyan)' }}>
            [{store.agents.length}] →
          </span>
        </button>

        <button
          type="button"
          className="t-card-elevated t-card-clickable t-row-between"
          onClick={handleOpenFiscal}
        >
          <div style={{ textAlign: 'left' }}>
            <div className="mono" style={{ fontWeight: 700, fontSize: '0.84rem' }}>
              🎛️ Tarifas e Impuestos Base
            </div>
            <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--t-text-secondary)', marginTop: 2 }}>
              IVA {Formatters.decimal(store.config.ivaRate, 1)}% • Ganancias{' '}
              {Formatters.decimal(store.config.gananciasRate, 1)}% • Gasoil{' '}
              {Formatters.currency(store.config.fuelPrice)}/l
            </div>
          </div>
          <span className="mono" style={{ color: 'var(--t-cyan)', fontSize: '0.75rem', fontWeight: 800 }}>
            EDITAR →
          </span>
        </button>
      </div>

      {/* UX & Local Backup */}
      <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="t-section-label">// RESPALDO Y PREFERENCIAS PWA</div>

        <label className="t-row-between mono" style={{ fontSize: '0.76rem', cursor: 'pointer' }}>
          <span>Clic mecánico sonoro (Web Audio en iPhone)</span>
          <input
            type="checkbox"
            checked={soundHaptics}
            onChange={(e) => {
              setSoundHaptics(e.target.checked);
              localStorage.setItem('iosfletes_sound_haptics', e.target.checked ? 'true' : 'false');
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="t-btn t-btn-sm" style={{ flex: 1 }} onClick={handleExportJson}>
            💾 Exportar Backup .json
          </button>
          <label className="t-btn t-btn-sm" style={{ flex: 1 }}>
            <span>📂 Importar .json</span>
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
          onClick={async () => {
            if (
              window.confirm(
                '¿Limpiar la base local IndexedDB para hacer una resincronización limpia desde Firestore?'
              )
            ) {
              await persistence.clearAllLocalData();
              onToast('Base local limpiada.');
            }
          }}
        >
          🗑️ Limpiar Datos Locales
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
      title={initial ? '// EDITAR PRODUCTOR' : '// NUEVO PRODUCTOR'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="t-btn t-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="producer-form" className="t-btn t-btn-green t-btn-filled">
            Guardar
          </button>
        </>
      }
    >
      <form id="producer-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="t-field">
          <label className="t-label">Nombre / Razón Social</label>
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
            <label className="t-label">
              <span>CUIT</span>
              {form.cuit && (
                <span style={{ color: CBUHelper.isValidCUIT(form.cuit) ? 'var(--t-green)' : 'var(--t-amber)' }}>
                  {CBUHelper.isValidCUIT(form.cuit) ? '11 dig OK' : 'Incompleto'}
                </span>
              )}
            </label>
            <input
              type="text"
              className="t-input"
              placeholder="20-12345678-9"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
            />
          </div>
          <div className="t-field">
            <label className="t-label">Teléfono / WhatsApp</label>
            <input
              type="text"
              className="t-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>
        <div className="t-field">
          <label className="t-label">
            <span>CBU / CVU (22 dígitos)</span>
            {form.cbu && (
              <span style={{ color: cbuInfo.isValidLength ? 'var(--t-green)' : 'var(--t-amber)' }}>
                {cbuInfo.bankName}
              </span>
            )}
          </label>
          <input
            type="text"
            className="t-input"
            maxLength={26}
            value={form.cbu}
            onChange={(e) => setForm({ ...form, cbu: e.target.value })}
          />
          {cbuInfo.isValidLength && (
            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--t-cyan)' }}>
              {cbuInfo.isCVU ? 'Billetera CVU' : `Sucursal: ${cbuInfo.branchCode}`} • Cuenta:{' '}
              {CBUHelper.accountDisplay(cbuInfo)}
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
      title={initial ? '// EDITAR COMISIONISTA' : '// NUEVO COMISIONISTA'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="t-btn t-btn-muted" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="agent-form" className="t-btn t-btn-green t-btn-filled">
            Guardar
          </button>
        </>
      }
    >
      <form id="agent-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="t-field">
          <label className="t-label">Nombre</label>
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
            <label className="t-label">Comisión (%)</label>
            <input
              type="number"
              step="0.1"
              className="t-input"
              value={form.percent}
              onChange={(e) => setForm({ ...form, percent: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="t-field">
            <label className="t-label">Teléfono</label>
            <input
              type="text"
              className="t-input"
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
    <ModalSheet title={`// CTA CTE: ${agent.name.toUpperCase()}`} onClose={onClose}>
      <div className="kpi-grid-3">
        <MetricCard title="Comisiones" value={Formatters.currency(totalCharges)} tint="var(--t-amber)" />
        <MetricCard title="Pagos" value={Formatters.currency(totalPayments)} tint="var(--t-green)" />
        <MetricCard
          title="Saldo Pendiente"
          value={Formatters.currency(balance)}
          tint={balance > 0 ? 'var(--t-red)' : 'var(--t-green)'}
        />
      </div>

      <form onSubmit={handleAddPayment} className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="t-section-label">// REGISTRAR PAGO / ABONO</div>
        <div className="kpi-grid-2">
          <input
            type="number"
            step="any"
            className="t-input"
            placeholder="Importe $"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input type="date" className="t-input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="t-input"
            placeholder="Concepto (Transferencia, Cheque...)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <button type="submit" className="t-btn t-btn-green t-btn-filled">
            + Pago
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {transactions.map((tx) => (
          <div key={`${tx.isCharge ? 'c' : 'p'}_${tx.id}`} className="t-card-elevated t-row-between">
            <div>
              <div className="mono" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                {tx.title}
              </div>
              <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--t-text-secondary)' }}>
                {Formatters.displayDate(tx.date)} • {tx.subtitle}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong
                className="mono"
                style={{ color: tx.isCharge ? 'var(--t-amber)' : 'var(--t-green)', fontSize: '0.84rem' }}
              >
                {tx.isCharge ? '+' : '-'}
                {Formatters.currency(tx.amount)}
              </strong>
              {tx.paymentId && (
                <button
                  type="button"
                  className="t-btn t-btn-red t-btn-sm"
                  onClick={() => void persistence.deleteAgentPayment(tx.paymentId!)}
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
