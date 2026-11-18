import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { persistence } from './services/persistence';
import { TerminalHaptics } from './utils/formatters';
import { ToastBanner } from './components/TerminalUI';
import { TravelsView } from './views/TravelsView';
import { FleetView } from './views/FleetView';
import { ReportsView } from './views/ReportsView';
import { ConfigView } from './views/ConfigView';

type AppTab = 'travels' | 'fleet' | 'reports' | 'config';

const TAB_TITLES: Record<AppTab, string> = {
  travels: 'Viajes & Fletes',
  fleet: 'Flota & Choferes',
  reports: 'Reportes & Liquidación',
  config: 'Ajustes de Operación',
};

export const App: React.FC = () => {
  const store = useSyncExternalStore(persistence.subscribe, persistence.getSnapshot);
  const [activeTab, setActiveTab] = useState<AppTab>('travels');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 2800);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  const syncConfig =
    store.syncStatus === 'synced'
      ? {
          bg: 'var(--t-emerald-bg)',
          color: 'var(--t-emerald-text)',
          border: 'var(--t-emerald-border)',
          dot: '#10b981',
          label: 'Sincronizado',
        }
      : store.syncStatus === 'pending'
      ? {
          bg: 'var(--t-amber-bg)',
          color: 'var(--t-amber-text)',
          border: 'var(--t-amber-border)',
          dot: '#f59e0b',
          label: store.isSyncing ? 'Sincronizando...' : 'Pendiente',
        }
      : store.syncStatus === 'offline'
      ? {
          bg: 'rgba(255, 255, 255, 0.04)',
          color: 'var(--t-text-secondary)',
          border: 'var(--t-border)',
          dot: '#71717a',
          label: 'Offline',
        }
      : {
          bg: 'var(--t-rose-bg)',
          color: 'var(--t-rose-text)',
          border: 'var(--t-rose-border)',
          dot: '#f43f5e',
          label: 'Error Sync',
        };

  return (
    <div className="app-shell">
      {/* Top Header */}
      <header className="terminal-header">
        <div className="terminal-header-title">
          <img src="/fletes/piola-emblem.png" alt="IosFletes" className="terminal-logo-img" />
          <h1>{TAB_TITLES[activeTab]}</h1>
        </div>

        <div className="terminal-header-actions">
          <button
            type="button"
            className="t-badge tabular-nums"
            style={{
              background: syncConfig.bg,
              color: syncConfig.color,
              borderColor: syncConfig.border,
              cursor: 'pointer',
              padding: '4px 10px',
            }}
            title="Tocar para forzar sincronización con Firestore"
            onClick={() => {
              TerminalHaptics.click();
              void persistence.syncAll({ forceFullSync: true, bypassCooldown: true }).then((res) => {
                if (res.ok) {
                  TerminalHaptics.success();
                  showToast(
                    `Sincronizado: ${res.travelsCount} viajes, ${res.trucksCount} camiones.`
                  );
                } else {
                  TerminalHaptics.warning();
                  if (!store.user) setActiveTab('config');
                  showToast(res.error || 'Error al sincronizar con Firestore.');
                }
              });
            }}
          >
            <span className="sync-dot" style={{ background: syncConfig.dot }} />
            <span>{syncConfig.label}</span>
          </button>

          <a
            href="/"
            className="t-btn t-btn-muted t-btn-sm"
            title="Volver al Panel Principal Frigorífico Pampa"
            onClick={() => TerminalHaptics.click()}
          >
            <span>Volver al Panel</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="terminal-main">
        {!store.authLoading && !store.user && (
          <div
            className="t-card t-row-between"
            style={{
              borderColor: 'rgba(99, 102, 241, 0.25)',
              background: 'rgba(99, 102, 241, 0.06)',
              flexWrap: 'wrap',
              gap: 12,
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className="t-badge"
                style={{
                  background: 'var(--t-indigo-bg)',
                  color: 'var(--t-indigo-text)',
                  borderColor: 'var(--t-indigo-border)',
                }}
              >
                Modo Local
              </span>
              <span style={{ color: 'var(--t-text-secondary)' }}>
                Iniciá sesión para descargar y sincronizar viajes en tiempo real.
              </span>
            </div>
            <button
              type="button"
              className="t-btn t-btn-filled t-btn-sm"
              onClick={async () => {
                TerminalHaptics.click();
                try {
                  await persistence.signInWithGoogle();
                  TerminalHaptics.success();
                  showToast('Sesión iniciada con Google.');
                } catch (err) {
                  TerminalHaptics.error();
                  showToast(err instanceof Error ? err.message : 'Error de autenticación');
                }
              }}
            >
              Iniciar Sesión Google
            </button>
          </div>
        )}

        {activeTab === 'travels' && (
          <TravelsView store={store} onNavigateTab={setActiveTab} onToast={showToast} />
        )}
        {activeTab === 'fleet' && <FleetView store={store} onToast={showToast} />}
        {activeTab === 'reports' && <ReportsView store={store} onToast={showToast} />}
        {activeTab === 'config' && <ConfigView store={store} onToast={showToast} />}
      </main>

      {/* Modern Minimal Bottom TabBar */}
      <nav className="terminal-tabbar" aria-label="Navegación principal">
        <div className="terminal-tabbar-inner">
          {(
            [
              ['travels', '🚛', 'Viajes'],
              ['fleet', '⛽', 'Flota'],
              ['reports', '📊', 'Reportes'],
              ['config', '⚙️', 'Ajustes'],
            ] as Array<[AppTab, string, string]>
          ).map(([tabId, icon, label]) => (
            <button
              key={tabId}
              type="button"
              className={`tab-btn ${activeTab === tabId ? 'active' : ''}`}
              onClick={() => {
                TerminalHaptics.selection();
                setActiveTab(tabId);
              }}
            >
              <span className="tab-icon">{icon}</span>
              <span className="tab-label">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <ToastBanner message={toastMsg} />
    </div>
  );
};
