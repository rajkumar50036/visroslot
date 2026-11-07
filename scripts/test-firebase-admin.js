const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split(/\r?\n/);
for (const l of lines) {
  const idx = l.indexOf('=');
  if (idx > 0 && !l.startsWith('#')) {
    let val = l.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[l.slice(0, idx).trim()] = val;
  }
}

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function test() {
  console.log('Testing Firestore query on project visroslot...');
  try {
    const app = initializeApp({
      credential: cert({
        projectId: 'visroslot',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    const db = getFirestore(app);
    const snap = await db.collection('businesses').limit(1).get();
    console.log('SUCCESS: Read businesses collection from visroslot. Docs count:', snap.size);
  } catch (e) {
    console.error('Firestore query notice:', e.message);
  }
}

test();
