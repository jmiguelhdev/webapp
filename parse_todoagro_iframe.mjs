import https from 'https';

const getHTML = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
};

(async () => {
    try {
        const body = await getHTML('https://www.todoagro.com.ar/mercados/');
        // Find iframes
        const iframes = body.match(/<iframe[^>]+>/g);
        console.log("iframes:", iframes);
        
        // Find fetch or json
        const fetches = body.match(/fetch\(|ajax\(|getJSON\(/g);
        console.log("fetches:", fetches);
    } catch(e) {
        console.error(e);
    }
})();
