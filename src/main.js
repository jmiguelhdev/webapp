// src/main.js
import './style.css';
import { auth } from './firebase.js';
import { CostSimulator } from './domain/entities/CostSimulator.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import * as api from './api.js';
import * as uiLib from './ui.js';
import { FirebaseTravelRepository } from './adapters/repositories/TravelRepository.js';
import { TravelPresenter } from './adapters/presenters/TravelPresenter.js';

// Dependencies
const travelRepository = new FirebaseTravelRepository();

// State
let currentUser = null;

// Configuración de acceso compartido
const SHARED_DATA_SOURCE_UID = 'rUY2SwonQJTtOE0iCbXDQBoVmc63';
const AUTHORIZED_USERS = [
  '0Ii0FBxKs2bqASQIle96Fk9tGTH2', // piolaelcrack
  'rUY2SwonQJTtOE0iCbXDQBoVmc63'  // example
];


// UI elements
const entityList = document.getElementById('entity-list');
const content = document.getElementById('content');
const themeToggle = document.getElementById('theme-toggle');
const menuToggle = document.getElementById('menu-toggle');

// Unified UI Interface for Presenter
const uiInterface = {
  showLoading: () => { content.innerHTML = `<div class="loading">Cargando Viajes...</div>`; },
  showError: (msg) => { content.innerHTML = `<div class="alert error">Error: ${msg}</div>`; },
  renderTravels: (options) => uiLib.renderTravels(content, options)
};

const travelPresenter = new TravelPresenter(travelRepository, uiInterface);

// Auth Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.body.classList.add('authenticated');
    
    // Redirección de datos para usuarios autorizados
    const uidToLoad = AUTHORIZED_USERS.includes(user.uid) 
      ? SHARED_DATA_SOURCE_UID 
      : user.uid;

    travelPresenter.loadTravels(uidToLoad);
  } else {
    currentUser = null;
    document.body.classList.remove('authenticated');
    showLogin();
  }
});

function showLogin() {
  content.innerHTML = `
    <div class="login-container glass-card">
      <img src="/logo.jpg" alt="Logo" class="login-logo" />
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

function navigateTo(view) {
  if (!currentUser && view !== 'simulator') return showLogin();
  document.querySelectorAll('#entity-list li').forEach(li => li.classList.toggle('active', li.dataset.view === view));
  document.body.classList.remove('sidebar-open');
  content.innerHTML = '';
  switch (view) {
    case 'travels': 
      travelPresenter.updateView();
      break;
    case 'simulator': uiLib.renderSimulator(content); break;
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
