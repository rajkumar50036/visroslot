const { callRazorpayApi } = require('../src/lib/subscription/razorpayServer');

async function run() {
  const sub = await callRazorpayApi('/subscriptions/sub_TwXmbg59hFshII');
  console.log('SUB DETAILS:', JSON.stringify(sub, null, 2));
}

run();
