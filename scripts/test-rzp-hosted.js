const https = require('https');

https.get('https://rzp.io/rzp/as9wvnA', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Location header:', res.headers.location);
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('Body length:', data.length);
    console.log('Body preview:', data.slice(0, 300));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
