const https = require('https');
const API_KEY = 'AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c';
const PROJECT_ID = 'visroslot';

const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/businesses?key=${API_KEY}`;
https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const docs = json.documents || [];
    console.log('Total business docs:', docs.length);
    docs.forEach(d => {
      console.log('ID:', d.name.split('/').pop(), 'Fields:', JSON.stringify(d.fields));
    });
  });
});
