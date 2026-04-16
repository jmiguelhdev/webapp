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
