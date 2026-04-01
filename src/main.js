// src/main.js
import './style.css';
import { auth } from './firebase.js';
import { CostSimulator } from './domain/entities/CostSimulator.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import * as api from './api.js';
import * as uiLib from './ui.js';
import { FirebaseTravelRepository } from './adapters/repositories/TravelRepository.js';
import { TravelPresenter } from './adapters/presenters/TravelPresenter.js';
import { ConsumptionPresenter } from './adapters/presenters/ConsumptionPresenter.js';
import { SHARED_DATA_SOURCE_UID } from './config.js';

// Dependencies
const travelRepository = new FirebaseTravelRepository();

// State
let currentUser = null;

// Acceso compartido desde config.js


// UI elements
const entityList = document.getElementById('entity-list');
const content = document.getElementById('content');
const themeToggle = document.getElementById('theme-toggle');
const menuToggle = document.getElementById('menu-toggle');

// Unified UI Interface for Presenter
const uiInterface = {
  showLoading: () => { content.innerHTML = `<div class="loading">Cargando...</div>`; },
  hideLoading: () => {}, // Handled by updateView rendering over the container
  showError: (msg) => { content.innerHTML = `<div class="alert error">Error: ${msg}</div>`; },
  renderTravels: (options) => uiLib.renderTravels(content, options),
  renderDashboard: (options) => uiLib.renderDashboard(content, options),
  renderFaenaConsumption: (options) => uiLib.renderFaenaConsumption(content, options),
  renderExportModal: (options) => uiLib.renderExportModal(options),
  renderScanResultsModal: (options) => uiLib.renderScanResultsModal(options),
  generateTravelReport: (data) => uiLib.generateTravelReport(data),
  generateExcelReport: (data) => uiLib.generateExcelReport(data)
};

const travelPresenter = new TravelPresenter(travelRepository, uiInterface);
const consumptionPresenter = new ConsumptionPresenter(travelRepository, uiInterface);

// Auth Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.body.classList.add('authenticated');
    
    // Todos los usuarios autentificados pueden acceder a la app
    // Usamos el UID compartido para que todos vean la misma base de datos global
    const uidToLoad = SHARED_DATA_SOURCE_UID;

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
      
      <button id="google-login-btn" class="btn-google">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
        Continuar con Google
      </button>

      <div class="auth-divider">
        <span>o usa tu correo</span>
      </div>

      <form id="login-form">
        <div class="form-group"><label>Correo Electrónico</label><input type="email" id="login-email" required></div>
        <div class="form-group"><label>Contraseña</label><input type="password" id="login-pass" required></div>
        <button type="submit" class="btn-primary">Ingresar</button>
      </form>
      <p id="login-error" class="text-danger" style="margin-top: 1rem;"></p>
    </div>
  `;

  document.getElementById('google-login-btn').addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      document.getElementById('login-error').textContent = e.message;
    }
  });

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
    case 'consumption':
      consumptionPresenter.loadFaenas(SHARED_DATA_SOURCE_UID);
      break;
    case 'simulator': uiLib.renderSimulator(content); break;
    case 'settings': uiLib.renderSettings(content); break;
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

            <!-- Sección Dashboard de Tendencias -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>📊 Dashboard de Tendencias Históricas</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>El Dashboard ofrece una vista analítica de rendimiento y precio promedio a lo largo del tiempo, con filtros por categoría y comisionista.</p>
                
                <div class="formula-card">
                  <span class="tech-tag">Uso</span> Navegar a 📊 Dashboard desde el menú lateral
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Filtros</span> Seleccionar categorías (chips) para aislar datos por tipo de hacienda
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Gráficos</span> Tendencia de precio $/kg por viaje • Distribución por categoría • Evolución de volumen
                </div>
                <p>Los viajes en estado <strong>BORRADOR</strong> son excluidos automáticamente de todas las métricas y gráficos para garantizar la precisión del análisis.</p>
              </div>
            </div>

            <!-- Sección Exportación PDF -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>📄 Exportación de Reportes PDF</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>Genera reportes profesionales listos para compartir por WhatsApp o email directamente desde la app.</p>
                
                <div class="formula-card">
                  <span class="tech-tag">Acceso</span> Tocar el botón 📄 en la esquina superior derecha del header
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Opción 1</span> Últimos N viajes — seleccionar cantidad desde los más recientes
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Opción 2</span> Rango de fechas — definir fecha inicio y fin para el reporte
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Contenido</span> Resumen viaje por viaje con métricas de operación, kg, precio promedio y desglose por productor
                </div>
                <p>Los borradores nunca se incluyen en los reportes exportados. El PDF se genera con <strong>jsPDF</strong> y se descarga automáticamente.</p>
              </div>
            </div>

            <!-- Sección Inteligencia de Mercado -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>📈 Inteligencia de Mercado (MAG)</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>Compara tus costos de compra contra los precios de referencia del Mercado Agroganadero (MAG) en tiempo real.</p>
                
                <div class="formula-card">
                  <span class="tech-tag">Activación</span> Seleccionar UNA categoría específica en los filtros de Viajes (ej: NOVILLO, VACA)
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Cálculo</span> Brecha (%) = ((Tu Precio - Precio MAG) / Precio MAG) × 100
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Lectura</span> 🟢 Verde = comprás por debajo del mercado • 🔴 Rojo = comprás por encima
                </div>
                <p>La tarjeta de <strong>"Vs Mercado (MAG)"</strong> aparece automáticamente cuando filtras por una sola categoría. Los precios MAG se actualizan periódicamente.</p>
              </div>
            </div>

            <!-- Sección Tarjetas de Productor -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>👤 Tarjetas de Productor</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>Cada viaje muestra una tarjeta detallada por productor con información fiscal y operativa.</p>
                
                <div class="formula-card">
                  <span class="tech-tag">Identidad</span> Nombre del productor, CUIT y CBU (si están cargados en la app KMP)
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Impuestos</span> IVA total y Ganancias total — sumados de todos los productos del productor
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Productos</span> Listado con cantidad, kg limpios y total factura por producto
                </div>
                <p>Los badges <span style="color: #3b82f6;">IVA</span> (azul) y <span style="color: #f59e0b;">Ganancias</span> (ámbar) solo aparecen si tienen valor mayor a cero.</p>
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
