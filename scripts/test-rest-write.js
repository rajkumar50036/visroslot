const https = require('https');
const API_KEY = 'AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c';
const PROJECT_ID = 'visroslot';

const docData = {
  fields: {
    test_key: { stringValue: 'hello_world' },
    created_at: { stringValue: new Date().toISOString() }
  }
};

const payload = JSON.stringify(docData);
const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/test_rest?documentId=test_1&key=${API_KEY}`;

const req = https.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', b));
});

req.write(payload);
req.end();
