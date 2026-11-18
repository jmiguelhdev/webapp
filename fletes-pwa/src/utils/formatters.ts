// Port 1:1 de IosFletes/Utilities/Formatters.swift y TerminalHaptics de Theme.swift

const arsCurrencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const decimalFormatters = new Map<number, Intl.NumberFormat>();
function getDecimalFormatter(decimals: number): Intl.NumberFormat {
  let fmt = decimalFormatters.get(decimals);
  if (!fmt) {
    fmt = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    decimalFormatters.set(decimals, fmt);
  }
  return fmt;
}

export const Formatters = {
  currency(value: number): string {
    const safe = Number.isFinite(value) ? value : 0;
    // Normalize symbol to "$" (Intl es-AR already uses "$", trim non-breaking space variations consistently)
    return arsCurrencyFormatter.format(safe).replace(/ARS\s?/, '$').trim();
  },

  decimal(value: number, decimals = 1): string {
    const safe = Number.isFinite(value) ? value : 0;
    return getDecimalFormatter(decimals).format(safe);
  },

  currencyCompact(value: number): string {
    const safe = Number.isFinite(value) ? value : 0;
    const absVal = Math.abs(safe);
    const sign = safe < 0 ? '-' : '';
    if (absVal >= 1_000_000) {
      return `${sign}$${(absVal / 1_000_000).toFixed(1)}M`;
    }
    if (absVal >= 1_000) {
      return `${sign}$${(absVal / 1_000).toFixed(0)}K`;
    }
    return `${sign}$${absVal.toFixed(0)}`;
  },

  date(d: Date): string {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  },

  isoDate(d: Date): string {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  },

  parseDate(str?: string | null): Date | null {
    if (!str) return null;
    const trimmed = str.trim();
    if (!trimmed) return null;

    // yyyy-MM-dd (or ISO timestamp prefix)
    const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
    if (isoMatch) {
      const y = Number(isoMatch[1]);
      const m = Number(isoMatch[2]) - 1;
      const d = Number(isoMatch[3]);
      const dt = new Date(y, m, d, 0, 0, 0, 0);
      if (!Number.isNaN(dt.getTime())) return dt;
    }

    // dd/MM/yyyy
    const displayMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (displayMatch) {
      const d = Number(displayMatch[1]);
      const m = Number(displayMatch[2]) - 1;
      const y = Number(displayMatch[3]);
      const dt = new Date(y, m, d, 0, 0, 0, 0);
      if (!Number.isNaN(dt.getTime())) return dt;
    }

    const fallback = new Date(trimmed);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  },

  displayDate(str?: string | null): string {
    if (!str) return '';
    const parsed = this.parseDate(str);
    return parsed ? this.date(parsed) : str;
  },

  cuit(raw?: string | null): string {
    const str = raw ?? '';
    const clean = str.replace(/\D/g, '');
    if (clean.length === 11) {
      return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
    }
    return str;
  },

  dni(raw?: string | null): string {
    const str = raw ?? '';
    const clean = str.replace(/\D/g, '');
    if (clean.length > 0) {
      const num = Number(clean);
      if (Number.isFinite(num)) {
        return getDecimalFormatter(0).format(num);
      }
    }
    return str;
  },

  weight(value: number): string {
    return `${this.decimal(value, 0)} kg`;
  },
};

// Mechanical haptic & optional subtle Web Audio click feedback
let audioCtx: AudioContext | null = null;
function playSubtleClick(freq = 640, durationMs = 12, gainPeak = 0.018): void {
  try {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('iosfletes_sound_haptics') !== 'true') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(gainPeak, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + durationMs / 1000);
  } catch {
    // Ignore audio context restriction errors
  }
}

function tryVibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Safari iOS does not expose navigator.vibrate
  }
}

export const TerminalHaptics = {
  light(): void {
    tryVibrate(8);
  },
  medium(): void {
    tryVibrate(14);
  },
  heavy(): void {
    tryVibrate(22);
    playSubtleClick(420, 16, 0.024);
  },
  soft(): void {
    tryVibrate(6);
  },
  click(): void {
    tryVibrate(10);
    playSubtleClick(680, 10, 0.015);
  },
  selection(): void {
    tryVibrate(7);
    playSubtleClick(820, 8, 0.012);
  },
  success(): void {
    tryVibrate([12, 30, 18]);
    playSubtleClick(960, 14, 0.02);
  },
  warning(): void {
    tryVibrate([18, 35, 18]);
    playSubtleClick(360, 18, 0.022);
  },
  error(): void {
    tryVibrate([25, 40, 25, 40, 30]);
    playSubtleClick(220, 22, 0.026);
  },
};
