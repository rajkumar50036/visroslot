const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const brainDir = 'C:\\Users\\naiti\\.gemini\\antigravity\\brain\\93afa014-27ef-4d7c-b584-6084ec313363';

const pages = [
  { url: 'https://visroslot.pages.dev', file: 'final_visroslot_landing.png', height: 1050 },
  { url: 'https://visroslot.pages.dev/book/demo-salon', file: 'final_visroslot_booking.png', height: 1300 },
  { url: 'https://visroslot.pages.dev/pricing', file: 'final_visroslot_pricing.png', height: 1050 }
];

for (const p of pages) {
  const out = path.join(brainDir, p.file);
  try {
    console.log(`Capturing ${p.url} -> ${p.file}...`);
    execFileSync(edge, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--virtual-time-budget=8000',
      `--window-size=1440,${p.height}`,
      `--screenshot=${out}`,
      p.url
    ], { timeout: 35000 });
    const stat = fs.statSync(out);
    console.log(`Saved ${p.file}: ${stat.size} bytes`);
  } catch (e) {
    console.error(`Error on ${p.file}:`, e.message);
  }
}
