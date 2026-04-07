import { renderTravels, renderSettlementModal } from './ui/screens/TravelsUI.js';
import { renderSimulator } from './ui/screens/SimulatorUI.js';
import { renderDashboard } from './ui/screens/DashboardUI.js';
import { renderFaenaConsumption } from './ui/screens/ConsumptionUI.js';
import { renderClientAccounts } from './ui/screens/ClientsUI.js';
import { renderSettings } from './ui/screens/SettingsUI.js';
import { renderExportModal, renderScanResultsModal } from './ui/components/Modals.js';
import { generateTravelReport, generateExcelReport } from './ui/reports/ReportService.js';

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
  renderExportModal,
  renderScanResultsModal,
  generateTravelReport,
  generateExcelReport
};
