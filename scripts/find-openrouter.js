const fs = require('fs');
const path = require('path');

function search(dir) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.next' && item !== '.git') search(full);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js') || item.endsWith('.json') || item.endsWith('.html') || item.endsWith('.md')) {
      const txt = fs.readFileSync(full, 'utf8');
      if (txt.toLowerCase().includes('openrouter')) {
        const lines = txt.split('\n');
        lines.forEach((l, i) => {
          if (l.toLowerCase().includes('openrouter')) {
            console.log(`${full}:${i + 1} -> ${l.trim()}`);
          }
        });
      }
    }
  }
}

search('C:/Users/naiti/Downloads/stitch_restaurant_qr_saas_platform/src');
