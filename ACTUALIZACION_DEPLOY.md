# 🚀 Guía de Actualización y Despliegue en Hostinger VPS (OpenLiteSpeed)

Este documento detalla el procedimiento para actualizar la aplicación en el servidor cada vez que realices cambios y los subas a GitHub (`origin/main`).

---

### Datos de Producción
- **Dominio Principal:** [https://frigorificopampa.tech](https://frigorificopampa.tech)
- **IP VPS:** `187.41.99.58`
- **Servidor Web:** OpenLiteSpeed 1.9 + Node.js (Express)
- **Certificado SSL:** Let's Encrypt (Automático en `/etc/letsencrypt/live/frigorificopampa.tech/`)

---

## ⚡ Comando Rápido (Todo en Uno)

Conéctate a la consola de tu VPS en Hostinger y copia/pega esta línea:

```bash
cd /var/www/webapp && git pull origin main && npm install && npm run build && chown -R nobody:nogroup /var/www/webapp && pkill -9 -f lsnode ; systemctl restart lsws
```

---

## 📋 Paso a Paso Detallado

Si prefieres ejecutar o revisar paso por paso:

### 1. Entrar a la carpeta del proyecto
```bash
cd /var/www/webapp
```

### 2. Descargar los últimos cambios de GitHub
```bash
git pull origin main
```

### 3. Instalar nuevas dependencias (si agregaste paquetes en package.json)
```bash
npm install
```

### 4. Recompilar el frontend Vite (genera los archivos en `dist/`)
```bash
npm run build
```

### 5. Ajustar permisos para el usuario del servidor web
OpenLiteSpeed ejecuta las aplicaciones Node.js bajo el usuario del sistema `nobody`:
```bash
chown -R nobody:nogroup /var/www/webapp
```

### 6. Reiniciar el proceso de la aplicación
Elimina el proceso anterior en memoria (`lsnode`) y reinicia el servicio web:
```bash
pkill -9 -f lsnode ; systemctl restart lsws
```

---

## 🔍 Verificación

1. **Comprobar localmente en el servidor:**
   ```bash
   curl -s http://localhost/ | head -n 15
   ```
2. **Probar en el navegador:**
   - Abre `http://187.41.99.58/` (o tu dominio).
   - Recuerda hacer un refresco forzado con `Ctrl + F5` (o `Cmd + Shift + R` en Mac) para limpiar la caché del navegador.

---

## ⚠️ Casos Especiales

### Si agregaste nuevas Variables de Entorno
Si tus cambios requieren nuevas variables en el `.env`:
1. Edita el archivo con:
   ```bash
   nano /var/www/webapp/.env
   ```
2. Agrega las nuevas claves/valores.
3. Guarda con `Ctrl + O`, presiona `Enter` y sal con `Ctrl + X`.
4. Recompila con `npm run build` (las variables que empiezan con `VITE_` se inyectan en tiempo de compilación).
5. Reinicia OpenLiteSpeed: `pkill -9 -f lsnode ; systemctl restart lsws`.

### Si agregas un Dominio o subdominio
1. Apunta el registro **DNS tipo A** a la IP `187.41.99.58`.
2. Agrega el nuevo dominio en la consola de Firebase: **Authentication > Configuración > Dominios autorizados**.
3. Configura el certificado SSL (HTTPS) con el asistente de OpenLiteSpeed:
   ```bash
   /usr/local/lsws/admin/misc/ols1click.sh
   ```

### Renovación Automática de Certificado SSL
El certificado de Let's Encrypt se renueva solo cada 60 días en segundo plano vía `certbot renew`. Para asegurar que OpenLiteSpeed recargue el certificado tras cada renovación, existe el hook en:
`/etc/letsencrypt/renewal-hooks/deploy/reload-lsws.sh`

### Ver Logs de Errores (en caso de fallas)
Si la página no carga o muestra un error 500:
```bash
tail -n 50 /usr/local/lsws/logs/error.log
```
