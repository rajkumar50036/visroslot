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

function fetchCol(name) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${name}?key=${API_KEY}`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(b);
          resolve((j.documents || []).map(cleanDoc));
        } catch(e) { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

async function main() {
  const businesses = await fetchCol('businesses');
  console.log('BUSINESSES (' + businesses.length + '):', businesses.map(b => ({ id: b.id, name: b.name, slug: b.slug })));
  
  const services = await fetchCol('services');
  console.log('SERVICES (' + services.length + '):', services.map(s => ({ id: s.id, name: s.name, business_id: s.business_id, price: s.price })));

  const subs = await fetchCol('subscriptions');
  console.log('SUBSCRIPTIONS (' + subs.length + '):', subs.map(s => ({ id: s.id, business_id: s.business_id, status: s.status || s.subscriptionStatus })));

  const appts = await fetchCol('appointments');
  console.log('APPOINTMENTS (' + appts.length + '):', appts.map(a => ({ id: a.id, ref: a.booking_reference, name: a.customer_name, status: a.status })));
}

main();
