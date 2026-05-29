/**
 * <kmp-status-chip>
 * Native Web Component for premium status badges with curated HSL color schemes.
 * Supports attributes:
 * - status: 'COMPLETED' | 'ACTIVE' | 'DRAFT' | 'PENDING' | 'SOLD' | 'REJECTED' | 'PAID' | 'VOID'
 * - label: Optional override text
 */
export class KmpStatusChip extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['status', 'label'];
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  getStyles(status) {
    const s = String(status || '').toUpperCase();
    
    // Curated HSL color configurations for a premium dark-themed look
    const configs = {
      COMPLETED: { h: 142, s: 70, l: 45, text: 'Finalizado' },
      FINALIZADO: { h: 142, s: 70, l: 45, text: 'Finalizado' },
      ACTIVE: { h: 217, s: 91, l: 60, text: 'Activo' },
      ACTIVO: { h: 217, s: 91, l: 60, text: 'Activo' },
      DRAFT: { h: 36, s: 100, l: 50, text: 'Borrador' },
      BORRADOR: { h: 36, s: 100, l: 50, text: 'Borrador' },
      PENDING: { h: 27, s: 96, l: 61, text: 'Pendiente' },
      PENDIENTE: { h: 27, s: 96, l: 61, text: 'Pendiente' },
      SOLD: { h: 250, s: 89, l: 65, text: 'Vendido' },
      VENDIDO: { h: 250, s: 89, l: 65, text: 'Vendido' },
      REJECTED: { h: 0, s: 84, l: 60, text: 'Rechazado' },
      RECHAZADO: { h: 0, s: 84, l: 60, text: 'Rechazado' },
      PAID: { h: 152, s: 76, l: 40, text: 'Pagado' },
      PAGADO: { h: 152, s: 76, l: 40, text: 'Pagado' },
      VOID: { h: 0, s: 0, l: 60, text: 'Anulado' },
      ANULADO: { h: 0, s: 0, l: 60, text: 'Anulado' }
    };

    const cfg = configs[s] || { h: 200, s: 10, l: 60, text: s };
    
    return `
      :host {
        display: inline-block;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.65rem;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.72rem;
        font-weight: 700;
        border-radius: 9999px;
        letter-spacing: 0.2px;
        text-transform: uppercase;
        background-color: hsla(${cfg.h}, ${cfg.s}%, ${cfg.l}%, 0.12);
        border: 1.5px solid hsla(${cfg.h}, ${cfg.s}%, ${cfg.l}%, 0.25);
        color: hsl(${cfg.h}, ${cfg.s}%, 72%);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: default;
        user-select: none;
      }
      .chip:hover {
        background-color: hsla(${cfg.h}, ${cfg.s}%, ${cfg.l}%, 0.2);
        border-color: hsla(${cfg.h}, ${cfg.s}%, ${cfg.l}%, 0.45);
        color: hsl(${cfg.h}, ${cfg.s}%, 82%);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.16);
      }
      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: hsl(${cfg.h}, ${cfg.s}%, 55%);
        box-shadow: 0 0 6px hsl(${cfg.h}, ${cfg.s}%, 55%);
        transition: all 0.2s ease;
      }
      .chip:hover .dot {
        transform: scale(1.2);
        background-color: hsl(${cfg.h}, ${cfg.s}%, 65%);
        box-shadow: 0 0 10px hsl(${cfg.h}, ${cfg.s}%, 65%);
      }
    `;
  }

  render() {
    const status = this.getAttribute('status') || '';
    const label = this.getAttribute('label');
    
    // Fallback labels mapping for clean display
    const fallbackText = {
      COMPLETED: 'Finalizado',
      FINALIZADO: 'Finalizado',
      ACTIVE: 'Activo',
      ACTIVO: 'Activo',
      DRAFT: 'Borrador',
      BORRADOR: 'Borrador',
      PENDING: 'Pendiente',
      PENDIENTE: 'Pendiente',
      SOLD: 'Vendido',
      VENDIDO: 'Vendido',
      REJECTED: 'Rechazado',
      RECHAZADO: 'Rechazado',
      PAID: 'Pagado',
      PAGADO: 'Pagado',
      VOID: 'Anulado',
      ANULADO: 'Anulado'
    };
    
    const displayText = label || fallbackText[String(status).toUpperCase()] || status;

    this.shadowRoot.innerHTML = `
      <style>${this.getStyles(status)}</style>
      <div class="chip">
        <span class="dot"></span>
        <span class="text">${displayText}</span>
      </div>
    `;
  }
}

if (!customElements.get('kmp-status-chip')) {
  customElements.define('kmp-status-chip', KmpStatusChip);
}
