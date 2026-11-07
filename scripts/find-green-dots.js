const fs = require('fs');
const path = require('path');

function searchPatterns(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      searchPatterns(full);
    } else if (/\.(tsx|ts|jsx|js)$/.test(f)) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (/(animate-pulse|animate-ping|bg-emerald-[45]00|bg-green-[45]00)/.test(l) && /(rounded-full|dot|w-2|w-2\.5|w-3|h-2|h-2\.5|h-3)/.test(l)) {
          console.log(`${full}:${idx + 1}: ${l.trim()}`);
        }
      });
    }
  }
}

searchPatterns('src');
