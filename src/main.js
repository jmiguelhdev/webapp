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
import { CheckRepository } from './adapters/repositories/CheckRepository.js';
import { CheckPresenter } from './adapters/presenters/CheckPresenter.js';
import { AccountingRepository } from './adapters/repositories/AccountingRepository.js';
import { AccountingPresenter } from './adapters/presenters/AccountingPresenter.js';
import { LogisticsRepository } from './adapters/repositories/LogisticsRepository.js';
import { LogisticsPresenter } from './adapters/presenters/LogisticsPresenter.js';
import { EstablishmentRepository } from './adapters/repositories/EstablishmentRepository.js';
import { EstablishmentPresenter } from './adapters/presenters/EstablishmentPresenter.js';
import { OperatorRepository } from './adapters/repositories/OperatorRepository.js';
import { SHARED_DATA_SOURCE_UID } from './config.js';

// Render Git commit version badge in header dynamically
try {
  const logoDiv = document.querySelector('.logo');
  if (logoDiv) {
    const versionSpan = document.createElement('span');
    versionSpan.style.fontSize = '0.62rem';
    versionSpan.style.color = 'var(--text-muted)';
    versionSpan.style.background = 'rgba(255, 255, 255, 0.04)';
    versionSpan.style.border = '1px solid var(--border)';
    versionSpan.style.padding = '0.2rem 0.5rem';
    versionSpan.style.borderRadius = '6px';
    versionSpan.style.marginLeft = '0.75rem';
    versionSpan.style.fontFamily = 'monospace';
    versionSpan.style.fontWeight = '600';
    const shortMsg = (__COMMIT_MESSAGE__ || '').substring(0, 10);
    versionSpan.textContent = `v-${shortMsg}`;
    versionSpan.title = `Commit de Git: ${__COMMIT_MESSAGE__} (${__COMMIT_HASH__})`;
    logoDiv.appendChild(versionSpan);
  }
} catch (e) {
  console.warn("Failed to inject git version badge", e);
}

// Dependencies
const travelRepository = new FirebaseTravelRepository();
const clientRepository = new ClientRepository();
const checkRepository = new CheckRepository();
const accountingRepository = new AccountingRepository('accounting_entries');
const frigorificoRepository = new AccountingRepository('frigorifico_entries');
const logisticsRepository = new LogisticsRepository();
const establishmentRepository = new EstablishmentRepository();
const operatorRepository = new OperatorRepository();

// State
let currentUser = null;
let currentUserRole = null; // 'ADMIN', 'OPERARIO', or 'VISOR'

// Acceso compartido desde config.js


// UI elements
const kmpSidebar = document.getElementById('kmp-sidebar');
const content = document.getElementById('content');
const themeToggle = document.getElementById('theme-toggle');
const menuToggle = document.getElementById('menu-toggle');

if (kmpSidebar) {
  kmpSidebar.addEventListener('navigate', (e) => {
    navigateTo(e.detail.view);
  });
}

