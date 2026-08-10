/**
 * <kmp-sidebar>
 * Native Web Component for premium navigation sidebar with dynamic RBAC support.
 * Dispatches 'navigate' custom event when a menu option is selected.
 * Attributes:
 * - role: Current user's role authorization ('ADMIN', 'OPERARIO', 'VISOR')
 * - active: ID of the currently active view (e.g. 'dashboard')
 */
export class KmpSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._userRole = 'VISOR';
    this.activeView = 'dashboard';
  }

  static get observedAttributes() {
    return ['role', 'active'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'role') {
      this._userRole = newValue || 'VISOR';
    } else if (name === 'active') {
      this.activeView = newValue || 'dashboard';
    }
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  getStyles() {
    return `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.3);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-right: 1px solid rgba(255, 255, 255, 0.04);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .sidebar-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 0.75rem;
        box-sizing: border-box;
      }
      /* Custom Scrollbar for Premium Feel */
      .sidebar-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .sidebar-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .sidebar-scroll::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.06);
        border-radius: 99px;
      }
      .sidebar-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.12);
      }
      .nav-group {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        margin-bottom: 1.5rem;
      }
      .group-title {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.65rem;
        font-weight: 800;
        color: var(--text-muted, #64748b);
        opacity: 0.5;
        letter-spacing: 1.5px;
        padding: 0.5rem 0.75rem;
        text-transform: uppercase;
        border-bottom: 1px solid rgba(255, 255, 255, 0.02);
        margin-bottom: 0.4rem;
        user-select: none;
      }
      .nav-item {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--text-muted, #94a3b8);
        padding: 0.7rem 0.9rem;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.65rem;
        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        box-sizing: border-box;
      }
      .nav-item:hover {
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-primary, #f1f5f9);
        transform: translateX(2px);
      }
      .nav-item.active {
        background: rgba(59, 130, 246, 0.12);
        border: 1px solid rgba(59, 130, 246, 0.25);
        color: #60a5fa; /* Blue-400 */
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.05);
      }
      .nav-item.logout-item {
        color: var(--danger, #f87171);
        margin-top: 1.5rem;
        border: 1px solid transparent;
      }
      .nav-item.logout-item:hover {
        background: rgba(239, 68, 68, 0.08);
        border-color: rgba(239, 68, 68, 0.15);
        color: #fca5a5;
      }
    `;
  }

  render() {
    const currentRole = this._userRole;
    const active = this.activeView;

    const groups = [
      {
        title: 'OPERACIONES & LOGÍSTICA',
        items: [
          { id: 'dashboard', label: '📊 Dashboard', roles: ['ADMIN', 'OPERARIO', 'VISOR'] },
          { id: 'travels', label: '🚛 Gestión de Viajes', roles: ['ADMIN', 'OPERARIO', 'VISOR'] },
          { id: 'logistics-liquidations', label: '💵 Liquidación Choferes', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'logistics-fuel', label: '⛽ Rendimiento Combustible', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'consumption', label: '🥩 Despacho y Stock', roles: ['ADMIN', 'OPERARIO'] }
        ]
      },
      {
        title: 'FINANZAS & CRÉDITO',
        items: [
          { id: 'fiscal-invoices', label: '📄 Comprobantes ARCA', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'checks', label: '💸 Gestión de Cheques', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'accounting', label: '💰 Caja General', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'frigorifico', label: '🏢 Caja Frigorífico', roles: ['ADMIN', 'OPERARIO'] }
        ]
      },
      {
        title: 'HERRAMIENTAS & ANÁLISIS',
        items: [
          { id: 'simulator', label: '🧮 Simulador de Costos', roles: ['ADMIN', 'OPERARIO', 'VISOR'] },
          { id: 'price-share', label: '📲 Placa de Precios', roles: ['ADMIN', 'OPERARIO'] }
        ]
      },
      {
        title: 'SISTEMA & CONFIGURACIÓN',
        items: [
          { id: 'master-data', label: '⚙️ Datos Maestros', roles: ['ADMIN'] },
          { id: 'clients', label: '👥 Clientes y Cuentas', roles: ['ADMIN'] },
          { id: 'establishments', label: '🏢 Sucursales y Personal', roles: ['ADMIN'] },
          { id: 'settings', label: '⚙️ Configuración', roles: ['ADMIN'] },
          { id: 'contact', label: '📖 Info y Contacto', roles: ['ADMIN', 'OPERARIO', 'VISOR'] }
        ]
      }
    ];

    let htmlContent = `<div class="sidebar-scroll">`;

    groups.forEach(group => {
      const visibleItems = group.items.filter(item => item.roles.includes(currentRole));
      if (visibleItems.length === 0) return;

      htmlContent += `
        <div class="nav-group">
          <div class="group-title">${group.title}</div>
      `;

      visibleItems.forEach(item => {
        const isActiveClass = item.id === active ? 'active' : '';
        htmlContent += `
          <div class="nav-item ${isActiveClass}" data-view="${item.id}">
            ${item.label}
          </div>
        `;
      });

      htmlContent += `</div>`;
    });

    // Render logout button
    htmlContent += `
      <div class="nav-item logout-item" id="logout-btn">
        🚪 Cerrar Sesión
      </div>
    `;

    htmlContent += `</div>`;

    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      ${htmlContent}
    `;

    // Hook events
    this.shadowRoot.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const viewId = item.getAttribute('data-view');
        if (viewId) {
          this.dispatchEvent(new CustomEvent('navigate', {
            detail: { view: viewId },
            bubbles: true,
            composed: true
          }));
          
          // Close sidebar drawer automatically on responsive screens/mobile viewport sizes
          document.body.classList.remove('sidebar-open');
        }
      });
    });

    const logoutBtn = this.shadowRoot.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('¿Deseas cerrar sesión del sistema?')) {
          window.dispatchEvent(new CustomEvent('app:logout'));
        }
      });
    }
  }
}

if (!customElements.get('kmp-sidebar')) {
  customElements.define('kmp-sidebar', KmpSidebar);
}
