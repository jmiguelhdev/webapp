// src/main.js
import './style.css';
import { auth, db } from './firebase.js';
import { CostSimulator } from './domain/entities/CostSimulator.js';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import * as api from './api.js';
import * as uiLib from './ui.js';
import { FirebaseTravelRepository } from './adapters/repositories/TravelRepository.js';
import { TravelPresenter } from './adapters/presenters/TravelPresenter.js';
import { ConsumptionPresenter } from './adapters/presenters/ConsumptionPresenter.js';
import { ClientPresenter } from './adapters/presenters/ClientPresenter.js';
import { ClientRepository } from './adapters/repositories/ClientRepository.js';
import { SHARED_DATA_SOURCE_UID } from './config.js';

// Dependencies
const travelRepository = new FirebaseTravelRepository();
const clientRepository = new ClientRepository();

// State
let currentUser = null;
let currentUserRole = null; // 'ADMIN', 'OPERARIO', or 'VISOR'

// Acceso compartido desde config.js


// UI elements
const entityList = document.getElementById('entity-list');
const content = document.getElementById('content');
const themeToggle = document.getElementById('theme-toggle');
const menuToggle = document.getElementById('menu-toggle');

// Unified UI Interface for Presenter
const uiInterface = {
  showLoading: (active = true) => { 
    if (active) {
      content.innerHTML = `
        <div class="loading-wrapper">
          <div class="spinner"></div>
          <div>Cargando sistema...</div>
        </div>
      `;
    } 
  },
  hideLoading: () => {},
  showError: (msg) => { content.innerHTML = `<div class="alert error">Error: ${msg}</div>`; },
  renderTravels: (options) => uiLib.renderTravels(content, { ...options, onBack: () => navigateTo('dashboard') }),
  renderDashboard: (options) => uiLib.renderDashboard(content, options),
  renderFaenaConsumption: (options) => uiLib.renderFaenaConsumption(content, { ...options, onBack: () => navigateTo('dashboard') }),
  renderClientAccounts: (options) => uiLib.renderClientAccounts({ ...options, onBackToDashboard: () => navigateTo('dashboard') }),
  renderScanResultsModal: (options) => uiLib.renderScanResultsModal(options),
  generateTravelReport: (data) => uiLib.generateTravelReport(data),
  generateExcelReport: (data) => uiLib.generateExcelReport(data),
  renderClientAccounts: (options) => uiLib.renderClientAccounts(options),
  renderSettlementModal: (travel, producer, options) => uiLib.renderSettlementModal(travel, producer, options)
};

const travelPresenter = new TravelPresenter(travelRepository, uiInterface);
const consumptionPresenter = new ConsumptionPresenter(travelRepository, uiInterface, clientRepository);
const clientPresenter = new ClientPresenter(clientRepository, uiInterface);

// Auth Listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    document.body.classList.add('authenticated');
    
    // Fetch user role
    uiInterface.showLoading(true);
    try {
      currentUserRole = await api.fetchUserRole(db, user);
    } catch (e) {
      console.error("Error fetching role:", e);
      currentUserRole = 'VISOR'; // fallback
    }
    uiInterface.hideLoading();
    
    enforcePermissions(currentUserRole);

    // Todos los usuarios autentificados pueden acceder a la app
    // Usamos el UID compartido para que todos vean la misma base de datos global
    const uidToLoad = SHARED_DATA_SOURCE_UID;

    // Check if the current view (or 'travels') is allowed
    const startView = (currentUserRole === 'VISOR') ? 'dashboard' : 'travels';
    navigateTo(startView);
    travelPresenter.loadTravels(SHARED_DATA_SOURCE_UID);
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
      <p>Inicia sesión mediante Google para continuar.</p>
      
      <button id="google-login-btn" class="btn-google">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
        Continuar con Google
      </button>

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
}

function getAllowedViews(role) {
  if (role === 'ADMIN') {
    return ['travels', 'dashboard', 'consumption', 'clients', 'simulator', 'settings', 'price-share', 'contact', 'logout'];
  } else if (role === 'OPERARIO') {
    return ['travels', 'dashboard', 'consumption', 'clients', 'simulator', 'price-share', 'contact', 'logout'];
  } else {
    // VISOR
    return ['dashboard', 'simulator', 'price-share', 'contact', 'logout'];
  }
}

