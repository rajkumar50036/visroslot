const https = require('https');

https.get('https://visroslot.netlify.app', (res) => {
  console.log('HTTP Status:', res.statusCode);
  let d = '';
  res.on('data', chunk => d += chunk);
  res.on('end', () => console.log('Received HTML bytes:', d.length, 'Contains VISROSLOT:', d.includes('VISROSLOT')));
}).on('error', err => console.error('Error:', err.message));
