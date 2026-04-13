// src/adapters/presenters/CheckPresenter.js

export class CheckPresenter {
  constructor(checkRepository, ui) {
    this.checkRepository = checkRepository;
    this.ui = ui;
    this.checks = [];
    this.contacts = [];
    this.currentUserUid = null;
  }

  setUid(uid) {
    this.currentUserUid = uid;
  }

  async loadData() {
    this.ui.showLoading();
    try {
      this.checks = await this.checkRepository.fetchChecks(this.currentUserUid);
      this.contacts = await this.checkRepository.getContacts();
      this.render();
    } catch (e) {
      this.ui.showError("Error al cargar cheques: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async saveOperation(operationData) {
    this.ui.showLoading();
    try {
      // Calculate derived fields before saving if not already done by UI
      const processed = this.calculateOperation(operationData);
      await this.checkRepository.saveCheck(this.currentUserUid, processed);
      await this.loadData();
    } catch (e) {
      this.ui.showError("Error al guardar operación: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  async deleteOperation(id) {
    if (!confirm("¿Está seguro de eliminar esta operación?")) return;
    this.ui.showLoading();
    try {
      await this.checkRepository.deleteCheck(id);
      await this.loadData();
    } catch (e) {
      this.ui.showError("Error al eliminar: " + e.message);
    } finally {
      this.ui.hideLoading();
    }
  }

  calculateOperation(op) {
    const nominalValue = parseFloat(op.nominalValue) || 0;
    const reception = new Date(op.receptionDate);
    const due = new Date(op.dueDate);
    const clearing = parseInt(op.clearing) || 0;
    
    // Calculate days: (Due - Reception) + Clearing
    const diffTime = due.getTime() - reception.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalDays = Math.max(0, diffDays + clearing);
    
    op.days = totalDays;

    // Buy side calculation
    if (op.buySide) {
      const pesificationRate = parseFloat(op.buySide.pesificacionRate) || 0;
      const monthlyInterest = parseFloat(op.buySide.monthlyInterest) || 0;
      
      const pesificationAmount = nominalValue * (pesificationRate / 100);
      const interestAmount = nominalValue * (monthlyInterest / 100 / 30) * totalDays;
      
      op.buySide.netAmount = nominalValue - pesificationAmount - interestAmount;
    }

    // Sell side calculation
    if (op.sellSide && op.sellSide.status === 'SOLD') {
      const pesificationRate = parseFloat(op.sellSide.pesificacionRate) || 0;
      const monthlyInterest = parseFloat(op.sellSide.monthlyInterest) || 0;
      
      const pesificationAmount = nominalValue * (pesificationRate / 100);
      const interestAmount = nominalValue * (monthlyInterest / 100 / 30) * totalDays;
      
      op.sellSide.netAmount = nominalValue - pesificationAmount - interestAmount;
      op.profit = (op.sellSide.netAmount || 0) - (op.buySide ? op.buySide.netAmount : 0);
    } else {
      op.profit = 0;
    }

    return op;
  }

  render() {
    this.ui.renderChecks({
      checks: this.checks,
      contacts: this.contacts,
      onSave: this.saveOperation.bind(this),
      onDelete: this.deleteOperation.bind(this),
      onRefresh: this.loadData.bind(this)
    });
  }
}
