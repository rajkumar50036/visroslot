const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  const varNames = lines
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => l.split('=')[0].trim());
  console.log('Variables configured in .env.local (' + varNames.length + ' total):');
  varNames.forEach(v => console.log(' • ' + v));
} else {
  console.log('No .env.local found');
}
