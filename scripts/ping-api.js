const https = require('https');

function ping(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data.slice(0, 200) });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  for (let i = 0; i < 3; i++) {
    try {
      console.log(`Attempt ${i + 1}: querying https://visroslot.netlify.app/api/book/business?slug=demo-salon ...`);
      const res = await ping('https://visroslot.netlify.app/api/book/business?slug=demo-salon');
      console.log('Status:', res.status);
      if (res.json) {
        console.log('Business Name:', res.json.business?.name);
        console.log('Services Count:', res.json.services?.length);
        console.log('Canonical Slug:', res.json.canonicalSlug);
      }
      return;
    } catch (e) {
      console.log('Retry due to:', e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

main();
