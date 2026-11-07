const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.next') searchDir(full);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')) {
      const c = fs.readFileSync(full, 'utf8');
      const lines = c.split('\n');
      lines.forEach((l, i) => {
        if ((l.includes('500') || l.includes(' 5 ') || l.includes(' 5,') || l.includes(' 5;')) && (l.includes('amount') || l.includes('price') || l.includes('razorpay') || l.includes('pay') || l.includes('order'))) {
          console.log(full + ':' + (i+1) + ': ' + l.trim());
        }
      });
    }
  }
}
searchDir('C:/Users/naiti/Downloads/stitch_restaurant_qr_saas_platform/src');
