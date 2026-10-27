/**
 * @file CommandPalette.js
 * @description Buscador rápido de módulos y acciones con atajo de teclado Ctrl+K / Cmd+K.
 */

export class CommandPalette {
  /**
   * Inicializa la paleta de comandos.
   * @param {Object} options
   * @param {(viewId: string) => void} options.onNavigate Callback para navegar a la vista.
   * @param {() => Array<{id: string, title: string, category: string, icon: string}>} options.getItems
   */
  static init({ onNavigate, getItems }) {
    this.onNavigate = onNavigate;
    this.getItems = getItems;
    this.selectedIndex = 0;
    this.filteredItems = [];

    this.overlay = document.getElementById('command-palette-overlay');
    this.input = document.getElementById('command-palette-input');
    this.resultsContainer = document.getElementById('command-palette-results');
    this.triggerBtn = document.getElementById('btn-command-palette');

    if (!this.overlay) return;

    // Abrir con click en botón de cabecera
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', () => this.open());
    }

    // Atajo global Ctrl+K / Cmd+K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Cerrar con click fuera
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Input y teclas de navegación dentro de la paleta
    if (this.input) {
      this.input.addEventListener('input', () => this.handleSearch());
      this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    }
  }

  static toggle() {
    if (!this.overlay) return;
    if (this.overlay.style.display === 'flex') {
      this.close();
    } else {
      this.open();
    }
  }

  static open() {
    if (!this.overlay || !this.input) return;
    this.overlay.style.display = 'flex';
    this.input.value = '';
    this.selectedIndex = 0;
    this.handleSearch();
    setTimeout(() => this.input.focus(), 50);
  }

  static close() {
    if (!this.overlay) return;
    this.overlay.style.display = 'none';
  }

  static handleSearch() {
    const query = (this.input.value || '').trim().toLowerCase();
    const allItems = typeof this.getItems === 'function' ? this.getItems() : [];

    if (!query) {
      this.filteredItems = allItems;
    } else {
      this.filteredItems = allItems.filter(item => {
        return (
          item.title.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
        );
      });
    }

    this.selectedIndex = 0;
    this.renderResults();
  }

  static renderResults() {
    if (!this.resultsContainer) return;

    if (this.filteredItems.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="palette-empty">No se encontraron módulos ni acciones que coincidan.</div>
      `;
      return;
    }

    this.resultsContainer.innerHTML = this.filteredItems.map((item, index) => `
      <div class="palette-item ${index === this.selectedIndex ? 'palette-selected' : ''}" data-index="${index}">
        <span class="palette-item-icon">${item.icon}</span>
        <span class="palette-item-title">${item.title}</span>
        <span class="palette-item-category">${item.category}</span>
      </div>
    `).join('');

    this.resultsContainer.querySelectorAll('.palette-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.index);
        this.selectItem(idx);
      });
      el.addEventListener('mouseenter', () => {
        this.selectedIndex = Number(el.dataset.index);
        this.updateSelectionVisuals();
      });
    });
  }

  static updateSelectionVisuals() {
    if (!this.resultsContainer) return;
    const items = this.resultsContainer.querySelectorAll('.palette-item');
    items.forEach((el, idx) => {
      if (idx === this.selectedIndex) {
        el.classList.add('palette-selected');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('palette-selected');
      }
    });
  }

  static handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.filteredItems.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % this.filteredItems.length;
        this.updateSelectionVisuals();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.filteredItems.length > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
        this.updateSelectionVisuals();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.filteredItems.length > 0) {
        this.selectItem(this.selectedIndex);
      }
    }
  }

  static selectItem(index) {
    const item = this.filteredItems[index];
    if (item) {
      this.close();
      if (typeof this.onNavigate === 'function') {
        this.onNavigate(item.id);
      }
    }
  }
}
