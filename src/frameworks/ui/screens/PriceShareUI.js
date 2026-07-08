import { el } from '../../../utils/dom.js';
import { PriceReference } from '../../../domain/entities/PriceReference.js';
import html2canvas from 'html2canvas';

/**
 * @file PriceShareUI.js
 * @description Renders a premium reference price flyer/card, with style switcher,
 * WhatsApp sharing, image download, and clipboard copy capabilities.
 */

/**
 * Renders the reference price share view.
 * @param {HTMLElement} container - The DOM container to render into.
 * @param {Object} options - Config options.
 * @param {Object.<string, string|number>} options.prices - Raw prices of different categories.
 * @param {function} options.onBack - Back navigation callback.
 */
export function renderPriceShare(container, options) {
  if (!container) return;

  // Use domain entity for calculations instead of calculating in UI
  const priceData = new PriceReference(options.prices || {});
  
  const mestizoPrice = priceData.mestizoPrice;
  const overoPrice = priceData.overoPrice;
  const vacaPrice = priceData.vacaPrice;
  const toroPrice = priceData.toroPrice;

  const dateStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  /**
   * Helper to format values as ARS currency.
   * @param {number} p - Price value.
   * @returns {string} Formatted string.
   */
  const formatPrice = (p) => {
    return '$ ' + new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(p) + '/kg';
  };

  container.innerHTML = '';

  const wrapper = el('div', { classes: ['price-share-wrapper', 'fade-in'] });

  // Standard back button and title
  const header = el('div', { 
    classes: ['price-share-nav'], 
    style: 'width: 100%; padding: 1rem; position: fixed; top: 0; left: 0; display: flex; align-items: center; justify-content: flex-start; z-index: 100;' 
  });
  header.innerHTML = `
    <button id="back-btn" class="back-btn-m3" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(4px);">
      <svg viewBox="0 0 24 24" style="fill: #fff;"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <span style="color: #fff; margin-left: 1rem; font-weight: 500; opacity: 0.7;">Placa de Cotizaciones</span>
  `;
  header.querySelector('#back-btn').onclick = options.onBack;
  wrapper.appendChild(header);

  // Theme selector panel
  const selectorPanel = el('div', { classes: ['theme-selector-panel', 'glass-card'] });
  selectorPanel.innerHTML = `
    <h4 class="selector-title">🎨 Seleccionar Estilo de Placa</h4>
    <div class="theme-buttons">
      <button class="theme-btn active" data-theme="theme-crimson">
        <span class="color-dot crimson"></span> Crimson Luxury
      </button>
      <button class="theme-btn" data-theme="theme-gold">
        <span class="color-dot gold"></span> Midnight Gold
      </button>
      <button class="theme-btn" data-theme="theme-steel">
        <span class="color-dot steel"></span> Ocean Steel
      </button>
    </div>
  `;
  wrapper.appendChild(selectorPanel);

  // The Card for Sharing
  const shareCard = el('div', { classes: ['price-share-card', 'theme-crimson'], attrs: { id: 'price-card-capture' } });
  shareCard.innerHTML = `
    <div class="card-bg-overlay"></div>
    <div class="card-glass-glow"></div>
    <div class="card-border-line"></div>
    
    <div class="card-header-area">
      <div class="card-logo-container">
        <img src="/logo.jpg" alt="Logo" class="share-logo">
      </div>
      <div class="card-brand-details">
        <h2 class="card-brand-name">FRIGORÍFICO PAMPA</h2>
        <span class="card-badge-pill">PRECIOS DE REFERENCIA</span>
      </div>
    </div>
    
    <div class="card-title-area">
      <div class="card-date-badge">
        <svg viewBox="0 0 24 24" class="date-icon"><path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"></path></svg>
        <span>${dateStr}</span>
      </div>
    </div>

    <div class="price-items-container">
      <div class="price-item-row item-mestizo">
        <div class="price-row-left">
          <span class="price-emoji">🐂</span>
          <span class="price-label">Mestizo</span>
        </div>
        <span class="price-value highlight-glow">${formatPrice(mestizoPrice)}</span>
      </div>
      
      <div class="price-item-row item-overo">
        <div class="price-row-left">
          <span class="price-emoji">🐂</span>
          <span class="price-label">Overo</span>
        </div>
        <span class="price-value">${formatPrice(overoPrice)}</span>
      </div>
      
      <div class="price-item-row item-vaca">
        <div class="price-row-left">
          <span class="price-emoji">🐄</span>
          <span class="price-label">Vaca</span>
        </div>
        <span class="price-value">${formatPrice(vacaPrice)}</span>
      </div>
      
      <div class="price-item-row item-toro">
        <div class="price-row-left">
          <span class="price-emoji">🐂</span>
          <span class="price-label">Toro</span>
        </div>
        <span class="price-value">${formatPrice(toroPrice)}</span>
      </div>
    </div>

    <div class="card-footer-disclaimer">
      <p>⚠️ IMPORTANTE: Los precios exhibidos son de referencia y están sujetos a modificaciones sin previo aviso. Consulte con su asesor comercial antes de realizar operaciones.</p>
    </div>
  `;
  wrapper.appendChild(shareCard);

  // Hook Theme Change
  selectorPanel.querySelectorAll('.theme-btn').forEach(btn => {
    btn.onclick = () => {
      selectorPanel.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const selectedTheme = btn.dataset.theme;
      shareCard.className = `price-share-card ${selectedTheme}`;
    };
  });

  // Action Buttons Wrapper
  const actions = el('div', { classes: ['share-actions-container'] });
  
  // 1. WhatsApp Button
  const whatsappBtn = el('button', { classes: ['btn-share-action', 'btn-whatsapp'] });
  whatsappBtn.innerHTML = `
    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.66 20.15 9.3 19.8 8.1 19.14L7.81 18.98L4.68 19.8L5.51 16.75L5.33 16.46C4.6 15.3 4.21 13.96 4.21 12.58C4.21 8.24 7.73 4.7 12.05 4.7M9.27 7.58C9.06 7.58 8.73 7.66 8.44 7.97C8.16 8.27 7.37 9.03 7.37 10.58C7.37 12.14 8.5 13.64 8.65 13.84C8.81 14.04 10.86 17.2 14.05 18.57C14.81 18.9 15.4 19.1 15.86 19.25C16.63 19.5 17.33 19.46 17.87 19.38C18.49 19.3 19.75 18.63 20.01 17.89C20.28 17.15 20.28 16.51 20.19 16.38C20.11 16.25 19.91 16.17 19.61 16.02C19.3 15.88 17.81 15.14 17.53 15.04C17.26 14.94 17.06 14.89 16.86 15.19C16.66 15.49 16.1 16.19 15.93 16.38C15.76 16.58 15.59 16.6 15.28 16.45C14.97 16.29 13.98 15.97 12.81 14.92C11.9 14.11 11.28 13.11 11.11 12.81C10.93 12.5 11.09 12.33 11.24 12.18C11.38 12.04 11.55 11.81 11.7 11.63C11.86 11.46 11.91 11.34 12.01 11.14C12.11 10.94 12.06 10.76 11.98 10.61C11.91 10.46 11.24 8.81 10.96 8.13C10.68 7.46 10.4 7.56 10.2 7.56C10 7.56 9.77 7.56 9.54 7.56" /></svg>
    <span>WhatsApp</span>
  `;
  whatsappBtn.onclick = () => {
    const text = `📊 *PRECIOS DE REFERENCIA* (${dateStr})\n` +
      `*FRIGORIFICO PAMPA*\n\n` +
      `🐂 *Mestizo:* ${formatPrice(mestizoPrice)}\n` +
      `🐂 *Overo:* ${formatPrice(overoPrice)}\n` +
      `🐄 *Vaca:* ${formatPrice(vacaPrice)}\n` +
      `🐂 *Toro:* ${formatPrice(toroPrice)}\n\n` +
      `_Precios de referencia sujetos a modificaciones._\n` +
      `*"IMPORTANTE: Los precios exhibidos son de referencia y pueden sufrir modificaciones sin previo aviso. Consulte con su asesor comercial."*`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };
  actions.appendChild(whatsappBtn);

  // 2. Download Image Button
  const downloadBtn = el('button', { classes: ['btn-share-action', 'btn-download'] });
  downloadBtn.innerHTML = `
    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" /></svg>
    <span>Guardar Imagen</span>
  `;
  downloadBtn.onclick = async () => {
    try {
      const loader = showActionLoader(downloadBtn, 'Generando...');
      const canvas = await html2canvas(shareCard, {
        scale: 2.5, // Crisp, ultra-clear high-DPI output for printing or sharing
        useCORS: true,
        backgroundColor: null, // Allow transparent background outside rounded borders
        logging: false
      });
      const link = document.createElement('a');
      link.download = `Precios_Referencia_${dateStr.replace(/\//g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      hideActionLoader(downloadBtn, 'Guardar Imagen', loader);
    } catch (err) {
      console.error('Failed to capture card', err);
      alert('Error al generar la imagen. Inténtelo de nuevo.');
    }
  };
  actions.appendChild(downloadBtn);

  // 3. Copy Image Button
  const copyBtn = el('button', { classes: ['btn-share-action', 'btn-copy'] });
  copyBtn.innerHTML = `
    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" /></svg>
    <span>Copiar Portapapeles</span>
  `;
  copyBtn.onclick = async () => {
    try {
      const loader = showActionLoader(copyBtn, 'Copiando...');
      const canvas = await html2canvas(shareCard, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: null,
        logging: false
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Canvas blob is empty');
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          alert('✅ ¡Imagen copiada al portapapeles con éxito!');
        } catch (clipErr) {
          // If navigator.clipboard.write is not supported (e.g. Firefox default configs, HTTP contexts)
          console.warn('Direct clipboard copy failed, offering direct download instead.', clipErr);
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = `Precios_Referencia_${dateStr.replace(/\//g, '-')}.png`;
          link.click();
          alert('Su navegador no admite copiar imágenes directamente. Descargando en su lugar.');
        } finally {
          hideActionLoader(copyBtn, 'Copiar Portapapeles', loader);
        }
      });
    } catch (err) {
      console.error('Failed to copy image', err);
      alert('Error al copiar la imagen.');
    }
  };
  actions.appendChild(copyBtn);

  wrapper.appendChild(actions);
  container.appendChild(wrapper);
}

/**
 * Displays a spinner and text inside the button to show processing state.
 * @param {HTMLButtonElement} button - Target button.
 * @param {string} text - Process text.
 * @returns {HTMLSpanElement} Loader element to remove later.
 */
function showActionLoader(button, text) {
  button.disabled = true;
  const originalHtml = button.innerHTML;
  button.dataset.original = originalHtml;
  button.innerHTML = `
    <span class="mini-spinner"></span>
    <span>${text}</span>
  `;
  return button.querySelector('.mini-spinner');
}

/**
 * Hides action loader and restores the button.
 * @param {HTMLButtonElement} button - Target button.
 * @param {string} text - Restored text.
 * @param {HTMLSpanElement} loader - Loader element to clean up.
 */
function hideActionLoader(button, text, loader) {
  if (loader) loader.remove();
  button.disabled = false;
  button.innerHTML = button.dataset.original;
}
