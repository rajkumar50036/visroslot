const fs = require('fs');

const p = 'C:/Users/naiti/.gemini/antigravity/brain/93afa014-27ef-4d7c-b584-6084ec313363/.user_uploaded/media_1793813915531_0ee0b71d.jpg';
const buf = fs.readFileSync(p);

// Read dimensions from JPEG
let i = 0;
if (buf[0] === 0xFF && buf[1] === 0xD8) {
  i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xFF) break;
    const marker = buf[i + 1];
    if (marker === 0xC0 || marker === 0xC2) {
      const height = buf.readUInt16BE(i + 5);
      const width = buf.readUInt16BE(i + 7);
      console.log('JPEG dimensions:', width, 'x', height);
      break;
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
}
