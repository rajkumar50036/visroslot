const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val;
  }
});

const app = !getApps().length ? initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
}) : getApps()[0];

const db = getFirestore(app);

async function testSnapshot() {
  const doc = await db.collection('businesses').doc('NKSY4opeQh4lCSX49enD').get();
  console.log('Exists:', doc.exists);
  const srvSnap = await db.collection('services').where('business_id', '==', 'NKSY4opeQh4lCSX49enD').get();
  console.log('Services for demo-salon:', srvSnap.size);
  srvSnap.forEach(s => console.log('  -', s.data().name, '₹' + s.data().price));
  const staffSnap = await db.collection('staff').where('business_id', '==', 'NKSY4opeQh4lCSX49enD').get();
  console.log('Staff for demo-salon:', staffSnap.size);
  staffSnap.forEach(st => console.log('  -', st.data().name, '(' + st.data().role + ')'));
}

testSnapshot().catch(console.error);
