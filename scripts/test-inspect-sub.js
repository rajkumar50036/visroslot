const https = require('https');
const auth = Buffer.from('rzp_live_TvNjsnYOY9mDa8:q5G3JDDvpvbpdw31rDJqTd6Y').toString('base64');

function get(p) {
  return new Promise((res, rej) => {
    https.get('https://api.razorpay.com/v1' + p, {
      headers: { Authorization: 'Basic ' + auth }
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try {
          res(JSON.parse(d));
        } catch (e) {
          res(d);
        }
      });
    });
  });
}

async function main() {
  const sub = await get('/subscriptions/sub_Twpg4vuF2xKmzg');
  console.log('SUB:', JSON.stringify(sub, null, 2));
  if (sub && sub.plan_id) {
    const plan = await get('/plans/' + sub.plan_id);
    console.log('PLAN:', JSON.stringify(plan, null, 2));
  }
}

main().catch(console.error);
