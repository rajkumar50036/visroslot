const { execFileSync } = require('child_process');
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const out = 'C:\\Users\\naiti\\.gemini\\antigravity\\brain\\93afa014-27ef-4d7c-b584-6084ec313363\\preview_demo_salon.png';

try {
  execFileSync(edge, [
    '--headless',
    '--disable-gpu',
    '--window-size=1440,1000',
    `--screenshot=${out}`,
    'https://visroslot.netlify.app/book/demo-salon'
  ], { timeout: 15000 });
  const fs = require('fs');
  const stat = fs.statSync(out);
  console.log('Successfully captured screenshot:', out, 'size:', stat.size);
} catch (e) {
  console.error('Screenshot error:', e.message);
}
