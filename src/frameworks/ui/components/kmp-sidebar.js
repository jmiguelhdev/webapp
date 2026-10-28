/**
 * <kmp-sidebar>
 * Native Web Component for premium navigation sidebar with dynamic RBAC support,
 * collapsible category accordions, and desktop Mini-Dock (Rail) mode.
 * Dispatches:
 * - 'navigate' custom event when a menu option is selected.
 * - 'toggle-collapse' custom event when the rail collapse button is clicked.
 * Attributes:
 * - role: Current user's role authorization ('ADMIN', 'OPERARIO', 'VISOR')
 * - active: ID of the currently active view (e.g. 'dashboard')
 * - collapsed: Boolean attribute ('true' / '') when in compact 72px rail mode
 */
export class KmpSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._userRole = 'VISOR';
    this.activeView = 'dashboard';
    this._isCollapsed = false;
    this._collapsedGroups = this._loadCollapsedGroups();
  }

  static get observedAttributes() {
    return ['role', 'active', 'collapsed'];
  }

  _loadCollapsedGroups() {
    try {
      const raw = localStorage.getItem('kmp_sidebar_collapsed_groups');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  _saveCollapsedGroups() {
    try {
      localStorage.setItem(
        'kmp_sidebar_collapsed_groups',
        JSON.stringify(Array.from(this._collapsedGroups))
      );
    } catch {
      // Ignore storage quota errors
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'role') {
      this._userRole = newValue || 'VISOR';
      this.render();
    } else if (name === 'active') {
      this.activeView = newValue || 'dashboard';
      this._ensureActiveGroupExpanded();
      this._updateActiveStateOnly();
    } else if (name === 'collapsed') {
      this._isCollapsed = newValue !== null && newValue !== 'false';
      this._updateCollapsedVisuals();
    }
  }

  connectedCallback() {
    this._isCollapsed = this.hasAttribute('collapsed') && this.getAttribute('collapsed') !== 'false';
    this._ensureActiveGroupExpanded();
    this.render();
  }

  getGroupsDefinition() {
    return [
      {
        id: 'ops',
        title: 'OPERACIONES & LOGÍSTICA',
        items: [
          { id: 'dashboard', icon: '📊', label: 'Dashboard', roles: ['ADMIN', 'OPERARIO', 'VISOR'] },
          { id: 'travels', icon: '🚛', label: 'Gestión de Viajes', roles: ['ADMIN', 'OPERARIO', 'VISOR'] },
          { id: 'logistics-liquidations', icon: '💵', label: 'Liquidación Choferes', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'logistics-fuel', icon: '⛽', label: 'Rendimiento Combustible', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'consumption', icon: '🥩', label: 'Despacho y Stock', roles: ['ADMIN', 'OPERARIO'] }
        ]
      },
      {
        id: 'fin',
        title: 'FINANZAS & CRÉDITO',
        items: [
          { id: 'daily-cash-closings', icon: '🏪', label: 'Cierres de Sucursales', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'fiscal-invoices', icon: '📄', label: 'Comprobantes ARCA', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'checks', icon: '💸', label: 'Gestión de Cheques', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'accounting', icon: '💰', label: 'Caja General', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'frigorifico', icon: '🏢', label: 'Caja Frigorífico', roles: ['ADMIN', 'OPERARIO'] }
        ]
      },
      {
        id: 'tools',
        title: 'HERRAMIENTAS & ANÁLISIS',
        items: [
          { id: 'simulator', icon: '🧮', label: 'Simulador de Costos', roles: ['ADMIN', 'OPERARIO', 'VISOR'] },
          { id: 'price-share', icon: '📲', label: 'Placa de Precios', roles: ['ADMIN', 'OPERARIO'] },
          { id: 'branch-pricing', icon: '🏷️', label: 'Precios & Cartel QR', roles: ['ADMIN', 'OPERARIO'] }
        ]
      },
      {
        id: 'sys',
        title: 'SISTEMA & CONFIGURACIÓN',
        items: [
          { id: 'master-data', icon: '🚚', label: 'Datos Maestros', roles: ['ADMIN'] },
          { id: 'clients', icon: '👥', label: 'Clientes y Cuentas', roles: ['ADMIN'] },
          { id: 'establishments', icon: '🏭', label: 'Sucursales y Personal', roles: ['ADMIN'] },
          { id: 'settings', icon: '⚙️', label: 'Configuración', roles: ['ADMIN'] },
          { id: 'welcome-config', icon: '🎨', label: 'Diseño de Portada', roles: ['ADMIN'] },
          { id: 'contact', icon: '📖', label: 'Info y Contacto', roles: ['ADMIN', 'OPERARIO', 'VISOR'] }
        ]
      }
    ];
  }

  _ensureActiveGroupExpanded() {
    const groups = this.getGroupsDefinition();
    const activeGroup = groups.find(g => g.items.some(i => i.id === this.activeView));
    if (activeGroup && this._collapsedGroups.has(activeGroup.id)) {
      this._collapsedGroups.delete(activeGroup.id);
      this._saveCollapsedGroups();
    }
  }

  _updateActiveStateOnly() {
    if (!this.shadowRoot || !this.shadowRoot.querySelector('.sidebar-scroll')) {
      this.render();
      return;
    }
    this.shadowRoot.querySelectorAll('.nav-item[data-view]').forEach(el => {
      const viewId = el.getAttribute('data-view');
      if (viewId === this.activeView) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
    // Also ensure parent group is expanded in DOM
    const groups = this.getGroupsDefinition();
    const activeGroup = groups.find(g => g.items.some(i => i.id === this.activeView));
    if (activeGroup) {
      const groupEl = this.shadowRoot.querySelector(`.nav-group[data-group="${activeGroup.id}"]`);
      if (groupEl && groupEl.classList.contains('group-collapsed')) {
        groupEl.classList.remove('group-collapsed');
      }
    }
  }

  _updateCollapsedVisuals() {
    if (!this.shadowRoot) return;
    const toggleLabel = this.shadowRoot.querySelector('#collapse-rail-label');
    const toggleIcon = this.shadowRoot.querySelector('#collapse-rail-icon');
    if (toggleLabel) {
      toggleLabel.textContent = this._isCollapsed ? 'Expandir' : 'Colapsar menú';
    }
    if (toggleIcon) {
      toggleIcon.textContent = this._isCollapsed ? '»' : '«';
    }
  }

  getStyles() {
    return `
      :host {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        background: var(--sidebar-bg, #0d0f17);
        color: var(--text-main, #f8fafc);
        box-sizing: border-box;
        position: relative;
        user-select: none;
        overflow: hidden;
      }

      .sidebar-scroll {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 1rem 0.75rem;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      /* Custom Scrollbar */
      .sidebar-scroll::-webkit-scrollbar {
        width: 5px;
      }
      .sidebar-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .sidebar-scroll::-webkit-scrollbar-thumb {
        background: var(--border, rgba(255, 255, 255, 0.1));
        border-radius: 99px;
      }

      /* Collapsible Nav Group */
      .nav-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 0.4rem;
      }

      .group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.65rem;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.18s ease, opacity 0.2s ease;
        margin-bottom: 0.15rem;
      }
      .group-header:hover {
        background: var(--surface-hover, rgba(255, 255, 255, 0.04));
      }

      .group-title {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.66rem;
        font-weight: 800;
        color: var(--text-muted, #64748b);
        letter-spacing: 1.1px;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .group-chevron {
        font-size: 0.72rem;
        color: var(--text-muted, #64748b);
        transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
      }

      .nav-group.group-collapsed .group-chevron {
        transform: rotate(-90deg);
      }

      /* Smooth CSS Grid 1fr -> 0fr Accordion */
      .group-items-wrapper {
        display: grid;
        grid-template-rows: 1fr;
        transition: grid-template-rows 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
        opacity: 1;
      }
      .nav-group.group-collapsed .group-items-wrapper {
        grid-template-rows: 0fr;
        opacity: 0;
      }

      .group-items-inner {
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }

      /* Nav Items */
      .nav-item {
        position: relative;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.83rem;
        font-weight: 600;
        color: var(--text-muted, #94a3b8);
        padding: 0.62rem 0.85rem;
        border-radius: 11px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        transition:
          background-color 0.2s cubic-bezier(0.22, 1, 0.36, 1),
          color 0.2s ease,
          transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
          padding 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        box-sizing: border-box;
        border: 1px solid transparent;
        white-space: nowrap;
      }

      .nav-item:hover {
        background: var(--surface-hover, rgba(255, 255, 255, 0.04));
        color: var(--text-main, #f1f5f9);
        transform: translateX(3px);
      }

      .nav-item:active {
        transform: scale(0.98);
      }

      /* Active Indicator Bar & Highlight */
      .nav-item.active {
        background: var(--nav-active-bg, rgba(185, 28, 28, 0.16));
        border-color: var(--nav-active-border, rgba(239, 68, 68, 0.35));
        color: var(--nav-active-color, #fca5a5);
        font-weight: 700;
        box-shadow: 0 4px 14px rgba(143, 0, 20, 0.10);
      }

      .nav-item.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 20%;
        bottom: 20%;
        width: 3.5px;
        border-radius: 0 4px 4px 0;
        background: var(--primary, #b91c1c);
      }

      .nav-icon {
        font-size: 1.08rem;
        line-height: 1;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .nav-item:hover .nav-icon {
        transform: scale(1.12);
      }

      .nav-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: opacity 0.18s ease;
      }

      /* Footer Controls (Logout + Rail Collapse Toggle) */
      .sidebar-footer {
        padding: 0.65rem 0.75rem;
        border-top: 1px solid var(--border, rgba(255, 255, 255, 0.06));
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        background: var(--sidebar-bg, transparent);
      }

      .nav-item.logout-item {
        color: var(--danger, #f87171);
      }
      .nav-item.logout-item:hover {
        background: rgba(239, 68, 68, 0.10);
        border-color: rgba(239, 68, 68, 0.22);
      }

      .rail-toggle-btn {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-muted, #94a3b8);
        background: var(--surface-subtle, rgba(255, 255, 255, 0.02));
        border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        border-radius: 10px;
        padding: 0.55rem 0.85rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.65rem;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .rail-toggle-btn:hover {
        background: var(--surface-hover, rgba(255, 255, 255, 0.06));
        color: var(--text-main, #ffffff);
        border-color: var(--primary, #b91c1c);
      }
      .rail-toggle-icon {
        font-size: 1rem;
        font-weight: 800;
        width: 24px;
        text-align: center;
        flex-shrink: 0;
      }

      /* =========================================================
         Collapsed Mini-Dock (Rail Mode: 72px)
         ========================================================= */
      :host([collapsed]:not([collapsed="false"])) .sidebar-scroll {
        padding: 0.85rem 0.5rem;
      }
      :host([collapsed]:not([collapsed="false"])) .group-header {
        display: none;
      }
      :host([collapsed]:not([collapsed="false"])) .nav-group.group-collapsed .group-items-wrapper {
        grid-template-rows: 1fr;
        opacity: 1;
      }
      :host([collapsed]:not([collapsed="false"])) .nav-group {
        margin-bottom: 0.2rem;
        padding-bottom: 0.35rem;
        border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.05));
      }
      :host([collapsed]:not([collapsed="false"])) .nav-item {
        justify-content: center;
        padding: 0.65rem 0;
        gap: 0;
      }
      :host([collapsed]:not([collapsed="false"])) .nav-item:hover {
        transform: translateY(-1px);
      }
      :host([collapsed]:not([collapsed="false"])) .nav-label {
        display: none;
      }
      :host([collapsed]:not([collapsed="false"])) .sidebar-footer {
        padding: 0.65rem 0.5rem;
      }
      :host([collapsed]:not([collapsed="false"])) .rail-toggle-btn {
        justify-content: center;
        padding: 0.55rem 0;
      }
      :host([collapsed]:not([collapsed="false"])) #collapse-rail-label {
        display: none;
      }

      /* Floating Tooltip for Rail Mode */
      .rail-tooltip {
        position: fixed;
        left: 78px;
        transform: translateY(-50%) translateX(-6px);
        background: var(--card-bg-solid, #181a26);
        color: var(--text-main, #ffffff);
        border: 1px solid var(--border, rgba(255, 255, 255, 0.14));
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        padding: 0.4rem 0.75rem;
        border-radius: 8px;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.78rem;
        font-weight: 700;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.22, 1, 0.36, 1);
        z-index: 9999;
      }
      .rail-tooltip.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(-50%) translateX(0);
      }

      @media (max-width: 768px) {
        .rail-toggle-btn {
          display: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .group-items-wrapper,
        .group-chevron,
        .nav-item,
        .nav-icon,
        .rail-tooltip {
          transition: none;
        }
      }
    `;
  }

  render() {
    const currentRole = this._userRole;
    const active = this.activeView;
    const groups = this.getGroupsDefinition();

    let htmlContent = `<div class="sidebar-scroll">`;

    groups.forEach(group => {
      const visibleItems = group.items.filter(item => item.roles.includes(currentRole));
      if (visibleItems.length === 0) return;

      const isGroupCollapsed = this._collapsedGroups.has(group.id);

      htmlContent += `
        <div class="nav-group ${isGroupCollapsed ? 'group-collapsed' : ''}" data-group="${group.id}">
          <div class="group-header" data-group-toggle="${group.id}" title="Clic para plegar/desplegar sección">
            <span class="group-title">${group.title}</span>
            <span class="group-chevron">▾</span>
          </div>
          <div class="group-items-wrapper">
            <div class="group-items-inner">
      `;

      visibleItems.forEach(item => {
        const isActiveClass = item.id === active ? 'active' : '';
        htmlContent += `
          <div class="nav-item ${isActiveClass}" data-view="${item.id}" data-tooltip="${item.label}">
            <span class="nav-icon">${item.icon}</span>
            <span class="nav-label">${item.label}</span>
          </div>
        `;
      });

      htmlContent += `
            </div>
          </div>
        </div>
      `;
    });

    htmlContent += `</div>`;

    // Footer with Logout & Rail Collapse Toggle
    htmlContent += `
      <div class="sidebar-footer">
        <div class="nav-item logout-item" id="logout-btn" data-tooltip="Cerrar Sesión">
          <span class="nav-icon">🚪</span>
          <span class="nav-label">Cerrar Sesión</span>
        </div>
        <button type="button" class="rail-toggle-btn" id="collapse-rail-btn" title="Alternar ancho del menú lateral">
          <span class="rail-toggle-icon" id="collapse-rail-icon">${this._isCollapsed ? '»' : '«'}</span>
          <span id="collapse-rail-label">${this._isCollapsed ? 'Expandir' : 'Colapsar menú'}</span>
        </button>
      </div>
      <div class="rail-tooltip" id="rail-tooltip"></div>
    `;

    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      ${htmlContent}
    `;

    this._attachListeners();
  }

  _attachListeners() {
    const tooltip = this.shadowRoot.getElementById('rail-tooltip');

    // Group accordion headers
    this.shadowRoot.querySelectorAll('.group-header').forEach(header => {
      header.addEventListener('click', () => {
        const groupId = header.getAttribute('data-group-toggle');
        const groupEl = this.shadowRoot.querySelector(`.nav-group[data-group="${groupId}"]`);
        if (!groupEl) return;

        const willCollapse = !groupEl.classList.contains('group-collapsed');
        if (willCollapse) {
          groupEl.classList.add('group-collapsed');
          this._collapsedGroups.add(groupId);
        } else {
          groupEl.classList.remove('group-collapsed');
          this._collapsedGroups.delete(groupId);
        }
        this._saveCollapsedGroups();
      });
    });

    // Nav items click & tooltip hover
    this.shadowRoot.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const viewId = item.getAttribute('data-view');
        if (viewId) {
          this.dispatchEvent(new CustomEvent('navigate', {
            detail: { view: viewId },
            bubbles: true,
            composed: true
          }));
          document.body.classList.remove('sidebar-open');
        }
      });

      item.addEventListener('mouseenter', () => {
        if (!this._isCollapsed || !tooltip) return;
        const label = item.getAttribute('data-tooltip');
        if (!label) return;
        const rect = item.getBoundingClientRect();
        tooltip.textContent = label;
        tooltip.style.top = `${rect.top + rect.height / 2}px`;
        tooltip.classList.add('visible');
      });

      item.addEventListener('mouseleave', () => {
        if (tooltip) tooltip.classList.remove('visible');
      });
    });

    // Logout button
    const logoutBtn = this.shadowRoot.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('request-logout', {
          bubbles: true,
          composed: true
        }));
      });
    }

    // Rail collapse button
    const collapseBtn = this.shadowRoot.getElementById('collapse-rail-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        if (tooltip) tooltip.classList.remove('visible');
        this.dispatchEvent(new CustomEvent('toggle-collapse', {
          bubbles: true,
          composed: true
        }));
      });
    }
  }
}

if (!customElements.get('kmp-sidebar')) {
  customElements.define('kmp-sidebar', KmpSidebar);
}
