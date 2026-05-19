// src/adapters/presenters/EstablishmentPresenter.js
export class EstablishmentPresenter {
  constructor(repository, ui) {
    this.repository = repository;
    this.ui = ui;
    this.state = {
      establishments: [],
      selectedEstablishment: null,
      employees: []
    };
  }

  async loadData() {
    console.log("EstablishmentPresenter: loadData() started");
    this.ui.showLoading();
    try {
      console.log("EstablishmentPresenter: fetching establishments from repository...");
      this.state.establishments = await this.repository.getEstablishments();
      console.log("EstablishmentPresenter: fetched", this.state.establishments.length, "establishments");
      this.render();
      console.log("EstablishmentPresenter: render complete");
    } catch (error) {
      console.error("EstablishmentPresenter: Error loading data", error);
      this.ui.showError("Error al cargar sucursales: " + error.message);
      alert("Error crítico al cargar sucursales: " + error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async selectEstablishment(establishment) {
    this.state.selectedEstablishment = establishment;
    this.ui.showLoading();
    try {
      this.state.employees = await this.repository.getEmployees(establishment.id);
      this.render();
    } catch (error) {
      this.ui.showError("Error al cargar empleados: " + error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  clearSelection() {
    this.state.selectedEstablishment = null;
    this.state.employees = [];
    this.render();
  }

  async saveEstablishment(establishment) {
    this.ui.showLoading();
    try {
      await this.repository.saveEstablishment(establishment);
      await this.loadData();
    } catch (error) {
      this.ui.showError("Error al guardar sucursal: " + error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async deleteEstablishment(id) {
    if (!confirm("¿Está seguro de eliminar esta sucursal? Esta acción no se puede deshacer.")) return;
    this.ui.showLoading();
    try {
      await this.repository.deleteEstablishment(id);
      await this.loadData();
    } catch (error) {
      this.ui.showError("Error al eliminar sucursal: " + error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async saveEmployee(employee) {
    if (!this.state.selectedEstablishment) return;
    this.ui.showLoading();
    try {
      await this.repository.saveEmployee(this.state.selectedEstablishment.id, employee);
      // Reload employees for current establishment
      this.state.employees = await this.repository.getEmployees(this.state.selectedEstablishment.id, true);
      this.render();
    } catch (error) {
      this.ui.showError("Error al guardar empleado: " + error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async deleteEmployee(employeeId) {
    if (!this.state.selectedEstablishment) return;
    if (!confirm("¿Está seguro de eliminar este empleado?")) return;
    this.ui.showLoading();
    try {
      await this.repository.deleteEmployee(this.state.selectedEstablishment.id, employeeId);
      this.state.employees = await this.repository.getEmployees(this.state.selectedEstablishment.id, true);
      this.render();
    } catch (error) {
      this.ui.showError("Error al eliminar empleado: " + error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  render() {
    this.ui.renderEstablishmentManager(this);
  }
}
