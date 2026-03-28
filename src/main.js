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
  showLoading: () => { content.innerHTML = `<div class="loading">Cargando...</div>`; },
  showError: (msg) => { content.innerHTML = `<div class="alert error">Error: ${msg}</div>`; },
  renderTravels: (options) => uiLib.renderTravels(content, options),
  renderDashboard: (options) => uiLib.renderDashboard(content, options),
  renderExportModal: (options) => uiLib.renderExportModal(options),
  generateTravelReport: (data) => uiLib.generateTravelReport(data)
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
    case 'dashboard':
      travelPresenter.showDashboard();
      break;
    case 'simulator': uiLib.renderSimulator(content); break;
    case 'contact': 
      content.innerHTML = `
        <div class="glass-card" style="padding: 2rem; max-width: 900px; margin: 0 auto;">
          <h2 style="text-align: center; margin-bottom: 2rem;">Centro de Documentación Técnica</h2>
          
          <div class="accordion">
            <!-- Sección Viajes -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>🚛 Gestión de Viajes y Métricas</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>La sección de viajes procesa datos operativos para generar reportes financieros precisos. Las métricas se calculan dinámicamente según los filtros de categoría seleccionados:</p>
                
                <div class="formula-card">
                  <span class="tech-tag">Cálculo</span> Precio Promedio = Total Operación / ∑ Kg Limpios
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Cálculo</span> Precio c/ Comis. = (Total Operación + Comisión Agente) / ∑ Kg Limpios
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Cálculo</span> Peso Media Res Prom. = ∑ Kg Limpios / Total Unidades
                </div>
                <p>El sistema también monitorea la relación <strong>Factura vs. Operación</strong> para detectar desviaciones impositivas o administrativas (⚠️ se muestra si supera el umbral configurado).</p>
              </div>
            </div>

            <!-- Sección Simulador -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>🧮 Algoritmos del Simulador de Costo</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>El simulador utiliza un modelo de costos en cascada para proyectar la utilidad final basada en la logística y el rendimiento de faena:</p>
                
                <div class="formula-card">
                  <span class="tech-tag">Logística</span> Kg Faena = Kg Vivos * (Rendimiento / 100)
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Hacienda</span> Costo Inic. (Carne) = Precio Vivo / (Rendimiento / 100)
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Flete</span> Costo Flete (Carne) = (Distancia * $/km) / Kg Faena
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Impuestos</span> Tasa Efectiva = Margen * (IIBB / 100)
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Venta</span> Factura Venta = Costo Final * Margen Ganancia
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Final</span> Utilidad Total = (Precio Venta - Costo Final) * Kg Faena
                </div>
                <p>Nota: El costo final se ajusta automáticamente mediante una base bruta dividida por la tasa impositiva residual para asegurar el margen neto proyectado.</p>
              </div>
            </div>

            <!-- Sección Datos Técnicos -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>📋 Parámetros de Carga Logística</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>Valores predeterminados configurados para el transporte:</p>
                <ul>
                  <li><strong>Jaula Doble:</strong> 21,500 kg ($3,100 /km)</li>
                  <li><strong>Jaula Simple:</strong> 15,500 kg ($2,500 /km)</li>
                  <li><strong>Margen Operativo:</strong> 10% (Factor 1.1)</li>
                </ul>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);">
            <p style="color: var(--text-muted);">Para soporte técnico o consultas:</p>
            <h3 style="margin-top: 0.5rem; color: var(--primary);">jmiguelhsg@gmail.com</h3>
          </div>
        </div>
      `;

      // Interacción de Acordeones
      content.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
          const item = header.parentElement;
          const isActive = item.classList.contains('active');
          
          // Cerrar otros
          content.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
          
          if (!isActive) item.classList.add('active');
        });
      });
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

document.getElementById('export-pdf').addEventListener('click', () => {
  travelPresenter.openExportOptions();
});
