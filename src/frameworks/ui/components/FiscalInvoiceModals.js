/**
 * @file FiscalInvoiceModals.js
 * @description Modales de visualización detallada y reimpresión de comprobantes ARCA con QR impositivo.
 * @module frameworks/ui/components/FiscalInvoiceModals
 */

/**
 * Mapeo de códigos CbteTipo de ARCA a nombres legibles.
 */
export const VOUCHER_TYPE_NAMES = {
  1: 'Factura A',
  2: 'Nota de Débito A',
  3: 'Nota de Crédito A',
  6: 'Factura B',
  7: 'Nota de Débito B',
  8: 'Nota de Crédito B',
  11: 'Factura C',
  12: 'Nota de Débito C',
  13: 'Nota de Crédito C',
  51: 'Factura M',
  52: 'Nota de Débito M',
  53: 'Nota de Crédito M'
};

/**
 * Mapeo de Alícuotas IVA.
 */
export const VAT_RATES = {
  3: '0%',
  4: '10.5%',
  5: '21%',
  6: '27%',
  8: '5%',
  9: '2.5%'
};

/**
 * Formatea un número como moneda ARS ($).
 */
function formatCurrency(val) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val || 0);
}

/**
 * Formatea fecha ISO YYYY-MM-DD o YYYYMMDD a formato legible DD/MM/YYYY.
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const str = String(dateStr);
  if (str.length === 8 && !str.includes('-')) {
    return `${str.substring(6, 8)}/${str.substring(4, 6)}/${str.substring(0, 4)}`;
  }
  if (str.includes('-')) {
    const parts = str.substring(0, 10).split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
}

/**
 * Muestra el modal con el detalle completo del comprobante fiscal.
 * @param {Object} invoice - Comprobante a inspeccionar.
 */
