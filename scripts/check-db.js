const https = require('https');
const url = 'https://firestore.googleapis.com/v1/projects/visroslot/databases/(default)/documents/businesses?key=AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c';
https.get(url, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => console.log('HTTP STATUS:', res.statusCode, b.slice(0, 300)));
});
