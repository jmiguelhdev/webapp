import { el } from '../../utils/dom.js';

export function renderPriceShare(container, options) {
  if (!container) return;
  
  const prices = options.prices || {};
  const values = Object.values(prices).map(v => parseFloat(v)).filter(v => !isNaN(v));
  
  // Logic from User Request
  const mestizoPrice = values.length > 0 ? Math.max(...values) : 0;
  
  const overoValues = values.filter(v => v < mestizoPrice);
  const overoPrice = overoValues.length > 0 
    ? Math.max(...overoValues) 
    : (mestizoPrice * 0.95);
    
  const vacaPrice = parseFloat(prices['VACA']) || 0;
  const toroPrice = parseFloat(prices['TORO']) || 0;

  const dateStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const formatPrice = (p) => {
    return '$ ' + new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(p) + '/kg';
  };

  container.innerHTML = '';
  
  const wrapper = el('div', { classes: ['price-share-wrapper', 'fade-in'] });
  
  const header = el('div', { 
    classes: ['price-share-nav'], 
    style: 'width: 100%; padding: 1rem; position: fixed; top: 0; left: 0; display: flex; align-items: center; justify-content: flex-start; z-index: 100;' 
  });
  header.innerHTML = `
    <button id="back-btn" class="back-btn-m3" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(4px);">
      <svg viewBox="0 0 24 24" style="fill: #fff;"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <span style="color: #fff; margin-left: 1rem; font-weight: 500; opacity: 0.7;">Vista de Precios</span>
  `;
  header.querySelector('#back-btn').onclick = options.onBack;
  wrapper.appendChild(header);

  // The Card for Sharing
  const shareCard = el('div', { classes: ['price-share-card'], attrs: { id: 'price-card-capture' } });
  shareCard.innerHTML = `
    <div class="card-logo-container">
      <img src="/logo.jpg" alt="Logo" class="share-logo">
    </div>
    
    <div class="card-title-area">
      <h3 class="card-title-main">PRECIOS DE REFERENCIA</h3>
      <p style="margin: 0.25rem 0; font-weight: 700; color: #fff; letter-spacing: 1px;">FRIGORIFICO PAMPA</p>
      <p class="card-date">${dateStr}</p>
    </div>

    <div class="price-items-container">
      <div class="price-item-skew">
        <span class="price-label">Mestizo:</span>
        <span class="price-value highlight-pink">${formatPrice(mestizoPrice)}</span>
      </div>
      <div class="price-item-skew">
        <span class="price-label">Overo:</span>
        <span class="price-value">${formatPrice(overoPrice)}</span>
      </div>
      <div class="price-item-skew">
        <span class="price-label">Vaca:</span>
        <span class="price-value highlight-pink-soft">${formatPrice(vacaPrice)}</span>
      </div>
      <div class="price-item-skew">
        <span class="price-label">Toro:</span>
        <span class="price-value">${formatPrice(toroPrice)}</span>
      </div>
    </div>

    <div class="card-footer-disclaimer">
      <p>IMPORTANTE: Los precios exhibidos son de referencia y pueden sufrir modificaciones sin previo aviso. Consulte con su asesor comercial.</p>
    </div>
  `;
  wrapper.appendChild(shareCard);

  // Share Actions
  const actions = el('div', { style: 'margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;' });
  
  const whatsappBtn = el('button', { classes: ['btn-primary'], style: 'background: #25D366; width: auto; padding: 0.75rem 2rem; display: flex; align-items: center; gap: 0.5rem;' });
  whatsappBtn.innerHTML = `
    <svg style="width:20px;height:20px" viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.66 20.15 9.3 19.8 8.1 19.14L7.81 18.98L4.68 19.8L5.51 16.75L5.33 16.46C4.6 15.3 4.21 13.96 4.21 12.58C4.21 8.24 7.73 4.7 12.05 4.7M9.27 7.58C9.06 7.58 8.73 7.66 8.44 7.97C8.16 8.27 7.37 9.03 7.37 10.58C7.37 12.14 8.5 13.64 8.65 13.84C8.81 14.04 10.86 17.2 14.05 18.57C14.81 18.9 15.4 19.1 15.86 19.25C16.63 19.5 17.33 19.46 17.87 19.38C18.49 19.3 19.75 18.63 20.01 17.89C20.28 17.15 20.28 16.51 20.19 16.38C20.11 16.25 19.91 16.17 19.61 16.02C19.3 15.88 17.81 15.14 17.53 15.04C17.26 14.94 17.06 14.89 16.86 15.19C16.66 15.49 16.1 16.19 15.93 16.38C15.76 16.58 15.59 16.6 15.28 16.45C14.97 16.29 13.98 15.97 12.81 14.92C11.9 14.11 11.28 13.11 11.11 12.81C10.93 12.5 11.09 12.33 11.24 12.18C11.38 12.04 11.55 11.81 11.7 11.63C11.86 11.46 11.91 11.34 12.01 11.14C12.11 10.94 12.06 10.76 11.98 10.61C11.91 10.46 11.24 8.81 10.96 8.13C10.68 7.46 10.4 7.56 10.2 7.56C10 7.56 9.77 7.56 9.54 7.56" /></svg>
    Compartir en WhatsApp
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
  wrapper.appendChild(actions);

  container.appendChild(wrapper);
}
