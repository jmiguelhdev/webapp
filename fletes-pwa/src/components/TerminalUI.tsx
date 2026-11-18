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
}> = ({ title, value, subtitle, tint = 'var(--t-cyan)' }) => (
  <div className="metric-card">
    <span className="metric-card-label">{title}</span>
    <span className="metric-card-value" style={{ color: tint }} title={value}>
      {value}
    </span>
    {subtitle && (
      <span
        className="mono"
        style={{
          fontSize: '0.62rem',
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
  const color =
    status === 'ACTIVE'
      ? 'var(--t-green)'
      : status === 'FLETE'
      ? 'var(--t-purple)'
      : 'var(--t-amber)';
  return (
    <span className="t-badge" style={{ color }}>
      [{getTravelStatusDisplayName(status).toUpperCase()}]
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
          onClick={() => {
            TerminalHaptics.click();
            onClose();
          }}
        >
          [✕]
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
        <span style={{ color: 'var(--t-cyan)', marginLeft: 8 }}>▾</span>
      </button>

      {open && (
        <ModalSheet title={`// SELECCIONAR ${label.toUpperCase()}`} onClose={() => setOpen(false)}>
          <div className="t-search-wrap">
            <span className="t-search-prefix">&gt;</span>
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
                color: selectedId === null ? 'var(--t-cyan)' : 'var(--t-text-secondary)',
                borderColor: selectedId === null ? 'var(--t-cyan)' : 'var(--t-border)',
              }}
              onClick={() => {
                TerminalHaptics.selection();
                onSelect(null);
                setOpen(false);
              }}
            >
              <div className="mono" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                {emptyLabel}
              </div>
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="t-card mono" style={{ color: 'var(--t-text-muted)', textAlign: 'center' }}>
              &gt; Sin resultados para "{search}"
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
                      borderColor: isSelected ? 'var(--t-cyan)' : 'var(--t-border)',
                    }}
                    onClick={() => {
                      TerminalHaptics.selection();
                      onSelect(item.id);
                      setOpen(false);
                    }}
                  >
                    <div className="t-row-between">
                      <span
                        className="mono"
                        style={{
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          color: isSelected ? 'var(--t-cyan)' : 'var(--t-text-primary)',
                        }}
                      >
                        {getTitle(item)}
                      </span>
                      {isSelected && (
                        <span className="mono" style={{ color: 'var(--t-cyan)', fontSize: '0.75rem' }}>
                          [OK]
                        </span>
                      )}
                    </div>
                    {sub && (
                      <div
                        className="mono"
                        style={{ fontSize: '0.72rem', color: 'var(--t-text-secondary)', marginTop: 3 }}
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
  const borderColor = urgentCount > 0 ? 'var(--t-red)' : 'var(--t-amber)';

  return (
    <div
      className="t-card"
      style={{
        borderColor,
        background: urgentCount > 0 ? 'rgba(255, 69, 58, 0.08)' : 'rgba(255, 179, 0, 0.08)',
        padding: '10px 12px',
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
        <div className="mono" style={{ fontSize: '0.78rem', fontWeight: 800, color: borderColor }}>
          ⚠️ {alerts.length} DOCUMENTO{alerts.length > 1 ? 'S' : ''} POR VENCER / VENCIDO
          {alerts.length > 1 ? 'S' : ''}
        </div>
        <span className="mono" style={{ fontSize: '0.72rem', color: borderColor }}>
          {expanded ? '[OCULTAR]' : '[VER]'}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {alerts.map((a, idx) => (
            <div
              key={`${a.entityName}_${a.documentName}_${idx}`}
              className="t-row-between mono"
              style={{ fontSize: '0.74rem', color: 'var(--t-text-primary)' }}
            >
              <span>
                [{a.entityType}] {a.entityName} — {a.documentName}
              </span>
              <span
                style={{
                  color: a.daysRemaining <= 0 ? 'var(--t-red)' : 'var(--t-amber)',
                  fontWeight: 800,
                }}
              >
                {a.daysRemaining <= 0
                  ? `VENCIDO (${Formatters.displayDate(a.expirationDate)})`
                  : `En ${a.daysRemaining}d`}
              </span>
            </div>
          ))}
          {onNavigateFleet && (
            <button
              type="button"
              className="t-btn t-btn-amber t-btn-sm"
              style={{ marginTop: 4, alignSelf: 'flex-end' }}
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
        setErrorMsg('No se detectaron cifras numéricas claras. Podés ingresarlo abajo.');
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
    <ModalSheet title={`📷 ESCÁNER OCR — ${title.toUpperCase()}`} onClose={onClose}>
      <p className="mono" style={{ margin: 0, fontSize: '0.76rem', color: 'var(--t-text-secondary)' }}>
        &gt; Sacá una foto al tablero o elegí de galería. El motor prioriza valores totales (&gt;= 1.000 km).
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label className="t-btn t-btn-filled" style={{ flex: 1 }}>
          <span>📸 Cámara</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
        <label className="t-btn" style={{ flex: 1 }}>
          <span>🖼️ Galería</span>
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
            borderRadius: 6,
            border: '1px solid var(--t-border)',
            background: '#05080b',
          }}
        />
      )}

      {scanning && (
        <div className="t-card mono" style={{ color: 'var(--t-cyan)', textAlign: 'center' }}>
          &gt; Analizando dígitos con Tesseract.js...
        </div>
      )}

      {errorMsg && (
        <div className="t-card mono" style={{ borderColor: 'var(--t-amber)', color: 'var(--t-amber)', fontSize: '0.76rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {candidates.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="t-section-label">// CANDIDATOS DETECTADOS (TOCAR PARA APLICAR)</div>
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              className="t-card t-card-clickable"
              style={{
                borderColor: c.isLikelyTotalOdometer ? 'var(--t-green)' : 'var(--t-border)',
              }}
              onClick={() => {
                TerminalHaptics.success();
                onSelectValue(c.value);
                onClose();
              }}
            >
              <div className="t-row-between">
                <span
                  className="mono"
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: c.isLikelyTotalOdometer ? 'var(--t-green)' : 'var(--t-text-primary)',
                  }}
                >
                  {c.formattedValue} km
                </span>
                <span className="t-badge" style={{ color: c.isLikelyTotalOdometer ? 'var(--t-green)' : 'var(--t-text-secondary)' }}>
                  {c.isLikelyTotalOdometer ? 'ODÓMETRO TOTAL' : 'PARCIAL / OTRO'}
                </span>
              </div>
              <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--t-text-muted)', marginTop: 3 }}>
                Texto: "{c.rawText}" • Confianza: {Math.round(c.confidence * 100)}%
              </div>
            </button>
          ))}
        </div>
      )}

      {rawLines.length > 0 && (
        <div className="t-card mono" style={{ fontSize: '0.68rem', color: 'var(--t-text-muted)' }}>
          Líneas leídas: {rawLines.join(' | ')}
        </div>
      )}

      <div className="t-divider" />
      <div className="t-field">
        <label className="t-label">Ingreso rápido manual</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="t-input"
            placeholder="Ej: 154.200"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
          />
          <button
            type="button"
            className="t-btn t-btn-green"
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
