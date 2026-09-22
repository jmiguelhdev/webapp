/**
 * @file TransportPdfService.js
 * @description Servicio premium de generación y distribución en PDF para constancias de transporte
 * y reportes de flota de Frigorífico Pampa (Andres e Ivan Muhic sas - CUIT: 30-71688600-6).
 * Incluye cabecera formal con logo corporativo, código QR dinámico de verificación y
 * compatibilidad nativa con Web Share API para móviles.
 * @module reports/TransportPdfService
 * @author Antigravity
 */

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const COMPANY_INFO = {
  name: 'FRIGORÍFICO PAMPA',
  legalName: 'Andres e Ivan Muhic S.A.S.',
  cuit: '30-71688600-6',
  address: 'Ruta Nacional y Acceso Frigorífico',
  phone: 'Dpto. Logística y Despacho'
};

/**
 * Convierte una URL relativa o absoluta en un Data URL (base64) para jsPDF.
 * @param {string} url - Ruta de la imagen.
 * @returns {Promise<string|null>} Data URL de la imagen o null si falla.
 */
async function getImageDataUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('TransportPdfService: No se pudo cargar la imagen', url, err);
    return null;
  }
}

/**
 * Genera un código QR en Data URL PNG a partir de un texto.
 * @param {string} text - Contenido del QR.
 * @returns {Promise<string|null>} Data URL del QR.
 */
