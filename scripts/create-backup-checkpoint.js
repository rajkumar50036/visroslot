const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\naiti\\Downloads\\stitch_restaurant_qr_saas_platform';
const backupDir = 'C:\\Users\\naiti\\Downloads\\visroslot_checkpoint_backup';

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const sPath = path.join(src, entry.name);
    const dPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(sPath, dPath);
    } else {
      fs.copyFileSync(sPath, dPath);
    }
  }
}

console.log('Creating safe checkpoint backup at:', backupDir);
copyRecursive(srcDir, backupDir);
console.log('Checkpoint backup created successfully!');
