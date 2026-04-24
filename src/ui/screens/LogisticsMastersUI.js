// src/ui/screens/LogisticsMastersUI.js
import { renderScanResultsModal } from '../components/Modals.js'; // reusing modal patterns if needed

export function renderLogisticsMaster(container, type, dataList, dependencies = {}) {
  const tabs = [
    { id: 'camiones', label: '🚚 Camiones', action: 'loadTrucks' },
    { id: 'jaulas', label: '🚚 Jaulas', action: 'loadTrailers' },
    { id: 'choferes', label: '👨‍✈️ Choferes', action: 'loadDrivers' },
    { id: 'productores', label: '👥 Productores', action: 'loadProducers' },
    { id: 'comisionistas', label: '🤝 Comisionistas', action: 'loadAgents' }
  ];

  const tabsHTML = `
    <div style="display:flex; gap:1rem; margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem;">
      ${tabs.map(t => `
        <button class="category-chip ${t.id === type ? 'active' : ''}" data-action="${t.action}">
          ${t.label}
        </button>
      `).join('')}
    </div>
  `;

  container.innerHTML = `
    <div class="dashboard-header" style="margin-bottom:0;">
      <h2>⚙️ Datos Maestros</h2>
    </div>
    ${tabsHTML}
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h3 style="color:var(--primary);">${getTitle(type)}</h3>
      <button id="btn-add-master" class="btn-primary">+ Nuevo</button>
    </div>
    <div class="glass-card" style="padding: 1.5rem; overflow-x: auto;">
      <table class="data-table" id="master-table">
        ${getTableHeader(type)}
        <tbody>
          ${dataList.map(item => getTableRow(type, item)).join('')}
        </tbody>
      </table>
    </div>
    <div id="master-modal-container"></div>
  `;

  // Attach tab events
  container.querySelectorAll('.category-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      if (window.currentPresenter && window.currentPresenter[action]) {
        window.currentPresenter[action]();
      }
    });
  });

  document.getElementById('btn-add-master').addEventListener('click', () => {
    showMasterModal(type, null, dependencies);
  });

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      // Because ID can be string/number, we use strict equality string comparison
      const item = dataList.find(d => String(d.id) === String(id));
      if (item) showMasterModal(type, item, dependencies);
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('¿Eliminar este registro?')) {
        window.currentPresenter[`delete${capitalize(getEntityType(type))}`](id);
      }
    });
  });
}

function getTitle(type) {
  const titles = { choferes: 'Gestión de Choferes', jaulas: 'Gestión de Jaulas', camiones: 'Gestión de Camiones', productores: 'Gestión de Productores', comisionistas: 'Gestión de Comisionistas' };
  return titles[type] || 'Gestión';
}

