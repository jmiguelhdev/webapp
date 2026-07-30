# Entry Point y Enrutamiento (`main.js`)

El archivo `src/main.js` es la columna vertebral que inicializa e integra todas las capas del proyecto. Es el único punto en la aplicación donde el sistema acopla componentes concretos de la UI con repositorios de datos y casos de uso.

## Responsabilidades de `main.js`

1. **Inyección de Dependencias**:
   - Inicializa los repositorios necesarios.
   - Crea las instancias de los Presenters pasándoles (inyectando) los repositorios requeridos (por ejemplo, pasándole `accountingRepository` al `AccountingPresenter`).
   - Le pasa el acceso a la interfaz unificada (`uiInterface`) a los Presenters.

2. **Gestión del Estado Global de la App**:
   - Comprueba la sesión de Firebase Authentication.
   - Gestiona la información del usuario en sesión (`currentUser`, `currentUserRole`).
   - Aplica validación de acceso al sistema (autenticación) limitando qué pantallas puede ver cada tipo de usuario (ADMIN, OPERARIO, VISOR) invocando reglas de rol (RBAC - Role Based Access Control).

3. **Routing (Navegación SPA)**:
   - Implementa un enrutador (router) muy ligero basado en Vanilla JS.
   - Captura los eventos de navegación de los componentes del sidebar (`kmp-sidebar.js`) y cambia la variable de estado actual (ej: `dashboard`, `accounting`, `frigorifico`).
   - La función `navigateTo(view)` se encarga de:
     1. Ocultar o limpiar el contenedor principal (`content.innerHTML = ''`).
     2. Validar los permisos del rol del usuario.
     3. Invocar al método `loadData()` o equivalente del Presenter respectivo (por ejemplo, `accountingPresenter.loadData()`).

4. **Configuración de Servicios Transversales**:
   - Configura el observador general del `SyncService`.
   - Muestra notificaciones visuales globales y pantallas de carga.

## Recomendaciones para su mantenimiento
- **No añadir lógica de negocio aquí**: `main.js` debe funcionar estrictamente como un orquestador. Cualquier lógica de negocio debe delegarse a los `Presenters` y `Casos de Uso`.
- **Enrutamiento Escalable**: Si la aplicación sigue creciendo, considerar abstraer el bloque `switch(view)` gigante hacia un patrón de mapeo de rutas estructurado (Router module).
