#!/bin/bash
# move_files.sh
# Script para mover las pantallas de UI a sus carpetas de dominio.
# Ejecutar desde la raíz del proyecto webApp: sh move_files.sh

cd src/ui/screens || exit 1

# Crear carpetas
mkdir -p logistics accounting production core

# Mover archivos de Logistics
mv TravelsUI.js logistics/
mv LogisticsMastersUI.js logistics/
mv FuelEfficiencyUI.js logistics/
mv LiquidationsUI.js logistics/

# Mover archivos de Accounting
mv AccountingUI.js accounting/
mv ChecksUI.js accounting/
mv PriceAnalysisUI.js accounting/

# Mover archivos de Production
mv ConsumptionUI.js production/
mv EstablishmentUI.js production/

# Mover archivos Core
mv DashboardUI.js core/
mv ClientsUI.js core/
mv SettingsUI.js core/
mv SimulatorUI.js core/
mv PriceShareUI.js core/

echo "Archivos movidos exitosamente."
