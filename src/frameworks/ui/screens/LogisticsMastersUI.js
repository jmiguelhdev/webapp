/**
 * @file LogisticsMastersUI.js
 * @description Módulo de interfaz de usuario premium para la administración de Datos Maestros del sistema de logística:
 * camiones, jaulas, choferes, productores y comisionistas.
 * @module ui/screens/LogisticsMastersUI
 * @author Antigravity
 */

import { renderScanResultsModal } from '../components/Modals.js';

/**
 * Renderiza la interfaz principal del gestor de Datos Maestros.
 * @param {HTMLElement} container - Contenedor DOM principal.
 * @param {string} type - Tipo de maestro seleccionado ('camiones', 'jaulas', 'choferes', 'productores', 'comisionistas').
 * @param {Array<Object>} dataList - Lista de registros del maestro seleccionado.
 * @param {Object} [dependencies={}] - Dependencias externas (filtros, paginación, listados secundarios).
 */
export function renderLogisticsMaster(container, type, dataList, dependencies = {}, presenter = null) {
  const tabs = [
    { id: 'camiones', label: '🚚 Camiones', action: 'loadTrucks' },
    { id: 'jaulas', label: '🚚 Jaulas', action: 'loadTrailers' },
    { id: 'choferes', label: '👨‍✈️ Choferes', action: 'loadDrivers' },
    { id: 'productores', label: '👥 Productores', action: 'loadProducers' },
    { id: 'comisionistas', label: '🤝 Comisionistas', action: 'loadAgents' }
  ];

  // Renderizado dinámico y premium de la barra de pestañas (Tabs)
  const tabsHTML = `
    <div class="tabs-container" style="display: flex; gap: 0.75rem; margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);">
      ${tabs.map(t => {
        const isActive = t.id === type;
        return `
          <button class="category-chip ${isActive ? 'active' : ''}" data-action="${t.action}" style="
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border: 1px solid ${isActive ? 'var(--primary)' : 'var(--border)'};
            background: ${isActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)'};
            color: ${isActive ? 'var(--primary)' : 'var(--text-muted)'};
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
          ">
            ${t.label}
          </button>
        `;
      }).join('')}
    </div>
  `;

  const cardsHtml = dataList.map(item => getMasterCardHtml(type, item)).join('');
  const loadMoreBtnHtml = dependencies.hasMore 
    ? `<div id="load-more-wrapper" style="text-align: center; margin-top: 2rem; width: 100%;"><button id="btn-load-more" class="btn-secondary" style="padding: 0.85rem 2rem; border-radius: 12px; font-weight: 700;">Cargar Más</button></div>` 
    : '';

  if (dependencies.isLoadMore) {
    const grid = container.querySelector('#master-cards-grid');
    if (grid) {
      grid.insertAdjacentHTML('beforeend', cardsHtml);
    }
    const oldLoadMore = container.querySelector('#btn-load-more-container');
    if (oldLoadMore) {
      oldLoadMore.innerHTML = loadMoreBtnHtml;
    }
    // Añadimos nuevos elementos al listado cargado en memoria local
    container._currentDataList = (container._currentDataList || []).concat(dataList);
  } else {
    container._currentDataList = dataList;
    container.innerHTML = `
      <div class="dashboard-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2>Administración de Datos Maestros</h2>
          <p style="color: var(--text-muted); margin: 0.25rem 0 0 0;">Gestione los registros fundamentales del sistema de fletes y logística.</p>
        </div>
        <button id="btn-add-master" class="btn-primary" style="padding: 0.85rem 2rem; border-radius: 12px; font-weight: 700; height: 48px; display: flex; align-items: center; gap: 0.5rem;">
          ➕ Nuevo Registro
        </button>
      </div>

      ${tabsHTML}

      <!-- Custom EditText Search Input -->
      <div class="search-container-m3 glass-card" style="
        margin-bottom: 1.75rem; 
        padding: 0.65rem 1.15rem; 
        border-radius: 14px; 
        display: flex; 
        align-items: center; 
        gap: 0.75rem; 
        border: 1px solid var(--border); 
        background: rgba(0,0,0,0.18);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.25s ease;
      ">
        <span style="font-size: 1.15rem; color: var(--primary); display: flex; align-items: center; user-select: none;">🔍</span>
        <input type="text" id="master-search-input" placeholder="${getSearchPlaceholder(type)}" autocomplete="off" style="
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-main);
          font-size: 0.95rem;
          font-weight: 600;
          outline: none;
          padding: 0.25rem 0;
          font-family: inherit;
        ">
        <button id="btn-clear-master-search" title="Limpiar búsqueda" style="
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.1rem;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          margin: 0;
          transition: color 0.2s;
        ">✕</button>
      </div>

      <div style="margin-bottom: 1.5rem; animation: fadeIn 0.3s ease-out;">
        <h3 style="color: var(--text-main); font-size: 1.25rem; font-weight: 700; margin: 0 0 1rem 0;">${getTitle(type)}</h3>
        <div id="master-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
          ${cardsHtml.length > 0 ? cardsHtml : `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--text-muted); background: rgba(255,255,255,0.01); border-radius: 16px; border: 1px dashed var(--border);">
              <span style="font-size: 2.5rem; display: block; margin-bottom: 1rem; opacity: 0.6;">📦</span>
              No hay registros creados en este maestro. Hacé click en "Nuevo Registro" para empezar.
            </div>
          `}
        </div>
      </div>

      <div id="btn-load-more-container">
        ${loadMoreBtnHtml}
      </div>
      <div id="master-modal-container"></div>
    `;

    // Eventos de selección de pestañas (Tabs)
    container.querySelectorAll('.category-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        if (presenter && presenter[action]) {
          presenter[action]();
        }
      });
    });

    document.getElementById('btn-add-master').addEventListener('click', () => {
      showMasterModal(type, null, dependencies, presenter);
    });
  }

  // Manejo del botón "Cargar Más" para paginación
  const loadMoreBtn = container.querySelector('#btn-load-more');
  if (loadMoreBtn) {
    const newBtn = loadMoreBtn.cloneNode(true);
    loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);
    newBtn.addEventListener('click', () => {
      if (presenter && presenter.loadProducers) {
        presenter.loadProducers(dependencies.lastVisible, true);
      }
    });
  }

  // Delegación e inicialización limpia de listeners de edición
  document.querySelectorAll('.btn-edit').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const item = container._currentDataList.find(d => String(d.id) === String(id));
      if (item) showMasterModal(type, item, dependencies, presenter);
    });
  });

  // Delegación e inicialización limpia de listeners de borrado
  document.querySelectorAll('.btn-delete').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('¿Estás seguro de eliminar este registro maestro permanentemente?')) {
        const actionName = `delete${capitalize(getEntityType(type))}`;
        if (presenter && presenter[actionName]) {
          presenter[actionName](id);
        }
      }
    });
  });

  // ----------------------------------------------------
  // REAL-TIME SEARCH FILTER IMPLEMENTATION (EDITTEXT)
  // ----------------------------------------------------
  const searchInput = container.querySelector('#master-search-input');
  const clearBtn = container.querySelector('#btn-clear-master-search');
  const cardsGrid = container.querySelector('#master-cards-grid');

  const filterItem = (itemType, item, query) => {
    if (!query) return true;
    const q = query.toLowerCase();
    
    if (itemType === 'choferes') {
      return (item.name || '').toLowerCase().includes(q) ||
             (item.dni || '').toLowerCase().includes(q) ||
             (item.license || '').toLowerCase().includes(q);
    }
    if (itemType === 'jaulas') {
      return (item.name || '').toLowerCase().includes(q) ||
             (item.licensePlate || '').toLowerCase().includes(q) ||
             (item.type || '').toLowerCase().includes(q);
    }
    if (itemType === 'camiones') {
      return (item.name || '').toLowerCase().includes(q) ||
             (item.licensePlate || '').toLowerCase().includes(q) ||
             (item.driver?.name || '').toLowerCase().includes(q) ||
             (item.trailer?.name || '').toLowerCase().includes(q);
    }
    if (itemType === 'productores') {
      return (item.name || '').toLowerCase().includes(q) ||
             (item.cuit || '').toLowerCase().includes(q) ||
             (item.phone || '').toLowerCase().includes(q) ||
             (item.cbu || '').toLowerCase().includes(q);
    }
    if (itemType === 'comisionistas') {
      return (item.name || '').toLowerCase().includes(q) ||
             (item.phone || '').toLowerCase().includes(q);
    }
    return false;
  };

  const applySearchFilter = () => {
    if (!searchInput || !cardsGrid) return;
    const query = searchInput.value;
    if (clearBtn) {
      clearBtn.style.display = query ? 'flex' : 'none';
    }
    
    const cards = cardsGrid.querySelectorAll('.master-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
      const id = card.dataset.id;
      const item = container._currentDataList.find(d => String(d.id) === String(id));
      if (item) {
        const isMatch = filterItem(type, item, query);
        card.style.display = isMatch ? 'flex' : 'none';
        if (isMatch) visibleCount++;
      }
    });
    
    let emptyMsg = cardsGrid.querySelector('#no-matches-msg');
    if (visibleCount === 0 && cards.length > 0) {
      if (!emptyMsg) {
        cardsGrid.insertAdjacentHTML('beforeend', `
          <div id="no-matches-msg" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); background: rgba(255,255,255,0.01); border-radius: 16px; border: 1px dashed var(--border); animation: fadeIn 0.2s ease;">
            No se encontraron registros que coincidan con la búsqueda.
          </div>
        `);
      }
    } else if (emptyMsg) {
      emptyMsg.remove();
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', applySearchFilter);
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        applySearchFilter();
        searchInput.focus();
      });
    }
    
    const searchContainer = container.querySelector('.search-container-m3');
    if (searchContainer) {
      searchInput.addEventListener('focus', () => {
        searchContainer.style.borderColor = 'var(--primary)';
        searchContainer.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)';
      });
      searchInput.addEventListener('blur', () => {
        searchContainer.style.borderColor = 'var(--border)';
        searchContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      });
    }
  }

  if (dependencies.isLoadMore) {
    applySearchFilter();
  }
}

