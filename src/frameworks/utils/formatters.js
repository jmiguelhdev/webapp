/**
 * Shared formatting utilities — Accounting & Checks modules.
 */

/**
 * Formats a numeric value as Argentine Peso currency.
 * @param {number} val
 * @returns {string}
 */
export function formatCurrency(val) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
}

/**
 * Formats a Unix timestamp as a local date string (es-AR).
 * @param {number} ts
 * @returns {string}
 */
export function formatDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('es-AR');
}

/**
 * Formats a Unix timestamp as a local time string HH:MM (es-AR).
 * @param {number} ts
 * @returns {string}
 */
export function formatTime(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Date utilities for Checks module (avoids UTC-3 day-shift on "YYYY-MM-DD")
// ---------------------------------------------------------------------------

/**
 * Parses a "YYYY-MM-DD" string (or Date) as LOCAL midnight to avoid the
 * UTC day-shift that happens with `new Date("YYYY-MM-DD")` in UTC-3.
 * @param {string|Date|null} str
 * @returns {Date|null}
 */
export function parseDateLocal(str) {
  if (!str) return null;
  if (str instanceof Date) { const d = new Date(str); d.setHours(0, 0, 0, 0); return d; }
  const parts = String(str).split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d); // local midnight
  }
  const dt = new Date(str);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/**
 * Returns a comparable timestamp from a "YYYY-MM-DD" date string.
 * Returns 0 for missing/invalid values.
 * @param {string|null} str
 * @returns {number}
 */
export function getSortDate(str) {
  if (!str) return 0;
  const dt = parseDateLocal(str);
  const t = dt ? dt.getTime() : NaN;
  return isNaN(t) ? 0 : t;
}

/**
 * Formats a "YYYY-MM-DD" date string as a local date string (es-AR),
 * avoiding the UTC-3 day-shift caused by `new Date("YYYY-MM-DD")`.
 * @param {string|Date|null} dateStr
 * @returns {string}
 */
export function formatDateLocal(dateStr) {
  if (!dateStr) return '-';
  const dt = parseDateLocal(dateStr);
  return dt ? dt.toLocaleDateString('es-AR') : '-';
}

/**
 * Adds `days` calendar days to a "YYYY-MM-DD" string and returns a new "YYYY-MM-DD".
 * @param {string|null} dateStr
 * @param {number} days
 * @returns {string|null}
 */
export function addDays(dateStr, days) {
  if (!dateStr) return null;
  const dt = parseDateLocal(dateStr);
  if (!dt) return null;
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
