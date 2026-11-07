const https = require("https");

function checkUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      resolve({
        url,
        statusCode: res.statusCode,
        contentType: res.headers["content-type"],
        contentLength: res.headers["content-length"],
      });
    }).on("error", reject);
  });
}

async function run() {
  console.log("Checking live production assets & endpoints...");
  
  const endpoints = [
    "https://visroslot.netlify.app/assets/visroslot-logo.png",
    "https://visroslot.netlify.app/api/ai/health",
    "https://visroslot.netlify.app/onboarding",
    "https://visroslot.netlify.app/pricing",
    "https://visroslot.netlify.app/app/subscription",
    "https://visroslot.netlify.app/app/payment-gateway"
  ];

  for (const ep of endpoints) {
    try {
      const res = await checkUrl(ep);
      console.log(`[${res.statusCode}] ${ep} (${res.contentType || "N/A"})`);
    } catch (e) {
      console.error(`[ERROR] ${ep}:`, e.message);
    }
  }
}

run();
