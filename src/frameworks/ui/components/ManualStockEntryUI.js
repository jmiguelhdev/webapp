/**
 * @file ManualStockEntryUI.js
 * @description Pantalla profesional de alta ergonomía para el ingreso de Romaneo de Medias Reses a Stock.
 * Incluye selector de viajes con búsqueda predictiva y ordenamiento cronológico reciente,
 * cabecera compacta de alta densidad, grilla de Romaneo destacada con garrones pareados (Mitad 1 y Mitad 2)
 * para minimizar el scroll y navegación ultra rápida con teclado.
 * @module ui/components/ManualStockEntryUI
 */

import { el } from '../../../frameworks/utils/dom.js';
import { formatCurrency, formatDate } from '../../../frameworks/utils/formatters.js';

const CATEGORIES = ['NOVILLO', 'VACA', 'VAQUILLONA', 'TORO', 'OTRO'];
const CATEGORY_LABELS = {
  'NOVILLO': 'Novillo',
  'VACA': 'Vaca',
  'VAQUILLONA': 'Vaquillona',
  'TORO': 'Toro',
  'OTRO': 'Otro'
};

/**
 * Renderiza la interfaz profesional de Ingreso y Romaneo Manual de Stock.
 * @param {HTMLElement} container - Contenedor principal.
 * @param {Object} options - Dependencias y callbacks.
 */