// Unified UI Interface for Presenter
const uiInterface = {
  showLoading: (active = true) => { 
    if (active) {
      content.innerHTML = `
        <div class="loading-wrapper" id="global-loader">
          <div class="spinner"></div>
          <div>Cargando sistema...</div>
        </div>
      `;
    } else {
      const loader = document.getElementById('global-loader');
      if (loader) loader.remove();
    }
  },
  hideLoading: () => uiInterface.showLoading(false),
  showError: (msg) => { 
    uiInterface.hideLoading();
    content.innerHTML = `<div class="alert error" style="margin: 2rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--danger); border-radius: 12px; color: var(--danger);">
      <strong>⚠️ Error:</strong> ${msg}
      <button onclick="location.reload()" class="btn-primary" style="margin-top: 1rem; display: block; background: var(--danger);">Reintentar</button>
    </div>`; 
  },
  renderTravels: (options) => {
    uiInterface.hideLoading();
    uiLib.renderTravels(content, { ...options, onBack: () => navigateTo('dashboard') });
  },
  renderDashboard: (options) => {
    uiInterface.hideLoading();
    uiLib.renderDashboard(content, options);
  },
  renderFaenaConsumption: (options) => {
    uiInterface.hideLoading();
    uiLib.renderFaenaConsumption(content, { ...options, onBack: () => navigateTo('dashboard') });
  },
  renderScanResultsModal: (options) => uiLib.renderScanResultsModal(options),
  renderExportModal: (options) => uiLib.renderExportModal(options),
  generateTravelReport: (data) => uiLib.generateTravelReport(data),
  generateExcelReport: (data) => uiLib.generateExcelReport(data),
  renderClientAccounts: (options) => uiLib.renderClientAccounts({ ...options, onBackToDashboard: () => navigateTo('dashboard') }),
  renderSaleDetailModal: (sale, productsMap, concept) => uiLib.renderSaleDetailModal(sale, productsMap, concept),
  renderSettlementModal: (travel, producer, options) => uiLib.renderSettlementModal(travel, producer, options),
  renderChecks: (options) => uiLib.renderChecks(content, options),
  renderAccounting: (options) => uiLib.renderAccounting(content, options),
  renderPriceAnalysis: (options) => uiLib.renderPriceAnalysis(content, options),
  generateAccountingExcel: (entries, title) => uiLib.generateAccountingExcel(entries, title),
  renderDateModal: (options) => uiLib.renderDateModal(options),
  generateChecksExcel: (checks, contacts) => uiLib.generateChecksExcel(checks, contacts),
  printChecksReport: (checks, contacts, options) => uiLib.printChecksReport(checks, contacts, options),
  renderLogisticsMaster: (presenter, type, data, deps) => {
    uiInterface.hideLoading();
    window.currentPresenter = presenter; // Hack for HTML inline handlers in LogisticsMastersUI
    uiLib.renderLogisticsMaster(content, type, data, deps);
  },
  showTravelModal: (travel, options) => {
    uiInterface.hideLoading();
    uiLib.showTravelModal(travel, options);
  },
  renderLiquidations: (presenter, travels, drivers) => {
    uiInterface.hideLoading();
    uiLib.renderLiquidations(presenter, travels, drivers);
  },
  renderFuelEfficiency: (presenter, travels, trucks) => {
    uiInterface.hideLoading();
    uiLib.renderFuelEfficiency(presenter, travels, trucks);
  },
  renderEstablishmentManager: (presenter) => {
    uiInterface.hideLoading();
    uiLib.renderEstablishmentManager(content, presenter);
  }
};

const travelPresenter = new TravelPresenter(travelRepository, uiInterface, logisticsRepository, clientRepository);
const consumptionPresenter = new ConsumptionPresenter(travelRepository, uiInterface, clientRepository);
const clientPresenter = new ClientPresenter(clientRepository, operatorRepository, uiInterface);
const checkPresenter = new CheckPresenter(checkRepository, uiInterface, operatorRepository, clientRepository);
const accountingPresenter = new AccountingPresenter(accountingRepository, clientRepository, uiInterface, { 
  title: 'Caja General', 
  syncLabel: 'Pago Caja General' 
});
const frigorificoPresenter = new AccountingPresenter(frigorificoRepository, clientRepository, uiInterface, { 
  title: 'Caja Frigorífico', 
  syncLabel: 'Pago Frigorífico' 
});
const logisticsPresenter = new LogisticsPresenter(logisticsRepository, uiInterface);
const establishmentPresenter = new EstablishmentPresenter(establishmentRepository, uiInterface);

// Auth Global Watcher
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    document.body.classList.add('authenticated');
    
    try {
      // Ensure we have the user role before proceeding
      currentUserRole = await api.fetchUserRole(db, user);
    } catch (e) {
      console.error("Error fetching user role:", e);
      currentUserRole = 'VISOR'; // Fallback
    }

    // Pass role to presenters
    consumptionPresenter.setUserRole(currentUserRole);
    checkPresenter.setUid(user.uid);
    accountingPresenter.setUid(user.uid);
    frigorificoPresenter.setUid(user.uid);

    try {
      if (kmpSidebar) {
        kmpSidebar.setAttribute('role', currentUserRole);
        kmpSidebar.setAttribute('active', 'dashboard');
      }
    } catch (e) {
      console.error("Error setting kmp-sidebar attributes:", e);
    }

    // Default view: Dashboard for everyone
    const startView = 'dashboard';
    navigateTo(startView);
    
    // Auto-load main data
    travelPresenter.loadTravels(SHARED_DATA_SOURCE_UID);
  } else {
    currentUser = null;
    document.body.classList.remove('authenticated');
    showLogin();
  }
});

