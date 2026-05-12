import { renderTravels, renderSettlementModal, showTravelModal } from './ui/screens/logistics/TravelsUI.js';
import { renderSimulator } from './ui/screens/core/SimulatorUI.js';
import { renderDashboard } from './ui/screens/core/DashboardUI.js';
import { renderFaenaConsumption } from './ui/screens/production/ConsumptionUI.js';
import { renderClientAccounts } from './ui/screens/core/ClientsUI.js';
import { renderSettings } from './ui/screens/core/SettingsUI.js';
import { renderPriceShare } from './ui/screens/core/PriceShareUI.js';
import { renderChecks } from './ui/screens/accounting/ChecksUI.js';
import { renderAccounting } from './ui/screens/accounting/AccountingUI.js';
import { renderPriceAnalysis } from './ui/screens/accounting/PriceAnalysisUI.js';
import { renderSidebar } from './ui/components/Sidebar.js';
import { renderExportModal, renderScanResultsModal, renderDateModal, showAuxiliaryCalculator } from './ui/components/Modals.js';
import { generateTravelReport, generateExcelReport, generateAccountingExcel, generateChecksExcel, printChecksReport } from './ui/reports/ReportService.js';
import { renderLogisticsMaster } from './ui/screens/logistics/LogisticsMastersUI.js';
import { renderLiquidations } from './ui/screens/logistics/LiquidationsUI.js';
import { renderFuelEfficiency } from './ui/screens/logistics/FuelEfficiencyUI.js';
import { renderEstablishmentManager } from './ui/screens/production/EstablishmentUI.js';
/**
 * Aggregator module for the UI layer.
 * Re-exports all rendering functions to maintain backward compatibility with main.js
 */
export {
  renderTravels,
  renderSettlementModal,
  showTravelModal,
  renderSimulator,
  renderDashboard,
  renderFaenaConsumption,
  renderClientAccounts,
  renderSettings,
  renderPriceShare,
  renderChecks,
  renderAccounting,
  renderPriceAnalysis,
  renderSidebar,
  renderExportModal,
  renderDateModal,
  renderScanResultsModal,
  showAuxiliaryCalculator,
  generateTravelReport,
  generateExcelReport,
  generateAccountingExcel,
  generateChecksExcel,
  printChecksReport,
  renderLogisticsMaster,
  renderLiquidations,
  renderFuelEfficiency,
  renderEstablishmentManager
};
