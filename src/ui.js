import { renderTravels, renderSettlementModal } from './ui/screens/TravelsUI.js';
import { renderSimulator } from './ui/screens/SimulatorUI.js';
import { renderDashboard } from './ui/screens/DashboardUI.js';
import { renderFaenaConsumption } from './ui/screens/ConsumptionUI.js';
import { renderClientAccounts } from './ui/screens/ClientsUI.js';
import { renderSettings } from './ui/screens/SettingsUI.js';
import { renderPriceShare } from './ui/screens/PriceShareUI.js';
import { renderChecks } from './ui/screens/ChecksUI.js';
import { renderAccounting } from './ui/screens/AccountingUI.js';
import { renderSidebar } from './ui/components/Sidebar.js';
import { renderExportModal, renderScanResultsModal } from './ui/components/Modals.js';
import { generateTravelReport, generateExcelReport, generateAccountingExcel } from './ui/reports/ReportService.js';

/**
 * Aggregator module for the UI layer.
 * Re-exports all rendering functions to maintain backward compatibility with main.js
 */
export {
  renderTravels,
  renderSettlementModal,
  renderSimulator,
  renderDashboard,
  renderFaenaConsumption,
  renderClientAccounts,
  renderSettings,
  renderPriceShare,
  renderChecks,
  renderAccounting,
  renderSidebar,
  renderExportModal,
  renderScanResultsModal,
  generateTravelReport,
  generateExcelReport,
  generateAccountingExcel
};