function getEntityType(type) {
  const types = { choferes: 'Driver', jaulas: 'Trailer', camiones: 'Truck', productores: 'Producer', comisionistas: 'Agent' };
  return types[type];
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getTableHeader(type) {
  if (type === 'choferes') {
    return `<thead><tr><th>Nombre</th><th>DNI</th><th>Licencia</th><th>Acciones</th></tr></thead>`;
  } else if (type === 'jaulas') {
    return `<thead><tr><th>Nombre</th><th>Patente</th><th>Tipo</th><th>Vencimientos</th><th>Acciones</th></tr></thead>`;
  } else if (type === 'camiones') {
    return `<thead><tr><th>Nombre</th><th>Patente</th><th>Chofer</th><th>Jaula</th><th>Acciones</th></tr></thead>`;
  } else if (type === 'productores') {
    return `<thead><tr><th>Nombre</th><th>Teléfono</th><th>CUIT</th><th>CBU</th><th>Acciones</th></tr></thead>`;
  } else if (type === 'comisionistas') {
    return `<thead><tr><th>Nombre</th><th>Teléfono</th><th>Comisión %</th><th>Acciones</th></tr></thead>`;
  }
}

function getTableRow(type, item) {
  const editSvg = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z" /></svg>`;
  const delSvg = `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" /></svg>`;

  const actionHtml = `
    <td class="actions" style="display:flex; gap:0.5rem; justify-content:flex-end;">
      <button class="btn-icon btn-edit" data-id="${item.id}" style="background:var(--surface); border:1px solid var(--border); color:var(--primary); padding:0.5rem; border-radius:8px;">${editSvg}</button> 
      <button class="btn-icon btn-delete" data-id="${item.id}" style="background:var(--surface); border:1px solid var(--border); color:var(--danger); padding:0.5rem; border-radius:8px;">${delSvg}</button>
    </td>
  `;

  if (type === 'choferes') {
    return `<tr>
      <td>${item.name}</td><td>${item.dni || '-'}</td><td>${item.license || '-'}</td>
      ${actionHtml}
    </tr>`;
  } else if (type === 'jaulas') {
    return `<tr>
      <td><strong>${item.name}</strong></td><td><span class="badge" style="background: var(--surface); color: var(--text); border: 1px solid var(--border);">${item.licensePlate}</span></td><td><span class="badge status-active">${item.type}</span></td>
      <td><small style="color:var(--text-muted)">VTV: ${item.vtvExpiration}<br>SENASA: ${item.senasaExpiration}</small></td>
      ${actionHtml}
    </tr>`;
  } else if (type === 'camiones') {
    return `<tr>
      <td><strong>${item.name}</strong></td>
      <td><span class="badge" style="background: var(--surface); color: var(--text); border: 1px solid var(--border);">${item.licensePlate}</span></td>
      <td><div style="display:flex; align-items:center; gap:0.5rem;"><div style="width:24px;height:24px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;">${item.driver?.name?.charAt(0) || '-'}</div> ${item.driver ? item.driver.name : '-'}</div></td>
      <td>${item.trailer ? item.trailer.name : '-'}</td>
      ${actionHtml}
    </tr>`;
  } else if (type === 'productores') {
    return `<tr>
      <td><strong>${item.name}</strong></td>
      <td>${item.phone || '-'}</td>
      <td><span class="badge" style="background: var(--surface); color: var(--text); border: 1px solid var(--border);">${item.cuit || '-'}</span></td>
      <td>${item.cbu || '-'}</td>
      ${actionHtml}
    </tr>`;
  } else if (type === 'comisionistas') {
    return `<tr>
      <td><strong>${item.name}</strong></td>
      <td>${item.phone || '-'}</td>
      <td><span style="color:var(--success); font-weight:600;">${item.percent}%</span></td>
      ${actionHtml}
    </tr>`;
  }
}

function showMasterModal(type, item, dependencies) {
  const container = document.getElementById('master-modal-container');
  const isEdit = !!item;
  const title = isEdit ? `Editar ${capitalize(type.slice(0,-1))}` : `Nuevo ${capitalize(type.slice(0,-1))}`;
  
  let formHTML = '';
  if (type === 'choferes') {
    formHTML = `
      <div class="form-group"><label>Nombre</label><input type="text" id="m-name" value="${item?.name || ''}" required></div>
      <div class="form-group"><label>DNI</label><input type="text" id="m-dni" value="${item?.dni || ''}"></div>
      <div class="form-group"><label>Licencia</label><input type="text" id="m-license" value="${item?.license || ''}"></div>
    `;
  } else if (type === 'jaulas') {
    formHTML = `
      <div class="form-group"><label>Nombre</label><input type="text" id="m-name" value="${item?.name || ''}" required></div>
      <div class="form-group"><label>Patente</label><input type="text" id="m-plate" value="${item?.licensePlate || ''}"></div>
      <div class="form-group">
        <label>Tipo</label>
        <select id="m-type">
          <option value="SIMPLE" ${item?.type === 'SIMPLE' ? 'selected' : ''}>Simple</option>
          <option value="DOUBLE" ${item?.type === 'DOUBLE' ? 'selected' : ''}>Doble</option>
        </select>
      </div>
      <div class="form-group"><label>Vencimiento VTV</label><input type="date" id="m-vtv" value="${item?.vtvExpiration || ''}"></div>
      <div class="form-group"><label>Vencimiento SENASA</label><input type="date" id="m-senasa" value="${item?.senasaExpiration || ''}"></div>
    `;
  } else if (type === 'camiones') {
    const driversOpts = (dependencies.drivers || []).map(d => `<option value="${d.id}" ${item?.driver?.id == d.id ? 'selected' : ''}>${d.name}</option>`).join('');
    const trailersOpts = (dependencies.trailers || []).map(t => `<option value="${t.id}" ${item?.trailer?.id == t.id ? 'selected' : ''}>${t.name}</option>`).join('');
    formHTML = `
      <div class="form-group"><label>Nombre</label><input type="text" id="m-name" value="${item?.name || ''}" required></div>
      <div class="form-group"><label>Patente</label><input type="text" id="m-plate" value="${item?.licensePlate || ''}"></div>
      <div class="form-group"><label>Vencimiento VTV</label><input type="date" id="m-vtv" value="${item?.vtvExpiration || ''}"></div>
      <div class="form-group"><label>Vencimiento Seguro</label><input type="date" id="m-insurance" value="${item?.insuranceExpiration || ''}"></div>
      <div class="form-group"><label>Flete Pagado a Tercero</label><input type="checkbox" id="m-freight" ${item?.isFreightPaid ? 'checked' : ''}></div>
      <div class="form-group">
        <label>Chofer Asignado</label>
        <select id="m-driver"><option value="">-- Ninguno --</option>${driversOpts}</select>
      </div>
      <div class="form-group">
        <label>Jaula Asignada</label>
        <select id="m-trailer"><option value="">-- Ninguna --</option>${trailersOpts}</select>
      </div>
    `;
  } else if (type === 'productores') {
    formHTML = `
      <div class="form-group"><label>Nombre</label><input type="text" id="m-name" value="${item?.name || ''}" required></div>
      <div class="form-group"><label>Teléfono</label><input type="text" id="m-phone" value="${item?.phone || ''}"></div>
      <div class="form-group"><label>CUIT</label><input type="text" id="m-cuit" value="${item?.cuit || ''}"></div>
      <div class="form-group"><label>CBU</label><input type="text" id="m-cbu" value="${item?.cbu || ''}"></div>
    `;
  } else if (type === 'comisionistas') {
    formHTML = `
      <div class="form-group"><label>Nombre</label><input type="text" id="m-name" value="${item?.name || ''}" required></div>
      <div class="form-group"><label>Teléfono</label><input type="text" id="m-phone" value="${item?.phone || ''}"></div>
      <div class="form-group"><label>Comisión (%)</label><input type="number" step="0.1" id="m-percent" value="${item?.percent || ''}"></div>
    `;
  }

  container.innerHTML = `
    <div class="modal-overlay">
      <div class="modal active" id="master-modal">
        <h3 style="margin-top:0; color:var(--primary); font-size:1.5rem; margin-bottom:1.5rem;">${title}</h3>
        <form id="master-form">
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${formHTML}
          </div>
          <div class="modal-actions" style="margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
            <button type="button" class="btn-secondary" id="btn-cancel-modal" style="padding:0.65rem 1.5rem; border-radius:100px; border:1px solid var(--outline); background:transparent; cursor:pointer;">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('btn-cancel-modal').addEventListener('click', () => {
    container.innerHTML = '';
  });

  document.getElementById('master-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = { id: item ? item.id : Date.now() };

    if (type === 'choferes') {
      payload.name = document.getElementById('m-name').value;
      payload.dni = document.getElementById('m-dni').value;
      payload.license = document.getElementById('m-license').value;
    } else if (type === 'jaulas') {
      payload.name = document.getElementById('m-name').value;
      payload.licensePlate = document.getElementById('m-plate').value;
      payload.type = document.getElementById('m-type').value;
      payload.vtvExpiration = document.getElementById('m-vtv').value;
      payload.senasaExpiration = document.getElementById('m-senasa').value;
    } else if (type === 'camiones') {
      payload.name = document.getElementById('m-name').value;
      payload.licensePlate = document.getElementById('m-plate').value;
      payload.vtvExpiration = document.getElementById('m-vtv').value;
      payload.insuranceExpiration = document.getElementById('m-insurance').value;
      payload.isFreightPaid = document.getElementById('m-freight').checked;
      
      const driverId = document.getElementById('m-driver').value;
      payload.driver = driverId ? dependencies.drivers.find(d => String(d.id) === driverId) : null;
      
      const trailerId = document.getElementById('m-trailer').value;
      payload.trailer = trailerId ? dependencies.trailers.find(t => String(t.id) === trailerId) : null;
    } else if (type === 'productores') {
      payload.name = document.getElementById('m-name').value;
      payload.phone = document.getElementById('m-phone').value;
      payload.cuit = document.getElementById('m-cuit').value;
      payload.cbu = document.getElementById('m-cbu').value;
      // Preserve existing listOfProducts if editing
      payload.listOfProducts = item ? item.listOfProducts : [];
    } else if (type === 'comisionistas') {
      payload.name = document.getElementById('m-name').value;
      payload.phone = document.getElementById('m-phone').value;
      payload.percent = Number(document.getElementById('m-percent').value);
    }

    container.innerHTML = '';
    window.currentPresenter[`save${capitalize(getEntityType(type))}`](payload);
  });
}
