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
  console.log('Testing /api/book/business?slug=naitik ...');
  const res = await fetchUrl('https://visroslot.netlify.app/api/book/business?slug=naitik');
  console.log('Status:', res.status);
  try {
    const data = JSON.parse(res.body);
    console.log('Business name:', data.business?.name);
    console.log('Services count:', data.services?.length);
    console.log('Services:', data.services?.map(s => s.name));
  } catch (e) {
    console.log('Body:', res.body.slice(0, 300));
  }
}

test();
