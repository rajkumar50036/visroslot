const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({ projectId: 'visroslot' });
const db = getFirestore(app);

db.collection('businesses').get()
  .then(s => console.log('Admin SDK Docs:', s.size))
  .catch(e => console.log('Admin SDK Err:', e.message));
