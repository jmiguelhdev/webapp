import { el } from '../../../frameworks/utils/dom.js';
import { SettingsService } from '../../../frameworks/services/SettingsService.js';
import { SyncService } from '../../../frameworks/services/SyncService.js';


/**
 * @file SettingsUI.js
 * @description Renders a high-fidelity, premium settings dashboard adhering to Clean Architecture.
 * Manages economic margins, jaula freight logistics, livestock reference prices,
 * cold storage chambers, and administrator-level access roles (RBAC).
 */

/**
 * Renders the settings screen into the given container.
 * @param {HTMLElement} container - The DOM container to render into.
 * @param {Object} options - Config options.
 * @param {Object.<string, string|number>} options.categoryPrices - Category prices mapping.
 * @param {Object[]} options.camarasList - List of configured cold cameras.
 * @param {string} options.userRole - Role of the current user ('ADMIN', 'OPERARIO', 'VISOR').
 * @param {Object[]} options.usersList - List of users for RBAC management.
 * @param {function} options.onSavePrices - Callback to save prices.
 * @param {function} options.onSaveCamaras - Callback to save camera configurations.
 * @param {function} options.onSaveUserRole - Callback to update a user's role.
 * @param {function} options.onPriceShare - Callback to navigate to price placard view.
 * @param {function} options.onBack - Back navigation callback.
 */
