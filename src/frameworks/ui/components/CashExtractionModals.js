/**
 * CashExtractionModals.js
 * Pantallas dedicadas a pantalla completa para el control y recepción de extracciones de carnicerías.
 * Diseñadas para una visualización óptima en todos los tamaños de pantalla (escritorio, tablet y móvil).
 */
import { el } from '../../../frameworks/utils/dom.js';
import { formatCurrency, formatDate, formatTime } from '../../../frameworks/utils/formatters.js';
import { parseCashExtractionBreakdown } from '../../../adapters/api/CashExtractionApi.js';
import { showBillCalculator } from './AccountingModals.js';

/**
 * Renderiza la pantalla dedicada a pantalla completa para el control y recepción de una extracción de carnicería.
 * @param {HTMLElement} container - Contenedor principal donde se renderiza la vista.
 * @param {Object} options - Opciones conteniendo extraction, onSave, onBack, userRole.
 */
export function renderExtractionControlScreen(container, { extraction, onSave, onBack, userRole = 'VISOR' }) {
  container.innerHTML = '';

  if (userRole !== 'ADMIN') {
    alert("⚠️ Acceso Restringido: Únicamente el usuario ADMINISTRADOR puede autorizar y dar ingreso a las extracciones de carnicería.");
    if (typeof onBack === 'function') onBack();
    return;
  }

  const { items: breakdownItems, totalCalculated, billCounts: initialBillCounts } = parseCashExtractionBreakdown(extraction.billeteBreakdownJson);
  let currentBillCounts = { ...initialBillCounts };

  const formattedDate = formatDate(extraction.timestamp || extraction.createdAt || Date.now());
  const formattedTime = formatTime(extraction.timestamp || extraction.createdAt || Date.now());

  const wrapper = el('div', {
    classes: ['extraction-screen-wrapper', 'fade-in'],
    style: 'width: 100%; padding-bottom: 3rem;'
  });


  // ---- Header con botón Volver ----
  const header = el('div', {
    classes: ['dashboard-header'],
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;'
  });

  const titleGroup = el('div', { style: 'display: flex; align-items: center; gap: 1rem;' });
  const backBtn = el('button', {
    classes: ['back-btn-m3'],
    html: '<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>',
    attrs: { title: 'Volver a Caja General' }
  });
  backBtn.onclick = () => {
    if (typeof onBack === 'function') onBack();
  };

  titleGroup.appendChild(backBtn);
  titleGroup.appendChild(el('div', {
    html: `<h1 style="margin:0; font-size: 1.5rem;">📥 Control e Ingreso de Extracción</h1>
           <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">${extraction.butcheryName || 'Sucursal'} • ${formattedDate} (${formattedTime})</div>`
  }));
  header.appendChild(titleGroup);

  const statusBadge = el('div', {
    html: `<span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); font-weight: 700; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem;">⏳ Extracción Pendiente</span>`
  });
  header.appendChild(statusBadge);

  wrapper.appendChild(header);

  // ---- Grid de Información Principal ----
  const mainGrid = el('div', {
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;'
  });

  // Card 1: Datos de origen
  const originCard = el('div', {
    classes: ['glass-card'],
    style: 'padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;'
  });
  originCard.innerHTML = `
    <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
      📄 Datos de la Extracción
    </h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <div>
        <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 700;">Monto Declarado</span>
        <span style="font-size: 1.5rem; font-weight: 800; color: var(--success);">${formatCurrency(extraction.amount)}</span>
      </div>
      <div>
        <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 700;">Sesión de Caja</span>
        <span style="font-size: 0.95rem; font-weight: 600; font-family: monospace;">${extraction.cashSessionId || '-'}</span>
      </div>
    </div>
    <div>
      <span style="font-size: 0.75rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 700;">Detalle / Personal / Precinto</span>
      <div style="font-size: 0.95rem; color: var(--text-main); font-weight: 500; margin-top: 0.25rem;">${extraction.description || 'Sin observaciones'}</div>
    </div>
  `;
  mainGrid.appendChild(originCard);

  // Card 2: Resumen del Arqueo
  const summaryCard = el('div', {
    classes: ['glass-card'],
    style: 'padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;'
  });
  summaryCard.innerHTML = `
    <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
      ⚖️ Estado de Arqueo
    </h3>
    <div style="font-size: 0.9rem; color: var(--text-muted);">
      Compara el monto declarado por la carnicería contra el recuento de efectivo recibido en la Caja General.
    </div>
    <div id="screen-diff-container" style="padding: 1rem; border-radius: 10px; font-weight: 700; text-align: center; font-size: 1.1rem; border: 1px solid transparent; background: rgba(255,255,255,0.03);">
      Calculando diferencia...
    </div>
  `;
  mainGrid.appendChild(summaryCard);

  wrapper.appendChild(mainGrid);

  // ---- Tabla de Desglose de Billetes Declarado ----
  const breakdownCard = el('div', {
    classes: ['glass-card'],
    style: 'margin-bottom: 1.5rem; padding: 1.5rem;'
  });

  breakdownCard.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; color: var(--primary); display: flex; align-items: center; justify-content: space-between;">
      <span>💵 Desglose de Billetes Declarado (Carnicería)</span>
      <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">Marca las filas con recuento erróneo ❌</span>
    </h3>
    
    ${breakdownItems.length > 0 ? `
      <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 600px;">
          <thead>
            <tr style="background: rgba(255,255,255,0.05); text-align: left; border-bottom: 1px solid var(--border);">
              <th style="padding: 0.75rem 1rem;">Denominación</th>
              <th style="padding: 0.75rem 1rem; text-align: center;">Fajos (100 u.)</th>
              <th style="padding: 0.75rem 1rem; text-align: center;">Sueltos (1 u.)</th>
              <th style="padding: 0.75rem 1rem; text-align: right;">Subtotal</th>
              <th style="padding: 0.75rem 1rem; text-align: center;">¿Recuento Mal?</th>
            </tr>
          </thead>
          <tbody>
            ${breakdownItems.map(item => `
              <tr class="breakdown-row" data-denom="${item.denominacion}" style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;">
                <td style="padding: 0.6rem 1rem; font-weight: 700; font-size: 1.05rem;">$ ${item.denominacion.toLocaleString()}</td>
                <td style="padding: 0.6rem 1rem; text-align: center; color: ${item.fajos > 0 ? '#60a5fa' : 'var(--text-muted)'}; font-weight: 600;">${item.fajos}</td>
                <td style="padding: 0.6rem 1rem; text-align: center; color: ${item.sueltos > 0 ? '#60a5fa' : 'var(--text-muted)'}; font-weight: 600;">${item.sueltos}</td>
                <td style="padding: 0.6rem 1rem; text-align: right; font-weight: 700; color: #10b981;">$ ${item.subtotal.toLocaleString()}</td>
                <td style="padding: 0.6rem 1rem; text-align: center;">
                  <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; padding: 0.3rem 0.75rem; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); user-select: none;">
                    <input type="checkbox" class="denom-bad-chk" data-denom="${item.denominacion}">
                    <span class="bad-status-text" style="color: var(--text-muted);">❌ Estuvo mal</span>
                  </label>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.75rem; display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.02); padding: 0.6rem 1rem; border-radius: 8px;">
        <span>💡</span> <span>Las denominaciones que marques con <strong>"❌ Estuvo mal"</strong> se abrirán <strong>vacías</strong> al presionar <strong>🧮 Recuento</strong>, mientras que las que estuvieron bien mantendrán su precarga.</span>
      </div>
    ` : `
      <div style="font-size: 0.9rem; color: var(--text-muted); font-style: italic; background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
        No se adjuntó el desglose deserializado de billetes en esta extracción.
      </div>
    `}
  `;

  wrapper.appendChild(breakdownCard);

  // ---- Formulario de Ingreso en Caja General ----
  const formCard = el('div', {
    classes: ['glass-card'],
    style: 'padding: 1.5rem;'
  });

  formCard.innerHTML = `
    <h3 style="margin-top: 0; margin-bottom: 1.5rem; font-size: 1.1rem; color: var(--primary);">
      ✍️ Asentamiento en Libro Diario de Caja General
    </h3>

    <form id="screen-extraction-form">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
        <div class="form-group">
          <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Monto a Ingresar ($)</label>
          <input type="number" step="0.01" name="amount" id="expected-amount-input" required 
                 style="font-size: 1.3rem; font-weight: 700; width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);" 
                 value="${extraction.amount}">
        </div>
        
        <div class="form-group">
          <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Monto Contado Físico ($)</label>
          <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.5rem;">
            <input type="number" step="0.01" name="countedAmount" id="counted-amount-input" required 
                   style="font-size: 1.3rem; font-weight: 700; width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);" 
                   value="${totalCalculated > 0 ? totalCalculated : extraction.amount}">
            <button type="button" id="open-calc-btn" class="btn-secondary" style="white-space: nowrap; padding: 0 1.25rem; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;" title="Abrir la calculadora de recuento físico de billetes">
              🧮 Recuento
            </button>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 2rem;">
        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Concepto / Observaciones en Libro Diario</label>
        <input type="text" name="description" required style="width: 100%; padding: 0.75rem; border-radius: 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--border); color: var(--text-main);"
               value="[Ingreso Extracción] ${extraction.butcheryName} - ${extraction.description || ''}">
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; align-items: center; border-top: 1px solid var(--border); padding-top: 1.5rem; flex-wrap: wrap;">
        <button type="button" class="btn-cancel cancel-btn" style="padding: 0.9rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">
          ← Volver sin guardar
        </button>
        <button type="submit" style="padding: 0.9rem 2.5rem; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 1.05rem; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 15px rgba(16,185,129,0.3); letter-spacing: 0.02em;">
          ✓ Confirmar y Dar Ingreso
        </button>
      </div>
    </form>
  `;

  wrapper.appendChild(formCard);
  container.appendChild(wrapper);

  // Hook eventos
  const form = wrapper.querySelector('#screen-extraction-form');
  const expectedAmountInput = wrapper.querySelector('#expected-amount-input');
  const countedAmountInput = wrapper.querySelector('#counted-amount-input');
  const screenDiffContainer = wrapper.querySelector('#screen-diff-container');

  // Event listener para checkboxes de filas erróneas
  wrapper.querySelectorAll('.denom-bad-chk').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const isBad = e.target.checked;
      const row = e.target.closest('.breakdown-row');
      const labelText = row.querySelector('.bad-status-text');
      
      if (isBad) {
        row.style.background = 'rgba(239, 68, 68, 0.12)';
        labelText.textContent = '⚠️ Mal (Se borrará)';
        labelText.style.color = '#ef4444';
        labelText.style.fontWeight = '700';
      } else {
        row.style.background = 'transparent';
        labelText.textContent = '❌ Estuvo mal';
        labelText.style.color = 'var(--text-muted)';
        labelText.style.fontWeight = 'normal';
      }
    });
  });

  const updateDiff = () => {
    const exp = parseFloat(expectedAmountInput.value);
    const count = parseFloat(countedAmountInput.value);
    if (!isNaN(exp) && !isNaN(count)) {
      const diff = count - exp;
      if (Math.abs(diff) < 0.01) {
        screenDiffContainer.style.background = 'rgba(255,255,255,0.05)';
        screenDiffContainer.style.borderColor = 'var(--border)';
        screenDiffContainer.style.color = 'var(--text-main)';
        screenDiffContainer.textContent = 'Diferencia en Caja: OK (Monto extraído y contado coinciden)';
      } else if (diff > 0) {
        screenDiffContainer.style.background = 'rgba(16,185,129,0.1)';
        screenDiffContainer.style.borderColor = 'rgba(16,185,129,0.3)';
        screenDiffContainer.style.color = '#10b981';
        screenDiffContainer.textContent = `Sobra en Caja General: ${formatCurrency(diff)}`;
      } else {
        screenDiffContainer.style.background = 'rgba(239,68,68,0.1)';
        screenDiffContainer.style.borderColor = 'rgba(239,68,68,0.3)';
        screenDiffContainer.style.color = '#ef4444';
        screenDiffContainer.textContent = `Falta en Caja General: ${formatCurrency(Math.abs(diff))}`;
      }
    }
  };

  expectedAmountInput.addEventListener('input', updateDiff);
  countedAmountInput.addEventListener('input', updateDiff);
  updateDiff();

  wrapper.querySelector('#open-calc-btn').onclick = () => {
    const breakdownForCalc = {};

    breakdownItems.forEach(item => {
      const denom = item.denominacion;
      const chk = wrapper.querySelector(`.denom-bad-chk[data-denom="${denom}"]`);
      const isBad = chk ? chk.checked : false;

      if (!isBad) {
        // Estuvo BIEN: se precargan sus valores
        breakdownForCalc[denom] = {
          blocks: 0,
          batches: item.fajos,
          qtys: item.sueltos,
          subtotal: item.subtotal
        };
      } else {
        // Estuvo MAL: se dejan vacíos (0/blank) para ingresar el nuevo recuento
        breakdownForCalc[denom] = {
          blocks: '',
          batches: '',
          qtys: ''
        };
      }
    });

    showBillCalculator(
      parseFloat(expectedAmountInput.value) || 0,
      (result) => {
        countedAmountInput.value = result.grand;
        currentBillCounts = result.breakdown;
        updateDiff();
      },
      breakdownForCalc
    );
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const entryData = {
      type: 'IN',
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      countedAmount: parseFloat(formData.get('countedAmount')),
      billCounts: currentBillCounts,
      date: extraction.timestamp || Date.now(),
      extractionId: extraction.id,
      butcheryName: extraction.butcheryName
    };

    onSave({ entryData, extractionId: extraction.id });
  };

  wrapper.querySelector('.cancel-btn').onclick = () => {
    if (typeof onBack === 'function') onBack();
  };
}

