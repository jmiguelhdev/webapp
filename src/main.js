// webApp/src/main.js
import './style.css';
import { db, auth } from './firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import * as api from './api.js';
import * as ui from './ui.js';

// State
let currentUser = null;
let allTravels = [];

// Travels State
let travelsState = {
  filter: 'TODOS',
  sort: 'DESC',
  page: 1,
  itemsPerPage: 5
};

// UI setup
const entityList = document.getElementById('entity-list');
const content = document.getElementById('content');
const themeToggle = document.getElementById('theme-toggle');
const menuToggle = document.getElementById('menu-toggle');

// Auth Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.body.classList.add('authenticated');
    loadData(user.uid);
  } else {
    currentUser = null;
    document.body.classList.remove('authenticated');
    showLogin();
  }
});

function showLogin() {
  content.innerHTML = `
    <div class="login-container glass-card">
      <img src="/src/assets/logo.jpg" alt="Logo" class="login-logo" />
      <h2>Gestor de Viajes KMP</h2>
      <p>Inicia sesión para acceder a tus reportes detallados.</p>
      <form id="login-form">
        <div class="form-group"><label>Correo Electrónico</label><input type="email" id="login-email" required></div>
        <div class="form-group"><label>Contraseña</label><input type="password" id="login-pass" required></div>
        <button type="submit" class="btn-primary">Ingresar</button>
      </form>
      <p id="login-error" class="text-danger" style="margin-top: 1rem;"></p>
    </div>
  `;
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try { await signInWithEmailAndPassword(auth, email, pass); }
    catch (e) { document.getElementById('login-error').textContent = e.message; }
  });
}

async function loadData(uid) {
  content.innerHTML = `<div class="loading">Cargando Viajes...</div>`;
  try {
    allTravels = await api.fetchTravels(db, uid);
    navigateTo('travels');
  } catch (error) {
    content.innerHTML = `<div class="alert error">Error: ${error.message}</div>`;
  }
}

function navigateTo(view) {
  if (!currentUser && view !== 'simulator') return showLogin();
  document.querySelectorAll('#entity-list li').forEach(li => li.classList.toggle('active', li.dataset.view === view));
  document.body.classList.remove('sidebar-open'); // Auto-close on mobile
  content.innerHTML = '';
  switch (view) {
    case 'travels': 
      renderTravelsView();
      break;
    case 'simulator': ui.renderSimulator(content); break;
    case 'contact': 
      content.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: 4rem;">
          <h2>Contacto</h2>
          <p style="margin-top: 1rem; color: var(--text-muted);">Puedes contactarme en:</p>
          <h3 style="margin-top: 0.5rem; color: var(--primary);">jmiguelhsg@gmail.com</h3>
        </div>
      `;
      break;
    case 'logout': signOut(auth); break;
    default: content.textContent = 'Vista no encontrada';
  }
}

function renderTravelsView() {
  // 1. Filter
  let filtered = allTravels.filter(t => {
    if (travelsState.filter === 'TODOS') return true;
    if (travelsState.filter === 'ACTIVO') return t.status === 'ACTIVE' || t.status === 'COMPLETED';
    if (travelsState.filter === 'BORRADOR') return t.status === 'DRAFT';
    return true;
  });

  // 2. Sort
  filtered.sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return travelsState.sort === 'DESC' ? dateB - dateA : dateA - dateB;
  });

  // 3. Paginate
  const totalItems = filtered.length;
  const start = (travelsState.page - 1) * travelsState.itemsPerPage;
  const paginated = filtered.slice(start, start + travelsState.itemsPerPage);

  ui.renderTravels(content, {
    data: paginated,
    totalItems,
    currentPage: travelsState.page,
    itemsPerPage: travelsState.itemsPerPage,
    currentFilter: travelsState.filter,
    currentSort: travelsState.sort,
    onFilter: (f) => { travelsState.filter = f; travelsState.page = 1; renderTravelsView(); },
    onSort: (s) => { travelsState.sort = s; renderTravelsView(); },
    onPage: (p) => { travelsState.page = p; renderTravelsView(); },
    allTravels
  });
}

entityList.addEventListener('click', e => {
  const li = e.target.closest('li[data-view]');
  if (li) navigateTo(li.dataset.view);
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

menuToggle.addEventListener('click', () => {
  document.body.classList.toggle('sidebar-open');
});
