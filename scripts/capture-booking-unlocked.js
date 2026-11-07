const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const brainDir = 'C:\\Users\\naiti\\.gemini\\antigravity\\brain\\93afa014-27ef-4d7c-b584-6084ec313363';
const out = path.join(brainDir, 'preview_booking_7step_unlocked.png');

try {
  console.log('Capturing https://visroslot.pages.dev/book/demo-salon -> preview_booking_7step_unlocked.png...');
  execFileSync(edge, [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,1300',
    `--screenshot=${out}`,
    'https://visroslot.pages.dev/book/demo-salon'
  ], { timeout: 20000 });
  const stat = fs.statSync(out);
  console.log(`SUCCESS: Saved preview_booking_7step_unlocked.png (${stat.size} bytes)`);
} catch (e) {
  console.error('Error capturing screenshot:', e.message);
}
