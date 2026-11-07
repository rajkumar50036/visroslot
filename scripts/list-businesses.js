const { getFirebaseAdmin } = require('../src/lib/firebase/server');

async function listBusinesses() {
  const admin = getFirebaseAdmin();
  if (!admin || !admin.db) {
    console.error('Firebase admin not initialized');
    return;
  }
  const snap = await admin.db.collection('businesses').get();
  console.log(`Found ${snap.size} businesses:`);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Slug: ${data.slug} | Name: ${data.name} | OwnerId: ${data.owner_id || data.ownerId}`);
  });
}

listBusinesses().catch(console.error);
