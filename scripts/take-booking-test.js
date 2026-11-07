const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const brainDir = 'C:\\Users\\naiti\\.gemini\\antigravity\\brain\\93afa014-27ef-4d7c-b584-6084ec313363';
const out = path.join(brainDir, 'verify_firebase_booking.png');

try {
  console.log('Capturing https://visroslot.pages.dev/book/demo-salon...');
  execFileSync(edge, [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--virtual-time-budget=6000',
    '--window-size=1440,1300',
    `--screenshot=${out}`,
    'https://visroslot.pages.dev/book/demo-salon'
  ], { timeout: 30000 });
  const stat = fs.statSync(out);
  console.log(`Saved verify_firebase_booking.png: ${stat.size} bytes`);
} catch (e) {
  console.error('Error on booking screenshot:', e.message);
}
