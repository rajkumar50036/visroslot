const fs = require('fs');
const path = require('path');

function searchRazorpayUI(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      searchRazorpayUI(full);
    } else if (f.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (/razorpay/i.test(l) && !l.includes('import ') && !l.includes('from ')) {
          console.log(`${full}:${idx + 1}: ${l.trim().substring(0, 100)}`);
        }
      });
    }
  }
}

searchRazorpayUI('src');
