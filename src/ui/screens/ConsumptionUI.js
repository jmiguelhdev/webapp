import { el } from '../../utils/dom.js';

export function renderFaenaConsumption(container, options) {
  const { 
    state, 
    stockItems, 
    historyItems,
    allTropas = [],
    finishedTropas = [],
    onTabSwitch,
    onToggleSelection,
    onSelectAll,
    onClearSelection,
    onDestinationInput,
    onDispatch,
    onFilterChange,
    onToggleSort,
    onStockSearch,
    onCategoryChange,
    onTropaChange,
    onCategoryPriceInput = () => {}
  } = options;

  const activeId = document.activeElement ? document.activeElement.id : null;
  const selectionStart = document.activeElement ? document.activeElement.selectionStart : null;
  const selectionEnd = document.activeElement ? document.activeElement.selectionEnd : null;

  container.innerHTML = '';
  const wrapper = el('div', { classes: ['dashboard', 'fade-in'] });

  // 1. Header & Tabs
  const header = el('div', { classes: ['dashboard-header'] });
  header.innerHTML = `<h2>🥩 Módulo Faena</h2>`;
  
  const tabs = el('div', { classes: ['dashboard-filters'] });
  const btnStock = el('button', { classes: [state.activeTab === 'STOCK' ? 'btn-primary' : 'btn-outline'], text: 'Inventario Disponible' });
  const btnHistory = el('button', { classes: [state.activeTab === 'HISTORY' ? 'btn-primary' : 'btn-outline'], text: 'Historial de Despachos' });
  
  btnStock.onclick = () => onTabSwitch('STOCK');
  btnHistory.onclick = () => onTabSwitch('HISTORY');

  tabs.appendChild(btnStock);
  tabs.appendChild(btnHistory);
  header.appendChild(tabs);
  wrapper.appendChild(header);

  // Global Category Chips
  const categoryFilters = el('div', { classes: ['dashboard-filters'], style: 'margin-bottom: 2rem; justify-content: flex-start; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem;' });
  const categories = ['ALL', 'NOVILLO', 'VACA', 'VAQUILLONA', 'TORO', 'OTRO'];
  const catNames = { 'ALL': 'Todas', 'NOVILLO': 'Novillo', 'VACA': 'Vaca', 'VAQUILLONA': 'Vaquillona', 'TORO': 'Toro', 'OTRO': 'Otro' };
  
  categories.forEach(cat => {
    const isCatActive = state.categoryFilter === cat;
    const catBtn = el('button', { 
      classes: ['filter-chip'], 
      text: catNames[cat],
      style: `
        padding: 0.4rem 1rem; 
        border-radius: 20px; 
        font-size: 0.85rem; 
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid ${isCatActive ? 'var(--primary)' : 'var(--border)'};
        background: ${isCatActive ? 'var(--primary)' : 'transparent'};
        color: ${isCatActive ? '#ffffff' : 'var(--text-main)'};
      `
    });
    catBtn.onclick = () => onCategoryChange(cat);
    categoryFilters.appendChild(catBtn);
  });
  
  wrapper.appendChild(categoryFilters);

  // --- Camara Filter ---
  const camaraFilterRow = el('div', { style: 'display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap;' });
  camaraFilterRow.appendChild(el('span', { text: 'Cámara:', style: 'font-size: 0.8rem; color: var(--text-muted); font-weight: 600; white-space: nowrap;' }));
  
  const camaraChipsWrap = el('div', { style: 'display: flex; gap: 0.5rem; flex-wrap: wrap; overflow-x: auto;' });
  
  const allCamaraBtn = el('button', { 
    text: 'Todas', 
    style: `padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${state.camaraFilter === 'ALL' ? 'var(--primary)' : 'var(--border)'}; background: ${state.camaraFilter === 'ALL' ? 'var(--primary)' : 'transparent'}; color: ${state.camaraFilter === 'ALL' ? '#fff' : 'var(--text-main)'}; cursor: pointer; transition: all 0.15s;` 
  });
  allCamaraBtn.onclick = () => options.onCamaraChange('ALL');
  camaraChipsWrap.appendChild(allCamaraBtn);

  (options.camarasList || []).forEach(camara => {
    const camaraName = typeof camara === 'string' ? camara : camara.name;
    const capacity = typeof camara === 'object' && camara.capacity ? camara.capacity : 0;
    const occupancy = options.camaraOccupancy[camaraName] || 0;
    
    let displayStr = camaraName;
    if (capacity > 0) {
       displayStr += ` (${occupancy}/${capacity})`;
    } else {
       displayStr += ` (${occupancy})`;
    }

    const isWarning = capacity > 0 && occupancy > capacity;
    const isActive = state.camaraFilter === camaraName;
    
    const chip = el('button', { 
      text: displayStr,
      style: `padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${isActive ? 'var(--primary)' : isWarning ? 'var(--danger)' : 'var(--border)'}; background: ${isActive ? 'var(--primary)' : isWarning ? 'rgba(239,68,68,0.1)' : 'transparent'}; color: ${isActive ? '#fff' : isWarning ? 'var(--danger)' : 'var(--text-main)'}; cursor: pointer; transition: all 0.15s; font-weight: ${isWarning ? '600' : '400'}`
    });
    chip.onclick = () => options.onCamaraChange(camaraName);
    camaraChipsWrap.appendChild(chip);
  });

  camaraFilterRow.appendChild(camaraChipsWrap);
  wrapper.appendChild(camaraFilterRow);

  // --- Tropa Filter ---
  const tropaFilterRow = el('div', { style: 'display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap;' });
  tropaFilterRow.appendChild(el('span', { text: 'Tropa:', style: 'font-size: 0.8rem; color: var(--text-muted); font-weight: 600; white-space: nowrap;' }));
  
  const tropaChipsWrap = el('div', { style: 'display: flex; gap: 0.5rem; flex-wrap: wrap; overflow-x: auto;' });
  
  const allTropaBtn = el('button', { 
    text: 'Todas', 
    style: `padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${state.tropaFilter === 'ALL' ? 'var(--primary)' : 'var(--border)'}; background: ${state.tropaFilter === 'ALL' ? 'var(--primary)' : 'transparent'}; color: ${state.tropaFilter === 'ALL' ? '#fff' : 'var(--text-main)'}; cursor: pointer; transition: all 0.15s;` 
  });
  allTropaBtn.onclick = () => onTropaChange('ALL');
  tropaChipsWrap.appendChild(allTropaBtn);

  allTropas.forEach(tropa => {
    const isFinished = finishedTropas.includes(tropa);
    const isActive = state.tropaFilter === tropa;
    const chip = el('button', { 
      text: `Tr. ${tropa}${isFinished ? ' ✓' : ''}`,
      style: `padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${isActive ? 'var(--primary)' : isFinished ? '#10b981' : 'var(--border)'}; background: ${isActive ? 'var(--primary)' : isFinished ? 'rgba(16,185,129,0.1)' : 'transparent'}; color: ${isActive ? '#fff' : isFinished ? '#10b981' : 'var(--text-main)'}; cursor: pointer; transition: all 0.15s; font-weight: ${isFinished ? '600' : '400'};`
    });
    chip.onclick = () => onTropaChange(tropa);
    tropaChipsWrap.appendChild(chip);
  });

  tropaFilterRow.appendChild(tropaChipsWrap);
  wrapper.appendChild(tropaFilterRow);

  if (state.activeTab === 'STOCK') {

    // --- Unassigned Warning ---
    if (options.unassignedCount > 0) {
      const banner = el('div', { style: 'background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 1rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;' });
      banner.innerHTML = `
        <span style="font-size: 1.5rem;">⚠️</span>
        <div>
          <div style="font-weight: 700; color: var(--danger); font-size: 0.95rem;">Reses sin cámara asignada</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Hay ${options.unassignedCount} medias reses que no se encuentran especificadas en ninguna cámara.</div>
        </div>
      `;
      wrapper.appendChild(banner);
    }

    // --- Finished Troops Panel ---
    if (finishedTropas.length > 0) {
      const finishedPanel = el('div', { style: 'background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; padding: 1rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;' });
      finishedPanel.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
          <span style="font-size: 1.5rem;">✅</span>
          <div>
            <div style="font-weight: 700; color: #10b981; font-size: 0.95rem;">Tropas Finalizadas: ${finishedTropas.length}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Todos sus garrones fueron despachados.</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          ${finishedTropas.map(t => `<span style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.4); border-radius: 8px; padding: 0.2rem 0.6rem; font-size: 0.78rem; font-weight: 600;">Tr. ${t}</span>`).join('')}
        </div>
      `;
      wrapper.appendChild(finishedPanel);
    }

    // Stats Grid
    const totals = stockItems.reduce((acc, item) => {
      acc.kg += item.kg || 0;
      acc.count += 1;
      const cat = item.standardizedCategory || 'OTRO';
      if (!acc.byCategory[cat]) acc.byCategory[cat] = { kg: 0, count: 0 };
      acc.byCategory[cat].kg += item.kg || 0;
      acc.byCategory[cat].count += 1;
      return acc;
    }, { kg: 0, count: 0, byCategory: {} });

    const statsGrid = el('div', { classes: ['stats-grid'] });
    const addStat = (title, val, subtitle) => {
      statsGrid.appendChild(el('div', { classes: ['stat-card', 'glass-card'], html: `<h3>${title}</h3><div class="stat-value">${val}</div><div class="stat-subtitle">${subtitle}</div>` }));
    };

    addStat('Total Reses', totals.count, `${totals.kg.toFixed(1)} kg Colgados`);
    Object.keys(totals.byCategory).forEach(cat => {
      addStat(`Stock ${cat}`, totals.byCategory[cat].count, `${totals.byCategory[cat].kg.toFixed(1)} kg`);
    });
    wrapper.appendChild(statsGrid);

    // Dispatch Panel (If items selected)
    if (state.selectedIds.size > 0) {
      const selectedItems = stockItems.filter(i => state.selectedIds.has(i.id));
      const selKg = selectedItems.reduce((s, i) => s + (i.kg || 0), 0);

      const byCategory = {};
      selectedItems.forEach(item => {
        const cat = item.standardizedCategory || 'OTRO';
        if (!byCategory[cat]) byCategory[cat] = { kg: 0, count: 0 };
        byCategory[cat].kg += item.kg || 0;
        byCategory[cat].count += 1;
      });

      const catEntries = Object.entries(byCategory);
      const multiCat = catEntries.length > 1;

      let grandTotal = 0;
      catEntries.forEach(([cat, data]) => {
        const p = parseFloat(state.categoryPriceInputs?.[cat]) || 0;
        grandTotal += data.kg * p;
      });

      const panel = el('div', { classes: ['glass-card'], style: 'margin-bottom: 2rem; border-left: 4px solid #ef4444; padding: 1.5rem;' });
      
      const panelHeader = el('div', { style: 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;' });
      panelHeader.innerHTML = `<h3 style="color: #ef4444; margin: 0;">📦 Preparando Despacho: ${selectedItems.length} piezas (${selKg.toFixed(1)} kg)</h3>`;
      const clearBtn = el('button', { classes: ['btn-outline'], text: 'Limpiar Selección', style: 'font-size: 0.8rem; padding: 0.2rem 0.6rem;' });
      clearBtn.onclick = () => onClearSelection();
      panelHeader.appendChild(clearBtn);
      panel.appendChild(panelHeader);

      const destRow = el('div', { style: 'margin-bottom: 1.25rem;' });
      destRow.innerHTML = `
        <label style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">Destino / Cliente</label>
        <input type="text" id="dispatch-dest" class="form-input" list="clients-list" style="width: 100%; max-width: 400px;" placeholder="Ej: Carnicería Centro" value="${state.destinationInput}">
        <datalist id="clients-list">
          ${(options.clients || []).map(c => `<option value="${c.name}">`).join('')}
        </datalist>
      `;
      panel.appendChild(destRow);

      const catTable = el('div', { style: 'margin-bottom: 1.25rem;' });
      
      if (multiCat) {
        catTable.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; font-weight: 600;">Precio por Categoría</div>`;
        const grid = el('div', { style: 'display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.5rem; align-items: center;' });
        grid.innerHTML = `
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; padding: 0 0.5rem;">Categoría</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; padding: 0 0.5rem;">Kg totales</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; padding: 0 0.5rem;">$/kg</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; padding: 0 0.5rem;">Subtotal</div>
        `;
        catEntries.forEach(([cat, data]) => {
          const priceVal = state.categoryPriceInputs?.[cat] || '';
          const subtotal = data.kg * (parseFloat(priceVal) || 0);
          grid.innerHTML += `
            <div style="padding: 0.4rem 0.5rem; font-weight: 600; color: var(--text-main);">${cat}</div>
            <div style="padding: 0.4rem 0.5rem; color: var(--text-muted);">${data.kg.toFixed(1)} kg <span style="font-size:0.75rem;">(${data.count} pz)</span></div>
            <div style="padding: 0.4rem 0.5rem;">
              <input type="number" class="form-input cat-price-input" data-cat="${cat}"
                style="width: 100%; padding: 0.3rem 0.5rem; font-size: 0.85rem;"
                placeholder="$/kg" value="${priceVal}">
            </div>
            <div style="padding: 0.4rem 0.5rem; font-weight: 700; color: #10b981;" id="subtotal-${cat}">
              ${subtotal > 0 ? '$' + subtotal.toLocaleString(undefined, { minimumFractionDigits: 0 }) : '—'}
            </div>
          `;
        });
        catTable.appendChild(grid);
      } else {
        const cat = catEntries[0][0];
        const priceVal = state.categoryPriceInputs?.[cat] || '';
        catTable.innerHTML = `
          <label style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">Precio por Kg — ${cat} ($/kg)</label>
          <input type="number" class="form-input cat-price-input" data-cat="${cat}"
            style="width: 100%; max-width: 200px;" placeholder="$/kg" value="${priceVal}">
        `;
      }
      panel.appendChild(catTable);

      const footer = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 1rem;' });
      
      const moveControls = el('div', { style: 'display: flex; gap: 0.5rem; align-items: center; border-right: 1px solid var(--border); padding-right: 1rem;' });
      moveControls.innerHTML = `
        <select id="move-camara-select" class="form-input" style="padding: 0.5rem; max-width: 150px;">
          <option value="">-- Mover a --</option>
          ${(options.camarasList || []).map(c => {
             const cName = typeof c === 'string' ? c : c.name;
             return `<option value="${cName}">${cName}</option>`;
          }).join('')}
        </select>
        <button id="move-camara-btn" class="btn-outline" style="padding: 0.5rem 1rem; margin: 0; font-size: 0.85rem;">⮂ Mover</button>
      `;
      footer.appendChild(moveControls);

      const dispatchControls = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; flex: 1;' });
      dispatchControls.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 600;">
          Total Estimado: <span style="color: #10b981;" id="grand-total-disp">$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
        </div>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <button id="cancel-dispatch-btn" style="background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 12px; padding: 0.7rem 1.2rem; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">✕ Cancelar</button>
          <button id="dispatch-btn" style="background: #ef4444; color: white; border: none; border-radius: 12px; padding: 0.7rem 1.5rem; font-weight: 700; cursor: pointer; font-size: 0.9rem;">🚚 Confirmar Salida</button>
        </div>
      `;
      footer.appendChild(dispatchControls);
      
      panel.appendChild(footer);
      wrapper.appendChild(panel);

      panel.querySelector('#move-camara-btn').onclick = () => {
        const sel = panel.querySelector('#move-camara-select').value;
        if (sel) {
          options.onMoveToCamara(sel);
        } else {
          alert('Selecciona una cámara destino');
        }
      };
      panel.querySelector('#dispatch-dest').addEventListener('input', e => onDestinationInput(e.target.value));
      panel.querySelector('#cancel-dispatch-btn').onclick = () => onClearSelection();
      panel.querySelector('#dispatch-btn').onclick = () => onDispatch();

      panel.querySelectorAll('.cat-price-input').forEach(input => {
        input.addEventListener('input', e => {
          const cat = e.target.dataset.cat;
          const val = e.target.value;
          onCategoryPriceInput(cat, val);

          const catData = byCategory[cat];
          if (catData) {
            const sub = catData.kg * (parseFloat(val) || 0);
            const subtotalEl = panel.querySelector(`#subtotal-${cat}`);
            if (subtotalEl) subtotalEl.textContent = sub > 0 ? '$' + sub.toLocaleString(undefined, { minimumFractionDigits: 0 }) : '—';
          }
          let newGrand = 0;
          panel.querySelectorAll('.cat-price-input').forEach(inp => {
            const c = inp.dataset.cat;
            const p = parseFloat(inp.value) || 0;
            newGrand += (byCategory[c]?.kg || 0) * p;
          });
          const gtEl = panel.querySelector('#grand-total-disp');
          if (gtEl) gtEl.textContent = '$' + newGrand.toLocaleString(undefined, { minimumFractionDigits: 0 });
        });
      });
    }

    const listCard = el('div', { classes: ['glass-card'], style: 'flex: 1;' });
    const listHeader = el('div', { style: 'display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; flex-wrap: wrap;' });
    
    const stockSearchInput = el('input', { 
        classes: ['form-input'], 
        style: 'flex: 1; max-width: 300px; padding: 0.5rem; font-size: 0.9rem;',
        attrs: { id: 'stock-search', type: 'text', placeholder: '🔎 Buscar Tropa, Garron, Kg...', value: state.stockSearch }
    });
    stockSearchInput.addEventListener('input', (e) => onStockSearch(e.target.value));

    listHeader.innerHTML = `<h3 style="margin: 0; min-width: 200px;">Medias Reses en Cámara</h3>`;
    listHeader.appendChild(stockSearchInput);
    listHeader.appendChild(el('div', { style: 'flex-grow: 1;' }));
    
    const selectAllBtn = el('button', { classes: ['btn-outline'], text: 'Seleccionar Todas', style: 'font-size: 0.8rem;' });
    selectAllBtn.onclick = () => onSelectAll(stockItems.map(i => i.id));
    listHeader.appendChild(selectAllBtn);
    listCard.appendChild(listHeader);

    const tableWrap = el('div', { style: 'overflow-x: auto;' });
    const table = document.createElement('table');
    table.className = 'faena-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.textAlign = 'left';
    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted);">
          <th style="padding: 1rem; width: 50px;">Sel</th>
          <th id="sort-garron-stock" style="padding: 1rem; cursor: pointer; user-select: none;" title="Ordenar por Número de Garron">
            Nº Garron ${state.sortOrder === 'asc' ? '▲' : '▼'}
          </th>
          <th style="padding: 1rem;">Mitad (Mz)</th>
          <th style="padding: 1rem;">Categoría</th>
          <th style="padding: 1rem;">Kilos</th>
          <th style="padding: 1rem;">Cámara</th>
          <th style="padding: 1rem;">Ingreso</th>
        </tr>
      </thead>
      <tbody id="stock-tbody"></tbody>
    `;

    table.querySelector('#sort-garron-stock').onclick = () => onToggleSort();

    const tbody = table.querySelector('#stock-tbody');
    if (stockItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding: 2rem; text-align: center; color: var(--text-muted);">No hay stock disponible. Carga reportes de faena desde la pestaña Viajes.</td></tr>`;
    } else {
      stockItems.forEach(item => {
        const isSel = state.selectedIds.has(item.id);
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border)';
        tr.style.background = isSel ? 'rgba(239, 68, 68, 0.1)' : 'transparent';
        tr.style.cursor = 'pointer';
        
        const isUnassigned = !item.camaraId;
        const camaraDisplay = isUnassigned ? '<span style="color: var(--danger); font-weight: 600;">⚠️ Sin Asignar</span>' : `<span style="color: var(--primary);">${item.camaraId}</span>`;

        tr.innerHTML = `
          <td style="padding: 1rem;"><input type="checkbox" ${isSel ? 'checked' : ''} style="transform: scale(1.2); cursor: pointer; pointer-events: none;"></td>
          <td style="padding: 1rem; font-weight: 500;">#${item.garron}</td>
          <td style="padding: 1rem;">Mitad ${item.half || '1'}</td>
          <td style="padding: 1rem;">${item.standardizedCategory || item.category}</td>
          <td style="padding: 1rem; font-weight: bold; color: #10b981;">${item.kg.toFixed(1)} kg</td>
          <td style="padding: 1rem; font-weight: 500;">${camaraDisplay}</td>
          <td style="padding: 1rem; font-size: 0.85rem; color: var(--text-muted);">${item.pdfDate} (Tr. ${item.tropa})</td>
        `;
        
        tr.onclick = (e) => {
          if (e.target.tagName !== 'INPUT') {
            onToggleSelection(item.id);
          } else {
            e.preventDefault();
            onToggleSelection(item.id);
          }
        };
        tbody.appendChild(tr);
      });
    }

    tableWrap.appendChild(table);
    listCard.appendChild(tableWrap);
    wrapper.appendChild(listCard);

  } else {
    // --- HISTORY VIEW ---
    const filterPanel = el('div', { classes: ['glass-card'], style: 'margin-bottom: 1.5rem; display: flex; gap: 1rem;' });
    filterPanel.innerHTML = `
      <div class="form-group" style="flex: 1; margin: 0;">
        <label>Búsqueda General</label>
        <input type="text" id="hist-search" class="form-input" placeholder="Tropa, Garron, Kg..." value="${state.historyFilters.search || ''}">
      </div>
      <div class="form-group" style="flex: 1.5; margin: 0;">
        <label>Destino / Cliente</label>
        <input type="text" id="hist-dest" class="form-input" placeholder="Buscar carnicería..." value="${state.historyFilters.destination}">
      </div>
      <div class="form-group" style="flex: 1; margin: 0;">
        <label>Fecha de Salida</label>
        <input type="date" id="hist-date" class="form-input" value="${state.historyFilters.date}">
      </div>
    `;
    wrapper.appendChild(filterPanel);

    filterPanel.querySelector('#hist-search').addEventListener('input', (e) => onFilterChange('search', e.target.value));
    filterPanel.querySelector('#hist-dest').addEventListener('input', (e) => onFilterChange('destination', e.target.value));
    filterPanel.querySelector('#hist-date').addEventListener('change', (e) => onFilterChange('date', e.target.value));

    const histCard = el('div', { classes: ['glass-card'] });
    histCard.innerHTML = `<h3 style="margin-bottom: 1rem;">Historial Integrado</h3>`;
    
    const tableWrap = el('div', { style: 'overflow-x: auto;' });
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.textAlign = 'left';
    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted);">
          <th style="padding: 1rem;">Fecha Salida</th>
          <th style="padding: 1rem;">Destino / Cliente</th>
          <th id="sort-garron-hist" style="padding: 1rem; cursor: pointer; user-select: none;">
            Nº Garron ${state.sortOrder === 'asc' ? '▲' : '▼'}
          </th>
          <th style="padding: 1rem;">Mitad (Mz)</th>
          <th style="padding: 1rem;">Categoría</th>
          <th style="padding: 1rem;">Kilos</th>
        </tr>
      </thead>
      <tbody>
        ${historyItems.length === 0 ? `<tr><td colspan="6" style="padding: 2rem; text-align: center; color: var(--text-muted);">No se encontraron salidas.</td></tr>` : 
          historyItems.map(h => `
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 1rem;">${h.dispatchDate ? new Date(h.dispatchDate).toLocaleDateString() : 'N/A'}</td>
              <td style="padding: 1rem; font-weight: 500; color: #ef4444;">${h.destination || 'Sin Destino'}</td>
              <td style="padding: 1rem;">#${h.garron}</td>
              <td style="padding: 1rem;">Mitad ${h.half || '1'}</td>
              <td style="padding: 1rem;">${h.standardizedCategory || h.category}</td>
              <td style="padding: 1rem;">${h.kg ? h.kg.toFixed(1) : 0} kg</td>
            </tr>
          `).join('')
        }
      </tbody>
    `;
    tableWrap.appendChild(table);
    
    table.querySelector('#sort-garron-hist').onclick = () => onToggleSort();

    histCard.appendChild(tableWrap);
    wrapper.appendChild(histCard);
  }

  container.appendChild(wrapper);

  if (activeId) {
    const elToFocus = document.getElementById(activeId);
    if (elToFocus) {
      elToFocus.focus();
      if (selectionStart !== null && selectionEnd !== null && (elToFocus.type === 'text' || elToFocus.type === 'search')) {
        elToFocus.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }
}
