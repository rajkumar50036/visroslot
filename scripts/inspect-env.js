const fs = require('fs');
['.env', '.env.local', '.env.production', '.env.example'].forEach(f => {
  if (fs.existsSync(f)) {
    console.log('=== ' + f + ' ===');
    const content = fs.readFileSync(f, 'utf8');
    content.split('\n').filter(l => l.includes('RAZORPAY')).forEach(l => console.log(l));
  }
});
