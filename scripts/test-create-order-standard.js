const https = require('https');

const data = JSON.stringify({
  businessId: "kFoRadrb9Rg2Guh4D23h",
  plan: "professional",
  cycle: "monthly",
  trial: false
});

const req = https.request('https://visroslot.pages.dev/api/subscription/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', b);
  });
});

req.write(data);
req.end();
