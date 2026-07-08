import { el } from '../../../utils/dom.js';

/**
 * Reproduce pitidos agradables o de advertencia utilizando la API Web Audio de forma nativa.
 * 
 * @param {string} type - Tipo de sonido a emitir ('success' o 'error').
 */
const playSound = (type) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(220, audioCtx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.15);
      osc2.start(audioCtx.currentTime + 0.15);
      osc2.stop(audioCtx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn("Audio feedback failed:", e);
  }
};

/**
 * Abre la interfaz flotante de escáner en tiempo real mediante la cámara del dispositivo móvil.
 * Realiza un bucle asíncrono capturando frames de video, procesándolos mediante la librería OCR Tesseract.js,
 * y validando números de tropa y garrón contra los elementos disponibles en stock.
 *
 * @param {Array<Object>} stockItems - Lista de ítems colgados disponibles para comprobar.
 * @param {Function} onFound - Callback disparado al obtener una coincidencia exacta de tropa y garrón.
 */
export function openScannerModal(stockItems, onFound) {
  const overlay = el('div', { classes: ['modal-overlay'], style: 'position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; padding: 1rem;' });
  const modal = el('div', { classes: ['glass-card'], style: 'background: var(--bg-dark); max-width: 450px; width: 100%; padding: 1.5rem; position: relative; display: flex; flex-direction: column; align-items: center;' });
  
  modal.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 1rem; text-align: center; color: white;">📷 Escáner Automático</h3>
    <div style="position: relative; width: 100%; border-radius: 12px; overflow: hidden; background: #000;">
      <video id="scanner-video" style="width: 100%; display: block; max-height: 50vh; object-fit: cover;" autoplay playsinline></video>
      <div id="scanner-reticle" style="position: absolute; inset: 0; border: 2px dashed rgba(255,255,255,0.3); margin: 20%; pointer-events: none; border-radius: 8px;"></div>
    </div>
    <canvas id="scanner-canvas" style="display: none;"></canvas>
    
    <div id="scanner-status" style="margin-top: 1rem; text-align: center; color: var(--text-muted); font-size: 0.95rem; min-height: 2.5em; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 8px; width: 100%;">
      Iniciando cámara...
    </div>
    
    <div style="margin-top: 1.5rem; display: flex; gap: 1rem; width: 100%;">
      <button id="scanner-cancel" class="btn-outline" style="flex: 1; padding: 0.8rem;">Cerrar Escáner</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const video = modal.querySelector('#scanner-video');
  const canvas = modal.querySelector('#scanner-canvas');
  const status = modal.querySelector('#scanner-status');
  const cancelBtn = modal.querySelector('#scanner-cancel');

  let stream = null;
  let loopTimeout = null;
  let isProcessing = false;
  let isClosed = false;

  const startCamera = async () => {
    try {
      status.textContent = 'Buscando cámara trasera...';
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      video.srcObject = stream;
      status.textContent = '🤖 Escaneo Automático Activo';
      loopTimeout = setTimeout(internalScan, 2000);
    } catch (e) {
      status.textContent = '❌ Error de cámara. Asegúrese de dar permisos.';
      status.style.color = '#ef4444';
    }
  };

  const stopCamera = () => {
    isClosed = true;
    if (loopTimeout) clearTimeout(loopTimeout);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
  };

  const close = () => {
    stopCamera();
    overlay.remove();
  };

  cancelBtn.onclick = close;

  const internalScan = async () => {
    if (isProcessing || isClosed) return;
    
    isProcessing = true;
    status.textContent = '🔍 Escaneando...';
    status.style.color = 'var(--text-muted)';
    
    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      if (!window.Tesseract) throw new Error("Tesseract no cargado");

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const result = await window.Tesseract.recognize(dataUrl, 'spa');
      
      const text = result.data.text;
      const numbers = (text.match(/\d+/g) || []).map(Number);
      
      console.log("OCR Match Candidates:", numbers);

      if (numbers.length < 2) {
        throw new Error("No se detectan suficientes datos. Acérquese más.");
      }
      
      const foundItem = stockItems.find(item => {
        const t = parseInt(item.tropa, 10);
        const g = parseInt(item.garron, 10);
        return numbers.includes(t) && numbers.includes(g);
      });
      
      if (foundItem) {
        playSound('success');
        status.textContent = `✅ ENCONTRADO: Tr. ${foundItem.tropa} - G. ${foundItem.garron}`;
        status.style.color = '#10b981';
        
        setTimeout(() => {
          onFound(foundItem.id);
          close();
        }, 1200);
      } else {
        throw new Error("Sin coincidencia en stock. Reintentando...");
      }
      
    } catch (e) {
      if (e.message.includes('Sin coincidencia')) {
         playSound('error');
      }
      
      status.textContent = `⏳ ${e.message}`;
      if (!isClosed) {
        loopTimeout = setTimeout(internalScan, 1500);
      }
    } finally {
      isProcessing = false;
    }
  };

  startCamera();
}

