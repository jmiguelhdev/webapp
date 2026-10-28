/**
 * @file BranchPricePdfService.js
 * @description Servicio de generación de listas de precios en PDF para clientes y emisión
 * de códigos QR en cartelería A4 y formato térmico POS de 80mm para mostradores y camión móvil.
 * @module reports/BranchPricePdfService
 */
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { filterUpcomingStops } from '../../../adapters/api/PublicBranchPricingApi.js';

/**
 * Formatea un número como moneda argentina ($ / kg).
 */
function formatCurrency(val) {
  return '$ ' + new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(val || 0));
}

/**
 * Escapa caracteres especiales HTML para evitar inyección o cierre de etiquetas en impresión.
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Obtiene la URL pública directa para el escaneo de una sucursal.
 */
export function getBranchQrUrl(branchIdOrName) {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://frigorificopampa.tech';
  return `${origin}/?sucursal=${encodeURIComponent(branchIdOrName)}`;
}

export class BranchPricePdfService {
  /**
   * Genera y descarga el PDF formal de la lista de precios de una sucursal (fija o móvil).
   * @param {Object} params
   * @param {Object} params.branch - Datos de la sucursal (nombre, dirección, etc.).
   * @param {Array<Object>} params.items - Cortes con precio por kg.
   */
  static async downloadPriceListPdf({ branch, items }) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const isMobile = Boolean(branch?.isMobile);
    const visibleItems = (items || []).filter(i => i.visible !== false && Number(i.price) > 0);
    const branchName = branch?.name || (isMobile ? 'Frigorífico Pampa en tu Barrio' : 'Frigorífico Pampa');
    const address = branch?.address || '';
    const phone = branch?.phone || '';
    const hours = branch?.hours || '';
    const dateStr = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const qrUrl = getBranchQrUrl(branch?.id || branchName);
    let qrDataUrl = null;
    try {
      qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 140, margin: 1 });
    } catch (e) {
      console.warn("No se pudo generar QR para el PDF:", e);
    }

    // Cabecera institucional
    doc.setFillColor(143, 0, 20); // Borgoña Pampa
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(isMobile ? 'FRIGORÍFICO PAMPA EN TU BARRIO' : 'FRIGORÍFICO PAMPA', 15, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(isMobile ? 'CARNICERÍA MÓVIL ITINERANTE — LISTA DE PRECIOS & PARADAS' : 'LISTA OFICIAL DE PRECIOS AL PÚBLICO — MOSTRADOR', 15, 18);
    doc.text(`Fecha de Emisión: ${dateStr}`, 15, 23);

    // QR en la esquina superior derecha
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 180, 2, 24, 24);
    }

    let yPos = 34;

    // Cuadro de datos de la sucursal
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(220, 224, 230);
    doc.roundedRect(15, yPos, 180, 18, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(isMobile ? 'PUNTO DE VENTA MÓVIL ITINERANTE' : `Sucursal: ${branchName.toUpperCase()}`, 20, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const infoLine = [
      address ? `Dir: ${address}` : null,
      hours ? `Horario: ${hours}` : null,
      phone ? `Tel: ${phone}` : null
    ].filter(Boolean).join('  |  ');
    doc.text(infoLine || (isMobile ? 'Llevamos la mejor carne directo a tu barrio' : 'Atención al público en mostrador'), 20, yPos + 13);

    yPos += 24;

    // Si es la carnicería móvil, incluir el cronograma de próximas paradas
    if (isMobile && Array.isArray(branch.schedule) && branch.schedule.length > 0) {
      const upcomingStops = filterUpcomingStops(branch.schedule);
      if (upcomingStops.length > 0) {
        doc.setFillColor(143, 0, 20);
        doc.rect(15, yPos, 180, 6.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('CRONOGRAMA DE PRÓXIMAS PARADAS E ITINERARIO BARRIAL', 20, yPos + 4.5);
        yPos += 6.5;

        upcomingStops.slice(0, 4).forEach((stop, sIdx) => {
          doc.setFillColor(sIdx % 2 === 0 ? 255 : 248, sIdx % 2 === 0 ? 255 : 250, sIdx % 2 === 0 ? 255 : 252);
          doc.rect(15, yPos, 180, 8, 'F');
          doc.setDrawColor(230, 235, 240);
          doc.line(15, yPos + 8, 195, yPos + 8);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(143, 0, 20);
          doc.text(`• ${stop.dateDisplay || stop.date} (${stop.time || '09:00 a 14:00 hs'})`, 20, yPos + 5.5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          const locText = (stop.location || '') + (stop.reference ? ` — ${stop.reference}` : '');
          doc.text(`Ubicación: ${locText}`, 95, yPos + 5.5);

          yPos += 8;
        });

        yPos += 6;
      }
    }

    // Tabla de Precios
    const col1X = 15;
    const col2X = 145;
    const tableWidth = 180;
    const rowHeight = 7;

    // Encabezado de la tabla de precios
    doc.setFillColor(235, 238, 242);
    doc.rect(col1X, yPos, tableWidth, rowHeight, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CORTE / PRODUCTO VACUNO', col1X + 4, yPos + 4.8);
    doc.text('PRECIO POR KG ($/KG)', col2X + 2, yPos + 4.8);

    yPos += rowHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    if (visibleItems.length === 0) {
      doc.setTextColor(120, 120, 120);
      doc.text('No hay productos disponibles en esta lista actualmente.', col1X + 4, yPos + 8);
      yPos += 12;
    } else {
      visibleItems.forEach((item, idx) => {
        // Salto de página
        if (yPos > 265) {
          doc.addPage();
          yPos = 20;

          doc.setFillColor(235, 238, 242);
          doc.rect(col1X, yPos, tableWidth, rowHeight, 'F');
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text('CORTE / PRODUCTO VACUNO', col1X + 4, yPos + 4.8);
          doc.text('PRECIO POR KG ($/KG)', col2X + 2, yPos + 4.8);
          yPos += rowHeight;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
        }

        // Fila cebra
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(col1X, yPos, tableWidth, rowHeight, 'F');
        }

        doc.setDrawColor(230, 235, 240);
        doc.line(col1X, yPos + rowHeight, col1X + tableWidth, yPos + rowHeight);

        doc.setTextColor(30, 41, 59);
        const nameText = item.name.length > 48 ? item.name.substring(0, 46) + '...' : item.name;
        doc.text(nameText, col1X + 4, yPos + 4.8);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(143, 0, 20);
        doc.text(`${formatCurrency(item.price)} / kg`, col2X + 2, yPos + 4.8);
        doc.setFont('helvetica', 'normal');

        yPos += rowHeight;
      });
    }

    // Pie de página institucional
    yPos = Math.max(yPos + 8, 275);
    doc.setDrawColor(200, 205, 215);
    doc.line(15, yPos, 195, yPos);

    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text('Precios al público expresados en Pesos Argentinos ($) con IVA incluido. Sujetos a disponibilidad de stock y faena diaria.', 15, yPos + 5);
    doc.text('Frigorífico Pampa — Plataforma de Gestión y Distribución Cárnica — frigorificopampa.tech', 15, yPos + 9);

    const safeName = branchName.replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Precios_${safeName}_${dateStr.replace(/\//g, '-')}.pdf`);
  }

  /**
   * Genera e imprime el Cartel A4 publicitario con Código QR para mostrador o camión móvil.
   * @param {Object} params
   * @param {Object} params.branch
   * @param {string} params.qrUrl
   */
  static async printCounterQrPosterA4({ branch, qrUrl }) {
    const isMobile = Boolean(branch?.isMobile);
    const branchName = branch?.name || (isMobile ? 'Frigorífico Pampa en tu Barrio' : 'Frigorífico Pampa');
    const address = branch?.address || '';
    const phone = branch?.phone || '';
    const hours = branch?.hours || '';

    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 500,
      margin: 1,
      color: {
        dark: '#8f0014',
        light: '#ffffff'
      }
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permita ventanas emergentes para imprimir el cartel A4.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Cartel QR A4 — ${branchName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, Roboto, sans-serif; }
          body {
            width: 210mm;
            min-height: 297mm;
            background: #fff;
            color: #1e293b;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 16mm 14mm 14mm 14mm;
            text-align: center;
          }
          .header-badge {
            background: rgba(143, 0, 20, 0.08);
            border: 1.5px solid rgba(143, 0, 20, 0.25);
            padding: 6px 18px;
            border-radius: 100px;
            font-size: 13px;
            font-weight: 700;
            color: #8f0014;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .brand-title {
            font-size: 38px;
            font-weight: 900;
            color: #8f0014;
            letter-spacing: -1px;
            margin-bottom: 4px;
          }
          .brand-slogan {
            font-size: 15px;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 24px;
          }
          .cta-card {
            background: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 20px;
            padding: 24px 20px;
            width: 100%;
            max-width: 175mm;
            margin-bottom: 20px;
          }
          .cta-title {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.25;
            margin-bottom: 10px;
          }
          .cta-desc {
            font-size: 15px;
            color: #475569;
            line-height: 1.45;
          }
          .qr-container {
            padding: 16px;
            background: #fff;
            border: 3px solid #8f0014;
            border-radius: 24px;
            display: inline-block;
            box-shadow: 0 10px 30px rgba(143, 0, 20, 0.12);
            margin: 10px 0 20px 0;
          }
          .qr-img {
            width: 90mm;
            height: 90mm;
            display: block;
          }
          .instruction-box {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            font-size: 16px;
            font-weight: 700;
            color: #8f0014;
            margin-bottom: 22px;
          }
          .branch-footer-box {
            border-top: 2px solid #e2e8f0;
            padding-top: 14px;
            width: 100%;
          }
          .branch-name {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .branch-details {
            font-size: 13px;
            color: #64748b;
            line-height: 1.4;
          }
          .legal-note {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 8px;
          }
        </style>
      </head>
      <body onload="setTimeout(() => { window.print(); }, 400);">
        <div>
          <span class="header-badge">${isMobile ? '🚚 CARNICERÍA MÓVIL ITINERANTE' : '🥩 CARNICERÍA & FRIGORÍFICO'}</span>
          <h1 class="brand-title">${escapeHtml(branchName.toUpperCase())}</h1>
          <p class="brand-slogan">${isMobile ? 'Llevamos la mejor carne a precios de frigorífico directo a tu barrio' : 'Calidad, Trazabilidad y Excelencia en Carnes'}</p>

          <div class="cta-card">
            <h2 class="cta-title">CONSULTÁ NUESTRA LISTA DE PRECIOS ${isMobile ? '& CRONOGRAMA' : 'ACTUALIZADA'}</h2>
            <p class="cta-desc">Escaneá este código QR con la cámara de tu celular para ver y descargar en el acto todos los cortes, precios ${isMobile ? 'y próximas paradas' : 'del día'}.</p>
          </div>

          <div class="qr-container">
            <img src="${qrDataUrl}" alt="Código QR Precios" class="qr-img" />
          </div>

          <div class="instruction-box">
            <span>📱</span>
            <span>Apuntá tu cámara aquí — Sin necesidad de instalar ninguna app</span>
          </div>
        </div>

        <div class="branch-footer-box">
          <h3 class="branch-name">${escapeHtml(branchName.toUpperCase())}</h3>
          <p class="branch-details">${address ? `📍 ${escapeHtml(address)}` : ''} ${hours ? ` | 🕒 ${escapeHtml(hours)}` : ''} ${phone ? ` | 📞 ${escapeHtml(phone)}` : ''}</p>
          <p class="legal-note">Precios de mostrador expresados en $/kg con IVA incluido. Frigorífico Pampa — frigorificopampa.tech</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  /**
   * Imprime el ticket con Código QR en formato Térmico POS 80mm para cajas, balanzas o camión móvil.
   * @param {Object} params
   * @param {Object} params.branch
   * @param {string} params.qrUrl
   */
  static async printCounterQrThermal80({ branch, qrUrl }) {
    const isMobile = Boolean(branch?.isMobile);
    const branchName = branch?.name || (isMobile ? 'Frigorífico Pampa en tu Barrio' : 'Frigorífico Pampa');
    const address = branch?.address || '';
    const phone = branch?.phone || '';
    const hours = branch?.hours || '';
    const dateStr = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permita ventanas emergentes para imprimir el ticket térmico.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Ticket QR POS 80mm — ${branchName}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; }
          body {
            width: 76mm;
            margin: 0 auto;
            padding: 3mm 2mm 8mm 2mm;
            text-align: center;
            color: #000;
            background: #fff;
          }
          .title { font-size: 15px; font-weight: 900; margin-bottom: 2px; }
          .subtitle { font-size: 10px; margin-bottom: 6px; }
          .sep { border-top: 1px dashed #000; margin: 6px 0; }
          .branch { font-size: 13px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
          .meta { font-size: 10px; margin-bottom: 2px; }
          .headline { font-size: 13px; font-weight: 900; margin: 6px 0 3px 0; }
          .desc { font-size: 10px; line-height: 1.3; margin-bottom: 6px; }
          .qr-img { width: 55mm; height: 55mm; margin: 4px auto; display: block; }
          .url-text { font-size: 9px; font-weight: bold; word-break: break-all; margin-top: 4px; }
          .thanks { font-size: 11px; font-weight: bold; margin-top: 8px; }
        </style>
      </head>
      <body onload="setTimeout(() => { window.print(); }, 400);">
        <div class="title">${isMobile ? 'PAMPA EN TU BARRIO' : 'FRIGORIFICO PAMPA'}</div>
        <div class="subtitle">${isMobile ? 'CARNICERIA MOVIL ITINERANTE' : 'CALIDAD EN CARNES'}</div>
        <div class="sep"></div>

        <div class="branch">${escapeHtml(branchName)}</div>
        ${address ? `<div class="meta">${escapeHtml(address)}</div>` : ''}
        ${hours ? `<div class="meta">Horario: ${escapeHtml(hours)}</div>` : ''}
        ${phone ? `<div class="meta">Tel: ${escapeHtml(phone)}</div>` : ''}
        <div class="meta">Fecha: ${dateStr}</div>

        <div class="sep"></div>
        <div class="headline">LISTA DE PRECIOS ${isMobile ? '& PARADAS' : 'DIGITAL'}</div>
        <div class="desc">Escanee este codigo QR con su celular para ver los precios ${isMobile ? 'y proximas paradas' : 'del dia'}</div>

        <img src="${qrDataUrl}" alt="QR" class="qr-img" />

        <div class="url-text">frigorificopampa.tech</div>
        <div class="sep"></div>
        <div class="thanks">¡GRACIAS POR SU COMPRA!</div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
}
