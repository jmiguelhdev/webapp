# Arquitectura Global

Este documento describe la arquitectura de alto nivel de la aplicación web `kmp-travel-web`.

## Visión General

La aplicación sigue un enfoque inspirado en **Clean Architecture** y el patrón **MVP (Model-View-Presenter)**. Este diseño separa las responsabilidades en capas distintas, facilitando la escalabilidad, el mantenimiento y la posible reutilización de la lógica de negocio (por ejemplo, si se compartiera código con una aplicación KMP móvil).

## Capas de la Arquitectura

1. **Dominio (`src/domain/`)**:
   - Contiene la lógica de negocio central, entidades y casos de uso.
   - Es independiente de las interfaces de usuario o marcos de base de datos.

2. **Adaptadores (`src/adapters/`)**:
   - Actúa como puente entre el dominio y el mundo exterior (UI, bases de datos externas).
   - **Presenters**: Reciben la entrada de la UI, orquestan las acciones a través de los casos de uso o repositorios y actualizan la vista (MVP).
   - **Repositorios**: Implementan las interfaces de acceso a datos definidas (implícitamente) por el dominio, conectando con las APIs.
   - **APIs**: Interactúan directamente con Firebase Firestore y el almacenamiento local (IndexedDB).

3. **Frameworks (`src/frameworks/`)**:
   - Contiene detalles de implementación concretos y bibliotecas de terceros.
   - **UI**: Componentes visuales, gestión del DOM y plantillas.
   - **DB**: Configuración de la base de datos local usando Dexie.js (IndexedDB).
   - **Services**: Servicios auxiliares y de infraestructura, como el servicio de sincronización offline.

4. **Raíz / Entrada (`src/main.js`)**:
   - Punto de entrada principal de la aplicación.
   - Se encarga de la configuración, inicialización de dependencias (inyección manual), y gestión del enrutamiento (routing) entre las diferentes secciones.

## Flujo de Datos

1. **Interacción de Usuario**: El usuario interactúa con la UI (e.g., hace clic en "Guardar").
2. **UI -> Presenter**: La vista (`frameworks/ui/`) delega la acción al `Presenter` correspondiente (`adapters/presenters/`).
3. **Presenter -> Repository**: El Presenter invoca los métodos del `Repository` (`adapters/repositories/`).
4. **Repository -> API / LocalDB**: El Repository coordina la llamada a la red (Firebase a través de `adapters/api/`) o a la base de datos local (Dexie en `frameworks/db/`).
5. **Respuesta**: Los datos fluyen de regreso (o mediante observadores/eventos) al Presenter, que finalmente instruye a la UI para actualizarse.
