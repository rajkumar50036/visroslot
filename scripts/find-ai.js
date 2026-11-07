const fs = require('fs');
const path = require('path');

function searchFiles(dir, matchStr, results = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.next' && item !== '.git') {
        searchFiles(full, matchStr, results);
      }
    } else {
      if (item.toLowerCase().includes(matchStr.toLowerCase())) {
        results.push({ type: 'filename', path: full });
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.js')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('Owner AI') || content.includes('Customer AI') || content.includes('OwnerAi') || content.includes('CustomerAi')) {
          results.push({ type: 'content', path: full });
        }
      }
    }
  }
  return results;
}

const root = path.resolve(__dirname, '..', 'src');
console.log('Searching in:', root);
const found = searchFiles(root, 'ai');
for (const f of found) {
  console.log(`[${f.type}] ${path.relative(root, f.path)}`);
}
