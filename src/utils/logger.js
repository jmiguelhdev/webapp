/**
 * Sistema centralizado de Logging sensible al entorno.
 * En modo desarrollo muestra todos los logs.
 * En producción solo muestra warnings y errores.
 */
class Logger {
  constructor() {
    this.isDev = import.meta.env ? import.meta.env.DEV : true;
  }

  /**
   * Log de información general (solo visible en desarrollo)
   * @param {string} message Mensaje principal
   * @param {any} [data] Datos adicionales
   */
  info(message, data) {
    if (this.isDev) {
      if (data !== undefined) {
        console.log(`ℹ️ [INFO] ${message}`, data);
      } else {
        console.log(`ℹ️ [INFO] ${message}`);
      }
    }
  }

  /**
   * Log para debuggear lógica (solo visible en desarrollo)
   * @param {string} message Mensaje principal
   * @param {any} [data] Datos adicionales
   */
  debug(message, data) {
    if (this.isDev) {
      if (data !== undefined) {
        console.log(`🐛 [DEBUG] ${message}`, data);
      } else {
        console.log(`🐛 [DEBUG] ${message}`);
      }
    }
  }

  /**
   * Log para advertencias (visible en todos los entornos)
   * @param {string} message Mensaje principal
   * @param {any} [data] Datos adicionales
   */
  warn(message, data) {
    if (data !== undefined) {
      console.warn(`⚠️ [WARN] ${message}`, data);
    } else {
      console.warn(`⚠️ [WARN] ${message}`);
    }
  }

  /**
   * Log para errores (visible en todos los entornos)
   * @param {string} message Mensaje principal
   * @param {any} [error] Objeto de error o datos adicionales
   */
  error(message, error) {
    if (error !== undefined) {
      console.error(`🚨 [ERROR] ${message}`, error);
    } else {
      console.error(`🚨 [ERROR] ${message}`);
    }
  }
}

export const logger = new Logger();
