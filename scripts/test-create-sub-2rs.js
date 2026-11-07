const https = require('https');
const auth = Buffer.from('rzp_live_TvNjsnYOY9mDa8:q5G3JDDvpvbpdw31rDJqTd6Y').toString('base64');

function post(path, body) {
  const data = JSON.stringify(body);
  return new Promise((res, rej) => {
    const req = https.request('https://api.razorpay.com/v1' + path, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
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
    req.on('error', rej);
    req.write(data);
    req.end();
  });
}

async function main() {
  const trialEndSec = Math.floor(Date.now() / 1000) + 7 * 86400;
  const sub = await post('/subscriptions', {
    plan_id: 'plan_TvORLRzTL6DIwt', // Professional Monthly
    total_count: 60,
    customer_notify: 1,
    start_at: trialEndSec,
    addons: [
      {
        item: {
          name: 'Refundable Mandate Verification Token',
          amount: 200, // 200 paise = ₹2
          currency: 'INR'
        }
      }
    ],
    notes: {
      test: 'true',
      tokenAmount: '200'
    }
  });

  console.log('CREATED SUB WITH ADDON 200 PAISE:');
  console.log(JSON.stringify(sub, null, 2));
}

main().catch(console.error);