/**
 * Obtiene el título legible para la sección del maestro activo.
 * @param {string} type - Tipo de maestro.
 * @returns {string} Título representativo.
 */
function getTitle(type) {
  const titles = { 
    choferes: 'Personal de Conducción (Choferes)', 
    jaulas: 'Jaulas de Transporte (Acoplados)', 
    camiones: 'Flota Activa (Camiones)', 
    productores: 'Catálogo de Productores Ganaderos', 
    comisionistas: 'Comisionistas de Compra y Consignación' 
  };
  return titles[type] || 'Gestión de Maestros';
}

/**
 * Obtiene un placeholder específico para el buscador de datos maestros.
 * @param {string} type - Tipo de maestro.
 * @returns {string} Texto descriptivo para el placeholder.
 */
function getSearchPlaceholder(type) {
  const placeholders = {
    choferes: 'Buscar chofer por nombre, DNI o licencia...',
    jaulas: 'Buscar jaula por nombre, patente o tipo (Doble/Simple)...',
    camiones: 'Buscar camión por nombre, patente o chofer/jaula asignados...',
    productores: 'Buscar productor por nombre, CUIT, teléfono o CBU...',
    comisionistas: 'Buscar comisionista por nombre o teléfono...'
  };
  return placeholders[type] || 'Buscar en datos maestros...';
}

