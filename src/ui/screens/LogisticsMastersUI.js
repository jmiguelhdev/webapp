// src/ui/screens/LogisticsMastersUI.js
import { renderScanResultsModal } from '../components/Modals.js'; // reusing modal patterns if needed

export function renderLogisticsMaster(container, type, dataList, dependencies = {}) {
  container.innerHTML = `
    <div class="dashboard-header">
      <h2>${getTitle(type)}</h2>
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
  const titles = { choferes: 'Gestión de Choferes', jaulas: 'Gestión de Jaulas', camiones: 'Gestión de Camiones' };
  return titles[type] || 'Gestión';
}

function getEntityType(type) {
  const types = { choferes: 'Driver', jaulas: 'Trailer', camiones: 'Truck' };
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
  }
}

function getTableRow(type, item) {
  if (type === 'choferes') {
    return `<tr>
      <td>${item.name}</td><td>${item.dni}</td><td>${item.license}</td>
      <td class="actions"><button class="btn-edit" data-id="${item.id}">✏️</button> <button class="btn-delete" data-id="${item.id}">🗑️</button></td>
    </tr>`;
  } else if (type === 'jaulas') {
    return `<tr>
      <td>${item.name}</td><td>${item.licensePlate}</td><td>${item.type}</td>
      <td><small>VTV: ${item.vtvExpiration}<br>SENASA: ${item.senasaExpiration}</small></td>
      <td class="actions"><button class="btn-edit" data-id="${item.id}">✏️</button> <button class="btn-delete" data-id="${item.id}">🗑️</button></td>
    </tr>`;
  } else if (type === 'camiones') {
    return `<tr>
      <td>${item.name}</td><td>${item.licensePlate}</td>
      <td>${item.driver ? item.driver.name : '-'}</td>
      <td>${item.trailer ? item.trailer.name : '-'}</td>
      <td class="actions"><button class="btn-edit" data-id="${item.id}">✏️</button> <button class="btn-delete" data-id="${item.id}">🗑️</button></td>
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
  }

  container.innerHTML = `
    <div class="modal active" id="master-modal">
      <div class="modal-content glass-card" style="max-width: 500px;">
        <h3>${title}</h3>
        <form id="master-form">
          ${formHTML}
          <div class="modal-actions" style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
            <button type="button" class="btn-secondary" id="btn-cancel-modal">Cancelar</button>
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
    }

    container.innerHTML = '';
    window.currentPresenter[`save${capitalize(getEntityType(type))}`](payload);
  });
}
