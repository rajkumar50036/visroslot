const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function test() {
  console.log('Testing /api/book/business?slug=demo-salon ...');
  const res = await fetchUrl('https://visroslot.netlify.app/api/book/business?slug=demo-salon');
  console.log('Status:', res.status);
  console.log('Body:', res.body);
}

test();
