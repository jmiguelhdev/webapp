import { el } from '../../utils/dom.js';
import { SettingsService } from '../../services/SettingsService.js';
import { SyncService } from '../../services/SyncService.js';


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
      rbacEl.innerHTML = `
        <h3 class="settings-section-title" style="margin: 2rem 0 1rem 0; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); font-weight: 700;">🔐 Accesos & Gestión de Permisos</h3>
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

          // Generate name/email initials for user avatar badge
          const initials = String(u.email || u.uid || 'U').substring(0, 2).toUpperCase();

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
              <button class="btn-outline btn-delete-user icon-btn delete-btn" data-uid="${u.uid}" data-email="${u.email}" title="Eliminar Usuario" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; color: var(--danger); border-color: var(--danger); border-radius: 8px; background: transparent; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                🗑️
              </button>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem; justify-content: space-between;">
              <select class="form-input rbac-select" data-uid="${u.uid}" style="padding: 0.45rem 1rem 0.45rem 0.5rem; font-size: 0.8rem; border-radius: 8px; flex: 1;">
                <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>Administrador (Full)</option>
                <option value="OPERARIO" ${u.role === 'OPERARIO' ? 'selected' : ''}>Operario (Edición)</option>
                <option value="VISOR" ${u.role === 'VISOR' ? 'selected' : ''}>Solo Lectura (Visor)</option>
              </select>
              <button class="btn-primary btn-save-role" data-uid="${u.uid}" data-email="${u.email}" style="padding: 0.5rem 1rem; font-size: 0.8rem; margin: 0; border-radius: 8px; font-weight: 600;">Actualizar</button>
            </div>
          `;
          rbacListEl.appendChild(card);
        });

        rbacListEl.querySelectorAll('.btn-save-role').forEach(btn => {
          btn.onclick = async () => {
            const uid = btn.dataset.uid;
            const email = btn.dataset.email;
            const select = rbacListEl.querySelector(`.rbac-select[data-uid="${uid}"]`);
            const newRole = select.value;
            btn.textContent = '...';
            btn.disabled = true;
            if (options.onSaveUserRole) {
              await options.onSaveUserRole(uid, newRole);
              showMsg(`Rol de ${email || 'usuario'} actualizado a ${newRole}`);
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

  // Append the constructed settings wrapper to the view container
  container.appendChild(wrapper);
}

/**
 * Muestra una modal de confirmación premium para eliminar un usuario.
 * @param {string} email - Email del usuario a eliminar.
 * @param {function} onConfirm - Callback ejecutado al confirmar.
 */
function showConfirmDeleteUserModal(email, onConfirm) {
  const overlay = el('div', {
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 1rem; animation: fadeIn 0.2s ease;'
  });

  const modal = el('div', {
    classes: ['modal', 'glass-card'],
    style: 'max-width: 420px; padding: 2rem; border-radius: 24px; border: 1px solid rgba(239, 68, 68, 0.2); background: var(--card-bg); box-shadow: var(--elevation-3); text-align: center;'
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
