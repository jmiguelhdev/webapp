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
    if (active) content.innerHTML = `<div class="loading">Cargando...</div>`; 
  },
  hideLoading: () => {},
  showError: (msg) => { content.innerHTML = `<div class="alert error">Error: ${msg}</div>`; },
  renderTravels: (options) => uiLib.renderTravels(content, options),
  renderDashboard: (options) => uiLib.renderDashboard(content, options),
  renderFaenaConsumption: (options) => uiLib.renderFaenaConsumption(content, options),
  renderExportModal: (options) => uiLib.renderExportModal(options),
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
      currentUserRole = await api.fetchUserRole(api.db, user);
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

function getAllowedViews(role) {
  if (role === 'ADMIN') {
    return ['travels', 'dashboard', 'consumption', 'clients', 'simulator', 'settings', 'contact', 'logout'];
  } else if (role === 'OPERARIO') {
    return ['travels', 'dashboard', 'consumption', 'clients', 'simulator', 'contact', 'logout'];
  } else {
    // VISOR
    return ['dashboard', 'simulator', 'contact', 'logout'];
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
    case 'simulator': uiLib.renderSimulator(content); break;
    case 'settings': {
      const loadSettingsData = async () => {
        const prices = await clientRepository.getCategoryPrices();
        const clients = await clientRepository.getClients();
        const camaras = await clientRepository.getCamaras() || [];
        
        let usersList = [];
        if (currentUserRole === 'ADMIN') {
          usersList = await api.fetchAllUsersRoles(api.db);
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
          onSaveUserRole: (email, role) => api.saveUserRole(api.db, email, role),
          onReloadClients: loadSettingsData
        });
      };
      loadSettingsData();
      break;
    }
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

            <!-- NUEVA SECCIÓN: Procesamiento de Faena (PDF) -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>📂 Procesamiento de Faena (PDF)</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>Automatiza la carga de datos extrayendo información directamente de los reportes de faena de los frigoríficos.</p>
                
                <div class="formula-card">
                  <span class="tech-tag">Escaneo</span> Usar "Escanear Carpeta" para procesar múltiples PDFs de una sola vez.
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Vínculo</span> El sistema busca coincidencias por <strong>CUIT</strong> y <strong>Fecha</strong> (±7 días) para asignar los kilos al viaje correspondiente.
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Deduplicación</span> Los archivos ya procesados se omiten automáticamente para evitar duplicar stock.
                </div>
                <p>Al procesar un PDF, el sistema divide cada registro en <strong>dos medias reses</strong> independientes para un control de inventario preciso.</p>
              </div>
            </div>

            <!-- NUEVA SECCIÓN: Módulo de Consumo y Stock -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>🥩 Módulo de Consumo y Stock</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>Gestión dinámica del inventario de piezas faenadas y control de salidas a clientes.</p>
                
                <div class="formula-card">
                  <span class="tech-tag">Stock</span> Visualiza el total de kilos "colgados" y el conteo de piezas por categoría.
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Despacho</span> Seleccionar piezas -> Ingresar Destino -> "🚚 Salida". La pieza pasa de Disponible a Despachada.
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Filtros</span> Búsqueda por Tropa, Garron o Kg, y filtrado rápido por categorías (Chips).
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Historial</span> Registro completo de salidas con filtros de fecha y cliente para auditoría rápida.
                </div>
                <p>El sistema está preparado para futuras integraciones de precios de venta y cuentas corrientes de clientes.</p>
              </div>
            </div>
            
            <!-- NUEVA SECCIÓN: Gestión de Cámaras de Frío -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>❄️ Gestión de Cámaras de Frío</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>Sistema de trazabilidad de ubicación para el acopio de medias reses con control de movimientos:</p>
                
                <div class="formula-card">
                  <span class="tech-tag">Configuración</span> Definir los nombres de las cámaras en ⚙️ Configuración (separados por coma).
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Movimientos</span> Seleccionar piezas en Stock -> "Mover a [Cámara]" -> "Mover". Se registra el historial automático (Log).
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Trazabilidad</span> Cada pieza guarda su historial interno de movimientos: <code>{ de: Cámara A, a: Cámara B, fecha: 01/01 }</code>.
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Filtros</span> Uso de chips dinámicos en el encabezado para aislar el stock por cámara de frío.
                </div>
                <p>Esta funcionalidad asegura que el personal de planta sepa exactamente qué mercadería hay en cada sector de frío en tiempo real.</p>
              </div>
            </div>
            
            <!-- NUEVA SECCIÓN: Gestión de Clientes y Cuentas Corrientes -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>👥 Gestión de Clientes y Cuentas Corrientes</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>Módulo centralizado para la administración de la cartera de clientes y el control de saldos pendientes:</p>
                
                <div class="formula-card">
                  <span class="tech-tag">Configuración</span> Registrar clientes y definir <strong>Precios por Categoría</strong> ($/kg) en la pestaña ⚙️ Configuración.
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Débito Automático</span> Al despachar mercadería (Salida), el sistema genera un movimiento de <strong>DEUDA</strong>: Monto = Kg Despachados × Precio Categoría.
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Crédito Manual</span> Los pagos se registran desde la ficha individual de cada cliente en la sección 👥 Clientes.
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Saldo</span> Saldo Pendiente = ∑ Deuda (Despachos) - ∑ Haber (Pagos)
                </div>
                <p>El historial permite ver el detalle de cada despacho (Garrón, Peso, Precio) para una conciliación rápida con el cliente.</p>
              </div>
            </div>

            <!-- NUEVA SECCIÓN: Gestión de Accesos (RBAC) -->
            <div class="accordion-item">
              <div class="accordion-header">
                <span>🔐 Control de Privilegios y Roles (RBAC)</span>
                <i>▼</i>
              </div>
              <div class="accordion-content">
                <p>Sistema de gestión de accesos basado en roles para asegurar la información de la plataforma.</p>
                
                <div class="formula-card">
                  <span class="tech-tag">Administrador</span> Tiene acceso total a todas las herramientas de la plataforma, incluyendo el panel de Configuración y asignación de permisos a otros usuarios.
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Operario</span> Tiene permiso de escritura para registrar despachos, faenas y ver clientes, pero sin acceso al panel de configuraciones maestras.
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Visor</span> Acceso de solo lectura al dashboard estadístico, simuladores de costos y panel de soporte.
                </div>
                <div class="formula-card">
                  <span class="tech-tag">Seguridad y Alta</span> El primer usuario en iniciar sesión en el sistema obtiene privilegios de <strong>ADMIN</strong> automáticamente. Los nuevos registros son limitados al perfil <strong>VISOR</strong> por defecto hasta ser autorizados.
                </div>
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
