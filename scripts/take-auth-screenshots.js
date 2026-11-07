const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const brainDir = 'C:\\Users\\naiti\\.gemini\\antigravity\\brain\\93afa014-27ef-4d7c-b584-6084ec313363';

const pages = [
  { url: 'https://visroslot.pages.dev/login', file: 'verify_firebase_login.png', height: 900 },
  { url: 'https://visroslot.pages.dev/register', file: 'verify_firebase_register.png', height: 1100 }
];

for (const p of pages) {
  const out = path.join(brainDir, p.file);
  try {
    console.log(`Capturing ${p.url} -> ${p.file}...`);
    execFileSync(edge, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--virtual-time-budget=6000',
      `--window-size=1440,${p.height}`,
      `--screenshot=${out}`,
      p.url
    ], { timeout: 30000 });
    const stat = fs.statSync(out);
    console.log(`Saved ${p.file}: ${stat.size} bytes`);
  } catch (e) {
    console.error(`Error on ${p.file}:`, e.message);
  }
}