/**
 * Abre un modal para editar la categoría de un garrón y solicitar un comentario obligatorio.
 */
export function openEditCategoryModal(item, onSave) {
  const overlay = el('div', { 
    classes: ['modal-overlay'], 
    style: 'position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; padding: 1rem;' 
  });
  const modal = el('div', { 
    classes: ['glass-card'], 
    style: 'background: var(--bg-dark); max-width: 450px; width: 100%; padding: 2rem; position: relative; border: 1px solid var(--border); border-radius: 16px;' 
  });

  const currentCategory = item.standardizedCategory || item.category || 'OTRO';
  const categories = ['NOVILLO', 'VACA', 'VAQUILLONA', 'TORO', 'OTRO'];

  modal.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 1.5rem; color: var(--primary);">Editar Categoría - Garrón #${item.garron}</h3>
    <div style="margin-bottom: 1.25rem;">
      <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Categoría Actual</label>
      <div style="font-weight: 600; font-size: 1.1rem; color: var(--text-main);">${currentCategory}</div>
    </div>
    <div style="margin-bottom: 1.25rem;">
      <label for="new-cat-select" style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Nueva Categoría</label>
      <select id="new-cat-select" style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: var(--text-main); font-size: 1rem; font-weight: 500;">
        ${categories.map(cat => `<option value="${cat}" ${cat === currentCategory ? 'selected' : ''}>${cat}</option>`).join('')}
      </select>
    </div>
    <div style="margin-bottom: 1.5rem;">
      <label for="cat-comment-input" style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Comentario / Motivo del Cambio</label>
      <textarea id="cat-comment-input" placeholder="Ej. Se corrigió porque figuraba Novillo en lugar de Vaquillona..." style="width: 100%; height: 100px; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: var(--text-main); font-size: 0.95rem; resize: none; box-sizing: border-box;"></textarea>
    </div>
    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
      <button id="cat-cancel-btn" class="btn btn-secondary" style="padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer;">Cancelar</button>
      <button id="cat-save-btn" class="btn btn-primary" style="padding: 0.6rem 1.2rem; border-radius: 8px; background: var(--primary); color: var(--on-primary); border: none; cursor: pointer; font-weight: 600;">Guardar</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const select = modal.querySelector('#new-cat-select');
  const commentInput = modal.querySelector('#cat-comment-input');
  const cancelBtn = modal.querySelector('#cat-cancel-btn');
  const saveBtn = modal.querySelector('#cat-save-btn');

  cancelBtn.onclick = () => {
    document.body.removeChild(overlay);
  };

  saveBtn.onclick = () => {
    const newCategory = select.value;
    const comment = commentInput.value.trim();
    if (!comment) {
      alert("Por favor, ingrese un comentario o motivo para registrar el cambio.");
      return;
    }
    onSave(newCategory, comment);
    document.body.removeChild(overlay);
  };
}

/**
 * Muestra un modal con la línea de tiempo del historial de movimientos del garrón.
 */
