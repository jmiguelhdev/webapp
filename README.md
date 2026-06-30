# web app piola jmhsg- Sistema de Gestión Integral

Bienvenido a **web app piola**, una plataforma de alta gama diseñada para la administración total de operaciones ganaderas, financieras y logísticas. Este ecosistema digital centraliza desde la compra de hacienda y su procesamiento en faena hasta la gestión de carteras de cheques y contabilidad de cajas.

Construido con **Vite**, **Firebase** y **Express**, ofrece una experiencia fluida, segura y altamente analítica.

---

## 🚀 Módulos del Sistema

### 📊 Dashboard Analítico
- **Métricas en Tiempo Real:** Visualización de rendimiento, volumen de carga y precios promedio.
- **Tendencias Históricas:** Gráficos dinámicos con filtros por categoría y comisionista.
- **Inteligencia de Mercado (MAG):** Comparativa automática de tus costos de compra contra los precios de referencia del Mercado Agroganadero en tiempo real.

### 🚛 Gestión de Viajes y Logística
- **Control Operativo:** Seguimiento detallado de cada viaje, incluyendo flete, comisiones y gastos asociados.
- **Procesamiento de Faena (PDF):** Automatización mediante la extracción de datos de reportes de frigoríficos, vinculando kilos y unidades a viajes específicos mediante CUIT y fecha.
- **Reportes Profesionales:** Generación de informes en PDF listos para compartir vía WhatsApp o email.

### 💰 Cajas y Contabilidad
- **Caja General:** Asiento de ingresos, egresos y anticipos impositivos con balance dinámico.
- **Caja Frigorífico:** Contabilidad aislada para gastos estructurales y operativos de la planta.
- **Arqueo Físico:** Herramienta de validación visual con sumatoria por denominación de billetes para control de caja física.
- **Exportación:** Generación de archivos Excel (.XLSX) estructurados para cierres contables.

### 💸 Gestión Integral de Cheques
- **Ciclo de Vida Completo:** Administración de cheques físicos y eCheqs desde la compra hasta su acreditación o venta.
- **Cálculos Financieros Automáticos:** Gestión de pesificación, intereses mensuales, días de clearing y cálculo de ganancia capturada vs. realizada.
- **Integración BCRA:** Acceso directo a la Central de Deudores con un clic para verificar la situación crediticia del librador.
- **Operaciones Masivas:** Carga y venta de lotes de cheques para optimizar el flujo de trabajo.

### 🥩 Consumo, Stock y Cámaras
- **Inventario de Piezas:** Control de stock de medias reses con trazabilidad desde la faena.
- **Gestión de Cámaras:** Seguimiento de ubicación de mercadería en diferentes cámaras de frío con historial de movimientos.
- **Despacho Dinámico:** Gestión de salidas a clientes con actualización automática de inventario.

### 👥 Clientes y Cuentas Corrientes
- **Cuentas Claras:** Seguimiento de saldos, débitos por despachos y créditos por pagos.
- **Análisis de Precio:** Comparativa entre el precio real de venta y los valores de despacho programados.
- **Operadores y Productores:** Unificación de contactos para una gestión contable coherente.

### 🧮 Simulador de Costos
- **Proyecciones Financieras:** Modelo de costos en cascada para proyectar utilidad basada en logística, rendimiento de faena e impuestos.
- **Ajuste de Margen:** Cálculo automático de precios de venta necesarios para asegurar márgenes netos específicos.

---

## 🛠️ Configuración y Despliegue

### Requisitos
- **Node.js**: v18.0.0+
- **Firebase Project**: Firestore, Auth (Google) y Storage habilitados.

### Variables de Entorno (`.env`)
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### Instalación
```bash
npm install
npm run dev # Desarrollo
npm run build # Producción
```

---

## 🔐 Seguridad y Roles (RBAC)
El sistema implementa un control de acceso basado en roles:
- **ADMIN**: Control total del sistema, configuración de precios y gestión de usuarios.
- **OPERARIO**: Acceso a carga operativa, gestión de stock y despachos.
- **VISOR**: Solo lectura de dashboards y reportes compartidos.

---

## 🎨 Diseño y Experiencia
- **Estética Premium**: Interfaz moderna basada en Glassmorphism y Material Design 3.
- **Modo Oscuro Adaptativo**: Optimizado para largas jornadas de trabajo.
- **Micro-interacciones**: Animaciones fluidas que mejoran la navegación y el feedback al usuario.

---
*Desarrollado con ❤️ para la optimización del sector ganadero.*
