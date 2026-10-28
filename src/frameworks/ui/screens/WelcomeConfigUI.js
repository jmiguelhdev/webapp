/**
 * @file WelcomeConfigUI.js
 * @description Pantalla administrativa para configurar las tarjetas principales (pilares institucionales/destacados)
 * de la portada pública, agregar nuevas tarjetas personalizadas con fotos y descripciones, y gestionar
 * las fotos de TODAS las sucursales físicas y la carnicería móvil.
 * @module ui/screens/WelcomeConfigUI
 */
import { ToastService } from '../components/ToastService.js';
import { DEFAULT_PILLARS } from '../../../adapters/api/CompanyConfigApi.js';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Comprime una imagen en el navegador usando un Canvas antes de guardarla.
 * Optimiza la resolución y peso a formato WebP/JPEG ligero.
 * @param {File} file 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @param {number} quality 
 * @returns {Promise<string>} Data URL
 */
function compressImageFile(file, maxWidth = 1000, maxHeight = 700, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo desde el dispositivo.'));
    reader.readAsDataURL(file);
  });
}

export class WelcomeConfigUI {
  /**
   * Renderiza la pantalla de configuración de tarjetas y fotos de la portada.
   * @param {HTMLElement} container
   * @param {Object} options
   * @param {Object} options.companyConfig - Configuración institucional (system_config/company_info)
   * @param {Array<Object>} [options.branches] - Listado completo unificado de todas las sucursales (físicas y móvil)
   * @param {Object} [options.mobileBranch] - Configuración de la carnicería móvil (fallback)
   * @param {function(Object): Promise<void>} options.onSaveCompanyConfig
   * @param {function(string, string): Promise<void>} [options.onSaveBranchPhoto]
   * @param {function(Object): Promise<void>} [options.onSaveMobileBranch]
   * @param {function(): void} [options.onNavigateWelcome]
   */
  static render(container, { companyConfig, branches = [], mobileBranch, onSaveCompanyConfig, onSaveBranchPhoto, onSaveMobileBranch, onNavigateWelcome }) {
    if (!container) return;

    // Clonación defensiva del estado de pilares y empresa
    const config = {
      ...companyConfig,
      pillars: Array.isArray(companyConfig?.pillars) && companyConfig.pillars.length > 0
        ? companyConfig.pillars.map(p => ({ ...p }))
        : DEFAULT_PILLARS.map(p => ({ ...p }))
    };

    // Unificación de todas las sucursales reales
    let branchList = [];
    if (Array.isArray(branches) && branches.length > 0) {
      branchList = branches.map(b => ({
        id: b.id,
        name: b.name || 'Sucursal',
        address: b.address || '',
        phone: b.phone || '',
        hours: b.hours || '',
        isMobile: Boolean(b.isMobile || b.id === 'pampa_movil'),
        imageUrl: b.imageUrl || '',
        schedule: b.schedule || []
      }));
    } else {
      // Fallback a companyConfig.branches y mobileBranch
      branchList = [
        ...(Array.isArray(companyConfig?.branches) ? companyConfig.branches.map(b => ({ ...b, isMobile: false })) : []),
        ...(mobileBranch ? [{ ...mobileBranch, isMobile: true }] : [])
      ];
    }

    // Asegurar que la carnicería móvil esté presente en la lista si se pasó mobileBranch
    if (mobileBranch && !branchList.some(b => b.id === 'pampa_movil' || b.isMobile)) {
      branchList.unshift({
        id: 'pampa_movil',
        name: mobileBranch.name || 'Frigorífico Pampa en tu Barrio',
        address: mobileBranch.address || 'Itinerario rotativo',
        phone: mobileBranch.phone || '',
        hours: mobileBranch.hours || '',
        isMobile: true,
        imageUrl: mobileBranch.imageUrl || '',
        schedule: mobileBranch.schedule || []
      });
    }

    let activeTab = 'pillars'; // 'pillars' | 'branches'

    function renderScreen() {
      const mobileItem = branchList.find(b => b.isMobile || b.id === 'pampa_movil');
      const physicalItems = branchList.filter(b => !b.isMobile && b.id !== 'pampa_movil');

      container.innerHTML = `
        <div class="welcome-config-wrapper fade-in" style="max-width: 1200px; margin: 0 auto; padding: 1.5rem 1rem 5rem 1rem;">
          
          <!-- Encabezado de la Sección -->
          <div class="welcome-config-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.75rem; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <span style="font-size: 1.8rem;">🎨</span>
                <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-main); margin: 0;">Diseño de Portada & Tarjetas</h1>
              </div>
              <p style="font-size: 0.92rem; color: var(--text-muted); margin: 0.4rem 0 0 0;">
                Personalice las tarjetas destacadas (pilares de la empresa) y asigne fotos a cada sucursal visibles en la pantalla de bienvenida pública.
              </p>
            </div>
            <div style="display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap;">
              <button type="button" id="btn-open-tab-welcome" class="btn-action-outline" style="padding: 0.65rem 1rem; border-radius: 10px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: var(--transition);" title="Abrir la portada pública en una pestaña nueva">
                <span>↗️ Nueva Pestaña</span>
              </button>
              ${onNavigateWelcome ? `
                <button type="button" id="btn-preview-welcome" class="btn-action-outline" style="padding: 0.65rem 1.1rem; border-radius: 10px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text-main); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: var(--transition);" title="Ver la portada pública dentro de la plataforma">
                  <span>👁️ Ver Portada Pública</span>
                </button>
              ` : ''}
              <button type="button" id="btn-save-all-top" class="btn-action-primary" style="padding: 0.65rem 1.3rem; border-radius: 10px; border: none; background: var(--primary); color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(143, 0, 20, 0.25); transition: var(--transition);">
                <span>💾 Guardar Cambios</span>
              </button>
            </div>
          </div>

          <!-- Pestañas de Navegación -->
          <div class="config-tabs-bar" style="display: flex; gap: 0.5rem; margin-bottom: 1.75rem; border-bottom: 2px solid var(--border);">
            <button type="button" class="tab-btn ${activeTab === 'pillars' ? 'active-tab' : ''}" data-tab="pillars" style="padding: 0.85rem 1.4rem; font-size: 0.95rem; font-weight: 700; background: none; border: none; border-bottom: 3px solid ${activeTab === 'pillars' ? 'var(--primary)' : 'transparent'}; color: ${activeTab === 'pillars' ? 'var(--primary)' : 'var(--text-muted)'}; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: var(--transition); margin-bottom: -2px;">
              <span>🥩 Tarjetas Principales & Pilares</span>
              <span style="font-size: 0.75rem; background: ${activeTab === 'pillars' ? 'var(--primary)' : 'var(--border)'}; color: ${activeTab === 'pillars' ? '#fff' : 'var(--text-main)'}; padding: 0.15rem 0.55rem; border-radius: 100px;">${config.pillars.length}</span>
            </button>
            <button type="button" class="tab-btn ${activeTab === 'branches' ? 'active-tab' : ''}" data-tab="branches" style="padding: 0.85rem 1.4rem; font-size: 0.95rem; font-weight: 700; background: none; border: none; border-bottom: 3px solid ${activeTab === 'branches' ? 'var(--primary)' : 'transparent'}; color: ${activeTab === 'branches' ? 'var(--primary)' : 'var(--text-muted)'}; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: var(--transition); margin-bottom: -2px;">
              <span>🏢 Fotos de Sucursales & Camión Móvil</span>
              <span style="font-size: 0.75rem; background: ${activeTab === 'branches' ? 'var(--primary)' : 'var(--border)'}; color: ${activeTab === 'branches' ? '#fff' : 'var(--text-main)'}; padding: 0.15rem 0.55rem; border-radius: 100px;">${branchList.length}</span>
            </button>
          </div>

          <!-- Contenido de la Pestaña Activa -->
          <div id="tab-content-area">
            ${activeTab === 'pillars' ? renderPillarsTab() : renderBranchesTab(mobileItem, physicalItems)}
          </div>

          <!-- Barra Inferior Fija para Guardado Rápido -->
          <div class="config-floating-bar glass-card" style="position: sticky; bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; padding: 0.9rem 1.5rem; border-radius: 14px; border: 1px solid var(--border); background: rgba(30, 30, 30, 0.85); backdrop-filter: blur(12px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); margin-top: 2rem; z-index: 10;">
            <div style="font-size: 0.88rem; color: #fff;">
              💡 <em>Las fotos y tarjetas configuradas se exhiben automáticamente en la pantalla de bienvenida pública.</em>
            </div>
            <button type="button" id="btn-save-all-bottom" class="btn-action-primary" style="padding: 0.7rem 1.5rem; border-radius: 10px; border: none; background: var(--primary); color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(143, 0, 20, 0.35); transition: var(--transition);">
              <span>💾 Guardar Todos los Cambios</span>
            </button>
          </div>

        </div>
      `;

      bindEvents();
    }

    function renderPillarsTab() {
      return `
        <div class="pillars-config-section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main);">
                Tarjetas Destacadas de la Portada
              </h3>
              <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-muted);">
                Estas tarjetas se exhiben justo debajo del encabezado institucional en la portada pública. Puede agregar tantas tarjetas como desee con textos, iconos y fotos.
              </p>
            </div>
            <button type="button" id="btn-add-pillar" style="padding: 0.6rem 1.1rem; border-radius: 10px; background: rgba(143, 0, 20, 0.1); border: 1px solid rgba(143, 0, 20, 0.3); color: var(--primary); font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: var(--transition);">
              <span>➕ Agregar Tarjeta Destacada</span>
            </button>
          </div>

          <div class="pillars-editor-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem;">
            ${config.pillars.map((pillar, idx) => `
              <div class="pillar-editor-card glass-card" data-pillar-idx="${idx}" style="border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; background: var(--card-bg); display: flex; flex-direction: column; gap: 1rem; position: relative;">
                
                <!-- Encabezado de la Tarjeta -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.65rem;">
                  <span style="font-size: 0.8rem; font-weight: 800; color: var(--primary); letter-spacing: 0.5px;">
                    TARJETA #${idx + 1}
                  </span>
                  <button type="button" class="btn-remove-pillar" data-pillar-idx="${idx}" title="Eliminar tarjeta" style="background: none; border: none; color: #dc3545; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;">
                    <span>🗑️ Eliminar</span>
                  </button>
                </div>

                <!-- Foto / Vista Previa -->
                <div class="pillar-image-uploader" style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">Foto / Imagen de Cabecera</label>
                  
                  ${pillar.imageUrl ? `
                    <div style="position: relative; width: 100%; height: 160px; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); background: #111;">
                      <img src="${escapeHtml(pillar.imageUrl)}" alt="${escapeHtml(pillar.title || 'Foto')}" style="width: 100%; height: 100%; object-fit: cover;" />
                      <button type="button" class="btn-clear-pillar-img" data-pillar-idx="${idx}" title="Quitar foto" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.4); color: #fff; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
                        ❌ Quitar Foto
                      </button>
                    </div>
                  ` : `
                    <div style="width: 100%; height: 90px; border-radius: 10px; border: 2px dashed var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.82rem; gap: 0.25rem; background: rgba(255,255,255,0.02);">
                      <span>🖼️ Sin foto asignada (se exhibirá el icono)</span>
                    </div>
                  `}

                  <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem;">
                    <label class="btn-upload-label" style="flex: 1; text-align: center; padding: 0.5rem 0.75rem; border-radius: 8px; background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                      📁 Subir Foto (Archivo)
                      <input type="file" accept="image/*" class="input-pillar-file" data-pillar-idx="${idx}" style="display: none;" />
                    </label>
                    <input type="url" class="input-pillar-url" data-pillar-idx="${idx}" placeholder="O pegar enlace web (https://...)" value="${escapeHtml(pillar.imageUrl || '')}" style="flex: 1.5; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.8rem;" />
                  </div>
                </div>

                <!-- Campos de Texto -->
                <div style="display: grid; grid-template-columns: 70px 1fr; gap: 0.65rem;">
                  <div>
                    <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Icono</label>
                    <input type="text" class="input-pillar-icon" data-pillar-idx="${idx}" value="${escapeHtml(pillar.icon || '🥩')}" maxlength="4" style="width: 100%; text-align: center; font-size: 1.3rem; padding: 0.45rem 0.25rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main);" />
                  </div>
                  <div>
                    <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Título Destacado</label>
                    <input type="text" class="input-pillar-title" data-pillar-idx="${idx}" value="${escapeHtml(pillar.title || '')}" placeholder="Ej: Faena & Desposte Certificado" style="width: 100%; padding: 0.55rem 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.88rem; font-weight: 600;" />
                  </div>
                </div>

                <div>
                  <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Descripción</label>
                  <textarea class="input-pillar-desc" data-pillar-idx="${idx}" rows="3" placeholder="Detalle o descripción de los procesos..." style="width: 100%; padding: 0.55rem 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.84rem; resize: vertical;">${escapeHtml(pillar.description || '')}</textarea>
                </div>

              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    function renderBranchesTab(mobileItem, physicalItems) {
      return `
        <div class="branches-config-section">
          <div style="margin-bottom: 1.25rem;">
            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-main);">
              Fotos de Sucursales y Puntos de Atención (${branchList.length} sucursales disponibles)
            </h3>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-muted);">
              Asigne fotos ilustrativas o de fachada para cada punto de venta real del frigorífico. Se mostrarán en la tarjeta correspondiente de la portada pública.
            </p>
          </div>

          <div class="branches-photos-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem;">
            
            <!-- Sucursal Móvil Prioritaria -->
            ${mobileItem ? `
              <div class="branch-photo-card glass-card" data-branch-id="${escapeHtml(mobileItem.id)}" style="border: 2px solid rgba(143, 0, 20, 0.4); border-radius: 16px; padding: 1.25rem; background: linear-gradient(180deg, rgba(143,0,20,0.05) 0%, var(--card-bg) 100%); display: flex; flex-direction: column; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.65rem;">
                  <span style="font-size: 0.78rem; font-weight: 800; color: var(--primary); letter-spacing: 0.5px;">
                    🚚 CARNICERÍA MÓVIL ITINERANTE
                  </span>
                  <span style="font-size: 0.75rem; background: rgba(143,0,20,0.12); color: var(--primary); font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 6px;">
                    Prioridad #1 en Portada
                  </span>
                </div>

                <div>
                  <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-main);">${escapeHtml(mobileItem.name || 'Frigorífico Pampa en tu Barrio')}</h4>
                  <p style="margin: 0.25rem 0 0 0; font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(mobileItem.address || 'Itinerario rotativo por barrios')}</p>
                </div>

                <!-- Foto Móvil -->
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">Foto del Camión / Vehículo Móvil</label>
                  
                  ${mobileItem.imageUrl ? `
                    <div style="position: relative; width: 100%; height: 170px; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); background: #111;">
                      <img src="${escapeHtml(mobileItem.imageUrl)}" alt="Carnicería Móvil" style="width: 100%; height: 100%; object-fit: cover;" />
                      <button type="button" class="btn-clear-branch-img" data-branch-id="${escapeHtml(mobileItem.id)}" title="Quitar foto" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.4); color: #fff; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
                        ❌ Quitar Foto
                      </button>
                    </div>
                  ` : `
                    <div style="width: 100%; height: 90px; border-radius: 10px; border: 2px dashed var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.82rem; gap: 0.25rem; background: rgba(255,255,255,0.02);">
                      <span>🚚 Sin foto asignada (se mostrará diseño por defecto)</span>
                    </div>
                  `}

                  <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem;">
                    <label class="btn-upload-label" style="flex: 1; text-align: center; padding: 0.5rem 0.75rem; border-radius: 8px; background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                      📁 Subir Foto (Archivo)
                      <input type="file" accept="image/*" class="input-branch-file" data-branch-id="${escapeHtml(mobileItem.id)}" style="display: none;" />
                    </label>
                    <input type="url" class="input-branch-url" data-branch-id="${escapeHtml(mobileItem.id)}" placeholder="O pegar enlace web (https://...)" value="${escapeHtml(mobileItem.imageUrl || '')}" style="flex: 1.5; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.8rem;" />
                  </div>
                </div>

              </div>
            ` : ''}

            <!-- Todas las Sucursales Físicas -->
            ${physicalItems.map((b, idx) => `
              <div class="branch-photo-card glass-card" data-branch-id="${escapeHtml(b.id)}" style="border: 1px solid var(--border); border-radius: 16px; padding: 1.25rem; background: var(--card-bg); display: flex; flex-direction: column; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.65rem;">
                  <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.5px;">
                    🏢 SUCURSAL / PLANTA #${idx + 1}
                  </span>
                  <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">${escapeHtml(b.id)}</span>
                </div>

                <div>
                  <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-main);">${escapeHtml(b.name || 'Sucursal')}</h4>
                  <p style="margin: 0.25rem 0 0 0; font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(b.address || 'Sin dirección registrada')}</p>
                  ${b.hours ? `<p style="margin: 0.2rem 0 0 0; font-size: 0.78rem; color: var(--text-muted);">🕒 ${escapeHtml(b.hours)}</p>` : ''}
                </div>

                <!-- Foto Sucursal Física -->
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">Foto de Fachada o Instalaciones</label>
                  
                  ${b.imageUrl ? `
                    <div style="position: relative; width: 100%; height: 170px; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); background: #111;">
                      <img src="${escapeHtml(b.imageUrl)}" alt="${escapeHtml(b.name)}" style="width: 100%; height: 100%; object-fit: cover;" />
                      <button type="button" class="btn-clear-branch-img" data-branch-id="${escapeHtml(b.id)}" title="Quitar foto" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.4); color: #fff; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
                        ❌ Quitar Foto
                      </button>
                    </div>
                  ` : `
                    <div style="width: 100%; height: 90px; border-radius: 10px; border: 2px dashed var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.82rem; gap: 0.25rem; background: rgba(255,255,255,0.02);">
                      <span>🏢 Sin foto asignada (se mostrará diseño por defecto)</span>
                    </div>
                  `}

                  <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem;">
                    <label class="btn-upload-label" style="flex: 1; text-align: center; padding: 0.5rem 0.75rem; border-radius: 8px; background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                      📁 Subir Foto (Archivo)
                      <input type="file" accept="image/*" class="input-branch-file" data-branch-id="${escapeHtml(b.id)}" style="display: none;" />
                    </label>
                    <input type="url" class="input-branch-url" data-branch-id="${escapeHtml(b.id)}" placeholder="O pegar enlace web (https://...)" value="${escapeHtml(b.imageUrl || '')}" style="flex: 1.5; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-size: 0.8rem;" />
                  </div>
                </div>

              </div>
            `).join('')}

          </div>
        </div>
      `;
    }

