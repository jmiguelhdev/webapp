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
        'Kg Limpios': p.totalKgClean || 0,
        'Precio Promedio': p.avgPrice?.toFixed(2) || '0.00',
        'Neto ($)': p.totalOperation || 0,
        'IVA ($)': p.totalIva || 0,
        'Ganancias ($)': p.totalGanancias || 0,
        'Total Factura ($)': p.totalBillFactura || 0
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
 * Print Formatted Checks Report directly via Browser
 */
export function printChecksReport(checks, contacts, options) {
  const { fromDate, toDate } = options;
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
    const buyer = contacts.find(c => c.id === op.sellSide?.contactId)?.name || '-';
    
    let statusText = 'En Cartera';
    const st = op.sellSide?.status;
    if (st === 'SOLD') statusText = 'Vendido';
    else if (st === 'RETURNED') statusText = 'Devuelto';
    else if (st === 'REJECTED') statusText = 'Rechazado';
    else if (st === 'BACK') statusText = 'Volvió';

    return `
      <tr>
        <td>
          <div style="font-weight:600;">${op.bank || '-'}</div>
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
          <div style="font-size:11px;"><span style="color:#666;">A:</span> ${isSold ? buyer : '-'}</div>
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
      <title>Reporte de Cheques</title>
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
            <img src="/logo.jpg" class="logo" alt="Logo">
            <h1 class="company-name">FRIGORÍFICO PAMPA</h1>
          </div>
          <div class="receipt-info">
            <div class="receipt-label">Reporte de Cheques</div>
            <div class="receipt-date">${nowStr}</div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <h3 style="margin: 0 0 10px 0;">Filtro de Reporte</h3>
          <p style="margin: 0;">Periodo: <strong>${fromStr}</strong> al <strong>${toStr}</strong></p>
          <p style="margin: 5px 0 0 0;">Total de Registros: <strong>${checks.length}</strong></p>
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
