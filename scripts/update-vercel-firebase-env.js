const { spawnSync } = require('child_process');
const path = require('path');

const newFirebaseVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'visroslot.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'visroslot',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'visroslot.firebasestorage.app',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '895677315501',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:895677315501:web:eb54fc3c74f8ed97324924',
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-4JPZW7PRSQ',
  FIREBASE_PROJECT_ID: 'visroslot'
};

const cwd = path.join(__dirname, '..');

for (const [key, value] of Object.entries(newFirebaseVars)) {
  console.log(`\n--- Updating ${key} on Vercel ---`);
  
  // Try removing existing env variable first across all environments
  for (const env of ['production', 'preview', 'development']) {
    spawnSync('npx.cmd', ['vercel', 'env', 'rm', key, env, '--yes'], {
      cwd,
      encoding: 'utf8',
      shell: true
    });
  }

  // Add the new variable across all environments
  const addRes = spawnSync('npx.cmd', ['vercel', 'env', 'add', key, 'production,preview,development', '--type', 'config', '--yes'], {
    cwd,
    input: value,
    encoding: 'utf8',
    shell: true
  });

  console.log(`Output for ${key}:`, addRes.stdout.trim() || addRes.stderr.trim());
}

console.log('\n✅ All new Firebase environment variables have been updated on Vercel!');
