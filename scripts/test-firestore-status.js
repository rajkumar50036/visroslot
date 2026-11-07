const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c",
  authDomain: "visroslot.firebaseapp.com",
  projectId: "visroslot",
  storageBucket: "visroslot.firebasestorage.app",
  messagingSenderId: "895677315501",
  appId: "1:895677315501:web:eb54fc3c74f8ed97324924",
  measurementId: "G-4JPZW7PRSQ"
};

async function testFirestore() {
  console.log('1. Initializing Firebase Client SDK...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = 'client_sdk_1793886395285@visroslot.com';
  const password = 'Password123#Secure';

  console.log('2. Authenticating user...');
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log('Authenticated as:', cred.user.uid);

    console.log('3. Testing Firestore write to test_connectivity collection...');
    const testRef = doc(db, 'test_connectivity', 'ping');
    await setDoc(testRef, {
      message: 'Firestore is connected!',
      timestamp: new Date().toISOString()
    });
    console.log('SUCCESS: Written document to test_connectivity!');

    console.log('4. Testing Firestore read...');
    const snap = await getDoc(testRef);
    console.log('SUCCESS: Read back doc:', snap.data());
  } catch (err) {
    console.error('Firestore Test Result / Error:', err.code || err.message, err);
  }
}

testFirestore();
