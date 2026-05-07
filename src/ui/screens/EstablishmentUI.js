import { el } from '../../utils/dom.js';

export function renderEstablishmentManager(container, presenter) {
  const { establishments = [], selectedEstablishment = null, employees = [] } = presenter.state || {};
  container.innerHTML = '';

  const header = el('div', { 
    classes: ['dashboard-header'],
    style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;'
  });

  const titleGroup = el('div', { style: 'display: flex; align-items: center; gap: 1rem;' });
  
  // If viewing employees of an establishment, show back button to establishments list
  if (selectedEstablishment) {
    const backBtn = el('button', { 
      classes: ['back-btn-m3'],
      html: '<svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>',
      attrs: { title: 'Volver a Sucursales' }
    });
    backBtn.onclick = () => presenter.clearSelection();
    titleGroup.appendChild(backBtn);
  }

  titleGroup.appendChild(el('h1', { 
    text: selectedEstablishment ? `Personal: ${selectedEstablishment.name}` : 'Gestión de Sucursales', 
    style: 'margin:0;' 
  }));
  header.appendChild(titleGroup);

  const actionBtn = el('button', { 
    classes: ['btn-nueva-operacion'],
    style: 'margin: 0;',
    html: `<svg viewBox="0 0 24 24" width="18" height="18" style="fill:currentColor;flex-shrink:0;"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg> ${selectedEstablishment ? 'Nuevo Empleado' : 'Nueva Sucursal'}`
  });
  actionBtn.onclick = () => {
    if (selectedEstablishment) {
      showEmployeeModal(null, presenter);
    } else {
      showEstablishmentModal(null, presenter);
    }
  };
  header.appendChild(actionBtn);
  
  container.appendChild(header);

  const listContainer = el('div', { classes: ['glass-card'], style: 'padding: 0;' });

  if (selectedEstablishment) {
    // Render Employees Table
    listContainer.appendChild(renderEmployeesTable(employees, presenter));
  } else {
    // Render Establishments List
    listContainer.appendChild(renderEstablishmentsList(establishments, presenter));
  }

  container.appendChild(listContainer);
}

