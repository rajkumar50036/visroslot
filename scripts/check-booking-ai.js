const fs = require('fs');
const content = fs.readFileSync('src/app/book/[slug]/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (/ai/i.test(l) && /(chat|modal|float|button|dot)/i.test(l)) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
