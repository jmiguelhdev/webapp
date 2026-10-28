/**
 * @file BranchPricingUI.js
 * @description Pantalla para la administración de precios por sucursal, visibilidad en portada,
 * configuración de la carnicería móvil con itinerario de paradas barriales,
 * e impresión de cartelería con Código QR en formato A4 y térmico POS 80mm.
 * @module ui/screens/BranchPricingUI
 */
import { el } from '../../../frameworks/utils/dom.js';
import { BranchPricePdfService, getBranchQrUrl } from '../reports/BranchPricePdfService.js';
import { ToastService } from '../components/ToastService.js';
import QRCode from 'qrcode';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class BranchPricingUI {
  /**
   * Renderiza la pantalla de gestión de precios, visibilidad y cartelería QR.
   * @param {HTMLElement} container
   * @param {Object} options
   * @param {Array<Object>} options.branchesData - Listado de sucursales con precios.
   * @param {function(string, Object, Array<string>): Promise<void>} options.onSavePrices
   * @param {function(Object): Promise<void>} [options.onSaveMobileBranch]
   * @param {function(string, boolean): Promise<void>} [options.onSaveVisibility]
   * @param {function(): void} options.onBack
   */
  static render(container, { branchesData, onSavePrices, onSaveMobileBranch, onSaveVisibility, onBack }) {
    if (!container) return;

    const branches = [...(branchesData || [])];
    
    // Si la carnicería móvil no está en el listado, asegurar que esté disponible
    if (!branches.some(b => b.id === 'pampa_movil' || b.isMobile)) {
      branches.push({
        id: 'pampa_movil',
        name: 'Frigorífico Pampa en tu Barrio',
        address: 'Puntos de venta itinerantes y ferias barriales',
        phone: '+54 9 381 400-BARRIO',
        hours: '08:30 a 14:00 hs',
        isMobile: true,
        isPublished: true,
        priceListId: 'PL_MOVIL',
        priceListName: 'Precios Móviles en tu Barrio',
        schedule: [
          {
            id: 'stop_1',
            date: '2026-11-01',
            dateDisplay: 'Sábado 1 de Noviembre',
            time: '09:00 a 14:00 hs',
            location: 'Plaza San Martín (Barrio Sur)',
            reference: 'Frente a la Parroquia',
            status: 'CONFIRMADO'
          }
        ],
        items: []
      });
    }

    let selectedBranchId = branches.length > 0 ? branches[0].id : null;
    let currentFilterText = '';

    container.innerHTML = '';

    const wrapper = el('div', {
      classes: ['branch-pricing-wrapper', 'fade-in'],
      style: 'max-width: 1200px; margin: 0 auto; padding: 1.5rem 1rem;'
    });

    // Encabezado
    const header = el('div', {
      classes: ['glass-card'],
      style: 'padding: 1.5rem 2rem; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;'
    });

    const renderHeaderContent = () => {
      header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button id="btn-back-pricing" class="back-btn-m3" title="Volver al Dashboard" style="border: 1px solid var(--border); background: var(--bg-main);">
            <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
          </button>
          <div>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-main);">🏷️ Precios & Cartelería QR por Sucursal</h2>
            <p style="margin: 0.25rem 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Configura precios, visibilidad en portada web, paradas del camión móvil y emite carteles QR.</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <label for="select-branch-pricing" style="font-size: 0.85rem; font-weight: 600; color: var(--primary);">Sucursal:</label>
          <select id="select-branch-pricing" class="form-input" style="border-radius: 10px; padding: 0.5rem 1rem; font-weight: 600; min-width: 240px;">
            ${branches.map(b => {
              const icon = b.isMobile ? '🚚' : '🏢';
              const pubStatus = b.isPublished === false ? ' (Oculto en Web)' : '';
              return `<option value="${b.id}" ${b.id === selectedBranchId ? 'selected' : ''}>${icon} ${b.name}${pubStatus}</option>`;
            }).join('')}
          </select>
        </div>
      `;

      header.querySelector('#btn-back-pricing').onclick = onBack;
      const branchSelect = header.querySelector('#select-branch-pricing');
      if (branchSelect) {
        branchSelect.onchange = (e) => {
          selectedBranchId = e.target.value;
          currentFilterText = '';
          renderActiveBranch();
        };
      }
    };

    renderHeaderContent();
    wrapper.appendChild(header);

    // Contenedor principal de pestañas/paneles
    const mainContent = el('div', { attrs: { id: 'branch-pricing-main-panels' } });
    wrapper.appendChild(mainContent);
    container.appendChild(wrapper);

    // Renderizado dinámico de la sucursal seleccionada
    const renderActiveBranch = async () => {
      const branch = branches.find(b => b.id === selectedBranchId);
      if (!branch) {
        mainContent.innerHTML = `
          <div style="padding: 3rem; text-align: center; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 16px;">
            No se encontró información de la sucursal seleccionada.
          </div>
        `;
        return;
      }

      const isMobile = Boolean(branch.isMobile || branch.id === 'pampa_movil');
      const isPublished = branch.isPublished !== false;
      const qrUrl = getBranchQrUrl(branch.id);
      let previewQrDataUrl = '';
      try {
        previewQrDataUrl = await QRCode.toDataURL(qrUrl, { width: 220, margin: 1 });
      } catch (e) {
        console.warn(e);
      }

      // Panel especial de itinerario móvil si corresponde
      const mobileScheduleHtml = isMobile ? `
        <!-- Panel Itinerario Móvil -->
        <div class="glass-card" style="padding: 1.75rem; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 1.75rem; background: rgba(143, 0, 20, 0.02);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <span style="font-size: 0.72rem; font-weight: 700; letter-spacing: 1.5px; color: var(--primary); background: rgba(143, 0, 20, 0.08); padding: 0.25rem 0.75rem; border-radius: 100px;">ITINERARIO BARRIAL</span>
              <h3 style="font-size: 1.25rem; font-weight: 700; margin: 0.5rem 0 0.2rem 0; color: var(--text-main);">📅 Cronograma de Paradas & Puntos de Venta</h3>
              <p style="margin: 0; font-size: 0.82rem; color: var(--text-muted);">
                Configura las ubicaciones donde estará presente el camión frigorífico. Las fechas pasadas se filtran automáticamente.
              </p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button id="btn-save-mobile-itinerary" class="btn-primary" style="padding: 0.6rem 1.25rem; border-radius: 10px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
                <span>💾 Guardar Itinerario Móvil</span>
              </button>
            </div>
          </div>

          <!-- Campos de Configuración Básica de la Carnicería Móvil -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; padding: 1rem; background: var(--bg-main); border-radius: 12px; border: 1px solid var(--border);">
            <div>
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">Nombre de la Sucursal Móvil:</label>
              <input type="text" id="mob-input-name" class="form-input" value="${escapeHtml(branch.name || 'Frigorífico Pampa en tu Barrio')}" style="width: 100%; border-radius: 8px; padding: 0.5rem 0.75rem; font-weight: 600;">
            </div>
            <div>
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">Teléfono / WhatsApp de Consultas:</label>
              <input type="text" id="mob-input-phone" class="form-input" value="${escapeHtml(branch.phone || '')}" placeholder="+54 9 381..." style="width: 100%; border-radius: 8px; padding: 0.5rem 0.75rem;">
            </div>
          </div>

          <!-- Formulario Agregar Parada -->
          <div style="background: var(--bg-main); border: 1px dashed var(--border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem;">
            <h5 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; font-weight: 700; color: var(--text-main);">➕ Agregar Nueva Parada al Cronograma:</h5>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; align-items: flex-end;">
              <div>
                <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Fecha:</label>
                <input type="date" id="mob-new-date" class="form-input" style="width: 100%; border-radius: 8px; padding: 0.45rem 0.6rem; font-size: 0.85rem;">
              </div>
              <div>
                <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Etiqueta Fecha (opcional):</label>
                <input type="text" id="mob-new-date-display" class="form-input" placeholder="Ej: Sábado 1 de Nov." style="width: 100%; border-radius: 8px; padding: 0.45rem 0.6rem; font-size: 0.85rem;">
              </div>
              <div>
                <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Horario:</label>
                <input type="text" id="mob-new-time" class="form-input" value="09:00 a 14:00 hs" style="width: 100%; border-radius: 8px; padding: 0.45rem 0.6rem; font-size: 0.85rem;">
              </div>
              <div>
                <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Dirección / Plaza / Barrio:</label>
                <input type="text" id="mob-new-loc" class="form-input" placeholder="Ej: Plaza San Martín" style="width: 100%; border-radius: 8px; padding: 0.45rem 0.6rem; font-size: 0.85rem;">
              </div>
              <div>
                <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Referencia:</label>
                <input type="text" id="mob-new-ref" class="form-input" placeholder="Ej: Frente al centro vecinal" style="width: 100%; border-radius: 8px; padding: 0.45rem 0.6rem; font-size: 0.85rem;">
              </div>
              <div>
                <button type="button" id="mob-btn-add-stop" class="btn-primary" style="width: 100%; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem;">
                  <span>➕ Agregar</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Listado de Paradas Actuales -->
          <div id="mob-stops-list" style="display: flex; flex-direction: column; gap: 0.6rem;">
            <!-- Renderizado dinámico -->
          </div>

          <div style="margin-top: 1rem; font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
            <span>🔗</span>
            <span><em>Hook Preparado: Los puntos generados por la app de fábrica en Firestore se integrarán de forma transparente en este cronograma.</em></span>
          </div>
        </div>
      ` : '';

      mainContent.innerHTML = `
        ${mobileScheduleHtml}

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.75rem;">
          
          <!-- Panel Izquierdo: Emisión e Impresión de QR + Visibilidad -->
          <div class="glass-card" style="padding: 2rem; border-radius: 20px; border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: space-between; gap: 1.5rem;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.75rem;">
                <span style="font-size: 0.72rem; font-weight: 700; letter-spacing: 1.5px; color: var(--primary); background: rgba(143, 0, 20, 0.08); padding: 0.25rem 0.75rem; border-radius: 100px;">
                  ${isMobile ? '🚚 CARNICERÍA MÓVIL' : 'CARTELERÍA & MOSTRADOR'}
                </span>
                
                <!-- Toggle Visibilidad Portada Web -->
                <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.8rem; font-weight: 600; color: ${isPublished ? 'var(--primary)' : 'var(--text-muted)'}; background: var(--bg-main); padding: 0.3rem 0.6rem; border-radius: 8px; border: 1px solid var(--border);">
                  <input type="checkbox" id="check-branch-published" ${isPublished ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;">
                  <span>${isPublished ? '👁️ Visible en Portada' : '🚫 Oculta en Portada'}</span>
                </label>
              </div>

              <h3 style="font-size: 1.25rem; font-weight: 700; margin: 0.4rem 0 0.3rem 0; color: var(--text-main);">${branch.name}</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                ${isMobile ? '📍 Itinerario barrial rotativo' : (branch.address ? `📍 ${branch.address}` : 'Dirección no especificada')}
              </p>

              <!-- Vista Previa QR -->
              <div style="text-align: center; padding: 1.25rem; background: var(--bg-main); border-radius: 16px; border: 1px solid var(--border); margin-bottom: 1.25rem;">
                <img src="${previewQrDataUrl}" alt="QR Code" style="width: 140px; height: 140px; border-radius: 12px; display: inline-block; background: #fff; padding: 6px;" />
                <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.6rem; word-break: break-all;">
                  <strong>Enlace Directo:</strong> ${qrUrl}
                </p>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <button id="btn-print-a4" class="btn-primary" style="width: 100%; padding: 0.85rem 1.25rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.6rem;">
                  <span>🖨️ Imprimir Cartel A4 (${isMobile ? 'Punto de Venta / Camión' : 'Mostrador/Vidriera'})</span>
                </button>
                <button id="btn-print-thermal" class="btn-outline" style="width: 100%; padding: 0.85rem 1.25rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.6rem;">
                  <span>🧾 Imprimir Ticket Térmico POS 80mm</span>
                </button>
                <button id="btn-download-pdf-admin" class="btn-outline" style="width: 100%; padding: 0.85rem 1.25rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.6rem;">
                  <span>📥 Descargar PDF de Precios (A4 Cliente)</span>
                </button>
              </div>
            </div>

            <div style="font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 0.75rem;">
              💡 <em>Al escanear el cartel con cualquier celular, se abrirá la portada web mostrando directamente los precios de ${isMobile ? 'la carnicería móvil y sus paradas' : 'esta sucursal'}.</em>
            </div>
          </div>

          <!-- Panel Derecho: Configuración de Precios y Cortes Visibles -->
          <div class="glass-card" style="padding: 2rem; border-radius: 20px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <h4 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main);">Cortes & Precios por Kg</h4>
                <p style="margin: 0.2rem 0 0 0; font-size: 0.82rem; color: var(--text-muted);">
                  Lista: <strong>${branch.priceListName || branch.priceListId || 'Por Defecto'}</strong> (${(branch.items || []).length} productos)
                </p>
              </div>
              <input type="text" id="input-search-cuts" class="form-input" placeholder="🔍 Buscar corte..." style="border-radius: 8px; padding: 0.45rem 0.8rem; font-size: 0.85rem; width: 180px;">
            </div>

            <!-- Tabla de Cortes -->
            <div style="max-height: 480px; overflow-y: auto; border: 1px solid var(--border); border-radius: 12px; background: var(--bg-main);">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead style="position: sticky; top: 0; background: var(--card-bg); z-index: 10; border-bottom: 1px solid var(--border);">
                  <tr>
                    <th style="padding: 0.75rem; text-align: left; color: var(--text-muted); font-weight: 600;">Corte / Producto</th>
                    <th style="padding: 0.75rem; text-align: right; color: var(--text-muted); font-weight: 600; width: 140px;">Precio $/kg</th>
                    <th style="padding: 0.75rem; text-align: center; color: var(--text-muted); font-weight: 600; width: 90px;" title="Mostrar en web y PDF">Visible</th>
                  </tr>
                </thead>
                <tbody id="pricing-table-body">
                  <!-- Generado dinámicamente -->
                </tbody>
              </table>
            </div>

            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 1rem; margin-top: 0.5rem;">
              <button id="btn-save-branch-pricing" class="btn-primary" style="padding: 0.75rem 2rem; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
                <span>💾 Guardar Cambios de Precios</span>
              </button>
            </div>
          </div>
        </div>
      `;

      // Gestión de Paradas para la Sucursal Móvil
      if (isMobile) {
        branch.schedule = Array.isArray(branch.schedule) ? branch.schedule : [];
        const stopsListContainer = mainContent.querySelector('#mob-stops-list');

        const renderStopsList = () => {
          if (!stopsListContainer) return;
          if (branch.schedule.length === 0) {
            stopsListContainer.innerHTML = `
              <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 10px; font-size: 0.85rem;">
                No hay paradas configuradas actualmente en el itinerario barrial.
              </div>
            `;
            return;
          }

          stopsListContainer.innerHTML = branch.schedule.map((stop, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-radius: 10px; background: var(--bg-main); border: 1px solid var(--border); flex-wrap: wrap; gap: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.2rem;">📍</span>
                <div>
                  <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">
                    ${escapeHtml(stop.location || 'Ubicación sin especificar')}
                    ${stop.reference ? `<span style="font-size: 0.78rem; font-weight: 400; color: var(--text-muted);">(${escapeHtml(stop.reference)})</span>` : ''}
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 0.75rem; align-items: center;">
                    <span>📅 <strong>${escapeHtml(stop.dateDisplay || stop.date || 'Sin fecha')}</strong></span>
                    <span>🕒 ${escapeHtml(stop.time || '09:00 a 14:00 hs')}</span>
                  </div>
                </div>
              </div>
              <button type="button" class="btn-delete-stop" data-index="${index}" style="background: none; border: 1px solid rgba(220, 53, 69, 0.4); color: #dc3545; padding: 0.35rem 0.65rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">
                🗑️ Eliminar
              </button>
            </div>
          `).join('');

          // Vincular botones de eliminación
          stopsListContainer.querySelectorAll('.btn-delete-stop').forEach(btn => {
            btn.onclick = () => {
              const idx = Number(btn.dataset.index);
              branch.schedule.splice(idx, 1);
              renderStopsList();
            };
          });
        };

        renderStopsList();

        // Botón agregar parada
        const btnAddStop = mainContent.querySelector('#mob-btn-add-stop');
        if (btnAddStop) {
          btnAddStop.onclick = () => {
            const dateVal = mainContent.querySelector('#mob-new-date')?.value || '';
            const displayVal = mainContent.querySelector('#mob-new-date-display')?.value || '';
            const timeVal = mainContent.querySelector('#mob-new-time')?.value || '09:00 a 14:00 hs';
            const locVal = mainContent.querySelector('#mob-new-loc')?.value || '';
            const refVal = mainContent.querySelector('#mob-new-ref')?.value || '';

            if (!locVal.trim()) {
              ToastService.error('Ingresa al menos la dirección o plaza de la parada.');
              return;
            }

            branch.schedule.push({
              id: 'stop_' + Date.now(),
              date: dateVal,
              dateDisplay: displayVal || dateVal,
              time: timeVal,
              location: locVal.trim(),
              reference: refVal.trim(),
              status: 'CONFIRMADO'
            });

            // Limpiar inputs
            mainContent.querySelector('#mob-new-loc').value = '';
            mainContent.querySelector('#mob-new-ref').value = '';
            mainContent.querySelector('#mob-new-date-display').value = '';

            renderStopsList();
            ToastService.success('Parada agregada al itinerario.');
          };
        }

        // Botón guardar itinerario móvil completo
        const btnSaveItinerary = mainContent.querySelector('#btn-save-mobile-itinerary');
        if (btnSaveItinerary) {
          btnSaveItinerary.onclick = async () => {
            btnSaveItinerary.disabled = true;
            btnSaveItinerary.textContent = 'Guardando itinerario...';

            try {
              branch.name = mainContent.querySelector('#mob-input-name')?.value?.trim() || branch.name;
              branch.phone = mainContent.querySelector('#mob-input-phone')?.value?.trim() || branch.phone;

              if (onSaveMobileBranch) {
                await onSaveMobileBranch(branch);
                ToastService.success('Itinerario y datos del camión móvil guardados correctamente.');
                renderHeaderContent();
              }
            } catch (err) {
              ToastService.error('Error al guardar itinerario: ' + (err?.message || err));
            } finally {
              btnSaveItinerary.disabled = false;
              btnSaveItinerary.innerHTML = '<span>💾 Guardar Itinerario Móvil</span>';
            }
          };
        }
      }

      // Toggle de visibilidad en portada web
      const checkPublished = mainContent.querySelector('#check-branch-published');
      if (checkPublished) {
        checkPublished.onchange = async () => {
          const newStatus = checkPublished.checked;
          branch.isPublished = newStatus;
          try {
            if (isMobile && onSaveMobileBranch) {
              await onSaveMobileBranch(branch);
            } else if (onSaveVisibility) {
              await onSaveVisibility(branch.id, newStatus);
            }
            ToastService.success(newStatus ? `Sucursal ${branch.name} ahora es VISIBLE en portada.` : `Sucursal ${branch.name} ahora está OCULTA en portada.`);
            renderHeaderContent();
          } catch (err) {
            ToastService.error('Error al actualizar visibilidad: ' + (err?.message || err));
            checkPublished.checked = !newStatus;
          }
        };
      }

      // Renderizar filas de la tabla de precios
      const tbody = mainContent.querySelector('#pricing-table-body');
      const searchInput = mainContent.querySelector('#input-search-cuts');

      const renderTableRows = () => {
        const items = branch.items || [];
        const filter = (currentFilterText || '').toLowerCase();
        const filtered = items.filter(i => {
          if (!filter) return true;
          return i.name.toLowerCase().includes(filter) || (i.plu && i.plu.includes(filter));
        });

        if (filtered.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="3" style="padding: 2rem; text-align: center; color: var(--text-muted);">
                ${items.length === 0 ? 'No hay cortes cargados en esta lista de precios.' : `No se encontraron cortes que coincidan con "${filter}".`}
              </td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = filtered.map(item => `
          <tr style="border-bottom: 1px solid var(--border);" data-prod-id="${escapeHtml(item.productId)}">
            <td style="padding: 0.65rem 0.75rem; font-weight: 600; color: var(--text-main);">
              ${escapeHtml(item.name)}
              ${item.plu ? `<span style="font-size: 0.7rem; color: var(--text-muted); margin-left: 0.4rem; font-family: monospace;">#${escapeHtml(item.plu)}</span>` : ''}
            </td>
            <td style="padding: 0.65rem 0.75rem; text-align: right;">
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.25rem;">
                <span style="color: var(--text-muted); font-size: 0.8rem;">$</span>
                <input type="number" class="form-input item-price-input" value="${Number(item.price || 0)}" step="10" min="0" style="width: 105px; padding: 0.35rem 0.5rem; text-align: right; border-radius: 6px; font-weight: 700;">
              </div>
            </td>
            <td style="padding: 0.65rem 0.75rem; text-align: center;">
              <input type="checkbox" class="item-visible-checkbox" ${item.visible !== false ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
            </td>
          </tr>
        `).join('');

        // Sincronizar cambios en memoria inmediatamente para no perder ediciones al filtrar
        tbody.querySelectorAll('tr[data-prod-id]').forEach(tr => {
          const pId = tr.dataset.prodId;
          const itemObj = (branch.items || []).find(i => String(i.productId) === String(pId));
          if (!itemObj) return;

          const priceInput = tr.querySelector('.item-price-input');
          const visibleCheckbox = tr.querySelector('.item-visible-checkbox');

          if (priceInput) {
            priceInput.oninput = () => {
              itemObj.price = Number(priceInput.value || 0);
            };
          }
          if (visibleCheckbox) {
            visibleCheckbox.onchange = () => {
              itemObj.visible = Boolean(visibleCheckbox.checked);
            };
          }
        });
      };

      renderTableRows();

      if (searchInput) {
        searchInput.oninput = (e) => {
          currentFilterText = e.target.value.trim();
          renderTableRows();
        };
      }

      // Eventos de cartelería y descarga
      const btnPrintA4 = mainContent.querySelector('#btn-print-a4');
      if (btnPrintA4) {
        btnPrintA4.onclick = () => {
          BranchPricePdfService.printCounterQrPosterA4({ branch, qrUrl });
        };
      }

      const btnPrintThermal = mainContent.querySelector('#btn-print-thermal');
      if (btnPrintThermal) {
        btnPrintThermal.onclick = () => {
          BranchPricePdfService.printCounterQrThermal80({ branch, qrUrl });
        };
      }

      const btnDownloadPdf = mainContent.querySelector('#btn-download-pdf-admin');
      if (btnDownloadPdf) {
        btnDownloadPdf.onclick = () => {
          BranchPricePdfService.downloadPriceListPdf({ branch, items: branch.items || [] });
        };
      }

      // Guardar cambios de precios (evaluando la totalidad de branch.items y no solo el filtro)
      const btnSavePrices = mainContent.querySelector('#btn-save-branch-pricing');
      if (btnSavePrices) {
        btnSavePrices.onclick = async () => {
          btnSavePrices.disabled = true;
          btnSavePrices.textContent = 'Guardando...';

          try {
            const newPricesMap = {};
            const hiddenIds = [];

            (branch.items || []).forEach(itemObj => {
              const pId = String(itemObj.productId);
              const priceVal = Number(itemObj.price || 0);
              newPricesMap[pId] = priceVal;
              if (itemObj.visible === false) {
                hiddenIds.push(pId);
              }
            });

            if (isMobile && onSaveMobileBranch) {
              await onSaveMobileBranch(branch);
              ToastService.success(`Precios del camión móvil guardados con éxito.`);
            } else if (onSavePrices) {
              await onSavePrices(branch.priceListId, newPricesMap, hiddenIds);
              ToastService.success(`Precios de ${branch.name} actualizados con éxito.`);
            }
          } catch (err) {
            ToastService.error('Error al guardar precios: ' + (err?.message || err));
          } finally {
            btnSavePrices.disabled = false;
            btnSavePrices.innerHTML = '<span>💾 Guardar Cambios de Precios</span>';
          }
        };
      }
    };

    renderActiveBranch();
  }
}
