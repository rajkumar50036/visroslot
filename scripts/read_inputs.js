const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/naiti/.gemini/antigravity/brain/93afa014-27ef-4d7c-b584-6084ec313363/.system_generated/logs/transcript.jsonl')
});
const steps = [];
rl.on('line', (line) => {
  if (line.includes('"type":"USER_INPUT"')) {
    try {
      const obj = JSON.parse(line);
      steps.push({ index: obj.step_index, len: (obj.content||'').length, snippet: (obj.content||'').substring(0, 80).replace(/\r?\n/g, ' ') });
    } catch(e){}
  }
});
rl.on('close', () => {
  console.log(JSON.stringify(steps, null, 2));
  if (steps.length > 0) {
    const lastStep = steps[steps.length - 1];
    console.log('Last step index:', lastStep.index);
  }
});