/**
 * Traduce el tipo del maestro a la entidad lógica interna del Dominio.
 * @param {string} type - Tipo de maestro.
 * @returns {string} Nombre de la entidad.
 */
function getEntityType(type) {
  const types = { choferes: 'Driver', jaulas: 'Trailer', camiones: 'Truck', productores: 'Producer', comisionistas: 'Agent' };
  return types[type];
}

/**
 * Capitaliza el primer carácter de una cadena de texto.
 * @param {string} s - Cadena a capitalizar.
 * @returns {string} Cadena capitalizada.
 */
function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Genera el código HTML premium de una tarjeta de Datos Maestros según su tipo.
 * @param {string} type - Tipo de maestro.
 * @param {Object} item - Registro del maestro.
 * @returns {string} Fragmento HTML de la tarjeta.
 */
function getMasterCardHtml(type, item) {
  const editSvg = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" /></svg>`;
  const delSvg = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" /></svg>`;

  const actionHtml = `
    <div class="actions" style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.25rem; border-top: 1px solid var(--border); padding-top: 1rem;">
      <button class="btn-icon btn-edit" data-id="${item.id}" title="Editar Registro" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); color: var(--primary); padding: 0.55rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
        ${editSvg}
      </button> 
      <button class="btn-icon btn-delete" data-id="${item.id}" title="Eliminar Registro" style="background: rgba(239, 68, 68, 0.03); border: 1px solid rgba(239, 68, 68, 0.15); color: var(--danger); padding: 0.55rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
        ${delSvg}
      </button>
    </div>
  `;

  let contentHtml = '';

  if (type === 'choferes') {
    contentHtml = `
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(99, 102, 241, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
          ${item.name?.charAt(0) || '?'}
        </div>
        <div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${item.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">ID Interno: ${item.id.toString().slice(-6)}</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.01); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
        <div style="display: flex; justify-content: space-between;"><span>DNI / Identificación</span> <strong style="color: var(--text-main);">${item.dni || '-'}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Licencia Profesional</span> <strong style="color: var(--text-main);">${item.license || '-'}</strong></div>
      </div>
    `;
  } else if (type === 'jaulas') {
    contentHtml = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${item.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Patente: ${item.licensePlate || 'N/A'}</span>
        </div>
        <span class="badge" style="background: rgba(16, 185, 129, 0.08); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.15); font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 8px;">
          ${item.type === 'DOUBLE' ? 'Doble' : 'Simple'}
        </span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.01); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
        <div style="display: flex; justify-content: space-between;"><span>Vencimiento VTV</span> <strong style="color: var(--text-main);">${item.vtvExpiration || '-'}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Vencimiento SENASA</span> <strong style="color: var(--text-main);">${item.senasaExpiration || '-'}</strong></div>
      </div>
    `;
  } else if (type === 'camiones') {
    contentHtml = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${item.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Patente: ${item.licensePlate || 'N/A'}</span>
        </div>
        <span class="badge" style="background: ${item.isFreightPaid ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.08)'}; color: ${item.isFreightPaid ? '#f59e0b' : 'var(--primary)'}; border: 1px solid ${item.isFreightPaid ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)'}; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 8px;">
          ${item.isFreightPaid ? 'Tercero' : 'Propio'}
        </span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.01); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Chofer Designado</span> 
          <span style="color: var(--text-main); font-weight: 600;">
            ${item.driver ? `👤 ${item.driver.name}` : '❌ Sin Asignar'}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Jaula Asignada</span> 
          <span style="color: var(--text-main); font-weight: 600;">
            ${item.trailer ? `🚛 ${item.trailer.name}` : '❌ Sin Asignar'}
          </span>
        </div>
      </div>
    `;
  } else if (type === 'productores') {
    contentHtml = `
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
          ${item.name?.charAt(0) || '?'}
        </div>
        <div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${item.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">CUIT: ${item.cuit || '-'}</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.01); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
        <div style="display: flex; justify-content: space-between;"><span>Teléfono Contacto</span> <strong style="color: var(--text-main);">${item.phone || '-'}</strong></div>
        <div style="display: flex; justify-content: space-between; flex-direction: column; gap: 0.25rem;">
          <span>CBU / Cuenta Bancaria</span> 
          <span style="font-family: monospace; font-size: 0.8rem; background: rgba(255,255,255,0.02); padding: 0.25rem 0.5rem; border-radius: 4px; color: var(--text-main); border: 1px solid var(--border); overflow-x: auto; white-space: nowrap; max-width: 100%; display: block;">
            ${item.cbu || 'N/A'}
          </span>
        </div>
      </div>
    `;
  } else if (type === 'comisionistas') {
    contentHtml = `
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
          ${item.name?.charAt(0) || '?'}
        </div>
        <div>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${item.name}</div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Comisionista Asociado</span>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.01); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
        <div style="display: flex; justify-content: space-between;"><span>Teléfono Contacto</span> <strong style="color: var(--text-main);">${item.phone || '-'}</strong></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Porcentaje Comisión</span> 
          <span style="color: var(--success); font-weight: 800; font-size: 1rem;">
            ${item.percent || '0'} %
          </span>
        </div>
      </div>
    `;
  }

  return `
    <div class="glass-card master-card" data-id="${item.id}" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; height: 100%; border-radius: 16px; transition: all 0.25s ease;">
      <div>${contentHtml}</div>
      ${actionHtml}
    </div>
  `;
}

