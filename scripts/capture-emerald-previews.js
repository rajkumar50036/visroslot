const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const brainDir = 'C:\\Users\\naiti\\.gemini\\antigravity\\brain\\93afa014-27ef-4d7c-b584-6084ec313363';

const pages = [
  { url: 'http://localhost:3000', file: 'preview_emerald_landing.png' },
  { url: 'http://localhost:3000/login', file: 'preview_emerald_login.png' },
  { url: 'http://localhost:3000/register', file: 'preview_emerald_register.png' },
  { url: 'http://localhost:3000/pricing', file: 'preview_emerald_pricing.png' },
  { url: 'http://localhost:3000/features', file: 'preview_emerald_features.png' },
  { url: 'http://localhost:3000/book/demo-salon', file: 'preview_emerald_booking.png' }
];

for (const p of pages) {
  const out = path.join(brainDir, p.file);
  try {
    console.log(`Capturing ${p.url} -> ${p.file}...`);
    execFileSync(edge, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1440,900',
      `--screenshot=${out}`,
      p.url
    ], { timeout: 15000 });
    const stat = fs.statSync(out);
    console.log(`Saved ${p.file}: ${stat.size} bytes`);
  } catch (e) {
    console.error(`Error on ${p.file}:`, e.message);
  }
}
