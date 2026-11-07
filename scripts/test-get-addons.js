const https = require('https');
const auth = Buffer.from('rzp_live_TvNjsnYOY9mDa8:q5G3JDDvpvbpdw31rDJqTd6Y').toString('base64');

function get(path) {
  return new Promise((res, rej) => {
    https.get('https://api.razorpay.com/v1' + path, {
      headers: { 'Authorization': 'Basic ' + auth }
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
    }).on('error', rej);
  });
}

async function main() {
  const addons = await get('/subscriptions/sub_TwqC2dpaph7vO6/addons');
  console.log('ADDONS ON SUB:', JSON.stringify(addons, null, 2));
}

main().catch(console.error);
