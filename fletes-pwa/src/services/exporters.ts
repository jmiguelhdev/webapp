import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { CBUHelper } from '../utils/cbuHelper';
import { Formatters } from '../utils/formatters';
import {
  AppConfig,
  Driver,
  Producer,
  Travel,
  Truck,
  getActualKgFaena,
  getBuyTotalKgClean,
  getBuyTotalQuantity,
  getDistanceKm,
  getDriverCost,
  getEffectiveYield,
  getFinalCostPerKg,
  getFleteCalculationDetail,
  getFleteCost,
  getFuelCost,
  getGastosDelViaje,
  getProducerTotalKgClean,
  getProducerTotalQuantity,
  getProductAvgKgClean,
  getProductCommissionAmount,
  getProductFactura,
  getProductKgClean,
  getProductOperation,
  getProductOperationWithCommission,
  getProductYield,
  getReimbursableExpenses,
  getTravelDisplayTitle,
  getTravelProfit,
  getTravelStatusDisplayName,
  resolveProductCategory,
} from '../domain/models';

// =============================================================================
// 1. WhatsApp Share Helper (1:1 port of WhatsAppShareHelper.swift)
// =============================================================================

export const WhatsAppShareHelper = {
  openWhatsApp(text: string, phoneNumber?: string): void {
    const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
    const encodedText = encodeURIComponent(text);

    const webUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    const opened = window.open(webUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = webUrl;
    }
  },

  formatDriverWeeklyMessage(
    driver: Driver,
    travels: Travel[],
    startDate: Date,
    endDate: Date,
    config: AppConfig
  ): string {
    const totalDriverEarnings = travels.reduce((acc, t) => acc + getDriverCost(t), 0);
    const totalExpenses = travels.reduce((acc, t) => acc + getReimbursableExpenses(t), 0);
    const totalFreightToPay = travels.reduce(
      (acc, t) => acc + (t.truck?.isFreightPaid ? getFleteCost(t, config) : 0),
      0
    );
    const netPay = totalDriverEarnings + totalExpenses + totalFreightToPay;
    const totalKms = travels.reduce((acc, t) => acc + getDistanceKm(t), 0);

    let msg = `🚛 *LIQUIDACIÓN CHOFER: ${driver.name}*\n`;
    if (driver.dni) {
      msg += `👤 *DNI:* ${Formatters.dni(driver.dni)}\n`;
    }
    msg += `🗓️ *Período:* ${Formatters.date(startDate)} al ${Formatters.date(endDate)}\n`;
    msg += `─────────────────────────\n\n`;

    msg += `📊 *RESUMEN DE LIQUIDACIÓN:*\n`;
    msg += `• *Total Ganancia Fletes:* ${Formatters.currency(totalDriverEarnings)}\n`;
    msg += `• *Gastos Reembolsables:* ${Formatters.currency(totalExpenses)}\n`;
    if (totalFreightToPay > 0) {
      msg += `• *Fletes de Terceros:* ${Formatters.currency(totalFreightToPay)}\n`;
    }
    msg += `💰 *TOTAL NETO A PAGAR:* *${Formatters.currency(netPay)}*\n\n`;

    msg += `─────────────────────────\n`;
    msg += `🛣️ *DESGLOSE DE VIAJES (${travels.length}):*\n`;
    msg += `_(Cálculo explícito: Distancia km × Tarifa según tipo de jaula)_\n\n`;

    for (const travel of travels) {
      const desc = travel.description || getTravelDisplayTitle(travel);
      const isDouble = travel.truck?.trailer?.type === 'DOUBLE';
      const jaulaType = isDouble ? 'Doble' : 'Simple';
      const rate = isDouble ? travel.driverPricePerKmDouble : travel.driverPricePerKmSimple;
      const dist = getDistanceKm(travel);
      const kmsStr = Formatters.decimal(dist, 0);
      const reimb = getReimbursableExpenses(travel);

      msg += `• *${Formatters.displayDate(travel.date)} — ${desc}*\n`;
      msg += `  Camión: ${travel.truck?.name || '-'} | Jaula: ${jaulaType}\n`;
      msg += `  Fórmula: ${kmsStr} km × ${Formatters.currency(rate)}/km = *${Formatters.currency(getDriverCost(travel))}*\n`;
      if (reimb > 0) {
        msg += `  Reembolso de gastos en viaje: +${Formatters.currency(reimb)}\n`;
      }
      msg += `\n`;
    }

    const allReimbursable = travels.flatMap((t) =>
      (t.expenses || []).filter((e) => e.isReimbursable).map((expense) => ({ travel: t, expense }))
    );

    msg += `─────────────────────────\n`;
    msg += `🧾 *DESGLOSE DE GASTOS REEMBOLSABLES (${allReimbursable.length}):*\n`;
    msg += `_(Gastos cargados por el chofer con tipo y descripción)_\n\n`;

    if (allReimbursable.length === 0) {
      msg += `• Sin gastos reembolsables registrados en este período.\n`;
    } else {
      for (const item of allReimbursable) {
        const exp = item.expense;
        const travelDesc = item.travel.description || getTravelDisplayTitle(item.travel);
        const dateStr = exp.date ? Formatters.displayDate(exp.date) : Formatters.displayDate(item.travel.date);
        msg += `• *${dateStr}* [${(exp.category || 'OTRO').toUpperCase()}]: ${exp.description}\n`;
        msg += `  Viaje: ${travelDesc} ➔ Gastos: *${Formatters.currency(exp.amount)}*\n`;
      }
      msg += `\n*Subtotal Reembolso de Gastos:* ${Formatters.currency(totalExpenses)}\n`;
    }

    msg += `─────────────────────────\n`;
    msg += `📊 *Total Distancia:* ${Formatters.decimal(totalKms, 0)} km\n`;
    msg += `💵 *TOTAL A TRANSFERIR:* *${Formatters.currency(netPay)}*\n`;

    return msg;
  },

  formatProducerPurchaseMessage(travel: Travel, producer: Producer): string {
    let msg = `🐂 *LIQUIDACIÓN OFICIAL DE COMPRA — FRIGORÍFICO PAMPA*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 *Productor:* ${producer.name}\n`;
    if (producer.cuit) {
      msg += `📄 *CUIT:* ${Formatters.cuit(producer.cuit)}\n`;
    }
    msg += `🗓️ *Fecha:* ${Formatters.displayDate(travel.date)}\n`;
    msg += `🚛 *Viaje / Destino:* ${getTravelDisplayTitle(travel)}\n`;
    if (travel.buy?.agent) {
      msg += `🤝 *Comisionista:* ${travel.buy.agent.name} (${Formatters.decimal(travel.buy.agent.percent, 1)}%)\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    (producer.listOfProducts || []).forEach((p, idx) => {
      const catName = p.name || resolveProductCategory(p.name);
      msg += `*LOTE ${idx + 1}: ${catName.toUpperCase()}*\n`;
      msg += `• Cabezas: ${p.quantity}\n`;
      msg += `• Peso Bruto: ${Formatters.decimal(p.kg, 2)} kg\n`;
      msg += `• Desbaste: %${Formatters.decimal(p.roughing, 1)}\n`;
      msg += `• Peso Limpio: ${Formatters.decimal(getProductKgClean(p), 2)} kg (±${Formatters.decimal(getProductAvgKgClean(p), 1)} kg/cab)\n`;
      msg += `• Precio x Kg Limpio: ${Formatters.currency(p.price)}\n`;
      msg += `• Subtotal Operación: ${Formatters.currency(getProductOperation(p))}\n`;
      if (p.agentCommissionPercent > 0) {
        msg += `• Comisión (${Formatters.decimal(p.agentCommissionPercent, 1)}%): ${Formatters.currency(getProductCommissionAmount(p))}\n`;
        msg += `• Total c/ Comisión: ${Formatters.currency(getProductOperationWithCommission(p))}\n`;
      }
      if (p.reduce > 0) {
        msg += `• Achique Aplicado: -${Formatters.currency(p.reduce)}\n`;
      }
      msg += `• *Total a Pagar (Factura): ${Formatters.currency(getProductFactura(p))}*\n`;
      msg += `  └ Neto: ${Formatters.currency(p.taxes.bill.neto)} | IVA (${p.isIvaManual ? 'Manual' : 'Auto'}): ${Formatters.currency(p.taxes.bill.iva)} | Ganancias: ${Formatters.currency(p.taxes.bill.ganancias)}\n`;
      if (p.kgFaena > 0) {
        msg += `  └ Faena: ${Formatters.decimal(p.kgFaena, 2)} kg en gancho | Rdo: %${Formatters.decimal(getProductYield(p) * 100, 2)}\n`;
      }
      msg += `\n`;
    });

    const prods = producer.listOfProducts || [];
    const totalFactura = prods.reduce((acc, p) => acc + getProductFactura(p), 0);
    const totalNeto = prods.reduce((acc, p) => acc + (p.taxes?.bill?.neto || 0), 0);
    const totalIva = prods.reduce((acc, p) => acc + (p.taxes?.bill?.iva || 0), 0);
    const totalGanancias = prods.reduce((acc, p) => acc + (p.taxes?.bill?.ganancias || 0), 0);

    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*RESUMEN CONSOLIDADO PRODUCTOR:*\n`;
    msg += `📊 Cabezas Totales: ${getProducerTotalQuantity(producer)}\n`;
    msg += `⚖️ Kilos Limpios Totales: ${Formatters.decimal(getProducerTotalKgClean(producer), 2)} kg\n`;
    msg += `🧾 Base Imponible (Neto): ${Formatters.currency(totalNeto)}\n`;
    msg += `🧾 Total IVA: ${Formatters.currency(totalIva)}\n`;
    if (totalGanancias > 0) {
      msg += `🧾 Retención Ganancias: ${Formatters.currency(totalGanancias)}\n`;
    }
    msg += `💵 *TOTAL A PAGAR FACTURA:* *${Formatters.currency(totalFactura)}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Frigorífico Pampa — Emisión Digital Oficial\n`;

    return msg;
  },

  formatTravelLiquidationMessage(travel: Travel, config: AppConfig): string {
    let msg = `🚛 *RESUMEN DE VIAJE Y LIQUIDACIÓN — FRIGORÍFICO PAMPA*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 *Destino:* ${getTravelDisplayTitle(travel)}\n`;
    msg += `🗓️ *Fecha:* ${Formatters.displayDate(travel.date)}\n`;
    msg += `🚚 *Camión:* ${travel.truck?.name || '-'} (${travel.truck?.licensePlate || '-'})\n`;
    msg += `👤 *Chofer:* ${travel.truck?.driver?.name || '-'}\n`;
    msg += `📏 *Distancia:* ${Formatters.decimal(getDistanceKm(travel), 0)} km\n`;
    msg += `💰 *Flete Total:* ${Formatters.currency(getFleteCost(travel, config))} (${getFleteCalculationDetail(travel, config)})\n`;
    msg += `💰 *Ganancia Viaje:* ${Formatters.currency(getTravelProfit(travel, config))}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (!travel.isOnlyFreight) {
      const actualFaena = getActualKgFaena(travel);
      msg += `*HACIENDA:*\n`;
      msg += `• Cabezas: ${getBuyTotalQuantity(travel.buy)}\n`;
      msg += `• Kilos Limpios: ${Formatters.decimal(getBuyTotalKgClean(travel.buy), 0)} kg\n`;
      if (actualFaena > 0) {
        msg += `• Kilos Faena: ${Formatters.decimal(actualFaena, 0)} kg (Rdo: %${Formatters.decimal(getEffectiveYield(travel) * 100, 2)})\n`;
        msg += `• Costo Gancho Final: ${Formatters.currency(getFinalCostPerKg(travel, config))}/kg\n`;
      }
      if ((travel.buy?.totalReduce || 0) > 0) {
        msg += `• Achique Global: ${Formatters.currency(travel.buy.totalReduce)}\n`;
      }
      const totalFactura = (travel.buy?.listOfProducers || [])
        .flatMap((p) => p.listOfProducts || [])
        .reduce((acc, p) => acc + getProductFactura(p), 0);
      msg += `• Total Hacienda Facturable: *${Formatters.currency(totalFactura)}*\n\n`;

      for (const prod of travel.buy?.listOfProducers || []) {
        const pFactura = (prod.listOfProducts || []).reduce((acc, p) => acc + getProductFactura(p), 0);
        msg += `• ${prod.name}: ${getProducerTotalQuantity(prod)} cab. | ${Formatters.decimal(getProducerTotalKgClean(prod), 0)} kg | *${Formatters.currency(pFactura)}*\n`;
      }
    }

    return msg;
  },

  formatTruckDataMessage(truck: Truck): string {
    const driverName = truck.driver?.name || 'Sin asignar';
    const driverDni = truck.driver?.dni ? Formatters.dni(truck.driver.dni) : 'No registrado';
    const driverPhone = truck.driver?.license || 'No registrado';
    const truckPlate = truck.licensePlate ? truck.licensePlate.toUpperCase() : 'Sin patente';
    const trailerPlate = truck.trailer?.licensePlate
      ? truck.trailer.licensePlate.toUpperCase()
      : 'Sin patente';
    const trailerTypeDesc =
      truck.trailer?.type === 'DOUBLE' ? 'DOBLE (Doble Piso)' : 'SIMPLE (Simple Piso)';

    let msg = `🚛 FICHA DE TRANSPORTE — FRIGORÍFICO PAMPA\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 CHOFER ASIGNADO\n`;
    msg += `•  Nombre: ${driverName}\n`;
    msg += `•  DNI: ${driverDni}\n`;
    msg += `•  Telefono: ${driverPhone}\n`;
    msg += `🚚 CAMIÓN (UNIDAD TRACTORA)\n`;
    msg += `•  Patente: ${truckPlate}\n`;
    msg += `📦 JAULA / ACOPLADO\n`;
    msg += `•  Patente: ${trailerPlate}\n`;
    msg += `•  Tipo de Jaula: ${trailerTypeDesc}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📅 Fecha de Emisión: ${Formatters.date(new Date())}\n`;
    return msg;
  },

  formatProducerPaymentDataMessage(producer: Producer): string {
    const cuitFormatted = producer.cuit ? Formatters.cuit(producer.cuit) : 'No registrado';
    const cbuInfo = CBUHelper.decode(producer.cbu);

    let msg = `🏦 *DATOS BANCARIOS Y FISCALES — PRODUCTOR*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 *Titular / Razón Social:* ${producer.name}\n`;
    msg += `📄 *CUIT:* ${cuitFormatted}\n`;
    if (producer.phone) {
      msg += `📞 *Teléfono:* ${producer.phone}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏛️ *INFORMACIÓN BANCARIA*\n`;
    if (cbuInfo.isValidLength) {
      msg += `• *Entidad / Banco:* ${cbuInfo.bankName}\n`;
      if (cbuInfo.branchCode && !cbuInfo.isCVU) {
        msg += `• *Sucursal:* ${cbuInfo.branchCode}\n`;
      }
      if (cbuInfo.accountNumber) {
        if (cbuInfo.rawAccountNumber && cbuInfo.rawAccountNumber !== cbuInfo.accountNumber) {
          msg += `• *Nº de Cuenta:* ${cbuInfo.accountNumber} (13 dig: ${cbuInfo.rawAccountNumber})\n`;
        } else {
          msg += `• *Nº de Cuenta:* ${cbuInfo.accountNumber}\n`;
        }
      }
      msg += `• *CBU:* ${producer.cbu}\n`;
    } else if (producer.cbu) {
      msg += `• *CBU:* ${producer.cbu}\n`;
      msg += `• *Entidad:* ${cbuInfo.bankName}\n`;
    } else {
      msg += `• *CBU:* No registrado\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📅 *Fecha:* ${Formatters.date(new Date())}\n`;
    msg += `Frigorífico Pampa`;

    return msg;
  },
};

// =============================================================================
// 2. Vectorial PDF Generators (jsPDF)
// =============================================================================

function createPdfHeader(doc: jsPDF, title: string, subtitle: string): number {
  doc.setFillColor(10, 14, 18);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(0.7);
  doc.line(0, 28, 210, 28);

  doc.setTextColor(0, 229, 255);
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.text('FRIGORÍFICO PAMPA // IosFletes', 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(title, 14, 19);

  doc.setTextColor(160, 175, 190);
  doc.setFontSize(8.5);
  doc.text(subtitle, 14, 24.5);

  doc.setTextColor(30, 35, 42);
  doc.setFont('helvetica', 'normal');
  return 36;
}

function checkPdfPage(doc: jsPDF, y: number, margin = 20): number {
  if (y > 275) {
    doc.addPage();
    return margin;
  }
  return y;
}

function addKeyValueRow(doc: jsPDF, label: string, value: string, y: number, boldValue = false): number {
  const nextY = checkPdfPage(doc, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(80, 90, 100);
  doc.text(label, 14, nextY);

  doc.setFont('helvetica', boldValue ? 'bold' : 'normal');
  doc.setTextColor(15, 20, 25);
  doc.text(value, 196, nextY, { align: 'right' });
  return nextY + 6;
}

export function exportTravelPdf(travel: Travel, config: AppConfig): void {
  const doc = new jsPDF();
  let y = createPdfHeader(
    doc,
    'REMITO Y LIQUIDACIÓN DE VIAJE',
    `ID #${travel.id} • Fecha: ${Formatters.displayDate(travel.date)} • Estado: ${getTravelStatusDisplayName(travel.status)}`
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(10, 92, 209);
  doc.text('1. RESUMEN LOGÍSTICO', 14, y);
  y += 7;

  y = addKeyValueRow(doc, 'Viaje / Destino', getTravelDisplayTitle(travel), y, true);
  y = addKeyValueRow(
    doc,
    'Camión y Patente',
    `${travel.truck?.name || '-'} (${travel.truck?.licensePlate || '-'})`,
    y
  );
  y = addKeyValueRow(doc, 'Chofer', travel.truck?.driver?.name || 'Sin asignar', y);
  y = addKeyValueRow(
    doc,
    'Jaula / Acoplado',
    `${travel.truck?.trailer?.name || '-'} (${travel.truck?.trailer?.type === 'DOUBLE' ? 'Doble' : 'Simple'})`,
    y
  );
  y = addKeyValueRow(
    doc,
    'Odómetro (Origen → Destino)',
    `${Formatters.decimal(travel.kmOnOrigin, 0)} km → ${Formatters.decimal(travel.kmOnDestination, 0)} km (${Formatters.decimal(getDistanceKm(travel), 0)} km)`,
    y
  );
  y = addKeyValueRow(doc, 'Flete Facturado', `${Formatters.currency(getFleteCost(travel, config))} (${getFleteCalculationDetail(travel, config)})`, y, true);
  y = addKeyValueRow(doc, 'Costo Chofer', Formatters.currency(getDriverCost(travel)), y);
  y = addKeyValueRow(doc, 'Combustible Estimado', Formatters.currency(getFuelCost(travel)), y);
  y = addKeyValueRow(doc, 'Gastos Operativos', Formatters.currency(getGastosDelViaje(travel)), y);
  y = addKeyValueRow(doc, 'Ganancia Neta Logística', Formatters.currency(getTravelProfit(travel, config)), y, true);

  if ((travel.expenses || []).length > 0) {
    y += 4;
    y = checkPdfPage(doc, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(10, 92, 209);
    doc.text('2. GASTOS DEL VIAJE', 14, y);
    y += 7;

    for (const exp of travel.expenses) {
      y = addKeyValueRow(
        doc,
        `[${exp.category}] ${exp.description || 'Sin detalle'}${exp.isReimbursable ? ' (Reemb.)' : ''}`,
        Formatters.currency(exp.amount),
        y
      );
    }
  }

  if (!travel.isOnlyFreight && (travel.buy?.listOfProducers || []).length > 0) {
    y += 4;
    y = checkPdfPage(doc, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(10, 92, 209);
    doc.text('3. COMPRA DE HACIENDA Y LIQUIDACIÓN FISCAL', 14, y);
    y += 7;

    y = addKeyValueRow(doc, 'Cabezas Totales', String(getBuyTotalQuantity(travel.buy)), y);
    y = addKeyValueRow(doc, 'Kilos Limpios Totales', Formatters.weight(getBuyTotalKgClean(travel.buy)), y);
    if (getActualKgFaena(travel) > 0) {
      y = addKeyValueRow(doc, 'Kilos Faena (Gancho)', Formatters.weight(getActualKgFaena(travel)), y);
      y = addKeyValueRow(doc, 'Rendimiento Efectivo', `${Formatters.decimal(getEffectiveYield(travel) * 100, 2)}%`, y);
      y = addKeyValueRow(doc, 'Costo Gancho Final', `${Formatters.currency(getFinalCostPerKg(travel, config))}/kg`, y, true);
    }

    for (const prod of travel.buy.listOfProducers) {
      y += 3;
      y = checkPdfPage(doc, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(20, 25, 30);
      doc.text(`Productor: ${prod.name}${prod.cuit ? ` (CUIT: ${Formatters.cuit(prod.cuit)})` : ''}`, 14, y);
      y += 5;

      for (const p of prod.listOfProducts || []) {
        y = addKeyValueRow(
          doc,
          `  • ${p.name || resolveProductCategory(p.name)} — ${p.quantity} cab. | ${Formatters.decimal(getProductKgClean(p), 0)} kg limpios × ${Formatters.currency(p.price)}`,
          `Fact: ${Formatters.currency(getProductFactura(p))}`,
          y
        );
        y = addKeyValueRow(
          doc,
          `    Neto: ${Formatters.currency(p.taxes.bill.neto)} | IVA: ${Formatters.currency(p.taxes.bill.iva)} | Ganancias: ${Formatters.currency(p.taxes.bill.ganancias)}`,
          p.kgFaena > 0 ? `Faena: ${Formatters.decimal(p.kgFaena, 0)} kg (${Formatters.decimal(getProductYield(p) * 100, 1)}%)` : '',
          y
        );
      }
    }
  }

  doc.save(`Remito_Viaje_${travel.id}.pdf`);
}

export function exportDriverSettlementPdf(
  driver: Driver,
  travels: Travel[],
  startDate: Date,
  endDate: Date,
  config: AppConfig
): void {
  const doc = new jsPDF();
  let y = createPdfHeader(
    doc,
    `LIQUIDACIÓN SEMANAL DE CHOFER: ${driver.name}`,
    `DNI: ${driver.dni ? Formatters.dni(driver.dni) : '-'} • Período: ${Formatters.date(startDate)} al ${Formatters.date(endDate)}`
  );

  const totalDriverEarnings = travels.reduce((acc, t) => acc + getDriverCost(t), 0);
  const totalExpenses = travels.reduce((acc, t) => acc + getReimbursableExpenses(t), 0);
  const totalFreightToPay = travels.reduce(
    (acc, t) => acc + (t.truck?.isFreightPaid ? getFleteCost(t, config) : 0),
    0
  );
  const netPay = totalDriverEarnings + totalExpenses + totalFreightToPay;
  const totalKms = travels.reduce((acc, t) => acc + getDistanceKm(t), 0);

  y = addKeyValueRow(doc, 'Viajes Computados', String(travels.length), y);
  y = addKeyValueRow(doc, 'Distancia Total Recorrida', `${Formatters.decimal(totalKms, 0)} km`, y);
  y = addKeyValueRow(doc, 'Ganancia por Viajes', Formatters.currency(totalDriverEarnings), y);
  y = addKeyValueRow(doc, 'Reembolso de Gastos', Formatters.currency(totalExpenses), y);
  if (totalFreightToPay > 0) {
    y = addKeyValueRow(doc, 'Fletes de Terceros', Formatters.currency(totalFreightToPay), y);
  }
  y = addKeyValueRow(doc, 'TOTAL NETO A PAGAR', Formatters.currency(netPay), y, true);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(10, 92, 209);
  doc.text('DETALLE DE VIAJES', 14, y);
  y += 6;

  for (const t of travels) {
    const isDouble = t.truck?.trailer?.type === 'DOUBLE';
    const rate = isDouble ? t.driverPricePerKmDouble : t.driverPricePerKmSimple;
    y = addKeyValueRow(
      doc,
      `${Formatters.displayDate(t.date)} • ${getTravelDisplayTitle(t)} (${Formatters.decimal(getDistanceKm(t), 0)} km × ${Formatters.currency(rate)})`,
      Formatters.currency(getDriverCost(t)),
      y
    );
  }

  const safeName = (driver.name || 'Chofer').replace(/\s+/g, '_');
  doc.save(`Liquidacion_${safeName}_${Formatters.isoDate(endDate)}.pdf`);
}

export function exportProducerLiquidationPdf(travel: Travel, producer: Producer): void {
  const doc = new jsPDF();
  let y = createPdfHeader(
    doc,
    `LIQUIDACIÓN DE COMPRA — ${producer.name}`,
    `CUIT: ${producer.cuit ? Formatters.cuit(producer.cuit) : '-'} • Viaje: ${getTravelDisplayTitle(travel)} (${Formatters.displayDate(travel.date)})`
  );

  for (const p of producer.listOfProducts || []) {
    y = addKeyValueRow(
      doc,
      `${p.name || resolveProductCategory(p.name)} (${p.quantity} cab • ${Formatters.decimal(getProductKgClean(p), 1)} kg limpios × ${Formatters.currency(p.price)})`,
      Formatters.currency(getProductFactura(p)),
      y,
      true
    );
    y = addKeyValueRow(
      doc,
      `   Neto: ${Formatters.currency(p.taxes.bill.neto)} | IVA: ${Formatters.currency(p.taxes.bill.iva)} | Ganancias: ${Formatters.currency(p.taxes.bill.ganancias)}`,
      p.reduce > 0 ? `Achique: -${Formatters.currency(p.reduce)}` : '',
      y
    );
  }

  y += 4;
  const totalFact = (producer.listOfProducts || []).reduce((acc, p) => acc + getProductFactura(p), 0);
  const totalNeto = (producer.listOfProducts || []).reduce((acc, p) => acc + (p.taxes?.bill?.neto || 0), 0);
  const totalIva = (producer.listOfProducts || []).reduce((acc, p) => acc + (p.taxes?.bill?.iva || 0), 0);
  const totalGan = (producer.listOfProducts || []).reduce((acc, p) => acc + (p.taxes?.bill?.ganancias || 0), 0);

  y = addKeyValueRow(doc, 'Base Imponible (Neto)', Formatters.currency(totalNeto), y);
  y = addKeyValueRow(doc, 'Total IVA', Formatters.currency(totalIva), y);
  y = addKeyValueRow(doc, 'Retención Ganancias', Formatters.currency(totalGan), y);
  y = addKeyValueRow(doc, 'TOTAL FACTURA', Formatters.currency(totalFact), y, true);

  const safeProd = (producer.name || 'Productor').replace(/\s+/g, '_');
  doc.save(`Liquidacion_${safeProd}_Viaje_${travel.id}.pdf`);
}

export function exportTruckSheetPdf(truck: Truck): void {
  const doc = new jsPDF();
  let y = createPdfHeader(
    doc,
    `FICHA TÉCNICA DE UNIDAD: ${truck.name}`,
    `Patente: ${truck.licensePlate || '-'} • Emisión: ${Formatters.date(new Date())}`
  );

  y = addKeyValueRow(doc, 'Unidad Tractora', truck.name || '-', y, true);
  y = addKeyValueRow(doc, 'Patente Camión', (truck.licensePlate || '-').toUpperCase(), y);
  y = addKeyValueRow(doc, 'Vencimiento VTV Camión', truck.vtvExpiration ? Formatters.displayDate(truck.vtvExpiration) : '-', y);
  y = addKeyValueRow(doc, 'Vencimiento Seguro', truck.insuranceExpiration ? Formatters.displayDate(truck.insuranceExpiration) : '-', y);
  y = addKeyValueRow(doc, 'Consumo Promedio Configurado', `${Formatters.decimal(truck.averageEfficiency, 2)} km/l`, y);

  y += 4;
  y = addKeyValueRow(doc, 'Chofer Asignado', truck.driver?.name || 'Sin asignar', y, true);
  y = addKeyValueRow(doc, 'DNI Chofer', truck.driver?.dni ? Formatters.dni(truck.driver.dni) : '-', y);
  y = addKeyValueRow(doc, 'Teléfono / Licencia', truck.driver?.license || '-', y);

  y += 4;
  y = addKeyValueRow(doc, 'Jaula / Acoplado', truck.trailer?.name || 'Sin asignar', y, true);
  y = addKeyValueRow(doc, 'Patente Jaula', (truck.trailer?.licensePlate || '-').toUpperCase(), y);
  y = addKeyValueRow(doc, 'Tipo Jaula', truck.trailer?.type === 'DOUBLE' ? 'DOBLE (Doble Piso)' : 'SIMPLE', y);
  y = addKeyValueRow(doc, 'VTV Jaula', truck.trailer?.vtvExpiration ? Formatters.displayDate(truck.trailer.vtvExpiration) : '-', y);
  y = addKeyValueRow(doc, 'Habilitación SENASA', truck.trailer?.senasaExpiration ? Formatters.displayDate(truck.trailer.senasaExpiration) : '-', y);

  const safeTruck = (truck.name || 'Camion').replace(/\s+/g, '_');
  doc.save(`Ficha_Transporte_${safeTruck}.pdf`);
}

// =============================================================================
// 3. Multi-Sheet Excel Workbook Exporter (SheetJS / xlsx)
// =============================================================================

export function exportFullWorkbookXlsx(travels: Travel[], config: AppConfig): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Viajes y Fletes
  const sheet1Rows = travels.map((t) => ({
    ID: t.id,
    Fecha: Formatters.displayDate(t.date),
    Descripción: getTravelDisplayTitle(t),
    Estado: getTravelStatusDisplayName(t.status),
    Camión: t.truck?.name || '',
    Patente: t.truck?.licensePlate || '',
    Chofer: t.truck?.driver?.name || '',
    Jaula: t.truck?.trailer?.type === 'DOUBLE' ? 'Doble' : 'Simple',
    'Km Origen': t.kmOnOrigin,
    'Km Destino': t.kmOnDestination,
    'Distancia (km)': getDistanceKm(t),
    'Flete ($)': Math.round(getFleteCost(t, config) * 100) / 100,
    'Costo Chofer ($)': Math.round(getDriverCost(t) * 100) / 100,
    'Combustible ($)': Math.round(getFuelCost(t) * 100) / 100,
    'Gastos ($)': Math.round(getGastosDelViaje(t) * 100) / 100,
    'Ganancia Neta ($)': Math.round(getTravelProfit(t, config) * 100) / 100,
  }));

  sheet1Rows.push({
    ID: 0,
    Fecha: 'TOTALES',
    Descripción: `${travels.length} viajes`,
    Estado: '',
    Camión: '',
    Patente: '',
    Chofer: '',
    Jaula: '',
    'Km Origen': 0,
    'Km Destino': 0,
    'Distancia (km)': travels.reduce((a, t) => a + getDistanceKm(t), 0),
    'Flete ($)': Math.round(travels.reduce((a, t) => a + getFleteCost(t, config), 0) * 100) / 100,
    'Costo Chofer ($)': Math.round(travels.reduce((a, t) => a + getDriverCost(t), 0) * 100) / 100,
    'Combustible ($)': Math.round(travels.reduce((a, t) => a + getFuelCost(t), 0) * 100) / 100,
    'Gastos ($)': Math.round(travels.reduce((a, t) => a + getGastosDelViaje(t), 0) * 100) / 100,
    'Ganancia Neta ($)': Math.round(travels.reduce((a, t) => a + getTravelProfit(t, config), 0) * 100) / 100,
  });

  const ws1 = XLSX.utils.json_to_sheet(sheet1Rows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Viajes y Fletes');

  // Sheet 2: Liquidación Choferes
  const driverAgg = new Map<
    string,
    { chofer: string; viajes: number; kms: number; ganado: number; reembolsos: number; terceros: number }
  >();
  for (const t of travels) {
    const name = t.truck?.driver?.name || 'Sin Chofer';
    const cur = driverAgg.get(name) || {
      chofer: name,
      viajes: 0,
      kms: 0,
      ganado: 0,
      reembolsos: 0,
      terceros: 0,
    };
    cur.viajes += 1;
    cur.kms += getDistanceKm(t);
    cur.ganado += getDriverCost(t);
    cur.reembolsos += getReimbursableExpenses(t);
    cur.terceros += t.truck?.isFreightPaid ? getFleteCost(t, config) : 0;
    driverAgg.set(name, cur);
  }
  const sheet2Rows = Array.from(driverAgg.values()).map((d) => ({
    Chofer: d.chofer,
    Viajes: d.viajes,
    'Kms Totales': d.kms,
    'Monto Viajes ($)': Math.round(d.ganado * 100) / 100,
    'Gastos Reembolsables ($)': Math.round(d.reembolsos * 100) / 100,
    'Fletes Terceros ($)': Math.round(d.terceros * 100) / 100,
    'Total a Pagar ($)': Math.round((d.ganado + d.reembolsos + d.terceros) * 100) / 100,
  }));
  const ws2 = XLSX.utils.json_to_sheet(sheet2Rows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Liquidación Choferes');

  // Sheet 3: Hacienda y Tropas
  const sheet3Rows: Array<Record<string, unknown>> = [];
  for (const t of travels) {
    if (t.isOnlyFreight) continue;
    for (const prod of t.buy?.listOfProducers || []) {
      for (const p of prod.listOfProducts || []) {
        sheet3Rows.push({
          'Viaje ID': t.id,
          Fecha: Formatters.displayDate(t.date),
          Productor: prod.name,
          CUIT: prod.cuit,
          Comisionista: t.buy?.agent?.name || '',
          Lote: p.name || resolveProductCategory(p.name),
          Cabezas: p.quantity,
          'Kg Brutos': p.kg,
          'Desbaste (%)': p.roughing,
          'Kg Limpios': Math.round(getProductKgClean(p) * 100) / 100,
          'Precio ($/kg)': p.price,
          'Operación ($)': Math.round(getProductOperation(p) * 100) / 100,
          'Achique ($)': Math.round(p.reduce * 100) / 100,
          'Factura ($)': Math.round(getProductFactura(p) * 100) / 100,
          'Neto ($)': Math.round((p.taxes?.bill?.neto || 0) * 100) / 100,
          'IVA ($)': Math.round((p.taxes?.bill?.iva || 0) * 100) / 100,
          'Ganancias ($)': Math.round((p.taxes?.bill?.ganancias || 0) * 100) / 100,
          'Kg Faena': Math.round(p.kgFaena * 100) / 100,
          'Rdo (%)': Math.round(getProductYield(p) * 10000) / 100,
        });
      }
    }
  }
  const ws3 = XLSX.utils.json_to_sheet(
    sheet3Rows.length > 0 ? sheet3Rows : [{ Mensaje: 'Sin lotes de hacienda registrados' }]
  );
  XLSX.utils.book_append_sheet(wb, ws3, 'Hacienda y Tropas');

  const todayStr = Formatters.isoDate(new Date());
  XLSX.writeFile(wb, `IosFletes_Reporte_Integral_${todayStr}.xlsx`);
}
