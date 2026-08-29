/**
 * AccountingReceipts.js
 * Módulo de generación e impresión de recibos contables (estándar y sueldo).
 * Pertenece a la capa de Reportes UI.
 */
import { formatCurrency } from '../../../frameworks/utils/formatters.js';

/**
 * Genera el HTML del detalle de recuento de billetes para un recibo.
 * @param {object} billCounts
 * @param {boolean} isThermal
 * @returns {string}
 */
function buildBillDetailsHtml(billCounts, isThermal) {
  if (!billCounts) return '';
  return `
    <div style="margin-top: ${isThermal ? '10px' : '20px'}; border-top: 1px solid #eee; padding-top: ${isThermal ? '10px' : '15px'};">
      <h4 style="margin-bottom: 8px; color: #444; font-size: ${isThermal ? '13px' : '16px'};">Detalle de Recuento:</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: ${isThermal ? '12px' : '14px'};">
        <tr style="background: #f9f9f9; text-align: left;">
          <th style="padding: 4px;">Denom.</th>
          <th style="padding: 4px; text-align: center;">Cant.</th>
          <th style="padding: 4px; text-align: right;">Total</th>
        </tr>
        ${Object.entries(billCounts).sort((a, b) => b[0] - a[0]).map(([denom, data]) => {
          const totalQty = (data.blocks || 0) * 1000 + (data.batches || 0) * 100 + (data.qtys || 0);
          return `
            <tr>
              <td style="padding: 4px;">$ ${parseInt(denom).toLocaleString()}</td>
              <td style="padding: 4px; text-align: center;">${totalQty}</td>
              <td style="padding: 4px; text-align: right;">$ ${data.subtotal.toLocaleString()}</td>
            </tr>
          `;
        }).join('')}
      </table>
    </div>
  `;
}

/**
 * Imprime un recibo de caja estándar (ingreso, egreso o retiro).
 * @param {object} entry
 * @param {'standard'|'thermal'} type
 */
