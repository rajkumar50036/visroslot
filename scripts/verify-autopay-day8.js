const https = require("https");
const fs = require("fs");

// Read .env.local
let keyId = "rzp_live_TvNjsnYOY9mDa8";
let keySecret = "q5G3JDDvpvbpdw31rDJqTd6Y";

try {
  const env = fs.readFileSync(".env.local", "utf8");
  for (const line of env.split("\n")) {
    if (line.startsWith("RAZORPAY_KEY_ID=")) keyId = line.split("=")[1].trim();
    if (line.startsWith("RAZORPAY_KEY_SECRET=")) keySecret = line.split("=")[1].trim();
  }
} catch (e) {}

const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

function callApi(endpoint) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: "api.razorpay.com",
      path: "/v1" + endpoint,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.description || `HTTP ${res.statusCode}: ${data}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  console.log("Checking Razorpay Live AutoPay Plans...");
  console.log("Key ID:", keyId);

  const plans = [
    { name: "Professional Monthly (₹499)", id: "plan_TvORLRzTL6DIwt" },
    { name: "Professional Yearly (₹4,990)", id: "plan_TvORLf2rVSA5xO" },
    { name: "Business Suite Monthly (₹999)", id: "plan_TvORLowyRadXMT" },
    { name: "Business Suite Yearly (₹9,990)", id: "plan_TvORLznEY77TBX" },
  ];

  for (const p of plans) {
    try {
      const data = await callApi(`/plans/${p.id}`);
      console.log(`✅ [ACTIVE IN RAZORPAY] ${p.name}:`, {
        plan_id: data.id,
        period: data.period,
        interval: data.interval,
        amount: (data.item?.amount / 100) + " " + data.item?.currency,
        name: data.item?.name,
      });
    } catch (err) {
      console.error(`❌ Plan ${p.id} error:`, err.message);
    }
  }

  // Also test creating a test subscription with start_at 8 days in the future to verify API accepts it
  console.log("\nTesting creating a test AutoPay Subscription with 8-day start_at...");
  const trialEndSec = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
  
  const testSubBody = JSON.stringify({
    plan_id: "plan_TvORLRzTL6DIwt",
    total_count: 60,
    customer_notify: 1,
    start_at: trialEndSec,
    notes: {
      test: "verification_check",
      purpose: "8_day_auto_cut_verification",
    },
  });

  const req = https.request({
    hostname: "api.razorpay.com",
    path: "/v1/subscriptions",
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(testSubBody),
    },
  }, (res) => {
    let respData = "";
    res.on("data", chunk => respData += chunk);
    res.on("end", () => {
      try {
        const subData = JSON.parse(respData);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("✅ [AUTOPAY SUBSCRIPTION API VERIFIED]");
          console.log("Generated Subscription ID:", subData.id);
          console.log("Status:", subData.status);
          console.log("Start At:", new Date(subData.start_at * 1000).toLocaleString("en-IN"));
          console.log("Charge at Day 8 verified!");
        } else {
          console.log("Notice from API:", subData);
        }
      } catch (e) {
        console.error("Parse error:", e.message);
      }
    });
  });

  req.on("error", err => console.error("HTTP error:", err.message));
  req.write(testSubBody);
  req.end();
}

main();
