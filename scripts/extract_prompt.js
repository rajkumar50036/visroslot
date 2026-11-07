const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/naiti/.gemini/antigravity/brain/93afa014-27ef-4d7c-b584-6084ec313363/.system_generated/logs/transcript_full.jsonl')
});
rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 15540) {
      fs.writeFileSync('C:/Users/naiti/Downloads/stitch_restaurant_qr_saas_platform/scripts/phase9_prompt.txt', obj.content, 'utf8');
      console.log('Saved Phase 9 prompt from full transcript! Length:', obj.content.length);
    }
  } catch(e){}
});