export function showMovementsHistoryModal(item) {
  const overlay = el('div', { 
    classes: ['modal-overlay'], 
    style: 'position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; padding: 1rem;' 
  });
  const modal = el('div', { 
    classes: ['glass-card'], 
    style: 'background: var(--bg-dark); max-width: 550px; width: 100%; max-height: 85vh; display: flex; flex-direction: column; padding: 2rem; position: relative; border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);' 
  });

  const events = [];

  // 1. Ingreso a Frigorífico
  const entryDate = item.createdAt ? new Date(item.createdAt) : null;
  events.push({
    title: '🟢 Ingreso a Frigorífico',
    desc: `Tropa: ${item.tropa} | Garrón: #${item.garron} | Categoría: ${item.standardizedCategory || item.category} | Peso: ${item.kg.toFixed(1)} kg`,
    date: entryDate ? entryDate.getTime() : (item.pdfDate ? new Date(item.pdfDate + 'T12:00:00').getTime() : 0),
    dateStr: item.pdfDate || (entryDate ? entryDate.toLocaleDateString() : 'N/A')
  });

  // 2. Movimientos de Cámara y Destino
  (item.movements || []).forEach(m => {
    if (m.type === 'DESTINATION') {
      events.push({
        title: '🔄 Reasignación de Destino',
        desc: `Destino cambiado de <strong>"${m.from}"</strong> a <strong>"${m.to}"</strong><br>Precio: $${m.price}/kg | Total: $${(item.kg * m.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        date: m.date,
        dateStr: new Date(m.date).toLocaleString()
      });
    } else if (m.type === 'DISPATCH') {
      events.push({
        title: '🚚 Salida / Despacho',
        desc: `Despachado a <strong>"${m.to}"</strong><br>Precio: $${m.price}/kg | Total: $${(item.kg * m.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        date: m.date,
        dateStr: new Date(m.date).toLocaleString()
      });
    } else {
      events.push({
        title: '❄️ Movimiento de Cámara',
        desc: `Trasladado de <strong>"${m.from || 'Sin Asignar'}"</strong> a <strong>"${m.to}"</strong>`,
        date: m.date,
        dateStr: new Date(m.date).toLocaleString()
      });
    }
  });

  // Retrocompatibilidad
  const hasDispatchEvent = (item.movements || []).some(m => m.type === 'DISPATCH' || m.type === 'DESTINATION');
  if (item.status === 'DISPATCHED' && !hasDispatchEvent) {
    events.push({
      title: '🚚 Salida / Despacho (Original)',
      desc: `Despachado a <strong>"${item.destination || 'Sin Destino'}"</strong>`,
      date: item.dispatchDate || Date.now(),
      dateStr: item.dispatchDate ? new Date(item.dispatchDate).toLocaleString() : 'N/A'
    });
  }

  events.sort((a, b) => a.date - b.date);

  const categoryDisplay = item.standardizedCategory || item.category || 'OTRO';
  modal.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 1rem; color: var(--primary); display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
      🕒 Historial de Movimientos - Garrón #${item.garron} <span style="font-size: 0.9rem; padding: 0.2rem 0.6rem; border-radius: 12px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-weight: 700; margin-left: 0.5rem;">${categoryDisplay}</span>
    </h3>
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;">
      <div><strong>Tropa:</strong> ${item.tropa}</div>
      <div><strong>Kilos:</strong> ${item.kg.toFixed(1)} kg</div>
      <div><strong>Estado:</strong> <span style="text-transform: capitalize; color: ${item.status === 'AVAILABLE' ? '#10b981' : '#ef4444'}; font-weight: bold;">${item.status === 'AVAILABLE' ? 'En Stock' : 'Despachado'}</span></div>
    </div>
    <div style="flex: 1; overflow-y: auto; padding-right: 0.5rem; margin-bottom: 1.5rem;">
      <div class="timeline-container" style="position: relative; padding-left: 24px; border-left: 2px solid var(--border); margin-left: 8px;">
        ${events.map((e, index) => `
          <div class="timeline-item" style="position: relative; margin-bottom: 1.5rem;">
            <div style="position: absolute; left: -31px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: ${index === events.length - 1 ? 'var(--primary)' : 'var(--border)'}; border: 3px solid var(--bg-dark);"></div>
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500; margin-bottom: 0.25rem;">${e.dateStr}</div>
            <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); margin-bottom: 0.25rem;">${e.title}</div>
            <div style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.4;">${e.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div style="display: flex; justify-content: flex-end;">
      <button id="hist-close-btn" class="btn btn-secondary" style="padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">Cerrar</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector('#hist-close-btn').onclick = () => {
    document.body.removeChild(overlay);
  };
}

/**
 * Abre un modal para cambiar el destino de una res despachada.
 */
export function openChangeDestinationModal(item, clientsList, onConfirm) {
  const overlay = el('div', { 
    classes: ['modal-overlay'], 
    style: 'position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; padding: 1rem;' 
  });
  const modal = el('div', { 
    classes: ['glass-card'], 
    style: 'background: var(--bg-dark); max-width: 450px; width: 100%; padding: 2rem; position: relative; border: 1px solid var(--border); border-radius: 16px;' 
  });

  const oldDestination = item.destination || 'Sin Destino';
  
  let oldPrice = 0;
  if (item.movements && item.movements.length > 0) {
    const lastMov = item.movements.filter(m => m.type === 'DISPATCH' || m.type === 'DESTINATION').pop();
    if (lastMov && lastMov.price) oldPrice = lastMov.price;
  }

  modal.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 1.5rem; color: var(--primary);">✏️ Reasignar Destino - Garrón #${item.garron}</h3>
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 1rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: 0.9rem; line-height: 1.5;">
      <div><strong>Tropa:</strong> ${item.tropa} | <strong>Peso:</strong> ${item.kg.toFixed(1)} kg</div>
      <div><strong>Categoría:</strong> ${item.standardizedCategory || item.category}</div>
      <div style="color: var(--danger); margin-top: 0.25rem;"><strong>Destino Actual:</strong> ${oldDestination} ${oldPrice > 0 ? `($${oldPrice}/kg)` : ''}</div>
    </div>
    <div style="margin-bottom: 1.25rem;">
      <label for="new-dest-input" style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Nuevo Destino / Cliente</label>
      <input type="text" id="new-dest-input" class="form-input" list="modal-clients-list" style="width: 100%; box-sizing: border-box;" placeholder="Buscar o ingresar carnicería..." value="">
      <datalist id="modal-clients-list">
        ${(clientsList || []).map(c => `<option value="${c.name}">`).join('')}
      </datalist>
    </div>
    <div style="margin-bottom: 1.5rem;">
      <label for="new-price-input" style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Nuevo Precio por Kg ($/kg)</label>
      <input type="number" id="new-price-input" class="form-input" style="width: 100%; box-sizing: border-box;" placeholder="Ingresar precio por kg..." value="${oldPrice > 0 ? oldPrice : ''}">
    </div>
    <div style="margin-bottom: 1.5rem; text-align: right; font-weight: bold; font-size: 1.05rem; display: none;" id="estimated-debt-wrap">
      Deuda a transferir: <span style="color: #10b981;" id="estimated-debt-val">$0</span>
    </div>
    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
      <button id="dest-cancel-btn" class="btn btn-secondary" style="padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer;">Cancelar</button>
      <button id="dest-save-btn" class="btn btn-primary" style="padding: 0.6rem 1.2rem; border-radius: 8px; background: var(--primary); color: var(--on-primary); border: none; cursor: pointer; font-weight: 600;">Confirmar Cambio</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const destInput = modal.querySelector('#new-dest-input');
  const priceInput = modal.querySelector('#new-price-input');
  const debtWrap = modal.querySelector('#estimated-debt-wrap');
  const debtVal = modal.querySelector('#estimated-debt-val');
  const cancelBtn = modal.querySelector('#dest-cancel-btn');
  const saveBtn = modal.querySelector('#dest-save-btn');

  const updateEstimatedDebt = () => {
    const pr = parseFloat(priceInput.value);
    if (!isNaN(pr) && pr > 0) {
      debtVal.textContent = `$${(item.kg * pr).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      debtWrap.style.display = 'block';
    } else {
      debtWrap.style.display = 'none';
    }
  };

  priceInput.addEventListener('input', updateEstimatedDebt);
  updateEstimatedDebt();

  cancelBtn.onclick = () => {
    document.body.removeChild(overlay);
  };

  saveBtn.onclick = () => {
    const newDestination = destInput.value.trim();
    const newPrice = parseFloat(priceInput.value);

    if (!newDestination) {
      alert("Por favor, ingrese un nuevo destino/cliente.");
      return;
    }
    if (isNaN(newPrice) || newPrice <= 0) {
      alert("Por favor, ingrese un precio por kg válido.");
      return;
    }
    if (newDestination.toLowerCase() === oldDestination.toLowerCase()) {
      alert("El nuevo destino es idéntico al actual.");
      return;
    }

    if (confirm(`¿Confirmar reasignación de Garrón #${item.garron} a "${newDestination}"?\n\nLa transacción contable se transferirá automáticamente de "${oldDestination}" a "${newDestination}" por un monto de $${(item.kg * newPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}.`)) {
      document.body.removeChild(overlay);
      onConfirm(item.id, newDestination, newPrice);
    }
  };
}

/**

 * Renderiza la pantalla principal del panel de control de faena, stock e inventario.
 * 
 * Gestiona dinámicamente cuatro pestañas primarias (STOCK, DRAFTS, HISTORY, ACHURAS) y
 * delega en `faenaStockSummary` la visualización de estadísticas agregadas, desgloses por
 * categoría de despacho estimulado e importes agregados.
 *
 * @param {HTMLElement} container - Elemento contenedor padre donde se inyectará el módulo.
 * @param {Object} options - Parámetros de configuración, callbacks de negocio y resumen financiero del dominio.
 * @param {Object} options.state - Parámetros de estado actual inyectados desde el presentador.
 * @param {Array<Object>} options.stockItems - Colección de piezas en stock filtradas.
 * @param {Array<Object>} options.draftItems - Colección de preparaciones en borrador.
 * @param {Array<Object>} options.historyItems - Colección de despachos históricos realizados.
 * @param {Array<string>} options.allTropas - Catálogo de números de tropas de origen registrados en la sesión.
 * @param {Array<string>} options.finishedTropas - Catálogo de números de tropas cuyos garrones fueron despachados.
 * @param {Object} options.faenaStockSummary - Resumen consolidado e instanciado de la entidad de dominio FaenaStock.
 * @param {Function} options.onTabSwitch - Callback al alternar entre pestañas de visualización.
 * @param {Function} options.onToggleSelection - Callback al marcar o desmarcar una pieza en stock.
 * @param {Function} options.onSelectAll - Callback para marcar todo el stock visible a la vez.
 * @param {Function} options.onClearSelection - Callback para reestablecer la selección de despacho.
 * @param {Function} options.onDestinationInput - Callback gatillado al escribir el nombre del cliente destino.
 * @param {Function} options.onDispatch - Callback para confirmar el despacho definitivo.
 * @param {Function} options.onFilterChange - Callback disparado al refinar filtros de auditoría histórica.
 * @param {Function} options.onToggleSort - Callback para invertir el ordenamiento por número de garrón.
 * @param {Function} options.onStockSearch - Callback disparado al tipear en el input de búsqueda de stock.
 * @param {Function} options.onCategoryChange - Callback para cambiar el filtro global por categoría.
 * @param {Function} options.onTropaChange - Callback para filtrar la grilla según una tropa en particular.
 * @param {Function} [options.onCategoryPriceInput] - Callback para actualizar estimaciones de precios de despacho.
 * @param {Function} [options.onMoveToCamara] - Callback para trasladar los garrones seleccionados a otra cámara frigorífica.
 * @param {Function} [options.onConfirmDraft] - Callback para importar un borrador preparado a la grilla de salida del administrador.
 * @param {Function} [options.onRevertDraft] - Callback para disolver una preparación y reintegrarla al stock.
 * @param {Array<Object>} [options.clients] - Lista global de clientes registrados en base de datos.
 * @param {Array<Object|string>} [options.camarasList] - Lista de cámaras de frío cargadas.
 * @param {Object} [options.camaraOccupancy] - Ocupación numérica actual por cámara.
 * @param {number} [options.unassignedCount] - Cantidad de reses huérfanas sin cámara.
 */
