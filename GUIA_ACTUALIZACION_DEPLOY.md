# 🚀 Guía de Despliegue y Actualización en Hostinger VPS

Esta guía detalla cómo actualizar la aplicación **Frigorífico Pampa WebApp** en el servidor de producción (Hostinger VPS con OpenLiteSpeed y Node.js) cada vez que realices cambios en el código y los envíes a GitHub, así como la configuración para conectarte desde otra computadora (como una Mac).

---

## 📌 Datos de Producción
- **Dominio:** [https://frigorificopampa.tech](https://frigorificopampa.tech)
- **IP VPS:** `187.41.99.58`
- **Ruta de la App en el Servidor:** `/var/www/webapp`
- **Usuario de ejecución:** `nobody:nogroup` (OpenLiteSpeed Node runner)
- **Alias SSH configurado:** `hostinger`

---

## ⚡ Método 1: Actualizar con 1 solo comando (Sin entrar al servidor)

Desde la terminal de tu computadora configurada:

```bash
ssh hostinger "cd /var/www/webapp && git checkout dist/index.html && git pull origin main && npm install && npm run build && chown -R nobody:nogroup /var/www/webapp && pkill -9 -f lsnode ; systemctl restart lsws"
```

Este comando:
1. Se conecta al VPS automáticamente.
2. Descarga el código nuevo de GitHub (`main`).
3. Instala paquetes si hubo cambios en `package.json`.
4. Compila el frontend optimizado con Vite (`dist/`).
5. Restablece permisos para el usuario `nobody:nogroup`.
6. Reinicia el proceso de Node.js (`lsnode`) y el servidor OpenLiteSpeed (`lsws`).

---

## 💻 Método 2: Conectándote por SSH al Servidor

### 1. Conectarse al VPS
Abre tu terminal y escribe:
```bash
ssh hostinger
```
*(No te pedirá contraseña; entrarás directo como `root`)*.

---

### 2. Ejecutar la actualización en el servidor

Una vez dentro de la terminal del servidor:

```bash
cd /var/www/webapp
git checkout dist/index.html
git pull origin main
npm install
npm run build
chown -R nobody:nogroup /var/www/webapp
pkill -9 -f lsnode ; systemctl restart lsws
```

---

## 🍎 Conexión SSH desde otra Computadora (Especialmente Mac)

### ¿Debes llevarte el archivo de la key privada?

**No es estrictamente necesario, y de hecho la mejor práctica de seguridad en Linux/macOS es NO mover claves privadas entre computadoras.**

Tienes dos formas de configurarlo en tu Mac:
- **Opción A (Recomendada y más limpia):** Generar una nueva clave propia en tu Mac y autorizarla en el servidor.
- **Opción B (Alternativa):** Llevarte el archivo `id_ed25519` a tu Mac en un pendrive o carpeta segura.

---

### Opción A (Recomendada): Crear una clave nueva en tu Mac

Esta opción es más segura porque cada computadora tiene su propia llave independiente (si pierdes o cambias una máquina, no comprometes las demás).

#### Paso 1: En tu Mac, abre la aplicación **Terminal**
Ejecuta el siguiente comando para generar tu par de llaves:
```bash
ssh-keygen -t ed25519 -C "mac-miguel"
```
*(Cuando te pregunte dónde guardarla, presiona `Enter` para aceptar la ruta predeterminada `~/.ssh/id_ed25519`. Si no deseas ponerle contraseña de paso a la llave, presiona `Enter` dos veces más)*.

#### Paso 2: Copiar tu clave pública al portapapeles de la Mac
En la misma terminal de tu Mac, corre:
```bash
pbcopy < ~/.ssh/id_ed25519.pub
```
*(Esto copia automáticamente el contenido de tu clave pública al portapapeles)*.

#### Paso 3: Autorizar la clave en el servidor
Tienes dos formas sencillas de autorizarla:

- **Método 3.1: Directamente desde tu Mac con `ssh-copy-id` (Más rápido):**
  En la Mac corre:
  ```bash
  ssh-copy-id root@187.41.99.58
  ```
  Te pedirá la contraseña de root del VPS (`180283Miguel#`), copiará tu llave automáticamente al servidor y listo.

- **Método 3.2: Desde tu PC actual (la que ya tiene acceso SSH sin clave):**
  Abre la terminal en tu PC actual y ejecuta:
  ```bash
  ssh hostinger "echo 'PEGA_AQUI_LA_CLAVE_DE_TU_MAC' >> ~/.ssh/authorized_keys"
  ```

#### Paso 4: Crear el acceso directo `ssh hostinger` en tu Mac
En la Terminal de tu Mac, ejecuta este bloque para configurar el alias:
```bash
mkdir -p ~/.ssh
cat << 'EOF' >> ~/.ssh/config

Host hostinger frigorifico
    HostName 187.41.99.58
    User root
    IdentityFile ~/.ssh/id_ed25519
EOF
chmod 600 ~/.ssh/config
```

¡Listo! A partir de ese momento, desde tu Mac solo escribirás:
```bash
ssh hostinger
```
y podrás administrar o desplegar cambios con exactamente los mismos comandos.

---

### Opción B: Si prefieres llevarte el archivo de la key actual

Si deseas reutilizar la misma clave de esta máquina:

1. Copia el archivo privado `/home/miguel/.ssh/id_ed25519` a tu Mac (mediante un pendrive seguro o almacenamiento personal).
2. En tu Mac, abre **Terminal** y mueve el archivo a la carpeta `.ssh`:
   ```bash
   mkdir -p ~/.ssh
   mv ~/Downloads/id_ed25519 ~/.ssh/id_ed25519
   ```
3. **Paso crítico (Permisos estrictos de macOS):**
   macOS rechaza cualquier conexión SSH si la clave privada tiene permisos abiertos. Debes asignarle permisos `600`:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/id_ed25519
   ```
4. Configura el archivo `~/.ssh/config` en tu Mac:
   ```bash
   cat << 'EOF' >> ~/.ssh/config

Host hostinger frigorifico
    HostName 187.41.99.58
    User root
    IdentityFile ~/.ssh/id_ed25519
EOF
   chmod 600 ~/.ssh/config
   ```
5. Prueba conectarte:
   ```bash
   ssh hostinger
   ```

---

## 🔍 Paso a Paso del Despliegue Explicado

| Paso | Comando | Propósito |
| :--- | :--- | :--- |
| **1. Ubicarse** | `cd /var/www/webapp` | Entra a la carpeta del proyecto en el servidor. |
| **2. Limpiar build previo** | `git checkout dist/index.html` | Evita conflictos de Git por archivos generados en builds anteriores. |
| **3. Descargar cambios** | `git pull origin main` | Descarga los últimos commits subidos a GitHub. |
| **4. Dependencias** | `npm install` | Instala librerías nuevas o actualizadas. |
| **5. Compilación** | `npm run build` | Vite empaqueta y minifica HTML, CSS y JS en la carpeta `dist/`. |
| **6. Permisos** | `chown -R nobody:nogroup /var/www/webapp` | Garantiza que el usuario web (`nobody`) pueda leer y servir los archivos. |
| **7. Reinicio** | `pkill -9 -f lsnode ; systemctl restart lsws` | Mata el proceso Node viejo para que OpenLiteSpeed cargue el nuevo código. |

---

## 🧪 Verificación y Pruebas

1. **Verificar que el servicio responda localmente:**
   ```bash
   curl -Is https://frigorificopampa.tech
   ```
   Debe devolver `HTTP/2 200`.

2. **Verificar el proceso Node activo:**
   ```bash
   ps aux | grep lsnode
   ```

3. **Verificar en el navegador:**
   - Abre [https://frigorificopampa.tech](https://frigorificopampa.tech).
   - Presiona **`Ctrl + F5`** (o `Shift + F5` / `Cmd + Shift + R` en Mac) para forzar la recarga limpia de la caché del navegador.

---

## ⚠️ Casos Especiales

### Si modificas Variables de Entorno (`.env`)
Si añades nuevas claves en el archivo `.env`:
1. En el servidor:
   ```bash
   nano /var/www/webapp/.env
   ```
2. Agrega las nuevas variables, presiona `Ctrl + O` (guardar) y `Ctrl + X` (salir).
3. **Importante:** Si la variable empieza con `VITE_`, debes volver a compilar con `npm run build`.
4. Reinicia el proceso:
   ```bash
   pkill -9 -f lsnode ; systemctl restart lsws
   ```

### Ver Logs en caso de error
Si la página muestra error o pantalla blanca:
- **Log de Node.js / Express:**
  ```bash
  tail -f /usr/local/lsws/logs/stderr.log
  ```
- **Log de OpenLiteSpeed:**
  ```bash
  tail -f /usr/local/lsws/logs/error.log
  ```
