const https = require('https');
const data = JSON.stringify({ sweepAll: true });
const req = https.request('https://visroslot.vercel.app/api/subscription/refund-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', b));
});
req.write(data);
req.end();
