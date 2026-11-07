const { execFileSync } = require('child_process');
const path = require('path');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const brainDir = 'C:\\Users\\naiti\\.gemini\\antigravity\\brain\\93afa014-27ef-4d7c-b584-6084ec313363';

// We will run Edge with remote debugging or check DOM
console.log('Testing page responses...');
const urls = [
  'https://visroslot.vercel.app/login',
  'https://visroslot.vercel.app/register'
];

for (const url of urls) {
  const name = url.split('/').pop();
  const out = path.join(brainDir, `check_sign_${name}.png`);
  try {
    console.log(`Checking ${url}...`);
    execFileSync(edge, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--virtual-time-budget=5000',
      '--window-size=1280,1000',
      `--screenshot=${out}`,
      url
    ], { timeout: 20000 });
    console.log(`SUCCESS: ${name} screenshot saved to ${out}`);
  } catch (e) {
    console.error(`Error checking ${url}:`, e.message);
  }
}
