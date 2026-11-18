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
  travels: '/viajes$',
  fleet: '/flota$',
  reports: '/reportes$',
  config: '/ajustes$',
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

  const syncColor =
    store.syncStatus === 'synced'
      ? 'var(--t-green)'
      : store.syncStatus === 'pending'
      ? 'var(--t-amber)'
      : store.syncStatus === 'offline'
      ? 'var(--t-text-secondary)'
      : 'var(--t-red)';

  const syncLabel =
    store.isSyncing
      ? 'SYNC...'
      : store.syncStatus === 'synced'
      ? 'SINCRONIZADO'
      : store.syncStatus === 'pending'
      ? 'PENDIENTE'
      : store.syncStatus === 'offline'
      ? 'OFFLINE'
      : 'ERROR';

  return (
    <div className="app-shell">
      {/* Top Terminal Header */}
      <header className="terminal-header">
        <div className="terminal-header-title">
          <img src="/fletes/piola-emblem.png" alt="IosFletes" className="terminal-logo-img" />
          <h1>{TAB_TITLES[activeTab]}</h1>
        </div>

        <div className="terminal-header-actions">
          <button
            type="button"
            className="t-badge"
            style={{ color: syncColor, cursor: 'pointer', background: 'var(--t-surface)' }}
            title="Tocar para sincronizar con Firestore"
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
            <span className="sync-dot" style={{ background: syncColor }} />
            <span>[{syncLabel}]</span>
          </button>

          <a
            href="/"
            className="t-btn t-btn-muted t-btn-sm"
            title="Volver al Panel Frigorífico Pampa"
            onClick={() => TerminalHaptics.click()}
          >
            🏢 Panel
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="terminal-main">
        {!store.authLoading && !store.user && (
          <div
            className="t-card t-row-between"
            style={{
              borderColor: 'var(--t-cyan)',
              background: 'rgba(0, 229, 255, 0.06)',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div className="mono" style={{ fontSize: '0.75rem' }}>
              <strong style={{ color: 'var(--t-cyan)' }}>[MODO LOCAL]</strong>{' '}
              <span style={{ color: 'var(--t-text-secondary)' }}>
                Iniciá sesión con Google para sincronizar con Firestore.
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
              Google Sign-In
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

      {/* Bottom TabBar (4 Tabs matching IosFletes MainTabView) */}
      <nav className="terminal-tabbar" aria-label="Navegación principal">
        <div className="terminal-tabbar-inner">
          {(
            [
              ['travels', '🚛', '[VIAJES]'],
              ['fleet', '⛽', '[FLOTA]'],
              ['reports', '📊', '[REPORTES]'],
              ['config', '⚙️', '[AJUSTES]'],
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
