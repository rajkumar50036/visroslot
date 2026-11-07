const https = require('https');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('--- 1. Testing Landing Page ---');
  const home = await get('https://visroslot.netlify.app');
  console.log('Homepage status:', home.status);
  console.log('Has LandingAiChatBox:', home.body.includes('AI Help Box') || home.body.includes('LandingAiChatBox'));
  console.log('Has light class:', home.body.includes('light'));

  console.log('\n--- 2. Testing Landing AI Chat Box API ---');
  const aiChat = await post('https://visroslot.netlify.app/api/ai/landing/chat', {
    message: 'What are your pricing plans?'
  });
  console.log('Landing AI Chat status:', aiChat.status);
  console.log('Reply preview:', aiChat.body.slice(0, 150));

  console.log('\n--- 3. Testing Demo Salon Booking Page ---');
  const demo = await get('https://visroslot.netlify.app/book/demo-salon');
  console.log('Demo Salon status:', demo.status);
  console.log('Has audio chime preload:', demo.body.includes('booking-chime.wav'));
}

run().catch(console.error);
