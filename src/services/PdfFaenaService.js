import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Map PDF categories to standardized app categories
function resolveStandardizedCategory(pdfCat) {
  const cat = (pdfCat || '').trim().toUpperCase();
  if (cat.startsWith('VQ') || cat.startsWith('VAQ')) return 'VAQUILLONA';
  if (cat.startsWith('VA') || cat.startsWith('VACA')) return 'VACA';
  if (cat.startsWith('TO') || cat.startsWith('TORO')) return 'TORO';
  if (cat.startsWith('NO') || cat.startsWith('NT') || cat.startsWith('MEJ')) return 'NOVILLO';
  return 'OTRO';
}

export class PdfFaenaService {
  constructor() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }

  async parse(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(' ') + '\n';
    }

    console.log("PDF Full Text Extracted:", fullText);

    return this._extractData(fullText);
  }

  _extractData(text) {
    const data = {
      producer: { name: '', cuit: '' },
      tropa: '',
      date: '',
      totalKgFaena: 0,
      totalKgVivos: 0,
      totalHeadCount: 0,
      items: [] // { garron, category, kg, standardizedCategory }
    };

    // 1. Vendedor / Productor
    // Look for "Vendedor" then "CUIT" and "Razón Social"
    const vendorSectionMatch = text.match(/Vendedor\s+CUIT:?\s*(\d+)\s+Razón Social:?\s*([^DTE:]+)/i);
    if (vendorSectionMatch) {
      data.producer.cuit = vendorSectionMatch[1].trim();
      data.producer.name = vendorSectionMatch[2].trim();
    }

    // 2. Tropa
    const tropaMatch = text.match(/TROPA:\s*(\d+)/i);
    if (tropaMatch) data.tropa = tropaMatch[1];

    // 3. Fecha
    const fechaMatch = text.match(/Fecha:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (fechaMatch) data.date = fechaMatch[1];

    // 4. Totales
    // TOTAL FAENA 28 28 3913
    const totalFaenaMatch = text.match(/TOTAL FAENA\s+\d+\s+\d+\s+(\d+)/i);
    if (totalFaenaMatch) data.totalKgFaena = parseFloat(totalFaenaMatch[1]);

    // KG. VIVOS 7631
    const kgVivosMatch = text.match(/KG\.\s*VIVOS\s+(\d+)/i);
    if (kgVivosMatch) data.totalKgVivos = parseFloat(kgVivosMatch[1]);

    // CABEZA FAENA 14
    const headCountMatch = text.match(/CABEZA FAENA\s+(\d+)/i);
    if (headCountMatch) data.totalHeadCount = parseInt(headCountMatch[1]);

    // 5. Table Items (Individual Carcasses / Garrones)
    // The table rows look like: "1 44 VQ A2 2 0 ZZ 110 109"
    // Format: [Index] [Garron/Faena] [Clas] [Tip] [D.C.] [KgVivos] [KgFaena]
    // Regex to match rows: \b(\d+)\s+(\d+)\s+([A-Z]{2})\s+[A-Z0-9]+\s+\d+\s+\d+\s+[A-Z]+\s+(\d+)\s+(\d+)\b
    // Let's refine based on the example: "1 44 VQ A2 2 0 ZZ 110 109"
    const rowRegex = /(\d+)\s+(\d+)\s+([A-Z]{2})\s+([A-Z0-9]+)\s+(\d+)\s+(\d+)\s+([A-Z]{2})\s+(\d+)\s+(\d+)/g;
    let match;
    while ((match = rowRegex.exec(text)) !== null) {
      const garron = match[2];
      const category = match[3];
      const kgHalf1 = parseFloat(match[8]);
      const kgHalf2 = parseFloat(match[9]);
      const standardizedCategory = resolveStandardizedCategory(category);
      
      data.items.push({
        garron,
        half: 1,
        category,
        kg: kgHalf1,
        standardizedCategory
      });
      data.items.push({
        garron,
        half: 2,
        category,
        kg: kgHalf2,
        standardizedCategory
      });
    }

    // Calculamos el total de piezas leídas para comprobación de seguridad
    data.totalItemsCount = data.items.length;
    return data;
  }
}

