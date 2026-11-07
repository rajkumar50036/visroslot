const fs = require('fs');
const admin = require('firebase-admin');

// Parse .env.local
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

const projectId = env.FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const privateKey = (env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

console.log('Project ID:', projectId);
console.log('Client Email:', clientEmail);
console.log('Private Key length:', privateKey.length);

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let app;
if (!getApps().length) {
  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

async function run() {
  console.log('\n--- Checking businesses collection ---');
  const snap = await db.collection('businesses').get();
  console.log('Businesses count:', snap.size);
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`Doc ID: ${doc.id}`);
    console.log(`  Name: ${d.name}`);
    console.log(`  Slug: ${d.slug}`);
    console.log(`  Is Active: ${d.is_active}`);
    console.log(`  Previous Slugs: ${JSON.stringify(d.previous_slugs)}`);
    console.log(`  Owner ID: ${d.owner_id || d.ownerId}`);
  });

  console.log('\n--- Checking users collection ---');
  const userSnap = await db.collection('users').get();
  console.log('Users count:', userSnap.size);
  userSnap.forEach(doc => {
    const d = doc.data();
    console.log(`User: ${doc.id} | Email: ${d.email} | Slug: ${d.slug || d.bookingSlug} | Biz: ${d.businessName}`);
  });
}

run().catch(console.error);
