const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/naiti/.gemini/antigravity/brain/93afa014-27ef-4d7c-b584-6084ec313363/.system_generated/logs/transcript.jsonl')
});
rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.step_index >= 2465 && obj.step_index <= 2478) {
      if (obj.tool_calls) {
        console.log(`Step ${obj.step_index} tool_calls:`, JSON.stringify(obj.tool_calls));
      }
    }
  } catch(e){}
});