/**
 * Abre y dibuja el modal premium interactivo para creación o edición de un registro maestro.
 * @param {string} type - Tipo de maestro ('camiones', 'jaulas', 'choferes', 'productores', 'comisionistas').
 * @param {Object|null} item - Registro del maestro a editar, o null si es una nueva creación.
 * @param {Object} dependencies - Colecciones de datos dependientes necesarias para los selectores del formulario.
 */
function showMasterModal(type, item, dependencies, presenter = null) {
  const container = document.getElementById('master-modal-container');
  if (!container) return;

  const isEdit = !!item;
  const entitySingular = capitalize(type.slice(0, -1));
  const title = isEdit ? `Editar ${entitySingular}` : `Nuevo ${entitySingular}`;
  
  let formHTML = '';
  if (type === 'choferes') {
    formHTML = `
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Nombre Completo</label><input type="text" id="m-name" value="${item?.name || ''}" required style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Número de DNI</label><input type="text" id="m-dni" value="${item?.dni || ''}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Código Licencia</label><input type="text" id="m-license" value="${item?.license || ''}" style="border-radius:10px;"></div>
    `;
  } else if (type === 'jaulas') {
    formHTML = `
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Nombre Identificador</label><input type="text" id="m-name" value="${item?.name || ''}" required style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Patente / Matrícula</label><input type="text" id="m-plate" value="${item?.licensePlate || ''}" style="border-radius:10px;"></div>
      <div class="form-group">
        <label style="font-weight:600; margin-bottom:0.5rem; display:block;">Tipo de Acoplado</label>
        <select id="m-type" style="border-radius:10px; width:100%;">
          <option value="SIMPLE" ${item?.type === 'SIMPLE' ? 'selected' : ''}>Simple</option>
          <option value="DOUBLE" ${item?.type === 'DOUBLE' ? 'selected' : ''}>Doble</option>
        </select>
      </div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Vencimiento VTV</label><input type="date" id="m-vtv" value="${item?.vtvExpiration || ''}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Vencimiento Registro SENASA</label><input type="date" id="m-senasa" value="${item?.senasaExpiration || ''}" style="border-radius:10px;"></div>
    `;
  } else if (type === 'camiones') {
    const driversOpts = (dependencies.drivers || []).map(d => `<option value="${d.id}" ${item?.driver?.id == d.id ? 'selected' : ''}>${d.name}</option>`).join('');
    const trailersOpts = (dependencies.trailers || []).map(t => `<option value="${t.id}" ${item?.trailer?.id == t.id ? 'selected' : ''}>${t.name}</option>`).join('');
    formHTML = `
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Nombre Identificador</label><input type="text" id="m-name" value="${item?.name || ''}" required style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Patente / Matrícula</label><input type="text" id="m-plate" value="${item?.licensePlate || ''}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Vencimiento VTV</label><input type="date" id="m-vtv" value="${item?.vtvExpiration || ''}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Vencimiento Seguro Obligatorio</label><input type="date" id="m-insurance" value="${item?.insuranceExpiration || ''}" style="border-radius:10px;"></div>
      <div class="form-group" style="display:flex; align-items:center; gap:0.5rem; margin:1rem 0;">
        <input type="checkbox" id="m-freight" ${item?.isFreightPaid ? 'checked' : ''} style="width:18px; height:18px; margin:0; cursor:pointer;">
        <label for="m-freight" style="font-weight:600; cursor:pointer; margin:0;">Flete Pagado a Tercero</label>
      </div>
      <div class="form-group">
        <label style="font-weight:600; margin-bottom:0.5rem; display:block;">Chofer Asignado</label>
        <select id="m-driver" style="border-radius:10px; width:100%;"><option value="">-- Ninguno (Vacante) --</option>${driversOpts}</select>
      </div>
      <div class="form-group">
        <label style="font-weight:600; margin-bottom:0.5rem; display:block;">Jaula Asignada</label>
        <select id="m-trailer" style="border-radius:10px; width:100%;"><option value="">-- Ninguna --</option>${trailersOpts}</select>
      </div>
    `;
  } else if (type === 'productores') {
    formHTML = `
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Razón Social / Nombre</label><input type="text" id="m-name" value="${item?.name || ''}" required style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Teléfono de Contacto</label><input type="text" id="m-phone" value="${item?.phone || ''}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">CUIT del Productor</label><input type="text" id="m-cuit" value="${item?.cuit || ''}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">CBU / Alias</label><input type="text" id="m-cbu" value="${item?.cbu || ''}" style="border-radius:10px;"></div>
    `;
  } else if (type === 'comisionistas') {
    formHTML = `
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Nombre Completo</label><input type="text" id="m-name" value="${item?.name || ''}" required style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Teléfono de Contacto</label><input type="text" id="m-phone" value="${item?.phone || ''}" style="border-radius:10px;"></div>
      <div class="form-group"><label style="font-weight:600; margin-bottom:0.5rem; display:block;">Porcentaje de Comisión (%)</label><input type="number" step="0.1" id="m-percent" value="${item?.percent || ''}" style="border-radius:10px;"></div>
    `;
  }

  container.innerHTML = `
    <div class="modal-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      animation: fadeIn 0.25s ease-out;
    ">
      <div class="modal active glass-card" id="master-modal" style="
        width: 100%;
        max-width: 500px;
        padding: 2rem;
        border-radius: 20px;
        background: var(--card-bg);
        border: 1px solid var(--border);
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        max-height: 90vh;
        overflow-y: auto;
      ">
        <h3 style="margin-top:0; color: var(--primary); font-size:1.4rem; margin-bottom:1.5rem; font-weight:700;">${title}</h3>
        <form id="master-form">
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${formHTML}
          </div>
          <div class="modal-actions" style="margin-top: 2rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn-secondary" id="btn-cancel-modal" style="padding:0.75rem 1.5rem; border-radius:12px; font-weight:600;">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" style="padding:0.75rem 2rem; border-radius:12px; font-weight:700;">
              💾 Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Listener para cerrar modal
  document.getElementById('btn-cancel-modal').addEventListener('click', () => {
    container.innerHTML = '';
  });

  // ----------------------------------------------------
  // REAL-TIME MODAL INPUT VALIDATION (OPTION 3)
  // ----------------------------------------------------
  const mainContent = document.getElementById('content');
  const currentDataList = (mainContent && mainContent._currentDataList) ? mainContent._currentDataList : [];
  
  let targetInput = null;
  let validationType = ''; // 'dni', 'plate', 'cuit', 'name'
  
  if (type === 'choferes') {
    targetInput = document.getElementById('m-dni');
    validationType = 'dni';
  } else if (type === 'jaulas' || type === 'camiones') {
    targetInput = document.getElementById('m-plate');
    validationType = 'plate';
  } else if (type === 'productores') {
    targetInput = document.getElementById('m-cuit');
    validationType = 'cuit';
  } else if (type === 'comisionistas') {
    targetInput = document.getElementById('m-name');
    validationType = 'name';
  }

  if (targetInput) {
    // Append a small warning element right below the input
    const warningEl = document.createElement('span');
    warningEl.id = 'dup-error-msg';
    warningEl.style.cssText = 'color: #f87171; font-size: 0.78rem; font-weight: 600; margin-top: 0.25rem; display: none;';
    targetInput.parentNode.appendChild(warningEl);

    const submitBtn = document.querySelector('#master-form button[type="submit"]');

    const validateInput = () => {
      const val = targetInput.value;
      let isDuplicate = false;
      let errorMsg = '';

      if (validationType === 'dni') {
        const cleanVal = val.replace(/\D/g, '');
        isDuplicate = currentDataList.some(d => 
          String(d.id) !== String(item?.id) && 
          String(d.dni || '').replace(/\D/g, '') === cleanVal && 
          cleanVal.length > 0
        );
        errorMsg = `Ya existe un chofer registrado con este DNI (${val}).`;
      } else if (validationType === 'plate') {
        const cleanVal = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        isDuplicate = currentDataList.some(d => 
          String(d.id) !== String(item?.id) && 
          String(d.licensePlate || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanVal && 
          cleanVal.length > 0
        );
        const nameType = type === 'jaulas' ? 'jaula' : 'camión';
        errorMsg = `Ya existe un${type === 'jaulas' ? 'a' : ''} ${nameType} con esta patente (${val.toUpperCase()}).`;
      } else if (validationType === 'cuit') {
        const cleanVal = val.replace(/\D/g, '');
        isDuplicate = currentDataList.some(d => 
          String(d.id) !== String(item?.id) && 
          String(d.cuit || '').replace(/\D/g, '') === cleanVal && 
          cleanVal.length > 0
        );
        errorMsg = `Ya existe un productor registrado con este CUIT (${val}).`;
      } else if (validationType === 'name') {
        const cleanVal = val.trim().toLowerCase();
        isDuplicate = currentDataList.some(d => 
          String(d.id) !== String(item?.id) && 
          String(d.name || '').trim().toLowerCase() === cleanVal && 
          cleanVal.length > 0
        );
        errorMsg = `Ya existe un comisionista registrado con este nombre ("${val}").`;
      }

      if (isDuplicate) {
        targetInput.style.borderColor = '#f87171';
        targetInput.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
        warningEl.textContent = `❌ ${errorMsg}`;
        warningEl.style.display = 'block';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.style.opacity = '0.5';
          submitBtn.style.cursor = 'not-allowed';
        }
      } else {
        targetInput.style.borderColor = '';
        targetInput.style.boxShadow = '';
        warningEl.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
        }
      }
    };

    targetInput.addEventListener('input', validateInput);
    // Run validation immediately in case an existing duplicate was pre-loaded
    validateInput();
  }

  // Manejo del envío del formulario
  document.getElementById('master-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = { id: item ? item.id : Date.now() };

    if (type === 'choferes') {
      payload.name = document.getElementById('m-name').value;
      payload.dni = document.getElementById('m-dni').value;
      payload.license = document.getElementById('m-license').value;
    } else if (type === 'jaulas') {
      payload.name = document.getElementById('m-name').value;
      payload.licensePlate = document.getElementById('m-plate').value;
      payload.type = document.getElementById('m-type').value;
      payload.vtvExpiration = document.getElementById('m-vtv').value;
      payload.senasaExpiration = document.getElementById('m-senasa').value;
    } else if (type === 'camiones') {
      payload.name = document.getElementById('m-name').value;
      payload.licensePlate = document.getElementById('m-plate').value;
      payload.vtvExpiration = document.getElementById('m-vtv').value;
      payload.insuranceExpiration = document.getElementById('m-insurance').value;
      payload.isFreightPaid = document.getElementById('m-freight').checked;
      
      const driverId = document.getElementById('m-driver').value;
      payload.driver = driverId ? dependencies.drivers.find(d => String(d.id) === driverId) : null;
      
      const trailerId = document.getElementById('m-trailer').value;
      payload.trailer = trailerId ? dependencies.trailers.find(t => String(t.id) === trailerId) : null;
    } else if (type === 'productores') {
      payload.name = document.getElementById('m-name').value;
      payload.phone = document.getElementById('m-phone').value;
      payload.cuit = document.getElementById('m-cuit').value;
      payload.cbu = document.getElementById('m-cbu').value;
      // Preservamos el catálogo de productos existente al editar
      payload.listOfProducts = item ? item.listOfProducts : [];
    } else if (type === 'comisionistas') {
      payload.name = document.getElementById('m-name').value;
      payload.phone = document.getElementById('m-phone').value;
      payload.percent = Number(document.getElementById('m-percent').value);
    }

    container.innerHTML = '';
    
    // Delegación limpia e inocua del guardado
    const actionName = `save${capitalize(getEntityType(type))}`;
    if (presenter && presenter[actionName]) {
      presenter[actionName](payload);
    }
  });
}
