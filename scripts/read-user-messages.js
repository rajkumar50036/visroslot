const fs = require('fs');
const content = fs.readFileSync('C:/Users/naiti/.gemini/antigravity/brain/93afa014-27ef-4d7c-b584-6084ec313363/.system_generated/logs/transcript.jsonl', 'utf8');
const lines = content.split('\n');
let count = 0;
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const o = JSON.parse(line);
    if (o.type === 'USER_INPUT') {
      count++;
      console.log(`[USER MSG ${count}] ${o.created_at}:`);
      console.log(o.content ? o.content.slice(0, 200) : '');
      console.log('-----------------------------');
    }
  } catch (e) {}
}
