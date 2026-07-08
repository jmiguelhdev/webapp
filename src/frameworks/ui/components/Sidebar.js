import { el } from '../../../frameworks/utils/dom.js';

/**
 * Renders the navigation sidebar with role-based visibility and premium logical groupings.
 * Organizes 15 separate system tools into distinct operational, financial, analytical,
 * and administrative areas for enhanced ergonomics and premium visuals.
 *
 * @param {HTMLElement} container - The container where the menu list will be rendered.
 * @param {Function} onNavigate - Callback triggered when a menu link is clicked.
 * @param {string} userRole - Current user's role authorization (ADMIN, OPERARIO, VISOR).
 */
export function renderSidebar(container, onNavigate, userRole) {
  if (!container) return;

  const currentRole = userRole || 'VISOR';

  // --- curating navigation groups & access authorization ---
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

  container.innerHTML = '';
  const ul = el('ul', { style: 'list-style: none; padding: 0.5rem; margin: 0; display: flex; flex-direction: column; gap: 0.25rem;' });

  let isFirstGroup = true;

  groups.forEach(group => {
    // Filter visible items in this group based on current user role permissions
    const visibleItems = group.items.filter(item => item.roles.includes(currentRole));

    if (visibleItems.length === 0) return;

    // Render group title divider
    const groupHeader = el('div', {
      text: group.title,
      style: `font-size: 0.68rem; font-weight: 800; color: var(--text-muted); opacity: 0.45; letter-spacing: 1.2px; padding: ${isFirstGroup ? '0.5rem' : '1.25rem'} 0.75rem 0.45rem 0.75rem; text-transform: uppercase; ${isFirstGroup ? '' : 'border-top: 1px solid rgba(255,255,255,0.03);'}`
    });
    ul.appendChild(groupHeader);
    isFirstGroup = false;

    // Render each item
    visibleItems.forEach(item => {
      const li = el('li', {
        text: item.label,
        classes: ['nav-item'],
        attrs: { 'data-view': item.id },
        style: 'padding: 0.75rem 1rem; border-radius: 12px; cursor: pointer; transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); margin-bottom: 0.15rem; font-weight: 600;'
      });

      li.onclick = () => {
        // Toggle active status cleanly
        ul.querySelectorAll('li').forEach(l => l.classList.remove('active'));
        li.classList.add('active');

        if (typeof onNavigate === 'function') {
          onNavigate(item.id);
        }

        // Close sidebar drawer automatically on responsive screens/mobile viewport sizes
        document.body.classList.remove('sidebar-open');
      };

      ul.appendChild(li);
    });
  });

  // Render bottom premium logout action button
  const logoutLi = el('li', {
    text: '🚪 Cerrar Sesión',
    classes: ['nav-item', 'logout-item'],
    style: 'padding: 0.75rem 1rem; margin-top: 2rem; border-radius: 12px; cursor: pointer; color: var(--danger); font-weight: 700; transition: all 0.22s ease;'
  });

  logoutLi.onclick = () => {
    if (confirm('¿Deseas cerrar sesión del sistema?')) {
      window.dispatchEvent(new CustomEvent('app:logout'));
    }
  };

  ul.appendChild(logoutLi);
  container.appendChild(ul);
}
