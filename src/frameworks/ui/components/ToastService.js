/**
 * @file ToastService.js
 * @description Servicio centralizado y no bloqueante para notificaciones Toast.
 * Reemplaza los alerts nativos del navegador con una experiencia fluida, accesible y moderna.
 */

export class ToastService {
  static getContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Muestra un toast en pantalla.
   * @param {Object} options
   * @param {string} options.message Mensaje a desplegar.
   * @param {'success'|'error'|'warning'|'info'} [options.type='info'] Tipo de notificación.
   * @param {number} [options.duration=4000] Tiempo en milisegundos antes de autocierre.
   */
  static show({ message, type = 'info', duration = 4000 }) {
    const container = this.getContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    const icon = icons[type] || 'ℹ️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Cerrar notificación">×</button>
      <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    container.appendChild(toast);

    let timer = null;

    const removeToast = () => {
      if (timer) clearTimeout(timer);
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 250);
    };

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', removeToast);
    }

    if (duration > 0) {
      timer = setTimeout(removeToast, duration);
    }

    return { close: removeToast };
  }

  static success(message, duration = 3500) {
    return this.show({ message, type: 'success', duration });
  }

  static error(message, duration = 5000) {
    return this.show({ message, type: 'error', duration });
  }

  static warning(message, duration = 4000) {
    return this.show({ message, type: 'warning', duration });
  }

  static info(message, duration = 3500) {
    return this.show({ message, type: 'info', duration });
  }
}
