import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DocumentExpirationAlert,
  TravelStatus,
  getTravelStatusDisplayName,
} from '../domain/models';
import { OdometerCandidate, OdometerOCRScanner } from '../domain/engine';
import { Formatters, TerminalHaptics } from '../utils/formatters';

// =============================================================================
// Global Modal Lock for Mobile & Desktop (Prevents background body scroll jitter)
// =============================================================================

let activeModalCount = 0;

function acquireModalLock() {
  activeModalCount++;
  if (activeModalCount === 1 && typeof document !== 'undefined') {
    document.body.classList.add('t-modal-open');
  }
}

function releaseModalLock() {
  activeModalCount = Math.max(0, activeModalCount - 1);
  if (activeModalCount === 0 && typeof document !== 'undefined') {
    document.body.classList.remove('t-modal-open');
  }
}

// =============================================================================
// MetricCard
// =============================================================================

export const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  tint?: string;
}> = ({ title, value, subtitle, tint = 'var(--t-text-primary)' }) => (
  <div className="metric-card">
    <span className="metric-card-label">{title}</span>
    <span className="metric-card-value tabular-nums" style={{ color: tint }} title={value}>
      {value}
    </span>
    {subtitle && (
      <span
        className="tabular-nums"
        style={{
          fontSize: '0.68rem',
          color: 'var(--t-text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {subtitle}
      </span>
    )}
  </div>
);

// =============================================================================
// StatusBadge
// =============================================================================

export const StatusBadge: React.FC<{ status: TravelStatus }> = ({ status }) => {
  const config =
    status === 'ACTIVE'
      ? {
          bg: 'var(--t-emerald-bg)',
          color: 'var(--t-emerald-text)',
          border: 'var(--t-emerald-border)',
          label: 'Activo',
        }
      : status === 'FLETE'
      ? {
          bg: 'var(--t-indigo-bg)',
          color: 'var(--t-indigo-text)',
          border: 'var(--t-indigo-border)',
          label: 'Solo Flete',
        }
      : {
          bg: 'var(--t-amber-bg)',
          color: 'var(--t-amber-text)',
          border: 'var(--t-amber-border)',
          label: 'Borrador',
        };

  return (
    <span
      className="t-badge tabular-nums"
      style={{
        background: config.bg,
        color: config.color,
        borderColor: config.border,
      }}
    >
      {config.label}
    </span>
  );
};

// =============================================================================
// ModalSheet (Portal-based, Mobile-safe, Scroll-locked)
// =============================================================================

export const ModalSheet: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  zIndex?: number;
}> = ({ title, onClose, children, footer, zIndex = 100 }) => {
  useEffect(() => {
    acquireModalLock();
    return () => releaseModalLock();
  }, []);

  const content = (
    <div
      className="t-modal-backdrop"
      style={{ zIndex }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          TerminalHaptics.click();
          onClose();
        }
      }}
    >
      <div className="t-modal-sheet" role="dialog" aria-modal="true">
        <div className="t-modal-header">
          <h2 className="t-modal-title">{title}</h2>
          <button
            type="button"
            className="t-btn t-btn-muted t-btn-sm"
            style={{ minHeight: 28, padding: '2px 8px', borderRadius: 6 }}
            onClick={() => {
              TerminalHaptics.click();
              onClose();
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="t-modal-body">{children}</div>
        {footer && <div className="t-modal-footer">{footer}</div>}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
};

// =============================================================================
// SearchablePicker (Portal-rendered, Keyboard-friendly, Touch-optimized)
// =============================================================================

export function SearchablePicker<T extends { id: number }>({
  label,
  items,
  selectedId,
  onSelect,
  getTitle,
  getSubtitle,
  getSearchTerms,
  placeholder = 'Seleccionar...',
  allowClear = false,
  emptyLabel = 'Ninguno / Todos',
}: {
  label: string;
  items: T[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => string;
  getSearchTerms: (item: T) => string[];
  placeholder?: string;
  allowClear?: boolean;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = useMemo(
    () => items.find((x) => x.id === selectedId) || null,
    [items, selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      getSearchTerms(item).some((term) => (term || '').toLowerCase().includes(q))
    );
  }, [items, search, getSearchTerms]);

  // Acquire modal lock while picker is open
  useEffect(() => {
    if (open) {
      acquireModalLock();
      return () => releaseModalLock();
    }
  }, [open]);

  // Determine if running on a touch-first mobile device
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  const handleOpen = () => {
    TerminalHaptics.click();
    setSearch('');
    setOpen(true);
    // On non-touch desktop screens, focus search input automatically
    if (!isTouchDevice) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  };

  const handleSelect = (id: number | null) => {
    TerminalHaptics.selection();
    // Dismiss mobile keyboard if open
    searchInputRef.current?.blur();
    onSelect(id);
    setOpen(false);
  };

  const handleClose = () => {
    TerminalHaptics.click();
    searchInputRef.current?.blur();
    setOpen(false);
  };

  return (
    <div className="t-field">
      <span className="t-label">{label}</span>
      <button
        type="button"
        className="t-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          cursor: 'pointer',
          color: selectedItem ? 'var(--t-text-primary)' : 'var(--t-text-muted)',
        }}
        onClick={handleOpen}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedItem ? getTitle(selectedItem) : allowClear ? emptyLabel : placeholder}
        </span>
        <span style={{ color: 'var(--t-text-muted)', marginLeft: 8, fontSize: '0.75rem' }}>▾</span>
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="t-modal-backdrop t-picker-backdrop"
            style={{ zIndex: 140 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleClose();
              }
            }}
          >
            <div className="t-modal-sheet t-picker-sheet" role="dialog" aria-modal="true">
              {/* Header */}
              <div className="t-modal-header">
                <div>
                  <h2 className="t-modal-title" style={{ fontSize: '0.92rem' }}>
                    {label}
                  </h2>
                  <div className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--t-text-muted)', marginTop: 2 }}>
                    {filtered.length} {filtered.length === 1 ? 'disponible' : 'disponibles'}
                    {search ? ` (filtrado de ${items.length})` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isFocused && (
                    <button
                      type="button"
                      className="t-btn t-btn-sm"
                      style={{ fontSize: '0.72rem', minHeight: 28, padding: '2px 8px' }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        searchInputRef.current?.blur();
                        setIsFocused(false);
                      }}
                    >
                      Listo
                    </button>
                  )}
                  <button
                    type="button"
                    className="t-btn t-btn-muted t-btn-sm"
                    style={{ minHeight: 28, padding: '2px 8px', borderRadius: 6 }}
                    onClick={handleClose}
                    aria-label="Cerrar"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Sticky Search bar */}
              <div className="t-picker-search-bar">
                <div className="t-search-wrap" style={{ width: '100%' }}>
                  <span className="t-search-icon">🔍</span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    inputMode="search"
                    className="t-input t-search-input"
                    placeholder={`Buscar ${label.toLowerCase()}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        searchInputRef.current?.blur();
                      }
                    }}
                  />
                  {search && (
                    <button
                      type="button"
                      className="t-search-clear"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        setSearch('');
                      }}
                      aria-label="Limpiar búsqueda"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="t-picker-list">
                {allowClear && (
                  <button
                    type="button"
                    className="t-card t-card-clickable"
                    style={{
                      textAlign: 'left',
                      borderColor: selectedId === null ? 'var(--t-border-focus)' : 'var(--t-border)',
                      background: selectedId === null ? 'rgba(255, 255, 255, 0.05)' : 'var(--t-surface)',
                      padding: '12px 14px',
                      flexShrink: 0,
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleSelect(null);
                    }}
                    onClick={() => handleSelect(null)}
                  >
                    <div style={{ fontWeight: 500, fontSize: '0.84rem', color: 'var(--t-text-secondary)' }}>
                      {emptyLabel}
                    </div>
                  </button>
                )}

                {filtered.length === 0 ? (
                  <div
                    className="t-card"
                    style={{
                      color: 'var(--t-text-muted)',
                      textAlign: 'center',
                      fontSize: '0.82rem',
                      padding: '24px 14px',
                    }}
                  >
                    <p style={{ margin: 0, marginBottom: 10 }}>Sin resultados para "{search}"</p>
                    <button
                      type="button"
                      className="t-btn t-btn-sm"
                      onClick={() => setSearch('')}
                    >
                      Limpiar filtro
                    </button>
                  </div>
                ) : (
                  filtered.map((item) => {
                    const isSelected = item.id === selectedId;
                    const sub = getSubtitle ? getSubtitle(item) : '';
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="t-card t-card-clickable"
                        style={{
                          textAlign: 'left',
                          borderColor: isSelected ? 'var(--t-border-focus)' : 'var(--t-border)',
                          background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'var(--t-surface)',
                          padding: '12px 14px',
                          flexShrink: 0,
                        }}
                        onPointerDown={(e) => {
                          // Prevent input blur from swallowing the selection tap on mobile touch devices
                          e.preventDefault();
                          handleSelect(item.id);
                        }}
                        onClick={() => handleSelect(item.id)}
                      >
                        <div className="t-row-between">
                          <span
                            style={{
                              fontWeight: isSelected ? 600 : 500,
                              fontSize: '0.88rem',
                              color: isSelected ? 'var(--t-text-primary)' : 'var(--t-text-secondary)',
                            }}
                          >
                            {getTitle(item)}
                          </span>
                          {isSelected && (
                            <span
                              className="t-badge tabular-nums"
                              style={{
                                background: 'var(--t-emerald-bg)',
                                color: 'var(--t-emerald-text)',
                                borderColor: 'var(--t-emerald-border)',
                                fontSize: '0.68rem',
                              }}
                            >
                              Seleccionado ✓
                            </span>
                          )}
                        </div>
                        {sub && (
                          <div
                            className="tabular-nums"
                            style={{ fontSize: '0.76rem', color: 'var(--t-text-muted)', marginTop: 4 }}
                          >
                            {sub}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// =============================================================================
// DocumentAlertBanner
// =============================================================================

export const DocumentAlertBanner: React.FC<{
  alerts: DocumentExpirationAlert[];
  onNavigateFleet?: () => void;
}> = ({ alerts, onNavigateFleet }) => {
  const [expanded, setExpanded] = useState(false);
  if (alerts.length === 0) return null;

  const urgentCount = alerts.filter((a) => a.daysRemaining <= 0).length;
  const isUrgent = urgentCount > 0;
  const config = isUrgent
    ? {
        bg: 'var(--t-rose-bg)',
        color: 'var(--t-rose-text)',
        border: 'var(--t-rose-border)',
      }
    : {
        bg: 'var(--t-amber-bg)',
        color: 'var(--t-amber-text)',
        border: 'var(--t-amber-border)',
      };

  return (
    <div
      className="t-card"
      style={{
        borderColor: config.border,
        background: config.bg,
        padding: '10px 14px',
      }}
    >
      <div
        className="t-row-between"
        style={{ cursor: 'pointer' }}
        onClick={() => {
          TerminalHaptics.click();
          setExpanded((v) => !v);
        }}
      >
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: config.color, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⚠️</span>
          <span>
            {alerts.length} documento{alerts.length > 1 ? 's' : ''} {isUrgent ? 'vencido o por vencer' : 'próximo a vencer'}
          </span>
        </div>
        <span style={{ fontSize: '0.74rem', color: config.color, fontWeight: 500 }}>
          {expanded ? 'Ocultar ↑' : 'Ver detalle ↓'}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alerts.map((a, idx) => (
            <div
              key={`${a.entityName}_${a.documentName}_${idx}`}
              className="t-row-between"
              style={{ fontSize: '0.76rem', color: 'var(--t-text-primary)' }}
            >
              <span>
                <strong style={{ color: 'var(--t-text-secondary)', fontWeight: 500 }}>[{a.entityType}]</strong> {a.entityName} — {a.documentName}
              </span>
              <span
                className="tabular-nums"
                style={{
                  color: a.daysRemaining <= 0 ? 'var(--t-rose-text)' : 'var(--t-amber-text)',
                  fontWeight: 600,
                }}
              >
                {a.daysRemaining <= 0
                  ? `Vencido (${Formatters.displayDate(a.expirationDate)})`
                  : `En ${a.daysRemaining} días`}
              </span>
            </div>
          ))}
          {onNavigateFleet && (
            <button
              type="button"
              className="t-btn t-btn-sm"
              style={{
                marginTop: 6,
                alignSelf: 'flex-end',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--t-text-primary)',
              }}
              onClick={() => {
                TerminalHaptics.click();
                onNavigateFleet();
              }}
            >
              Revisar en Flota →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// OdometerScanModal
// =============================================================================

export const OdometerScanModal: React.FC<{
  title: string;
  onSelectValue: (val: number) => void;
  onClose: () => void;
}> = ({ title, onSelectValue, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<OdometerCandidate[]>([]);
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setErrorMsg(null);
    setCandidates([]);
    setRawLines([]);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanning(true);
    try {
      const res = await OdometerOCRScanner.scanImageFile(file);
      setCandidates(res.candidates);
      setRawLines(res.recognizedLines);
      if (res.candidates.length === 0) {
        setErrorMsg('No se detectaron cifras numéricas claras. Podés ingresarlo abajo manualmente.');
      } else {
        TerminalHaptics.success();
      }
    } catch (err) {
      TerminalHaptics.error();
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar imagen OCR');
    } finally {
      setScanning(false);
    }
  };

  return (
    <ModalSheet title={`Escáner de Odómetro — ${title}`} onClose={onClose} zIndex={150}>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--t-text-secondary)', lineHeight: 1.5 }}>
        Fotografiá el odómetro del tablero. El motor prioriza valores totales de kilometraje (≥ 1.000 km).
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <label className="t-btn t-btn-filled" style={{ flex: 1 }}>
          <span>Tomar Foto 📷</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
        <label className="t-btn" style={{ flex: 1 }}>
          <span>Galería 🖼️</span>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
      </div>

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Vista previa odómetro"
          style={{
            width: '100%',
            maxHeight: 200,
            objectFit: 'contain',
            borderRadius: 8,
            border: '1px solid var(--t-border)',
            background: 'var(--t-surface-elevated)',
          }}
        />
      )}

      {scanning && (
        <div className="t-card" style={{ color: 'var(--t-text-secondary)', textAlign: 'center', fontSize: '0.84rem' }}>
          Analizando dígitos con Tesseract OCR...
        </div>
      )}

      {errorMsg && (
        <div
          className="t-card"
          style={{
            borderColor: 'var(--t-amber-border)',
            background: 'var(--t-amber-bg)',
            color: 'var(--t-amber-text)',
            fontSize: '0.8rem',
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {candidates.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="t-section-label">Candidatos detectados (tocar para aplicar)</div>
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              className="t-card t-card-clickable"
              style={{
                borderColor: c.isLikelyTotalOdometer ? 'var(--t-emerald-border)' : 'var(--t-border)',
                background: c.isLikelyTotalOdometer ? 'var(--t-emerald-bg)' : 'var(--t-surface)',
                padding: '12px 14px',
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                TerminalHaptics.success();
                onSelectValue(c.value);
                onClose();
              }}
              onClick={() => {
                TerminalHaptics.success();
                onSelectValue(c.value);
                onClose();
              }}
            >
              <div className="t-row-between">
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: c.isLikelyTotalOdometer ? 'var(--t-emerald-text)' : 'var(--t-text-primary)',
                  }}
                >
                  {c.formattedValue} km
                </span>
                <span
                  className="t-badge"
                  style={{
                    background: c.isLikelyTotalOdometer ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: c.isLikelyTotalOdometer ? 'var(--t-emerald-text)' : 'var(--t-text-secondary)',
                  }}
                >
                  {c.isLikelyTotalOdometer ? 'Odómetro Total' : 'Parcial'}
                </span>
              </div>
              <div className="tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--t-text-muted)', marginTop: 4 }}>
                Texto: "{c.rawText}" • Confianza: {Math.round(c.confidence * 100)}%
              </div>
            </button>
          ))}
        </div>
      )}

      {rawLines.length > 0 && (
        <div className="t-card tabular-nums" style={{ fontSize: '0.72rem', color: 'var(--t-text-muted)' }}>
          Líneas leídas: {rawLines.join(' | ')}
        </div>
      )}

      <div className="t-divider" />
      <div className="t-field">
        <label className="t-label">Ingreso manual directo</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            inputMode="decimal"
            className="t-input tabular-nums"
            placeholder="Ej: 154.200"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
          />
          <button
            type="button"
            className="t-btn t-btn-filled"
            onClick={() => {
              const parsed = OdometerOCRScanner.parseNumber(manualText);
              if (parsed && parsed > 0) {
                TerminalHaptics.success();
                onSelectValue(parsed);
                onClose();
              }
            }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </ModalSheet>
  );
};

// =============================================================================
// ToastBanner
// =============================================================================

export const ToastBanner: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return <div className="t-toast">{message}</div>;
};
