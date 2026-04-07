import { el } from '../../utils/dom.js';
import { SettingsService } from '../../services/SettingsService.js';

export function renderSettings(container, options) {
  if (!container) return;
  
  const current = SettingsService.loadSettings();
  container.innerHTML = '';
  
  const wrapper = el('div', { classes: ['settings-wrapper', 'fade-in'], style: 'width: 100%; max-width: 100%; padding: 0 1rem;' });

  const header = el('div', { classes: ['dashboard-header', 'glass-card'], style: 'margin-bottom: 2rem; width: 100%; display: flex; align-items: center; gap: 0.5rem;' });
  header.innerHTML = `
    <button id="back-btn" class="back-btn-m3" title="Volver">
      <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
    </button>
    <div>
      <h2 style="margin:0;">⚙️ Configuración del Sistema</h2>
      <p style="margin:0; color: var(--text-muted); font-size: 0.9rem;">Ajusta los parámetros operativos y económicos.</p>
    </div>
  `;
  wrapper.appendChild(header);
  header.querySelector('#back-btn').onclick = options.onBack;

  // Message box for feedback
  const msgBox = el('div', { attrs: { id: 'settings-msg' }, classes: ['alert'], style: 'display: none; margin-bottom: 1.5rem; position: sticky; top: 1rem; z-index: 100; box-shadow: var(--shadow-lg);' });
  wrapper.appendChild(msgBox);

  const showMsg = (text, isError = false) => {
    msgBox.textContent = text;
    msgBox.style.color = isError ? 'var(--danger)' : 'var(--success)';
    msgBox.style.display = 'block';
    setTimeout(() => { msgBox.style.display = 'none'; }, 3000);
  };

  const form = el('div', { 
    classes: ['settings-grid'], 
    style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;' 
  });

  form.innerHTML = `
    <!-- Card 1: Margen de Ganancia -->
    <div class="glass-card card" style="display: flex; flex-direction: column;">
      <h3 style="margin-bottom: 1.25rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">💰 Margen Económico</h3>
      <div class="form-group" style="flex: 1;">
        <label>Margen de Ganancia Objetiva (%)</label>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Porcentaje adicional sobre el costo para calcular el precio sugerido de venta.</p>
        <input type="number" id="set-margen" value="${((current.margenGanancia - 1) * 100).toFixed(0)}" step="1" style="margin-top: 0.75rem;">
      </div>
    </div>

    <!-- Card 2: Flete Jaula Doble -->
    <div class="glass-card card" style="display: flex; flex-direction: column;">
      <h3 style="margin-bottom: 1.25rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">🚛 Flete Jaula Doble</h3>
      <div class="form-group"><label>Peso Promedio (kg/animal)</label><input type="number" id="set-jdd-kg" value="${current.pesoJaulaDoble}" step="10"></div>
      <div class="form-group" style="margin-bottom: 0;"><label>Precio por Km ($/km)</label><input type="number" id="set-jdd-km" value="${current.precioKmDouble}" step="50"></div>
    </div>

    <!-- Card 3: Flete Jaula Simple -->
    <div class="glass-card card" style="display: flex; flex-direction: column;">
      <h3 style="margin-bottom: 1.25rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">🚚 Flete Jaula Simple</h3>
      <div class="form-group"><label>Peso Promedio (kg/animal)</label><input type="number" id="set-js-kg" value="${current.pesoJaulaSimple}" step="10"></div>
      <div class="form-group" style="margin-bottom: 0;"><label>Precio por Km ($/km)</label><input type="number" id="set-js-km" value="${current.precioKmSimple}" step="50"></div>
    </div>

    <div class="glass-card card" style="grid-column: 1 / -1;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <h3 style="margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">🏷️ Precios de Referencia ($/kg)</h3>
        <button id="gen-price-share-btn" class="btn-outline" style="width: auto; padding: 0.5rem 1.5rem; font-size: 0.85rem; border-color: var(--primary); color: var(--primary);">📲 Generar Placa de Precios</button>
      </div>
      <div id="category-prices-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;"></div>
    </div>

    <!-- Card 5: Cámaras de Frio -->
    <div class="glass-card card" style="grid-column: 1 / -1;">
      <h3 style="margin-bottom: 1.25rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">❄️ Gestión de Cámaras</h3>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">Define los nombres y capacidades de tus cámaras para el control de stock.</p>
      <div id="camaras-config-container"></div>
      <button id="add-camara-btn" class="btn-outline" style="margin-top: 1rem; width: 100%; border-style: dashed; font-weight: 600;">+ Agregar Nueva Cámara</button>
    </div>

    <!-- Card 6: Gestión de Clientes -->
    <div class="glass-card card" style="grid-column: 1 / -1;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem;">
        <div style="flex: 1;">
          <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">👥 Clientes y Deudores</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem;">Administra los datos de tus clientes para el módulo de facturación.</p>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem;">
         <div id="settings-clients-form" style="border-right: 1px solid var(--border); padding-right: 2rem;">
            <h4 id="client-form-title" style="margin-bottom: 1.5rem; font-size: 1rem; color: var(--accent-main);">Añadir Nuevo Cliente</h4>
            <input type="hidden" id="client-id">
            <div class="form-group"><label>Nombre o Razón Social</label><input type="text" id="client-name" class="form-input"></div>
            <div class="form-group"><label>CUIT</label><input type="text" id="client-cuit" class="form-input"></div>
            <div class="form-group"><label>Dirección</label><input type="text" id="client-address" class="form-input"></div>
            <div class="form-group"><label>Teléfono</label><input type="text" id="client-phone" class="form-input"></div>
            <div class="form-group"><label>CBU (Opcional)</label><input type="text" id="client-cbu" class="form-input"></div>
            <div class="form-group"><label>Cuenta Contable / Alias</label><input type="text" id="client-account" class="form-input"></div>
            <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
               <button id="clear-client-btn" class="btn-outline" style="flex: 1;">Limpiar</button>
               <button id="save-client-btn" class="btn-primary" style="flex: 2; margin: 0; background: #059669;">Guardar Cliente</button>
            </div>
         </div>
         <div id="settings-clients-list-container">
            <h4 style="margin-bottom: 1.5rem; font-size: 1rem;">Clientes Registrados</h4>
            <div id="settings-clients-list" class="card-list" style="max-height: 500px; overflow-y: auto;"></div>
         </div>
      </div>
    </div>

    <!-- Card 7: RBAC (Admin Only) -->
    <div id="settings-rbac-section" style="grid-column: 1 / -1;"></div>

    <!-- Actions Row -->
    <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
      <button id="reset-settings" class="btn-outline" style="padding: 1rem 2rem; font-weight: 600;">Restaurar Predeterminados</button>
      <button id="save-settings" class="btn-primary" style="padding: 1rem 3rem; margin: 0; font-size: 1rem; background: var(--accent-main); box-shadow: 0 4px 12px rgba(132, 29, 29, 0.3);">💾 Guardar Cambios Globales</button>
    </div>
  `;

  wrapper.appendChild(form);
  container.appendChild(wrapper);

  // Sub-renderers (Using scoped selectors on wrapper)
  const renderPriceInputs = (prices = {}) => {
    const priceGrid = wrapper.querySelector('#category-prices-grid');
    if (!priceGrid) return;
    const categories = ['NOVILLO', 'VACA', 'VAQUILLONA', 'TORO', 'OTRO'];
    priceGrid.innerHTML = '';
    categories.forEach(cat => {
      const fg = el('div', { classes: ['form-group'], style: 'margin: 0;' });
      fg.innerHTML = `<label>${cat}</label><input type="number" class="cat-price-input" data-cat="${cat}" value="${prices[cat] || ''}" placeholder="Ej: 5000">`;
      priceGrid.appendChild(fg);
    });
  };

  const renderCamaraRow = (camara = { name: '', capacity: '' }) => {
    const camarasContainer = wrapper.querySelector('#camaras-config-container');
    if (!camarasContainer) return;

    const row = el('div', { style: 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;' });
    const nameVal = typeof camara === 'string' ? camara : (camara.name || '');
    const capVal = typeof camara === 'string' ? '' : (camara.capacity || '');
    
    row.innerHTML = `
      <input type="text" class="camara-name-input form-input" placeholder="Nombre (Ej: Cámara 1)" value="${nameVal}" style="flex: 2; padding: 0.6rem;">
      <input type="number" class="camara-capacity-input form-input" placeholder="Capacidad" value="${capVal}" style="flex: 1; padding: 0.6rem;" min="1">
      <button class="btn-outline remove-camara-btn" style="padding: 0.6rem; color: var(--danger); border-color: var(--danger); margin: 0;">X</button>
    `;
    
    row.querySelector('.remove-camara-btn').onclick = () => row.remove();
    camarasContainer.appendChild(row);
  };

  const renderClientsList = (clientsList = []) => {
    const listEl = wrapper.querySelector('#settings-clients-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    clientsList.forEach(c => {
      const card = el('div', { classes: ['card', 'glass-card'], style: 'padding: 1rem; display: flex; justify-content: space-between; align-items: center;' });
      card.innerHTML = `
        <div>
          <h4 style="margin: 0 0 0.3rem 0;">${c.name}</h4>
          <span style="font-size: 0.8rem; color: var(--text-muted);">CUIT: ${c.cuit || '-'} | Tel: ${c.phone || '-'}</span>
        </div>
        <button class="btn-outline edit-client-btn" data-id="${c.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Editar</button>
      `;
      listEl.appendChild(card);
    });

    listEl.querySelectorAll('.edit-client-btn').forEach(btn => {
      btn.onclick = () => {
        const c = clientsList.find(x => x.id === btn.dataset.id);
        if (c) {
          wrapper.querySelector('#client-id').value = c.id || '';
          wrapper.querySelector('#client-name').value = c.name || '';
          wrapper.querySelector('#client-cuit').value = c.cuit || '';
          wrapper.querySelector('#client-address').value = c.address || '';
          wrapper.querySelector('#client-phone').value = c.phone || '';
          wrapper.querySelector('#client-cbu').value = c.cbu || '';
          wrapper.querySelector('#client-account').value = c.account || '';
          wrapper.querySelector('#client-form-title').textContent = 'Editar Cliente: ' + c.name;
          wrapper.querySelector('#client-name').focus();
          window.scrollTo({ top: wrapper.querySelector('#client-form-title').offsetTop - 20, behavior: 'smooth' });
        }
      };
    });
  };

  // Initial Data population
  if (options && options.categoryPrices) {
    renderPriceInputs(options.categoryPrices);
  } else {
    renderPriceInputs({});
  }

  if (options && options.camarasList && options.camarasList.length > 0) {
    options.camarasList.forEach(c => renderCamaraRow(c));
  } else {
    renderCamaraRow();
  }

  if (options && options.clients) {
    renderClientsList(options.clients);
  }

  // --- RBAC SECTION ---
  if (options && options.userRole === 'ADMIN') {
    const rbacEl = wrapper.querySelector('#settings-rbac-section');
    if (rbacEl) {
      rbacEl.innerHTML = `
        <div class="glass-card card" style="margin-bottom: 2rem;">
          <h3 style="margin-bottom: 1rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">🔐 Gestión de Usuarios y Permisos</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">Administra el nivel de acceso (rol) de los usuarios que han iniciado sesión.</p>
          <div id="rbac-list" class="card-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;"></div>
        </div>
      `;
      
      const rbacListEl = rbacEl.querySelector('#rbac-list');
      const users = options.usersList || [];
      if (users.length === 0) {
        rbacListEl.innerHTML = `<div style="padding: 1rem; color: var(--text-muted); text-align: center;">No hay usuarios registrados.</div>`;
      } else {
        users.forEach(u => {
          const card = el('div', { classes: ['card', 'glass-card'], style: 'padding: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem;' });
          card.innerHTML = `
            <div style="flex: 1;">
              <h4 style="margin: 0 0 0.3rem 0; font-size: 0.95rem;">${u.email}</h4>
              <span style="font-size: 0.8rem; color: var(--text-muted);">Registrado: ${new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <select class="form-input rbac-select" data-uid="${u.uid}" style="padding: 0.4rem; font-size: 0.85rem;">
                <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>Administrador</option>
                <option value="OPERARIO" ${u.role === 'OPERARIO' ? 'selected' : ''}>Operario</option>
                <option value="VISOR" ${u.role === 'VISOR' ? 'selected' : ''}>Solo Lectura (Visor)</option>
              </select>
              <button class="btn-primary btn-save-role" data-uid="${u.uid}" data-email="${u.email}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin: 0;">Actualizar</button>
            </div>
          `;
          rbacListEl.appendChild(card);
        });

        rbacListEl.querySelectorAll('.btn-save-role').forEach(btn => {
          btn.onclick = async () => {
            const uid = btn.dataset.uid;
            const email = btn.dataset.email;
            const select = rbacListEl.querySelector(`.rbac-select[data-uid="${uid}"]`);
            const newRole = select.value;
            btn.textContent = '...';
            btn.disabled = true;
            if (options.onSaveUserRole) {
              await options.onSaveUserRole(uid, newRole);
              showMsg(`Rol de ${email || 'usuario'} actualizado a ${newRole}`);
            }
            btn.textContent = 'Actualizar';
            btn.disabled = false;
          };
        });
      }
    }
  }

  // --- EVENT LISTENERS ---
  const shareBtn = wrapper.querySelector('#gen-price-share-btn');
  if (shareBtn) shareBtn.onclick = options.onPriceShare;

  wrapper.querySelector('#add-camara-btn').onclick = () => renderCamaraRow();

  wrapper.querySelector('#save-settings').onclick = async () => {
    const newSettings = {
      margenGanancia: 1 + (parseFloat(wrapper.querySelector('#set-margen').value) / 100),
      pesoJaulaDoble: parseFloat(wrapper.querySelector('#set-jdd-kg').value),
      precioKmDouble: parseFloat(wrapper.querySelector('#set-jdd-km').value),
      pesoJaulaSimple: parseFloat(wrapper.querySelector('#set-js-kg').value),
      precioKmSimple: parseFloat(wrapper.querySelector('#set-js-km').value),
    };
    
    const prices = {};
    wrapper.querySelectorAll('.cat-price-input').forEach(input => {
      prices[input.dataset.cat] = parseFloat(input.value) || 0;
    });

    if (SettingsService.saveSettings(newSettings)) {
      if (options && options.onSavePrices) {
        await options.onSavePrices(prices);
      }
      if (options && options.onSaveCamaras) {
        const camarasArray = [];
        wrapper.querySelectorAll('#camaras-config-container > div').forEach(row => {
          const nameInput = row.querySelector('.camara-name-input');
          const capInput = row.querySelector('.camara-capacity-input');
          if (nameInput && capInput) {
            const name = nameInput.value.trim();
            const capacity = parseInt(capInput.value, 10) || 0;
            if (name) {
              camarasArray.push({ name, capacity });
            }
          }
        });
        await options.onSaveCamaras(camarasArray);
      }
      showMsg('¡Configuración de precios, cámaras y general guardada exitosamente!');
    } else {
      showMsg('Hubo un error al guardar general.', true);
    }
  };

  wrapper.querySelector('#reset-settings').onclick = () => {
    const defaults = SettingsService.getDefaults();
    wrapper.querySelector('#set-margen').value = ((defaults.margenGanancia - 1) * 100).toFixed(0);
    wrapper.querySelector('#set-jdd-kg').value = defaults.pesoJaulaDoble;
    wrapper.querySelector('#set-jdd-km').value = defaults.precioKmDouble;
    wrapper.querySelector('#set-js-kg').value = defaults.pesoJaulaSimple;
    wrapper.querySelector('#set-js-km').value = defaults.precioKmSimple;
    
    SettingsService.saveSettings(defaults);
    showMsg('¡Restaurado a los valores originales!');
  };

  const clearClientForm = () => {
    wrapper.querySelector('#client-id').value = '';
    wrapper.querySelector('#client-name').value = '';
    wrapper.querySelector('#client-cuit').value = '';
    wrapper.querySelector('#client-address').value = '';
    wrapper.querySelector('#client-phone').value = '';
    wrapper.querySelector('#client-cbu').value = '';
    wrapper.querySelector('#client-account').value = '';
    wrapper.querySelector('#client-form-title').textContent = 'Añadir Nuevo Cliente';
  };

  wrapper.querySelector('#clear-client-btn').onclick = clearClientForm;

  wrapper.querySelector('#save-client-btn').onclick = async () => {
    const name = wrapper.querySelector('#client-name').value.trim();
    if (!name) return alert('El nombre o razón social es obligatorio');
    
    const clientData = {
      id: wrapper.querySelector('#client-id').value || null,
      name,
      cuit: wrapper.querySelector('#client-cuit').value,
      address: wrapper.querySelector('#client-address').value,
      phone: wrapper.querySelector('#client-phone').value,
      cbu: wrapper.querySelector('#client-cbu').value,
      account: wrapper.querySelector('#client-account').value,
    };
    if (!clientData.id) delete clientData.id;

    const btn = wrapper.querySelector('#save-client-btn');
    btn.textContent = 'Guardando...';
    btn.disabled = true;

    if (options && options.onSaveClient) {
       await options.onSaveClient(clientData);
       showMsg('Cliente guardado exitosamente.');
       clearClientForm();
       if (options.onReloadClients) {
         options.onReloadClients();
       }
    } else {
      btn.textContent = 'Guardar Cliente';
      btn.disabled = false;
    }
  };
}
