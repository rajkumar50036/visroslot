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
  const app = initializeApp({
    credential: cert({
      projectId: 'visroslot',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
  const db = getFirestore(app);

  const email = 'inaitik.aadhyacollege@gmail.com';
  const snap = await db.collection('users').where('email', '==', email).get();
  if (snap.empty) {
    console.log('No user found with email:', email);
  } else {
    for (const doc of snap.docs) {
      console.log('USER ID:', doc.id);
      console.log('DATA:', JSON.stringify(doc.data(), null, 2));

      // check businesses
      const bizSnap = await db.collection('businesses').where('owner_id', '==', doc.id).get();
      console.log('BUSINESSES COUNT:', bizSnap.size);
      bizSnap.forEach(b => console.log('BIZ:', b.id, b.data().name, b.data().slug));

      // check subscriptions
      const subSnap = await db.collection('subscriptions').where('user_id', '==', doc.id).get();
      console.log('SUBSCRIPTIONS COUNT:', subSnap.size);
      subSnap.forEach(s => console.log('SUB:', s.id, s.data()));
    }
  }
}

test().catch(console.error);