function renderEstablishmentsList(establishments, presenter) {
  const table = el('table', { style: 'width: 100%; border-collapse: collapse;' });
  
  const thead = el('thead', { html: `
    <tr style="background: rgba(255,255,255,0.05); text-align: left;">
      <th style="padding: 1rem;">Nombre de Sucursal</th>
      <th style="padding: 1rem;">Dirección</th>
      <th style="padding: 1rem; text-align: right;">Acciones</th>
    </tr>
  `});
  table.appendChild(thead);

  const tbody = el('tbody');
  if (establishments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="padding: 3rem; text-align: center; color: var(--text-muted);">
      No hay sucursales registradas.
    </td></tr>`;
  } else {
    establishments.forEach(est => {
      const tr = el('tr', { style: 'border-top: 1px solid var(--border); transition: background 0.2s;' });
      tr.innerHTML = `
        <td style="padding: 1rem; font-weight: 600;">${est.name}</td>
        <td style="padding: 1rem; color: var(--text-muted);">${est.address || '-'}</td>
        <td style="padding: 1rem; text-align: right; white-space: nowrap; display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button class="icon-btn manage-btn" title="Gestionar Empleados" style="color: var(--primary);">👥 Personal</button>
          <button class="icon-btn edit-btn" title="Editar">✏️</button>
          <button class="icon-btn delete-btn" style="color: var(--danger);" title="Eliminar">🗑️</button>
        </td>
      `;
      
      tr.querySelector('.manage-btn').onclick = () => presenter.selectEstablishment(est);
      tr.querySelector('.edit-btn').onclick = () => showEstablishmentModal(est, presenter);
      tr.querySelector('.delete-btn').onclick = () => presenter.deleteEstablishment(est.id);
      
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  return table;
}

function renderEmployeesTable(employees, presenter) {
  const table = el('table', { style: 'width: 100%; border-collapse: collapse;' });
  
  const thead = el('thead', { html: `
    <tr style="background: rgba(255,255,255,0.05); text-align: left;">
      <th style="padding: 1rem;">Nombre Completo</th>
      <th style="padding: 1rem;">DNI</th>
      <th style="padding: 1rem;">Puesto</th>
      <th style="padding: 1rem;">Contacto / Dirección</th>
      <th style="padding: 1rem; text-align: right;">Acciones</th>
    </tr>
  `});
  table.appendChild(thead);

  const tbody = el('tbody');
  if (employees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding: 3rem; text-align: center; color: var(--text-muted);">
      No hay empleados registrados en esta sucursal.
    </td></tr>`;
  } else {
    employees.forEach(emp => {
      const tr = el('tr', { style: 'border-top: 1px solid var(--border); transition: background 0.2s;' });
      tr.innerHTML = `
        <td style="padding: 1rem; font-weight: 600;">${emp.name}</td>
        <td style="padding: 1rem;">${emp.dni || '-'}</td>
        <td style="padding: 1rem;">
          <span style="background: rgba(99,102,241,0.1); color: #818cf8; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 500;">
            ${emp.position || 'Sin asignar'}
          </span>
        </td>
        <td style="padding: 1rem; color: var(--text-muted); font-size: 0.9rem;">
          <div>${emp.phone ? `📞 ${emp.phone}` : ''}</div>
          <div>${emp.address ? `📍 ${emp.address}` : ''}</div>
        </td>
        <td style="padding: 1rem; text-align: right; white-space: nowrap;">
          <button class="icon-btn edit-btn" title="Editar">✏️</button>
          <button class="icon-btn delete-btn" style="color: var(--danger);" title="Eliminar">🗑️</button>
        </td>
      `;
      
      tr.querySelector('.edit-btn').onclick = () => showEmployeeModal(emp, presenter);
      tr.querySelector('.delete-btn').onclick = () => presenter.deleteEmployee(emp.id);
      
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  return table;
}

function showEstablishmentModal(existingEst, presenter) {
  const modal = el('div', { 
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;'
  });

  const content = el('div', { 
    classes: ['glass-card'],
    style: 'width: 100%; max-width: 500px; padding: 2rem;'
  });

  content.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 2rem;">${existingEst ? 'Editar' : 'Nueva'} Sucursal</h2>
    <form id="est-form">
      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Nombre de la Sucursal</label>
        <input type="text" name="name" required placeholder="Ej: Frigorífico Central" value="${existingEst?.name || ''}">
      </div>
      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Dirección</label>
        <input type="text" name="address" placeholder="Ej: Ruta 9 Km 42" value="${existingEst?.address || ''}">
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
        <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cancelar</button>
        <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: var(--primary); color: #ffffff; font-size: 1rem; font-weight: 700; border: none; cursor: pointer;">Guardar</button>
      </div>
    </form>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const form = content.querySelector('#est-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const data = {
      id: existingEst?.id,
      name: form.name.value.trim(),
      address: form.address.value.trim()
    };
    presenter.saveEstablishment(data);
    modal.remove();
  };

  content.querySelector('.btn-cancel').onclick = () => modal.remove();
}

function showEmployeeModal(existingEmp, presenter) {
  const modal = el('div', { 
    classes: ['modal-overlay'],
    style: 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem;'
  });

  const content = el('div', { 
    classes: ['glass-card'],
    style: 'width: 100%; max-width: 600px; padding: 2rem;'
  });

  content.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 2rem;">${existingEmp ? 'Editar' : 'Nuevo'} Empleado</h2>
    <form id="emp-form">
      <div class="responsive-grid-2" style="margin-bottom: 1.5rem;">
        <div class="form-group">
          <label>Nombre Completo</label>
          <input type="text" name="name" required placeholder="Ej: Juan Pérez" value="${existingEmp?.name || ''}">
        </div>
        <div class="form-group">
          <label>DNI</label>
          <input type="text" name="dni" required placeholder="Ej: 30123456" value="${existingEmp?.dni || ''}">
        </div>
      </div>
      
      <div class="responsive-grid-2" style="margin-bottom: 1.5rem;">
        <div class="form-group">
          <label>Puesto / Cargo</label>
          <input type="text" name="position" placeholder="Ej: Carnicero, Chofer, Cajero" value="${existingEmp?.position || ''}">
        </div>
        <div class="form-group">
          <label>Teléfono (Opcional)</label>
          <input type="text" name="phone" placeholder="Ej: 341 555-1234" value="${existingEmp?.phone || ''}">
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 1.5rem;">
        <label>Dirección</label>
        <input type="text" name="address" placeholder="Ej: Calle Falsa 123" value="${existingEmp?.address || ''}">
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
        <button type="button" class="btn-cancel" style="padding: 0.85rem 2rem; border-radius: 12px; background: rgba(255,255,255,0.08); color: var(--text-main); font-size: 1rem; font-weight: 600; border: 1px solid var(--outline); cursor: pointer;">Cancelar</button>
        <button type="submit" style="padding: 0.85rem 2.5rem; border-radius: 12px; background: var(--primary); color: #ffffff; font-size: 1rem; font-weight: 700; border: none; cursor: pointer;">Guardar</button>
      </div>
    </form>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  const form = content.querySelector('#emp-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const data = {
      id: existingEmp?.id,
      name: form.name.value.trim(),
      dni: form.dni.value.trim(),
      position: form.position.value.trim(),
      phone: form.phone.value.trim(),
      address: form.address.value.trim()
    };
    presenter.saveEmployee(data);
    modal.remove();
  };

  content.querySelector('.btn-cancel').onclick = () => modal.remove();
}
