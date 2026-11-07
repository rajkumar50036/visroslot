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

async function run() {
  const nDoc = await db.collection('businesses').doc('2715CnLUsE7SU6ylo9EU').get();
  console.log('naitik doc data:', nDoc.data());
  const dDoc = await db.collection('businesses').doc('NKSY4opeQh4lCSX49enD').get();
  console.log('demo-salon doc data:', dDoc.data());
}

run().catch(console.error);