export function openFiscalInvoiceDetailModal(invoice) {
  const existing = document.getElementById('modal-fiscal-invoice-detail');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-fiscal-invoice-detail';
  modal.className = 'modal-backdrop open';

  const tipoName = VOUCHER_TYPE_NAMES[invoice.tipoComprobante || invoice.cbteTipo] || `Comprobante (${invoice.tipoComprobante})`;
  const ptoVtaPadded = String(invoice.puntoVenta || invoice.ptoVta || 1).padStart(5, '0');
  const nroPadded = String(invoice.numeroComprobante || invoice.nro || 0).padStart(8, '0');
  const fullCbteNumber = `${ptoVtaPadded}-${nroPadded}`;

  // Formato de ítems
  const items = invoice.items || [];
  let itemsRowsHtml = '';
  if (items.length === 0) {
    itemsRowsHtml = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Sin desglose de ítems registrado</td></tr>`;
  } else {
    itemsRowsHtml = items.map(item => `
      <tr>
        <td><strong>${item.codigo || '-'}</strong></td>
        <td>${item.descripcion || 'Producto'}</td>
        <td style="text-align: right;">${item.cantidad || 1} ${item.unidadMedida === 7 ? 'Kg' : 'u.'}</td>
        <td style="text-align: right;">${formatCurrency(item.precioUnitario)}</td>
        <td style="text-align: right;">${VAT_RATES[item.codigoIva] || '21%'}</td>
        <td style="text-align: right; font-weight: 700; color: var(--text-primary);">${formatCurrency(item.subtotal)}</td>
      </tr>
    `).join('');
  }

  // Formato de Alícuotas IVA
  const vats = invoice.vats || [];
  let vatsRowsHtml = '';
  if (vats.length > 0) {
    vatsRowsHtml = `
      <div style="margin-top: 1rem; background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border);">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">Desglose de IVA</div>
        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
          ${vats.map(v => `
            <div>
              <span style="color: var(--text-muted); font-size: 0.8rem;">Alícuota ${VAT_RATES[v.codigoIva] || '21%'}:</span>
              <strong style="color: var(--text-primary); margin-left: 0.25rem;">${formatCurrency(v.importeIva)}</strong>
              <small style="color: var(--text-muted);"> (Base: ${formatCurrency(v.baseImponible)})</small>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Comprobante Asociado (si aplica)
  let associatedHtml = '';
  if (invoice.associatedCbteTipo || invoice.associatedNro) {
    const assocTipo = VOUCHER_TYPE_NAMES[invoice.associatedCbteTipo] || `Tipo ${invoice.associatedCbteTipo}`;
    const assocPto = String(invoice.associatedPtoVta || 1).padStart(5, '0');
    const assocNro = String(invoice.associatedNro || 0).padStart(8, '0');
    associatedHtml = `
      <div style="margin-top: 1rem; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.75rem; border-radius: 8px; color: #fca5a5;">
        <strong>🔗 Comprobante Asociado Original:</strong> ${assocTipo} N° ${assocPto}-${assocNro} 
        ${invoice.associatedCbteFch ? ` (${formatDate(invoice.associatedCbteFch)})` : ''}
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 850px; width: 95%;">
      <div class="modal-header" style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem;">
        <div>
          <h2 style="margin: 0; font-size: 1.25rem; color: var(--text-primary); font-weight: 700;">
            ${tipoName} N° ${fullCbteNumber}
          </h2>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
            ID Venta: <code>${invoice.saleId || invoice.id || '-'}</code> | Sucursal / Pto Vta: ${invoice.storeId || invoice.puntoVenta || '00001'}
          </div>
        </div>
        <button class="modal-close" id="close-fiscal-detail">✕</button>
      </div>

      <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
        <!-- Ficha Resumen Receptor / CAE -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; background: rgba(15, 23, 42, 0.4); padding: 1rem; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 1rem;">
          <div>
            <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Receptor / Cliente</div>
            <div style="font-weight: 700; color: var(--text-primary); margin-top: 0.2rem;">${invoice.nombreReceptor || 'Consumidor Final'}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${invoice.nroDocReceptor ? `Doc / CUIT: ${invoice.nroDocReceptor}` : 'Sin Documento'}</div>
          </div>
          <div>
            <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Emisión & CAE (ARCA)</div>
            <div style="font-weight: 600; color: #60a5fa; margin-top: 0.2rem;">Fecha: ${formatDate(invoice.fechaEmision)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              CAE: <strong style="color: #4ade80;">${invoice.cae || 'En Proceso / Local'}</strong>
              ${invoice.caeVencimiento ? ` | Venc: ${formatDate(new Date(invoice.caeVencimiento).toISOString().substring(0, 10))}` : ''}
            </div>
          </div>
          <div>
            <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Importe Total</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin-top: 0.2rem;">${formatCurrency(invoice.importeTotal)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Neto Gravado: ${formatCurrency(invoice.importeNetoGravado)}</div>
          </div>
        </div>

        ${associatedHtml}

        <!-- Tabla de Productos -->
        <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-top: 1.25rem; margin-bottom: 0.5rem;">Renglones del Comprobante</h4>
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
          <thead>
            <tr style="background: rgba(255,255,255,0.03); text-align: left; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">
              <th style="padding: 0.6rem;">Código</th>
              <th style="padding: 0.6rem;">Descripción</th>
              <th style="padding: 0.6rem; text-align: right;">Cantidad</th>
              <th style="padding: 0.6rem; text-align: right;">P. Unit.</th>
              <th style="padding: 0.6rem; text-align: right;">IVA</th>
              <th style="padding: 0.6rem; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRowsHtml}
          </tbody>
        </table>

        ${vatsRowsHtml}
      </div>

      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 1rem; margin-top: 1rem;">
        <button class="btn btn-secondary" id="print-from-detail-btn" style="display: flex; align-items: center; gap: 0.5rem;">
          🖨️ Reimprimir Ticket con QR
        </button>
        <button class="btn btn-primary" id="close-fiscal-detail-btn">Cerrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('close-fiscal-detail').addEventListener('click', () => modal.remove());
  document.getElementById('close-fiscal-detail-btn').addEventListener('click', () => modal.remove());
  document.getElementById('print-from-detail-btn').addEventListener('click', () => {
    modal.remove();
    openPrintTicketModal(invoice);
  });
}

/**
 * Genera la URL codificada en Base64 para el código QR de ARCA (RG 4892/2020).
 * @param {Object} invoice 
 * @returns {string} URL del QR de ARCA
 */
export function buildArcaQrUrl(invoice) {
  const qrObj = {
    ver: 1,
    fecha: invoice.fechaEmision ? String(invoice.fechaEmision).replace(/-/g, '') : '',
    cuit: 30712345678, // CUIT Emisor de la empresa
    ptoVta: Number(invoice.puntoVenta || invoice.ptoVta || 1),
    tipoCmp: Number(invoice.tipoComprobante || invoice.cbteTipo || 6),
    nroCmp: Number(invoice.numeroComprobante || invoice.nro || 1),
    importe: Number(invoice.importeTotal || 0),
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: Number(invoice.tipoDocReceptor || 99),
    nroDocRec: Number(invoice.nroDocReceptor || 0),
    tipoCodAut: 'E',
    codAut: Number(invoice.cae || 0)
  };

  const jsonStr = JSON.stringify(qrObj);
  const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
  return `https://www.arca.gob.ar/fe/qr/?p=${base64Str}`;
}

/**
 * Muestra el modal con la plantilla de ticket térmico e código QR oficial de ARCA para imprimir.
 * @param {Object} invoice 
 */
export function openPrintTicketModal(invoice) {
  const existing = document.getElementById('modal-fiscal-print');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-fiscal-print';
  modal.className = 'modal-backdrop open';

  const tipoName = VOUCHER_TYPE_NAMES[invoice.tipoComprobante || invoice.cbteTipo] || 'COMPROBANTE';
  const ptoVtaPadded = String(invoice.puntoVenta || invoice.ptoVta || 1).padStart(5, '0');
  const nroPadded = String(invoice.numeroComprobante || invoice.nro || 0).padStart(8, '0');
  const fullCbteNumber = `${ptoVtaPadded}-${nroPadded}`;

  const qrTargetUrl = buildArcaQrUrl(invoice);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrTargetUrl)}`;

  const items = invoice.items || [];
  const itemsHtml = items.map(item => `
    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
      <span>${item.cantidad || 1}x ${item.descripcion || 'Producto'}</span>
      <span>${formatCurrency(item.subtotal)}</span>
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 420px; width: 90%; background: #ffffff; color: #000000; font-family: monospace;">
      <div class="modal-header" style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; color: #000;">
        <h3 style="margin: 0; font-size: 14px; text-align: center; font-weight: bold; text-transform: uppercase;">
          FRIGORÍFICO & DEBATO
        </h3>
        <div style="font-size: 10px; text-align: center;">CUIT: 30-71234567-8 | Resp. Inscripto</div>
        <div style="font-size: 11px; text-align: center; font-weight: bold; margin-top: 4px;">
          ${tipoName.toUpperCase()} N° ${fullCbteNumber}
        </div>
        <div style="font-size: 10px; text-align: center;">Fecha: ${formatDate(invoice.fechaEmision)}</div>
      </div>

      <div class="modal-body" style="font-size: 11px; color: #000;">
        <div style="margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 4px;">
          <strong>Cliente:</strong> ${invoice.nombreReceptor || 'Consumidor Final'}<br/>
          ${invoice.nroDocReceptor ? `<strong>Doc/CUIT:</strong> ${invoice.nroDocReceptor}` : ''}
        </div>

        <div style="margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 6px;">
          <div style="font-weight: bold; margin-bottom: 4px;">DETALLE DE PRODUCTOS:</div>
          ${itemsHtml.length > 0 ? itemsHtml : '<div style="font-style: italic;">Sin detalle de ítems</div>'}
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 10px;">
          <span>TOTAL:</span>
          <span>${formatCurrency(invoice.importeTotal)}</span>
        </div>

        <!-- Sección ARCA / CAE & QR -->
        <div style="border-top: 1px dashed #000; padding-top: 8px; text-align: center;">
          <div style="font-size: 10px; font-weight: bold;">CAE ARCA: ${invoice.cae || '00000000000000'}</div>
          ${invoice.caeVencimiento ? `<div style="font-size: 9px;">Venc. CAE: ${formatDate(new Date(invoice.caeVencimiento).toISOString().substring(0, 10))}</div>` : ''}
          <div style="margin-top: 8px; display: flex; justify-content: center;">
            <img src="${qrImageUrl}" alt="QR ARCA" style="width: 120px; height: 120px; border: 1px solid #ccc; padding: 2px;" />
          </div>
          <div style="font-size: 8px; margin-top: 4px; color: #555;">Comprobante Autorizado por ARCA (ex-AFIP)</div>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; justify-content: space-between; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 12px;">
        <button class="btn btn-secondary" id="close-print-modal" style="font-size: 12px;">Cerrar</button>
        <button class="btn btn-primary" id="do-print-ticket-btn" style="font-size: 12px; background: #2563eb; color: #fff;">
          🖨️ Imprimir Ticket
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('close-print-modal').addEventListener('click', () => modal.remove());
  document.getElementById('do-print-ticket-btn').addEventListener('click', () => {
    const printContent = modal.querySelector('.modal-card').outerHTML;
    const printWin = window.open('', '_blank', 'width=450,height=600');
    printWin.document.write(`
      <html>
        <head>
          <title>Impresión Ticket Fiscal ${fullCbteNumber}</title>
          <style>
            body { font-family: monospace; padding: 10px; margin: 0; }
            @media print {
              .modal-footer { display: none !important; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    printWin.document.close();
  });
}
