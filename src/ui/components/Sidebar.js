import { el } from '../../utils/dom.js';

/**
 * Renders the navigation sidebar with role-based visibility.
 * @param {HTMLElement} container - The container where the menu list will be rendered.
 * @param {Function} onNavigate - Callback when a link is clicked.
 * @param {string} userRole - Current user's role (ADMIN, OPERARIO, VISOR).
 */
export function renderSidebar(container, onNavigate, userRole) {
  if (!container) return;

  const isAdmin = userRole === 'ADMIN';
  const isVisor = userRole === 'VISOR';

  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard', roles: ['ADMIN', 'OPERARIO', 'VISOR'] },
    { id: 'travels', label: '🚛 Gestión de Viajes', roles: ['ADMIN', 'OPERARIO', 'VISOR'] },
    { id: 'logistics-travels', label: '🚚 Carga de Viajes (Logística)', roles: ['ADMIN', 'OPERARIO'] },
    { id: 'logistics-drivers', label: '🚚 Choferes', roles: ['ADMIN'] },
    { id: 'logistics-trailers', label: '🚚 Jaulas', roles: ['ADMIN'] },
    { id: 'logistics-trucks', label: '🚚 Camiones', roles: ['ADMIN'] },
    { id: 'logistics-liquidations', label: '💵 Liquidación Choferes', roles: ['ADMIN', 'OPERARIO'] },
    { id: 'logistics-fuel', label: '⛽ Rendimiento Combustible', roles: ['ADMIN', 'OPERARIO'] },
    { id: 'consumption', label: '🥩 Despacho y Stock', roles: ['ADMIN', 'OPERARIO'] },
    { id: 'simulator', label: '🧮 Simulador de Costos', roles: ['ADMIN', 'OPERARIO', 'VISOR'] },
    { id: 'price-share', label: '📲 Placa de Precios', roles: ['ADMIN', 'OPERARIO'] },
    { id: 'checks', label: '💸 Gestión de Cheques', roles: ['ADMIN', 'OPERARIO'] },
    { id: 'accounting', label: '💰 Caja General', roles: ['ADMIN', 'OPERARIO'] },
    { id: 'frigorifico', label: '🏢 Caja Frigorífico', roles: ['ADMIN', 'OPERARIO'] },
    { id: 'clients', label: '👥 Clientes y Cuentas', roles: ['ADMIN'] },
    { id: 'settings', label: '⚙️ Configuración', roles: ['ADMIN'] },
    { id: 'contact', label: '📖 Info y Contacto', roles: ['ADMIN', 'OPERARIO', 'VISOR'] },
  ];

  container.innerHTML = '';
  const ul = el('ul', { style: 'list-style: none; padding: 0.5rem; margin: 0;' });

  menuItems.forEach(item => {
    // Hidden items for restricted roles
    if (!item.roles.includes(userRole)) return;

    const li = el('li', { 
      text: item.label,
      classes: ['nav-item'],
      attrs: { 'data-view': item.id },
      style: 'padding: 0.75rem 1rem; margin-bottom: 0.5rem; border-radius: 12px; cursor: pointer; transition: all 0.2s ease;'
    });

    li.onclick = () => {
      // Toggle active class
      ul.querySelectorAll('li').forEach(l => l.classList.remove('active'));
      li.classList.add('active');
      
      onNavigate(item.id);
      
      // Close sidebar on mobile after navigation
      document.body.classList.remove('sidebar-open');
    };

    ul.appendChild(li);
  });

  // Logout section at the bottom
  const logoutLi = el('li', { 
    text: '🚪 Cerrar Sesión',
    classes: ['nav-item', 'logout-item'],
    style: 'padding: 0.75rem 1rem; margin-top: 2rem; border-radius: 12px; cursor: pointer; color: var(--danger); font-weight: 500;'
  });
  
  logoutLi.onclick = () => {
    if (confirm('¿Deseas cerrar sesión?')) {
      window.dispatchEvent(new CustomEvent('app:logout'));
    }
  };

  ul.appendChild(logoutLi);
  container.appendChild(ul);
}
