const fs = require('fs');
const path = require('path');

const baseDir = 'c:\\Users\\naiti\\Downloads\\stitch_visroslot_saas_landing_page (1)\\stitch_visroslot_saas_landing_page';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      results.push({
        rel: path.relative(baseDir, full),
        size: stat.size,
        ext: path.extname(full),
      });
    }
  }
  return results;
}

const files = walk(baseDir);
console.log(`Found ${files.length} files:`);
files.forEach(f => {
  console.log(`${f.rel} [${f.size} bytes]`);
});
