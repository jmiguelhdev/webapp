import { fetchEmployeeTimeLogs, updateEmployeeRates as updateRatesApi } from '../api/TimeLogApi.js';

/**
 * Presenter para la administración de establecimientos (sucursales) y sus empleados.
 * Coordina la obtención de sucursales e historial de empleados, su edición, y la actualización en la UI.
 */
export class EstablishmentPresenter {
  /**
   * @param {Object} repository - Repositorio de establecimientos y personal.
   * @param {Object} ui - Interfaz unificada de usuario para manipular el DOM.
   * @param {Object} [options] - Opciones adicionales (db, onNavigateToSalaryPayment).
   */
  constructor(repository, ui, options = {}) {
    this.repository = repository;
    this.ui = ui;
    this.db = options.db;
    this.onNavigateToSalaryPaymentCallback = options.onNavigateToSalaryPayment;
    this.state = {
      establishments: [],
      selectedEstablishment: null,
      employees: [],
      selectedEmployee: null,
      timeLogs: []
    };
  }

  /**
   * Carga la lista completa de establecimientos/sucursales y actualiza la visualización.
   * @returns {Promise<void>}
   */
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

  /**
   * Selecciona una sucursal, carga su lista de empleados y actualiza la pantalla.
   * @param {Object} establishment - La sucursal seleccionada.
   * @returns {Promise<void>}
   */
  async selectEstablishment(establishment) {
    this.state.selectedEstablishment = establishment;
    this.state.selectedEmployee = null;
    this.state.timeLogs = [];
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

  /**
   * Limpia la sucursal seleccionada y vuelve a renderizar la vista de lista general.
   */
  clearSelection() {
    this.state.selectedEstablishment = null;
    this.state.employees = [];
    this.state.selectedEmployee = null;
    this.state.timeLogs = [];
    this.render();
  }

  /**
   * Selecciona un empleado y carga sus registros de asistencia y fichadas.
   * @param {Object} employee 
   */
  async selectEmployee(employee) {
    if (!this.state.selectedEstablishment) return;
    this.state.selectedEmployee = employee;
    this.ui.showLoading();
    try {
      this.state.timeLogs = await fetchEmployeeTimeLogs(
        this.db, 
        this.state.selectedEstablishment.id, 
        employee.id
      );
      this.render();
    } catch (error) {
      this.ui.showError("Error al cargar asistencia del empleado: " + error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Desselecciona el empleado activo y regresa al listado de personal de la sucursal.
   */
  clearSelectedEmployee() {
    this.state.selectedEmployee = null;
    this.state.timeLogs = [];
    this.render();
  }

  /**
   * Actualiza las tarifas y modalidad de pago del empleado activo.
   * @param {Object} rateData 
   */
  async updateEmployeeRates(rateData) {
    if (!this.state.selectedEstablishment || !this.state.selectedEmployee) return;
    this.ui.showLoading();
    try {
      await updateRatesApi(
        this.db, 
        this.state.selectedEstablishment.id, 
        this.state.selectedEmployee.id, 
        rateData
      );
      this.state.selectedEmployee = { ...this.state.selectedEmployee, ...rateData };
      this.state.employees = await this.repository.getEmployees(this.state.selectedEstablishment.id, true);
      this.render();
    } catch (error) {
      this.ui.showError("Error al actualizar tarifas: " + error.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  /**
   * Redirige hacia la Caja General para efectuar el pago de sueldo precargado.
   * @param {Object} payload 
   */
  navigateToSalaryPayment(payload) {
    if (typeof this.onNavigateToSalaryPaymentCallback === 'function') {
      this.onNavigateToSalaryPaymentCallback(payload);
    }
  }


  /**
   * Registra una nueva sucursal o actualiza una existente y recarga los datos.
   * @param {Object} establishment - Los datos de la sucursal.
   * @returns {Promise<void>}
   */
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

  /**
   * Elimina una sucursal tras solicitar confirmación al usuario.
   * @param {string|number} id - Identificador de la sucursal.
   * @returns {Promise<void>}
   */
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

  /**
   * Guarda o actualiza los datos de un empleado asociado a la sucursal activa.
   * @param {Object} employee - Atributos del empleado.
   * @returns {Promise<void>}
   */
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

  /**
   * Elimina un empleado del establecimiento activo tras confirmar la acción.
   * @param {string|number} employeeId - ID del empleado.
   * @returns {Promise<void>}
   */
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

  /**
   * Invoca el renderizado de la UI de administración de sucursales en el DOM.
   */
  render() {
    this.ui.renderEstablishmentManager(this);
  }
}
