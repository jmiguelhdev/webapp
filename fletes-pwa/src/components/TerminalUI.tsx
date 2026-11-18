import React, { useMemo, useState } from 'react';
import {
  DocumentExpirationAlert,
  TravelStatus,
  getTravelStatusDisplayName,
} from '../domain/models';
import { OdometerCandidate, OdometerOCRScanner } from '../domain/engine';
import { Formatters, TerminalHaptics } from '../utils/formatters';

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

export const ModalSheet: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, onClose, children, footer }) => (
  <div
    className="t-modal-backdrop"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        TerminalHaptics.click();
        onClose();
      }
    }}
  >
    <div className="t-modal-sheet">
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
        onClick={() => {
          TerminalHaptics.click();
          setSearch('');
          setOpen(true);
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedItem ? getTitle(selectedItem) : allowClear ? emptyLabel : placeholder}
        </span>
        <span style={{ color: 'var(--t-text-muted)', marginLeft: 8, fontSize: '0.75rem' }}>▾</span>
      </button>

      {open && (
        <ModalSheet title={`Seleccionar ${label}`} onClose={() => setOpen(false)}>
          <div className="t-search-wrap">
            <span className="t-search-icon">🔍</span>
            <input
              type="text"
              className="t-input t-search-input"
              placeholder="Buscar por nombre, patente, CUIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {allowClear && (
            <button
              type="button"
              className="t-card t-card-clickable"
              style={{
                textAlign: 'left',
                borderColor: selectedId === null ? 'var(--t-border-focus)' : 'var(--t-border)',
                background: selectedId === null ? 'rgba(255, 255, 255, 0.05)' : 'var(--t-surface)',
                padding: '10px 14px',
              }}
              onClick={() => {
                TerminalHaptics.selection();
                onSelect(null);
                setOpen(false);
              }}
            >
              <div style={{ fontWeight: 500, fontSize: '0.84rem', color: 'var(--t-text-secondary)' }}>
                {emptyLabel}
              </div>
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="t-card" style={{ color: 'var(--t-text-muted)', textAlign: 'center', fontSize: '0.82rem' }}>
              Sin resultados para "{search}"
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.map((item) => {
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
                      background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'var(--t-surface)',
                      padding: '10px 14px',
                    }}
                    onClick={() => {
                      TerminalHaptics.selection();
                      onSelect(item.id);
                      setOpen(false);
                    }}
                  >
                    <div className="t-row-between">
                      <span
                        style={{
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: '0.86rem',
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
                        style={{ fontSize: '0.74rem', color: 'var(--t-text-muted)', marginTop: 3 }}
                      >
                        {sub}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ModalSheet>
      )}
    </div>
  );
}

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
    <ModalSheet title={`Escáner de Odómetro — ${title}`} onClose={onClose}>
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

export const ToastBanner: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return <div className="t-toast">{message}</div>;
};
