const https = require('https');

const postData = JSON.stringify({
  businessId: 'NKSY4opeQh4lCSX49enD',
  message: 'What haircuts and spa packages do you offer?',
  history: []
});

const req = https.request({
  hostname: 'visroslot.netlify.app',
  path: '/api/ai/customer/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', console.error);
req.write(postData);
req.end();
