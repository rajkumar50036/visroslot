const fs = require('fs');
const path = require('path');

function searchFiles(dir, filterRegex) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(searchFiles(fullPath, filterRegex));
    } else if (filterRegex.test(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('AI and Chat Files:');
console.log(searchFiles('src', /(ai|chat)/i));