    function syncStateFromInputs() {
      // Sincronizar inputs de pilares
      container.querySelectorAll('.pillar-editor-card').forEach(card => {
        const idx = Number(card.getAttribute('data-pillar-idx'));
        if (!config.pillars[idx]) return;

        const titleEl = card.querySelector('.input-pillar-title');
        const descEl = card.querySelector('.input-pillar-desc');
        const iconEl = card.querySelector('.input-pillar-icon');
        const urlEl = card.querySelector('.input-pillar-url');

        if (titleEl) config.pillars[idx].title = titleEl.value.trim();
        if (descEl) config.pillars[idx].description = descEl.value.trim();
        if (iconEl) config.pillars[idx].icon = iconEl.value.trim();
        if (urlEl && urlEl.value.trim() !== '') {
          config.pillars[idx].imageUrl = urlEl.value.trim();
        }
      });

      // Sincronizar inputs de sucursales (por ID)
      container.querySelectorAll('.branch-photo-card[data-branch-id]').forEach(card => {
        const branchId = card.getAttribute('data-branch-id');
        const branch = branchList.find(b => b.id === branchId);
        if (!branch) return;
        const urlEl = card.querySelector('.input-branch-url');
        if (urlEl) {
          branch.imageUrl = urlEl.value.trim();
        }
      });
    }

