const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const lines = envContent.split(/\r?\n/);
const envVars = {};

let currentKey = null;
let currentValue = '';
let inMultiLine = false;

for (let line of lines) {
  line = line.trim();
  if (!line || line.startsWith('#')) continue;
  
  if (line.startsWith('VERCEL_OIDC_TOKEN')) continue; // Skip vercel internal token

  const eqIdx = line.indexOf('=');
  if (eqIdx !== -1) {
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      val = val.slice(1, -1);
    }
    // Convert literal \n to actual newlines if needed, or leave as string
    envVars[key] = val;
  }
}

console.log('Found keys to sync:', Object.keys(envVars));

for (const [key, value] of Object.entries(envVars)) {
  console.log(`Adding ${key}...`);
  const proc = spawnSync('npx.cmd', ['vercel', 'env', 'add', key, 'production,preview,development'], {
    input: value,
    encoding: 'utf8',
    shell: true,
    cwd: path.join(__dirname, '..')
  });
  if (proc.error) {
    console.error(`Error adding ${key}:`, proc.error);
  } else {
    console.log(`Result for ${key}:`, proc.stdout.trim() || proc.stderr.trim());
  }
}

console.log('All environment variables synced to Vercel!');
