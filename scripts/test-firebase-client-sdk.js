const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c",
  authDomain: "visroslot.firebaseapp.com",
  projectId: "visroslot",
  storageBucket: "visroslot.firebasestorage.app",
  messagingSenderId: "895677315501",
  appId: "1:895677315501:web:eb54fc3c74f8ed97324924",
  measurementId: "G-4JPZW7PRSQ"
};

async function testClientSDK() {
  console.log('1. Initializing Firebase Client SDK with new visroslot config...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  const testEmail = `client_sdk_${Date.now()}@visroslot.com`;
  const testPassword = 'Password123#Secure';

  console.log('2. Testing createUserWithEmailAndPassword()...');
  const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  console.log('SUCCESS: Created user with SDK:', userCredential.user.uid, userCredential.user.email);

  console.log('3. Testing signInWithEmailAndPassword()...');
  const loginCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
  console.log('SUCCESS: Signed in user with SDK:', loginCredential.user.uid, loginCredential.user.email);

  console.log('4. Testing wrong password error handling...');
  try {
    await signInWithEmailAndPassword(auth, testEmail, 'WrongPassword!');
    console.error('FAIL: Should have thrown error for wrong password');
  } catch (err) {
    console.log('SUCCESS: Expected error caught:', err.code, '-', err.message);
  }
}

testClientSDK().catch(e => console.error('SDK Test Error:', e));
