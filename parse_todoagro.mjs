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
        // Find where novillo is mentioned
        const index = body.toLowerCase().indexOf('novillo');
        if (index !== -1) {
            console.log(body.substring(index - 100, index + 300));
        } else {
            console.log("No novillo found.");
        }
    } catch(e) {
        console.error(e);
    }
})();
