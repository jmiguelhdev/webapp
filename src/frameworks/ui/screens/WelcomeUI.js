/**
 * @file WelcomeUI.js
 * @description Vista pública institucional de Frigorífico Pampa, visualización de precios
 * por sucursal, descarga de PDF y modal de autenticación en 2 pasos.
 */
import { el } from '../../utils/dom.js';
import { BranchPricePdfService } from '../reports/BranchPricePdfService.js';
import { filterUpcomingStops } from '../../../adapters/api/PublicBranchPricingApi.js';
import { DEFAULT_PILLARS } from '../../../adapters/api/CompanyConfigApi.js';

/**
 * Formatea un número como moneda argentina ($ / kg).
 */
function formatCurrency(val) {
  return '$ ' + new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(val || 0));
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class WelcomeUI {
  /**
   * Renderiza la portada institucional en el contenedor principal.
   * @param {HTMLElement} container - Contenedor (#content).
   * @param {Object} options
   * @param {Object} options.companyConfig - Configuración de la empresa y sucursales.
   * @param {Array<Object>} [options.branchesPricing] - Listado de sucursales con precios resueltos.
   * @param {function} options.onOpenLogin - Callback para desplegar el modal de acceso.
   */
  static render(container, { companyConfig, branchesPricing = [], onOpenLogin, onBackToAdmin }) {
    if (!container) return;

    const config = companyConfig || {
      companyName: 'Frigorífico Pampa',
      slogan: 'Calidad, Trazabilidad y Excelencia en la Industria Cárnica',
      description: 'Especialistas en faena, desposte y logística frigorífica con los más altos estándares sanitarios y tecnológicos.',
      branches: []
    };

    // Combinar sucursales de companyConfig con las de pricing si existen
    const mergedBranches = (config.branches || []).map(cb => {
      const cbName = String(cb.name || '').toLowerCase();
      const pricingMatch = branchesPricing.find(p => {
        const pName = String(p.name || '').toLowerCase();
        return p.id === cb.id || (cbName && pName && (pName.includes(cbName) || cbName.includes(pName)));
      });
      return {
        ...cb,
        id: pricingMatch?.id || cb.id,
        imageUrl: pricingMatch?.imageUrl || cb.imageUrl || '',
        isMobile: Boolean(pricingMatch?.isMobile || cb.isMobile),
        isPublished: pricingMatch?.isPublished !== undefined ? pricingMatch.isPublished : (cb.isPublished !== false),
        schedule: pricingMatch?.schedule || cb.schedule || [],
        items: pricingMatch?.items || []
      };
    });

    // Agregar sucursales que estén en pricing pero no en config
    branchesPricing.forEach(pb => {
      if (!mergedBranches.some(b => b.id === pb.id)) {
        mergedBranches.push({
          id: pb.id,
          name: pb.name,
          address: pb.address,
          hours: pb.hours,
          phone: pb.phone,
          imageUrl: pb.imageUrl || '',
          isMobile: Boolean(pb.isMobile),
          isPublished: pb.isPublished !== false,
          schedule: pb.schedule || [],
          items: pb.items || []
        });
      }
    });

    // Filtrar únicamente sucursales visibles/publicadas
    const visibleBranches = mergedBranches.filter(b => b.isPublished !== false);

    // Priorizar la carnicería móvil itinerante para que siempre sea la primera tarjeta
    visibleBranches.sort((a, b) => {
      const aIsMobile = Boolean(a.isMobile || a.id === 'pampa_movil');
      const bIsMobile = Boolean(b.isMobile || b.id === 'pampa_movil');
      if (aIsMobile && !bIsMobile) return -1;
      if (!aIsMobile && bIsMobile) return 1;
      return 0;
    });

    const branchesHtml = visibleBranches.map(b => {
      const hasPrices = Array.isArray(b.items) && b.items.length > 0;
      const isMobile = Boolean(b.isMobile || b.id === 'pampa_movil');
      const upcomingStops = isMobile ? filterUpcomingStops(b.schedule || []) : [];
      const nextStop = upcomingStops.length > 0 ? upcomingStops[0] : null;

      const badgeHtml = isMobile 
        ? `<span class="branch-badge" style="background: rgba(143, 0, 20, 0.12); color: var(--primary); font-weight: 800;">🚚 CARNICERÍA MÓVIL ITINERANTE</span>`
        : `<span class="branch-badge">🏢 SUCURSAL / PLANTA</span>`;

      return `
        <div class="branch-card glass-card ${isMobile ? 'branch-card-mobile' : ''}" data-branch-id="${escapeHtml(b.id)}" style="${isMobile ? 'border: 2px solid rgba(143, 0, 20, 0.35); background: linear-gradient(180deg, rgba(143, 0, 20, 0.03) 0%, var(--card-bg) 100%);' : ''}">
          ${b.imageUrl ? `
            <div class="branch-card-media">
              <img src="${escapeHtml(b.imageUrl)}" alt="${escapeHtml(b.name || 'Sucursal')}" loading="lazy" class="branch-card-img" />
            </div>
          ` : ''}
          <div class="branch-card-header">
            ${badgeHtml}
            <h4 class="branch-name">${escapeHtml(b.name || 'Sucursal')}</h4>
          </div>
          <div class="branch-details">
            ${isMobile ? `
              <div class="branch-detail-row">
                <span class="detail-icon">📍</span>
                <span class="detail-text">${nextStop ? `<strong>Próxima Parada:</strong> ${escapeHtml(nextStop.dateDisplay || nextStop.date)} — ${escapeHtml(nextStop.location)}` : 'Itinerario barrial rotativo'}</span>
              </div>
              ${nextStop && nextStop.reference ? `
                <div class="branch-detail-row">
                  <span class="detail-icon">🏛️</span>
                  <span class="detail-text">${escapeHtml(nextStop.reference)}</span>
                </div>
              ` : ''}
              <div class="branch-detail-row">
                <span class="detail-icon">🕒</span>
                <span class="detail-text">${escapeHtml(nextStop ? nextStop.time : (b.hours || '09:00 a 14:00 hs'))}</span>
              </div>
              <div class="branch-detail-row">
                <span class="detail-icon">📅</span>
                <span class="detail-text" style="color: var(--primary); font-weight: 700;">${upcomingStops.length} ${upcomingStops.length === 1 ? 'parada programada' : 'paradas barriales programadas'}</span>
              </div>
            ` : `
              <div class="branch-detail-row">
                <span class="detail-icon">📍</span>
                <span class="detail-text">${escapeHtml(b.address || 'Dirección no especificada')}</span>
              </div>
              ${b.hours ? `
                <div class="branch-detail-row">
                  <span class="detail-icon">🕒</span>
                  <span class="detail-text">${escapeHtml(b.hours)}</span>
                </div>
              ` : ''}
            `}
            ${b.phone ? `
              <div class="branch-detail-row">
                <span class="detail-icon">📞</span>
                <span class="detail-text"><a href="tel:${escapeHtml(b.phone)}" class="branch-link">${escapeHtml(b.phone)}</a></span>
              </div>
            ` : ''}
            ${b.email ? `
              <div class="branch-detail-row">
                <span class="detail-icon">✉️</span>
                <span class="detail-text"><a href="mailto:${escapeHtml(b.email)}" class="branch-link">${escapeHtml(b.email)}</a></span>
              </div>
            ` : ''}
          </div>

          <!-- Acciones de Precios por Sucursal -->
          <div class="branch-card-actions" style="margin-top: 1.25rem; display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.85rem; border-top: 1px solid var(--border);">
            <button type="button" class="btn-branch-view-prices" data-branch-id="${escapeHtml(b.id)}" style="flex: 1; min-width: 130px; padding: 0.6rem 0.9rem; border-radius: 10px; background: rgba(143, 0, 20, 0.08); border: 1px solid rgba(143, 0, 20, 0.25); color: var(--primary); font-size: 0.84rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition: var(--transition);">
              <span>🥩 Ver Precios</span>
              ${hasPrices ? `<span style="font-size: 0.72rem; background: var(--primary); color: #fff; padding: 0.15rem 0.45rem; border-radius: 100px;">${b.items.length}</span>` : ''}
            </button>
            <button type="button" class="btn-branch-download-pdf" data-branch-id="${escapeHtml(b.id)}" style="padding: 0.6rem 0.9rem; border-radius: 10px; background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); font-size: 0.84rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition: var(--transition);" title="Descargar Lista de Precios en PDF">
              <span>📥 PDF</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Resolver tarjetas principales / pilares dinámicos
    const pillarsList = Array.isArray(config.pillars) && config.pillars.length > 0
      ? config.pillars
      : DEFAULT_PILLARS;

    const pillarsHtml = pillarsList.map(p => `
      <div class="pillar-card glass-card">
        ${p.imageUrl ? `
          <div class="pillar-media">
            <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.title || 'Pilar')}" loading="lazy" class="pillar-img" />
          </div>
        ` : ''}
        ${p.icon ? `<div class="pillar-icon-box">${escapeHtml(p.icon)}</div>` : ''}
        <h3 class="pillar-title">${escapeHtml(p.title || '')}</h3>
        <p class="pillar-text">${escapeHtml(p.description || '')}</p>
      </div>
    `).join('');

    container.innerHTML = `
      ${onBackToAdmin ? `
        <div class="admin-preview-top-bar glass-card" style="position: sticky; top: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.5rem; background: rgba(25, 25, 25, 0.95); backdrop-filter: blur(12px); border-bottom: 2px solid var(--primary); box-shadow: 0 4px 18px rgba(0,0,0,0.5); margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem; color: #fff; font-size: 0.88rem;">
            <span style="font-size: 1.2rem;">🛡️</span>
            <span><strong>Modo Previsualización</strong> — Vista pública de clientes (Sesión activa)</span>
          </div>
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <button type="button" id="btn-back-to-welcome-config" style="padding: 0.55rem 1.1rem; border-radius: 8px; background: var(--primary); color: #fff; border: none; font-weight: 700; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: var(--transition);">
              <span>🎨 Volver a Diseño de Portada</span>
            </button>
            <button type="button" id="btn-back-to-dashboard" style="padding: 0.55rem 0.9rem; border-radius: 8px; background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.25); font-weight: 600; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: var(--transition);">
              <span>📊 Dashboard</span>
            </button>
          </div>
        </div>
      ` : ''}
      <div class="welcome-container fade-in">
        <!-- Hero Principal -->
        <section class="welcome-hero-section">
          <div class="welcome-hero-card glass-card">
            <div class="welcome-brand-badge">
              <img src="/logo.jpg" alt="Logo Frigorífico Pampa" class="welcome-hero-logo" />
            </div>
            <h1 class="welcome-hero-title">${config.companyName}</h1>
            <p class="welcome-hero-slogan">${config.slogan}</p>
            <p class="welcome-hero-description">${config.description}</p>
          </div>
        </section>

        <!-- Pilares Operacionales -->
        <section class="welcome-pillars-section">
          <div class="pillars-grid">
            ${pillarsHtml}
          </div>
        </section>

        <!-- Sucursales y Horarios de Atención -->
        <section class="welcome-branches-section">
          <div class="section-header-centered">
            <span class="section-tag">NUESTRA RED</span>
            <h2 class="section-title">Plantas Operativas & Sucursales</h2>
            <p class="section-subtitle">Horarios de atención, recepción de hacienda y listas de precios al público en mostrador.</p>
          </div>
          
          <div class="branches-grid">
            ${branchesHtml}
          </div>
        </section>

        <!-- Pie Institucional -->
        <footer class="welcome-footer">
          <div class="footer-content">
            <div class="footer-left">
              <span class="footer-brand">${config.companyName}</span>
              <span class="footer-copy">© ${new Date().getFullYear()} — Plataforma de Gestión y Operaciones Cárnicas.</span>
            </div>
            <div class="footer-right">
              <button id="footer-staff-login-btn" class="footer-link-btn" title="Acceso al sistema">
                <span>Acceso Operadores</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    `;

    // Conectar único evento discreto de apertura de login institucional
    const footerBtn = container.querySelector('#footer-staff-login-btn');
    if (footerBtn && onOpenLogin) footerBtn.onclick = onOpenLogin;

    // Conectar botones de retorno para sesión de administrador en modo previsualización
    if (onBackToAdmin) {
      const btnBackConfig = container.querySelector('#btn-back-to-welcome-config');
      if (btnBackConfig) btnBackConfig.onclick = () => onBackToAdmin('welcome-config');
      const btnBackDash = container.querySelector('#btn-back-to-dashboard');
      if (btnBackDash) btnBackDash.onclick = () => onBackToAdmin('dashboard');
    }

    // Conectar eventos de "Ver Precios"
    container.querySelectorAll('.btn-branch-view-prices').forEach(btn => {
      btn.onclick = () => {
        const branchId = btn.dataset.branchId;
        const b = visibleBranches.find(x => x.id === branchId);
        if (b) WelcomeUI.renderPriceModal({ branch: b });
      };
    });

    // Conectar eventos de "Descargar PDF"
    container.querySelectorAll('.btn-branch-download-pdf').forEach(btn => {
      btn.onclick = () => {
        const branchId = btn.dataset.branchId;
        const b = visibleBranches.find(x => x.id === branchId);
        if (b) {
          BranchPricePdfService.downloadPriceListPdf({ branch: b, items: b.items || [] });
        }
      };
    });

    // Detectar deep linking en URL (ej: /?sucursal=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetBranchParam = urlParams.get('sucursal');
      if (targetBranchParam) {
        const q = targetBranchParam.toLowerCase();
        const matched = visibleBranches.find(b => 
          String(b.id || '').toLowerCase() === q ||
          String(b.name || '').toLowerCase().includes(q)
        );
        if (matched) {
          setTimeout(() => {
            WelcomeUI.renderPriceModal({ branch: matched });
          }, 350);
        }
      }
    } catch (e) {
      console.warn("Error parsing URL deep link:", e);
    }
  }

  /**
   * Despliega el visor interactivo de precios de una sucursal con buscador.
   * @param {Object} options
   * @param {Object} options.branch - Datos de la sucursal y sus cortes.
   */
  static renderPriceModal({ branch }) {
    const existing = document.getElementById('branch-price-modal');
    if (existing) existing.remove();

    const overlay = el('div', {
      attrs: { id: 'branch-price-modal' },
      classes: ['auth-modal-overlay', 'fade-in']
    });

    const items = (branch.items || []).filter(i => i.visible !== false && Number(i.price) > 0);
    const isMobile = Boolean(branch.isMobile || branch.id === 'pampa_movil');
    const upcomingStops = isMobile ? filterUpcomingStops(branch.schedule || []) : [];

    const scheduleSectionHtml = (isMobile && branch.schedule) ? `
      <!-- Cronograma de Paradas Barriales para Carnicería Móvil -->
      <div style="background: rgba(143, 0, 20, 0.04); border: 1px solid rgba(143, 0, 20, 0.2); border-radius: 12px; padding: 0.9rem; margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem;">
          <span style="font-weight: 700; font-size: 0.88rem; color: var(--primary); display: flex; align-items: center; gap: 0.4rem;">
            <span>📅</span> Cronograma de Paradas & Puntos de Venta
          </span>
          <span style="font-size: 0.75rem; background: var(--primary); color: #fff; padding: 0.15rem 0.55rem; border-radius: 100px; font-weight: 700;">
            ${upcomingStops.length} ${upcomingStops.length === 1 ? 'parada' : 'paradas'}
          </span>
        </div>
        ${upcomingStops.length === 0 ? `
          <p style="margin: 0; font-size: 0.82rem; color: var(--text-muted);">Próximamente anunciaremos las nuevas paradas barriales programadas.</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.45rem; max-height: 150px; overflow-y: auto; padding-right: 0.25rem;">
            ${upcomingStops.map(st => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--bg-main); border-radius: 8px; border: 1px solid var(--border); font-size: 0.82rem; gap: 0.5rem;">
                <div>
                  <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(st.location || 'Punto de Venta')}</div>
                  ${st.reference ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(st.reference)}</div>` : ''}
                </div>
                <div style="text-align: right; white-space: nowrap;">
                  <div style="font-weight: 700; color: var(--primary);">${escapeHtml(st.dateDisplay || st.date)}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">🕒 ${escapeHtml(st.time)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    ` : '';

    overlay.innerHTML = `
      <div class="auth-modal-card glass-card" style="max-width: 620px; width: 100%; max-height: 85vh; display: flex; flex-direction: column;">
        <div class="auth-modal-header" style="margin-bottom: 1.25rem;">
          <div class="auth-modal-brand">
            <span style="font-size: 2rem;">${isMobile ? '🚚' : '🥩'}</span>
            <div>
              <h3 class="auth-modal-title">${escapeHtml(branch.name)}</h3>
              <p class="auth-modal-subtitle">${isMobile ? 'Carnicería Móvil e Itinerario Barrial' : escapeHtml(branch.address || 'Mostrador Frigorífico Pampa')}</p>
            </div>
          </div>
          <button id="price-modal-close-btn" class="auth-close-btn" title="Cerrar">✕</button>
        </div>

        ${scheduleSectionHtml}

        <!-- Buscador y Acciones -->
        <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
          <input 
            type="text" 
            id="modal-search-cut-input" 
            class="form-input modal-search-input" 
            placeholder="🔍 Buscar corte (ej: asado, vacio, lomo)..." 
            style="flex: 1; min-width: 200px; padding: 0.75rem 1rem; border-radius: 12px;" 
          />
          <button id="btn-modal-download-pdf" class="btn-primary" style="padding: 0.65rem 1.25rem; border-radius: 12px; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem; white-space: nowrap;">
            <span>📥 Descargar PDF</span>
          </button>
        </div>

        <!-- Listado de Cortes -->
        <div id="modal-cuts-list" style="flex: 1; overflow-y: auto; padding-right: 0.25rem; display: flex; flex-direction: column; gap: 0.6rem;">
          <!-- Generado dinámicamente -->
        </div>

        <!-- Pie del Modal -->
        <div style="margin-top: 1.25rem; padding-top: 0.75rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-muted); flex-wrap: wrap; gap: 0.5rem;">
          <span>Precios en mostrador expresados en $/kg con IVA incluido.</span>
          <span style="font-weight: 600;">Total: <strong id="cuts-counter">${items.length}</strong> cortes</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };

    const close = () => {
      document.removeEventListener('keydown', onKeyDown);
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 200);
    };

    document.addEventListener('keydown', onKeyDown);
    overlay.querySelector('#price-modal-close-btn').onclick = close;
    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };

    const cutsContainer = overlay.querySelector('#modal-cuts-list');
    const searchInput = overlay.querySelector('#modal-search-cut-input');
    const cutsCounter = overlay.querySelector('#cuts-counter');

    const renderCuts = (filterText = '') => {
      const q = filterText.toLowerCase().trim();
      const filtered = items.filter(i => !q || i.name.toLowerCase().includes(q) || (i.plu && i.plu.includes(q)));

      cutsCounter.textContent = filtered.length;

      if (filtered.length === 0) {
        cutsContainer.innerHTML = `
          <div style="padding: 2.5rem; text-align: center; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 14px;">
            No se encontraron cortes que coincidan con su búsqueda.
          </div>
        `;
        return;
      }

      cutsContainer.innerHTML = filtered.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1.1rem; border-radius: 12px; background: var(--bg-main); border: 1px solid var(--border); transition: var(--transition);">
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">${escapeHtml(item.name)}</div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 1.15rem; font-weight: 800; color: var(--primary);">${formatCurrency(item.price)}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">por kg</span>
          </div>
        </div>
      `).join('');
    };

    renderCuts();

    searchInput.oninput = (e) => {
      renderCuts(e.target.value);
    };

    overlay.querySelector('#btn-modal-download-pdf').onclick = () => {
      BranchPricePdfService.downloadPriceListPdf({ branch, items });
    };

    setTimeout(() => searchInput.focus(), 150);
  }

  /**
   * Abre el diálogo modal de autenticación de dos pasos.
   */
  static renderAuthModal({ onVerifyGatekeeper, onGoogleLogin, onClose }) {
    const existing = document.getElementById('auth-two-step-modal');
    if (existing) existing.remove();

    const overlay = el('div', {
      attrs: { id: 'auth-two-step-modal' },
      classes: ['auth-modal-overlay', 'fade-in']
    });

    overlay.innerHTML = `
      <div class="auth-modal-card glass-card">
        <div class="auth-modal-header">
          <div class="auth-modal-brand">
            <img src="/logo.jpg" alt="Logo" class="auth-modal-logo" />
            <div>
              <h3 class="auth-modal-title">Portal Frigorífico Pampa</h3>
              <p class="auth-modal-subtitle">Control de Acceso Seguro</p>
            </div>
          </div>
          <button id="auth-modal-close-btn" class="auth-close-btn" title="Cerrar">✕</button>
        </div>

        <!-- Indicador de Pasos -->
        <div class="auth-stepper">
          <div class="stepper-step active" id="step-pill-1">
            <span class="step-badge">1</span>
            <span class="step-name">Credencial Interna</span>
          </div>
          <div class="stepper-connector" id="stepper-connector"></div>
          <div class="stepper-step" id="step-pill-2">
            <span class="step-badge">2</span>
            <span class="step-name">Google Auth</span>
          </div>
        </div>

        <!-- PASO 1: Validación Usuario y Contraseña Corporativo -->
        <div class="auth-step-panel" id="auth-panel-step1">
          <p class="auth-instruction">
            Ingrese el usuario y clave de acceso institucional asignado a la empresa para habilitar la identificación.
          </p>

          <form id="gatekeeper-form" class="auth-form" onsubmit="return false;">
            <div class="auth-form-group">
              <label for="input-gatekeeper-user" class="auth-label">
                <span>Usuario de Acceso</span>
              </label>
              <div class="auth-input-wrapper">
                <span class="auth-input-icon">👤</span>
                <input 
                  type="text" 
                  id="input-gatekeeper-user" 
                  class="auth-input" 
                  placeholder="Ej: pampa" 
                  autocomplete="username" 
                  required 
                />
              </div>
            </div>

            <div class="auth-form-group">
              <label for="input-gatekeeper-pass" class="auth-label">
                <span>Contraseña / Clave de Acceso</span>
              </label>
              <div class="auth-input-wrapper">
                <span class="auth-input-icon">🔑</span>
                <input 
                  type="password" 
                  id="input-gatekeeper-pass" 
                  class="auth-input" 
                  placeholder="Ingrese su clave de acceso" 
                  autocomplete="current-password" 
                  required 
                />
                <button type="button" id="toggle-gatekeeper-pass-btn" class="auth-input-toggle-btn" title="Mostrar/Ocultar contraseña">👁️</button>
              </div>
            </div>

            <div id="gatekeeper-error-msg" class="auth-alert error" style="display: none;"></div>

            <button type="submit" id="btn-submit-gatekeeper" class="btn-auth-primary">
              <span>Validar y Continuar</span>
              <span class="btn-arrow">→</span>
            </button>
          </form>
        </div>

        <!-- PASO 2: Continuar con Google Auth -->
        <div class="auth-step-panel" id="auth-panel-step2" style="display: none;">
          <div class="auth-success-badge">
            <span class="success-icon">✓</span>
            <div>
              <strong>Credencial institucional validada</strong>
              <p>Continúe con su cuenta corporativa de Google para asignar sus permisos de trabajo.</p>
            </div>
          </div>

          <div class="google-auth-box">
            <button id="btn-trigger-google-auth" class="btn-google-auth">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="google-icon" />
              <span>Continuar con Google</span>
            </button>
          </div>

          <div id="google-error-msg" class="auth-alert error" style="display: none; margin-top: 1rem;"></div>

          <div class="auth-modal-footer-nav">
            <button id="btn-back-to-step1" class="btn-auth-link">
              ← Cambiar credencial institucional
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const onAuthKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };

    const close = () => {
      document.removeEventListener('keydown', onAuthKeyDown);
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        if (onClose) onClose();
      }, 200);
    };

    document.addEventListener('keydown', onAuthKeyDown);
    overlay.querySelector('#auth-modal-close-btn').onclick = close;
    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };

    const passInput = overlay.querySelector('#input-gatekeeper-pass');
    const togglePassBtn = overlay.querySelector('#toggle-gatekeeper-pass-btn');
    if (togglePassBtn && passInput) {
      togglePassBtn.onclick = () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        togglePassBtn.textContent = isPass ? '🙈' : '👁️';
      };
    }

    const formStep1 = overlay.querySelector('#gatekeeper-form');
    const userInput = overlay.querySelector('#input-gatekeeper-user');
    const submitBtn = overlay.querySelector('#btn-submit-gatekeeper');
    const step1Error = overlay.querySelector('#gatekeeper-error-msg');

    const panelStep1 = overlay.querySelector('#auth-panel-step1');
    const panelStep2 = overlay.querySelector('#auth-panel-step2');
    const pillStep1 = overlay.querySelector('#step-pill-1');
    const pillStep2 = overlay.querySelector('#step-pill-2');
    const connector = overlay.querySelector('#stepper-connector');

    formStep1.onsubmit = async (e) => {
      e.preventDefault();
      const user = userInput.value.trim();
      const pass = passInput.value.trim();

      if (!user || !pass) {
        step1Error.textContent = 'Por favor complete usuario y contraseña.';
        step1Error.style.display = 'block';
        return;
      }

      step1Error.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Validando...</span>`;

      try {
        const res = await onVerifyGatekeeper(user, pass);
        if (res && res.success) {
          panelStep1.style.display = 'none';
          panelStep2.style.display = 'block';
          panelStep2.classList.add('fade-in');

          pillStep1.classList.remove('active');
          pillStep1.classList.add('completed');
          pillStep1.querySelector('.step-badge').textContent = '✓';

          connector.classList.add('completed');
          pillStep2.classList.add('active');
        } else {
          step1Error.textContent = res?.message || 'Usuario o contraseña corporativos incorrectos.';
          step1Error.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Validar y Continuar</span><span class="btn-arrow">→</span>`;
          passInput.focus();
        }
      } catch (err) {
        step1Error.textContent = 'Error al validar credencial: ' + (err?.message || err);
        step1Error.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Validar y Continuar</span><span class="btn-arrow">→</span>`;
      }
    };

    const backBtn = overlay.querySelector('#btn-back-to-step1');
    if (backBtn) {
      backBtn.onclick = () => {
        panelStep2.style.display = 'none';
        panelStep1.style.display = 'block';
        panelStep1.classList.add('fade-in');

        pillStep1.classList.remove('completed');
        pillStep1.classList.add('active');
        pillStep1.querySelector('.step-badge').textContent = '1';

        connector.classList.remove('completed');
        pillStep2.classList.remove('active');

        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Validar y Continuar</span><span class="btn-arrow">→</span>`;
        passInput.value = '';
        passInput.focus();
      };
    }

    const googleBtn = overlay.querySelector('#btn-trigger-google-auth');
    const googleError = overlay.querySelector('#google-error-msg');
    if (googleBtn) {
      googleBtn.onclick = async () => {
        googleError.style.display = 'none';
        googleBtn.disabled = true;
        googleBtn.innerHTML = `<span>Iniciando sesión con Google...</span>`;

        try {
          await onGoogleLogin();
          close();
        } catch (err) {
          console.error("Google Auth Error:", err);
          let msg = 'No se pudo completar el inicio con Google: ' + (err?.message || err);
          if (err?.code === 'auth/unauthorized-domain') {
            msg = 'El dominio actual no está autorizado en Firebase Authentication. Contacte al administrador.';
          } else if (err?.code === 'auth/popup-closed-by-user') {
            msg = 'Se cerró la ventana de autenticación de Google antes de finalizar.';
          }
          googleError.textContent = msg;
          googleError.style.display = 'block';
          googleBtn.disabled = false;
          googleBtn.innerHTML = `
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="google-icon" />
            <span>Continuar con Google</span>
          `;
        }
      };
    }

    setTimeout(() => userInput.focus(), 150);
  }
}
