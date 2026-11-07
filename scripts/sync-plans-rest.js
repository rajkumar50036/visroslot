const https = require('https');
const API_KEY = 'AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c';
const PROJECT_ID = 'visroslot';

const officialPlans = [
  {
    docId: 'starter_monthly',
    name: 'Starter Monthly',
    tier: 'starter',
    amount: 49900,
    amountInRupees: 499,
    currency: 'INR',
    period: 'monthly',
    interval: 1,
    razorpay_plan_id: 'plan_Twc9lFpxSRFc23',
    max_staff: 3,
    max_bookings: 300,
    is_active: true
  },
  {
    docId: 'starter_yearly',
    name: 'Starter Yearly',
    tier: 'starter',
    amount: 499000,
    amountInRupees: 4990,
    currency: 'INR',
    period: 'yearly',
    interval: 1,
    razorpay_plan_id: 'plan_Twc9vMU8YEJwiz',
    max_staff: 3,
    max_bookings: 300,
    is_active: true
  },
  {
    docId: 'premium_monthly',
    name: 'Premium Monthly',
    tier: 'premium',
    amount: 99900,
    amountInRupees: 999,
    currency: 'INR',
    period: 'monthly',
    interval: 1,
    razorpay_plan_id: 'plan_TwcA6JbcglDJ9F',
    max_staff: 10,
    max_bookings: -1,
    is_active: true
  },
  {
    docId: 'premium_yearly',
    name: 'Premium Yearly',
    tier: 'premium',
    amount: 999000,
    amountInRupees: 9990,
    currency: 'INR',
    period: 'yearly',
    interval: 1,
    razorpay_plan_id: 'plan_TwcAFFJynRRG8t',
    max_staff: 10,
    max_bookings: -1,
    is_active: true
  }
];

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      fields[k] = { stringValue: v };
    } else if (typeof v === 'number') {
      fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    } else if (typeof v === 'boolean') {
      fields[k] = { booleanValue: v };
    }
  }
  fields['updated_at'] = { stringValue: new Date().toISOString() };
  return { fields };
}

async function writePlan(plan) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(toFirestoreFields(plan));
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/subscription_plans/${plan.docId}?key=${API_KEY}`;
    
    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✓ [SUCCESS] Synced ${plan.name} (${plan.docId}) -> Razorpay ID: ${plan.razorpay_plan_id}`);
          resolve(b);
        } else {
          console.error(`❌ [FAILED] ${plan.docId} HTTP ${res.statusCode}:`, b);
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Syncing plans to Firestore via REST API...');
  for (const p of officialPlans) {
    await writePlan(p);
  }
  console.log('\nAll 4 plans successfully written to Firestore subscription_plans collection!');
}

run();
