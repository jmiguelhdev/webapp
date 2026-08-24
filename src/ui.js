import './frameworks/ui/components/kmp-status-chip.js';
import './frameworks/ui/components/kmp-metric-card.js';
import './frameworks/ui/components/kmp-sidebar.js';

import { renderTravels } from './frameworks/ui/screens/TravelsUI.js';
import { renderSettlementModal } from './frameworks/ui/components/SettlementModal.js';
import { showTravelModal } from './frameworks/ui/components/TravelModal.js';
import { renderSimulator } from './frameworks/ui/screens/SimulatorUI.js';
import { renderDashboard } from './frameworks/ui/screens/DashboardUI.js';
import { renderFaenaConsumption } from './frameworks/ui/screens/ConsumptionUI.js';
import { renderClientAccounts } from './frameworks/ui/screens/ClientsUI.js';
import { renderSaleDetailModal } from './frameworks/ui/components/ClientModals.js';
import { renderSettings } from './frameworks/ui/screens/SettingsUI.js';
import { renderPriceShare } from './frameworks/ui/screens/PriceShareUI.js';
import { renderChecks } from './frameworks/ui/screens/ChecksUI.js';
import { renderBatchBuyScreen } from './frameworks/ui/screens/BatchBuyChecksUI.js';
import { renderAccounting } from './frameworks/ui/screens/AccountingUI.js';
import { renderPriceAnalysis } from './frameworks/ui/screens/PriceAnalysisUI.js';
import { renderSidebar } from './frameworks/ui/components/Sidebar.js';
import { renderExportModal, renderScanResultsModal, renderDateModal, showAuxiliaryCalculator } from './frameworks/ui/components/Modals.js';
import { generateTravelReport, generateExcelReport, generateAccountingExcel, generateChecksExcel, printChecksReport } from './frameworks/ui/reports/ReportService.js';
import { renderLogisticsMaster } from './frameworks/ui/screens/LogisticsMastersUI.js';
import { renderLiquidations } from './frameworks/ui/screens/LiquidationsUI.js';
import { renderFuelEfficiency } from './frameworks/ui/screens/FuelEfficiencyUI.js';
import { renderEstablishmentManager } from './frameworks/ui/screens/EstablishmentUI.js';

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
  renderSaleDetailModal,
  renderSettings,
  renderPriceShare,
  renderChecks,
  renderBatchBuyScreen,
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
