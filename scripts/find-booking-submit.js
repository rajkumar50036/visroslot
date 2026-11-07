const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'src', 'app', 'book', '[slug]', 'page.tsx');
console.log('Reading:', target);
const content = fs.readFileSync(target, 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);

lines.forEach((line, index) => {
  if (line.includes('appointment') && line.includes('fetch')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
  if (line.includes('handleSubmit') || line.includes('submitBooking') || line.includes('handleConfirm')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
  if (line.includes('confirmationData') || line.includes('ConfirmationData')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
