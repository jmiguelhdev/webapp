import https from 'https';

const getHTML = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
};

(async () => {
    try {
        console.log("Fetching TodoAgro...");
        let body = await getHTML('https://www.todoagro.com.ar/mercados/');
        console.log("TodoAgro Length: ", body.length);
        const novilloMatch = body.match(/novillo.{1,50}?[0-9]+/i);
        console.log("TodoAgro Match: ", novilloMatch);

        console.log("Fetching MAG...");
        body = await getHTML('https://www.mercadoagroganadero.com.ar/dll/hacienda1.dll/haciinfo000008'); // the table
        console.log("MAG Length: ", body.length);
        const novilloMatch2 = body.match(/novillo.{1,50}?[0-9]+/i);
        console.log("MAG Match: ", novilloMatch2);
    } catch(e) {
        console.error(e);
    }
})();
