const { execFileSync } = require('child_process');
const fs = require('fs');
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const brainDir = 'C:\\Users\\naiti\\.gemini\\antigravity\\brain\\93afa014-27ef-4d7c-b584-6084ec313363';

function snap(url, filename) {
  const out = `${brainDir}\\${filename}`;
  try {
    execFileSync(edge, [
      '--headless',
      '--disable-gpu',
      '--window-size=1440,900',
      `--screenshot=${out}`,
      url
    ], { timeout: 20000 });
    const stat = fs.statSync(out);
    console.log(`Saved ${filename}: ${stat.size} bytes`);
  } catch (e) {
    console.error(`Error capturing ${filename}:`, e.message);
  }
}

snap('https://visroslot.netlify.app', 'preview_landing_ai_compact.png');
snap('https://visroslot.netlify.app/#pricing', 'preview_pricing_clean.png');
