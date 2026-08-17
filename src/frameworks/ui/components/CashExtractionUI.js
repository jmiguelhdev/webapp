/**
 * CashExtractionUI.js
 * Componente UI para renderizar la pestaña "Extracciones por Recibir" en la Caja General.
 * Incluye chips multi-seleccionables por carnicería, filtro por rango de fechas, búsqueda y KPIs dinámicos.
 */
import { el } from '../../../frameworks/utils/dom.js';
import { formatCurrency, formatDate, formatTime } from '../../../frameworks/utils/formatters.js';

export function buildExtractionsTab({ extractions = [], userRole = 'VISOR', onSaveEntry, onOpenControlScreen, onOpenDetailScreen }) {
  const container = el('div', { classes: ['extractions-tab-container'] });

  // Estado local para filtros
  let currentSearch = '';
  let currentStatus = 'PENDING'; // Por defecto pendientes
  let selectedButcheries = []; // Array de nombres de carnicerías seleccionadas ([] = todas)
  let startDate = '';
  let endDate = '';

  // Extraer carnicerías únicas
  const butcheryCounts = {};
  extractions.forEach(e => {
    const b = (e.butcheryName || 'Sucursal').trim();
    butcheryCounts[b] = (butcheryCounts[b] || 0) + 1;
  });
  const allButcheries = Object.keys(butcheryCounts).sort((a, b) => a.localeCompare(b));

  // Helper para extraer fecha en formato YYYY-MM-DD
  function extractIsoDate(ext) {
    const raw = ext.timestamp || ext.createdAt || ext.date || ext.updatedAt;
    if (!raw) return '';
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
      return raw.substring(0, 10);
    }
    let dateObj = null;
    if (typeof raw?.toDate === 'function') {
      dateObj = raw.toDate();
    } else if (raw?.seconds) {
      dateObj = new Date(raw.seconds * 1000);
    } else if (typeof raw === 'number' || typeof raw === 'string') {
      dateObj = new Date(raw);
    }
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Contenedor de KPIs / Métricas dinámicas
  const statsContainer = el('div', {
    classes: ['stats-grid'],
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1.25rem; margin-bottom: 1.75rem;'
  });
  container.appendChild(statsContainer);

  // Tarjeta de Controles y Filtros
  const filterCard = el('div', {
    classes: ['glass-card'],
    style: 'margin-bottom: 1.5rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.15rem; border: 1px solid var(--border); border-radius: 16px; background: var(--card-bg); box-shadow: var(--elevation-1);'
  });
  container.appendChild(filterCard);

  // Table Wrapper
  const tableWrapper = el('div', { classes: ['glass-card', 'table-responsive'], style: 'padding: 0; border-radius: 16px; overflow: hidden; border: 1px solid var(--border);' });
  container.appendChild(tableWrapper);

  /**
   * Filtra las extracciones según los criterios actuales
   */
  function getFilteredData() {
    const term = currentSearch.trim().toLowerCase();

    return extractions.filter(e => {
      // 1. Filtro de Estado
      const isStatusMatch = currentStatus === 'ALL' || 
                           (currentStatus === 'PENDING' && e.status !== 'ACCEPTED') || 
                           (currentStatus === 'ACCEPTED' && e.status === 'ACCEPTED');
      if (!isStatusMatch) return false;

      // 2. Filtro de Carnicerías (Multi-selección)
      const butchery = (e.butcheryName || 'Sucursal').trim();
      if (selectedButcheries.length > 0 && !selectedButcheries.includes(butchery)) {
        return false;
      }

      // 3. Filtro de Fechas
      const isoDate = extractIsoDate(e);
      if (startDate && isoDate && isoDate < startDate) return false;
      if (endDate && isoDate && isoDate > endDate) return false;

      // 4. Búsqueda por texto (Carnicería, descripción/precinto, sesión o monto)
      if (term) {
        const bLower = butchery.toLowerCase();
        const desc = (e.description || '').toLowerCase();
        const session = (e.cashSessionId || '').toLowerCase();
        const amountStr = String(e.amount || '');
        if (!bLower.includes(term) && !desc.includes(term) && !session.includes(term) && !amountStr.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Renderiza los KPIs dinámicamente
   */
  function renderStats(filtered) {
    const pendingList = filtered.filter(e => e.status !== 'ACCEPTED');
    const acceptedList = filtered.filter(e => e.status === 'ACCEPTED');

    const totalPendingAmount = pendingList.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalAcceptedAmount = acceptedList.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalAmount = totalPendingAmount + totalAcceptedAmount;

    statsContainer.innerHTML = '';
    statsContainer.appendChild(createStatCard('⏳ Retiros Pendientes', `${pendingList.length} retiros`, formatCurrency(totalPendingAmount), '#f59e0b'));
    statsContainer.appendChild(createStatCard('✅ Retiros Ingresados', `${acceptedList.length} retiros`, formatCurrency(totalAcceptedAmount), '#10b981'));
    statsContainer.appendChild(createStatCard('💵 Total de la Selección', `${filtered.length} extracciones`, formatCurrency(totalAmount), '#6366f1'));
    statsContainer.appendChild(createStatCard('🏢 Carnicerías Activas', selectedButcheries.length > 0 ? `${selectedButcheries.length} seleccionadas` : `Todas (${allButcheries.length})`, selectedButcheries.length > 0 ? selectedButcheries.join(', ') : 'Todas las sucursales', '#38bdf8', true));
  }

  /**
   * Renderiza la barra de controles (Búsqueda, Fechas, Estado y Chips)
   */
  function renderFilterControls() {
    const hasActiveFilters = currentSearch || currentStatus !== 'ALL' || selectedButcheries.length > 0 || startDate || endDate;

    filterCard.innerHTML = `
      <!-- Fila 1: Búsqueda, Estado y Filtro de Fechas -->
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; justify-content: space-between;">
        <!-- Barra de búsqueda -->
        <div style="
          flex: 1; 
          min-width: 260px;
          display: flex; 
          align-items: center; 
          gap: 0.6rem; 
          background: var(--bg-main); 
          border: 1px solid var(--border); 
          border-radius: 12px; 
          padding: 0.55rem 0.9rem;
        ">
          <span style="font-size: 1.1rem; color: var(--primary); user-select: none;">🔍</span>
          <input 
            type="text" 
            id="ext-search-input" 
            placeholder="Buscar por carnicería, precinto, sesión u observaciones..." 
            value="${escapeHtml(currentSearch)}"
            style="flex: 1; border: none; background: transparent; color: var(--text-main); font-size: 0.9rem; outline: none; font-family: inherit;"
          />
          <button id="clear-search-btn" title="Limpiar búsqueda" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; padding: 0.1rem; display: ${currentSearch ? 'block' : 'none'};">✕</button>
        </div>

        <!-- Selector de Estado -->
        <div style="display: flex; align-items: center; gap: 0.5rem; white-space: nowrap;">
          <label style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">Estado:</label>
          <select id="ext-status-select" style="
            background: var(--bg-main);
            color: var(--text-main);
            border: 1px solid var(--border);
            padding: 0.55rem 0.85rem;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
            outline: none;
            cursor: pointer;
          ">
            <option value="ALL" ${currentStatus === 'ALL' ? 'selected' : ''}>Todos los estados</option>
            <option value="PENDING" ${currentStatus === 'PENDING' ? 'selected' : ''}>⏳ Pendientes de Ingreso</option>
            <option value="ACCEPTED" ${currentStatus === 'ACCEPTED' ? 'selected' : ''}>✅ Ingresados</option>
          </select>
        </div>

        <!-- Filtro de Fechas (Desde / Hasta) -->
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; background: rgba(0,0,0,0.15); padding: 0.35rem 0.75rem; border-radius: 12px; border: 1px solid var(--border);">
          <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">📅 Fechas:</span>
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">Desde:</span>
            <input 
              type="date" 
              id="ext-date-start" 
              value="${startDate}" 
              style="background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; padding: 0.35rem 0.55rem; font-size: 0.82rem; outline: none;"
            />
          </div>
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">Hasta:</span>
            <input 
              type="date" 
              id="ext-date-end" 
              value="${endDate}" 
              style="background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; padding: 0.35rem 0.55rem; font-size: 0.82rem; outline: none;"
            />
          </div>
          ${(startDate || endDate) ? `
            <button id="clear-dates-btn" title="Limpiar rango de fechas" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; border-radius: 6px; padding: 0.25rem 0.5rem; font-size: 0.75rem; cursor: pointer; font-weight: 600;">
              ✕ Borrar
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Fila 2: Chips Multi-Seleccionables de Carnicerías -->
      <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.85rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">🥩 Filtrar por Carnicería:</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">(Selecciona una o varias simultáneamente)</span>
          </div>
          ${hasActiveFilters ? `
            <button id="btn-reset-all-filters" class="btn-outline" style="padding: 0.25rem 0.75rem; font-size: 0.75rem; border-radius: 8px; color: var(--text-muted); cursor: pointer;">
              🔄 Restablecer Filtros
            </button>
          ` : ''}
        </div>

        <div id="butchery-chips-container" style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <!-- Chip "Todas" -->
          <button type="button" class="butchery-chip ${selectedButcheries.length === 0 ? 'active' : ''}" data-butchery="__ALL__" style="
            padding: 0.4rem 0.85rem;
            border-radius: 20px;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid ${selectedButcheries.length === 0 ? 'var(--primary)' : 'var(--border)'};
            background: ${selectedButcheries.length === 0 ? 'var(--primary-container)' : 'rgba(255,255,255,0.04)'};
            color: ${selectedButcheries.length === 0 ? 'var(--on-primary-container)' : 'var(--text-muted)'};
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 0.35rem;
          ">
            <span>🏢</span>
            <span>Todas (${extractions.length})</span>
          </button>

          <!-- Chips de cada carnicería -->
          ${allButcheries.map(bName => {
            const isSelected = selectedButcheries.includes(bName);
            const count = butcheryCounts[bName] || 0;
            return `
              <button type="button" class="butchery-chip ${isSelected ? 'active' : ''}" data-butchery="${escapeHtml(bName)}" style="
                padding: 0.4rem 0.85rem;
                border-radius: 20px;
                font-size: 0.82rem;
                font-weight: 600;
                cursor: pointer;
                border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'};
                background: ${isSelected ? 'var(--primary-container)' : 'rgba(255,255,255,0.04)'};
                color: ${isSelected ? 'var(--on-primary-container)' : 'var(--text-main)'};
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 0.35rem;
              ">
                <span>🥩</span>
                <span>${escapeHtml(bName)}</span>
                <span style="background: ${isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}; padding: 0.1rem 0.4rem; border-radius: 10px; font-size: 0.72rem;">${count}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Event Listeners de Búsqueda
    const searchInputEl = filterCard.querySelector('#ext-search-input');
    const clearSearchBtnEl = filterCard.querySelector('#clear-search-btn');
    if (searchInputEl) {
      searchInputEl.oninput = (e) => {
        currentSearch = e.target.value;
        if (clearSearchBtnEl) {
          clearSearchBtnEl.style.display = currentSearch ? 'block' : 'none';
        }
        const filtered = getFilteredData();
        renderStats(filtered);
        renderTable(filtered);
      };
    }
    if (clearSearchBtnEl) {
      clearSearchBtnEl.onclick = () => {
        currentSearch = '';
        updateUI();
      };
    }

    // Event Listener de Estado
    const statusSelectEl = filterCard.querySelector('#ext-status-select');
    if (statusSelectEl) {
      statusSelectEl.onchange = (e) => {
        currentStatus = e.target.value;
        updateUI();
      };
    }

    // Event Listeners de Fechas
    const dateStartEl = filterCard.querySelector('#ext-date-start');
    const dateEndEl = filterCard.querySelector('#ext-date-end');
    const clearDatesBtnEl = filterCard.querySelector('#clear-dates-btn');

    if (dateStartEl) {
      dateStartEl.onchange = (e) => {
        startDate = e.target.value;
        updateUI();
      };
    }
    if (dateEndEl) {
      dateEndEl.onchange = (e) => {
        endDate = e.target.value;
        updateUI();
      };
    }
    if (clearDatesBtnEl) {
      clearDatesBtnEl.onclick = () => {
        startDate = '';
        endDate = '';
        updateUI();
      };
    }

    // Event Listener de Reset General
    const resetAllBtnEl = filterCard.querySelector('#btn-reset-all-filters');
    if (resetAllBtnEl) {
      resetAllBtnEl.onclick = () => {
        currentSearch = '';
        currentStatus = 'ALL';
        selectedButcheries = [];
        startDate = '';
        endDate = '';
        updateUI();
      };
    }

    // Event Listeners de Chips de Carnicerías
    filterCard.querySelectorAll('.butchery-chip').forEach(btn => {
      btn.onclick = () => {
        const b = btn.dataset.butchery;
        if (b === '__ALL__') {
          selectedButcheries = [];
        } else {
          if (selectedButcheries.includes(b)) {
            selectedButcheries = selectedButcheries.filter(item => item !== b);
          } else {
            selectedButcheries.push(b);
          }
        }
        updateUI();
      };
    });
  }

  /**
   * Renderiza la tabla de datos
   */
  function renderTable(filtered) {
    tableWrapper.innerHTML = '';
    const table = el('table', { style: 'width: 100%; min-width: 800px; border-collapse: collapse;' });

    const thead = el('thead', { html: `
      <tr style="background: rgba(255,255,255,0.05); text-align: left;">
        <th style="padding: 1rem;">Fecha / Hora</th>
        <th style="padding: 1rem;">Carnicería / Sucursal</th>
        <th style="padding: 1rem;">Detalle / Precinto</th>
        <th style="padding: 1rem; text-align: right;">Monto Extraído</th>
        <th style="padding: 1rem; text-align: center;">Estado</th>
        <th style="padding: 1rem; text-align: right;">Acciones</th>
      </tr>
    `});
    table.appendChild(thead);

    const tbody = el('tbody');
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding: 3.5rem 2rem; text-align: center; color: var(--text-muted);">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem; opacity: 0.7;">🔍</div>
        <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem;">No se encontraron extracciones</div>
        <div style="font-size: 0.85rem; margin-bottom: 1.25rem;">Pruebe ajustando los filtros de carnicería, fechas, estado o el término de búsqueda.</div>
        <button id="btn-empty-reset" class="btn-outline" style="padding: 0.5rem 1.25rem; border-radius: 8px; cursor: pointer;">🔄 Restablecer Filtros</button>
      </td></tr>`;
      tbody.querySelector('#btn-empty-reset')?.addEventListener('click', () => {
        currentSearch = '';
        currentStatus = 'ALL';
        selectedButcheries = [];
        startDate = '';
        endDate = '';
        updateUI();
      });
    } else {
      filtered.forEach(ext => {
        const isPending = ext.status !== 'ACCEPTED';
        const formattedDate = formatDate(ext.timestamp || ext.createdAt || Date.now());
        const formattedTime = formatTime(ext.timestamp || ext.createdAt || Date.now());

        const tr = el('tr', { style: 'border-top: 1px solid var(--border); transition: background 0.2s;' });
        tr.onmouseenter = () => { tr.style.background = 'rgba(255,255,255,0.03)'; };
        tr.onmouseleave = () => { tr.style.background = 'transparent'; };

        tr.innerHTML = `
          <td style="padding: 1rem;">
            <div style="font-weight: 600;">${formattedDate}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${formattedTime}</div>
          </td>
          <td style="padding: 1rem;">
            <div style="font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 0.35rem;">
              <span>🥩</span>
              <span>${ext.butcheryName || 'Sucursal'}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Sesión: ${ext.cashSessionId || '-'}</div>
          </td>
          <td style="padding: 1rem;">
            <div style="font-size: 0.9rem;">${ext.description || 'Sin observaciones'}</div>
          </td>
          <td style="padding: 1rem; text-align: right; font-weight: 800; color: var(--success); font-size: 1.05rem; font-family: monospace;">
            ${formatCurrency(ext.amount)}
          </td>
          <td style="padding: 1rem; text-align: center;">
            ${isPending 
              ? `<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; white-space: nowrap;">⏳ Pendiente</span>`
              : `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; white-space: nowrap;">✅ Ingresado</span>`
            }
          </td>
          <td style="padding: 1rem; text-align: right; white-space: nowrap;">
            ${isPending
              ? userRole === 'ADMIN'
                ? `<button class="btn-primary process-btn" style="padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; background: linear-gradient(135deg, #10b981, #059669); cursor: pointer;">📥 Controlar y Dar Ingreso</button>`
                : `<span title="Requiere perfil Administrador para procesar" style="font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 0.4rem 0.75rem; border-radius: 6px; border: 1px solid var(--border);">🔒 Solo Admin</span>`
              : `<button class="btn-secondary detail-btn" style="padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.85rem; cursor: pointer;">🔍 Ver Billetes</button>`
            }
          </td>
        `;

        tr.addEventListener('click', (e) => {
          if (e.target.closest('.process-btn')) {
            if (typeof onOpenControlScreen === 'function') {
              onOpenControlScreen(ext);
            }
          }
          if (e.target.closest('.detail-btn')) {
            if (typeof onOpenDetailScreen === 'function') {
              onOpenDetailScreen(ext);
            }
          }
        });

        tbody.appendChild(tr);
      });
    }

    table.appendChild(tbody);
    tableWrapper.appendChild(table);
  }

  function updateUI() {
    const filtered = getFilteredData();
    renderStats(filtered);
    renderFilterControls();
    renderTable(filtered);
  }

  // Render inicial
  updateUI();
  return container;
}

function createStatCard(label, sublabel, value, color, isTextOnly = false) {
  const card = el('div', {
    classes: ['glass-card'],
    style: `padding: 1.15rem; display: flex; flex-direction: column; gap: 0.35rem; border-left: 4px solid ${color}; border-radius: 14px; background: var(--card-bg); border-top: 1px solid var(--border); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);`
  });
  card.appendChild(el('div', { text: label, style: 'font-size: 0.8rem; color: var(--text-muted); font-weight: 600;' }));
  card.appendChild(el('div', { text: value, style: `font-size: ${isTextOnly ? '0.95rem' : '1.35rem'}; font-weight: 800; color: ${color}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` }));
  card.appendChild(el('div', { text: sublabel, style: 'font-size: 0.75rem; color: var(--text-muted); font-weight: 500;' }));
  return card;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
