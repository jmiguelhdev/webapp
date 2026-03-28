import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

async function testScrape() {
    try {
        console.log("Fetching canalrural...");
        const res = await fetch('https://www.canalrural.com/mercados/hacienda/Liniers/');
        const html = await res.text();
        const $ = cheerio.load(html);
        
        let found = false;
        $('table tr').each((i, el) => {
            const text = $(el).text().toLowerCase();
            if (text.includes('novillo') || text.includes('vaca') || text.includes('vaquillona')) {
                console.log($(el).text().replace(/\s+/g, ' ').trim());
                found = true;
            }
        });
        
        if (!found) console.log("Canal Rural no table rows found");
        
        console.log("Fetching mercadoagroganadero directly (bypass maybe?)...");
        const res2 = await fetch('https://www.mercadoagroganadero.com.ar/dll/hacienda1.dll/haciinfo000008', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-AR,es;q=0.8,en-US;q=0.5,en;q=0.3'
            }
        });
        const html2 = await res2.text();
        if (html2.includes('Novillo')) {
            console.log("MAG directly works with full headers!");
            const $2 = cheerio.load(html2);
            $2('tr').each((i, el) => {
                const text = $2(el).text().toLowerCase();
                if (text.includes('novillo')) {
                    console.log($2(el).text().replace(/\s+/g, ' ').trim());
                }
            });
        } else {
            console.log("MAG failed. Length:", html2.length);
        }
        
    } catch(e) {
        console.error("Error", e.message);
    }
}
testScrape();