function enforcePermissions(role) {
  const allowed = getAllowedViews(role);
  document.querySelectorAll('#entity-list li').forEach(li => {
    const view = li.dataset.view;
    if (view && !allowed.includes(view)) {
      li.style.display = 'none';
    } else {
      li.style.display = 'block';
    }
  });
}

function navigateTo(view) {
  document.body.classList.remove('full-screen-view');
  if (!currentUser && view !== 'simulator' && view !== 'logout') return showLogin();
  
  if (currentUser) {
    const allowed = getAllowedViews(currentUserRole);
    if (!allowed.includes(view)) {
      alert(`Acceso denegado: No tienes permiso para acceder a esta sección (${view}).`);
      return;
    }
  }

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
    case 'clients':
      clientPresenter.loadClients();
      break;
    case 'simulator': uiLib.renderSimulator(content, { onBack: () => navigateTo('dashboard') }); break;
    case 'settings': {
      uiInterface.showLoading(true);
      const loadSettingsData = async () => {
        const prices = await clientRepository.getCategoryPrices();
        const clients = await clientRepository.getClients();
        const camaras = await clientRepository.getCamaras() || [];
        
        let usersList = [];
        if (currentUserRole === 'ADMIN') {
          usersList = await api.fetchAllUsersRoles(db);
        }

        uiLib.renderSettings(content, { 
          categoryPrices: prices,
          clients: clients,
          camarasList: camaras,
          userRole: currentUserRole,
          usersList: usersList,
          onSavePrices: (newPrices) => clientRepository.saveCategoryPrices(newPrices),
          onSaveClient: (client) => clientRepository.saveClient(client),
          onSaveCamaras: (list) => clientRepository.saveCamaras(list),
          onSaveUserRole: (uid, role) => api.saveUserRole(db, uid, role),
          onReloadClients: loadSettingsData,
          onPriceShare: () => navigateTo('price-share'),
          onBack: () => navigateTo('dashboard')
        });
      };
      loadSettingsData();
      break;
    }
    case 'price-share': {
      document.body.classList.add('full-screen-view');
      uiInterface.showLoading(true);
      const loadPriceData = async () => {
        const prices = await clientRepository.getCategoryPrices();
        uiLib.renderPriceShare(content, { 
          prices, 
          onBack: () => {
            document.body.classList.remove('full-screen-view');
            navigateTo('settings');
          }
        });
      };
      loadPriceData();
      break;
    }
    case 'contact': {
      document.body.classList.remove('full-screen-view');
      content.innerHTML = `
        <div class="dashboard-header" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem;">
          <button id="back-to-dash" class="back-btn-m3" title="Volver al Dashboard">
            <svg viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path></svg>
          </button>
          <h2 style="margin: 0;">Centro de Documentación Técnica</h2>
        </div>
        <div class="glass-card" style="padding: 2rem; width: 100%;">
          <div class="accordion">
            <!-- Sección Viajes -->
            <div class="accordion-item">
              <div class="accordion-header"><span>🚛 Gestión de Viajes y Métricas</span><i>▼</i></div>
              <div class="accordion-content">
                <p>La sección de viajes procesa datos operativos para generar reportes financieros precisos. Las métricas se calculan dinámicamente según los filtros de categoría seleccionados:</p>
                <div class="formula-card"><span class="tech-tag">Cálculo</span> Precio Promedio = Total Operación / ∑ Kg Limpios</div>
                <div class="formula-card"><span class="tech-tag">Cálculo</span> Precio c/ Comis. = (Total Operación + Comisión Agente) / ∑ Kg Limpios</div>
                <div class="formula-card"><span class="tech-tag">Cálculo</span> Peso Media Res Prom. = ∑ Kg Limpios / Total Unidades</div>
                <p>El sistema también monitorea la relación <strong>Factura vs. Operación</strong> para detectar desviaciones impositivas o administrativas.</p>
              </div>
            </div>

            <!-- Sección Simulador -->
            <div class="accordion-item">
              <div class="accordion-header"><span>🧮 Algoritmos del Simulador de Costo</span><i>▼</i></div>
              <div class="accordion-content">
                <p>El simulador utiliza un modelo de costos en cascada para proyectar la utilidad final basada en la logística y el rendimiento de faena:</p>
                <div class="formula-card"><span class="tech-tag">Logística</span> Kg Faena = Kg Vivos * (Rendimiento / 100)</div>
                <div class="formula-card"><span class="tech-tag">Hacienda</span> Costo Inic. (Carne) = Precio Vivo / (Rendimiento / 100)</div>
                <div class="formula-card"><span class="tech-tag">Flete</span> Costo Flete (Carne) = (Distancia * $/km) / Kg Faena</div>
                <div class="formula-card"><span class="tech-tag">Impuestos</span> Tasa Efectiva = Margen * (IIBB / 100)</div>
                <div class="formula-card"><span class="tech-tag">Venta</span> Factura Venta = Costo Final * Margen Ganancia</div>
                <div class="formula-card"><span class="tech-tag">Final</span> Utilidad Total = (Precio Venta - Costo Final) * Kg Faena</div>
                <p>Nota: El costo final se ajusta automáticamente mediante una base bruta dividida por la tasa impositiva residual para asegurar el margen neto proyectado.</p>
              </div>
            </div>

            <!-- Sección Datos Técnicos -->
            <div class="accordion-item">
              <div class="accordion-header"><span>📋 Parámetros de Carga Logística</span><i>▼</i></div>
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
              <div class="accordion-header"><span>📊 Dashboard de Tendencias Históricas</span><i>▼</i></div>
              <div class="accordion-content">
                <p>El Dashboard ofrece una vista analítica de rendimiento y precio promedio a lo largo del tiempo, con filtros por categoría y comisionista.</p>
                <div class="formula-card"><span class="tech-tag">Filtros</span> Seleccionar categorías (chips) para aislar datos por tipo de hacienda</div>
                <div class="formula-card"><span class="tech-tag">Gráficos</span> Tendencia de precio $/kg por viaje • Distribución por categoría • Evolución de volumen</div>
                <p>Los viajes en estado <strong>BORRADOR</strong> son excluidos automáticamente de todas las métricas y gráficos para garantizar la precisión del análisis.</p>
              </div>
            </div>

            <!-- Sección Exportación PDF -->
            <div class="accordion-item">
              <div class="accordion-header"><span>📄 Exportación de Reportes PDF</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Genera reportes profesionales listos para compartir por WhatsApp o email directamente desde la app.</p>
                <div class="formula-card"><span class="tech-tag">Acceso</span> Tocar el botón 📄 en la esquina superior derecha del header</div>
                <div class="formula-card"><span class="tech-tag">Opciones</span> Selección por últimos N viajes o por rango de fechas</div>
                <p>Los borradores nunca se incluyen en los reportes exportados. El PDF se genera con <strong>jsPDF</strong> y se descarga automáticamente.</p>
              </div>
            </div>

            <!-- Sección Inteligencia de Mercado -->
            <div class="accordion-item">
              <div class="accordion-header"><span>📈 Inteligencia de Mercado (MAG)</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Compara tus costos de compra contra los precios de referencia del Mercado Agroganadero (MAG) en tiempo real.</p>
                <div class="formula-card"><span class="tech-tag">Cálculo</span> Brecha (%) = ((Tu Precio - Precio MAG) / Precio MAG) × 100</div>
                <div class="formula-card"><span class="tech-tag">Lectura</span> 🟢 Verde = comprás por debajo del mercado • 🔴 Rojo = comprás por encima</div>
                <p>Esta tarjeta aparece automáticamente cuando filtras por una sola categoría.</p>
              </div>
            </div>

            <!-- Sección Tarjetas de Productor -->
            <div class="accordion-item">
              <div class="accordion-header"><span>👤 Tarjetas de Productor</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Cada viaje muestra una tarjeta detallada por productor con información fiscal y operativa.</p>
                <div class="formula-card"><span class="tech-tag">Identidad</span> Nombre, CUIT y CBU (si existen en la app KMP)</div>
                <div class="formula-card"><span class="tech-tag">Impuestos</span> IVA y Ganancias sumados de todos los productos del productor</div>
                <p>Los badges <span style="color: #3b82f6;">IVA</span> y <span style="color: #f59e0b;">Ganarias</span> aparecen solo si el valor es mayor a cero.</p>
              </div>
            </div>

            <!-- NUEVA SECCIÓN: Procesamiento de Faena (PDF) -->
            <div class="accordion-item">
              <div class="accordion-header"><span>📂 Procesamiento de Faena (PDF)</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Automatiza la carga de datos extrayendo información directamente de los reportes de faena de los frigoríficos.</p>
                <div class="formula-card"><span class="tech-tag">Vínculo</span> Búsqueda por <strong>CUIT</strong> y <strong>Fecha</strong> (±7 días) para asignar los kilos al viaje correspondiente.</div>
                <div class="formula-card"><span class="tech-tag">Deduplicación</span> Los archivos ya procesados se omiten automáticamente para evitar duplicar stock.</div>
                <p>El sistema divide cada registro en <strong>dos medias reses</strong> independientes para un control de inventario preciso.</p>
              </div>
            </div>

            <!-- NUEVA SECCIÓN: Módulo de Consumo y Stock -->
            <div class="accordion-item">
              <div class="accordion-header"><span>🥩 Módulo de Consumo y Stock</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Gestión dinámica del inventario de piezas faenadas y control de salidas a clientes.</p>
                <div class="formula-card"><span class="tech-tag">Despacho</span> Seleccionar piezas -> Ingresar Destino -> "🚚 Salida". La pieza pasa de Disponible a Despachada.</div>
                <p>Visualiza el total de kilos "colgados" y el conteo de piezas por categoría en tiempo real.</p>
              </div>
            </div>
            
            <!-- NUEVA SECCIÓN: Gestión de Cámaras de Frío -->
            <div class="accordion-item">
              <div class="accordion-header"><span>❄️ Gestión de Cámaras de Frío</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Sistema de trazabilidad de ubicación para el acopio de medias reses con control de movimientos:</p>
                <div class="formula-card"><span class="tech-tag">Movimientos</span> Seleccionar stock -> "Mover a [Cámara]" -> "Mover". Se registra historial (Log).</div>
                <div class="formula-card"><span class="tech-tag">Trazabilidad</span> Cada pieza guarda su historial completo de ubicaciones anteriores.</div>
                <p>Asegura que el personal sepa exactamente qué mercadería hay en cada sector de frío.</p>
              </div>
            </div>
            
            <!-- NUEVA SECCIÓN: Gestión de Clientes y Cuentas Corrientes -->
            <div class="accordion-item">
              <div class="accordion-header"><span>👥 Gestión de Clientes y Cuentas Corrientes</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Módulo centralizado para la administración de clientes y control de saldos pendientes:</p>
                <div class="formula-card"><span class="tech-tag">Débito Automático</span> Al despachar mercadería, se genera una <strong>DEUDA</strong>: Monto = Kg × Precio Categoría.</div>
                <div class="formula-card"><span class="tech-tag">Saldo</span> Saldo Pendiente = ∑ Deuda (Despachos) - ∑ Haber (Pagos)</div>
                <p>Los pagos se registran manualmente desde la ficha individual de cada cliente.</p>
              </div>
            </div>
            
            <!-- NUEVA SECCIÓN: Gestión de Accesos (RBAC) -->
            <div class="accordion-item">
              <div class="accordion-header"><span>🔐 Control de Privilegios y Roles (RBAC)</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Sistema de gestión de accesos basado en roles para asegurar la información de la plataforma.</p>
                <div class="formula-card"><span class="tech-tag">Admin</span> Acceso total. <span class="tech-tag">Operario</span> Escritura limitada (despachos/stock). <span class="tech-tag">Visor</span> Solo lectura.</div>
                <p>El primer usuario es ADMIN automáticamente. Los nuevos registros son VISOR por defecto.</p>
              </div>
            </div>
          </div>
          <div style="text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);">
            <p style="color: var(--text-muted);">Soporte: jmiguelhsg@gmail.com</p>
          </div>
        </div>
      `;
      content.querySelector('#back-to-dash').onclick = () => navigateTo('dashboard');
      content.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
          const item = header.parentElement;
          const isActive = item.classList.contains('active');
          content.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
          if (!isActive) item.classList.add('active');
        });
      });
      break;
    }


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
