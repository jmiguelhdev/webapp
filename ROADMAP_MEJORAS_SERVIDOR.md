# 📈 Roadmap de Mejoras y Optimización del Servidor VPS (Hostinger)

Este documento reúne las propuestas y mejoras estratégicas para aprovechar al máximo los recursos disponibles del servidor VPS de **Frigorífico Pampa**.

---

## 📊 Diagnóstico del Servidor Actual

- **CPU:** 1 vCPU (AMD EPYC 9355P — Arquitectura de alto rendimiento)
- **Memoria RAM:** 3.8 GB totales (~466 MB en uso, **3.4 GB libres / 88% disponible**)
- **Memoria SWAP:** 0 B (No configurada actualmente)
- **Almacenamiento SSD:** 48 GB totales (3.2 GB en uso, **45 GB libres / 93% disponible**)
- **Servidor Web:** OpenLiteSpeed 1.9 + Node.js (v26.13)
- **Dominio:** `https://frigorificopampa.tech` con SSL Let's Encrypt activo.

---

## 🚀 1. Despliegue Continuo (CI/CD con GitHub Webhooks)

### Objetivo
Eliminar la necesidad de ejecutar comandos manuales por SSH cada vez que se sube código a `main`.

### Implementación Propuesta
- **Opción A (Webhook Express nativo):**
  - Crear un endpoint protegido en el backend (`POST /api/deploy-webhook?secret=...`).
  - Al recibir el push de GitHub, el servidor ejecuta en segundo plano el script de despliegue (`git pull`, `npm run build`, `chown`, reinicio de `lsnode`).
- **Opción B (GitHub Actions con SSH):**
  - Un workflow de GitHub `.github/workflows/deploy.yml` que se conecta por SSH a Hostinger y ejecuta la actualización automáticamente.

---

## 🛡️ 2. Blindaje, Estabilidad y Seguridad

### 2.1 Memoria SWAP en Disco (2 a 4 GB)
- **Problema:** Si durante un `npm install` o una compilación pesada de Vite el uso de RAM experimenta un pico repentino, el kernel Linux podría activar el *OOM Killer* y detener el proceso web.
- **Solución:** Crear un archivo de swap de 2 GB o 4 GB en el SSD para amortiguar picos sin costo.

### 2.2 Protección contra Fuerza Bruta con `fail2ban`
- **Problema:** El puerto SSH 22 recibe intentos automatizados de autenticación por bots en internet.
- **Solución:** Instalar y configurar `fail2ban`. Si una IP falla 5 intentos seguidos de conexión, es bloqueada automáticamente por el firewall durante horas o días.

### 2.3 Endpoint de Monitoreo de Salud (`/api/health`) y Uptime
- **Problema:** Actualmente no hay forma automática de saber si la aplicación o el servidor sufren una caída.
- **Solución:**
  - Agregar un endpoint en `server.js` que devuelva métricas básicas (uptime del proceso, consumo de memoria, estado del servicio).
  - Conectar este endpoint a servicios gratuitos de monitoreo externo (*BetterStack* o *UptimeRobot*) con alertas instantáneas por correo o WhatsApp.

---

## ⚡ 3. Aceleración Web y Caché Extrema

### 3.1 Encabezados de Caché Inmutable para Assets de Vite
- Los archivos en `dist/assets/` ya cuentan con hashes únicos en sus nombres (`index-DlTOgwJr.js`, `index-CvYcX5QY.css`).
- Configurar OpenLiteSpeed para servirlos con:
  ```http
  Cache-Control: public, max-age=31536000, immutable
  ```
- **Beneficio:** Los usuarios que ya ingresaron a la aplicación una vez cargarán el sitio en **menos de 50 milisegundos**, ya que el navegador no volverá a descargarlos.

### 3.2 Compresión Brotli Nativa
- Habilitar la compresión Brotli en OpenLiteSpeed para assets JS y CSS, logrando reducir el peso de descarga entre un 15% y un 25% más que Gzip estándar.

### 3.3 Capa de Caché en Memoria / Redis Local
- Como el servidor dispone de más de 3 GB de RAM libres, se puede almacenar en memoria RAM datos de lectura frecuente (padrón ARCA/AFIP, precios públicos por sucursal, cotizaciones), respondiendo peticiones en ~1 milisegundo sin llamadas externas.

---

## ⚙️ 4. Automatizaciones en Segundo Plano (Background Jobs)

### 4.1 Tareas Cron para Cotizaciones y Precios MAG
- Programar tareas periódicas (`node-cron` o cron del sistema) que consulten o actualicen de forma programada los precios de hacienda (MAG) y listas de precios, evitando depender de llamadas sincrónicas del usuario.

### 4.2 Generación de Reportes y Exportaciones en Servidor
- Trasladar la generación de reportes pesados de faena, libros contables o exportaciones masivas a Excel hacia procesos en segundo plano en el servidor Node.js, liberando al navegador del cliente.

### 4.3 Copias de Seguridad Automáticas Off-Site
- Programar un script diario que comprima:
  - Archivo de entorno `.env`
  - Configuraciones de OpenLiteSpeed y certificados SSL
  - Archivos de caché en disco (`data/`)
- Enviar el archivo encriptado a almacenamiento externo (Google Drive, Dropbox o canal privado de Telegram).

---

## 🧪 5. Entorno de Pruebas (Staging / Dev)

### Objetivo
Tener un entorno idéntico a producción donde probar nuevas pantallas, cambios en base de datos o features antes de enviarlas al dominio principal.

### Implementación
- Crear un subdominio: `dev.frigorificopampa.tech` o `staging.frigorificopampa.tech`.
- Asignarlo a una carpeta separada (ej: `/var/www/webapp-staging`) asociada a una rama `develop` o `staging` de Git.
- Dado el bajo consumo del servidor, pueden convivir ambos entornos sin requerir más servidores ni generar costos adicionales.
