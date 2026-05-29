/**
 * <kmp-metric-card>
 * Native Web Component for premium dashboard metric cards in glassmorphism.
 * Supports attributes:
 * - title: Card header text
 * - value: Main large value display
 * - trend: Percentage/text trend (e.g. '+12.4%' or '-2.1%')
 * - icon: Emoji or icon text
 * - subtitle: Small bottom contextual text
 */
export class KmpMetricCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['title', 'value', 'trend', 'icon', 'subtitle', 'value-color'];
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  getStyles() {
    const trendValue = this.getAttribute('trend') || '';
    const isPositive = trendValue.startsWith('+') || trendValue.includes('up') || parseFloat(trendValue) > 0;
    const isNegative = trendValue.startsWith('-') || trendValue.includes('down') || parseFloat(trendValue) < 0;
    
    let trendColor = 'var(--text-muted, #94a3b8)';
    if (isPositive) trendColor = '#34d399'; // Emerald-400
    if (isNegative) trendColor = '#f87171'; // Red-400

    return `
      :host {
        display: block;
        flex: 1 1 200px;
        min-width: 180px;
      }
      .card {
        padding: 1.25rem 1.5rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }
      .card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;
        background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
        pointer-events: none;
        z-index: 1;
      }
      .card:hover {
        transform: translateY(-4px);
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 40px rgba(0, 0, 0, 0.35);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        position: relative;
        z-index: 2;
      }
      .title {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-muted, #94a3b8);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 0;
      }
      .icon-wrapper {
        font-size: 1.25rem;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: all 0.2s ease;
      }
      .card:hover .icon-wrapper {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
      }
      .body {
        position: relative;
        z-index: 2;
      }
      .value {
        font-family: 'Outfit', 'Inter', system-ui, sans-serif;
        font-size: 1.62rem;
        font-weight: 800;
        color: var(--text-primary, #f8fafc);
        letter-spacing: -0.5px;
        margin: 0;
        line-height: 1.2;
      }
      .footer {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin-top: 0.65rem;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.72rem;
        position: relative;
        z-index: 2;
      }
      .trend {
        font-weight: 700;
        color: ${trendColor};
        display: flex;
        align-items: center;
        gap: 0.15rem;
      }
      .subtitle {
        color: var(--text-muted, #64748b);
        font-weight: 500;
      }
    `;
  }

  render() {
    const title = this.getAttribute('title') || '';
    const value = this.getAttribute('value') || '';
    const trend = this.getAttribute('trend') || '';
    const icon = this.getAttribute('icon') || '';
    const subtitle = this.getAttribute('subtitle') || '';
    const valueColor = this.getAttribute('value-color') || '';
    const valueStyle = valueColor ? `style="color: ${valueColor};"` : '';

    const isPositive = trend.startsWith('+') || parseFloat(trend) > 0;
    const isNegative = trend.startsWith('-') || parseFloat(trend) < 0;
    
    let trendArrow = '';
    if (isPositive) trendArrow = '↑';
    if (isNegative) trendArrow = '↓';

    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="card">
        <div class="header">
          <h4 class="title">${title}</h4>
          ${icon ? `<div class="icon-wrapper">${icon}</div>` : ''}
        </div>
        <div class="body">
          <div class="value" ${valueStyle}>${value}</div>
        </div>
        ${(trend || subtitle) ? `
          <div class="footer">
            ${trend ? `<span class="trend">${trendArrow} ${trend}</span>` : ''}
            ${subtitle ? `<span class="subtitle">${subtitle}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
}

if (!customElements.get('kmp-metric-card')) {
  customElements.define('kmp-metric-card', KmpMetricCard);
}