/**
 * Renderiza la pantalla dedicada a pantalla completa para visualizar una extracción ya ingresada.
 * @param {HTMLElement} container 
 * @param {Object} options - extraction, onBack 
 */
export function renderExtractionDetailScreen(container, { extraction, onBack }) {
  container.innerHTML = '';

  const { items: breakdownItems } = parseCashExtractionBreakdown(extraction.billeteBreakdownJson);

  const formattedDate = formatDate(extraction.timestamp || extraction.createdAt || Date.now());
  const formattedTime = formatTime(extraction.timestamp || extraction.createdAt || Date.now());

  const wrapper = el('div', {
    classes: ['extraction-screen-wrapper', 'fade-in'],
    style: 'width: 100%; padding-bottom: 3rem;'
  });


  const header = el('div', {
    classes: ['dashboard-header'],
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;'
  });

  const titleGroup = el('div', { style: 'display: flex; align-items: center; gap: 1rem;' });
  const backBtn = el('button', {
    classes: ['back-btn-m3'],
    html: '<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>',
    attrs: { title: 'Volver a Caja General' }
  });
  backBtn.onclick = () => {
    if (typeof onBack === 'function') onBack();
  };

  titleGroup.appendChild(backBtn);
  titleGroup.appendChild(el('h1', { text: `Detalle de Extracción Ingresada`, style: 'margin:0; font-size: 1.5rem;' }));
  header.appendChild(titleGroup);

  const statusBadge = el('div', {
    html: `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem;">✅ Ingresado en Caja General</span>`
  });
  header.appendChild(statusBadge);

  wrapper.appendChild(header);

  const card = el('div', {
    classes: ['glass-card'],
    style: 'padding: 1.5rem;'
  });

  card.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem;">
      <div><strong>Sucursal:</strong> <span style="display: block; font-size: 1.1rem; font-weight: 700;">${extraction.butcheryName || '-'}</span></div>
      <div><strong>Fecha y Hora:</strong> <span style="display: block; font-size: 1.05rem; font-weight: 600;">${formattedDate} (${formattedTime})</span></div>
      <div><strong>Monto Extraído:</strong> <span style="display: block; font-size: 1.3rem; font-weight: 800; color: var(--success);">${formatCurrency(extraction.amount)}</span></div>
      <div><strong>Observaciones / Precinto:</strong> <span style="display: block; font-size: 0.95rem;">${extraction.description || 'Sin datos'}</span></div>
    </div>

    <h3 style="margin: 1.5rem 0 1rem 0; font-size: 1.1rem; color: var(--primary);">Desglose de Billetes Declarado</h3>
    
    ${breakdownItems.length > 0 ? `
      <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 10px; overflow-x: auto; margin-bottom: 2rem;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 500px;">
          <thead>
            <tr style="background: rgba(255,255,255,0.05); text-align: left; border-bottom: 1px solid var(--border);">
              <th style="padding: 0.75rem 1rem;">Denominación</th>
              <th style="padding: 0.75rem 1rem; text-align: center;">Fajos (100 u.)</th>
              <th style="padding: 0.75rem 1rem; text-align: center;">Sueltos (1 u.)</th>
              <th style="padding: 0.75rem 1rem; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${breakdownItems.map(item => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 0.6rem 1rem; font-weight: 700; font-size: 1.05rem;">$ ${item.denominacion.toLocaleString()}</td>
                <td style="padding: 0.6rem 1rem; text-align: center;">${item.fajos}</td>
                <td style="padding: 0.6rem 1rem; text-align: center;">${item.sueltos}</td>
                <td style="padding: 0.6rem 1rem; text-align: right; font-weight: 700; color: #10b981;">$ ${item.subtotal.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<p style="color: var(--text-muted); font-style: italic;">Sin desglose adjunto.</p>'}

    <div style="display: flex; justify-content: flex-end;">
      <button class="btn-secondary back-btn" style="padding: 0.75rem 2rem; border-radius: 10px; font-weight: 600;">← Volver a Caja General</button>
    </div>
  `;

  wrapper.appendChild(card);
  container.appendChild(wrapper);

  wrapper.querySelector('.back-btn').onclick = () => {
    if (typeof onBack === 'function') onBack();
  };
}