export function printReceipt(entry, type = 'standard') {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  const dateStr = new Date().toLocaleDateString('es-AR');
  const timeStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const cuit = entry.clientCuit || entry.producerCuit;
  const entityName = (entry.clientName || entry.producerName || 'Consumidor Final') + (cuit ? ` (CUIT: ${cuit})` : '');
  const isIncome = entry.type === 'IN';
  const isThermal = type === 'thermal';

  const billDetailsHtml = buildBillDetailsHtml(entry.billCounts, isThermal);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comprobante - Frigorifico Pampa</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: ${isThermal ? '10px' : '40px'}; 
          color: #111; 
          line-height: 1.4; 
          margin: 0;
          background: #fff;
          position: relative;
        }
        .receipt-card { 
          border: ${isThermal ? 'none' : '1px solid #ddd'}; 
          padding: ${isThermal ? '0' : '30px'}; 
          border-radius: ${isThermal ? '0' : '8px'}; 
          max-width: ${isThermal ? '300px' : '600px'}; 
          margin: ${isThermal ? '0' : '0 auto'}; 
          box-shadow: ${isThermal ? 'none' : '0 4px 10px rgba(0,0,0,0.05)'}; 
          position: relative;
        }
        .indicator {
          position: absolute;
          top: 0;
          right: 0;
          font-size: 24px;
          font-weight: 900;
          color: #ddd;
          opacity: 0.5;
        }
        .header { 
          display: flex; 
          flex-direction: ${isThermal ? 'column' : 'row'};
          justify-content: ${isThermal ? 'center' : 'space-between'}; 
          align-items: ${isThermal ? 'center' : 'flex-start'}; 
          margin-bottom: 20px; 
          border-bottom: 2px solid ${isThermal ? '#000' : '#5d5fef'}; 
          padding-bottom: 15px;
          text-align: ${isThermal ? 'center' : 'left'};
        }
        .logo-area { display: flex; flex-direction: ${isThermal ? 'column' : 'row'}; align-items: center; gap: 10px; }
        .logo { width: ${isThermal ? '100px' : '150px'}; height: auto; max-height: 80px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: ${isThermal ? '16px' : '24px'}; font-weight: 800; color: ${isThermal ? '#000' : '#5d5fef'}; margin: 0; }
        .receipt-info { text-align: ${isThermal ? 'center' : 'right'}; margin-top: ${isThermal ? '10px' : '0'}; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: ${isThermal ? '13px' : '16px'}; }
        .section { margin-bottom: 15px; }
        .section-title { font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
        .val { font-size: ${isThermal ? '14px' : '18px'}; font-weight: 600; }
        .amount-box { 
          background: ${isThermal ? '#fff' : '#f4f7ff'}; 
          padding: 15px; 
          border-radius: 8px; 
          text-align: center; 
          border: ${isThermal ? '2px solid #000' : '1px dashed #5d5fef'}; 
          margin-top: 20px; 
        }
        .amount-val { font-size: ${isThermal ? '24px' : '32px'}; font-weight: 800; color: ${isThermal ? '#000' : '#5d5fef'}; }
        .disclaimer { 
          margin-top: 30px; 
          text-align: center; 
          font-size: 10px; 
          color: #666; 
          border-top: 1px solid #ddd; 
          padding-top: 10px; 
          font-style: italic; 
        }
        @media print {
          body { padding: 0; margin: 0; width: ${isThermal ? '80mm' : 'auto'}; }
          .receipt-card { border: none; box-shadow: none; max-width: 100%; margin: 0; }
        }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <div class="receipt-card">
        <div class="indicator">${isIncome ? '+' : '-'}</div>
        <div class="header">
          <div class="logo-area">
            <img src="/logo.jpg" class="logo" alt="Logo">
            <h1 class="company-name">FRIGORÍFICO PAMPA</h1>
          </div>
          <div class="receipt-info">
            <div class="receipt-label">Comprobante de Caja</div>
            <div class="receipt-date">${dateStr} ${timeStr}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Concepto / Descripción</div>
          <div class="val">${entry.description || 'Sin descripción'}</div>
        </div>

        <div class="section">
          <div class="section-title">CLIENTE / PRODUCTOR</div>
          <div class="val">${entityName}</div>
        </div>

        ${billDetailsHtml}

        <div class="amount-box">
          <div class="receipt-label">Monto Total</div>
          <div class="amount-val">${formatCurrency(entry.amount)}</div>
        </div>

        <div class="disclaimer" style="text-transform: uppercase;">
          ⚠️ NO ES COMPROBANTE FISCAL<br>
          <span style="font-size: 8px; text-transform: none;">Documento informativo de control interno.</span>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Imprime un recibo de pago de haberes (con duplicado en A4).
 * @param {object} entry
 * @param {'standard'|'thermal'} type
 * @param {string} boxTitle
 */
export function printSalaryReceipt(entry, type = 'standard', boxTitle = 'Caja General') {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  const dateSource = entry.createdAt || entry.date || Date.now();
  const dateStr = new Date(dateSource).toLocaleDateString('es-AR');
  const timeStr = new Date(dateSource).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const isThermal = type === 'thermal';
  const billDetailsHtml = buildBillDetailsHtml(entry.billCounts, isThermal);

  const receiptContent = `
    <div class="receipt-card">
      <div class="header">
        <div class="logo-area">
          <img src="/logo.jpg" class="logo" alt="Logo">
          <div>
            <h1 class="company-name">FRIGORÍFICO PAMPA</h1>
            <div style="font-size: ${isThermal ? '10px' : '12px'}; color: #666; margin-top: 4px;">COMPROBANTE DE PAGO DE HABERES</div>
          </div>
        </div>
        <div class="receipt-info">
          <div class="receipt-label">Fecha</div>
          <div class="receipt-date">${dateStr} ${timeStr}</div>
          <div class="receipt-label" style="margin-top: 8px;">Caja Origen</div>
          <div style="font-weight: 600; font-size: ${isThermal ? '12px' : '14px'};">${boxTitle}</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: ${isThermal ? 'column' : 'row'}; gap: 15px; margin-bottom: ${isThermal ? '20px' : '10px'};">
        <div class="section" style="flex: 1; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 0;">
          <div class="section-title">Datos del Empleado</div>
          <div class="val" style="margin-bottom: 5px;">${entry.employeeName || 'No especificado'}</div>
          ${entry.employeeDni ? `<div style="font-size: 12px; color: #475569;">DNI: ${entry.employeeDni}</div>` : ''}
          ${entry.employeePosition ? `<div style="font-size: 12px; color: #475569;">Cargo: ${entry.employeePosition}</div>` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Concepto</div>
        <div class="val" style="font-size: ${isThermal ? '13px' : '15px'};">${entry.description || 'Adelanto / Pago Sueldo'}</div>
      </div>

      ${billDetailsHtml}

      <div class="amount-box" style="border-color: #10b981; background: ${isThermal ? '#fff' : '#ecfdf5'};">
        <div class="receipt-label">Importe Abonado</div>
        <div class="amount-val" style="color: ${isThermal ? '#000' : '#059669'};">${formatCurrency(entry.amount)}</div>
      </div>

      <div style="margin-top: ${isThermal ? '30px' : '25px'}; display: flex; flex-direction: column; align-items: center; gap: 5px;">
        <div style="width: 200px; border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
        <div style="font-size: 12px; font-weight: 600;">Firma del Empleado</div>
        <div style="font-size: 10px; color: #666;">Aclaración: ${entry.employeeName || '________________________'}</div>
      </div>
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recibo Sueldo - ${entry.employeeName || ''}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: ${isThermal ? '10px' : '15px'}; 
          color: #111; 
          line-height: 1.3; 
          margin: 0;
          background: #fff;
        }
        .container {
          display: flex;
          flex-direction: column;
          gap: ${isThermal ? '20px' : '15px'};
        }
        .receipt-card { 
          border: ${isThermal ? 'none' : '1px solid #ddd'}; 
          padding: ${isThermal ? '0' : '15px 25px'}; 
          border-radius: ${isThermal ? '0' : '8px'}; 
          max-width: ${isThermal ? '300px' : '650px'}; 
          margin: ${isThermal ? '0' : '0 auto'}; 
          box-shadow: ${isThermal ? 'none' : '0 4px 10px rgba(0,0,0,0.05)'}; 
          page-break-inside: avoid;
        }
        .header { 
          display: flex; 
          flex-direction: ${isThermal ? 'column' : 'row'};
          justify-content: ${isThermal ? 'center' : 'space-between'}; 
          align-items: ${isThermal ? 'center' : 'flex-start'}; 
          margin-bottom: 10px; 
          border-bottom: 2px solid ${isThermal ? '#000' : '#10b981'}; 
          padding-bottom: 10px;
          text-align: ${isThermal ? 'center' : 'left'};
        }
        .logo-area { display: flex; flex-direction: ${isThermal ? 'column' : 'row'}; align-items: center; gap: 10px; }
        .logo { width: ${isThermal ? '80px' : '85px'}; height: auto; max-height: 50px; object-fit: contain; border-radius: 4px; }
        .company-name { font-size: ${isThermal ? '14px' : '18px'}; font-weight: 800; color: ${isThermal ? '#000' : '#10b981'}; margin: 0; }
        .receipt-info { text-align: ${isThermal ? 'center' : 'right'}; margin-top: ${isThermal ? '10px' : '0'}; }
        .receipt-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-date { font-weight: 600; font-size: ${isThermal ? '12px' : '13px'}; }
        .section { margin-bottom: 10px; }
        .section-title { font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
        .val { font-size: ${isThermal ? '14px' : '15px'}; font-weight: 600; }
        .amount-box { 
          background: #fff; 
          padding: 10px; 
          border-radius: 8px; 
          text-align: center; 
          border: ${isThermal ? '2px solid #000' : '2px dashed #10b981'}; 
          margin-top: 15px; 
        }
        .amount-val { font-size: ${isThermal ? '22px' : '24px'}; font-weight: 800; }
        @page {
          size: ${isThermal ? '80mm auto' : 'A4 portrait'};
          margin: ${isThermal ? '0' : '10mm'};
        }
        @media print {
          body { padding: 0; margin: 0; width: ${isThermal ? '80mm' : 'auto'}; }
          .receipt-card { border: none; box-shadow: none; max-width: 100%; margin: 0; border-bottom: ${isThermal ? '1px dashed #ccc' : 'none'}; padding-bottom: ${isThermal ? '20px' : '0'}; }
          .separator { display: ${isThermal ? 'none' : 'block'}; height: 1px; border-top: 1px dashed #ccc; margin: 15px 0; }
        }
      </style>
    </head>
    <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
      <div class="container">
        ${receiptContent}
        ${!isThermal ? `
          <div class="separator"></div>
          <div style="text-align: center; font-size: 10px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">Duplicado Empresa</div>
          ${receiptContent}
        ` : ''}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
