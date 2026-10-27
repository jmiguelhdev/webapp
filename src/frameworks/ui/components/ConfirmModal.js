/**
 * @file ConfirmModal.js
 * @description Diálogo modal de confirmación no bloqueante y estilizado.
 * Reemplaza `window.confirm()` ofreciendo una interfaz integrada con el diseño del sistema.
 */

export class ConfirmModal {
  /**
   * Muestra un diálogo modal de confirmación y retorna una promesa que se resuelve con true/false.
   * @param {Object} options
   * @param {string} [options.title='Confirmar Acción']
   * @param {string} options.message
   * @param {string} [options.icon='⚠️']
   * @param {string} [options.confirmText='Aceptar']
   * @param {string} [options.cancelText='Cancelar']
   * @param {boolean} [options.isDestructive=false]
   * @returns {Promise<boolean>}
   */
  static confirm({
    title = 'Confirmar Acción',
    message = '¿Está seguro de continuar?',
    icon = '⚠️',
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    isDestructive = false
  }) {
    return new Promise((resolve) => {
      let overlay = document.getElementById('confirm-modal-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirm-modal-overlay';
        overlay.className = 'confirm-modal-overlay';
        overlay.innerHTML = `
          <div class="confirm-modal-card">
            <div class="confirm-modal-header">
              <span class="confirm-modal-icon" id="confirm-modal-icon">⚠️</span>
              <h3 class="confirm-modal-title" id="confirm-modal-title">Confirmar Acción</h3>
            </div>
            <div class="confirm-modal-body" id="confirm-modal-body"></div>
            <div class="confirm-modal-actions">
              <button id="confirm-modal-cancel" class="btn btn-secondary">Cancelar</button>
              <button id="confirm-modal-accept" class="btn btn-primary">Aceptar</button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
      }

      const iconEl = overlay.querySelector('#confirm-modal-icon');
      const titleEl = overlay.querySelector('#confirm-modal-title');
      const bodyEl = overlay.querySelector('#confirm-modal-body');
      const cancelBtn = overlay.querySelector('#confirm-modal-cancel');
      const acceptBtn = overlay.querySelector('#confirm-modal-accept');

      if (iconEl) iconEl.textContent = icon;
      if (titleEl) titleEl.textContent = title;
      if (bodyEl) bodyEl.textContent = message;
      if (cancelBtn) cancelBtn.textContent = cancelText;
      if (acceptBtn) {
        acceptBtn.textContent = confirmText;
        if (isDestructive) {
          acceptBtn.style.background = 'var(--danger)';
          acceptBtn.style.borderColor = 'var(--danger)';
        } else {
          acceptBtn.style.background = 'var(--primary)';
          acceptBtn.style.borderColor = 'var(--primary)';
        }
      }

      overlay.style.display = 'flex';
      acceptBtn.focus();

      const cleanup = () => {
        overlay.style.display = 'none';
        window.removeEventListener('keydown', handleKey);
        cancelBtn.removeEventListener('click', onCancel);
        acceptBtn.removeEventListener('click', onAccept);
        overlay.removeEventListener('click', onOverlayClick);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      const onAccept = () => {
        cleanup();
        resolve(true);
      };

      const onOverlayClick = (e) => {
        if (e.target === overlay) onCancel();
      };

      const handleKey = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          onAccept();
        }
      };

      cancelBtn.addEventListener('click', onCancel);
      acceptBtn.addEventListener('click', onAccept);
      overlay.addEventListener('click', onOverlayClick);
      window.addEventListener('keydown', handleKey);
    });
  }
}
