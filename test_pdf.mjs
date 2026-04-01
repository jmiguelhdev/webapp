import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist';

// Map PDF categories to standardized app categories
function resolveStandardizedCategory(pdfCat) {
  const cat = (pdfCat || '').trim().toUpperCase();
  if (cat.startsWith('VQ') || cat.startsWith('VAQ')) return 'VAQUILLONA';
  if (cat.startsWith('VA') || cat.startsWith('VACA')) return 'VACA';
  if (cat.startsWith('TO') || cat.startsWith('TORO')) return 'TORO';
  if (cat.startsWith('NO') || cat.startsWith('NT') || cat.startsWith('MEJ')) return 'NOVILLO';
  return 'OTRO';
}

class PdfFaenaService {
  async parse(buffer) {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(' ') + '\n';
    }
    return fullText;
  }
}

async function run() {
  try {
    const buffer = fs.readFileSync('/Users/jmiguelh/Downloads/T162 Varilla 31-3-26.pdf');
    const svc = new PdfFaenaService();
    const result = await svc.parse(buffer);
    console.log("Success text length:", result.length);
  } catch (e) {
    console.error(e);
  }
}
run();
