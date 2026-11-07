const https = require('https');

const API_KEY = 'AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c';
const PROJECT_ID = 'visroslot';

async function fetchBusinessBySlug(slug) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/businesses?key=${API_KEY}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const docs = json.documents || [];
          for (const d of docs) {
            const fields = d.fields || {};
            const docSlug = fields.slug?.stringValue;
            if (docSlug && docSlug.toLowerCase() === slug.toLowerCase()) {
              // Extract fields to a clean js object
              const id = d.name.split('/').pop();
              const obj = { id };
              for (const [k, v] of Object.entries(fields)) {
                obj[k] = v.stringValue ?? v.booleanValue ?? v.integerValue ?? v.doubleValue ?? v;
              }
              return resolve(obj);
            }
          }
          resolve(null);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

fetchBusinessBySlug('biz-9lvr45').then(b => console.log('Found business by slug:', b));