export function renderSettings(container, options) {
  if (!container) return;
  
  const current = SettingsService.loadSettings();
  container.innerHTML = '';
  
  const wrapper = el('div', { 
    classes: ['settings-wrapper', 'fade-in'], 
    style: 'width: 100%; max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;' 
  });

  // Sophisticated Dashboard Header
  const header = el('div', { 
    classes: ['settings-header-container', 'glass-card'],
    style: 'margin-bottom: 2rem; padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; border-radius: 20px;' 
  });
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem;">
      <button id="back-btn" class="back-btn-m3" title="Volver al Dashboard" style="border: 1px solid var(--border); background: var(--bg-main);">
        <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
      </button>
      <div>
        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-main);">⚙️ Configuración General</h2>
        <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Administra parámetros operacionales, costos logísticos, cámaras de acopio y privilegios del personal.</p>
      </div>
    </div>
  `;
  wrapper.appendChild(header);
  header.querySelector('#back-btn').onclick = options.onBack;

  // Premium sliding toast notification container
  const msgBox = el('div', { 
    attrs: { id: 'settings-msg' }, 
    classes: ['settings-toast-alert'], 
    style: 'display: none;' 
  });
  wrapper.appendChild(msgBox);

  /**
   * Helper to display a premium visual toaster notification.
   * @param {string} text - Message text.
   * @param {boolean} [isError=false] - Whether it is an error.
   */
  const showMsg = (text, isError = false) => {
    msgBox.innerHTML = `
      <span class="toast-icon">${isError ? '⚠️' : '✅'}</span>
      <span class="toast-text">${text}</span>
    `;
    msgBox.className = `settings-toast-alert ${isError ? 'toast-error' : 'toast-success'}`;
    msgBox.style.display = 'flex';
    setTimeout(() => { 
      msgBox.style.opacity = '0';
      setTimeout(() => {
        msgBox.style.display = 'none';
        msgBox.style.opacity = '1';
      }, 300);
    }, 4000);
  };

  // Section: Margins & Logistics Grid
  const sectionTitle1 = el('h3', { 
    classes: ['settings-section-title'], 
    text: '📈 Parámetros Comerciales & Fletes',
    style: 'margin: 2.5rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;'
  });
  wrapper.appendChild(sectionTitle1);

  const formGrid1 = el('div', { 
    classes: ['settings-grid'], 
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;' 
  });

  formGrid1.innerHTML = `
    <!-- Card 1: Margen Económico -->
    <div class="glass-card settings-card" style="display: flex; flex-direction: column; padding: 1.5rem; border-radius: 16px; min-height: 200px;">
      <h4 class="card-title-m3">💵 Margen de Operación</h4>
      <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1.25rem;">Porcentaje de ganancia objetiva añadido por encima del costo gancho estimado en el simulador.</p>
      <div class="form-group" style="margin-top: auto; display: flex; flex-direction: column; gap: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-main);">Ganancia Proyectada</label>
          <span class="badge-accent" id="margen-val-badge" style="background: var(--primary-container); color: var(--on-primary-container); font-weight: 700; font-size: 0.8rem; padding: 0.25rem 0.6rem; border-radius: 8px;">${((current.margenGanancia - 1) * 100).toFixed(0)}%</span>
        </div>
        <input type="range" id="set-margen" min="0" max="100" value="${((current.margenGanancia - 1) * 100).toFixed(0)}" class="slider-m3" style="width: 100%; margin-top: 0.5rem;">
      </div>
    </div>

    <!-- Card 2: Flete Jaula Doble -->
    <div class="glass-card settings-card" style="display: flex; flex-direction: column; padding: 1.5rem; border-radius: 16px;">
      <h4 class="card-title-m3">🚛 Transporte Jaula Doble</h4>
      <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1rem;">Capacidad y flete estandarizado para jaulas dobles de acopio.</p>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label>Peso Jaula Doble Promedio (kg)</label>
        <input type="number" id="set-jdd-kg" value="${current.pesoJaulaDoble}" class="form-input" style="width: 100%;" placeholder="Ej: 21500">
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label>Costo por Kilómetro ($/km)</label>
        <input type="number" id="set-jdd-km" value="${current.precioKmDouble}" class="form-input" style="width: 100%;" placeholder="Ej: 3100">
      </div>
    </div>

    <!-- Card 3: Flete Jaula Simple -->
    <div class="glass-card settings-card" style="display: flex; flex-direction: column; padding: 1.5rem; border-radius: 16px;">
      <h4 class="card-title-m3">🚚 Transporte Jaula Simple</h4>
      <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 1rem;">Capacidad y flete estandarizado para jaulas simples de acopio.</p>
      <div class="form-group" style="margin-bottom: 0.75rem;">
        <label>Peso Jaula Simple Promedio (kg)</label>
        <input type="number" id="set-js-kg" value="${current.pesoJaulaSimple}" class="form-input" style="width: 100%;" placeholder="Ej: 15500">
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label>Costo por Kilómetro ($/km)</label>
        <input type="number" id="set-js-km" value="${current.precioKmSimple}" class="form-input" style="width: 100%;" placeholder="Ej: 2500">
      </div>
    </div>
  `;
  wrapper.appendChild(formGrid1);

  // Hook slide event to update percentage label live
  const margenSlider = formGrid1.querySelector('#set-margen');
  const margenBadge = formGrid1.querySelector('#margen-val-badge');
  if (margenSlider && margenBadge) {
    margenSlider.oninput = (e) => {
      margenBadge.textContent = `${e.target.value}%`;
    };
  }

  // Section: Reference Prices
  const sectionTitle2 = el('h3', { 
    classes: ['settings-section-title'], 
    text: '🏷️ Placa & Precios de Compra de Referencia',
    style: 'margin: 2rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;'
  });
  wrapper.appendChild(sectionTitle2);

  const pricePlacardCard = el('div', { 
    classes: ['glass-card', 'settings-card'], 
    style: 'padding: 1.75rem; border-radius: 20px; margin-bottom: 2.5rem;' 
  });
  pricePlacardCard.innerHTML = `
    <div class="price-header-row" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main);">Precios por Categoría ($/kg vivo)</h4>
        <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.8rem;">Establece los precios base para la compra de hacienda. Estos alimentan las cotizaciones sugeridas.</p>
      </div>
      <button id="gen-price-share-btn" class="btn-primary" style="width: auto; padding: 0.65rem 1.5rem; font-size: 0.82rem; margin: 0; display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
        <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor;"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
        <span>📲 Generar Placa de Compartir</span>
      </button>
    </div>
    <div id="category-prices-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.25rem;"></div>
  `;
  wrapper.appendChild(pricePlacardCard);

  /**
   * Helper to populate livestock category pricing input fields dynamically.
   * @param {Object.<string, number|string>} prices - Categories price object.
   */
  const renderPriceInputs = (prices = {}) => {
    const priceGrid = pricePlacardCard.querySelector('#category-prices-grid');
    if (!priceGrid) return;
    const categories = ['NOVILLO', 'VACA', 'VAQUILLONA', 'TORO', 'OTRO', 'ACHURAS'];
    priceGrid.innerHTML = '';
    
    // Category emojis mapping
    const catEmojis = {
      'NOVILLO': '🐂',
      'VACA': '🐄',
      'VAQUILLONA': '🐄',
      'TORO': '🐂',
      'OTRO': '🐂',
      'ACHURAS': '🥩'
    };

    categories.forEach(cat => {
      const fg = el('div', { classes: ['form-group'], style: 'margin: 0; display: flex; flex-direction: column; gap: 0.4rem;' });
      const label = cat === 'ACHURAS' ? 'ACHURAS ($/juego)' : cat;
      const emoji = catEmojis[cat] || '🐂';
      
      fg.innerHTML = `
        <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
          <span>${emoji}</span> ${label}
        </label>
        <div class="input-with-symbol" style="position: relative; display: flex; align-items: center;">
          <span style="position: absolute; left: 0.85rem; color: var(--text-muted); font-size: 0.9rem; font-weight: 500;">$</span>
          <input type="number" class="cat-price-input form-input" data-cat="${cat}" value="${prices[cat] || ''}" placeholder="Cargar..." style="padding-left: 1.75rem; width: 100%;">
        </div>
      `;
      priceGrid.appendChild(fg);
    });
  };

  // Section: Cameras Management
  const sectionTitle3 = el('h3', { 
    classes: ['settings-section-title'], 
    text: '❄️ Logística de Acopio & Cámaras',
    style: 'margin: 2rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;'
  });
  wrapper.appendChild(sectionTitle3);

  const camerasContainer = el('div', { 
    classes: ['glass-card', 'settings-card'], 
    style: 'padding: 2rem; border-radius: 20px; margin-bottom: 2.5rem;' 
  });
  camerasContainer.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1.35fr; gap: 2.5rem; flex-wrap: wrap;">
       <div id="settings-camara-form" style="border-right: 1px solid var(--border); padding-right: 2.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
          <div>
            <h4 id="camara-form-title" style="margin: 0 0 0.25rem 0; font-size: 1.05rem; font-weight: 600; color: var(--text-main);">Añadir Nueva Cámara</h4>
            <p style="margin: 0; font-size: 0.78rem; color: var(--text-muted);">Configura cámaras de frío para registrar stock colgado.</p>
          </div>
          <input type="hidden" id="camara-old-name">
          <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Nombre de la Cámara</label>
            <input type="text" id="camara-name" class="form-input" placeholder="Ej: Cámara de Terneras" style="width: 100%;">
          </div>
          <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Capacidad Máxima (Medias Reses)</label>
            <input type="number" id="camara-capacity" class="form-input" placeholder="Ej: 80" min="1" style="width: 100%;">
          </div>
          <div style="display: flex; gap: 0.75rem; margin-top: 0.75rem;">
             <button id="clear-camara-btn" class="btn-outline" style="flex: 1; padding: 0.65rem; border-radius: 8px;">Limpiar</button>
             <button id="save-camara-btn" class="btn-primary" style="flex: 2; margin: 0; padding: 0.65rem; border-radius: 8px; font-weight: 600;">Guardar Cámara</button>
          </div>
       </div>
       <div id="settings-camaras-list-container">
          <h4 style="margin: 0 0 1rem 0; font-size: 1.05rem; font-weight: 600; color: var(--text-main);">Cámaras de Frío Configuradas</h4>
          <div id="settings-camaras-list" class="card-list" style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.85rem; padding-right: 0.5rem;"></div>
       </div>
    </div>
  `;
  wrapper.appendChild(camerasContainer);

  let localCamaras = [...(options.camarasList || [])];

  /**
   * Renders the cold storage cameras list inside the configured panel.
   */
  const renderCamarasList = () => {
    const listEl = camerasContainer.querySelector('#settings-camaras-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (localCamaras.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 3rem 1.5rem; text-align: center; color: var(--text-muted); background: rgba(0, 0, 0, 0.08); border-radius: 12px; border: 1px dashed var(--border);">
          <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">❄️</span>
          <span>No hay cámaras de acopio configuradas.</span>
        </div>
      `;
      return;
    }

    localCamaras.forEach(c => {
      const card = el('div', { 
        classes: ['camera-item-card', 'glass-card'], 
        style: 'padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; border-radius: 12px; border: 1px solid var(--border);' 
      });
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="camera-icon-badge" style="width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.15); color: #3b82f6; font-size: 1.15rem;">❄️</div>
          <div>
            <h4 style="margin: 0 0 0.2rem 0; font-size: 0.95rem; font-weight: 600; color: var(--text-main);">${c.name}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem;">
              Capacidad: <strong>${c.capacity || 0}</strong> medias reses
            </span>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-outline edit-camara-btn icon-btn" data-name="${c.name}" title="Editar Cámara" style="padding: 0.4rem 0.75rem; font-size: 0.78rem; border-radius: 8px;">✏️ Editar</button>
          <button class="btn-outline delete-camara-btn icon-btn delete-btn" data-name="${c.name}" title="Eliminar Cámara" style="padding: 0.4rem 0.75rem; font-size: 0.78rem; color: var(--danger); border-color: var(--danger); border-radius: 8px;">🗑️ Eliminar</button>
        </div>
      `;
      listEl.appendChild(card);
    });

    listEl.querySelectorAll('.edit-camara-btn').forEach(btn => {
      btn.onclick = () => {
        const c = localCamaras.find(x => x.name === btn.dataset.name);
        if (c) {
          camerasContainer.querySelector('#camara-old-name').value = c.name;
          camerasContainer.querySelector('#camara-name').value = c.name;
          camerasContainer.querySelector('#camara-capacity').value = c.capacity;
          camerasContainer.querySelector('#camara-form-title').textContent = '✏️ Editar Cámara: ' + c.name;
          camerasContainer.querySelector('#camara-name').focus();
        }
      };
    });

    listEl.querySelectorAll('.delete-camara-btn').forEach(btn => {
      btn.onclick = async () => {
        if (confirm(`¿Estás seguro de eliminar la cámara "${btn.dataset.name}"?`)) {
          localCamaras = localCamaras.filter(x => x.name !== btn.dataset.name);
          if (options.onSaveCamaras) {
            await options.onSaveCamaras(localCamaras);
            renderCamarasList();
            showMsg('Cámara eliminada correctamente.');
          }
        }
      };
    });
  };

  /**
   * Cleans the camera setup form elements.
   */
  const clearCamaraForm = () => {
    camerasContainer.querySelector('#camara-old-name').value = '';
    camerasContainer.querySelector('#camara-name').value = '';
    camerasContainer.querySelector('#camara-capacity').value = '';
    camerasContainer.querySelector('#camara-form-title').textContent = 'Añadir Nueva Cámara';
  };

  // Initial populate
  if (options && options.categoryPrices) {
    renderPriceInputs(options.categoryPrices);
  } else {
    renderPriceInputs({});
  }

  renderCamarasList();

  // Section: RBAC (Admin Only)
  const rbacPlaceholder = el('div', { attrs: { id: 'settings-rbac-section' } });
  wrapper.appendChild(rbacPlaceholder);

  if (options && options.userRole === 'ADMIN') {
    const rbacEl = wrapper.querySelector('#settings-rbac-section');
    if (rbacEl) {
      const SYSTEM_SECTIONS = [
        { id: 'travels', name: 'Viajes' },
        { id: 'consumption', name: 'Despacho y Stock' },
        { id: 'clients', name: 'Clientes y Cuentas' },
        { id: 'daily-cash-closings', name: 'Cierres de Sucursales' },
        { id: 'fiscal-invoices', name: 'Comprobantes ARCA' },
        { id: 'checks', name: 'Gestión de Cheques' },
        { id: 'accounting', name: 'Caja General' },
        { id: 'frigorifico', name: 'Caja Frigorífico' },
        { id: 'establishments', name: 'Establecimientos' },
        { id: 'master-data', name: 'Logística' },
        { id: 'logistics-liquidations', name: 'Liquidaciones Fletes' },
        { id: 'logistics-fuel', name: 'Rendimiento Combustible' },
        { id: 'branch-pricing', name: 'Precios & Cartel QR' },
        { id: 'simulator', name: 'Simulador' },
        { id: 'settings', name: 'Configuración' }
      ];

      const defaultViewsForRole = (role) => {
        if (role === 'ADMIN') {
          return ['travels', 'dashboard', 'consumption', 'clients', 'simulator', 'checks', 'accounting', 'frigorifico', 'settings', 'price-share', 'branch-pricing', 'contact', 'logout', 'master-data', 'logistics-liquidations', 'logistics-fuel', 'establishments', 'fiscal-invoices', 'daily-cash-closings'];
        } else if (role === 'OPERARIO') {
          return ['travels', 'dashboard', 'consumption', 'clients', 'simulator', 'checks', 'accounting', 'price-share', 'branch-pricing', 'contact', 'logout', 'logistics-liquidations', 'logistics-fuel', 'fiscal-invoices', 'daily-cash-closings'];
        } else {
          return ['dashboard', 'simulator', 'price-share', 'contact', 'logout'];
        }
      };

      rbacEl.innerHTML = `
        <h3 class="settings-section-title" style="margin: 2rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;">🔐 Accesos & Gestión de Permisos</h3>
        
        <!-- Card: Credencial Institucional (Paso 1 del Portal Web) -->
        <div class="glass-card settings-card" style="padding: 1.75rem 2rem; border-radius: 20px; margin-bottom: 2rem; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
            <div>
              <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
                <span>🛡️</span> Credencial Institucional (Paso 1 - Portal Web)
              </h4>
              <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.82rem;">
                Usuario y clave corporativa requerida como primer filtro en la pantalla de bienvenida antes de habilitar la autenticación con Google.
              </p>
            </div>
            <div style="background: rgba(143, 0, 20, 0.08); border: 1px solid rgba(143, 0, 20, 0.2); padding: 0.35rem 0.8rem; border-radius: 8px; font-size: 0.8rem; color: var(--primary); font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
              <span>Usuario actual:</span>
              <span id="current-gatekeeper-user-display" style="font-family: monospace; font-size: 0.9rem;">${options.securityConfig?.gatekeeperUser || 'pampa'}</span>
            </div>
          </div>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
            <div style="flex: 1; min-width: 180px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">Usuario Institucional</label>
              <input type="text" id="new-gatekeeper-user-input" class="form-input" value="${options.securityConfig?.gatekeeperUser || 'pampa'}" placeholder="Ej: pampa" style="width: 100%; border-radius: 10px; padding: 0.6rem 0.8rem;" autocomplete="off">
            </div>
            <div style="flex: 1; min-width: 180px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">Nueva Contraseña</label>
              <input type="password" id="new-gatekeeper-pass-input" class="form-input" placeholder="Nueva clave de acceso" style="width: 100%; border-radius: 10px; padding: 0.6rem 0.8rem;" autocomplete="new-password">
            </div>
            <div style="flex: 1; min-width: 180px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">Confirmar Contraseña</label>
              <input type="password" id="confirm-gatekeeper-pass-input" class="form-input" placeholder="Repite la clave" style="width: 100%; border-radius: 10px; padding: 0.6rem 0.8rem;" autocomplete="new-password">
            </div>
            <button id="save-gatekeeper-btn" class="btn-primary" style="padding: 0.65rem 1.5rem; margin: 0; font-size: 0.85rem; border-radius: 10px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; height: 42px;">
              <span>💾 Actualizar Credencial</span>
            </button>
          </div>
        </div>

        <!-- Card: Contraseña Maestra (PIN de Fábrica) -->
        <div class="glass-card settings-card" style="padding: 1.75rem 2rem; border-radius: 20px; margin-bottom: 2rem; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
            <div>
              <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
                <span>🔑</span> Contraseña Maestra de Seguridad (PIN de Fábrica)
              </h4>
              <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.82rem;">
                Clave de supervisor requerida en terminales de caja y fábrica para autorizar acciones críticas (desbloquear ajustes, anular ventas, ver caja esperada y eliminar cuentas).
              </p>
            </div>
            <div style="background: rgba(143, 0, 20, 0.08); border: 1px solid rgba(143, 0, 20, 0.2); padding: 0.35rem 0.8rem; border-radius: 8px; font-size: 0.8rem; color: var(--primary); font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
              <span>PIN actual:</span>
              <span id="current-pin-display" style="letter-spacing: 2px; font-family: monospace; font-size: 0.9rem;">••••••</span>
              <button id="toggle-view-pin-btn" type="button" style="background: none; border: none; cursor: pointer; color: var(--primary); font-size: 0.9rem; padding: 0 0.2rem;" title="Mostrar/Ocultar PIN">👁️</button>
            </div>
          </div>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
            <div style="flex: 1; min-width: 200px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">Nueva Contraseña Maestra / PIN</label>
              <input type="password" id="new-master-pin-input" class="form-input" placeholder="Ej: 180283" style="width: 100%; border-radius: 10px; padding: 0.6rem 0.8rem;" autocomplete="new-password">
            </div>
            <div style="flex: 1; min-width: 200px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">Confirmar Nueva Contraseña</label>
              <input type="password" id="confirm-master-pin-input" class="form-input" placeholder="Repite la clave maestra" style="width: 100%; border-radius: 10px; padding: 0.6rem 0.8rem;" autocomplete="new-password">
            </div>
            <button id="save-master-pin-btn" class="btn-primary" style="padding: 0.65rem 1.75rem; margin: 0; font-size: 0.85rem; border-radius: 10px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; height: 42px;">
              <span>💾 Actualizar PIN Maestro</span>
            </button>
          </div>
        </div>

        <div class="glass-card settings-card" style="padding: 2rem; border-radius: 20px; margin-bottom: 2.5rem;">
          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-main);">Gestión de Usuarios Activos</h4>
            <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.8rem;">Supervisa la nómina de personal que ingresa al sistema y administra sus roles y permisos de acceso (RBAC).</p>
          </div>
          <div id="rbac-list" class="card-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.25rem;"></div>
        </div>
      `;
      
      const rbacListEl = rbacEl.querySelector('#rbac-list');
      const users = options.usersList || [];
      
      if (users.length === 0) {
        rbacListEl.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 2.5rem; color: var(--text-muted); text-align: center; border: 1px dashed var(--border); border-radius: 12px; background: rgba(0,0,0,0.05);">
            No hay usuarios registrados en el sistema.
          </div>
        `;
      } else {
        users.forEach(u => {
          const card = el('div', { 
            classes: ['rbac-user-card', 'glass-card'], 
            style: 'padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1.25rem; border-radius: 14px; border: 1px solid var(--border);' 
          });

          const isSelf = u.uid === options.currentUserUid;
          const isSuperAdmin = u.uid === 'iqy12KgqiDU0Z1QwwbqRSqvSpCM2';

          const initials = String(u.email || u.uid || 'U').substring(0, 2).toUpperCase();

          const deleteBtnHtml = (isSelf || isSuperAdmin) ? `
            <span style="font-size: 0.72rem; color: var(--text-muted); background: rgba(255,255,255,0.04); padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 600; border: 1px solid var(--border); user-select: none;">
              ${isSuperAdmin ? '🛡️ Super-Admin' : '👤 Tú'}
            </span>
          ` : `
            <button class="btn-outline btn-delete-user icon-btn delete-btn" data-uid="${u.uid}" data-email="${u.email}" title="Eliminar Usuario" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; color: var(--danger); border-color: var(--danger); border-radius: 8px; background: transparent; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              🗑️
            </button>
          `;

          const selectAttrs = (isSuperAdmin || (isSelf && u.role === 'ADMIN')) ? 'disabled title="No puedes cambiar tu propio rol de administrador o modificar el del Super-Admin"' : '';
          const checkboxAttrs = isSuperAdmin ? 'disabled' : '';
          const saveBtnAttrs = isSuperAdmin ? 'disabled style="opacity: 0.5; cursor: not-allowed;" title="El rol del Super-Admin no se puede modificar"' : '';

          card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.85rem; justify-content: space-between; width: 100%;">
              <div style="display: flex; align-items: center; gap: 0.85rem; flex: 1; min-width: 0;">
                <div class="user-avatar-circle" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(143, 0, 20, 0.08); border: 1.5px solid rgba(143, 0, 20, 0.2); color: var(--primary); font-weight: 700; font-size: 0.9rem; flex-shrink: 0;">
                  ${initials}
                </div>
                <div style="flex: 1; text-align: left; overflow: hidden;">
                  <h4 style="margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${u.email || u.uid}">${u.email || u.uid}</h4>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">Registrado: ${u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-AR') : 'N/A'}</span>
                </div>
              </div>
              ${deleteBtnHtml}
            </div>
            
            <details style="border-top: 1px dashed var(--border); padding-top: 0.75rem;">
              <summary style="font-size: 0.8rem; font-weight: 600; color: var(--primary); cursor: pointer; user-select: none;">
                🔑 Configurar Secciones Permitidas
              </summary>
              <div class="sections-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; padding-top: 0.5rem; max-height: 150px; overflow-y: auto;">
                ${SYSTEM_SECTIONS.map(s => {
                  const hasView = (u.allowedViews && u.allowedViews.includes(s.id)) || (!u.allowedViews && defaultViewsForRole(u.role).includes(s.id));
                  return `
                    <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: var(--text-muted); cursor: pointer; user-select: none;">
                      <input type="checkbox" class="section-check" data-uid="${u.uid}" data-view="${s.id}" ${hasView ? 'checked' : ''} ${checkboxAttrs} style="cursor: pointer;">
                      ${s.name}
                    </label>
                  `;
                }).join('')}
              </div>
            </details>

            <div style="display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem; justify-content: space-between;">
              <select class="form-input rbac-select" data-uid="${u.uid}" ${selectAttrs} style="padding: 0.45rem 1rem 0.45rem 0.5rem; font-size: 0.8rem; border-radius: 8px; flex: 1;">
                <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>Administrador (Full)</option>
                <option value="OPERARIO" ${u.role === 'OPERARIO' ? 'selected' : ''}>Operario (Edición)</option>
                <option value="VISOR" ${u.role === 'VISOR' ? 'selected' : ''}>Solo Lectura (Visor)</option>
              </select>
              <button class="btn-primary btn-save-role" data-uid="${u.uid}" data-email="${u.email}" ${saveBtnAttrs} style="padding: 0.5rem 1rem; font-size: 0.8rem; margin: 0; border-radius: 8px; font-weight: 600;">Actualizar</button>
            </div>
          `;
          rbacListEl.appendChild(card);
        });

        // Evento para actualizar checkboxes por defecto al cambiar de rol
        rbacListEl.querySelectorAll('.rbac-select').forEach(select => {
          select.onchange = () => {
            const uid = select.dataset.uid;
            const role = select.value;
            const checks = rbacListEl.querySelectorAll(`.section-check[data-uid="${uid}"]`);
            const defaultViews = defaultViewsForRole(role);
            checks.forEach(chk => {
              const viewId = chk.dataset.view;
              chk.checked = defaultViews.includes(viewId);
            });
          };
        });

        rbacListEl.querySelectorAll('.btn-save-role').forEach(btn => {
          btn.onclick = async () => {
            const uid = btn.dataset.uid;
            const email = btn.dataset.email;
            const select = rbacListEl.querySelector(`.rbac-select[data-uid="${uid}"]`);
            const newRole = select.value;

            // Recopilar vistas permitidas marcadas
            const checkedBoxes = rbacListEl.querySelectorAll(`.section-check[data-uid="${uid}"]:checked`);
            const allowedViews = Array.from(checkedBoxes).map(chk => chk.dataset.view);

            btn.textContent = '...';
            btn.disabled = true;
            if (options.onSaveUserRole) {
              await options.onSaveUserRole(uid, newRole, allowedViews);
              showMsg(`Rol y secciones de ${email || 'usuario'} actualizados.`);
            }
            btn.textContent = 'Actualizar';
            btn.disabled = false;
          };
        });

        rbacListEl.querySelectorAll('.btn-delete-user').forEach(btn => {
          btn.onclick = () => {
            const uid = btn.dataset.uid;
            const email = btn.dataset.email || 'usuario';
            showConfirmDeleteUserModal(email, async () => {
              btn.disabled = true;
              btn.textContent = '...';
              try {
                if (options.onDeleteUser) {
                  await options.onDeleteUser(uid);
                  showMsg(`Usuario ${email} eliminado correctamente.`);
                }
              } catch (e) {
                console.error("Error deleting user metadata:", e);
                showMsg('Error al eliminar usuario: ' + e.message, true);
                btn.disabled = false;
                btn.textContent = '🗑️';
              }
            });
          };
        });
      }

      // Eventos para la gestión de Contraseña Maestra (PIN)
      let pinRevealed = false;
      let activePin = options.currentMasterPin || '180283';
      const pinDisplay = rbacEl.querySelector('#current-pin-display');
      const togglePinBtn = rbacEl.querySelector('#toggle-view-pin-btn');
      const newPinInput = rbacEl.querySelector('#new-master-pin-input');
      const confirmPinInput = rbacEl.querySelector('#confirm-master-pin-input');
      const savePinBtn = rbacEl.querySelector('#save-master-pin-btn');

      if (togglePinBtn && pinDisplay) {
        togglePinBtn.onclick = () => {
          pinRevealed = !pinRevealed;
          pinDisplay.textContent = pinRevealed ? activePin : '••••••';
          togglePinBtn.textContent = pinRevealed ? '🙈' : '👁️';
        };
      }

      if (savePinBtn) {
        savePinBtn.onclick = async () => {
          const newPin = (newPinInput.value || '').trim();
          const confirmPin = (confirmPinInput.value || '').trim();

          if (!newPin) {
            showMsg('Debes ingresar un nuevo PIN maestro.', true);
            newPinInput.focus();
            return;
          }
          if (newPin.length < 4) {
            showMsg('El PIN debe tener al menos 4 caracteres.', true);
            newPinInput.focus();
            return;
          }
          if (newPin !== confirmPin) {
            showMsg('La confirmación no coincide con el nuevo PIN.', true);
            confirmPinInput.focus();
            return;
          }

          savePinBtn.disabled = true;
          savePinBtn.textContent = 'Actualizando...';
          try {
            if (options.onSaveMasterPin) {
              await options.onSaveMasterPin(newPin);
              activePin = newPin;
              showMsg('Contraseña maestra actualizada con éxito. Se sincronizará con las terminales.');
              newPinInput.value = '';
              confirmPinInput.value = '';
              if (pinDisplay) {
                pinDisplay.textContent = pinRevealed ? newPin : '••••••';
              }
            }
          } catch (e) {
            showMsg('Error al guardar PIN maestro: ' + e.message, true);
          } finally {
            savePinBtn.disabled = false;
            savePinBtn.innerHTML = '<span>💾 Actualizar PIN Maestro</span>';
          }
        };
      }

      // Eventos para la gestión de Credenciales Institucionales (Gatekeeper - Paso 1)
      const saveGatekeeperBtn = rbacEl.querySelector('#save-gatekeeper-btn');
      const gatekeeperUserInput = rbacEl.querySelector('#new-gatekeeper-user-input');
      const gatekeeperPassInput = rbacEl.querySelector('#new-gatekeeper-pass-input');
      const gatekeeperPassConfirm = rbacEl.querySelector('#confirm-gatekeeper-pass-input');
      const gatekeeperUserDisplay = rbacEl.querySelector('#current-gatekeeper-user-display');

      if (saveGatekeeperBtn) {
        saveGatekeeperBtn.onclick = async () => {
          const userVal = (gatekeeperUserInput.value || '').trim();
          const passVal = (gatekeeperPassInput.value || '').trim();
          const confirmVal = (gatekeeperPassConfirm.value || '').trim();

          if (!userVal) {
            showMsg('Debes ingresar un usuario institucional.', true);
            gatekeeperUserInput.focus();
            return;
          }
          if (!passVal) {
            showMsg('Debes ingresar la nueva contraseña institucional.', true);
            gatekeeperPassInput.focus();
            return;
          }
          if (passVal.length < 4) {
            showMsg('La contraseña debe tener al menos 4 caracteres.', true);
            gatekeeperPassInput.focus();
            return;
          }
          if (passVal !== confirmVal) {
            showMsg('La confirmación de contraseña no coincide.', true);
            gatekeeperPassConfirm.focus();
            return;
          }

          saveGatekeeperBtn.disabled = true;
          saveGatekeeperBtn.textContent = 'Actualizando...';
          try {
            if (options.onSaveGatekeeperCredentials) {
              await options.onSaveGatekeeperCredentials(userVal, passVal);
              showMsg('Credenciales institucionales actualizadas con éxito.');
              gatekeeperPassInput.value = '';
              gatekeeperPassConfirm.value = '';
              if (gatekeeperUserDisplay) gatekeeperUserDisplay.textContent = userVal;
            }
          } catch (e) {
            showMsg('Error al guardar credenciales: ' + e.message, true);
          } finally {
            saveGatekeeperBtn.disabled = false;
            saveGatekeeperBtn.innerHTML = '<span>💾 Actualizar Credencial</span>';
          }
        };
      }
    }

    // Sección: Portada Institucional, Sucursales & Horarios (Admin Only)
    const brandingSection = el('div', { attrs: { id: 'settings-branding-section' } });
    wrapper.appendChild(brandingSection);

    const compConfig = options.companyConfig || {
      companyName: 'Frigorífico Pampa',
      slogan: 'Calidad, Trazabilidad y Excelencia en la Industria Cárnica',
      description: 'Instalaciones de faena, desposte y logística frigorífica con los más altos estándares sanitarios y tecnológicos.',
      branches: []
    };

    let branchesList = Array.isArray(compConfig.branches) ? compConfig.branches.map(b => ({ ...b })) : [];

    const escapeAttr = (str) => String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const syncBranchesFromDom = () => {
      const branchCards = brandingSection.querySelectorAll('#admin-branches-list > div[data-index]');
      branchCards.forEach((card) => {
        const idx = parseInt(card.dataset.index, 10);
        if (!Number.isNaN(idx) && branchesList[idx]) {
          branchesList[idx].name = card.querySelector('.branch-input-name')?.value.trim() || '';
          branchesList[idx].address = card.querySelector('.branch-input-address')?.value.trim() || '';
          branchesList[idx].phone = card.querySelector('.branch-input-phone')?.value.trim() || '';
          branchesList[idx].email = card.querySelector('.branch-input-email')?.value.trim() || '';
          branchesList[idx].hours = card.querySelector('.branch-input-hours')?.value.trim() || '';
        }
      });
    };

    const renderBranchesAdmin = () => {
      const branchesContainer = brandingSection.querySelector('#admin-branches-list');
      if (!branchesContainer) return;
      
      if (branchesList.length === 0) {
        branchesContainer.innerHTML = `
          <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 12px;">
            No hay sucursales registradas. Pulsa en "➕ Agregar Sucursal" para crear una.
          </div>
        `;
        return;
      }

      branchesContainer.innerHTML = branchesList.map((b, idx) => `
        <div class="glass-card" style="padding: 1.25rem; border-radius: 14px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.85rem;" data-index="${idx}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--primary); font-size: 0.95rem;">🏢 Sucursal #${idx + 1}</strong>
            <button type="button" class="btn-remove-branch" data-index="${idx}" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem; font-weight: 600;" title="Eliminar Sucursal">🗑️ Eliminar</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
            <div>
              <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Nombre de Planta / Sucursal</label>
              <input type="text" class="form-input branch-input-name" value="${escapeAttr(b.name || '')}" placeholder="Ej: Planta Central" style="width: 100%; border-radius: 8px; padding: 0.5rem 0.75rem;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Dirección Física</label>
              <input type="text" class="form-input branch-input-address" value="${escapeAttr(b.address || '')}" placeholder="Ej: Ruta 5 Km 600, La Pampa" style="width: 100%; border-radius: 8px; padding: 0.5rem 0.75rem;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Teléfono de Contacto</label>
              <input type="text" class="form-input branch-input-phone" value="${escapeAttr(b.phone || '')}" placeholder="Ej: +54 9 2954 123456" style="width: 100%; border-radius: 8px; padding: 0.5rem 0.75rem;">
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Email de Contacto</label>
              <input type="email" class="form-input branch-input-email" value="${escapeAttr(b.email || '')}" placeholder="Ej: contacto@frigorificopampa.tech" style="width: 100%; border-radius: 8px; padding: 0.5rem 0.75rem;">
            </div>
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Horarios de Atención</label>
            <input type="text" class="form-input branch-input-hours" value="${escapeAttr(b.hours || '')}" placeholder="Ej: Lunes a Viernes 06:00 a 16:00 hs — Sábados 07:00 a 12:00 hs" style="width: 100%; border-radius: 8px; padding: 0.5rem 0.75rem;">
          </div>
        </div>
      `).join('');

      branchesContainer.querySelectorAll('.btn-remove-branch').forEach(btn => {
        btn.onclick = () => {
          syncBranchesFromDom();
          const index = parseInt(btn.dataset.index, 10);
          branchesList.splice(index, 1);
          renderBranchesAdmin();
        };
      });
    };

    brandingSection.innerHTML = `
      <h3 class="settings-section-title" style="margin: 2.5rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;">🏢 Portada Institucional, Sucursales & Horarios</h3>
      <div class="glass-card settings-card" style="padding: 2rem; border-radius: 20px; margin-bottom: 2.5rem; border: 1px solid var(--border);">
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">
          Personaliza la información que se muestra en la pantalla de bienvenida pública (antes del inicio de sesión) para visitantes, clientes y transportistas.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">Nombre de la Empresa</label>
            <input type="text" id="branding-company-name" class="form-input" value="${escapeAttr(compConfig.companyName || 'Frigorífico Pampa')}" style="width: 100%; border-radius: 10px; padding: 0.6rem 0.8rem;">
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">Eslogan Institucional</label>
            <input type="text" id="branding-slogan" class="form-input" value="${escapeAttr(compConfig.slogan || '')}" placeholder="Ej: Calidad y Trazabilidad Cárnica" style="width: 100%; border-radius: 10px; padding: 0.6rem 0.8rem;">
          </div>
        </div>

        <div style="margin-bottom: 2rem;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">Descripción Institucional</label>
          <textarea id="branding-desc" class="form-input" rows="3" style="width: 100%; border-radius: 10px; padding: 0.6rem 0.8rem; resize: vertical;">${escapeAttr(compConfig.description || '')}</textarea>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-top: 1px solid var(--border); padding-top: 1.25rem;">
          <h4 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-main);">Listado de Sucursales y Plantas</h4>
          <button type="button" id="btn-add-branch" class="btn-outline" style="padding: 0.4rem 0.9rem; font-size: 0.82rem; border-radius: 8px; cursor: pointer;">
            ➕ Agregar Sucursal
          </button>
        </div>

        <div id="admin-branches-list" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;"></div>

        <button id="save-branding-btn" class="btn-primary" style="padding: 0.75rem 2rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <span>💾 Guardar Portada & Sucursales</span>
        </button>
      </div>
    `;

    renderBranchesAdmin();

    const addBranchBtn = brandingSection.querySelector('#btn-add-branch');
    if (addBranchBtn) {
      addBranchBtn.onclick = () => {
        syncBranchesFromDom();
        branchesList.push({
          id: 'branch_' + Date.now(),
          name: '',
          address: '',
          phone: '',
          email: '',
          hours: 'Lunes a Viernes: 07:00 a 16:00 hs'
        });
        renderBranchesAdmin();
      };
    }

    const saveBrandingBtn = brandingSection.querySelector('#save-branding-btn');
    if (saveBrandingBtn) {
      saveBrandingBtn.onclick = async () => {
        const branchCards = brandingSection.querySelectorAll('#admin-branches-list > div');
        const updatedBranches = [];
        branchCards.forEach((card, idx) => {
          const name = card.querySelector('.branch-input-name')?.value.trim() || '';
          const address = card.querySelector('.branch-input-address')?.value.trim() || '';
          const phone = card.querySelector('.branch-input-phone')?.value.trim() || '';
          const email = card.querySelector('.branch-input-email')?.value.trim() || '';
          const hours = card.querySelector('.branch-input-hours')?.value.trim() || '';
          if (name || address) {
            updatedBranches.push({
              id: branchesList[idx]?.id || 'branch_' + Date.now() + '_' + idx,
              name,
              address,
              phone,
              email,
              hours
            });
          }
        });

        const nameInput = brandingSection.querySelector('#branding-company-name');
        const sloganInput = brandingSection.querySelector('#branding-slogan');
        const descInput = brandingSection.querySelector('#branding-desc');

        const newBranding = {
          companyName: (nameInput.value || '').trim() || 'Frigorífico Pampa',
          slogan: (sloganInput.value || '').trim(),
          description: (descInput.value || '').trim(),
          branches: updatedBranches
        };

        saveBrandingBtn.disabled = true;
        saveBrandingBtn.textContent = 'Guardando...';
        try {
          if (options.onSaveCompanyConfig) {
            await options.onSaveCompanyConfig(newBranding);
            branchesList = updatedBranches;
            showMsg('Portada institucional y sucursales actualizadas con éxito.');
          }
        } catch (e) {
          showMsg('Error al guardar datos de portada: ' + e.message, true);
        } finally {
          saveBrandingBtn.disabled = false;
          saveBrandingBtn.innerHTML = '<span>💾 Guardar Portada & Sucursales</span>';
        }
      };
    }
  }

  // Global Actions panel
  const actionsRow = el('div', { 
    classes: ['settings-actions-row'], 
    style: 'display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; padding-bottom: 4rem; border-top: 1px solid var(--border); padding-top: 1.5rem;' 
  });
  actionsRow.innerHTML = `
    <button id="reset-settings" class="btn-outline" style="padding: 0.85rem 2rem; font-weight: 700; border-radius: 12px; font-size: 0.9rem; border-width: 1.5px;">Restaurar Predeterminados</button>
    <button id="save-settings" class="btn-primary" style="padding: 0.85rem 3.5rem; margin: 0; font-size: 0.9rem; font-weight: 700; border-radius: 12px; display: flex; align-items: center; gap: 0.5rem;">
      <span>💾 Guardar Cambios Globales</span>
    </button>
  `;
  wrapper.appendChild(actionsRow);

  // --- INTERACTION & CLICK LISTENERS ---
  const shareBtn = pricePlacardCard.querySelector('#gen-price-share-btn');
  if (shareBtn) shareBtn.onclick = options.onPriceShare;

  camerasContainer.querySelector('#clear-camara-btn').onclick = clearCamaraForm;

  camerasContainer.querySelector('#save-camara-btn').onclick = async () => {
    const oldName = camerasContainer.querySelector('#camara-old-name').value;
    const name = camerasContainer.querySelector('#camara-name').value.trim();
    const capacity = parseInt(camerasContainer.querySelector('#camara-capacity').value, 10) || 0;

    if (!name) return alert('El nombre de la cámara es obligatorio.');
    if (capacity <= 0) return alert('La capacidad debe ser un número mayor a 0.');

    const newCamara = { name, capacity };
    
    if (oldName) {
      // Edit
      localCamaras = localCamaras.map(c => c.name === oldName ? newCamara : c);
    } else {
      // Add
      if (localCamaras.some(c => c.name === name)) {
        return alert('Ya existe una cámara con ese nombre.');
      }
      localCamaras.push(newCamara);
    }

    const btn = camerasContainer.querySelector('#save-camara-btn');
    btn.textContent = 'Guardando...';
    btn.disabled = true;

    try {
      if (options.onSaveCamaras) {
        await options.onSaveCamaras(localCamaras);
        showMsg('Cámara guardada exitosamente.');
        clearCamaraForm();
        renderCamarasList();
      }
    } catch (e) {
      console.error(e);
      showMsg('Error al guardar cámara: ' + e.message, true);
    } finally {
      btn.textContent = 'Guardar Cámara';
      btn.disabled = false;
    }
  };

  actionsRow.querySelector('#save-settings').onclick = async () => {
    const btn = actionsRow.querySelector('#save-settings');
    btn.disabled = true;
    btn.innerHTML = `<span class="mini-spinner"></span> <span>Guardando Cambios...</span>`;
    
    try {
      const newSettings = {
        margenGanancia: 1 + (parseFloat(formGrid1.querySelector('#set-margen').value) / 100),
        pesoJaulaDoble: parseFloat(formGrid1.querySelector('#set-jdd-kg').value) || 0,
        precioKmDouble: parseFloat(formGrid1.querySelector('#set-jdd-km').value) || 0,
        pesoJaulaSimple: parseFloat(formGrid1.querySelector('#set-js-kg').value) || 0,
        precioKmSimple: parseFloat(formGrid1.querySelector('#set-js-km').value) || 0,
      };
      
      const prices = {};
      pricePlacardCard.querySelectorAll('.cat-price-input').forEach(input => {
        prices[input.dataset.cat] = parseFloat(input.value) || 0;
      });

      if (SettingsService.saveSettings(newSettings)) {
        if (options && options.onSavePrices) {
          try {
            await options.onSavePrices(prices);
          } catch (e) {
            console.error("Error saving prices to Firebase:", e);
            throw new Error(`Error al guardar precios en la nube: ${e.message}`);
          }
        }
        if (options && options.onSaveCamaras) {
          try {
            await options.onSaveCamaras(localCamaras);
          } catch (e) {
            console.error("Error during global cameras sync:", e);
          }
        }
        showMsg('¡Configuración de precios, cámaras y general guardada exitosamente!');
      } else {
        showMsg('Hubo un error al guardar localmente.', true);
      }
    } catch (e) {
      console.error("Error al guardar: ", e);
      showMsg(e.message || 'Hubo un error al guardar. Ver consola.', true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>💾 Guardar Cambios Globales</span>';
    }
  };

  actionsRow.querySelector('#reset-settings').onclick = () => {
    const defaults = SettingsService.getDefaults();
    formGrid1.querySelector('#set-margen').value = ((defaults.margenGanancia - 1) * 100).toFixed(0);
    formGrid1.querySelector('#margen-val-badge').textContent = `${((defaults.margenGanancia - 1) * 100).toFixed(0)}%`;
    formGrid1.querySelector('#set-jdd-kg').value = defaults.pesoJaulaDoble;
    formGrid1.querySelector('#set-jdd-km').value = defaults.precioKmDouble;
    formGrid1.querySelector('#set-js-kg').value = defaults.pesoJaulaSimple;
    formGrid1.querySelector('#set-js-km').value = defaults.precioKmSimple;
    
    SettingsService.saveSettings(defaults);
    showMsg('¡Restaurado a los valores originales!');
  };

  // Section: Registro de Sincronización (Dexie.js Logs)
  const sectionTitleSync = el('h3', { 
    classes: ['settings-section-title'], 
    text: '🔄 Historial de Sincronización Local',
    style: 'margin: 2.5rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;'
  });
  wrapper.appendChild(sectionTitleSync);

  const syncCard = el('div', {
    classes: ['glass-card'],
    style: 'padding: 1.5rem; border-radius: 16px; margin-bottom: 2.5rem; display: flex; flex-direction: column; gap: 1rem;'
  });
  
  syncCard.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
      <span style="font-weight: 600; color: var(--text-main);">Estado de Base de Datos y Logs</span>
      <div style="display: flex; gap: 0.5rem;">
        <button id="force-sync-btn" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin: 0; background: var(--primary);">Sincronizar Ahora</button>
        <button id="clear-logs-btn" class="btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-color: var(--border);">Limpiar Logs</button>
      </div>
    </div>
    <div id="sync-logs-list" style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; font-family: monospace; font-size: 0.8rem; padding-right: 0.5rem;">
      <div style="color: var(--text-muted); text-align: center; padding: 1rem;">Cargando registros...</div>
    </div>
  `;
  wrapper.appendChild(syncCard);

  const loadSyncLogs = async () => {
    const logsList = syncCard.querySelector('#sync-logs-list');
    if (!logsList) return;
    
    try {
      const logs = await SyncService.getSyncLogs();
      if (logs.length === 0) {
        logsList.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 1rem;">No hay registros de sincronización aún.</div>`;
        return;
      }
      
      logsList.innerHTML = logs.map(log => {
        const dateStr = new Date(log.timestamp).toLocaleTimeString() + ' ' + new Date(log.timestamp).toLocaleDateString();
        const color = log.status === 'SUCCESS' ? 'var(--success)' : 'var(--danger)';
        const statusBadge = `<span style="color: ${color}; font-weight: 700; border: 1px solid ${color}; padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.7rem; margin-right: 0.5rem;">${log.status}</span>`;
        return `
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); padding: 0.75rem; border-radius: 8px; line-height: 1.4;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span>${statusBadge} <strong>${log.recordsSynced}</strong></span>
              <span style="color: var(--text-muted); font-size: 0.75rem;">${dateStr} (${log.duration}ms)</span>
            </div>
            <div style="color: var(--text-muted); font-size: 0.75rem;">${log.details}</div>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.error(e);
      logsList.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 1rem;">Error al cargar logs: ${e.message}</div>`;
    }
  };

  syncCard.querySelector('#force-sync-btn').onclick = async () => {
    const btn = syncCard.querySelector('#force-sync-btn');
    btn.disabled = true;
    btn.textContent = 'Sincronizando...';
    await SyncService.syncAll(window.SHARED_DATA_SOURCE_UID || 'SHARED');
    await loadSyncLogs();
    btn.disabled = false;
    btn.textContent = 'Sincronizar Ahora';
  };

  syncCard.querySelector('#clear-logs-btn').onclick = async () => {
    if (confirm('¿Seguro que deseas vaciar el historial de sincronización local?')) {
      await SyncService.clearSyncLogs();
      await loadSyncLogs();
    }
  };

  const syncLogsListener = () => {
    loadSyncLogs();
  };

  if (window.activeSyncLogsListener) {
    window.removeEventListener('app:sync-completed', window.activeSyncLogsListener);
    window.removeEventListener('app:sync-failed', window.activeSyncLogsListener);
  }
  window.activeSyncLogsListener = syncLogsListener;
  window.addEventListener('app:sync-completed', syncLogsListener);
  window.addEventListener('app:sync-failed', syncLogsListener);

  loadSyncLogs();

  // Section: Zona de Peligro / Mantenimiento
  const sectionTitleDanger = el('h3', { 
    classes: ['settings-section-title'], 
    text: '⚠️ Zona de Peligro / Mantenimiento',
    style: 'margin: 2.5rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--danger); font-weight: 700;'
  });
  wrapper.appendChild(sectionTitleDanger);

  const dangerCard = el('div', {
    classes: ['glass-card'],
    style: 'padding: 1.5rem; border-radius: 16px; margin-bottom: 2.5rem; border: 1px solid rgba(239, 68, 68, 0.2); display: flex; flex-direction: column; gap: 1.25rem;'
  });
  
  dangerCard.innerHTML = `
    <!-- Fila 1: Cajas (Retiros) -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
      <div style="flex: 1; min-width: 250px;">
        <span style="font-weight: 600; color: var(--text-main); display: block;">Reiniciar Cajas (Retiros)</span>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Vacía por completo la colección de Cajas (Retiros de carnicería) en la nube y su caché local IndexedDB.</span>
      </div>
      <button id="reset-cajas-btn" class="btn-primary" style="padding: 0.65rem 1.5rem; font-size: 0.82rem; margin: 0; background: var(--danger); border: none; color: #fff; font-weight: 600; cursor: pointer; border-radius: 8px;">
        💥 Reiniciar Cajas
      </button>
    </div>

    <!-- Fila 2: Caja General -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
      <div style="flex: 1; min-width: 250px;">
        <span style="font-weight: 600; color: var(--text-main); display: block;">Reiniciar Caja General</span>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Vacía por completo el libro contable de la Caja General en la nube y su caché local IndexedDB.</span>
      </div>
      <button id="reset-caja-general-btn" class="btn-primary" style="padding: 0.65rem 1.5rem; font-size: 0.82rem; margin: 0; background: var(--danger); border: none; color: #fff; font-weight: 600; cursor: pointer; border-radius: 8px;">
        💥 Reiniciar Caja General
      </button>
    </div>

    <!-- Fila 3: Caja Frigorífico -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div style="flex: 1; min-width: 250px;">
        <span style="font-weight: 600; color: var(--text-main); display: block;">Reiniciar Caja Frigorífico</span>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Vacía por completo la colección de la Caja Frigorífico en la nube y su caché local IndexedDB.</span>
      </div>
      <button id="reset-caja-frigorifico-btn" class="btn-primary" style="padding: 0.65rem 1.5rem; font-size: 0.82rem; margin: 0; background: var(--danger); border: none; color: #fff; font-weight: 600; cursor: pointer; border-radius: 8px;">
        💥 Reiniciar Caja Frigorífico
      </button>
    </div>
  `;
  wrapper.appendChild(dangerCard);

  const setupResetButton = (buttonId, title, description, callbackName) => {
    const btn = dangerCard.querySelector('#' + buttonId);
    if (btn) {
      btn.onclick = () => {
        showConfirmResetCajasModal(title, description, async () => {
          btn.disabled = true;
          const origText = btn.textContent;
          btn.textContent = 'Reiniciando...';
          try {
            if (options[callbackName]) {
              await options[callbackName]();
              showMsg(`¡${title} reiniciada con éxito!`);
            } else {
              showMsg(`Error: callback ${callbackName} no definido.`, true);
            }
          } catch (e) {
            console.error(`Error al reiniciar ${title.toLowerCase()}:`, e);
            showMsg('Error al reiniciar: ' + e.message, true);
          } finally {
            btn.disabled = false;
            btn.textContent = origText;
          }
        });
      };
    }
  };

  setupResetButton('reset-cajas-btn', 'Cajas (Retiros)', 'Esta acción borrará permanentemente todos los registros de Cajas (Retiros de carnicería) de forma irreversible en la base de datos de la nube y su caché local.', 'onResetCajasOnly');
  setupResetButton('reset-caja-general-btn', 'Caja General', 'Esta acción borrará permanentemente todos los registros contables de la Caja General de forma irreversible en la base de datos de la nube y su caché local.', 'onResetCajaGeneralOnly');
  setupResetButton('reset-caja-frigorifico-btn', 'Caja Frigorífico', 'Esta acción borrará permanentemente todos los registros de la Caja Frigorífico de forma irreversible en la base de datos de la nube y su caché local.', 'onResetCajaFrigorificoOnly');

  // Append the constructed settings wrapper to the view container
  container.appendChild(wrapper);
}

