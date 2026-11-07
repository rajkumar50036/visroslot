const https = require('https');
const API_KEY = 'AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c';
const PROJECT_ID = 'visroslot';

function cleanDoc(d) {
  const fields = d.fields || {};
  const id = d.name.split('/').pop();
  const res = { id };
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue !== undefined) res[k] = v.stringValue;
    else if (v.booleanValue !== undefined) res[k] = v.booleanValue;
    else if (v.integerValue !== undefined) res[k] = parseInt(v.integerValue, 10);
    else if (v.doubleValue !== undefined) res[k] = v.doubleValue;
    else if (v.mapValue !== undefined) {
      res[k] = cleanDoc({ name: '', fields: v.mapValue.fields || {} });
      delete res[k].id;
    }
  }
  return res;
}

async function findBusiness(targetSlug) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/businesses?key=${API_KEY}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        const json = JSON.parse(b);
        const docs = json.documents || [];
        for (const raw of docs) {
          const doc = cleanDoc(raw);
          const s = (doc.slug || '').toLowerCase();
          const target = targetSlug.toLowerCase();
          if (s === target || s === target.replace(/l/g, 'i') || s === target.replace(/i/g, 'l')) {
            return resolve(doc);
          }
        }
        resolve(null);
      });
    }).on('error', reject);
  });
}

findBusiness('biz-9lvr45').then(b => console.log('MATCHED BIZ:', b));
