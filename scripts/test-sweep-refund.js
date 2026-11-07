const https = require("https");

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    }, (res) => {
      let responseBody = "";
      res.on("data", chunk => responseBody += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body: responseBody }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log("Testing POST /api/subscription/refund-token with sweepAll: true...");
  const res = await post("https://visroslot.netlify.app/api/subscription/refund-token", { sweepAll: true });
  console.log("Status:", res.status);
  console.log("Response:", res.body);
}

main();