/**
 * Muestra una modal de confirmación con contraseña para reiniciar una colección de cajas específica.
 * @param {string} title - Título de la modal.
 * @param {string} description - Advertencia detallada.
 * @param {function} onConfirm - Callback ejecutado si la contraseña es correcta.
 */
function showConfirmResetCajasModal(title, description, onConfirm) {
  const overlay = el('div', {
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem; animation: fadeIn 0.2s ease; overflow-y: auto;'
  });

  const modal = el('div', {
    classes: ['modal', 'glass-card'],
    style: 'max-width: 420px; width: 100%; max-height: calc(100vh - 3rem); overflow-y: auto; padding: 2rem; border-radius: 24px; border: 1px solid rgba(239, 68, 68, 0.3); background: var(--card-bg); box-shadow: var(--elevation-3); text-align: center; margin: auto; box-sizing: border-box;'
  });

  modal.innerHTML = `
    <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; border: 1.5px solid rgba(239, 68, 68, 0.4); color: var(--danger); font-size: 1.8rem;">
      ⚠️
    </div>
    <h3 style="margin: 0 0 0.75rem 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main);">¿Reiniciar ${title}?</h3>
    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin: 0 0 1.5rem 0;">
      ${description}
    </p>
    <div style="margin-bottom: 1.5rem; text-align: left; display: flex; flex-direction: column; gap: 0.4rem;">
      <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Ingrese la contraseña de confirmación:</label>
      <input type="password" id="reset-confirm-password" class="form-input" placeholder="Contraseña..." style="width: 100%; text-align: center; font-size: 1.1rem; letter-spacing: 2px;">
    </div>
    <div style="display: flex; gap: 1rem; justify-content: stretch;">
      <button id="cancel-reset-btn" class="btn-outline" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 600; cursor: pointer; border-color: var(--border); color: var(--text-main); background: transparent;">
        Cancelar
      </button>
      <button id="confirm-reset-btn" class="btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 700; cursor: pointer; background: var(--danger); border: none; color: #fff; margin: 0;">
        Proceder
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#cancel-reset-btn').onclick = close;
  
  const passwordInput = modal.querySelector('#reset-confirm-password');
  
  modal.querySelector('#confirm-reset-btn').onclick = () => {
    const password = passwordInput.value;
    if (password === '180283') {
      close();
      onConfirm();
    } else {
      alert('Contraseña incorrecta. Acción cancelada.');
    }
  };
}

/**
 * Muestra una modal de confirmación premium para eliminar un usuario.
 * @param {string} email - Email del usuario a eliminar.
 * @param {function} onConfirm - Callback ejecutado al confirmar.
 */
function showConfirmDeleteUserModal(email, onConfirm) {
  const overlay = el('div', {
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem; animation: fadeIn 0.2s ease; overflow-y: auto;'
  });

  const modal = el('div', {
    classes: ['modal', 'glass-card'],
    style: 'max-width: 420px; width: 100%; max-height: calc(100vh - 3rem); overflow-y: auto; padding: 2rem; border-radius: 24px; border: 1px solid rgba(239, 68, 68, 0.2); background: var(--card-bg); box-shadow: var(--elevation-3); text-align: center; margin: auto; box-sizing: border-box;'
  });

  modal.innerHTML = `
    <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; border: 1.5px solid rgba(239, 68, 68, 0.3); color: var(--danger); font-size: 1.8rem;">
      ⚠️
    </div>
    <h3 style="margin: 0 0 0.75rem 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main);">¿Eliminar Usuario?</h3>
    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin: 0 0 2rem 0;">
      Estás a punto de revocar todos los accesos del usuario <strong style="color: var(--danger); word-break: break-all;">${email}</strong>. Esta acción eliminará su registro de permisos en el sistema y no se puede deshacer.
    </p>
    <div style="display: flex; gap: 1rem; justify-content: stretch;">
      <button id="cancel-delete-btn" class="btn-outline" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 600; cursor: pointer; border-color: var(--border); color: var(--text-main); background: transparent;">
        Cancelar
      </button>
      <button id="confirm-delete-btn" class="btn-primary" style="flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 700; cursor: pointer; background: var(--danger); border: none; color: #fff; margin: 0;">
        Eliminar
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  modal.querySelector('#cancel-delete-btn').onclick = close;
  modal.querySelector('#confirm-delete-btn').onclick = () => {
    close();
    onConfirm();
  };
}
