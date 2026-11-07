const https = require('https');

const API_KEY = "AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c";

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: d });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function checkSignIn() {
  console.log('1. Checking Firebase Identity Toolkit API for project visroslot...');
  
  // Test getting account info or signing in with dummy email to check error response from Firebase Auth
  const testEmail = "test_user_" + Date.now() + "@example.com";
  const testPassword = "Password123!";

  console.log('2. Testing Email/Password Registration endpoint...');
  const signUpRes = await post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    { email: testEmail, password: testPassword, returnSecureToken: true }
  );
  console.log('Sign Up Response Status:', signUpRes.status);
  console.log('Sign Up Response Data:', JSON.stringify(signUpRes.data, null, 2));

  console.log('\n3. Testing Email/Password Sign-In endpoint...');
  const signInRes = await post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { email: testEmail, password: testPassword, returnSecureToken: true }
  );
  console.log('Sign In Response Status:', signInRes.status);
  console.log('Sign In Response Data:', JSON.stringify(signInRes.data, null, 2));

  console.log('\n4. Checking Google Auth Provider configuration for project visroslot...');
  const createAuthUriRes = await post(
    `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${API_KEY}`,
    {
      providerId: "google.com",
      continueUri: "https://visroslot.firebaseapp.com/__/auth/handler"
    }
  );
  console.log('CreateAuthUri Status:', createAuthUriRes.status);
  console.log('CreateAuthUri Data:', JSON.stringify(createAuthUriRes.data, null, 2));
}

checkSignIn().catch(err => console.error('Error:', err));
