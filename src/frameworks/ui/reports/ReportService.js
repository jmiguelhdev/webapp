import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

/** 
 * Generate Professional PDF Report 
 * Simple table-based report using jsPDF
 */
export async function generateTravelReport(travels) {
  const doc = new jsPDF();
  const primaryColor = [132, 29, 29]; // #841d1d
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('REPORTE DE VIAJES KMP', 15, 25);
  
  doc.setFontSize(10);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 150, 25);

  // Stats Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Resumen de Periodo', 15, 55);
  
  const totalKg = travels.reduce((sum, t) => sum + (t.buy?.totalKgClean || 0), 0);
  const totalOp = travels.reduce((sum, t) => sum + (t.buy?.totalOperation || 0), 0);
  const avgPrice = totalKg > 0 ? totalOp / totalKg : 0;

  doc.setFontSize(11);
  doc.text(`Total Viajes: ${travels.length}`, 15, 65);
  doc.text(`Kilos Totales: ${totalKg.toLocaleString()} kg`, 80, 65);
  doc.text(`Precio Promedio: $${avgPrice.toFixed(2)}`, 150, 65);

  // Table Body
  let y = 85;
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Detalle Viaje por Viaje', 15, y - 5);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  
  // Table Header row
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, 195, y);
  doc.text('ID / Camión', 15, y + 5);
  doc.text('Fecha', 60, y + 5);
  doc.text('Categorías', 90, y + 5);
  doc.text('Kg Limpios', 140, y + 5);
  doc.text('Precio Prom.', 170, y + 5);
  y += 10;
  doc.line(15, y, 195, y);
  y += 5;

  travels.forEach((t, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    
    const buy = t.buy || {};
    doc.setTextColor(0, 0, 0);
    doc.text(`${t.truck?.name || 'V' + t.id}`, 15, y);
    doc.text(`${t.date || ''}`, 60, y);
    doc.text(`${(buy.categories || []).join(', ').substring(0, 20)}`, 90, y);
    doc.text(`${(buy.totalKgClean || 0).toLocaleString()}`, 140, y);
    doc.text(`$${(buy.avgPrice || 0).toFixed(2)}`, 170, y);
    
    y += 8;
  });

  doc.save(`Reporte_Viajes_KMP_${Date.now()}.pdf`);
}

/**
 * Generate Excel (XLSX) Accounting Report using flattened producer data
 */
