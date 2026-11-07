const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
        replaceInDir(fullPath);
      }
    } else if (entry.isFile() && /\.(tsx|ts|js|json|css|md)$/.test(entry.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      if (content.includes('visroslot.netlify.app')) {
        content = content.replace(/visroslot\.netlify\.app/g, 'visroslot.pages.dev');
        changed = true;
      }
      if (content.includes('Netlify / .env')) {
        content = content.replace(/Netlify \/ \.env/g, 'Vercel / .env');
        changed = true;
      }
      if (content.includes('NETLIFY_EDGE_SOUTH_ASIA')) {
        content = content.replace(/NETLIFY_EDGE_SOUTH_ASIA/g, 'VERCEL_EDGE_SOUTH_ASIA');
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Migrated:', fullPath);
      }
    }
  }
}

replaceInDir(path.join(__dirname, '..', 'src'));
console.log('Completed migration of Netlify references to Vercel!');