async function generateQrDataUrl(text) {
  try {
    return await QRCode.toDataURL(text, {
      width: 280,
      margin: 1,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.warn('TransportPdfService: Error al generar código QR', err);
    return null;
  }
}

/**
 * Resuelve los datos completos del chofer asignado al camión.
 */
function resolveDriver(truck, drivers = []) {
  if (truck.driver && typeof truck.driver === 'object') {
    const full = drivers.find(d => String(d.id) === String(truck.driver.id));
    return full || truck.driver;
  }
  if (truck.driverId) {
    return drivers.find(d => String(d.id) === String(truck.driverId)) || null;
  }
  return null;
}

/**
 * Resuelve los datos completos de la jaula asignada al camión.
 */
function resolveTrailer(truck, trailers = []) {
  if (truck.trailer && typeof truck.trailer === 'object') {
    const full = trailers.find(t => String(t.id) === String(truck.trailer.id));
    return full || truck.trailer;
  }
  if (truck.trailerId) {
    return trailers.find(t => String(t.id) === String(truck.trailerId)) || null;
  }
  return null;
}

/**
 * Genera la constancia individual en PDF de una unidad de transporte (Camión + Chofer + Jaula).
 * @param {Object} truck - Registro del camión.
 * @param {Object} [deps={}] - Dependencias { drivers, trailers }.
 * @returns {Promise<jsPDF>} Instancia de jsPDF lista para descargar o compartir.
 */
export async function generateTruckCardPdf(truck, deps = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const driver = resolveDriver(truck, deps.drivers || []);
  const trailer = resolveTrailer(truck, deps.trailers || []);

  const driverPhone = driver?.phone || driver?.license || '';
  const cleanPhone = driverPhone ? driverPhone.replace(/[^\d+]/g, '') : '';
  
  // Si el chofer tiene teléfono registrado, el QR codifica tel: para que el smartphone ofrezca llamar directamente
  const qrContent = cleanPhone ? `tel:${cleanPhone}` : [
    `FRIGORÍFICO PAMPA - ${COMPANY_INFO.legalName}`,
    `CUIT: ${COMPANY_INFO.cuit}`,
    `--- CONSTANCIA DE TRANSPORTE ---`,
    `UNIDAD: ${truck.name || 'S/N'} | PATENTE: ${(truck.licensePlate || 'S/D').toUpperCase()}`,
    `CHOFER: ${driver?.name || 'Sin Asignar'} | DNI: ${driver?.dni || 'S/D'}`,
    `JAULA: ${trailer?.name || 'Sin Asignar'} | PATENTE: ${(trailer?.licensePlate || 'S/D').toUpperCase()} | TIPO: ${trailer?.type === 'DOUBLE' ? 'DOBLE' : 'SIMPLE'}`,
    `FECHA: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
  ].join('\n');

  const [logoDataUrl, qrDataUrl] = await Promise.all([
    getImageDataUrl('/logo.jpg'),
    generateQrDataUrl(qrContent)
  ]);

  const primaryColor = [132, 29, 29]; // #841d1d Vino Tinto Frigorífico Pampa
  const darkColor = [30, 41, 59];     // Slate 800
  const lightBg = [248, 250, 252];    // Slate 50
  const borderGrey = [203, 213, 225]; // Slate 300
  const textMuted = [100, 116, 139];  // Slate 500

  // 1. Margen decorativo perimetral
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, 10, 190, 277, 3, 3, 'S');

  // 2. Encabezado corporativo
  // Franja superior de marca
  doc.setFillColor(...primaryColor);
  doc.rect(10, 10, 190, 4, 'F');

  let headerY = 20;

  // Logo corporativo si está disponible
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', 16, headerY, 26, 26);
    } catch (e) {
      console.warn('Error al incrustar logo en PDF:', e);
    }
  }

  // Textos del encabezado formal
  const textStartX = logoDataUrl ? 46 : 16;

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(COMPANY_INFO.name, textStartX, headerY + 7);

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(COMPANY_INFO.legalName, textStartX, headerY + 13);

  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`CUIT: ${COMPANY_INFO.cuit}  |  ${COMPANY_INFO.phone}`, textStartX, headerY + 18.5);

  // Recuadro de tipo de documento a la derecha
  doc.setFillColor(254, 242, 242); // #fef2f2
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(132, headerY + 1, 62, 20, 2, 2, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('CONSTANCIA DE TRANSPORTE', 163, headerY + 8, { align: 'center' });

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`EMISIÓN: ${new Date().toLocaleDateString('es-AR')}`, 163, headerY + 14.5, { align: 'center' });

  // Línea divisoria elegante
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.5);
  doc.line(16, 52, 194, 52);

  // 3. Título de la Constancia
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ASIGNACIÓN OPERATIVA DE EQUIPO Y CHOFER', 105, 61, { align: 'center' });

  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Autorización formal para ingreso a planta, faena y traslado de hacienda en pie.', 105, 66, { align: 'center' });

  // 4. Bloques de información principales
  let currentY = 73;
  const boxWidth = 178;
  const boxX = 16;

  // --- BLOQUE 1: CHOFER DESIGNADO ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, currentY, boxWidth, 38, 2, 2, 'FD');

  // Pestaña lateral identificadora
  doc.setFillColor(59, 130, 246); // Azul Chofer
  doc.roundedRect(boxX, currentY, 4, 38, 1, 1, 'F');

  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. DATOS DEL CHOFER CONDUCTOR', boxX + 8, currentY + 7);

  // Contenido Chofer
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text('Nombre Completo:', boxX + 8, currentY + 15);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(driver?.name ? driver.name.toUpperCase() : 'NO ASIGNADO / VACANTE', boxX + 8, currentY + 21);

  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Documento Nacional (DNI):', boxX + 105, currentY + 15);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(driver?.dni ? String(driver.dni) : 'No informado', boxX + 105, currentY + 21);

  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Teléfono / Celular:', boxX + 8, currentY + 29);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text(driverPhone || 'S/D', boxX + 44, currentY + 29);

  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Estado:', boxX + 105, currentY + 29);
  doc.setTextColor(16, 185, 129); // Verde
  doc.setFont('helvetica', 'bold');
  doc.text('Habilitado para Conducción', boxX + 120, currentY + 29);

  currentY += 43;

  // --- BLOQUE 2: CAMIÓN / TRACTOR ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, currentY, boxWidth, 40, 2, 2, 'FD');

  doc.setFillColor(...primaryColor); // Vino Frigorífico
  doc.roundedRect(boxX, currentY, 4, 40, 1, 1, 'F');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. UNIDAD MOTRIZ (CAMIÓN / TRACTOR)', boxX + 8, currentY + 7);

  // Contenido Camión
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Denominación / Unidad:', boxX + 8, currentY + 15);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text((truck.name || 'CAMIÓN SIN IDENTIFICACIÓN').toUpperCase(), boxX + 8, currentY + 21);

  // Badge Patente Camión
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Patente / Matrícula:', boxX + 105, currentY + 15);

  const plate = (truck.licensePlate || 'SIN PATENTE').toUpperCase();
  doc.setFillColor(254, 243, 199); // Amarillo suave patente
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX + 105, currentY + 17, 45, 9, 1.5, 1.5, 'FD');

  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(plate, boxX + 127.5, currentY + 23.5, { align: 'center' });

  // Régimen
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Régimen de Operación:', boxX + 8, currentY + 31);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text(truck.isFreightPaid ? 'Flete Tercerizado' : 'Flota Propia Frigorífico', boxX + 48, currentY + 31);

  currentY += 43;

  // --- BLOQUE 3: JAULA / ACOPLADO ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, currentY, boxWidth, 42, 2, 2, 'FD');

  doc.setFillColor(16, 185, 129); // Verde Jaula
  doc.roundedRect(boxX, currentY, 4, 42, 1, 1, 'F');

  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('3. ACOPLADO / JAULA DE GANADO', boxX + 8, currentY + 7);

  // Contenido Jaula
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Identificación Jaula:', boxX + 8, currentY + 15);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(trailer?.name ? trailer.name.toUpperCase() : 'SIN JAULA ASIGNADA', boxX + 8, currentY + 21);

  // Patente Jaula
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Patente Acoplado:', boxX + 105, currentY + 15);

  const trailerPlate = (trailer?.licensePlate || 'SIN PATENTE').toUpperCase();
  doc.setFillColor(236, 253, 245); // Verde muy claro
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX + 105, currentY + 17, 45, 9, 1.5, 1.5, 'FD');

  doc.setTextColor(4, 120, 87);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(trailerPlate, boxX + 127.5, currentY + 23.5, { align: 'center' });

  // Tipo de Jaula (Simple o Doble)
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Tipo de Estructura:', boxX + 8, currentY + 31);

  const isDouble = trailer?.type === 'DOUBLE';
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(isDouble ? 'JAULA DOBLE PISO (Hacienda)' : 'JAULA SIMPLE PISO', boxX + 44, currentY + 31);

  currentY += 45;

  // 5. Verificación con Código QR y Firma
  const bottomBoxHeight = 52;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.4);
  doc.roundedRect(boxX, currentY, boxWidth, bottomBoxHeight, 2, 2, 'FD');

  // Columna Izquierda: QR
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', boxX + 5, currentY + 4, 44, 44);
    } catch (e) {
      console.warn('Error al incrustar QR en PDF:', e);
    }
  }

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('LLAMADA DIRECTA QR AL CHOFER', boxX + 53, currentY + 13);

  const driverDisplayName = driver?.name ? driver.name.toLowerCase() : 'chofer';
  const driverDisplayPhone = driverPhone || '-';

  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Escanee este código con la cámara de su smartphone para llamar', boxX + 53, currentY + 21);
  doc.text(`directamente al chofer (${driverDisplayName}) al ${driverDisplayPhone}.`, boxX + 53, currentY + 27);

  // Columna Derecha: Firma y Sello
  const signStartX = boxX + 120;
  doc.setDrawColor(...textMuted);
  doc.setLineWidth(0.4);
  doc.line(signStartX, currentY + 33, signStartX + 52, currentY + 33);

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Dpto. Logística y Despacho', signStartX + 26, currentY + 38.5, { align: 'center' });

  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('FRIGORÍFICO PAMPA', signStartX + 26, currentY + 43, { align: 'center' });

  // 6. Pie Legal del documento
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text(
    'Documento oficial expedido para control vehicular y asignación de choferes. Prohibida su alteración o uso indebido.',
    105,
    282,
    { align: 'center' }
  );

  return doc;
}

/**
 * Genera el reporte consolidado en PDF de toda la flota de camiones con sus choferes y jaulas.
 * @param {Array<Object>} trucks - Lista de camiones.
 * @param {Object} [deps={}] - Dependencias { drivers, trailers }.
 * @returns {Promise<jsPDF>} Instancia de jsPDF.
 */
export async function generateFleetReportPdf(trucks, deps = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const [logoDataUrl, qrDataUrl] = await Promise.all([
    getImageDataUrl('/logo.jpg'),
    generateQrDataUrl([
      `FRIGORÍFICO PAMPA - ${COMPANY_INFO.legalName}`,
      `CUIT: ${COMPANY_INFO.cuit}`,
      `PLANILLA DE FLOTA COMPLETA: ${trucks.length} UNIDADES`,
      `FECHA: ${new Date().toLocaleDateString('es-AR')}`
    ].join('\n'))
  ]);

  const primaryColor = [132, 29, 29];
  const darkColor = [30, 41, 59];
  const borderGrey = [203, 213, 225];
  const textMuted = [100, 116, 139];

  // Franja superior de marca
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 297, 6, 'F');

  // Encabezado
  let headerY = 12;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', 14, headerY, 20, 20);
    } catch (e) {
      console.warn('Error al incrustar logo:', e);
    }
  }

  const titleX = logoDataUrl ? 38 : 14;

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(COMPANY_INFO.name, titleX, headerY + 6);

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`${COMPANY_INFO.legalName}  |  CUIT: ${COMPANY_INFO.cuit}`, titleX, headerY + 12);

  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Planilla Oficial de Control de Flota, Asignación de Choferes y Jaulas', titleX, headerY + 17);

  // Fecha y totalizador a la derecha
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 283, headerY + 6, { align: 'right' });

  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.text(`Total Flota: ${trucks.length} Unidades`, 283, headerY + 12, { align: 'right' });

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', 265, headerY + 14, 18, 18);
    } catch (e) {
      console.warn('Error al incrustar QR:', e);
    }
  }

  // Línea divisoria
  doc.setDrawColor(...borderGrey);
  doc.setLineWidth(0.4);
  doc.line(14, 35, 283, 35);

  // Tabla de unidades
  let tableY = 41;
  const colX = {
    idx: 14,
    truck: 25,
    truckPlate: 75,
    driver: 110,
    driverDni: 165,
    trailer: 195,
    trailerPlate: 238,
    trailerType: 265
  };

  // Cabecera de la tabla
  doc.setFillColor(241, 245, 249);
  doc.rect(14, tableY, 269, 8, 'F');
  doc.setDrawColor(...borderGrey);
  doc.line(14, tableY + 8, 283, tableY + 8);

  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('#', colX.idx, tableY + 5.5);
  doc.text('CAMIÓN', colX.truck, tableY + 5.5);
  doc.text('PATENTE CAMIÓN', colX.truckPlate, tableY + 5.5);
  doc.text('CHOFER CONDUCTOR', colX.driver, tableY + 5.5);
  doc.text('DNI CHOFER', colX.driverDni, tableY + 5.5);
  doc.text('JAULA ASIGNADA', colX.trailer, tableY + 5.5);
  doc.text('PATENTE JAULA', colX.trailerPlate, tableY + 5.5);
  doc.text('TIPO JAULA', colX.trailerType, tableY + 5.5);

  tableY += 10;

  trucks.forEach((truck, index) => {
    if (tableY > 185) {
      doc.addPage();
      tableY = 20;

      // Repetir cabecera en nueva página
      doc.setFillColor(241, 245, 249);
      doc.rect(14, tableY, 269, 8, 'F');
      doc.setDrawColor(...borderGrey);
      doc.line(14, tableY + 8, 283, tableY + 8);

      doc.setTextColor(...darkColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('#', colX.idx, tableY + 5.5);
      doc.text('CAMIÓN', colX.truck, tableY + 5.5);
      doc.text('PATENTE CAMIÓN', colX.truckPlate, tableY + 5.5);
      doc.text('CHOFER CONDUCTOR', colX.driver, tableY + 5.5);
      doc.text('DNI CHOFER', colX.driverDni, tableY + 5.5);
      doc.text('JAULA ASIGNADA', colX.trailer, tableY + 5.5);
      doc.text('PATENTE JAULA', colX.trailerPlate, tableY + 5.5);
      doc.text('TIPO JAULA', colX.trailerType, tableY + 5.5);

      tableY += 10;
    }

    const driver = resolveDriver(truck, deps.drivers || []);
    const trailer = resolveTrailer(truck, deps.trailers || []);

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, tableY - 1.5, 269, 7.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(String(index + 1), colX.idx, tableY + 3.5);

    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.text((truck.name || 'Sin Identificador').slice(0, 26), colX.truck, tableY + 3.5);

    // Patente camión
    doc.setTextColor(...primaryColor);
    doc.text((truck.licensePlate || 'S/D').toUpperCase(), colX.truckPlate, tableY + 3.5);

    // Chofer
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', driver ? 'bold' : 'italic');
    doc.text((driver?.name || 'Sin Asignar').slice(0, 26), colX.driver, tableY + 3.5);

    // DNI
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(driver?.dni ? String(driver.dni) : '-', colX.driverDni, tableY + 3.5);

    // Jaula
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', trailer ? 'bold' : 'italic');
    doc.text((trailer?.name || 'Sin Asignar').slice(0, 20), colX.trailer, tableY + 3.5);

    // Patente Jaula
    doc.setTextColor(5, 150, 105);
    doc.setFont('helvetica', 'bold');
    doc.text((trailer?.licensePlate || 'S/D').toUpperCase(), colX.trailerPlate, tableY + 3.5);

    // Tipo Jaula
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkColor);
    doc.text(trailer ? (trailer.type === 'DOUBLE' ? 'Doble' : 'Simple') : '-', colX.trailerType, tableY + 3.5);

    // Separador ligero
    doc.setDrawColor(241, 245, 249);
    doc.line(14, tableY + 6, 283, tableY + 6);

    tableY += 8;
  });

  // Pie de página
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text(
    `Frigorífico Pampa - Andres e Ivan Muhic S.A.S. - Sistema de Gestión de Logística. Generado el ${new Date().toLocaleString('es-AR')}`,
    148.5,
    202,
    { align: 'center' }
  );

  return doc;
}

/**
 * Descarga o comparte el PDF generado usando la Web Share API en dispositivos móviles,
 * con fallback transparente a descarga directa en navegadores tradicionales.
 * @param {jsPDF} doc - Instancia del documento jsPDF.
 * @param {string} fileName - Nombre del archivo con extensión .pdf.
 * @param {string} title - Título del documento para el menú nativo de compartir.
 * @param {boolean} [preferShare=false] - Si es true intenta abrir el menú compartir nativo.
 * @returns {Promise<{ shared: boolean, downloaded: boolean, cancelled?: boolean }>} Resultado de la operación.
 */
export async function shareOrDownloadPdf(doc, fileName, title = 'Constancia de Transporte', preferShare = false) {
  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

  // Si se solicitó compartir y el navegador soporta compartir archivos nativamente
  if (preferShare && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: title,
        text: `${title} - Frigorífico Pampa (Andres e Ivan Muhic S.A.S.)`
      });
      return { shared: true, downloaded: false };
    } catch (err) {
      // Si el usuario canceló el selector nativo de compartir, no forzamos la descarga
      if (err.name === 'AbortError') {
        return { shared: false, downloaded: false, cancelled: true };
      }
      console.warn('Web Share API falló, procediendo con descarga estándar:', err);
    }
  }

  // Descarga normal estándar en escritorio o si no hay soporte de Web Share
  doc.save(fileName);
  return { shared: false, downloaded: true };
}