export async function generateExcelReport(travels) {
  const rows = [];
  
  travels.forEach(t => {
    const buy = t.buy || {};
    const truckName = t.truck?.name || 'N/A';
    const plate = t.truck?.licensePlate || 'N/A';
    const driver = t.driver?.name || 'N/A';
    const agent = buy.agent?.name || 'N/A';
    
    (buy.listOfProducers || []).forEach(p => {
      const producerName = p.producer?.name || 'N/A';
      const producerCuit = p.producer?.cuit || 'N/A';
      
      // Categorías del productor
      const pCategories = (p.listOfProducts || []).map(pr => pr.name).join(', ');
      
      const kgClean = p.totalKgClean || 0;
      const kgFaena = p.totalKgFaena || 0;
      const totalWithComm = p.totalOpPlusComm || 0;
      const avgPriceWithComm = kgClean > 0 ? totalWithComm / kgClean : 0;
      const rendimiento = kgClean > 0 ? (kgFaena / kgClean) * 100 : 0;

      rows.push({
        'Fecha': t.date || '',
        'ID Viaje': t.id,
        'Camión': truckName,
        'Patente': plate,
        'Chofer': driver,
        'Comisionista': agent,
        'Productor': producerName,
        'CUIT Productor': producerCuit,
        'Categorías': pCategories,
        'Cabezas': p.totalQuantity || 0,
        'Kg Limpios': kgClean,
        'Kg Faena': kgFaena,
        'Rendimiento (%)': rendimiento.toFixed(2),
        'Precio Prom. ($/kg)': avgPriceWithComm.toFixed(2),
        'Total c/ Comisión ($)': totalWithComm,
        'Neto ($)': p.neto || 0,
        'IVA ($)': p.totalIva || 0,
        'Ganancias ($)': p.totalGanancias || 0,
        'Factura ($)': p.totalFactura || 0
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Contable");
  
  // Auto-width columns
  const wscols = Object.keys(rows[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Reporte_Contable_KMP_${Date.now()}.xlsx`);
}

/**
 * Generate Excel (XLSX) Accounting Movements Report
 */
export async function generateAccountingExcel(entries, title) {
  if (!entries || entries.length === 0) return;

  const rows = entries.map(e => {
    const isIncome = e.type === 'IN';
    let diffStr = '-';
    if (e.countedAmount !== undefined && e.countedAmount !== null) {
      const diff = e.countedAmount - e.amount;
      diffStr = Math.abs(diff) < 0.01 ? 'OK' : (diff > 0 ? `Sobra ${diff.toFixed(2)}` : `Falta ${Math.abs(diff).toFixed(2)}`);
    }

    return {
      'Fecha': new Date(e.createdAt).toLocaleDateString('es-AR'),
      'Hora': new Date(e.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      'Tipo': isIncome ? 'INGRESO (+)' : 'EGRESO (-)',
      'Descripción / Concepto': e.description || '',
      'Entidad (Cliente/Prod)': e.clientName || e.producerName || '-',
      'Monto ($)': e.amount || 0,
      'Resultado Arqueo': diffStr
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");

  // Auto-width columns
  const wscols = [
    { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 20 }
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Movimientos_${title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
}

/**
 * Generate Excel (XLSX) Checks Report
 */
export async function generateChecksExcel(checks, contacts) {
  if (!checks || checks.length === 0) return;

  const rows = checks.map(op => {
    const isSold = op.sellSide && op.sellSide.status === 'SOLD';
    const seller = contacts.find(c => c.id === op.buySide?.contactId)?.name || 'Desconocido';
    const buyer = contacts.find(c => c.id === op.sellSide?.contactId)?.name || '-';
    
    let statusText = 'En Cartera';
    const st = op.sellSide?.status;
    if (st === 'SOLD') statusText = 'Vendido';
    else if (st === 'RETURNED') statusText = 'Devuelto';
    else if (st === 'REJECTED') statusText = 'Rechazado';
    else if (st === 'BACK') statusText = 'Volvió';

    return {
      'Banco': op.bank || '-',
      '# Cheque': op.checkNumber || '-',
      'Tipo': op.isECheck ? 'E-Cheque' : 'Físico',
      'Librador': op.issuerName || '-',
      'CUIT Librador': op.issuerCuit || '-',
      'F. Emisión': op.issueDate ? new Date(op.issueDate).toLocaleDateString('es-AR') : '-',
      'F. Recepción': op.receptionDate ? new Date(op.receptionDate).toLocaleDateString('es-AR') : '-',
      'F. Pago': op.dueDate ? new Date(op.dueDate).toLocaleDateString('es-AR') : '-',
      'Plazo (días)': op.days || 0,
      'Valor Nominal ($)': op.nominalValue || 0,
      'Vendedor (Origen)': seller,
      'Comprador (Destino)': isSold ? buyer : '-',
      'Estado': statusText,
      'Ganancia ($)': isSold ? (op.profit || 0) : 0,
      'Notas': op.notes || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Cheques");

  const wscols = [
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Reporte_Cheques_${Date.now()}.xlsx`);
}

/**
 * Imprime un reporte formateado de cheques directamente usando la funcionalidad de impresión nativa del navegador.
 *
 * @param {Array<Check>} checks - Colección de cheques a listar en el reporte.
 * @param {Array<Object>} contacts - Catálogo de contactos registrados.
 * @param {Object} options - Parámetros de personalización y filtrado.
 * @param {Date|null} options.fromDate - Fecha de inicio del filtro aplicado (opcional).
 * @param {Date|null} options.toDate - Fecha de fin del filtro aplicado (opcional).
 * @param {string} [options.title] - Título personalizado para el reporte (opcional).
 * @param {string} [options.subtitle] - Subtítulo descriptivo de la selección (opcional).
 * @returns {void}
 */
export function printChecksReport(checks, contacts, options = {}) {
  const { fromDate, toDate, title, subtitle, includeContacts = null } = options;
  const isInstitutional = includeContacts !== null 
    ? Boolean(includeContacts) 
    : (localStorage.getItem('checks_print_include_contacts') === 'true');

  const printWindow = window.open('', '_blank', 'width=1000,height=900');
  
  const fromStr = fromDate ? fromDate.toLocaleDateString('es-AR') : 'Inicio';
  const toStr = toDate ? toDate.toLocaleDateString('es-AR') : 'Hoy';
  const nowStr = new Date().toLocaleString('es-AR');

  const totalNominal = checks.reduce((sum, c) => sum + (parseFloat(c.nominalValue) || 0), 0);
  const totalProfit = checks.reduce((sum, c) => {
    return c.sellSide?.status === 'SOLD' ? sum + (c.profit || 0) : sum;
  }, 0);

  const rowsHtml = checks.map(op => {
    const isSold = op.sellSide && op.sellSide.status === 'SOLD';
    const seller = contacts.find(c => c.id === op.buySide?.contactId)?.name || 'Desconocido';
    const buyer = isInstitutional ? (contacts.find(c => c.id === op.sellSide?.contactId)?.name || '-') : '-';
    
    let statusText = 'En Cartera';
    const st = op.sellSide?.status;
    if (st === 'SOLD') statusText = 'Vendido';
    else if (st === 'RETURNED') statusText = 'Devuelto';
    else if (st === 'REJECTED') statusText = 'Rechazado';
    else if (st === 'BACK') statusText = 'Volvió';

    return `
      <tr>
        <td>
          <div style="font-weight:600; display:flex; align-items:center; gap:4px;">
            ${op.bank || '-'}
            <span style="font-size: 8px; font-weight: 800; background: ${op.isECheck ? '#e0e7ff' : '#fef3c7'}; color: ${op.isECheck ? '#4f46e5' : '#d97706'}; padding: 1px 4px; border-radius: 3px; font-family: sans-serif; text-transform: uppercase;">${op.isECheck ? 'E-Cheq' : 'Físico'}</span>
          </div>
          <div style="font-size:11px; color:#666;">#${op.checkNumber || '-'}</div>
        </td>
        <td>
          <div>${op.dueDate ? new Date(op.dueDate).toLocaleDateString('es-AR') : '-'}</div>
          ${op.issueDate ? `<div style="font-size:10px; color:#888;">Emi: ${new Date(op.issueDate).toLocaleDateString('es-AR')}</div>` : ''}
        </td>
        <td>
          <div style="font-weight:600;">${op.issuerName || '-'}</div>
          <div style="font-size:10px; color:#666;">${op.issuerCuit || ''}</div>
        </td>
        <td>
          <div style="font-size:11px;"><span style="color:#666;">De:</span> ${seller}</div>
          ${isInstitutional ? `<div style="font-size:11px;"><span style="color:#666;">A:</span> ${isSold ? buyer : '-'}</div>` : ''}
        </td>
        <td>${statusText}</td>
        <td class="amount">${(parseFloat(op.nominalValue) || 0).toLocaleString('es-AR')}</td>
        <td class="amount">${isSold ? (op.profit || 0).toLocaleString('es-AR') : '-'}</td>
      </tr>
      ${op.notes ? `<tr><td colspan="8" style="font-size:10px; color:#777; border-top:none; padding-top:0;">📝 Nota: ${op.notes}</td></tr>` : ''}
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title || (isInstitutional ? 'Reporte de Cheques - Frigorífico Pampa' : 'Reporte de Cheques')}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; line-height: 1.4; margin: 0; background: #fff; }
        .receipt-card { max-width: 900px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #5d5fef; padding-bottom: 15px; margin-bottom: 20px; }
        .logo-area { display: flex; align-items: center; gap: 10px; }
        .logo { width: 150px; height: auto; max-height: 80px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: 24px; font-weight: 800; color: #5d5fef; margin: 0; }
        .receipt-info { text-align: right; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: 16px; }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px; }
        .table th { background: #f4f4f4; padding: 10px 5px; text-align: left; border-bottom: 2px solid #ddd; }
        .table td { padding: 8px 5px; border-bottom: 1px solid #eee; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; }
        .totals { margin-top: 30px; border-top: 2px solid #5d5fef; padding-top: 15px; display: flex; justify-content: flex-end; gap: 40px; }
        .totals div { text-align: right; }
        .totals h4 { margin: 0 0 5px 0; color: #555; }
        .totals .value { font-size: 20px; font-weight: bold; }
        @media print {
          body { padding: 0; margin: 0; }
          .receipt-card { border: none; padding: 0; width: 100%; max-width: none; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="logo-area">
            ${isInstitutional ? `<img src="/logo.jpg" class="logo" alt="Logo">` : ''}
            <h1 class="company-name">${isInstitutional ? 'FRIGORÍFICO PAMPA' : 'REPORTE DE CHEQUES'}</h1>
          </div>
          <div class="receipt-info">
            <div class="receipt-label">${title || 'Reporte de Cheques'}</div>
            <div class="receipt-date">${nowStr}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <h3 style="margin: 0 0 10px 0;">${subtitle || 'Filtro de Reporte'}</h3>
          ${subtitle ? '' : `<p style="margin: 0;">Periodo: <strong>${fromStr}</strong> al <strong>${toStr}</strong></p>`}
          <p style="${subtitle ? 'margin: 0;' : 'margin: 5px 0 0 0;'}">Total de Registros: <strong>${checks.length}</strong></p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Banco / #</th>
              <th>F. Pago / Emisión</th>
              <th>Librador (CUIT)</th>
              <th>Origen / Destino</th>
              <th>Estado</th>
              <th class="amount">V. Nominal ($)</th>
              <th class="amount">Ganancia ($)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div>
            <h4>Total Nominal</h4>
            <div class="value">$${totalNominal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <h4>Total Ganancia Realizada</h4>
            <div class="value" style="color: #2e7d32;">$${totalProfit.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
        
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onfocus = function() { window.close(); }
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Print Auxiliary Calculator details
 */
export function printAuxiliaryCalcReport(breakdown, grandTotal, moduleTitle = 'Caja General') {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  
  const nowStr = new Date().toLocaleString('es-AR');

  const rowsHtml = Object.keys(breakdown).sort((a,b) => b - a).map(denom => {
    const row = breakdown[denom];
    if (row.blocks === 0 && row.batches === 0 && row.qtys === 0) return '';
    return `
      <tr>
        <td style="font-weight: 600;">$ ${parseInt(denom).toLocaleString('es-AR')}</td>
        <td style="text-align: center;">${row.blocks > 0 ? row.blocks : '-'}</td>
        <td style="text-align: center;">${row.batches > 0 ? row.batches : '-'}</td>
        <td style="text-align: center;">${row.qtys > 0 ? row.qtys : '-'}</td>
        <td class="amount">$ ${row.subtotal.toLocaleString('es-AR')}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recuento Auxiliar de Billetes</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; line-height: 1.4; margin: 0; background: #fff; }
        .receipt-card { max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #5d5fef; padding-bottom: 15px; margin-bottom: 20px; }
        .logo-area { display: flex; align-items: center; gap: 10px; }
        .logo { width: 150px; height: auto; max-height: 80px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: 24px; font-weight: 800; color: #5d5fef; margin: 0; }
        .receipt-info { text-align: right; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: 14px; }
        .table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 20px; }
        .table th { background: #f4f4f4; padding: 10px 5px; text-align: left; border-bottom: 2px solid #ddd; }
        .table td { padding: 10px 5px; border-bottom: 1px solid #eee; vertical-align: middle; }
        .table th.center { text-align: center; }
        .amount { text-align: right; white-space: nowrap; font-weight: 600; }
        .totals { margin-top: 30px; border-top: 2px dashed #5d5fef; padding-top: 15px; text-align: right; }
        .totals h4 { margin: 0 0 5px 0; color: #555; text-transform: uppercase; font-size: 12px; }
        .totals .value { font-size: 28px; font-weight: 800; color: #5d5fef; }
        .disclaimer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; font-style: italic; }
        @media print {
          body { padding: 0; margin: 0; }
          .receipt-card { border: none; padding: 0; width: 100%; max-width: none; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="logo-area">
            <img src="/logo.jpg" class="logo" alt="Logo">
            <h1 class="company-name">FRIGORÍFICO PAMPA</h1>
          </div>
          <div class="receipt-info">
            <div class="receipt-label">Recuento Auxiliar</div>
            <div class="receipt-date">${nowStr}</div>
            <div style="font-size: 11px; color: #333; margin-top: 4px;">Módulo: ${moduleTitle}</div>
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              <th>Denominación</th>
              <th class="center">Bloques<br><small>(1000u)</small></th>
              <th class="center">Fajos<br><small>(100u)</small></th>
              <th class="center">Sueltos<br><small>(1u)</small></th>
              <th class="amount">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals">
          <h4>Total Contado</h4>
          <div class="value">$ ${grandTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        
        <div class="disclaimer">
          Detalle impreso de recuento auxiliar de billetes físico. Documento sin validez fiscal originado de recuento de caja.
        </div>
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onfocus = function() { window.close(); }
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Print Dispatch Preparation Ticket
 */
export function printDispatchPreparation(data) {
  const { selectedItems, client, grandTotal, totalKg, byCategory } = data;
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  
  const nowStr = new Date().toLocaleString('es-AR');

  const rowsHtml = selectedItems.map(item => {
    return `
      <tr>
        <td>#${item.garron}</td>
        <td>${item.tropa}</td>
        <td>${item.standardizedCategory || item.category}</td>
        <td class="amount">${(item.kg || 0).toFixed(1)} kg</td>
      </tr>
    `;
  }).join('');

  const catSummaryHtml = Object.entries(byCategory).map(([cat, d]) => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
      <span>${cat} (${d.kg.toFixed(1)} kg x $${d.price})</span>
      <span style="font-weight: bold;">$ ${d.subtotal.toLocaleString('es-AR')}</span>
    </div>
  `).join('');

  const destName = client?.name || 'No especificado';
  const destCuit = client?.document ? `<p style="margin: 3px 0 0 0; color: #555; font-size: 13px;">CUIT: ${client.document}</p>` : '';
  const destAddr = client?.address ? `<p style="margin: 3px 0 0 0; color: #555; font-size: 13px;">Dirección: ${client.address}</p>` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Despacho | Frigorífico Pampa</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; line-height: 1.4; margin: 0; background: #fff; }
        .receipt-card { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ef4444; padding-bottom: 15px; margin-bottom: 20px; }
        .logo-area { display: flex; align-items: center; gap: 10px; }
        .logo { width: 150px; height: auto; max-height: 80px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: 24px; font-weight: 800; color: #ef4444; margin: 0; }
        .receipt-info { text-align: right; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: 16px; }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px; }
        .table th { background: #f4f4f4; padding: 10px 5px; text-align: left; border-bottom: 2px solid #ddd; }
        .table td { padding: 8px 5px; border-bottom: 1px solid #eee; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; }
        .totals { margin-top: 30px; border-top: 2px solid #ef4444; padding-top: 15px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
        .totals h4 { margin: 0 0 5px 0; color: #555; }
        .totals .value { font-size: 20px; font-weight: bold; color: #10b981; }
        .disclaimer { margin-top: 40px; font-size: 11px; color: #888; text-align: center; border-top: 1px dashed #ccc; padding-top: 15px; }
        @media print {
          body { padding: 0; margin: 0; }
          .receipt-card { border: none; padding: 0; width: 100%; max-width: none; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="logo-area">
            <img src="/logo.jpg" class="logo" alt="Logo">
            <h1 class="company-name">FRIGORÍFICO PAMPA</h1>
          </div>
          <div class="receipt-info">
            <div class="receipt-label">REMITO INFORMATIVO (Borrador)</div>
            <div class="receipt-date">${nowStr}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
          <div>
            <h3 style="margin: 0 0 10px 0; color: #ef4444;">Destino / Cliente:</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${destName}</p>
            ${destCuit}
            ${destAddr}
          </div>
          <div style="text-align: right;">
            <p style="margin: 0;"><strong>${selectedItems.length}</strong> medias reses</p>
            <p style="margin: 5px 0 0 0;">Total Kg: <strong>${totalKg.toFixed(1)} kg</strong></p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Garrón Nº</th>
              <th>Tropa Nº</th>
              <th>Categoría</th>
              <th class="amount">Peso (kg)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals" style="width: 100%; max-width: 350px; margin-left: auto;">
          <div style="width: 100%; text-align: left; margin-bottom: 10px;">
            <h4 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Detalle de Liquidación</h4>
            ${catSummaryHtml}
          </div>
          <div style="width: 100%; display: flex; justify-content: space-between; border-top: 2px solid #ef4444; padding-top: 10px;">
            <h4 style="margin: 0;">TOTAL ESTIMADO:</h4>
            <div class="value">$ ${grandTotal.toLocaleString('es-AR')}</div>
          </div>
        </div>
        
        <div class="disclaimer">
          Documento no válido como factura. Remito informativo de despacho de carnes. Generado por Gestor KMP.
        </div>
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onfocus = function() { window.close(); }
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Print Formatted Sale Operation Report proforma or saved
 */
export function printSaleOperationReport(operationId, buyerName, dateStr, checks, contacts, includeContacts = null) {
  const isInstitutional = includeContacts !== null 
    ? Boolean(includeContacts) 
    : (localStorage.getItem('checks_print_include_contacts') === 'true');

  const printWindow = window.open('', '_blank', 'width=1000,height=900');
  const nowStr = new Date().toLocaleString('es-AR');
  const dateFormatted = dateStr ? new Date(dateStr).toLocaleString('es-AR') : nowStr;
  
  const totalNominal = checks.reduce((sum, c) => sum + (parseFloat(c.nominalValue) || 0), 0);
  const totalNetCompra = checks.reduce((sum, c) => sum + (parseFloat(c.buySide?.netAmount) || 0), 0);
  const totalNetVenta = checks.reduce((sum, c) => sum + (parseFloat(c.sellSide?.netAmount) || 0), 0);
  const totalProfit = totalNetVenta - totalNetCompra;

  const rowsHtml = checks.map(op => {
    const seller = contacts.find(c => c.id === op.buySide?.contactId)?.name || op.buySide?.contactId || 'Desconocido';
    return `
      <tr>
        <td>
          <div style="font-weight:600;">${op.bank || '-'}</div>
          <div style="font-size:11px; color:#666;">#${op.checkNumber || '-'}</div>
        </td>
        <td>
          <div>${op.dueDate ? new Date(op.dueDate).toLocaleDateString('es-AR') : '-'}</div>
          <div style="font-size:10px; color:#888;">Clear: ${op.clearing || 0}d · Plazo: ${op.days || 0}d</div>
        </td>
        <td>
          <div style="font-weight:600;">${op.issuerName || '-'}</div>
          <div style="font-size:10px; color:#666;">${op.issuerCuit || ''}</div>
        </td>
        <td>
          <div style="font-size:11px;"><span style="color:#666;">De:</span> ${seller}</div>
          <div style="font-size:10px; color:#888;">Tasa C: ${op.buySide?.monthlyInterest || 0}% · P: ${op.buySide?.pesificacionRate || 0}%</div>
        </td>
        <td class="amount">${(parseFloat(op.nominalValue) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="amount">${(parseFloat(op.sellSide?.netAmount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="amount" style="color: #2e7d32; font-weight:600;">+${(parseFloat(op.profit) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      ${op.notes ? `<tr><td colspan="7" style="font-size:10px; color:#777; border-top:none; padding-top:0;">📝 Nota: ${op.notes}</td></tr>` : ''}
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Operación de Venta de Cheques</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; line-height: 1.4; margin: 0; background: #fff; }
        .receipt-card { max-width: 900px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
        .logo-area { display: flex; align-items: center; gap: 10px; }
        .logo { width: 150px; height: auto; max-height: 80px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: 24px; font-weight: 800; color: #10b981; margin: 0; }
        .receipt-info { text-align: right; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: 16px; }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px; }
        .table th { background: #f4f4f4; padding: 10px 5px; text-align: left; border-bottom: 2px solid #ddd; }
        .table td { padding: 8px 5px; border-bottom: 1px solid #eee; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; }
        .totals { margin-top: 30px; border-top: 2px solid #10b981; padding-top: 15px; display: flex; justify-content: flex-end; gap: 40px; }
        .totals div { text-align: right; }
        .totals h4 { margin: 0 0 5px 0; color: #555; }
        .totals .value { font-size: 18px; font-weight: bold; }
        @media print {
          body { padding: 0; margin: 0; }
          .receipt-card { border: none; padding: 0; width: 100%; max-width: none; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="logo-area">
            ${isInstitutional ? `<img src="/logo.jpg" class="logo" alt="Logo">` : ''}
            <h1 class="company-name">${isInstitutional ? 'FRIGORÍFICO PAMPA' : 'LIQUIDACIÓN DE VENTA'}</h1>
          </div>
          <div class="receipt-info">
            <div class="receipt-label">Comprobante de Venta de Cheques</div>
            <div class="receipt-date">${operationId || 'PROFORMA'}</div>
            <div style="font-size:11px; color:#555; margin-top:5px;">Fecha: ${dateFormatted}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
          <div>
            <h3 style="margin: 0 0 5px 0;">${isInstitutional ? 'Comprador / Destinatario:' : 'Resumen de Venta:'}</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #10b981;">${isInstitutional ? (buyerName || 'No especificado') : 'Operación de Venta de Cheques'}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0;">Cantidad de Cheques: <strong>${checks.length}</strong></p>
            <p style="margin: 5px 0 0 0;">Condiciones promedio: <strong>Tasa Venta: ${checks[0]?.sellSide?.monthlyInterest || 0}% · Pesif Venta: ${checks[0]?.sellSide?.pesificacionRate || 0}%</strong></p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Banco / #</th>
              <th>F. Pago / Plazo</th>
              <th>Librador (CUIT)</th>
              <th>Origen / Tasas C.</th>
              <th class="amount">V. Nominal ($)</th>
              <th class="amount">Neto Venta ($)</th>
              <th class="amount">Ganancia ($)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div>
            <h4>Total Nominal</h4>
            <div class="value">$${totalNominal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <h4>Neto Venta Recibido</h4>
            <div class="value" style="color: #10b981;">$${totalNetVenta.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <h4>Ganancia Realizada</h4>
            <div class="value" style="color: #2e7d32;">$${totalProfit.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
        
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onfocus = function() { window.close(); }
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Print Formatted Buy Operation Report (Standard PDF/A4 or Thermal 80mm)
 * @param {string} operationId - ID de la operación (ej: CMP-XXXX) o 'PROFORMA'
 * @param {string} sellerName - Nombre del vendedor/operador
 * @param {string} dateStr - Fecha ISO de la operación
 * @param {Array<Check>} checks - Lista de cheques que componen la compra
 * @param {Array<Object>} contacts - Catálogo de contactos
 * @param {'standard'|'thermal'} type - Formato de impresión ('standard' para A4/PDF o 'thermal' para ticket 80mm)
 */
export function printBuyOperationReport(operationId, sellerName, dateStr, checks, contacts, type = 'standard', includeContacts = null) {
  if (!checks || checks.length === 0) return;
  const isInstitutional = includeContacts !== null 
    ? Boolean(includeContacts) 
    : (localStorage.getItem('checks_print_include_contacts') === 'true');

  const nowStr = new Date().toLocaleString('es-AR');
  const dateFormatted = dateStr 
    ? new Date(dateStr.length === 10 && !dateStr.includes('T') ? dateStr + 'T00:00:00' : dateStr).toLocaleString('es-AR') 
    : nowStr;
  const isThermal = type === 'thermal';

  const sellerContact = contacts ? contacts.find(c => c.name?.toLowerCase() === sellerName?.toLowerCase() || c.id === sellerName) : null;
  const sellerDisplay = sellerName || sellerContact?.name || 'No especificado';
  const sellerCuit = (isInstitutional && sellerContact?.cuit) ? ` (CUIT: ${sellerContact.cuit})` : '';

  const totalNominal = checks.reduce((sum, c) => sum + (parseFloat(c.nominalValue) || 0), 0);
  const totalNetCompra = checks.reduce((sum, c) => sum + (parseFloat(c.buySide?.netAmount) || 0), 0);
  const totalDiscount = totalNominal - totalNetCompra;

  const avgPesif = checks.length > 0 ? (checks.reduce((sum, c) => sum + (parseFloat(c.buySide?.pesificacionRate) || 0), 0) / checks.length).toFixed(2) : '0.00';
  const avgInterest = checks.length > 0 ? (checks.reduce((sum, c) => sum + (parseFloat(c.buySide?.monthlyInterest) || 0), 0) / checks.length).toFixed(2) : '0.00';

  let html = '';

  if (isThermal) {
    // FORMATO TÉRMICO (80mm)
    const itemsHtml = checks.map((op, idx) => {
      const nom = (parseFloat(op.nominalValue) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const net = (parseFloat(op.buySide?.netAmount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const dueFormatted = op.dueDate ? new Date(op.dueDate + (op.dueDate.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('es-AR') : '-';
      const typeLabel = op.isECheck ? 'E-CHEQ' : 'FÍSICO';

      return `
        <div style="border-bottom: 1px dashed #bbb; padding: 6px 0; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>#${idx + 1} ${op.bank || 'BANCO'} - Nº ${op.checkNumber || 'S/N'}</span>
            <span style="font-size: 9px; border: 1px solid #444; padding: 0 3px; border-radius: 3px;">${typeLabel}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #444; margin-top: 2px;">
            <span>Venc: ${dueFormatted} (${op.days || 0}d)</span>
            <span>Tasa: ${op.buySide?.monthlyInterest || 0}% / P: ${op.buySide?.pesificacionRate || 0}%</span>
          </div>
          ${op.issuerName ? `<div style="color: #555; font-size: 10px;">Lib: ${op.issuerName} ${op.issuerCuit ? '(' + op.issuerCuit + ')' : ''}</div>` : ''}
          <div style="display: flex; justify-content: space-between; margin-top: 3px; font-weight: 600;">
            <span>Nominal: $${nom}</span>
            <strong style="font-size: 12px; color: #000;">Neto: $${net}</strong>
          </div>
          ${op.notes ? `<div style="font-size: 9px; color: #666; font-style: italic; margin-top: 2px;">Nota: ${op.notes}</div>` : ''}
        </div>
      `;
    }).join('');

    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket Compra Cheques - ${operationId || 'PROFORMA'}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 8px; 
            color: #000; 
            line-height: 1.3; 
            margin: 0; 
            background: #fff; 
          }
          .receipt-thermal { 
            width: 100%; 
            max-width: 300px; 
            margin: 0 auto; 
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 8px; 
            margin-bottom: 10px; 
          }
          .logo { 
            width: 110px; 
            height: auto; 
            max-height: 60px; 
            object-fit: contain; 
            display: block; 
            margin: 0 auto 4px; 
          }
          .company-name { 
            font-size: 16px; 
            font-weight: 800; 
            margin: 0; 
            letter-spacing: 0.5px; 
          }
          .title { 
            font-size: 11px; 
            font-weight: 700; 
            text-transform: uppercase; 
            margin-top: 3px; 
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            font-size: 10px; 
            margin-top: 2px; 
          }
          .seller-box { 
            background: #f8f8f8; 
            border: 1px solid #ddd; 
            padding: 6px; 
            border-radius: 4px; 
            margin-bottom: 10px; 
            font-size: 11px; 
          }
          .totals-box { 
            border-top: 2px solid #000; 
            margin-top: 10px; 
            padding-top: 8px; 
            font-size: 11px; 
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 3px; 
          }
          .grand-total { 
            display: flex; 
            justify-content: space-between; 
            font-size: 14px; 
            font-weight: 800; 
            border-top: 1px dashed #000; 
            padding-top: 5px; 
            margin-top: 5px; 
          }
          .signature-area { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 9px; 
            border-top: 1px solid #000; 
            padding-top: 5px; 
          }
          @media print {
            body { padding: 0; margin: 0; width: 80mm; }
            .receipt-thermal { max-width: 100%; width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-thermal">
          <div class="header">
            ${isInstitutional ? `<img src="/logo.jpg" class="logo" alt="Logo" onerror="this.style.display='none'">` : ''}
            <h1 class="company-name">${isInstitutional ? 'FRIGORÍFICO PAMPA' : 'LIQUIDACIÓN DE COMPRA'}</h1>
            <div class="title">LIQUIDACIÓN DE COMPRA DE CHEQUES</div>
            <div class="info-row" style="margin-top: 5px;">
              <span>OP: <strong>${operationId || 'PROFORMA'}</strong></span>
              <span>${dateFormatted}</span>
            </div>
          </div>

          <div class="seller-box">
            <div style="font-size: 9px; color: #666; text-transform: uppercase; font-weight: 700;">Vendedor / Operador:</div>
            <div style="font-weight: 800; font-size: 12px; margin-top: 1px;">${sellerDisplay}${sellerCuit}</div>
            <div style="font-size: 9px; color: #555; margin-top: 2px;">Cantidad Cheques: <strong>${checks.length}</strong> · Tasas prom: <strong>${avgInterest}% I / ${avgPesif}% P</strong></div>
          </div>

          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #000; padding-bottom: 2px;">Detalle de Cheques:</div>
          <div>
            ${itemsHtml}
          </div>

          <div class="totals-box">
            <div class="total-row">
              <span>Total Valor Nominal:</span>
              <strong style="font-family: monospace;">$${totalNominal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div class="total-row">
              <span>Total Descuento Aplicado:</span>
              <span style="font-family: monospace; color: #444;">-$${totalDiscount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="grand-total">
              <span>NETO A PAGAR:</span>
              <span style="font-family: monospace; font-size: 16px;">$${totalNetCompra.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div class="signature-area">
            <div style="margin-bottom: 35px;"></div>
            <div>Firma y Aclaración de Conformidad (${sellerDisplay})</div>
            <div style="color: #666; margin-top: 2px;">Recibí el importe neto detallado</div>
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.onfocus = function() { window.close(); }
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
  } else {
    // FORMATO ESTÁNDAR A4 (PDF / IMPRESIÓN FORMAL)
    const rowsHtml = checks.map((op, idx) => {
      const nom = (parseFloat(op.nominalValue) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const net = (parseFloat(op.buySide?.netAmount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const disc = ((parseFloat(op.nominalValue) || 0) - (parseFloat(op.buySide?.netAmount) || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const dueFormatted = op.dueDate ? new Date(op.dueDate + (op.dueDate.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('es-AR') : '-';
      const typeLabel = op.isECheck ? 'E-Cheq' : 'Físico';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; font-size: 13px;">${op.bank || '-'}</div>
            <div style="font-size: 11px; color: #666; display: flex; align-items: center; gap: 4px;">
              <span>#${op.checkNumber || '-'}</span>
              <span style="font-size: 9px; font-weight: 700; background: ${op.isECheck ? '#e0e7ff' : '#fef3c7'}; color: ${op.isECheck ? '#4338ca' : '#b45309'}; padding: 1px 4px; border-radius: 3px;">${typeLabel}</span>
            </div>
          </td>
          <td>
            <div style="font-weight: 600;">${dueFormatted}</div>
            <div style="font-size: 10px; color: #777;">Clear: ${op.clearing || 0}d · Plazo: ${op.days || 0}d</div>
          </td>
          <td>
            <div style="font-weight: 600;">${op.issuerName || '-'}</div>
            <div style="font-size: 10px; color: #666;">${op.issuerCuit ? 'CUIT: ' + op.issuerCuit : ''}</div>
          </td>
          <td>
            <div style="font-size: 11px;">Int: <strong>${op.buySide?.monthlyInterest || 0}%</strong></div>
            <div style="font-size: 10px; color: #777;">Pesif: ${op.buySide?.pesificacionRate || 0}%</div>
          </td>
          <td class="amount" style="font-family: monospace; font-size: 13px;">$${nom}</td>
          <td class="amount" style="font-family: monospace; font-size: 13px; color: #b45309;">-$${disc}</td>
          <td class="amount" style="font-family: monospace; font-size: 14px; font-weight: 700; color: #1d4ed8;">$${net}</td>
        </tr>
        ${op.notes ? `<tr><td colspan="7" style="font-size: 10px; color: #777; border-top: none; padding-top: 0; font-style: italic;">📝 Observaciones: ${op.notes}</td></tr>` : ''}
      `;
    }).join('');

    html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liquidación de Compra de Cheques - ${operationId || 'PROFORMA'}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #111; line-height: 1.4; margin: 0; background: #fff; }
          .receipt-card { max-width: 900px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-area { display: flex; align-items: center; gap: 12px; }
          .logo { width: 140px; height: auto; max-height: 75px; object-fit: contain; border-radius: 4px; }
          .company-name { font-size: 24px; font-weight: 800; color: #1e40af; margin: 0; letter-spacing: 0.5px; }
          .receipt-info { text-align: right; }
          .receipt-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
          .receipt-id { font-weight: 800; font-size: 18px; color: #0f172a; font-family: monospace; }
          .seller-card { margin-bottom: 20px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
          .table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 15px; }
          .table th { background: #f1f5f9; padding: 10px 8px; text-align: left; border-bottom: 2px solid #cbd5e1; color: #475569; font-weight: 700; font-size: 11px; text-transform: uppercase; }
          .table td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
          .amount { text-align: right; white-space: nowrap; }
          .totals { margin-top: 25px; border-top: 2px solid #3b82f6; padding-top: 15px; display: flex; justify-content: flex-end; gap: 35px; }
          .totals div { text-align: right; }
          .totals h4 { margin: 0 0 4px 0; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; }
          .totals .value { font-size: 18px; font-weight: 800; font-family: monospace; }
          .signatures { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .sig-box { border-top: 1px solid #94a3b8; padding-top: 8px; text-align: center; font-size: 11px; color: #475569; font-weight: 600; }
          @media print {
            body { padding: 0; margin: 0; }
            .receipt-card { border: none; padding: 0; width: 100%; max-width: none; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-card">
          <div class="header">
            <div class="logo-area">
              ${isInstitutional ? `<img src="/logo.jpg" class="logo" alt="Logo" onerror="this.style.display='none'">` : ''}
              <div>
                <h1 class="company-name">${isInstitutional ? 'FRIGORÍFICO PAMPA' : 'LIQUIDACIÓN DE COMPRA'}</h1>
                <div style="font-size: 12px; color: #64748b; font-weight: 600;">Liquidación de Cartera Financiera y Cheques</div>
              </div>
            </div>
            <div class="receipt-info">
              <div class="receipt-label">Liquidación de Compra de Cheques</div>
              <div class="receipt-id">${operationId || 'PROFORMA'}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Fecha: ${dateFormatted}</div>
            </div>
          </div>
          
          <div class="seller-card">
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">Vendedor / Operador:</div>
              <div style="font-size: 18px; font-weight: 800; color: #1e40af; margin-top: 2px;">${sellerDisplay}${sellerCuit}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: 700; color: #334155;">Cantidad de Cheques: <strong>${checks.length}</strong></div>
              <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Tasas aplicadas: <strong>Int. Mensual: ${avgInterest}% · Pesificación: ${avgPesif}%</strong></div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Banco / Nº Cheque</th>
                <th>F. Pago / Plazo</th>
                <th>Librador (CUIT)</th>
                <th>Tasas Compra</th>
                <th class="amount">V. Nominal ($)</th>
                <th class="amount">Desc. Compra ($)</th>
                <th class="amount">Neto Liquidado ($)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div>
              <h4>Total Nominal</h4>
              <div class="value" style="color: #0f172a;">$${totalNominal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div>
              <h4>Total Descuento</h4>
              <div class="value" style="color: #b45309;">-$${totalDiscount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div>
              <h4>Neto Total a Pagar</h4>
              <div class="value" style="color: #1d4ed8; font-size: 22px;">$${totalNetCompra.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div style="margin-bottom: 45px;"></div>
              ${isInstitutional ? 'Firma y Sello - Frigorífico Pampa' : 'Firma y Aclaración (Operador)'}
            </div>
            <div class="sig-box">
              <div style="margin-bottom: 45px;"></div>
              Firma y Aclaración - ${sellerDisplay}
            </div>
          </div>
          
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.onfocus = function() { window.close(); }
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
  }

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Generate Excel for a specific Buy Operation
 */
export function generateBuyOperationExcel(operationId, sellerName, dateStr, checks, contacts) {
  if (!checks || checks.length === 0) return;
  const rows = checks.map(c => {
    const seller = sellerName || contacts?.find(con => con.id === c.buySide?.contactId)?.name || c.buySide?.contactId || 'Desconocido';
    const disc = (parseFloat(c.nominalValue) || 0) - (parseFloat(c.buySide?.netAmount) || 0);
    return {
      'Banco': c.bank || '-',
      '# Cheque': c.checkNumber || '-',
      'Tipo': c.isECheck ? 'E-Cheque' : 'Físico',
      'Librador': c.issuerName || '-',
      'CUIT Librador': c.issuerCuit || '-',
      'F. Recepción': c.receptionDate ? new Date(c.receptionDate).toLocaleDateString('es-AR') : '-',
      'F. Pago': c.dueDate ? new Date(c.dueDate).toLocaleDateString('es-AR') : '-',
      'Clearing (días)': c.clearing || 0,
      'Plazo Total (días)': c.days || 0,
      'Valor Nominal ($)': parseFloat(c.nominalValue) || 0,
      'Pesificación Compra (%)': parseFloat(c.buySide?.pesificacionRate) || 0,
      'Interés Mensual Compra (%)': parseFloat(c.buySide?.monthlyInterest) || 0,
      'Descuento Compra ($)': disc,
      'Neto Pagado ($)': parseFloat(c.buySide?.netAmount) || 0,
      'Vendedor / Operador': seller,
      'Notas': c.notes || ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Compra Cheques");

  const wscols = [
    { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 13 }, { wch: 13 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 25 }
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Compra_Cheques_${operationId || 'PROFORMA'}_${Date.now()}.xlsx`);
}

/**
 * Generate Excel for a specific Sale Operation
 */
export function generateSaleOperationExcel(operationId, buyerName, dateStr, checks, contacts) {
  if (!checks || checks.length === 0) return;
  const rows = checks.map(c => {
    const seller = contacts.find(con => con.id === c.buySide?.contactId)?.name || c.buySide?.contactId || 'Desconocido';
    return {
      'Banco': c.bank || '-',
      '# Cheque': c.checkNumber || '-',
      'Librador': c.issuerName || '-',
      'CUIT Librador': c.issuerCuit || '-',
      'F. Recepción': c.receptionDate ? new Date(c.receptionDate).toLocaleDateString('es-AR') : '-',
      'F. Pago': c.dueDate ? new Date(c.dueDate).toLocaleDateString('es-AR') : '-',
      'Días': c.days || 0,
      'Valor Nominal ($)': c.nominalValue || 0,
      'Pesificación Venta (%)': c.sellSide?.pesificacionRate || 0,
      'Interés Mensual Venta (%)': c.sellSide?.monthlyInterest || 0,
      'Neto Compra ($)': c.buySide?.netAmount || 0,
      'Neto Venta ($)': c.sellSide?.netAmount || 0,
      'Ganancia Realizada ($)': c.profit || 0,
      'Vendedor (Origen)': seller,
      'Comprador (Destino)': buyerName || '-'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Venta Cheques");

  const wscols = [
    { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 }
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `Venta_Cheques_${operationId || 'PROFORMA'}_${Date.now()}.xlsx`);
}

/**
 * Export Detailed Travel-by-Travel Breakdown to Excel (XLSX)
 */
export function exportTravelBreakdownExcel(travels, categoryPrices = {}, filterInfo = {}) {
  if (!travels || travels.length === 0) {
    alert("No hay viajes para exportar con los filtros seleccionados.");
    return;
  }

  const rows = travels.map(t => {
    const buy = t.buy || {};
    const yieldPct = (buy.generalYield || 0) * 100;
    const priceVivo = buy.avgPrice || 0;
    const priceVivoComm = buy.avgPriceWithCommission || 0;
    const yieldRatio = yieldPct > 0 ? (yieldPct / 100) : 0;
    const costoGancho = yieldRatio > 0 ? (priceVivoComm / yieldRatio) : 0;
    const realCostGancho = costoGancho > 0 ? (costoGancho / (1 - 0.017)) : 0;

    // Compute weighted sell reference price across categories
    let weightedSellRef = 0;
    let totalCatKg = 0;
    (buy.listOfProducers || []).forEach(p => {
      (p.listOfProducts || []).forEach(pr => {
        const cat = pr.standardizedCategory || pr.name;
        const ref = parseFloat(categoryPrices[cat]) || 0;
        const kg = pr.kgClean || 0;
        if (ref > 0 && kg > 0) {
          weightedSellRef += ref * kg;
          totalCatKg += kg;
        }
      });
    });
    const sellPriceRef = totalCatKg > 0 ? weightedSellRef / totalCatKg : 0;
    const margin = (sellPriceRef > 0 && realCostGancho > 0) ? (sellPriceRef - realCostGancho) : 0;
    const marginPct = (sellPriceRef > 0 && realCostGancho > 0) ? (margin / realCostGancho) * 100 : 0;

    const producerNames = (buy.listOfProducers || []).map(p => {
      const pName = p.producer?.name || p.name || 'Productor';
      const pCuit = p.producer?.cuit || p.cuit ? ` (${p.producer?.cuit || p.cuit})` : '';
      return `${pName}${pCuit}`;
    }).join(', ') || 'Sin productores';

    const origins = (buy.listOfProducers || []).map(p => p.origin || '').filter(Boolean).join(', ') || '-';
    const categoriesStr = (buy.categories || []).join(', ') || '-';

    return {
      'ID Viaje': t.id || '',
      'Fecha': t.date || '',
      'Camión': t.truck?.name || '',
      'Patente': t.truck?.licensePlate || '',
      'Tropa #': t.tropa || t.buy?.tropa || '',
      'Comisionista': buy.agent?.name || 'Sin comisionista',
      'Comisión (%)': buy.agent?.percent ? `${buy.agent.percent}%` : '0%',
      'Productores': producerNames,
      'Orígenes': origins,
      'Categorías': categoriesStr,
      'Cabezas (Uds)': buy.totalQuantity || 0,
      'Kilos Limpios (Vivo)': buy.totalKgClean || 0,
      'Kilos Faena (Gancho)': buy.totalKgFaena || 0,
      'Rendimiento Faena (%)': parseFloat(yieldPct.toFixed(2)),
      'Precio Compra Vivo ($/kg)': parseFloat(priceVivo.toFixed(2)),
      'Precio Compra c/Comis ($/kg)': parseFloat(priceVivoComm.toFixed(2)),
      'Costo Gancho ($/kg)': costoGancho > 0 ? parseFloat(costoGancho.toFixed(2)) : 'Pendiente',
      'Costo Real Gancho ($/kg)': realCostGancho > 0 ? parseFloat(realCostGancho.toFixed(2)) : 'Pendiente',
      'Ref. Venta ($/kg)': sellPriceRef > 0 ? parseFloat(sellPriceRef.toFixed(2)) : 'N/A',
      'Margen ($/kg)': (sellPriceRef > 0 && realCostGancho > 0) ? parseFloat(margin.toFixed(2)) : 'Pendiente',
      'Margen (%)': (sellPriceRef > 0 && realCostGancho > 0) ? `${marginPct.toFixed(2)}%` : 'Pendiente',
      'Total Operación ($)': buy.totalOperation || 0,
      'Total Operación c/Comis ($)': buy.totalOperationWithCommission || 0
    };
  });

  // Calculate Totals / Summary Row
  const totalHeads = travels.reduce((sum, t) => sum + (t.buy?.totalQuantity || 0), 0);
  const totalClean = travels.reduce((sum, t) => sum + (t.buy?.totalKgClean || 0), 0);
  const totalFaena = travels.reduce((sum, t) => sum + (t.buy?.totalKgFaena || 0), 0);
  const globalYield = totalClean > 0 ? (totalFaena / totalClean) * 100 : 0;
  const totalOp = travels.reduce((sum, t) => sum + (t.buy?.totalOperation || 0), 0);
  const totalOpComm = travels.reduce((sum, t) => sum + (t.buy?.totalOperationWithCommission || 0), 0);
  const globalAvgPrice = totalClean > 0 ? totalOp / totalClean : 0;
  const globalAvgPriceComm = totalClean > 0 ? totalOpComm / totalClean : 0;
  const globalCostoGancho = globalYield > 0 ? (globalAvgPriceComm / (globalYield / 100)) : 0;
  const globalRealCost = globalCostoGancho / (1 - 0.017);

  rows.push({
    'ID Viaje': 'TOTAL CONSOLIDADO',
    'Fecha': `${travels.length} viajes`,
    'Camión': '',
    'Patente': '',
    'Tropa #': '',
    'Comisionista': '',
    'Comisión (%)': '',
    'Productores': '',
    'Orígenes': '',
    'Categorías': '',
    'Cabezas (Uds)': totalHeads,
    'Kilos Limpios (Vivo)': totalClean,
    'Kilos Faena (Gancho)': totalFaena,
    'Rendimiento Faena (%)': parseFloat(globalYield.toFixed(2)),
    'Precio Compra Vivo ($/kg)': parseFloat(globalAvgPrice.toFixed(2)),
    'Precio Compra c/Comis ($/kg)': parseFloat(globalAvgPriceComm.toFixed(2)),
    'Costo Gancho ($/kg)': parseFloat(globalCostoGancho.toFixed(2)),
    'Costo Real Gancho ($/kg)': parseFloat(globalRealCost.toFixed(2)),
    'Ref. Venta ($/kg)': '',
    'Margen ($/kg)': '',
    'Margen (%)': '',
    'Total Operación ($)': totalOp,
    'Total Operación c/Comis ($)': totalOpComm
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Desglose Viajes");

  const wscols = [
    { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 10 },
    { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 16 }, { wch: 16 },
    { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 20 },
    { wch: 22 }, { wch: 24 }, { wch: 18 }, { wch: 20 },
    { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 22 }
  ];
  worksheet['!cols'] = wscols;

  const fileName = `Desglose_Viajes_Faena_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}


