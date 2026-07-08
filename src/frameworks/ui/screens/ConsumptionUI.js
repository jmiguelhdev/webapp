/**
 * @file ConsumptionUI.js
 * @description Capa de presentación (Screen) para el módulo de control de faena, stock de cámaras,
 * achuras, preparación de despachos y auditoría histórica.
 * Gestiona el renderizado dinámico en el DOM, la lectura automatizada por cámara con OCR, pitidos de 
 * confirmación y delega en su totalidad la lógica matemática de stock al modelo de dominio FaenaStock.
 */

import { el } from '../../../frameworks/utils/dom.js';
import { printDispatchPreparation } from '../reports/ReportService.js';

import { openScannerModal, openEditCategoryModal, showMovementsHistoryModal, openChangeDestinationModal } from '../components/ConsumptionModals.js';
export function renderFaenaConsumption(container, options) {
  const { 
    state, 
    stockItems, 
    historyItems,
    faenaStockSummary,
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
    onCategoryPriceInput = () => {},
    onEditCategory = () => {}
  } = options;

  const activeId = document.activeElement ? document.activeElement.id : null;
  const selectionStart = document.activeElement ? document.activeElement.selectionStart : null;
  const selectionEnd = document.activeElement ? document.activeElement.selectionEnd : null;

  container.innerHTML = '';
  const wrapper = el('div', { classes: ['dashboard', 'fade-in'] });

  const header = el('div', { 
    classes: ['dashboard-header'], 
    style: 'display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;' 
  });
  
  const titleContainer = el('div', { style: 'display: flex; align-items: center; gap: 0.75rem;' });
  titleContainer.innerHTML = `
    <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard" style="margin: 0; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;">
      <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: var(--text-main);"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <div>
      <h2 style="margin: 0; font-size: 1.5rem;">🥩 Control de Faena e Inventario</h2>
      <p style="margin: 0.1rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Gestión de stock, cámaras de frío y despachos.</p>
    </div>
  `;
  titleContainer.querySelector('#back-to-dash').onclick = options.onBack;
  header.appendChild(titleContainer);
  
  const tabs = el('div', { 
    style: 'display: flex; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0.35rem; gap: 0.25rem;' 
  });

  const getTabStyle = (isActive) => `
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: ${isActive ? '700' : '500'};
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: ${isActive ? 'var(--primary)' : 'transparent'};
    color: ${isActive ? 'var(--on-primary)' : 'var(--text-muted)'};
    box-shadow: ${isActive ? '0 4px 12px rgba(132, 29, 29, 0.3)' : 'none'};
  `;
  
  const btnStock = el('button', { style: getTabStyle(state.activeTab === 'STOCK'), text: '📦 Dispónible' });
  const btnDrafts = el('button', { style: getTabStyle(state.activeTab === 'DRAFTS'), text: '📝 Preparaciones' });
  const btnHistory = el('button', { style: getTabStyle(state.activeTab === 'HISTORY'), text: '📜 Historial' });
  const btnAchuras = el('button', { style: getTabStyle(state.activeTab === 'ACHURAS'), text: '🥩 Achuras' });

  btnStock.onclick = () => onTabSwitch('STOCK');
  btnDrafts.onclick = () => onTabSwitch('DRAFTS');
  btnHistory.onclick = () => onTabSwitch('HISTORY');
  btnAchuras.onclick = () => onTabSwitch('ACHURAS');

  tabs.appendChild(btnStock);
  tabs.appendChild(btnDrafts);
  tabs.appendChild(btnHistory);
  tabs.appendChild(btnAchuras);
  
  header.appendChild(tabs);
  wrapper.appendChild(header);

  const toolbarContainer = el('div', { 
    style: 'display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; background: rgba(255,255,255,0.02); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border);'
  });

  const categoryFilters = el('div', { style: 'display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;' });
  categoryFilters.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; min-width: 60px;">Filtro:</span>`;
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
        color: ${isCatActive ? 'var(--on-primary)' : 'var(--text-main)'};
      `
    });
    catBtn.onclick = () => onCategoryChange(cat);
    categoryFilters.appendChild(catBtn);
  });
  
  toolbarContainer.appendChild(categoryFilters);

  const camaraFilterRow = el('div', { style: 'display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;' });
  camaraFilterRow.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; min-width: 60px;">Cámara:</span>`;
  
  const camaraChipsWrap = el('div', { style: 'display: flex; gap: 0.5rem; flex-wrap: wrap; overflow-x: auto;' });
  
  const allCamaraBtn = el('button', { 
    text: 'Todas', 
    style: `padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${state.camaraFilter === 'ALL' ? 'var(--primary)' : 'var(--border)'}; background: ${state.camaraFilter === 'ALL' ? 'var(--primary)' : 'transparent'}; color: ${state.camaraFilter === 'ALL' ? 'var(--on-primary)' : 'var(--text-main)'}; cursor: pointer; transition: all 0.15s;` 
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
      style: `padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${isActive ? 'var(--primary)' : isWarning ? 'var(--danger)' : 'var(--border)'}; background: ${isActive ? 'var(--primary)' : isWarning ? 'rgba(239,68,68,0.1)' : 'transparent'}; color: ${isActive ? 'var(--on-primary)' : isWarning ? 'var(--danger)' : 'var(--text-main)'}; cursor: pointer; transition: all 0.15s; font-weight: ${isWarning ? '600' : '400'}`
    });
    chip.onclick = () => options.onCamaraChange(camaraName);
    camaraChipsWrap.appendChild(chip);
  });

  camaraFilterRow.appendChild(camaraChipsWrap);
  toolbarContainer.appendChild(camaraFilterRow);

  const tropaFilterRow = el('div', { style: 'display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;' });
  tropaFilterRow.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; min-width: 60px;">Tropa:</span>`;
  
  const tropaChipsWrap = el('div', { style: 'display: flex; gap: 0.5rem; flex-wrap: wrap; overflow-x: auto;' });
  
  const allTropaBtn = el('button', { 
    text: 'Todas', 
    style: `padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${state.tropaFilter === 'ALL' ? 'var(--primary)' : 'var(--border)'}; background: ${state.tropaFilter === 'ALL' ? 'var(--primary)' : 'transparent'}; color: ${state.tropaFilter === 'ALL' ? 'var(--on-primary)' : 'var(--text-main)'}; cursor: pointer; transition: all 0.15s;` 
  });
  allTropaBtn.onclick = () => onTropaChange('ALL');
  tropaChipsWrap.appendChild(allTropaBtn);

  const finishedList = allTropas.filter(t => finishedTropas.includes(t));
  const activeList = allTropas.filter(t => !finishedTropas.includes(t));

  activeList.forEach(tropa => {
    const isActive = state.tropaFilter === tropa;
    const chip = el('button', { 
      text: `Tr. ${tropa}`,
      style: `padding: 0.3rem 0.85rem; border-radius: 20px; font-size: 0.78rem; border: 1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}; background: ${isActive ? 'var(--primary)' : 'transparent'}; color: ${isActive ? 'var(--on-primary)' : 'var(--text-main)'}; cursor: pointer; transition: all 0.15s;`
    });
    chip.onclick = () => {
      onTabSwitch('STOCK');
      onTropaChange(tropa);
    };
    tropaChipsWrap.appendChild(chip);
  });

  if (finishedList.length > 0) {
    const select = document.createElement('select');
    const isSelectedTropaFinished = finishedList.includes(state.tropaFilter);
    
    select.style.padding = '0.3rem 0.85rem';
    select.style.borderRadius = '20px';
    select.style.fontSize = '0.78rem';
    select.style.cursor = 'pointer';
    select.style.transition = 'all 0.15s';
    
    if (isSelectedTropaFinished) {
      select.style.border = '1px solid var(--primary)';
      select.style.background = 'var(--primary)';
      select.style.color = 'var(--on-primary)';
      select.style.fontWeight = '600';
    } else {
      select.style.border = '1px solid #10b981';
      select.style.background = 'rgba(16,185,129,0.1)';
      select.style.color = '#10b981';
      select.style.fontWeight = '400';
    }
    
    select.innerHTML = `
      <option value="" style="background: var(--bg-dark); color: var(--text-main); font-weight: normal;">
        ${isSelectedTropaFinished ? `Tr. ${state.tropaFilter} ✓` : '✓ Finalizadas...'}
      </option>
      ${finishedList.map(t => `
        <option value="${t}" ${state.tropaFilter === t ? 'selected' : ''} style="background: var(--bg-dark); color: #10b981; font-weight: 600;">
          Tr. ${t} ✓
        </option>
      `).join('')}
    `;
    
    select.onchange = (e) => {
      if (e.target.value) {
        onTabSwitch('HISTORY');
        onTropaChange(e.target.value);
      }
    };
    tropaChipsWrap.appendChild(select);
  }

  tropaFilterRow.appendChild(tropaChipsWrap);
  toolbarContainer.appendChild(tropaFilterRow);
  wrapper.appendChild(toolbarContainer);

  const { stockTotals, dispatchSummary, groupedDrafts, achurasTotals: achTotals } = faenaStockSummary;

  if (state.activeTab === 'STOCK') {
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

    const statsGrid = el('div', { classes: ['stats-grid'] });
    const addStat = (title, val, subtitle) => {
      statsGrid.appendChild(el('div', { classes: ['stat-card', 'glass-card'], html: `<h3>${title}</h3><div class="stat-value">${val}</div><div class="stat-subtitle">${subtitle}</div>` }));
    };

    addStat('Total Reses', stockTotals.count, `${stockTotals.kg.toFixed(1)} kg Colgados`);
    Object.keys(stockTotals.byCategory).forEach(cat => {
      addStat(`Stock ${cat}`, stockTotals.byCategory[cat].count, `${stockTotals.byCategory[cat].kg.toFixed(1)} kg`);
    });
    wrapper.appendChild(statsGrid);

    if (state.selectedIds.size > 0) {
      const { selectedItems, selKg, byCategory, catEntries, multiCat, grandTotal } = dispatchSummary;

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
        <button id="move-camara-btn" class="btn-outline" style="padding: 0.5rem 1rem; margin: 0; font-size: 0.85rem;">⮂ Mover Stock</button>
      `;
      footer.appendChild(moveControls);

      const dispatchControls = el('div', { style: 'display: flex; justify-content: space-between; align-items: center; flex: 1;' });
      dispatchControls.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 600;">
          Total Estimado: <span style="color: #10b981;" id="grand-total-disp">$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button id="cancel-dispatch-btn" class="btn-outline" style="border-radius: 12px; padding: 0.6rem 1.2rem; font-weight: 600; font-size: 0.9rem;">✕ Cancelar</button>
          <button id="print-dispatch-btn" class="btn-secondary" style="background: #3b82f6; color: white; border: none; border-radius: 12px; padding: 0.6rem 1.2rem; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: background 0.2s;">🖨️ Imprimir</button>
          <button id="dispatch-btn" class="btn-primary" style="background: #ef4444; border: none; border-radius: 12px; padding: 0.6rem 1.2rem; font-weight: 700; cursor: pointer; font-size: 0.9rem;">🚚 Salida Definitiva</button>
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
      
      panel.querySelector('#print-dispatch-btn').onclick = () => {
        let printGrandTotal = 0;
        const currentByCategory = {};
        catEntries.forEach(([cat, data]) => {
          const p = parseFloat(state.categoryPriceInputs?.[cat]) || 0;
          currentByCategory[cat] = {
             kg: data.kg,
             price: p,
             subtotal: data.kg * p
          };
          printGrandTotal += data.kg * p;
        });

        const cData = (options.clients || []).find(c => c.name.trim().toLowerCase() === state.destinationInput.trim().toLowerCase()) || { name: state.destinationInput };
        printDispatchPreparation({
          selectedItems,
          client: cData,
          grandTotal: printGrandTotal,
          totalKg: selKg,
          byCategory: currentByCategory
        });
      };

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
    
    const scanBtn = el('button', {
      classes: ['btn-primary'],
      text: '📷 Leer Tarjeta',
      style: 'font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 8px;'
    });
    scanBtn.onclick = () => openScannerModal(stockItems, (id) => {
      onToggleSelection(id);
    });
    listHeader.appendChild(scanBtn);

    listHeader.appendChild(el('div', { style: 'flex-grow: 1;' }));
    
    const selectAllBtn = el('button', { classes: ['btn-outline'], text: 'Seleccionar Todas', style: 'font-size: 0.8rem;' });
    selectAllBtn.onclick = () => onSelectAll(stockItems.map(i => i.id));
    listHeader.appendChild(selectAllBtn);
    listCard.appendChild(listHeader);

    const tableWrap = el('div', { classes: ['table-responsive'] });
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
          <th style="padding: 1rem; width: 60px; text-align: center;">Hist</th>
        </tr>
      </thead>
      <tbody id="stock-tbody"></tbody>
    `;

    table.querySelector('#sort-garron-stock').onclick = () => onToggleSort();

    const tbody = table.querySelector('#stock-tbody');
    if (stockItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="padding: 2rem; text-align: center; color: var(--text-muted);">No hay stock disponible. Carga reportes de faena desde la pestaña Viajes.</td></tr>`;
    } else {
      stockItems.forEach(item => {
        const isSel = state.selectedIds.has(item.id);
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--border)';
        tr.style.background = isSel ? 'rgba(239, 68, 68, 0.1)' : 'transparent';
        tr.style.cursor = 'pointer';
        
        const isUnassigned = !item.camaraId;
        const camaraDisplay = isUnassigned ? '<span style="color: var(--danger); font-weight: 600;">⚠️ Sin Asignar</span>' : `<span style="color: var(--primary);">${item.camaraId}</span>`;

        const catValue = item.standardizedCategory || item.category;
        const latestComment = item.comments && item.comments.length > 0 ? item.comments[item.comments.length - 1].comment : '';
        const commentsTooltip = item.comments && item.comments.length > 0
          ? item.comments.map(c => `[${new Date(c.date).toLocaleDateString()}]: ${c.comment}`).join('\n')
          : '';

        tr.innerHTML = `
          <td style="padding: 1rem;"><input type="checkbox" ${isSel ? 'checked' : ''} style="transform: scale(1.2); cursor: pointer; pointer-events: none;"></td>
          <td style="padding: 1rem; font-weight: 500;">#${item.garron}</td>
          <td style="padding: 1rem;">Mitad ${item.half || '1'}</td>
          <td style="padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: space-between;">
              <span style="font-weight: 500;">${catValue}</span>
              <button class="edit-cat-btn" style="background: transparent; border: none; cursor: pointer; padding: 2px; display: inline-flex; align-items: center; opacity: 0.6; transition: opacity 0.2s; font-size: 0.9rem;" title="Editar Categoría">
                ✏️
              </button>
            </div>
            ${latestComment ? `
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; font-style: italic; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: help;" title="${commentsTooltip}">
                💬 ${latestComment}
              </div>
            ` : ''}
          </td>
          <td style="padding: 1rem; font-weight: bold; color: #10b981;">${item.kg.toFixed(1)} kg</td>
          <td style="padding: 1rem; font-weight: 500;">${camaraDisplay}</td>
          <td style="padding: 1rem; font-size: 0.85rem; color: var(--text-muted);">${item.pdfDate} (Tr. ${item.tropa})</td>
          <td style="padding: 1rem; text-align: center;">
            <button class="btn-stock-history" style="background: transparent; border: none; cursor: pointer; font-size: 1.1rem; padding: 2px;" title="Ver historial de movimientos">🕒</button>
          </td>
        `;
        
        const editBtn = tr.querySelector('.edit-cat-btn');
        if (editBtn) {
          editBtn.onclick = (e) => {
            e.stopPropagation();
            openEditCategoryModal(item, (newCategory, comment) => {
              onEditCategory(item.id, newCategory, comment);
            });
          };
        }

        const histBtn = tr.querySelector('.btn-stock-history');
        if (histBtn) {
          histBtn.onclick = (e) => {
            e.stopPropagation();
            showMovementsHistoryModal(item);
          };
        }

        tr.onclick = (e) => {
          if (e.target.tagName !== 'INPUT' && !e.target.closest('.edit-cat-btn') && !e.target.closest('.btn-stock-history')) {
            onToggleSelection(item.id);
          } else if (e.target.tagName === 'INPUT') {
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

  } else if (state.activeTab === 'DRAFTS') {
    const draftCard = el('div', { classes: ['glass-card'] });
    draftCard.innerHTML = `<h3 style="margin-bottom: 1rem;">Borradores Pendientes de Confirmación</h3>`;
    
    if (groupedDrafts.length === 0) {
       draftCard.appendChild(el('p', { text: 'No hay borradores pendientes.', style: 'color: var(--text-muted);' }));
    } else {
       groupedDrafts.forEach(group => {
          const groupCard = el('div', { style: 'margin-bottom: 1rem; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; background: rgba(255,255,255,0.02);' });
          
          groupCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <h4 style="margin:0; color: var(--primary);">Destino: ${group.destination}</h4>
                <div style="font-size: 0.85rem; color: var(--text-muted);">
                  ${group.items.length} reses | ${group.totalKg.toFixed(1)} kg | Preparado: ${new Date(group.draftDate).toLocaleString()}
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                 ${options.userRole === 'ADMIN' ? `<button class="btn-primary confirm-group-btn">Confirmar Despacho</button>` : `<span style="color:var(--text-muted); font-size:0.85rem; padding-top:0.5rem;">Solo un Administrador puede confirmar</span>`}
                 ${options.userRole === 'ADMIN' ? `<button class="btn-outline revert-group-btn" style="color: var(--danger); border-color: var(--danger);">Revertir</button>` : ''}
              </div>
            </div>
          `;
          
          if (options.userRole === 'ADMIN') {
            const confirmBtn = groupCard.querySelector('.confirm-group-btn');
            const revertBtn = groupCard.querySelector('.revert-group-btn');
            
            confirmBtn.onclick = () => options.onConfirmDraft(group.items, group.destination, group.draftPrices);
            
            revertBtn.onclick = () => {
               if (confirm("¿Revertir TODO este borrador y devolverlo al stock disponible?")) {
                 group.items.forEach(i => options.onRevertDraft(i.id));
               }
            };
          }
          
          const itemsTableWrap = el('div', { classes: ['table-responsive'] });
          const itemsTable = el('table', { style: 'width: 100%; min-width: 400px; font-size: 0.9rem; border-collapse: collapse;' });
          itemsTable.innerHTML = `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
               <th style="text-align: left; padding: 0.5rem;">Tropa</th>
               <th style="text-align: left; padding: 0.5rem;">Garrón</th>
               <th style="text-align: left; padding: 0.5rem;">Categoría</th>
               <th style="text-align: right; padding: 0.5rem;">Peso (Kg)</th>
            </tr>
          `;
          group.items.forEach(item => {
             itemsTable.innerHTML += `
               <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                  <td style="padding: 0.5rem;">${item.tropa}</td>
                  <td style="padding: 0.5rem;">#${item.garron}</td>
                  <td style="padding: 0.5rem;">${item.standardizedCategory || item.category}</td>
                  <td style="padding: 0.5rem; text-align: right;">${item.kg.toFixed(1)}</td>
               </tr>
             `;
          });
          itemsTableWrap.appendChild(itemsTable);
          groupCard.appendChild(itemsTableWrap);
          draftCard.appendChild(groupCard);
       });
    }
    wrapper.appendChild(draftCard);

  } else if (state.activeTab === 'ACHURAS') {
    const achurasCard = el('div', { classes: ['glass-card'] });
    achurasCard.innerHTML = `<h3 style="margin-bottom: 1rem;">🥩 Stock de Achuras</h3>`;

    const statsContainer = el('div', { style: 'display: flex; gap: 1rem; margin-bottom: 2rem;' });
    statsContainer.innerHTML = `
      <div class="stat-card glass-card" style="flex: 1;">
        <h3>Juegos Disponibles</h3>
        <div class="stat-value" style="color: #10b981;">${achTotals}</div>
      </div>
    `;
    achurasCard.appendChild(statsContainer);

    if (achTotals > 0) {
      const dispatchPanel = el('div', { style: 'background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;' });
      const currentPrice = state.categoryPriceInputs['ACHURAS'] || (options.categoryPrices && options.categoryPrices['ACHURAS']) || '';
      dispatchPanel.innerHTML = `
        <h4 style="margin-top: 0; color: #ef4444; margin-bottom: 1rem;">🚚 Despachar Achuras</h4>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
          <div class="form-group" style="flex: 1; min-width: 120px; margin: 0;">
            <label>Cantidad (Juegos)</label>
            <input type="number" id="achuras-qty" class="form-input" placeholder="Ej: 10" min="1" max="${achTotals}">
          </div>
          <div class="form-group" style="flex: 2; min-width: 200px; margin: 0;">
            <label>Destino / Cliente</label>
            <input type="text" id="achuras-dest" class="form-input" list="clients-list" placeholder="Ej: Carnicería Centro">
            <datalist id="clients-list">
              ${(options.clients || []).map(c => `<option value="${c.name}">`).join('')}
            </datalist>
          </div>
          <div class="form-group" style="flex: 1; min-width: 120px; margin: 0;">
             <label>Precio por Juego ($)</label>
             <input type="number" class="form-input cat-price-input" data-cat="ACHURAS" value="${currentPrice}" placeholder="Ej: 5000">
          </div>
          <button id="dispatch-achuras-btn" class="btn-primary" style="background: #ef4444; margin: 0;">Despachar</button>
        </div>
      `;
      achurasCard.appendChild(dispatchPanel);

      dispatchPanel.querySelector('.cat-price-input').addEventListener('input', e => {
        options.onCategoryPriceInput('ACHURAS', e.target.value);
      });

      dispatchPanel.querySelector('#dispatch-achuras-btn').onclick = () => {
         const qty = parseInt(dispatchPanel.querySelector('#achuras-qty').value, 10);
         const dest = dispatchPanel.querySelector('#achuras-dest').value;
         if (options.onDispatchAchuras) {
            options.onDispatchAchuras(qty, dest);
         }
      };
    }

    const tableWrap = el('div', { style: 'overflow-x: auto;' });
    const table = document.createElement('table');
    table.className = 'faena-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 1px solid var(--border); color: var(--text-muted); text-align: left;">
          <th style="padding: 1rem;">Fecha Origen</th>
          <th style="padding: 1rem;">Tropa</th>
          <th style="padding: 1rem;">Stock Inicial</th>
          <th style="padding: 1rem;">Stock Disponible</th>
        </tr>
      </thead>
      <tbody>
        ${(!options.achurasItems || options.achurasItems.length === 0) ? '<tr><td colspan="4" style="padding: 2rem; text-align: center;">Sin stock de achuras.</td></tr>' : 
          options.achurasItems.map(item => `
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 1rem;">${item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
              <td style="padding: 1rem;">Tr. ${item.tropa}</td>
              <td style="padding: 1rem;">${item.initialQuantity}</td>
              <td style="padding: 1rem; color: #10b981; font-weight: bold;">${item.availableQuantity}</td>
            </tr>
          `).join('')
        }
      </tbody>
    `;
    tableWrap.appendChild(table);
    achurasCard.appendChild(tableWrap);
    wrapper.appendChild(achurasCard);

  } else {
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
          <th style="padding: 1rem; width: 100px; text-align: center;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${historyItems.length === 0 ? `<tr><td colspan="7" style="padding: 2rem; text-align: center; color: var(--text-muted);">No se encontraron salidas.</td></tr>` : 
          historyItems.map(h => {
            const catValue = h.standardizedCategory || h.category;
            const latestComment = h.comments && h.comments.length > 0 ? h.comments[h.comments.length - 1].comment : '';
            const commentsTooltip = h.comments && h.comments.length > 0
              ? h.comments.map(c => `[${new Date(c.date).toLocaleDateString()}]: ${c.comment}`).join('\n')
              : '';
            return `
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem;">${h.dispatchDate ? new Date(h.dispatchDate).toLocaleDateString() : 'N/A'}</td>
                <td style="padding: 1rem; font-weight: 500; color: #ef4444;">${h.destination || 'Sin Destino'}</td>
                <td style="padding: 1rem;">#${h.garron}</td>
                <td style="padding: 1rem;">Mitad ${h.half || '1'}</td>
                <td style="padding: 1rem;">
                  <span style="font-weight: 500;">${catValue}</span>
                  ${latestComment ? `
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem; font-style: italic; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: help;" title="${commentsTooltip}">
                      💬 ${latestComment}
                    </div>
                  ` : ''}
                </td>
                <td style="padding: 1rem;">${h.kg ? h.kg.toFixed(1) : 0} kg</td>
                <td style="padding: 1rem; text-align: center;">
                  <div style="display: flex; gap: 0.5rem; justify-content: center; align-items: center;">
                    <button class="btn-history-timeline" data-id="${h.id}" title="Ver Historial de Movimientos" 
                      style="background: transparent; border: none; font-size: 1.1rem; cursor: pointer; padding: 2px;">🕒</button>
                    <button class="btn-edit-destination" data-id="${h.id}" title="Reasignar Destino" 
                      style="background: transparent; border: none; font-size: 1.1rem; cursor: pointer; padding: 2px;">✏️</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')
        }
      </tbody>
    `;
    tableWrap.appendChild(table);
    
    table.querySelector('#sort-garron-hist').onclick = () => onToggleSort();

    table.querySelectorAll('.btn-history-timeline').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const item = historyItems.find(x => x.id === id);
        if (item) showMovementsHistoryModal(item);
      };
    });

    table.querySelectorAll('.btn-edit-destination').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const item = historyItems.find(x => x.id === id);
        if (item) openChangeDestinationModal(item, options.clients, options.onUpdateDestination);
      };
    });

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