// Global Logout Listener
window.addEventListener('app:logout', () => {
  signOut(auth).then(() => {
    localStorage.clear();
    location.reload();
  });
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
    return ['travels', 'dashboard', 'consumption', 'clients', 'simulator', 'checks', 'accounting', 'frigorifico', 'settings', 'price-share', 'contact', 'logout', 'master-data', 'logistics-liquidations', 'logistics-fuel', 'establishments'];
  } else if (role === 'OPERARIO') {
    return ['travels', 'dashboard', 'consumption', 'clients', 'simulator', 'checks', 'accounting', 'price-share', 'contact', 'logout', 'logistics-liquidations', 'logistics-fuel'];
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

// Navigation Utility
const navigateTo = (view, role = currentUserRole) => {
  if (kmpSidebar) {
    kmpSidebar.setAttribute('active', view);
  }
  
  if (view === 'logout') {
    window.dispatchEvent(new Event('app:logout'));
    return;
  }

  if (!currentUser && view !== 'simulator') return showLogin();
  
  const allowed = getAllowedViews(role);
  if (!allowed.includes(view)) {
    console.warn(`Access denied to ${view} for role ${role}`);
    alert(`Acceso denegado: No tienes permiso para acceder a esta sección (${view}).`);
    return;
  }

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
    case 'checks':
      checkPresenter.loadData();
      break;
    case 'accounting':
      accountingPresenter.loadData();
      break;
    case 'frigorifico':
      frigorificoPresenter.loadData();
      break;
    case 'establishments':
      establishmentPresenter.loadData();
      break;
    case 'master-data':
      logisticsPresenter.loadTrucks(); // By default load trucks, UI will have tabs
      break;
    case 'logistics-liquidations':
      logisticsPresenter.loadLiquidations();
      break;
    case 'logistics-fuel':
      logisticsPresenter.loadFuelEfficiency();
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
          if (!window.usersListCache) {
            window.usersListCache = await api.fetchAllUsersRoles(db);
          }
          usersList = window.usersListCache;
        }

        uiInterface.hideLoading();

        uiLib.renderSettings(content, { 
          categoryPrices: prices,
          clients: clients,
          camarasList: camaras,
          userRole: currentUserRole,
          usersList: usersList,
          onSavePrices: (newPrices) => clientRepository.saveCategoryPrices(newPrices),
          onSaveClient: (client) => clientRepository.saveClient(client),
          onSaveCamaras: (list) => clientRepository.saveCamaras(list),
          onSaveUserRole: async (uid, role) => {
            await api.saveUserRole(db, uid, role);
            window.usersListCache = null; // Clear cache on update
          },
          onDeleteUser: async (uid) => {
            await api.deleteUserMetadata(db, uid);
            window.usersListCache = null; // Clear cache on delete
            await loadSettingsData(); // Refresh the view
          },
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
                <p>Módulo centralizado para la administración de clientes, control de saldos pendientes y análisis de precio promedio:</p>
                <div class="formula-card"><span class="tech-tag">Débito Automático</span> Al despachar mercadería, se genera una <strong>DEUDA</strong>: Monto = Kg × Precio Categoría.</div>
                <div class="formula-card"><span class="tech-tag">Saldo</span> Saldo Pendiente = ∑ Deuda (Despachos) - ∑ Haber (Pagos)</div>
                <div class="formula-card"><span class="tech-tag">Análisis</span> <strong>Precio Promedio</strong> = Compara el Precio Real por Kg (venta externa) vs lo despachado automáticamente.</div>
                <p>Los pagos e imputaciones se registran manualmente desde la ficha individual de cada cliente, con un historial completo de operaciones.</p>
              </div>
            </div>

            <!-- NUEVA SECCIÓN: Placa de Precios -->
            <div class="accordion-item">
              <div class="accordion-header"><span>📲 Placa de Precios y Cotizaciones</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Herramienta diseñada para generar listas de precios visualmente atractivas listas para compartir.</p>
                <div class="formula-card"><span class="tech-tag">Diseño</span> Renderizado en vivo con animaciones y modo presentación a pantalla completa (Full Screen).</div>
                <div class="formula-card"><span class="tech-tag">Compartir</span> Generación de captura rápida mediante el botón de exportación integrado en la vista.</div>
                <p>Los precios exhibidos se alimentan de la "Configuración General" administrada por los perfiles jerárquicos.</p>
              </div>
            </div>

            <!-- SECCIÓN: Gestión de Cheques – Documentación completa -->
            <div class="accordion-item">
              <div class="accordion-header"><span>💸 Gestión Integral de Cheques – Proceso y Cálculos</span><i>▼</i></div>
              <div class="accordion-content">

                <p>El módulo de cheques permite administrar el ciclo de vida completo de cheques de pago diferido (físicos o eCheqs): desde la compra a un vendedor hasta la venta o acreditación, registrando automáticamente todos los cálculos financieros.</p>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--primary);">📥 Proceso de Compra (Ingreso al Sistema)</h4>
                <p>Al registrar una compra se cargan los siguientes datos:</p>
                <div class="formula-card"><span class="tech-tag">Datos del Cheque</span> Banco · Número de cheque · Valor Nominal · Fecha de Emisión · Fecha de Recepción · Fecha de Pago · Días de Clearing</div>
                <div class="formula-card"><span class="tech-tag">Datos del Librador</span> Nombre / Razón Social · CUIT del librador. El botón <strong>BCRA</strong> copia el CUIT y abre la Central de Deudores del BCRA para verificar la situación crediticia del firmante.</div>
                <div class="formula-card"><span class="tech-tag">Compra (Origen)</span> Vendedor (contacto del sistema) · Pesificación (%) · Interés Mensual (%)</div>

                <p>Con esos datos el sistema calcula automáticamente:</p>
                <div class="formula-card"><span class="tech-tag">Días Totales</span> Días = (Fecha de Pago − Fecha de Recepción) + Clearing</div>
                <div class="formula-card"><span class="tech-tag">Neto Compra</span> Neto Compra = Nominal − (Nominal × Pesif.%) − (Nominal × InterésMensual% / 30 × Días)</div>
                <div class="formula-card"><span class="tech-tag">Descuento Compra</span> Descuento = Nominal − Neto Compra → es la ganancia capturada en el momento de comprar, independientemente de si luego se vende o cobra directamente.</div>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--success);">📤 Proceso de Venta (Salida del Sistema)</h4>
                <p>Cuando el cheque se vende a un tercero se registra el lado de venta con:</p>
                <div class="formula-card"><span class="tech-tag">Venta (Destino)</span> Comprador · Pesificación (%) · Interés Mensual (%) · Estado · Motivo de retorno (si aplica)</div>
                <div class="formula-card"><span class="tech-tag">Neto Venta</span> Neto Venta = Nominal − (Nominal × Pesif.%) − (Nominal × InterésMensual% / 30 × Días)</div>
                <div class="formula-card"><span class="tech-tag">Ganancia Realizada</span> Ganancia = Neto Venta − Neto Compra → el spread entre lo que se pagó y lo que se cobró por el cheque.</div>

                <p><strong>Ejemplo numérico:</strong> Cheque de $100.000 a 60 días.</p>
                <div class="formula-card"><span class="tech-tag">Compra</span> Pesif. 1% + Interés 2%/mes → Neto Compra = $100.000 − $1.000 − $4.000 = <strong>$95.000</strong></div>
                <div class="formula-card"><span class="tech-tag">Venta</span> Pesif. 0.5% + Interés 1.5%/mes → Neto Venta = $100.000 − $500 − $3.000 = <strong>$96.500</strong></div>
                <div class="formula-card"><span class="tech-tag">Ganancia</span> $96.500 − $95.000 = <strong>$1.500 (spread)</strong></div>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--primary);">🔄 Ciclo de Vida y Estados</h4>
                <div class="formula-card"><span class="tech-tag">EN CARTERA</span> Cheque comprado, sin venta activa. Período de espera hasta la fecha de pago.</div>
                <div class="formula-card"><span class="tech-tag">🔔 PAGO EN Xd</span> La fecha de pago se acerca en los próximos 10 días. Aviso preventivo.</div>
                <div class="formula-card"><span class="tech-tag">✅ DISPONIBLE</span> La fecha de pago ya pasó y el cheque está dentro del período de gracia de 30 días del BCRA. Se puede cobrar o seguir negociando.</div>
                <div class="formula-card"><span class="tech-tag">⏳ PRÓXIMO A VENCER</span> Quedan 10 días o menos del período de gracia de 30 días. <strong>Urgente:</strong> gestionar antes del vencimiento definitivo.</div>
                <div class="formula-card"><span class="tech-tag">⛔ VENCIDO</span> Pasaron los 30 días de gracia desde la fecha de pago. El cheque ya no es cobrable de forma ordinaria.</div>
                <div class="formula-card"><span class="tech-tag">DEVUELTO</span> El cheque fue rechazado por el comprador y regresó a Cartera. Puede ser renegociado o gestionado con el librador.</div>
                <div class="formula-card"><span class="tech-tag">VENDIDO</span> Operación completa. La ganancia realizada se acumula en el total de la sección.</div>
                <div class="formula-card"><span class="tech-tag">RECHAZADO</span> Cheque sin fondos o con problema bancario. Queda en Operaciones Realizadas sin ganancia.</div>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--success);">📊 Indicadores del Panel</h4>
                <div class="formula-card"><span class="tech-tag">Ganancia Vendida</span> Suma de <code>profit</code> de todos los cheques con estado VENDIDO. Solo incluye ganancias ya realizadas.</div>
                <div class="formula-card"><span class="tech-tag">Desc. en Cartera</span> Suma de los descuentos de compra (Nominal − Neto Compra) de todos los cheques aún en cartera. Representa la ganancia potencial ya capturada pero no realizada.</div>
                <div class="formula-card"><span class="tech-tag">Capital en Cartera</span> Suma del Valor Nominal de todos los cheques en cartera. Indica la exposición nominal total.</div>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--primary);">⚡ Operaciones Masivas</h4>
                <div class="formula-card"><span class="tech-tag">Compra Masiva</span> Permite cargar múltiples cheques en una sola sesión con datos comunes compartidos (vendedor, pesificación, intereses) y datos individuales por cheque (banco, número, nominal, fechas, librador, CUIT).</div>
                <div class="formula-card"><span class="tech-tag">Venta Masiva</span> Seleccionar múltiples cheques de la tabla de Cartera con los checkboxes y aplicar condiciones de venta unificadas a todo el lote simultáneamente.</div>

                <h4 style="margin: 1.25rem 0 0.5rem; color: var(--primary);">⚖️ Marco Regulatorio BCRA</h4>
                <div class="formula-card"><span class="tech-tag">Período de Gracia</span> El BCRA establece un período de 30 días corridos después de la fecha de pago para presentar el cheque al cobro. Pasado ese plazo, el cheque prescribe.</div>
                <div class="formula-card"><span class="tech-tag">Central de Deudores</span> Disponible en <strong>bcra.gob.ar/situacion-crediticia</strong>. Permite verificar el historial crediticio del firmante (librador) antes de aceptar un cheque. El sistema facilita el acceso con un solo clic desde el formulario.</div>

              </div>
            </div>

            <!-- NUEVA SECCIÓN: Caja General y Contabilidad -->
            <div class="accordion-item">
              <div class="accordion-header"><span>💰 Caja General y Arqueo Físico</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Sistema contable principal para asentar ingresos, egresos, anticipos impositivos y reportes de liquidez bruta.</p>
                <div class="formula-card"><span class="tech-tag">Balance</span> Sistema de registro por partida simple con Saldos arrastrados dinámicamente.</div>
                <div class="formula-card"><span class="tech-tag">Arqueo Visual</span> "Validación Física" con sumatoria de denominación de billetes para control de caja frente a desfasajes operacionales.</div>
                <p>Permite exportación avanzada directa a Microsoft Excel (.XLSX) con tablas debidamente ordenadas.</p>
              </div>
            </div>

            <!-- NUEVA SECCIÓN: Caja Frigorífico -->
            <div class="accordion-item">
              <div class="accordion-header"><span>🏢 Caja Frigorífico</span><i>▼</i></div>
              <div class="accordion-content">
                <p>Contabilidad paralela específica y cerrada, dedicada al establecimiento o planta matadero.</p>
                <div class="formula-card"><span class="tech-tag">Objetivo</span> Aislar impositivamente los gastos operativos estructurales (mantenimiento, servicios directos) de la rentabilidad cárnica.</div>
                <p>Comparte la misma topología de arqueo, filtros avanzados para cierres contables y la arquitectura base de la Contabilidad General.</p>
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

// Event listener for in-screen navigation (like back buttons)
window.addEventListener('nav:dashboard', () => navigateTo('dashboard'));

// Expose routing and presenter globally for dashboard metrics interactions
window.travelPresenter = travelPresenter;
window.navigateTo = navigateTo;