    async function handleSave() {
      syncStateFromInputs();

      const btnTop = container.querySelector('#btn-save-all-top');
      const btnBottom = container.querySelector('#btn-save-all-bottom');
      if (btnTop) { btnTop.disabled = true; btnTop.innerHTML = '<span>⏳ Guardando...</span>'; }
      if (btnBottom) { btnBottom.disabled = true; btnBottom.innerHTML = '<span>⏳ Guardando...</span>'; }

      try {
        if (onSaveCompanyConfig) {
          await onSaveCompanyConfig(config);
        }

        // Guardar fotos de cada sucursal física y móvil
        if (onSaveBranchPhoto) {
          const photoPromises = branchList.map(b => onSaveBranchPhoto(b.id, b.imageUrl || ''));
          await Promise.all(photoPromises);
        } else if (onSaveMobileBranch) {
          const mob = branchList.find(b => b.isMobile || b.id === 'pampa_movil');
          if (mob) await onSaveMobileBranch(mob);
        }

        ToastService.success('¡Configuración de tarjetas y fotos guardada con éxito!');
        renderScreen();
      } catch (err) {
        console.error('Error al guardar configuración de portada:', err);
        ToastService.error('Error al guardar: ' + (err?.message || err));
      } finally {
        if (btnTop) { btnTop.disabled = false; btnTop.innerHTML = '<span>💾 Guardar Cambios</span>'; }
        if (btnBottom) { btnBottom.disabled = false; btnBottom.innerHTML = '<span>💾 Guardar Todos los Cambios</span>'; }
      }
    }