export function renderManualStockEntryUI(container, options) {
  const {
    categoryPrices = {},
    camarasList = [],
    travels = [],
    onSaveBatch,
    onCancel
  } = options;

  container.innerHTML = '';
  const wrapper = el('div', { classes: ['manual-romaneo-container', 'fade-in'], style: 'width: 100%; max-width: 1600px; margin: 0 auto;' });

  // Ordenar viajes por fecha descendente (los más recientes y próximos primero)
  const sortedTravels = [...travels].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : (a.createdAt || 0);
    const timeB = b.date ? new Date(b.date).getTime() : (b.createdAt || 0);
    return timeB - timeA;
  });

  const todayIso = new Date().toISOString().split('T')[0];

  // Estado local reactivo
  let state = {
    category: 'NOVILLO',
    headsCount: 10,
    mediasResesCount: 20,
    priceMode: 'config', // 'config' | 'custom'
    selectedPrice: parseFloat(categoryPrices['NOVILLO']) || 0,
    customPrice: '',
    entryDate: todayIso,
    tropa: '',
    initialGarron: 1,
    selectedTravelId: 'MANUAL',
    producerName: '',
    producerCuit: '',
    defaultCamara: '',
    createAchuras: true,
    viewMode: 'PAIRED', // 'PAIRED' (por garrón con M1 y M2) o 'LIST' (individual)
    showAdvancedDetails: false,
    // Array de cabezas (cada una con garron, m1Kg, m2Kg, category, camaraId)
    garrones: []
  };

  // Inicializar / Regenerar garrones basados en cantidad de cabezas
  const regenerateGarrones = (preserveKg = true) => {
    const totalHeads = Math.max(1, parseInt(state.headsCount, 10) || 1);
    state.mediasResesCount = totalHeads * 2;

    const oldMap = new Map();
    if (preserveKg && state.garrones) {
      state.garrones.forEach(g => {
        oldMap.set(g.index, { m1: g.m1Kg, m2: g.m2Kg, cat: g.category, cam: g.camaraId });
      });
    }

    const newGarrones = [];
    const baseG = parseInt(state.initialGarron, 10) || 1;

    for (let i = 0; i < totalHeads; i++) {
      const prev = oldMap.get(i);
      newGarrones.push({
        index: i,
        garronNum: baseG + i,
        category: prev?.cat || state.category,
        m1Kg: prev?.m1 !== undefined ? prev.m1 : '',
        m2Kg: prev?.m2 !== undefined ? prev.m2 : '',
        camaraId: prev?.cam !== undefined ? prev.cam : (state.defaultCamara || '')
      });
    }

    state.garrones = newGarrones;
  };

  regenerateGarrones(false);

  // Helper para generar opciones de precios
  const renderPriceOptionsHtml = (selectedCat) => {
    let optionsHtml = '';
    CATEGORIES.forEach(cat => {
      const p = parseFloat(categoryPrices[cat]) || 0;
      const isCurrentCat = cat === selectedCat;
      const selectedAttr = isCurrentCat ? 'selected' : '';
      optionsHtml += `<option value="${cat}" ${selectedAttr}>${CATEGORY_LABELS[cat]}: ${p > 0 ? formatCurrency(p) + '/kg' : 'Sin definir'}</option>`;
    });
    optionsHtml += `<option value="CUSTOM">✏️ Personalizado...</option>`;
    return optionsHtml;
  };

  // ---- 1. BARRA SUPERIOR COMPACTA (Header & Botones) ----
  const topHeader = el('div', {
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;'
  });

  topHeader.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <button type="button" id="btn-back-header" class="back-btn-m3" title="Volver al Inventario" style="margin: 0; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: var(--text-main);"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
      </button>
      <div>
        <h2 style="margin: 0; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem; letter-spacing: -0.01em;">
          📑 Romaneo y Carga de Medias Reses
          <span style="font-size: 0.75rem; font-weight: 700; background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 0.15rem 0.6rem; border-radius: 20px;">
            Ingreso Directo a Stock
          </span>
        </h2>
      </div>
    </div>

    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <button type="button" id="btn-toggle-adv" class="btn-secondary" style="font-size: 0.82rem; padding: 0.45rem 0.9rem; border-radius: 8px; display: flex; align-items: center; gap: 0.35rem;">
        <span>⚙️ Más Opciones</span>
      </button>
      <button type="button" id="btn-cancel" class="btn-secondary" style="font-size: 0.82rem; padding: 0.45rem 1rem; border-radius: 8px;">
        Cancelar
      </button>
      <button type="button" id="btn-save-main" class="btn-primary" style="font-size: 0.9rem; font-weight: 700; padding: 0.5rem 1.5rem; border-radius: 8px; background: linear-gradient(135deg, #10b981, #059669); border: none; box-shadow: 0 4px 14px rgba(16,185,129,0.35); cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
        <span>✓ Guardar en Stock</span>
      </button>
    </div>
  `;

  wrapper.appendChild(topHeader);

  // ---- 2. PANEL DE CONFIGURACIÓN COMPACTO Y ERGONÓMICO ----
  const configPanel = el('div', {
    classes: ['glass-card'],
    style: 'padding: 1rem 1.25rem; border-radius: 12px; margin-bottom: 1rem; background: rgba(18, 22, 30, 0.7); border: 1px solid var(--border);'
  });

  configPanel.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.85rem; align-items: flex-end;">
      
      <!-- Selector de Viaje Buscable (Con datalist / filtro inteligente y orden cronológico) -->
      <div class="form-group" style="margin: 0; grid-column: span 2; min-width: 260px;">
        <label style="font-size: 0.78rem; font-weight: 700; color: #60a5fa; margin-bottom: 0.25rem; display: flex; justify-content: space-between;">
          <span>🔍 Buscar / Seleccionar Viaje</span>
          <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">(Más recientes primero)</span>
        </label>
        <div style="position: relative;">
          <input type="text" id="travel-search-input" class="form-input" list="travels-datalist" placeholder="Escribe Tropa, Productor o Fecha..." 
                 style="width: 100%; padding: 0.45rem 0.75rem; font-size: 0.88rem; font-weight: 600; border-color: rgba(96,165,250,0.3);">
          <datalist id="travels-datalist">
            <option value="MANUAL - Productor Directo (Sin viaje asignado)">
            ${sortedTravels.map(t => {
              const pName = t.buy?.listOfProducers?.[0]?.name || t.producerName || 'Productor';
              const pCuit = t.buy?.listOfProducers?.[0]?.cuit || t.producerCuit || '';
              const tDate = t.date ? formatDate(t.date) : '';
              const trNum = t.tropa ? `Tr. ${t.tropa}` : `Viaje #${String(t.id).slice(-4)}`;
              return `<option value="${trNum} | ${pName} | ${tDate} [ID:${t.id}]" data-id="${t.id}" data-tropa="${t.tropa || ''}" data-prod="${pName}" data-cuit="${pCuit}">`;
            }).join('')}
          </datalist>
        </div>
      </div>

      <!-- Tropa -->
      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem; display: block;">N° de Tropa</label>
        <input type="text" id="cfg-tropa" class="form-input" placeholder="Ej: 358" value="${state.tropa}" 
               style="width: 100%; padding: 0.45rem 0.65rem; font-size: 0.95rem; font-weight: 800; letter-spacing: 0.04em; color: #fbbf24;">
      </div>

      <!-- Categoría Principal -->
      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem; display: block;">Categoría</label>
        <select id="cfg-category" class="form-input" style="width: 100%; padding: 0.45rem 0.65rem; font-size: 0.88rem; font-weight: 700; color: #60a5fa;">
          ${CATEGORIES.map(cat => `<option value="${cat}" ${cat === state.category ? 'selected' : ''}>${CATEGORY_LABELS[cat]}</option>`).join('')}
        </select>
      </div>

      <!-- Cantidad de Cabezas -->
      <div class="form-group" style="margin: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
          <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">Cabezas</label>
          <span id="cfg-medias-badge" style="font-size: 0.7rem; color: #10b981; font-weight: 700;">(${state.mediasResesCount} reses)</span>
        </div>
        <input type="number" id="cfg-heads" class="form-input" min="1" max="500" value="${state.headsCount}" 
               style="width: 100%; padding: 0.45rem 0.65rem; font-size: 1.05rem; font-weight: 800; color: #10b981; text-align: center;">
      </div>

      <!-- Garrón Inicial -->
      <div class="form-group" style="margin: 0; max-width: 120px;">
        <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem; display: block;">Garrón Inicial</label>
        <input type="number" id="cfg-initial-garron" class="form-input" min="1" value="${state.initialGarron}" 
               style="width: 100%; padding: 0.45rem 0.65rem; font-size: 0.95rem; font-weight: 700; text-align: center;">
      </div>

      <!-- Precio de Venta Sugerido -->
      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem; display: block;">Precio $/kg</label>
        <select id="cfg-price-select" class="form-input" style="width: 100%; padding: 0.45rem 0.65rem; font-size: 0.85rem; font-weight: 600;">
          ${renderPriceOptionsHtml(state.category)}
        </select>
        <input type="number" id="cfg-custom-price" class="form-input" placeholder="Monto $/kg" step="10" 
               style="display: none; width: 100%; margin-top: 0.35rem; padding: 0.35rem 0.65rem; font-weight: 700; color: #10b981;">
      </div>

      <!-- Cámara Predeterminada -->
      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem; display: block;">Cámara</label>
        <select id="cfg-camara" class="form-input" style="width: 100%; padding: 0.45rem 0.65rem; font-size: 0.85rem;">
          <option value="">⚠️ Sin Asignar</option>
          ${camarasList.map(cam => {
            const cName = typeof cam === 'string' ? cam : cam.name;
            return `<option value="${cName}">${cName}</option>`;
          }).join('')}
        </select>
      </div>

      <!-- Fecha de Ingreso -->
      <div class="form-group" style="margin: 0; max-width: 150px;">
        <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem; display: block;">Fecha</label>
        <input type="date" id="cfg-date" class="form-input" value="${state.entryDate}" style="width: 100%; padding: 0.4rem 0.5rem; font-size: 0.82rem;">
      </div>

    </div>

    <!-- Panel Avanzado Desplegable (Productor y Achuras) -->
    <div id="adv-details-panel" style="display: none; margin-top: 1rem; padding-top: 0.85rem; border-top: 1px dashed var(--border); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: center;">
      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">Razón Social Productor</label>
        <input type="text" id="cfg-prod-name" class="form-input" placeholder="Ej: Agropecuaria El Ombú" value="${state.producerName}" style="width: 100%; padding: 0.35rem 0.6rem; font-size: 0.85rem;">
      </div>
      <div class="form-group" style="margin: 0;">
        <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">CUIT Productor</label>
        <input type="text" id="cfg-prod-cuit" class="form-input" placeholder="Ej: 30-12345678-9" value="${state.producerCuit}" style="width: 100%; padding: 0.35rem 0.6rem; font-size: 0.85rem;">
      </div>
      <div style="display: flex; align-items: center; padding-top: 1rem;">
        <label style="display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; cursor: pointer; user-select: none;">
          <input type="checkbox" id="cfg-achuras" ${state.createAchuras ? 'checked' : ''} style="transform: scale(1.15);">
          <span>🥩 Generar lote de achuras en stock (${state.headsCount} juegos)</span>
        </label>
      </div>
    </div>
  `;

  wrapper.appendChild(configPanel);

  // ---- 3. BARRA DE TOTALES EN VIVO DESTACADA (Compacta y Fija) ----
  const metricsBar = el('div', {
    classes: ['glass-card'],
    style: 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.25rem; border-radius: 12px; margin-bottom: 1rem; background: rgba(16, 185, 129, 0.04); border: 1px solid rgba(16,185,129,0.25); flex-wrap: wrap; gap: 1rem;'
  });

  const renderMetricsHtml = () => {
    let totalKg = 0;
    let filledHalves = 0;
    let filledHeads = 0;

    state.garrones.forEach(g => {
      const k1 = parseFloat(g.m1Kg);
      const k2 = parseFloat(g.m2Kg);
      let headHasWeight = false;

      if (!isNaN(k1) && k1 > 0) {
        totalKg += k1;
        filledHalves++;
        headHasWeight = true;
      }
      if (!isNaN(k2) && k2 > 0) {
        totalKg += k2;
        filledHalves++;
        headHasWeight = true;
      }
      if (headHasWeight) filledHeads++;
    });

    const totalHeadsExpected = state.headsCount;
    const totalHalvesExpected = state.mediasResesCount;
    const avgHalf = filledHalves > 0 ? (totalKg / filledHalves).toFixed(1) : '0.0';
    const avgHead = filledHeads > 0 ? (totalKg / filledHeads).toFixed(1) : '0.0';

    return `
      <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
        
        <div style="display: flex; align-items: baseline; gap: 0.4rem;">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Medias Reses:</span>
          <span style="font-size: 1.25rem; font-weight: 800; color: #60a5fa;">${filledHalves}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">/ ${totalHalvesExpected}</span>
        </div>

        <div style="width: 1px; height: 24px; background: var(--border);"></div>

        <div style="display: flex; align-items: baseline; gap: 0.4rem;">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Kilos:</span>
          <span style="font-size: 1.35rem; font-weight: 900; color: #10b981; letter-spacing: -0.02em;">
            ${totalKg.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
          <span style="font-size: 0.85rem; font-weight: 700; color: #10b981;">kg</span>
        </div>

        <div style="width: 1px; height: 24px; background: var(--border);"></div>

        <div style="display: flex; align-items: baseline; gap: 0.4rem;">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Prom. Media:</span>
          <span style="font-size: 1.15rem; font-weight: 800; color: #a78bfa;">${avgHalf} kg</span>
        </div>

        <div style="width: 1px; height: 24px; background: var(--border);"></div>

        <div style="display: flex; align-items: baseline; gap: 0.4rem;">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Prom. Cabeza:</span>
          <span style="font-size: 1.15rem; font-weight: 800; color: #fbbf24;">${avgHead} kg</span>
        </div>

      </div>

      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 0.75rem; color: var(--text-muted);">
          ⌨️ <kbd style="background: rgba(255,255,255,0.08); padding: 0.15rem 0.35rem; border-radius: 4px; border: 1px solid var(--border);">Tab</kbd> o <kbd style="background: rgba(255,255,255,0.08); padding: 0.15rem 0.35rem; border-radius: 4px; border: 1px solid var(--border);">Enter</kbd> para avanzar
        </span>
      </div>
    `;
  };

  metricsBar.innerHTML = renderMetricsHtml();
  wrapper.appendChild(metricsBar);

  const updateMetrics = () => {
    metricsBar.innerHTML = renderMetricsHtml();
  };

  // ---- 4. GRILLA DE ROMANEO DESTACADA (PAIRED / POR CABEZA) ----
  // Estructura de 2 columnas paralelas para cabezas múltiples para eliminar scroll vertical
  const romaneoCard = el('div', {
    classes: ['glass-card'],
    style: 'padding: 1rem 1.25rem; border-radius: 14px; background: rgba(14, 18, 26, 0.9); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.4);'
  });

  const romaneoHeader = el('div', {
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem;'
  });
  romaneoHeader.innerHTML = `
    <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
      <span>🥩 Carga de Romaneo</span>
      <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted);">(1 fila = 1 Cabeza: Mitad 1 + Mitad 2)</span>
    </div>
    <div style="font-size: 0.75rem; color: #60a5fa; font-weight: 600;">
      ⚡ Vista Optimizada de Alto Rendimiento
    </div>
  `;
  romaneoCard.appendChild(romaneoHeader);

  const tableContainer = el('div', {
    style: 'overflow-x: auto; max-height: calc(100vh - 350px); min-height: 380px; overflow-y: auto; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.25);'
  });

  const table = el('table', {
    style: 'width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;'
  });

  const thead = el('thead', {
    style: 'position: sticky; top: 0; background: #111827; z-index: 10; border-bottom: 2px solid var(--border);'
  });

  thead.innerHTML = `
    <tr style="color: var(--text-muted); font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.05em;">
      <th style="padding: 0.65rem 0.85rem; width: 45px; text-align: center;">#</th>
      <th style="padding: 0.65rem 0.85rem; width: 110px;">Garrón</th>
      <th style="padding: 0.65rem 0.85rem; width: 130px;">Categoría</th>
      <th style="padding: 0.65rem 0.85rem; width: 160px; color: #60a5fa;">Mitad 1 (Izq) [Kg]</th>
      <th style="padding: 0.65rem 0.85rem; width: 160px; color: #c084fc;">Mitad 2 (Der) [Kg]</th>
      <th style="padding: 0.65rem 0.85rem; width: 130px; text-align: right; color: #10b981;">Total Cabeza</th>
      <th style="padding: 0.65rem 0.85rem; width: 150px;">Cámara</th>
      <th style="padding: 0.65rem 0.85rem; width: 50px; text-align: center;">✕</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = el('tbody');
  table.appendChild(tbody);
  tableContainer.appendChild(table);
  romaneoCard.appendChild(tableContainer);
  wrapper.appendChild(romaneoCard);
  container.appendChild(wrapper);

  // Renderizar filas de la grilla de Romaneo
  const renderRomaneoRows = () => {
    tbody.innerHTML = '';

    state.garrones.forEach((g, idx) => {
      const tr = el('tr', {
        attrs: { 'data-garron-idx': idx },
        style: 'border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.1s;'
      });

      const k1 = parseFloat(g.m1Kg) || 0;
      const k2 = parseFloat(g.m2Kg) || 0;
      const totalHeadKg = k1 + k2;
      const totalDisplay = totalHeadKg > 0 ? `${totalHeadKg.toFixed(1)} kg` : '-';

      tr.innerHTML = `
        <td style="padding: 0.45rem 0.85rem; text-align: center; color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">
          ${idx + 1}
        </td>

        <td style="padding: 0.45rem 0.85rem;">
          <input type="number" class="form-input garron-num-input" value="${g.garronNum}" min="1" 
                 style="width: 100%; padding: 0.35rem 0.5rem; font-weight: 800; font-size: 0.95rem; text-align: center; color: #fbbf24;">
        </td>

        <td style="padding: 0.45rem 0.85rem;">
          <select class="form-input garron-cat-select" style="width: 100%; padding: 0.35rem 0.5rem; font-size: 0.82rem; font-weight: 600;">
            ${CATEGORIES.map(c => `<option value="${c}" ${c === g.category ? 'selected' : ''}>${CATEGORY_LABELS[c]}</option>`).join('')}
          </select>
        </td>

        <td style="padding: 0.45rem 0.85rem;">
          <div style="position: relative;">
            <input type="number" step="0.1" min="0" placeholder="0.0" class="form-input m1-kg-input" value="${g.m1Kg}" 
                   style="width: 100%; padding: 0.4rem 0.65rem; font-weight: 900; font-size: 1.05rem; color: #60a5fa; text-align: right; border-color: rgba(96,165,250,0.3);">
            <span style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); font-size: 0.7rem; color: var(--text-muted); pointer-events: none;">kg</span>
          </div>
        </td>

        <td style="padding: 0.45rem 0.85rem;">
          <div style="position: relative;">
            <input type="number" step="0.1" min="0" placeholder="0.0" class="form-input m2-kg-input" value="${g.m2Kg}" 
                   style="width: 100%; padding: 0.4rem 0.65rem; font-weight: 900; font-size: 1.05rem; color: #c084fc; text-align: right; border-color: rgba(192,132,252,0.3);">
            <span style="position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); font-size: 0.7rem; color: var(--text-muted); pointer-events: none;">kg</span>
          </div>
        </td>

        <td style="padding: 0.45rem 0.85rem; text-align: right; font-weight: 800; font-size: 0.95rem; color: #10b981;" class="total-head-col">
          ${totalDisplay}
        </td>

        <td style="padding: 0.45rem 0.85rem;">
          <select class="form-input garron-cam-select" style="width: 100%; padding: 0.35rem 0.5rem; font-size: 0.82rem;">
            <option value="" ${!g.camaraId ? 'selected' : ''}>⚠️ Sin Asignar</option>
            ${camarasList.map(cam => {
              const cName = typeof cam === 'string' ? cam : cam.name;
              return `<option value="${cName}" ${cName === g.camaraId ? 'selected' : ''}>${cName}</option>`;
            }).join('')}
          </select>
        </td>

        <td style="padding: 0.45rem 0.85rem; text-align: center;">
          <button type="button" class="btn-clear-garron" style="background: transparent; border: none; cursor: pointer; color: var(--text-muted); font-size: 0.85rem; opacity: 0.5;" title="Limpiar pesos">
            ✕
          </button>
        </td>
      `;

      const gNumInput = tr.querySelector('.garron-num-input');
      const catSelect = tr.querySelector('.garron-cat-select');
      const m1Input = tr.querySelector('.m1-kg-input');
      const m2Input = tr.querySelector('.m2-kg-input');
      const totalCol = tr.querySelector('.total-head-col');
      const camSelect = tr.querySelector('.garron-cam-select');
      const clearBtn = tr.querySelector('.btn-clear-garron');

      // Modificación de Garrón (recalcula secuencialmente hacia adelante)
      gNumInput.addEventListener('change', () => {
        const newG = parseInt(gNumInput.value, 10);
        if (!isNaN(newG) && newG > 0) {
          g.garronNum = newG;
          for (let k = idx + 1; k < state.garrones.length; k++) {
            state.garrones[k].garronNum = newG + (k - idx);
          }
          renderRomaneoRows();
        }
      });

      catSelect.addEventListener('change', () => {
        g.category = catSelect.value;
      });

      camSelect.addEventListener('change', () => {
        g.camaraId = camSelect.value;
      });

      const updateRowTotal = () => {
        const val1 = parseFloat(g.m1Kg) || 0;
        const val2 = parseFloat(g.m2Kg) || 0;
        const t = val1 + val2;
        totalCol.textContent = t > 0 ? `${t.toFixed(1)} kg` : '-';
        updateMetrics();
      };

      // M1 Input Keyboard navigation
      m1Input.addEventListener('input', () => {
        g.m1Kg = m1Input.value;
        updateRowTotal();
      });

      m1Input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          m2Input.focus();
          m2Input.select();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextRow = tbody.querySelector(`tr[data-garron-idx="${idx + 1}"]`);
          if (nextRow) {
            const nextM1 = nextRow.querySelector('.m1-kg-input');
            if (nextM1) { nextM1.focus(); nextM1.select(); }
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevRow = tbody.querySelector(`tr[data-garron-idx="${idx - 1}"]`);
          if (prevRow) {
            const prevM1 = prevRow.querySelector('.m1-kg-input');
            if (prevM1) { prevM1.focus(); prevM1.select(); }
          }
        }
      });

      // M2 Input Keyboard navigation (Enter / Tab jumps to next row's M1)
      m2Input.addEventListener('input', () => {
        g.m2Kg = m2Input.value;
        updateRowTotal();
      });

      m2Input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          const nextRow = tbody.querySelector(`tr[data-garron-idx="${idx + 1}"]`);
          if (nextRow) {
            const nextM1 = nextRow.querySelector('.m1-kg-input');
            if (nextM1) { nextM1.focus(); nextM1.select(); }
          } else {
            // Última fila, dar foco al botón guardar
            const saveBtn = wrapper.querySelector('#btn-save-main');
            if (saveBtn) saveBtn.focus();
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextRow = tbody.querySelector(`tr[data-garron-idx="${idx + 1}"]`);
          if (nextRow) {
            const nextM2 = nextRow.querySelector('.m2-kg-input');
            if (nextM2) { nextM2.focus(); nextM2.select(); }
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevRow = tbody.querySelector(`tr[data-garron-idx="${idx - 1}"]`);
          if (prevRow) {
            const prevM2 = prevRow.querySelector('.m2-kg-input');
            if (prevM2) { prevM2.focus(); prevM2.select(); }
          }
        }
      });

      clearBtn.addEventListener('click', () => {
        g.m1Kg = '';
        g.m2Kg = '';
        m1Input.value = '';
        m2Input.value = '';
        updateRowTotal();
      });

      tbody.appendChild(tr);
    });
  };

  renderRomaneoRows();

  // ---- CONECTAR EVENTOS DE CONTROL ----
  const travelSearchInput = configPanel.querySelector('#travel-search-input');
  const cfgTropa = configPanel.querySelector('#cfg-tropa');
  const cfgCategory = configPanel.querySelector('#cfg-category');
  const cfgHeads = configPanel.querySelector('#cfg-heads');
  const cfgMediasBadge = configPanel.querySelector('#cfg-medias-badge');
  const cfgInitialGarron = configPanel.querySelector('#cfg-initial-garron');
  const cfgPriceSelect = configPanel.querySelector('#cfg-price-select');
  const cfgCustomPrice = configPanel.querySelector('#cfg-custom-price');
  const cfgCamara = configPanel.querySelector('#cfg-camara');
  const cfgDate = configPanel.querySelector('#cfg-date');
  const btnToggleAdv = topHeader.querySelector('#btn-toggle-adv');
  const advPanel = configPanel.querySelector('#adv-details-panel');
  const cfgProdName = configPanel.querySelector('#cfg-prod-name');
  const cfgProdCuit = configPanel.querySelector('#cfg-prod-cuit');
  const cfgAchuras = configPanel.querySelector('#cfg-achuras');

  // Toggle Panel Avanzado
  btnToggleAdv.addEventListener('click', () => {
    state.showAdvancedDetails = !state.showAdvancedDetails;
    advPanel.style.display = state.showAdvancedDetails ? 'grid' : 'none';
    btnToggleAdv.style.background = state.showAdvancedDetails ? 'rgba(96,165,250,0.2)' : '';
  });

  // Búsqueda interactiva de Viajes
  travelSearchInput.addEventListener('change', () => {
    const val = travelSearchInput.value;
    if (!val || val.startsWith('MANUAL')) {
      state.selectedTravelId = 'MANUAL';
      return;
    }

    // Extraer ID si existe en el formato "... [ID:xxx]"
    const idMatch = val.match(/\[ID:(.*?)\]/);
    if (idMatch && idMatch[1]) {
      const travelId = idMatch[1];
      const matchTravel = sortedTravels.find(t => String(t.id) === String(travelId));
      if (matchTravel) {
        state.selectedTravelId = matchTravel.id;
        state.tropa = matchTravel.tropa || state.tropa;
        cfgTropa.value = state.tropa;
        state.producerName = matchTravel.buy?.listOfProducers?.[0]?.name || matchTravel.producerName || '';
        state.producerCuit = matchTravel.buy?.listOfProducers?.[0]?.cuit || matchTravel.producerCuit || '';
        cfgProdName.value = state.producerName;
        cfgProdCuit.value = state.producerCuit;
        if (matchTravel.date) {
          state.entryDate = new Date(matchTravel.date).toISOString().split('T')[0];
          cfgDate.value = state.entryDate;
        }
      }
    }
  });

  // Cambio de Tropa
  cfgTropa.addEventListener('input', () => {
    state.tropa = cfgTropa.value.trim();
  });

  // Cambio de Categoría Principal
  cfgCategory.addEventListener('change', () => {
    state.category = cfgCategory.value;
    cfgPriceSelect.innerHTML = renderPriceOptionsHtml(state.category);
    state.selectedPrice = parseFloat(categoryPrices[state.category]) || 0;
    cfgCustomPrice.style.display = 'none';

    state.garrones.forEach(g => {
      g.category = state.category;
    });
    renderRomaneoRows();
  });

  // Cambio de Cabezas
  cfgHeads.addEventListener('input', () => {
    const val = parseInt(cfgHeads.value, 10);
    if (!isNaN(val) && val >= 1) {
      state.headsCount = val;
      regenerateGarrones(true);
      cfgMediasBadge.textContent = `(${state.mediasResesCount} reses)`;
      renderRomaneoRows();
      updateMetrics();
    }
  });

  // Cambio de Garrón Inicial
  cfgInitialGarron.addEventListener('input', () => {
    const val = parseInt(cfgInitialGarron.value, 10);
    if (!isNaN(val) && val >= 1) {
      state.initialGarron = val;
      regenerateGarrones(true);
      renderRomaneoRows();
    }
  });

  // Selector de Precios
  cfgPriceSelect.addEventListener('change', () => {
    const val = cfgPriceSelect.value;
    if (val === 'CUSTOM') {
      state.priceMode = 'custom';
      cfgCustomPrice.style.display = 'block';
      cfgCustomPrice.focus();
    } else {
      state.priceMode = 'config';
      cfgCustomPrice.style.display = 'none';
      state.selectedPrice = parseFloat(categoryPrices[val]) || 0;
    }
  });

  cfgCustomPrice.addEventListener('input', () => {
    state.customPrice = cfgCustomPrice.value;
  });

  // Cambio de Cámara
  cfgCamara.addEventListener('change', () => {
    state.defaultCamara = cfgCamara.value;
    state.garrones.forEach(g => {
      g.camaraId = state.defaultCamara;
    });
    renderRomaneoRows();
  });

  cfgDate.addEventListener('change', () => {
    state.entryDate = cfgDate.value;
  });

  if (cfgProdName) cfgProdName.addEventListener('input', () => { state.producerName = cfgProdName.value; });
  if (cfgProdCuit) cfgProdCuit.addEventListener('input', () => { state.producerCuit = cfgProdCuit.value; });
  if (cfgAchuras) cfgAchuras.addEventListener('change', () => { state.createAchuras = cfgAchuras.checked; });

  // ---- MANEJADOR DE GUARDADO ----
  const handleSave = () => {
    if (!state.tropa) {
      alert("⚠️ Por favor indica el número de tropa para identificar el lote.");
      cfgTropa.focus();
      return;
    }

    // Convertir garrones pareados en lista individual de medias reses (items)
    const validItems = [];
    state.garrones.forEach(g => {
      const k1 = parseFloat(g.m1Kg);
      const k2 = parseFloat(g.m2Kg);

      if (!isNaN(k1) && k1 > 0) {
        validItems.push({
          garron: g.garronNum,
          half: 1,
          category: g.category,
          kg: k1,
          camaraId: g.camaraId || null
        });
      }

      if (!isNaN(k2) && k2 > 0) {
        validItems.push({
          garron: g.garronNum,
          half: 2,
          category: g.category,
          kg: k2,
          camaraId: g.camaraId || null
        });
      }
    });

    if (validItems.length === 0) {
      alert("⚠️ Por favor ingresa el peso de al menos una media res en el romaneo.");
      const firstInput = tbody.querySelector('.m1-kg-input');
      if (firstInput) firstInput.focus();
      return;
    }

    let finalSalePrice = state.priceMode === 'custom' 
      ? (parseFloat(state.customPrice) || 0) 
      : (state.selectedPrice || 0);

    const dateParts = state.entryDate.split('-');
    const formattedDateStr = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : state.entryDate;

    const payload = {
      headerData: {
        category: state.category,
        headsCount: state.headsCount,
        mediasResesCount: state.mediasResesCount,
        salePrice: finalSalePrice,
        dateIso: state.entryDate,
        dateStr: formattedDateStr,
        tropa: state.tropa,
        travelId: state.selectedTravelId !== 'MANUAL' ? state.selectedTravelId : 'UNMATCHED',
        producerName: state.producerName || 'Productor Directo',
        producerCuit: state.producerCuit || '',
        createAchuras: state.createAchuras
      },
      items: validItems
    };

    if (typeof onSaveBatch === 'function') {
      onSaveBatch(payload);
    }
  };

  topHeader.querySelector('#btn-save-main').onclick = handleSave;

  const handleCancelAction = () => {
    if (typeof onCancel === 'function') onCancel();
  };

  topHeader.querySelector('#btn-back-header').onclick = handleCancelAction;
  topHeader.querySelector('#btn-cancel').onclick = handleCancelAction;

  // Autofoco inicial en el primer campo de peso
  setTimeout(() => {
    const firstInput = tbody.querySelector('.m1-kg-input');
    if (firstInput) {
      firstInput.focus();
      firstInput.select();
    }
  }, 100);
}