    function bindEvents() {
      // Cambio de pestañas
      container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
          syncStateFromInputs();
          activeTab = btn.getAttribute('data-tab');
          renderScreen();
        };
      });

      // Abrir en nueva pestaña
      const btnOpenTab = container.querySelector('#btn-open-tab-welcome');
      if (btnOpenTab) {
        btnOpenTab.onclick = () => {
          window.open(window.location.origin, '_blank');
        };
      }

      // Ver Portada Pública dentro de la plataforma
      const btnPreview = container.querySelector('#btn-preview-welcome');
      if (btnPreview && onNavigateWelcome) {
        btnPreview.onclick = () => {
          syncStateFromInputs();
          onNavigateWelcome(config, branchList);
        };
      }

      // Guardar cambios
      const btnTop = container.querySelector('#btn-save-all-top');
      if (btnTop) btnTop.onclick = handleSave;

      const btnBottom = container.querySelector('#btn-save-all-bottom');
      if (btnBottom) btnBottom.onclick = handleSave;

      // Agregar pilar
      const btnAddPillar = container.querySelector('#btn-add-pillar');
      if (btnAddPillar) {
        btnAddPillar.onclick = () => {
          syncStateFromInputs();
          config.pillars.push({
            id: 'pillar_' + Date.now(),
            title: 'Nuevo Destacado',
            description: 'Descripción breve de la nueva característica, servicio o pilar.',
            icon: '⭐',
            imageUrl: ''
          });
          renderScreen();
          ToastService.success('Nueva tarjeta destacada agregada.');
        };
      }

      // Eliminar pilar
      container.querySelectorAll('.btn-remove-pillar').forEach(btn => {
        btn.onclick = () => {
          const idx = Number(btn.getAttribute('data-pillar-idx'));
          if (config.pillars.length <= 1) {
            ToastService.error('Debe mantenerse al menos una tarjeta destacada.');
            return;
          }
          syncStateFromInputs();
          config.pillars.splice(idx, 1);
          renderScreen();
          ToastService.success('Tarjeta eliminada.');
        };
      });

      // Quitar imagen de pilar
      container.querySelectorAll('.btn-clear-pillar-img').forEach(btn => {
        btn.onclick = () => {
          const idx = Number(btn.getAttribute('data-pillar-idx'));
          if (config.pillars[idx]) {
            config.pillars[idx].imageUrl = '';
            renderScreen();
          }
        };
      });

      // Subir archivo para pilar (con compresión canvas)
      container.querySelectorAll('.input-pillar-file').forEach(input => {
        input.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const idx = Number(input.getAttribute('data-pillar-idx'));
          try {
            syncStateFromInputs();
            ToastService.info('Procesando y optimizando imagen...');
            const compressed = await compressImageFile(file, 900, 600, 0.82);
            config.pillars[idx].imageUrl = compressed;
            renderScreen();
            ToastService.success('Imagen cargada correctamente.');
          } catch (err) {
            ToastService.error(err.message || 'Error al procesar la imagen.');
          }
        };
      });

      // Input URL pilar (change)
      container.querySelectorAll('.input-pillar-url').forEach(input => {
        input.onblur = () => {
          const idx = Number(input.getAttribute('data-pillar-idx'));
          if (config.pillars[idx] && input.value.trim() !== config.pillars[idx].imageUrl) {
            config.pillars[idx].imageUrl = input.value.trim();
            renderScreen();
          }
        };
      });

      // Quitar imagen de sucursal (por ID)
      container.querySelectorAll('.btn-clear-branch-img').forEach(btn => {
        btn.onclick = () => {
          const branchId = btn.getAttribute('data-branch-id');
          const branch = branchList.find(b => b.id === branchId);
          if (branch) {
            branch.imageUrl = '';
            renderScreen();
          }
        };
      });

      // Subir archivo para sucursal (por ID con compresión)
      container.querySelectorAll('.input-branch-file').forEach(input => {
        input.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const branchId = input.getAttribute('data-branch-id');
          const branch = branchList.find(b => b.id === branchId);
          if (!branch) return;
          try {
            syncStateFromInputs();
            ToastService.info(`Optimizando foto para ${branch.name}...`);
            const compressed = await compressImageFile(file, 900, 600, 0.82);
            branch.imageUrl = compressed;
            renderScreen();
            ToastService.success(`Foto de ${branch.name} cargada con éxito.`);
          } catch (err) {
            ToastService.error(err.message || 'Error al procesar la imagen.');
          }
        };
      });

      // Input URL sucursal (por ID)
      container.querySelectorAll('.input-branch-url').forEach(input => {
        input.onblur = () => {
          const branchId = input.getAttribute('data-branch-id');
          const branch = branchList.find(b => b.id === branchId);
          if (branch && input.value.trim() !== (branch.imageUrl || '')) {
            branch.imageUrl = input.value.trim();
            renderScreen();
          }
        };
      });
    }

    renderScreen();
  }
}
